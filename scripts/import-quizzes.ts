/**
 * Import LearnDash quizzes as LMS exercises
 * Run: npx tsx scripts/import-quizzes.ts
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
// Maps LearnDash quiz name → lesson title (as it appears in course-data.json)
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
  "Test 17 / Terminkalender": { course: "nemacki-a1-1", lesson: "21 Terminkalender" },
  "Test 18 / Tagesablauf": { course: "nemacki-a1-1", lesson: "22 Tagesablauf" },
  "Test 19 / Wetter": { course: "nemacki-a1-1", lesson: "25 Wetter" },
  "Test 20 / Akuzativ": { course: "nemacki-a1-1", lesson: "26 Akuzativ" },
  "Test 21 / Freizeit": { course: "nemacki-a1-1", lesson: "27 Freizeit" },
  "Test / Mini Gespräche Modul 5": { course: "nemacki-a1-1", lesson: "24 Mini Gespräche – Modul 5" },
  "Test / Mini Gespräche Modul 6": { course: "nemacki-a1-1", lesson: "30 Mini Gespräche – Modul 6" },
  "Test / Perfekat – pravilni glagoli": { course: "nemacki-a1-1", lesson: "32 Perfekat – pravilni glagoli" },
  "Test / Perfekat – nepravilni glagoli": { course: "nemacki-a1-1", lesson: "33 Perfekat – nepravilni glagoli" },
  "Test / Perfekat sa sein + glagoli sa prefiksima": { course: "nemacki-a1-1", lesson: "34 Perfekat sa sein + glagoli sa prefiksima" },
  "28. Ja, nein, doch": { course: "nemacki-a1-1", lesson: "28 Ja, nein, doch" },

  // A1.2
  "Test / Berufe": { course: "nemacki-a1-2", lesson: "Berufe" },
  "Test / Hatte und war": { course: "nemacki-a1-2", lesson: "Hatte und war" },
  "Test / Wann? Wie lange? Seit wann?": { course: "nemacki-a1-2", lesson: "Wann? Wie lange? Seit wann?" },
  "Test / Leseverstehen": { course: "nemacki-a1-2", lesson: "Leseverstehen" },
  "Reči A1.2 Modul 1": { course: "nemacki-a1-2", lesson: "Reči A1.2 Modul 1" },
  "Test / Modalni glagoli": { course: "nemacki-a1-2", lesson: "Modalni glagoli" },
  "Test / Wien": { course: "nemacki-a1-2", lesson: "Wien" },
  "Reči A1.2 Modul 2": { course: "nemacki-a1-2", lesson: "Reči A1.2 Modul 2" },
  "Test Körperteile A1.2": { course: "nemacki-a1-2", lesson: "Körperteile" },
  "Test Prisvojne zamenice A1.2": { course: "nemacki-a1-2", lesson: "Prisvojne zamenice" },
  "Test / Anfrage A1.2": { course: "nemacki-a1-2", lesson: "Anfrage A1.2" },
  "Reči A1.2 Modul 3": { course: "nemacki-a1-2", lesson: "Reči A1.2 Modul 3" },
  "Wörter A1.2": { course: "nemacki-a1-2", lesson: "Wörter" },
  "Test dativ A1.2": { course: "nemacki-a1-2", lesson: "Dativ" },
  "Test am Schalter A1.2": { course: "nemacki-a1-2", lesson: "Am Schalter" },
  "Kleidung A1": { course: "nemacki-a1-2", lesson: "Kleidung" },
  "Test Kleidung – Leseverstehen und Schreiben A1.2": { course: "nemacki-a1-2", lesson: "Kleidung – Leseverstehen und Schreiben" },
  "A1.2 Dativ – ličnih zamenica – test": { course: "nemacki-a1-2", lesson: "Dativ – ličnih zamenica" },
  "A1.2 Fragen formulieren": { course: "nemacki-a1-2", lesson: "Fragen formulieren" },
  "A1.2 Aduso und Feste": { course: "nemacki-a1-2", lesson: "ADUSO und Feste" },
  "Mails schreiben A1.2": { course: "nemacki-a1-2", lesson: "E-Mails schreiben" },

  // A2.1
  "2. A2.1 Familie": { course: "nemacki-a2-1", lesson: "Familie" },
  "3. A2.1 Perfekt": { course: "nemacki-a2-1", lesson: "Perfekt" },
  "4. Weil Sätze": { course: "nemacki-a2-1", lesson: "Weil Sätze" },
  "5. Wie wohnen die Deutschen A2.1": { course: "nemacki-a2-1", lesson: "Wie wohnen die Deutschen?" },
  "6. Müll A2.1": { course: "nemacki-a2-1", lesson: "Müll" },
  "7. Wechselpräpositionen A2.1": { course: "nemacki-a2-1", lesson: "Wechselpräpositionen" },
  "9. Essgewohnheiten": { course: "nemacki-a2-1", lesson: "Essgewohnheiten" },
  "10. Im Restaurant": { course: "nemacki-a2-1", lesson: "Im Restaurant" },
  "11. Indefinitpronomen": { course: "nemacki-a2-1", lesson: "Indefinitpronomen im Nominativ und Akkusativ" },
  "12. Arbeitswelt A2.1": { course: "nemacki-a2-1", lesson: "Arbeitsklima" },
  "13. Bewerbung": { course: "nemacki-a2-1", lesson: "Bewerbungen" },
  "14. weil, denn dann": { course: "nemacki-a2-1", lesson: "Weil, denn, dann" },
  "15. Arbeitszeit, Urlaubs- und Feiertage": { course: "nemacki-a2-1", lesson: "Arbeitszeit, Urlaubs- und Feiertage" },
  "16. Refleksivni glagoli": { course: "nemacki-a2-1", lesson: "Refleksivni glagoli" },
  "17. Ich interessiere mich für…": { course: "nemacki-a2-1", lesson: "Ich interessiere mich für…" },
  "18. Fußball": { course: "nemacki-a2-1", lesson: "Fußball" },
  "19. Worauf, darauf": { course: "nemacki-a2-1", lesson: "Worauf, darauf" },
  "20. Modalni glagoli u prošlosti": { course: "nemacki-a2-1", lesson: "Modalni glagoli u prošlosti" },
  "21. Schule – Deutschlandlabor": { course: "nemacki-a2-1", lesson: "Schule – Deutschlandlabor" },
  "22. Schulsystem in Deutschland": { course: "nemacki-a2-1", lesson: "Schulsystem in Deutschland – Leseverstehen" },
  "23. Ausbildung in Deutschland": { course: "nemacki-a2-1", lesson: "Ausbildung in Deutschland" },

  // A2.2
  "1. hätte wäre": { course: "nemacki-a2-2", lesson: "Hätte und wäre" },
  "2. Wandern A2.2": { course: "nemacki-a2-2", lesson: "Video – Wandern" },
  "3. Trotzdem": { course: "nemacki-a2-2", lesson: "Trotzdem" },
  "5. Sätze formulieren": { course: "nemacki-a2-2", lesson: "Sätze formulieren" },
  "6. Dunkelrestaurant": { course: "nemacki-a2-2", lesson: "Dunkelrestaurant" },
  "7. Auf dem Flohmarkt": { course: "nemacki-a2-2", lesson: "Auf dem Flohmarkt" },
  "8. Deklinacija prideva": { course: "nemacki-a2-2", lesson: "Deklinacija prideva" },
  "9. Pasiv": { course: "nemacki-a2-2", lesson: "Pasiv" },
  "10. Deklinacija prideva": { course: "nemacki-a2-2", lesson: "Deklinacija prideva – Wiederholung" },
  "11. Über das Internet": { course: "nemacki-a2-2", lesson: "Über das Internet" },
  "12. Mit freundlichen Grüßen": { course: "nemacki-a2-2", lesson: "Mit freundlichen Grüßen" },
  "13. Komparacija prideva": { course: "nemacki-a2-2", lesson: "Komparacija prideva" },
  "16. Trennbare Verben / 5 Minuten Lektion": { course: "nemacki-a2-2", lesson: "Trennbare Verben – WH zum Thema Rad fahren" },
  "17. Drahtesel A2.2": { course: "nemacki-a2-2", lesson: "Drahtesel" },
  "Adventskranz": { course: "nemacki-a2-2", lesson: "Adventskranz" },
  "Granfluencer": { course: "nemacki-a2-2", lesson: "Leseverstehen Granfluencer" },
  "Weihnachten ist…": { course: "nemacki-a2-2", lesson: "Weihnachten ist…" },

  // B1.1
  "Konjunktiv II der Vergangenheit": { course: "nemacki-b1-1", lesson: "Konjunktiv II der Vergangenheit" },
  "B1.1 Rotkäppchen": { course: "nemacki-b1-1", lesson: "Rotkäppchen und das Präteritum" },
  "Wenn oder als": { course: "nemacki-b1-1", lesson: "Als oder wenn" },
  "Glück Leseverstehen B1": { course: "nemacki-b1-1", lesson: "Glück" },
  "Relativne rečenice B1": { course: "nemacki-b1-1", lesson: "Relativne rečenice" },
  "Filme und Serien": { course: "nemacki-b1-1", lesson: "Filme und Serien: Komödie vs. Thriller?" },
  "Obwohl, weil, wenn — Nebensätze": { course: "nemacki-b1-1", lesson: "Obwohl vs. weil" },
  "Blutgruppen – wichtige Entdeckung in der Medizin": { course: "nemacki-b1-1", lesson: "Blutgruppen – wichtige Entdeckung in der Medizin" },
  "Pasiv sa modalnim glagolima": { course: "nemacki-b1-1", lesson: "Pasiv prezenta sa modalnim glagolima" },
  "Genitiv": { course: "nemacki-b1-1", lesson: "Genitiv" },
  "Lese und Hörverstehen – B1": { course: "nemacki-b1-1", lesson: "Lese und Hörverstehen – B1" },
  "Berufswechsel – test": { course: "nemacki-b1-1", lesson: "Berufswechsel LV" },

  // B1.2
  "100 Wörter – Niveau B1": { course: "nemacki-b1-2", lesson: "100 reči za nivo B1" },
  "Als ob Sätze B1.2": { course: "nemacki-b1-2", lesson: "Als ob Sätze" },
  "Finalsätze": { course: "nemacki-b1-2", lesson: "Finalsätze (um+zu vs. damit)" },
  "Zweiteilige Konnektoren": { course: "nemacki-b1-2", lesson: "Zweiteilige Konnektoren" },
  "Falls Sätze": { course: "nemacki-b1-2", lesson: "Falls Sätze" },
  "Probleme im Büro": { course: "nemacki-b1-2", lesson: "Probleme im Büro" },
  "Je…desto/umso": { course: "nemacki-b1-2", lesson: "Je…desto/umso" },
  "Relativne rečenice sa predlozima": { course: "nemacki-b1-2", lesson: "Relativne rečenice sa predlozima" },
  "Freundschaften im Job": { course: "nemacki-b1-2", lesson: "Freundschaften im Job – Leseverstehen und Wortschatz" },
  "Duzen vs. Siezen": { course: "nemacki-b1-2", lesson: "Duzen vs. Siezen – Prüfung B1 – Leseverstehen" },
};

// ── Type conversion ──────────────────────────────────────

function mapExerciseType(ldType: string): string {
  switch (ldType) {
    case "cloze_answer": return "fill_blank";
    case "single": return "quiz";
    case "multiple": return "quiz";
    case "matrix_sort_answer": return "match_pairs";
    case "sort_answer": return "word_order";
    case "free_answer": return "fill_blank"; // treat as fill_blank with text input
    case "essay": return "fill_blank";
    default: return "quiz";
  }
}

// Parse cloze_answer: "Die Wohnung ist {klein}. Der Flur ist {schmal}."
// → Multiple fill_blank questions
function parseClozeAnswer(text: string): Array<{ question: string; correct: string }> {
  const results: Array<{ question: string; correct: string }> = [];
  const regex = /\{([^}]+)\}/g;
  let match;

  // Split into sentences that contain blanks
  const sentences = text.split(/\n/).filter(s => s.includes("{"));

  if (sentences.length === 0) {
    // Whole text is one question
    const answers: string[] = [];
    let cleaned = text;
    while ((match = regex.exec(text)) !== null) {
      answers.push(match[1].split("|")[0]); // handle {word|points} format
    }
    cleaned = text.replace(regex, "______");
    if (answers.length > 0) {
      results.push({ question: cleaned, correct: answers.join(", ") });
    }
    return results;
  }

  for (const sentence of sentences) {
    const answers: string[] = [];
    const sentenceRegex = /\{([^}]+)\}/g;
    let sentenceMatch;
    while ((sentenceMatch = sentenceRegex.exec(sentence)) !== null) {
      answers.push(sentenceMatch[1].split("|")[0]);
    }
    const cleaned = sentence.replace(/\{([^}|]+)(\|[^}]*)?\}/g, "______").trim();
    if (cleaned && answers.length > 0) {
      results.push({ question: cleaned, correct: answers.join(", ") });
    }
  }

  return results;
}

// Parse single/multiple choice
function parseSingleMultiple(q: any): { question: string; options: string[]; correct: string } {
  const options: string[] = [];
  if (q.answerA) options.push(q.answerA);
  if (q.answerB) options.push(q.answerB);
  if (q.answerC) options.push(q.answerC);
  if (q.answerD) options.push(q.answerD);
  if (q.answerE) options.push(q.answerE);
  if (q.answerF) options.push(q.answerF);

  return {
    question: q.text || q.title || "",
    options,
    correct: q.correct || "A",
  };
}

// ── Main import ──────────────────────────────────────

async function importQuizzes() {
  const raw = fs.readFileSync("scripts/learndash-export-parsed.json", "utf-8");
  const data = JSON.parse(raw);

  // Load all courses and lessons from DB
  const { data: courses } = await supabase.from("courses").select("id, slug");
  const { data: lessons } = await supabase.from("lessons").select("id, course_id, title");

  if (!courses || !lessons) {
    console.error("Failed to load courses/lessons from DB");
    return;
  }

  const courseBySlug = new Map(courses.map((c: any) => [c.slug, c.id]));
  const lessonByKey = new Map(
    lessons.map((l: any) => [`${l.course_id}::${l.title}`, l.id])
  );

  let exercisesCreated = 0;
  let questionsCreated = 0;
  let quizzesSkipped = 0;
  let quizzesMapped = 0;

  for (const quiz of data.quizzes) {
    const mapping = QUIZ_LESSON_MAP[quiz.name];
    if (!mapping) {
      quizzesSkipped++;
      continue;
    }

    const courseId = courseBySlug.get(mapping.course);
    if (!courseId) {
      console.log(`  ⚠ Course not found: ${mapping.course}`);
      quizzesSkipped++;
      continue;
    }

    // Find lesson - try exact match first, then partial
    let lessonId: string | undefined;
    for (const [key, id] of lessonByKey) {
      if (key.startsWith(`${courseId}::`) && key.endsWith(`::${mapping.lesson}`)) {
        lessonId = id;
        break;
      }
    }
    if (!lessonId) {
      // Partial match
      for (const [key, id] of lessonByKey) {
        if (key.startsWith(`${courseId}::`) && key.toLowerCase().includes(mapping.lesson.toLowerCase())) {
          lessonId = id;
          break;
        }
      }
    }
    if (!lessonId) {
      // Even more fuzzy - match on the lesson part only
      for (const [key, id] of lessonByKey) {
        const lessonTitle = key.split("::")[1] || "";
        if (key.startsWith(`${courseId}::`) && lessonTitle.includes(mapping.lesson)) {
          lessonId = id;
          break;
        }
      }
    }

    if (!lessonId) {
      console.log(`  ⚠ Lesson not found: "${mapping.lesson}" in course ${mapping.course}`);
      quizzesSkipped++;
      continue;
    }

    // Check if exercise already exists for this lesson
    const { data: existingExercise } = await supabase
      .from("exercises")
      .select("id")
      .eq("lesson_id", lessonId)
      .single();

    if (existingExercise) {
      quizzesSkipped++;
      continue;
    }

    // Determine primary exercise type from quiz
    const typeCounts = new Map<string, number>();
    for (const q of quiz.questions) {
      const t = q.type || "unknown";
      typeCounts.set(t, (typeCounts.get(t) || 0) + 1);
    }
    const primaryType = [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "quiz";
    const lmsType = mapExerciseType(primaryType);

    // Create exercise
    const { data: exercise, error: exError } = await supabase
      .from("exercises")
      .insert({
        lesson_id: lessonId,
        title: quiz.name,
        exercise_type: lmsType,
        order_index: 0,
      })
      .select("id")
      .single();

    if (exError || !exercise) {
      console.error(`  ✗ Exercise "${quiz.name}" failed:`, exError?.message);
      continue;
    }

    exercisesCreated++;
    let questionIndex = 0;

    for (const q of quiz.questions) {
      const type = q.type || "";

      if (type === "cloze_answer") {
        // Parse cloze into fill_blank questions
        const clozeText = q.answerA || q.text || "";
        const parsed = parseClozeAnswer(clozeText);

        for (const p of parsed) {
          if (!p.question.trim()) continue;
          await supabase.from("exercise_questions").insert({
            exercise_id: exercise.id,
            question: p.question,
            options: JSON.stringify([p.correct]),
            correct_answer: p.correct,
            explanation: null,
            order_index: questionIndex++,
          });
          questionsCreated++;
        }
      } else if (type === "single" || type === "multiple") {
        const parsed = parseSingleMultiple(q);
        if (!parsed.question.trim() && !parsed.options.length) continue;

        await supabase.from("exercise_questions").insert({
          exercise_id: exercise.id,
          question: parsed.question,
          options: JSON.stringify(parsed.options),
          correct_answer: parsed.correct,
          explanation: null,
          order_index: questionIndex++,
        });
        questionsCreated++;
      } else if (type === "matrix_sort_answer") {
        // Match pairs - answerA and answerB are the two sides
        if (q.answerA && q.answerB) {
          await supabase.from("exercise_questions").insert({
            exercise_id: exercise.id,
            question: q.text || "Poveži parove:",
            options: JSON.stringify({ left: [q.answerA], right: [q.answerB] }),
            correct_answer: `${q.answerA}=${q.answerB}`,
            explanation: null,
            order_index: questionIndex++,
          });
          questionsCreated++;
        }
      } else if (type === "sort_answer") {
        // Word order
        const words: string[] = [];
        if (q.answerA) words.push(q.answerA);
        if (q.answerB) words.push(q.answerB);
        if (q.answerC) words.push(q.answerC);
        if (q.answerD) words.push(q.answerD);

        if (words.length > 0) {
          await supabase.from("exercise_questions").insert({
            exercise_id: exercise.id,
            question: q.text || "Poređaj redom:",
            options: JSON.stringify(words),
            correct_answer: words.join(", "),
            explanation: null,
            order_index: questionIndex++,
          });
          questionsCreated++;
        }
      } else if (type === "free_answer" || type === "essay") {
        await supabase.from("exercise_questions").insert({
          exercise_id: exercise.id,
          question: q.text || q.title || "",
          options: JSON.stringify([]),
          correct_answer: q.answerA || "",
          explanation: null,
          order_index: questionIndex++,
        });
        questionsCreated++;
      }
    }

    quizzesMapped++;
    console.log(`  ✓ ${quiz.name} → ${mapping.lesson} (${questionIndex} pitanja)`);
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  Mapirano: ${quizzesMapped} kvizova`);
  console.log(`  Preskočeno: ${quizzesSkipped} (nema mapiranja ili već postoji)`);
  console.log(`  Vežbi kreirano: ${exercisesCreated}`);
  console.log(`  Pitanja kreirano: ${questionsCreated}`);
  console.log(`═══════════════════════════════════════\n`);
}

importQuizzes().catch(console.error);
