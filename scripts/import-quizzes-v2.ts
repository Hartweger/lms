/**
 * Import LearnDash quizzes v2 — proper type per question
 * Stores question_type inside options JSON: { type: "quiz", items: [...] }
 * Run: npx tsx scripts/import-quizzes-v2.ts
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

// ── Quiz-to-Lesson mapping ──────────────────────────────────────
const QUIZ_LESSON_MAP: Record<string, { course: string; lesson: string }> = {
  // A1.1
  "Test 1 / pozdravi": { course: "nemacki-a1-1", lesson: "01 Pozdravi" },
  "Test 2 / Die ersten vier Fragen": { course: "nemacki-a1-1", lesson: "02 Die ersten Fragen" },
  "Test 3 / Dialoge": { course: "nemacki-a1-1", lesson: "03 Dialoge" },
  "Test 4 / Alphabet": { course: "nemacki-a1-1", lesson: "04 Alphabet" },
  "Test 5 / Familie": { course: "nemacki-a1-1", lesson: "06 Familie" },
  "Test 6 / Wie gehts?": { course: "nemacki-a1-1", lesson: "07 Wie gehts?" },
  "Test 7 / Lekcija 7": { course: "nemacki-a1-1", lesson: "08 Zahlen" },
  "Test 8 / Prezent": { course: "nemacki-a1-1", lesson: "09 Prezent" },
  "Test 9 / Essen": { course: "nemacki-a1-1", lesson: "11 Essen" },
  "Test 10 / Preise": { course: "nemacki-a1-1", lesson: "12 Preise" },
  "Test 11 / Im Restaurant": { course: "nemacki-a1-1", lesson: "13 Im Restaurant" },
  "Test 12 / Wohnung": { course: "nemacki-a1-1", lesson: "15 Wohnung" },
  "Test 13 / Möbel": { course: "nemacki-a1-1", lesson: "16 Möbel" },
  "Test 14 / Anzeigen und Zahlen": { course: "nemacki-a1-1", lesson: "17 Anzeigen" },
  "Test 15 / Razdvojni prefiksi": { course: "nemacki-a1-1", lesson: "19 Razdvojni prefiksi" },
  "Test 16 / Uhrzeiten": { course: "nemacki-a1-1", lesson: "20 Uhrzeiten" },
  "Test 17 / Terminkalender": { course: "nemacki-a1-1", lesson: "Terminkalendar" },
  "Test 18 / Tagesablauf": { course: "nemacki-a1-1", lesson: "22 Tagesablauf" },
  "Test 19 / Wetter": { course: "nemacki-a1-1", lesson: "25 Wetter" },
  "Test 20 / Akuzativ": { course: "nemacki-a1-1", lesson: "26 Akuzativ" },
  "Test 21 / Freizeit": { course: "nemacki-a1-1", lesson: "27 Freizeit" },
  "Test / Mini Gespräche Modul 5": { course: "nemacki-a1-1", lesson: "Mini Gespräche" },
  "Test / Mini Gespräche Modul 6": { course: "nemacki-a1-1", lesson: "Modul 6" },
  "Test / Perfekat – pravilni glagoli": { course: "nemacki-a1-1", lesson: "pravilni glagoli" },
  "Test / Perfekat – nepravilni glagoli": { course: "nemacki-a1-1", lesson: "nepravilni glagoli" },
  "Test / Perfekat sa sein + glagoli sa prefiksima": { course: "nemacki-a1-1", lesson: "sa sein" },
  "28. Ja, nein, doch": { course: "nemacki-a1-1", lesson: "Ja, nein, doch" },
  // A1.2
  "Test / Berufe": { course: "nemacki-a1-2", lesson: "Berufe" },
  "Test / Hatte und war": { course: "nemacki-a1-2", lesson: "Hatte und war" },
  "Test / Wann? Wie lange? Seit wann?": { course: "nemacki-a1-2", lesson: "Wann" },
  "Test / Leseverstehen": { course: "nemacki-a1-2", lesson: "Leseverstehen" },
  "Reči A1.2 Modul 1": { course: "nemacki-a1-2", lesson: "Modul 1" },
  "Test / Modalni glagoli": { course: "nemacki-a1-2", lesson: "Modalni glagoli" },
  "Test / Wien": { course: "nemacki-a1-2", lesson: "Wien" },
  "Reči A1.2 Modul 2": { course: "nemacki-a1-2", lesson: "Modul 2" },
  "Test Körperteile A1.2": { course: "nemacki-a1-2", lesson: "Körperteile" },
  "Test Prisvojne zamenice A1.2": { course: "nemacki-a1-2", lesson: "Prisvojne" },
  "Test / Anfrage A1.2": { course: "nemacki-a1-2", lesson: "Anfrage" },
  "Reči A1.2 Modul 3": { course: "nemacki-a1-2", lesson: "Modul 3" },
  "Wörter A1.2": { course: "nemacki-a1-2", lesson: "Wörter" },
  "Test dativ A1.2": { course: "nemacki-a1-2", lesson: "Dativ" },
  "Test am Schalter A1.2": { course: "nemacki-a1-2", lesson: "Schalter" },
  "Kleidung A1": { course: "nemacki-a1-2", lesson: "Kleidung" },
  "Test Kleidung – Leseverstehen und Schreiben A1.2": { course: "nemacki-a1-2", lesson: "Kleidung" },
  "A1.2 Dativ – ličnih zamenica – test": { course: "nemacki-a1-2", lesson: "ličnih zamenica" },
  "A1.2 Fragen formulieren": { course: "nemacki-a1-2", lesson: "Fragen" },
  "A1.2 Aduso und Feste": { course: "nemacki-a1-2", lesson: "ADUSO" },
  "Mails schreiben A1.2": { course: "nemacki-a1-2", lesson: "Mail" },
  // A2.1
  "2. A2.1 Familie": { course: "nemacki-a2-1", lesson: "Familie" },
  "3. A2.1 Perfekt": { course: "nemacki-a2-1", lesson: "Perfekt" },
  "4. Weil Sätze": { course: "nemacki-a2-1", lesson: "Weil Sätze" },
  "5. Wie wohnen die Deutschen A2.1": { course: "nemacki-a2-1", lesson: "Wie wohnen" },
  "6. Müll A2.1": { course: "nemacki-a2-1", lesson: "Müll" },
  "7. Wechselpräpositionen A2.1": { course: "nemacki-a2-1", lesson: "Wechselpräpositionen" },
  "9. Essgewohnheiten": { course: "nemacki-a2-1", lesson: "Essgewohnheiten" },
  "10. Im Restaurant": { course: "nemacki-a2-1", lesson: "Im Restaurant" },
  "11. Indefinitpronomen": { course: "nemacki-a2-1", lesson: "Indefinitpronomen" },
  "12. Arbeitswelt A2.1": { course: "nemacki-a2-1", lesson: "Arbeitsklima" },
  "13. Bewerbung": { course: "nemacki-a2-1", lesson: "Bewerbung" },
  "14. weil, denn dann": { course: "nemacki-a2-1", lesson: "Weil, denn" },
  "15. Arbeitszeit, Urlaubs- und Feiertage": { course: "nemacki-a2-1", lesson: "Arbeitszeit" },
  "16. Refleksivni glagoli": { course: "nemacki-a2-1", lesson: "Refleksivni" },
  "17. Ich interessiere mich für…": { course: "nemacki-a2-1", lesson: "interessiere" },
  "18. Fußball": { course: "nemacki-a2-1", lesson: "Fußball" },
  "19. Worauf, darauf": { course: "nemacki-a2-1", lesson: "Worauf" },
  "20. Modalni glagoli u prošlosti": { course: "nemacki-a2-1", lesson: "Modalni glagoli" },
  "21. Schule – Deutschlandlabor": { course: "nemacki-a2-1", lesson: "Schule" },
  "22. Schulsystem in Deutschland": { course: "nemacki-a2-1", lesson: "Schulsystem" },
  "23. Ausbildung in Deutschland": { course: "nemacki-a2-1", lesson: "Ausbildung" },
  // A2.2
  "1. hätte wäre": { course: "nemacki-a2-2", lesson: "Hätte" },
  "2. Wandern A2.2": { course: "nemacki-a2-2", lesson: "Wandern" },
  "3. Trotzdem": { course: "nemacki-a2-2", lesson: "Trotzdem" },
  "5. Sätze formulieren": { course: "nemacki-a2-2", lesson: "Sätze formulieren" },
  "6. Dunkelrestaurant": { course: "nemacki-a2-2", lesson: "Dunkelrestaurant" },
  "7. Auf dem Flohmarkt": { course: "nemacki-a2-2", lesson: "Flohmarkt" },
  "8. Deklinacija prideva": { course: "nemacki-a2-2", lesson: "Deklinacija prideva" },
  "9. Pasiv": { course: "nemacki-a2-2", lesson: "Pasiv" },
  "10. Deklinacija prideva": { course: "nemacki-a2-2", lesson: "Wiederholung" },
  "11. Über das Internet": { course: "nemacki-a2-2", lesson: "Internet" },
  "12. Mit freundlichen Grüßen": { course: "nemacki-a2-2", lesson: "freundlichen" },
  "13. Komparacija prideva": { course: "nemacki-a2-2", lesson: "Komparacija" },
  "16. Trennbare Verben / 5 Minuten Lektion": { course: "nemacki-a2-2", lesson: "Trennbare" },
  "17. Drahtesel A2.2": { course: "nemacki-a2-2", lesson: "Drahtesel" },
  "Adventskranz": { course: "nemacki-a2-2", lesson: "Adventskranz" },
  "Granfluencer": { course: "nemacki-a2-2", lesson: "Granfluencer" },
  "Weihnachten ist…": { course: "nemacki-a2-2", lesson: "Weihnachten" },
  // B1.1
  "Konjunktiv II der Vergangenheit": { course: "nemacki-b1-1", lesson: "Konjunktiv" },
  "B1.1 Rotkäppchen": { course: "nemacki-b1-1", lesson: "Rotkäppchen" },
  "Wenn oder als": { course: "nemacki-b1-1", lesson: "Als oder wenn" },
  "Glück Leseverstehen B1": { course: "nemacki-b1-1", lesson: "Glück" },
  "Relativne rečenice B1": { course: "nemacki-b1-1", lesson: "Relativne" },
  "Filme und Serien": { course: "nemacki-b1-1", lesson: "Filme" },
  "Obwohl, weil, wenn — Nebensätze": { course: "nemacki-b1-1", lesson: "Obwohl" },
  "Blutgruppen – wichtige Entdeckung in der Medizin": { course: "nemacki-b1-1", lesson: "Blutgruppen" },
  "Pasiv sa modalnim glagolima": { course: "nemacki-b1-1", lesson: "Pasiv" },
  "Genitiv": { course: "nemacki-b1-1", lesson: "Genitiv" },
  "Lese und Hörverstehen – B1": { course: "nemacki-b1-1", lesson: "Hörverstehen" },
  "Berufswechsel – test": { course: "nemacki-b1-1", lesson: "Berufswechsel" },
  // B1.2
  "100 Wörter – Niveau B1": { course: "nemacki-b1-2", lesson: "100 reči" },
  "Als ob Sätze B1.2": { course: "nemacki-b1-2", lesson: "Als ob" },
  "Finalsätze": { course: "nemacki-b1-2", lesson: "Finalsätze" },
  "Zweiteilige Konnektoren": { course: "nemacki-b1-2", lesson: "Zweiteilige" },
  "Falls Sätze": { course: "nemacki-b1-2", lesson: "Falls" },
  "Probleme im Büro": { course: "nemacki-b1-2", lesson: "Büro" },
  "Je…desto/umso": { course: "nemacki-b1-2", lesson: "desto" },
  "Relativne rečenice sa predlozima": { course: "nemacki-b1-2", lesson: "predlozima" },
  "Freundschaften im Job": { course: "nemacki-b1-2", lesson: "Freundschaften" },
  "Duzen vs. Siezen": { course: "nemacki-b1-2", lesson: "Duzen" },
};

// ── Conversion functions ──────────────────────────────

function mapType(ldType: string): string {
  switch (ldType) {
    case "cloze_answer": return "fill_blank";
    case "single": return "quiz";
    case "multiple": return "quiz";
    case "matrix_sort_answer": return "match_pairs";
    case "sort_answer": return "word_order";
    case "free_answer": return "fill_blank";
    case "essay": return "fill_blank";
    default: return "quiz";
  }
}

function convertQuestion(q: any): Array<{
  question: string;
  options: any;
  correct_answer: string;
  question_type: string;
}> {
  const type = q.type || "single";
  const results: Array<{ question: string; options: any; correct_answer: string; question_type: string }> = [];

  if (type === "cloze_answer") {
    // Parse fill-in-the-blank from text with {answers}
    const text = q.answerA || q.text || "";
    const lines = text.split("\n").filter((s: string) => s.includes("{"));

    const allLines = lines.length > 0 ? lines : (text.includes("{") ? [text] : []);

    for (const line of allLines) {
      const answers: string[] = [];
      const sr = /\{([^}|]+)(\|[^}]*)?\}/g;
      let m;
      while ((m = sr.exec(line)) !== null) answers.push(m[1]);
      const cleaned = line.replace(/\{([^}|]+)(\|[^}]*)?\}/g, "______").trim();
      if (cleaned && answers.length > 0) {
        results.push({
          question: cleaned,
          options: answers, // correct answers as options
          correct_answer: answers.join(", "),
          question_type: "fill_blank",
        });
      }
    }
  } else if (type === "single" || type === "multiple") {
    const opts: string[] = [];
    if (q.answerA) opts.push(q.answerA);
    if (q.answerB) opts.push(q.answerB);
    if (q.answerC) opts.push(q.answerC);
    if (q.answerD) opts.push(q.answerD);
    if (q.answerE) opts.push(q.answerE);
    if (q.answerF) opts.push(q.answerF);

    if (opts.length > 0 && (q.text || q.title)) {
      // Convert letter answer (A, B, C) to index
      const correctStr = (q.correct || "A").toString().trim();
      let correctIndex = 0;
      if (correctStr.includes(",")) {
        // Multiple correct — take first
        correctIndex = correctStr.charCodeAt(0) - 65;
      } else if (correctStr.length === 1 && correctStr >= "A" && correctStr <= "F") {
        correctIndex = correctStr.charCodeAt(0) - 65;
      }

      results.push({
        question: q.text || q.title || "",
        options: opts,
        correct_answer: String(correctIndex),
        question_type: "quiz",
      });
    }
  } else if (type === "matrix_sort_answer") {
    // Match pairs
    const left: string[] = [];
    const right: string[] = [];
    if (q.answerA) left.push(q.answerA);
    if (q.answerB) right.push(q.answerB);
    if (q.answerC) left.push(q.answerC);
    if (q.answerD) right.push(q.answerD);

    if (left.length > 0 && right.length > 0) {
      const pairs = left.map((l, i) => ({ de: l, sr: right[i] || "" })).filter(p => p.sr);
      if (pairs.length > 0) {
        results.push({
          question: q.text || "Poveži parove:",
          options: pairs,
          correct_answer: pairs.map(p => `${p.de}=${p.sr}`).join(", "),
          question_type: "match_pairs",
        });
      }
    }
  } else if (type === "sort_answer") {
    const words: string[] = [];
    if (q.answerA) words.push(q.answerA);
    if (q.answerB) words.push(q.answerB);
    if (q.answerC) words.push(q.answerC);
    if (q.answerD) words.push(q.answerD);
    if (q.answerE) words.push(q.answerE);

    if (words.length > 1) {
      results.push({
        question: q.text || "Poređaj redom:",
        options: words,
        correct_answer: words.join(", "),
        question_type: "word_order",
      });
    }
  }

  return results;
}

// ── Main ──────────────────────────────────────

async function importQuizzes() {
  const raw = fs.readFileSync("scripts/learndash-export-parsed.json", "utf-8");
  const data = JSON.parse(raw);

  const { data: courses } = await supabase.from("courses").select("id, slug");
  const { data: lessons } = await supabase.from("lessons").select("id, course_id, title");

  if (!courses || !lessons) {
    console.error("Failed to load courses/lessons");
    return;
  }

  const courseBySlug = new Map(courses.map((c: any) => [c.slug, c.id]));

  let exercisesCreated = 0;
  let questionsCreated = 0;
  let typeCounts: Record<string, number> = {};

  for (const quiz of data.quizzes) {
    const mapping = QUIZ_LESSON_MAP[quiz.name];
    if (!mapping) continue;

    const courseId = courseBySlug.get(mapping.course);
    if (!courseId) continue;

    // Fuzzy match lesson
    const courseLessons = lessons.filter((l: any) => l.course_id === courseId);
    let lesson = courseLessons.find((l: any) =>
      l.title.toLowerCase().includes(mapping.lesson.toLowerCase())
    );
    if (!lesson) continue;

    // Skip if exercise already exists
    const { data: existing } = await supabase
      .from("exercises")
      .select("id")
      .eq("lesson_id", lesson.id)
      .single();
    if (existing) continue;

    // Convert all questions
    const allConverted: Array<{ question: string; options: any; correct_answer: string; question_type: string }> = [];
    for (const q of quiz.questions) {
      const converted = convertQuestion(q);
      allConverted.push(...converted);
    }

    if (allConverted.length === 0) continue;

    // Create exercise with type "mixed"
    const { data: exercise, error } = await supabase
      .from("exercises")
      .insert({
        lesson_id: lesson.id,
        title: quiz.name,
        exercise_type: "quiz", // actual type is per-question in options.type
        order_index: 0,
      })
      .select("id")
      .single();

    if (error || !exercise) {
      console.error(`  ✗ ${quiz.name}:`, error?.message);
      continue;
    }

    exercisesCreated++;

    for (let i = 0; i < allConverted.length; i++) {
      const q = allConverted[i];
      // Store question_type inside options as metadata
      const optionsWithType = {
        type: q.question_type,
        items: q.options,
      };

      await supabase.from("exercise_questions").insert({
        exercise_id: exercise.id,
        question: q.question,
        options: optionsWithType,
        correct_answer: q.correct_answer,
        explanation: null,
        order_index: i,
      });

      questionsCreated++;
      typeCounts[q.question_type] = (typeCounts[q.question_type] || 0) + 1;
    }

    const types = [...new Set(allConverted.map(q => q.question_type))];
    console.log(`  ✓ ${quiz.name} → ${lesson.title} (${allConverted.length} pitanja: ${types.join(", ")})`);
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  Vežbi: ${exercisesCreated}`);
  console.log(`  Pitanja: ${questionsCreated}`);
  console.log(`  Po tipu:`);
  for (const [type, count] of Object.entries(typeCounts)) {
    console.log(`    ${type}: ${count}`);
  }
  console.log(`═══════════════════════════════════════\n`);
}

importQuizzes().catch(console.error);
