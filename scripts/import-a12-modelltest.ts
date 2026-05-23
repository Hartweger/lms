/**
 * Import A1.2 Modelltest — Završni ispit A1
 * Creates lesson + 3 exercises (Lesen, Hören, Schreiben)
 * Run: npx tsx scripts/import-a12-modelltest.ts
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

async function importModelltest() {
  // Find A1.2 course
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", "nemacki-a1-2")
    .single();

  if (!course) {
    console.error("A1.2 course not found!");
    return;
  }

  // Check if lesson already exists
  const { data: existing } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", course.id)
    .ilike("title", "%Modelltest%")
    .limit(1);

  if (existing && existing.length > 0) {
    console.log("Modelltest lesson already exists, skipping creation");
    return;
  }

  // Get max order_index
  const { data: lastLesson } = await supabase
    .from("lessons")
    .select("order_index")
    .eq("course_id", course.id)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (lastLesson?.order_index ?? 30) + 1;

  // Create lesson with sections
  const sections = [
    {
      type: "badge",
      module: "Ispit",
      category: "lesen",
    },
    {
      type: "text",
      style: "info",
      content: "Ovo je **simulacija Goethe ispita A1** (Start Deutsch 1). Ispit ima tri dela: Lesen, Hören i Schreiben. Uradi sve delove redom.",
    },
    {
      type: "text",
      style: "default",
      content: "## Kako funkcioniše\n\n1. **Lesen** — Pročitaj tekstove i odgovori na pitanja (25 min)\n2. **Hören** — Posušaj audio ispod, pa odgovori na pitanja (20 min)\n3. **Schreiben** — Popuni formular + napiši mejl (20 min)\n\nNa pravom ispitu treba **60 od 100 poena** za prolaz.",
    },
    {
      type: "text",
      style: "default",
      content: "## Audio za Hören deo\n\nPosušaj ceo audio pre nego što počneš Hören vežbu:",
    },
    {
      type: "text",
      style: "default",
      content: '<audio controls style="width:100%"><source src="/audio/modelltest-a1.mp4" type="audio/mp4">Tvoj pretraživač ne podržava audio.</audio>',
    },
  ];

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .insert({
      course_id: course.id,
      title: "Završni ispit A1 — Modelltest",
      lesson_type: "text",
      content: "",
      order_index: nextOrder,
      is_free_preview: false,
      sections,
    })
    .select("id")
    .single();

  if (lessonError || !lesson) {
    console.error("Failed to create lesson:", lessonError?.message);
    return;
  }

  console.log(`✓ Lesson created: Završni ispit A1 — Modelltest (order: ${nextOrder})`);

  // ═══════════════════════════════════════════════════
  // EXERCISE 1: LESEN (15 pitanja)
  // ═══════════════════════════════════════════════════

  const { data: lesenEx } = await supabase
    .from("exercises")
    .insert({
      lesson_id: lesson.id,
      title: "Lesen",
      exercise_type: "quiz",
      order_index: 0,
    })
    .select("id")
    .single();

  if (!lesenEx) {
    console.error("Failed to create Lesen exercise");
    return;
  }

  const lesenQuestions = [
    // Teil 1 — Zwei Texte, Richtig/Falsch
    // Text 1: Karin's email to Li
    {
      question: "Lies den Text:\n\n\"Hallo Li,\ndanke für deine Mail. Dein Zug kommt hier in Hannover um 12.36 Uhr an. Ich bin ab 12.15 Uhr im Hauptbahnhof und warte auf dich vor der Auskunft.\nDu kannst mich den ganzen Vormittag auf meinem Handy erreichen.\nDeine Karin\"\n\nLis Zug kommt nach halb eins an.",
      options: null,
      correct_answer: "true",
      question_type: "true_false",
    },
    {
      question: "Lies den Text:\n\n\"Hallo Li,\ndanke für deine Mail. Dein Zug kommt hier in Hannover um 12.36 Uhr an. Ich bin ab 12.15 Uhr im Hauptbahnhof und warte auf dich vor der Auskunft.\nDu kannst mich den ganzen Vormittag auf meinem Handy erreichen.\nDeine Karin\"\n\nKarin wartet den ganzen Vormittag vor der Auskunft.",
      options: null,
      correct_answer: "false",
      question_type: "true_false",
    },
    // Text 2: Ralf's invitation to Carmen
    {
      question: "Lies den Text:\n\n\"Liebe Carmen,\nam kommenden Sonntag habe ich Geburtstag. Ich möchte gerne mit dir feiern und lade dich herzlich zu meiner Party am Samstagabend ein. Wir fangen um 21 Uhr an. Es werden viele Leute da sein, die du auch kennst. Kannst du vielleicht einen Salat mitbringen? Und vergiss bitte nicht einen Pullover oder eine Jacke! Wir wollen nämlich draußen im Garten feiern.\nBis zum Wochenende, Ralf\"\n\nRalf hatte am letzten Wochenende Geburtstag.",
      options: null,
      correct_answer: "false",
      question_type: "true_false",
    },
    {
      question: "Lies den Text:\n\n\"Liebe Carmen,\nam kommenden Sonntag habe ich Geburtstag. Ich möchte gerne mit dir feiern und lade dich herzlich zu meiner Party am Samstagabend ein. Wir fangen um 21 Uhr an. Es werden viele Leute da sein, die du auch kennst. Kannst du vielleicht einen Salat mitbringen? Und vergiss bitte nicht einen Pullover oder eine Jacke! Wir wollen nämlich draußen im Garten feiern.\nBis zum Wochenende, Ralf\"\n\nRalf hat nur zwei oder drei Leute eingeladen.",
      options: null,
      correct_answer: "false",
      question_type: "true_false",
    },
    {
      question: "Lies den Text:\n\n\"Liebe Carmen,\nam kommenden Sonntag habe ich Geburtstag. Ich möchte gerne mit dir feiern und lade dich herzlich zu meiner Party am Samstagabend ein. Wir fangen um 21 Uhr an. Es werden viele Leute da sein, die du auch kennst. Kannst du vielleicht einen Salat mitbringen? Und vergiss bitte nicht einen Pullover oder eine Jacke! Wir wollen nämlich draußen im Garten feiern.\nBis zum Wochenende, Ralf\"\n\nDie Party findet draußen statt.",
      options: null,
      correct_answer: "true",
      question_type: "true_false",
    },
    // Teil 2 — Websites, a oder b
    {
      question: "Sie möchten mit dem Schiff auf dem Rhein fahren. Welche Webseite passt?\n\na) schiff-ruedesheim.de - Hotel-Pension Schiff, Einzel- und Doppelzimmer, Restaurant mit Rhein-Terrasse\nb) bingen-ruedesheimer.de - Bingen-Rüdesheimer Rheinschiffe, täglich von Rüdesheim nach Koblenz, Abfahrtszeiten und Preise",
      options: { type: "quiz", items: ["schiff-ruedesheim.de", "bingen-ruedesheimer.de"] },
      correct_answer: "1",
      question_type: "quiz",
    },
    {
      question: "Sie möchten Deutsch in Deutschland lernen. Welche Webseite passt?\n\na) sprachenfuchs.de — Sprachinstitut Fuchs, Dresden, Deutsch · Englisch · Französisch · Russisch\nb) eviva.com — Eviva-Idiomas, Sprachkurse für Deutsche, Spanisch auf Mallorca, Englisch auf Malta",
      options: { type: "quiz", items: ["sprachenfuchs.de", "eviva.com"] },
      correct_answer: "0",
      question_type: "quiz",
    },
    {
      question: "Sie möchten ein Zugticket im Internet kaufen. Welche Webseite passt?\n\na) DER.com — Deutsches Reisebüro, Ticketbestellungen für Flüge, Deutsche Bahn, Eurobus\nb) RED.com — Reisedienst GmbH, Ticketservice für Theater, Konzerte, Busreisen",
      options: { type: "quiz", items: ["DER.com", "RED.com"] },
      correct_answer: "0",
      question_type: "quiz",
    },
    {
      question: "Sie möchten Informationen über den Bodensee. Welche Webseite passt?\n\na) bodensee.de — Touristeninformation Bodensee, Urlaubsorte, Ferienwohnungen, Hotelservice, Rundreisen\nb) rottenmeier.de — Hans Rottenmeier, Ferienwohnungen am Bodensee, Häuser, Preise, Kontakt",
      options: { type: "quiz", items: ["bodensee.de", "rottenmeier.de"] },
      correct_answer: "0",
      question_type: "quiz",
    },
    {
      question: "Sie sind in Wiesbaden und möchten mit dem Zug am Mittag in Hamburg sein. Welcher Fahrplan passt?\n\na) ab Hamburg 12:18, an Wiesbaden 16:52\nb) ab Wiesbaden 08:09, an Hamburg 12:40",
      options: { type: "quiz", items: ["ab Hamburg 12:18 → an Wiesbaden 16:52", "ab Wiesbaden 08:09 → an Hamburg 12:40"] },
      correct_answer: "1",
      question_type: "quiz",
    },
    // Teil 3 — Schilder/Hinweise, Richtig/Falsch
    {
      question: "In der Sprachschule:\n\"In der 10-Uhr-Pause bekommen Sie an der Rezeption ein Frühstückspaket: Belegte Brötchen und Getränke für 2 Euro.\"\n\nIn der Sprachschule können Sie etwas zu essen kaufen.",
      options: null,
      correct_answer: "true",
      question_type: "true_false",
    },
    {
      question: "An der Post:\n\"Öffnungszeiten: montags–freitags 8.00–12.00 und 13.00–18.00, samstags 8.00–12.00\"\n\nEs ist Samstagnachmittag. Sie können auf der Post Briefmarken kaufen.",
      options: null,
      correct_answer: "false",
      question_type: "true_false",
    },
    {
      question: "Am Bahnhof:\n\"Auf dem gesamten Bahnhof ist das Rauchen verboten.\"\n\nSie können hier Zigaretten rauchen.",
      options: null,
      correct_answer: "false",
      question_type: "true_false",
    },
    {
      question: "Eingang Restaurant:\n\"Heute im Bavaria: Bayerischer Abend — Brezeln, Weißwürste, Sauerkraut, Volksmusik, ab 20 Uhr Tanz\"\n\nHeute Abend können Sie in diesem Restaurant tanzen.",
      options: null,
      correct_answer: "true",
      question_type: "true_false",
    },
    {
      question: "An der Haltestelle:\n\"In der Neujahrsnacht Busverkehr bis 23.00 Uhr und von 1.00 Uhr bis 5.00 Uhr alle 30 Minuten\"\n\nVon 23 Uhr bis 1 Uhr fährt kein Bus.",
      options: null,
      correct_answer: "true",
      question_type: "true_false",
    },
  ];

  for (let i = 0; i < lesenQuestions.length; i++) {
    const q = lesenQuestions[i];
    await supabase.from("exercise_questions").insert({
      exercise_id: lesenEx.id,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: null,
      order_index: i,
    });
  }
  console.log(`✓ Lesen: ${lesenQuestions.length} pitanja`);

  // ═══════════════════════════════════════════════════
  // EXERCISE 2: HÖREN (15 pitanja)
  // ═══════════════════════════════════════════════════

  const { data: hoerenEx } = await supabase
    .from("exercises")
    .insert({
      lesson_id: lesson.id,
      title: "Hören",
      exercise_type: "quiz",
      order_index: 1,
    })
    .select("id")
    .single();

  if (!hoerenEx) {
    console.error("Failed to create Hören exercise");
    return;
  }

  const hoerenQuestions = [
    // Teil 1 — Was ist richtig? a, b oder c
    {
      question: "Was kostet der Pullover?",
      options: { type: "quiz", items: ["Dreißig Euro.", "Fünfundneunzig Euro.", "Neunzehn Euro fünfundneunzig Cent."] },
      correct_answer: "2",
      question_type: "quiz",
    },
    {
      question: "Wie spät ist es?",
      options: { type: "quiz", items: ["15 Uhr.", "Gleich 5 Uhr.", "Halb 5 Uhr."] },
      correct_answer: "1",
      question_type: "quiz",
    },
    {
      question: "Was isst die Frau im Restaurant?",
      options: { type: "quiz", items: ["Pommes.", "Fisch.", "Wurst."] },
      correct_answer: "0",
      question_type: "quiz",
    },
    {
      question: "In welche Klasse geht Frau Hegers Sohn?",
      options: { type: "quiz", items: ["In die neunte Klasse.", "In die dritte Klasse.", "In die vierte Klasse."] },
      correct_answer: "1",
      question_type: "quiz",
    },
    {
      question: "Wie kommt die Frau in den 2. Stock?",
      options: { type: "quiz", items: ["Mit dem Aufzug.", "Auf der Treppe um die Ecke.", "Mit der Rolltreppe."] },
      correct_answer: "0",
      question_type: "quiz",
    },
    {
      question: "Wohin fährt Herr Albers?",
      options: { type: "quiz", items: ["In Urlaub ans Meer.", "Zur Arbeit.", "Zur Familie."] },
      correct_answer: "2",
      question_type: "quiz",
    },
    // Teil 2 — Richtig oder Falsch
    {
      question: "Die Kunden sollen die Weihnachtsfeier besuchen.",
      options: null,
      correct_answer: "false",
      question_type: "true_false",
    },
    {
      question: "Die Fahrgäste sollen sich im Restaurant treffen.",
      options: null,
      correct_answer: "false",
      question_type: "true_false",
    },
    {
      question: "Die Fahrgäste sollen im Zug bleiben.",
      options: null,
      correct_answer: "true",
      question_type: "true_false",
    },
    {
      question: "Der Herr soll sofort zum Schalter kommen.",
      options: null,
      correct_answer: "true",
      question_type: "true_false",
    },
    // Teil 3 — Was ist richtig? a, b oder c
    {
      question: "Die Nummer ist:",
      options: { type: "quiz", items: ["11833.", "11883.", "12833."] },
      correct_answer: "0",
      question_type: "quiz",
    },
    {
      question: "Wo genau treffen sich die Männer?",
      options: { type: "quiz", items: ["Am Zug.", "Am Bahnhof.", "An der Information."] },
      correct_answer: "2",
      question_type: "quiz",
    },
    {
      question: "Wie lange will der Mann noch warten?",
      options: { type: "quiz", items: ["20 Minuten.", "2 Minuten.", "10 Minuten."] },
      correct_answer: "2",
      question_type: "quiz",
    },
    {
      question: "An welchem Tag will die Frau kommen?",
      options: { type: "quiz", items: ["Am Montag.", "Am Sonntag.", "Am Samstag."] },
      correct_answer: "1",
      question_type: "quiz",
    },
    {
      question: "Was ist kaputt?",
      options: { type: "quiz", items: ["Der Fernseher.", "Der Computer.", "Das Handy."] },
      correct_answer: "1",
      question_type: "quiz",
    },
  ];

  for (let i = 0; i < hoerenQuestions.length; i++) {
    const q = hoerenQuestions[i];
    await supabase.from("exercise_questions").insert({
      exercise_id: hoerenEx.id,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: null,
      order_index: i,
    });
  }
  console.log(`✓ Hören: ${hoerenQuestions.length} pitanja`);

  // ═══════════════════════════════════════════════════
  // EXERCISE 3: SCHREIBEN — Fill blank (formular) + Esej
  // ═══════════════════════════════════════════════════

  // 3a: Schreiben Teil 1 — Formular (fill_blank)
  const { data: schreibenFormEx } = await supabase
    .from("exercises")
    .insert({
      lesson_id: lesson.id,
      title: "Schreiben — Teil 1: Formular",
      exercise_type: "quiz",
      order_index: 2,
    })
    .select("id")
    .single();

  if (!schreibenFormEx) {
    console.error("Failed to create Schreiben formular exercise");
    return;
  }

  const formularIntro = "Ihre Freundin Eva Kadavy macht mit ihrem Mann und ihren beiden Söhnen (8 und 11 Jahre alt) Urlaub in Seeheim. Im Reisebüro bucht sie eine Busfahrt um den Bodensee am nächsten Sonntag. Frau Kadavy hat keine Kreditkarte.\n\nFülle die fehlenden Informationen aus:";

  const formQuestions = [
    {
      question: formularIntro + "\n\nAnzahl der Personen: ___",
      options: { type: "fill_blank", items: ["4", "2", "3", "5"] },
      correct_answer: "4",
      question_type: "fill_blank",
    },
    {
      question: formularIntro + "\n\nDavon Kinder: ___",
      options: { type: "fill_blank", items: ["2", "1", "3", "4"] },
      correct_answer: "2",
      question_type: "fill_blank",
    },
    {
      question: formularIntro + "\n\nPLZ, Urlaubsort: 78014 ___",
      options: { type: "fill_blank", items: ["Seeheim", "Dresden", "München", "Bodensee"] },
      correct_answer: "Seeheim",
      question_type: "fill_blank",
    },
    {
      question: formularIntro + "\n\nZahlungsweise: ___ (Frau Kadavy hat keine Kreditkarte)",
      options: { type: "fill_blank", items: ["Bar", "Kreditkarte", "Überweisung", "PayPal"] },
      correct_answer: "Bar",
      question_type: "fill_blank",
    },
    {
      question: formularIntro + "\n\nReisetermin: ___",
      options: { type: "fill_blank", items: ["Sonntag", "Samstag", "Montag", "Freitag"] },
      correct_answer: "Sonntag",
      question_type: "fill_blank",
    },
  ];

  for (let i = 0; i < formQuestions.length; i++) {
    const q = formQuestions[i];
    await supabase.from("exercise_questions").insert({
      exercise_id: schreibenFormEx.id,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: null,
      order_index: i,
    });
  }
  console.log(`✓ Schreiben Teil 1 (Formular): ${formQuestions.length} pitanja`);

  // 3b: Schreiben Teil 2 — Esej (professor review)
  const { data: schreibenEssayEx } = await supabase
    .from("exercises")
    .insert({
      lesson_id: lesson.id,
      title: "Schreiben — Teil 2: E-Mail",
      exercise_type: "listen_write",
      order_index: 3,
    })
    .select("id")
    .single();

  if (!schreibenEssayEx) {
    console.error("Failed to create Schreiben essay exercise");
    return;
  }

  await supabase.from("exercise_questions").insert({
    exercise_id: schreibenEssayEx.id,
    question: "Sie möchten im August Dresden besuchen. Schreiben Sie an die Touristeninformation:\n\n– Warum schreiben Sie?\n– Informationen über Film, Museen usw. (Kulturprogramm)?\n– Hoteladressen?\n\nSchreiben Sie zu jedem Punkt ein bis zwei Sätze (circa 30 Wörter). Schreiben Sie auch eine Anrede und einen Gruß.",
    options: null,
    correct_answer: "",
    order_index: 0,
  });
  console.log(`✓ Schreiben Teil 2 (Esej): 1 pitanje`);

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  Lekcija: Završni ispit A1 — Modelltest`);
  console.log(`  Lesen: 15 pitanja`);
  console.log(`  Hören: 15 pitanja`);
  console.log(`  Schreiben: 5 fill_blank + 1 esej`);
  console.log(`  Ukupno: 36 pitanja`);
  console.log(`═══════════════════════════════════════\n`);
}

importModelltest().catch(console.error);
