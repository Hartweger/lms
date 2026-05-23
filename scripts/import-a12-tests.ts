/**
 * Import A1.2 module test questions
 * Run: npx tsx scripts/import-a12-tests.ts
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
        question: 'Welchen Beruf hat die Person? "Ich arbeite im Krankenhaus und helfe kranken Menschen."',
        options: { type: "quiz", items: ["Lehrerin", "Ärztin", "Verkäuferin", "Köchin"] },
        correct_answer: "1",
        explanation: "Im Krankenhaus arbeitet eine Ärztin.",
        question_type: "quiz",
      },
      {
        question: "Welcher Satz ist richtig?",
        options: { type: "quiz", items: ["Gestern ich war müde.", "Gestern war ich müde.", "Gestern war müde ich.", "Ich gestern war müde."] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Mein Bruder ___ gestern krank. Er ___ Fieber.",
        options: { type: "fill_blank", items: ["war", "hatte", "ist", "hat"] },
        correct_answer: "war, hatte",
        question_type: "fill_blank",
      },
      {
        question: "Ich ___ letzte Woche keine Zeit. Ich ___ in Berlin.",
        options: { type: "fill_blank", items: ["hatte", "war", "habe", "bin"] },
        correct_answer: "hatte, war",
        question_type: "fill_blank",
      },
      {
        question: "Koliko dugo učiš nemački?",
        options: { type: "word_order", items: ["Wie", "lange", "lernst", "du", "Deutsch?"] },
        correct_answer: "Wie lange lernst du Deutsch?",
        question_type: "word_order",
      },
      {
        question: "Od kada živiš u Beču?",
        options: { type: "word_order", items: ["Seit", "wann", "wohnst", "du", "in", "Wien?"] },
        correct_answer: "Seit wann wohnst du in Wien?",
        question_type: "word_order",
      },
      {
        question: "Spoji zanimanja sa prevodom:",
        options: { type: "match_pairs", items: [
          { de: "der Arzt", sr: "lekar" },
          { de: "die Lehrerin", sr: "nastavnica" },
          { de: "der Koch", sr: "kuvar" },
          { de: "die Verkäuferin", sr: "prodavačica" },
          { de: "der Friseur", sr: "frizer" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Gestern ___ ich müde. Ich ___ Kopfschmerzen. Meine Schwester ___ auch krank.",
        options: { type: "fill_blank", items: ["war", "hatte", "ist", "hat"] },
        correct_answer: "war, hatte, war",
        question_type: "fill_blank",
      },
      {
        question: 'Welche Frage passt? Antwort: "Seit drei Jahren."',
        options: { type: "quiz", items: ["Wie lange?", "Seit wann?", "Wann?", "Wie oft?"] },
        correct_answer: "0",
        question_type: "quiz",
      },
      {
        question: 'Was bedeutet "vor zwei Jahren"?',
        options: { type: "quiz", items: ["za dve godine", "pre dve godine", "od dve godine", "dve godine ranije"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Ich habe ___ fünf Jahren in Wien gewohnt. Das ___ eine schöne Zeit.",
        options: { type: "fill_blank", items: ["vor", "war", "seit", "hatte"] },
        correct_answer: "vor, war",
        question_type: "fill_blank",
      },
    ],
  },
  2: {
    title: "Test Modul 2",
    questions: [
      {
        question: 'Die Mutter sagt zum Kind: "Es ist spät!" Was sagt sie noch?',
        options: { type: "quiz", items: ["Du gehst ins Bett.", "Kannst du ins Bett gehen?", "Geh ins Bett!", "Er geht ins Bett."] },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: "___ bitte die Tür! (otvoriti) ___ bitte leise! (biti)",
        options: { type: "fill_blank", items: ["Öffne", "Sei", "Mach", "Geh"] },
        correct_answer: "Öffne, Sei",
        question_type: "fill_blank",
      },
      {
        question: "___ deine Hausaufgaben! (uraditi) ___ nicht so laut! (govoriti)",
        options: { type: "fill_blank", items: ["Mach", "Sprich", "Schreib", "Lies"] },
        correct_answer: "Mach, Sprich",
        question_type: "fill_blank",
      },
      {
        question: "Dođi sutra kod mene!",
        options: { type: "word_order", items: ["Komm", "morgen", "zu", "mir!"] },
        correct_answer: "Komm morgen zu mir!",
        question_type: "word_order",
      },
      {
        question: 'Was passt? "Hier ___ man nicht rauchen."',
        options: { type: "quiz", items: ["muss", "darf", "will", "soll"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Spoji:",
        options: { type: "match_pairs", items: [
          { de: "müssen", sr: "morati" },
          { de: "können", sr: "moći" },
          { de: "dürfen", sr: "smeti" },
          { de: "wollen", sr: "hteti" },
          { de: "sollen", sr: "trebati" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: '"Du sollst mehr Wasser trinken." — Šta to znači?',
        options: { type: "quiz", items: ["Moraš da piješ više vode.", "Trebalo bi da piješ više vode.", "Smeš da piješ više vode.", "Hoćeš da piješ više vode."] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: 'Der Arzt sagt: "Sie ___ jeden Tag 30 Minuten spazieren gehen."',
        options: { type: "quiz", items: ["dürfen", "wollen", "sollen", "müssen"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: "Ich ___ heute nicht kommen, ich bin krank. ___ du morgen Zeit? (moći, imati)",
        options: { type: "fill_blank", items: ["kann", "Hast", "darf", "Kannst"] },
        correct_answer: "kann, Hast",
        question_type: "fill_blank",
      },
      {
        question: "Wien ist die Hauptstadt von...",
        options: { type: "quiz", items: ["Deutschland", "der Schweiz", "Österreich", "Luxemburg"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: "Možeš li mi pomoći?",
        options: { type: "word_order", items: ["Kannst", "du", "mir", "helfen?"] },
        correct_answer: "Kannst du mir helfen?",
        question_type: "word_order",
      },
    ],
  },
  3: {
    title: "Test Modul 3",
    questions: [
      {
        question: "Spoji delove tela:",
        options: { type: "match_pairs", items: [
          { de: "der Kopf", sr: "glava" },
          { de: "der Arm", sr: "ruka" },
          { de: "das Bein", sr: "noga" },
          { de: "der Bauch", sr: "stomak" },
          { de: "das Auge", sr: "oko" },
          { de: "das Ohr", sr: "uvo" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: 'Beim Arzt. Der Arzt fragt: "Was fehlt Ihnen?"',
        options: { type: "quiz", items: ["Das Brot schmeckt gut.", "Ich arbeite als Krankenschwester.", "Mir tut der Bauch weh.", "Ich bin angestellt."] },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: "___ Bruder ist 10 Jahre alt. (moj) ___ Schwester wohnt in Wien. (moja)",
        options: { type: "fill_blank", items: ["Mein", "Meine", "Sein", "Ihre"] },
        correct_answer: "Mein, Meine",
        question_type: "fill_blank",
      },
      {
        question: '"Das ist Maria. ___ Tasche ist rot."',
        options: { type: "quiz", items: ["Sein", "Meine", "Ihre", "Unser"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: '"Das sind Maria und Tom. ___ Kinder gehen in die Schule."',
        options: { type: "quiz", items: ["Sein", "Unser", "Ihre", "Euer"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: "Lekar pita pacijenta:",
        options: { type: "word_order", items: ["Seit", "wann", "haben", "Sie", "Schmerzen?"] },
        correct_answer: "Seit wann haben Sie Schmerzen?",
        question_type: "word_order",
      },
      {
        question: "Du schreibst eine Anfrage an ein Hotel. Wie beginnst du?",
        options: { type: "quiz", items: ["Hallo, was geht?", "Hey, ich brauche ein Zimmer!", "Sehr geehrte Damen und Herren,", "Lieber Freund,"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: "Sehr geehrte Damen und Herren, ich möchte ein Zimmer ___. (rezervisati) Können Sie mir bitte ___ schicken? (informacije)",
        options: { type: "fill_blank", items: ["reservieren", "Informationen", "buchen", "Preise"] },
        correct_answer: "reservieren, Informationen",
        question_type: "fill_blank",
      },
      {
        question: "Završi formalni pozdrav na kraju mejla: Mit ___ ___",
        options: { type: "fill_blank", items: ["freundlichen", "Grüßen", "lieben", "besten"] },
        correct_answer: "freundlichen, Grüßen",
        question_type: "fill_blank",
      },
      {
        question: "Spoji:",
        options: { type: "match_pairs", items: [
          { de: "der Rücken", sr: "leđa" },
          { de: "die Hand", sr: "šaka" },
          { de: "der Finger", sr: "prst" },
          { de: "das Knie", sr: "koleno" },
          { de: "die Schulter", sr: "rame" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: '"Unsere Wohnung ist sehr groß." — Šta znači unsere?',
        options: { type: "quiz", items: ["njihov", "vaš", "naš", "njen"] },
        correct_answer: "2",
        question_type: "quiz",
      },
    ],
  },
  4: {
    title: "Test Modul 4",
    questions: [
      {
        question: "Am Schalter. Du möchtest eine Fahrkarte kaufen. Was sagst du?",
        options: { type: "quiz", items: ["Ich hätte gern einen Kaffee.", "Ich hätte gern eine Fahrkarte nach München.", "Ich suche den Bahnhof.", "Wann ist das Konzert?"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Ich gebe ___ Frau eine Blume. (toj) Er hilft ___ Kind. (tom)",
        options: { type: "fill_blank", items: ["der", "dem", "die", "das"] },
        correct_answer: "der, dem",
        question_type: "fill_blank",
      },
      {
        question: '"Ich schenke ___ Bruder ein Buch."',
        options: { type: "quiz", items: ["mein", "meinem", "meinen", "meine"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Spoji predloge sa prevodom:",
        options: { type: "match_pairs", items: [
          { de: "vor", sr: "ispred" },
          { de: "hinter", sr: "iza" },
          { de: "neben", sr: "pored" },
          { de: "zwischen", sr: "između" },
          { de: "über", sr: "iznad" },
          { de: "unter", sr: "ispod" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: 'Wo ist die Katze? "Die Katze ist ___ dem Tisch." (mačka je ispod stola)',
        options: { type: "quiz", items: ["auf", "neben", "unter", "hinter"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: "Die Lampe hängt ___ dem Tisch. (iznad) Das Bild ist ___ der Tür. (pored)",
        options: { type: "fill_blank", items: ["über", "neben", "unter", "vor"] },
        correct_answer: "über, neben",
        question_type: "fill_blank",
      },
      {
        question: "Das Buch liegt ___ dem Tisch. (na) Die Katze schläft ___ dem Sofa. (ispod)",
        options: { type: "fill_blank", items: ["auf", "unter", "neben", "hinter"] },
        correct_answer: "auf, unter",
        question_type: "fill_blank",
      },
      {
        question: 'Am Schalter. Der Mann sagt: "Der Zug nach Wien fährt um 14:30 Uhr ab." Was fragt der Kunde danach?',
        options: { type: "quiz", items: ["Wo ist das Hotel?", "Was kostet das Essen?", "Von welchem Gleis fährt er ab?", "Wie heißen Sie?"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: "Kannst du ___ helfen? (meni) Ich gebe ___ das Geld morgen zurück. (tebi)",
        options: { type: "fill_blank", items: ["mir", "dir", "ihm", "ihr"] },
        correct_answer: "mir, dir",
        question_type: "fill_blank",
      },
      {
        question: "Spoji:",
        options: { type: "match_pairs", items: [
          { de: "die Fahrkarte", sr: "karta" },
          { de: "der Schalter", sr: "šalter" },
          { de: "das Gleis", sr: "peron" },
          { de: "die Abfahrt", sr: "polazak" },
          { de: "die Ankunft", sr: "dolazak" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: '"Ich gebe es ___ Lehrerin."',
        options: { type: "quiz", items: ["die", "der", "den", "das"] },
        correct_answer: "1",
        question_type: "quiz",
      },
    ],
  },
  5: {
    title: "Test Modul 5",
    questions: [
      {
        question: "Spoji:",
        options: { type: "match_pairs", items: [
          { de: "die Hose", sr: "pantalone" },
          { de: "das Kleid", sr: "haljina" },
          { de: "der Pullover", sr: "džemper" },
          { de: "die Jacke", sr: "jakna" },
          { de: "der Schuh", sr: "cipela" },
          { de: "der Rock", sr: "suknja" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: 'Im Geschäft. Du suchst ein Geschenk für deine Schwester. Die Verkäuferin fragt: "Was suchen Sie?" Was sagst du?',
        options: { type: "quiz", items: ["Ich suche den Bahnhof.", "Ich suche ein Kleid für meine Schwester.", "Ich möchte eine Fahrkarte.", "Ich brauche einen Arzt."] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Die Jacke gefällt ___. (meni) Ich kaufe sie ___ Schwester. (mojoj)",
        options: { type: "fill_blank", items: ["mir", "meiner", "mich", "meine"] },
        correct_answer: "mir, meiner",
        question_type: "fill_blank",
      },
      {
        question: '"Wie steht ___ das Kleid?" — fragt Anna ihre Freundin.',
        options: { type: "quiz", items: ["ich", "mich", "mir", "mein"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: "Kannst du ___ helfen? (njoj) Ich habe ___ gestern eine Nachricht geschickt. (njemu)",
        options: { type: "fill_blank", items: ["ihr", "ihm", "sie", "ihn"] },
        correct_answer: "ihr, ihm",
        question_type: "fill_blank",
      },
      {
        question: 'Im Geschäft. Die Verkäuferin fragt: "Kann ich ___ helfen?"',
        options: { type: "quiz", items: ["Sie", "Ihnen", "Ihr", "du"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Spoji:",
        options: { type: "match_pairs", items: [
          { de: "mir", sr: "meni" },
          { de: "dir", sr: "tebi" },
          { de: "ihm", sr: "njemu" },
          { de: "ihr", sr: "njoj" },
          { de: "uns", sr: "nama" },
          { de: "ihnen", sr: "njima" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Der Rock ist zu groß. Haben Sie ___ in Größe 36? (njega) Die Schuhe gefallen ___. (nama)",
        options: { type: "fill_blank", items: ["ihn", "uns", "ihm", "mir"] },
        correct_answer: "ihn, uns",
        question_type: "fill_blank",
      },
      {
        question: '"Das T-Shirt passt ___ nicht. Es ist zu klein."',
        options: { type: "quiz", items: ["mich", "ich", "mein", "mir"] },
        correct_answer: "3",
        question_type: "quiz",
      },
      {
        question: "Du bist im Geschäft. Du möchtest die Hose anprobieren. Was sagst du?",
        options: { type: "quiz", items: ["Ich nehme den Rock.", "Das ist zu teuer.", "Kann ich die Hose anprobieren?", "Wo ist der Bahnhof?"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: "Ich schenke ___ ein Buch. (tebi) Er gibt ___ die Blumen. (njoj)",
        options: { type: "fill_blank", items: ["dir", "ihr", "ihm", "mir"] },
        correct_answer: "dir, ihr",
        question_type: "fill_blank",
      },
      {
        question: "Gestern habe ich eine neue Hose ___. (kupiti) Meine Freundin hat ein schönes Kleid ___. (nositi)",
        options: { type: "fill_blank", items: ["gekauft", "getragen", "gemacht", "genommen"] },
        correct_answer: "gekauft, getragen",
        question_type: "fill_blank",
      },
    ],
  },
  6: {
    title: "Test Modul 6",
    questions: [
      {
        question: "Dein Freund hat Geburtstag. Was sagst du?",
        options: { type: "quiz", items: ["Gute Besserung!", "Viel Erfolg!", "Herzlichen Glückwunsch zum Geburtstag!", "Frohe Ostern!"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: "___ arbeitest du? (gde) ___ fährst du im Sommer? (kuda)",
        options: { type: "fill_blank", items: ["Wo", "Wohin", "Woher", "Wann"] },
        correct_answer: "Wo, Wohin",
        question_type: "fill_blank",
      },
      {
        question: '"Ich lerne Deutsch, ___ ich möchte in Wien studieren."',
        options: { type: "quiz", items: ["oder", "und", "aber", "denn"] },
        correct_answer: "3",
        question_type: "quiz",
      },
      {
        question: "Spoji:",
        options: { type: "match_pairs", items: [
          { de: "aber", sr: "ali" },
          { de: "denn", sr: "jer" },
          { de: "und", sr: "i" },
          { de: "sondern", sr: "nego/već" },
          { de: "oder", sr: "ili" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Ich spreche kein Englisch, ___ ich spreche Deutsch. (ali) Er kommt nicht heute, ___ morgen. (nego)",
        options: { type: "fill_blank", items: ["aber", "sondern", "denn", "und"] },
        correct_answer: "aber, sondern",
        question_type: "fill_blank",
      },
      {
        question: 'Was passt? "Er kommt nicht heute, ___ morgen."',
        options: { type: "quiz", items: ["aber", "sondern", "denn", "und"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      {
        question: "Du schreibst eine E-Mail an deinen Lehrer. Wie beginnst du?",
        options: { type: "quiz", items: ["Hey, was geht?", "Sehr geehrte Damen und Herren,", "Lieber Herr Müller,", "Hallo Alter,"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: "Ich schreibe Ihnen, ___ ich eine Frage habe. (jer) Ich möchte wissen, ___ der Kurs beginnt. (kada)",
        options: { type: "fill_blank", items: ["denn", "wann", "weil", "wie"] },
        correct_answer: "denn, wann",
        question_type: "fill_blank",
      },
      {
        question: "Wie beendest du eine formelle E-Mail?",
        options: { type: "quiz", items: ["Tschüss!", "Bis bald!", "Mit freundlichen Grüßen", "Bussi!"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: 'Welche Frage passt zur Antwort: "Um 8 Uhr."',
        options: { type: "quiz", items: ["Wo ist der Kurs?", "Wie lange dauert der Kurs?", "Wann beginnt der Kurs?", "Warum lernst du Deutsch?"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      {
        question: "Ich möchte Deutsch lernen ___ ich arbeite in Österreich. (i) Der Kurs ist gut, ___ er ist teuer. (ali)",
        options: { type: "fill_blank", items: ["und", "aber", "denn", "oder"] },
        correct_answer: "und, aber",
        question_type: "fill_blank",
      },
    ],
  },
};

const ESSAY_QUESTIONS: Record<number, Question> = {
  3: {
    question: "Du möchtest im Juli nach Wien fahren. Schreibe eine E-Mail an das Hotel und frage nach einem Zimmer. Schreibe: Wann kommst du? Wie lange bleibst du? Was möchtest du wissen? (3-5 Sätze)",
    options: null,
    correct_answer: "",
    question_type: "listen_write",
  },
  6: {
    question: "Du kannst nächste Woche nicht zum Kurs kommen. Schreibe eine E-Mail an deine Sprachschule. Schreibe: Warum kannst du nicht kommen? Wann kommst du wieder? Bitte um Materialien. (4-6 Sätze)",
    options: null,
    correct_answer: "",
    question_type: "listen_write",
  },
};

async function importA12Tests() {
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", "nemacki-a1-2")
    .single();

  if (!course) {
    console.error("A1.2 course not found!");
    return;
  }

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .eq("course_id", course.id)
    .order("order_index");

  if (!lessons) {
    console.error("No lessons found!");
    return;
  }

  console.log(`\nFound ${lessons.length} lessons in A1.2\n`);

  const testLessons: Record<number, { id: string; title: string }> = {};

  for (const lesson of lessons) {
    const match = lesson.title.match(/Test.*Modul\s*(\d)/i) || lesson.title.match(/Modul\s*(\d).*Test/i);
    if (match) {
      const modulNum = parseInt(match[1]);
      testLessons[modulNum] = { id: lesson.id, title: lesson.title };
    }
  }

  console.log("Test lessons found:");
  for (const [mod, lesson] of Object.entries(testLessons)) {
    console.log(`  Modul ${mod}: ${lesson.title} (${lesson.id})`);
  }
  console.log("");

  let totalExercises = 0;
  let totalQuestions = 0;

  for (const [modulStr, testData] of Object.entries(MODULE_TESTS)) {
    const modul = parseInt(modulStr);
    const testLesson = testLessons[modul];

    if (!testLesson) {
      console.log(`  ✗ Modul ${modul}: test lesson not found, skipping`);
      continue;
    }

    const { data: existing } = await supabase
      .from("exercises")
      .select("id")
      .eq("lesson_id", testLesson.id)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`  ⊘ Modul ${modul}: already has exercises, skipping`);
      continue;
    }

    const { data: exercise, error } = await supabase
      .from("exercises")
      .insert({
        lesson_id: testLesson.id,
        title: testData.title,
        exercise_type: "quiz",
        order_index: 0,
      })
      .select("id")
      .single();

    if (error || !exercise) {
      console.error(`  ✗ Modul ${modul}:`, error?.message);
      continue;
    }

    for (let i = 0; i < testData.questions.length; i++) {
      const q = testData.questions[i];
      await supabase.from("exercise_questions").insert({
        exercise_id: exercise.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation || null,
        order_index: i,
      });
      totalQuestions++;
    }

    totalExercises++;
    console.log(`  ✓ Modul ${modul}: ${testData.questions.length} pitanja`);

    if (ESSAY_QUESTIONS[modul]) {
      const essayQ = ESSAY_QUESTIONS[modul];

      const { data: essayExercise } = await supabase
        .from("exercises")
        .insert({
          lesson_id: testLesson.id,
          title: `Esej — Modul ${modul}`,
          exercise_type: "listen_write",
          order_index: 1,
        })
        .select("id")
        .single();

      if (essayExercise) {
        await supabase.from("exercise_questions").insert({
          exercise_id: essayExercise.id,
          question: essayQ.question,
          options: essayQ.options,
          correct_answer: essayQ.correct_answer,
          order_index: 0,
        });
        totalExercises++;
        totalQuestions++;
        console.log(`  ✓ Modul ${modul}: esej dodat`);
      }
    }
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  Vežbi kreirano: ${totalExercises}`);
  console.log(`  Pitanja ukupno: ${totalQuestions}`);
  console.log(`═══════════════════════════════════════\n`);
}

importA12Tests().catch(console.error);
