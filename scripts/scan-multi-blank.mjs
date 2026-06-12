// READ-ONLY: skenira sva pitanja u svim kursevima i nalazi:
//  1) quiz pitanja (jedan izbor) čiji tekst ima 2+ praznine  → polaznik može da odgovori samo jednom
//  2) fill_blank pitanja sa pogrešnim markerima (nije tačno ______) ili
//     brojem odgovora koji se ne poklapa sa brojem praznina
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// replika parseOptions iz ExerciseRunner.tsx
function parseOptions(opts, correctAnswer) {
  if (!opts) {
    const ca = (correctAnswer || "").toLowerCase();
    if (ca === "true" || ca === "false") return { type: "true_false", items: null };
    return { type: "quiz", items: [] };
  }
  if (typeof opts === "object" && !Array.isArray(opts) && opts !== null) {
    if (opts.type) return { type: opts.type, items: opts.items ?? null };
  }
  if (Array.isArray(opts)) return { type: "quiz", items: opts };
  if (typeof opts === "string") {
    try {
      const parsed = JSON.parse(opts);
      if (typeof parsed === "object" && parsed?.type) return { type: parsed.type, items: parsed.items };
      if (Array.isArray(parsed)) return { type: "quiz", items: parsed };
    } catch { /* not JSON */ }
    return { type: "quiz", items: [opts] };
  }
  return { type: "quiz", items: [] };
}

const { data: courses } = await sb.from("courses").select("id, title, slug").order("title");
const findings = [];

for (const course of courses) {
  const { data: lessons } = await sb.from("lessons").select("id, title, order_index").eq("course_id", course.id).order("order_index");
  for (const lesson of lessons || []) {
    const { data: exercises } = await sb.from("exercises").select("id, title, exercise_type, order_index").eq("lesson_id", lesson.id).order("order_index");
    for (const ex of exercises || []) {
      const { data: qs } = await sb.from("exercise_questions")
        .select("id, order_index, question, options, correct_answer, explanation")
        .eq("exercise_id", ex.id).order("order_index");
      for (const q of qs || []) {
        const text = q.question || "";
        const { type: qType, items } = parseOptions(q.options, q.correct_answer);
        const runs = text.match(/_{2,}/g) || [];
        const problems = [];

        if ((qType === "quiz" || qType === "conversation" || qType === "typing") && runs.length >= 2) {
          problems.push(`${qType} sa ${runs.length} praznine — moguć samo 1 odgovor`);
        }
        if (qType === "fill_blank") {
          const componentBlanks = (text.match(/______/g) || []).length || 1;
          const answers = (q.correct_answer || "").split(",").map((a) => a.trim()).filter(Boolean);
          const badRuns = runs.filter((r) => r.length !== 6);
          if (badRuns.length) problems.push(`markeri nisu ______ (dužine: ${runs.map((r) => r.length).join(",")})`);
          if (answers.length !== componentBlanks) problems.push(`${componentBlanks} praznina ↔ ${answers.length} odgovora`);
          if (runs.length === 0) problems.push("fill_blank bez ijedne praznine u tekstu");
        }

        if (problems.length) {
          findings.push({
            course: course.slug, lesson: lesson.title, lesson_id: lesson.id,
            exercise: ex.title, exercise_id: ex.id, exercise_type: ex.exercise_type,
            question_id: q.id, q_order: q.order_index, qType, problems,
            question: text, options: items, correct_answer: q.correct_answer,
          });
        }
      }
    }
  }
  process.stdout.write(`${course.slug}: skenirano\n`);
}

writeFileSync("scripts/multi-blank-report.json", JSON.stringify(findings, null, 2));
console.log(`\nUKUPNO PROBLEMA: ${findings.length}`);
const byCourse = {};
for (const f of findings) byCourse[f.course] = (byCourse[f.course] || 0) + 1;
console.table(byCourse);
