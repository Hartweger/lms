// Popravlja fill_blank pitanja iz scripts/multi-blank-report.json:
// svaki niz od 2+ donjih crta u tekstu pitanja normalizuje na tačno ______ (6 crta),
// što FillBlankExercise prepoznaje kao prazninu. Odgovori u bazi su već ispravni.
// Pokretanje: node scripts/fix-multi-blank.mjs          (dry-run)
//             node scripts/fix-multi-blank.mjs --apply  (upis u bazu)
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const report = JSON.parse(readFileSync("scripts/multi-blank-report.json", "utf8"));
const targets = report.filter((f) => f.qType === "fill_blank");
console.log(`${APPLY ? "UPIS" : "DRY-RUN"} — ${targets.length} pitanja\n`);

let changed = 0;
for (const f of targets) {
  const { data: q, error } = await sb.from("exercise_questions")
    .select("id, question, correct_answer").eq("id", f.question_id).single();
  if (error || !q) { console.log("⚠ ne mogu da učitam", f.question_id, error?.message); continue; }

  const newText = q.question.replace(/_{2,}/g, "______");
  const blanks = (newText.match(/______/g) || []).length;
  const answers = (q.correct_answer || "").split(",").map((a) => a.trim()).filter(Boolean);
  if (newText === q.question) { console.log("· bez izmene:", f.course, f.lesson.slice(0, 30)); continue; }
  if (blanks !== answers.length) {
    console.log(`⚠ PRESKOČENO (${blanks} praznina ↔ ${answers.length} odgovora):`, f.course, JSON.stringify(q.question).slice(0, 120));
    continue;
  }

  console.log(`✓ ${f.course} | ${f.lesson.slice(0, 35)}`);
  console.log(`   pre:  ${JSON.stringify(q.question).slice(0, 130)}`);
  console.log(`   posle:${JSON.stringify(newText).slice(0, 130)}   CA: ${q.correct_answer}`);
  if (APPLY) {
    const { error: upErr } = await sb.from("exercise_questions").update({ question: newText }).eq("id", q.id);
    if (upErr) { console.log("   ⚠ UPDATE GREŠKA:", upErr.message); continue; }
  }
  changed++;
}
console.log(`\n${APPLY ? "Izmenjeno" : "Za izmenu"}: ${changed}/${targets.length}`);
