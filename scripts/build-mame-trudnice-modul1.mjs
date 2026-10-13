// Kurs za mame i trudnice - Modul 1 prebačen sa HTML dokumenata iz Drajva
// (folder „HTML kodovi") u native blokove platforme + prave vežbe.
//
// PROBA: lekcije se upisuju na order_index 100-104, ispod postojećih 13, da se
// živi kurs ne lomi dok Nataša ne pogleda. Kad odobri, stare se brišu i sve se
// prenumeriše (to radi zasebna skripta pri prelasku na punu strukturu).
//
// Pokretanje:  node scripts/build-mame-trudnice-modul1.mjs --dry
//              node scripts/build-mame-trudnice-modul1.mjs --apply
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const procitaj = (put) =>
  Object.fromEntries(
    fs.readFileSync(put, "utf8").split("\n").filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    })
  );
const env = procitaj(".env.local");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const COURSE_ID = "9160e343-f5d7-4a92-9b69-906c1aae9ee2";
const MODUL = "Modul 1";
const primeni = process.argv.includes("--apply");

/* ─────────────────────────  pomoćnici  ───────────────────────── */

const badge = (category) => ({ type: "badge", module: MODUL, category });
const tekst = (content, style) => (style ? { type: "text", content, style } : { type: "text", content });
const recnik = (rows) => ({ type: "vocabulary", rows });
const tabela = (headers, rows) => ({ type: "table", headers, rows });
const vezbaBlok = (title) => ({ type: "exercise", title });

// Reč iz liste („der Vorgang, Vorgänge") → { front, article, plural }.
// Član se odvaja SAMO kod čiste imenice. Fraze poput „das erste Trimester" ili
// „der Bauch wächst" ostaju cele - inače kartica prikaže besmislen front.
function karta(de, sr) {
  const m = de.match(/^(der|die|das)\s+(.+)$/);
  if (!m) return { front: de, back: sr };
  const [, article, ostatak] = m;
  const [glava, mnozina] = ostatak.split(/,\s*/, 2);
  if (glava.includes(" ")) return { front: de, back: sr };
  if (!mnozina) return { front: glava, back: sr, article };
  const plural = mnozina.startsWith("-")
    ? `die ${glava}${mnozina.slice(1)}`
    : `die ${mnozina}`;
  return { front: glava, back: sr, article, plural };
}

const pFill = (question, items, correct_answer) => ({
  question, question_type: "fill_blank",
  options: { type: "fill_blank", items }, correct_answer,
});
const pQuiz = (question, items, idx) => ({
  question, question_type: "quiz",
  options: { type: "quiz", items }, correct_answer: String(idx),
});
const pTacnoNetacno = (question, tacno) => ({
  question, question_type: "quiz",
  options: { type: "true_false", items: [] }, correct_answer: tacno ? "true" : "false",
});
const pSpoji = (question, parovi) => ({
  question, question_type: "quiz",
  options: { type: "match_pairs", items: parovi }, correct_answer: "all",
});
const pKucanje = (question, correct_answer) => ({
  question, question_type: "typing",
  options: { type: "typing" }, correct_answer,
});
const pRedosled = (question, items, recenica) => ({
  question, question_type: "word_order",
  options: { type: "word_order", items }, correct_answer: recenica,
});

/* ─────────────────────────  podaci  ───────────────────────── */

const recniciModula = {
  osnovni: [
    ["die Schwangerschaft", "trudnoća"],
    ["der Schwangerschaftstest, -s", "test za trudnoću"],
    ["der Frauenarzt / die Frauenärztin", "ginekolog / ginekološkinja"],
    ["der Mutterpass", "trudnička knjižica"],
    ["das Ultraschallbild, -er", "slika sa ultrazvuka"],
    ["das Gewicht kontrollieren", "kontrolisati težinu"],
    ["den Blutdruck messen", "meriti pritisak"],
    ["Blut abnehmen", "uzeti uzorak krvi"],
    ["die Urinprobe abgeben", "dati uzorak urina"],
    ["das CTG (die Kardiotokographie)", "CTG (praćenje otkucaja srca bebe i kontrakcija)"],
    ["die Herzfrequenz des Babys", "rad srca bebe"],
    ["die Wehen (pl.)", "kontrakcije"],
  ],
  skracenice: [
    ["SS", "trudnoća (Schwangerschaft)"],
    ["SSW", "nedelja trudnoće (Schwangerschaftswoche)"],
    ["ET", "termin porođaja"],
    ["LR", "poslednja menstruacija"],
    ["Screening", "ultrazvučni pregled"],
    ["FS", "gestacijska vreća unutar materice u kojoj nastaje beba; služi za određivanje starosti ploda u ranoj trudnoći"],
    ["SSL", "telesna dužina bebe"],
    ["BPD", "prečnik glave između dve temene kosti"],
    ["FOD", "prečnik glave od potiljka do čela"],
    ["KU", "obim glave"],
    ["ATD", "prečnik stomaka"],
    ["AU", "obim stomaka"],
    ["FL / HL", "dužina butne kosti / dužina nadlaktice"],
  ],
  osiguranje: [
    ["die Krankenkasse, -n", "zdravstveno osiguranje (fond)"],
    ["krankenversichert", "zdravstveno osiguran"],
    ["die Ultraschall-Untersuchung, -en", "ultrazvučni pregled"],
    ["die Kassenleistung, -en", "pregled ili lečenje koje plaća osiguranje"],
    ["die Zusatzleistung, -en", "dodatni pregled koji ne pokriva osiguranje"],
    ["die Zuzahlung, -en", "manji novčani iznos koji se dodatno plaća"],
    ["privat versichert", "privatno osiguran"],
    ["gesetzlich versichert", "zakonski (državno) osiguran"],
    ["die Hebamme, -n", "babica"],
    ["die Stillzeit", "period dojenja"],
    ["die Geburtsvorbereitungskurse (pl.)", "pripremni kursevi za porođaj"],
  ],
  simptomi: [
    ["die Geruchsempfindlichkeit", "osetljivost na miris"],
    ["veränderter Geruchs- und Geschmackssinn", "promenjena čula mirisa i ukusa"],
    ["die Übelkeit", "mučnina"],
    ["das Erbrechen", "povraćanje"],
    ["die Müdigkeit", "umor"],
    ["die Abgeschlagenheit", "zamor"],
    ["der Harndrang", "pojačano mokrenje"],
    ["das Sodbrennen", "gorušica"],
    ["die Heißhungerattacke", "napad gladi"],
    ["die Schwangerschaftsgelüste", "trudničke želje"],
  ],
  oplodnjaA2: [
    ["die Befruchtung", "oplodnja"],
    ["das Paar, -e", "par"],
    ["das Hormon, -e", "hormon"],
    ["die Eizelle, -n", "jajna ćelija"],
    ["der Arzt / die Ärztin", "lekar / lekarka"],
    ["die Samenprobe, -n", "uzorak sperme"],
    ["das Labor, -s", "laboratorija"],
    ["der Embryo, Embryonen", "embrion"],
    ["die Gebärmutter", "materica"],
    ["warten", "čekati"],
    ["die Hoffnung", "nada"],
    ["eigen", "sopstveno"],
  ],
  oplodnjaB1: [
    ["die Besamung, -en", "oplodnja"],
    ["der Geschlechtsverkehr", "polni odnos"],
    ["die Eizelle, -n", "jajna ćelija"],
    ["hormonell behandelt", "hormonski lečena / na hormonskoj terapiji"],
    ["heranreifen", "sazreti"],
    ["der Eierstock, Eierstöcke", "jajnik"],
    ["entnehmen, hat entnommen", "izvaditi"],
    ["die Samenprobe, -n", "uzorak sperme"],
    ["zusammenbringen, hat zusammengebracht", "spojiti"],
    ["einsetzen, hat eingesetzt", "umetnuti"],
    ["die Gebärmutter", "materica"],
    ["der Vorgang, Vorgänge", "proces"],
    ["die Behandlung, -en", "lečenje, tretman"],
    ["körperlich", "telesno"],
    ["belastend", "opterećujući"],
    ["die Hoffnung, -en", "nada"],
    ["den Wunsch nach … erfüllen", "ispuniti želju za"],
    ["eigen", "sopstveno"],
  ],
};

// Redni brojevi 1-40 (Ordinalzahlen na -en, kako se koriste u „Ich bin im ... Monat")
const redniBrojevi = [
  "ersten", "zweiten", "dritten", "vierten", "fünften", "sechsten", "siebten", "achten", "neunten", "zehnten",
  "elften", "zwölften", "dreizehnten", "vierzehnten", "fünfzehnten", "sechzehnten", "siebzehnten", "achtzehnten", "neunzehnten", "zwanzigsten",
  "einundzwanzigsten", "zweiundzwanzigsten", "dreiundzwanzigsten", "vierundzwanzigsten", "fünfundzwanzigsten", "sechsundzwanzigsten", "siebenundzwanzigsten", "achtundzwanzigsten", "neunundzwanzigsten", "dreißigsten",
  "einunddreißigsten", "zweiunddreißigsten", "dreiunddreißigsten", "vierunddreißigsten", "fünfunddreißigsten", "sechsunddreißigsten", "siebenunddreißigsten", "achtunddreißigsten", "neununddreißigsten", "vierzigsten",
];

// Rečnik uz video o 1. trimestru
const recVideo = [
  ["das Ziehen im Bauch", "zatezanje u stomaku"],
  ["die Schmerzen", "bolovi"],
  ["die Mutterbänder", "ligamenti materice"],
  ["sich dehnen", "istezati se"],
  ["die Übelkeit", "mučnina"],
  ["sich übergeben", "povraćati"],
  ["die Schwangerschaft", "trudnoća"],
  ["das Trimester", "tromesečje"],
  ["das erste Trimester", "prvo tromesečje"],
  ["der Bauch wächst", "stomak raste"],
  ["schwanger sein", "biti trudna"],
  ["das Schwangerschaftsgehirn", "„trudnički mozak\" (zaboravnost)"],
  ["vergessen", "zaboraviti"],
  ["verlieren", "izgubiti"],
  ["sich gewöhnen an (+Akk)", "navići se na"],
  ["der Heißhunger", "jaka želja za hranom"],
  ["Lust haben auf (+Akk)", "imati želju za"],
  ["der Ekel", "gađenje"],
  ["riechen", "mirisati"],
  ["mögen", "voleti"],
  ["plötzlich", "odjednom"],
  ["tatsächlich", "zapravo"],
  ["am Anfang", "na početku"],
  ["immer wieder", "iznova i iznova"],
  ["viel schneller", "mnogo brže"],
];

// Kompletan set reči Modula 1 (obnavljanje) - simptomi + oplodnja + video
const reciModula1 = [
  ...recniciModula.simptomi,
  ...recniciModula.oplodnjaB1,
  ["plötzlich", "odjednom"],
  ["tatsächlich", "zapravo"],
  ["am Anfang", "na početku"],
  ["immer wieder", "iznova i iznova"],
  ["viel schneller", "mnogo brže"],
  ["das Schwangerschaftsgehirn", "„trudnički mozak\" (zaboravnost)"],
  ["vergessen", "zaboraviti"],
  ["verlieren", "izgubiti"],
  ["sich gewöhnen an (+Akk)", "navići se na"],
  ["der Heißhunger", "jaka želja za hranom"],
  ["Lust haben auf (+Akk)", "imati želju za"],
  ["der Ekel", "gađenje"],
  ["riechen", "mirisati"],
  ["mögen", "voleti"],
  ["das Ziehen im Bauch", "zatezanje u stomaku"],
  ["die Schmerzen", "bolovi"],
  ["die Mutterbänder", "ligamenti materice"],
  ["sich dehnen", "istezati se"],
  ["sich übergeben", "povraćati"],
  ["die Schwangerschaft", "trudnoća"],
  ["das Trimester", "tromesečje"],
  ["das erste Trimester", "prvo tromesečje"],
  ["der Bauch wächst", "stomak raste"],
  ["schwanger sein", "biti trudna"],
].filter((par, i, sve) => sve.findIndex(([de]) => de === par[0]) === i);

// Provera reči: prevod → izaberi nemačku reč. Distraktori iz istog seta.
const zaProveru = [
  "die Übelkeit", "das Sodbrennen", "der Harndrang", "die Müdigkeit",
  "die Heißhungerattacke", "die Gebärmutter", "der Eierstock, Eierstöcke",
  "die Samenprobe, -n", "die Behandlung, -en", "belastend", "körperlich",
  "die Mutterbänder", "sich dehnen", "der Ekel", "plötzlich", "das Trimester",
];

function pitanjaProvere() {
  return zaProveru.map((de) => {
    const par = reciModula1.find(([d]) => d === de);
    const distraktori = reciModula1
      .filter(([d]) => d !== de)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(([d]) => d);
    const opcije = [par[0], ...distraktori].sort(() => Math.random() - 0.5);
    return pQuiz(`Koja nemačka reč znači **${par[1]}**?`, opcije, opcije.indexOf(par[0]));
  });
}

/* ─────────────────────────  lekcije  ───────────────────────── */

const lekcije = [
  {
    order_index: 100,
    module_name: MODUL,
    title: "Trudnoća (die Schwangerschaft)",
    sections: [
      badge("wortschatz"),
      tekst(
        "## Osnovni pojmovi\n\n" +
        "Nakon pozitivnog testa za trudnoću žena odlazi izabranom ginekologu i nakon potvrđivanja trudnoće dobija Mutterpass - dokument koji do kraja trudnoće nosi sa sobom i u kome se čuvaju svi izveštaji lekara, slike sa ultrazvuka itd.\n\n" +
        "Na redovnim pregledima se obično kontroliše težina trudnice, meri se pritisak, daje se uzorak krvi i uzorak urina. Pred kraj trudnoće i tokom porođaja se radi CTG, koji meri rad srca bebe i kontrakcije."
      ),
      recnik(recniciModula.osnovni),
      tekst("## Ultrazvuk - skraćenice\n\nOve skraćenice srećeš u nalazima sa ultrazvuka i u Mutterpass-u."),
      tabela(["Skraćenica", "Značenje"], recniciModula.skracenice),
      tekst(
        "## Osiguranje i babica\n\n" +
        "Tokom trudnoće se obavljaju tri redovna ultrazvučna pregleda koja finansijski pokriva zdravstveno osiguranje. Svaki stanovnik Nemačke je po zakonu zdravstveno osiguran. Ukoliko je potrebno raditi dodatne ultrazvučne preglede, najverovatnije ih treba doplatiti.\n\n" +
        "Pored lekarskih pregleda puno žena već na samom početku trudnoće angažuje babicu, koja je tu za sva njihova pitanja i pomaže im od početka trudnoće do kraja perioda dojenja. Takođe postoje i pripremni kursevi za porođaj, koji nisu obavezni i koje često barem delimično pokriva zdravstveno osiguranje."
      ),
      recnik(recniciModula.osiguranje),
      tekst(
        "## Koliko dugo si trudna?\n\n" +
        "**Ich bin im ersten / zweiten / dritten Trimester.** - Ja sam u prvom / drugom / trećem trimestru.\n" +
        "**Ich bin im ersten / zweiten / neunten Monat.** - Ja sam u prvom / drugom / devetom mesecu.\n" +
        "**Ich bin in der 12. / 24. / 38. Woche.** - Ja sam u 12. / 24. / 38. nedelji.\n\n" +
        "Ne zaboravi: svaki redni broj u ovim rečenicama se završava na **-en**.",
        "beispiele"
      ),
      {
        type: "flashcard",
        frontLabel: "Broj",
        backLabel: "Deutsch",
        items: redniBrojevi.map((rec, i) => ({ front: `${i + 1}.`, back: rec })),
      },
      tekst("## Simptomi"),
      recnik(recniciModula.simptomi),
      tekst(
        "**Ich bin extrem geruchsempfindlich.** - Užasno sam osetljiva na miris.\n" +
        "**Ich habe Übelkeit. / Mir ist übel.** - Imam mučnine. / Muka mi je.\n" +
        "**Ich muss (ab und zu) brechen.** - Moram (ponekad) da povraćam.\n" +
        "**Ich muss ständig Pipi.** - Moram stalno da piškim.\n" +
        "**Ich habe Sodbrennen.** - Imam gorušicu.\n" +
        "**Ich bekomme oft eine Heißhungerattacke.** - Često dobijem napad gladi.\n" +
        "**Ich habe keine richtigen Schwangerschaftsgelüste.** - Nemam neke određene trudničke želje.",
        "beispiele"
      ),
      vezbaBlok("Simptomi - napiši na nemačkom"),
    ],
    vezbe: [
      {
        title: "Simptomi - napiši na nemačkom",
        exercise_type: "quiz",
        pitanja: [
          pKucanje("Užasno sam osetljiva na miris.", "Ich bin extrem geruchsempfindlich."),
          pKucanje("Imam mučnine. / Muka mi je.", "Ich habe Übelkeit.|Mir ist übel."),
          pKucanje("Moram (ponekad) da povraćam.", "Ich muss ab und zu brechen.|Ich muss brechen."),
          pKucanje("Moram stalno da piškim.", "Ich muss ständig Pipi."),
          pKucanje("Imam gorušicu.", "Ich habe Sodbrennen."),
          pKucanje("Često dobijem napad gladi.", "Ich bekomme oft eine Heißhungerattacke."),
          pKucanje("Nemam neke određene trudničke želje.", "Ich habe keine richtigen Schwangerschaftsgelüste."),
        ],
      },
    ],
  },

  {
    order_index: 101,
    module_name: MODUL,
    title: "Vantelesna oplodnja (künstliche Befruchtung) - leicht",
    sections: [
      badge("lesen"),
      tekst("## Wortschatz\n\nNivo A2. Pročitaj prvo reči, pa onda tekst."),
      recnik(recniciModula.oplodnjaA2),
      tekst(
        "## Künstliche Befruchtung\n\n" +
        "Manche Paare können nicht auf natürlichem Weg ein Kind bekommen. Dann kann eine künstliche Befruchtung helfen. Zuerst bekommt die Frau Hormone. Die Hormone helfen, dass mehrere Eizellen wachsen. Dann nimmt der Arzt die Eizellen aus dem Körper der Frau. Der Mann gibt eine Samenprobe. Im Labor bringt man die Eizellen und die Samenzellen zusammen. So kann eine Befruchtung passieren.\n\n" +
        "Wenn ein Embryo wächst, setzt der Arzt ihn in die Gebärmutter der Frau ein. Das nennt man Embryotransfer. Danach muss die Frau warten. Nach einiger Zeit weiß sie, ob es geklappt hat.\n\n" +
        "Eine künstliche Befruchtung ist oft nicht einfach. Sie kann körperlich und emotional schwer sein. Aber sie gibt vielen Paaren Hoffnung, ein eigenes Kind zu bekommen."
      ),
      vezbaBlok("Vežbe - vantelesna oplodnja (A2)"),
    ],
    vezbe: [
      {
        title: "Vežbe - vantelesna oplodnja (A2)",
        exercise_type: "quiz",
        pitanja: [
          pSpoji("Spoji nemačke pojmove sa prevodom:", [
            { de: "die Eizelle", sr: "ženska polna ćelija" },
            { de: "die Samenzelle", sr: "muška polna ćelija" },
            { de: "der Embryo", sr: "embrion" },
            { de: "die Gebärmutter", sr: "materica" },
            { de: "das Labor", sr: "laboratorija" },
          ]),
          ...(() => {
            const banka = ["Hormone", "Samenprobe", "Labor", "Embryo", "Gebärmutter"];
            return [
              ["Die Frau bekommt ______.", "Hormone"],
              ["Der Mann gibt eine ______.", "Samenprobe"],
              ["Im ______ bringt man die Zellen zusammen.", "Labor"],
              ["Der Arzt setzt den ______ in die Gebärmutter ein.", "Embryo"],
              ["Der Embryo wächst in der ______.", "Gebärmutter"],
            ].map(([q, a]) => pFill(q, banka, a));
          })(),
          pQuiz("Der Embryo wächst ______.", ["im Labor", "in der Gebärmutter"], 1),
          pQuiz("Die Eizelle ist ______.", ["männlich", "weiblich"], 1),
          pQuiz("Der Arzt setzt den Embryo ______.", ["ein", "heraus"], 0),
          pQuiz("Die Frau muss ______, ob es geklappt hat.", ["warten", "sofort wissen"], 0),
        ],
      },
    ],
  },

  {
    order_index: 102,
    module_name: MODUL,
    title: "Vantelesna oplodnja (künstliche Befruchtung) - schwer",
    sections: [
      badge("lesen"),
      tekst("## Wortschatz\n\nNivo B1 - B2. Ista tema kao u lakšoj verziji, ali sa punim stručnim rečnikom."),
      recnik(recniciModula.oplodnjaB1),
      tekst(
        "## Künstliche Befruchtung\n\n" +
        "Unter dem Begriff „künstliche Befruchtung\", oder besser „Besamung\", werden alle biologisch-medizinischen Methoden und Möglichkeiten zusammengefasst, die ohne Geschlechtsverkehr zur Befruchtung einer Eizelle führen sollen.\n\n" +
        "Zuerst wird die Frau hormonell behandelt, damit mehrere Eizellen gleichzeitig heranreifen. Danach werden die Eizellen aus den Eierstöcken entnommen. Gleichzeitig wird eine Samenprobe vom Mann gewonnen. Im Labor werden die Eizellen mit den Samenzellen zusammengebracht, damit eine Befruchtung stattfinden kann.\n\n" +
        "Wenn sich Embryonen entwickeln, wählt der Arzt einen oder mehrere aus und setzt sie in die Gebärmutter der Frau ein. Dieser Vorgang heißt Embryotransfer. Danach muss die Frau einige Zeit warten, um zu erfahren, ob die Behandlung erfolgreich war.\n\n" +
        "Die künstliche Befruchtung kann für Paare sowohl körperlich als auch emotional sehr belastend sein. Trotzdem gibt sie vielen Menschen Hoffnung und die Chance, ihren Wunsch nach einem eigenen Kind zu erfüllen."
      ),
      vezbaBlok("Vežbe - vantelesna oplodnja (B1-B2)"),
    ],
    vezbe: [
      {
        title: "Vežbe - vantelesna oplodnja (B1-B2)",
        exercise_type: "quiz",
        pitanja: [
          pSpoji("Spoji nemačke pojmove sa prevodom:", [
            { de: "die Eizelle", sr: "ženska polna ćelija" },
            { de: "die Samenzelle", sr: "muška polna ćelija" },
            { de: "der Embryo", sr: "embrion" },
            { de: "die Gebärmutter", sr: "materica" },
            { de: "das Labor", sr: "laboratorija" },
          ]),
          ...(() => {
            const banka = ["künstliche Befruchtung", "hormonell", "Labor", "Embryonen", "Gebärmutter"];
            return [
              ["Die ______ hilft Paaren, ein Kind zu bekommen.", "künstliche Befruchtung"],
              ["Die Frau wird ______ behandelt.", "hormonell"],
              ["Die Befruchtung findet im ______ statt.", "Labor"],
              ["Der Arzt wählt die besten ______ aus.", "Embryonen"],
              ["Die Embryonen werden in die ______ eingesetzt.", "Gebärmutter"],
            ].map(([q, a]) => pFill(q, banka, a));
          })(),
          // ISPRAVKA: u dokumentu je tačan odgovor bio „in der Gebärmutter", a tekst
          // izričito kaže da se oplodnja dešava u laboratoriji („Im Labor werden die
          // Eizellen mit den Samenzellen zusammengebracht").
          pQuiz("Die Befruchtung findet ______ statt.", ["im Labor", "in der Gebärmutter"], 0),
          pQuiz("Eine Eizelle ist eine ______ Zelle.", ["männliche", "weibliche"], 1),
          pQuiz("Der Embryotransfer ist Teil der ______.", ["Behandlung", "Schwangerschaft"], 0),
          pQuiz("Hormone werden vor der ______ gegeben.", ["Befruchtung", "Geburt"], 0),
        ],
      },
    ],
  },

  {
    order_index: 103,
    module_name: MODUL,
    title: "Das 1. Trimester der Schwangerschaft (video)",
    sections: [
      badge("hoeren"),
      tekst("## Video\n\nPogledaj video pa uradi vežbe ispod. Reči iz videa su na karticama."),
      { type: "youtube", videoId: "hcdAd9B3qus", label: "Das 1. Trimester der Schwangerschaft - Das hätte ich gerne vorher gewusst" },
      tekst("## Karteikarten - Wortschatz zum Video\n\nKlikni na karticu da vidiš prevod."),
      {
        type: "flashcard",
        frontLabel: "DE",
        backLabel: "SR",
        items: recVideo.map(([de, sr]) => ({ front: de, back: sr })),
      },
      vezbaBlok("Vežbe uz video - 1. trimestar"),
    ],
    vezbe: [
      {
        title: "Vežbe uz video - 1. trimestar",
        exercise_type: "quiz",
        pitanja: [
          ...(() => {
            const banka = ["schneller", "Heißhunger", "Schwangerschafts", "gewöhnt", "Schmerzen", "Bauch", "Ekel", "Mutterbänder"];
            return [
              ["Im ersten Trimester haben viele Frauen ______ im Bauch.", "Schmerzen"],
              ["Die sogenannten ______ dehnen sich und können Schmerzen verursachen.", "Mutterbänder"],
              ["Viele Frauen haben ein sogenanntes ______ Gehirn.", "Schwangerschafts"],
              ["Manche Frauen bekommen ______ auf bestimmte Lebensmittel.", "Heißhunger"],
              ["Andere haben ______ vor bestimmten Gerüchen oder Essen.", "Ekel"],
              ["In der ersten Schwangerschaft wächst der ______ oft langsam.", "Bauch"],
              ["In der zweiten Schwangerschaft wächst der Bauch oft ______.", "schneller"],
              ["Ich habe mich daran ______, dass ich oft Sachen vergesse.", "gewöhnt"],
            ].map(([q, a]) => pFill(q, banka, a));
          })(),
          pTacnoNetacno("Viele Frauen haben am Anfang Schmerzen im Bauch.", true),
          pTacnoNetacno("Alle Frauen essen saure Gurken mit Nutella.", false),
          // ISPRAVKA: u dokumentu je stajalo „falsch", a video i rečnik kažu suprotno
          // („Manche Frauen mögen plötzlich neue Lebensmittel", „Ich mag plötzlich Tomaten").
          pTacnoNetacno("Manche Frauen mögen plötzlich neue Lebensmittel.", true),
          pTacnoNetacno("Kaffee kann während der Schwangerschaft unangenehm sein.", true),
          // ISPRAVKA: u dokumentu je stajalo „richtig", a Lückentext u istoj lekciji kaže
          // „In der ersten Schwangerschaft wächst der Bauch oft langsam".
          pTacnoNetacno("Der Bauch wächst immer schnell in der ersten Schwangerschaft.", false),
          pSpoji("Spoji nemačke pojmove sa prevodom:", [
            { de: "der Heißhunger", sr: "želja za određenom hranom" },
            { de: "die Übelkeit", sr: "mučnina" },
            { de: "der Bauch", sr: "stomak" },
            { de: "der Ekel", sr: "gađenje" },
            { de: "wachsen", sr: "rasti" },
          ]),
          pRedosled("Sastavi rečenicu:", ["habe", "Ich", "Bauchschmerzen.", "oft"], "Ich habe oft Bauchschmerzen."),
          pRedosled("Sastavi rečenicu:", ["plötzlich", "Ich", "Tomaten.", "mag"], "Ich mag plötzlich Tomaten."),
          pRedosled("Sastavi rečenicu:", ["kann", "nicht", "Ich", "Kaffee", "riechen."], "Ich kann Kaffee nicht riechen."),
          pRedosled("Sastavi rečenicu:", ["wächst", "Bauch", "Mein", "langsam."], "Mein Bauch wächst langsam."),
        ],
      },
    ],
  },

  {
    order_index: 104,
    module_name: MODUL,
    title: "Reči iz Modula 1 (obnavljanje)",
    sections: [
      badge("wortschatz"),
      tekst("## Reči iz Modula 1\n\nCeo set reči iz modula na jednom mestu. Kartice se pamte, pa ih možeš ponavljati i kroz Flashcard Learn."),
      {
        type: "wordset",
        title: "Modul 1 - Reči",
        setKey: "mame-trudnice-modul-1",
        frontLabel: "DE",
        backLabel: "SR",
        items: reciModula1.map(([de, sr]) => karta(de, sr)),
      },
      vezbaBlok("Provera reči - Modul 1"),
    ],
    vezbe: [
      { title: "Provera reči - Modul 1", exercise_type: "quiz", pitanja: pitanjaProvere() },
    ],
  },
];

/* ─────────────────────────  upis  ───────────────────────── */

async function main() {
  console.log(primeni ? "UPIS U BAZU\n" : "PROBA (--dry) - ništa se ne upisuje\n");

  for (const lek of lekcije) {
    const brojPitanja = lek.vezbe.reduce((n, v) => n + v.pitanja.length, 0);
    console.log(
      `[${lek.order_index}] ${lek.title}\n` +
      `        ${lek.sections.length} blokova · ${lek.vezbe.length} vežba · ${brojPitanja} pitanja`
    );

    if (!primeni) continue;

    // Idempotentno: skloni raniji pokušaj na istom mestu (kaskadno briše vežbe).
    const { data: stare } = await sb.from("lessons").select("id")
      .eq("course_id", COURSE_ID).eq("order_index", lek.order_index);
    for (const s of stare ?? []) {
      const { data: v } = await sb.from("exercises").select("id").eq("lesson_id", s.id);
      for (const ex of v ?? []) await sb.from("exercise_questions").delete().eq("exercise_id", ex.id);
      await sb.from("exercises").delete().eq("lesson_id", s.id);
      await sb.from("lessons").delete().eq("id", s.id);
    }

    const { data: nova, error: e1 } = await sb.from("lessons").insert({
      course_id: COURSE_ID,
      title: lek.title,
      // module_name je generisana kolona - izvodi se iz badge bloka u sections.
      lesson_type: "text",
      content: "",
      sections: lek.sections,
      order_index: lek.order_index,
      is_free_preview: false,
    }).select("id").single();
    if (e1) throw new Error(`lekcija „${lek.title}": ${e1.message}`);

    for (const [i, v] of lek.vezbe.entries()) {
      const { data: ex, error: e2 } = await sb.from("exercises").insert({
        lesson_id: nova.id, title: v.title, exercise_type: v.exercise_type, order_index: i,
      }).select("id").single();
      if (e2) throw new Error(`vežba „${v.title}": ${e2.message}`);

      const { error: e3 } = await sb.from("exercise_questions").insert(
        v.pitanja.map((p, j) => ({ ...p, exercise_id: ex.id, order_index: j }))
      );
      if (e3) throw new Error(`pitanja za „${v.title}": ${e3.message}`);
    }
    console.log("        upisano\n");
  }

  const ukupno = lekcije.reduce((n, l) => n + l.vezbe.reduce((m, v) => m + v.pitanja.length, 0), 0);
  console.log(`\nUkupno: ${lekcije.length} lekcija, ${ukupno} pitanja.`);
  if (!primeni) console.log("Pokreni sa --apply da se stvarno upiše.");
}

main().catch((e) => { console.error("PUKLO:", e.message); process.exit(1); });
