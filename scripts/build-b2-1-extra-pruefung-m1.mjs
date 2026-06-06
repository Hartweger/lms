// B2.1 — "EXTRA Prüfung (Modul 1)": prava Leseverstehen vežba (Zuordnung Jakob/Anja/Marcel).
// Tekst ide u options.context (grupni ispitni prikaz). Zadržava uvodni tekst. Idempotentno. --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const CID = "3729f3f5-2582-44ff-bb10-c4cc2ab5676b";
const TITLE = "EXTRA Prüfung (Modul 1)";
const EX = "Leseverstehen – Modul 1";

const CONTEXT = `**Veränderungen wagen – glücklich werden**

**Jakob Graf, 40, Pädagoge, Berlin:** 35 Jahre lang habe ich in einer Großstadt gelebt – viel Lärm, Staub und Stress. Je älter ich wurde, desto mehr habe ich mich nach Ruhe und Natur gesehnt. Ich wollte nah am Wasser wohnen, am liebsten auf einem eigenen Hausboot. Ein Baukredit und die Unterstützung meines Vaters haben geholfen. Seit einem Jahr wohne ich auf meinem Hausboot und gebe als Pädagoge meine Begeisterung fürs Wasser an Kinder weiter.

**Anja Weber, 33, Surflehrerin, Kiel:** Nach dem Abitur habe ich eine Ausbildung zur Bürokauffrau gemacht, aber im Büro fühlte ich mich eingesperrt. Es hat fünf Jahre gedauert, bis ich all meinen Mut zusammengenommen habe. Ein alter Schulfreund hat mich beraten; zusammen haben wir eine Surfschule gegründet und ich habe gekündigt. Meine finanzielle Situation ist jetzt unsicherer, aber ich bin sehr zufrieden.

**Marcel Lauber, 50, Unternehmensberater, Hamburg:** Ich habe schnell Karriere gemacht und stand jeden Tag unter Druck. Vor fünf Jahren hatte ich völlig erschöpft einen Unfall – ein Schock und der entscheidende Wendepunkt. Ich habe ein Jahr Urlaub genommen und angefangen zu meditieren. Den Job habe ich nicht gewechselt, aber meine Einstellung. Ich versuche jetzt, auch mal „Nein" zu sagen – meine Gesundheit ist mir wichtiger als die Karriere.`;

const ITEMS = ["Jakob (Pädagoge)", "Anja (Surflehrerin)", "Marcel (Unternehmensberater)"];
// [pitanje, tačanIndex]
const Q = [
  ["Wer wohnt heute auf einem Hausboot?", 0],
  ["Wer hat den Beruf gewechselt und unterrichtet jetzt Surfen?", 1],
  ["Bei wem war ein Unfall der entscheidende Wendepunkt?", 2],
  ["Wer hat eine einjährige Pause gemacht und angefangen zu meditieren?", 2],
  ["Wessen finanzielle Situation ist heute unsicherer?", 1],
  ["Wer wollte näher an der Natur und am Wasser leben?", 0],
  ["Wer sagt bei der Arbeit jetzt auch mal „Nein\"?", 2],
  ["Wer hat Unterstützung von einem alten Schulfreund bekommen?", 1],
];

const { data: lesson } = await sb.from("lessons").select("id").eq("course_id", CID).eq("title", TITLE).single();
console.log(`Lekcija "${TITLE}": ${lesson.id} | pitanja: ${Q.length}`);
if (!APPLY) { console.log("[DRY] --apply za upis."); process.exit(0); }

await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("title", EX);
const { data: ex, error: exErr } = await sb.from("exercises").insert({
  lesson_id: lesson.id, title: EX, exercise_type: "quiz", order_index: 0,
}).select("id").single();
if (exErr) throw exErr;
let i = 0;
for (const [q, correct] of Q) {
  const { error } = await sb.from("exercise_questions").insert({
    exercise_id: ex.id, question: q, options: { type: "quiz", items: ITEMS, context: { type: "text", title: "Veränderungen wagen – glücklich werden", content: CONTEXT } },
    correct_answer: String(correct), question_type: "quiz", order_index: i++,
  });
  if (error) throw error;
}
console.log(`✓ Upisana Leseverstehen vežba (${Q.length} pit.) u "${TITLE}"`);
