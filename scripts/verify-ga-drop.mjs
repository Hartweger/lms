// Provera da li je pad u GA4 (Active/New Users) realan ili artefakt merenja.
// Poredi prave, cookie-nezavisne brojke za izveštajni period vs prethodni period iste dužine.
//   Izveštajni period (GA4 mejl):  2026-05-23 .. 2026-06-19
//   Prethodni (poređenje):         2026-04-25 .. 2026-05-22
// Pokretanje:  node scripts/verify-ga-drop.mjs
import { config } from "dotenv";
config({ path: new URL("../.env.local", import.meta.url).pathname });

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

// Periodi (ISO granice; gornja granica ekskluzivna)
const CUR = { from: "2026-05-23", to: "2026-06-20", label: "Izveštajni 23.5–19.6" };
const PRV = { from: "2026-04-25", to: "2026-05-23", label: "Prethodni  25.4–22.5" };

async function countRange(table, col, from, to, extra = "") {
  // HEAD zahtev sa Prefer: count=exact vraća ukupan broj u Content-Range zaglavlju
  const q = `${table}?select=${col}&${col}=gte.${from}&${col}=lt.${to}${extra}`;
  const r = await fetch(`${URL_}/rest/v1/${q}`, {
    method: "HEAD",
    headers: { ...H, Prefer: "count=exact", Range: "0-0" },
  });
  const cr = r.headers.get("content-range") || "";
  const total = cr.includes("/") ? parseInt(cr.split("/")[1], 10) : NaN;
  if (Number.isNaN(total)) throw new Error(`${table}: ${r.status} ${cr}`);
  return total;
}

async function metric(label, table, col, extra = "") {
  const cur = await countRange(table, col, CUR.from, CUR.to, extra);
  const prv = await countRange(table, col, PRV.from, PRV.to, extra);
  const delta = prv ? (((cur - prv) / prv) * 100).toFixed(1) + "%" : "—";
  const arrow = cur === prv ? "→" : cur > prv ? "↑" : "↓";
  console.log(
    label.padEnd(40) +
      String(prv).padStart(7) +
      String(cur).padStart(9) +
      ("  " + arrow + " " + delta).padStart(12)
  );
}

console.log(`\n═══ Provera GA pada — prave brojke (cookie-nezavisne) ═══`);
console.log(`${CUR.label}  vs  ${PRV.label}\n`);
console.log("".padEnd(40) + "PRETH.".padStart(7) + "IZVEŠT.".padStart(9) + "PROMENA".padStart(12));
console.log("-".repeat(68));

await metric("Nove prijave (user_profiles)", "user_profiles", "created_at");
await metric("Porudžbine — sve (orders)", "orders", "created_at");
await metric("Porudžbine — plaćene", "orders", "created_at", "&payment_status=in.(paid,completed)");
await metric("CRM novi kontakti/lidovi", "crm_contacts", "created_at");
await metric("CRM interakcije", "crm_interactions", "occurred_at");

console.log("-".repeat(68));
console.log(
  "\nAko su ove brojke stabilne (±10%) dok GA pokazuje -43/-46% → GA pad je artefakt\nmerenja (cookie baner + re-tag), ne stvarni gubitak publike.\n"
);
