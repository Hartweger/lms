// FSP lekcija "Dokumentacija" (Module 4 "Delovi ispita") iz "FSP novi" materijala
// (dokumentacija_redemittel.html). Redemittel za Arztbrief, grupisani po Aufbau-u,
// kao spoiler sekcije (klik = prevod) + 1 kviz vežba (srpski -> nemački Redemittel).
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

const LESSON_ID = "a4e33c1d-5c73-4b57-9547-5c4d6ddd9bed"; // FSP > Delovi ispita > Dokumentacija
const QUIZ_TITLE = "Übung - Redemittel auf Deutsch finden";
const HTML = "/Users/natasahartweger/Documents/Claude/sajt/FSP novi/html/dokumentacija_redemittel.html";

// --- EXTRACT iz HTML-a ---
const html = readFileSync(HTML, "utf8");
function extractVar(name) {
  const start = html.indexOf("var " + name + "=");
  if (start < 0) throw new Error("Nije nađen var " + name);
  const jsonStart = html.indexOf("[", start);
  // pronađi kraj balansiranjem zagrada van stringova
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = jsonStart; i < html.length; i++) {
    const ch = html[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "[") depth++;
    else if (ch === "]") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end < 0) throw new Error("Nije zatvoren niz za " + name);
  return JSON.parse(html.slice(jsonStart, end + 1));
}

const SECTIONS = extractVar("SECTIONS");

// Quiz: probaj iz HTML-a (QUIZ), inače konstruiši iz qa fraza
let quizQuestions;
let quizSource;
try {
  const QUIZ = extractVar("QUIZ");
  if (!Array.isArray(QUIZ) || QUIZ.length === 0) throw new Error("prazan QUIZ");
  quizQuestions = QUIZ.map((it) => ({
    q: it.sr,
    opts: it.opts,
    c: it.c,
    e: it.opts[it.c],
  }));
  quizSource = "extracted";
} catch {
  // KONSTRUKCIJA: 6 pitanja iz qa fraza, srpski -> 3 nemačke opcije (1 tačna + 2 distraktora)
  const allQa = [];
  for (const sec of SECTIONS) for (const it of sec.items) if (it.type === "qa") allQa.push(it);
  const pick = allQa.slice(0, 6);
  quizQuestions = pick.map((qa, i) => {
    const distractors = allQa.filter((x) => x !== qa);
    const d1 = distractors[(i * 2) % distractors.length];
    const d2 = distractors[(i * 2 + 1) % distractors.length];
    const opts = [qa.de, d1.de, d2.de];
    return { q: qa.sr, opts, c: 0, e: qa.de };
  });
  quizSource = "constructed";
}

// --- BUILD sekcije ---
const sections = [];
sections.push({ type: "badge", module: "Delovi ispita" });
sections.push({
  type: "text", style: "default", content:
`## Dokumentation - Arztbrief

Na usmenom delu FSP ispita treba da diktiraš lekarsko pismo (Arztbrief) kolegi. Ovde imaš gotove formulacije (Redemittel) poređane po delovima pisma. Klikni na rečenicu da vidiš prevod, pa proveri znanje u vežbi na kraju.`,
});

let totalPhrases = 0;
for (const sec of SECTIONS) {
  sections.push({ type: "text", content: "### " + sec.title });
  const items = [];
  let pendingSub = null;
  for (const it of sec.items) {
    if (it.type === "sub") { pendingSub = it.text; continue; }
    if (it.type === "qa") {
      const question = pendingSub ? "[" + pendingSub + "] " + it.de : it.de;
      pendingSub = null;
      items.push({ question, answer: it.sr });
      totalPhrases++;
    }
    // note tip se ignoriše (nije qa)
  }
  sections.push({ type: "spoiler", title: sec.title, items });
}

sections.push({ type: "text", style: "uebung", content: "## Vežba" });
sections.push({ type: "exercise", title: QUIZ_TITLE });

// --- GUARD: bez en/em crtice ---
function assertNoDash(label, value) {
  const s = JSON.stringify(value);
  if (s.includes("–") || s.includes("—")) throw new Error("Pronađena – ili — u " + label);
}
assertNoDash("sections", sections);
assertNoDash("quiz", quizQuestions);

const spoilerCount = sections.filter((s) => s.type === "spoiler").length;

async function main() {
  const { data: lesson, error: le } = await sb.from("lessons").select("id,title,sections").eq("id", LESSON_ID).single();
  if (le || !lesson) throw new Error("Lekcija nije nađena: " + (le?.message || ""));
  console.log(`\nLekcija: ${lesson.title} (${LESSON_ID})`);
  console.log(`Sekcija (HTML): ${SECTIONS.length} -> spoilera: ${spoilerCount}`);
  console.log(`Fraza (qa) ukupno: ${totalPhrases}`);
  console.log(`Kviz: ${quizQuestions.length} pitanja (${quizSource})`);
  console.log(`Ukupno sekcija lekcije: ${(lesson.sections || []).length} -> ${sections.length}`);

  if (!APPLY) { console.log("\n[DRY-RUN] Nije upisano. --apply za primenu.\n"); return; }

  const { error: ue } = await sb.from("lessons").update({ sections, lesson_type: "text" }).eq("id", LESSON_ID);
  if (ue) throw new Error("Update sekcija: " + ue.message);
  console.log("✓ Sekcije ažurirane");

  // Idempotentni delete vežbi te lekcije
  const { data: oldEx } = await sb.from("exercises").select("id").eq("lesson_id", LESSON_ID);
  if (oldEx?.length) {
    const ids = oldEx.map((e) => e.id);
    await sb.from("exercise_questions").delete().in("exercise_id", ids);
    await sb.from("exercises").delete().in("id", ids);
    console.log(`✓ Obrisano starih vežbi: ${ids.length}`);
  }

  const { data: row, error: ee } = await sb.from("exercises")
    .insert({ lesson_id: LESSON_ID, title: QUIZ_TITLE, exercise_type: "quiz", order_index: 0 })
    .select("id").single();
  if (ee) throw new Error("Insert vežbe: " + ee.message);
  const rows = quizQuestions.map((q, i) => ({
    exercise_id: row.id,
    question: q.q,
    options: { type: "quiz", items: q.opts },
    correct_answer: String(q.c),
    explanation: q.e,
    order_index: i,
  }));
  const { error: qe } = await sb.from("exercise_questions").insert(rows);
  if (qe) throw new Error("Insert pitanja: " + qe.message);
  console.log(`✓ ${QUIZ_TITLE} (quiz, ${rows.length})`);

  // --- VERIFIKACIJA iz baze ---
  const { data: vLesson } = await sb.from("lessons").select("sections").eq("id", LESSON_ID).single();
  const vSec = vLesson.sections || [];
  const vSpoilers = vSec.filter((s) => s.type === "spoiler");
  const vPhrases = vSpoilers.reduce((n, s) => n + (s.items?.length || 0), 0);
  const { data: vEx } = await sb.from("exercises").select("id,title,exercise_type").eq("lesson_id", LESSON_ID);
  const inlineTitles = vSec.filter((s) => s.type === "exercise").map((s) => s.title);
  const dashHit = JSON.stringify(vSec).match(/[–—]/) || vEx.some((e) => /[–—]/.test(e.title));

  console.log("\n--- VERIFIKACIJA (iz baze) ---");
  console.log(`spoilera == sekcija: ${vSpoilers.length} == ${SECTIONS.length} -> ${vSpoilers.length === SECTIONS.length ? "OK" : "FAIL"}`);
  console.log(`fraza očuvano: ${vPhrases} == ${totalPhrases} -> ${vPhrases === totalPhrases ? "OK" : "FAIL"}`);
  console.log(`broj vežbi == 1: ${vEx.length} -> ${vEx.length === 1 ? "OK" : "FAIL"}`);
  console.log(`inline title match: ${JSON.stringify(inlineTitles)} & DB "${vEx[0]?.title}" -> ${inlineTitles.length === 1 && inlineTitles[0] === QUIZ_TITLE && vEx[0]?.title === QUIZ_TITLE ? "OK" : "FAIL"}`);
  console.log(`nula – / —: ${dashHit ? "FAIL" : "OK"}`);
  console.log("\nGotovo. Pregled: /lekcija/" + LESSON_ID + "\n");
}
main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
