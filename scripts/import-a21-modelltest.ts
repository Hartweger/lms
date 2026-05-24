/**
 * Import A2.1 Modelltest (final exam) + certificate trigger
 * Run: npx tsx scripts/import-a21-modelltest.ts
 *
 * Creates a "Modelltest" lesson at the end of A2.1 course.
 * When student scores >= 60%, certificate is automatically generated.
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
  console.log("Creating A2.1 Modelltest...\n");

  // 1. Find course
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", "nemacki-a2-1")
    .single();

  if (!course) { console.error("Course not found"); return; }

  // 2. Check if Modelltest lesson already exists
  const { data: existing } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", course.id)
    .like("title", "%Modelltest%");

  if (existing && existing.length > 0) {
    console.log("Modelltest lesson already exists, skipping lesson creation.");
    console.log("Lesson ID:", existing[0].id);
    return;
  }

  // 3. Get max order_index
  const { data: lessons } = await supabase
    .from("lessons")
    .select("order_index")
    .eq("course_id", course.id)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextOrder = (lessons?.[0]?.order_index ?? 24) + 1;

  // 4. Create Modelltest lesson
  const { data: lesson, error: lessonErr } = await supabase
    .from("lessons")
    .insert({
      course_id: course.id,
      title: "Modelltest A2.1",
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
          content: "Ovo je **zavrsni test za nivo A2.1**. Test pokriva sve teme iz kursa: licne podatke, porodicu, perfekt, weil recenice, stanovanje, smece, Wechselprapositionen, hranu, restoran, posao, refleksivne glagole, modalne glagole i skolu.\n\nZa prolaz je potrebno minimum **60%**. Ako polozis, dobijas **sertifikat**!",
        },
        {
          type: "text",
          style: "uebung",
          content: "**Saveti:**\n- Procitaj svako pitanje pazljivo\n- Imas neogranicen broj pokusaja\n- Koristi se najbolji rezultat\n- Posle testa videces rezultat i eventualno link ka sertifikatu",
        },
      ],
    })
    .select("id")
    .single();

  if (lessonErr || !lesson) {
    console.error("Failed to create lesson:", lessonErr?.message);
    return;
  }
  console.log(`Created lesson: Modelltest A2.1 (order ${nextOrder})\n`);

  // 5. Create exercise
  const { data: exercise, error: exErr } = await supabase
    .from("exercises")
    .insert({
      lesson_id: lesson.id,
      title: "Zavrsni ispit A2.1",
      exercise_type: "quiz",
      order_index: 0,
    })
    .select("id")
    .single();

  if (exErr || !exercise) {
    console.error("Failed to create exercise:", exErr?.message);
    return;
  }

  // 6. Create questions (25 questions covering all modules)
  const questions = [
    // --- MODUL 1: Licni podaci, Familie, Perfekt, Weil ---
    {
      question: "______ Sprachen sprechen Sie?",
      options: { type: "quiz", items: ["Wie", "Welche", "Was", "Wo"] },
      correct_answer: "1",
    },
    {
      question: "Maria und Tom wohnen nicht mehr zusammen. Sie leben ______.",
      options: { type: "quiz", items: ["verheiratet", "ledig", "getrennt", "geschieden"] },
      correct_answer: "2",
    },
    {
      question: "Der Bruder meiner Mutter ist mein ______.",
      options: { type: "quiz", items: ["Neffe", "Cousin", "Onkel", "Schwager"] },
      correct_answer: "2",
    },
    {
      question: "Wir haben ein Fest ______.",
      options: { type: "quiz", items: ["gefeiern", "feiern", "gefeiert", "feiert"] },
      correct_answer: "2",
      explanation: "Perfekt: ge + feier + t = gefeiert",
    },
    {
      question: "Ich bin nach Spanien ______. (reisen)",
      options: { type: "quiz", items: ["gereisen", "gereist", "reiste", "reisen"] },
      correct_answer: "1",
      explanation: "reisen = glagol kretanja → Perfekt sa sein: bin gereist",
    },
    {
      question: "Ich gehe nicht zur Arbeit, weil ich krank ______.",
      options: { type: "quiz", items: ["bin", "ist", "bist", "war"] },
      correct_answer: "0",
      explanation: "Posle weil glagol ide na kraj: ...weil ich krank bin.",
    },
    // --- MODUL 2: Wohnen, Mull, Wechselprapositionen ---
    {
      question: "Ein Haus mit mehreren Wohnungen ist ein ______.",
      options: { type: "quiz", items: ["Einfamilienhaus", "Reihenhaus", "Mehrfamilienhaus", "Appartement"] },
      correct_answer: "2",
    },
    {
      question: "Plastik und Verpackungen kommen in die ______ Tonne.",
      options: { type: "quiz", items: ["blaue", "gelbe", "braune", "schwarze"] },
      correct_answer: "1",
    },
    {
      question: "Das Bild hangt an ______ Wand. (Wo?)",
      options: { type: "quiz", items: ["die", "der", "dem", "den"] },
      correct_answer: "1",
      explanation: "Wo? = Dativ. die Wand → der Wand",
    },
    {
      question: "Ich stelle den Tisch in ______ Mitte. (Wohin?)",
      options: { type: "quiz", items: ["der", "die", "dem", "den"] },
      correct_answer: "1",
      explanation: "Wohin? = Akkusativ. die Mitte → die Mitte (zenski rod ostaje isti)",
    },
    // --- MODUL 3: Essen, Restaurant, Kommunikation ---
    {
      question: "'Es ist mir Wurst' znaci:",
      options: { type: "quiz", items: ["Volim virsle", "Svejedno mi je", "Gladan sam", "Imam problema"] },
      correct_answer: "1",
    },
    {
      question: "Ich ______ gern ein Bier, bitte. (naruciivanje)",
      options: { type: "quiz", items: ["hatte", "habe", "bin", "wurde"] },
      correct_answer: "0",
      explanation: "Ich hatte gern... = Zeleo/la bih... (ucitiv nacin naruciivanja)",
    },
    {
      question: "Hat es Ihnen ______?",
      options: { type: "quiz", items: ["geschmeckt", "gefallen", "gepasst", "gegeben"] },
      correct_answer: "0",
      explanation: "Konobar pita posle jela: Hat es Ihnen geschmeckt?",
    },
    {
      question: "Bring bitte den Mull ______!",
      options: { type: "quiz", items: ["rein", "raus", "runter", "rauf"] },
      correct_answer: "2",
      explanation: "runterbringen = sneti dole. Bring den Mull runter!",
    },
    // --- MODUL 4: Posao, Bewerbungen, Arbeitszeit ---
    {
      question: "Ein guter Chef ______ respektvoll sein.",
      options: { type: "quiz", items: ["soll", "sollte", "will", "mochte"] },
      correct_answer: "1",
      explanation: "sollte = Konjunktiv II (savet), soll = prezent (naredba)",
    },
    {
      question: "Motivaciono pismo za posao je na nemackom:",
      options: { type: "quiz", items: ["der Lebenslauf", "das Zeugnis", "das Anschreiben", "die Stellenanzeige"] },
      correct_answer: "2",
    },
    {
      question: "Er hat eine Gehaltserhohung bekommen, ______ er hart gearbeitet hat.",
      options: { type: "quiz", items: ["denn", "weil", "dann", "obwohl"] },
      correct_answer: "1",
      explanation: "weil + glagol na kraj: ...weil er hart gearbeitet hat.",
    },
    // --- MODUL 5: Refleksivni, interessieren, Modalni ---
    {
      question: "Du bewegst ______ zu wenig.",
      options: { type: "quiz", items: ["mich", "dich", "sich", "uns"] },
      correct_answer: "1",
      explanation: "du → dich",
    },
    {
      question: "Interessierst du ______ fur Fussball?",
      options: { type: "quiz", items: ["mich", "dich", "sich", "euch"] },
      correct_answer: "1",
    },
    {
      question: "Sie argert sich ______ die Sportnachrichten.",
      options: { type: "quiz", items: ["auf", "fur", "uber", "mit"] },
      correct_answer: "2",
      explanation: "sich argern uber = ljutiti se na",
    },
    {
      question: "Als Kind ______ ich Arzt werden. (wollen - Prateritum)",
      options: { type: "quiz", items: ["wollte", "will", "wolltest", "mochte"] },
      correct_answer: "0",
    },
    {
      question: "Ich ______ jeden Tag viel lernen. (mussen - Prateritum)",
      options: { type: "quiz", items: ["muss", "musste", "gemusst", "musse"] },
      correct_answer: "1",
    },
    // --- MODUL 6: Skola, Ausbildung ---
    {
      question: "Koliko godina traje Schulpflicht u Nemackoj?",
      options: { type: "quiz", items: ["6", "8", "9", "12"] },
      correct_answer: "2",
    },
    {
      question: "Sta je duale Ausbildung?",
      options: { type: "quiz", items: ["Samo skola", "Samo firma", "Skola i firma istovremeno", "Online kurs"] },
      correct_answer: "2",
    },
    {
      question: "Sta je Schultute?",
      options: { type: "quiz", items: ["Skolska torba", "Kesa sa poklonima za 1. skolski dan", "Skolska uniforma", "Rucak u skoli"] },
      correct_answer: "1",
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
    console.log(`Created ${questions.length} questions for Modelltest A2.1`);
    console.log("\nStudents who score >= 60% will automatically receive a certificate!");
  }
}

main().catch(console.error);
