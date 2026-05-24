/**
 * Import A1.1 Modelltest (final exam) + certificate trigger
 * Run: npx tsx scripts/import-a11-modelltest.ts
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

async function main() {
  console.log("Creating A1.1 Modelltest...\n");

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", "nemacki-a1-1")
    .single();

  if (!course) { console.error("Course not found"); return; }

  const { data: existing } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", course.id)
    .like("title", "%Modelltest%");

  if (existing && existing.length > 0) {
    console.log("Modelltest already exists, skipping.");
    return;
  }

  const { data: lessons } = await supabase
    .from("lessons")
    .select("order_index")
    .eq("course_id", course.id)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextOrder = (lessons?.[0]?.order_index ?? 36) + 1;

  const { data: lesson, error: lessonErr } = await supabase
    .from("lessons")
    .insert({
      course_id: course.id,
      title: "Modelltest A1.1",
      lesson_type: "text",
      content: "",
      order_index: nextOrder,
      is_free_preview: false,
      sections: [
        {
          type: "badge",
          module: "Zavrsni ispit",
          category: "grammatik",
        },
        {
          type: "text",
          style: "info",
          content: "Ovo je **zavrsni test za nivo A1.1**. Test pokriva sve teme iz kursa: pozdrave, predstavljanje, porodicu, brojeve, hranu, stan, vreme, akuzativ, perfekt i sve ostalo.\n\nZa prolaz je potrebno minimum **60%**. Ako polozis, dobijas **sertifikat**!",
        },
        {
          type: "text",
          style: "uebung",
          content: "**Saveti:**\n- Procitaj svako pitanje pazljivo\n- Imas neogranicen broj pokusaja\n- Koristi se najbolji rezultat\n- Posle testa videces rezultat i link ka sertifikatu",
        },
      ],
    })
    .select("id")
    .single();

  if (lessonErr || !lesson) {
    console.error("Failed to create lesson:", lessonErr?.message);
    return;
  }
  console.log(`Created lesson: Modelltest A1.1 (order ${nextOrder})\n`);

  const { data: exercise, error: exErr } = await supabase
    .from("exercises")
    .insert({
      lesson_id: lesson.id,
      title: "Zavrsni ispit A1.1",
      exercise_type: "quiz",
      order_index: 0,
    })
    .select("id")
    .single();

  if (exErr || !exercise) {
    console.error("Failed to create exercise:", exErr?.message);
    return;
  }

  // 25 questions covering all 7 modules of A1.1
  const questions = [
    // MODUL 1: Pozdravi, predstavljanje, alfabet
    {
      question: "Kako se kaze 'Dobar dan' na nemackom?",
      options: { type: "quiz", items: ["Guten Morgen", "Guten Tag", "Guten Abend", "Gute Nacht"] },
      correct_answer: "1",
    },
    {
      question: "Wie ______ Sie?",
      options: { type: "quiz", items: ["heißt", "heißen", "heiße", "bist"] },
      correct_answer: "1",
      explanation: "Sie (Vi) + heissen → heissen (formalno obraacanje)",
    },
    {
      question: "Ich ______ aus Serbien.",
      options: { type: "quiz", items: ["komme", "kommst", "kommt", "kommen"] },
      correct_answer: "0",
    },
    // MODUL 2: Familie, Wie gehts, Zahlen, Prezent
    {
      question: "Mein Bruder und meine Schwester sind meine ______.",
      options: { type: "quiz", items: ["Eltern", "Kinder", "Geschwister", "Verwandten"] },
      correct_answer: "2",
    },
    {
      question: "Wie geht es Ihnen? — ______, danke.",
      options: { type: "quiz", items: ["Gut", "Schlecht", "Groß", "Schnell"] },
      correct_answer: "0",
    },
    {
      question: "Er ______ Deutsch. (sprechen)",
      options: { type: "quiz", items: ["spreche", "sprechst", "spricht", "sprechen"] },
      correct_answer: "2",
      explanation: "sprechen: ich spreche, du sprichst, er spricht (promena e→i)",
    },
    // MODUL 3: Essen, Preise, Im Restaurant
    {
      question: "Ich mochte ______ Kaffee, bitte.",
      options: { type: "quiz", items: ["ein", "eine", "einen", "einem"] },
      correct_answer: "2",
      explanation: "der Kaffee → Akkusativ: einen Kaffee",
    },
    {
      question: "Was kostet das? — Das kostet drei Euro ______.",
      options: { type: "quiz", items: ["zwanzig", "funfzig", "dreißig", "zehn"] },
      correct_answer: "1",
      explanation: "3,50€ = drei Euro funfzig",
    },
    // MODUL 4: Wohnung, Mobel
    {
      question: "Wo ist das Sofa? — ______ Wohnzimmer.",
      options: { type: "quiz", items: ["In", "Im", "Auf dem", "An der"] },
      correct_answer: "1",
      explanation: "im = in dem (dativ, muski/srednji rod)",
    },
    {
      question: "Die Wohnung hat drei ______.",
      options: { type: "quiz", items: ["Zimmer", "Zimmers", "Zimmern", "Zimmere"] },
      correct_answer: "0",
      explanation: "das Zimmer, die Zimmer — mnozina je ista",
    },
    // MODUL 5: Razdvojni glagoli, Uhrzeiten, Tagesablauf
    {
      question: "Ich ______ um 7 Uhr ______. (aufstehen)",
      options: { type: "quiz", items: ["stehe ... auf", "aufstehe", "stehe ... an", "auf ... stehe"] },
      correct_answer: "0",
      explanation: "Razdvojni glagol: aufstehen → ich stehe auf",
    },
    {
      question: "Wie spat ist es? 14:30 =",
      options: { type: "quiz", items: ["halb zwei", "halb drei", "viertel nach zwei", "zwei Uhr dreisig"] },
      correct_answer: "1",
      explanation: "14:30 = halb drei (pola sata do tri)",
    },
    {
      question: "Er ______ jeden Tag ______. (einkaufen)",
      options: { type: "quiz", items: ["kauft ... ein", "einkauft", "kaufe ... ein", "kaufen ... ein"] },
      correct_answer: "0",
    },
    // MODUL 6: Wetter, Akuzativ, Freizeit, Ja/Nein/Doch
    {
      question: "Heute ist es kalt und es ______.",
      options: { type: "quiz", items: ["scheint", "schneit", "regnet", "windet"] },
      correct_answer: "2",
    },
    {
      question: "Ich sehe ______ Mann. (der Mann)",
      options: { type: "quiz", items: ["der", "den", "dem", "des"] },
      correct_answer: "1",
      explanation: "sehen + Akkusativ: der → den",
    },
    {
      question: "Hast du keine Geschwister? — ______, ich habe eine Schwester.",
      options: { type: "quiz", items: ["Ja", "Nein", "Doch", "Nicht"] },
      correct_answer: "2",
      explanation: "Doch = odgovor na negativno pitanje: 'Ali da, imam'",
    },
    {
      question: "Was machst du gern in der Freizeit? — Ich ______ gern Fussball.",
      options: { type: "quiz", items: ["spielt", "spielst", "spiele", "spielen"] },
      correct_answer: "2",
    },
    // MODUL 7: Modalni glagoli, Perfekt
    {
      question: "Ich ______ Deutsch lernen. (wollen)",
      options: { type: "quiz", items: ["will", "wollen", "wollt", "willst"] },
      correct_answer: "0",
    },
    {
      question: "______ du mir helfen? (konnen)",
      options: { type: "quiz", items: ["Kann", "Kannst", "Konnen", "Konnt"] },
      correct_answer: "1",
    },
    {
      question: "Ich habe gestern viel ______. (lernen)",
      options: { type: "quiz", items: ["gelernt", "lernt", "gelearnt", "lernen"] },
      correct_answer: "0",
      explanation: "Perfekt: ge + lern + t = gelernt",
    },
    {
      question: "Er ______ nach Berlin ______. (fahren)",
      options: { type: "quiz", items: ["hat ... gefahren", "ist ... gefahren", "hat ... gefahrt", "ist ... gefahrt"] },
      correct_answer: "1",
      explanation: "fahren = glagol kretanja → Perfekt sa sein: ist gefahren",
    },
    {
      question: "Wir haben einen Film ______. (sehen)",
      options: { type: "quiz", items: ["gesehen", "geseht", "seht", "sehen"] },
      correct_answer: "0",
    },
    {
      question: "Sie ______ gestern Abend ins Kino ______. (gehen)",
      options: { type: "quiz", items: ["hat ... gegangen", "ist ... gegangen", "hat ... gegeht", "ist ... gegeht"] },
      correct_answer: "1",
      explanation: "gehen = kretanje → ist gegangen",
    },
    // Mesovita
    {
      question: "Mein Name ______ Maria.",
      options: { type: "quiz", items: ["bin", "ist", "bist", "sind"] },
      correct_answer: "1",
    },
    {
      question: "Wir ______ in Wien. (wohnen)",
      options: { type: "quiz", items: ["wohne", "wohnst", "wohnt", "wohnen"] },
      correct_answer: "3",
    },
  ];

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
    console.error("Failed to create questions:", qErr.message);
  } else {
    console.log(`Created ${questions.length} questions for Modelltest A1.1`);
    console.log("\nStudents who score >= 60% will automatically receive a certificate!");
  }
}

main().catch(console.error);
