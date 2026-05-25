/**
 * Import B1.1 Modelltest (final comprehensive test)
 * Run: npx tsx scripts/import-b11-modelltest.ts
 *
 * 15 questions covering ALL grammar from modules 1-7.
 * Placed on lesson index 27 (last lesson) with order_index 2.
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join("=").trim();
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MODELLTEST_TITLE = "Modelltest B1.1";
const LESSON_INDEX = 27;

const questions = [
  // Modul 1: Präteritum
  {
    question: "Als Kind ______ ich jeden Sommer bei meinen Großeltern. (verbringen — Präteritum)",
    options: { type: "quiz", items: ["verbrachte", "verbringte", "verbracht", "verbringt"] },
    correct_answer: "0",
    explanation: "verbringen → verbrachte (nepravilan glagol).",
    question_type: "quiz",
  },
  // Modul 1: als/wenn
  {
    question: "______ wir Kinder waren, durften wir nicht lange fernsehen.",
    options: { type: "quiz", items: ["Als", "Wenn", "Wann", "Ob"] },
    correct_answer: "0",
    explanation: "Als = jednokratna situacija u prošlosti (bili smo deca).",
    question_type: "quiz",
  },
  // Modul 2: Relativpronomen
  {
    question: "Die Stadt, in ______ ich aufgewachsen bin, liegt in Süddeutschland.",
    options: { type: "quiz", items: ["der", "die", "dem", "den"] },
    correct_answer: "0",
    explanation: "in + Dativ: die Stadt → der Stadt.",
    question_type: "quiz",
  },
  // Modul 2: obwohl
  {
    question: "______ er krank war, ging er zur Arbeit.",
    options: { type: "fill_blank", items: ["Obwohl", "Weil", "Damit", "Wenn"] },
    correct_answer: "Obwohl",
    explanation: "obwohl = iako (kontrast: bolestan, ali ide na posao).",
    question_type: "fill_blank",
  },
  // Modul 3: Genitiv
  {
    question: "Das Ende ______ Films war überraschend.",
    options: { type: "quiz", items: ["des", "dem", "der", "den"] },
    correct_answer: "0",
    explanation: "Genitiv maskulin: der Film → des Films.",
    question_type: "quiz",
  },
  // Modul 3: Passiv mit Modalverb
  {
    question: "Das Formular muss bis Freitag ______ werden. (ausfüllen)",
    options: { type: "fill_blank", items: ["ausgefüllt", "ausfüllen", "gefüllt", "auszufüllen"] },
    correct_answer: "ausgefüllt",
    explanation: "Passiv + Modalverb: muss + Partizip II + werden.",
    question_type: "fill_blank",
  },
  // Modul 4: Konjunktiv II
  {
    question: "An deiner Stelle ______ ich sofort zum Arzt gehen.",
    options: { type: "quiz", items: ["würde", "wäre", "hätte", "werde"] },
    correct_answer: "0",
    explanation: "An deiner Stelle + würde = savet sa Konjunktiv II.",
    question_type: "quiz",
  },
  // Modul 4: höflich nachfragen
  {
    question: "Koji oblik je najučtiviji?",
    options: { type: "quiz", items: [
      "Ich will einen Kaffee.",
      "Gib mir einen Kaffee!",
      "Ich hätte gern einen Kaffee.",
      "Einen Kaffee, schnell!",
    ] },
    correct_answer: "2",
    explanation: "Ich hätte gern... = učtiva narudžba sa Konjunktiv II.",
    question_type: "quiz",
  },
  // Modul 5: Infinitiv mit zu
  {
    question: "Sie hat beschlossen, nächstes Jahr nach Deutschland ______. (umziehen)",
    options: { type: "fill_blank", items: ["umzuziehen", "zu umziehen", "umziehen", "umgezogen"] },
    correct_answer: "umzuziehen",
    explanation: "Razdvojni glagol: um|ziehen → um-zu-ziehen.",
    question_type: "fill_blank",
  },
  // Modul 5: Bewerbung
  {
    question: "Spoji pojmove vezane za posao:",
    options: { type: "match_pairs", items: [
      { de: "das Gehalt", sr: "plata" },
      { de: "die Kündigung", sr: "otkaz" },
      { de: "die Überstunden", sr: "prekovremeni rad" },
      { de: "der Arbeitgeber", sr: "poslodavac" },
      { de: "der Arbeitnehmer", sr: "zaposleni" },
    ]},
    correct_answer: "all",
    question_type: "match_pairs",
  },
  // Modul 6: um...zu / damit
  {
    question: "Sie spart Geld, ______ sich ein Auto zu kaufen.",
    options: { type: "quiz", items: ["um", "damit", "statt", "ohne"] },
    correct_answer: "0",
    explanation: "um...zu = isti subjekat (sie...sie).",
    question_type: "quiz",
  },
  // Modul 6: statt/ohne...zu
  {
    question: "Er hat das Haus verlassen, ______ das Licht auszumachen.",
    options: { type: "quiz", items: ["ohne", "statt", "um", "damit"] },
    correct_answer: "0",
    explanation: "ohne...zu = bez toga da (izašao bez gašenja svetla).",
    question_type: "quiz",
  },
  // Modul 7: zweiteilige Konjunktionen
  {
    question: "______ hat er in Berlin studiert, ______ hat er dort auch gearbeitet.",
    options: { type: "fill_blank", items: ["Nicht nur, sondern", "Sowohl, als auch", "Weder, noch", "Entweder, oder"] },
    correct_answer: "Nicht nur, sondern",
    explanation: "nicht nur...sondern auch = ne samo...nego i.",
    question_type: "fill_blank",
  },
  // Modul 7: Konjunktiv II Vergangenheit
  {
    question: "Wenn ich das Stipendium bekommen ______, ______ ich in Wien studiert.",
    options: { type: "quiz", items: ["hätte, hätte", "habe, habe", "hatte, hatte", "hätte, wäre"] },
    correct_answer: "0",
    explanation: "Konjunktiv II Vergangenheit: hätte + bekommen, hätte + studiert.",
    question_type: "quiz",
  },
  // Modul 7: trotz + Genitiv
  {
    question: "______ seiner Nervosität hat er die Prüfung bestanden.",
    options: { type: "quiz", items: ["Trotz", "Wegen", "Während", "Ohne"] },
    correct_answer: "0",
    explanation: "trotz + Genitiv = uprkos (nervozan, ali položio).",
    question_type: "quiz",
  },
];

async function main() {
  console.log("Importing B1.1 Modelltest...\n");

  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .select("id, title")
    .eq("slug", "nemacki-b1-1")
    .single();

  if (courseErr || !course) {
    console.error("Course not found:", courseErr?.message);
    return;
  }
  console.log(`Found course: ${course.title} (${course.id})\n`);

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .eq("course_id", course.id)
    .order("order_index");

  if (!lessons) return;

  const lesson = lessons.find((l) => l.order_index === LESSON_INDEX);

  if (!lesson) {
    console.error(`Lesson not found at index ${LESSON_INDEX}`);
    return;
  }

  // Check if already exists
  const { data: existing } = await supabase
    .from("exercises")
    .select("id")
    .eq("lesson_id", lesson.id)
    .eq("title", MODELLTEST_TITLE);

  if (existing && existing.length > 0) {
    console.log(`SKIP: ${MODELLTEST_TITLE} — already exists on "${lesson.title}"`);
    return;
  }

  // Create exercise
  const { data: exercise, error: exErr } = await supabase
    .from("exercises")
    .insert({
      lesson_id: lesson.id,
      title: MODELLTEST_TITLE,
      exercise_type: "quiz",
      order_index: 2,
    })
    .select("id")
    .single();

  if (exErr || !exercise) {
    console.error(`ERROR: ${MODELLTEST_TITLE}: ${exErr?.message}`);
    return;
  }

  // Create questions
  const questionRows = questions.map((q, i) => ({
    exercise_id: exercise.id,
    question: q.question,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation || null,
    order_index: i,
  }));

  const { error: qErr } = await supabase
    .from("exercise_questions")
    .insert(questionRows);

  if (qErr) {
    console.error(`ERROR questions: ${MODELLTEST_TITLE}: ${qErr.message}`);
  } else {
    console.log(`OK: ${MODELLTEST_TITLE} — ${questionRows.length} pitanja → "${lesson.title}"`);
  }

  console.log("\nDone!");
}

main().catch(console.error);
