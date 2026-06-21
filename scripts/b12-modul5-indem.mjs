/** B1.2 Modul 5 — "indem und ohne dass - Vereine": gramatika indem/ohne dass + Lesen tekst + vežba + kartice iz teksta.
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
const TITLE = "indem und ohne dass - Vereine";
const EX = "indem oder ohne dass?";

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: ex0 } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", TITLE).maybeSingle();
if (ex0) { console.log("⚠️ Lekcija već postoji:", ex0.id); process.exit(1); }

const vereineText = "**Vereine in deutschsprachigen Ländern**\n\n" +
  "In den deutschsprachigen Ländern gibt es rund 820.000 Vereine. Vereine sind Organisationen, in denen sich Menschen zusammenfinden, die gemeinsame Interessen haben. Um Mitglied in einem Verein zu werden, müssen Sie eine Beitrittserklärung abgeben. Als Mitglied können Sie dann die Angebote des Vereins nutzen, Menschen kennenlernen und gemeinsam Dinge unternehmen. Wer will, kann auch aktiv in einem Verein z. B. bei der Planung der Angebote mitarbeiten. In den meisten Vereinen zahlt man für die Mitgliedschaft einen kleinen Beitrag.\n\n" +
  "Neben Sportvereinen gibt es Musikvereine, soziale Vereine, Jugendklubs, Elternvereine, Tierschutzvereine, die Freiwillige Feuerwehr und vieles mehr. 48 % der Menschen sind Mitglied in mindestens einem Verein. Besonders beliebt sind Sportvereine. Beinahe jeder Dritte verbringt dort seine Freizeit.";

const personen = "**Nikolin:** „Vor zwei Jahren bin ich in eine neue Stadt gezogen. Das war anfangs gar nicht so leicht, da ich dort niemanden kannte. Ein Freund gab mir den Tipp: Tritt in einen Verein ein! Da lernst du neue Leute kennen! Erst dachte ich: ‚Na ja, ich weiß nicht …‘ Dann habe ich aber geschaut, was mich so interessiert. Und nun habe ich klettern gelernt! Ich hätte ohne den Verein niemals innerhalb so kurzer Zeit neue Freunde gefunden.“\n\n" +
  "**Georg:** „Früher war ich bei der Freiwilligen Feuerwehr. Ich habe Brände gelöscht, war bei Einsätzen dabei. Jahrzehntelang! Jetzt geht das nicht mehr. Aber ich helfe, indem ich die Kinder betreue und versorge, solange die Eltern im Einsatz sind. Was mir besonders gefällt, sind natürlich die Feste, die wir regelmäßig feiern! So bin ich immer in Kontakt mit Menschen.“";

// vežba b: indem oder ohne dass (0=indem, 1=ohne dass)
const OPTS = ["indem", "ohne dass"];
const Q = [
  ["Sie werden Mitglied in einem Verein, ______ Sie eine Beitrittserklärung unterschreiben.", "0", "Postajete član TAKO ŠTO potpišete - način → indem."],
  ["Sie können auch Mitglied in einem Verein sein, ______ Sie aktiv mitarbeiten.", "1", "Možete biti član A DA NE radite aktivno → ohne dass."],
  ["In den meisten Vereinen können Sie Mitglied sein, ______ Sie einen Mitgliedsbeitrag zahlen.", "0", "Član ste TAKO ŠTO platite članarinu - način → indem."],
];

const VOC = [
  ["der Verein, -e", "udruženje, klub"],
  ["das Mitglied, -er", "član"],
  ["die Mitgliedschaft", "članstvo"],
  ["die Beitrittserklärung", "pristupnica (izjava o učlanjenju)"],
  ["der Beitrag, ¨e", "članarina, prilog"],
  ["gemeinsame Interessen", "zajednički interesi"],
  ["unternehmen", "preduzeti (raditi zajedno)"],
  ["mitarbeiten", "sarađivati, učestvovati"],
  ["eintreten (in + Akk)", "učlaniti se"],
  ["die Freiwillige Feuerwehr", "dobrovoljno vatrogasno društvo"],
  ["beliebt", "omiljen"],
  ["klettern", "penjati se"],
  ["der Brand, ¨e", "požar"],
  ["der Einsatz, ¨e", "intervencija, akcija"],
  ["betreuen", "brinuti o, čuvati"],
  ["versorgen", "zbrinuti, starati se o"],
  ["das Fest, -e", "proslava, svetkovina"],
];

const sections = [
  { type: "badge", module: "Modul 5", category: "grammatik" },
  { type: "text", style: "info", content: "## indem i ohne dass\n\n- **indem** - uvodi **način** (kako? na koji način?), prevod: tako što. Glagol ide na kraj.\n  *Sie werden Mitglied, **indem** Sie eine Erklärung unterschreiben.* (postajete član tako što potpišete izjavu)\n- **ohne dass** - nešto se **NE dešava** / izostaje, prevod: a da ne. Glagol ide na kraj.\n  *Sie können Mitglied sein, **ohne dass** Sie aktiv mitarbeiten.* (možete biti član a da ne radite aktivno)" },
  { type: "table", headers: ["Veznik", "Značenje", "Primer (iz teksta)"], rows: [
    ["indem", "tako što (način)", "Ich helfe, indem ich die Kinder betreue."],
    ["ohne dass", "a da ne", "Man kann Mitglied sein, ohne dass man mitarbeitet."],
  ] },
  { type: "text", style: "uebung", content: "## Lesen: Vereine in deutschsprachigen Ländern" },
  { type: "text", style: "default", content: vereineText },
  { type: "exercise", title: EX },
  { type: "text", style: "default", content: personen },
  { type: "vocabulary", rows: VOC.map(([d, s]) => [d, s]) },
  { type: "flashcard", items: VOC.map(([d, s]) => ({ front: d, back: s })) },
];

console.log("=== NOVA LEKCIJA ===", TITLE);
console.log("Sekcije:", sections.map((s) => s.type).join(", "));
console.log("Vežba indem/ohne dass:", Q.map((q, i) => `${i + 1}→${OPTS[parseInt(q[1])]}`).join(" · "));
console.log("Kartice/vokabular:", VOC.length, "reči iz teksta");

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

const { data: ins, error: e1 } = await sb.from("lessons").insert({ course_id: course.id, title: TITLE, lesson_type: "text", order_index: 9999, content: "", sections }).select("id").single();
if (e1) { console.error("insert:", e1.message); process.exit(1); }
const LID = ins.id;
// posle "seit und bis - Angebote auf Reisen"
const { data: all } = await sb.from("lessons").select("id, title, order_index").eq("course_id", course.id).order("order_index");
const rest = all.filter((l) => l.id !== LID);
const ai = rest.findIndex((l) => l.title === "seit und bis - Angebote auf Reisen");
const seq = [];
for (let i = 0; i < rest.length; i++) { seq.push(rest[i].id); if (i === ai) seq.push(LID); }
for (let i = 0; i < seq.length; i++) await sb.from("lessons").update({ order_index: i }).eq("id", seq[i]);

const { data: qex } = await sb.from("exercises").insert({ lesson_id: LID, title: EX, exercise_type: "quiz", order_index: 1 }).select("id").single();
let oi = 1;
for (const [q, a, e] of Q) await sb.from("exercise_questions").insert({ exercise_id: qex.id, question: q, question_type: "quiz", correct_answer: a, explanation: e, order_index: oi++, options: { type: "quiz", items: OPTS } });

console.log(`\nGOTOVO ✓  indem/ohne dass lekcija (id=${LID}) — Modul 5, posle seit/bis.`);
