// B1.2 — zameni em-dash (—, U+2014) en-dashom (–, U+2013) u svom prikaznom tekstu lekcija.
// Takođe u tekstovima Schreiben zadataka (exercise_questions). Dry-run; --apply za upis.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const EM = "—", EN = "–";

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: lessons } = await sb.from("lessons").select("id, order_index, title, sections").eq("course_id", course.id).order("order_index");

let total = 0, titleTotal = 0;
for (const l of lessons) {
  const s = JSON.stringify(l.sections);
  const c = s.split(EM).length - 1;
  const tc = (l.title || "").split(EM).length - 1;
  if (!c && !tc) continue;
  total += c; titleTotal += tc;
  console.log(`#${l.order_index} ${l.title}: ${c}× u tekstu${tc ? `, ${tc}× u naslovu` : ""}`);
  if (APPLY) {
    const upd = {};
    if (c) upd.sections = JSON.parse(s.split(EM).join(EN));
    if (tc) upd.title = l.title.split(EM).join(EN);
    const { error } = await sb.from("lessons").update(upd).eq("id", l.id);
    console.log(error ? "   ✗ " + error.message : "   ✓ upisano");
  }
}

// Schreiben zadaci (exercise_questions vezani za lekcije ovog kursa)
const lessonIds = lessons.map((l) => l.id);
const { data: exs } = await sb.from("exercises").select("id").in("lesson_id", lessonIds);
const exIds = (exs || []).map((e) => e.id);
let qTotal = 0;
if (exIds.length) {
  const { data: qs } = await sb.from("exercise_questions").select("id, question").in("exercise_id", exIds);
  for (const q of qs || []) {
    const c = (q.question || "").split(EM).length - 1;
    if (!c) continue;
    qTotal += c;
    console.log(`question ${q.id.slice(0, 8)}: ${c}× —`);
    if (APPLY) {
      const { error } = await sb.from("exercise_questions").update({ question: q.question.split(EM).join(EN) }).eq("id", q.id);
      console.log(error ? "   ✗ " + error.message : "   ✓ upisano");
    }
  }
}

console.log(`\nUkupno: ${total} u tekstu lekcija + ${titleTotal} u naslovima + ${qTotal} u zadacima.`);
if (!APPLY) console.log("Dry-run — pokreni sa --apply za upis.");
