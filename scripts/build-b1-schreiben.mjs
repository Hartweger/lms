// B1 Schreiben (Modelltest) → Goethe B1, lekcija "Masterclass – Schreiben und Sprechen – B1".
// 3 Aufgabe (essay). Briše postojeće essay vežbe te lekcije pa upiše ove. Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const EX = "Schreiben — Modelltest B1";

const A1 = [
  "Aufgabe 1 (Arbeitszeit: 20 Minuten)", "",
  "Ihr Cousin, der in einer anderen Stadt wohnt, hat gerade das Abitur mit einer sehr guten Note bestanden und möchte das mit einer großen Party feiern.", "",
  "– Bedanken Sie sich für die Einladung und sagen Sie zu.",
  "– Machen Sie Vorschläge, wie Sie bei den Partyvorbereitungen helfen könnten.",
  "– Schreiben Sie, wann Sie kommen und wie lange Sie bleiben werden.", "",
  "Schreiben Sie eine E-Mail (circa 80 Wörter). Schreiben Sie etwas zu allen drei Punkten. Achten Sie auf den Textaufbau (Anrede, Einleitung, Reihenfolge der Inhaltspunkte, Schluss).",
].join("\n");

const A2 = [
  "Aufgabe 2 (Arbeitszeit: 25 Minuten)", "",
  "Sie haben im Fernsehen eine Diskussionssendung zum Thema „Freundschaft“ gesehen. Im Online-Gästebuch der Sendung finden Sie folgende Meinung:", "",
  "„Ich habe mich oft gefragt, ob es überhaupt wahre Freundschaft gibt. Leider haben mich ‚meine besten Freundinnen‘ mehrmals enttäuscht. Anfangs war ich immer traurig, jetzt weiß ich, dass ein Leben ohne Freunde auch möglich ist – dank Internet.“", "",
  "Schreiben Sie nun Ihre Meinung (circa 80 Wörter).",
].join("\n");

const A3 = [
  "Aufgabe 3 (Arbeitszeit: 15 Minuten)", "",
  "In Ihrem Deutschkurs wurde gestern ein Test geschrieben, aber Sie waren nicht da. Schreiben Sie an Ihren Kursleiter, Herrn Zeidler. Entschuldigen Sie sich höflich für Ihr Fehlen und bitten Sie um einen Termin, an dem Sie den Test nachschreiben können.", "",
  "Schreiben Sie eine E-Mail (circa 40 Wörter). Vergessen Sie nicht die Anrede und den Gruß am Schluss.",
].join("\n");

const { data: course } = await sb.from("courses").select("id").eq("slug", "polozi-goethe-b1").single();
const { data: lesson } = await sb.from("lessons").select("id").eq("course_id", course.id).ilike("title", "%Masterclass%").single();
console.log(`Masterclass B1 lekcija: ${lesson.id}`);
if (!APPLY) { console.log("[DRY] --apply (briše stare essay vežbe, upiše 3 Aufgabe)."); process.exit(0); }

await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("exercise_type", "essay");
const { data: ex } = await sb.from("exercises").insert({ lesson_id: lesson.id, title: EX, exercise_type: "essay", order_index: 1 }).select("id").single();
let i = 0;
for (const task of [A1, A2, A3]) {
  await sb.from("exercise_questions").insert({ exercise_id: ex.id, question: task, options: { type: "essay" }, correct_answer: "", question_type: "essay", order_index: i++ });
}
console.log(`✓ "${EX}": 3 Aufgabe (essay) na Masterclass B1`);
