/**
 * Generička migracija kupaca: WC proizvod → course_access za dati kurs (1 god od kupovine).
 * Postavlja i courses.old_wc_product_id. NE šalje mejlove.
 *
 *   npx tsx scripts/migrate-course-buyers.ts <slug> <wcProductId> [--from=YYYY-MM-DD] [--write]
 *   WC_CONSUMER_KEY / WC_CONSUMER_SECRET kroz env.
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("="); if (k && v.length && !process.env[k.trim()]) process.env[k.trim()] = v.join("=").trim();
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const slug = process.argv[2];
const productId = parseInt(process.argv[3]);
const WRITE = process.argv.includes("--write");
const fromArg = process.argv.find((a) => a.startsWith("--from="));
const FROM = fromArg ? new Date(fromArg.split("=")[1] + "T00:00:00Z") : null;
if (!slug || !productId) { console.error("Usage: tsx scripts/migrate-course-buyers.ts <slug> <wcProductId> [--from=YYYY-MM-DD] [--write]"); process.exit(1); }

const WC = "https://www.hartweger.rs/wp-json/wc/v3";
const auth = "Basic " + Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString("base64");
const ACCESS_DAYS = 365;

async function buyers() {
  const out = new Map<string, { name: string; date: Date }>();
  for (const status of ["completed", "processing"]) {
    let page = 1;
    while (true) {
      const r = await fetch(`${WC}/orders?status=${status}&per_page=100&page=${page}`, { headers: { Authorization: auth } });
      if (!r.ok) throw new Error(`WC ${status} ${r.status}`);
      const o = await r.json();
      if (!Array.isArray(o) || !o.length) break;
      for (const ord of o) {
        if (!ord.line_items?.some((i: { product_id: number }) => i.product_id === productId)) continue;
        const date = new Date(ord.date_paid || ord.date_created);
        if (FROM && date < FROM) continue;
        const email = (ord.billing?.email || "").toLowerCase().trim();
        if (!email) continue;
        const name = `${ord.billing.first_name || ""} ${ord.billing.last_name || ""}`.trim();
        const p = out.get(email);
        if (!p || date > p.date) out.set(email, { name, date });
      }
      page++;
    }
  }
  return out;
}

async function run() {
  const { data: course } = await sb.from("courses").select("id,old_wc_product_id").eq("slug", slug).single();
  if (!course) throw new Error(`kurs ${slug} ne postoji`);
  if (WRITE && course.old_wc_product_id !== productId) {
    await sb.from("courses").update({ old_wc_product_id: productId }).eq("id", course.id);
    console.log(`✓ ${slug} ← old_wc_product_id=${productId}`);
  }
  const list = await buyers();
  console.log(`Kupaca (${slug}, proizvod ${productId}${FROM ? ", od " + FROM.toISOString().slice(0, 10) : ""}): ${list.size}`);
  let acc = 0, neu = 0;
  for (const [email, b] of list) {
    const expires = new Date(b.date.getTime() + ACCESS_DAYS * 86400000);
    if (!WRITE) continue;
    const { data: prof } = await sb.from("user_profiles").select("id").eq("email", email).single();
    let uid = prof?.id as string | undefined;
    if (!uid) {
      const { data: nu, error } = await sb.auth.admin.createUser({ email, email_confirm: true });
      if (error || !nu.user) { console.error(`  ✗ ${email}: ${error?.message}`); continue; }
      uid = nu.user.id; neu++;
      await sb.from("user_profiles").upsert({ id: uid, email, full_name: b.name, role: "student" });
    }
    await sb.from("course_access").upsert({ user_id: uid, course_id: course.id, expires_at: expires.toISOString() }, { onConflict: "user_id,course_id" });
    acc++; console.log(`  ✓ ${email} → ističe ${expires.toISOString().slice(0, 10)}${prof ? "" : " (nov)"}`);
  }
  console.log(WRITE ? `\n✓ Pristup dodeljen: ${acc} (novih naloga: ${neu}). BEZ mejlova.` : `\n[DRY] ${list.size} kupaca. --write za upis.`);
}
run().catch((e) => { console.error(e); process.exit(1); });
