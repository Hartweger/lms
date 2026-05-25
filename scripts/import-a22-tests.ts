/**
 * Import A2.2 module tests (exercises)
 * Run: npx tsx scripts/import-a22-tests.ts
 *
 * Moduli:
 * 1: Konjunktiv II, Wandern, Trotzdem (lekcije 0-6)
 * 2: Dialoge, Sätze formulieren, Dunkelrestaurant, Flohmarkt (lekcije 7-10)
 * 3: Deklinacija prideva, Pasiv, Internet, formalni mejl (lekcije 11-15)
 * 4: Komparacija, Leseverstehen, Trennbare Verben, Drahtesel (lekcije 16-20)
 * 5: Reisen, Bank, Geld (lekcije 21-25)
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

interface Question {
  question: string;
  options: unknown;
  correct_answer: string;
  explanation?: string;
  question_type: string;
}

const MODULE_TESTS: Record<number, { title: string; questions: Question[] }> = {
  1: {
    title: "Test Modul 1",
    questions: [
      {
        question: "Ich __________ gern mehr Freizeit.",
        options: { type: "quiz", items: ["wäre", "hätte", "würde", "könnte"] },
        correct_answer: "1",
        explanation: "hätte = imao bih — koristi se za stvari (Freizeit je stvar).",
        question_type: "quiz",
      },
      {
        question: "Sie __________ gern am Meer.",
        options: { type: "quiz", items: ["hätte", "würde", "wäre", "könnte"] },
        correct_answer: "2",
        explanation: "wäre = bio bih — koristi se za mesta i osobine.",
        question_type: "quiz",
      },
      {
        question: "Wir __________ gern ins Kino gehen.",
        options: { type: "quiz", items: ["hätten", "wären", "würden", "könnten"] },
        correct_answer: "2",
        explanation: "würde + Infinitiv za želju sa glagolom.",
        question_type: "quiz",
      },
      {
        question: "Spoji konjugaciju wäre:",
        options: {
          type: "match_pairs",
          items: [
            { de: "ich", sr: "wäre" },
            { de: "du", sr: "wärst" },
            { de: "wir", sr: "wären" },
            { de: "er/sie/es", sr: "wäre" },
          ],
        },
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Das Wetter ist schlecht. __________ machen wir einen Ausflug.",
        options: { type: "quiz", items: ["Weil", "Trotzdem", "Denn", "Deshalb"] },
        correct_answer: "1",
        explanation: "Trotzdem = ipak — izražava suprotnost.",
        question_type: "quiz",
      },
      {
        question: "Es regnet. Trotzdem __________ ich spazieren.",
        options: { type: "quiz", items: ["gehen", "gehe", "ging", "gegangen"] },
        correct_answer: "1",
        explanation: "Posle trotzdem glagol je na poziciji 2.",
        question_type: "quiz",
      },
      {
        question: "Ich bin müde. Trotzdem __________ ich weiter. (lernen)",
        options: { type: "fill_blank", items: ["lerne", "lernen", "gelernt", "lernte"] },
        correct_answer: "lerne",
        question_type: "fill_blank",
      },
      {
        question: "Wir __________ am Samstag zusammen frühstücken. (predlog)",
        options: { type: "quiz", items: ["müssen", "sollen", "könnten", "dürfen"] },
        correct_answer: "2",
        explanation: "könnten za učtive predloge.",
        question_type: "quiz",
      },
      {
        question: "Spoji reči iz teme Wandern:",
        options: {
          type: "match_pairs",
          items: [
            { de: "der Gipfel", sr: "vrh planine" },
            { de: "der Rucksack", sr: "ranac" },
            { de: "die Hütte", sr: "planinarska kuća" },
            { de: "die Aussicht", sr: "pogled, vidik" },
            { de: "anstrengend", sr: "naporan" },
          ],
        },
        correct_answer: "all",
        question_type: "match_pairs",
      },
    ],
  },

  2: {
    title: "Test Modul 2",
    questions: [
      {
        question: "Kako na nemačkom kažeš 'Predlažem da...'?",
        options: {
          type: "quiz",
          items: [
            "Ich finde es gut, dass...",
            "Ich schlage vor, dass...",
            "Ich bin dagegen, dass...",
            "Ich meine, dass...",
          ],
        },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Tvoj prijatelj predlaže nešto što ti se ne sviđa. Šta kažeš?",
        options: {
          type: "quiz",
          items: [
            "Super! Prima!",
            "Das finde ich gut!",
            "Das gefällt mir nicht so gut.",
            "Einverstanden!",
          ],
        },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: "__________ es dir am Freitag um acht?",
        options: { type: "quiz", items: ["Geht", "Passt", "Ist", "Passt i Geht su oba tačna"] },
        correct_answer: "3",
        explanation: "I 'Passt es dir' i 'Geht es am Freitag' su ispravni.",
        question_type: "quiz",
      },
      {
        question: "Morgens __________ ich immer um 7 Uhr auf.",
        options: { type: "quiz", items: ["stehen", "stehe", "steht", "aufstehe"] },
        correct_answer: "1",
        explanation: "Prilog na prvom mestu → glagol na drugom: stehe ich auf.",
        question_type: "quiz",
      },
      {
        question: "Ich wohne in __________ Haus in der Marktstraße.",
        options: { type: "quiz", items: ["ein", "einem", "einer", "einen"] },
        correct_answer: "1",
        explanation: "in + Dativ (Wo?) → in einem Haus.",
        question_type: "quiz",
      },
      {
        question: "Was ist das Besondere am Dunkelrestaurant?",
        options: {
          type: "quiz",
          items: [
            "Das Essen ist besonders teuer.",
            "Es ist ganz dunkel — man kann nichts sehen.",
            "Man isst nur Süßigkeiten.",
            "Die Kellner kochen am Tisch.",
          ],
        },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Spoji reči iz Dunkelrestaurant:",
        options: {
          type: "match_pairs",
          items: [
            { de: "sehbehindert", sr: "slabovid" },
            { de: "sich gewöhnen an", sr: "navići se na" },
            { de: "einschenken", sr: "sipati (piće)" },
            { de: "der Eindruck", sr: "utisak" },
          ],
        },
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Wie sagt man 'Koliko to košta?' auf Deutsch?",
        options: { type: "quiz", items: ["Wie viel ist das?", "Was kostet das?", "Wie teuer?", "Svi odgovori su tačni"] },
        correct_answer: "3",
        question_type: "quiz",
      },
    ],
  },

  3: {
    title: "Test Modul 3",
    questions: [
      {
        question: "Anna ist __________ junge Frau mit blonden Haaren.",
        options: { type: "quiz", items: ["ein", "eine", "einer", "einem"] },
        correct_answer: "1",
        explanation: "Nom. fem. → eine junge Frau.",
        question_type: "quiz",
      },
      {
        question: "Er trägt immer einen gepflegt__________ Bart.",
        options: { type: "fill_blank", items: ["en", "er", "es", "e"] },
        correct_answer: "en",
        explanation: "Akk. mask. → einen gepflegten Bart.",
        question_type: "fill_blank",
      },
      {
        question: "Ich suche die rot__________ Tasche.",
        options: { type: "fill_blank", items: ["e", "en", "er", "es"] },
        correct_answer: "e",
        explanation: "Akk. fem. + die → rote.",
        question_type: "fill_blank",
      },
      {
        question: "In Deutschland __________ Bier __________.",
        options: {
          type: "quiz",
          items: [
            "wird ... getrunken",
            "werden ... getrunken",
            "wird ... trinken",
            "ist ... getrunken",
          ],
        },
        correct_answer: "0",
        explanation: "Pasiv: werden + Partizip II. Bier je singular → wird.",
        question_type: "quiz",
      },
      {
        question: "Im Restaurant __________ die Tische __________.",
        options: {
          type: "quiz",
          items: [
            "wird ... gedeckt",
            "werden ... gedeckt",
            "werden ... decken",
            "wird ... decken",
          ],
        },
        correct_answer: "1",
        explanation: "die Tische = Plural → werden gedeckt.",
        question_type: "quiz",
      },
      {
        question: "Am Flughafen wird der Ausweis __________.",
        options: { type: "fill_blank", items: ["vorgezeigt", "vorzeigen", "zeigen", "gezeigt"] },
        correct_answer: "vorgezeigt",
        question_type: "fill_blank",
      },
      {
        question: "Spoji pasivne rečenice:",
        options: {
          type: "match_pairs",
          items: [
            { de: "In der Küche wird...", sr: "gekocht" },
            { de: "In der Schule werden Tests...", sr: "geschrieben" },
            { de: "Im Kaufhaus werden Jeans...", sr: "gekauft" },
            { de: "Im Schwimmbad wird...", sr: "geschwommen" },
          ],
        },
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Wie beginnt ein formaler Brief?",
        options: {
          type: "quiz",
          items: [
            "Hallo Frau Müller,",
            "Liebe Frau Müller,",
            "Sehr geehrte Frau Müller,",
            "Hi Frau Müller,",
          ],
        },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: "Er arbeitet in einem groß__________ Büro.",
        options: { type: "fill_blank", items: ["en", "es", "er", "em"] },
        correct_answer: "en",
        explanation: "Dat. neutr. + einem → großen.",
        question_type: "fill_blank",
      },
    ],
  },

  4: {
    title: "Test Modul 4",
    questions: [
      {
        question: "Berlin ist __________ als München. (klein)",
        options: { type: "fill_blank", items: ["kleiner", "kleinerer", "kleinster", "am kleinsten"] },
        correct_answer: "kleiner",
        question_type: "fill_blank",
      },
      {
        question: "Er ist genauso groß __________ sein Bruder.",
        options: { type: "quiz", items: ["als", "wie", "von", "mit"] },
        correct_answer: "1",
        explanation: "wie = jednako, als = različito.",
        question_type: "quiz",
      },
      {
        question: "Komparativ od 'gut' je:",
        options: { type: "quiz", items: ["güter", "besser", "mehr gut", "am gutsten"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Superlativ od 'gern' je:",
        options: { type: "quiz", items: ["am gernsten", "am liebsten", "am meisten gern", "lieber"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Spoji komparaciju:",
        options: {
          type: "match_pairs",
          items: [
            { de: "viel", sr: "mehr — am meisten" },
            { de: "hoch", sr: "höher — am höchsten" },
            { de: "gut", sr: "besser — am besten" },
            { de: "gern", sr: "lieber — am liebsten" },
          ],
        },
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Bitte alle __________! Der Zug endet hier.",
        options: { type: "quiz", items: ["einsteigen", "aussteigen", "umsteigen", "abfahren"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Mach schnell. Sonst __________ wir den Zug.",
        options: { type: "quiz", items: ["verlieren", "verpassen", "vergessen", "vermissen"] },
        correct_answer: "1",
        explanation: "den Zug verpassen = propustiti voz.",
        question_type: "quiz",
      },
      {
        question: "Der Zug __________ in Duisburg.",
        options: { type: "quiz", items: ["kommt", "hält", "steht", "bleibt"] },
        correct_answer: "1",
        explanation: "Der Zug hält = voz staje. (halten: ich halte, du hältst, er hält)",
        question_type: "quiz",
      },
    ],
  },

  5: {
    title: "Test Modul 5",
    questions: [
      {
        question: "Guten Tag. Ich möchte eine __________ nach München.",
        options: { type: "quiz", items: ["Karte", "Fahrkarte", "Ticket", "Svi su tačni"] },
        correct_answer: "3",
        question_type: "quiz",
      },
      {
        question: "Spoji prevozna sredstva:",
        options: {
          type: "match_pairs",
          items: [
            { de: "die Straßenbahn", sr: "tramvaj" },
            { de: "das Flugzeug", sr: "avion" },
            { de: "die Fähre", sr: "trajekt" },
            { de: "das Schiff", sr: "brod" },
            { de: "die S-Bahn", sr: "gradska železnica" },
          ],
        },
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Der Zug fährt auf __________ 17 ab.",
        options: { type: "quiz", items: ["Platz", "Gleis", "Straße", "Bahnhof"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Haben die Züge viel __________?",
        options: { type: "quiz", items: ["Verspätung", "Abfahrt", "Ankunft", "Fahrt"] },
        correct_answer: "0",
        question_type: "quiz",
      },
      {
        question: "Ich fahre __________ Meer. (Wohin?)",
        options: { type: "quiz", items: ["am", "ans", "auf dem", "im"] },
        correct_answer: "1",
        explanation: "Wohin? → Akkusativ: an + das = ans Meer.",
        question_type: "quiz",
      },
      {
        question: "Ich bin __________ Meer. (Wo?)",
        options: { type: "quiz", items: ["ans", "am", "ins", "auf"] },
        correct_answer: "1",
        explanation: "Wo? → Dativ: an + dem = am Meer.",
        question_type: "quiz",
      },
      {
        question: "Spoji bankarske pojmove:",
        options: {
          type: "match_pairs",
          items: [
            { de: "die Überweisung", sr: "prenos novca" },
            { de: "der Dauerauftrag", sr: "trajni nalog" },
            { de: "der Kontoauszug", sr: "izvod sa računa" },
            { de: "das Einkommen", sr: "prihod, plata" },
          ],
        },
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Geld vom Konto abheben bedeutet auf Serbisch:",
        options: { type: "quiz", items: ["uplatiti novac", "podići novac", "preneti novac", "poslati novac"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Poredaj reči: möchte / eine / ich / Fahrkarte / nach / München",
        options: {
          type: "word_order",
          items: ["Ich", "möchte", "eine", "Fahrkarte", "nach", "München."],
        },
        correct_answer: "Ich möchte eine Fahrkarte nach München.",
        question_type: "word_order",
      },
    ],
  },
};

// ─── Main ───

async function main() {
  const COURSE_SLUG = "nemacki-a2-2";

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", COURSE_SLUG)
    .single();

  if (!course) {
    console.error("Course not found:", COURSE_SLUG);
    process.exit(1);
  }

  // Get all lessons to find Test lessons
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .eq("course_id", course.id)
    .order("order_index");

  if (!lessons) {
    console.error("No lessons found");
    process.exit(1);
  }

  // Find Test lessons by title
  const testLessons = lessons.filter((l) => l.title.startsWith("Test Modul"));
  console.log(`Found ${testLessons.length} test lessons`);

  for (const testLesson of testLessons) {
    // Extract module number from title
    const match = testLesson.title.match(/Test Modul (\d+)/);
    if (!match) continue;
    const moduleNum = parseInt(match[1]);
    const testData = MODULE_TESTS[moduleNum];
    if (!testData) {
      console.log(`  [skip] No test data for module ${moduleNum}`);
      continue;
    }

    // Check if exercise already exists
    const { data: existing } = await supabase
      .from("exercises")
      .select("id")
      .eq("lesson_id", testLesson.id)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`  [skip] ${testLesson.title} already has exercises`);
      continue;
    }

    // Create exercise
    const { data: exercise, error: exErr } = await supabase
      .from("exercises")
      .insert({
        lesson_id: testLesson.id,
        title: testData.title,
        exercise_type: "quiz",
        order_index: 0,
      })
      .select("id")
      .single();

    if (exErr || !exercise) {
      console.error(`  [ERROR] Creating exercise for ${testLesson.title}`, exErr);
      continue;
    }

    // Insert questions
    const questions = testData.questions.map((q, i) => ({
      exercise_id: exercise.id,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation || null,
      order_index: i,
    }));

    const { error: qErr } = await supabase
      .from("exercise_questions")
      .insert(questions);

    if (qErr) {
      console.error(`  [ERROR] Inserting questions for ${testLesson.title}`, qErr);
    } else {
      console.log(
        `  [ok] ${testLesson.title}: ${questions.length} questions`
      );
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
