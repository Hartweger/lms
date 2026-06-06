/**
 * Migracija LearnDash pristupa → course_access na novom LMS-u.
 * Izvor: WooCommerce narudžbine (completed+processing, after=2025-06-07), rok = date_paid + 365.
 * Podrazumevano DRY-RUN. --write upisuje (find-or-create user, upsert sa MAX rokom, bez mejlova).
 *
 *   WC_CONSUMER_KEY=... WC_CONSUMER_SECRET=... npx tsx scripts/migrate-ld-access.ts [--write]
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import {
  normalizeEmail, expiryFromPaid, mergeExpiry, relatedIdsToSlugs, resolveSlugs,
} from "./ld-access-mapping";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("=");
  if (k && v.length && !process.env[k.trim()]) process.env[k.trim()] = v.join("=").trim();
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const WRITE = process.argv.includes("--write");
const SOURCE = "wp-migration-2026-06";
const AFTER = "2025-06-07T00:00:00";
const WC = "https://hartweger.rs/wp-json/wc/v3";
const wcAuth = "Basic " + Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString("base64");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function wcGet(pathQs: string) {
  const r = await fetch(`${WC}${pathQs}`, { headers: { Authorization: wcAuth } });
  if (!r.ok) throw new Error(`WC ${r.status} ${pathQs}`);
  return r.json();
}

// product_id → [slug] preko _related_course
async function buildRelatedMap(): Promise<{ map: Record<number, string[]>; name: Record<number, string> }> {
  const map: Record<number, string[]> = {}; const name: Record<number, string> = {};
  let page = 1;
  while (true) {
    const d = await wcGet(`/products?per_page=100&page=${page}&status=publish`);
    if (!Array.isArray(d) || !d.length) break;
    for (const p of d) {
      name[p.id] = p.name;
      const rel = (p.meta_data || []).find((m: { key: string }) => m.key === "_related_course")?.value;
      map[p.id] = Array.isArray(rel) ? relatedIdsToSlugs(rel.map(Number)) : [];
    }
    page++; await sleep(2500);
    if (page > 8) break;
  }
  return { map, name };
}

type Plan = Map<string, { name: string; perCourse: Map<string, number> }>; // email → {name, slug→expiryMs}

async function buildPlan(related: Record<number, string[]>, pname: Record<number, string>) {
  const plan: Plan = new Map();
  const unmapped = new Map<string, number>();
  const now = Date.now();
  let bad = 0, expired = 0, orders = 0;
  for (const status of ["completed", "processing"]) {
    let page = 1;
    while (true) {
      const d = await wcGet(`/orders?status=${status}&per_page=100&page=${page}&after=${AFTER}`);
      if (!Array.isArray(d) || !d.length) break;
      for (const ord of d) {
        orders++;
        const email = normalizeEmail(ord.billing?.email || "");
        if (!email) { bad++; continue; }
        const exp = expiryFromPaid(new Date(ord.date_paid || ord.date_created).getTime());
        const full = `${ord.billing?.first_name || ""} ${ord.billing?.last_name || ""}`.trim();
        for (const it of ord.line_items || []) {
          if ((it.quantity || 0) <= 0) continue;
          const slugs = resolveSlugs(it.product_id, it.name || pname[it.product_id] || "", related);
          if (slugs === null) { const k = it.name || `pid${it.product_id}`; unmapped.set(k, (unmapped.get(k) || 0) + 1); continue; }
          if (!slugs.length) continue;
          if (exp < now) { expired++; continue; }
          if (!plan.has(email)) plan.set(email, { name: full, perCourse: new Map() });
          const m = plan.get(email)!.perCourse;
          for (const s of slugs) m.set(s, mergeExpiry(m.get(s) ?? null, exp));
        }
      }
      page++; await sleep(2500);
      if (page > 60) break;
    }
  }
  return { plan, unmapped, bad, expired, orders };
}

function report(plan: Plan, unmapped: Map<string, number>, existing: Set<string>, meta: { bad: number; expired: number; orders: number }) {
  const per: Record<string, number> = {}; let grants = 0, neu = 0;
  for (const [email, v] of plan) {
    if (!existing.has(email)) neu++;
    for (const [s] of v.perCourse) { per[s] = (per[s] || 0) + 1; grants++; }
  }
  console.log(`\n=== ${WRITE ? "WRITE" : "DRY-RUN"} ===`);
  console.log(`Narudžbina: ${meta.orders} | loš mejl: ${meta.bad} | isteklih dodela: ${meta.expired}`);
  console.log(`Korisnika: ${plan.size} | novih naloga: ${neu} | dodela: ${grants}`);
  console.log("Po kursu:");
  Object.entries(per).sort((a, b) => b[1] - a[1]).forEach(([s, n]) => console.log(`  ${s.padEnd(26)}${n}`));
  console.log("NEMAPIRANO:");
  if (!unmapped.size) console.log("  — nema —");
  [...unmapped.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`  ×${n}  ${k}`));
}

async function loadExisting(): Promise<Set<string>> {
  const set = new Set<string>(); let from = 0;
  while (true) {
    const { data } = await sb.from("user_profiles").select("email").range(from, from + 999);
    if (!data || !data.length) break;
    data.forEach((r) => r.email && set.add(r.email.toLowerCase().trim()));
    if (data.length < 1000) break; from += 1000;
  }
  return set;
}

async function run() {
  const { map, name } = await buildRelatedMap();
  const { plan, unmapped, bad, expired, orders } = await buildPlan(map, name);
  const existing = await loadExisting();
  report(plan, unmapped, existing, { bad, expired, orders });
  if (!WRITE) { console.log("\n[DRY] --write za upis."); return; }
  // upis: Task 4
}
run().catch((e) => { console.error(e); process.exit(1); });
