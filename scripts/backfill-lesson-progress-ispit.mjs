/**
 * Zatvori lekcije ZAVRŠNOG ISPITA (Modelltest / Završni ispit) koje su ostale
 * neoznačene iako je polaznik uradio sve delove.
 *
 * Zašto: lekcija ispita namerno nema dugme „Završi lekciju", a do 06.09.2026
 * nije postojalo ni automatsko zatvaranje - pa je svako ko je uradio ceo ispit
 * ostao na „još jedna lekcija". Backfill od 06.09 (backfill-lesson-progress-vezbe)
 * je poslednje lekcije namerno preskočio.
 *
 * Kriterijum (isti kao u src/lib/lesson-complete.ts): SVAKA vežba u lekciji
 * ispita ima pokušaj (exercise_attempts) ili predat esej (essay_submissions),
 * a lekcija nije označena. Datum završetka = poslednji pokušaj/predaja u lekciji.
 *
 * Suvi hod:  node scripts/backfill-lesson-progress-ispit.mjs
 * Upis:      node scripts/backfill-lesson-progress-ispit.mjs --upisi
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const UPISI = process.argv.includes("--upisi");
// Mora da se poklapa sa isExamLessonTitle u src/lib/exam-lesson.ts.
const ISPIT = /Modelltest|Završni ispit/;

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Supabase tiho seče na 1000 redova - sve tabele se čitaju stranicu po stranicu.
async function sve(table, sel) {
  const out = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await sb.from(table).select(sel).range(from, from + size - 1);
    if (error) throw error;
    out.push(...data);
    if (data.length < size) break;
  }
  return out;
}

const lessons = (await sve("lessons", "id,course_id,order_index,title")).filter((l) => ISPIT.test(l.title || ""));
const ispitId = new Set(lessons.map((l) => l.id));
const exercises = (await sve("exercises", "id,lesson_id")).filter((e) => ispitId.has(e.lesson_id));
const progress = await sve("lesson_progress", "user_id,lesson_id,completed");
const attempts = await sve("exercise_attempts", "user_id,exercise_id,completed_at");
const submissions = await sve("essay_submissions", "user_id,exercise_id,submitted_at");
const courses = await sve("courses", "id,title");
console.log(`učitano: ${lessons.length} lekcija ispita, ${exercises.length} vežbi u njima, ${progress.length} napredaka, ${attempts.length} pokušaja, ${submissions.length} eseja`);

const lekcija = new Map(lessons.map((l) => [l.id, l]));
const vezbaLekcija = new Map(exercises.map((e) => [e.id, e.lesson_id]));
const naslovKursa = new Map(courses.map((c) => [c.id, c.title]));
const vezbeLekcije = new Map(); // lesson_id -> Set(exercise_id)
for (const e of exercises) {
  if (!vezbeLekcije.has(e.lesson_id)) vezbeLekcije.set(e.lesson_id, new Set());
  vezbeLekcije.get(e.lesson_id).add(e.id);
}

const zavrseno = new Set(progress.filter((p) => p.completed).map((p) => `${p.user_id}|${p.lesson_id}`));

// user|lesson -> { uradjeno: Set(exercise_id), poslednje: ISO }
const stanje = new Map();
function zabelezi(user_id, exercise_id, kad) {
  const lid = vezbaLekcija.get(exercise_id);
  if (!lid) return;
  const k = `${user_id}|${lid}`;
  if (!stanje.has(k)) stanje.set(k, { user_id, lesson_id: lid, uradjeno: new Set(), poslednje: "" });
  const s = stanje.get(k);
  s.uradjeno.add(exercise_id);
  if (kad && kad > s.poslednje) s.poslednje = kad;
}
for (const a of attempts) zabelezi(a.user_id, a.exercise_id, a.completed_at);
for (const s of submissions) zabelezi(s.user_id, s.exercise_id, s.submitted_at);

const redovi = [];
for (const s of stanje.values()) {
  if (zavrseno.has(`${s.user_id}|${s.lesson_id}`)) continue;
  const sveVezbe = vezbeLekcije.get(s.lesson_id);
  if (!sveVezbe || sveVezbe.size === 0) continue;
  if (![...sveVezbe].every((id) => s.uradjeno.has(id))) continue;
  redovi.push({ user_id: s.user_id, lesson_id: s.lesson_id, completed_at: s.poslednje, lekcija: lekcija.get(s.lesson_id) });
}

console.log(`\nispita za zatvaranje: ${redovi.length} (polaznika: ${new Set(redovi.map((r) => r.user_id)).size})`);
const poKursu = new Map();
for (const r of redovi) poKursu.set(r.lekcija.course_id, (poKursu.get(r.lekcija.course_id) || 0) + 1);
for (const [cid, n] of [...poKursu].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${naslovKursa.get(cid) || cid}`);

const putanja = `scripts/_backfill-lesson-progress-ispit-${new Date().toISOString().slice(0, 10)}.json`;
writeFileSync(putanja, JSON.stringify(redovi.map(({ lekcija: l, ...r }) => ({ ...r, kurs: naslovKursa.get(l.course_id), lekcija: l.title })), null, 2));
console.log(`\nspisak → ${putanja}`);

if (!UPISI) {
  console.log("\nSUVI HOD - ništa nije upisano. Za upis: node scripts/backfill-lesson-progress-ispit.mjs --upisi");
  process.exit(0);
}

let upisano = 0;
for (let i = 0; i < redovi.length; i += 200) {
  const deo = redovi.slice(i, i + 200).map((r) => ({
    user_id: r.user_id,
    lesson_id: r.lesson_id,
    completed: true,
    completed_at: r.completed_at,
  }));
  const { error } = await sb.from("lesson_progress").upsert(deo, { onConflict: "user_id,lesson_id" });
  if (error) { console.error("GREŠKA:", error); process.exit(1); }
  upisano += deo.length;
  console.log(`  upisano ${upisano}/${redovi.length}`);
}
console.log(`\nGOTOVO: zatvoreno ${upisano} ispita.`);
