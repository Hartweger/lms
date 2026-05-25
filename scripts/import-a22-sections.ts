/**
 * Import A2.2 lesson sections (rich content)
 * Run: npx tsx scripts/import-a22-sections.ts
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

const COURSE_SLUG = "nemacki-a2-2";

// ─── Section data for each lesson (by order_index) ───

const LESSON_SECTIONS: Record<number, { sections: unknown[] }> = {
  // ────────────────────────────────────────────────────────────────
  // Lekcija 0: Adventskranz (video — Deutschlandlabor)
  // ────────────────────────────────────────────────────────────────
  0: {
    sections: [
      {
        type: "badge",
        module: "Modul 1",
        category: "wortschatz",
      },
      {
        type: "text",
        style: "info",
        content:
          "Dobrodošli u **A2.2**! U ovom modulu ponavljaš **Konjunktiv II** (hätte, wäre, würde, könnte), učiš veznik **trotzdem** i vežbaš **dialoge** — kako da praviš predloge, dogovaraš termine i reaguješ na tuđe ideje.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Adventskranz\n\nU ovoj kratkoj lekciji upoznaješ se sa nemačkom tradicijom — **Adventskranz** (adventski venac). Pogledaj video i nauči nove reči vezane za praznike.",
      },
      {
        type: "vocabulary",
        rows: [
          ["der Adventskranz, ¨e", "adventski venac"],
          ["die Kerze, -n", "sveća"],
          ["anzünden", "upaliti (sveću)"],
          ["der Advent", "advent (4 nedelje pre Božića)"],
          ["die Tradition, -en", "tradicija"],
          ["das Weihnachten", "Božić"],
          ["der Heiligabend", "Badnje veče"],
          ["das Geschenk, -e", "poklon"],
          ["schmücken", "ukrasiti"],
          ["gemütlich", "prijatno, udobno"],
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — Advent",
        items: [
          {
            question: "Am ersten Advent zündet man die erste __________ an.",
            answer: "Kerze",
          },
          {
            question:
              "An Weihnachten gibt es __________. Die Kinder freuen sich.",
            answer: "Geschenke",
          },
          {
            question:
              "Am 24. Dezember ist __________. Die Familie feiert zusammen.",
            answer: "Heiligabend",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 1: Leseverstehen — Granfluencer (tekst/vežbe)
  // ────────────────────────────────────────────────────────────────
  1: {
    sections: [
      {
        type: "badge",
        module: "Modul 1",
        category: "lesen",
      },
      {
        type: "text",
        style: "info",
        content:
          'U ovoj lekciji čitaš tekst o **Granfluencer-ima** — starijim osobama koje su postale popularne na društvenim mrežama. Vežbaš **čitanje sa razumevanjem** (Leseverstehen).',
      },
      {
        type: "text",
        style: "default",
        content:
          '## Šta su Granfluencer?\n\n**Granfluencer** = **Gran**dparents + In**fluencer**\n\nTo su starije osobe koje koriste Instagram, TikTok ili YouTube i imaju mnogo pratilaca. Oni pokazuju da starost ne znači dosadu — putuju, kuvaju, šminkaju se ili pričaju viceve.',
      },
      {
        type: "vocabulary",
        rows: [
          ["der Influencer, -", "influenser"],
          ["die sozialen Medien (Pl.)", "društvene mreže"],
          ["der Follower, -", "pratilac"],
          ["das Alter", "starost"],
          ["beliebt", "popularan"],
          ["der Rentner, -", "penzioner"],
          ["die Lebensfreude", "radost života"],
          ["beweisen, bewiesen", "dokazati"],
          ["der Trend, -s", "trend"],
          ["inspirieren", "inspirisati"],
        ],
      },
      {
        type: "spoiler",
        title: "Leseverstehen — pitanja",
        items: [
          {
            question: "Was ist ein Granfluencer?",
            answer:
              "Ein Granfluencer ist eine ältere Person, die auf sozialen Medien aktiv ist und viele Follower hat.",
          },
          {
            question: "Warum sind Granfluencer beliebt?",
            answer:
              "Sie zeigen, dass das Alter kein Hindernis ist. Sie sind lustig, kreativ und inspirieren andere Menschen.",
          },
          {
            question: "Auf welchen Plattformen sind Granfluencer aktiv?",
            answer: "Auf Instagram, TikTok und YouTube.",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 2: Priprema za ispit A2 (tekst/vežbe)
  // ────────────────────────────────────────────────────────────────
  2: {
    sections: [
      {
        type: "badge",
        module: "Modul 1",
        category: "schreiben",
      },
      {
        type: "text",
        style: "info",
        content:
          "Ova lekcija ti pomaže da se **pripremiš za ispit A2**. Vežbaš pisanje kratkih tekstova, formulisanje rečenica i ponavljaš najvažniju gramatiku iz A2 nivoa.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Tipovi zadataka na ispitu A2\n\n1. **Lesen** — razumevanje teksta (oglasi, mejlovi, uputstva)\n2. **Hören** — slušanje i razumevanje\n3. **Schreiben** — pisanje kratkog teksta (mejl, poruka)\n4. **Sprechen** — kratka prezentacija i dijalog",
      },
      {
        type: "text",
        style: "uebung",
        content:
          '## Übung: Schreiben\n\nTvoj prijatelj ima rođendan. Napiši mu kratku poruku (3-4 rečenice):\n- Čestitaj mu\n- Pitaj ga šta želi za poklon\n- Predloži da se vidite',
      },
      {
        type: "spoiler",
        title: "Primer odgovora",
        items: [
          {
            question: "Kako bi mogla da izgleda poruka?",
            answer:
              "Lieber Max, herzlichen Glückwunsch zum Geburtstag! Was wünschst du dir? Wollen wir am Samstag zusammen essen gehen? Ich freue mich auf dich! Viele Grüße, Ana",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          {
            front: "Herzlichen Glückwunsch!",
            back: "Srećan rođendan! / Čestitam!",
          },
          {
            front: "Ich wünsche dir alles Gute!",
            back: "Želim ti sve najbolje!",
          },
          { front: "Was wünschst du dir?", back: "Šta želiš (za poklon)?" },
          { front: "Lass uns feiern!", back: "Hajde da slavimo!" },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 3: Weihnachten ist... (video)
  // ────────────────────────────────────────────────────────────────
  3: {
    sections: [
      {
        type: "badge",
        module: "Modul 1",
        category: "wortschatz",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji učiš reči i izraze vezane za **Božić u Nemačkoj** (Weihnachten). Pogledaj video i nauči kako Nemci slave praznike.",
      },
      {
        type: "vocabulary",
        rows: [
          ["der Weihnachtsbaum, ¨e", "jelka"],
          ["der Weihnachtsmarkt, ¨e", "božićni vašar"],
          ["der Glühwein", "kuvano vino"],
          ["der Lebkuchen, -", "medenjak"],
          ["die Bescherung", "deljenje poklona"],
          ["das Plätzchen, -", "božićni kolačić"],
          ["das Christkind", "Hristovo dete (donosi poklone)"],
          ["der Weihnachtsmann", "Deda Mraz"],
          ["die Stille Nacht", "Tiha noć (pesma)"],
          ["feiern", "slaviti"],
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — Weihnachten",
        items: [
          {
            question:
              "Auf dem __________ kann man Glühwein trinken und Geschenke kaufen.",
            answer: "Weihnachtsmarkt",
          },
          {
            question:
              "In Süddeutschland bringt das __________ die Geschenke, in Norddeutschland der __________.",
            answer: "Christkind, Weihnachtsmann",
          },
          {
            question:
              "Am Heiligabend steht der __________ im Wohnzimmer. Die Familie singt Lieder.",
            answer: "Weihnachtsbaum",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 4: Hätte und wäre (video: 854373871)
  // ────────────────────────────────────────────────────────────────
  4: {
    sections: [
      {
        type: "badge",
        module: "Modul 1",
        category: "grammatik",
      },
      {
        type: "video",
        vimeoId: "854373871",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji učiš **Konjunktiv II** — kako da izraziš **želje** na nemačkom. Tri ključna glagola: **wäre** (bio bih), **hätte** (imao bih) i **würde** (bih + glagol).",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Tri oblika — jetzt, gestern, Wunsch\n\nPogledaj kako se menjaju sein i haben:",
      },
      {
        type: "table",
        headers: ["", "jetzt (sadašnjost)", "gestern (prošlost)", "Wunsch (želja)"],
        rows: [
          ["ich", "bin", "war", "<mark>wäre</mark>"],
          ["du", "bist", "warst", "<mark>wärst</mark>"],
          ["er/sie/es", "ist", "war", "<mark>wäre</mark>"],
          ["wir", "sind", "waren", "<mark>wären</mark>"],
          ["ihr", "seid", "wart", "<mark>wärt</mark>"],
          ["sie/Sie", "sind", "waren", "<mark>wären</mark>"],
        ],
      },
      {
        type: "table",
        headers: ["", "jetzt", "gestern", "Wunsch"],
        rows: [
          ["ich", "habe", "hatte", "<mark>hätte</mark>"],
          ["du", "hast", "hattest", "<mark>hättest</mark>"],
          ["er/sie/es", "hat", "hatte", "<mark>hätte</mark>"],
          ["wir", "haben", "hatten", "<mark>hätten</mark>"],
          ["ihr", "habt", "hattet", "<mark>hättet</mark>"],
          ["sie/Sie", "haben", "hatten", "<mark>hätten</mark>"],
        ],
      },
      {
        type: "formula",
        content:
          "ich **bin** → ja **sam** | ich **war** → **bila** sam | ich **wäre** → **bila bih**\nich **habe** → **imam** | ich **hatte** → **imala** sam | ich **hätte** → **imala bih**",
      },
      {
        type: "text",
        style: "default",
        content:
          '## ich hätte vs. ich wäre\n\n**hätte** = imao bih → koristi se kad želiš neku **stvar** (imenica)\n**wäre** = bio bih → koristi se kad želiš biti **negde** ili **nekakav** (pridev/mesto)',
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "Ich **hätte** gern ein schönes Haus. *(Imala bih rado lepu kuću.)*\nIch **hätte** gern einen Porsche. *(Imala bih rado Porše.)*\nIch **hätte** gern mehr Zeit. *(Imala bih rado više vremena.)*\n\nIch **wäre** gern am Meer. *(Bila bih rado na moru.)*\nIch **wäre** gerne reich. *(Bila bih rado bogata.)*",
      },
      {
        type: "text",
        style: "default",
        content:
          "## würde + Infinitiv — želja sa glagolom\n\n**würde** se koristi kad želiš nešto **raditi**:",
      },
      {
        type: "table",
        headers: ["Lice", "würde"],
        rows: [
          ["ich", "<mark>würde</mark>"],
          ["du", "<mark>würdest</mark>"],
          ["er/sie/es", "<mark>würde</mark>"],
          ["wir", "<mark>würden</mark>"],
          ["ihr", "<mark>würdet</mark>"],
          ["sie/Sie", "<mark>würden</mark>"],
        ],
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "Ich **würde** gern schlafen. *(Spavala bih.)*\nIch **würde** gern eine Reise machen. *(Putovala bih.)*\nWir **würden** gern etwas zusammen spielen. *(Igrali bismo nešto zajedno.)*",
      },
      {
        type: "text",
        style: "default",
        content: "## könnte — Konjunktiv II od können\n\nKoristi se za **predloge**:",
      },
      {
        type: "table",
        headers: ["Lice", "könnte"],
        rows: [
          ["ich", "<mark>könnte</mark>"],
          ["du", "<mark>könntest</mark>"],
          ["er/sie/es", "<mark>könnte</mark>"],
          ["wir/Sie", "<mark>könnten</mark>"],
        ],
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "Wir **könnten** ins Kino gehen. *(Mogli bismo u bioskop.)*\nDu **könntest** auch mitmachen. *(Mogla bi i ti da učestvuješ.)*",
      },
      {
        type: "spoiler",
        title: "Vežba — hätte, wäre ili würde?",
        items: [
          {
            question: "Ich __________ gern mehr Freizeit.",
            answer: "hätte (želim stvar → hätte)",
          },
          {
            question: "Er __________ gern am Strand.",
            answer: "wäre (želi biti negde → wäre)",
          },
          {
            question: "Wir __________ gern Fußball spielen.",
            answer: "würden (žele raditi nešto → würde + Infinitiv)",
          },
          {
            question: "Sie __________ gern ein neues Auto.",
            answer: "hätte",
          },
          {
            question: "Ich __________ gern 18 Jahre alt.",
            answer: "wäre",
          },
          {
            question: "__________ wir am Samstag zusammen frühstücken?",
            answer: "Könnten (predlog → könnte)",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "Ich wäre gern am Meer.", back: "Bila bih rado na moru." },
          {
            front: "Ich hätte gern mehr Zeit.",
            back: "Imala bih rado više vremena.",
          },
          {
            front: "Ich würde gern eine Reise machen.",
            back: "Putovala bih rado.",
          },
          {
            front: "Wir könnten ins Kino gehen.",
            back: "Mogli bismo u bioskop.",
          },
          {
            front: "Du könntest auch mitmachen.",
            back: "Mogla bi i ti da učestvuješ.",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 5: Video — Wandern (video: 1177240519)
  // ────────────────────────────────────────────────────────────────
  5: {
    sections: [
      {
        type: "badge",
        module: "Modul 1",
        category: "wortschatz",
      },
      {
        type: "video",
        vimeoId: "1177240519",
      },
      {
        type: "text",
        style: "info",
        content:
          "Nemci obožavaju **planinarenje** (Wandern)! U ovoj lekciji učiš vokabular vezan za prirodu i aktivnosti na otvorenom.",
      },
      {
        type: "vocabulary",
        rows: [
          ["wandern", "planinariti, pešačiti"],
          ["der Wanderweg, -e", "planinarska staza"],
          ["der Gipfel, -", "vrh (planine)"],
          ["die Landschaft, -en", "pejzaž, predeo"],
          ["der Wald, ¨er", "šuma"],
          ["die Hütte, -n", "planinarska kuća"],
          ["der Rucksack, ¨e", "ranac"],
          ["die Wanderschuhe (Pl.)", "planinarske cipele"],
          ["die Aussicht, -en", "pogled, vidik"],
          ["sich ausruhen", "odmoriti se"],
          ["anstrengend", "naporan"],
          ["wunderschön", "prelepo"],
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — Wandern",
        items: [
          {
            question:
              "Bevor man wandert, braucht man gute __________ und einen __________.",
            answer: "Wanderschuhe, Rucksack",
          },
          {
            question: "Vom __________ hat man eine tolle __________ auf die Landschaft.",
            answer: "Gipfel, Aussicht",
          },
          {
            question:
              "Nach einer langen Wanderung kann man sich in einer __________ __________.",
            answer: "Hütte, ausruhen",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 6: Trotzdem (video: 855114696)
  // ────────────────────────────────────────────────────────────────
  6: {
    sections: [
      {
        type: "badge",
        module: "Modul 1",
        category: "grammatik",
      },
      {
        type: "video",
        vimeoId: "855114696",
      },
      {
        type: "text",
        style: "info",
        content:
          'U ovoj lekciji učiš veznik **trotzdem** — kako da izraziš **suprotnost** ("ipak", "uprkos tome").',
      },
      {
        type: "formula",
        content:
          'Rečenica 1 (problem). **Trotzdem** + <mark>glagol</mark> + subjekat + ostatak.\n\n"Trotzdem" = "ipak" — glagol dolazi odmah posle!',
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "Das Wetter ist nicht besonders schön. **Trotzdem** <mark>machen</mark> wir einen Ausflug.\n\nEs regnet. **Trotzdem** <mark>gehe</mark> ich spazieren.\n\nSie ist krank. **Trotzdem** <mark>kommt</mark> sie zur Party.\n\nIch habe den Zug verpasst. **Trotzdem** <mark>komme</mark> ich pünktlich zur Arbeit.\n\nDer Film war langweilig. **Trotzdem** <mark>habe</mark> ich gelacht.",
      },
      {
        type: "table",
        headers: ["Trotzdem", "Glagol (pozicija 2)", "Subjekat", "Ostatak"],
        rows: [
          ["Trotzdem", "<mark>fahre</mark>", "ich", "in Urlaub."],
          ["Trotzdem", "<mark>läuft</mark>", "deine Tochter", "im T-Shirt herum."],
          ["Trotzdem", "<mark>muss</mark>", "ich", "gehen."],
          ["Trotzdem", "<mark>gehe</mark>", "ich", "mit dir ins Kino."],
          ["Trotzdem", "<mark>übe</mark>", "ich", "eine halbe Stunde Klavier."],
        ],
      },
      {
        type: "spoiler",
        title: "Vežba — trotzdem rečenice",
        items: [
          {
            question: "Ich bin müde. Trotzdem __________ ich nicht. (schlafen)",
            answer: "schlafe",
          },
          {
            question:
              "Er hat wenig Geld. Trotzdem __________ er ein neues Handy. (kaufen)",
            answer: "kauft",
          },
          {
            question:
              "Es ist kalt. Trotzdem __________ die Kinder draußen. (spielen)",
            answer: "spielen",
          },
          {
            question:
              "Sie hat keine Zeit. Trotzdem __________ sie mir beim Umzug. (helfen)",
            answer: "hilft",
          },
          {
            question:
              "Das Essen war nicht gut. Trotzdem __________ ich alles __________. (aufessen)",
            answer: "habe ... aufgegessen",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          {
            front: "Es regnet. Trotzdem gehe ich spazieren.",
            back: "Pada kiša. Ipak idem u šetnju.",
          },
          {
            front: "Sie ist krank. Trotzdem kommt sie zur Party.",
            back: "Bolesna je. Ipak dolazi na žurku.",
          },
          {
            front: "Ich bin müde. Trotzdem lerne ich weiter.",
            back: "Umorna sam. Ipak nastavljam da učim.",
          },
          {
            front: "Er hat wenig Zeit. Trotzdem hilft er mir.",
            back: "Ima malo vremena. Ipak mi pomaže.",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 7: Dialoge führen (video: 855262494)
  // ────────────────────────────────────────────────────────────────
  7: {
    sections: [
      {
        type: "badge",
        module: "Modul 2",
        category: "wortschatz",
      },
      {
        type: "video",
        vimeoId: "855262494",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji učiš kako da **vodiš dijaloge** na nemačkom — da praviš **predloge**, dogovaraš **termine** i reaguješ na tuđe ideje (pozitivno i negativno).",
      },
      {
        type: "text",
        style: "default",
        content: "## Vorschlag machen — kako napraviti predlog",
      },
      {
        type: "table",
        headers: ["Nemački", "Srpski"],
        rows: [
          ["Ich habe eine Idee …", "Imam ideju…"],
          ["Ich schlage vor, dass …", "Predlažem da…"],
          ["Wollen wir …?", "Hoćemo li…?"],
          ["Wir können auch …", "Mi možemo takođe…"],
          ["Was meinst du?", "Šta ti misliš?"],
          ["Wie wäre es mit …?", "Šta kažeš za…?"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Vorschlag ist gut — sviđa ti se predlog",
      },
      {
        type: "table",
        headers: ["Nemački", "Srpski"],
        rows: [
          ["Das ist eine gute Idee.", "To je dobra ideja."],
          ["Das finde ich gut/super/prima.", "To mi se sviđa."],
          ["Einverstanden! / In Ordnung!", "Važi! / U redu!"],
          ["Ja, gut. Machen wir das so.", "Da, dobro. Hajde tako."],
          ["Ich bin dafür.", "Ja sam za to."],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Du bist nicht sicher — nisi sigurna",
      },
      {
        type: "table",
        headers: ["Nemački", "Srpski"],
        rows: [
          [
            "Das ist eine gute Idee, aber...",
            "To je dobra ideja, ali...",
          ],
          [
            "Ich finde es besser, wenn...",
            "Mislim da je bolje ako...",
          ],
          ["Wir könnten aber auch...", "Mogli bismo i…"],
          [
            "Vielleicht sollten wir lieber...?",
            "Možda bi trebalo radije…?",
          ],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Vorschlag ist nicht gut — ne sviđa ti se",
      },
      {
        type: "table",
        headers: ["Nemački", "Srpski"],
        rows: [
          ["Das finde ich nicht gut.", "To mi se ne sviđa."],
          ["Das gefällt mir nicht so gut.", "To mi se ne dopada baš."],
          ["Ich bin dagegen.", "Ja sam protiv toga."],
          ["Nein, dazu habe ich keine Lust.", "Ne, nemam volje za to."],
          ["Besser ist es, wenn...", "Bolje je ako…"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Termin ausmachen — dogovoriti termin",
      },
      {
        type: "table",
        headers: ["Nemački", "Srpski"],
        rows: [
          ["Hast du am Freitag Zeit?", "Imaš li u petak vremena?"],
          ["Wollen wir uns am Freitag treffen?", "Hoćemo li se naći u petak?"],
          ["Wie wäre es mit Freitag?", "Šta kažeš za petak?"],
          ["Passt es dir am Freitag um acht?", "Da li ti odgovara petak u osam?"],
          ["Ja, das geht. / Ja, das passt mir gut.", "Da, to važi. / Da, odgovara mi."],
          [
            "Nein, am Freitag kann ich leider nicht.",
            "Ne, u petak nažalost ne mogu.",
          ],
        ],
      },
      {
        type: "spoiler",
        title: "Primer dijaloga",
        items: [
          {
            question: "A: Hallo Robert, wir wollen doch am Sonntag einen Ausflug machen.",
            answer:
              "B: Ja, stimmt. Das Wetter soll gut werden.\nA: Ich schlage vor, dass wir mit dem Fahrrad an den See fahren.\nB: Ich würde lieber in die Berge fahren.\nA: Ich finde die Berge auch okay, aber ich würde gern schwimmen gehen.",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "Ich schlage vor, dass...", back: "Predlažem da..." },
          { front: "Das finde ich gut!", back: "To mi se sviđa!" },
          { front: "Ich bin dagegen.", back: "Ja sam protiv toga." },
          { front: "Hast du am Freitag Zeit?", back: "Imaš li u petak vremena?" },
          { front: "Ja, das passt mir gut.", back: "Da, odgovara mi." },
          {
            front: "Nein, am Freitag geht es leider nicht.",
            back: "Ne, u petak nažalost ne može.",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 8: Sätze formulieren (video: 857457127)
  // ────────────────────────────────────────────────────────────────
  8: {
    sections: [
      {
        type: "badge",
        module: "Modul 2",
        category: "schreiben",
      },
      {
        type: "video",
        vimeoId: "857457127",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji vežbaš **pisanje kratkih tekstova** i **formulisanje rečenica**. Cilj: pravilno koristiti red reči i vremenske izraze.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Lückentext — Meine Wohnung\n\nPopuni prazna mesta odgovarajućom rečju:",
      },
      {
        type: "spoiler",
        title: "Lückentext — Wohnung",
        items: [
          {
            question:
              "Ich wohne (1) __________ in der Marktstraße.",
            answer: "in einem Haus",
          },
          {
            question: "Unsere Wohnung ist (2) __________ und hat drei (3) __________.",
            answer: "im ersten Stock, Zimmer",
          },
          {
            question: "Im Erdgeschoss sind zwei (4) __________.",
            answer: "kleine Geschäfte",
          },
          {
            question:
              "Das eine Geschäft ist (5) __________ und in dem anderen kann man Fahrräder (6) __________.",
            answer: "ein Obstladen, kaufen",
          },
          {
            question:
              "Neben dem Haus ist eine (7) __________ und hinter dem Haus gibt es einen Garten (8) __________.",
            answer: "Garage, mit großen Bäumen",
          },
          {
            question:
              "Das Rathaus und die Kirche sind (9) __________. Auf der Marktstraße ist sehr viel (10) __________. Da (11) __________ viele Autos und Busse.",
            answer: "in der Nähe, Verkehr, fahren",
          },
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "## Häufigkeitsadverbien — koliko često?\n\nUbaci odgovarajući prilog u rečenicu:",
      },
      {
        type: "table",
        headers: ["Prilog", "Srpski"],
        rows: [
          ["<mark>immer</mark>", "uvek"],
          ["<mark>meistens</mark>", "uglavnom"],
          ["<mark>oft</mark>", "često"],
          ["<mark>manchmal</mark>", "ponekad"],
          ["<mark>nur selten</mark>", "samo retko"],
          ["<mark>fast nie</mark>", "skoro nikad"],
          ["<mark>zweimal pro Woche</mark>", "dva puta nedeljno"],
          ["<mark>einmal am Tag</mark>", "jednom dnevno"],
        ],
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "Morgens **stehe** ich **immer** um 7 Uhr auf.\nZum Frühstück trinke ich **meistens** Milchkaffee.\nIch spiele **zweimal pro Woche** mit meinen Freunden Tennis.\n**Einmal am Tag** esse ich zusammen mit meiner Familie.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Lückentext — Brief\n\nPopuni pismo odgovarajućim glagolima:",
      },
      {
        type: "spoiler",
        title: "Brief an Peter",
        items: [
          {
            question:
              "Hallo Peter, __________ ich für zwei Wochen bei dir __________?",
            answer: "kann ... wohnen",
          },
          {
            question: "Ich __________ einen Deutschkurs in Hannover.",
            answer: "mache",
          },
          {
            question:
              "Die Schule __________ direkt neben deiner Wohnung.",
            answer: "liegt",
          },
          {
            question:
              "Du siehst, ich __________ ordentlich und __________ auch jeden Tag das Bad.",
            answer: "bin ... putze",
          },
          {
            question:
              "Abends __________ ich immer für uns __________.",
            answer: "kann ... kochen",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 9: Dunkelrestaurant (tekst/vežbe)
  // ────────────────────────────────────────────────────────────────
  9: {
    sections: [
      {
        type: "badge",
        module: "Modul 2",
        category: "lesen",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji čitaš tekst o **Dunkelrestaurant** — restoranu u mraku! Vežbaš čitanje sa razumevanjem i učiš nov vokabular.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Dinner in the Dark\n\n**Der Gedanke:** Ein Restaurant ohne Licht — es ist ganz dunkel. Sie können Ihre eigene Hand nicht sehen. Eine völlig neue Erfahrung. Jetzt zählt nur noch das Hören, Riechen, Fühlen und Schmecken!\n\n**Der Weg:** Sie bestellen Ihr Essen im Vorraum bei Licht. Sie können zwischen sieben verschiedenen Menüs wählen. Aber im Restaurant wissen Sie nicht genau, was Sie essen. Ein Kellner führt Sie an der Hand in den völlig dunklen Gastraum. Oft sind die Kellner sehbehindert oder blind.\n\n**Das Essen:** Alles hat seinen Platz. Löffel, Messer, Gabel, Gläser, Serviette… Wenn Sie sich an die Dunkelheit gewöhnt haben, schenken Sie ihr Getränk selbst ein. Hören Sie, wenn das Glas voll ist? Treffe ich meinen Mund?\n\n**Das Ende:** Nach zwei bis drei Stunden und vielen neuen Eindrücken \\\"dürfen\\\" Sie wieder ans Licht.",
      },
      {
        type: "vocabulary",
        rows: [
          ["der Gedanke, -n", "misao, zamisao"],
          ["völlig neu", "potpuno novo"],
          ["riechen, gerochen", "mirisati"],
          ["das Geräusch, -e", "šum, zvuk"],
          ["der Geruch, ¨e", "miris"],
          ["das Erlebnis, -se", "doživljaj"],
          ["der Vorraum, ¨e", "predsoblje"],
          ["erkennen, erkannt", "prepoznati"],
          ["sehbehindert", "slabovid"],
          ["blind", "slep"],
          ["sich gewöhnen an + Akk.", "navići se na"],
          ["einschenken", "sipati (piće)"],
          ["überhaupt", "uopšte"],
          ["der Eindruck, ¨e", "utisak"],
          ["benutzen", "koristiti"],
        ],
      },
      {
        type: "spoiler",
        title: "Leseverstehen — Fragen",
        items: [
          {
            question: "Was ist das Besondere an diesen Restaurants?",
            answer:
              "Es ist ganz dunkel. Man kann nichts sehen und muss mit den anderen Sinnen (hören, riechen, schmecken, fühlen) essen.",
          },
          {
            question: "Wo bestellen die Gäste das Essen?",
            answer: "Im Vorraum bei Licht.",
          },
          {
            question: "Wie kommen die Gäste in den Gastraum?",
            answer:
              "Ein Kellner führt sie an der Hand in den dunklen Gastraum.",
          },
          {
            question: "Wie lange bleiben die Gäste im Dunkeln?",
            answer: "Zwei bis drei Stunden.",
          },
          {
            question: "Darf man rauchen?",
            answer: "Nein, Rauchen ist natürlich verboten.",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "das Erlebnis", back: "doživljaj" },
          { front: "sehbehindert", back: "slabovid" },
          { front: "sich gewöhnen an", back: "navići se na" },
          { front: "einschenken", back: "sipati (piće)" },
          { front: "der Eindruck", back: "utisak" },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 10: Auf dem Flohmarkt (tekst/vežbe)
  // ────────────────────────────────────────────────────────────────
  10: {
    sections: [
      {
        type: "badge",
        module: "Modul 2",
        category: "wortschatz",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji učiš vokabular vezan za **buvljak** (Flohmarkt) — kako da opišeš predmete, pitaš za cenu i pregovaraš.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Auf dem Flohmarkt\n\nBuvljaci su veoma popularni u Nemačkoj. Ljudi prodaju stare stvari: odeću, knjige, igračke, nameštaj, posuđe. Cene su obično niske i može se pregovarati.",
      },
      {
        type: "vocabulary",
        rows: [
          ["der Flohmarkt, ¨e", "buvljak"],
          ["der Gegenstand, ¨e", "predmet"],
          ["gebraucht", "polovan"],
          ["der Verkäufer, -", "prodavac"],
          ["der Käufer, -", "kupac"],
          ["handeln", "pregovarati (o ceni)"],
          ["das Schnäppchen, -", "povoljna kupovina"],
          ["die Verhandlung, -en", "pregovaranje"],
          ["günstig", "povoljno"],
          ["Was kostet das?", "Koliko to košta?"],
          ["Können Sie mir einen besseren Preis machen?", "Možete li mi dati bolju cenu?"],
          ["Das ist mir zu teuer.", "To mi je preskupo."],
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "## Gegenstände beschreiben — opisivanje predmeta\n\nKada opisuješ predmet, koristi prideve sa deklinacijom:",
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "Das ist **eine alte** Lampe. *(To je stara lampa.)*\nIch suche **einen blauen** Schal. *(Tražim plavi šal.)*\nDie Vase ist aus **schönem** Glas. *(Vaza je od lepog stakla.)*",
      },
      {
        type: "spoiler",
        title: "Dijalog — Auf dem Flohmarkt",
        items: [
          {
            question: "Käufer: Was kostet die alte Lampe?",
            answer:
              "Verkäufer: Die kostet 15 Euro.\nKäufer: Das ist mir zu teuer. Können Sie mir einen besseren Preis machen?\nVerkäufer: Na gut, für Sie 10 Euro.\nKäufer: Einverstanden! Ich nehme sie.",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 11: Deklinacija prideva (video: 858916151)
  // ────────────────────────────────────────────────────────────────
  11: {
    sections: [
      {
        type: "badge",
        module: "Modul 3",
        category: "grammatik",
      },
      {
        type: "video",
        vimeoId: "858916151",
      },
      {
        type: "text",
        style: "info",
        content:
          "Ovo je jedna od **najvažnijih** gramatičkih tema na A2 nivou — **deklinacija prideva**. Naučićeš kako pridev dobija nastavak zavisno od člana i padeža.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Pravilo: Neko mora nositi nastavak!\n\nNavstavak **-er, -e, -es, -em, -en** mora da se pojavi — ili na članu, ili na pridevu.\n\n- Ako član ima nastavak → pridev dobija **-e** ili **-en**\n- Ako član nema nastavak (ein gol) → pridev preuzima nastavak člana",
      },
      {
        type: "text",
        style: "default",
        content: "## 1. Posle određenog člana (der, die, das)\n\nIde **-e** ili **-en**:",
      },
      {
        type: "table",
        headers: ["Kasus", "Maskulinum", "Femininum", "Neutrum", "Plural"],
        rows: [
          ["Nominativ", "der gut-<mark>e</mark> Mann", "die gut-<mark>e</mark> Frau", "das gut-<mark>e</mark> Kind", "die gut-<mark>en</mark> Kinder"],
          ["Dativ", "dem gut-<mark>en</mark> Mann", "der gut-<mark>en</mark> Frau", "dem gut-<mark>en</mark> Kind", "den gut-<mark>en</mark> Kindern"],
          ["Akkusativ", "den gut-<mark>en</mark> Mann", "die gut-<mark>e</mark> Frau", "das gut-<mark>e</mark> Kind", "die gut-<mark>en</mark> Kinder"],
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          '## 2. Posle neodređenog člana (ein, eine, mein, kein)\n\nAko je "ein golo" (bez nastavka) → pridev preuzima nastavak:',
      },
      {
        type: "table",
        headers: ["Kasus", "Maskulinum", "Femininum", "Neutrum", "Plural (keine)"],
        rows: [
          ["Nominativ", "ein gut-<mark>er</mark> Mann", "eine gut-<mark>e</mark> Frau", "ein gut-<mark>es</mark> Kind", "keine gut-<mark>en</mark> Leute"],
          ["Dativ", "einem gut-<mark>en</mark> Mann", "einer gut-<mark>en</mark> Frau", "einem gut-<mark>en</mark> Kind", "keinen gut-<mark>en</mark> Leuten"],
          ["Akkusativ", "einen gut-<mark>en</mark> Mann", "eine gut-<mark>e</mark> Frau", "ein gut-<mark>es</mark> Kind", "keine gut-<mark>en</mark> Leute"],
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "## 3. Bez člana (jaka deklinacija)\n\nPridev preuzima nastavak određenog člana:",
      },
      {
        type: "table",
        headers: ["Kasus", "Maskulinum", "Femininum", "Neutrum", "Plural"],
        rows: [
          ["Nominativ", "gut-<mark>er</mark>", "gut-<mark>e</mark>", "gut-<mark>es</mark>", "gut-<mark>e</mark>"],
          ["Dativ", "gut-<mark>em</mark>", "gut-<mark>er</mark>", "gut-<mark>em</mark>", "gut-<mark>en</mark>"],
          ["Akkusativ", "gut-<mark>en</mark>", "gut-<mark>e</mark>", "gut-<mark>es</mark>", "gut-<mark>e</mark>"],
        ],
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "Anna ist **eine junge** Frau mit **blonden** Haaren und **blauen** Augen.\nSie hat **eine schlanke** Figur und **eine positive** Einstellung.\n\nMarkus ist **ein charismatischer** Mann mit **dunklen** Haaren.\nEr trägt immer **einen gepflegten** Bart.\n\nDer kleine Hund läuft **im schönen** Park. Er trägt **ein buntes** Halsband.",
      },
      {
        type: "spoiler",
        title: "Vežba — deklinacija prideva",
        items: [
          {
            question: "Ich trinke gern __________ Kaffee. (stark)",
            answer: "starken (Akk. mask., ohne Artikel → starken)",
          },
          {
            question: "Sie hat __________ Augen. (blau)",
            answer: "blaue (Akk. Plural, ohne Artikel → blaue)",
          },
          {
            question: "Er ist ein __________ Mann. (freundlich)",
            answer: "freundlicher (Nom. mask., ein-golo → freundlicher)",
          },
          {
            question: "Ich suche die __________ Tasche. (rot)",
            answer: "rote (Akk. fem., die → rote)",
          },
          {
            question: "Er arbeitet in einem __________ Büro. (groß)",
            answer: "großen (Dat. neutr., einem → großen)",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 12: Pasiv (video: 861148151)
  // ────────────────────────────────────────────────────────────────
  12: {
    sections: [
      {
        type: "badge",
        module: "Modul 3",
        category: "grammatik",
      },
      {
        type: "video",
        vimeoId: "861148151",
      },
      {
        type: "text",
        style: "info",
        content:
          'U ovoj lekciji učiš **pasiv** — kako da kažeš "nešto se radi" bez da kažeš ko to radi.',
      },
      {
        type: "formula",
        content:
          '**Aktiv:** In Deutschland <mark>trinkt man</mark> Bier.\n**Pasiv:** In Deutschland <mark>wird</mark> Bier <mark>getrunken</mark>.\n\nFormula: **werden** (konjugirano) + **Partizip II** (na kraju)',
      },
      {
        type: "table",
        headers: ["Lice", "werden"],
        rows: [
          ["ich", "<mark>werde</mark>"],
          ["du", "<mark>wirst</mark>"],
          ["er/sie/es", "<mark>wird</mark>"],
          ["wir", "<mark>werden</mark>"],
          ["ihr", "<mark>werdet</mark>"],
          ["sie/Sie", "<mark>werden</mark>"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Primeri po mestu",
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "**Im Restaurant:**\nIm Restaurant **wird** das Essen **bestellt**.\nIm Restaurant **werden** die Tische **gedeckt**.\nIm Restaurant **werden** Speisekarten **geschrieben**.\nIm Restaurant **wird** **gekocht**.\n\n**In der Schule:**\nIn der Schule **wird** **gerechnet**.\nIn der Schule **werden** Tests **geschrieben**.\nIn der Schule **wird** Sport **gemacht**.\n\n**In der Küche:**\nIn der Küche **werden** Kartoffeln **gekocht**.\nIn der Küche **werden** Gurken **geschnitten**.\nIn der Küche **wird** das Fleisch **angebraten**.\n\n**Am Flughafen:**\nAm Flughafen **wird** der Ausweis **vorgezeigt**.\nAm Flughafen **wird** das Gepäck **abgegeben**.\nAm Flughafen **wird** **gewartet**.\n\n**Im Supermarkt:**\nIm Supermarkt **werden** Preise **aufgeklebt**.\nIm Supermarkt **werden** Dosen ins Regal **gestellt**.",
      },
      {
        type: "spoiler",
        title: "Vežba — Pasiv",
        items: [
          {
            question: "Im Schwimmbad __________ __________. (schwimmen)",
            answer: "wird geschwommen",
          },
          {
            question:
              "Auf dem Bauernhof __________ die Tiere __________. (füttern)",
            answer: "werden gefüttert",
          },
          {
            question: "Im Kaufhaus __________ Jeans __________. (kaufen)",
            answer: "werden gekauft",
          },
          {
            question:
              "Im Kaufhaus __________ Kaffee __________. (trinken)",
            answer: "wird getrunken",
          },
          {
            question:
              "Auf dem Bauernhof __________ Gemüse __________. (pflanzen)",
            answer: "wird gepflanzt",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          {
            front: "In Deutschland wird Bier getrunken.",
            back: "U Nemačkoj se pije pivo.",
          },
          {
            front: "Im Restaurant werden die Tische gedeckt.",
            back: "U restoranu se postavljaju stolovi.",
          },
          {
            front: "Am Flughafen wird der Ausweis vorgezeigt.",
            back: "Na aerodromu se pokazuje lična karta.",
          },
          {
            front: "In der Schule werden Tests geschrieben.",
            back: "U školi se pišu testovi.",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 13: Deklinacija prideva — Wiederholung (tekst/vežbe)
  // ────────────────────────────────────────────────────────────────
  13: {
    sections: [
      {
        type: "badge",
        module: "Modul 3",
        category: "grammatik",
      },
      {
        type: "text",
        style: "info",
        content:
          "Ponavljanje deklinacije prideva sa dodatnim vežbama. Koristi ovu lekciju da utvrdiš pravila iz lekcije 11.",
      },
      {
        type: "text",
        style: "default",
        content:
          '## Puškica — tri tipa deklinacije\n\n**Slaba deklinacija** (posle der/die/das): ide **-e** ili **-en**\n\n**Mešovita deklinacija** (posle ein/eine/mein/kein): ako je "ein golo" → pridev preuzima nastavak (-er, -es); inače → **-en**\n\n**Jaka deklinacija** (bez člana): pridev preuzima nastavak određenog člana',
      },
      {
        type: "spoiler",
        title: "Vežba — popuni prazan prostor",
        items: [
          {
            question: "Ich habe einen neu__________ Computer gekauft.",
            answer: "neuen (Akk. mask., einen → -en)",
          },
          {
            question: "Das ist eine schön__________ Idee!",
            answer: "schöne (Nom. fem., eine → -e)",
          },
          {
            question: "Mit gut__________ Freunden macht alles Spaß.",
            answer: "guten (Dat. Plural, ohne Artikel → -en)",
          },
          {
            question: "Ich mag das kalt__________ Wetter nicht.",
            answer: "kalte (Akk. neutr., das → -e)",
          },
          {
            question: "Er trinkt gern deutsch__________ Bier.",
            answer: "deutsches (Akk. neutr., ohne Artikel → -es)",
          },
          {
            question: "Sie trägt eine rot__________ Jacke.",
            answer: "rote (Akk. fem., eine → -e)",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 14: Über das Internet (video: 1177242845)
  // ────────────────────────────────────────────────────────────────
  14: {
    sections: [
      {
        type: "badge",
        module: "Modul 3",
        category: "wortschatz",
      },
      {
        type: "video",
        vimeoId: "1177242845",
      },
      {
        type: "text",
        style: "info",
        content:
          "Kratka lekcija o **internetu** i digitalnoj komunikaciji u Nemačkoj.",
      },
      {
        type: "vocabulary",
        rows: [
          ["das Internet", "internet"],
          ["die Webseite, -n", "veb stranica"],
          ["die E-Mail, -s", "imejl"],
          ["herunterladen", "preuzeti (download)"],
          ["hochladen", "postaviti (upload)"],
          ["die Suchmaschine, -n", "pretraživač"],
          ["das Passwort, ¨er", "lozinka"],
          ["der Benutzername, -n", "korisničko ime"],
          ["sich anmelden", "prijaviti se"],
          ["online", "na internetu"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 15: Mit freundlichen Grüßen (video: 1177245126)
  // ────────────────────────────────────────────────────────────────
  15: {
    sections: [
      {
        type: "badge",
        module: "Modul 3",
        category: "schreiben",
      },
      {
        type: "video",
        vimeoId: "1177245126",
      },
      {
        type: "text",
        style: "info",
        content:
          "Kratka lekcija o tome kako se piše **formalni mejl** na nemačkom — pozdrav, sadržaj, završetak.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Struktura formalnog mejla\n\n1. **Anrede:** Sehr geehrte Frau… / Sehr geehrter Herr…\n2. **Grund:** Ich schreibe Ihnen, weil…\n3. **Inhalt:** detaljnije objašnjenje\n4. **Schluss:** Mit freundlichen Grüßen",
      },
      {
        type: "vocabulary",
        rows: [
          ["Sehr geehrte Damen und Herren,", "Poštovane dame i gospodo,"],
          ["Sehr geehrte Frau Müller,", "Poštovana gospođo Miler,"],
          ["Mit freundlichen Grüßen", "S poštovanjem"],
          ["Ich möchte mich beschweren.", "Želim da se požalim."],
          ["Ich bitte Sie um Informationen.", "Molim Vas za informacije."],
          ["Vielen Dank im Voraus.", "Unapred hvala."],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 16: Komparacija prideva (video: 865470597)
  // ────────────────────────────────────────────────────────────────
  16: {
    sections: [
      {
        type: "badge",
        module: "Modul 4",
        category: "grammatik",
      },
      {
        type: "video",
        vimeoId: "865470597",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji učiš **komparaciju prideva** — kako da porediš stvari na nemačkom (veće, manje, najlepše…).",
      },
      {
        type: "text",
        style: "default",
        content: "## Komparativ — poređenje\n\nPridev + **-er** + **als**",
      },
      {
        type: "formula",
        content:
          "klein → klein**er** | schön → schön**er** | schnell → schnell**er**\n\nAli pridevi sa a, o, u dobijaju umlaut:\nalt → **ält**er | jung → **jüng**er | kurz → **kürz**er | lang → **läng**er",
      },
      {
        type: "text",
        style: "default",
        content:
          "## wie vs. als\n\n**wie** = isto kao (jednako)\n**als** = više od (različito)",
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "Er ist schnell **wie** sie. *(Brz je kao ona.)*\nEr ist schnell**er** **als** sie. *(Brži je od nje.)*\n\nBerlin ist klein**er** **als** Zürich.\nWien hat mehr Einwohner **als** München.\nDas Leben in Genf ist teur**er** **als** in Berlin.",
      },
      {
        type: "text",
        style: "default",
        content: "## Superlativ — najviši stepen\n\n**am** + pridev + **-sten**",
      },
      {
        type: "formula",
        content:
          "schnell → am schnell**sten** | schön → am schön**sten**\n\nSa der/die/das: der schnell**ste** Junge\n\nPridevi na -d, -t, -s, -ss, -sch, -x, -z → am + pridev + **-esten**:\nDer Tisch ist am kürz**esten**.",
      },
      {
        type: "text",
        style: "default",
        content: "## Poseban komparativ — bei -EL und -ER\n\nSlovo E ispada u komparativu:",
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "teuer → teur**er** (ne: teuerer)\ndunkel → dunkl**er** (ne: dunkeler)",
      },
      {
        type: "text",
        style: "default",
        content: "## Nepravilan komparativ",
      },
      {
        type: "table",
        headers: ["Positiv", "Komparativ", "Superlativ"],
        rows: [
          ["gut", "<mark>besser</mark>", "<mark>am besten</mark>"],
          ["viel", "<mark>mehr</mark>", "<mark>am meisten</mark>"],
          ["gern", "<mark>lieber</mark>", "<mark>am liebsten</mark>"],
          ["hoch", "<mark>höher</mark>", "<mark>am höchsten</mark>"],
        ],
      },
      {
        type: "spoiler",
        title: "Vežba — komparativ",
        items: [
          {
            question: "Berlin ist kleiner __________ Zürich.",
            answer: "als",
          },
          {
            question: "Der Rhein ist __________ als die Donau. (lang)",
            answer: "länger",
          },
          {
            question: "Mein Bruder ist genauso groß __________ ich.",
            answer: "wie",
          },
          {
            question: "Was trinkst du __________: Kaffee oder Tee? (gern)",
            answer: "lieber",
          },
          {
            question: "Das ist der __________ Film, den ich kenne. (gut)",
            answer: "beste",
          },
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "gut — besser — am besten", back: "dobar — bolji — najbolji" },
          { front: "viel — mehr — am meisten", back: "mnogo — više — najviše" },
          { front: "gern — lieber — am liebsten", back: "rado — radije — najradije" },
          { front: "hoch — höher — am höchsten", back: "visok — viši — najviši" },
          { front: "alt — älter — am ältesten", back: "star — stariji — najstariji" },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 17: Komparation — 4 Minuten Lektion (tekst/vežbe)
  // ────────────────────────────────────────────────────────────────
  17: {
    sections: [
      {
        type: "badge",
        module: "Modul 4",
        category: "grammatik",
      },
      {
        type: "text",
        style: "info",
        content:
          "Ponavljanje komparacije sa dodatnim vežbama. Rešavaj zadatke i proveri da li razumeš pravila.",
      },
      {
        type: "spoiler",
        title: "Vežba — napiši suprotno",
        items: [
          {
            question: "Berlin ist kleiner als Zürich. → Zürich ist __________.",
            answer: "größer als Berlin",
          },
          {
            question: "Der Rhein ist länger als die Donau. → Die Donau ist __________.",
            answer: "kürzer als der Rhein",
          },
          {
            question:
              "Auf den Autobahnen in Deutschland darf man schneller fahren als in der Schweiz. → In der Schweiz __________.",
            answer: "darf man langsamer fahren als in Deutschland",
          },
          {
            question:
              "Angela Merkel ist älter als Arnold Schwarzenegger. → Arnold Schwarzenegger ist __________.",
            answer: "jünger als Angela Merkel",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 18: Leseverstehen (tekst/vežbe)
  // ────────────────────────────────────────────────────────────────
  18: {
    sections: [
      {
        type: "badge",
        module: "Modul 4",
        category: "lesen",
      },
      {
        type: "text",
        style: "info",
        content:
          "Leseverstehen vežba — čitaš tekst i odgovaraš na pitanja. Priprema za ispit A2.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Im Bus — Erste Wege in Deutschland\n\nPročitaj dijalog između Nevin i drugih putnika u autobusu u Nemačkoj:",
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "**Nevin:** Entschuldigung, bin ich hier richtig?\n**Mann:** Das kommt darauf an. Wohin wollen Sie denn?\n**Nevin:** Agentur für Arbeit.\n**Mann:** Ach, zum Arbeitsamt wollen Sie! Ja, da sind Sie hier schon richtig.\n\n**Nevin:** Ich möchte zur Agentur für Arbeit.\n**Busfahrer:** Haben Sie eine Fahrkarte?\n**Nevin:** Nein. Noch nicht.\n**Busfahrer:** Das Ticket müssen Sie am Automaten kaufen.\n\n**Jüngere Frau:** Warten Sie, Sie brauchen Kleingeld.\n**Nevin:** Vielen Dank!\n\n**Ältere Frau:** Kann ich mich bitte setzen? Der Platz ist für Alte und Kranke.\n\n**Busfahrer:** Junge Frau! Sie müssen hier aussteigen. Agentur für Arbeit!",
      },
      {
        type: "vocabulary",
        rows: [
          ["die Agentur für Arbeit", "zavod za zapošljavanje"],
          ["die Fahrkarte, -n", "karta (za prevoz)"],
          ["der Automat, -en", "automat"],
          ["das Kleingeld", "sitniš"],
          ["aussteigen", "izaći (iz busa)"],
          ["einsteigen", "ući (u bus)"],
          ["sich setzen", "sesti"],
        ],
      },
      {
        type: "spoiler",
        title: "Leseverstehen — Fragen",
        items: [
          {
            question: "Wohin möchte Nevin fahren?",
            answer: "Zur Agentur für Arbeit (Arbeitsamt).",
          },
          {
            question: "Wo muss Nevin die Fahrkarte kaufen?",
            answer: "Am Automaten im Bus.",
          },
          {
            question: "Warum muss Nevin aufstehen?",
            answer: "Weil der Platz für alte und kranke Menschen reserviert ist.",
          },
          {
            question: "Wer hilft Nevin mit dem Kleingeld?",
            answer: "Eine jüngere Frau im Bus.",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 19: Trennbare Verben — WH zum Thema Rad fahren (tekst/vežbe)
  // ────────────────────────────────────────────────────────────────
  19: {
    sections: [
      {
        type: "badge",
        module: "Modul 4",
        category: "grammatik",
      },
      {
        type: "text",
        style: "info",
        content:
          "Ponavljanje **razdvojivih glagola** (trennbare Verben) uz temu bicikl i saobraćaj.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Trennbare Verben — ponavljanje\n\nRazdvojivi glagoli imaju prefiks koji se odvaja u prezentu i imperativu:\n\n**aufstehen** → Ich **stehe** um 7 Uhr **auf**.\n**abfahren** → Der Zug **fährt** um 10 Uhr **ab**.\n**einsteigen** → Bitte alle **einsteigen**!\n**aussteigen** → Sie müssen hier **aussteigen**.\n**umsteigen** → Müssen wir **umsteigen**?",
      },
      {
        type: "vocabulary",
        rows: [
          ["das Fahrrad, ¨er", "bicikl"],
          ["Rad fahren", "voziti bicikl"],
          ["der Radweg, -e", "biciklistička staza"],
          ["der Helm, -e", "kaciga"],
          ["abbiegen", "skrenuti"],
          ["anhalten", "zaustaviti se"],
          ["die Kreuzung, -en", "raskrsnica"],
          ["die Ampel, -n", "semafor"],
          ["überholen", "preticati"],
          ["bremsen", "kočiti"],
        ],
      },
      {
        type: "spoiler",
        title: "Vežba — trennbare Verben",
        items: [
          {
            question: "Wir __________ mit dem Zug. (a gehen / b fahren)",
            answer: "fahren",
          },
          {
            question:
              "Mach schnell. Sonst __________ wir den Zug. (a verpassen / b verlieren)",
            answer: "verpassen",
          },
          {
            question:
              "Bitte alle __________! Der Zug endet hier. (a einsteigen / b aussteigen)",
            answer: "aussteigen",
          },
          {
            question: "Der Zug __________ in Duisburg. (a hält / b kommt)",
            answer: "hält",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 20: Drahtesel (video: 866815467)
  // ────────────────────────────────────────────────────────────────
  20: {
    sections: [
      {
        type: "badge",
        module: "Modul 4",
        category: "wortschatz",
      },
      {
        type: "video",
        vimeoId: "866815467",
      },
      {
        type: "text",
        style: "info",
        content:
          '**Drahtesel** je šaljivi nemački naziv za bicikl (bukvalno: "žičani magarac"). U ovoj lekciji iz Deutschlandlabor-a učiš koliko je bicikl važan u Nemačkoj.',
      },
      {
        type: "vocabulary",
        rows: [
          ["der Drahtesel, -", "bicikl (šaljivo)"],
          ["das Verkehrsmittel, -", "prevozno sredstvo"],
          ["umweltfreundlich", "ekološki"],
          ["die Strecke, -n", "relacija, razdaljina"],
          ["der Stau, -s", "gužva u saobraćaju"],
          ["pendeln", "putovati na posao svakodnevno"],
          ["die Werkstatt, ¨en", "radionica"],
          ["reparieren", "popraviti"],
          ["der Reifen, -", "guma (na točku)"],
          ["die Klingel, -n", "zvonce (na biciklu)"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 21: Reisen und Verkehr (video: 897780373)
  // ────────────────────────────────────────────────────────────────
  21: {
    sections: [
      {
        type: "badge",
        module: "Modul 5",
        category: "wortschatz",
      },
      {
        type: "video",
        vimeoId: "897780373",
      },
      {
        type: "text",
        style: "info",
        content:
          "Velika lekcija o **putovanju i saobraćaju**. Učiš vokabular za kupovinu karata, lokalne prepozicije i prevozna sredstva.",
      },
      {
        type: "vocabulary",
        rows: [
          ["der Bus, -se", "autobus"],
          ["die Straßenbahn, -en", "tramvaj"],
          ["das Auto, -s", "auto"],
          ["das Schiff, -e", "brod"],
          ["das Flugzeug, -e", "avion"],
          ["die S-Bahn, -en", "gradska železnica"],
          ["der Zug, ¨e", "voz"],
          ["das Fahrrad, ¨er", "bicikl"],
          ["die Fähre, -n", "trajekt"],
          ["das Motorrad, ¨er", "motor"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Verkehr — vokabular",
      },
      {
        type: "spoiler",
        title: "Lückentext — Verkehr",
        items: [
          {
            question: "Auf den Straßen gibt es heute viel __________.",
            answer: "Verkehr",
          },
          {
            question:
              "Auf der __________ hat es gestern einen schweren Unfall gegeben.",
            answer: "Autobahn",
          },
          {
            question: "Es war ein Unfall mit einem __________.",
            answer: "LKW",
          },
          {
            question:
              "Ich war in der Werkstatt, weil ich meine __________ wechseln musste.",
            answer: "Reifen",
          },
          {
            question:
              "Herzlichen Glückwunsch! Jetzt hast du endlich deinen __________.",
            answer: "Führerschein",
          },
          {
            question:
              "Fahren Sie vorsichtig! Hier gibt es eine __________.",
            answer: "Baustelle",
          },
          {
            question: "Die __________ steht auf Rot. Sie müssen halten.",
            answer: "Ampel",
          },
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Am Bahnhof — eine Fahrkarte kaufen",
      },
      {
        type: "spoiler",
        title: "Lückentext — Am Bahnhof",
        items: [
          {
            question: "Guten Tag. Ich möchte eine __________ nach München.",
            answer: "Fahrkarte",
          },
          {
            question: "Gerne. Hin und __________?",
            answer: "zurück",
          },
          {
            question: "Und wann möchten Sie __________?",
            answer: "fahren",
          },
          {
            question:
              "Es gibt zum Beispiel einen Zug mit der __________ um 11.53 Uhr.",
            answer: "Abfahrt",
          },
          {
            question: "Die __________ ist um 18.05.",
            answer: "Ankunft",
          },
          {
            question: "Der Zug fährt auf __________ 17 ab.",
            answer: "Gleis",
          },
          {
            question: "Ja, Sie müssen nicht __________.",
            answer: "umsteigen",
          },
          {
            question:
              "Haben die Züge im Moment viel __________?",
            answer: "Verspätung",
          },
          {
            question: "Nein, die Züge fahren normalerweise __________.",
            answer: "pünktlich",
          },
          {
            question: "Dann bitte eine Fahrkarte, zweite __________.",
            answer: "Klasse",
          },
          {
            question: "Möchten Sie __________ und haben Sie eine __________?",
            answer: "reservieren, Ermäßigung",
          },
          {
            question: "Wie möchten Sie __________?",
            answer: "zahlen",
          },
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Lokale Präpositionen — Reisen",
      },
      {
        type: "table",
        headers: ["Ich fahre... (Wohin? → Akk.)", "Ich bin... (Wo? → Dat.)"],
        rows: [
          ["<mark>ans</mark> Meer", "<mark>am</mark> Meer"],
          ["<mark>an die</mark> Ostsee", "<mark>an der</mark> Ostsee"],
          ["<mark>an den</mark> See", "<mark>am</mark> See"],
          ["<mark>an den</mark> Strand", "<mark>am</mark> Strand"],
        ],
      },
      {
        type: "text",
        style: "default",
        content: "## Nomen und Verben — Reisen",
      },
      {
        type: "table",
        headers: ["Nomen", "Verb"],
        rows: [
          ["der Abflug", "abfliegen"],
          ["die Ankunft", "ankommen"],
          ["die Abfahrt", "abfahren"],
          ["die Fahrt", "fahren"],
          ["die Haltestelle", "halten"],
          ["die Reise", "reisen"],
          ["die Besichtigung", "besichtigen"],
          ["die Reservierung", "reservieren"],
          ["die Buchung", "buchen"],
          ["die Übernachtung", "übernachten"],
        ],
      },
      {
        type: "flashcard",
        items: [
          { front: "die Fahrkarte", back: "karta (za voz/bus)" },
          { front: "die Abfahrt", back: "polazak" },
          { front: "die Ankunft", back: "dolazak" },
          { front: "das Gleis", back: "kolosek, peron" },
          { front: "umsteigen", back: "presesti (menjati liniju)" },
          { front: "die Verspätung", back: "kašnjenje" },
          { front: "die Ermäßigung", back: "popust" },
          { front: "der Führerschein", back: "vozačka dozvola" },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 22: Wohin fährt Tim? (video: 897826551)
  // ────────────────────────────────────────────────────────────────
  22: {
    sections: [
      {
        type: "badge",
        module: "Modul 5",
        category: "wortschatz",
      },
      {
        type: "video",
        vimeoId: "897826551",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji pratiš Tima na putovanju i učiš razliku između **Wohin?** (kuda?) i **Wo?** (gde?).",
      },
      {
        type: "formula",
        content:
          "**Wohin?** (kuda, kretanje) → Akkusativ\n**Wo?** (gde, mirovanje) → Dativ",
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "**Wohin** fährt Tim? → Er fährt **in die** Berge. / Er fährt **ans** Meer.\n**Wo** ist Tim? → Er ist **in den** Bergen. / Er ist **am** Meer.",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 23: Am Geldautomaten (video: 1177246842)
  // ────────────────────────────────────────────────────────────────
  23: {
    sections: [
      {
        type: "badge",
        module: "Modul 5",
        category: "wortschatz",
      },
      {
        type: "video",
        vimeoId: "1177246842",
      },
      {
        type: "text",
        style: "info",
        content:
          "Kratka lekcija — kako koristiti **bankomat** (Geldautomat) u Nemačkoj.",
      },
      {
        type: "vocabulary",
        rows: [
          ["der Geldautomat, -en", "bankomat"],
          ["Geld abheben", "podići novac"],
          ["die EC-Karte, -n", "bankovna kartica"],
          ["die Geheimzahl / die PIN", "PIN broj"],
          ["der Betrag, ¨e", "iznos"],
          ["der Kontoauszug, ¨e", "izvod sa računa"],
          ["einzahlen", "uplatiti"],
          ["der Bildschirm, -e", "ekran"],
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 24: Mein Bankkonto (video: 1177256928)
  // ────────────────────────────────────────────────────────────────
  24: {
    sections: [
      {
        type: "badge",
        module: "Modul 5",
        category: "wortschatz",
      },
      {
        type: "video",
        vimeoId: "1177256928",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji učiš reči vezane za **banku i finansije** — otvaranje računa, plaćanje, transakcije.",
      },
      {
        type: "vocabulary",
        rows: [
          ["das Girokonto, Girokonten", "tekući račun"],
          ["die Überweisung, -en", "uplatnica, prenos"],
          ["der Dauerauftrag, ¨e", "trajni nalog"],
          ["die Buchung, -en", "transakcija"],
          ["die Auszahlung, -en", "isplata"],
          ["die Filiale, -n", "filijala"],
          ["das Einkommen, -", "prihod, plata"],
          ["die Gebühr, -en", "naknada, taksa"],
          ["die Kontoführung", "vođenje računa"],
          ["die Bankleitzahl (BLZ)", "identifikacioni broj banke"],
          ["überweisen", "preneti (novac)"],
          ["eröffnen", "otvoriti (račun)"],
        ],
      },
      {
        type: "spoiler",
        title: "Vežba — Bankbegriffe",
        items: [
          {
            question: "Geld wird von einem Konto abgebucht und auf ein anderes eingezahlt. Das ist eine __________.",
            answer: "Überweisung",
          },
          {
            question: "Damit wird regelmäßig Geld auf ein anderes Konto überwiesen, z.B. für die Miete. Das ist ein __________.",
            answer: "Dauerauftrag",
          },
          {
            question: "Auf diesem Papier sieht man alle Ein- und Auszahlungen. Das ist ein __________.",
            answer: "Kontoauszug",
          },
          {
            question: "Das Gehalt oder Geld aus Rente nennt man __________.",
            answer: "Einkommen",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 25: Leseverstehen Bank (tekst/vežbe)
  // ────────────────────────────────────────────────────────────────
  25: {
    sections: [
      {
        type: "badge",
        module: "Modul 5",
        category: "lesen",
      },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji čitaš oglase banaka i poređuješ uslove za vođenje računa. Vežbaš čitanje i razumevanje praktičnih tekstova.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Kosten für ein Girokonto vergleichen\n\nPročitaj ponude četiri banke i odgovori na pitanja:",
      },
      {
        type: "table",
        headers: ["Banka", "Mesečna cena", "Kontoauszüge", "EC-Karte"],
        rows: [
          ["BR-Bank", "8,70 €", "besplatno", "2 besplatne"],
          ["InterKonto", "4,95 €", "besplatno", "1 besplatna"],
          ["DIE BANK", "0 € (od 1500 € prihoda)", "1x mesečno besplatno", "2 besplatne"],
          ["Die Geldkasse", "2,50 €", "0,50 € po komadu", "12 € godišnje za drugu"],
        ],
      },
      {
        type: "spoiler",
        title: "Koji račun je najbolji?",
        items: [
          {
            question:
              "Herr und Frau Fabian — zajedno zarađuju 1434 €, imaju internet, 15 transakcija mesečno, treba im 2 kartice.",
            answer: "BR-Bank (jer ne zarađuju dovoljno za DIE BANK, a treba im 2 kartice)",
          },
          {
            question:
              "Christian — student, zarađuje 530 €, stalno na internetu, ne treba mu Dauerauftrag.",
            answer: "InterKonto (najjeftiniji za internet korisnike sa malo transakcija)",
          },
          {
            question:
              "Hanna Meier — 1620 € renta, ima internet, ali voli da ide lično u banku.",
            answer: "DIE BANK (besplatno jer zarađuje preko 1500 €, ali ako želi ličnu uslugu → BR-Bank)",
          },
          {
            question:
              "Tadeusz und Olga — 2230 € plata, treba im 2 kartice, Tadeusz u Poljskoj, Olga ne koristi internet.",
            answer: "DIE BANK (besplatno, 2 kartice, filijale u celoj Evropi)",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // Lekcija 26: Deklinacija prideva — Masterclass (video: 937554608)
  // ────────────────────────────────────────────────────────────────
  26: {
    sections: [
      {
        type: "badge",
        module: "Bonus",
        category: "grammatik",
      },
      {
        type: "video",
        vimeoId: "937554608",
      },
      {
        type: "text",
        style: "info",
        content:
          "Ovo je **bonus Masterclass** lekcija (66 minuta!) — detaljna deklinacija prideva sa mnogo primera i vežbi. Preporučujemo za sve koji žele savršeno da savladaju ovu temu.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Sve na jednom mestu\n\nOva lekcija pokriva sva tri tipa deklinacije prideva sa detaljnim objašnjenjima i primerima iz svakodnevnog života. Pogledaj video i vrati se na vežbe iz lekcije 11 i 13.",
      },
    ],
  },
};

// ─── Main import function ───

async function main() {
  // 1. Find course
  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", COURSE_SLUG)
    .single();

  if (courseErr || !course) {
    console.error("Course not found:", COURSE_SLUG, courseErr);
    process.exit(1);
  }

  console.log(`Found course ${COURSE_SLUG} → id=${course.id}`);

  // 2. Get all lessons
  const { data: lessons, error: lessonsErr } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .eq("course_id", course.id)
    .order("order_index");

  if (lessonsErr || !lessons) {
    console.error("Error fetching lessons:", lessonsErr);
    process.exit(1);
  }

  console.log(`Found ${lessons.length} lessons`);

  // 3. Update each lesson with sections
  let updated = 0;
  let skipped = 0;

  for (const lesson of lessons) {
    const sectionData = LESSON_SECTIONS[lesson.order_index];
    if (!sectionData) {
      console.log(`  [skip] ${lesson.order_index}: ${lesson.title} (no sections defined)`);
      skipped++;
      continue;
    }

    const { error: updateErr } = await supabase
      .from("lessons")
      .update({ sections: sectionData.sections })
      .eq("id", lesson.id);

    if (updateErr) {
      console.error(`  [ERROR] ${lesson.order_index}: ${lesson.title}`, updateErr);
    } else {
      console.log(
        `  [ok] ${lesson.order_index}: ${lesson.title} (${sectionData.sections.length} sections)`
      );
      updated++;
    }
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
}

main().catch(console.error);
