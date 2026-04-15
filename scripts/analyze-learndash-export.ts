/**
 * Analyze LearnDash quiz export to understand what content we have
 * Run: npx tsx scripts/analyze-learndash-export.ts
 */

import * as XLSX from "xlsx";
import * as fs from "fs";

const FILE_PATH = "../learndash-kvizovi-export 2.xlsx";

interface QuizRow {
  "Kviz ID": number;
  "Kviz": string;
  "Pitanje ID": number;
  "Pitanje (naslov)": string;
  "Tekst pitanja": string;
  "Tip": string;
  "Bodovi": number;
  "Odgovor A": string;
  "Odgovor B": string;
  "Odgovor C": string;
  "Odgovor D": string;
  "Odgovor E": string;
  "Odgovor F": string;
  "Tacan": string;
}

const workbook = XLSX.readFile(FILE_PATH);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json<QuizRow>(sheet);

console.log(`\n📊 LEARNDASH EXPORT ANALIZA`);
console.log(`═══════════════════════════════════════\n`);
console.log(`Ukupno redova: ${rows.length}\n`);

// Group by quiz
const quizzes = new Map<string, QuizRow[]>();

for (const row of rows) {
  const quizName = String(row["Kviz"] || "").trim();
  if (!quizName || quizName === "0") continue;

  if (!quizzes.has(quizName)) {
    quizzes.set(quizName, []);
  }
  quizzes.get(quizName)!.push(row);
}

console.log(`📋 KVIZOVI (${quizzes.size} ukupno):`);
console.log(`───────────────────────────────────────\n`);

// Sort quizzes by ID
const sortedQuizzes = [...quizzes.entries()].sort((a, b) => {
  const idA = a[1][0]?.["Kviz ID"] || 0;
  const idB = b[1][0]?.["Kviz ID"] || 0;
  return Number(idA) - Number(idB);
});

for (const [name, questions] of sortedQuizzes) {
  const quizId = questions[0]?.["Kviz ID"];
  const types = [...new Set(questions.map(q => q["Tip"]).filter(Boolean))];
  console.log(`  [${quizId}] ${name}`);
  console.log(`      Pitanja: ${questions.length} | Tipovi: ${types.join(", ") || "N/A"}`);
}

// Count by type
console.log(`\n\n📊 TIPOVI PITANJA:`);
console.log(`───────────────────────────────────────\n`);

const typeCounts = new Map<string, number>();
for (const row of rows) {
  const tip = String(row["Tip"] || "nepoznat").trim();
  typeCounts.set(tip, (typeCounts.get(tip) || 0) + 1);
}

for (const [type, count] of [...typeCounts.entries()].sort((a, b) => b[1] - a[1])) {
  const lmsType = mapLearnDashType(type);
  console.log(`  ${type}: ${count} pitanja → LMS tip: ${lmsType}`);
}

// Try to categorize quizzes by level
console.log(`\n\n📊 KVIZOVI PO NIVOU (procena na osnovu naziva):`);
console.log(`───────────────────────────────────────\n`);

const levels: Record<string, string[]> = {
  "A1": [],
  "A2": [],
  "B1": [],
  "B2": [],
  "C1": [],
  "FSP/Medicinski": [],
  "Neodređen nivo": [],
};

for (const [name] of sortedQuizzes) {
  const nameLower = name.toLowerCase();
  if (nameLower.includes("a1") || nameLower.includes("lektion") && !nameLower.includes("b")) {
    levels["A1"].push(name);
  } else if (nameLower.includes("a2") || nameLower.includes("gramatika a2")) {
    levels["A2"].push(name);
  } else if (nameLower.includes("b1") && !nameLower.includes("b2")) {
    levels["B1"].push(name);
  } else if (nameLower.includes("b2")) {
    levels["B2"].push(name);
  } else if (nameLower.includes("c1")) {
    levels["C1"].push(name);
  } else if (nameLower.includes("fsp") || nameLower.includes("medizin") || nameLower.includes("arzt") || nameLower.includes("patient") || nameLower.includes("anamnese") || nameLower.includes("pflege")) {
    levels["FSP/Medicinski"].push(name);
  } else {
    levels["Neodređen nivo"].push(name);
  }
}

for (const [level, names] of Object.entries(levels)) {
  if (names.length === 0) continue;
  console.log(`  ${level} (${names.length} kvizova):`);
  for (const name of names) {
    const q = quizzes.get(name)!;
    console.log(`    - ${name} (${q.length} pitanja)`);
  }
  console.log();
}

// Sample a few questions to show format
console.log(`\n📝 PRIMERI PITANJA (po tipu):`);
console.log(`───────────────────────────────────────\n`);

const seenTypes = new Set<string>();
for (const row of rows) {
  const tip = String(row["Tip"] || "").trim();
  if (!tip || seenTypes.has(tip)) continue;
  seenTypes.add(tip);

  console.log(`\n  Tip: ${tip}`);
  console.log(`  Kviz: ${row["Kviz"]}`);
  console.log(`  Pitanje: ${String(row["Tekst pitanja"] || "").slice(0, 200)}...`);
  if (row["Odgovor A"]) console.log(`  Odgovor A: ${String(row["Odgovor A"]).slice(0, 150)}...`);
  if (row["Odgovor B"]) console.log(`  Odgovor B: ${String(row["Odgovor B"]).slice(0, 150)}...`);
  if (row["Tacan"]) console.log(`  Tačan: ${String(row["Tacan"]).slice(0, 100)}`);
  console.log();
}

// Summary
console.log(`\n\n═══════════════════════════════════════`);
console.log(`📊 REZIME`);
console.log(`═══════════════════════════════════════\n`);
console.log(`  Kvizova: ${quizzes.size}`);
console.log(`  Pitanja ukupno: ${rows.length}`);
console.log(`  Tipovi: ${[...typeCounts.keys()].filter(t => t !== "nepoznat" && t !== "").join(", ")}`);
console.log(`\n  Mapiranje na LMS tipove:`);
console.log(`    cloze_answer → fill_blank (popuni prazninu)`);
console.log(`    single → quiz (multiple choice, jedan tačan)`);
console.log(`    multiple → quiz (multiple choice, više tačnih)`);
console.log(`    matrix_sort_answer → match_pairs (poveži parove)`);
console.log(`    sort_answer → word_order (poređaj redom)`);
console.log(`    free_answer → essay (slobodan odgovor)`);

// Save detailed JSON for import script
const output = {
  totalRows: rows.length,
  totalQuizzes: quizzes.size,
  quizzes: sortedQuizzes.map(([name, questions]) => ({
    name,
    quizId: questions[0]?.["Kviz ID"],
    questionCount: questions.length,
    types: [...new Set(questions.map(q => q["Tip"]).filter(Boolean))],
    questions: questions.map(q => ({
      id: q["Pitanje ID"],
      title: q["Pitanje (naslov)"],
      text: q["Tekst pitanja"],
      type: q["Tip"],
      points: q["Bodovi"],
      answerA: q["Odgovor A"],
      answerB: q["Odgovor B"],
      answerC: q["Odgovor C"],
      answerD: q["Odgovor D"],
      answerE: q["Odgovor E"],
      answerF: q["Odgovor F"],
      correct: q["Tacan"],
    })),
  })),
};

fs.writeFileSync("scripts/learndash-export-parsed.json", JSON.stringify(output, null, 2));
console.log(`\n  ✅ Detaljni JSON sačuvan u: scripts/learndash-export-parsed.json`);

function mapLearnDashType(type: string): string {
  switch (type) {
    case "cloze_answer": return "fill_blank";
    case "single": return "quiz";
    case "multiple": return "quiz";
    case "matrix_sort_answer": return "match_pairs";
    case "sort_answer": return "word_order";
    case "free_answer": return "essay";
    default: return "nepoznat";
  }
}
