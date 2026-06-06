// READ-ONLY: dump B1.1 kurs (lekcije, order_index, vežbe/testovi, pitanja) radi pregleda.
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: course } = await sb.from("courses").select("id, title, slug, description").eq("slug", "nemacki-b1-1").single();
console.log("KURS:", course?.title, course?.id);
const { data: lessons } = await sb.from("lessons").select("id, order_index, title, lesson_type, sections").eq("course_id", course.id).order("order_index");
console.log("LEKCIJA:", lessons.length);
const out = { course, lessons: [] };
for (const l of lessons) {
  const { data: exs } = await sb.from("exercises").select("id, title, exercise_type, order_index").eq("lesson_id", l.id).order("order_index");
  const lessonOut = { id: l.id, order_index: l.order_index, lesson_type: l.lesson_type, title: l.title, sections: l.sections, exercises: [] };
  for (const e of (exs || [])) {
    const { data: qs } = await sb.from("exercise_questions").select("id, order_index, question, options, correct_answer, explanation").eq("exercise_id", e.id).order("order_index");
    lessonOut.exercises.push({ ...e, questions: qs });
  }
  out.lessons.push(lessonOut);
  console.log(`  #${l.order_index} ${l.title}  (${(exs||[]).length} vežbi)`);
}
writeFileSync("scripts/b11-dump.json", JSON.stringify(out, null, 2));
console.log("\n→ pun dump u scripts/b11-dump.json");
