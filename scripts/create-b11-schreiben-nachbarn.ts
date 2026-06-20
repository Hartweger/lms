/**
 * Kreira Schreiben lekciju „Schreiben B1 — Entschuldigung an die Nachbarn" u Nemački B1.1 (Modul 7).
 * Pisanje = essay vežba (polje + slanje profesorki). Tekst DOSLOVNO.
 * Privremeni order_index = 106. Idempotentno.
 * Run: npx tsx scripts/create-b11-schreiben-nachbarn.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [key, ...v] = line.split("=");
  if (key && v.length > 0) process.env[key.trim()] = v.join("=").trim();
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const B11_COURSE = "b8c765b7-c377-4941-a1f9-ebe39372fe4a";
const TITLE = "Schreiben B1 — Entschuldigung an die Nachbarn";
const EX_TITLE = "Schreiben B1 — E-Mail an die Nachbarn";

const TASK =
  "Schreiben Sie eine E-Mail an Ihre Nachbarn.\n\n" +
  "Situation: Sie haben in Ihrer Wohnung Geburtstag gefeiert. Leider waren Ihre Gäste bis 2 Uhr morgens so laut, dass die Nachbarn sogar die Polizei gerufen haben.\n\n" +
  "Entschuldigen Sie sich höflich und laden Sie Ihre Nachbarn als Entschuldigung zu einem kleinen Essen in Ihre Wohnung ein. Schreiben Sie circa 40 Wörter. Denken Sie auch an die Anrede und einen passenden Gruß am Schluss.";

const sections = [
  { type: "badge", module: "Modul 7", category: "schreiben" },
  { type: "text", style: "info",
    content: "Vežba pisanja (**Schreiben**). Pročitaj situaciju, pa napiši mejl (~40 reči) u polje na dnu i pošalji ga profesorki na pregled." },
  { type: "text", style: "default",
    content: "## Schreiben · E-Mail an die Nachbarn\n\n**Situation:** Sie haben in Ihrer Wohnung Geburtstag gefeiert. Leider waren Ihre Gäste bis 2 Uhr morgens so laut, dass die Nachbarn sogar die Polizei gerufen haben.\n\nSchreiben Sie eine E-Mail an Ihre Nachbarn. Entschuldigen Sie sich höflich und laden Sie Ihre Nachbarn als Entschuldigung zu einem kleinen Essen in Ihre Wohnung ein. Schreiben Sie circa 40 Wörter. Denken Sie auch an die Anrede und einen passenden Gruß am Schluss." },
  { type: "text", style: "default",
    content: "Napiši svoj mejl u polje ispod i klikni **Pošalji** — profesorka će ti pregledati rad i dati ocenu i komentar." },
  { type: "exercise", title: EX_TITLE },
];

async function main() {
  let { data: lesson } = await supabase
    .from("lessons").select("id").eq("course_id", B11_COURSE).eq("title", TITLE).maybeSingle();
  if (!lesson) {
    const { data, error } = await supabase
      .from("lessons")
      .insert({ course_id: B11_COURSE, title: TITLE, order_index: 106, lesson_type: "text", is_free_preview: false, sections })
      .select("id").single();
    if (error) { console.error("insert lesson:", error.message); process.exit(1); }
    lesson = data;
    console.log(`✓ Lekcija kreirana (id=${lesson.id})`);
  } else {
    await supabase.from("lessons").update({ sections }).eq("id", lesson.id);
    console.log(`✓ Lekcija postoji — sadržaj ažuriran (id=${lesson.id})`);
  }

  const { data: existingEx } = await supabase.from("exercises").select("id, exercise_type, order_index").eq("lesson_id", lesson.id);
  let exId = (existingEx ?? []).find((e) => e.exercise_type === "essay")?.id;
  if (!exId) {
    const nextOrder = (existingEx ?? []).reduce((mx, e) => Math.max(mx, e.order_index ?? 0), 0) + 1;
    const { data: ex, error: e1 } = await supabase
      .from("exercises").insert({ lesson_id: lesson.id, title: EX_TITLE, exercise_type: "essay", order_index: nextOrder }).select("id").single();
    if (e1) { console.error("exercises:", e1.message); process.exit(1); }
    exId = ex.id;
    const { error: e2 } = await supabase.from("exercise_questions").insert({
      exercise_id: exId, question: TASK, options: null, correct_answer: "essay", explanation: null, audio_url: null, order_index: 0,
    });
    if (e2) { console.error("exercise_questions:", e2.message); process.exit(1); }
    console.log(`✓ Essay vežba kreirana (exercise ${exId})`);
  } else {
    await supabase.from("exercises").update({ title: EX_TITLE }).eq("id", exId);
    const { data: q } = await supabase.from("exercise_questions").select("id").eq("exercise_id", exId).order("order_index").limit(1).maybeSingle();
    if (q) await supabase.from("exercise_questions").update({ question: TASK }).eq("id", q.id);
    console.log(`✓ Essay vežba postoji — task ažuriran (exercise ${exId})`);
  }
  console.log(`✅ GOTOVO. Lesson id=${lesson.id}`);
}
main();
