/**
 * Zatvori rupe u napretku nastale time što je „Sledeća lekcija →" na kraju vežbe
 * preskakalo dugme „Završi i nastavi" na stranici lekcije.
 *
 * Kriterijum (namerno strog): polaznik ima pokušaj na vežbi u toj lekciji,
 * lekcija mu NIJE označena kao završena, a NEKU KASNIJU lekciju istog kursa
 * jeste završio - dakle dokazano je prošao dalje, a „Nastavi" ga vraća unazad.
 * Datum završetka = datum poslednjeg pokušaja na toj lekciji.
 *
 * Suvi hod:  node scripts/backfill-lesson-progress-vezbe.mjs
 * Upis:      node scripts/backfill-lesson-progress-vezbe.mjs --upisi
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const UPISI = process.argv.includes("--upisi");
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

const lessons = await sve("lessons", "id,course_id,order_index,title");
const exercises = await sve("exercises", "id,lesson_id");
const progress = await sve("lesson_progress", "user_id,lesson_id,completed");
const attempts = await sve("exercise_attempts", "user_id,exercise_id,completed_at");
const courses = await sve("courses", "id,title");
console.log(`učitano: ${lessons.length} lekcija, ${exercises.length} vežbi, ${progress.length} napredaka, ${attempts.length} pokušaja`);

const lekcija = new Map(lessons.map((l) => [l.id, l]));
const vezbaLekcija = new Map(exercises.map((e) => [e.id, e.lesson_id]));
const naslovKursa = new Map(courses.map((c) => [c.id, c.title]));

const zavrsene = new Map(); // user_id -> Set(lesson_id)
for (const p of progress) {
  if (!p.completed) continue;
  if (!zavrsene.has(p.user_id)) zavrsene.set(p.user_id, new Set());
  zavrsene.get(p.user_id).add(p.lesson_id);
}

const najdaljeZavrseno = new Map(); // user|course -> max order_index
for (const [uid, set] of zavrsene) {
  for (const lid of set) {
    const l = lekcija.get(lid);
    if (!l) continue;
    const k = `${uid}|${l.course_id}`;
    najdaljeZavrseno.set(k, Math.max(najdaljeZavrseno.get(k) ?? -1, l.order_index));
  }
}

const rupe = new Map(); // user|lesson -> { user_id, lesson_id, completed_at, lekcija }
for (const a of attempts) {
  const lid = vezbaLekcija.get(a.exercise_id);
  if (!lid) continue;
  const l = lekcija.get(lid);
  if (!l) continue;
  if (zavrsene.get(a.user_id)?.has(lid)) continue;
  if ((najdaljeZavrseno.get(`${a.user_id}|${l.course_id}`) ?? -1) <= l.order_index) continue;
  const k = `${a.user_id}|${lid}`;
  const post = rupe.get(k);
  if (!post || a.completed_at > post.completed_at) {
    rupe.set(k, { user_id: a.user_id, lesson_id: lid, completed_at: a.completed_at, lekcija: l });
  }
}

const redovi = [...rupe.values()];
console.log(`\nrupa za zatvaranje: ${redovi.length} (polaznika: ${new Set(redovi.map((r) => r.user_id)).size})`);
const poKursu = new Map();
for (const r of redovi) poKursu.set(r.lekcija.course_id, (poKursu.get(r.lekcija.course_id) || 0) + 1);
for (const [cid, n] of [...poKursu].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${naslovKursa.get(cid) || cid}`);

const putanja = `scripts/_backfill-lesson-progress-${new Date().toISOString().slice(0, 10)}.json`;
writeFileSync(putanja, JSON.stringify(redovi.map(({ lekcija: l, ...r }) => ({ ...r, kurs: naslovKursa.get(l.course_id), lekcija: l.title })), null, 2));
console.log(`\nspisak → ${putanja}`);

if (!UPISI) {
  console.log("\nSUVI HOD - ništa nije upisano. Za upis: node scripts/backfill-lesson-progress-vezbe.mjs --upisi");
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
console.log(`\nGOTOVO: zatvoreno ${upisano} rupa.`);
