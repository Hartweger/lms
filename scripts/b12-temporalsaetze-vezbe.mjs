/** B1.2 "Temporalsätze: während · bevor · nachdem" — dodaje vežbe iz sveske u POSTOJEĆU lekciju.
 *  Zadržava sav sadržaj + vokabular. Dry-run podrazumevano; --apply za upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const LESSON_ID = "5066fc5d-4ef2-4061-9df6-6426213a6822";
const QUIZ_TITLE = "Welcher Konnektor passt? (während / bevor / nachdem)";

const { data: lesson } = await sb.from("lessons").select("sections").eq("id", LESSON_ID).single();
let s = [...lesson.sections];

const { data: exExist } = await sb.from("exercises").select("id").eq("lesson_id", LESSON_ID).eq("title", QUIZ_TITLE).maybeSingle();
if (exExist || s.some((x) => x.type === "exercise" && x.title === QUIZ_TITLE)) {
  console.log("⚠️ Vežbe već dodate — prekidam."); process.exit(1);
}

// opcije: während=0, bevor=1, nachdem=2
const OPTS = ["während", "bevor", "nachdem"];
const QUIZ = [
  ["______ ich auf den Bus wartete und fror, beschloss ich, mir im Büro gleich einen Tee zu machen.", "0", "istovremeno - obe radnje teku zajedno."],
  ["______ ich in die Küche gegangen war, zog ich meine Jacke aus und begrüßte die Kollegen.", "2", "radnja je završena (Plusquamperfekt: gegangen war)."],
  ["______ ich den Tee machte, kam einer von meinen Kollegen in die Küche und wir unterhielten uns.", "0", "istovremeno."],
  ["Doch ______ ich den Tee trinken konnte, rief mich mein Chef in sein Büro.", "1", "glavna radnja (Chef ruft) dešava se PRE pijenja čaja."],
  ["______ wir das Gespräch beendet hatten, ging ich in die Küche zurück.", "2", "radnja završena (hatten beendet)."],
  ["Meine frühere Chefin hat immer ihre Aufgaben notiert, ______ sie mit der Arbeit begonnen hat.", "1", "prvo zapiše, pa počne s radom."],
  ["______ sie an ihrem Schreibtisch saß und arbeitete, durfte man sie nicht stören.", "0", "istovremeno - dok sedi i radi."],
  ["Erst ______ sie alle ihre Aufgaben erledigt hatte, hat sie aufgehört zu arbeiten.", "2", "radnja završena (erledigt hatte)."],
];

// Zadatak #7 - Toms Morgen
const t7task = "## Schreibe Sätze mit *bevor – nachdem – während* (Toms Morgen)\n\n" +
  "a) sein Wecker hatte geklingelt / Tom ist aufgestanden und ins Bad gegangen\n" +
  "b) Tom hatte geduscht / er hat sich angezogen und Frühstück gemacht\n" +
  "c) Tom saß am Tisch und frühstückte / er hat die Zeitung gelesen\n" +
  "d) Tom ist aus dem Haus gegangen / er hat seine Freundin geweckt\n" +
  "e) Tom ist U-Bahn gefahren / er hat Musik gehört";
const t7sol = {
  type: "spoiler", title: "Lösung - Toms Morgen", items: [
    { question: "a", answer: "Nachdem sein Wecker geklingelt hatte, ist Tom aufgestanden und ins Bad gegangen." },
    { question: "b", answer: "Nachdem Tom geduscht hatte, hat er sich angezogen und Frühstück gemacht." },
    { question: "c", answer: "Während Tom am Tisch saß und frühstückte, hat er die Zeitung gelesen." },
    { question: "d", answer: "Bevor Tom aus dem Haus gegangen ist, hat er seine Freundin geweckt." },
    { question: "e", answer: "Während Tom U-Bahn gefahren ist, hat er Musik gehört." },
  ],
};

// Zadatak #8 - Mein Tag
const t8task = "## Mein Tag. Schreibe Sätze mit *bevor – nachdem – während*\n\n" +
  "a) in den Bus steigen, zuerst: Fahrkarte kaufen\n" +
  "b) zur gleichen Zeit: unterwegs sein und Musik hören\n" +
  "c) nach Hause gehen, zuerst: einkaufen\n" +
  "d) zu Hause ankommen, dann: kochen";
const t8sol = {
  type: "spoiler", title: "Lösung - Mein Tag", items: [
    { question: "a", answer: "Bevor ich in den Bus gestiegen bin, habe ich eine Fahrkarte gekauft." },
    { question: "b", answer: "Während ich unterwegs war, habe ich Musik gehört." },
    { question: "c", answer: "Bevor ich nach Hause gegangen bin, habe ich eingekauft." },
    { question: "d", answer: "Nachdem ich zu Hause angekommen war, habe ich gekocht." },
  ],
};

// ubaci pre vocabulary sekcije
const newBlocks = [
  { type: "exercise", title: QUIZ_TITLE },
  { type: "text", style: "uebung", content: t7task },
  t7sol,
  { type: "text", style: "uebung", content: t8task },
  t8sol,
];
let vi = s.findIndex((x) => x.type === "vocabulary");
if (vi < 0) vi = s.length;
s = [...s.slice(0, vi), ...newBlocks, ...s.slice(vi)];

console.log("Raspored posle:", s.map((x) => x.type + (x.title ? `(${x.title.slice(0,18)})` : "")).join(", "));
console.log("\nQuiz (8 pitanja):");
QUIZ.forEach(([q, a]) => console.log(`   ${OPTS[parseInt(a)].padEnd(8)} ← ${q.slice(0, 50)}...`));

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

const { error: eu } = await sb.from("lessons").update({ sections: s }).eq("id", LESSON_ID);
if (eu) { console.error("update:", eu.message); process.exit(1); }

const { data: ex, error: e1 } = await sb.from("exercises").insert({
  lesson_id: LESSON_ID, title: QUIZ_TITLE, exercise_type: "quiz", order_index: 1,
}).select("id").single();
if (e1) { console.error("insert ex:", e1.message); process.exit(1); }
let oi = 1;
for (const [q, a, e] of QUIZ) {
  const { error } = await sb.from("exercise_questions").insert({
    exercise_id: ex.id, question: q, question_type: "quiz", correct_answer: a,
    explanation: e, order_index: oi++, options: { type: "quiz", items: OPTS },
  });
  if (error) { console.error("insert q:", error.message); process.exit(1); }
}
console.log("\nGOTOVO ✓  Dodate vežbe: 1 interaktivni quiz (8) + #7 i #8 sa rešenjima. Vokabular/kartice zadržani.");
