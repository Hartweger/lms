/**
 * Import quizzes from simple markdown format
 * Run: npx tsx scripts/import-quiz-file.ts ../kvizovi/a1-1.md
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load env
const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join("=").trim();
  }
}

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Question {
  type: string;
  question: string;
  options: any;
  correct_answer: string;
}

interface LessonQuiz {
  lessonTitle: string;
  questions: Question[];
}

function parseQuizFile(content: string): LessonQuiz[] {
  const results: LessonQuiz[] = [];
  let currentLesson: LessonQuiz | null = null;
  const lines = content.split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // New lesson
    if (line.startsWith("## Lekcija:")) {
      if (currentLesson && currentLesson.questions.length > 0) {
        results.push(currentLesson);
      }
      currentLesson = {
        lessonTitle: line.replace("## Lekcija:", "").trim(),
        questions: [],
      };
      i++;
      continue;
    }

    if (!currentLesson) { i++; continue; }

    // Quiz question
    if (line === "### quiz") {
      i++;
      // Next non-empty line is the question
      while (i < lines.length && !lines[i].trim()) i++;
      const questionText = lines[i]?.trim() || "";
      i++;

      const options: string[] = [];
      let correctIndex = 0;

      while (i < lines.length) {
        const optLine = lines[i].trim();
        if (!optLine || optLine.startsWith("##")) break;

        const match = optLine.match(/^[a-f]\)\s*(.+)/i);
        if (match) {
          let optText = match[1];
          if (optText.endsWith("*")) {
            correctIndex = options.length;
            optText = optText.slice(0, -1).trim();
          }
          options.push(optText);
        }
        i++;
      }

      if (questionText && options.length > 0) {
        currentLesson.questions.push({
          type: "quiz",
          question: questionText,
          options: { type: "quiz", items: options },
          correct_answer: String(correctIndex),
        });
      }
      continue;
    }

    // Fill blank (multi-blank with word bank)
    if (line === "### fill_blank") {
      i++;
      while (i < lines.length && !lines[i].trim()) i++;

      // First line: "reči: word1, word2, word3" (word bank)
      let wordBank: string[] = [];
      const firstLine = lines[i]?.trim() || "";
      if (firstLine.toLowerCase().startsWith("reči:") || firstLine.toLowerCase().startsWith("reci:")) {
        wordBank = firstLine.replace(/^re[čc]i:\s*/i, "").split(",").map((w) => w.trim()).filter(Boolean);
        i++;
      }

      // Collect text lines until we hit = or ## or empty
      let textLines: string[] = [];
      let answer = "";
      while (i < lines.length) {
        const textLine = lines[i].trim();
        if (!textLine || textLine.startsWith("##")) break;
        if (textLine.startsWith("=")) {
          answer = textLine.slice(1).trim();
          i++;
          break;
        }
        textLines.push(textLine);
        i++;
      }

      const fullText = textLines.join("\n");
      const answers = answer.split(",").map((a) => a.trim()).filter(Boolean);

      if (fullText && answers.length > 0) {
        // If no word bank specified, use the answers as the word bank
        if (wordBank.length === 0) wordBank = [...answers];

        currentLesson.questions.push({
          type: "fill_blank",
          question: fullText,
          options: { type: "fill_blank", items: wordBank },
          correct_answer: answer,
        });
      }
      continue;
    }

    // Match pairs
    if (line === "### match_pairs") {
      i++;
      const pairs: { de: string; sr: string }[] = [];

      while (i < lines.length) {
        const pairLine = lines[i].trim();
        if (!pairLine || pairLine.startsWith("##")) break;

        const parts = pairLine.split("=").map((s) => s.trim());
        if (parts.length === 2 && parts[0] && parts[1]) {
          pairs.push({ de: parts[0], sr: parts[1] });
        }
        i++;
      }

      if (pairs.length >= 2) {
        currentLesson.questions.push({
          type: "match_pairs",
          question: "Poveži parove:",
          options: { type: "match_pairs", items: pairs },
          correct_answer: pairs.map((p) => `${p.de}=${p.sr}`).join(", "),
        });
      }
      continue;
    }

    // Wordwall embed
    if (line === "### wordwall") {
      i++;
      while (i < lines.length && !lines[i].trim()) i++;
      const url = lines[i]?.trim() || "";
      i++;

      if (url) {
        // Extract src from iframe if full embed code is pasted
        let embedUrl = url;
        const srcMatch = url.match(/src="([^"]+)"/);
        if (srcMatch) embedUrl = srcMatch[1];

        currentLesson.questions.push({
          type: "wordwall",
          question: "Wordwall vežba",
          options: { type: "wordwall", items: embedUrl },
          correct_answer: "done",
        });
      }
      continue;
    }

    // Word order
    if (line === "### word_order") {
      i++;
      while (i < lines.length && !lines[i].trim()) i++;
      const wordsLine = lines[i]?.trim() || "";
      i++;

      const words = wordsLine.split("|").map((w) => w.trim()).filter(Boolean);
      if (words.length >= 2) {
        currentLesson.questions.push({
          type: "word_order",
          question: "Poređaj reči u pravilan redosled:",
          options: { type: "word_order", items: words },
          correct_answer: words.join(", "),
        });
      }
      continue;
    }

    i++;
  }

  // Push last lesson
  if (currentLesson && currentLesson.questions.length > 0) {
    results.push(currentLesson);
  }

  return results;
}

async function importFile(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const quizzes = parseQuizFile(content);

  console.log(`\nParsed ${quizzes.length} lekcija iz ${path.basename(filePath)}\n`);

  // Load lessons
  const { data: lessons } = await supabase.from("lessons").select("id, course_id, title");
  if (!lessons) { console.error("Failed to load lessons"); return; }

  let totalExercises = 0;
  let totalQuestions = 0;

  for (const quiz of quizzes) {
    // Find lesson by fuzzy match
    const lesson = lessons.find((l: any) =>
      l.title.toLowerCase().includes(quiz.lessonTitle.toLowerCase()) ||
      quiz.lessonTitle.toLowerCase().includes(l.title.toLowerCase())
    );

    if (!lesson) {
      console.log(`  ⚠ Lekcija nije pronađena: "${quiz.lessonTitle}"`);
      continue;
    }

    // Check if exercise exists
    const { data: existing } = await supabase
      .from("exercises")
      .select("id")
      .eq("lesson_id", lesson.id)
      .single();

    if (existing) {
      // Delete existing and recreate
      await supabase.from("exercises").delete().eq("id", existing.id);
    }

    // Create exercise
    const { data: exercise, error } = await supabase
      .from("exercises")
      .insert({
        lesson_id: lesson.id,
        title: `Vežba: ${quiz.lessonTitle}`,
        exercise_type: "quiz",
        order_index: 0,
      })
      .select("id")
      .single();

    if (error || !exercise) {
      console.error(`  ✗ ${quiz.lessonTitle}:`, error?.message);
      continue;
    }

    // Insert questions
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      await supabase.from("exercise_questions").insert({
        exercise_id: exercise.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: null,
        order_index: i,
      });
    }

    const types = [...new Set(quiz.questions.map((q) => q.type))];
    console.log(`  ✓ ${quiz.lessonTitle} → ${quiz.questions.length} pitanja (${types.join(", ")})`);
    totalExercises++;
    totalQuestions += quiz.questions.length;
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  Vežbi: ${totalExercises}`);
  console.log(`  Pitanja: ${totalQuestions}`);
  console.log(`═══════════════════════════════════════\n`);
}

// Run
const file = process.argv[2];
if (!file) {
  console.log("Usage: npx tsx scripts/import-quiz-file.ts ../kvizovi/a1-1.md");
  process.exit(1);
}
importFile(file).catch(console.error);
