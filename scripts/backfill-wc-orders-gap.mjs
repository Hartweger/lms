// Backfill WC narudžbina koje su nastale posle poslednje sinhronizacije (wc_orders zamrznut ~28.05),
// a pre flipa (08.06) — te pre-flip WooCommerce uplate fale u analitici. Čita živi WC REST
// (old.hartweger.rs) preko curl-a (node fetch je WAF-blokiran), upari po wc_order_id, ubaci samo nove.
// Dry-run default; --apply.
import { execFileSync } from "node:child_process";
import { client } from "./lib/exam-packer.mjs";

const APPLY = process.argv.includes("--apply");
const CK = "ck_5fa42d3e78f75b6ddc9b166f70f0efddb3625322";
const CS = "cs_55c370aec2ab635f6e6fe83e76ea2b645d486bc4";
const WC = "https://old.hartweger.rs/wp-json/wc/v3/orders";
const STATUSES = ["completed", "processing", "refunded"]; // isto kao originalna migracija
const sb = client();

// poslednji sinhronizovan datum
const { data: last } = await sb.from("wc_orders").select("date_created").order("date_created", { ascending: false }).limit(1);
const after = last?.[0]?.date_created ?? "2026-05-01T00:00:00";
console.log("Poslednji wc_orders datum:", after, "|", APPLY ? "APPLY" : "DRY");

const curlJson = (url) => JSON.parse(execFileSync("curl", ["-fsSL", "--max-time", "40", url], { maxBuffer: 50 * 1024 * 1024 }).toString());

// pokupi sve nove WC narudžbine
const fetched = [];
for (const status of STATUSES) {
  for (let page = 1; page <= 20; page++) {
    const url = `${WC}?after=${encodeURIComponent(after)}&status=${status}&per_page=100&page=${page}&orderby=date&order=asc&consumer_key=${CK}&consumer_secret=${CS}`;
    let batch;
    try { batch = curlJson(url); } catch { break; }
    if (!Array.isArray(batch) || batch.length === 0) break;
    fetched.push(...batch);
    if (batch.length < 100) break;
  }
}
console.log(`Povučeno iz živog WC-a: ${fetched.length}`);

// dedupe vs postojeći wc_order_id
const ids = fetched.map((o) => o.id);
const { data: existing } = await sb.from("wc_orders").select("wc_order_id").in("wc_order_id", ids.length ? ids : [-1]);
const have = new Set((existing ?? []).map((r) => r.wc_order_id));
const toInsert = fetched.filter((o) => !have.has(o.id));

const rows = toInsert.map((o) => ({
  wc_order_id: o.id,
  status: o.status,
  currency: o.currency,
  total: Number(o.total || 0),
  discount_total: Number(o.discount_total || 0),
  payment_method: o.payment_method ?? "",
  payment_method_title: o.payment_method_title ?? "",
  customer_email: o.billing?.email ?? "",
  customer_name: `${o.billing?.first_name ?? ""} ${o.billing?.last_name ?? ""}`.trim(),
  country: o.billing?.country ?? "",
  items: (o.line_items ?? []).map((li) => ({ name: li.name, quantity: li.quantity, total: li.total, product_id: li.product_id })),
  date_created: o.date_created,
  date_completed: o.date_completed,
}));

const suma = rows.reduce((s, r) => s + r.total, 0);
console.log(`Novih za upis: ${rows.length} (${suma.toLocaleString("de-DE")} RSD) | već postoji: ${fetched.length - rows.length}`);
console.log("Opseg:", rows.length ? `${rows[0].date_created?.slice(0, 10)} → ${rows[rows.length - 1].date_created?.slice(0, 10)}` : "-");

if (!APPLY) { console.log("\n[DRY] dodaj --apply za upis."); process.exit(0); }
if (rows.length) {
  // insert u serijama
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await sb.from("wc_orders").insert(rows.slice(i, i + 200));
    if (error) throw error;
  }
}
console.log(`✓ Upisano ${rows.length} wc_orders.`);
