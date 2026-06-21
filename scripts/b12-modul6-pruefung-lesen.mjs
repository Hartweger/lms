/** B1.2 Modul 6 · Politik und Geschichte — Prüfung Leseverstehen: Amir Roughani (tekst + 5 pitanja a/b/c).
 *  Transkribovano tačno; rešenja sa slika (1a 2c 3a 4c 5c). Dry-run; --apply za upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const TITLE = "Prüfung - Leseverstehen: Amir Roughani";
const EX = "Welche Lösung ist richtig? (a/b/c)";
const MODULE = "Modul 6 · Politik und Geschichte";
const LQ = "„", RQ = "“";

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: ex0 } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", TITLE).maybeSingle();
if (ex0) { console.log("⚠️ Lekcija već postoji:", ex0.id); process.exit(1); }

const text = `**Vom Flüchtling zum vielfach ausgezeichneten Unternehmer**\n*Die Erfolgsgeschichte von Amir Roughani*\n\n` +
  `Amir Roughani wird am 15. Juli 1975 in Isfahan in Iran geboren. Mit elf Jahren schicken ihn seine Eltern wegen des Iran-Irak-Krieges nach Deutschland, weil er sonst als Jugendlicher im Krieg kämpfen müsste. Er landet in Berlin, wo er als Flüchtlingskind politisches Asyl beantragt. Dort wächst er zunächst ohne Deutschkenntnisse in einem Kinderheim auf, in dem auch sein drei Jahre älterer Bruder untergebracht ist. Anfangs besucht er eine Hauptschule und geht dort in eine spezielle Ausländerklasse, wo er aber mehr Türkisch als Deutsch lernt. Die ersten Monate sind sehr hart für ihn. Aber allmählich geschehen immer mehr Ereignisse, die sein Leben positiv verändern. Seine Mathematiklehrerin bemüht sich, dass er in eine gemischte Klasse kommt. Der Deutsch-Nachhilfelehrer im Kinderheim gibt ihm Extraunterricht, wenn andere Schüler nicht zur Nachhilfe kommen. Begeistert nutzt er jede Chance, die sich ihm bietet. Eines Tages entdeckt ein Trainer zufällig Amirs Talent, als das Kinderheim einen Ausflug zum Kegeln macht; der Jugendliche trainiert daraufhin viele Jahre in einem Berliner Kegelklub und wird schließlich sogar Deutscher Meister.\n\n` +
  `Nach dem Hauptschulabschluss beginnt Amir eine Ausbildung bei einem Pharmaunternehmen. Voll motiviert macht er nebenbei sein Fachabitur und studiert anschließend Wirtschaftsingenieurwesen. Nach einigen Jahren als Angestellter macht er sich 2002 selbstständig mit seiner Technologiefirma VISPIRON in München, die mittlerweile 480 Mitarbeiter beschäftigt und einen Jahresumsatz von rund 50 Millionen Euro macht - eine Erfolgsgeschichte, sicher. Aber Roughani hat bei all dem Erfolg nie vergessen, wie schwer der Anfang war und wie wichtig es war, dass es Menschen gab, die an ihn glaubten. Daher war es für ihn selbstverständlich, ebenfalls Verantwortung zu übernehmen. Heute unterstützt er beispielsweise die Deutsch-Iranische-Krebshilfe, er fördert die KIKUS Deutschkurse für Kinder mit Migrationshintergrund und ist aktiv an einer internationalen Initiative gegen den Klimawandel beteiligt. Auch in seinem Unternehmen ist seine Sicht auf die Welt zu bemerken. Er hat u.a. den Preis ${LQ}Entrepreneur des Jahres 2014${RQ} für seine unternehmerische Leistung, die Mitarbeiterführung und sein soziales Engagement und gleich mehrmals den Preis ${LQ}Great Place to Work${RQ} erhalten, eine Auszeichnung für besonders beliebte und ausgezeichnete Arbeitgeber. Wichtig ist Amir Roughani auch sein Hilfsprojekt ${LQ}V-4-TALENTS${RQ}. Hier fördert er begabte und hochmotivierte Kinder und Jugendliche aus sozial benachteiligten Familien im Sport und begleitet sie darüber hinaus bis in ihr Berufsleben hinein. Er möchte junge Menschen ermutigen, ihr Leben in die Hand zu nehmen, Chancen zu nutzen und sich weiterzubilden. ${LQ}Die persönliche Unterstützung, die ich als Jugendlicher in Deutschland empfangen habe, möchte ich in derselben Form an Jugendliche zurückgeben.${RQ}`;

const Q = [
  ["1. Amir Roughani hat verschiedene Preise erhalten, weil ...", ["er sich in seiner Firma und in der Gesellschaft für ein besseres Leben stark macht.", "er im Kegeln sehr erfolgreich war.", "seine Mitarbeiter finden, dass er ein sehr guter Chef ist."], "0"],
  ["2. Amir Roughani ist nach Deutschland gekommen, weil ...", ["es dort bessere Bildungschancen für ihn gab.", "sein Bruder auch schon da war.", "seine Eltern nicht wollten, dass er im Krieg kämpfen muss."], "2"],
  ["3. Amir Roughani fördert heute talentierte Jugendliche aus sozial benachteiligten Familien, weil ...", ["ihm als Jugendlicher die Unterstützung von Erwachsenen sehr geholfen hat.", "er die jungen Menschen weiterbilden möchte.", "er sie besser auf das Berufsleben vorbereiten möchte."], "0"],
  ["4. Für Amir Roughani war es sehr positiv, dass er ...", ["von seiner Lehrerin Extrahilfe in Mathematik bekommen hat.", "in der gemischten Klasse Türkisch gelernt hat.", "von einem Lehrer manchmal zusätzlichen Förderunterricht in Deutsch bekommen hat."], "2"],
  ["5. Nach dem Hauptschulabschluss hat er ...", ["sich sofort selbstständig gemacht.", "das Fachabitur und eine Ausbildung gemacht, studiert und war danach bei VISPIRON angestellt.", "das Fachabitur gemacht, studiert und war später auch angestellt, bevor er seine eigene Firma gründete."], "2"],
];

const sections = [
  { type: "badge", module: MODULE, category: "lesen", pruefung: true },
  { type: "text", style: "uebung", content: "## Leseverstehen\n\nLesen Sie den Text und die Aufgaben 1 bis 5. Welche Lösung (a, b oder c) ist jeweils richtig?" },
  { type: "text", style: "default", content: text },
  { type: "exercise", title: EX },
];

console.log("=== NOVA LEKCIJA ===", TITLE);
console.log("Modul:", MODULE);
console.log("Pitanja:", Q.map((q, i) => `${i + 1}→${String.fromCharCode(97 + parseInt(q[2]))}`).join(" "));

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

const { data: ins, error: e1 } = await sb.from("lessons").insert({ course_id: course.id, title: TITLE, lesson_type: "text", order_index: 9999, content: "", sections }).select("id").single();
if (e1) { console.error("insert:", e1.message); process.exit(1); }
const LID = ins.id;
// privremeno: posle Modul 5 Prüfung (Modul 6 se grupiše kasnije)
const { data: all } = await sb.from("lessons").select("id, title, order_index").eq("course_id", course.id).order("order_index");
const rest = all.filter((l) => l.id !== LID);
const ai = rest.findIndex((l) => l.title === "Prüfung - Leseverstehen: Fitnesshaus Aktivum");
const seq = [];
for (let i = 0; i < rest.length; i++) { seq.push(rest[i].id); if (i === ai) seq.push(LID); }
for (let i = 0; i < seq.length; i++) await sb.from("lessons").update({ order_index: i }).eq("id", seq[i]);

const { data: qex } = await sb.from("exercises").insert({ lesson_id: LID, title: EX, exercise_type: "quiz", order_index: 1 }).select("id").single();
let oi = 1;
for (const [q, opts, a] of Q) await sb.from("exercise_questions").insert({ exercise_id: qex.id, question: q, question_type: "quiz", correct_answer: a, explanation: null, order_index: oi++, options: { type: "quiz", items: opts } });

console.log(`\nGOTOVO ✓  Prüfung Leseverstehen (id=${LID}) — Modul 6 · Politik und Geschichte.`);
