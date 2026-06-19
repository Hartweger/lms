/**
 * Uporedi LD upisane (plaćeni kursevi) sa korisnicima na novoj platformi.
 * Izlaz: ko je upisan na starom a NEMA nalog na novom (potencijalno propušten u migraciji).
 * Ulaz: /tmp/ld_enrolled_full.json (slug -> [emails]) + /tmp/ld_all_emails.json.
 *   npx tsx scripts/audit-missed-enrollments.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs"; import * as path from "path";
const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("="); if (k && v.length && !process.env[k.trim()]) process.env[k.trim()] = v.join("=").trim();
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function newEmails(): Promise<Set<string>> {
  const set = new Set<string>(); let from = 0;
  while (true) {
    const { data } = await sb.from("user_profiles").select("email").range(from, from + 999);
    if (!data || !data.length) break;
    data.forEach((r) => r.email && set.add(r.email.toLowerCase().trim()));
    if (data.length < 1000) break; from += 1000;
  }
  return set;
}

async function main() {
  const perCourse: Record<string, string[]> = JSON.parse(fs.readFileSync("/tmp/ld_enrolled_full.json", "utf-8"));
  const all: string[] = JSON.parse(fs.readFileSync("/tmp/ld_all_emails.json", "utf-8"));
  const existing = await newEmails();
  console.log(`Novih (user_profiles): ${existing.size} | LD upisanih (plaćeni, jedinstveni): ${all.length}`);

  const missed = all.filter((e) => e && !existing.has(e));
  // mapiraj svaki missed -> u kojim kursevima je
  const courseOf = new Map<string, string[]>();
  for (const [slug, emails] of Object.entries(perCourse)) {
    for (const e of emails) if (missed.includes(e)) { const a = courseOf.get(e) || []; a.push(slug); courseOf.set(e, a); }
  }
  console.log(`\n=== PROPUŠTENI (upisan na starom, nema nalog na novom): ${missed.length} ===`);
  // grupiši po domenu da iskoče korporativni/bulk upisi
  const byDomain = new Map<string, number>();
  for (const e of missed) { const d = e.split("@")[1] || "?"; byDomain.set(d, (byDomain.get(d) || 0) + 1); }
  console.log("\nPo domenu (top 25):");
  [...byDomain.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([d, n]) => console.log(`  ${String(n).padStart(4)}  ${d}`));
  console.log("\nSvi propušteni (email — kursevi):");
  for (const e of missed.sort()) console.log(`  ${e}  [${(courseOf.get(e) || []).join(", ")}]`);
  fs.writeFileSync("/tmp/missed.json", JSON.stringify(missed.map((e) => ({ email: e, courses: courseOf.get(e) || [] })), null, 2));
  console.log(`\n-> /tmp/missed.json`);
}
main().catch((e) => { console.error(e); process.exit(1); });
