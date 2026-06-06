/**
 * Migracija kupaca kursa Gramatika A2-B1 (WC proizvod 47440 → gramatika-a2-b1).
 * Ispravlja raniju grešku (47440 je bio mapiran na A1) i hvata SVE kupce (bez datumskog filtera).
 *
 * Dry-run (podrazumevano): samo analiza, bez upisa.
 *   npx tsx scripts/migrate-gramatika-buyers.ts
 * Stvarni upis (kreira naloge + dodeljuje pristup, BEZ mejlova):
 *   npx tsx scripts/migrate-gramatika-buyers.ts --write
 *
 * WC kredencijali se prosleđuju kroz env: WC_CONSUMER_KEY / WC_CONSUMER_SECRET
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("="); if (k && v.length) process.env[k.trim()] = v.join("=").trim();
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const WRITE = process.argv.includes("--write");
const WC_URL = "https://www.hartweger.rs/wp-json/wc/v3";
const WC_KEY = process.env.WC_CONSUMER_KEY!;
const WC_SECRET = process.env.WC_CONSUMER_SECRET!;
const PRODUCT_ID = 47440;
const COURSE_SLUG = "gramatika-a2-b1";
const auth = "Basic " + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");

interface WCOrder {
  status: string;
  date_created: string;
  date_paid: string | null;
  billing: { email: string; first_name: string; last_name: string };
  line_items: { product_id: number; name: string }[];
}

interface Buyer { name: string; latestDate: Date; }

const ACCESS_DAYS = 365; // pravilo: 1 godina od kupovine

async function fetchGramatikaBuyers(): Promise<Map<string, Buyer>> {
  // email → {ime, najnoviji datum kupovine}; completed/processing nalozi sa proizvodom 47440
  const buyers = new Map<string, Buyer>();
  for (const status of ["completed", "processing"]) {
    let page = 1;
    while (true) {
      const url = `${WC_URL}/orders?status=${status}&per_page=100&page=${page}`;
      const res = await fetch(url, { headers: { Authorization: auth } });
      if (!res.ok) throw new Error(`WC orders ${status} p${page} → ${res.status}`);
      const orders: WCOrder[] = await res.json();
      if (!Array.isArray(orders) || orders.length === 0) break;
      for (const o of orders) {
        if (!o.line_items?.some((i) => i.product_id === PRODUCT_ID)) continue;
        const email = (o.billing?.email || "").toLowerCase().trim();
        if (!email) continue;
        const name = `${o.billing.first_name || ""} ${o.billing.last_name || ""}`.trim();
        const date = new Date(o.date_paid || o.date_created);
        const prev = buyers.get(email);
        if (!prev || date > prev.latestDate) buyers.set(email, { name, latestDate: date });
        else if (prev && !prev.name) prev.name = name;
      }
      page++;
    }
  }
  return buyers;
}

const expiryFor = (purchase: Date) => new Date(purchase.getTime() + ACCESS_DAYS * 86400000);

async function run() {
  const { data: course } = await sb.from("courses").select("id").eq("slug", COURSE_SLUG).single();
  if (!course) throw new Error("kurs gramatika-a2-b1 ne postoji");

  console.log("Povlačim Gramatika kupce sa WC-a (proizvod 47440)…");
  const buyers = await fetchGramatikaBuyers();
  console.log(`\nUkupno jedinstvenih kupaca: ${buyers.size}\n`);

  const now = new Date();
  let haveAccount = 0, haveAccess = 0, needAccount = 0, needGrant = 0, activeNow = 0, expired = 0;
  const toCreate: string[] = [];

  for (const [email, b] of buyers) {
    const expires = expiryFor(b.latestDate);
    if (expires > now) activeNow++; else expired++;

    const { data: prof } = await sb.from("user_profiles").select("id").eq("email", email).single();
    let userId = prof?.id as string | undefined;
    if (userId) haveAccount++; else { needAccount++; toCreate.push(email); }

    if (userId) {
      const { data: acc } = await sb.from("course_access").select("id").eq("user_id", userId).eq("course_id", course.id).maybeSingle();
      if (acc) haveAccess++;
    }
    needGrant++;

    if (WRITE) {
      if (!userId) {
        const { data: nu, error } = await sb.auth.admin.createUser({ email, email_confirm: true });
        if (error || !nu.user) { console.error(`  ✗ ${email}: ${error?.message}`); continue; }
        userId = nu.user.id;
        await sb.from("user_profiles").upsert({ id: userId, email, full_name: b.name, role: "student" });
      }
      await sb.from("course_access").upsert(
        { user_id: userId, course_id: course.id, expires_at: expires.toISOString() },
        { onConflict: "user_id,course_id" }
      );
      console.log(`  ✓ ${email} → ističe ${expires.toISOString().slice(0, 10)}${prof ? "" : " (nov nalog)"}`);
    }
  }

  console.log(`\n── Rezime ──`);
  console.log(`Kupaca: ${buyers.size}`);
  console.log(`  već ima nalog: ${haveAccount}`);
  console.log(`  već ima pristup Gramatici (bilo kakav): ${haveAccess}`);
  console.log(`  treba nov nalog: ${needAccount}`);
  console.log(`  pristup (1god od kupovine) — AKTIVAN danas: ${activeNow}`);
  console.log(`  pristup (1god od kupovine) — VEĆ ISTEKAO: ${expired}`);
  if (!WRITE) {
    console.log(`\n[DRY-RUN] ništa nije upisano. Pokreni sa --write za stvarni upis.`);
    console.log(`Primeri za kreiranje naloga: ${toCreate.slice(0, 8).join(", ")}`);
  } else {
    console.log(`\n✓ Upis gotov (expires_at = kupovina + ${ACCESS_DAYS} dana). BEZ mejlova.`);
  }
}
run().catch((e) => { console.error(e); process.exit(1); });
