// Backfill marketing atribucije (izvor/kanal) za wc_orders iz živog WooCommerce-a.
// WC order ima _wc_order_attribution_* meta (utm_source, utm_medium, utm_campaign, source_type).
// Čita preko curl-a (WAF), upari po wc_order_id, update postojećih wc_orders. Dry pokazuje raspodelu; --apply upisuje.
import { execFileSync } from "node:child_process";
import { client } from "./lib/exam-packer.mjs";

const APPLY = process.argv.includes("--apply");
const CK = "ck_5fa42d3e78f75b6ddc9b166f70f0efddb3625322";
const CS = "cs_55c370aec2ab635f6e6fe83e76ea2b645d486bc4";
const WC = "https://old.hartweger.rs/wp-json/wc/v3/orders";
const STATUSES = ["completed", "processing", "refunded"];
const sb = client();

const curlJson = (url) => JSON.parse(execFileSync("curl", ["-fsSL", "--max-time", "60", url], { maxBuffer: 200 * 1024 * 1024 }).toString());
const metaVal = (meta, key) => (meta.find((m) => m.key === key) || {}).value ?? null;

// pokupi atribuciju iz živog WC-a
const attr = new Map(); // wc_order_id → {utm_source, utm_medium, utm_campaign, source_type}
for (const status of STATUSES) {
  for (let page = 1; page <= 60; page++) {
    const url = `${WC}?status=${status}&per_page=100&page=${page}&orderby=date&order=asc&_fields=id,meta_data&consumer_key=${CK}&consumer_secret=${CS}`;
    let batch;
    try { batch = curlJson(url); } catch { break; }
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const o of batch) {
      const meta = o.meta_data ?? [];
      attr.set(o.id, {
        utm_source: metaVal(meta, "_wc_order_attribution_utm_source"),
        utm_medium: metaVal(meta, "_wc_order_attribution_utm_medium"),
        utm_campaign: metaVal(meta, "_wc_order_attribution_utm_campaign"),
        source_type: metaVal(meta, "_wc_order_attribution_source_type"),
      });
    }
    if (batch.length < 100) break;
  }
  console.log(`  ${status}: skupljeno ukupno ${attr.size}`);
}

// raspodela izvora (pregled)
const dist = {};
for (const a of attr.values()) { const s = a.utm_source || "(bez izvora)"; dist[s] = (dist[s] || 0) + 1; }
console.log("\nRaspodela izvora (WC):");
for (const [s, n] of Object.entries(dist).sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(`  ${s}: ${n}`);

if (!APPLY) { console.log(`\n[DRY] ukupno ${attr.size} narudžbina sa atribucijom. --apply za upis u wc_orders.`); process.exit(0); }

// update postojećih wc_orders (po wc_order_id), u serijama
const ids = [...attr.keys()];
let updated = 0, skipped = 0;
for (let i = 0; i < ids.length; i += 25) {
  const chunk = ids.slice(i, i + 25);
  await Promise.all(chunk.map(async (id) => {
    const a = attr.get(id);
    if (!a.utm_source && !a.source_type) { skipped++; return; }
    const { error, count } = await sb.from("wc_orders").update(a, { count: "exact" }).eq("wc_order_id", id);
    if (error) { console.error("  ERR", id, error.message); return; }
    if (count) updated += count;
  }));
  if (i % 500 === 0) console.log(`  ...${i}/${ids.length}`);
}
console.log(`✓ Update-ovano wc_orders: ${updated} | bez izvora (preskočeno): ${skipped}`);
