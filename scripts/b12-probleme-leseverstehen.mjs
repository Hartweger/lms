/** B1.2 "Probleme im Büro" — dodaje Leseverstehen (A2 a/b) iz radne sveske, tačno transkribovano.
 *  Vokabular + kartice ostaju. Dry-run podrazumevano; --apply za upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const LESSON_ID = "87d135c7-fb0c-499c-9fb2-75f2347592c0";
const QUIZ_TITLE = "Welche Überschrift passt?";

const { data: l } = await sb.from("lessons").select("title, sections").eq("id", LESSON_ID).single();
const sections = Array.isArray(l.sections) ? l.sections : [];

// duplikat-zaštita
const { data: exExist } = await sb.from("exercises").select("id").eq("lesson_id", LESSON_ID).eq("title", QUIZ_TITLE).maybeSingle();
if (exExist || sections.some((s) => s.type === "exercise" && s.title === QUIZ_TITLE)) {
  console.log("⚠️ Leseverstehen već dodat — prekidam."); process.exit(1);
}

const reading = [
  "Sie kennen es sicher: Sie haben viel zu tun und wissen kaum, wie Sie Ihre Arbeit schaffen sollen. Plötzlich steht ein Kollege vor Ihnen und bittet Sie um Hilfe oder der Chef hat noch eine weitere Aufgabe für Sie. Sie möchten hilfsbereit sein und niemanden enttäuschen? Eventuell haben Sie auch Angst vor negativen Konsequenzen, falls Sie *Nein* sagen. Doch auch wenn es schwerfällt: Es ist wichtig, rechtzeitig *Nein* zu sagen. Denn Sie wirken unzuverlässig, falls Sie Ihre Aufgaben dann doch nicht schaffen.",
  "",
  "• Achten Sie darauf, wie Sie *Nein* sagen: Seien Sie freundlich, aber bestimmt.",
  "• Erklären Sie, warum Sie *Nein* sagen müssen. Beachten Sie dabei, dass Sie mit kurzen und klaren Erklärungen sicherer wirken.",
  "• Sprechen Sie das Problem auch an, falls Sie schon zugesagt haben und Ihnen erst nachher klar wird, dass Sie das zeitlich nicht schaffen können.",
  "• Zeigen Sie Verständnis für die Situation des Kollegen bzw. des Chefs und bieten Sie Alternativen/Kompromisse an. Vielleicht können Aufgaben getauscht oder verschoben werden?",
].join("\n");

const taskB = [
  "**b)** Lesen Sie den Text jetzt ganz und beantworten Sie die Fragen.",
  "",
  "1. Warum ist es nicht so leicht, im Job *Nein* zu sagen?",
  "2. Wie sollte man Aufgaben ablehnen?",
  "3. Was sollte man tun, wenn man eine Aufgabe abgelehnt hat?",
].join("\n");

const leseBlock = [
  { type: "text", style: "uebung", content: "**a)** Welche Überschrift passt? Überfliegen Sie den ersten Abschnitt und kreuzen Sie an." },
  { type: "text", style: "default", content: reading },
  { type: "exercise", title: QUIZ_TITLE },
  { type: "text", style: "uebung", content: taskB },
];

// ubaci pre prve vocabulary sekcije (badge + intro ostaju iznad, vokabular/kartice ispod)
let idx = sections.findIndex((s) => s.type === "vocabulary");
if (idx < 0) idx = sections.length;
const newSections = [...sections.slice(0, idx), ...leseBlock, ...sections.slice(idx)];

console.log("Lekcija:", l.title);
console.log("Sekcije pre:", sections.map((s) => s.type).join(", "));
console.log("Sekcije posle:", newSections.map((s) => s.type).join(", "));
console.log("\nQuiz:", QUIZ_TITLE, "→ opcije:");
console.log("   0) Gutes Zeitmanagement: Wie schaffe ich meine Aufgaben rechtzeitig?");
console.log("   1) Grenzen setzen: Wie lehne ich Aufgaben im Job ab?   ✓ TAČNO");

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

const { error: eu } = await sb.from("lessons").update({ sections: newSections }).eq("id", LESSON_ID);
if (eu) { console.error("update sections:", eu.message); process.exit(1); }

const { data: ex, error: e1 } = await sb.from("exercises").insert({
  lesson_id: LESSON_ID, title: QUIZ_TITLE, exercise_type: "quiz", order_index: 1,
}).select("id").single();
if (e1) { console.error("insert quiz ex:", e1.message); process.exit(1); }

const { error: e2 } = await sb.from("exercise_questions").insert({
  exercise_id: ex.id,
  question: "Welche Überschrift passt? Überfliegen Sie den ersten Abschnitt und kreuzen Sie an.",
  question_type: "quiz", correct_answer: "1", explanation: null, order_index: 1,
  options: { type: "quiz", items: [
    "Gutes Zeitmanagement: Wie schaffe ich meine Aufgaben rechtzeitig?",
    "Grenzen setzen: Wie lehne ich Aufgaben im Job ab?",
  ] },
});
if (e2) { console.error("insert quiz q:", e2.message); process.exit(1); }

console.log("\nGOTOVO ✓  Leseverstehen (tekst + izbor naslova + 3 pitanja) dodat. Vokabular i kartice ostali.");
