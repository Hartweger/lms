/** B1.2 Modul 4 — "da und weil - Gute Umgangsformen": gramatika da/weil + tekst (A-F) + uparivanje + weil-vežba.
 *  Tekst transkribovan tačno iz sveske. Dry-run; --apply za upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const TITLE = "da und weil - Gute Umgangsformen";
const MATCH_EX = "Welche Überschrift passt?";

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: ex0 } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", TITLE).maybeSingle();
if (ex0) { console.log("⚠️ Lekcija već postoji:", ex0.id); process.exit(1); }

// Gute Umgangsformen tekst (tačno)
const umgText = "**Gute Umgangsformen im Alltag**\n\n" +
  "Höflichkeit und ein guter Umgang miteinander - eigentlich ganz selbstverständlich, oder? Nur: Was ist eigentlich gutes Benehmen? Was für manche als unhöflich gilt, ist für Menschen aus einer anderen Generation oder einer anderen Kultur vielleicht durchaus üblich. Gutes Benehmen ist auf jeden Fall eine Frage des Respekts gegenüber seinen Mitmenschen und der jeweiligen Kultur, in der man sich bewegt. Wir alle kennen Alltagssituationen, die wir als unhöflich empfinden. Lesen Sie hier ein paar Beispiele:\n\n" +
  "**A** Sie haben sich mit einem Freund am Hauptbahnhof verabredet. Es war geplant, dass er Sie vom Zug abholt. Er verspätet sich um 20 Minuten, ohne Sie vorher informiert zu haben.\n\n" +
  "**B** Sie unterhalten sich mit mehreren Kollegen über ein wichtiges Thema. Einer in der Runde nimmt plötzlich sein Handy und schreibt eine Nachricht, während die anderen weitersprechen.\n\n" +
  "**C** Ein Mann unterhält sich mit seiner Kollegin. Während des Gesprächs vermeidet er es, sie direkt anzusehen.\n\n" +
  "**D** Sie sitzen im ICE im Speisewagen und möchten in Ruhe essen. Neben Ihnen führt ein junger Mann minutenlang mit lauter Stimme Geschäftstelefonate.\n\n" +
  "**E** Sie haben der kleinen Tochter von Freunden ein Geschenk mitgebracht. Die Kleine weigert sich, „Danke“ zu sagen, nimmt das Geschenk und verschwindet in ihr Zimmer. Die Eltern schauen zu, ohne etwas zu sagen, und lächeln.\n\n" +
  "**F** Sie fahren mit der U-Bahn. Neben Ihnen sitzt ein junger Mann und isst einen Döner mit Zwiebeln. Sie finden den Geruch unerträglich.";

const headings = "**Überschriften:**\n\n" +
  "1. Die Bahn als Büro\n2. Wie pünktlich ist pünktlich?\n3. Rücksicht in öffentlichen Verkehrsmitteln\n4. Eine Frage der Erziehung?!\n5. Das Smartphone allzeit bereit\n6. Augenkontakt - ja oder nein?";

// uparivanje: za svaku situaciju izbor naslova (0-5)
const HOPTS = ["1. Die Bahn als Büro", "2. Wie pünktlich ist pünktlich?", "3. Rücksicht in öffentlichen Verkehrsmitteln", "4. Eine Frage der Erziehung?!", "5. Das Smartphone allzeit bereit", "6. Augenkontakt - ja oder nein?"];
const MATCH = [
  ["Welche Überschrift passt zu Situation A? (Freund verspätet sich um 20 Minuten)", "1"],
  ["Welche Überschrift passt zu Situation B? (Kollege schreibt am Handy, während andere sprechen)", "4"],
  ["Welche Überschrift passt zu Situation C? (Mann vermeidet direkten Blickkontakt)", "5"],
  ["Welche Überschrift passt zu Situation D? (lautes Geschäftstelefonat im ICE)", "0"],
  ["Welche Überschrift passt zu Situation E? (Kind sagt nicht „Danke“, Eltern sagen nichts)", "3"],
  ["Welche Überschrift passt zu Situation F? (Döner-Geruch in der U-Bahn)", "2"],
];

// weil-vežba: model rečenice iz teksta
const weilSpoiler = { type: "spoiler", title: "Warum ist das unhöflich? - Sätze mit weil", items: [
  { question: "A", answer: "Es ist unhöflich, weil er sich um 20 Minuten verspätet, ohne vorher informiert zu haben." },
  { question: "B", answer: "Es ist unhöflich, weil einer plötzlich sein Handy nimmt und eine Nachricht schreibt, während die anderen weitersprechen." },
  { question: "C", answer: "Es ist unhöflich, weil der Mann es vermeidet, seine Kollegin direkt anzusehen." },
  { question: "D", answer: "Es ist unhöflich, weil der junge Mann minutenlang mit lauter Stimme Geschäftstelefonate führt." },
  { question: "E", answer: "Es ist unhöflich, weil die Kleine sich weigert, „Danke“ zu sagen, und die Eltern nichts dazu sagen." },
  { question: "F", answer: "Es ist unhöflich, weil der Geruch von dem Döner mit Zwiebeln unerträglich ist." },
] };

const sections = [
  { type: "badge", module: "Modul 4", category: "grammatik" },
  { type: "text", style: "info", content: "## da i weil - zašto? (uzrok)\n\nVeznici **weil** i **da** uvode zavisnu rečenicu koja objašnjava UZROK (odgovaraju na pitanje *warum?* - zašto?). Kod oba glagol ide na **kraj** zavisne rečenice.\n\n- **weil** - neutralno i najčešće; razlog obično dolazi posle glavne rečenice.\n- **da** - kada je razlog već poznat ili očigledan; često stoji na **početku**, pre glavne rečenice (zvuči malo formalnije)." },
  { type: "table", headers: ["Veznik", "Značenje", "Pozicija", "Primer"], rows: [
    ["weil", "jer", "obično posle glavne", "Ich bleibe zu Hause, weil ich krank bin."],
    ["da", "pošto / jer", "često na početku", "Da ich krank bin, bleibe ich zu Hause."],
  ] },
  { type: "text", style: "beispiele", content: "## Primeri (iz teksta)\n\n- *Es ist unhöflich, **weil** er sich um 20 Minuten verspätet, ohne zu informieren.*\n- ***Da** der junge Mann laut telefoniert, fühlen sich die anderen Gäste gestört.*" },
  { type: "text", style: "uebung", content: "## Lesen: Gute Umgangsformen" },
  { type: "text", style: "default", content: umgText },
  { type: "text", style: "default", content: headings },
  { type: "exercise", title: MATCH_EX },
  weilSpoiler,
];

console.log("=== NOVA LEKCIJA ===", TITLE);
console.log("Sekcije:", sections.map((s) => s.type + (s.title ? `(${s.title})` : "")).join(", "));
console.log("Uparivanje:", MATCH.map((m, i) => `${String.fromCharCode(65 + i)}→${parseInt(m[1]) + 1}`).join(" "));

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

const { data: ins, error: e1 } = await sb.from("lessons").insert({ course_id: course.id, title: TITLE, lesson_type: "text", order_index: 9999, content: "", sections }).select("id").single();
if (e1) { console.error("insert:", e1.message); process.exit(1); }
const LID = ins.id;
// smesti pre "Prüfung - Lesen und Hören (Modul 4)"
const { data: all } = await sb.from("lessons").select("id, title, order_index").eq("course_id", course.id).order("order_index");
const rest = all.filter((l) => l.id !== LID);
const pi = rest.findIndex((l) => l.title === "Prüfung - Lesen und Hören (Modul 4)");
const seq = [];
for (let i = 0; i < rest.length; i++) { if (i === pi) seq.push(LID); seq.push(rest[i].id); }
for (let i = 0; i < seq.length; i++) await sb.from("lessons").update({ order_index: i }).eq("id", seq[i]);

const { data: mex } = await sb.from("exercises").insert({ lesson_id: LID, title: MATCH_EX, exercise_type: "quiz", order_index: 1 }).select("id").single();
let oi = 1;
for (const [q, a] of MATCH) await sb.from("exercise_questions").insert({ exercise_id: mex.id, question: q, question_type: "quiz", correct_answer: a, explanation: null, order_index: oi++, options: { type: "quiz", items: HOPTS } });

console.log(`\nGOTOVO ✓  da/weil lekcija (id=${LID}) u Modulu 4 pre Prüfung.`);
