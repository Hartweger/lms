/**
 * Import B1.1 lesson sections (rich content) — Modul 1: Glück im Alltag
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
  // "Rotkäppchen und das Präteritum" — order_index 0
  // ────────────────────────────────────────────────────────────────
  0: {
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
  // "Als oder wenn" — order_index 1
  // ────────────────────────────────────────────────────────────────
  1: {
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
  // "Glück" — order_index 2
  // ────────────────────────────────────────────────────────────────
  2: {
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
  // "Schreiben B1 — E-Mail an einen Freund" — order_index 3
  // ────────────────────────────────────────────────────────────────
  3: {
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
