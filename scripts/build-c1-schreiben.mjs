// C1 Schreiben test → lekcija "SCHREIBEN C1". 2 essay zadatka (Teil 1, Teil 2).
// Briše postojeće essay vežbe na toj lekciji pa upiše ove. Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const EX_TITLE = "Schreiben — Modelltest C1";

const TEIL1 = [
  "Teil 1 (vorgeschlagene Arbeitszeit: 50 Minuten)", "",
  "Für das Internetforum „Politische Bildung“ verfassen Sie einen Diskussionsbeitrag zu diesem Thema:", "",
  "Politikmüdigkeit – die da oben und wir da unten",
  "Haben wir das Interesse an Politik verloren?", "",
  "– Erläutern Sie anhand von Beispielen, wie Sie sich politische Mitbestimmung vorstellen.",
  "– Nennen Sie Gründe, warum sich viele Menschen nicht für Politik interessieren.",
  "– Argumentieren Sie für oder gegen eine Wahlpflicht.",
  "– Nennen Sie Maßnahmen, wie man das Interesse an Politik stärken kann.", "",
  "Schreiben Sie circa 230 Wörter.",
].join("\n");

const TEIL2 = [
  "Teil 2 (vorgeschlagene Arbeitszeit: 25 Minuten)", "",
  "Sie haben ein Zimmer in einem Studierendenwohnheim in Deutschland. Vom nächsten Semester an soll die monatliche Warmmiete von 400 € auf 600 € erhöht werden. Schreiben Sie eine Beschwerde an den Leiter des Studierendenwerks, Herrn Frank.", "",
  "– Eröffnen Sie Ihr Schreiben höflich, indem Sie Verständnis für Sachzwänge zeigen.",
  "– Nennen Sie Probleme, die durch die Mieterhöhung entstehen könnten.",
  "– Beschreiben Sie die Wichtigkeit des Studierendenwohnheims für die Studierenden.",
  "– Machen Sie einen Kompromissvorschlag.", "",
  "Schreiben Sie ca. 120 Wörter.",
].join("\n");

const { data: course } = await sb.from("courses").select("id").eq("slug", "polozi-goethe-c1").single();
const { data: lesson } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", "SCHREIBEN C1").single();
console.log(`SCHREIBEN C1 lekcija: ${lesson.id}`);
if (!APPLY) { console.log("[DRY] dodaj --apply za upis (briše stare essay vežbe pa upiše Teil 1 + Teil 2)."); process.exit(0); }

await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("exercise_type", "essay");
const { data: ex, error: exErr } = await sb.from("exercises").insert({ lesson_id: lesson.id, title: EX_TITLE, exercise_type: "essay", order_index: 0 }).select("id").single();
if (exErr) { console.log("ERR ex:", exErr.message); process.exit(1); }
let i = 0;
for (const task of [TEIL1, TEIL2]) {
  const { error } = await sb.from("exercise_questions").insert({
    exercise_id: ex.id, question: task, options: { type: "essay" }, correct_answer: "", question_type: "essay", order_index: i++,
  });
  if (error) { console.log("ERR q", i, error.message); process.exit(1); }
}
console.log(`✓ "${EX_TITLE}": 2 Schreiben zadatka na SCHREIBEN C1`);
