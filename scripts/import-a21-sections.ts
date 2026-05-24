/**
 * Import A2.1 lesson sections (rich content)
 * Run: npx tsx scripts/import-a21-sections.ts
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

const COURSE_SLUG = "nemacki-a2-1";

// ─── Section data for each lesson (by order_index) ───

const LESSON_SECTIONS: Record<number, { sections: unknown[] }> = {
  // ────────────────────────────────────────────────────────────────
  // Lekcija 0: Persönliche Angaben (video: 829225792)
  // ────────────────────────────────────────────────────────────────
  0: {
    sections: [
      {
        type: "badge",
        module: "Modul 1",
        category: "wortschatz",
      },
      {
        type: "video",
        vimeoId: "829225792",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji ponavljaš kako da se **predstaviš** na nemačkom, vežbaš **W-Fragen** i učiš reči vezane za **lične podatke** (Familienstand, Adresse, Beruf).",
      },
      {
        type: "text",
        style: "default",
        content: "## W-Fragen — upitne reči\n\nPoveži upitnu reč sa pitanjem:",
      },
      {
        type: "table",
        headers: ["Upitna reč", "Pitanje"],
        rows: [
          ["<mark>Wie</mark>", "geht es Ihnen?"],
          ["<mark>Wo</mark>", "wohnen Sie?"],
          ["<mark>Mit wem</mark>", "leben Sie zusammen?"],
          ["<mark>Woher</mark>", "kommen Sie?"],
          ["<mark>Was</mark>", "sind Sie von Beruf?"],
          ["<mark>Wie</mark>", "ist Ihre Adresse?"],
          ["<mark>Welche</mark>", "Sprachen sprechen Sie?"],
          ["<mark>Warum</mark>", "lernen Sie Deutsch?"],
          ["<mark>Wer</mark>", "ist Ihr Deutschlehrer?"],
          ["<mark>Wann</mark>", "machen Sie die A2-Prüfung?"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Familienstand — bračni status",
      },
      {
        type: "table",
        headers: ["Nemački", "Srpski"],
        rows: [
          ["<mark>ledig</mark>", "neoženjen / neudata"],
          ["<mark>verheiratet</mark>", "oženjen / udata"],
          ["<mark>getrennt</mark>", "razdvojeni (žive odvojeno)"],
          ["<mark>geschieden</mark>", "razveden/a"],
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — Familienstand",
        items: [
          {
            question:
              "Meine Hochzeit war letzte Woche. Jetzt bin ich __________.",
            answer: "verheiratet",
          },
          {
            question:
              "Robert heiratet nächste Woche. Heute ist er noch __________.",
            answer: "ledig",
          },
          {
            question:
              "Maria und Tom wohnen nicht mehr zusammen. Sie leben __________.",
            answer: "getrennt",
          },
          {
            question:
              "Die Ehe von Juan und Gabi war nicht glücklich. Heute sind sie __________.",
            answer: "geschieden",
          },
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Lični podaci — Lückentext\n\nPročitaj tekst i popuni prazna mesta:",
      },
      {
        type: "spoiler",
        title: "Lückentext — sich vorstellen",
        items: [
          {
            question:
              "Mein ______ ist Jesus Suarez. Jesus ist mein ______ und Suarez mein ______.",
            answer: "Name, Vorname, Familienname",
          },
          {
            question:
              "Ich bin in Spanien ______ und lebe jetzt in Deutschland.",
            answer: "geboren",
          },
          {
            question:
              "In Spanien habe ich eine ______ zum Mechaniker gemacht.",
            answer: "Ausbildung",
          },
          {
            question:
              "Leider kann ich hier in meinem ______ nicht arbeiten.",
            answer: "Beruf",
          },
          {
            question:
              "Meine ______ ist Uhlandstraße 12, die ______ ist 60316.",
            answer: "Adresse, Postleitzahl",
          },
          {
            question:
              "Sie können mich unter 069-45 88 31 ______, die ______ von Deutschland ist 0049.",
            answer: "erreichen, Vorwahl",
          },
          {
            question: "Ich bin ______. Wir haben keine ______.",
            answer: "verheiratet, Kinder",
          },
          {
            question: "Ich habe eine Schwester und einen ______.",
            answer: "Bruder",
          },
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "## Goethe-Zertifikat A2 — Sprechen Teil 1\n\nNa ispitu A2 dobijaš kartice sa temom i moraš da odgovoriš. Vežbaj sa ovim pitanjima:",
      },
      {
        type: "flashcard",
        items: [
          { front: "Geschwister?", back: "Ich habe einen Bruder / eine Schwester / keine Geschwister." },
          { front: "Kinder?", back: "Ich habe ein Kind / zwei Kinder / keine Kinder." },
          { front: "Eltern?", back: "Meine Eltern leben in... / Mein Vater ist... / Meine Mutter arbeitet als..." },
          { front: "Warum Deutsch lernen?", back: "Ich lerne Deutsch, weil ich in Deutschland leben / arbeiten / studieren möchte." },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["der Name", "ime"],
          ["der Vorname", "ime (lično)"],
          ["der Familienname", "prezime"],
          ["die Adresse", "adresa"],
          ["die Postleitzahl (PLZ)", "poštanski broj"],
          ["die Vorwahl", "pozivni broj"],
          ["die Ausbildung", "obrazovanje / obuka"],
          ["der Beruf", "zanimanje"],
          ["geboren", "rođen/a"],
          ["erreichen", "dostupan / kontaktirati"],
          ["ledig", "neoženjen / neudata"],
          ["verheiratet", "oženjen / udata"],
          ["getrennt", "razdvojeni"],
          ["geschieden", "razveden/a"],
          ["die Geschwister", "braća i sestre"],
          ["die E-Mail", "imejl"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 1: Familie (video: 830849014)
  // ────────────────────────────────────────────────────────────────
  1: {
    sections: [
      {
        type: "badge",
        module: "Modul 1",
        category: "wortschatz",
      },
      {
        type: "video",
        vimeoId: "830849014",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji učiš reči za **članove porodice**, vežbaš kako da opišeš svoju porodicu i čitaš tekst o porodičnim oblicima u Nemačkoj.",
      },
      {
        type: "text",
        style: "default",
        content: "## Članovi porodice — muški i ženski oblik",
      },
      {
        type: "table",
        headers: ["Muški oblik", "Ženski oblik"],
        rows: [
          ["<mark>der Vater</mark>", "<mark>die Mutter</mark>"],
          ["<mark>der Großvater / der Opa</mark>", "<mark>die Großmutter / die Oma</mark>"],
          ["<mark>der Onkel</mark>", "<mark>die Tante</mark>"],
          ["<mark>der Sohn</mark>", "<mark>die Tochter</mark>"],
          ["<mark>der Bruder</mark>", "<mark>die Schwester</mark>"],
          ["<mark>der Cousin</mark>", "<mark>die Cousine</mark>"],
          ["<mark>der Enkel</mark>", "<mark>die Enkelin</mark>"],
          ["<mark>der Schwager</mark>", "<mark>die Schwägerin</mark>"],
          ["<mark>der Neffe</mark>", "<mark>die Nichte</mark>"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Dodatne reči za porodicu",
      },
      {
        type: "table",
        headers: ["Nemački", "Srpski"],
        rows: [
          ["<mark>alleinerziehend</mark>", "samohrani roditelj"],
          ["<mark>die Rentnerin / der Rentner</mark>", "penzioner/ka"],
          ["<mark>gestorben</mark>", "preminuo/la"],
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — pojmovi",
        items: [
          {
            question: "Sie erzieht ihr Kind allein. Sie ist __________.",
            answer: "alleinerziehend",
          },
          {
            question: "Sie ist 70 und arbeitet nicht mehr. Sie ist __________.",
            answer: "Rentnerin",
          },
          {
            question: "Sie lebt nicht mehr. Sie ist leider __________.",
            answer: "gestorben",
          },
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Lückentext — Familienfoto\n\nPopuni prazna mesta rečima iz ponuđene liste:\n\n*Familienfeste, Familie, Schwester, Cousins, Mann, Großeltern, Cousinen*",
      },
      {
        type: "spoiler",
        title: "Lückentext — Meine Familie",
        items: [
          {
            question: "Das sind meine (1) ______. Sie sind da noch sehr jung und ziemlich sportlich.",
            answer: "Eltern",
          },
          {
            question: "Neben mir steht meine große (2) ______ Frieda mit ihrem (3) ______.",
            answer: "Schwester, Mann",
          },
          {
            question: "Meine (4) ______, das heißt die Eltern meiner Mutter, stehen hinten links.",
            answer: "Großeltern",
          },
          {
            question: "Meine (5) ______ und (6) ______ sind leider nicht auf dem Foto.",
            answer: "Cousins, Cousinen",
          },
          {
            question: "Wir feiern alle (7) ______ zusammen... mit der ganzen (8) ______.",
            answer: "Familienfeste, Familie",
          },
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Konverzacija — Verwandtschaft\n\nOdgovori na ova pitanja:",
      },
      {
        type: "spoiler",
        title: "Pitanja za razgovor",
        items: [
          { question: "Haben Sie Geschwister? Wie viele, wie alt sind sie?", answer: "Odgovori slobodno o svojoj porodici." },
          { question: "In welchen Ländern haben Sie Verwandte?", answer: "Npr. Meine Verwandten leben in..." },
          { question: "Gibt es in Ihrer Familie regelmäßig ein Familienfest?", answer: "Npr. Ja, wir feiern immer zusammen..." },
          { question: "Was ist besser: eine große Familie oder eine kleine Familie?", answer: "Npr. Ich finde eine große Familie besser, weil..." },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "der Vater", back: "otac" },
          { front: "die Mutter", back: "majka" },
          { front: "der Bruder", back: "brat" },
          { front: "die Schwester", back: "sestra" },
          { front: "der Onkel", back: "ujak / stric / teča" },
          { front: "die Tante", back: "tetka / ujna / strina" },
          { front: "der Neffe", back: "bratanac / sestrić" },
          { front: "die Nichte", back: "bratanica / sestričina" },
          { front: "der Schwager", back: "šurak / dever / zet" },
          { front: "die Schwägerin", back: "snajka / zaova / svastika" },
          { front: "der Enkel", back: "unuk" },
          { front: "die Enkelin", back: "unuka" },
          { front: "alleinerziehend", back: "samohrani roditelj" },
          { front: "die Verwandten", back: "rođaci" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Eltern", "roditelji"],
          ["die Geschwister", "braća i sestre"],
          ["die Großeltern", "baba i deda"],
          ["die Verwandten", "rođaci"],
          ["der Schwager", "šurak / dever / zet"],
          ["die Schwägerin", "snajka / zaova"],
          ["der Neffe", "bratanac / sestrić"],
          ["die Nichte", "bratanica / sestričina"],
          ["alleinerziehend", "samohrani roditelj"],
          ["der Rentner / die Rentnerin", "penzioner/ka"],
          ["gestorben", "preminuo/la"],
          ["das Familienfest", "porodična proslava"],
          ["die Hochzeit", "venčanje"],
          ["die Verlobung", "veridba"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 2: Perfekt (video: 830949139)
  // ────────────────────────────────────────────────────────────────
  2: {
    sections: [
      {
        type: "badge",
        module: "Modul 1",
        category: "grammatik",
      },
      {
        type: "video",
        vimeoId: "830949139",
      },
      {
        type: "text",
        style: "info",
        content:
          "Ponavljanje i proširenje **Perfekta** — naučićeš kako se gradi perfekt pravilnih i nepravilnih glagola i kada koristimo **haben**, a kada **sein**.",
      },
      {
        type: "text",
        style: "default",
        content: "## Pravilni glagoli (regelmäßige Verben)\n\nPravilo za građenje participa:\n1. Sklonimo **-en**\n2. Ispred dodamo **ge-**\n3. Na kraj stavimo **-t**",
      },
      {
        type: "formula",
        content: "hören → ge|hör|t\nmachen → ge|mach|t\nlernen → ge|lern|t\nkaufen → ge|kauf|t\nkochen → ge|koch|t",
      },
      {
        type: "table",
        headers: ["Rečenica", "Prevod"],
        rows: [
          ["Ich <strong>habe</strong> Musik <strong>gehört</strong>.", "Slušala sam muziku."],
          ["Ich <strong>habe</strong> Hausaufgaben <strong>gemacht</strong>.", "Radila sam domaći."],
          ["Ich <strong>habe</strong> meinen Kuli <strong>gesucht</strong>.", "Tražila sam hemijsku."],
          ["Ich <strong>habe</strong> Tennis <strong>gespielt</strong>.", "Igrala sam tenis."],
          ["Die Lehrerin <strong>hat</strong> das <strong>gesagt</strong>.", "Profesorka je to rekla."],
          ["Ich <strong>habe</strong> gestern Deutsch <strong>gelernt</strong>.", "Juče sam učila nemački."],
        ],
      },
      {
        type: "text",
        style: "uebung",
        content: "**Izuzeci kod pravilnih glagola:**\n\n- Glagoli na **-ieren** nemaju ge-: telefonieren → **telefoniert**, fotografieren → **fotografiert**\n- Glagoli čija osnova se završava na **-t, -d, -gn** dodaju **-et**: arbeiten → **gearbeitet**, baden → **gebadet**, regnen → **geregnet**",
      },
      {
        type: "text",
        style: "default",
        content: "## Nepravilni glagoli (unregelmäßige Verben)\n\nNepravilni glagoli menjaju vokal i završavaju se na **-en**. Uče se napamet!",
      },
      {
        type: "table",
        headers: ["Promena", "Primeri"],
        rows: [
          ["i → u", "trinken → ge<strong>trunk</strong>en, finden → ge<strong>fund</strong>en, singen → ge<strong>sung</strong>en"],
          ["e → o", "treffen → ge<strong>troff</strong>en, sprechen → ge<strong>sproch</strong>en"],
          ["ei → ie", "schreiben → ge<strong>schrieb</strong>en, bleiben → ge<strong>blieb</strong>en"],
          ["bez promene", "lesen → ge<strong>les</strong>en, gegessen, gegeben, geschlafen, gesehen"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Perfekt sa SEIN\n\nGlagoli **kretanja** i **promene stanja** grade perfekt sa **sein**:",
      },
      {
        type: "formula",
        content: "Ich bin nach Spanien gereist. (Putovala sam u Španiju.)\nIch bin nach Belgrad gefahren. (Isla sam kolima za Beograd.)\nIch bin nach Berlin geflogen. (Letala sam za Berlin.)\nIch bin nach Hause gegangen. (Otišla sam kući.)\nIch bin um 6 Uhr aufgestanden. (Ustala sam u 6 sati.)\nIch bin um 6 Uhr eingeschlafen. (Zaspala sam u 6 sati.)",
      },
      {
        type: "text",
        style: "uebung",
        content: "**Izuzeci:** passieren (desiti se) i bleiben (ostati) — takođe sa **sein**!\n\n*Was ist passiert?* (Šta se desilo?)\n*Ich bin bis 6 Uhr geblieben.* (Ostala sam do 6 sati.)",
      },
      {
        type: "spoiler",
        title: "Mini vežba — Perfekt",
        items: [
          { question: "Wann hat der Film ______ ? (beginnen)", answer: "begonnen" },
          { question: "Ich habe meine Freundin in Dresden ______. (besuchen)", answer: "besucht" },
          { question: "Das habe ich nicht ______. (verstehen)", answer: "verstanden" },
          { question: "Ich habe den Zug ______. (verpassen)", answer: "verpasst" },
          { question: "Prevedi: Šta je to značilo?", answer: "Was hat das bedeutet?" },
          { question: "Prevedi: Da li si ti platio račun?", answer: "Hast du die Rechnung bezahlt?" },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "trinken", back: "hat getrunken (piti)" },
          { front: "finden", back: "hat gefunden (naći)" },
          { front: "lesen", back: "hat gelesen (čitati)" },
          { front: "essen", back: "hat gegessen (jesti)" },
          { front: "schreiben", back: "hat geschrieben (pisati)" },
          { front: "sprechen", back: "hat gesprochen (govoriti)" },
          { front: "treffen", back: "hat getroffen (sresti)" },
          { front: "fahren", back: "ist gefahren (voziti)" },
          { front: "gehen", back: "ist gegangen (ići)" },
          { front: "kommen", back: "ist gekommen (doći)" },
          { front: "fliegen", back: "ist geflogen (leteti)" },
          { front: "bleiben", back: "ist geblieben (ostati)" },
          { front: "aufstehen", back: "ist aufgestanden (ustati)" },
          { front: "einschlafen", back: "ist eingeschlafen (zaspati)" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["der Perfekt", "perfekt (prošlo vreme)"],
          ["regelmäßig", "pravilan"],
          ["unregelmäßig", "nepravilan"],
          ["das Hilfsverb", "pomoćni glagol"],
          ["das Partizip II", "particip perfekta"],
          ["die Bewegung", "kretanje"],
          ["die Veränderung", "promena stanja"],
          ["die Ausnahme", "izuzetak"],
          ["bedeuten", "značiti"],
          ["verpassen", "propustiti"],
          ["verstehen", "razumeti"],
          ["passieren", "desiti se"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 3: Weil Sätze (video: 831004087)
  // ────────────────────────────────────────────────────────────────
  3: {
    sections: [
      {
        type: "badge",
        module: "Modul 1",
        category: "grammatik",
      },
      {
        type: "video",
        vimeoId: "831004087",
      },
      {
        type: "text",
        style: "info",
        content:
          "Naučićeš kako da koristiš **weil** i **denn** za obrazloženje. Oba znače *jer/zato što*, ali imaju **različit red reči**!",
      },
      {
        type: "text",
        style: "default",
        content: "## denn — jer, zato što\n\nPosle **denn** — normalan red reči (glagol na drugom mestu):",
      },
      {
        type: "formula",
        content: "Ich gehe nicht zur Arbeit, denn ich bin krank.\nIch esse kein Fleisch, denn ich bin Vegetarier.\nIch esse oft Äpfel, denn sie sind gesund.",
      },
      {
        type: "text",
        style: "default",
        content: "## weil — jer, zato što\n\nPosle **weil** — glagol ide **na kraj** rečenice:",
      },
      {
        type: "formula",
        content: "Ich gehe nicht zur Arbeit, weil ich krank bin.\nIch esse kein Fleisch, weil ich Vegetarier bin.\nIch esse oft Äpfel, weil sie gesund sind.",
      },
      {
        type: "mistakes",
        items: [
          { wrong: "Ich gehe nicht zur Arbeit, weil ich bin krank.", correct: "Ich gehe nicht zur Arbeit, weil ich krank bin.", explanation: "Posle weil glagol ide na kraj!" },
          { wrong: "Ich esse kein Fleisch, denn ich Vegetarier bin.", correct: "Ich esse kein Fleisch, denn ich bin Vegetarier.", explanation: "Posle denn normalan red reči." },
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Pitanja za weil rečenice\n\nNa ova pitanja odgovaramo sa weil:",
      },
      {
        type: "table",
        headers: ["Pitanje", "Prevod"],
        rows: [
          ["<mark>Warum?</mark>", "Zašto?"],
          ["<mark>Weswegen?</mark>", "Zbog čega?"],
          ["<mark>Wieso?</mark>", "Kako to? / Zašto?"],
          ["<mark>Aus welchem Grund?</mark>", "Iz kog razloga?"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## weil + Perfekt\n\nKada koristimo perfekt u weil rečenici, **pomoćni glagol** (haben/sein) ide na sam kraj:",
      },
      {
        type: "formula",
        content: "Ich bin nicht in die Schule gegangen, weil ich meine Hausaufgaben nicht gemacht habe.\nIch habe mein Zimmer aufgeräumt, weil meine Eltern zu Besuch gekommen sind.",
      },
      {
        type: "text",
        style: "default",
        content: "## weil + Modalverben\n\nKada koristimo modalni glagol u weil rečenici, **modalni glagol** ide na kraj:",
      },
      {
        type: "formula",
        content: "Ich habe keinen Hund, weil man viel putzen muss.\nEr liegt nicht im Bett, weil er zum Arzt gehen muss.",
      },
      {
        type: "text",
        style: "default",
        content: "## weil + razdvojni glagoli\n\nRazdvojni glagoli u weil rečenici ostaju **spojeni**:",
      },
      {
        type: "formula",
        content: "Peter ist müde, weil er früh aufsteht.\n(NE: ...weil er früh steht auf.)",
      },
      {
        type: "text",
        style: "default",
        content: "## Warum lernst du Deutsch?",
      },
      {
        type: "table",
        headers: ["Rečenica", "Glagol na kraju"],
        rows: [
          ["Ich lerne Deutsch, weil ich in Deutschland studieren <strong>will</strong>.", "will"],
          ["Ich lerne Deutsch, weil Deutschlernen Spaß <strong>macht</strong>.", "macht"],
          ["Ich lerne Deutsch, weil ich bei einer deutschen Firma <strong>arbeite</strong>.", "arbeite"],
          ["Ich lerne Deutsch, weil ich deutsche Literatur toll <strong>finde</strong>.", "finde"],
        ],
      },
      {
        type: "spoiler",
        title: "Vežba — Odgovori na pitanja koristeći weil",
        items: [
          { question: "Warum hast du mich am Samstag nicht besucht?", answer: "Weil ich keine Zeit gehabt habe. / Weil ich arbeiten musste." },
          { question: "Warum hast du von dem Kuchen so wenig gegessen?", answer: "Weil ich keinen Hunger gehabt habe. / Weil ich auf Diät bin." },
          { question: "Warum bist du so schnell gefahren?", answer: "Weil ich spät dran war. / Weil ich es eilig hatte." },
          { question: "Warum bist du nicht zur Party gekommen?", answer: "Weil ich krank war. / Weil ich lernen musste." },
          { question: "Warum hast du den ganzen Abend telefoniert?", answer: "Weil meine Freundin angerufen hat. / Weil ich wichtige Neuigkeiten hatte." },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["weil", "jer, zato što (glagol na kraj)"],
          ["denn", "jer, zato što (normalan red reči)"],
          ["der Grund", "razlog"],
          ["die Ursache", "uzrok"],
          ["warum", "zašto"],
          ["wieso", "kako to / zašto"],
          ["weswegen", "zbog čega"],
          ["aufräumen", "pospremiti"],
          ["putzen", "čistiti"],
          ["der Spaß", "zabava / užitak"],
          ["die Firma", "firma"],
          ["eilig haben", "žuriti se"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 4: Wie wohnen die Deutschen? (video: 834447219)
  // ────────────────────────────────────────────────────────────────
  4: {
    sections: [
      {
        type: "badge",
        module: "Modul 2",
        category: "wortschatz",
      },
      {
        type: "video",
        vimeoId: "834447219",
      },
      {
        type: "text",
        style: "info",
        content:
          "Kako žive Nemci? Učiš reči za **sobe i delove stana**, tipove stanovanja i zanimljive činjenice o životu u Nemačkoj.",
      },
      {
        type: "text",
        style: "default",
        content: "## Sobe u stanu — die Zimmer",
      },
      {
        type: "table",
        headers: ["Nemački", "Srpski"],
        rows: [
          ["<mark>das Schlafzimmer</mark>", "spavaća soba"],
          ["<mark>die Toilette</mark>", "toalet"],
          ["<mark>das Esszimmer</mark>", "trpezarija"],
          ["<mark>die Küche</mark>", "kuhinja"],
          ["<mark>das Kinderzimmer</mark>", "dečja soba"],
          ["<mark>der Balkon</mark>", "balkon"],
          ["<mark>der Flur</mark>", "hodnik"],
          ["<mark>das Wohnzimmer</mark>", "dnevna soba"],
          ["<mark>das Badezimmer / das Bad</mark>", "kupatilo"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Tipovi stanovanja",
      },
      {
        type: "table",
        headers: ["Tip", "Opis"],
        rows: [
          ["<mark>das Einfamilienhaus</mark>", "kuća u kojoj živi jedna porodica"],
          ["<mark>das Ein-Zimmer-Appartement</mark>", "garsonjera — jedno kupatilo i jedna prostorija"],
          ["<mark>das Reihenhaus</mark>", "kuća u nizu — zid uz zid sa susedima"],
          ["<mark>das Mehrfamilienhaus</mark>", "zgrada sa više stanova"],
        ],
      },
      {
        type: "spoiler",
        title: "Richtig oder falsch?",
        items: [
          { question: "1. Im Durchschnitt wohnt in Deutschland eine Person in einem Haushalt.", answer: "Falsch" },
          { question: "2. Eine Person hat durchschnittlich mehr als 40 Quadratmeter zum Wohnen.", answer: "Richtig" },
          { question: "3. Die meisten Deutschen haben ein eigenes Haus.", answer: "Falsch" },
          { question: "4. Die Wohnungen in Deutschland sind sehr unterschiedlich.", answer: "Richtig" },
          { question: "5. Ein gemütliches Wohnzimmer und eine schicke Küche sind für viele Deutsche sehr wichtig.", answer: "Richtig" },
          { question: "6. In München ist es nicht leicht, eine Wohnung zu finden.", answer: "Richtig" },
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Delovi kuće i nameštaj",
      },
      {
        type: "table",
        headers: ["Nemački", "Srpski"],
        rows: [
          ["das Dach", "krov"],
          ["die Garage", "garaža"],
          ["der Garten", "bašta"],
          ["der Keller", "podrum"],
          ["die Treppe", "stepenice"],
          ["der Aufzug", "lift"],
          ["die Mülltonne", "kanta za smeće"],
          ["der Briefkasten", "poštansko sanduče"],
          ["das Bett", "krevet"],
          ["der Schrank", "ormar"],
          ["der Kühlschrank", "frižider"],
          ["die Waschmaschine", "veš mašina"],
          ["der Herd", "šporet"],
          ["die Heizung", "grejanje"],
          ["der Teppich", "tepih"],
          ["der Spiegel", "ogledalo"],
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "das Schlafzimmer", back: "spavaća soba" },
          { front: "das Wohnzimmer", back: "dnevna soba" },
          { front: "die Küche", back: "kuhinja" },
          { front: "das Badezimmer", back: "kupatilo" },
          { front: "der Flur", back: "hodnik" },
          { front: "der Keller", back: "podrum" },
          { front: "das Dach", back: "krov" },
          { front: "die Miete", back: "kirija" },
          { front: "der Vermieter", back: "stanodavac" },
          { front: "der Mieter", back: "stanar" },
          { front: "gemütlich", back: "prijatan, udoban" },
          { front: "das Einfamilienhaus", back: "porodična kuća" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Wohnung", "stan"],
          ["das Haus", "kuća / zgrada"],
          ["die Miete", "kirija"],
          ["der Haushalt", "domaćinstvo"],
          ["der Durchschnitt", "prosek"],
          ["eigen", "svoj, sopstven"],
          ["unterschiedlich", "različit"],
          ["gemütlich", "prijatan, udoban"],
          ["schick", "fensi, moderno"],
          ["gleichzeitig", "istovremeno"],
          ["ähnlich", "sličan"],
          ["die Wand", "zid"],
          ["bauen", "graditi"],
          ["nebeneinander", "jedni pored drugih"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 5: Müll (video: 835381111)
  // ────────────────────────────────────────────────────────────────
  5: {
    sections: [
      {
        type: "badge",
        module: "Modul 2",
        category: "wortschatz",
      },
      {
        type: "video",
        vimeoId: "835381111",
      },
      {
        type: "text",
        style: "info",
        content:
          "Nemci i reciklaža! Naučićeš kako se **sortira smeće** u Nemačkoj, koje kontejnere koriste i šta je to **verpackungsfreier Supermarkt**.",
      },
      {
        type: "text",
        style: "default",
        content: "## Ambalaža — Was ist das?",
      },
      {
        type: "table",
        headers: ["Nemački", "Srpski"],
        rows: [
          ["<mark>das Glas, Gläser</mark>", "tegla / staklo"],
          ["<mark>der Becher, -</mark>", "čaša (plastična)"],
          ["<mark>die Schachtel, -n</mark>", "kutija (kartonska)"],
          ["<mark>die Dose, -n</mark>", "limenka"],
          ["<mark>die Glühbirne, -n</mark>", "sijalica"],
          ["<mark>die Tüte, -n</mark>", "kesa"],
          ["<mark>die Mülltonne, -n</mark>", "kanta za smeće"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Sortiranje smeća u Nemačkoj\n\nU Nemačkoj postoji sistem sortiranja smeća sa različitim kontejnerima:",
      },
      {
        type: "table",
        headers: ["Kontejner", "Šta ide"],
        rows: [
          ["Gelbe Tonne / Gelber Sack", "plastika, ambalaža, limenke"],
          ["Blaue Tonne", "papir i karton"],
          ["Braune / Grüne Tonne", "organski otpad (hrana, biljke)"],
          ["Restmüll (siva/crna)", "sve ostalo"],
          ["Glascontainer", "staklo (razvrstano po bojama)"],
          ["Sondermüll", "baterije, lekovi, hemikalije"],
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "der Müll", back: "smeće" },
          { front: "trennen", back: "razdvajati / sortirati" },
          { front: "die Mülltonne", back: "kanta za smeće" },
          { front: "die Dose", back: "limenka" },
          { front: "die Tüte", back: "kesa" },
          { front: "das Glas", back: "staklo / tegla" },
          { front: "die Schachtel", back: "kutija" },
          { front: "der Becher", back: "čaša (plastična)" },
          { front: "die Glühbirne", back: "sijalica" },
          { front: "recyceln", back: "reciklirati" },
          { front: "die Verpackung", back: "ambalaža" },
          { front: "verpackungsfrei", back: "bez ambalaže" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["der Müll", "smeće"],
          ["trennen", "razdvajati"],
          ["die Mülltonne", "kanta za smeće"],
          ["der Behälter", "kontejner / posuda"],
          ["die Sammelstelle", "sabirno mesto"],
          ["die Verpackung", "ambalaža"],
          ["verpackungsfrei", "bez ambalaže"],
          ["die Dose", "limenka"],
          ["die Tüte", "kesa"],
          ["das Glas", "staklo / tegla"],
          ["die Schachtel", "kutija"],
          ["die Glühbirne", "sijalica"],
          ["der Sondermüll", "opasan otpad"],
          ["die Umwelt", "životna sredina"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 6: Wechselpräpositionen (video: 835432114)
  // ────────────────────────────────────────────────────────────────
  6: {
    sections: [
      {
        type: "badge",
        module: "Modul 2",
        category: "grammatik",
      },
      {
        type: "video",
        vimeoId: "835432114",
      },
      {
        type: "text",
        style: "info",
        content:
          "**Wechselpräpositionen** — 9 predloga koji idu i sa dativom i sa akuzativom. Ključno pitanje: **Wo?** → Dativ, **Wohin?** → Akkusativ.",
      },
      {
        type: "text",
        style: "default",
        content: "## 9 Wechselpräpositionen",
      },
      {
        type: "table",
        headers: ["Predlog", "Prevod"],
        rows: [
          ["<mark>vor</mark>", "ispred"],
          ["<mark>hinter</mark>", "iza"],
          ["<mark>über</mark>", "iznad"],
          ["<mark>unter</mark>", "ispod"],
          ["<mark>an</mark>", "na (vertikalno)"],
          ["<mark>auf</mark>", "na (horizontalno)"],
          ["<mark>in</mark>", "u"],
          ["<mark>zwischen</mark>", "između"],
          ["<mark>neben</mark>", "pored"],
        ],
      },
      {
        type: "formula",
        content: "WO? → Dativ (dem, der, dem, den)\nWOHIN? → Akkusativ (den, die, das, die)",
      },
      {
        type: "text",
        style: "default",
        content: "## Wo? — Dativ (mesto, položaj)",
      },
      {
        type: "table",
        headers: ["Rečenica", "Prevod"],
        rows: [
          ["Das Bild ist zwischen <strong>den</strong> Fenstern.", "Slika je između prozora."],
          ["Die Pflanze ist hinter <strong>dem</strong> Schrank.", "Biljka je iza ormara."],
          ["Die Schlüssel sind unter <strong>der</strong> Zeitung.", "Ključevi su ispod novina."],
          ["Die Zeitung ist in <strong>der</strong> Tasche.", "Novine su u tašni."],
          ["Der Kuli ist auf <strong>dem</strong> Notizblock.", "Hemijska je na svesci."],
          ["Die Maus ist neben <strong>der</strong> Tastatur.", "Miš je pored tastature."],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Wohin? — Akkusativ (kretanje, pravac)",
      },
      {
        type: "table",
        headers: ["Wo? (Dativ)", "Wohin? (Akkusativ)"],
        rows: [
          ["Das Bild hängt <strong>an der</strong> Wand.", "Ich hänge das Bild <strong>an die</strong> Wand."],
          ["Der Tisch steht <strong>in der</strong> Mitte.", "Ich stelle den Tisch <strong>in die</strong> Mitte."],
          ["Die Bücher liegen <strong>auf dem</strong> Tisch.", "Ich lege die Bücher <strong>auf den</strong> Tisch."],
          ["Die Kleidung ist <strong>im</strong> Schrank.", "Ich lege die Kleidung <strong>in den</strong> Schrank."],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Pozicioni glagoli — Wo? vs. Wohin?",
      },
      {
        type: "table",
        headers: ["Wo? (stanje)", "Prevod", "Wohin? (radnja)", "Prevod"],
        rows: [
          ["liegen, gelegen", "ležati", "legen, gelegt", "položiti, staviti"],
          ["stehen, gestanden", "stajati", "stellen, gestellt", "staviti (uspravno)"],
          ["sitzen, gesessen", "sedeti", "setzen, gesetzt", "sedati"],
          ["hängen, gehangen", "visiti", "hängen, gehängt", "kačiti"],
          ["stecken, gesteckt", "biti utaknut", "stecken, gesteckt", "utaknuti"],
        ],
      },
      {
        type: "spoiler",
        title: "Vežba — Was fehlt?",
        items: [
          { question: "Bitte, warten Sie einen Moment vor ____ Tür! (Wo?)", answer: "vor der Tür (Dativ — die Tür → der)" },
          { question: "Kannst du bitte den Stuhl auf ____ Balkon stellen? (Wohin?)", answer: "auf den Balkon (Akkusativ — der Balkon → den)" },
          { question: "Legen Sie bitte den Schlüssel in ____ Briefkasten. (Wohin?)", answer: "in den Briefkasten (Akkusativ — der Briefkasten → den)" },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "vor", back: "ispred" },
          { front: "hinter", back: "iza" },
          { front: "über", back: "iznad" },
          { front: "unter", back: "ispod" },
          { front: "neben", back: "pored" },
          { front: "zwischen", back: "između" },
          { front: "an", back: "na (vertikalno, uz)" },
          { front: "auf", back: "na (horizontalno)" },
          { front: "in", back: "u" },
          { front: "liegen → legen", back: "ležati → položiti" },
          { front: "stehen → stellen", back: "stajati → staviti" },
          { front: "sitzen → setzen", back: "sedeti → sesti" },
          { front: "hängen → hängen", back: "visiti → okačiti" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Wechselpräposition", "predlog koji menja padež"],
          ["der Dativ", "dativ (3. padež)"],
          ["der Akkusativ", "akuzativ (4. padež)"],
          ["liegen", "ležati"],
          ["legen", "staviti (horizontalno)"],
          ["stehen", "stajati"],
          ["stellen", "staviti (vertikalno)"],
          ["hängen", "visiti / kačiti"],
          ["sitzen", "sedeti"],
          ["setzen", "sesti / posaditi"],
          ["stecken", "utaknuti / biti utaknut"],
          ["der Schreibtisch", "radni sto"],
          ["der Notizblock", "beležnica"],
          ["die Tastatur", "tastatura"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 7: Allgemeine Kommunikation (video: 835549391)
  // ────────────────────────────────────────────────────────────────
  7: {
    sections: [
      {
        type: "badge",
        module: "Modul 3",
        category: "hoeren",
      },
      {
        type: "video",
        vimeoId: "835549391",
      },
      {
        type: "text",
        style: "info",
        content:
          "Naučićeš korisne **svakodnevne izraze** — kako da kažeš nekome da uđe, izađe, siđe, popne se... i druge fraze iz svakodnevnog života.",
      },
      {
        type: "text",
        style: "default",
        content: "## Svakodnevni glagoli sa prefiksima",
      },
      {
        type: "table",
        headers: ["Glagol", "Značenje", "Primer"],
        rows: [
          ["<mark>reinkommen</mark>", "ući (u prostoriju)", "Komm rein! — Uđi!"],
          ["<mark>rausgehen</mark>", "izaći", "Ich muss kurz rausgehen. — Moram da izađem."],
          ["<mark>runterkommen</mark>", "sići dole", "Die Kinder rennen die Treppe runter. — Deca trče niz stepenice."],
          ["<mark>runterbringen</mark>", "sneti dole", "Bring bitte den Müll runter! — Snesi smeće!"],
          ["<mark>raufkommen</mark>", "popeti se gore", "Der Aufzug ist kaputt, also müssen wir die Treppe raufkommen."],
          ["<mark>rüberkommen</mark>", "preći (na drugu stranu)", "Kannst du bitte rüberkommen und mir helfen?"],
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "Komm rein!", back: "Uđi!" },
          { front: "Ich muss kurz rausgehen.", back: "Moram da izađem na kratko." },
          { front: "Bring bitte den Müll runter!", back: "Snesi smeće!" },
          { front: "Die Treppe ist zu steil.", back: "Stepenice su previše strme." },
          { front: "Der Aufzug ist kaputt.", back: "Lift ne radi." },
          { front: "Kannst du rüberkommen?", back: "Možeš li da pređeš?" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["reinkommen", "ući"],
          ["rausgehen", "izaći"],
          ["runterkommen", "sići"],
          ["runterbringen", "sneti dole"],
          ["raufkommen", "popeti se"],
          ["rüberkommen", "preći na drugu stranu"],
          ["die Treppe", "stepenice"],
          ["steil", "strmo"],
          ["kaputt", "pokvaren"],
          ["der Aufzug", "lift"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 8: Essgewohnheiten (video: 838911857)
  // ────────────────────────────────────────────────────────────────
  8: {
    sections: [
      {
        type: "badge",
        module: "Modul 3",
        category: "wortschatz",
      },
      {
        type: "video",
        vimeoId: "838911857",
      },
      {
        type: "text",
        style: "info",
        content:
          "Šta jedu Nemci? Učiš reči za **hranu i piće**, razlikuješ **gesund** i **ungesund** i vodiš dijalog o navikama u ishrani.",
      },
      {
        type: "text",
        style: "default",
        content: "## Essen und Trinken — osnovni vokabular",
      },
      {
        type: "table",
        headers: ["Nemački", "Srpski"],
        rows: [
          ["<mark>die Milch</mark>", "mleko"],
          ["<mark>die Butter</mark>", "puter"],
          ["<mark>der Zucker</mark>", "šećer"],
          ["<mark>der Kuchen</mark>", "kolač"],
          ["<mark>die Banane, -n</mark>", "banana"],
          ["<mark>das Ei, -er</mark>", "jaje"],
          ["<mark>die Schokolade</mark>", "čokolada"],
          ["<mark>der Fisch, -e</mark>", "riba"],
          ["<mark>der Apfel, Äpfel</mark>", "jabuka"],
          ["<mark>die Orange, -n</mark>", "pomorandža"],
          ["<mark>der Saft, Säfte</mark>", "sok"],
          ["<mark>das Brötchen, -</mark>", "zemička"],
          ["<mark>der Kaffee</mark>", "kafa"],
          ["<mark>das Mehl</mark>", "brašno"],
          ["<mark>das Würstchen, -</mark>", "viršla"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Wasser in Deutschland\n\n- **mit Kohlensäure** — gazirana voda\n- **ohne Kohlensäure** — negazirana voda\n- **Leitungswasser / Wasser aus dem Hahn** — voda iz česme",
      },
      {
        type: "text",
        style: "uebung",
        content: "**Zanimljivost:** *Es ist mir Wurst.* — doslovno \"Viršla mi je\", a zapravo znači **svejedno mi je**!",
      },
      {
        type: "text",
        style: "default",
        content: "## Gesund oder ungesund?",
      },
      {
        type: "table",
        headers: ["Gesund", "Ungesund"],
        rows: [
          ["Gemüse (povrće)", "Softdrinks"],
          ["Getreide (žitarice)", "Fertiggerichte (gotova jela)"],
          ["Trockenfrüchte (suvo voće)", "Schokoriegel (čokoladice)"],
          ["Wasser", "Tiefkühlpizza (smrznuta pica)"],
          ["Haferflocken (ovsene pahuljice)", ""],
          ["Nüsse (orašasti plodovi)", ""],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Artikel-Hilfe: Getränke\n\n**Alkoholische Getränke** su uvek **DER**: der Wein, der Whisky, der Gin, der Rum, der Wodka\n\n**Kaffee** je takođe **DER**: der Espresso, der Cappuccino, der Kaffee, der Latte",
      },
      {
        type: "formula",
        content: "Ich hätte gern... (Želeo/la bih...)\nIch möchte gern... (Hteo/la bih...)\nIch nehme... (Uzimam...)",
      },
      {
        type: "flashcard",
        items: [
          { front: "die Haferflocken", back: "ovsene pahuljice" },
          { front: "die Nüsse", back: "orašasti plodovi" },
          { front: "das Gemüse", back: "povrće" },
          { front: "belegte Brote", back: "sendviči (hleb sa namazom)" },
          { front: "der Schokoriegel", back: "čokoladica" },
          { front: "die Tiefkühlpizza", back: "smrznuta pica" },
          { front: "das Fertiggericht", back: "gotovo jelo" },
          { front: "die Kohlensäure", back: "ugljen-dioksid (gazirano)" },
          { front: "das Leitungswasser", back: "voda iz česme" },
          { front: "Es ist mir Wurst.", back: "Svejedno mi je." },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Essgewohnheiten", "navike u ishrani"],
          ["gesund", "zdravo"],
          ["ungesund", "nezdravo"],
          ["die Haferflocken", "ovsene pahuljice"],
          ["die Nüsse", "orašasti plodovi"],
          ["das Gemüse", "povrće"],
          ["das Getreide", "žitarice"],
          ["die Trockenfrüchte", "suvo voće"],
          ["das Fertiggericht", "gotovo jelo"],
          ["der Schokoriegel", "čokoladica"],
          ["die Tiefkühlpizza", "smrznuta pica"],
          ["die Kohlensäure", "gazirano"],
          ["das Leitungswasser", "voda iz česme"],
          ["schmecken", "imati ukus"],
          ["bestellen", "naručiti"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 9: Im Restaurant (video: 840896492)
  // ────────────────────────────────────────────────────────────────
  9: {
    sections: [
      {
        type: "badge",
        module: "Modul 3",
        category: "hoeren",
      },
      {
        type: "video",
        vimeoId: "840896492",
      },
      {
        type: "text",
        style: "info",
        content:
          "Naučićeš kako da **naručiš jelo i piće** u restoranu, pitaš za račun i vodiš ceo razgovor sa konobarom.",
      },
      {
        type: "text",
        style: "default",
        content: "## Naručivanje — Etwas bestellen",
      },
      {
        type: "formula",
        content: "Ich hätte gern... (Želeo/la bih...)\nIch möchte gern... (Hteo/la bih...)\nIch nehme... (Uzimam...)",
      },
      {
        type: "text",
        style: "default",
        content: "## Plaćanje — Nach der Rechnung fragen",
      },
      {
        type: "table",
        headers: ["Nemački", "Srpski"],
        rows: [
          ["Ich würde gern zahlen, bitte.", "Želeo/la bih da platim."],
          ["Ich möchte gern zahlen.", "Hteo/la bih da platim."],
          ["Können Sie mir bitte die Rechnung bringen?", "Možete li mi doneti račun?"],
          ["Die Rechnung bitte.", "Račun, molim."],
        ],
      },
      {
        type: "spoiler",
        title: "Was passt nicht? — Šta ne pripada?",
        items: [
          { question: "Naručivanje: Ich hätte gern… / Ich möchte gern… / Ich nehme… / Ich gehe raus… — Šta ne pripada?", answer: "Ich gehe raus… (to znači 'izlazim', nema veze sa naručivanjem)" },
          { question: "Plaćanje: Ich würde gern zahlen / Ich würde gern Müll runterbringen / Ich möchte gern zahlen — Šta ne pripada?", answer: "Ich würde gern Müll runterbringen (to znači 'sneo bih smeće')" },
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Dijalog 1 — Naručivanje pića",
      },
      {
        type: "table",
        headers: ["Kellner/-in", "Gast"],
        rows: [
          ["Guten Tag.", "Guten Tag."],
          ["Darf ich Ihnen schon etwas zu trinken bringen?", "Ja, gern. Ich hätte gern ein Bier, bitte."],
          ["Möchten Sie ein großes oder kleines Bier?", "Ein großes, bitte."],
          ["Kommt sofort.", ""],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Dijalog 2 — Naručivanje jela i račun",
      },
      {
        type: "table",
        headers: ["Kellner/-in", "Gast"],
        rows: [
          ["Haben Sie schon gewählt?", "Ja, ich nehme die Kartoffelsuppe und das panierte Schnitzel."],
          ["Sehr gerne.", ""],
          ["(später) Hat es Ihnen geschmeckt?", "Ja, das Essen war sehr lecker."],
          ["Möchten Sie noch eine Nachspeise?", "Ja, ich hätte noch gern ein gemischtes Eis ohne Sahne."],
          ["Haben Sie sonst noch einen Wunsch?", "Nein, danke."],
          ["(bringt die Nachspeise)", "Können Sie mir dann auch die Rechnung bringen?"],
          ["Sehr gerne. Das macht 26,90€.", "29€, bitte."],
          ["Vielen Dank. Ich wünsche Ihnen noch einen schönen Tag.", "Vielen Dank, Ihnen auch."],
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "Haben Sie schon gewählt?", back: "Da li ste već izabrali?" },
          { front: "Hat es Ihnen geschmeckt?", back: "Da li vam je prijalo?" },
          { front: "die Nachspeise", back: "desert" },
          { front: "die Sahne", back: "slag / pavlaka" },
          { front: "Das macht 26,90€.", back: "To je 26,90€." },
          { front: "die Rechnung", back: "račun" },
          { front: "die Kartoffelsuppe", back: "krompir čorba" },
          { front: "das Schnitzel", back: "šnicla" },
          { front: "lecker", back: "ukusno" },
          { front: "bestellen", back: "naručiti" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["bestellen", "naručiti"],
          ["die Speisekarte", "jelovnik"],
          ["die Rechnung", "račun"],
          ["zahlen", "platiti"],
          ["die Nachspeise / der Nachtisch", "desert"],
          ["die Vorspeise", "predjelo"],
          ["das Hauptgericht", "glavno jelo"],
          ["die Sahne", "slag / pavlaka"],
          ["lecker", "ukusno"],
          ["schmecken", "imati ukus / prijati"],
          ["wählen", "izabrati"],
          ["der Wunsch", "želja"],
          ["der Kellner / die Kellnerin", "konobar / konobarica"],
          ["das Trinkgeld", "napojnica"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 10: Indefinitpronomen (video: 842866288)
  // ────────────────────────────────────────────────────────────────
  10: {
    sections: [
      {
        type: "badge",
        module: "Modul 3",
        category: "grammatik",
      },
      {
        type: "video",
        vimeoId: "842866288",
      },
      {
        type: "text",
        style: "info",
        content:
          "**Indefinitpronomen** — neodređene zamenice: *man, jemand, niemand, etwas, nichts, alles*. Učiš kako da vodiš kratke dijaloge i koristiš ove reči u svakodnevnom govoru.",
      },
      {
        type: "text",
        style: "default",
        content: "## Artikel-Hilfe — ponavljanje\n\nAlkoholische Getränke su uvek **DER**: der Wein, der Whisky, der Gin, der Rum, der Wodka\n\nKaffee je takođe **DER**: der Espresso, der Cappuccino, der Kaffee, der Latte",
      },
      {
        type: "text",
        style: "default",
        content: "## Pribor za jelo — das Besteck",
      },
      {
        type: "table",
        headers: ["Nemački", "Srpski"],
        rows: [
          ["<mark>die Gabel, -n</mark>", "viljuška"],
          ["<mark>das Messer, -</mark>", "nož"],
          ["<mark>der Löffel, -</mark>", "kašika"],
          ["<mark>die Serviette, -n</mark>", "salveta"],
          ["<mark>der Teller, -</mark>", "tanjir"],
          ["<mark>die Tasse, -n</mark>", "šolja"],
          ["<mark>das Glas, Gläser</mark>", "čaša"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Restaurantbewertung — Wiederholung\n\nPročitaj ocenu restorana i izaberi tačan odgovor:",
      },
      {
        type: "spoiler",
        title: "Was passt? — Restaurantbewertung",
        items: [
          { question: "Das Restaurant ist sehr... a) freundlich b) schön c) schnell", answer: "b) schön" },
          { question: "Die Kellner sind immer... a) freundlich b) günstig c) teuer", answer: "a) freundlich" },
          { question: "Das Angebot an Speisen und Getränken ist... a) groß b) billig c) leer", answer: "a) groß" },
          { question: "Das Essen schmeckt... a) nett b) lecker c) schön", answer: "b) lecker" },
          { question: "Die Zutaten sind immer... a) günstig b) voll c) frisch", answer: "c) frisch" },
          { question: "Die Hauptgerichte sind mit 10-18€ nicht so... a) gut b) teuer c) groß", answer: "b) teuer" },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "die Gabel", back: "viljuška" },
          { front: "das Messer", back: "nož" },
          { front: "der Löffel", back: "kašika" },
          { front: "die Serviette", back: "salveta" },
          { front: "der Teller", back: "tanjir" },
          { front: "die Tasse", back: "šolja" },
          { front: "die Zutat, -en", back: "sastojak" },
          { front: "das Angebot", back: "ponuda" },
          { front: "günstig", back: "povoljan / jeftin" },
          { front: "frisch", back: "svež" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Gabel", "viljuška"],
          ["das Messer", "nož"],
          ["der Löffel", "kašika"],
          ["die Serviette", "salveta"],
          ["der Teller", "tanjir"],
          ["die Tasse", "šolja"],
          ["die Zutat, -en", "sastojak"],
          ["das Angebot", "ponuda"],
          ["günstig", "povoljan"],
          ["frisch", "svež"],
          ["die Bewertung", "ocena / recenzija"],
          ["das Besteck", "pribor za jelo"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 11: Arbeitsklima (video: 843926423)
  // ────────────────────────────────────────────────────────────────
  11: {
    sections: [
      {
        type: "badge",
        module: "Modul 4",
        category: "lesen",
      },
      {
        type: "video",
        vimeoId: "843926423",
      },
      {
        type: "text",
        style: "info",
        content:
          "Radna atmosfera — naučićeš da opišeš šefa, kažeš šta ti je važno na poslu i koristiš **wenn-Sätze** i **sollen/sollte** za savete.",
      },
      {
        type: "text",
        style: "default",
        content: "## Was ist dir wichtig? — Šta ti je važno na poslu?",
      },
      {
        type: "table",
        headers: ["Nemački", "Srpski"],
        rows: [
          ["<mark>angestellt sein</mark>", "biti zaposlen"],
          ["<mark>selbstständig sein</mark>", "biti samozaposlen"],
          ["<mark>feste Arbeitszeiten</mark>", "fiksno radno vreme"],
          ["<mark>flexible Arbeitszeiten</mark>", "fleksibilno radno vreme"],
          ["<mark>Teilzeit arbeiten</mark>", "raditi pola radnog vremena"],
          ["<mark>ein guter Lohn</mark>", "dobra plata"],
          ["<mark>viel Urlaub</mark>", "mnogo odmora"],
          ["<mark>im Team arbeiten</mark>", "raditi u timu"],
          ["<mark>allein arbeiten</mark>", "raditi sam/a"],
          ["<mark>nette Kollegen</mark>", "fini kolege"],
          ["<mark>drinnen arbeiten</mark>", "raditi unutra"],
          ["<mark>draußen arbeiten</mark>", "raditi napolju"],
          ["<mark>im Ausland arbeiten</mark>", "raditi u inostranstvu"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Und wie ist dein Chef? — Čitanje\n\nTri osobe opisuju svog šefa:",
      },
      {
        type: "text",
        style: "beispiele",
        content: "**Hanna (27):** Mein Chef ist toll. Er ist auch noch jung. Wir duzen uns. Ich arbeite in einer kleinen Sprachschule, und wir können immer zu ihm gehen, wenn wir ein Problem haben. Aber er sagt auch, wenn ihm etwas nicht gefällt. Das mag ich.\n\n**Andreas (31):** Zu meinen Kollegen habe ich einen guten Kontakt, wir verstehen uns sehr gut. Aber unsere Chefin ist leider nicht so nett. Sie sagt nie etwas Gutes und redet auch sonst nicht viel mit uns.\n\n**Katrin (35):** Ich arbeite seit acht Jahren in einem kleinen Verlag und mag meine Kollegen und auch meinen Chef sehr. Die Arbeit macht Spaß. Nur eines ist ein Problem: Nach großen Projekten bedankt sich unser Chef nie oder sagt mal 'gut gemacht'. Das fehlt mir sehr.",
      },
      {
        type: "text",
        style: "default",
        content: "## Wie soll ein guter Chef sein?",
      },
      {
        type: "formula",
        content: "Ein guter Chef sollte respektvoll sein.\nEr sollte offen für neue Ideen sein.\nEr sollte gut zuhören können.\nEin guter Chef sollte bei Problemen oder Konflikten helfen.\nEin guter Chef sollte die Mitarbeiter motivieren.\nEin guter Chef sollte deutlich und verständlich kommunizieren.",
      },
      {
        type: "text",
        style: "default",
        content: "## sollen — Konjunktiv II (saveti)",
      },
      {
        type: "table",
        headers: ["Präsens", "Konjunktiv II"],
        rows: [
          ["ich soll", "ich <strong>sollte</strong>"],
          ["du sollst", "du <strong>solltest</strong>"],
          ["er/sie/es soll", "er/sie/es <strong>sollte</strong>"],
          ["wir sollen", "wir <strong>sollten</strong>"],
          ["ihr sollt", "ihr <strong>solltet</strong>"],
          ["sie/Sie sollen", "sie/Sie <strong>sollten</strong>"],
        ],
      },
      {
        type: "text",
        style: "uebung",
        content: "**Razlika:**\n- Präsens: *Du sollst um 8 Uhr zu Hause sein.* (Jasna poruka, kao naredba)\n- Konjunktiv: *Du solltest mehr Wasser trinken.* (Više savet)",
      },
      {
        type: "spoiler",
        title: "Vežba — Formuliere Ratschläge! (Er/Sie sollte...)",
        items: [
          { question: "Ich komme einfach nicht aus dem Bett.", answer: "Er sollte früher schlafen gehen. / Er sollte einen Wecker stellen." },
          { question: "Ich habe so viel Arbeit.", answer: "Sie sollte ihren Chef um Hilfe bitten. / Sie sollte Prioritäten setzen." },
          { question: "Immer nur Ärger mit der Kollegin!", answer: "Er sollte mit ihr sprechen. / Er sollte zum Chef gehen." },
          { question: "So ein Mistwetter! Das macht keinen Spaß!", answer: "Er sollte zu Hause bleiben. / Er sollte einen Regenschirm mitnehmen." },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "der Lohn", back: "plata" },
          { front: "angestellt", back: "zaposlen" },
          { front: "selbstständig", back: "samozaposlen" },
          { front: "Teilzeit", back: "pola radnog vremena" },
          { front: "der Kollege / die Kollegin", back: "kolega / koleginica" },
          { front: "der Verlag", back: "izdavačka kuća" },
          { front: "sich bedanken", back: "zahvaliti se" },
          { front: "duzen", back: "persirati na 'ti'" },
          { front: "respektvoll", back: "pun poštovanja" },
          { front: "der Ratschlag", back: "savet" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["das Arbeitsklima", "radna atmosfera"],
          ["der Chef / die Chefin", "šef / šefica"],
          ["der Kollege / die Kollegin", "kolega / koleginica"],
          ["der Mitarbeiter", "zaposleni / saradnik"],
          ["angestellt", "zaposlen"],
          ["selbstständig", "samozaposlen"],
          ["der Lohn", "plata"],
          ["Teilzeit", "pola radnog vremena"],
          ["der Ratschlag", "savet"],
          ["sich bedanken", "zahvaliti se"],
          ["duzen", "oslovljavati sa 'du'"],
          ["der Verlag", "izdavačka kuća"],
          ["der Ärger", "ljutnja / problemi"],
          ["motivieren", "motivirati"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 12: Bewerbungen (video: 845810637)
  // ────────────────────────────────────────────────────────────────
  12: {
    sections: [
      {
        type: "badge",
        module: "Modul 4",
        category: "schreiben",
      },
      {
        type: "video",
        vimeoId: "845810637",
      },
      {
        type: "text",
        style: "info",
        content:
          "Kako se prijaviti za posao u Nemackoj — **Bewerbung, Lebenslauf, Anschreiben** i najvaznije fraze za prijavu.",
      },
      {
        type: "text",
        style: "default",
        content: "## Delovi prijave za posao",
      },
      {
        type: "table",
        headers: ["Nemacki", "Srpski"],
        rows: [
          ["<mark>die Bewerbung</mark>", "prijava za posao"],
          ["<mark>das Anschreiben</mark>", "motivaciono pismo"],
          ["<mark>der Lebenslauf</mark>", "biografija (CV)"],
          ["<mark>das Zeugnis, -se</mark>", "diploma / svedocanstvo"],
          ["<mark>die Stellenanzeige</mark>", "oglas za posao"],
          ["<mark>das Vorstellungsgesprach</mark>", "razgovor za posao"],
          ["<mark>die Qualifikation</mark>", "kvalifikacija"],
          ["<mark>die Berufserfahrung</mark>", "radno iskustvo"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Korisne fraze za Anschreiben",
      },
      {
        type: "formula",
        content: "Sehr geehrte Damen und Herren,\nich bewerbe mich um die Stelle als...\nIch habe eine Ausbildung als... gemacht.\nIch habe ... Jahre Berufserfahrung.\nIch spreche fliessend... / Meine Muttersprache ist...\nUber eine Einladung zum Vorstellungsgesprach wurde ich mich sehr freuen.\nMit freundlichen Grussen",
      },
      {
        type: "spoiler",
        title: "Vezba — Lebenslauf: sta treba da sadrzis?",
        items: [
          { question: "Personliche Daten — sta spada tu?", answer: "Name, Adresse, Telefonnummer, E-Mail, Geburtsdatum, Geburtsort, Familienstand" },
          { question: "Berufserfahrung — kako se pise?", answer: "Od novijeg ka starijem: npr. 2020-2024 Kellnerin im Restaurant Adler, Frankfurt" },
          { question: "Ausbildung — sta navodis?", answer: "Skola, fakultet, kursevi, diplome — sa datumima" },
          { question: "Sprachkenntnisse — kako?", answer: "Npr. Deutsch B1, Englisch B2, Serbisch Muttersprache" },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "die Bewerbung", back: "prijava za posao" },
          { front: "das Anschreiben", back: "motivaciono pismo" },
          { front: "der Lebenslauf", back: "CV / biografija" },
          { front: "das Vorstellungsgesprach", back: "razgovor za posao" },
          { front: "die Stellenanzeige", back: "oglas za posao" },
          { front: "die Berufserfahrung", back: "radno iskustvo" },
          { front: "das Zeugnis", back: "diploma / svedocanstvo" },
          { front: "sich bewerben um", back: "prijaviti se za (posao)" },
          { front: "Sehr geehrte Damen und Herren", back: "Postovane dame i gospodo" },
          { front: "Mit freundlichen Grussen", back: "Sa postovanjem" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Bewerbung", "prijava za posao"],
          ["sich bewerben um + A", "prijaviti se za"],
          ["das Anschreiben", "motivaciono pismo"],
          ["der Lebenslauf", "CV / biografija"],
          ["das Zeugnis", "diploma / svedocanstvo"],
          ["die Stellenanzeige", "oglas za posao"],
          ["das Vorstellungsgesprach", "razgovor za posao"],
          ["die Berufserfahrung", "radno iskustvo"],
          ["die Qualifikation", "kvalifikacija"],
          ["fliessend", "tecno"],
          ["die Einladung", "poziv"],
          ["die Stelle", "radno mesto"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 13: Weil, denn, dann (video: 846973209)
  // ────────────────────────────────────────────────────────────────
  13: {
    sections: [
      {
        type: "badge",
        module: "Modul 4",
        category: "grammatik",
      },
      {
        type: "video",
        vimeoId: "846973209",
      },
      {
        type: "text",
        style: "info",
        content:
          "Proširenje lekcije 3 — sada vežbaš **wenn**, **weil**, **denn** i **dann** u kontekstu posla. Prevodićeš rečenice sa srpskog na nemački.",
      },
      {
        type: "text",
        style: "default",
        content: "## denn — vežba prevođenja\n\nPosle **denn** normalan red reči. Prevedi sa srpskog na nemački:",
      },
      {
        type: "spoiler",
        title: "Prevedi koristeći DENN",
        items: [
          { question: "Danas ne mogu doći na sastanak, jer sam bolestan/bolesna.", answer: "Ich kann heute nicht zum Meeting kommen, denn ich bin krank." },
          { question: "Dobio je povišicu, jer je naporno radio.", answer: "Er hat eine Gehaltserhöhung bekommen, denn er hat hart gearbeitet." },
          { question: "Sutra ću raditi prekovremeno, jer želim završiti projekat na vreme.", answer: "Morgen mache ich Überstunden, denn ich möchte das Projekt rechtzeitig beenden." },
          { question: "Danas neću ići u bioskop, jer moram završiti svoju prijavu za posao.", answer: "Ich gehe heute nicht ins Kino, denn ich muss noch meine Bewerbung fertigstellen." },
          { question: "Dobio je posao, jer je imao najbolje kvalifikacije.", answer: "Er hat den Job bekommen, denn er hatte die beste Qualifikation." },
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Kako bismo ovo rekli na nemačkom?",
      },
      {
        type: "spoiler",
        title: "Prevedi",
        items: [
          { question: "Želim da postanem učiteljica.", answer: "Ich möchte Lehrerin werden." },
          { question: "Učiteljica je uvek sa decom.", answer: "Eine Lehrerin ist immer mit Kindern." },
          { question: "Želim da postanem učiteljica, jer je učiteljica uvek sa decom.", answer: "Ich möchte Lehrerin werden, denn eine Lehrerin ist immer mit Kindern." },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["denn", "jer (normalan red reči)"],
          ["weil", "jer (glagol na kraj)"],
          ["dann", "onda / zatim"],
          ["wenn", "kada / ako"],
          ["die Gehaltserhöhung", "povišica"],
          ["die Überstunden", "prekovremeni rad"],
          ["rechtzeitig", "na vreme"],
          ["beenden", "završiti"],
          ["fertigstellen", "završiti / dovršiti"],
          ["die Qualifikation", "kvalifikacija"],
          ["die Bewerbung", "prijava za posao"],
          ["hart arbeiten", "naporno raditi"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 14: Arbeitszeit, Urlaubs- und Feiertage (video: 847080377)
  // ────────────────────────────────────────────────────────────────
  14: {
    sections: [
      {
        type: "badge",
        module: "Modul 4",
        category: "lesen",
      },
      {
        type: "video",
        vimeoId: "847080377",
      },
      {
        type: "text",
        style: "info",
        content:
          "Koliko se radi u Nemačkoj? Pročitaj tekst o **radnom vremenu, godišnjem odmoru i praznicima** u nemačkim govornim zemljama i odgovori na pitanja.",
      },
      {
        type: "text",
        style: "default",
        content: "## Tekst: Arbeitszeit, Urlaubs- und Feiertage",
      },
      {
        type: "text",
        style: "beispiele",
        content: "Deutsche Arbeitnehmer in deutschsprachigen Ländern arbeiten in der Regel 38,5 Stunden pro Woche und haben in der Regel 25 Urlaubstage. Die Arbeitszeit in Österreich und der Schweiz beträgt durchschnittlich 40 beziehungsweise 41,5 Stunden pro Woche. In der Industrie müssen Mitarbeiter in Deutschland nur 35 Stunden pro Woche arbeiten, in Geschäften 37,5 Stunden und in Ämtern 40 Stunden.\n\nAllerdings arbeiten viele Menschen mehr und machen Überstunden. Wenn man diese mitzählt, arbeiten die Deutschen durchschnittlich 41,5 Stunden pro Woche. Das ist der europäische Durchschnitt.\n\nWas die Urlaubstage betrifft, sind die Deutschen international an der Spitze: Viele deutsche Angestellte haben rund 30 Tage Urlaub pro Jahr, also ganze sechs Wochen. In Österreich gibt es 12 bis 13 Feiertage, in der Schweiz 8 bis 14 Feiertage.\n\nZusammenfassend haben Arbeitnehmer in Deutschland insgesamt acht Wochen, in Österreich gut sieben und in der Schweiz zwischen sieben und acht Wochen frei.",
      },
      {
        type: "spoiler",
        title: "Razumevanje teksta — pitanja",
        items: [
          { question: "Koliko sati nedeljno rade Nemci?", answer: "38,5 sati (u proseku sa prekovremenim 41,5)" },
          { question: "Koliko dana godišnjeg odmora imaju nemački zaposleni?", answer: "Oko 30 dana (6 nedelja)" },
          { question: "Ko radi manje — industrija ili kancelarije?", answer: "Industrija (35 sati), kancelarije 40 sati" },
          { question: "Koliko praznika ima Austrija?", answer: "12 do 13 praznika" },
          { question: "Koliko ukupno nedelja odmora imaju Nemci (odmor + praznici)?", answer: "Oko 8 nedelja" },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "der Arbeitnehmer", back: "zaposleni / radnik" },
          { front: "die Arbeitszeit", back: "radno vreme" },
          { front: "der Urlaubstag", back: "dan godišnjeg odmora" },
          { front: "der Feiertag", back: "praznik" },
          { front: "die Überstunden", back: "prekovremeni rad" },
          { front: "durchschnittlich", back: "prosečno" },
          { front: "betragen", back: "iznositi" },
          { front: "der Durchschnitt", back: "prosek" },
          { front: "an der Spitze", back: "na vrhu" },
          { front: "zusammenfassend", back: "ukratko / rezime" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["der Arbeitnehmer", "zaposleni"],
          ["die Arbeitszeit", "radno vreme"],
          ["der Urlaubstag", "dan odmora"],
          ["der Feiertag", "praznik"],
          ["die Überstunden", "prekovremeni rad"],
          ["durchschnittlich", "prosečno"],
          ["betragen", "iznositi"],
          ["beziehungsweise (bzw.)", "odnosno"],
          ["mitzählen", "uračunati"],
          ["an der Spitze", "na vrhu"],
          ["der Angestellte", "službenik"],
          ["das Amt, Ämter", "kancelarija / institucija"],
          ["zusammenfassend", "ukratko"],
          ["insgesamt", "ukupno"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 15: Refleksivni glagoli (video: 847623975)
  // ────────────────────────────────────────────────────────────────
  15: {
    sections: [
      {
        type: "badge",
        module: "Modul 5",
        category: "grammatik",
      },
      {
        type: "video",
        vimeoId: "847623975",
      },
      {
        type: "text",
        style: "info",
        content:
          "**Reflexive Verben** — glagoli sa *sich*. Naučiceš kako se menjaju po licima, vežbaš uz zdravstvene savete i čitaš refleksivne glagole u kontekstu.",
      },
      {
        type: "text",
        style: "default",
        content: "## Refleksivne zamenice po licima",
      },
      {
        type: "table",
        headers: ["Lice", "Zamenica", "Primer (sich bewegen)"],
        rows: [
          ["ich", "<strong>mich</strong>", "ich bewege mich"],
          ["du", "<strong>dich</strong>", "du bewegst dich"],
          ["er/sie/es", "<strong>sich</strong>", "er bewegt sich"],
          ["wir", "<strong>uns</strong>", "wir bewegen uns"],
          ["ihr", "<strong>euch</strong>", "ihr bewegt euch"],
          ["sie/Sie", "<strong>sich</strong>", "sie bewegen sich"],
        ],
      },
      {
        type: "text",
        style: "uebung",
        content: "**Red reci:** Kada recenica pocinje sa prilogom, sich dolazi posle glagola:\n\n*Er rasiert sich jeden Morgen.* → *Jeden Morgen rasiert er sich.*",
      },
      {
        type: "text",
        style: "default",
        content: "## Gesundheitstipps — zdravstveni saveti\n\nKoristi refleksivne glagole da das savete:",
      },
      {
        type: "formula",
        content: "1. Bewegen Sie sich regelmassig! Verabreden Sie sich mit Freunden.\n2. Machen Sie Pausen: Ruhen Sie sich aus und entspannen Sie sich.\n3. Sie sollten sich gesund ernahren. Dann fuhlen Sie sich sofort besser.",
      },
      {
        type: "text",
        style: "default",
        content: "## Refleksivni glagoli u kontekstu",
      },
      {
        type: "table",
        headers: ["Glagol", "Primer", "Prevod"],
        rows: [
          ["sich trennen", "Eva hat sich von Jorg getrennt.", "rastati se"],
          ["sich verlieben", "Ich habe mich verliebt.", "zaljubiti se"],
          ["sich verstehen", "Sie verstehen sich gut.", "razumeti se"],
          ["sich andern", "Du hast dich sehr geandert.", "promeniti se"],
          ["sich entschuldigen", "Sie entschuldigt sich.", "izviniti se"],
          ["sich umarmen", "Sie umarmen sich.", "grliti se"],
          ["sich streiten", "Sie streiten sich oft.", "svadjati se"],
          ["sich treffen", "Morgen treffen wir uns im Cafe.", "sresti se"],
          ["sich anziehen", "Wir haben uns schon angezogen.", "obuci se"],
          ["sich bewerben", "Sie sollen sich bewerben!", "prijaviti se (za posao)"],
          ["sich ernahren", "Ich ernahre mich gesund.", "hraniti se"],
          ["sich bewegen", "Bewegen Sie sich regelmasig!", "kretati se"],
          ["sich ausruhen", "Ich mochte mich ausruhen.", "odmoriti se"],
          ["sich fuhlen", "Wie fuhlen Sie sich?", "osecati se"],
        ],
      },
      {
        type: "text",
        style: "uebung",
        content: "**Pazi:** Neki glagoli su u nemackom povratni a u srpskom nisu, i obrnuto:\n\n*Sie verspatet sich immer.* — Ona uvek kasni.\n*Ich muss mich beeilen.* — Moram da pozurim.",
      },
      {
        type: "flashcard",
        items: [
          { front: "sich bewegen", back: "kretati se" },
          { front: "sich ernahren", back: "hraniti se" },
          { front: "sich fuhlen", back: "osecati se" },
          { front: "sich ausruhen", back: "odmoriti se" },
          { front: "sich entspannen", back: "opustiti se" },
          { front: "sich verabreden", back: "dogovoriti se (za susret)" },
          { front: "sich duschen", back: "tusirati se" },
          { front: "sich rasieren", back: "brijati se" },
          { front: "sich verlieben", back: "zaljubiti se" },
          { front: "sich streiten", back: "svadjati se" },
          { front: "sich entschuldigen", back: "izviniti se" },
          { front: "sich beeilen", back: "pozuriti" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["sich bewegen", "kretati se"],
          ["sich ernahren", "hraniti se"],
          ["sich fuhlen", "osecati se"],
          ["sich ausruhen", "odmoriti se"],
          ["sich entspannen", "opustiti se"],
          ["sich verabreden", "dogovoriti se za susret"],
          ["sich duschen", "tusirati se"],
          ["sich rasieren", "brijati se"],
          ["sich verlieben", "zaljubiti se"],
          ["sich trennen", "rastati se"],
          ["sich streiten", "svadjati se"],
          ["sich entschuldigen", "izviniti se"],
          ["sich beeilen", "pozuriti"],
          ["sich andern", "promeniti se"],
          ["sich verstehen", "razumeti se"],
          ["sich bewerben", "prijaviti se za posao"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 16: Ich interessiere mich für… (video: 847794872)
  // ────────────────────────────────────────────────────────────────
  16: {
    sections: [
      {
        type: "badge",
        module: "Modul 5",
        category: "grammatik",
      },
      {
        type: "video",
        vimeoId: "847794872",
      },
      {
        type: "text",
        style: "info",
        content:
          "Refleksivni glagoli sa **fiksnim predlozima** — sich interessieren **fur**, sich freuen **auf/uber**, sich argern **uber**. Predlog odredjuje padez!",
      },
      {
        type: "text",
        style: "default",
        content: "## Glagoli sa predlozima + Akkusativ",
      },
      {
        type: "table",
        headers: ["Glagol + predlog", "Primer", "Prevod"],
        rows: [
          ["sich interessieren <strong>fur</strong>", "Interessierst du dich fur den Tanzsport?", "interesovati se za"],
          ["sich beschweren <strong>uber</strong>", "Er beschwert sich uber die Wettervorhersage.", "zaliti se na"],
          ["sich argern <strong>uber</strong>", "Sie argert sich uber die Sportnachrichten.", "ljutiti se na"],
          ["sich freuen <strong>auf</strong>", "Er freut sich auf die Fussballweltmeisterschaft.", "radovati se (necemu u buducnosti)"],
          ["warten <strong>auf</strong>", "Wir warten auf das Oktoberfest.", "cekati"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Glagoli sa predlozima + Dativ",
      },
      {
        type: "table",
        headers: ["Glagol + predlog", "Primer", "Prevod"],
        rows: [
          ["zufrieden sein <strong>mit</strong>", "Sie ist zufrieden mit dem Hotel.", "biti zadovoljan"],
          ["erzahlen <strong>von</strong>", "Sie erzahlt von der Wettervorhersage.", "pricati o"],
          ["sich treffen <strong>mit</strong>", "Sie trifft sich mit ihrer Schwester.", "nalaziti se sa"],
        ],
      },
      {
        type: "spoiler",
        title: "Vezba — Popuni praznine (sich + predlog)",
        items: [
          { question: "Aber mein Mann interessiert ____ leider uberhaupt nicht ____ das Tanzen.", answer: "sich, fur" },
          { question: "Interessiert ihr ____ nicht ____ deutsche Geschichte?", answer: "euch, fur" },
          { question: "Doch, ich interessiere ____ sehr ____ deutsche Geschichte.", answer: "mich, fur" },
          { question: "Interessiert ____ ____ nicht mehr fur Kinofilme?", answer: "sie sich" },
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Kako odgovoriti na pitanja o interesovanjima",
      },
      {
        type: "formula",
        content: "++ Ja, sehr.\n+ Ja, eigentlich schon.\n- Nein, eigentlich nicht.\n-- Nein, uberhaupt nicht.",
      },
      {
        type: "flashcard",
        items: [
          { front: "sich interessieren fur", back: "interesovati se za" },
          { front: "sich freuen auf", back: "radovati se (buducnosti)" },
          { front: "sich freuen uber", back: "radovati se (necemu sto se desilo)" },
          { front: "sich argern uber", back: "ljutiti se na" },
          { front: "sich beschweren uber", back: "zaliti se na" },
          { front: "warten auf", back: "cekati" },
          { front: "zufrieden sein mit", back: "biti zadovoljan sa" },
          { front: "erzahlen von", back: "pricati o" },
          { front: "sich treffen mit", back: "nalaziti se sa" },
          { front: "verzichten auf", back: "odreci se" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["sich interessieren fur", "interesovati se za"],
          ["sich freuen auf", "radovati se (buducnosti)"],
          ["sich freuen uber", "radovati se (necemu sto se desilo)"],
          ["sich argern uber", "ljutiti se na"],
          ["sich beschweren uber", "zaliti se na"],
          ["warten auf", "cekati"],
          ["zufrieden sein mit", "biti zadovoljan"],
          ["erzahlen von", "pricati o"],
          ["sich treffen mit", "nalaziti se sa"],
          ["verzichten auf", "odreci se"],
          ["geniessen, hat genossen", "uzivati"],
          ["greifen zu + D", "posegnuti za"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 17: Fußball (video: 1177269843)
  // ────────────────────────────────────────────────────────────────
  17: {
    sections: [
      {
        type: "badge",
        module: "Modul 5",
        category: "hoeren",
      },
      {
        type: "video",
        vimeoId: "1177269843",
      },
      {
        type: "text",
        style: "info",
        content:
          "Video lekcija iz serije **Deutschlandlabor** — tema: fudbal u Nemackoj. Gledaj video i odgovori na pitanja o fudbalskoj kulturi u Nemackoj.",
      },
      {
        type: "text",
        style: "default",
        content: "## Fudbal u Nemackoj — vokabular",
      },
      {
        type: "table",
        headers: ["Nemacki", "Srpski"],
        rows: [
          ["<mark>der Fussball</mark>", "fudbal"],
          ["<mark>die Mannschaft</mark>", "tim / ekipa"],
          ["<mark>der Spieler / die Spielerin</mark>", "igrac / igracica"],
          ["<mark>das Spiel</mark>", "utakmica"],
          ["<mark>das Tor</mark>", "gol"],
          ["<mark>der Schiedsrichter</mark>", "sudija"],
          ["<mark>die Bundesliga</mark>", "nemacka fudbalska liga"],
          ["<mark>der Fan, -s</mark>", "navijac"],
          ["<mark>das Stadion</mark>", "stadion"],
          ["<mark>die Weltmeisterschaft (WM)</mark>", "svetsko prvenstvo"],
        ],
      },
      {
        type: "spoiler",
        title: "Pitanja posle videa",
        items: [
          { question: "Warum ist Fussball in Deutschland so beliebt?", answer: "Odgovori slobodno na osnovu videa." },
          { question: "Wie viele Fussballvereine gibt es in Deutschland?", answer: "Pogledaj video za tacan podatak." },
          { question: "Spielen auch Frauen Fussball in Deutschland?", answer: "Ja, Frauenfussball je popularan u Nemackoj." },
          { question: "Interessierst du dich fur Fussball? Warum (nicht)?", answer: "Odgovori licno." },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "die Mannschaft", back: "tim / ekipa" },
          { front: "das Tor", back: "gol" },
          { front: "der Schiedsrichter", back: "sudija" },
          { front: "die Bundesliga", back: "nemacka liga" },
          { front: "das Stadion", back: "stadion" },
          { front: "der Verein", back: "klub / udruzenje" },
          { front: "beliebt", back: "popularan / omiljen" },
          { front: "gewinnen", back: "pobediti" },
          { front: "verlieren", back: "izgubiti" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["der Fussball", "fudbal"],
          ["die Mannschaft", "tim"],
          ["der Spieler", "igrac"],
          ["das Tor", "gol"],
          ["der Schiedsrichter", "sudija"],
          ["der Verein", "klub"],
          ["die Bundesliga", "nemacka liga"],
          ["die Weltmeisterschaft", "svetsko prvenstvo"],
          ["das Stadion", "stadion"],
          ["der Fan", "navijac"],
          ["beliebt", "popularan"],
          ["gewinnen", "pobediti"],
          ["verlieren", "izgubiti"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 18: Worauf, darauf (video: 849054086)
  // ────────────────────────────────────────────────────────────────
  18: {
    sections: [
      {
        type: "badge",
        module: "Modul 5",
        category: "grammatik",
      },
      {
        type: "video",
        vimeoId: "849054086",
      },
      {
        type: "text",
        style: "info",
        content:
          "**Worauf? Darauf!** — Nastavak lekcije o glagolima sa predlozima. Sada ucis da formiras pitanja i odgovore pomocu **wo(r)+ predlog** i **da(r)+ predlog**.",
      },
      {
        type: "text",
        style: "default",
        content: "## Tekst: Essgewohnheiten\n\nProcitaj tekst o Mariji i pronadi glagole sa predlozima:",
      },
      {
        type: "text",
        style: "beispiele",
        content: "Maria ist eine gesunde Esserin. Sie legt grossen Wert auf frische Zutaten und ausgewogene Mahlzeiten. Jeden Morgen fruhstuckt sie Musli aus Haferflocken, frischem Obst und Joghurt. Zum Mittagessen bereitet sie oft einen bunten Salat mit Huhnchen zu. Ihre Abendessen **bestehen** meist aus einer Portion Gemuse, einer kleinen Menge Fleisch oder Fisch und einer Beilage wie Reis oder Kartoffeln. Zwischendurch **greift** Maria gerne zu Nussen oder einem Stuck dunkler Schokolade. Sie trinkt viel Wasser und **verzichtet** auf Softdrinks.",
      },
      {
        type: "table",
        headers: ["Glagol sa predlogom", "Padez", "Prevod"],
        rows: [
          ["warten <strong>auf</strong>", "Akkusativ", "cekati"],
          ["sich beschweren <strong>uber</strong>", "Akkusativ", "zaliti se"],
          ["sich argern <strong>uber</strong>", "Akkusativ", "ljutiti se"],
          ["sich freuen <strong>auf</strong>", "Akkusativ", "radovati se"],
          ["zufrieden sein <strong>mit</strong>", "Dativ", "biti zadovoljan"],
          ["erzahlen <strong>von</strong>", "Dativ", "pricati o"],
          ["sich treffen <strong>mit</strong>", "Dativ", "nalaziti se"],
          ["bestehen <strong>aus</strong>", "Dativ", "sastojati se od"],
          ["greifen <strong>zu</strong>", "Dativ", "posegnuti za"],
          ["verzichten <strong>auf</strong>", "Akkusativ", "odreci se"],
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "Worauf wartest du?", back: "Na sta cekas? — Darauf! (Na to!)" },
          { front: "Woruber beschwerst du dich?", back: "Na sta se zalis? — Daruber! (Na to!)" },
          { front: "Wofur interessierst du dich?", back: "Za sta se interesujes? — Dafur! (Za to!)" },
          { front: "Womit bist du zufrieden?", back: "Cime si zadovoljan? — Damit! (Time!)" },
          { front: "bestehen aus", back: "sastojati se od" },
          { front: "verzichten auf", back: "odreci se" },
          { front: "greifen zu", back: "posegnuti za" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["bestehen aus + D", "sastojati se od"],
          ["greifen zu + D", "posegnuti za"],
          ["verzichten auf + A", "odreci se"],
          ["ausgewogen", "uravnotezen"],
          ["die Mahlzeit", "obrok"],
          ["die Beilage", "prilog (uz jelo)"],
          ["zwischendurch", "u medjuvremenu"],
          ["Wert legen auf", "pridavati vaznost"],
          ["die Zutat", "sastojak"],
          ["zubereiten", "pripremiti (jelo)"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 19: Modalni glagoli u prošlosti (video: 851281827)
  // ────────────────────────────────────────────────────────────────
  19: {
    sections: [
      {
        type: "badge",
        module: "Modul 5",
        category: "grammatik",
      },
      {
        type: "video",
        vimeoId: "851281827",
      },
      {
        type: "text",
        style: "info",
        content:
          "Modalni glagoli u **Prateritum** — konnte, musste, wollte, durfte, sollte. U proslom vremenu koristimo Prateritum (ne perfekt!) za modalne glagole.",
      },
      {
        type: "text",
        style: "default",
        content: "## Modalni glagoli u prezentu — ponavljanje",
      },
      {
        type: "table",
        headers: ["konnen", "durfen", "mussen", "wollen", "sollen", "mogen"],
        rows: [
          ["ich kann", "ich darf", "ich muss", "ich will", "ich soll", "ich mag"],
          ["du kannst", "du darfst", "du musst", "du willst", "du sollst", "du magst"],
          ["er kann", "er darf", "er muss", "er will", "er soll", "er mag"],
          ["wir konnen", "wir durfen", "wir mussen", "wir wollen", "wir sollen", "wir mogen"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Upotreba modalnih glagola",
      },
      {
        type: "table",
        headers: ["Nemacki", "Prevod"],
        rows: [
          ["Ich <strong>kann</strong> Deutsch.", "Ja znam nemacki."],
          ["Ich <strong>kann</strong> Klavier spielen.", "Ja umem da sviram klavir."],
          ["Man <strong>darf</strong> hier nicht parken.", "Ovde se ne sme parkirati."],
          ["Man <strong>soll</strong> viel Wasser trinken.", "Treba piti puno vode."],
          ["Wir <strong>wollen</strong> nach Griechenland reisen.", "Zelimo da putujemo za Grcku."],
          ["Ich <strong>muss</strong> zuerst einen Kaffee trinken!", "Moram prvo da popijem kafu!"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Modalni glagoli u Prateritum (proslost)",
      },
      {
        type: "table",
        headers: ["konnen", "durfen", "mussen", "mochten", "wollen", "sollen"],
        rows: [
          ["ich <strong>konnte</strong>", "ich <strong>durfte</strong>", "ich <strong>musste</strong>", "ich <strong>wollte</strong>", "ich <strong>wollte</strong>", "ich <strong>sollte</strong>"],
          ["du konntest", "du durftest", "du musstest", "du wolltest", "du wolltest", "du solltest"],
          ["er konnte", "er durfte", "er musste", "er wollte", "er wollte", "er sollte"],
          ["wir konnten", "wir durften", "wir mussten", "wir wollten", "wir wollten", "wir sollten"],
        ],
      },
      {
        type: "spoiler",
        title: "Vezba — Popuni praznine (dijalog: Papa und Kind)",
        items: [
          { question: "Als Kind ______ ich noch kein Arzt werden. (wollen)", answer: "wollte" },
          { question: "Und warum ______ du kein Arzt werden? (wollen)", answer: "wolltest" },
          { question: "Aber das ______ ich nicht. (durfen)", answer: "durfte" },
          { question: "Ich ______ jeden Tag viel lernen. (mussen)", answer: "musste" },
          { question: "Meine Eltern ______, dass ich studiere. (wollen)", answer: "wollten" },
          { question: "Ich ______ auf die Universitat gehen. (sollen)", answer: "sollte" },
          { question: "Ich ______ nicht Agrarwissenschaft studieren. (wollen)", answer: "wollte" },
          { question: "______ ihr nicht viel lernen? (mussen)", answer: "Musstet" },
          { question: "Die Praxis-Facher ______ wir selbst auswahlen. (durfen)", answer: "durften" },
          { question: "In meiner Freizeit ______ ich machen, was ich wollte. (konnen)", answer: "konnte" },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "ich konnte", back: "mogao/la sam" },
          { front: "ich durfte", back: "smeo/la sam" },
          { front: "ich musste", back: "morao/la sam" },
          { front: "ich wollte", back: "hteo/la sam" },
          { front: "ich sollte", back: "trebalo je" },
          { front: "Hier darf man nicht fotografieren.", back: "Ovde se ne sme fotografisati." },
          { front: "Hier darf man nicht rauchen.", back: "Ovde se ne sme pusiti." },
          { front: "Hier kann man tanken.", back: "Ovde moze da se natoci gorivo." },
          { front: "Hier kann man parken.", back: "Ovde moze da se parkira." },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["konnen / konnte", "moci / mogao"],
          ["durfen / durfte", "smeti / smeo"],
          ["mussen / musste", "morati / morao"],
          ["wollen / wollte", "hteti / hteo"],
          ["sollen / sollte", "trebati / trebalo"],
          ["das Prateritum", "prosto proslo vreme"],
          ["der Bauernhof", "seosko domacinstvo"],
          ["die Agrarwissenschaft", "agronomija"],
          ["auswahlen", "izabrati"],
          ["tanken", "natociti gorivo"],
          ["parken", "parkirati"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 20: Schule – Deutschlandlabor (video: 1177272846)
  // ────────────────────────────────────────────────────────────────
  20: {
    sections: [
      {
        type: "badge",
        module: "Modul 6",
        category: "hoeren",
      },
      {
        type: "video",
        vimeoId: "1177272846",
      },
      {
        type: "text",
        style: "info",
        content:
          "Video lekcija o **skoli u Nemackoj** — skolski sistem, Schulpflicht, tipovi skola, Schultute i jos mnogo toga.",
      },
      {
        type: "text",
        style: "default",
        content: "## Skolski sistem u Nemackoj",
      },
      {
        type: "table",
        headers: ["Tip skole", "Razredi", "Opis"],
        rows: [
          ["<mark>Grundschule</mark>", "1-4 (ponegde do 6)", "osnovna skola za svu decu"],
          ["<mark>Hauptschule</mark>", "5-9", "priprema za zanat"],
          ["<mark>Realschule</mark>", "5-10", "srednji nivo"],
          ["<mark>Gymnasium</mark>", "5-13", "priprema za fakultet"],
          ["<mark>Gesamtschule</mark>", "1-10", "alternativa — sve u jednoj skoli"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Posle skole — Ausbildung",
      },
      {
        type: "table",
        headers: ["Put", "Opis"],
        rows: [
          ["Berufsschule und Lehre", "strukovna skola i praksa"],
          ["Duale Ausbildung", "dualno obrazovanje (skola + firma)"],
          ["Studium", "univerzitetsko obrazovanje"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Vrtici i predskolsko",
      },
      {
        type: "table",
        headers: ["Nemacki", "Srpski"],
        rows: [
          ["<mark>die Kinderkrippe</mark>", "jasle (do 3 godine)"],
          ["<mark>der Kindergarten</mark>", "vrtic (od 3 godine)"],
          ["<mark>die Kita (Kindertagesstatte)</mark>", "dnevni boravak za decu (7-17h)"],
          ["<mark>die Tagesmutter / der Tagesvater</mark>", "dadilja"],
          ["<mark>der Hort</mark>", "produzeni boravak (posle skole)"],
          ["<mark>die Ganztagsschule</mark>", "celodnevna skola (do 16-17h)"],
        ],
      },
      {
        type: "text",
        style: "uebung",
        content: "**Zanimljivosti:**\n\n- **Schulpflicht** = 9 godina obavezne skole. Drzavne skole su besplatne.\n- **Schultute** = na prvi skolski dan deca dobijaju veliku kesu sa slatkisima i skolskim priborom.\n- **Blauer Brief** = pismo roditeljima da dete mozda treba da ponovi razred.\n- **Klassenfahrt** = skolski izlet (2-3 dana) jednom godisnje.\n- **Elterngesprach** = privatni razgovor sa nastavnikom o napretku deteta.",
      },
      {
        type: "flashcard",
        items: [
          { front: "die Grundschule", back: "osnovna skola" },
          { front: "das Gymnasium", back: "gimnazija" },
          { front: "die Schulpflicht", back: "obaveza pohadjanja skole" },
          { front: "die Schultute", back: "kesa sa poklonima za prvi skolski dan" },
          { front: "der Hort", back: "produzeni boravak" },
          { front: "die Kita", back: "dnevni boravak za decu" },
          { front: "die Kinderkrippe", back: "jasle" },
          { front: "die Klassenfahrt", back: "skolski izlet" },
          { front: "das Elterngesprach", back: "razgovor sa roditeljima" },
          { front: "der Blauer Brief", back: "pismo o mogucnosti ponavljanja razreda" },
          { front: "die Ausbildung", back: "strukovno obrazovanje" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Schulpflicht", "obaveza pohadjanja skole"],
          ["die Grundschule", "osnovna skola"],
          ["das Gymnasium", "gimnazija"],
          ["die Hauptschule", "skola za zanat"],
          ["die Realschule", "srednja skola"],
          ["die Gesamtschule", "objedinjena skola"],
          ["die Ausbildung", "strukovno obrazovanje"],
          ["die Kinderkrippe", "jasle"],
          ["der Kindergarten", "vrtic"],
          ["die Kita", "dnevni boravak"],
          ["der Hort", "produzeni boravak"],
          ["die Schultute", "poklon-kesa za 1. dan"],
          ["die Klassenfahrt", "skolski izlet"],
          ["der Forderunterricht", "dodatna nastava"],
          ["das Fach, Facher", "predmet/i"],
          ["kostenlos", "besplatno"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 21: Schulsystem in Deutschland – Leseverstehen (text)
  // ────────────────────────────────────────────────────────────────
  21: {
    sections: [
      {
        type: "badge",
        module: "Modul 6",
        category: "lesen",
      },
      {
        type: "text",
        style: "info",
        content:
          "Citanje sa razumevanjem — tekst o **skolskom sistemu u Nemackoj**. Procitaj tekst i odgovori na pitanja.",
      },
      {
        type: "text",
        style: "default",
        content: "## Schulpflicht und Kosten\n\nU Nemackoj postoji **Schulpflicht**: deca moraju 9 godina da idu u skolu. Drzavne skole su besplatne. Skolska godina traje od avgusta/septembra do juna/jula.",
      },
      {
        type: "text",
        style: "default",
        content: "## Tipovi skola — pregled",
      },
      {
        type: "table",
        headers: ["Skola", "Razredi", "Posle toga"],
        rows: [
          ["Grundschule", "1-4", "Prelaz na visu skolu"],
          ["Hauptschule", "5-9", "Ausbildung (zanat)"],
          ["Realschule", "5-10", "Ausbildung ili nastavak"],
          ["Gymnasium", "5-13", "Studium (fakultet)"],
          ["Gesamtschule", "1-10", "Alternativa"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Predskolsko obrazovanje",
      },
      {
        type: "table",
        headers: ["Tip", "Uzrast", "Opis"],
        rows: [
          ["Kinderkrippe", "do 3 god.", "jasle"],
          ["Kindergarten", "od 3 god.", "vrtic"],
          ["Kita", "0-6 god.", "dnevni boravak (7-17h)"],
        ],
      },
      {
        type: "text",
        style: "uebung",
        content: "**Pazi:** Za mesto u vrticu ili jaslama treba se prijaviti na vreme — na mnogim mestima nema dovoljno slobodnih mesta! Ako ne dobijes mesto u Kindergartenu, **Tagesmutter** ili **Tagesvater** (dadilja) moze biti alternativa.",
      },
      {
        type: "spoiler",
        title: "Pitanja za razumevanje",
        items: [
          { question: "Koliko godina traje Schulpflicht u Nemackoj?", answer: "9 godina" },
          { question: "Da li su drzavne skole besplatne?", answer: "Da, drzavne skole su besplatne (kostenlos)." },
          { question: "Sta je Hort?", answer: "Produzeni boravak posle skole — deca tu dobiju jelo i pomoc sa domacim." },
          { question: "Sta je Schultute?", answer: "Velika kesa sa slatkisima i skolskim priborom za prvi skolski dan." },
          { question: "Sta je Blauer Brief?", answer: "Pismo roditeljima da dete mozda treba da ponovi razred." },
          { question: "Sta je Elterngesprach?", answer: "Privatni razgovor roditelja sa nastavnikom o napretku deteta." },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Schulpflicht", "obaveza pohadjanja skole"],
          ["kostenlos", "besplatno"],
          ["das Schuljahr", "skolska godina"],
          ["die Schultute", "poklon-kesa za 1. dan"],
          ["der Hort", "produzeni boravak"],
          ["die Ganztagsschule", "celodnevna skola"],
          ["der Forderunterricht", "dodatna nastava"],
          ["die Klassenfahrt", "skolski izlet"],
          ["das Elterngesprach", "razgovor sa roditeljima"],
          ["der Blauer Brief", "obavestenje o ponavljanju razreda"],
          ["die Tagesmutter", "dadilja"],
          ["anmelden", "prijaviti"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 22: Ausbildung in Deutschland (text)
  // ────────────────────────────────────────────────────────────────
  22: {
    sections: [
      {
        type: "badge",
        module: "Modul 6",
        category: "lesen",
      },
      {
        type: "text",
        style: "info",
        content:
          "Sta je **Ausbildung**? Dualni sistem obrazovanja u Nemackoj — kako funkcionise, koliko traje i zasto je vazan.",
      },
      {
        type: "text",
        style: "default",
        content: "## Ausbildung — strukovno obrazovanje",
      },
      {
        type: "text",
        style: "beispiele",
        content: "U Nemackoj postoji **dualni sistem obrazovanja** (duale Ausbildung). To znaci da se uci i u skoli (Berufsschule) i u firmi istovremeno. Ausbildung traje obicno 2-3.5 godine. Tokom Ausbildunga ucenik (Auszubildender ili skraceno Azubi) dobija platu.\n\nPostoje preko 300 razlicitih zanimanja za koja se moze raditi Ausbildung — od pekara do IT-specijaliste.",
      },
      {
        type: "table",
        headers: ["Nemacki", "Srpski"],
        rows: [
          ["<mark>die Ausbildung</mark>", "strukovno obrazovanje"],
          ["<mark>der Auszubildende (Azubi)</mark>", "ucenik na praksi"],
          ["<mark>die Berufsschule</mark>", "strukovna skola"],
          ["<mark>die duale Ausbildung</mark>", "dualno obrazovanje"],
          ["<mark>die Lehre</mark>", "zanat / praksa"],
          ["<mark>das Studium</mark>", "studije (fakultet)"],
          ["<mark>der Betrieb</mark>", "firma / preduzece"],
          ["<mark>die Prufung</mark>", "ispit"],
        ],
      },
      {
        type: "spoiler",
        title: "Pitanja za razumevanje",
        items: [
          { question: "Sta znaci 'duale Ausbildung'?", answer: "Ucenje istovremeno u skoli i u firmi." },
          { question: "Koliko traje Ausbildung?", answer: "Obicno 2 do 3.5 godine." },
          { question: "Da li Azubi dobija platu?", answer: "Da, tokom Ausbildunga ucenik dobija platu." },
          { question: "Sta je alternativa Ausbildungu?", answer: "Studium (studije na fakultetu)." },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "die Ausbildung", back: "strukovno obrazovanje" },
          { front: "der Azubi", back: "ucenik na praksi" },
          { front: "die Berufsschule", back: "strukovna skola" },
          { front: "die Lehre", back: "zanat / praksa" },
          { front: "der Betrieb", back: "firma / preduzece" },
          { front: "das Studium", back: "studije" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Ausbildung", "strukovno obrazovanje"],
          ["der Auszubildende (Azubi)", "ucenik na praksi"],
          ["die Berufsschule", "strukovna skola"],
          ["die duale Ausbildung", "dualno obrazovanje"],
          ["die Lehre", "zanat"],
          ["der Betrieb", "firma"],
          ["das Studium", "studije"],
          ["die Prufung", "ispit"],
          ["der Abschluss", "diploma / zavrsetak"],
          ["das Gehalt", "plata"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 23: Dodatne vežbe (text)
  // ────────────────────────────────────────────────────────────────
  23: {
    sections: [
      {
        type: "text",
        style: "info",
        content:
          "Dodatne vezbe za nivo A2.1 — ponovi najvaznije teme i proveri svoje znanje.",
      },
      {
        type: "text",
        style: "default",
        content: "## Ponavljanje — najvaznije teme A2.1\n\nOvde mozes da ponovis sve sto si naucio/la u kursu A2.1.",
      },
      {
        type: "spoiler",
        title: "Gramatika — proveri se",
        items: [
          { question: "Kako se gradi Perfekt pravilnih glagola?", answer: "ge- + osnova + -t (npr. gemacht, gelernt, gekauft)" },
          { question: "Koji glagoli grade Perfekt sa sein?", answer: "Glagoli kretanja (fahren, gehen, fliegen) i promene stanja (aufstehen, einschlafen) + bleiben, passieren" },
          { question: "Koja je razlika izmedju weil i denn?", answer: "Oba znace 'jer', ali posle weil glagol ide na kraj, a posle denn normalan red reci." },
          { question: "Sta su Wechselprapositionen?", answer: "9 predloga: in, an, auf, unter, uber, vor, hinter, neben, zwischen. Wo? = Dativ, Wohin? = Akkusativ." },
          { question: "Kako se menjaju refleksivne zamenice?", answer: "ich-mich, du-dich, er/sie/es-sich, wir-uns, ihr-euch, sie/Sie-sich" },
          { question: "Kako se grade modalni glagoli u proslosti?", answer: "Prateritum: konnte, durfte, musste, wollte, sollte" },
        ],
      },
      {
        type: "spoiler",
        title: "Vokabular — prevedi na nemacki",
        items: [
          { question: "samohrani roditelj", answer: "alleinerziehend" },
          { question: "kirija", answer: "die Miete" },
          { question: "sortirati smece", answer: "Mull trennen" },
          { question: "naruciiti u restoranu", answer: "bestellen" },
          { question: "radno iskustvo", answer: "die Berufserfahrung" },
          { question: "godisnji odmor", answer: "der Urlaub" },
          { question: "prijaviti se za posao", answer: "sich bewerben um" },
          { question: "skolski sistem", answer: "das Schulsystem" },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 24: Krimi roman za nivo A2 – Leseverstehen (text)
  // ────────────────────────────────────────────────────────────────
  24: {
    sections: [
      {
        type: "badge",
        module: "Bonus",
        category: "lesen",
      },
      {
        type: "text",
        style: "info",
        content:
          "Citaj **krimi pricu** na nivou A2 i odgovaraj na pitanja. Odlican nacin da vezbas razumevanje procitanog teksta!",
      },
      {
        type: "text",
        style: "default",
        content: "## Preporuka za citanje\n\nPogledaj video za preporuku krimi romana na nivou A2. Citanje je jedan od najboljih nacina da poboljsas nemacki — cak i kratke price pomazu!",
      },
      {
        type: "text",
        style: "uebung",
        content: "**Saveti za citanje na nemackom:**\n\n- Biraj knjige za nivo A2 (Leichte Lekture)\n- Ne prevodi svaku rec — pokusaj da razumes kontekst\n- Citaj naglas — pomaze izgovoru\n- Podvuci nove reci i dodaj ih u svoj recnik",
      },
      {
        type: "vocabulary",
        rows: [
          ["der Krimi", "kriminalisticka prica"],
          ["der Roman", "roman"],
          ["die Kurzgeschichte", "kratka prica"],
          ["lesen", "citati"],
          ["das Kapitel", "poglavlje"],
          ["die Handlung", "radnja"],
          ["der Tater", "pocinilac"],
          ["das Opfer", "zrtva"],
          ["der Detektiv", "detektiv"],
          ["der Verdachtige", "osumnjiceni"],
          ["spannend", "uzbudljivo / napeto"],
        ],
      },
    ],
  },
};

// ─── Import logic ─────────────────────────────────────────────

async function main() {
  console.log("Importing A2.1 sections...\n");

  // 1. Find the A2.1 course
  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .select("id, title")
    .eq("slug", COURSE_SLUG)
    .single();

  if (courseErr || !course) {
    console.error("Course not found:", courseErr?.message);
    return;
  }
  console.log(`Found course: ${course.title} (${course.id})\n`);

  // 2. Get all lessons for this course
  const { data: lessons, error: lessonsErr } = await supabase
    .from("lessons")
    .select("id, title, order_index, sections")
    .eq("course_id", course.id)
    .order("order_index");

  if (lessonsErr || !lessons) {
    console.error("Lessons not found:", lessonsErr?.message);
    return;
  }
  console.log(`Found ${lessons.length} lessons\n`);

  // 3. Update sections for each lesson
  let updated = 0;
  let skipped = 0;

  for (const lesson of lessons) {
    const sectionData = LESSON_SECTIONS[lesson.order_index];

    if (!sectionData) {
      console.log(`  SKIP: [${lesson.order_index}] ${lesson.title} — no section data`);
      skipped++;
      continue;
    }

    // Skip if already has rich sections (more than 5 = already populated)
    const existing = lesson.sections as unknown[];
    if (existing && existing.length > 5) {
      console.log(`  SKIP: [${lesson.order_index}] ${lesson.title} — already has ${existing.length} sections`);
      skipped++;
      continue;
    }

    const { error: updateErr } = await supabase
      .from("lessons")
      .update({ sections: sectionData.sections })
      .eq("id", lesson.id);

    if (updateErr) {
      console.error(`  ERROR: [${lesson.order_index}] ${lesson.title}: ${updateErr.message}`);
    } else {
      console.log(`  OK: [${lesson.order_index}] ${lesson.title} — ${sectionData.sections.length} sections`);
      updated++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch(console.error);
