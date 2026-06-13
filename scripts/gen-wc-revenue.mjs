// Generiše statički istorijski WC prihod po mesecu/kategoriji u src/lib/wc-revenue-history.json.
// Mesečni total je autoritativan iz WC Analytics revenue/stats (date_paid, minus povraćaji) -
// poklapa se sa WooCommerce Analytics dashboardom. Kategorije se skaliraju iz wc_orders miksa.
// NH Academy (drugi brend) izuzet. WC je posle flipa (08.06) statičan, pa je JSON konačan.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { client } from "./lib/exam-packer.mjs";
const sb = client();
const CK = "ck_5fa42d3e78f75b6ddc9b166f70f0efddb3625322", CS = "cs_55c370aec2ab635f6e6fe83e76ea2b645d486bc4";
const curlJson = (u) => JSON.parse(execFileSync("curl", ["-fsSL", "--max-time", "40", u], { maxBuffer: 5e7 }).toString());
const NH = 51065; // NH Academy — drugi brend (natasahartweger.rs)
const CATS = ["video", "grupni", "individualni", "paket", "ostalo"];
const kat = (n) => { n = String(n || ""); if (/paket/i.test(n) && !/mesečni/i.test(n)) return "paket"; if (/grupni/i.test(n)) return "grupni"; if (/individualni/i.test(n)) return "individualni"; if (/video|fsp|fide|goethe|gramatik|prevo[đdj]|biografij/i.test(n)) return "video"; return "ostalo"; };

const YEAR = 2026;
const MONTHS = [["01","31"],["02","28"],["03","31"],["04","30"],["05","31"],["06","30"]];

// 1) autoritativni mesečni total (dashboard) iz WC Analytics
const tot = {};
for (const [m, dd] of MONTHS) {
  const r = curlJson(`https://old.hartweger.rs/wp-json/wc-analytics/reports/revenue/stats?after=${YEAR}-${m}-01T00:00:00&before=${YEAR}-${m}-${dd}T23:59:59&interval=year&consumer_key=${CK}&consumer_secret=${CS}`);
  tot[m] = Number(r?.totals?.net_revenue ?? 0);
}
// 2) kategorijski miks + NH doprinos iz wc_orders (line items)
const { data: wc } = await sb.from("wc_orders").select("date_created,status,items").eq("status","completed").gte("date_created",`${YEAR}-01-01`).lt("date_created",`${YEAR+1}-01-01`).limit(10000);
const mixByM = {}, nhByM = {};
for (const o of wc) {
  const m = String(o.date_created).slice(5, 7);
  for (const it of (o.items || [])) {
    const t = Number(it.total) || 0;
    if (it.product_id === NH) { nhByM[m] = (nhByM[m] || 0) + t; continue; }
    (mixByM[m] = mixByM[m] || {})[kat(it.name)] = ((mixByM[m] || {})[kat(it.name)] || 0) + t;
  }
}
// 3) skaliraj kategorije na (total - NH); ostatak zaokruživanja na najveću kategoriju (nikad negativ)
const rows = [];
for (const [m] of MONTHS) {
  const Tp = Math.max(0, (tot[m] || 0) - (nhByM[m] || 0));
  if (Tp === 0) continue;
  const mix = mixByM[m] || {};
  const mixSum = CATS.reduce((s, c) => s + (mix[c] || 0), 0) || 1;
  const amt = {}; let used = 0;
  for (const c of CATS) { amt[c] = Math.round(Tp * (mix[c] || 0) / mixSum); used += amt[c]; }
  // ostatak na kategoriju sa najvećim udelom
  const biggest = CATS.reduce((a, b) => (mix[b] || 0) > (mix[a] || 0) ? b : a, CATS[0]);
  amt[biggest] += Tp - used;
  rows.push({ year: YEAR, month: Number(m), ...amt });
}

const out = { [YEAR]: rows };
writeFileSync("src/lib/wc-revenue-history.json", JSON.stringify(out, null, 2) + "\n");
const f = (n) => Math.round(n).toLocaleString("de-DE");
console.log("Mesec | " + CATS.join(" | ") + " | TOTAL");
for (const r of rows) console.log(`${YEAR}-${String(r.month).padStart(2,"0")} | ${CATS.map(c=>f(r[c])).join(" | ")} | ${f(CATS.reduce((s,c)=>s+r[c],0))}`);
console.log("\nUkupno (bez NH):", f(rows.reduce((s,r)=>s+CATS.reduce((a,c)=>a+r[c],0),0)));
console.log("✓ src/lib/wc-revenue-history.json zapisan");
