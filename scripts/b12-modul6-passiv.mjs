/** B1.2 Modul 6 — "Passiv - Geschichte des Fußballs": obnavljanje Passiv Präsens → Präteritum → Perfekt.
 *  Tekst transkribovan tačno, primeri iz teksta. Dry-run; --apply za upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const TITLE = "Passiv - Geschichte des Fußballs";
const EX = "Welches Passiv? (Präteritum oder Perfekt)";
const MODULE = "Modul 6 · Politik und Geschichte";

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: ex0 } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", TITLE).maybeSingle();
if (ex0) { console.log("⚠️ Lekcija već postoji:", ex0.id); process.exit(1); }

const text = "**Die Geschichte des Fußballs**\n\n" +
  "Vor 140 Jahren **wurde** in Deutschland noch kein Fußball **gespielt**. Der Fußball **ist** erst 1874 von dem deutschen Lehrer Konrad Koch in Braunschweig nach Deutschland **gebracht worden**. Koch wollte an seiner Jungenschule für mehr Bewegung und Gemeinschaft sorgen. Er ließ einen Ball aus England schicken, dem einzigen Land, in dem Fußball damals bekannt war.\n\n" +
  "Zuerst **wurde** Kochs Idee von seinen Lehrerkollegen **abgelehnt**. Er bekam viel Ärger wegen des körperlichen Spiels und der chaotischen und ungeregelten Zustände auf dem Fußballfeld. Nur von wenigen Kollegen **wurde** er **unterstützt**. 1875 **ist** dann das erste Fußball-Regelwerk **geschrieben worden**. Sein Autor? Konrad Koch.\n\n" +
  "Im selben Jahr gründete Koch an seiner Schule den ersten Fußballverein. Bei den Schülern wurde der Sport immer beliebter. Sie hatten nicht nur Spaß, sondern lernten auch, Verantwortung zu übernehmen und Konflikte zu lösen. Auch in anderen Schulen und bei Erwachsenen wurde der Sport immer populärer.\n\n" +
  "Im Jahr 1900 **ist** dann von 86 Klubs der Deutsche Fußballbund (DFB) **gegründet worden**. Das alles verdanken wir auch dem Lehrer Konrad Koch.";

const OPTS = ["Präteritum (wurde + Partizip II)", "Perfekt (ist + Partizip II + worden)"];
const Q = [
  ["Vor 140 Jahren ______ in Deutschland noch kein Fußball gespielt.", "0", "wurde + gespielt → Präteritum."],
  ["Der Fußball ______ 1874 nach Deutschland gebracht ______ .", "1", "ist + gebracht + worden → Perfekt."],
  ["Zuerst ______ Kochs Idee von seinen Lehrerkollegen abgelehnt.", "0", "wurde + abgelehnt → Präteritum."],
  ["1875 ______ das erste Fußball-Regelwerk geschrieben ______ .", "1", "ist + geschrieben + worden → Perfekt."],
  ["Im Jahr 1900 ______ der Deutsche Fußballbund gegründet ______ .", "1", "ist + gegründet + worden → Perfekt."],
];

const sections = [
  { type: "badge", module: MODULE, category: "grammatik" },
  { type: "text", style: "info", content: "## Pasiv - fokus na radnju\n\nU pasivu je važno **šta se radi**, a ne ko radi. Gradi se sa **werden** + **Partizip II**. Ko vrši radnju (opciono) dodaje se sa **von** + Dativ: *von dem Lehrer Konrad Koch*." },
  { type: "text", style: "beispiele", content: "## Pasiv prezenta (obnavljanje)\n\n**werden** (prezent) + Partizip II\n- *Der Ball **wird gespielt**.* (Lopta se igra.)\n- *Das erste Regelwerk **wird geschrieben**.*" },
  { type: "text", style: "beispiele", content: "## Pasiv preterita (prošlost)\n\nwerden u preteritu = **wurde** + Partizip II\n- *Vor 140 Jahren **wurde** in Deutschland noch kein Fußball **gespielt**.*\n- *Zuerst **wurde** Kochs Idee **abgelehnt**.*" },
  { type: "text", style: "beispiele", content: "## Pasiv perfekta\n\n**sein** + Partizip II + **worden** (pažnja: worden, NE geworden)\n- *Der Fußball **ist** nach Deutschland **gebracht worden**.*\n- *1875 **ist** das erste Regelwerk **geschrieben worden**.*" },
  { type: "table", headers: ["Vreme", "Oblik", "Primer"], rows: [
    ["Präsens", "wird + Partizip II", "Der Ball wird gespielt."],
    ["Präteritum", "wurde + Partizip II", "Der Ball wurde gespielt."],
    ["Perfekt", "ist + Partizip II + worden", "Der Ball ist gespielt worden."],
  ] },
  { type: "text", style: "uebung", content: "## Lesen: Die Geschichte des Fußballs\n\nLies den Text. Die Passiv-Formen sind **fett** markiert." },
  { type: "text", style: "default", content: text },
  { type: "exercise", title: EX },
];

console.log("=== NOVA LEKCIJA ===", TITLE);
console.log("Vežba:", Q.map((q, i) => `${i + 1}→${OPTS[parseInt(q[1])].split(" ")[0]}`).join(" "));

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

const { data: ins, error: e1 } = await sb.from("lessons").insert({ course_id: course.id, title: TITLE, lesson_type: "text", order_index: 9999, content: "", sections }).select("id").single();
if (e1) { console.error("insert:", e1.message); process.exit(1); }
const LID = ins.id;
// PRVA lekcija Modula 6 → pre "Prüfung - Lesen und Hören (Modul 6)"
const { data: all } = await sb.from("lessons").select("id, title, order_index").eq("course_id", course.id).order("order_index");
const rest = all.filter((l) => l.id !== LID);
const pi = rest.findIndex((l) => l.title === "Prüfung - Lesen und Hören (Modul 6)");
const seq = [];
for (let i = 0; i < rest.length; i++) { if (i === pi) seq.push(LID); seq.push(rest[i].id); }
for (let i = 0; i < seq.length; i++) await sb.from("lessons").update({ order_index: i }).eq("id", seq[i]);

const { data: qex } = await sb.from("exercises").insert({ lesson_id: LID, title: EX, exercise_type: "quiz", order_index: 1 }).select("id").single();
let oi = 1;
for (const [q, a, e] of Q) await sb.from("exercise_questions").insert({ exercise_id: qex.id, question: q, question_type: "quiz", correct_answer: a, explanation: e, order_index: oi++, options: { type: "quiz", items: OPTS } });

console.log(`\nGOTOVO ✓  Passiv lekcija (id=${LID}) — PRVA u Modulu 6.`);
