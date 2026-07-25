// C1.1 — mini vežbe + Selbstkontrolle testovi po lekciji za nemacki-c1-1.
// Podaci: scripts/c1-1-data/vezbe-modul-{1..4}.json. Idempotentno (vežba po naslovu,
// pitanja se zamenjuju). --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const data = [1, 2, 3, 4].map((n) => JSON.parse(readFileSync(`scripts/c1-1-data/vezbe-modul-${n}.json`, "utf8")));
const allLessons = data.flatMap((d) => d.lessons);

// ---- validacija
const okTypes = new Set(["quiz", "fill_blank", "word_order", "match_pairs", "true_false"]);
let totalEx = 0, totalQ = 0;
for (const l of allLessons) {
  for (const ex of l.exercises) {
    totalEx++;
    for (const q of ex.questions) {
      totalQ++;
      const t = q.question_type;
      if (!okTypes.has(t)) throw new Error(`Nepoznat question_type "${t}" u "${ex.title}"`);
      if (t !== q.options?.type) throw new Error(`options.type != question_type u "${ex.title}"`);
      if (t === "quiz") {
        const i = Number(q.correct_answer);
        if (!Number.isInteger(i) || i < 0 || i >= q.options.items.length)
          throw new Error(`quiz correct_answer van opsega u "${ex.title}": ${q.correct_answer}`);
      }
      if (t === "fill_blank") {
        const blanks = (q.question.match(/______/g) || []).length;
        const answers = q.correct_answer.split(",").map((s) => s.trim()).filter(Boolean).length;
        if (blanks === 0 || blanks !== answers)
          throw new Error(`fill_blank neusklađeno (${blanks} praznina, ${answers} odgovora) u "${ex.title}"`);
      }
      if (t === "word_order") {
        const joined = [...q.options.items].sort().join("|");
        const target = q.correct_answer.split(" ");
        // delovi moraju da rekonstruišu correct_answer (multiset provera preko dužine)
        if (q.options.items.join(" ").length !== q.correct_answer.length)
          throw new Error(`word_order delovi ne rekonstruišu odgovor u "${ex.title}": "${q.correct_answer}"`);
        void joined; void target;
      }
    }
  }
}
console.log(`Plan: ${allLessons.length} lekcija, ${totalEx} vežbi, ${totalQ} pitanja. APPLY=${APPLY}`);

// ---- kurs + lekcije
const { data: course, error: cErr } = await sb.from("courses").select("id").eq("slug", "nemacki-c1-1").single();
if (cErr) throw cErr;
const { data: lessons, error: lErr } = await sb.from("lessons").select("id,title").eq("course_id", course.id);
if (lErr) throw lErr;
const lessonByTitle = new Map(lessons.map((l) => [l.title, l.id]));

for (const l of allLessons) {
  const lessonId = lessonByTitle.get(l.lessonTitle);
  if (!lessonId) throw new Error(`Lekcija nije nađena u bazi: "${l.lessonTitle}"`);
  for (let i = 0; i < l.exercises.length; i++) {
    const ex = l.exercises[i];
    let { data: row } = await sb.from("exercises").select("id").eq("lesson_id", lessonId).eq("title", ex.title).maybeSingle();
    if (!row) {
      console.log(`+ [${l.lessonTitle}] ${ex.title} (${ex.questions.length} pit.)`);
      if (APPLY) {
        const { data: ins, error } = await sb
          .from("exercises")
          .insert({ lesson_id: lessonId, title: ex.title, exercise_type: ex.exercise_type ?? "quiz", order_index: i + 1 })
          .select("id")
          .single();
        if (error) throw error;
        row = ins;
      }
    } else {
      console.log(`~ [${l.lessonTitle}] ${ex.title} — zamenjujem pitanja (${ex.questions.length})`);
      if (APPLY) {
        const { error: uErr } = await sb.from("exercises").update({ order_index: i + 1 }).eq("id", row.id);
        if (uErr) throw uErr;
        const { error: dErr } = await sb.from("exercise_questions").delete().eq("exercise_id", row.id);
        if (dErr) throw dErr;
      }
    }
    if (APPLY && row) {
      const rows = ex.questions.map((q, j) => ({
        exercise_id: row.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation ?? null,
        question_type: q.question_type,
        order_index: j + 1,
      }));
      const { error } = await sb.from("exercise_questions").insert(rows);
      if (error) throw error;
    }
  }
}

// ---- izveštaj o nesigurnostima
for (const l of allLessons) {
  for (const u of l.uncertainties ?? []) console.log(`? [${l.lessonTitle}] ${u}`);
  for (const s of l.skipped ?? []) console.log(`- [${l.lessonTitle}] preskočeno: ${s}`);
}
console.log(APPLY ? "GOTOVO (apply)." : "GOTOVO (dry-run). Pokreni sa --apply.");
