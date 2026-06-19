/**
 * Migracija 4 RUČNO upisanih LearnDash korisnika (x1f.one) koje je WC-migracija promašila.
 * Svi: A1.1 + A1.2, upis 2026-02-05, rok 365 dana => 2027-02-05.
 * Podrazumevano DRY. --write kreira naloge (tiho) + dodeljuje course_access. BEZ mejlova.
 *
 *   npx tsx scripts/migrate-x1f-manual.ts [--write]
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs"; import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("="); if (k && v.length && !process.env[k.trim()]) process.env[k.trim()] = v.join("=").trim();
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const WRITE = process.argv.includes("--write");
const SOURCE = "wp-manual-migration-2026-06";
const EXPIRES = "2027-02-05T23:59:59Z"; // 365 dana od upisa 2026-02-05
const SLUGS = ["nemacki-a1-1", "nemacki-a1-2"];

const USERS = [
  { email: "katarina.milenkovic@x1f.one", name: "Katarina Milenković" },
  { email: "marko.milosavljevic@x1f.one", name: "Marko Milosavljević" },
  { email: "zarko.bogicevic@x1f.one", name: "Žarko Bogičević" },
  { email: "aleksandar.stanojevic@x1f.one", name: "Aleksandar Stanojević" },
  { email: "marko.pejic@x1f.one", name: "Marko Pejić" },
];

async function main() {
  const { data: courses } = await sb.from("courses").select("id,slug").in("slug", SLUGS);
  const slugToId = new Map((courses || []).map((c) => [c.slug, c.id]));
  for (const s of SLUGS) if (!slugToId.has(s)) { console.error("✗ Nedostaje kurs:", s); process.exit(1); }

  for (const u of USERS) {
    const email = u.email.toLowerCase().trim();
    let { data: prof } = await sb.from("user_profiles").select("id").eq("email", email).maybeSingle();
    let uid = prof?.id as string | undefined;
    console.log(`\n${email} — ${uid ? "postoji" : "NEMA naloga"}`);
    if (!WRITE) { console.log(`  [DRY] kreirao bih nalog (ako treba) + A1.1/A1.2 do ${EXPIRES}`); continue; }
    if (!uid) {
      const { data: nu, error } = await sb.auth.admin.createUser({ email, email_confirm: true });
      if (error || !nu?.user) { console.error(`  ✗ createUser: ${error?.message}`); process.exit(1); }
      uid = nu.user.id;
      const { error: pErr } = await sb.from("user_profiles").upsert({ id: uid, email, full_name: u.name, role: "student" });
      if (pErr) { console.error(`  ✗ profile: ${pErr.message}`); process.exit(1); }
      console.log(`  ✓ nalog kreiran ${uid}`);
    }
    for (const slug of SLUGS) {
      const courseId = slugToId.get(slug)!;
      const { error: wErr } = await sb.from("course_access").upsert(
        { user_id: uid, course_id: courseId, expires_at: EXPIRES, source: SOURCE },
        { onConflict: "user_id,course_id" },
      );
      if (wErr) { console.error(`  ✗ access ${slug}: ${wErr.message}`); process.exit(1); }
      console.log(`  ✓ pristup ${slug} do ${EXPIRES}`);
    }
  }
  console.log(`\n${WRITE ? "✓ ZAVRŠENO (bez mejlova)" : "[DRY] --write za upis"}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
