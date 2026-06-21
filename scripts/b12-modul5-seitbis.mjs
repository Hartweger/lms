/** B1.2 Modul 5 — "seit und bis - Angebote auf Reisen": gramatika seit/bis + Lesen tekst (A-E) + uparivanje + kartice iz teksta.
 *  Transkribovano tačno. Dry-run; --apply za upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const TITLE = "seit und bis - Angebote auf Reisen";
const MATCH_EX = "Welches Angebot passt? (ordnen Sie zu)";

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: ex0 } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", TITLE).maybeSingle();
if (ex0) { console.log("⚠️ Lekcija već postoji:", ex0.id); process.exit(1); }

const services = "**Services für Ihre Bahnreise**\n\n" +
  "**A** Passagiere, die in ihrer Beweglichkeit eingeschränkt sind, können bequem und barrierefrei mit uns reisen. Kontaktieren Sie uns einfach vor Ihrer Reise, falls Sie bei der Reiseplanung, im Bahnhof oder am Zug Hilfe benötigen.\n\n" +
  "**B** Mit unserem Service können Sie Ihre Koffer vorausschicken und so von Anfang an entspannt reisen. Ihre Koffer und Taschen werden schon vor der Reise bei Ihnen zu Hause abgeholt und an Ihr Reiseziel transportiert.\n\n" +
  "**C** Urlaubsreisende, die Landschaften, Regionen und Städte mit dem Rad erkunden wollen, haben in unseren Zügen eine Reihe von Möglichkeiten, ihr Fahrrad mitzunehmen.\n\n" +
  "**D** Auf unserem Zugportal finden Sie nicht nur eine kostenlose WLAN-Verbindung, sondern auch aktuelle Informationen zu Ihrer Zugverbindung und beste Unterhaltung. Seit der Neugestaltung der Benutzeroberfläche ist das Portal noch anwenderfreundlicher.\n\n" +
  "**E** Im Falle von Verspätungen, Zugausfällen und versäumten Anschlusszügen finden Sie hier Informationen zu den Entschädigungsregelungen. Außerdem können Sie sich in diesen Fällen jederzeit an unsere Mitarbeiter wenden.";

// uparivanje A-E → ponuda (0..4)
const OPTS = ["Fahrgastrechte", "Internet", "Gepäckversand", "Barrierefreies Reisen", "Bahn und Rad"];
const MATCH = [
  ["Welches Angebot beschreibt Text A? (Hilfe für Passagiere mit eingeschränkter Beweglichkeit)", "3"],
  ["Welches Angebot beschreibt Text B? (Koffer vorausschicken)", "2"],
  ["Welches Angebot beschreibt Text C? (Fahrrad im Zug mitnehmen)", "4"],
  ["Welches Angebot beschreibt Text D? (Zugportal mit WLAN und Infos)", "1"],
  ["Welches Angebot beschreibt Text E? (Entschädigung bei Verspätungen)", "0"],
];

// kartice/vokabular IZ teksta
const VOC = [
  ["die Beweglichkeit", "pokretljivost"],
  ["eingeschränkt", "ograničen"],
  ["barrierefrei", "pristupačan, bez prepreka"],
  ["benötigen", "trebati, biti potreban"],
  ["vorausschicken", "poslati unapred"],
  ["abholen", "preuzeti, pokupiti"],
  ["das Reiseziel", "odredište putovanja"],
  ["erkunden", "istraživati"],
  ["kostenlos", "besplatan"],
  ["die Zugverbindung", "železnička veza"],
  ["die Neugestaltung", "preuređenje, redizajn"],
  ["anwenderfreundlich", "jednostavan za korišćenje"],
  ["die Verspätung", "kašnjenje"],
  ["der Zugausfall", "otkazivanje voza"],
  ["der Anschlusszug", "vezni voz"],
  ["die Entschädigung", "naknada, obeštećenje"],
  ["sich wenden an + Akk", "obratiti se nekome"],
];

const sections = [
  { type: "badge", module: "Modul 5", category: "grammatik" },
  { type: "text", style: "info", content: "## seit i bis - vremenske granice\n\n- **seit** (+ Dativ) - označava **početak** perioda koji još traje (od neke tačke do sada): *seit einem Jahr, seit Montag, seit der Neugestaltung*.\n- **bis** - označava **kraj**, granicu (do neke tačke): *bis Freitag, bis 18 Uhr, bis zur Abfahrt*." },
  { type: "table", headers: ["Reč", "Značenje", "Primer"], rows: [
    ["seit + Dativ", "od (i dalje traje)", "Seit der Neugestaltung ist das Portal anwenderfreundlicher."],
    ["bis", "do (granica)", "Bis zur Abfahrt des Zuges haben wir noch eine Stunde."],
  ] },
  { type: "text", style: "beispiele", content: "## Primeri\n\n- ***Seit** drei Jahren reise ich oft mit der Bahn.*\n- *Ich warte hier, **bis** der Zug kommt.*\n- *Die Koffer werden **bis** zum Reiseziel transportiert.*" },
  { type: "text", style: "uebung", content: "## Lesen: Angebote auf Reisen\n\nÜberfliegen Sie die Service-Angebote und ordnen Sie die Texte den Angeboten zu." },
  { type: "text", style: "default", content: services },
  { type: "exercise", title: MATCH_EX },
  { type: "vocabulary", rows: VOC.map(([d, s]) => [d, s]) },
  { type: "flashcard", items: VOC.map(([d, s]) => ({ front: d, back: s })) },
];

console.log("=== NOVA LEKCIJA ===", TITLE);
console.log("Sekcije:", sections.map((s) => s.type).join(", "));
console.log("Uparivanje:", MATCH.map((m, i) => `${String.fromCharCode(65 + i)}→${OPTS[parseInt(m[1])]}`).join(" · "));
console.log("Kartice/vokabular:", VOC.length, "reči iz teksta");

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

const { data: ins, error: e1 } = await sb.from("lessons").insert({ course_id: course.id, title: TITLE, lesson_type: "text", order_index: 9999, content: "", sections }).select("id").single();
if (e1) { console.error("insert:", e1.message); process.exit(1); }
const LID = ins.id;
// smesti posle "Modul 4 - Reči" (početak Modula 5)
const { data: all } = await sb.from("lessons").select("id, title, order_index").eq("course_id", course.id).order("order_index");
const rest = all.filter((l) => l.id !== LID);
const ai = rest.findIndex((l) => l.title === "Modul 4 - Reči");
const seq = [];
for (let i = 0; i < rest.length; i++) { seq.push(rest[i].id); if (i === ai) seq.push(LID); }
for (let i = 0; i < seq.length; i++) await sb.from("lessons").update({ order_index: i }).eq("id", seq[i]);

const { data: mex } = await sb.from("exercises").insert({ lesson_id: LID, title: MATCH_EX, exercise_type: "quiz", order_index: 1 }).select("id").single();
let oi = 1;
for (const [q, a] of MATCH) await sb.from("exercise_questions").insert({ exercise_id: mex.id, question: q, question_type: "quiz", correct_answer: a, explanation: null, order_index: oi++, options: { type: "quiz", items: OPTS } });

console.log(`\nGOTOVO ✓  seit/bis lekcija (id=${LID}) — početak Modula 5.`);
