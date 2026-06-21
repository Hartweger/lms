/** B1.2 Modul 5 — Prüfung Leseverstehen: Fitnesshaus "Aktivum" (tekst + 4 pitanja a/b/c).
 *  Transkribovano tačno; rešenja izvedena iz teksta. Dry-run; --apply za upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const TITLE = "Prüfung - Leseverstehen: Fitnesshaus Aktivum";
const EX = "Welche Lösung ist richtig? (a/b/c)";
const LQ = "„"; // „
const RQ = "“"; // "

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: ex0 } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", TITLE).maybeSingle();
if (ex0) { console.log("⚠️ Lekcija već postoji:", ex0.id); process.exit(1); }

const text = `**Unsere Regeln im Fitnesshaus ${LQ}Aktivum${RQ}**\n\n` +
  `**Öffnungszeiten:** Unser Fitnesshaus ist täglich von 8 bis 22 Uhr geöffnet. Kurse finden täglich von 10 bis 12 Uhr und von 18 bis 21 Uhr statt. Die Sportgeräte und Duschen können nur innerhalb unserer Öffnungszeiten benutzt werden. Sachen, die nach der Öffnungszeit noch in den Umkleideräumen liegen, werden in den Schrank ${LQ}Fundsachen${RQ} eingeschlossen und können am nächsten Tag in unserem Büro abgeholt werden. In ganz dringenden Fällen können Sie uns auch bis 24 Uhr unter 0151 - 75 95 95 anrufen.\n\n` +
  `**Allgemeines:** In allen Räumen ist auf Ordnung und Sauberkeit zu achten. Jeder legt seine Sachen so zusammen, dass auch andere die Räume nutzen können. Müll gehört in den Mülleimer neben der Tür. Die Sporthalle und die Räume mit den Sportgeräten dürfen nur mit sauberen Sportschuhen betreten werden. Die Sportschuhe dürfen nie, auch nicht auf dem Hin- oder Rückweg, draußen getragen werden, denn kleine Steinchen und Sand machen die Hallenböden kaputt.\n\n` +
  `**Getränke:** Eigene Getränke müssen im Umkleideraum bleiben. Getränke können bei Bedarf aber jederzeit in speziellen Flaschen an unserer Service-Theke gekauft werden. Nur diese Flaschen dürfen mit in den Sportbereich genommen werden. Bitte achten Sie darauf, dass keine Getränke auf den Boden kommen.\n\n` +
  `**Wertgegenstände:** Geldbörsen, Brieftaschen, Schlüssel gehören in die abschließbaren Schränke im Flur. Die Schlüssel gibt es an der Service-Theke gegen Vorlage des Mitgliedsausweises. Bei Verlust des Schlüssels müssen 60 Euro für ein neues Schloss bezahlt werden.`;

// pitanja: [stem, [a,b,c], tačan idx]
const Q = [
  ["1. Wer einen Schlüssel verliert, ...", ["erhält an der Service-Theke einen neuen.", "muss seinen Mitgliedsausweis zeigen.", "muss Geld für ein neues Schloss bezahlen."], "2"],
  ["2. Achten Sie bei Sportschuhen darauf, dass sie ...", ["stets neu sind.", "frei von Steinen oder Sand sind.", "auf dem Hin- und Rückweg nicht dreckig werden."], "1"],
  ["3. Getränke darf man ...", ["nur an der Service-Theke kaufen.", "einfach an Sportgeräten stehen lassen.", `von zu Hause mitbringen, aber nicht in die Sporthalle oder zu den Sportgeräten mitnehmen.`], "2"],
  [`4. Wenn Sie etwas Wichtiges im Umkleideraum vergessen haben, können Sie ...`, ["bis Mitternacht anrufen.", `im Schrank ${LQ}Fundsachen${RQ} selbst suchen.`, "erst am nächsten Tag anrufen."], "0"],
];

const sections = [
  { type: "badge", module: "Modul 5", category: "lesen", pruefung: true },
  { type: "text", style: "uebung", content: `## Leseverstehen\n\nLesen Sie die Aufgaben 1 bis 4 und den Text dazu. Welche Lösung (a, b oder c) ist richtig?\n\nSie informieren sich über die Hausordnung im Fitnesshaus ${LQ}Aktivum${RQ}.` },
  { type: "text", style: "default", content: text },
  { type: "exercise", title: EX },
];

console.log("=== NOVA LEKCIJA ===", TITLE);
console.log("Pitanja:", Q.map((q, i) => `${i + 1}→${String.fromCharCode(97 + parseInt(q[2]))}`).join(" "));

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

const { data: ins, error: e1 } = await sb.from("lessons").insert({ course_id: course.id, title: TITLE, lesson_type: "text", order_index: 9999, content: "", sections }).select("id").single();
if (e1) { console.error("insert:", e1.message); process.exit(1); }
const LID = ins.id;
const { data: all } = await sb.from("lessons").select("id, title, order_index").eq("course_id", course.id).order("order_index");
const rest = all.filter((l) => l.id !== LID);
const ai = rest.findIndex((l) => l.title === "indem und ohne dass - Vereine");
const seq = [];
for (let i = 0; i < rest.length; i++) { seq.push(rest[i].id); if (i === ai) seq.push(LID); }
for (let i = 0; i < seq.length; i++) await sb.from("lessons").update({ order_index: i }).eq("id", seq[i]);

const { data: qex } = await sb.from("exercises").insert({ lesson_id: LID, title: EX, exercise_type: "quiz", order_index: 1 }).select("id").single();
let oi = 1;
for (const [q, opts, a] of Q) await sb.from("exercise_questions").insert({ exercise_id: qex.id, question: q, question_type: "quiz", correct_answer: a, explanation: null, order_index: oi++, options: { type: "quiz", items: opts } });

console.log(`\nGOTOVO ✓  Prüfung Leseverstehen (id=${LID}) — Modul 5, posle indem.`);
