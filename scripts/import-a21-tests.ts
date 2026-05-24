/**
 * Import A2.1 module tests (exercises)
 * Run: npx tsx scripts/import-a21-tests.ts
 *
 * Moduli:
 * 1: Persönliche Angaben, Familie, Perfekt, Weil Sätze (lekcije 0-3)
 * 2: Wohnen, Müll, Wechselpräpositionen (lekcije 4-6)
 * 3: Kommunikation, Essgewohnheiten, Restaurant, Indefinitpronomen (lekcije 7-10)
 * 4: Arbeitsklima, Bewerbungen, weil/denn/dann, Arbeitszeit (lekcije 11-14)
 * 5: Refleksivni, interessieren, Fußball, Worauf/Darauf, Modalni (lekcije 15-19)
 * 6: Schule, Schulsystem, Ausbildung (lekcije 20-24)
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
        question: "______ geht es Ihnen? ______ wohnen Sie? ______ kommen Sie?",
        options: { type: "fill_blank", items: ["Wie", "Wo", "Woher", "Was"] },
        correct_answer: "Wie, Wo, Woher",
        question_type: "fill_blank",
      },
      {
        question: "Meine Hochzeit war letzte Woche. Jetzt bin ich __________.",
        options: { type: "quiz", items: ["ledig", "verheiratet", "geschieden", "getrennt"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Spoji clanove porodice:",
        options: { type: "match_pairs", items: [
          { de: "der Neffe", sr: "bratanac" },
          { de: "die Nichte", sr: "bratanica" },
          { de: "der Schwager", sr: "zet/dever" },
          { de: "die Enkelin", sr: "unuka" },
          { de: "die Tante", sr: "tetka" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Wir haben ein Fest _______ .",
        options: { type: "quiz", items: ["gefeiern", "feiern", "gefeiert"] },
        correct_answer: "2",
        explanation: "Perfekt od feiern: ge + feier + t = gefeiert",
        question_type: "quiz",
      },
      {
        question: "Wann hat der Film ______? (beginnen)",
        options: { type: "fill_blank", items: ["begonnen", "beginnt", "gebeginnt", "angefangen"] },
        correct_answer: "begonnen",
        question_type: "fill_blank",
      },
      {
        question: "Ich habe meine Freundin in Dresden ______. (besuchen)",
        options: { type: "fill_blank", items: ["besucht", "gebesucht", "besuchen", "besuchte"] },
        correct_answer: "besucht",
        explanation: "Glagoli sa nerazdvojnim prefiksom (be-, ver-, er-) ne dobijaju ge-.",
        question_type: "fill_blank",
      },
      {
        question: "Ich bin nach Berlin ______. (fliegen)",
        options: { type: "quiz", items: ["geflogen", "gefliegt", "geflogen", "flog"] },
        correct_answer: "0",
        explanation: "fliegen je glagol kretanja → Perfekt sa sein: bin geflogen",
        question_type: "quiz",
      },
      {
        question: "Ich gehe nicht zur Arbeit, ______ ich krank bin.",
        options: { type: "quiz", items: ["denn", "weil", "dann", "wenn"] },
        correct_answer: "1",
        explanation: "Posle weil glagol ide na kraj recenice.",
        question_type: "quiz",
      },
      {
        question: "Ich esse kein Fleisch, denn ich ______ Vegetarier.",
        options: { type: "quiz", items: ["bin", "ist", "bist", "sind"] },
        correct_answer: "0",
        explanation: "Posle denn normalan red reci: ich bin.",
        question_type: "quiz",
      },
      {
        question: "Zasto ucis nemacki?",
        options: { type: "word_order", items: ["Ich", "lerne", "Deutsch,", "weil", "ich", "in", "Deutschland", "arbeiten", "mochte."] },
        correct_answer: "Ich lerne Deutsch, weil ich in Deutschland arbeiten mochte.",
        question_type: "word_order",
      },
    ],
  },
  2: {
    title: "Test Modul 2",
    questions: [
      {
        question: "Spoji tipove stanovanja:",
        options: { type: "match_pairs", items: [
          { de: "das Einfamilienhaus", sr: "kuca za jednu porodicu" },
          { de: "das Reihenhaus", sr: "kuca u nizu" },
          { de: "das Mehrfamilienhaus", sr: "zgrada sa vise stanova" },
          { de: "das Ein-Zimmer-Appartement", sr: "garsonjera" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Das Wohnzimmer ist sehr ______.",
        options: { type: "quiz", items: ["gemutliches", "gemutliche", "gemutlich"] },
        correct_answer: "2",
        explanation: "Posle sein pridev ne dobija nastavak.",
        question_type: "quiz",
      },
      {
        question: "Wir haben eine schmale ______.",
        options: { type: "quiz", items: ["Garage", "Garten", "Balkon", "Aufzug"] },
        correct_answer: "0",
        explanation: "eine = zenski rod, Garage je die Garage.",
        question_type: "quiz",
      },
      {
        question: "Izbegavati smece je na nemackom:",
        options: { type: "quiz", items: ["Mull vermeiden", "Mull trennen", "Mull sammeln", "Mull verbrennen"] },
        correct_answer: "0",
        question_type: "quiz",
      },
      {
        question: "Die meisten Menschen in Deutschland trennen den Mull.",
        options: { type: "quiz", items: ["richtig", "falsch"] },
        correct_answer: "0",
        question_type: "quiz",
      },
      {
        question: "Das Bild hangt an ______ Wand. (Wo?)",
        options: { type: "quiz", items: ["der", "die", "dem", "den"] },
        correct_answer: "0",
        explanation: "Wo? = Dativ. die Wand → der Wand",
        question_type: "quiz",
      },
      {
        question: "Ich hange das Bild an ______ Wand. (Wohin?)",
        options: { type: "quiz", items: ["der", "die", "dem", "den"] },
        correct_answer: "1",
        explanation: "Wohin? = Akkusativ. die Wand → die Wand",
        question_type: "quiz",
      },
      {
        question: "Spoji Wo? i Wohin? glagole:",
        options: { type: "match_pairs", items: [
          { de: "liegen (lezati)", sr: "legen (poloziti)" },
          { de: "stehen (stajati)", sr: "stellen (staviti)" },
          { de: "sitzen (sedeti)", sr: "setzen (sesti)" },
          { de: "hangen (visiti)", sr: "hangen (okaciti)" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Bitte, warten Sie einen Moment vor ______ Tur!",
        options: { type: "quiz", items: ["der", "die", "dem", "den"] },
        correct_answer: "0",
        explanation: "Wo soll ich warten? → Dativ. die Tur → der Tur",
        question_type: "quiz",
      },
      {
        question: "Legen Sie bitte den Schlussel in ______ Briefkasten.",
        options: { type: "quiz", items: ["dem", "der", "den", "das"] },
        correct_answer: "2",
        explanation: "Wohin? → Akkusativ. der Briefkasten → den Briefkasten",
        question_type: "quiz",
      },
    ],
  },
  3: {
    title: "Test Modul 3",
    questions: [
      {
        question: "Kako se kaze 'Snesi smece!' na nemackom?",
        options: { type: "quiz", items: ["Komm rein!", "Bring den Mull runter!", "Geh raus!", "Komm rauf!"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Spoji hranu sa prevodom:",
        options: { type: "match_pairs", items: [
          { de: "die Haferflocken", sr: "ovsene pahuljice" },
          { de: "das Brötchen", sr: "zemicka" },
          { de: "die Trockenfruchte", sr: "suvo voce" },
          { de: "das Fertiggericht", sr: "gotovo jelo" },
          { de: "das Leitungswasser", sr: "voda iz cesme" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "'Es ist mir Wurst' znaci:",
        options: { type: "quiz", items: ["Volim virsle", "Svejedno mi je", "Gladan sam", "Ne jedem meso"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Ich hatte gern ein Bier, bitte. — Sta radis?",
        options: { type: "quiz", items: ["Naplacujes", "Narucujes", "Reklamiras", "Zahvaljujes"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Hat es Ihnen ______?",
        options: { type: "quiz", items: ["geschmeckt", "gefallen", "gepasst", "gekocht"] },
        correct_answer: "0",
        explanation: "Konobar pita: Hat es Ihnen geschmeckt? (Da li vam je prijalo?)",
        question_type: "quiz",
      },
      {
        question: "Das Restaurant ist sehr ______. Die Kellner sind immer ______.",
        options: { type: "fill_blank", items: ["schon", "freundlich", "teuer", "leer"] },
        correct_answer: "schon, freundlich",
        question_type: "fill_blank",
      },
      {
        question: "Spoji pribor za jelo:",
        options: { type: "match_pairs", items: [
          { de: "die Gabel", sr: "viljuska" },
          { de: "das Messer", sr: "noz" },
          { de: "der Löffel", sr: "kasika" },
          { de: "die Serviette", sr: "salveta" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Mogu li da dobijem racun?",
        options: { type: "word_order", items: ["Konnen", "Sie", "mir", "bitte", "die", "Rechnung", "bringen?"] },
        correct_answer: "Konnen Sie mir bitte die Rechnung bringen?",
        question_type: "word_order",
      },
    ],
  },
  4: {
    title: "Test Modul 4",
    questions: [
      {
        question: "Sta je ti vazno na poslu? 'feste Arbeitszeiten' znaci:",
        options: { type: "quiz", items: ["fleksibilno radno vreme", "fiksno radno vreme", "pola radnog vremena", "rad od kuce"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Ein guter Chef ______ respektvoll sein.",
        options: { type: "quiz", items: ["soll", "sollte", "will", "muss"] },
        correct_answer: "1",
        explanation: "Konjunktiv II od sollen = sollte (savet, ne naredba).",
        question_type: "quiz",
      },
      {
        question: "Ich kann heute nicht zum Meeting kommen, ______ ich bin krank.",
        options: { type: "quiz", items: ["weil", "denn", "dann", "wenn"] },
        correct_answer: "1",
        explanation: "Posle denn normalan red reci: ich bin krank.",
        question_type: "quiz",
      },
      {
        question: "Er hat eine Gehaltserhohung bekommen, ______ er hart gearbeitet hat.",
        options: { type: "quiz", items: ["denn", "weil", "dann", "wenn"] },
        correct_answer: "1",
        explanation: "weil + glagol na kraj: gearbeitet hat",
        question_type: "quiz",
      },
      {
        question: "Spoji delove prijave za posao:",
        options: { type: "match_pairs", items: [
          { de: "das Anschreiben", sr: "motivaciono pismo" },
          { de: "der Lebenslauf", sr: "CV / biografija" },
          { de: "das Zeugnis", sr: "diploma" },
          { de: "das Vorstellungsgesprach", sr: "razgovor za posao" },
          { de: "die Stellenanzeige", sr: "oglas za posao" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Koliko sati nedeljno rade Nemci u proseku?",
        options: { type: "quiz", items: ["35", "38,5", "42", "45"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Koliko dana godisnjeg odmora imaju nemacki zaposleni?",
        options: { type: "quiz", items: ["15 dana", "20 dana", "oko 30 dana", "40 dana"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: "Ich bewerbe ______ um die Stelle als Kellnerin.",
        options: { type: "quiz", items: ["mich", "sich", "dich", "mir"] },
        correct_answer: "0",
        explanation: "sich bewerben: ich bewerbe mich",
        question_type: "quiz",
      },
    ],
  },
  5: {
    title: "Test Modul 5",
    questions: [
      {
        question: "Du bewegst ______ zu wenig.",
        options: { type: "quiz", items: ["mich", "dich", "sich", "uns"] },
        correct_answer: "1",
        explanation: "du → dich",
        question_type: "quiz",
      },
      {
        question: "Wir treffen ______ morgen im Cafe.",
        options: { type: "quiz", items: ["sich", "euch", "uns", "mich"] },
        correct_answer: "2",
        explanation: "wir → uns",
        question_type: "quiz",
      },
      {
        question: "Spoji refleksivne glagole:",
        options: { type: "match_pairs", items: [
          { de: "sich verlieben", sr: "zaljubiti se" },
          { de: "sich streiten", sr: "svadjati se" },
          { de: "sich entschuldigen", sr: "izviniti se" },
          { de: "sich beeilen", sr: "pozuriti" },
          { de: "sich ernahren", sr: "hraniti se" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Interessierst du ______ fur den Tanzsport?",
        options: { type: "quiz", items: ["mich", "dich", "sich", "euch"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Spoji glagole sa predlozima:",
        options: { type: "match_pairs", items: [
          { de: "warten", sr: "auf" },
          { de: "sich argern", sr: "uber" },
          { de: "sich interessieren", sr: "fur" },
          { de: "zufrieden sein", sr: "mit" },
          { de: "erzahlen", sr: "von" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Als Kind ______ ich Arzt werden. (wollen - Prateritum)",
        options: { type: "quiz", items: ["wollte", "will", "wolltest", "gewollt"] },
        correct_answer: "0",
        question_type: "quiz",
      },
      {
        question: "Ich ______ jeden Tag viel lernen. (mussen - Prateritum)",
        options: { type: "quiz", items: ["muss", "musste", "gemusst", "mussten"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Das ______ ich leider nicht. (durfen - Prateritum)",
        options: { type: "quiz", items: ["durfte", "darf", "gedurft", "durften"] },
        correct_answer: "0",
        question_type: "quiz",
      },
      {
        question: "Hier darf man nicht ______.",
        options: { type: "quiz", items: ["fotografieren", "parken", "rauchen", "sve navedeno"] },
        correct_answer: "3",
        question_type: "quiz",
      },
      {
        question: "In meiner Freizeit ______ ich machen, was ich wollte. (konnen - Prateritum)",
        options: { type: "quiz", items: ["konnte", "kann", "konnten", "gekonnt"] },
        correct_answer: "0",
        question_type: "quiz",
      },
    ],
  },
  6: {
    title: "Test Modul 6",
    questions: [
      {
        question: "Koliko godina traje Schulpflicht u Nemackoj?",
        options: { type: "quiz", items: ["6 godina", "8 godina", "9 godina", "12 godina"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: "Spoji tipove skola:",
        options: { type: "match_pairs", items: [
          { de: "Grundschule", sr: "osnovna skola (1-4)" },
          { de: "Gymnasium", sr: "gimnazija (5-13)" },
          { de: "Hauptschule", sr: "skola za zanat (5-9)" },
          { de: "Realschule", sr: "srednja skola (5-10)" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Sta je Schultute?",
        options: { type: "quiz", items: ["Skolska torba", "Kesa sa poklonima za prvi skolski dan", "Skolska uniforma", "Skolski autobus"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Da li su drzavne skole u Nemackoj besplatne?",
        options: { type: "quiz", items: ["Da", "Ne", "Samo Grundschule", "Samo Gymnasium"] },
        correct_answer: "0",
        question_type: "quiz",
      },
      {
        question: "Sta je duale Ausbildung?",
        options: { type: "quiz", items: ["Ucenje samo u skoli", "Ucenje samo u firmi", "Ucenje istovremeno u skoli i firmi", "Online ucenje"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: "Spoji predskolsko obrazovanje:",
        options: { type: "match_pairs", items: [
          { de: "die Kinderkrippe", sr: "jasle (do 3 god.)" },
          { de: "der Kindergarten", sr: "vrtic (od 3 god.)" },
          { de: "die Kita", sr: "dnevni boravak" },
          { de: "der Hort", sr: "produzeni boravak" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Koliko traje Ausbildung u Nemackoj?",
        options: { type: "quiz", items: ["6 meseci", "1 godinu", "2-3,5 godine", "5 godina"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: "Sta je Blauer Brief?",
        options: { type: "quiz", items: ["Pozivnica za roditelje", "Obavestenje da dete mozda ponavlja razred", "Pismo zahvalnosti", "Poziv na roditeljski sastanak"] },
        correct_answer: "1",
        question_type: "quiz",
      },
    ],
  },
};

// ─── Import logic ─────────────────────────────────────────────

async function main() {
  console.log("Importing A2.1 module tests...\n");

  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .select("id, title")
    .eq("slug", "nemacki-a2-1")
    .single();

  if (courseErr || !course) {
    console.error("Course not found:", courseErr?.message);
    return;
  }
  console.log(`Found course: ${course.title} (${course.id})\n`);

  // Get lessons to find test positions
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .eq("course_id", course.id)
    .order("order_index");

  if (!lessons) return;

  // Module test goes on the LAST lesson of each module
  // Module 1: lekcije 0-3 → test on lesson at order_index 3 (Weil Satze)
  // Module 2: lekcije 4-6 → test on lesson at order_index 6 (Wechselprapositionen)
  // Module 3: lekcije 7-10 → test on lesson at order_index 10 (Indefinitpronomen)
  // Module 4: lekcije 11-14 → test on lesson at order_index 14 (Arbeitszeit)
  // Module 5: lekcije 15-19 → test on lesson at order_index 19 (Modalni)
  // Module 6: lekcije 20-24 → test on lesson at order_index 24 (Krimi roman)

  const moduleToLessonIndex: Record<number, number> = {
    1: 3,
    2: 6,
    3: 10,
    4: 14,
    5: 19,
    6: 24,
  };

  for (const [moduleNum, testData] of Object.entries(MODULE_TESTS)) {
    const lessonIndex = moduleToLessonIndex[Number(moduleNum)];
    const lesson = lessons.find((l) => l.order_index === lessonIndex);

    if (!lesson) {
      console.log(`  SKIP: Module ${moduleNum} — lesson not found at index ${lessonIndex}`);
      continue;
    }

    // Check if exercise already exists
    const { data: existing } = await supabase
      .from("exercises")
      .select("id")
      .eq("lesson_id", lesson.id)
      .eq("title", testData.title);

    if (existing && existing.length > 0) {
      console.log(`  SKIP: ${testData.title} — already exists on "${lesson.title}"`);
      continue;
    }

    // Create exercise
    const { data: exercise, error: exErr } = await supabase
      .from("exercises")
      .insert({
        lesson_id: lesson.id,
        title: testData.title,
        exercise_type: "quiz",
        order_index: 0,
      })
      .select("id")
      .single();

    if (exErr || !exercise) {
      console.error(`  ERROR: ${testData.title}: ${exErr?.message}`);
      continue;
    }

    // Create questions
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
      console.error(`  ERROR questions: ${testData.title}: ${qErr.message}`);
    } else {
      console.log(`  OK: ${testData.title} — ${questions.length} pitanja → "${lesson.title}"`);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
