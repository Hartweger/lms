// FSP lekcija "Predstavljanje pacijenta" (Patientenvorstellung - Muster), Modul 4 "Delovi ispita".
// Izvor: "FSP novi/html/patientenvorstellung_muster.html" (strukturirani uzorak predstavljanja pacijenta).
// Ekstrahuje var SECTIONS (qa/sub/note) + var QUIZ iz HTML-a; gradi spoiler-sekcije + jednu kviz vežbu.
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

const LESSON_ID = "25da92fc-92cb-42c6-a67c-b379f0e9d725"; // FSP > Delovi ispita > Predstavljanje pacijenta
const SRC = "/Users/natasahartweger/Documents/Claude/sajt/FSP novi/html/patientenvorstellung_muster.html";
const EXERCISE_TITLE = "Übung - Redemittel auf Deutsch finden";

// hyphen sanitizer: nikad – ili —
const noDash = (s) => s.replace(/[–—]/g, "-");

// --- Ekstrakcija iz HTML-a ---
const html = readFileSync(SRC, "utf8");

function extractJsonAfter(varName) {
  const re = new RegExp("var\\s+" + varName + "\\s*=\\s*(\\[)", "m");
  const m = re.exec(html);
  if (!m) throw new Error("Ne mogu naći var " + varName);
  // balansiraj zagrade od pozicije [
  let i = m.index + m[0].length - 1;
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let p = i; p < html.length; p++) {
    const ch = html[p];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else {
      if (ch === '"') inStr = true;
      else if (ch === "[") depth++;
      else if (ch === "]") { depth--; if (depth === 0) { end = p; break; } }
    }
  }
  if (end < 0) throw new Error("Neuravnotežene zagrade za " + varName);
  return JSON.parse(html.slice(i, end + 1));
}

const SECTIONS_SRC = extractJsonAfter("SECTIONS");
let QUIZ_SRC = null;
let quizSource = "extracted";
try {
  QUIZ_SRC = extractJsonAfter("QUIZ");
  if (!Array.isArray(QUIZ_SRC) || QUIZ_SRC.length === 0) throw new Error("prazan");
} catch (e) {
  QUIZ_SRC = null;
  quizSource = "constructed";
}

// --- Gradnja sekcija lekcije ---
const sections = [
  { type: "badge", module: "Delovi ispita" },
  { type: "text", style: "default", content:
`## Predstavljanje pacijenta (Patientenvorstellung)

Ovo je uzorak (Muster) za strukturirano predstavljanje pacijenta - prati redosled delova ispita: uvod, lični podaci, aktuelne tegobe, anamneza, sumnja na dijagnozu i dalji postupak. Prođi kroz svaku sekciju i upij gotove formulacije (Redemittel) koje možeš da koristiš na ispitu.

Klikni na rečenicu da vidiš prevod.` },
];

let totalPhrases = 0;
for (const sec of SECTIONS_SRC) {
  const title = noDash(sec.title);
  sections.push({ type: "text", content: "### " + title });
  const items = [];
  let pendingSub = null;
  for (const it of sec.items) {
    if (it.type === "sub") {
      pendingSub = noDash(it.text);
    } else if (it.type === "qa") {
      let q = noDash(it.de);
      if (pendingSub) { q = "[" + pendingSub + "] " + q; pendingSub = null; }
      items.push({ question: q, answer: noDash(it.sr) });
      totalPhrases++;
    }
    // note se ne prenosi u spoiler (nije qa); sub se prefiksuje na sledeći qa
  }
  sections.push({ type: "spoiler", title, items });
}

sections.push({ type: "text", style: "uebung", content: "## Vežba" });
sections.push({ type: "exercise", title: EXERCISE_TITLE });

// --- Kviz ---
let quizItems;
if (QUIZ_SRC) {
  quizItems = QUIZ_SRC.map((q) => ({
    q: noDash(q.sr),
    opts: q.opts.map(noDash),
    c: q.c,
    e: noDash(q.opts[q.c]),
  }));
} else {
  // Fallback: konstruiši 6 pitanja iz qa fraza (sr -> tačan de, 3 opcije)
  const allQa = [];
  for (const sec of SECTIONS_SRC)
    for (const it of sec.items)
      if (it.type === "qa") allQa.push({ de: noDash(it.de), sr: noDash(it.sr) });
  const pick = [];
  const step = Math.max(1, Math.floor(allQa.length / 6));
  for (let i = 0; i < allQa.length && pick.length < 6; i += step) pick.push(allQa[i]);
  quizItems = pick.map((item, idx) => {
    const distractors = allQa.filter((x) => x.de !== item.de);
    const d1 = distractors[(idx * 7 + 1) % distractors.length].de;
    const d2 = distractors[(idx * 13 + 3) % distractors.length].de;
    const opts = [item.de, d1, d2];
    return { q: item.sr, opts, c: 0, e: item.de };
  });
}

const exercise = {
  title: EXERCISE_TITLE,
  exercise_type: "quiz",
  questions: quizItems,
};

function buildRows(ex, exId) {
  return ex.questions.map((q, i) => ({
    exercise_id: exId,
    question: q.q,
    options: { type: "quiz", items: q.opts },
    correct_answer: String(q.c),
    explanation: q.e,
    order_index: i,
  }));
}

// verifikacija pre upisa: nula crtica
function assertNoDash() {
  const blob = JSON.stringify(sections) + JSON.stringify(exercise);
  if (/[–—]/.test(blob)) throw new Error("Pronađena – ili — u sadržaju!");
}

async function main() {
  const { data: lesson, error: le } = await sb.from("lessons").select("id,title,sections").eq("id", LESSON_ID).single();
  if (le || !lesson) throw new Error("Lekcija nije nađena: " + (le?.message || ""));

  const nSections = SECTIONS_SRC.length;
  const nSpoilers = sections.filter((s) => s.type === "spoiler").length;
  assertNoDash();

  console.log(`\nLekcija: ${lesson.title} (${LESSON_ID})`);
  console.log(`Izvorne sekcije: ${nSections} -> spoiler-a: ${nSpoilers}`);
  console.log(`Ukupno fraza (qa): ${totalPhrases}`);
  console.log(`Kviz: ${quizItems.length} pitanja (${quizSource})`);
  console.log(`Sekcija ukupno u lekciji: ${sections.length}`);
  console.log(`Nula –/—: OK`);

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
  const { data: row, error: ee } = await sb.from("exercises").insert({ lesson_id: LESSON_ID, title: exercise.title, exercise_type: exercise.exercise_type, order_index: 0 }).select("id").single();
  if (ee) throw new Error("Insert vežbe: " + ee.message);
  const { error: qe } = await sb.from("exercise_questions").insert(buildRows(exercise, row.id));
  if (qe) throw new Error("Insert pitanja: " + qe.message);
  console.log(`✓ ${exercise.title} (${exercise.exercise_type}, ${exercise.questions.length})`);

  console.log("\nGotovo. Pregled: /lekcija/" + LESSON_ID + "\n");
}
main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
