/**
 * Import B1.1 module tests (exercises) + essay exercises
 * Run: npx tsx scripts/import-b11-tests.ts
 *
 * Moduli:
 * 1: Präteritum, als/wenn/wann (lekcije 1-4)
 * 2: obwohl, Relativpronomen, Gradpartikeln (lekcije 5-7)
 * 3: Passiv + Modalverben, Genitiv (lekcije 8-12)
 * 4: Konjunktiv II Präsens, höflich nachfragen (lekcije 13-16)
 * 5: Infinitiv mit zu, Bewerbung (lekcije 17-21)
 * 6: um...zu/damit, statt/ohne...zu, temporale Präpositionen (lekcije 22-23)
 * 7: Zweiteilige Konjunktionen, Konj. II Vergangenheit, trotz (lekcije 24-27)
 *
 * Willkommen is at index 0, so all lesson indices are shifted +1.
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
        question: "Er ______ gestern den ganzen Tag zu Hause. (bleiben — Präteritum)",
        options: { type: "quiz", items: ["blieb", "bleibt", "geblieben", "bleibte"] },
        correct_answer: "0",
        explanation: "bleiben → blieb (nepravilan glagol)",
        question_type: "quiz",
      },
      {
        question: "Wir ______ letztes Jahr nach Wien. (fahren — Präteritum)",
        options: { type: "quiz", items: ["fuhren", "fahrten", "gefahren", "fahren"] },
        correct_answer: "0",
        explanation: "fahren → fuhren (nepravilan glagol)",
        question_type: "quiz",
      },
      {
        question: "Sie ______ kein Wort Deutsch. (sprechen — Präteritum)",
        options: { type: "quiz", items: ["sprechte", "sprach", "gesprochen", "spricht"] },
        correct_answer: "1",
        explanation: "sprechen → sprach (nepravilan glagol)",
        question_type: "quiz",
      },
      {
        question: "______ ich klein war, spielte ich jeden Tag draußen.",
        options: { type: "fill_blank", items: ["Als", "Wenn", "Wann", "Ob"] },
        correct_answer: "Als",
        explanation: "Als = jednokratna radnja u prošlosti.",
        question_type: "fill_blank",
      },
      {
        question: "______ es regnete, nahm sie immer einen Regenschirm mit.",
        options: { type: "fill_blank", items: ["Wenn", "Als", "Wann", "Ob"] },
        correct_answer: "Wenn",
        explanation: "Wenn = ponovljena radnja u prošlosti (immer = uvek).",
        question_type: "fill_blank",
      },
      {
        question: "______ hast du Geburtstag?",
        options: { type: "quiz", items: ["Als", "Wenn", "Wann", "Ob"] },
        correct_answer: "2",
        explanation: "Wann = upitna reč za vreme.",
        question_type: "quiz",
      },
      {
        question: "______ ich nach Berlin kam, war alles neu für mich.",
        options: { type: "quiz", items: ["Als", "Wenn", "Wann", "Ob"] },
        correct_answer: "0",
        explanation: "Als = jednokratna radnja u prošlosti.",
        question_type: "quiz",
      },
      {
        question: "Spoji Infinitiv i Präteritum:",
        options: { type: "match_pairs", items: [
          { de: "gehen", sr: "ging" },
          { de: "kommen", sr: "kam" },
          { de: "nehmen", sr: "nahm" },
          { de: "schreiben", sr: "schrieb" },
          { de: "finden", sr: "fand" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Kada sam stigao kući, moja žena je već spavala.",
        options: { type: "word_order", items: ["Als", "ich", "nach", "Hause", "kam,", "schlief", "meine", "Frau", "schon."] },
        correct_answer: "Als ich nach Hause kam, schlief meine Frau schon.",
        question_type: "word_order",
      },
      {
        question: "Ich weiß nicht, ______ der Zug ankommt. — Weißt du, ______ er letzte Woche zu spät kam?",
        options: { type: "quiz", items: ["wann / als", "als / wann", "wenn / als", "wann / wenn"] },
        correct_answer: "0",
        explanation: "wann = indirektno pitanje, als = jednokratna prošlost.",
        question_type: "quiz",
      },
    ],
  },
  2: {
    title: "Test Modul 2",
    questions: [
      {
        question: "Das ist der Mann, ______ mir geholfen hat.",
        options: { type: "quiz", items: ["der", "den", "dem", "dessen"] },
        correct_answer: "0",
        explanation: "Nominativ: der Mann → der (subjekat relativne rečenice).",
        question_type: "quiz",
      },
      {
        question: "Kennst du die Frau, ______ dort steht?",
        options: { type: "quiz", items: ["die", "der", "den", "dem"] },
        correct_answer: "0",
        explanation: "Nominativ: die Frau → die.",
        question_type: "quiz",
      },
      {
        question: "Das ist das Buch, ______ ich dir empfohlen habe.",
        options: { type: "quiz", items: ["das", "dem", "der", "den"] },
        correct_answer: "0",
        explanation: "Akkusativ: das Buch → das.",
        question_type: "quiz",
      },
      {
        question: "Er geht spazieren, ______ es regnet.",
        options: { type: "fill_blank", items: ["obwohl", "weil", "wenn", "damit"] },
        correct_answer: "obwohl",
        explanation: "obwohl = iako (kontrast: ide u šetnju IAKO pada kiša).",
        question_type: "fill_blank",
      },
      {
        question: "Sie bleibt zu Hause, ______ sie krank ist.",
        options: { type: "fill_blank", items: ["weil", "obwohl", "damit", "wenn"] },
        correct_answer: "weil",
        explanation: "weil = zato što (logičan razlog).",
        question_type: "fill_blank",
      },
      {
        question: "Der Film war ______ langweilig. Ich bin fast eingeschlafen.",
        options: { type: "quiz", items: ["echt", "ein bisschen", "nicht so", "kaum"] },
        correct_answer: "0",
        explanation: "echt = zaista (pojačava pridev, pasuje uz 'fast eingeschlafen').",
        question_type: "quiz",
      },
      {
        question: "Die Serie ist ______ spannend, aber nicht perfekt.",
        options: { type: "quiz", items: ["ziemlich", "total", "gar nicht", "überhaupt nicht"] },
        correct_answer: "0",
        explanation: "ziemlich = prilično (pozitivno, ali sa ogradom 'ali nije savršena').",
        question_type: "quiz",
      },
      {
        question: "Spoji filmske žanrove:",
        options: { type: "match_pairs", items: [
          { de: "der Krimi", sr: "krimić" },
          { de: "die Komödie", sr: "komedija" },
          { de: "der Dokumentarfilm", sr: "dokumentarac" },
          { de: "der Zeichentrickfilm", sr: "crtani film" },
          { de: "der Liebesfilm", sr: "ljubavni film" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Iako je umorna, ide na posao.",
        options: { type: "word_order", items: ["Obwohl", "sie", "müde", "ist,", "geht", "sie", "zur", "Arbeit."] },
        correct_answer: "Obwohl sie müde ist, geht sie zur Arbeit.",
        question_type: "word_order",
      },
      {
        question: "Das ist der Kollege, mit ______ ich das Projekt gemacht habe.",
        options: { type: "fill_blank", items: ["dem", "den", "der", "das"] },
        correct_answer: "dem",
        explanation: "mit + Dativ: der Kollege → dem.",
        question_type: "fill_blank",
      },
    ],
  },
  3: {
    title: "Test Modul 3",
    questions: [
      {
        question: "Das ist das Auto ______ Nachbarn.",
        options: { type: "quiz", items: ["des", "dem", "der", "den"] },
        correct_answer: "0",
        explanation: "Genitiv maskulin: der Nachbar → des Nachbarn.",
        question_type: "quiz",
      },
      {
        question: "Die Meinung ______ Ärztin ist wichtig.",
        options: { type: "quiz", items: ["der", "die", "des", "den"] },
        correct_answer: "0",
        explanation: "Genitiv feminin: die Ärztin → der Ärztin.",
        question_type: "quiz",
      },
      {
        question: "Das Problem kann schnell ______ werden. (lösen — Passiv mit Modalverb)",
        options: { type: "fill_blank", items: ["gelöst", "lösen", "gelösen", "lösend"] },
        correct_answer: "gelöst",
        explanation: "Passiv + Modalverb: kann + Partizip II + werden.",
        question_type: "fill_blank",
      },
      {
        question: "Die Patienten müssen regelmäßig ______ werden. (untersuchen — Passiv mit Modalverb)",
        options: { type: "fill_blank", items: ["untersucht", "untersuchen", "geuntersucht", "untersuchend"] },
        correct_answer: "untersucht",
        explanation: "Passiv + Modalverb: müssen + Partizip II + werden.",
        question_type: "fill_blank",
      },
      {
        question: "Wegen ______ schlechten Wetters bleiben wir zu Hause.",
        options: { type: "quiz", items: ["des", "dem", "der", "das"] },
        correct_answer: "0",
        explanation: "wegen + Genitiv: das Wetter → des Wetters.",
        question_type: "quiz",
      },
      {
        question: "Wegen ______ Krankheit konnte sie nicht arbeiten.",
        options: { type: "quiz", items: ["einer", "eine", "einem", "ein"] },
        correct_answer: "0",
        explanation: "wegen + Genitiv feminin: eine Krankheit → einer Krankheit.",
        question_type: "quiz",
      },
      {
        question: "Spoji medicinski vokabular:",
        options: { type: "match_pairs", items: [
          { de: "die Sprechstunde", sr: "ordinacija / prijem" },
          { de: "das Rezept", sr: "recept (za lek)" },
          { de: "die Krankenkasse", sr: "zdravstveno osiguranje" },
          { de: "der Blutdruck", sr: "krvni pritisak" },
          { de: "die Überweisung", sr: "uput (za specijalista)" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "In diesem Krankenhaus ______ viele Operationen durchgeführt. (werden — Präsens Passiv)",
        options: { type: "fill_blank", items: ["werden", "wird", "wurde", "wurden"] },
        correct_answer: "werden",
        explanation: "Plural subjekat (Operationen) → werden + Partizip II.",
        question_type: "fill_blank",
      },
      {
        question: "Recept mora biti potpisan od lekara.",
        options: { type: "word_order", items: ["Das", "Rezept", "muss", "vom", "Arzt", "unterschrieben", "werden."] },
        correct_answer: "Das Rezept muss vom Arzt unterschrieben werden.",
        question_type: "word_order",
      },
      {
        question: "Trotz ______ hohen Kosten entschied sie sich für die Behandlung.",
        options: { type: "quiz", items: ["der", "die", "den", "dem"] },
        correct_answer: "0",
        explanation: "trotz + Genitiv: die Kosten (Pl.) → der Kosten.",
        question_type: "quiz",
      },
    ],
  },
  4: {
    title: "Test Modul 4",
    questions: [
      {
        question: "Wenn ich reich ______, würde ich eine Weltreise machen.",
        options: { type: "quiz", items: ["wäre", "hätte", "würde", "bin"] },
        correct_answer: "0",
        explanation: "Konjunktiv II od sein: wäre.",
        question_type: "quiz",
      },
      {
        question: "Ich ______ gern mehr Freizeit.",
        options: { type: "quiz", items: ["hätte", "wäre", "würde", "habe"] },
        correct_answer: "0",
        explanation: "Konjunktiv II od haben: hätte.",
        question_type: "quiz",
      },
      {
        question: "______ Sie mir bitte helfen?",
        options: { type: "quiz", items: ["Könnten", "Können", "Konnten", "Konnte"] },
        correct_answer: "0",
        explanation: "Konjunktiv II od können: könnten (učtiv oblik).",
        question_type: "quiz",
      },
      {
        question: "Wenn ich mehr Zeit ______, ______ ich einen Sprachkurs besuchen.",
        options: { type: "fill_blank", items: ["hätte, würde", "habe, werde", "hatte, wurde", "hätte, werde"] },
        correct_answer: "hätte, würde",
        explanation: "Wenn + Konjunktiv II, Konjunktiv II.",
        question_type: "fill_blank",
      },
      {
        question: "Wenn ich Ärztin ______, ______ ich in Afrika arbeiten.",
        options: { type: "fill_blank", items: ["wäre, würde", "bin, werde", "war, wurde", "wäre, werde"] },
        correct_answer: "wäre, würde",
        explanation: "Wenn + wäre (sein), würde + Infinitiv.",
        question_type: "fill_blank",
      },
      {
        question: "Kako učtivo pitati za put? — Izaberite najučtiviji oblik:",
        options: { type: "quiz", items: [
          "Wo ist der Bahnhof?",
          "Könnten Sie mir sagen, wo der Bahnhof ist?",
          "Sag mir, wo der Bahnhof ist!",
          "Ich will wissen, wo der Bahnhof ist.",
        ] },
        correct_answer: "1",
        explanation: "Könnten Sie mir sagen, ... je najučtiviji oblik.",
        question_type: "quiz",
      },
      {
        question: "Koja rečenica je učtiva molba?",
        options: { type: "quiz", items: [
          "Mach das Fenster zu!",
          "Würden Sie bitte das Fenster schließen?",
          "Du musst das Fenster zumachen.",
          "Ich brauche das Fenster zu.",
        ] },
        correct_answer: "1",
        explanation: "Würden Sie bitte... je učtiva forma sa Konjunktiv II.",
        question_type: "quiz",
      },
      {
        question: "Spoji jezike i zemlje:",
        options: { type: "match_pairs", items: [
          { de: "die Muttersprache", sr: "maternji jezik" },
          { de: "die Fremdsprache", sr: "strani jezik" },
          { de: "die Mehrsprachigkeit", sr: "višejezičnost" },
          { de: "der Dialekt", sr: "dijalekt" },
          { de: "die Gebärdensprache", sr: "znakovni jezik" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Da imam više novca, kupio bih novi auto.",
        options: { type: "word_order", items: ["Wenn", "ich", "mehr", "Geld", "hätte,", "würde", "ich", "ein", "neues", "Auto", "kaufen."] },
        correct_answer: "Wenn ich mehr Geld hätte, würde ich ein neues Auto kaufen.",
        question_type: "word_order",
      },
      {
        question: "Wegen ______ Prüfung muss ich viel lernen.",
        options: { type: "fill_blank", items: ["der", "die", "dem", "den"] },
        correct_answer: "der",
        explanation: "wegen + Genitiv: die Prüfung → der Prüfung.",
        question_type: "fill_blank",
      },
    ],
  },
  5: {
    title: "Test Modul 5",
    questions: [
      {
        question: "Ich habe keine Lust, heute Abend ______. (ausgehen)",
        options: { type: "fill_blank", items: ["auszugehen", "zu ausgehen", "ausgehen", "auszusgehen"] },
        correct_answer: "auszugehen",
        explanation: "Razdvojni glagol: aus|gehen → aus-zu-gehen.",
        question_type: "fill_blank",
      },
      {
        question: "Es ist wichtig, regelmäßig Sport ______. (treiben)",
        options: { type: "fill_blank", items: ["zu treiben", "treiben", "zutreiben", "getrieben"] },
        correct_answer: "zu treiben",
        explanation: "Nerazdvojni glagol: zu + Infinitiv.",
        question_type: "fill_blank",
      },
      {
        question: "Er hat vergessen, das Fenster ______. (zumachen)",
        options: { type: "fill_blank", items: ["zuzumachen", "zu zumachen", "zumachen", "zugemacht"] },
        correct_answer: "zuzumachen",
        explanation: "Razdvojni glagol: zu|machen → zu-zu-machen.",
        question_type: "fill_blank",
      },
      {
        question: "Ich versuche, dich morgen ______.",
        options: { type: "quiz", items: ["anzurufen", "zu anrufen", "anrufen", "angerufen"] },
        correct_answer: "0",
        explanation: "an|rufen (razdvojni) → an-zu-rufen.",
        question_type: "quiz",
      },
      {
        question: "Es ist schwer, eine neue Sprache ______.",
        options: { type: "quiz", items: ["zu lernen", "zulernen", "lernen zu", "gelernt"] },
        correct_answer: "0",
        explanation: "lernen (nerazdvojni) → zu lernen.",
        question_type: "quiz",
      },
      {
        question: "Spoji vokabular za prijavu za posao:",
        options: { type: "match_pairs", items: [
          { de: "die Bewerbungsunterlagen", sr: "dokumenta za prijavu" },
          { de: "das Vorstellungsgespräch", sr: "razgovor za posao" },
          { de: "die Gehaltsvorstellung", sr: "očekivana plata" },
          { de: "die Berufserfahrung", sr: "radno iskustvo" },
          { de: "die Fortbildung", sr: "stručno usavršavanje" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Spoji vokabular za prezentaciju:",
        options: { type: "match_pairs", items: [
          { de: "die Folie", sr: "slajd" },
          { de: "die Gliederung", sr: "struktura / sadržaj" },
          { de: "das Handout", sr: "materijal za učesnike" },
          { de: "der Beamer", sr: "projektor" },
          { de: "die Zusammenfassung", sr: "rezime" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "______ der Arbeitszeit darf man nicht privat telefonieren.",
        options: { type: "quiz", items: ["Während", "Außerhalb", "Innerhalb", "Trotz"] },
        correct_answer: "0",
        explanation: "Während = tokom (+ Genitiv).",
        question_type: "quiz",
      },
      {
        question: "Važno je, na vreme doći.",
        options: { type: "word_order", items: ["Es", "ist", "wichtig,", "pünktlich", "zu", "kommen."] },
        correct_answer: "Es ist wichtig, pünktlich zu kommen.",
        question_type: "word_order",
      },
      {
        question: "Koji izraz koristimo za uvod u prezentaciju?",
        options: { type: "quiz", items: [
          "Zum Schluss möchte ich...",
          "In meinem Vortrag geht es um...",
          "Zusammenfassend kann man sagen...",
          "Vielen Dank für Ihre Aufmerksamkeit.",
        ] },
        correct_answer: "1",
        explanation: "In meinem Vortrag geht es um... = uvodna fraza.",
        question_type: "quiz",
      },
    ],
  },
  6: {
    title: "Test Modul 6",
    questions: [
      {
        question: "Ich lerne Deutsch, ______ in Deutschland zu studieren.",
        options: { type: "fill_blank", items: ["um", "damit", "weil", "für"] },
        correct_answer: "um",
        explanation: "um...zu = isti subjekat (ich...ich).",
        question_type: "fill_blank",
      },
      {
        question: "Er spricht langsam, ______ alle ihn verstehen.",
        options: { type: "fill_blank", items: ["damit", "um", "weil", "obwohl"] },
        correct_answer: "damit",
        explanation: "damit = različiti subjekti (er...alle).",
        question_type: "fill_blank",
      },
      {
        question: "______ zu lernen, sieht er den ganzen Tag fern.",
        options: { type: "quiz", items: ["Statt", "Ohne", "Um", "Damit"] },
        correct_answer: "0",
        explanation: "statt...zu = umesto da (uči, gleda TV).",
        question_type: "quiz",
      },
      {
        question: "Er ging aus dem Haus, ______ sich zu verabschieden.",
        options: { type: "quiz", items: ["ohne", "statt", "um", "damit"] },
        correct_answer: "0",
        explanation: "ohne...zu = bez toga da (izašao bez pozdrava).",
        question_type: "quiz",
      },
      {
        question: "______ der Sommerferien verreisen viele Deutsche.",
        options: { type: "fill_blank", items: ["Während", "Innerhalb", "Außerhalb", "Trotz"] },
        correct_answer: "Während",
        explanation: "Während + Genitiv = tokom.",
        question_type: "fill_blank",
      },
      {
        question: "Der Antrag muss ______ einer Woche eingereicht werden.",
        options: { type: "fill_blank", items: ["innerhalb", "während", "außerhalb", "wegen"] },
        correct_answer: "innerhalb",
        explanation: "innerhalb + Genitiv = u roku od.",
        question_type: "fill_blank",
      },
      {
        question: "In Berlin ______ es viele Museen.",
        options: { type: "quiz", items: ["gibt", "ist", "sind", "hat"] },
        correct_answer: "0",
        explanation: "es gibt + Akkusativ = ima (postoji).",
        question_type: "quiz",
      },
      {
        question: "______ lohnt sich, diese Ausstellung zu besuchen.",
        options: { type: "quiz", items: ["Es", "Das", "Er", "Man"] },
        correct_answer: "0",
        explanation: "Es lohnt sich = vredi, isplati se.",
        question_type: "quiz",
      },
      {
        question: "Da bih naučio nemački, idem na kurs.",
        options: { type: "word_order", items: ["Um", "Deutsch", "zu", "lernen,", "gehe", "ich", "in", "einen", "Kurs."] },
        correct_answer: "Um Deutsch zu lernen, gehe ich in einen Kurs.",
        question_type: "word_order",
      },
      {
        question: "Spoji vokabular za usluge:",
        options: { type: "match_pairs", items: [
          { de: "die Dienstleistung", sr: "usluga" },
          { de: "die Beratung", sr: "savetovanje" },
          { de: "die Reklamation", sr: "reklamacija" },
          { de: "der Kundenservice", sr: "korisnički servis" },
          { de: "die Zufriedenheit", sr: "zadovoljstvo" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
    ],
  },
  7: {
    title: "Test Modul 7",
    questions: [
      {
        question: "Er spricht ______ Deutsch ______ Englisch.",
        options: { type: "quiz", items: [
          "sowohl ... als auch",
          "weder ... noch",
          "entweder ... oder",
          "nicht nur ... sondern auch",
        ] },
        correct_answer: "0",
        explanation: "sowohl...als auch = i...i (govori oba jezika).",
        question_type: "quiz",
      },
      {
        question: "Sie trinkt ______ Kaffee ______ Tee. Sie trinkt nur Wasser.",
        options: { type: "quiz", items: [
          "weder ... noch",
          "sowohl ... als auch",
          "entweder ... oder",
          "nicht nur ... sondern auch",
        ] },
        correct_answer: "0",
        explanation: "weder...noch = ni...ni.",
        question_type: "quiz",
      },
      {
        question: "Wenn ich das gewusst ______, ______ ich dir geholfen.",
        options: { type: "fill_blank", items: ["hätte, hätte", "habe, habe", "hatte, hatte", "hätte, wäre"] },
        correct_answer: "hätte, hätte",
        explanation: "Konjunktiv II Vergangenheit: hätte + gewusst, hätte + geholfen.",
        question_type: "fill_blank",
      },
      {
        question: "Wenn ich früher aufgestanden ______, ______ ich den Zug nicht verpasst.",
        options: { type: "fill_blank", items: ["wäre, hätte", "hätte, wäre", "bin, habe", "war, hatte"] },
        correct_answer: "0",
        explanation: "wäre aufgestanden (kretanje → sein), hätte verpasst (prelazni → haben).",
        question_type: "fill_blank",
      },
      {
        question: "______ des Regens gehen wir spazieren.",
        options: { type: "quiz", items: ["Trotz", "Wegen", "Während", "Statt"] },
        correct_answer: "0",
        explanation: "trotz + Genitiv = uprkos.",
        question_type: "quiz",
      },
      {
        question: "______ der vielen Arbeit nimmt er sich Zeit für Sport.",
        options: { type: "quiz", items: ["Trotz", "Wegen", "Während", "Ohne"] },
        correct_answer: "0",
        explanation: "trotz + Genitiv = uprkos (mnogo posla, ali ipak vežba).",
        question_type: "quiz",
      },
      {
        question: "Spoji vokabular za stanovanje:",
        options: { type: "match_pairs", items: [
          { de: "die WG (Wohngemeinschaft)", sr: "zajedničko stanovanje" },
          { de: "der Mitbewohner", sr: "cimer" },
          { de: "die Kaution", sr: "depozit" },
          { de: "die Nebenkosten", sr: "režijski troškovi" },
          { de: "der Mietvertrag", sr: "ugovor o zakupu" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      {
        question: "Ona ne samo da lepo peva, nego i svira klavir.",
        options: { type: "word_order", items: ["Sie", "singt", "nicht", "nur", "schön,", "sondern", "spielt", "auch", "Klavier."] },
        correct_answer: "Sie singt nicht nur schön, sondern spielt auch Klavier.",
        question_type: "word_order",
      },
      {
        question: "Du musst dich entscheiden: ______ kommst du mit ______ du bleibst hier.",
        options: { type: "fill_blank", items: ["entweder, oder", "sowohl, als auch", "weder, noch", "nicht nur, sondern auch"] },
        correct_answer: "entweder, oder",
        explanation: "entweder...oder = ili...ili.",
        question_type: "fill_blank",
      },
      {
        question: "Wenn er mehr gelernt hätte, ______ er die Prüfung bestanden.",
        options: { type: "quiz", items: ["hätte", "wäre", "würde", "hat"] },
        correct_answer: "0",
        explanation: "Konjunktiv II Vergangenheit: hätte + bestanden (prelazni glagol → haben).",
        question_type: "quiz",
      },
    ],
  },
};

// ─── Essay exercises ──────────────────────────────────────────

interface EssayDef {
  lessonIndex: number;
  title: string;
  question: string;
  orderIndex: number;
}

const ESSAYS: EssayDef[] = [
  {
    lessonIndex: 4,
    title: "Schreiben B1 — E-Mail",
    orderIndex: 1,
    question:
      "Ihr Freund Carsten liegt im Krankenhaus, weil er sich bei einem Unfall das rechte Bein gebrochen hat. Sie haben ihn gestern besucht und schreiben einem Freund / einer Freundin, der/die Carsten auch kennt.\n\n- Beschreiben Sie: Wie geht es Carsten?\n- Begründen Sie: Was braucht er in seiner Situation?\n- Machen Sie einen Vorschlag für einen gemeinsamen Besuch.\n\nSchreiben Sie eine E-Mail (ca. 80 Wörter).",
  },
  {
    lessonIndex: 12,
    title: "Schreiben B1 — Pflegekrise",
    orderIndex: 1,
    question:
      "In vielen Ländern wird diskutiert, ob alte Menschen in einem Altersheim oder zu Hause gepflegt werden sollten.\n\n- Nennen Sie Vor- und Nachteile beider Möglichkeiten.\n- Schreiben Sie, wie die Situation in Ihrem Heimatland ist.\n- Sagen Sie Ihre Meinung und begründen Sie diese.\n\nSchreiben Sie einen Text (ca. 80 Wörter).",
  },
  {
    lessonIndex: 27,
    title: "Schreiben B1 — Hotel Mama",
    orderIndex: 1,
    question:
      'Immer mehr junge Erwachsene wohnen lange bei ihren Eltern. In einer Online-Diskussion lesen Sie folgende Meinung:\n\n\u201EEs ist besser, so fr\u00FCh wie m\u00F6glich von zu Hause auszuziehen.\u201C\n\n- Schreiben Sie Ihre Meinung dazu.\n- Nennen Sie Vorteile und Nachteile, wenn man bei den Eltern wohnt.\n- Berichten Sie von einer Erfahrung aus Ihrem Land.\n\nSchreiben Sie einen Text (ca. 80 W\u00F6rter).',
  },
];

// ─── Import logic ─────────────────────────────────────────────

const moduleToLessonIndex: Record<number, number> = {
  1: 4,
  2: 7,
  3: 12,
  4: 16,
  5: 21,
  6: 23,
  7: 27,
};

async function main() {
  console.log("Importing B1.1 module tests...\n");

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

  // ─── Module tests ──────────────────────────────────────────

  for (const [moduleNum, testData] of Object.entries(MODULE_TESTS)) {
    const lessonIndex = moduleToLessonIndex[Number(moduleNum)];
    const lesson = lessons.find((l) => l.order_index === lessonIndex);

    if (!lesson) {
      console.log(`  SKIP: Module ${moduleNum} — lesson not found at index ${lessonIndex}`);
      continue;
    }

    const { data: existing } = await supabase
      .from("exercises")
      .select("id")
      .eq("lesson_id", lesson.id)
      .eq("title", testData.title);

    if (existing && existing.length > 0) {
      console.log(`  SKIP: ${testData.title} — already exists on "${lesson.title}"`);
      continue;
    }

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

  // ─── Essay exercises ──────────────────────────────────────────

  console.log("\nImporting essay exercises...\n");

  for (const essay of ESSAYS) {
    const lesson = lessons.find((l) => l.order_index === essay.lessonIndex);

    if (!lesson) {
      console.log(`  SKIP: Essay "${essay.title}" — lesson not found at index ${essay.lessonIndex}`);
      continue;
    }

    const { data: existing } = await supabase
      .from("exercises")
      .select("id")
      .eq("lesson_id", lesson.id)
      .eq("title", essay.title);

    if (existing && existing.length > 0) {
      console.log(`  SKIP: ${essay.title} — already exists on "${lesson.title}"`);
      continue;
    }

    const { data: exercise, error: exErr } = await supabase
      .from("exercises")
      .insert({
        lesson_id: lesson.id,
        title: essay.title,
        exercise_type: "typing",
        order_index: essay.orderIndex,
      })
      .select("id")
      .single();

    if (exErr || !exercise) {
      console.error(`  ERROR: ${essay.title}: ${exErr?.message}`);
      continue;
    }

    const { error: qErr } = await supabase
      .from("exercise_questions")
      .insert({
        exercise_id: exercise.id,
        question: essay.question,
        options: { type: "essay", level: "B1" },
        correct_answer: "",
        order_index: 0,
      });

    if (qErr) {
      console.error(`  ERROR question: ${essay.title}: ${qErr.message}`);
    } else {
      console.log(`  OK: ${essay.title} → "${lesson.title}"`);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
