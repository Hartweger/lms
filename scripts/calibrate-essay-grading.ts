/**
 * Kalibracija AI ocenjivanja Schreiben-a na već ocenjenim radovima.
 *
 * Povuče sve objavljene radove sa profesorskom ocenom, propusti ih kroz
 * NOVI prompt (src/lib/essay-grading.ts - isti kod kao produkciona ruta)
 * i uporedi sa profesorskom ocenom, staru AI ocenu koristi kao baseline.
 * Ništa ne piše u bazu.
 *
 *   npx tsx scripts/calibrate-essay-grading.ts [--limit N] [--levels A1,A2] [--model sonnet]
 *
 * Rezultat: tabela u konzoli + _essay-calibration.json pored skripta.
 */
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import {
  buildGradingPrompt,
  computePoints,
  computeScore,
  GRADING_TOOL,
  normalizeCriteria,
  pickGradingModel,
  type EssayCriteria,
} from "../src/lib/essay-grading";
import { pickSubmissionQuestions } from "../src/lib/essay-task";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("=");
  if (k && v.length && !process.env[k.trim()]) {
    process.env[k.trim()] = v.join("=").trim().replace(/^"|"$/g, "");
  }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg > -1 ? parseInt(process.argv[limitArg + 1]) : Infinity;
const levelsArg = process.argv.indexOf("--levels");
const LEVELS = levelsArg > -1 ? process.argv[levelsArg + 1].toUpperCase().split(",") : null;
const modelArg = process.argv.indexOf("--model");
const MODEL_OVERRIDE = modelArg > -1
  ? (process.argv[modelArg + 1] === "sonnet" ? "claude-sonnet-4-5" : "claude-haiku-4-5-20251001")
  : null;
const modelFor = (level: string) => MODEL_OVERRIDE ?? pickGradingModel(level);
const CONCURRENCY = 4;

interface Row {
  id: string;
  exercise_id: string;
  lesson_id: string;
  text: string | null;
  ai_score: number | null;
  professor_score: number | null;
  submission_type: string | null;
  lessons: { course_id: string; courses: { title: string } | null } | null;
}

interface Result {
  id: string;
  level: string;
  maxPoints: number;
  profScore: number;
  oldAiScore: number | null;
  newScore: number;
  newPoints: number | null;
  criteria: EssayCriteria;
  model: string;
}

async function gradeOne(text: string, task: string, level: string, isExam: boolean): Promise<EssayCriteria> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const message = await anthropic.messages.create({
        model: modelFor(level),
        max_tokens: 2048,
        temperature: 0,
        tools: [GRADING_TOOL],
        tool_choice: { type: "tool", name: GRADING_TOOL.name },
        messages: [{ role: "user", content: buildGradingPrompt({ task, text, level, isExam }) }],
      });
      const toolUse = message.content.find((b) => b.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") throw new Error("nema tool_use");
      return normalizeCriteria((toolUse.input as { criteria?: unknown }).criteria);
    } catch (e) {
      const msg = String(e);
      if (attempt < 3 && (msg.includes("429") || msg.includes("overloaded") || msg.includes("529"))) {
        await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  throw new Error("unreachable");
}

async function run() {
  const { data, error } = await supabase
    .from("essay_submissions")
    .select("id, exercise_id, lesson_id, text, ai_score, professor_score, submission_type, lessons(course_id, courses(title))")
    .eq("status", "published")
    .not("professor_score", "is", null)
    .not("text", "is", null)
    .order("submitted_at", { ascending: true });
  if (error) throw error;

  const rows = ((data as unknown as Row[]) || []).filter((r) => (r.text || "").trim().length > 0).slice(0, LIMIT);
  console.log(`Radova za kalibraciju: ${rows.length}`);

  const exIds = [...new Set(rows.map((r) => r.exercise_id))];
  const { data: eqs } = await supabase
    .from("exercise_questions")
    .select("exercise_id, question, options")
    .in("exercise_id", exIds)
    .order("order_index", { ascending: true });
  const { taskByEx, maxByEx } = pickSubmissionQuestions(eqs || []);

  const results: Result[] = [];
  const errors: { id: string; error: string }[] = [];
  let i = 0;

  async function worker() {
    while (i < rows.length) {
      const row = rows[i++];
      const task = taskByEx[row.exercise_id];
      if (!task) { errors.push({ id: row.id, error: "nema teksta zadatka" }); continue; }
      const levelMatch = (row.lessons?.courses?.title || "").match(/(A1|A2|B1|B2|C1|C2)/i);
      const level = levelMatch ? levelMatch[1].toUpperCase() : "A1";
      if (LEVELS && !LEVELS.includes(level)) continue;
      const maxPoints = maxByEx[row.exercise_id] ?? 5;
      const isExam = maxPoints > 5;
      try {
        const criteria = await gradeOne(row.text!, task, level, isExam);
        results.push({
          id: row.id,
          level,
          maxPoints,
          profScore: row.professor_score!,
          oldAiScore: row.ai_score,
          newScore: computeScore(criteria),
          newPoints: isExam ? computePoints(criteria, maxPoints) : null,
          criteria,
          model: modelFor(level),
        });
        process.stdout.write(`\r${results.length + errors.length}/${rows.length}`);
      } catch (e) {
        errors.push({ id: row.id, error: String(e).slice(0, 200) });
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log("");

  // ── Izveštaj: skala 1-5 ──────────────────────────────────────────────
  const scale5 = results.filter((r) => r.maxPoints <= 5);
  const byLevel = new Map<string, Result[]>();
  for (const r of scale5) byLevel.set(r.level, [...(byLevel.get(r.level) ?? []), r]);

  console.log("\n=== Skala 1-5 (poređenje sa profesorskom ocenom) ===");
  console.log("nivo |  n | staro tačno | novo tačno | stari MAE | novi MAE");
  const fmt = (x: number) => x.toFixed(2);
  for (const [level, list] of [...byLevel.entries()].sort()) {
    const withOld = list.filter((r) => r.oldAiScore != null);
    const oldExact = withOld.filter((r) => r.oldAiScore === r.profScore).length;
    const newExact = list.filter((r) => r.newScore === r.profScore).length;
    const oldMae = withOld.length ? withOld.reduce((s, r) => s + Math.abs(r.oldAiScore! - r.profScore), 0) / withOld.length : NaN;
    const newMae = list.reduce((s, r) => s + Math.abs(r.newScore - r.profScore), 0) / list.length;
    console.log(
      `${level.padEnd(4)} | ${String(list.length).padStart(2)} | ${String(oldExact).padStart(4)}/${withOld.length} | ${String(newExact).padStart(4)}/${list.length} | ${fmt(oldMae).padStart(9)} | ${fmt(newMae).padStart(8)}`
    );
  }
  const withOldAll = scale5.filter((r) => r.oldAiScore != null);
  console.log(
    `UKUPNO: staro ${withOldAll.filter((r) => r.oldAiScore === r.profScore).length}/${withOldAll.length} tačno, ` +
    `novo ${scale5.filter((r) => r.newScore === r.profScore).length}/${scale5.length} tačno`
  );

  // ── Izveštaj: ispitne vežbe (bodovi) ─────────────────────────────────
  const exam = results.filter((r) => r.maxPoints > 5);
  if (exam.length) {
    console.log("\n=== Ispitne vežbe (predlog bodova vs profesorka) ===");
    for (const r of exam) {
      console.log(`  max ${r.maxPoints}: prof ${r.profScore}, AI predlog ${r.newPoints} (E${r.criteria.erfuellung} K${r.criteria.kohaerenz} W${r.criteria.wortschatz} G${r.criteria.korrektheit})`);
    }
    const mae = exam.reduce((s, r) => s + Math.abs((r.newPoints ?? 0) - r.profScore), 0) / exam.length;
    const maePct = exam.reduce((s, r) => s + Math.abs((r.newPoints ?? 0) - r.profScore) / r.maxPoints, 0) / exam.length;
    console.log(`MAE: ${mae.toFixed(1)} bodova (${(maePct * 100).toFixed(0)}% skale, n=${exam.length})`);
  }

  if (errors.length) {
    console.log(`\nGreške (${errors.length}):`);
    for (const e of errors.slice(0, 10)) console.log(`  ${e.id}: ${e.error}`);
  }

  const outPath = path.resolve(__dirname, "_essay-calibration.json");
  fs.writeFileSync(outPath, JSON.stringify({ results, errors }, null, 2));
  console.log(`\nDetalji: ${outPath}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
