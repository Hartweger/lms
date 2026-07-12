/**
 * Jednokratna korekcija coupons.usage_count na broj NAPLAĆENIH porudžbina
 * (payment_status='completed') po kuponu. Prateći fix: increment se od sada
 * dešava u grantAccessForOrder (naplata), ne pri kreiranju porudžbine.
 *   npx tsx scripts/fix-coupon-usage-count.ts          # dry-run (samo prikaz)
 *   npx tsx scripts/fix-coupon-usage-count.ts --apply  # upiši korekcije
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs"; import * as path from "path";
const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("="); if (k && v.length && !process.env[k.trim()]) process.env[k.trim()] = v.join("=").trim();
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const apply = process.argv.includes("--apply");

async function main() {
  const { data: coupons, error } = await sb.from("coupons").select("code, usage_count, max_uses");
  if (error || !coupons) throw new Error(`coupons select: ${error?.message}`);

  let changed = 0;
  for (const c of coupons) {
    const { count, error: cntErr } = await sb
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("coupon_code", c.code)
      .eq("payment_status", "completed");
    if (cntErr) { console.error(`${c.code}: count pao - ${cntErr.message}`); continue; }
    const naplaceno = count ?? 0;
    const mark = c.usage_count === naplaceno ? "ok" : "→ KORIGUJ";
    console.log(`${c.code.padEnd(16)} usage_count=${c.usage_count} naplaćeno=${naplaceno} max_uses=${c.max_uses ?? "∞"} ${mark}`);
    if (c.usage_count !== naplaceno) {
      changed++;
      if (apply) {
        const { error: updErr } = await sb.from("coupons").update({ usage_count: naplaceno }).eq("code", c.code);
        if (updErr) console.error(`${c.code}: update pao - ${updErr.message}`);
      }
    }
  }
  console.log(`\n${changed} kupona za korekciju. ${apply ? "UPISANO." : "Dry-run - pokreni sa --apply za upis."}`);
}
main();
