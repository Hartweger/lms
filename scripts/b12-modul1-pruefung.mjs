/** B1.2 Modul 1 — nova Prüfung lekcija: Leseverstehen (Duzen, ja/nein) + Schreiben (E-Mail, esej za pregled).
 *  Tekst transkribovan tačno iz radne sveske. Dry-run podrazumevano; --apply za upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const LESSON_TITLE = "Prüfung - Leseverstehen und Schreiben";
const CAT_TITLE = "Duzen - ja oder nein?";
const ESSAY_TITLE = "Schreiben - E-Mail an Frau Duran";

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();

// duplikat-zaštita
const { data: existing } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", LESSON_TITLE).maybeSingle();
if (existing) { console.log("⚠️ Lekcija već postoji:", existing.id, "— prekidam."); process.exit(1); }

// ── Leseverstehen tekst (tačno iz sveske) ──
const leserbriefe = [
  ["Sibylle, 45, Freiburg", "Ich finde es unmöglich, wie oft ich heute von fremden Menschen einfach so geduzt werde. Vor allem unter Verkäufern scheint das Mode zu sein. Egal ob beim Gebrauchtwagenkauf oder in der Mode-Boutique: Überall sagen gleich alle Du zu mir. Und auch in der Werbung werde ich immer geduzt. Was ist so schlimm am Sie?"],
  ["Kathrin, 23, Berlin", "Mich hat neulich ein Mitstudent im Uni-Kino gesiezt. Zuerst dachte ich, für wie alt hält der mich? Aber eigentlich hatte er ja Recht, wir kannten uns nicht, machten kein Seminar zusammen. Plötzlich fand ich es schön. Ich muss sagen: Das hat doch was! Gerade im Vergleich zum ständigen Geduze."],
  ["Sigi, 45, Bad Bergzabern", "Mal ehrlich, wer braucht denn heute noch das Sie? Außer vielleicht gegenüber dem Chef! Ich finde das Sie so unnötig wie Kopfschmerzen. Wer höflich ist, ist es auch per Du. Und Unhöflichkeit wird mit Sie auch nicht höflicher. Habe ich Recht?"],
  ["Olga, 62, Radevormwald", "Wer braucht denn dazu eine Studie? Man muss nur mal auf die Straße gehen, da hört man's. Kinder lernen das höfliche Siezen gar nicht mehr und wenn sie älter sind, können sie es nicht, weil sie es nie gelernt haben. Die Kinder meiner Nachbarin sagen alle „Du“ zu mir, obwohl ich das nicht will. Aber im Gegensatz zu früher wird man gar nicht gefragt."],
  ["Ellen, 56, Leipzig", "Wenn ich abends unterwegs bin, höre ich um mich herum viel Du. Unter jungen Leuten ist das heute anscheinend fast schon normal, zum Beispiel in der Kneipe oder an der Kinokasse. Eigentlich eine schöne Entwicklung: Warum sollte man denn so viel Wert auf Distanz legen? Am Abend in der Kneipe sind wir ja irgendwie alle gleich, oder?"],
  ["Theo, 19, Münster", "Gleich am ersten Arbeitstag als Verkäufer in einer schicken Bio-Bäckerei bat meine Chefin mir freundschaftlich das „Du“ an. Keine Woche später wurde mir klar, dass die Arbeitsbedingungen alles andere als freundschaftlich sind: ständig Überstunden - ohne Bezahlung! Wenn ich demnächst mit meiner Chefin darüber spreche, muss ich das per Du machen. Ob ich da meine Rechte durchsetzen kann?"],
  ["Anton, 78, Moers", "Zu meiner Zeit hat es das nicht gegeben: Fremde zu duzen, das war undenkbar! Und dann immer die Unsicherheit, wer wem wann eventuell das „Du“ anbieten darf! Also ich finde es prima, dass man sich heute schneller duzt. Meiner Meinung nach lässt sich Vieles per Du leichter sagen. Ich hätte mir das früher gewünscht."],
  ["Lothar, 37, Gelsenkirchen", "„Das schnelle Duzen von fremden Leuten zeigt, dass auch Deutschland nicht mehr so unmodern ist?“ Also ich glaube, das zeigt nur eins: Die Leute benehmen sich schlecht. Was außerdem bei der Diskussion vergessen wird: Man kann sehr negativ auffallen, wenn man Leute zu schnell duzt. Nachher ist man klüger, aber dann ist es zu spät. Freunden aus dem Ausland, die die deutsche Kultur erst kennenlernen, würde ich das nie empfehlen!"],
];
const leserbriefeContent = "## Leserbriefe\n\n" + leserbriefe.map(([who, txt]) => `**${who}**\n${txt}`).join("\n\n");

// ── ja/nein rešenja (ja = kategorija 0, nein = 1) ──
const answers = { Sibylle: 1, Kathrin: 1, Sigi: 0, Olga: 1, Ellen: 0, Theo: 1, Anton: 0, Lothar: 1 };
const catItems = ["Sibylle", "Kathrin", "Ellen", "Theo", "Sigi", "Olga", "Anton", "Lothar"].map((n) => ({ text: n, category: answers[n] }));

const sections = [
  { type: "badge", module: "Modul 1 · Unter Kollegen", pruefung: true },
  { type: "text", style: "uebung", content: "**Sie lesen Leserbriefe zu einem Artikel über das Duzen:**\n*Wird das Du auch Fremden gegenüber immer normaler?* Entscheiden Sie:\nIst die Person für das schnelle Duzen von Fremden? Kreuzen Sie an." },
  { type: "text", style: "default", content: leserbriefeContent },
  { type: "exercise", title: CAT_TITLE },
  { type: "text", style: "info", content: "## Schreiben (esej za pregled)\n\n**Lerntipp:** Lesen Sie Ihren Brief am Ende noch einmal und kontrollieren Sie: Sind Anrede und Gruß passend? Haben Sie nicht vom Sie zum Du gewechselt? Haben Sie zu jedem wichtigen Punkt etwas gesagt?\n\n*... Frau Duran,*\n*ich möchte mich herzlich für ...*\n*Leider ...*\n*Ich wünsche Ihnen ...*" },
  { type: "exercise", title: ESSAY_TITLE },
];

const essayTask = "Eine Kollegin, Frau Duran, hatte Geburtstag und macht am Wochenende eine große Feier. Sie sind eingeladen, aber an dem Tag können Sie nicht kommen. Schreiben Sie ihr eine E-Mail.\n\nBedanken Sie sich höflich, gratulieren Sie und schreiben Sie auch, warum Sie nicht kommen können (circa 40 Wörter).";

console.log("=== NOVA LEKCIJA ===");
console.log("Naslov:", LESSON_TITLE);
console.log("Sekcije:", sections.map((s) => s.type).join(", "));
console.log("Leseverstehen vežba:", CAT_TITLE, "→ ja/nein, 8 osoba");
catItems.forEach((i) => console.log(`   ${i.text}: ${i.category === 0 ? "ja" : "nein"}`));
console.log("Schreiben esej:", ESSAY_TITLE, "(B1, ide na pregled profesorki)");

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

// 1) insert lekcija (privremeni order_index), pa renumeriši ceo kurs sa novom posle "Modul 1 - Reči"
const { data: ins, error: e1 } = await sb.from("lessons").insert({
  course_id: course.id, title: LESSON_TITLE, lesson_type: "text", order_index: 9999, content: "", sections,
}).select("id").single();
if (e1) { console.error("insert lesson:", e1.message); process.exit(1); }
const newId = ins.id;

const { data: all } = await sb.from("lessons").select("id, title, order_index").eq("course_id", course.id).order("order_index");
const reciIdx = all.findIndex((l) => l.title === "Modul 1 - Reči");
const rest = all.filter((l) => l.id !== newId);
const seq = [];
for (let i = 0; i < rest.length; i++) { seq.push(rest[i].id); if (i === reciIdx) seq.push(newId); }
let ch = 0;
for (let i = 0; i < seq.length; i++) { await sb.from("lessons").update({ order_index: i }).eq("id", seq[i]); ch++; }
console.log(`Lekcija ubačena (id=${newId}), renumerisano ${ch} lekcija.`);

// 2) categorize vežba
const { data: exCat, error: e2 } = await sb.from("exercises").insert({
  lesson_id: newId, title: CAT_TITLE, exercise_type: "categorize", order_index: 1,
}).select("id").single();
if (e2) { console.error("insert cat ex:", e2.message); process.exit(1); }
const { error: e3 } = await sb.from("exercise_questions").insert({
  exercise_id: exCat.id, question: "Ist die Person für das schnelle Duzen von Fremden?",
  question_type: "categorize", correct_answer: "", explanation: null, order_index: 1,
  options: { type: "categorize", items: { items: catItems, categories: ["ja", "nein"] } },
});
if (e3) { console.error("insert cat q:", e3.message); process.exit(1); }

// 3) essay vežba
const { data: exEs, error: e4 } = await sb.from("exercises").insert({
  lesson_id: newId, title: ESSAY_TITLE, exercise_type: "essay", order_index: 2,
}).select("id").single();
if (e4) { console.error("insert essay ex:", e4.message); process.exit(1); }
const { error: e5 } = await sb.from("exercise_questions").insert({
  exercise_id: exEs.id, question: essayTask, question_type: "essay", correct_answer: "",
  explanation: null, order_index: 1, options: { type: "essay" },
});
if (e5) { console.error("insert essay q:", e5.message); process.exit(1); }

console.log("\nGOTOVO ✓  Prüfung lekcija + categorize vežba + Schreiben esej kreirani.");
