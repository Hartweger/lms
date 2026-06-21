/** B1.2 Modul 3 Prüfung — prebaci R/F na true_false; Hören: svaka tvrdnja ISPOD svog audija.
 *  Dry-run; --apply za upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const TITLE = "Prüfung - Lesen und Hören (Modul 3)";
const LESEN_EX = "Lesen - richtig oder falsch?";

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: lesson } = await sb.from("lessons").select("id, sections").eq("course_id", course.id).eq("title", TITLE).single();
const LID = lesson.id;

const lesenAussagen = [
  ["Vera und ihr Mann sind getrennt zu ihren Freunden gefahren.", "true"],
  ["Kurz nach ihrer Ankunft hat Vera die Tüte weggeworfen.", "true"],
  ["Als Vera von der Tüte in der Tonne erzählte, wurde Max wütend.", "false"],
  ["In der Tüte waren sowohl Kleidung als auch Max’ Schlüssel.", "false"],
  ["Die Polizei fand es lustig, was Vera und Max passiert ist.", "true"],
  ["Max stellte fest, dass in der Tüte ein paar Dinge fehlten.", "false"],
];
const hoeren = [
  ["Der Sieger des Kochwettbewerbs bekommt auch Geschirr.", "true"],
  ["Den Autofahrern kommt auf der A43 ein Fahrzeug entgegen.", "false"],
  ["Für den Alpenrand werden Regen oder Schnee vorhergesagt.", "true"],
  ["Es wurde abgestimmt, welche Firma den besten Kaffee herstellt.", "true"],
  ["Auf snackbox.de kann man sich eigene Snacks zusammenstellen.", "true"],
];

// audio URL-ovi iz postojećih sekcija
const audioUrls = lesson.sections.filter((s) => s.type === "audio").map((s) => s.url);
if (audioUrls.length !== 5) { console.log("⚠️ očekivano 5 audija, nađeno", audioUrls.length); process.exit(1); }

// nove sekcije
const reading = lesson.sections.find((s) => s.type === "text" && /Manchmal geht halt etwas schief/.test(s.content || ""));
const sections = [
  { type: "badge", module: "Modul 3 · Werbung und Konsum", pruefung: true },
  { type: "text", style: "uebung", content: "## Lesen\n\nLesen Sie den Text und die Aufgaben 1 bis 6. Wählen Sie: Sind die Aussagen richtig oder falsch?" },
  reading,
  { type: "exercise", title: LESEN_EX },
  { type: "text", style: "uebung", content: "## Hören\n\nSie hören fünf Texte. Zu jedem Text gibt es eine Aussage. Sie hören die Texte zweimal. Hört jeden Text und entscheidet: richtig oder falsch?" },
];
hoeren.forEach((_, i) => {
  sections.push({ type: "audio", url: audioUrls[i], label: `Text ${i + 1}` });
  sections.push({ type: "exercise", title: `Hören - Text ${i + 1}` });
});

console.log("Sekcije:", sections.map((s) => s.type + (s.title ? `(${s.title})` : (s.label ? `(${s.label})` : ""))).join(", "));

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

// obriši stare vežbe
const { data: oldEx } = await sb.from("exercises").select("id").eq("lesson_id", LID);
for (const e of oldEx || []) { await sb.from("exercise_questions").delete().eq("exercise_id", e.id); await sb.from("exercises").delete().eq("id", e.id); }

await sb.from("lessons").update({ sections }).eq("id", LID);

// Lesen true_false (6 pitanja)
const { data: lex } = await sb.from("exercises").insert({ lesson_id: LID, title: LESEN_EX, exercise_type: "true_false", order_index: 1 }).select("id").single();
let oi = 1;
for (const [q, a] of lesenAussagen) {
  await sb.from("exercise_questions").insert({ exercise_id: lex.id, question: q, question_type: "true_false", correct_answer: a, explanation: null, order_index: oi++ });
}
// Hören: 5 zasebnih true_false (1 pitanje), svaka pod svojim audijem
for (let i = 0; i < hoeren.length; i++) {
  const { data: hex } = await sb.from("exercises").insert({ lesson_id: LID, title: `Hören - Text ${i + 1}`, exercise_type: "true_false", order_index: 10 + i }).select("id").single();
  await sb.from("exercise_questions").insert({ exercise_id: hex.id, question: hoeren[i][0], question_type: "true_false", correct_answer: hoeren[i][1], explanation: null, order_index: 1 });
}
console.log("\nGOTOVO ✓  Lesen = R/F dugmad (6); Hören = 5× (audio + tvrdnja + R/F).");
