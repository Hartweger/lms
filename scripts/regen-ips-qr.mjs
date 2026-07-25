// Jednokratno: regeneriši IPS QR PNG-ove za pending uplatnica porudžbine
// (stari su kodirali nevalidan NBS string — račun sa crticama, tačka u iznosu).
// Pokretanje: node scripts/regen-ips-qr.mjs [--dry]
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const dry = process.argv.includes("--dry");

function buildIpsString(o) {
  return [
    "K:PR", "V:01", "C:1",
    "R:170001055976700018",
    "N:Hartweger, Beograd, 11070 Beograd",
    `I:RSD${Number(o.total).toFixed(2).replace(".", ",")}`,
    `S:Placanje porudzbine #${o.order_number}`,
    "SF:189",
    `RO:00${o.order_number}`,
  ].join("|");
}

const { data: orders, error } = await admin
  .from("orders")
  .select("order_number,total,payment_status,payment_method")
  .eq("payment_status", "pending")
  .eq("payment_method", "uplatnica");
if (error) throw error;

console.log(`Pending uplatnica porudžbina: ${orders.length}`);
for (const o of orders) {
  const ips = buildIpsString(o);
  // provera na NBS validatoru pre upload-a (uz retry; NBS ume da resetuje uzastopne pozive)
  let res = null;
  for (let i = 0; i < 3 && !res; i++) {
    try {
      res = await fetch("https://nbs.rs/QRcode/api/qr/v1/validate", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: ips,
      }).then((r) => r.json());
    } catch {
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
  const ok = res?.s?.code === 0;
  console.log(`#${o.order_number}  ${o.total} RSD  NBS: ${ok ? "OK" : JSON.stringify(res?.e ?? "validator nedostupan")}`);
  await new Promise((r) => setTimeout(r, 2000));
  if (!ok || dry) continue;
  const buf = await QRCode.toBuffer(ips, { width: 260, margin: 1, errorCorrectionLevel: "M" });
  const { error: upErr } = await admin.storage
    .from("blog-media")
    .upload(`uplatnice/${o.order_number}.png`, buf, { contentType: "image/png", upsert: true });
  console.log(upErr ? `  UPLOAD GREŠKA: ${upErr.message}` : "  → PNG zamenjen");
}
