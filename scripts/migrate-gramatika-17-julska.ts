/**
 * Migracija 17 kupaca "Osnove gramatike" videa sa VAŽEĆIM pristupom (kupovina+365)
 * koji NEMAJU nalog na novoj platformi — utvrđeno re-verifikacijom 02.07.2026
 * pred gašenje starog WP-a 7.7. Ulaz: scripts/_gramatika_valid_no_account_2026-07-02.json.
 *
 * Dry-run (podrazumevano): samo analiza, bez upisa.
 *   npx tsx scripts/migrate-gramatika-17-julska.ts
 * Stvarni upis (kreira naloge + dodeljuje pristup, BEZ mejlova):
 *   npx tsx scripts/migrate-gramatika-17-julska.ts --write
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
const COURSE_SLUG = "osnove-nemacke-gramatike";
const SOURCE = "gramatika-migracija-2026-07";
const ACCESS_DAYS = 365;

interface Buyer { email: string; order_id: number; date_paid: string; full_name: string; }

async function run() {
  const { data: course } = await sb.from("courses").select("id").eq("slug", COURSE_SLUG).single();
  if (!course) throw new Error(`kurs ${COURSE_SLUG} ne postoji`);

  const input = JSON.parse(fs.readFileSync(path.resolve(__dirname, "_gramatika_valid_no_account_2026-07-02.json"), "utf-8"));
  const buyers: Buyer[] = input.buyers;
  const now = new Date();
  let created = 0, existed = 0, granted = 0, skippedExpired = 0;

  for (const b of buyers) {
    const email = b.email.toLowerCase().trim();
    const expires = new Date(new Date(b.date_paid).getTime() + ACCESS_DAYS * 86400000);
    if (expires <= now) { console.log(`  – ${email}: pristup već istekao (${expires.toISOString().slice(0, 10)}), preskačem`); skippedExpired++; continue; }

    const { data: prof } = await sb.from("user_profiles").select("id").eq("email", email).maybeSingle();
    let userId = prof?.id as string | undefined;
    if (userId) existed++;

    console.log(`  ${email} (${b.full_name}) → pristup do ${expires.toISOString().slice(0, 10)}${userId ? "" : " (nov nalog)"}`);
    if (!WRITE) continue;

    if (!userId) {
      const { data: nu, error } = await sb.auth.admin.createUser({ email, email_confirm: true });
      if (error || !nu?.user) { console.error(`  ✗ ${email}: ${error?.message}`); continue; }
      userId = nu.user.id;
      const { error: pe } = await sb.from("user_profiles").upsert({ id: userId, email, full_name: b.full_name, role: "student" });
      if (pe) { console.error(`  ✗ ${email} profil: ${pe.message}`); continue; }
      created++;
    }
    const { error: ge } = await sb.from("course_access").upsert(
      { user_id: userId, course_id: course.id, expires_at: expires.toISOString(), source: SOURCE },
      { onConflict: "user_id,course_id" }
    );
    if (ge) { console.error(`  ✗ ${email} pristup: ${ge.message}`); continue; }
    granted++;
  }

  console.log(`\n── Rezime ──`);
  console.log(`Ulaz: ${buyers.length} | već imao nalog: ${existed} | istekli (preskočeni): ${skippedExpired}`);
  if (WRITE) console.log(`Kreirano naloga: ${created} | dodeljeno pristupa: ${granted} (source=${SOURCE}). BEZ mejlova.`);
  else console.log(`[DRY-RUN] ništa nije upisano. Pokreni sa --write za stvarni upis.`);
}
run().catch((e) => { console.error(e); process.exit(1); });
