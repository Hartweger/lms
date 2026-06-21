// FSP lekcija "Anamneza" (Modul 4 "Delovi ispita") iz "FSP novi" materijala
// (anamneza_pitanja.html). Konvertuje phrase-bank u native LMS blokove:
// badge + intro + (heading + spoiler) po sekciji + Übung kviz.
// Dry-run default; --apply za primenu. Idempotentno.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const LESSON_ID = "5204ac4b-eeb0-439d-be93-ed67805f54d2"; // FSP > Delovi ispita > Anamneza
const SOURCE = "/Users/natasahartweger/Documents/Claude/sajt/FSP novi/html/anamneza_pitanja.html";

// HYPHEN pravilo: nikad – ili —, samo obična crtica -
const fixDash = (s) => (typeof s === "string" ? s.replace(/[–—]/g, "-") : s);

// ---- EXTRACT iz HTML-a ----
const html = readFileSync(SOURCE, "utf8");
function extractArray(varName) {
  const re = new RegExp("var\\s+" + varName + "\\s*=\\s*(\\[[\\s\\S]*?\\]);", "m");
  const m = html.match(re);
  if (!m) throw new Error("Nije nađen niz: " + varName);
  return JSON.parse(m[1]);
}
const SECTIONS = extractArray("SECTIONS");
const QUIZ = extractArray("QUIZ");

// ---- BUILD sekcije ----
const sections = [{ type: "badge", module: "Delovi ispita" }];

sections.push({
  type: "text",
  style: "default",
  content: fixDash(
`## Anamneza - pitanja i reakcije

Ovo je deo usmenog ispita gde uzimaš anamnezu od pacijenta: postavljaš pitanja i biraš prave reakcije. Prođi kroz sekcije i nauči fraze - klikni na rečenicu da vidiš prevod.`)
});

let spoilerCount = 0;
let qaTotal = 0;

for (const sec of SECTIONS) {
  const title = fixDash(String(sec.title || "").replace(/:$/, "").trim());
  sections.push({ type: "text", style: "default", content: fixDash("### " + title) });

  const items = [];
  let pendingSub = null; // tekst "sub" koji se prefiksuje na sledeći qa
  for (const it of sec.items || []) {
    if (it.type === "sub") {
      pendingSub = fixDash(String(it.text || "").replace(/:$/, "").trim());
    } else if (it.type === "qa") {
      let question = fixDash(it.de);
      if (pendingSub) {
        question = "[" + pendingSub + "] " + question;
        pendingSub = null;
      }
      items.push({ question, answer: fixDash(it.sr) });
      qaTotal++;
    }
    // "note" items se preskaču (nisu qa parovi)
  }

  sections.push({ type: "spoiler", title, items });
  spoilerCount++;
}

sections.push({ type: "text", style: "uebung", content: "## Vežba" });
const QUIZ_TITLE = "Übung - Frage auf Deutsch finden";
sections.push({ type: "exercise", title: QUIZ_TITLE });

// ---- BUILD kviz vežba (jedna) ----
// QUIZ: [{ sr, opts:[de,de,de], c:index }]
const quizQuestions = QUIZ.map((it) => ({
  question: fixDash(it.sr),
  items: it.opts.map(fixDash),
  c: it.c,
  explanation: fixDash("Tačno: " + it.opts[it.c]),
}));

const exercises = [
  { title: QUIZ_TITLE, exercise_type: "quiz", questions: quizQuestions },
];

function buildRows(ex, exId) {
  return ex.questions.map((q, i) => ({
    exercise_id: exId,
    question: q.question,
    options: { type: "quiz", items: q.items },
    correct_answer: String(q.c),
    explanation: q.explanation,
    order_index: i,
  }));
}

async function main() {
  const { data: lesson, error: le } = await sb.from("lessons").select("id,title,sections").eq("id", LESSON_ID).single();
  if (le || !lesson) throw new Error("Lekcija nije nađena: " + (le?.message || ""));
  console.log(`\nLekcija: ${lesson.title} (${LESSON_ID})`);
  console.log(`SECTIONS u izvoru: ${SECTIONS.length} -> spoiler-a: ${spoilerCount}`);
  console.log(`Ukupno qa fraza: ${qaTotal}`);
  console.log(`Kviz pitanja (extracted): ${quizQuestions.length}`);
  console.log(`Ukupno LMS sekcija: ${sections.length}`);

  // sanity: nema en/em dash nigde
  const blob = JSON.stringify(sections) + JSON.stringify(exercises);
  const bad = (blob.match(/[–—]/g) || []).length;
  console.log(`en/em dash u izlazu: ${bad}`);
  if (bad > 0) throw new Error("Pronađen – ili — u izlazu, prekidam.");

  if (!APPLY) { console.log("\n[DRY-RUN] Nije upisano. --apply za primenu.\n"); return; }

  const { error: ue } = await sb.from("lessons").update({ sections, lesson_type: "text" }).eq("id", LESSON_ID);
  if (ue) throw new Error("Update sekcija: " + ue.message);
  console.log("✓ Sekcije ažurirane");

  const { data: oldEx } = await sb.from("exercises").select("id").eq("lesson_id", LESSON_ID);
  if (oldEx?.length) {
    const ids = oldEx.map((e) => e.id);
    await sb.from("exercise_questions").delete().in("exercise_id", ids);
    await sb.from("exercises").delete().in("id", ids);
    console.log(`✓ Obrisano starih vežbi: ${ids.length}`);
  }
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const { data: row, error: ee } = await sb.from("exercises").insert({ lesson_id: LESSON_ID, title: ex.title, exercise_type: ex.exercise_type, order_index: i }).select("id").single();
    if (ee) throw new Error("Insert vežbe: " + ee.message);
    const { error: qe } = await sb.from("exercise_questions").insert(buildRows(ex, row.id));
    if (qe) throw new Error("Insert pitanja: " + qe.message);
    console.log(`✓ ${ex.title} (${ex.exercise_type}, ${ex.questions.length})`);
  }
  console.log("\nGotovo. Pregled: /lekcija/" + LESSON_ID + "\n");
}
main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
