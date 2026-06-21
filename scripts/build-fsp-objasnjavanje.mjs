// FSP lekcija "Objašnjavanje pacijentima" (Aufklärung) iz "FSP novi" materijala
// (objasnjavanje_pacijentima.html). Gotove rečenice za informisanje pacijenta,
// po sekcijama (spoiler: DE pitanje -> SR prevod) + jedna kviz vežba.
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

const LESSON_ID = "60c22cd1-88a9-47ec-b1fa-7f86a97a8bfb"; // FSP > Delovi ispita > Objašnjavanje pacijentima
const SRC = "/Users/natasahartweger/Documents/Claude/sajt/FSP novi/html/objasnjavanje_pacijentima.html";
const QUIZ_TITLE = "Übung - Satz auf Deutsch finden";

// obična crtica svuda (nikad – ili —); ostavlja URL/HTML netaknut jer radimo nad tekstom
const dash = (s) => (typeof s === "string" ? s.replace(/[–—]/g, "-") : s);

// --- Extract SECTIONS i QUIZ iz HTML-a (JSON posle `var SECTIONS=` / `var QUIZ=`) ---
const html = readFileSync(SRC, "utf8");
function extractVar(name) {
  const re = new RegExp("var\\s+" + name + "\\s*=\\s*(\\[[\\s\\S]*?\\])\\s*;", "m");
  const m = html.match(re);
  if (!m) throw new Error(`Nije nađen var ${name}=`);
  return JSON.parse(m[1]);
}
const SECTIONS = extractVar("SECTIONS");

let QUIZ, quizSource;
try {
  QUIZ = extractVar("QUIZ");
  if (!Array.isArray(QUIZ) || QUIZ.length === 0) throw new Error("prazan QUIZ");
  quizSource = "extracted";
} catch {
  // Fallback: konstruiši 6 pitanja iz qa fraza (SR značenje -> izaberi tačnu DE rečenicu)
  const allQa = [];
  for (const sec of SECTIONS) for (const it of sec.items || []) if (it.type === "qa") allQa.push(it);
  const pick = allQa.slice(0, 6);
  QUIZ = pick.map((qa, idx) => {
    const distract = allQa.filter((x) => x !== qa);
    const d1 = distract[(idx * 2) % distract.length];
    const d2 = distract[(idx * 2 + 1) % distract.length];
    const opts = [qa.de, d1.de, d2.de];
    return { sr: qa.sr, opts, c: 0 };
  });
  quizSource = "constructed";
}

// --- Build lesson sections ---
const lessonSections = [{ type: "badge", module: "Delovi ispita" }];

lessonSections.push({
  type: "text",
  style: "default",
  content: dash(
`## Objašnjavanje pacijentima (Aufklärung)

Na ispitu treba da informišeš pacijenta o pregledu ili intervenciji: zašto se radi, kako teče, koji su rizici i koje alternative postoje. Ovde su gotove rečenice (Redemittel) po fazama razgovora.

Klikni na rečenicu da vidiš prevod.`),
});

let totalPhrases = 0;
for (const sec of SECTIONS) {
  const title = dash(sec.title || "").replace(/:$/, "");
  lessonSections.push({ type: "text", content: dash(`### ${title}`) });

  const items = [];
  let pendingSub = "";
  for (const it of sec.items || []) {
    if (it.type === "sub") {
      pendingSub = dash(it.text || "");
      continue;
    }
    if (it.type === "qa") {
      let q = dash(it.de);
      if (pendingSub) { q = `[${pendingSub}] ${q}`; pendingSub = ""; }
      items.push({ question: q, answer: dash(it.sr) });
      totalPhrases++;
    }
    // note tipovi se ignorišu (nema ih u ovom fajlu)
  }
  lessonSections.push({ type: "spoiler", title, items });
}

lessonSections.push({ type: "text", style: "uebung", content: dash("## Vežba") });
lessonSections.push({ type: "exercise", title: QUIZ_TITLE });

// --- Quiz exercise rows ---
const quizQuestions = QUIZ.map((it, i) => ({
  question: dash(it.sr),
  options: { type: "quiz", items: it.opts.map(dash) },
  correct_answer: String(it.c),
  explanation: null,
  order_index: i,
}));

async function main() {
  const { data: lesson, error: le } = await sb.from("lessons").select("id,title,sections").eq("id", LESSON_ID).single();
  if (le || !lesson) throw new Error("Lekcija nije nađena: " + (le?.message || ""));
  console.log(`\nLekcija: ${lesson.title} (${LESSON_ID})`);
  console.log(`Sekcija (HTML): ${SECTIONS.length} -> spoilera: ${SECTIONS.length}`);
  console.log(`Ukupno fraza (qa): ${totalPhrases}`);
  console.log(`Kviz "${QUIZ_TITLE}": ${quizQuestions.length} pitanja (${quizSource})`);
  console.log(`Lesson sections total: ${(lesson.sections || []).length} -> ${lessonSections.length}`);

  // dash sanity
  const blob = JSON.stringify(lessonSections) + JSON.stringify(quizQuestions);
  const bad = (blob.match(/[–—]/g) || []).length;
  console.log(`Loših crtica (–/—): ${bad}`);
  if (bad > 0) throw new Error("Pronađene zabranjene crtice u izlazu!");

  if (!APPLY) { console.log("\n[DRY-RUN] Nije upisano. --apply za primenu.\n"); return; }

  const { error: ue } = await sb.from("lessons").update({ sections: lessonSections, lesson_type: "text" }).eq("id", LESSON_ID);
  if (ue) throw new Error("Update sekcija: " + ue.message);
  console.log("✓ Sekcije ažurirane");

  const { data: oldEx } = await sb.from("exercises").select("id").eq("lesson_id", LESSON_ID);
  if (oldEx?.length) {
    const ids = oldEx.map((e) => e.id);
    await sb.from("exercise_questions").delete().in("exercise_id", ids);
    await sb.from("exercises").delete().in("id", ids);
    console.log(`✓ Obrisano starih vežbi: ${ids.length}`);
  }

  const { data: row, error: ee } = await sb.from("exercises").insert({ lesson_id: LESSON_ID, title: QUIZ_TITLE, exercise_type: "quiz", order_index: 0 }).select("id").single();
  if (ee) throw new Error("Insert vežbe: " + ee.message);
  const { error: qe } = await sb.from("exercise_questions").insert(quizQuestions.map((q) => ({ ...q, exercise_id: row.id })));
  if (qe) throw new Error("Insert pitanja: " + qe.message);
  console.log(`✓ ${QUIZ_TITLE} (quiz, ${quizQuestions.length})`);

  console.log("\nGotovo. Pregled: /lekcija/" + LESSON_ID + "\n");
}
main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
