/**
 * Import B1.1 lesson sections (rich content) — Moduli 1-7
 * Run: npx tsx scripts/import-b11-sections.ts
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

const COURSE_SLUG = "nemacki-b1-1";

// ─── Section data for each lesson (by order_index) ───

const LESSON_SECTIONS: Record<number, { sections: unknown[] }> = {
  // ────────────────────────────────────────────────────────────────
  // "Rotkäppchen und das Präteritum" — order_index 1
  // ────────────────────────────────────────────────────────────────
  1: {
    sections: [
      {
        type: "badge",
        module: "Modul 1",
      },
      {
        type: "video",
        vimeoId: "1057518453",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji učiš **Präteritum** — prošlo vreme koje se koristi u pričama i pisanom jeziku. Čitaš bajku o Crvenkapici i vežbaš nepravilne glagole.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Präteritum — prošlo vreme za pripovedanje\n\nPräteritum se koristi u pričama, bajkama, vestima i pisanom jeziku. U svakodnevnom razgovoru koristimo Perfekt.",
      },
      {
        type: "formula",
        content: "Pravilni glagoli: Stamm + -te\nmachen → machte\nleben → lebte\narbeiten → arbeitete",
      },
      {
        type: "formula",
        content: "Nepravilni glagoli: menjaju vokal\ngehen → ging\nkommen → kam\nsehen → sah\nlesen → las\nschreiben → schrieb",
      },
      {
        type: "table",
        headers: ["Infinitiv", "Präteritum", "Značenje"],
        rows: [
          ["gehen", "ging", "ići"],
          ["kommen", "kam", "doći"],
          ["sehen", "sah", "videti"],
          ["lesen", "las", "čitati"],
          ["essen", "aß", "jesti"],
          ["trinken", "trank", "piti"],
          ["schlafen", "schlief", "spavati"],
          ["sprechen", "sprach", "govoriti"],
          ["nehmen", "nahm", "uzeti"],
          ["laufen", "lief", "trčati"],
          ["rufen", "rief", "zvati"],
          ["fallen", "fiel", "pasti"],
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — Präteritum",
        items: [
          {
            question: "Es war einmal ein Mädchen. Es ______ (gehen) in den Wald.",
            answer: "ging",
          },
          {
            question: "Der Wolf ______ (kommen) zum Haus der Großmutter.",
            answer: "kam",
          },
          {
            question: "Rotkäppchen ______ (sehen) die großen Augen.",
            answer: "sah",
          },
          {
            question: "Die Großmutter ______ (lesen) ein Buch.",
            answer: "las",
          },
          {
            question: "Der Jäger ______ (rufen) laut um Hilfe.",
            answer: "rief",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "gehen", back: "ging" },
          { front: "kommen", back: "kam" },
          { front: "sehen", back: "sah" },
          { front: "essen", back: "aß" },
          { front: "trinken", back: "trank" },
          { front: "schlafen", back: "schlief" },
          { front: "sprechen", back: "sprach" },
          { front: "nehmen", back: "nahm" },
          { front: "laufen", back: "lief" },
          { front: "rufen", back: "rief" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["der Wald", "šuma"],
          ["der Wolf", "vuk"],
          ["die Großmutter", "baka"],
          ["der Jäger", "lovac"],
          ["der Korb", "korpa"],
          ["der Kuchen", "kolač"],
          ["das Bett", "krevet"],
          ["die Blume", "cvet"],
          ["der Bauch", "stomak"],
          ["die Schere", "makaze"],
          ["der Stein", "kamen"],
          ["fressen", "žderati"],
          ["schreien", "vikati"],
          ["aufmachen", "otvoriti"],
          ["sich fürchten", "plašiti se"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Als oder wenn" — order_index 2
  // ────────────────────────────────────────────────────────────────
  2: {
    sections: [
      {
        type: "badge",
        module: "Modul 1",
      },
      {
        type: "video",
        vimeoId: "1057534991",
      },
      {
        type: "text",
        style: "info",
        content:
          "Kad koristimo **als**, a kad **wenn**? I šta je sa **wann**? U ovoj lekciji naučićeš pravila i vežbaćeš kroz primere.",
      },
      {
        type: "formula",
        content: "**als** = jednom u prošlosti\nAls ich ein Kind **war**, spielte ich oft draußen.",
      },
      {
        type: "formula",
        content: "**wenn** = uvek kad (ponavljanje) / u sadašnjosti / u budućnosti\nWenn es regnet, bleibe ich zu Hause.\nImmer wenn ich ihn **sah**, lachte er.",
      },
      {
        type: "formula",
        content: "**wann** = upitna reč\nWann kommst du? — Ich weiß nicht, wann er kommt.",
      },
      {
        type: "table",
        headers: ["Veznik", "Upotreba", "Primer"],
        rows: [
          ["als", "jednom u prošlosti", "Als ich 10 war, lebte ich in Belgrad."],
          ["wenn", "ponavljanje ili sadašnjost-budućnost", "Wenn ich müde bin, trinke ich Kaffee."],
          ["wenn (prošlost)", "ponavljanje u prošlosti (= immer wenn)", "Immer wenn es regnete, blieb ich zu Hause."],
          ["wann", "upitno (direkt ili indirekt)", "Wann hast du Geburtstag?"],
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — als oder wenn?",
        items: [
          {
            question: "______ ich klein war, hatte ich einen Hund.",
            answer: "Als",
          },
          {
            question: "______ ich nach Hause komme, rufe ich dich an.",
            answer: "Wenn",
          },
          {
            question: "______ es im Winter schneite, bauten wir einen Schneemann.",
            answer: "Wenn (Immer wenn)",
          },
          {
            question: "______ ich 18 wurde, machte ich den Führerschein.",
            answer: "Als",
          },
          {
            question: "______ beginnt der Film?",
            answer: "Wann",
          },
          {
            question: "______ ich in Deutschland ankam, sprach ich kein Deutsch.",
            answer: "Als",
          },
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Plusquamperfekt — radnja pre druge radnje u prošlosti",
      },
      {
        type: "formula",
        content: "hatte / war + Partizip II\nIch **hatte** schon **gegessen**, als er kam.\nZwar **hatte** ich viel **trainiert**, aber fit **war** ich noch nicht.",
      },
      {
        type: "table",
        headers: ["Rečenica", "Prevod"],
        rows: [
          [
            "Nachdem ich gefrühstückt **hatte**, ging ich zur Arbeit.",
            "Pošto sam doručkovao, otišao sam na posao.",
          ],
          [
            "Als er **angekommen war**, rief er mich an.",
            "Kad je stigao, pozvao me je.",
          ],
          [
            "Ich **hatte** das Buch schon **gelesen**, bevor der Film kam.",
            "Već sam pročitao knjigu pre nego što je film izašao.",
          ],
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — Plusquamperfekt",
        items: [
          {
            question: "Nachdem ich die Hausaufgaben ______ ______ (machen), ging ich raus.",
            answer: "gemacht hatte",
          },
          {
            question: "Als der Bus ______ ______ (abfahren), kam sie endlich.",
            answer: "abgefahren war",
          },
          {
            question: "Ich ______ schon ______ (essen), als er mich zum Essen einlud.",
            answer: "hatte ... gegessen",
          },
          {
            question: "Nachdem sie ______ ______ (ankommen), rief sie ihre Mutter an.",
            answer: "angekommen war",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "Als ich ein Kind war...", back: "Kad sam bio dete..." },
          { front: "Wenn es regnet...", back: "Kad pada kiša..." },
          { front: "Als ich nach Deutschland kam...", back: "Kad sam došao u Nemačku..." },
          { front: "Wenn ich Zeit habe...", back: "Kad imam vremena..." },
          { front: "Immer wenn sie lachte...", back: "Svaki put kad bi se smejala..." },
          { front: "Als ich die Prüfung bestand...", back: "Kad sam položio ispit..." },
          { front: "Wenn du willst...", back: "Ako hoćeš..." },
          { front: "Wann kommst du?", back: "Kada dolaziš?" },
          { front: "Als wir uns trafen...", back: "Kad smo se sreli..." },
          { front: "Wenn ich groß bin...", back: "Kad porastem..." },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Kindheit", "detinjstvo"],
          ["die Erinnerung", "sećanje"],
          ["die Vergangenheit", "prošlost"],
          ["damals", "tada"],
          ["früher", "ranije"],
          ["plötzlich", "odjednom"],
          ["nachdem", "pošto"],
          ["bevor", "pre nego što"],
          ["immer wenn", "svaki put kad"],
          ["sobald", "čim"],
          ["seitdem", "od tada"],
          ["inzwischen", "u međuvremenu"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Glück" — order_index 3
  // ────────────────────────────────────────────────────────────────
  3: {
    sections: [
      {
        type: "badge",
        module: "Modul 1",
      },
      {
        type: "video",
        vimeoId: "1057560054",
      },
      {
        type: "text",
        style: "info",
        content:
          "Šta te čini srećnim? U ovoj lekciji razgovaramo o sreći, čitamo tekst o simbolima sreće u Nemačkoj i vežbamo vokabular.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Glücksbringer in Deutschland\n\nU Nemačkoj postoje tradicionalni simboli sreće. Često se poklanjaju za Novu godinu.",
      },
      {
        type: "table",
        headers: ["Symbol", "Na nemačkom", "Zašto donosi sreću?"],
        rows: [
          ["🍀", "das vierblättrige Kleeblatt", "Redak je — ko ga nađe, ima sreće"],
          ["🐞", "der Marienkäfer", "U srednjem veku smatran Božjim poslanikom"],
          ["🧹", "der Schornsteinfeger", "Čistač dimnjaka — kad ga vidiš, poželi želju"],
          ["🐷", "das Schwein", "\"Schwein haben\" = imati sreće"],
          ["🧲", "das Hufeisen", "Štiti kuću od zlih duhova"],
          ["🍄", "der Fliegenpilz", "Crvena muhara — simbol sreće na čestitkama"],
        ],
      },
      {
        type: "spoiler",
        title: "Leseverstehen — pitanja",
        items: [
          {
            question: "Šta znači 'Schwein haben' na nemačkom?",
            answer: "Imati sreće",
          },
          {
            question: "Ko je der Schornsteinfeger?",
            answer: "Čistač dimnjaka — tradicionalni simbol sreće",
          },
          {
            question: "Zašto je vierblättriges Kleeblatt simbol sreće?",
            answer: "Jer je retko — većina detelina ima samo 3 lista",
          },
          {
            question: "Kada se u Nemačkoj poklanjaju Glücksbringer?",
            answer: "Za Novu godinu (Silvester)",
          },
          {
            question: "Koji simbol sreće je zapravo otrovna gljiva?",
            answer: "Der Fliegenpilz (muhara)",
          },
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Konverzacija — Was macht dich glücklich?",
      },
      {
        type: "spoiler",
        title: "Pitanja za razgovor",
        items: [
          {
            question: "Was macht dich glücklich?",
            answer: "Odgovori slobodno: Familie, Freunde, Reisen, Musik...",
          },
          {
            question: "Hast du einen Glücksbringer?",
            answer: "Npr. Ja, ich habe... / Nein, ich glaube nicht an Glücksbringer.",
          },
          {
            question: "Was war der glücklichste Tag in deinem Leben?",
            answer: "Npr. Als ich... (koristi als!)",
          },
          {
            question: "Glaubst du an Glück oder an harte Arbeit?",
            answer: "Npr. Ich glaube, dass...",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "das Glück", back: "sreća" },
          { front: "glücklich", back: "srećan" },
          { front: "zufrieden", back: "zadovoljan" },
          { front: "der Zufall", back: "slučaj" },
          { front: "der Wunsch", back: "želja" },
          { front: "sich freuen", back: "radovati se" },
          { front: "genießen", back: "uživati" },
          { front: "dankbar", back: "zahvalan" },
          { front: "der Glücksbringer", back: "simbol sreće" },
          { front: "Schwein haben", back: "imati sreće" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["das Glück", "sreća"],
          ["das Pech", "peh"],
          ["glücklich", "srećan"],
          ["traurig", "tužan"],
          ["zufrieden", "zadovoljan"],
          ["der Wunsch", "želja"],
          ["der Zufall", "slučaj"],
          ["der Glücksbringer", "simbol sreće"],
          ["das Kleeblatt", "detelina"],
          ["der Schornsteinfeger", "čistač dimnjaka"],
          ["das Hufeisen", "potkovica"],
          ["sich freuen über", "radovati se nečemu"],
          ["genießen", "uživati"],
          ["dankbar sein", "biti zahvalan"],
          ["Schwein haben", "imati sreće (idiom)"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Schreiben B1 — E-Mail an einen Freund" — order_index 4
  // ────────────────────────────────────────────────────────────────
  4: {
    sections: [
      {
        type: "badge",
        module: "Modul 1",
      },
      {
        type: "text",
        style: "info",
        content:
          "Schreiben Teil 1 — pisanje neformalne e-pošte na ispitu B1. Imaš 20 minuta i treba da napišeš oko 80 reči.",
      },
      {
        type: "text",
        style: "default",
        content: "## Struktura neformalne e-pošte",
      },
      {
        type: "table",
        headers: ["Deo pisma", "Primeri fraza"],
        rows: [
          ["Anrede", "Lieber Carsten, · Liebe Anna,"],
          ["Einleitung", "Ich habe gehört, dass... · Es tut mir leid, dass... · Wie geht es dir?"],
          ["Hauptteil", "Ich möchte dir erzählen, dass... · Stell dir vor, ... · Hast du Lust, ...?"],
          ["Vorschlag", "Wollen wir zusammen...? · Wie wäre es, wenn wir...? · Ich schlage vor, dass..."],
          ["Schluss", "Ich freue mich auf deine Antwort! · Schreib mir bald! · Bis bald! · Liebe Grüße, [Name]"],
        ],
      },
      {
        type: "text",
        style: "uebung",
        content: "## Aufgabe — Schreiben Teil 1",
      },
      {
        type: "text",
        style: "default",
        content:
          "Ihr Freund Carsten liegt im Krankenhaus, weil er sich bei einem Unfall das rechte Bein gebrochen hat. Sie haben ihn gestern besucht und schreiben einem Freund / einer Freundin, der/die Carsten auch kennt.\n\n- Beschreiben Sie: Wie geht es Carsten?\n- Begründen Sie: Was braucht er in seiner Situation?\n- Machen Sie einen Vorschlag für einen gemeinsamen Besuch.\n\nSchreiben Sie eine E-Mail (ca. 80 Wörter).",
      },
      {
        type: "spoiler",
        title: "Korisne fraze za ovaj zadatak",
        items: [
          {
            question: "Kako opisati stanje?",
            answer: "Es geht ihm (nicht so) gut. · Er hat sich das Bein gebrochen. · Er muss noch ein paar Tage im Krankenhaus bleiben.",
          },
          {
            question: "Šta mu treba?",
            answer: "Er braucht... · Es wäre schön, wenn... · Am besten bringen wir ihm... mit.",
          },
          {
            question: "Predlog za posetu?",
            answer: "Wollen wir ihn zusammen besuchen? · Wie wäre es am Samstag? · Hast du am Wochenende Zeit?",
          },
          {
            question: "Kako početi pismo?",
            answer: "Liebe/r [Name], ich schreibe dir, weil ich dir etwas erzählen möchte.",
          },
          {
            question: "Kako završiti?",
            answer: "Schreib mir, ob du Zeit hast! Liebe Grüße, [tvoje ime]",
          },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die E-Mail", "imejl"],
          ["der Unfall", "nesreća"],
          ["das Krankenhaus", "bolnica"],
          ["sich das Bein brechen", "slomiti nogu"],
          ["besuchen", "posetiti"],
          ["der Vorschlag", "predlog"],
          ["sich freuen auf", "radovati se (nečemu)"],
          ["Bescheid geben", "javiti"],
          ["Liebe Grüße", "Srdačan pozdrav"],
          ["Gute Besserung!", "Brzo ozdravljenje!"],
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // MODUL 2: Unterhaltung
  // ════════════════════════════════════════════════════════════════

  // ────────────────────────────────────────────────────────────────
  // "Relativne rečenice" — order_index 5
  // ────────────────────────────────────────────────────────────────
  5: {
    sections: [
      {
        type: "badge",
        module: "Modul 2",
      },
      {
        type: "video",
        vimeoId: "1176551429",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji učiš **relativne rečenice** — kako da opišeš stvari i ljude preciznije. Takođe upoznaješ **Gradpartikeln** — reči koje pojačavaju ili ublažavaju tvoj utisak.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Relativpronomen — relativne zamenice\n\nRelativne rečenice opisuju imenicu bliže. Počinju relativnom zamenicom i glagol ide na kraj.",
      },
      {
        type: "formula",
        content:
          "Der Film, **DER** mir gefällt, läuft im Kino.\nDie Serie, **DIE** ich sehe, ist spannend.\nDas Buch, **DAS** ich lese, ist interessant.",
      },
      {
        type: "table",
        headers: ["Padež", "Maskulin", "Feminin", "Neutral", "Plural"],
        rows: [
          ["Nominativ", "der", "die", "das", "die"],
          ["Akkusativ", "den", "die", "das", "die"],
          ["Dativ", "dem", "der", "dem", "denen"],
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "## Kako odrediti padež relativne zamenice?\n\nPadež zavisi od funkcije u relativnoj rečenici, **ne** od glavne rečenice.",
      },
      {
        type: "formula",
        content:
          "Nominativ — zamenica je SUBJEKAT relativne rečenice:\nDer Mann, **DER** dort steht, ist mein Lehrer.\n\nAkkusativ — zamenica je OBJEKAT:\nDer Film, **DEN** ich gesehen habe, war toll.\n\nDativ — uz glagol sa dativom:\nDie Frau, **DER** ich geholfen habe, war nett.",
      },
      {
        type: "table",
        headers: ["Primer", "Padež", "Objašnjenje"],
        rows: [
          [
            "Der Film, DEN ich gesehen habe, war toll.",
            "Akkusativ",
            "ich habe den Film gesehen → DEN",
          ],
          [
            "Die Serie, DIE gerade läuft, ist spannend.",
            "Nominativ",
            "die Serie läuft → DIE",
          ],
          [
            "Das Kind, DEM ich das Buch gegeben habe, war glücklich.",
            "Dativ",
            "ich habe dem Kind gegeben → DEM",
          ],
          [
            "Die Leute, DENEN ich vertraue, sind meine Freunde.",
            "Dativ (Pl.)",
            "ich vertraue den Leuten → DENEN",
          ],
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "## Gradpartikeln — reči za pojačavanje i ublažavanje\n\nOve reči stavljaš ispred prideva da izraziš stepen.",
      },
      {
        type: "table",
        headers: ["Gradpartikel", "Značenje", "Primer"],
        rows: [
          ["echt", "stvarno", "Der Film war echt gut."],
          ["ziemlich", "prilično", "Das Buch war ziemlich langweilig."],
          ["total", "totalno", "Die Party war total lustig."],
          ["wirklich", "zaista", "Das Essen war wirklich lecker."],
          ["ganz schön", "baš (jače)", "Die Prüfung war ganz schön schwer."],
          ["besonders", "posebno", "Das finde ich besonders interessant."],
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — Relativpronomen",
        items: [
          {
            question:
              "Der Mann, ______ (Nom., m.) dort steht, ist mein Nachbar.",
            answer: "der",
          },
          {
            question:
              "Die Lehrerin, ______ (Akk., f.) ich hatte, war sehr nett.",
            answer: "die",
          },
          {
            question:
              "Das Auto, ______ (Nom., n.) vor dem Haus steht, gehört mir.",
            answer: "das",
          },
          {
            question:
              "Der Freund, ______ (Dat., m.) ich geschrieben habe, lebt in Berlin.",
            answer: "dem",
          },
          {
            question:
              "Die Kinder, ______ (Dat., Pl.) ich helfe, lernen schnell.",
            answer: "denen",
          },
          {
            question:
              "Die Pizza, ______ (Akk., f.) ich bestellt habe, war lecker.",
            answer: "die",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          {
            front: "Der Film, _____ mir gefällt, ... (m. Nom.)",
            back: "der",
          },
          {
            front: "Die Serie, _____ ich sehe, ... (f. Akk.)",
            back: "die",
          },
          {
            front: "Das Buch, _____ ich lese, ... (n. Akk.)",
            back: "das",
          },
          {
            front: "Der Mann, _____ ich geholfen habe, ... (m. Dat.)",
            back: "dem",
          },
          {
            front: "Die Leute, _____ ich vertraue, ... (Pl. Dat.)",
            back: "denen",
          },
          { front: "echt", back: "stvarno" },
          { front: "ziemlich", back: "prilično" },
          { front: "total", back: "totalno" },
          { front: "wirklich", back: "zaista" },
          { front: "ganz schön", back: "baš (pojačano)" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["der Film", "film"],
          ["die Serie", "serija"],
          ["die Sendung", "emisija"],
          ["die Folge", "epizoda"],
          ["der Schauspieler", "glumac"],
          ["die Schauspielerin", "glumica"],
          ["die Handlung", "radnja"],
          ["die Hauptrolle", "glavna uloga"],
          ["empfehlen", "preporučiti"],
          ["unterhalten", "zabavljati"],
          ["spannend", "napeto"],
          ["lustig", "smešno"],
          ["gruselig", "jezivo"],
          ["langweilig", "dosadno"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Obwohl vs. weil" — order_index 6
  // ────────────────────────────────────────────────────────────────
  6: {
    sections: [
      {
        type: "badge",
        module: "Modul 2",
      },
      {
        type: "youtube",
        videoId: "xDGG8u0v7zo",
      },
      {
        type: "text",
        style: "info",
        content:
          "Kada koristimo **weil** (jer), a kada **obwohl** (iako)? U ovoj lekciji razlikuješ ove veznike i ponavljaš red reči u zavisnim rečenicama.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Nebensätze — zavisne rečenice\n\nU svim zavisnim rečenicama glagol ide na **kraj**. Ovo važi za dass, weil, wenn, als, obwohl...",
      },
      {
        type: "table",
        headers: ["Veznik", "Značenje", "Glagol"],
        rows: [
          ["dass", "da", "na kraju"],
          ["weil", "jer", "na kraju"],
          ["wenn", "kad / ako", "na kraju"],
          ["als", "kad (jednom u prošlosti)", "na kraju"],
          ["obwohl", "iako", "na kraju"],
        ],
      },
      {
        type: "formula",
        content:
          "**weil** = razlog, uzrok (jer)\nIch bleibe zu Hause, **weil** ich krank **bin**.\n\n**obwohl** = suprotnost, kontrast (iako)\nIch gehe zur Arbeit, **obwohl** ich krank **bin**.",
      },
      {
        type: "table",
        headers: ["weil (jer)", "obwohl (iako)"],
        rows: [
          [
            "Ich lerne Deutsch, weil ich in Deutschland arbeite.",
            "Ich lerne Deutsch, obwohl es schwer ist.",
          ],
          [
            "Er ist müde, weil er wenig geschlafen hat.",
            "Er geht joggen, obwohl er müde ist.",
          ],
          [
            "Sie isst nichts, weil sie keinen Hunger hat.",
            "Sie isst Kuchen, obwohl sie keinen Hunger hat.",
          ],
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — weil oder obwohl?",
        items: [
          {
            question:
              "Ich bleibe zu Hause, ______ ich Fieber habe. (Razlog: imam temperaturu)",
            answer: "weil",
          },
          {
            question:
              "Sie geht joggen, ______ es regnet. (Kontrast: pada kiša, ali ona trči)",
            answer: "obwohl",
          },
          {
            question:
              "Er lernt Deutsch, ______ er in Berlin lebt. (Razlog: živi u Berlinu)",
            answer: "weil",
          },
          {
            question:
              "Ich kaufe das Kleid, ______ es teuer ist. (Kontrast: skupo je, ali ga kupujem)",
            answer: "obwohl",
          },
          {
            question:
              "Wir fahren mit dem Fahrrad, ______ es gesund ist. (Razlog: zdravo je)",
            answer: "weil",
          },
          {
            question:
              "Er isst den Kuchen, ______ er auf Diät ist. (Kontrast: na dijeti je, ali jede tortu)",
            answer: "obwohl",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "weil", back: "jer (razlog)" },
          { front: "obwohl", back: "iako (kontrast)" },
          {
            front: "Ich lerne Deutsch, weil...",
            back: "Učim nemački jer...",
          },
          {
            front: "Ich gehe raus, obwohl...",
            back: "Izlazim napolje, iako...",
          },
          { front: "dass", back: "da" },
          { front: "wenn", back: "kad / ako" },
          { front: "als", back: "kad (jednom, prošlost)" },
          { front: "damit", back: "da bi" },
          {
            front: "Glagol u Nebensatz?",
            back: "Na KRAJU rečenice!",
          },
          {
            front: "trotzdem (za poredjenje sa obwohl)",
            back: "ipak (ali u glavnoj rečenici, glagol na 2. mestu)",
          },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["der Grund", "razlog"],
          ["der Gegensatz", "suprotnost"],
          ["die Meinung", "mišljenje"],
          ["trotzdem", "ipak"],
          ["deshalb", "zato"],
          ["deswegen", "zbog toga"],
          ["außerdem", "osim toga"],
          ["allerdings", "doduše"],
          ["obwohl", "iako"],
          ["weil", "jer"],
          ["stimmen", "biti tačno"],
          ["sich einig sein", "biti saglasan"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Filme und Serien" — order_index 7
  // ────────────────────────────────────────────────────────────────
  7: {
    sections: [
      {
        type: "badge",
        module: "Modul 2",
      },
      {
        type: "youtube",
        videoId: "S0ZcETZ0Oeg",
      },
      {
        type: "text",
        style: "info",
        content:
          "Koji filmski žanrovi postoje? Kako da kažeš da ti se film dopao ili nije? U ovoj lekciji učiš vokabular o filmovima i serijama i vežbaš da izraziš mišljenje.",
      },
      {
        type: "text",
        style: "default",
        content: "## Filmgenres — filmski žanrovi",
      },
      {
        type: "table",
        headers: ["Na nemačkom", "Na srpskom", "Primer"],
        rows: [
          ["die Komödie", "komedija", "Fack ju Göhte"],
          ["der Thriller", "triler", "Das Leben der Anderen"],
          ["der Krimi", "krimić", "Tatort"],
          ["die Dokumentation (Doku)", "dokumentarac", "Planet Erde"],
          ["der Horrorfilm", "horor", "Nosferatu"],
          ["die Liebesgeschichte", "ljubavna priča", "Das Parfum"],
          ["der Zeichentrickfilm", "crtani film", "Die Biene Maja"],
          ["die Serie", "serija", "Dark"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Meinung äußern — kako izraziti mišljenje o filmu",
      },
      {
        type: "table",
        headers: ["Pozitivno", "Negativno"],
        rows: [
          ["Der Film war toll!", "Der Film war schlecht."],
          ["Die Serie ist spannend.", "Die Serie ist langweilig."],
          ["Ich finde den Film lustig.", "Ich finde den Film schrecklich."],
          ["Die Handlung war interessant.", "Die Handlung war vorhersehbar."],
          ["Die Schauspieler waren super.", "Die Schauspieler waren schwach."],
          ["Ich kann die Serie empfehlen.", "Ich kann den Film nicht empfehlen."],
        ],
      },
      {
        type: "text",
        style: "uebung",
        content: "## DW vežba — In der Filmbranche",
      },
      {
        type: "link",
        linkType: "dw",
        href: "https://learngerman.dw.com/de/in-der-filmbranche/l-40601058/e-40601322",
        label: "DW: In der Filmbranche — vežba",
      },
      {
        type: "spoiler",
        title: "Mini vežba — Filmgenres und Meinungen",
        items: [
          {
            question: "Wie heißt ein Film, der lustig ist? (Žanr)",
            answer: "die Komödie",
          },
          {
            question: "Kako kažeš da ti se serija sviđa?",
            answer: "Die Serie ist toll / spannend / interessant. Ich kann sie empfehlen.",
          },
          {
            question: "Koji žanr je Tatort?",
            answer: "der Krimi",
          },
          {
            question: "Kako kažeš 'crtani film' na nemačkom?",
            answer: "der Zeichentrickfilm",
          },
          {
            question: "Kako kažeš da je film bio dosadan?",
            answer: "Der Film war langweilig. / Ich finde den Film langweilig.",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "die Komödie", back: "komedija" },
          { front: "der Thriller", back: "triler" },
          { front: "der Krimi", back: "krimić" },
          { front: "die Dokumentation", back: "dokumentarac" },
          { front: "der Horrorfilm", back: "horor" },
          { front: "die Liebesgeschichte", back: "ljubavna priča" },
          { front: "der Zeichentrickfilm", back: "crtani film" },
          { front: "spannend", back: "napeto, uzbudljivo" },
          { front: "langweilig", back: "dosadno" },
          { front: "empfehlen", back: "preporučiti" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Komödie", "komedija"],
          ["der Thriller", "triler"],
          ["der Krimi", "krimić"],
          ["die Dokumentation", "dokumentarac"],
          ["der Horrorfilm", "horor"],
          ["die Liebesgeschichte", "ljubavna priča"],
          ["der Zeichentrickfilm", "crtani film"],
          ["die Handlung", "radnja (filma)"],
          ["der Regisseur", "režiser"],
          ["die Untertitel", "titlovi"],
          ["toll", "sjajno"],
          ["spannend", "napeto"],
          ["langweilig", "dosadno"],
          ["schrecklich", "užasno"],
          ["vorhersehbar", "predvidljivo"],
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // MODUL 3: Gesund bleiben
  // ════════════════════════════════════════════════════════════════

  // ────────────────────────────────────────────────────────────────
  // "Genitiv" — order_index 8
  // ────────────────────────────────────────────────────────────────
  8: {
    sections: [
      {
        type: "badge",
        module: "Modul 3",
      },
      {
        type: "video",
        vimeoId: "1014399156",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji učiš **Genitiv** — četvrti padež u nemačkom jeziku. Koristi se za izražavanje pripadanja i sa nekim predlozima kao **wegen**.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Četiri padeža — pregled\n\nNemački ima 4 padeža. Genitiv se koristi za pripadanje (čiji?) i sa određenim predlozima.",
      },
      {
        type: "table",
        headers: ["Padež", "Pitanje", "Maskulin", "Feminin", "Neutral", "Plural"],
        rows: [
          ["Nominativ", "Wer?", "der / ein", "die / eine", "das / ein", "die / –"],
          ["Genitiv", "Wessen?", "des / eines", "der / einer", "des / eines", "der / –"],
          ["Dativ", "Wem?", "dem / einem", "der / einer", "dem / einem", "den / –"],
          ["Akkusativ", "Wen?", "den / einen", "die / eine", "das / ein", "die / –"],
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "## Genitiv — pravila\n\nMaskulin i neutral: dodaješ **-s** ili **-es** na imenicu.\nFeminin i plural: samo se menja član.",
      },
      {
        type: "formula",
        content:
          "Maskulin: **des Arztes** (lekara), **des Mannes** (muškarca)\nFeminin: **der Frau** (žene), **der Ärztin** (lekarke)\nNeutral: **des Kindes** (deteta), **des Krankenhauses** (bolnice)\nPlural: **der Eltern** (roditelja), **der Patienten** (pacijenata)",
      },
      {
        type: "formula",
        content:
          "Jednosložne imenice: + **-es** → des Mann**es**, des Kind**es**\nVišesložne imenice: + **-s** → des Arzt**es**, des Krankenhaus**es**\nImenice na -s, -ß, -z, -x: uvek **-es** → des Haus**es**",
      },
      {
        type: "text",
        style: "default",
        content: "## wegen + Genitiv",
      },
      {
        type: "formula",
        content:
          "**wegen** = zbog\nwegen **des Wetters** — zbog vremena\nwegen **einer Krankheit** — zbog bolesti\nwegen **des Staus** — zbog gužve\nwegen **der Arbeit** — zbog posla",
      },
      {
        type: "table",
        headers: ["Sa Genitiv", "Prevod"],
        rows: [
          ["Das Auto des Nachbarn ist neu.", "Auto komšije je novo."],
          ["Die Meinung der Ärztin ist wichtig.", "Mišljenje lekarke je važno."],
          ["Das Spielzeug des Kindes liegt hier.", "Igračka deteta leži ovde."],
          ["Wegen des Regens bleibe ich zu Hause.", "Zbog kiše ostajem kući."],
          ["Trotz des schlechten Wetters gehen wir spazieren.", "Uprkos lošem vremenu idemo u šetnju."],
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — Genitiv",
        items: [
          {
            question: "Das ist das Auto ______ ______ (der Arzt).",
            answer: "des Arztes",
          },
          {
            question: "Die Tasche ______ ______ (die Lehrerin) ist schwarz.",
            answer: "der Lehrerin",
          },
          {
            question: "Das Zimmer ______ ______ (das Kind) ist groß.",
            answer: "des Kindes",
          },
          {
            question: "Wegen ______ ______ (der Regen) gehen wir nicht raus.",
            answer: "des Regens",
          },
          {
            question: "Die Meinung ______ ______ (die Eltern) ist mir wichtig.",
            answer: "der Eltern",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "des Mannes", back: "muškarca (Genitiv m.)" },
          { front: "der Frau", back: "žene (Genitiv f.)" },
          { front: "des Kindes", back: "deteta (Genitiv n.)" },
          { front: "der Eltern", back: "roditelja (Genitiv Pl.)" },
          { front: "wegen + Genitiv", back: "zbog" },
          { front: "trotz + Genitiv", back: "uprkos" },
          { front: "während + Genitiv", back: "tokom" },
          { front: "innerhalb + Genitiv", back: "unutar" },
          { front: "außerhalb + Genitiv", back: "izvan" },
          { front: "Wessen Auto ist das?", back: "Čije je to auto?" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["der Arzt / die Ärztin", "lekar / lekarka"],
          ["die Praxis", "ordinacija"],
          ["der Patient / die Patientin", "pacijent / pacijentkinja"],
          ["die Krankheit", "bolest"],
          ["die Gesundheit", "zdravlje"],
          ["die Untersuchung", "pregled"],
          ["das Rezept", "recept"],
          ["die Versicherung", "osiguranje"],
          ["wegen", "zbog"],
          ["trotz", "uprkos"],
          ["während", "tokom"],
          ["innerhalb", "unutar"],
          ["außerhalb", "izvan"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Pasiv prezenta sa modalnim glagolima" — order_index 9
  // ────────────────────────────────────────────────────────────────
  9: {
    sections: [
      {
        type: "badge",
        module: "Modul 3",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji učiš **Passiv Präsens** i kako se kombinuje sa **modalnim glagolima**. Pasiv koristimo kada je važnije ŠTA se radi nego KO to radi.",
      },
      {
        type: "text",
        style: "default",
        content: "## werden — konjugacija u prezentu",
      },
      {
        type: "table",
        headers: ["Lice", "werden"],
        rows: [
          ["ich", "werde"],
          ["du", "wirst"],
          ["er/sie/es", "wird"],
          ["wir", "werden"],
          ["ihr", "werdet"],
          ["sie/Sie", "werden"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Passiv Präsens — werden + Partizip II",
      },
      {
        type: "formula",
        content:
          "Aktiv: Die Schwester **putzt** die Praxis.\nPassiv: Die Praxis **wird** (von der Schwester) **geputzt**.\n\nAktiv: Man **untersucht** den Patienten.\nPassiv: Der Patient **wird untersucht**.",
      },
      {
        type: "text",
        style: "default",
        content: "## Passiv mit Modalverben — Modalverb + Partizip II + werden",
      },
      {
        type: "formula",
        content:
          "Aktiv: Man **muss** die Praxis **putzen**.\nPassiv: Die Praxis **muss geputzt werden**.\n\nAktiv: Man **kann** den Patienten **operieren**.\nPassiv: Der Patient **kann operiert werden**.\n\nAktiv: Man **soll** das Medikament **nehmen**.\nPassiv: Das Medikament **soll genommen werden**.",
      },
      {
        type: "table",
        headers: ["Aktiv", "Passiv"],
        rows: [
          [
            "Man putzt die Praxis jeden Tag.",
            "Die Praxis wird jeden Tag geputzt.",
          ],
          [
            "Man muss die Praxis jeden Tag putzen.",
            "Die Praxis muss jeden Tag geputzt werden.",
          ],
          [
            "Der Arzt untersucht den Patienten.",
            "Der Patient wird (vom Arzt) untersucht.",
          ],
          [
            "Man kann das Rezept online bestellen.",
            "Das Rezept kann online bestellt werden.",
          ],
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — Passiv bilden",
        items: [
          {
            question: "Aktiv: Man repariert das Auto. → Passiv?",
            answer: "Das Auto wird repariert.",
          },
          {
            question: "Aktiv: Man muss den Brief schreiben. → Passiv?",
            answer: "Der Brief muss geschrieben werden.",
          },
          {
            question: "Aktiv: Die Ärztin untersucht die Patientin. → Passiv?",
            answer: "Die Patientin wird (von der Ärztin) untersucht.",
          },
          {
            question: "Aktiv: Man kann das Medikament in der Apotheke kaufen. → Passiv?",
            answer: "Das Medikament kann in der Apotheke gekauft werden.",
          },
          {
            question: "Aktiv: Man soll die Tabletten dreimal täglich nehmen. → Passiv?",
            answer: "Die Tabletten sollen dreimal täglich genommen werden.",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "werden + Partizip II", back: "Passiv Präsens" },
          {
            front: "Modalverb + Partizip II + werden",
            back: "Passiv mit Modalverb",
          },
          { front: "Die Praxis wird geputzt.", back: "Ordinacija se čisti." },
          {
            front: "Der Patient muss untersucht werden.",
            back: "Pacijent mora biti pregledan.",
          },
          { front: "untersuchen", back: "pregledati" },
          { front: "behandeln", back: "lečiti" },
          { front: "operieren", back: "operisati" },
          { front: "verschreiben", back: "prepisati (lek)" },
          { front: "versorgen", back: "zbrinuti" },
          { front: "pflegen", back: "negovati" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Behandlung", "lečenje"],
          ["die Untersuchung", "pregled"],
          ["die Operation", "operacija"],
          ["das Medikament", "lek"],
          ["die Tablette", "tableta"],
          ["das Rezept", "recept"],
          ["die Apotheke", "apoteka"],
          ["die Sprechstunde", "ordinaciono vreme"],
          ["der Notfall", "hitan slučaj"],
          ["die Pflege", "nega"],
          ["verschreiben", "prepisati (lek)"],
          ["behandeln", "lečiti"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Profis gesucht: Krankenpfleger" — order_index 10
  // ────────────────────────────────────────────────────────────────
  10: {
    sections: [
      {
        type: "badge",
        module: "Modul 3",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji čitaš tekst sa DW o medicinskim profesijama i učiš vokabular iz oblasti medicine i nege.",
      },
      {
        type: "text",
        style: "uebung",
        content: "## DW vežba — Profis gesucht: Krankenpfleger",
      },
      {
        type: "link",
        linkType: "dw",
        href: "https://learngerman.dw.com/de/einstieg/l-40692770",
        label: "DW: Profis gesucht — Krankenpfleger",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Medizinischer Wortschatz\n\nU bolnici i ordinaciji ćeš čuti ove reči. Nauči ih da bi mogao/mogla da pratiš razgovore na nemačkom.",
      },
      {
        type: "table",
        headers: ["Na nemačkom", "Na srpskom", "Primer"],
        rows: [
          ["der Krankenpfleger", "medicinski tehničar", "Er arbeitet als Krankenpfleger."],
          ["die Krankenschwester", "medicinska sestra", "Die Krankenschwester misst den Blutdruck."],
          ["der Patient / die Patientin", "pacijent/kinja", "Der Patient wartet auf die Untersuchung."],
          ["die Untersuchung", "pregled", "Die Untersuchung dauert 30 Minuten."],
          ["die Behandlung", "lečenje", "Die Behandlung war erfolgreich."],
          ["die Diagnose", "dijagnoza", "Der Arzt stellt die Diagnose."],
          ["das Medikament", "lek", "Nehmen Sie dieses Medikament dreimal täglich."],
          ["die Pflege", "nega", "Die Pflege der Patienten ist wichtig."],
          ["die Dienstbesprechung", "radni sastanak", "Um 7 Uhr beginnt die Dienstbesprechung."],
          ["die Schicht", "smena", "Er arbeitet in der Nachtschicht."],
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — medizinischer Wortschatz",
        items: [
          {
            question: "Wie heißt die Person, die Patienten pflegt? (muški)",
            answer: "der Krankenpfleger",
          },
          {
            question: "Šta znači 'die Diagnose'?",
            answer: "dijagnoza — Der Arzt stellt die Diagnose.",
          },
          {
            question: "Kako se kaže 'smena' na nemačkom?",
            answer: "die Schicht (Nachtschicht = noćna smena, Frühschicht = jutarnja smena)",
          },
          {
            question: "Was macht ein Arzt zuerst? Untersuchung oder Behandlung?",
            answer: "Zuerst die Untersuchung, dann die Diagnose, dann die Behandlung.",
          },
          {
            question: "Kako kažeš 'radni sastanak'?",
            answer: "die Dienstbesprechung",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "der Krankenpfleger", back: "medicinski tehničar" },
          { front: "die Krankenschwester", back: "medicinska sestra" },
          { front: "die Diagnose", back: "dijagnoza" },
          { front: "die Behandlung", back: "lečenje" },
          { front: "die Pflege", back: "nega" },
          { front: "die Schicht", back: "smena" },
          { front: "der Blutdruck", back: "krvni pritisak" },
          { front: "die Dienstbesprechung", back: "radni sastanak" },
          { front: "die Spritze", back: "injekcija" },
          { front: "der Verband", back: "zavoj" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["der Krankenpfleger", "medicinski tehničar"],
          ["die Krankenschwester", "medicinska sestra"],
          ["der Patient", "pacijent"],
          ["die Untersuchung", "pregled"],
          ["die Behandlung", "lečenje"],
          ["die Diagnose", "dijagnoza"],
          ["das Medikament", "lek"],
          ["die Pflege", "nega"],
          ["die Dienstbesprechung", "radni sastanak"],
          ["die Schicht", "smena"],
          ["der Blutdruck", "krvni pritisak"],
          ["die Spritze", "injekcija"],
          ["der Verband", "zavoj"],
          ["der Rollstuhl", "invalidska kolica"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Blutgruppen — wichtige Entdeckung" — order_index 11
  // ────────────────────────────────────────────────────────────────
  11: {
    sections: [
      {
        type: "badge",
        module: "Modul 3",
      },
      {
        type: "text",
        style: "info",
        content:
          "Čitaš tekst o krvnim grupama sa Deutsche Welle i vežbaš razumevanje pročitanog teksta uz naučni vokabular.",
      },
      {
        type: "text",
        style: "uebung",
        content: "## DW vežba — Blutgruppen: wichtige Entdeckung in der Medizin",
      },
      {
        type: "link",
        linkType: "dw",
        href: "https://learngerman.dw.com/de/blutgruppen-wichtige-entdeckung-in-der-medizin/l-67844792",
        label: "DW: Blutgruppen — wichtige Entdeckung",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Wissenschaftlicher Wortschatz\n\nOve reči ćeš sresti u naučnim tekstovima o medicini.",
      },
      {
        type: "table",
        headers: ["Na nemačkom", "Na srpskom"],
        rows: [
          ["die Blutgruppe", "krvna grupa"],
          ["die Entdeckung", "otkriće"],
          ["die Forschung", "istraživanje"],
          ["der Wissenschaftler", "naučnik"],
          ["die Bluttransfusion", "transfuzija krvi"],
          ["das Blut", "krv"],
          ["die Zelle", "ćelija"],
          ["der Antikörper", "antitelo"],
          ["das Ergebnis", "rezultat"],
          ["die Studie", "studija"],
          ["entdecken", "otkriti"],
          ["forschen", "istraživati"],
        ],
      },
      {
        type: "spoiler",
        title: "Razumevanje teksta — pitanja",
        items: [
          {
            question: "Wer hat die Blutgruppen entdeckt?",
            answer: "Karl Landsteiner hat die Blutgruppen 1901 entdeckt.",
          },
          {
            question: "Warum sind Blutgruppen wichtig?",
            answer: "Sie sind wichtig für die Bluttransfusion — man kann nicht jedes Blut mischen.",
          },
          {
            question: "Welche Blutgruppen gibt es?",
            answer: "A, B, AB und 0 (Null).",
          },
          {
            question: "Was passiert, wenn man die falsche Blutgruppe bekommt?",
            answer: "Das kann lebensgefährlich sein — der Körper reagiert mit Antikörpern.",
          },
          {
            question: "Šta znači 'die Entdeckung'?",
            answer: "Otkriće — etwas Neues finden / herausfinden.",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "die Blutgruppe", back: "krvna grupa" },
          { front: "die Entdeckung", back: "otkriće" },
          { front: "die Forschung", back: "istraživanje" },
          { front: "der Wissenschaftler", back: "naučnik" },
          { front: "die Bluttransfusion", back: "transfuzija krvi" },
          { front: "die Zelle", back: "ćelija" },
          { front: "der Antikörper", back: "antitelo" },
          { front: "entdecken", back: "otkriti" },
          { front: "forschen", back: "istraživati" },
          { front: "lebensgefährlich", back: "opasno po život" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Blutgruppe", "krvna grupa"],
          ["die Entdeckung", "otkriće"],
          ["die Forschung", "istraživanje"],
          ["der Wissenschaftler", "naučnik"],
          ["die Bluttransfusion", "transfuzija krvi"],
          ["das Blut", "krv"],
          ["die Zelle", "ćelija"],
          ["der Antikörper", "antitelo"],
          ["das Ergebnis", "rezultat"],
          ["die Studie", "studija"],
          ["entdecken", "otkriti"],
          ["forschen", "istraživati"],
          ["lebensgefährlich", "opasno po život"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Pflegekrise — LV + Schreiben" — order_index 12
  // ────────────────────────────────────────────────────────────────
  12: {
    sections: [
      {
        type: "badge",
        module: "Modul 3",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji čitaš tekst o krizi u nezi starih u Nemačkoj i vežbaš pisanje — Schreiben B1: komentar u Gästebuch.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Leseverstehen — Pflegekrise in Deutschland\n\nIn Deutschland gibt es zu wenig Pflegekräfte. Viele alte Menschen brauchen Hilfe, aber es gibt nicht genug Personal in den Pflegeheimen. Die Arbeitsbedingungen sind oft schlecht: lange Arbeitszeiten, niedrige Gehälter und viel Stress. Deshalb entscheiden sich immer weniger junge Menschen für diesen Beruf.\n\nViele Familien stehen vor einer schwierigen Frage: Sollen sie ihre Eltern zu Hause pflegen oder in ein Altersheim bringen? Beides hat Vor- und Nachteile. Zu Hause fühlen sich die alten Menschen wohler, aber die Familie braucht viel Zeit und Energie. Im Altersheim gibt es professionelle Pflege, aber es ist teuer und manche Menschen fühlen sich dort einsam.\n\nDie Regierung versucht, die Situation zu verbessern. Es gibt Programme, um ausländische Pflegekräfte nach Deutschland zu holen. Auch die Gehälter sollen steigen. Aber viele Experten sagen: Das reicht nicht. Man muss den Beruf attraktiver machen.",
      },
      {
        type: "spoiler",
        title: "Leseverstehen — pitanja",
        items: [
          {
            question: "Was ist das Hauptproblem in der Pflege in Deutschland?",
            answer: "Es gibt zu wenig Pflegekräfte (Personal).",
          },
          {
            question: "Warum wollen wenige junge Menschen in der Pflege arbeiten?",
            answer: "Wegen schlechter Arbeitsbedingungen: lange Arbeitszeiten, niedrige Gehälter, viel Stress.",
          },
          {
            question: "Welche zwei Möglichkeiten haben Familien?",
            answer: "Zu Hause pflegen oder ins Altersheim bringen.",
          },
          {
            question: "Was macht die Regierung?",
            answer: "Sie holt ausländische Pflegekräfte und will die Gehälter erhöhen.",
          },
          {
            question: "Was sagen die Experten?",
            answer: "Das reicht nicht — man muss den Beruf attraktiver machen.",
          },
        ],
      },
      {
        type: "text",
        style: "uebung",
        content: "## Schreiben — Gertie's Gästebuch\n\nThema: **Zu Hause pflegen oder ins Altersheim?**",
      },
      {
        type: "text",
        style: "default",
        content:
          "Gertie schreibt in einem Internetforum:\n\n*Meine Mutter ist 82 und kann nicht mehr allein leben. Ich arbeite Vollzeit und kann mich nicht um sie kümmern. Mein Bruder sagt, wir sollen sie ins Altersheim bringen, aber ich habe ein schlechtes Gewissen. Was meint ihr?*\n\nSchreib einen Kommentar (ca. 80 Wörter):\n- Wie findest du Gerties Situation?\n- Was würdest du machen? Warum?\n- Was ist deine Meinung: Pflege zu Hause oder Altersheim?",
      },
      {
        type: "text",
        style: "default",
        content: "## Redemittel — Meinung äußern",
      },
      {
        type: "table",
        headers: ["Funkcija", "Fraze"],
        rows: [
          ["Mišljenje", "Ich finde, dass... / Meiner Meinung nach... / Ich bin der Meinung, dass..."],
          ["Saglasnost", "Da hast du recht. / Ich stimme dir zu. / Das sehe ich auch so."],
          ["Neslaganje", "Ich bin anderer Meinung. / Das sehe ich anders. / Ich glaube nicht, dass..."],
          ["Predlog", "Ich würde... / An deiner Stelle würde ich... / Vielleicht könntest du..."],
          ["Razlog", "Der Grund dafür ist... / Das liegt daran, dass... / Weil..."],
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "die Pflegekraft", back: "negovatelj/ica" },
          { front: "das Altersheim", back: "starački dom" },
          { front: "die Arbeitsbedingungen", back: "uslovi rada" },
          { front: "das Gehalt", back: "plata" },
          { front: "sich kümmern um", back: "brinuti se o" },
          { front: "Meiner Meinung nach...", back: "Po mom mišljenju..." },
          { front: "An deiner Stelle würde ich...", back: "Na tvom mestu bih..." },
          { front: "Ich stimme dir zu.", back: "Slažem se s tobom." },
          { front: "Das sehe ich anders.", back: "Ja to vidim drugačije." },
          { front: "ein schlechtes Gewissen haben", back: "imati grižu savesti" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Pflegekraft", "negovatelj/ica"],
          ["das Pflegeheim", "dom za negu"],
          ["das Altersheim", "starački dom"],
          ["die Arbeitsbedingungen", "uslovi rada"],
          ["das Gehalt", "plata"],
          ["der Stress", "stres"],
          ["sich kümmern um", "brinuti se o"],
          ["pflegen", "negovati"],
          ["einsam", "usamljen"],
          ["professionell", "profesionalan"],
          ["die Regierung", "vlada"],
          ["attraktiv", "privlačan"],
          ["das Gewissen", "savest"],
          ["verbessern", "poboljšati"],
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // MODUL 4: Sprachen
  // ════════════════════════════════════════════════════════════════

  // ────────────────────────────────────────────────────────────────
  // "Konjunktiv II — Irreale Wünsche" — order_index 13
  // ────────────────────────────────────────────────────────────────
  13: {
    sections: [
      {
        type: "badge",
        module: "Modul 4",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji učiš **Konjunktiv II** — oblik za nerealne želje, pristojne molbe i hipotetičke situacije. Najvažniji oblik za svakodnevnu komunikaciju!",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Konjunktiv II — najvažniji oblici\n\nNeke glagole koristimo u sopstvenom obliku Konjunktiva II, a za ostale koristimo **würde + Infinitiv**.",
      },
      {
        type: "table",
        headers: ["Infinitiv", "Konjunktiv II", "Prevod"],
        rows: [
          ["sein", "wäre", "bio bih"],
          ["haben", "hätte", "imao bih"],
          ["können", "könnte", "mogao bih"],
          ["müssen", "müsste", "morao bih"],
          ["dürfen", "dürfte", "smeo bih"],
          ["wissen", "wüsste", "znao bih"],
          ["sollen", "sollte", "trebalo bi"],
          ["wollen", "wollte", "hteo bih"],
        ],
      },
      {
        type: "formula",
        content:
          "Za sve ostale glagole:\n**würde + Infinitiv**\n\nich würde machen, du würdest machen, er würde machen...\n\nIch **würde** gern nach Berlin **reisen**.\nWir **würden** lieber zu Hause **bleiben**.",
      },
      {
        type: "text",
        style: "default",
        content: "## Wenn-Sätze — irealni uslov",
      },
      {
        type: "formula",
        content:
          "**Wenn** ich reich **wäre**, **würde** ich um die Welt **reisen**.\n**Wenn** ich mehr Zeit **hätte**, **würde** ich mehr Deutsch **lernen**.\n**Wenn** ich fliegen **könnte**, **würde** ich jeden Tag **fliegen**.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Kada koristiti wäre/hätte, a kada würde?\n\n- **wäre, hätte, könnte, müsste, dürfte, wüsste, sollte** → sopstveni oblici (uvek ih koristi)\n- **würde + Infinitiv** → za sve ostale glagole (spielen, lernen, reisen, arbeiten...)",
      },
      {
        type: "table",
        headers: ["Situacija", "Primer"],
        rows: [
          ["Nerealna želja", "Ich wäre gern berühmt. / Ich hätte gern ein Haus."],
          ["Pristojna molba", "Könnten Sie mir helfen? / Dürfte ich Sie etwas fragen?"],
          ["Savet", "An deiner Stelle würde ich mehr lernen."],
          ["Irealni uslov", "Wenn ich Zeit hätte, würde ich kommen."],
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — Konjunktiv II",
        items: [
          {
            question: "Wenn ich Geld ______ (haben), würde ich nach Japan reisen.",
            answer: "hätte",
          },
          {
            question: "Wenn sie Ärztin ______ (sein), würde sie Menschen helfen.",
            answer: "wäre",
          },
          {
            question: "______ (können) Sie mir bitte helfen?",
            answer: "Könnten",
          },
          {
            question: "Ich ______ (werden) gern in München leben.",
            answer: "würde",
          },
          {
            question: "______ (dürfen) ich Sie etwas fragen?",
            answer: "Dürfte",
          },
          {
            question: "An deiner Stelle ______ (werden) ich früher aufstehen.",
            answer: "würde",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "wäre", back: "bio bih (Konj. II von sein)" },
          { front: "hätte", back: "imao bih (Konj. II von haben)" },
          { front: "könnte", back: "mogao bih (Konj. II von können)" },
          { front: "müsste", back: "morao bih (Konj. II von müssen)" },
          { front: "dürfte", back: "smeo bih (Konj. II von dürfen)" },
          { front: "wüsste", back: "znao bih (Konj. II von wissen)" },
          { front: "würde + Infinitiv", back: "za sve ostale glagole" },
          { front: "Wenn ich reich wäre...", back: "Kad bih bio bogat..." },
          { front: "Könnten Sie mir helfen?", back: "Da li biste mogli da mi pomognete?" },
          { front: "An deiner Stelle würde ich...", back: "Na tvom mestu bih..." },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["der Wunsch", "želja"],
          ["die Möglichkeit", "mogućnost"],
          ["die Bitte", "molba"],
          ["der Rat / der Ratschlag", "savet"],
          ["die Bedingung", "uslov"],
          ["gern / lieber / am liebsten", "rado / radije / najradije"],
          ["vielleicht", "možda"],
          ["wahrscheinlich", "verovatno"],
          ["statt", "umesto"],
          ["falls", "u slučaju da"],
          ["sich vorstellen", "zamisliti"],
          ["sich wünschen", "poželeti"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Sprechblockaden? Nur Mut!" — order_index 14
  // ────────────────────────────────────────────────────────────────
  14: {
    sections: [
      {
        type: "badge",
        module: "Modul 4",
      },
      {
        type: "youtube",
        videoId: "BMADTPy8Za8",
      },
      {
        type: "text",
        style: "info",
        content:
          "Imaš blokadu kad treba da govoriš nemački? U ovoj lekciji učiš savete kako da prevaziđeš strah od govora i korisne fraze za pristojno traženje pomoći u razgovoru.",
      },
      {
        type: "text",
        style: "default",
        content: "## Tipps gegen Sprechblockaden",
      },
      {
        type: "table",
        headers: ["Savet", "Objašnjenje"],
        rows: [
          ["Prihvati greške", "Greške su normalne — niko ne govori savršeno!"],
          ["Govori polako", "Bolje polako i tačno nego brzo i pogrešno."],
          ["Koristi jednostavne rečenice", "Počni kratkim rečenicama, pa ih proširi."],
          ["Vežbaj svaki dan", "I 5 minuta dnevno pravi razliku."],
          ["Ne prevodi iz srpskog", "Razmišljaj direktno na nemačkom."],
          ["Pitaj kad ne razumeš", "Nema sramote u tome — čak i Nemci pitaju!"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Redemittel — höflich nachfragen\n\nKorisne fraze kada ne razumeš ili treba ti pomoć u razgovoru:",
      },
      {
        type: "table",
        headers: ["Situacija", "Fraza"],
        rows: [
          ["Nisam razumeo/la", "Entschuldigung, könnten Sie das bitte wiederholen?"],
          ["Šta znači ta reč?", "Was bedeutet...? / Wie meinen Sie das?"],
          ["Treba mi sekund", "Moment bitte, ich überlege kurz..."],
          ["Sporije, molim", "Könnten Sie bitte langsamer sprechen?"],
          ["Kako se to kaže?", "Wie sagt man... auf Deutsch?"],
          ["Da li je ovo tačno?", "Ist das richtig so? / Habe ich das richtig gesagt?"],
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — Situationen",
        items: [
          {
            question: "Na času nisi razumeo/la zadatak. Šta kažeš?",
            answer: "Entschuldigung, könnten Sie das bitte wiederholen? / Können Sie das bitte noch einmal erklären?",
          },
          {
            question: "Čuješ nepoznatu reč. Šta pitaš?",
            answer: "Was bedeutet...? / Ich kenne dieses Wort nicht. Was heißt das?",
          },
          {
            question: "Neko priča prebrzo. Šta kažeš?",
            answer: "Könnten Sie bitte langsamer sprechen?",
          },
          {
            question: "Hoćeš da kažeš nešto ali ne znaš reč na nemačkom. Šta kažeš?",
            answer: "Wie sagt man... auf Deutsch? / Ich weiß nicht, wie man das auf Deutsch sagt.",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "Könnten Sie das wiederholen?", back: "Da li biste mogli to da ponovite?" },
          { front: "Was bedeutet...?", back: "Šta znači...?" },
          { front: "Moment, ich überlege...", back: "Sačekajte, razmišljam..." },
          { front: "Langsamer, bitte!", back: "Sporije, molim!" },
          { front: "Wie sagt man... auf Deutsch?", back: "Kako se kaže... na nemačkom?" },
          { front: "Habe ich das richtig gesagt?", back: "Da li sam to dobro rekao/la?" },
          { front: "die Sprechblockade", back: "blokada u govoru" },
          { front: "der Mut", back: "hrabrost" },
          { front: "sich trauen", back: "usuditi se" },
          { front: "üben", back: "vežbati" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Sprechblockade", "blokada u govoru"],
          ["der Mut", "hrabrost"],
          ["die Angst", "strah"],
          ["der Fehler", "greška"],
          ["sich trauen", "usuditi se"],
          ["sich schämen", "stideti se"],
          ["wiederholen", "ponoviti"],
          ["erklären", "objasniti"],
          ["üben", "vežbati"],
          ["langsam", "polako"],
          ["höflich", "pristojno"],
          ["nachfragen", "ponovo pitati"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Spielerisch Sprachen lernen — LV" — order_index 15
  // ────────────────────────────────────────────────────────────────
  15: {
    sections: [
      {
        type: "badge",
        module: "Modul 4",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji čitaš tekst o tome kako igre pomažu u učenju stranih jezika i vežbaš razumevanje pročitanog.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Leseverstehen — Spielerisch Sprachen lernen\n\nImmer mehr Menschen lernen Fremdsprachen mit Spielen und Apps. Experten sagen, dass spielerisches Lernen sehr effektiv sein kann. Warum? Weil Spiele Spaß machen und das Gehirn besser arbeitet, wenn wir Spaß haben.\n\nBesonders beliebt sind Sprach-Apps wie Duolingo oder Babbel. Man kann jeden Tag ein paar Minuten üben — im Bus, im Wartezimmer oder vor dem Einschlafen. Aber Experten warnen: Apps allein reichen nicht. Man muss auch sprechen, hören und echte Gespräche führen.\n\nEine andere Methode ist das Lernen mit Filmen und Serien. Viele Lerner schauen Filme auf Deutsch mit Untertiteln. So lernt man neue Wörter im Kontext und hört, wie die Sprache wirklich klingt. Auch Sprachpartner und Tandem-Programme sind sehr hilfreich: Man trifft sich mit einem Muttersprachler und übt zusammen — jeder lernt die Sprache des anderen.\n\nDas Wichtigste ist: regelmäßig üben und keine Angst vor Fehlern haben!",
      },
      {
        type: "spoiler",
        title: "Leseverstehen — pitanja",
        items: [
          {
            question: "Warum ist spielerisches Lernen effektiv?",
            answer: "Weil Spiele Spaß machen und das Gehirn besser arbeitet, wenn wir Spaß haben.",
          },
          {
            question: "Welche Sprach-Apps werden im Text genannt?",
            answer: "Duolingo und Babbel.",
          },
          {
            question: "Was sagen die Experten über Apps?",
            answer: "Apps allein reichen nicht — man muss auch sprechen und echte Gespräche führen.",
          },
          {
            question: "Wie lernt man mit Filmen?",
            answer: "Man schaut Filme auf Deutsch mit Untertiteln und lernt Wörter im Kontext.",
          },
          {
            question: "Was ist ein Tandem-Programm?",
            answer: "Man trifft sich mit einem Muttersprachler und übt zusammen — jeder lernt die Sprache des anderen.",
          },
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Konverzacija — Sprachen lernen",
      },
      {
        type: "spoiler",
        title: "Pitanja za razgovor",
        items: [
          {
            question: "Wie lernst du am liebsten Deutsch?",
            answer: "Odgovori slobodno: mit Apps, mit Filmen, im Kurs, mit einem Sprachpartner...",
          },
          {
            question: "Benutzt du Sprach-Apps? Welche?",
            answer: "Npr. Ja, ich benutze... / Nein, ich lerne lieber mit...",
          },
          {
            question: "Schaust du Filme oder Serien auf Deutsch?",
            answer: "Npr. Ja, ich schaue... mit Untertiteln. / Nein, das ist noch zu schwer.",
          },
          {
            question: "Was ist dein größtes Problem beim Deutschlernen?",
            answer: "Npr. Grammatik, Sprechen, Vokabeln, Hörverstehen...",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "die Fremdsprache", back: "strani jezik" },
          { front: "die Muttersprache", back: "maternji jezik" },
          { front: "die Mehrsprachigkeit", back: "višejezičnost" },
          { front: "fließend", back: "tečno" },
          { front: "das Gehirn", back: "mozak" },
          { front: "der Muttersprachler", back: "izvorni govornik" },
          { front: "spielerisch", back: "na igriv način" },
          { front: "regelmäßig", back: "redovno" },
          { front: "der Sprachpartner", back: "jezički partner" },
          { front: "die Untertitel", back: "titlovi" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Fremdsprache", "strani jezik"],
          ["die Muttersprache", "maternji jezik"],
          ["die Mehrsprachigkeit", "višejezičnost"],
          ["fließend", "tečno"],
          ["spielerisch", "na igriv način"],
          ["das Gehirn", "mozak"],
          ["der Muttersprachler", "izvorni govornik"],
          ["der Sprachpartner", "jezički partner"],
          ["die Untertitel", "titlovi"],
          ["regelmäßig", "redovno"],
          ["effektiv", "efikasno"],
          ["hilfreich", "korisno"],
          ["das Wartezimmer", "čekaonica"],
          ["das Einschlafen", "uspavljivanje"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Wortschatz B1 — Prüfungsvorbereitung" — order_index 16
  // ────────────────────────────────────────────────────────────────
  16: {
    sections: [
      {
        type: "badge",
        module: "Modul 4",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji ponavljaš najvažnije reči za B1 ispit, grupisane po temama. Vežbaj flashcards i proveri koliko reči znaš!",
      },
      {
        type: "text",
        style: "default",
        content: "## Thema 1: Alltag und Freizeit",
      },
      {
        type: "vocabulary",
        rows: [
          ["der Alltag", "svakodnevica"],
          ["die Freizeit", "slobodno vreme"],
          ["das Hobby", "hobi"],
          ["der Verein", "udruženje, klub"],
          ["die Veranstaltung", "događaj"],
          ["sich entspannen", "opustiti se"],
          ["unternehmen", "preduzeti, raditi nešto"],
          ["sich verabreden", "dogovoriti se (za susret)"],
          ["der Ausflug", "izlet"],
          ["die Abwechslung", "promena, raznolikost"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Thema 2: Arbeit und Beruf",
      },
      {
        type: "vocabulary",
        rows: [
          ["der Beruf", "zanimanje"],
          ["die Stelle", "radno mesto"],
          ["der Arbeitgeber", "poslodavac"],
          ["der Arbeitnehmer", "zaposleni"],
          ["das Gehalt", "plata"],
          ["die Bewerbung", "prijava za posao"],
          ["der Lebenslauf", "biografija (CV)"],
          ["die Erfahrung", "iskustvo"],
          ["die Qualifikation", "kvalifikacija"],
          ["kündigen", "dati otkaz"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Thema 3: Gesundheit",
      },
      {
        type: "vocabulary",
        rows: [
          ["die Gesundheit", "zdravlje"],
          ["die Krankheit", "bolest"],
          ["der Arzt / die Ärztin", "lekar / lekarka"],
          ["die Apotheke", "apoteka"],
          ["das Rezept", "recept"],
          ["die Versicherung", "osiguranje"],
          ["sich erkälten", "prehladiti se"],
          ["die Grippe", "grip"],
          ["die Tablette", "tableta"],
          ["sich erholen", "oporaviti se"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Thema 4: Medien und Kommunikation",
      },
      {
        type: "vocabulary",
        rows: [
          ["die Nachrichten", "vesti"],
          ["die Sendung", "emisija"],
          ["die Zeitung", "novine"],
          ["die Zeitschrift", "časopis"],
          ["das Internet", "internet"],
          ["soziale Medien", "društvene mreže"],
          ["die Werbung", "reklama"],
          ["herunterladen", "preuzeti (sa interneta)"],
          ["die Meinung", "mišljenje"],
          ["sich informieren", "informisati se"],
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — Thema zuordnen",
        items: [
          {
            question: "Zu welchem Thema passt 'die Bewerbung'?",
            answer: "Arbeit und Beruf",
          },
          {
            question: "Zu welchem Thema passt 'sich erkälten'?",
            answer: "Gesundheit",
          },
          {
            question: "Zu welchem Thema passt 'der Verein'?",
            answer: "Alltag und Freizeit",
          },
          {
            question: "Zu welchem Thema passt 'die Nachrichten'?",
            answer: "Medien und Kommunikation",
          },
          {
            question: "Was bedeutet 'kündigen'?",
            answer: "dati otkaz (Arbeit und Beruf)",
          },
          {
            question: "Was bedeutet 'sich entspannen'?",
            answer: "opustiti se (Alltag und Freizeit)",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "der Alltag", back: "svakodnevica" },
          { front: "die Veranstaltung", back: "događaj" },
          { front: "sich verabreden", back: "dogovoriti se za susret" },
          { front: "die Bewerbung", back: "prijava za posao" },
          { front: "der Lebenslauf", back: "biografija (CV)" },
          { front: "kündigen", back: "dati otkaz" },
          { front: "sich erkälten", back: "prehladiti se" },
          { front: "die Versicherung", back: "osiguranje" },
          { front: "sich erholen", back: "oporaviti se" },
          { front: "die Nachrichten", back: "vesti" },
          { front: "die Werbung", back: "reklama" },
          { front: "herunterladen", back: "preuzeti" },
          { front: "soziale Medien", back: "društvene mreže" },
          { front: "die Abwechslung", back: "promena, raznolikost" },
          { front: "die Erfahrung", back: "iskustvo" },
          { front: "das Gehalt", back: "plata" },
          { front: "die Qualifikation", back: "kvalifikacija" },
          { front: "die Grippe", back: "grip" },
          { front: "sich informieren", back: "informisati se" },
          { front: "unternehmen", back: "preduzeti nešto" },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // MODUL 5: Eine Arbeit finden
  // ════════════════════════════════════════════════════════════════

  // ────────────────────────────────────────────────────────────────
  // "Infinitiv mit zu" — order_index 17
  // ────────────────────────────────────────────────────────────────
  17: {
    sections: [
      {
        type: "badge",
        module: "Modul 5",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji učiš **Infinitiv mit zu** — konstrukciju koja se koristi uz mnoge glagole i izraze u nemačkom. Ovo je jako česta struktura na B1 nivou!",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Infinitiv mit zu — osnovna pravila\n\nPosle nekih glagola, prideva i imenica stavljamo **zu + Infinitiv** na kraj rečenice.",
      },
      {
        type: "formula",
        content:
          "Sa glagolima:\nvergessen **zu** + Inf. → Ich habe vergessen, dich **anzurufen**.\nanfangen **zu** + Inf. → Es fängt an **zu regnen**.\nversuchen **zu** + Inf. → Ich versuche, früh **aufzustehen**.\naufhören **zu** + Inf. → Hör auf **zu rauchen**!",
      },
      {
        type: "formula",
        content:
          "Sa pridevima (Es ist + Adj. + zu + Inf.):\nEs ist wichtig, pünktlich **zu sein**.\nEs ist schwer, eine Arbeit **zu finden**.\nEs ist leicht, Deutsch **zu lernen**.",
      },
      {
        type: "formula",
        content:
          "Sa imenicama (Ich habe + Nomen + zu + Inf.):\nIch habe Lust, ins Kino **zu gehen**.\nIch habe Zeit, dich **zu besuchen**.\nIch habe Angst, allein **zu fliegen**.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Razdvojivi glagoli — gde ide zu?\n\nKod razdvojivih glagola **zu** ide IZMEĐU prefiksa i glagola.",
      },
      {
        type: "table",
        headers: ["Infinitiv", "Infinitiv mit zu", "Primer"],
        rows: [
          ["anrufen", "anzurufen", "Ich habe vergessen, dich anzurufen."],
          ["aufstehen", "aufzustehen", "Es ist schwer, früh aufzustehen."],
          ["einkaufen", "einzukaufen", "Ich habe keine Lust, einzukaufen."],
          ["anfangen", "anzufangen", "Es ist Zeit, anzufangen."],
          ["mitmachen", "mitzumachen", "Hast du Lust, mitzumachen?"],
        ],
      },
      {
        type: "table",
        headers: ["Nerazdvojivi", "Infinitiv mit zu", "Primer"],
        rows: [
          ["vergessen", "zu vergessen", "Es ist leicht, das zu vergessen."],
          ["verstehen", "zu verstehen", "Es ist schwer, alles zu verstehen."],
          ["beginnen", "zu beginnen", "Es ist Zeit, zu beginnen."],
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — Infinitiv mit zu",
        items: [
          {
            question: "Ich habe vergessen, das Fenster ______ (zumachen).",
            answer: "zuzumachen",
          },
          {
            question: "Es ist wichtig, regelmäßig Sport ______ (treiben).",
            answer: "zu treiben",
          },
          {
            question: "Ich versuche, jeden Tag Deutsch ______ (lernen).",
            answer: "zu lernen",
          },
          {
            question: "Hast du Lust, morgen ______ (mitkommen)?",
            answer: "mitzukommen",
          },
          {
            question: "Es ist schwer, früh ______ (aufstehen).",
            answer: "aufzustehen",
          },
          {
            question: "Ich habe Angst, allein ______ (fliegen).",
            answer: "zu fliegen",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "vergessen zu...", back: "zaboraviti da..." },
          { front: "anfangen zu...", back: "početi da..." },
          { front: "versuchen zu...", back: "pokušati da..." },
          { front: "aufhören zu...", back: "prestati da..." },
          { front: "Es ist wichtig zu...", back: "Važno je da..." },
          { front: "Ich habe Lust zu...", back: "Imam želju da..." },
          { front: "Ich habe Zeit zu...", back: "Imam vremena da..." },
          { front: "Ich habe Angst zu...", back: "Plašim se da..." },
          { front: "anrufen → anzurufen", back: "zu ide između prefiksa i glagola" },
          { front: "verstehen → zu verstehen", back: "nerazdvojivi: zu ispred glagola" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["der Beruf", "zanimanje"],
          ["die Bewerbung", "prijava za posao"],
          ["der Lebenslauf", "biografija (CV)"],
          ["das Anschreiben", "propratno pismo"],
          ["die Stellenanzeige", "oglas za posao"],
          ["die Berufserfahrung", "radno iskustvo"],
          ["die Qualifikation", "kvalifikacija"],
          ["das Vorstellungsgespräch", "razgovor za posao"],
          ["sich bewerben um", "prijaviti se za"],
          ["einstellen", "zaposliti"],
          ["vergessen", "zaboraviti"],
          ["versuchen", "pokušati"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Jobsuche" — order_index 18
  // ────────────────────────────────────────────────────────────────
  18: {
    sections: [
      {
        type: "badge",
        module: "Modul 5",
      },
      {
        type: "text",
        style: "info",
        content:
          "Tražiš posao u Nemačkoj? U ovoj lekciji učiš kako izgleda proces prijave i najvažniji vokabular za temu Jobsuche.",
      },
      {
        type: "text",
        style: "uebung",
        content: "## DW vežba — Jobsuche",
      },
      {
        type: "link",
        linkType: "dw",
        href: "https://learngerman.dw.com/de/jobsuche/l-38467171",
        label: "DW: Jobsuche — vežba",
      },
      {
        type: "text",
        style: "default",
        content: "## Bewerbungsprozess — koraci pri prijavi za posao",
      },
      {
        type: "table",
        headers: ["Korak", "Na nemačkom", "Objašnjenje"],
        rows: [
          ["1", "die Stellenanzeige lesen", "Pronađi oglas za posao"],
          ["2", "den Lebenslauf schreiben", "Napiši biografiju (CV)"],
          ["3", "das Anschreiben verfassen", "Napiši propratno pismo"],
          ["4", "die Bewerbung abschicken", "Pošalji prijavu"],
          ["5", "die Einladung bekommen", "Dobiješ poziv na razgovor"],
          ["6", "das Vorstellungsgespräch haben", "Odeš na razgovor za posao"],
          ["7", "die Zusage / Absage bekommen", "Dobiješ potvrdu ili odbijanje"],
        ],
      },
      {
        type: "table",
        headers: ["Na nemačkom", "Na srpskom"],
        rows: [
          ["die Stellenanzeige", "oglas za posao"],
          ["sich bewerben (um + Akk.)", "prijaviti se (za)"],
          ["der Lebenslauf", "biografija (CV)"],
          ["das Anschreiben", "propratno pismo"],
          ["das Vorstellungsgespräch", "razgovor za posao"],
          ["die Berufserfahrung", "radno iskustvo"],
          ["die Qualifikation", "kvalifikacija"],
          ["die Zusage", "potvrda, prihvatanje"],
          ["die Absage", "odbijanje"],
          ["der Arbeitgeber", "poslodavac"],
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — Bewerbungsprozess",
        items: [
          {
            question: "Was kommt zuerst: Anschreiben oder Stellenanzeige lesen?",
            answer: "Stellenanzeige lesen — prvo čitaš oglas, pa pišeš propratno pismo.",
          },
          {
            question: "Was kommt nach der Bewerbung?",
            answer: "Die Einladung zum Vorstellungsgespräch (ili Absage).",
          },
          {
            question: "Was bedeutet 'die Zusage'?",
            answer: "Potvrda — dobio/la si posao!",
          },
          {
            question: "Was schreibt man in den Lebenslauf?",
            answer: "Name, Ausbildung, Berufserfahrung, Qualifikationen, Sprachkenntnisse.",
          },
          {
            question: "Was bedeutet 'sich bewerben'?",
            answer: "Prijaviti se za posao — Ich bewerbe mich um die Stelle als...",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "die Stellenanzeige", back: "oglas za posao" },
          { front: "sich bewerben", back: "prijaviti se za posao" },
          { front: "der Lebenslauf", back: "biografija (CV)" },
          { front: "das Anschreiben", back: "propratno pismo" },
          { front: "das Vorstellungsgespräch", back: "razgovor za posao" },
          { front: "die Berufserfahrung", back: "radno iskustvo" },
          { front: "die Qualifikation", back: "kvalifikacija" },
          { front: "die Zusage", back: "potvrda (dobio si posao)" },
          { front: "die Absage", back: "odbijanje" },
          { front: "einstellen", back: "zaposliti (nekoga)" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Stellenanzeige", "oglas za posao"],
          ["sich bewerben um", "prijaviti se za"],
          ["der Lebenslauf", "biografija (CV)"],
          ["das Anschreiben", "propratno pismo"],
          ["das Vorstellungsgespräch", "razgovor za posao"],
          ["die Berufserfahrung", "radno iskustvo"],
          ["die Qualifikation", "kvalifikacija"],
          ["die Zusage", "potvrda"],
          ["die Absage", "odbijanje"],
          ["der Arbeitgeber", "poslodavac"],
          ["der Arbeitnehmer", "zaposleni"],
          ["Vollzeit", "puno radno vreme"],
          ["Teilzeit", "pola radnog vremena"],
          ["die Probezeit", "probni rok"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Berufswechsel — LV" — order_index 19
  // ────────────────────────────────────────────────────────────────
  19: {
    sections: [
      {
        type: "badge",
        module: "Modul 5",
      },
      {
        type: "text",
        style: "info",
        content:
          "Čitaš tekst o promeni karijere i razmišljaš o tome da li bi i ti promenio/la posao. Vežbaš razumevanje pročitanog i konverzaciju.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Leseverstehen — Berufswechsel: Nie zu spät für einen Neuanfang\n\nMarkus war 15 Jahre lang Bankangestellter. Er hatte ein gutes Gehalt, ein schönes Büro und sichere Arbeitszeiten. Aber er war unglücklich. Jeden Morgen dachte er: Ich will etwas anderes machen. Mit 40 Jahren hat er gekündigt und eine Ausbildung als Koch angefangen.\n\nSeine Familie war zuerst schockiert. Seine Frau fragte: Bist du verrückt? Aber Markus war sich sicher: Kochen war seine Leidenschaft. Die Ausbildung war hart — wenig Geld, lange Arbeitszeiten, viel Stress. Aber zum ersten Mal war er zufrieden mit seiner Arbeit.\n\nHeute hat Markus ein kleines Restaurant in Hamburg. Er arbeitet mehr als früher und verdient weniger als bei der Bank. Aber er sagt: Ich stehe jeden Morgen gern auf. Das ist unbezahlbar.\n\nExperten sagen: Ein Berufswechsel ist in jedem Alter möglich. Wichtig ist, dass man sich gut vorbereitet, Geld spart und realistische Erwartungen hat.",
      },
      {
        type: "spoiler",
        title: "Leseverstehen — pitanja",
        items: [
          {
            question: "Was war Markus von Beruf, bevor er Koch wurde?",
            answer: "Er war Bankangestellter (službenik u banci).",
          },
          {
            question: "Warum hat er seinen Job gewechselt?",
            answer: "Weil er unglücklich war und etwas anderes machen wollte.",
          },
          {
            question: "Wie hat seine Familie reagiert?",
            answer: "Sie war schockiert. Seine Frau fragte: Bist du verrückt?",
          },
          {
            question: "Was sagt Markus über sein neues Leben?",
            answer: "Er steht jeden Morgen gern auf — das ist unbezahlbar.",
          },
          {
            question: "Was raten die Experten?",
            answer: "Man soll sich gut vorbereiten, Geld sparen und realistische Erwartungen haben.",
          },
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Konverzacija — Berufswechsel",
      },
      {
        type: "spoiler",
        title: "Pitanja za razgovor",
        items: [
          {
            question: "Hast du schon einmal deinen Job gewechselt? Warum?",
            answer: "Odgovori slobodno — koristi Perfekt i weil.",
          },
          {
            question: "Würdest du deinen Beruf wechseln, wenn du könntest?",
            answer: "Koristi Konjunktiv II: Ja, ich würde... / Nein, ich bin zufrieden mit...",
          },
          {
            question: "Was ist dir bei der Arbeit am wichtigsten: Geld, Freizeit oder Spaß?",
            answer: "Npr. Am wichtigsten ist mir..., weil...",
          },
          {
            question: "Welchen Beruf findest du am interessantesten? Warum?",
            answer: "Npr. Ich finde den Beruf... am interessantesten, weil...",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "der Berufswechsel", back: "promena karijere" },
          { front: "kündigen", back: "dati otkaz" },
          { front: "die Ausbildung", back: "stručna obuka" },
          { front: "die Leidenschaft", back: "strast" },
          { front: "unbezahlbar", back: "neprocenjivo" },
          { front: "zufrieden sein mit", back: "biti zadovoljan (čime)" },
          { front: "sich vorbereiten auf", back: "pripremiti se za" },
          { front: "die Erwartung", back: "očekivanje" },
          { front: "verdienen", back: "zarađivati" },
          { front: "der Neuanfang", back: "novi početak" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["der Berufswechsel", "promena karijere"],
          ["der Neuanfang", "novi početak"],
          ["kündigen", "dati otkaz"],
          ["die Ausbildung", "stručna obuka"],
          ["die Leidenschaft", "strast"],
          ["zufrieden", "zadovoljan"],
          ["unglücklich", "nesrećan"],
          ["unbezahlbar", "neprocenjivo"],
          ["verdienen", "zarađivati"],
          ["sich vorbereiten", "pripremiti se"],
          ["die Erwartung", "očekivanje"],
          ["realistisch", "realan"],
          ["der Bankangestellte", "bankarski službenik"],
          ["verrückt", "lud"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Geschlechtergerechte Sprache" — order_index 20
  // ────────────────────────────────────────────────────────────────
  20: {
    sections: [
      {
        type: "badge",
        module: "Modul 5",
      },
      {
        type: "youtube",
        videoId: "B0NxCMmydow",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji učiš o **rodno osetljivom jeziku** u nemačkom — šta znači Gendern i zašto je to tema u Nemačkoj. Posebno važno za razumevanje oglasa za posao!",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Was bedeutet Gendern?\n\nU nemačkom se tradicionalno koristio muški oblik za sve: 'Studenten' za studente i studentkinje. Danas mnogi koriste rodno neutralne oblike.",
      },
      {
        type: "table",
        headers: ["Tradicionalno (m.)", "Rodno osetljivo", "Objašnjenje"],
        rows: [
          ["Studenten", "Studierende", "particip — rodno neutralno"],
          ["Lehrer", "Lehrkräfte", "alternativna reč"],
          ["Ärzte", "Ärzt*innen", "sa zvezdicom (Gendersternchen)"],
          ["Mitarbeiter", "Mitarbeitende", "particip"],
          ["Kollegen", "Kolleg:innen", "sa dvotačkom (Genderdoppelpunkt)"],
          ["Kunden", "Kund*innen", "sa zvezdicom"],
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "## m/w/d — u oglasima za posao\n\nU Nemačkoj oglasi za posao moraju biti neutralni. Zato stoji **m/w/d** posle naziva pozicije.",
      },
      {
        type: "formula",
        content:
          "**m** = männlich (muški)\n**w** = weiblich (ženski)\n**d** = divers (nebinarno)\n\nPrimer: Wir suchen eine/n Krankenpfleger/in (m/w/d)",
      },
      {
        type: "spoiler",
        title: "Mini vežba — Gendern verstehen",
        items: [
          {
            question: "Šta znači 'Studierende'?",
            answer: "Studenti i studentkinje — rodno neutralni oblik za 'Studenten'.",
          },
          {
            question: "Šta znači m/w/d u oglasu za posao?",
            answer: "männlich / weiblich / divers — oglas je otvoren za sve.",
          },
          {
            question: "Kako se kaže 'Lehrer' na rodno neutralni način?",
            answer: "Lehrkräfte (ili Lehrer*innen sa zvezdicom).",
          },
          {
            question: "Šta je 'Gendersternchen'?",
            answer: "Zvezdica (*) između muškog i ženskog nastavka: Kolleg*innen.",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "Studierende", back: "studenti/kinje (neutralno)" },
          { front: "Lehrkräfte", back: "nastavno osoblje (neutralno)" },
          { front: "Mitarbeitende", back: "zaposleni (neutralno)" },
          { front: "m/w/d", back: "männlich/weiblich/divers" },
          { front: "das Gendersternchen", back: "zvezdica za Gendern (*)" },
          { front: "geschlechtergerecht", back: "rodno osetljivo" },
          { front: "die Gleichberechtigung", back: "ravnopravnost" },
          { front: "die Stellenanzeige", back: "oglas za posao" },
          { front: "neutral", back: "neutralno" },
          { front: "die Vielfalt", back: "raznolikost" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["geschlechtergerecht", "rodno osetljivo"],
          ["das Gendern", "rodno osetljiv jezik"],
          ["das Gendersternchen", "zvezdica (*)"],
          ["die Gleichberechtigung", "ravnopravnost"],
          ["die Vielfalt", "raznolikost"],
          ["die Stellenanzeige", "oglas za posao"],
          ["männlich", "muški"],
          ["weiblich", "ženski"],
          ["divers", "nebinarno"],
          ["neutral", "neutralno"],
          ["Studierende", "studenti/kinje"],
          ["Lehrkräfte", "nastavno osoblje"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Sprechen B1 — Ein Thema präsentieren" — order_index 21
  // ────────────────────────────────────────────────────────────────
  21: {
    sections: [
      {
        type: "badge",
        module: "Modul 5",
      },
      {
        type: "text",
        style: "info",
        content:
          "Na B1 ispitu moraš da prezentiraš jednu temu u 3-4 minuta. U ovoj lekciji učiš strukturu prezentacije i korisne fraze za svaki deo (Folie).",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Struktur der Präsentation\n\nPrezentacija ima 5 delova (Folien). Svaki deo ima svoju funkciju i korisne fraze.",
      },
      {
        type: "table",
        headers: ["Folie", "Tema", "Redemittel"],
        rows: [
          [
            "Folie 1",
            "Thema vorstellen",
            "Ich möchte heute über das Thema ... sprechen. / Mein Thema ist ... / Dieses Thema ist wichtig, weil ...",
          ],
          [
            "Folie 2",
            "Eigene Erfahrungen",
            "Ich persönlich habe die Erfahrung gemacht, dass ... / In meinem Leben ... / Als ich ... war, habe ich ...",
          ],
          [
            "Folie 3",
            "Situation im Heimatland",
            "In meinem Heimatland ... / Bei uns ist es so, dass ... / Im Vergleich zu Deutschland ...",
          ],
          [
            "Folie 4",
            "Vor- und Nachteile",
            "Ein Vorteil ist, dass ... / Auf der anderen Seite ... / Ein Nachteil könnte sein, dass ... / Einerseits ... andererseits ...",
          ],
          [
            "Folie 5",
            "Meinung und Abschluss",
            "Ich bin der Meinung, dass ... / Zusammenfassend möchte ich sagen, dass ... / Vielen Dank für Ihre Aufmerksamkeit!",
          ],
        ],
      },
      {
        type: "text",
        style: "uebung",
        content: "## Übungsthema: Berufswechsel — Lohnt es sich, den Beruf zu wechseln?",
      },
      {
        type: "text",
        style: "default",
        content:
          "Probaj da napraviš prezentaciju na temu **Berufswechsel**. Koristi fraze iz tabele iznad i isprati strukturu po Folien.",
      },
      {
        type: "spoiler",
        title: "Primer — Guided Practice (Berufswechsel)",
        items: [
          {
            question: "Folie 1: Kako počinješ?",
            answer: "Ich möchte heute über das Thema 'Berufswechsel' sprechen. Dieses Thema ist wichtig, weil immer mehr Menschen ihren Beruf wechseln möchten.",
          },
          {
            question: "Folie 2: Tvoje iskustvo?",
            answer: "Ich persönlich habe noch keinen Berufswechsel gemacht, aber ich kenne Menschen, die... / Ich habe einmal meinen Job gewechselt, weil...",
          },
          {
            question: "Folie 3: Kako je u tvojoj zemlji?",
            answer: "In meinem Heimatland ist es (nicht) üblich, den Beruf zu wechseln. Bei uns... / Im Vergleich zu Deutschland...",
          },
          {
            question: "Folie 4: Prednosti i mane?",
            answer: "Ein Vorteil ist, dass man glücklicher sein kann. Auf der anderen Seite ist es riskant, weil man weniger Geld verdienen könnte.",
          },
          {
            question: "Folie 5: Tvoje mišljenje i zaključak?",
            answer: "Ich bin der Meinung, dass ein Berufswechsel mutig ist, aber manchmal notwendig. Zusammenfassend möchte ich sagen, dass jeder Mensch das Recht hat, glücklich zu sein. Vielen Dank!",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "Ich möchte heute über ... sprechen.", back: "Danas bih govorio/la o..." },
          { front: "Mein Thema ist...", back: "Moja tema je..." },
          { front: "Ich persönlich habe die Erfahrung gemacht, dass...", back: "Ja lično imam iskustvo da..." },
          { front: "In meinem Heimatland...", back: "U mojoj zemlji..." },
          { front: "Ein Vorteil ist, dass...", back: "Prednost je što..." },
          { front: "Ein Nachteil könnte sein, dass...", back: "Mana bi mogla biti što..." },
          { front: "Einerseits ... andererseits ...", back: "S jedne strane ... s druge strane ..." },
          { front: "Ich bin der Meinung, dass...", back: "Ja sam mišljenja da..." },
          { front: "Zusammenfassend möchte ich sagen, dass...", back: "Ukratko bih rekao/la da..." },
          { front: "Vielen Dank für Ihre Aufmerksamkeit!", back: "Hvala na pažnji!" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Präsentation", "prezentacija"],
          ["die Folie", "slajd"],
          ["vorstellen", "predstaviti"],
          ["die Erfahrung", "iskustvo"],
          ["das Heimatland", "domovina"],
          ["der Vorteil", "prednost"],
          ["der Nachteil", "mana"],
          ["die Meinung", "mišljenje"],
          ["zusammenfassen", "rezimirati"],
          ["die Aufmerksamkeit", "pažnja"],
          ["einerseits", "s jedne strane"],
          ["andererseits", "s druge strane"],
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // MODUL 6: Dienstleistung
  // ════════════════════════════════════════════════════════════════

  // ────────────────────────────────────────────────────────────────
  // "Finalsätze (um+zu vs. damit)" — order_index 22
  // ────────────────────────────────────────────────────────────────
  22: {
    sections: [
      {
        type: "badge",
        module: "Modul 6",
      },
      {
        type: "video",
        vimeoId: "1100291090",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji učiš **finalne rečenice** — kako da kažeš ZAŠTO nešto radiš (cilj). Takođe učiš **statt...zu** i **ohne...zu** konstrukcije.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## um...zu vs. damit — koja je razlika?\n\nObe konstrukcije izražavaju cilj (zašto?), ali se koriste u različitim situacijama.",
      },
      {
        type: "formula",
        content:
          "**um...zu** = isti subjekat u obe rečenice\nIch lerne Deutsch, **UM** in Deutschland **ZU ARBEITEN**.\n(Ja učim + Ja radim = isti subjekat)\n\n**damit** = različiti subjekti\nIch lerne Deutsch, **DAMIT** meine Kinder mich **verstehen**.\n(Ja učim + deca razumeju = različiti subjekti)",
      },
      {
        type: "table",
        headers: ["um...zu (isti subjekat)", "damit (različiti subjekti)"],
        rows: [
          [
            "Ich spare Geld, um ein Auto zu kaufen.",
            "Ich spare Geld, damit mein Sohn studieren kann.",
          ],
          [
            "Sie lernt viel, um die Prüfung zu bestehen.",
            "Sie erklärt es langsam, damit alle verstehen.",
          ],
          [
            "Er geht früh ins Bett, um fit zu sein.",
            "Er ist leise, damit das Baby schlafen kann.",
          ],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## statt...zu — umesto da...",
      },
      {
        type: "formula",
        content:
          "**STATT** zu lernen, spielt er Videospiele.\n(Umesto da uči, igra video igrice.)\n\n**STATT** zu kochen, bestellt sie Pizza.\n(Umesto da kuva, naručuje picu.)",
      },
      {
        type: "text",
        style: "default",
        content: "## ohne...zu — bez da...",
      },
      {
        type: "formula",
        content:
          "Er ging weg, **OHNE** sich **ZU VERABSCHIEDEN**.\n(Otišao je bez da se pozdravio.)\n\nSie hat den Vertrag unterschrieben, **OHNE** ihn **ZU LESEN**.\n(Potpisala je ugovor bez da ga je pročitala.)",
      },
      {
        type: "spoiler",
        title: "Mini vežba — um...zu oder damit?",
        items: [
          {
            question: "Ich lerne Deutsch, ______ ich in Wien arbeiten kann. (isti subjekat)",
            answer: "um ... zu arbeiten (um in Wien zu arbeiten)",
          },
          {
            question: "Ich spreche langsam, ______ du mich verstehst. (različiti subjekti)",
            answer: "damit",
          },
          {
            question: "Er spart Geld, ______ ein Haus zu kaufen.",
            answer: "um",
          },
          {
            question: "Sie kocht gesund, ______ ihre Familie gesund bleibt.",
            answer: "damit",
          },
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — statt...zu / ohne...zu",
        items: [
          {
            question: "______ zu lernen, sieht er fern.",
            answer: "Statt",
          },
          {
            question: "Er ging aus dem Haus, ______ seinen Schlüssel ______ (mitnehmen).",
            answer: "ohne ... mitzunehmen",
          },
          {
            question: "______ Sport zu treiben, liegt sie auf dem Sofa.",
            answer: "Statt",
          },
          {
            question: "Sie hat geantwortet, ______ ______ (nachdenken).",
            answer: "ohne nachzudenken",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "um...zu + Infinitiv", back: "da bi... (isti subjekat)" },
          { front: "damit + Nebensatz", back: "da bi... (različiti subjekti)" },
          { front: "statt...zu + Infinitiv", back: "umesto da..." },
          { front: "ohne...zu + Infinitiv", back: "bez da..." },
          { front: "Ich lerne, um die Prüfung zu bestehen.", back: "Učim da bih položio/la ispit." },
          { front: "...damit mein Kind versteht.", back: "...da bi moje dete razumelo." },
          { front: "Statt zu kochen, bestellt er Pizza.", back: "Umesto da kuva, naručuje picu." },
          { front: "Er ging, ohne zu grüßen.", back: "Otišao je bez da se javio." },
          { front: "sich verabschieden", back: "pozdraviti se" },
          { front: "unterschreiben", back: "potpisati" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["das Ziel", "cilj"],
          ["der Zweck", "svrha"],
          ["sparen", "štedeti"],
          ["bestehen", "položiti (ispit)"],
          ["sich verabschieden", "pozdraviti se"],
          ["unterschreiben", "potpisati"],
          ["der Vertrag", "ugovor"],
          ["nachdenken", "razmišljati"],
          ["bestellen", "naručiti"],
          ["erklären", "objasniti"],
          ["statt", "umesto"],
          ["ohne", "bez"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Temporale Präpositionen + es gibt / es ist" — order_index 23
  // ────────────────────────────────────────────────────────────────
  23: {
    sections: [
      {
        type: "badge",
        module: "Modul 6",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji učiš **temporalne predloge** sa genitivom i razliku između **es gibt** i **es ist**. Ove strukture su česte u svakodnevnom jeziku.",
      },
      {
        type: "text",
        style: "default",
        content: "## Temporale Präpositionen + Genitiv",
      },
      {
        type: "formula",
        content:
          "**während** + Genitiv = tokom\nWährend **des Unterrichts** darf man nicht telefonieren.\n\n**außerhalb** + Genitiv = izvan (vremenski)\nAußerhalb **der Öffnungszeiten** ist das Büro geschlossen.\n\n**innerhalb** + Genitiv = unutar (vremenski)\nInnerhalb **einer Woche** muss man antworten.",
      },
      {
        type: "table",
        headers: ["Predlog", "Značenje", "Primer"],
        rows: [
          ["während", "tokom", "Während des Gesprächs war er nervös."],
          ["außerhalb", "izvan", "Außerhalb der Arbeitszeit bin ich nicht erreichbar."],
          ["innerhalb", "unutar", "Innerhalb eines Monats hat er Deutsch gelernt."],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## es gibt vs. es ist",
      },
      {
        type: "formula",
        content:
          "**es gibt** + Akkusativ = postoji, ima (nešto konkretno)\nEs gibt **einen** Supermarkt in der Nähe.\nEs gibt **keine** Lösung.\n\n**es ist** + Adjektiv = to je (opis)\nEs ist **nicht leicht**, eine Wohnung zu finden.\nEs ist **wichtig**, pünktlich zu sein.\n\n**es lohnt sich** = isplati se\nEs lohnt sich, Deutsch zu lernen.",
      },
      {
        type: "table",
        headers: ["Izraz", "Značenje", "Primer"],
        rows: [
          ["es gibt + Akk.", "postoji/ima", "In dieser Stadt gibt es viele Parks."],
          ["es ist + Adj.", "to je...", "Es ist schwer, einen Job zu finden."],
          ["es lohnt sich", "isplati se", "Es lohnt sich, früh aufzustehen."],
          ["es ist (nicht) leicht", "(ni)je lako", "Es ist nicht leicht, allein zu leben."],
          ["es ist (nicht) möglich", "(ni)je moguće", "Es ist möglich, online zu bestellen."],
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — während, außerhalb, innerhalb",
        items: [
          {
            question: "______ des Meetings darf man nicht telefonieren.",
            answer: "Während",
          },
          {
            question: "______ der Öffnungszeiten kann man nicht einkaufen.",
            answer: "Außerhalb",
          },
          {
            question: "______ eines Jahres hat sie drei Sprachen gelernt.",
            answer: "Innerhalb",
          },
          {
            question: "Es ______ (geben) in Deutschland viele Dienstleistungen.",
            answer: "gibt",
          },
          {
            question: "Es ______ (sein) wichtig, die Rechnung pünktlich zu bezahlen.",
            answer: "ist",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "während + Genitiv", back: "tokom" },
          { front: "außerhalb + Genitiv", back: "izvan" },
          { front: "innerhalb + Genitiv", back: "unutar" },
          { front: "es gibt + Akkusativ", back: "postoji / ima" },
          { front: "es ist + Adjektiv", back: "to je..." },
          { front: "es lohnt sich", back: "isplati se" },
          { front: "die Öffnungszeiten", back: "radno vreme (prodavnice)" },
          { front: "die Dienstleistung", back: "usluga" },
          { front: "die Beschwerde", back: "žalba, reklamacija" },
          { front: "die Rechnung", back: "račun" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Öffnungszeiten", "radno vreme (prodavnice)"],
          ["die Dienstleistung", "usluga"],
          ["die Beschwerde", "žalba, reklamacija"],
          ["die Rechnung", "račun"],
          ["der Kundenservice", "korisnička podrška"],
          ["die Reparatur", "popravka"],
          ["die Lieferung", "dostava"],
          ["bestellen", "naručiti"],
          ["reklamieren", "reklamirati"],
          ["sich beschweren über", "žaliti se na"],
          ["pünktlich", "na vreme"],
          ["erreichbar", "dostupan"],
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // MODUL 7: Rund ums Wohnen
  // ════════════════════════════════════════════════════════════════

  // ────────────────────────────────────────────────────────────────
  // "Zweiteilige Konnektoren" — order_index 24
  // ────────────────────────────────────────────────────────────────
  24: {
    sections: [
      {
        type: "badge",
        module: "Modul 7",
      },
      {
        type: "video",
        vimeoId: "1157210482",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji učiš **dvodelne veznike** — parove reči koji povezuju delove rečenice. Ovo su elegantne strukture koje tvoj nemački čine naprednijim!",
      },
      {
        type: "table",
        headers: ["Konnektor", "Značenje", "Primer"],
        rows: [
          [
            "sowohl ... als auch",
            "i ... i (oba)",
            "Er spricht sowohl Deutsch als auch Englisch.",
          ],
          [
            "weder ... noch",
            "ni ... ni",
            "Sie trinkt weder Kaffee noch Tee.",
          ],
          [
            "nicht nur ... sondern auch",
            "ne samo ... nego i",
            "Er ist nicht nur intelligent, sondern auch fleißig.",
          ],
          [
            "zwar ... aber",
            "doduše ... ali",
            "Die Wohnung ist zwar klein, aber gemütlich.",
          ],
          [
            "entweder ... oder",
            "ili ... ili",
            "Entweder du kommst mit, oder du bleibst zu Hause.",
          ],
        ],
      },
      {
        type: "formula",
        content:
          "**sowohl ... als auch** = i ... i\nIch spreche **sowohl** Deutsch **als auch** Englisch.\n\n**weder ... noch** = ni ... ni\nIch trinke **weder** Kaffee **noch** Tee.\n\n**nicht nur ... sondern auch** = ne samo ... nego i\nSie ist **nicht nur** klug, **sondern auch** kreativ.",
      },
      {
        type: "formula",
        content:
          "**zwar ... aber** = doduše ... ali\nDie Wohnung ist **zwar** teuer, **aber** sie liegt zentral.\n\n**entweder ... oder** = ili ... ili\n**Entweder** wir gehen ins Kino, **oder** wir bleiben zu Hause.",
      },
      {
        type: "spoiler",
        title: "Mini vežba — Welcher Konnektor?",
        items: [
          {
            question: "Er spricht ______ Englisch ______ Französisch. (i ... i)",
            answer: "sowohl ... als auch",
          },
          {
            question: "Sie isst ______ Fleisch ______ Fisch. (ni ... ni)",
            answer: "weder ... noch",
          },
          {
            question: "Die Stadt ist ______ schön, ______ sie ist laut. (doduše ... ali)",
            answer: "zwar ... aber",
          },
          {
            question: "Er ist ______ intelligent, ______ kreativ. (ne samo ... nego i)",
            answer: "nicht nur ... sondern auch",
          },
          {
            question: "______ du rufst mich an, ______ ich rufe dich an. (ili ... ili)",
            answer: "Entweder ... oder",
          },
          {
            question: "Das Hotel ist ______ teuer, ______ es lohnt sich. (doduše ... ali)",
            answer: "zwar ... aber",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "sowohl ... als auch", back: "i ... i (oba)" },
          { front: "weder ... noch", back: "ni ... ni" },
          { front: "nicht nur ... sondern auch", back: "ne samo ... nego i" },
          { front: "zwar ... aber", back: "doduše ... ali" },
          { front: "entweder ... oder", back: "ili ... ili" },
          { front: "Die Wohnung ist zwar klein, aber gemütlich.", back: "Stan je doduše mali, ali udoban." },
          { front: "Ich trinke weder Kaffee noch Tee.", back: "Ne pijem ni kafu ni čaj." },
          { front: "Er ist nicht nur klug, sondern auch fleißig.", back: "On je ne samo pametan, nego i vredan." },
          { front: "sowohl ... als auch (prevod)", back: "kako ... tako i" },
          { front: "Entweder ja oder nein.", back: "Ili da ili ne." },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Wohnung", "stan"],
          ["die Miete", "kirija"],
          ["der Vermieter", "stanodavac"],
          ["der Mieter", "stanar"],
          ["gemütlich", "udoban, prijatan"],
          ["geräumig", "prostran"],
          ["zentral", "centralno"],
          ["die Lage", "lokacija, položaj"],
          ["die Nebenkosten", "režijski troškovi"],
          ["der Mietvertrag", "ugovor o zakupu"],
          ["einziehen", "useliti se"],
          ["ausziehen", "iseliti se"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Konjunktiv II der Vergangenheit" — order_index 25
  // ────────────────────────────────────────────────────────────────
  25: {
    sections: [
      {
        type: "badge",
        module: "Modul 7",
      },
      {
        type: "video",
        vimeoId: "1176569791",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji učiš **Konjunktiv II u prošlosti** — kako da kažeš šta bi bilo DA SI uradio/la nešto drugačije. Takođe učiš **trotz + Genitiv**.",
      },
      {
        type: "text",
        style: "default",
        content: "## Konjunktiv II der Vergangenheit — hätte/wäre + Partizip II",
      },
      {
        type: "formula",
        content:
          "**hätte** + Partizip II (za glagole sa haben)\nIch **hätte** das nicht **gemacht**.\n(Ne bih to uradio/la.)\n\n**wäre** + Partizip II (za glagole sa sein)\nIch **wäre** gern nach Berlin **gefahren**.\n(Rado bih otišao/la u Berlin.)",
      },
      {
        type: "text",
        style: "default",
        content: "## Upotreba — kada koristimo Konjunktiv II Vergangenheit?",
      },
      {
        type: "table",
        headers: ["Upotreba", "Primer", "Prevod"],
        rows: [
          [
            "Žaljenje",
            "Ich hätte mehr lernen sollen.",
            "Trebalo je više da učim.",
          ],
          [
            "Nerealni uslov (prošlost)",
            "Wenn ich das gewusst hätte, wäre ich gekommen.",
            "Da sam to znao, došao bih.",
          ],
          [
            "Kritika",
            "Du hättest mich anrufen können!",
            "Mogao si da me pozoveš!",
          ],
          [
            "Drugačija odluka",
            "An deiner Stelle hätte ich anders gehandelt.",
            "Na tvom mestu postupio bih drugačije.",
          ],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## trotz + Genitiv — uprkos",
      },
      {
        type: "formula",
        content:
          "**trotz** + Genitiv = uprkos\n\n**TROTZ** des schlechten Wetters gingen wir spazieren.\n**TROTZ** der hohen Miete hat er die Wohnung genommen.\n**TROTZ** des Lärms konnte sie schlafen.",
      },
      {
        type: "spoiler",
        title: "Mini vežba — Konjunktiv II Vergangenheit",
        items: [
          {
            question: "Wenn ich das ______ (wissen), ______ ich dir geholfen. (hätte/wäre)",
            answer: "gewusst hätte, hätte",
          },
          {
            question: "Er ______ gern länger ______ (bleiben).",
            answer: "wäre ... geblieben",
          },
          {
            question: "Ich ______ das Buch früher ______ (lesen) sollen.",
            answer: "hätte ... lesen",
          },
          {
            question: "Wenn sie pünktlich ______ (kommen), ______ wir den Zug nicht verpasst.",
            answer: "gekommen wäre, hätten",
          },
          {
            question: "Du ______ mir das ______ (sagen) können!",
            answer: "hättest ... sagen",
          },
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — trotz + Genitiv",
        items: [
          {
            question: "______ ______ (das schlechte Wetter) gingen wir wandern.",
            answer: "Trotz des schlechten Wetters",
          },
          {
            question: "______ ______ (die hohen Kosten) hat er das Auto gekauft.",
            answer: "Trotz der hohen Kosten",
          },
          {
            question: "______ ______ (der starke Regen) spielten die Kinder draußen.",
            answer: "Trotz des starken Regens",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "hätte + Partizip II", back: "Konjunktiv II Verg. (sa haben)" },
          { front: "wäre + Partizip II", back: "Konjunktiv II Verg. (sa sein)" },
          { front: "Ich hätte das nicht gemacht.", back: "Ne bih to uradio/la." },
          { front: "Ich wäre gern gekommen.", back: "Rado bih došao/la." },
          { front: "Wenn ich gewusst hätte...", back: "Da sam znao/la..." },
          { front: "Du hättest mich anrufen können!", back: "Mogao/la si da me pozoveš!" },
          { front: "trotz + Genitiv", back: "uprkos" },
          { front: "trotz des Wetters", back: "uprkos vremenu" },
          { front: "trotz der Kälte", back: "uprkos hladnoći" },
          { front: "Ich hätte mehr lernen sollen.", back: "Trebalo je više da učim." },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["das Bedauern", "žaljenje"],
          ["die Kritik", "kritika"],
          ["die Entscheidung", "odluka"],
          ["bereuen", "kajati se"],
          ["handeln", "postupati"],
          ["trotz", "uprkos"],
          ["der Lärm", "buka"],
          ["die Kälte", "hladnoća"],
          ["die Miete", "kirija"],
          ["verpassen", "propustiti"],
          ["sich entscheiden", "odlučiti se"],
          ["stattdessen", "umesto toga"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Umzug — HV" — order_index 26
  // ────────────────────────────────────────────────────────────────
  26: {
    sections: [
      {
        type: "badge",
        module: "Modul 7",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji vežbaš **Hörverstehen** (razumevanje slušanog) na temu selidbe. Slušaj audio i uradi zadatke iz PDF-a.",
      },
      {
        type: "text",
        style: "uebung",
        content: "## Hörverstehen — Umzug",
      },
      {
        type: "link",
        linkType: "external",
        href: "https://www.hartweger.rs/wp-content/uploads/2024/01/32_041868_Uebungspruefung_8_Hoeren_Teil_4.mp3",
        label: "Audio: Hörverstehen — Umzug (MP3)",
      },
      {
        type: "link",
        linkType: "external",
        href: "https://www.hartweger.rs/wp-content/uploads/2024/01/HV-Umzug.pdf",
        label: "PDF: Aufgaben zum Hörverstehen — Umzug",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Tipps za Hörverstehen\n\n1. **Prvo pročitaj pitanja** pre slušanja.\n2. Slušaj **dva puta** — prvi put za opšti utisak, drugi put za detalje.\n3. Obrati pažnju na **ključne reči** u pitanjima.\n4. Ako nisi siguran/na, izaberi najlogičniji odgovor.",
      },
      {
        type: "text",
        style: "default",
        content: "## Wortschatz zum Thema Umzug",
      },
      {
        type: "table",
        headers: ["Na nemačkom", "Na srpskom", "Primer"],
        rows: [
          ["der Umzug", "selidba", "Der Umzug war anstrengend."],
          ["einziehen (in + Akk.)", "useliti se", "Wir ziehen nächste Woche ein."],
          ["ausziehen (aus + Dat.)", "iseliti se", "Er zieht aus der Wohnung aus."],
          ["der Nachbar / die Nachbarin", "komšija / komšinica", "Die Nachbarn sind freundlich."],
          ["die Hausordnung", "kućni red", "In der Hausordnung steht, dass..."],
          ["die Miete", "kirija", "Die Miete kostet 800 Euro im Monat."],
          ["der Vermieter", "stanodavac", "Der Vermieter wohnt im Erdgeschoss."],
          ["kündigen", "otkazati (ugovor)", "Ich möchte den Mietvertrag kündigen."],
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "der Umzug", back: "selidba" },
          { front: "einziehen", back: "useliti se" },
          { front: "ausziehen", back: "iseliti se" },
          { front: "der Nachbar", back: "komšija" },
          { front: "die Hausordnung", back: "kućni red" },
          { front: "die Miete", back: "kirija" },
          { front: "der Vermieter", back: "stanodavac" },
          { front: "kündigen", back: "otkazati (ugovor)" },
          { front: "das Erdgeschoss", back: "prizemlje" },
          { front: "der Mietvertrag", back: "ugovor o zakupu" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["der Umzug", "selidba"],
          ["einziehen", "useliti se"],
          ["ausziehen", "iseliti se"],
          ["der Nachbar", "komšija"],
          ["die Hausordnung", "kućni red"],
          ["die Miete", "kirija"],
          ["der Vermieter", "stanodavac"],
          ["der Mieter", "stanar"],
          ["kündigen", "otkazati (ugovor)"],
          ["der Mietvertrag", "ugovor o zakupu"],
          ["das Erdgeschoss", "prizemlje"],
          ["das Stockwerk", "sprat"],
          ["der Aufzug", "lift"],
          ["die Kaution", "depozit"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // "Schreiben B1 — Hotel Mama" — order_index 27
  // ────────────────────────────────────────────────────────────────
  27: {
    sections: [
      {
        type: "badge",
        module: "Modul 7",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji vežbaš **Schreiben B1** — pisanje komentara u Gästebuch na temu 'Hotel Mama' (život kod roditelja kao odrasla osoba).",
      },
      {
        type: "text",
        style: "uebung",
        content: "## Aufgabe — Schreiben Teil 2",
      },
      {
        type: "text",
        style: "default",
        content:
          "Mirjam piše u jednom internet forumu:\n\n*Ich bin 28 und wohne noch bei meinen Eltern. Meine Freunde finden das komisch, aber ich spare viel Geld und meine Mama kocht jeden Tag für mich. Warum soll ich ausziehen? Ich finde das Leben im Hotel Mama super!*\n\nSchreib einen Kommentar (ca. 80 Wörter):\n- Wie findest du Mirjams Meinung?\n- Hast du ähnliche oder andere Erfahrungen?\n- Was sind die Vor- und Nachteile vom Leben bei den Eltern?",
      },
      {
        type: "text",
        style: "default",
        content: "## Struktura odgovora",
      },
      {
        type: "table",
        headers: ["Deo", "Šta pišeš", "Primeri fraza"],
        rows: [
          [
            "Einleitung",
            "Reaguj na Mirjamin komentar",
            "Liebe Mirjam, ich habe deinen Beitrag gelesen und möchte dir meine Meinung sagen.",
          ],
          [
            "Eigene Meinung",
            "Šta ti misliš o toj temi",
            "Ich finde, dass... / Meiner Meinung nach... / Ich kann dich verstehen, aber...",
          ],
          [
            "Begründung",
            "Zašto tako misliš + tvoje iskustvo",
            "In meinem Fall... / Ich persönlich... / Der Grund ist, dass...",
          ],
          [
            "Schluss",
            "Zaključak + pozdrav",
            "Ich wünsche dir alles Gute! / Viele Grüße, [Name]",
          ],
        ],
      },
      {
        type: "spoiler",
        title: "Primer — skica odgovora",
        items: [
          {
            question: "Einleitung — kako početi?",
            answer: "Liebe Mirjam, ich habe deinen Beitrag gelesen. Das Thema 'Hotel Mama' finde ich sehr interessant.",
          },
          {
            question: "Meinung — šta reći?",
            answer: "Ich kann dich verstehen, denn zu Hause ist es bequem und billig. Aber ich finde, dass es auch wichtig ist, selbstständig zu werden.",
          },
          {
            question: "Begründung — tvoje iskustvo?",
            answer: "Ich bin mit 22 ausgezogen und es war am Anfang schwer, aber ich habe viel gelernt: kochen, putzen, Geld verwalten...",
          },
          {
            question: "Schluss — kako završiti?",
            answer: "Mach, was du für richtig hältst! Viele Grüße, [tvoje ime]",
          },
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Vor- und Nachteile — Hotel Mama",
      },
      {
        type: "table",
        headers: ["Vorteile (prednosti)", "Nachteile (mane)"],
        rows: [
          ["Man spart Geld (Miete, Essen).", "Man ist nicht selbstständig."],
          ["Man ist nicht allein.", "Man hat weniger Privatsphäre."],
          ["Mama kocht, wäscht, putzt.", "Man lernt nicht, Verantwortung zu übernehmen."],
          ["Emotionale Unterstützung.", "Konflikte mit den Eltern."],
          ["Keine Sorgen um Rechnungen.", "Freunde oder Partner finden es komisch."],
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "Hotel Mama", back: "život kod roditelja (kao odrasla osoba)" },
          { front: "ausziehen", back: "iseliti se" },
          { front: "selbstständig", back: "samostalan" },
          { front: "die Privatsphäre", back: "privatnost" },
          { front: "die Verantwortung", back: "odgovornost" },
          { front: "sparen", back: "štedeti" },
          { front: "bequem", back: "udobno" },
          { front: "der Beitrag", back: "komentar, objava" },
          { front: "Ich kann dich verstehen, aber...", back: "Razumem te, ali..." },
          { front: "Meiner Meinung nach...", back: "Po mom mišljenju..." },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["das Hotel Mama", "život kod roditelja"],
          ["ausziehen", "iseliti se"],
          ["selbstständig", "samostalan"],
          ["die Privatsphäre", "privatnost"],
          ["die Verantwortung", "odgovornost"],
          ["die Unterstützung", "podrška"],
          ["sparen", "štedeti"],
          ["bequem", "udobno"],
          ["der Beitrag", "komentar, objava"],
          ["die Sorge", "briga"],
          ["der Haushalt", "domaćinstvo"],
          ["verwalten", "upravljati"],
          ["der Konflikt", "konflikt"],
          ["erwachsen", "odrastao"],
        ],
      },
    ],
  },
};

// ─── Import logic ───

async function main() {
  console.log("Importing B1.1 sections...\n");
  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("slug", COURSE_SLUG)
    .single();
  if (!course) {
    console.error("Course not found!");
    return;
  }
  console.log(`Course: ${course.title} (${course.id})\n`);

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .eq("course_id", course.id)
    .order("order_index");
  if (!lessons) return;

  for (const [indexStr, sectionData] of Object.entries(LESSON_SECTIONS)) {
    const orderIndex = Number(indexStr);
    const lesson = lessons.find((l) => l.order_index === orderIndex);
    if (!lesson) {
      console.log(`  SKIP: lesson at index ${orderIndex} not found`);
      continue;
    }
    const { error } = await supabase
      .from("lessons")
      .update({ sections: sectionData.sections })
      .eq("id", lesson.id);
    if (error) {
      console.error(`  ERROR [${orderIndex}] ${lesson.title}: ${error.message}`);
    } else {
      console.log(
        `  OK [${orderIndex}] ${lesson.title} — ${sectionData.sections.length} sections`
      );
    }
  }
  console.log("\nDone!");
}
main().catch(console.error);
