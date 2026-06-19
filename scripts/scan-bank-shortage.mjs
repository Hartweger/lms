// READ-ONLY: nalazi fill_blank pitanja gde tačan odgovor traži neku reč VIŠE puta
// nego što je ima u banci (options.items). Primer: odgovor "war, hatte, war" (war 2x)
// a banka ["war","hatte","ist","hat"] (war 1x) -> polaznik ne može da popuni 3. prazninu.
// Komponenta prati iskorišćenost po indeksu, pa je rešenje: dodati nedostajuće kopije u banku.
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function parseOptions(opts) {
  if (opts && typeof opts === "object" && !Array.isArray(opts) && opts.type) {
    return { type: opts.type, items: opts.items ?? null };
  }
  if (Array.isArray(opts)) return { type: "quiz", items: opts };
  if (typeof opts === "string") {
    try {
      const parsed = JSON.parse(opts);
      if (parsed && typeof parsed === "object" && parsed.type) return { type: parsed.type, items: parsed.items };
      if (Array.isArray(parsed)) return { type: "quiz", items: parsed };
    } catch { /* not JSON */ }
  }
  return { type: "quiz", items: null };
}

const counts = (arr) => {
  const m = new Map();
  for (const x of arr) { const k = String(x).trim().toLowerCase(); m.set(k, (m.get(k) || 0) + 1); }
  return m;
};

const { data: courses } = await sb.from("courses").select("id, title, slug").order("title");
const findings = [];

for (const course of courses) {
  const { data: lessons } = await sb.from("lessons").select("id, title, order_index").eq("course_id", course.id).order("order_index");
  for (const lesson of lessons || []) {
    const { data: exercises } = await sb.from("exercises").select("id, title").eq("lesson_id", lesson.id).order("order_index");
    for (const ex of exercises || []) {
      const { data: qs } = await sb.from("exercise_questions")
        .select("id, order_index, question, options, correct_answer").eq("exercise_id", ex.id).order("order_index");
      for (const q of qs || []) {
        const { type, items } = parseOptions(q.options);
        if (type !== "fill_blank" || !Array.isArray(items)) continue;
        const answers = (q.correct_answer || "").split(",").map((a) => a.trim()).filter(Boolean);
        if (answers.length === 0) continue;

        const need = counts(answers);
        const have = counts(items);
        const shortages = [];
        for (const [word, n] of need) {
          const h = have.get(word) || 0;
          if (h < n) shortages.push({ word, need: n, have: h, add: n - h });
        }
        if (shortages.length) {
          findings.push({
            course: course.slug, lesson: lesson.title, lesson_id: lesson.id,
            exercise: ex.title, exercise_id: ex.id,
            question_id: q.id, q_order: q.order_index,
            question: q.question, items, correct_answer: q.correct_answer, shortages,
          });
        }
      }
    }
  }
  process.stdout.write(`${course.slug}: skenirano\n`);
}

writeFileSync("scripts/bank-shortage-report.json", JSON.stringify(findings, null, 2));
console.log(`\nUKUPNO PROBLEMA: ${findings.length}\n`);
for (const f of findings) {
  console.log(`• ${f.course} | ${f.lesson.slice(0, 35)} | ${f.exercise.slice(0, 25)}`);
  console.log(`    Q: ${JSON.stringify(f.question).slice(0, 110)}`);
  console.log(`    banka: [${f.items.join(", ")}]  | CA: ${f.correct_answer}`);
  console.log(`    fali: ${f.shortages.map((s) => `${s.word} x${s.add}`).join(", ")}`);
}
const byCourse = {};
for (const f of findings) byCourse[f.course] = (byCourse[f.course] || 0) + 1;
console.table(byCourse);
