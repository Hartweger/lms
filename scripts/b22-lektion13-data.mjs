// ─────────────────────────────────────────────────────────────────────────
// Vielfalt B2.2 · Modul 5 · Lektion 13 „Auf zwei Rädern“ (Mobilität)
// JEDINSTVENI IZVOR za 5 lekcija u kursu `nemacki-b2-2`.
// Konverzija Natašine pripreme (LMS/nastava/B2/) u format novog LMS-a.
//
// Stil: ekavica, bez ćirilice, „ti“ forma, tabele zaglavlje „Prevod“,
// komunikativni zadaci. Princip: svaki tekst ima vežbu + uputstvo.
//
// VAŽNO: nemački navodnici su uvek „ (U+201E) i “ (U+201C); ASCII " je SAMO JS graničnik.
//
// options oblik (kolona exercise_questions.options je jsonb):
//   quiz        -> { type:"quiz", items:[...] }            correct_answer = indeks
//   true_false  -> null                                    correct_answer = "true"/"false"
//   fill_blank  -> { type:"fill_blank", items:[...banka] }  correct_answer = rec
//   match_pairs -> { type:"match_pairs", items:[{de,sr}] }
//   word_order  -> { type:"word_order", items:[...] }       correct_answer = niz spojen razmakom
//   categorize  -> { type:"categorize", items:{categories,items:[{text,category}]} }
//   essay       -> exercise_type "essay"
// ─────────────────────────────────────────────────────────────────────────

export const COURSE_SLUG = "nemacki-b2-2";
export const EXAM_TITLE_RE = /ispita|modellt|modelt/i;

const V_PROT = ["1193940443", "1193940548", "1193940558"];
const V_BEISPIEL = "1193940567";

const quiz = (question, items, correctIndex, explanation) => ({
  question, question_type: "quiz",
  options: { type: "quiz", items },
  correct_answer: String(correctIndex),
  explanation: explanation || null,
});
const tf = (statement, correct, explanation) => ({
  question: statement, question_type: "true_false",
  options: null, correct_answer: correct ? "true" : "false",
  explanation: explanation || null,
});
const match = (title, items, question) => ({
  title, exercise_type: "match_pairs",
  questions: [{
    question: question || "Spoji parove.",
    question_type: "match_pairs",
    options: { type: "match_pairs", items },
    correct_answer: "", explanation: null,
  }],
});
const categorize = (title, question, categories, items) => ({
  title, exercise_type: "quiz",
  questions: [{
    question, question_type: "categorize",
    options: { type: "categorize", items: { categories, items } },
    correct_answer: "", explanation: null,
  }],
});
const essay = (title, prompt) => ({
  title, exercise_type: "essay",
  questions: [{ question: prompt, question_type: "essay", options: null, correct_answer: "", explanation: null }],
});

export const LESSONS = [
  // ═══ L13.1 — Einstieg + Hörverstehen ═══
  {
    order: 0,
    title: "Lektion 13 · Einstieg + Hörverstehen",
    lessonType: "video",
    vimeoId: null,
    sections: [
      { type: "badge", module: "", category: "hoeren" },
      {
        type: "text", style: "info",
        content:
          "Dobrodošla u **Modul 5 — Was verbinden Sie mit „Stadt“?** Kroz tri lekcije baviš se gradom: mobilnošću (L13), zelenilom (L14) i zvukom/tišinom (L15).\n\nU **Lekciji 13 — Auf zwei Rädern** tema je mobilnost u gradu, bicikli od bambusa i osnivanje start-upa. Gramatika: **Relativsätze mit wer, wen, wem** i **Adjektive mit fester Präposition**.",
      },
      {
        type: "text", style: "default",
        content:
          "## Drei Stimmen aus der Stadt\n\nTri protagonista nas uvode u modul. Pogledaj kratke filmove i obrati pažnju šta svako povezuje sa pojmom grada.\n\n- **Sophia Ofuso** · Dresden\n- **Sebastian Langer** · Bremen\n- **André Wyss** · Zürich",
      },
      { type: "video", vimeoId: V_PROT[0] },
      { type: "video", vimeoId: V_PROT[1] },
      { type: "video", vimeoId: V_PROT[2] },
      {
        type: "text", style: "default",
        content:
          "## Mobilität in der Stadt: Die neue Liebe zum Fahrrad\n\n_Luftverschmutzung, Lärm, Verkehrsstaus: Sich in der Stadt zu bewegen, wird immer schwieriger. Fahrradfahren könnte viele Probleme lösen._\n\n**1 · Radschnellwege** — Freie Fahrt fürs Rad: Auf Radschnellwegen kommt man zur Arbeit, zur Schule oder zum Einkaufen in die Stadt – ohne Staus, ohne Schäden für die Umwelt und ohne lange nach einem Parkplatz zu suchen.\n\n**2 · Lastenräder** — Gute Luft in der Stadt: Autos und Transporter verschmutzen die Luft nicht mehr durch Abgase, denn Lastenräder bringen die Waren von außerhalb der Stadt bis zum Geschäft.\n\n**3 · Design-Objekt** — Das Fahrrad als nachhaltiges Design-Objekt: Rahmen aus leichten Materialien wie Bambus machen die Bikes zu etwas Besonderem und fallen auf.\n\n**4 · Dienstrad** — Auf dem Dienstrad ins Büro – genauso gut gekleidet wie im Dienstwagen.\n\n👉 Pročitaj o 4 trenda, pa poveži svaki trend sa opisom u vežbi ispod.",
      },
      { type: "exercise", title: "Mobilitäts-Trends zuordnen" },
      {
        type: "text", style: "default",
        content:
          "## Radiobeitrag: „Junge Talente“\n\n**„Wer sich auf unser Fahrrad setzt, braucht keine Angst zu haben.“**\n\nUnser Reporter Jens Ewert besucht die Fahrradmesse _Bikes & More_. Jedes Jahr präsentieren dort Hunderte Unternehmen die neuesten Produkte und Trends rund um das Fahrrad. Unter ihnen sind auch viele Gründerinnen und Gründer von Start-ups – jungen Unternehmen mit besonders innovativen Geschäftsideen.\n\nEine von ihnen ist die Start-up-Gründerin **Sophia Ofuso**. Die 32-Jährige stellt mit ihrer Firma _Bamboorad_ Fahrräder aus Bambus her. Eigentlich hatte Sophia Ofuso vor, nach ihrem Studium der Ingenieurwissenschaften in einem großen Unternehmen zu arbeiten und Karriere zu machen. Doch dann besuchte sie Verwandte in Ghana, hatte dort eine Geschäftsidee und machte sich daraufhin selbstständig. Das war vor acht Jahren. Mittlerweile verkauft sie ihre Bambusräder in ganz Deutschland und genießt ihre Unabhängigkeit als selbstständige Unternehmerin.\n\n👉 Pročitaj najavu emisije, pa proveri razumevanje u vežbi ispod.",
      },
      { type: "exercise", title: "Programmhinweis — Leseverstehen" },
      {
        type: "text", style: "default",
        content: "## Hörverstehen: Sophias Bamboorad\n\nPogledaj Sophijin video-odgovor, pa uradi vežbe ispod.",
      },
      { type: "video", vimeoId: V_BEISPIEL },
      { type: "exercise", title: "Sophia Ofuso — Hörverstehen" },
      { type: "exercise", title: "Sophias Bamboorad — richtig oder falsch?" },
      {
        type: "youtube", videoId: "Ht8fmDpxwic",
        label: "Dopuna: Interview mit Delilah – Das Lastenrad (lingoni GERMAN, B2, sa titlovima)",
      },
      { type: "exercise", title: "Was haben die drei Personen gemeinsam?" },
    ],
    exercises: [
      {
        title: "Sophia Ofuso — Hörverstehen", exercise_type: "quiz",
        questions: [
          quiz("Was macht Sophia beruflich?", ["Sie arbeitet in einer Bank.", "Sie hat ein Start-up gegründet.", "Sie ist Lehrerin."], 1),
          quiz("Wo hat Sophia ihre Geschäftsidee bekommen?", ["In Berlin", "In Ghana", "Auf einer Messe"], 1),
        ],
      },
      match("Mobilitäts-Trends zuordnen", [
        { de: "Radschnellwege", sr: "ohne Staus zur Arbeit, Schule oder zum Einkaufen kommen" },
        { de: "Lastenräder", sr: "Waren von außerhalb der Stadt zum Geschäft bringen – ohne Abgase" },
        { de: "Design-Fahrräder aus Bambus", sr: "nachhaltige Räder mit Rahmen aus leichten Materialien" },
        { de: "Dienstrad", sr: "vom Arbeitgeber zur Verfügung gestellt – statt mit dem Dienstwagen ins Büro" },
      ], "Ordne jeden Trend seiner Beschreibung zu."),
      {
        title: "Programmhinweis — Leseverstehen", exercise_type: "quiz",
        questions: [
          quiz("Wer ist Jens Ewert?", ["ein Reporter", "ein Start-up-Gründer", "ein Bankmitarbeiter"], 0),
          quiz("Wo ist Jens Ewert?", ["auf einer Fahrradmesse", "in einer Bank", "an der Universität"], 0),
          quiz("Was stellt Sophias Firma Bamboorad her?", ["Lastenräder aus Metall", "Fahrräder aus Bambus", "E-Bikes"], 1),
          quiz("Was wollte Sophia ursprünglich machen?", ["ein eigenes Geschäft eröffnen", "in einem großen Unternehmen Karriere machen", "Lehrerin werden"], 1),
          quiz("Wo bekam Sophia ihre Geschäftsidee?", ["in Deutschland", "bei Verwandten in Ghana", "auf der Messe"], 1),
        ],
      },
      {
        title: "Sophias Bamboorad — richtig oder falsch?", exercise_type: "quiz",
        questions: [
          tf("Sophias Großeltern stellen auf dem Land Lastenräder aus Bambus her.", false, "Falsch: Es sind Frauen auf dem Land, nicht die Großeltern."),
          tf("Sophia hat festgestellt, dass es in Europa noch keine Bambusräder gab.", true),
          tf("Das Geschäftsmodell hat Sophia mit einer ehemaligen Verkaufsleiterin entwickelt.", false, "Falsch: mit einer Geschäftspartnerin, nicht mit einer Verkaufsleiterin."),
          tf("Sophia und ihre Geschäftspartnerin konnten eine Bank von ihrem Finanzplan überzeugen.", true),
          tf("In Ghana legen die Menschen Wert auf elegante Räder, mit denen sie Lasten transportieren.", false, "Falsch: In Ghana sind praktische Lastenräder wichtig, nicht elegante Räder."),
          tf("Sophias Unternehmen ist auch deshalb so erfolgreich, weil jedes Rad einmalig ist.", true),
          tf("Auf der Webseite stellen Internetstars die Räder vor.", false, "Falsch: Kundinnen und Kunden stellen die Räder vor, keine Internetstars."),
        ],
      },
      essay("Was haben die drei Personen gemeinsam?",
        "Sophia, Sebastian und André verbinden alle etwas mit dem Thema Stadt. Was haben sie deiner Meinung nach gemeinsam? Schreibe einen kurzen Text (ca. 40 Wörter)."),
    ],
  },

  // ═══ L13.2 — Wortschatz + Wortbildung ═══
  {
    order: 1,
    title: "Lektion 13 · Wortschatz + Wortbildung",
    lessonType: "text",
    vimeoId: null,
    sections: [
      { type: "badge", module: "", category: "wortschatz" },
      { type: "text", style: "info", content: "U ovoj lekciji učiš vokabular za temu **mobilnosti** i **osnivanja start-upa**, kao i tvorbu imenica sa prefiksom **Un-**." },
      { type: "text", style: "default", content: "## Wortfeld: Mobilität in der Stadt" },
      {
        type: "table",
        headers: ["Deutsch", "Prevod", "Beispiel"],
        rows: [
          ["die Luftverschmutzung", "zagađenje vazduha", "Die Luftverschmutzung ist ein großes Problem."],
          ["das Lastenrad", "teretni bicikl", "Lastenräder bringen die Waren in die Stadt."],
          ["der Radschnellweg", "brza biciklistička staza", "Auf Radschnellwegen kommt man ohne Staus zur Arbeit."],
          ["das Dienstrad", "službeni bicikl", "Mit dem Dienstrad ins Büro fahren."],
          ["der Rahmen", "okvir (bicikla)", "Rahmen aus leichten Materialien wie Bambus."],
          ["der Gehweg", "pešačka staza", "Radfahrer fahren trotz Verbot auf den Gehwegen."],
          ["unempfindlich gegen", "neosetljiv na", "Bambus ist unempfindlich gegen Rost."],
        ],
      },
      { type: "exercise", title: "Wortfeld Mobilität — was ist gemeint?" },
      { type: "text", style: "default", content: "## Wortfeld: Unternehmensgründung / Start-up" },
      {
        type: "table",
        headers: ["Deutsch", "Prevod", "Beispiel"],
        rows: [
          ["das Start-up", "start-up", "Sophia hat ein Start-up gegründet."],
          ["die Geschäftsidee", "poslovna ideja", "eine Geschäftsidee entwickeln"],
          ["der Finanzplan", "finansijski plan", "einen Finanzplan erstellen"],
          ["die Konkurrenzanalyse", "analiza konkurencije", "eine Konkurrenzanalyse machen"],
          ["etw. vermarkten", "plasirati na tržište", "ein Produkt vermarkten"],
          ["sich abheben von", "isticati se od", "sich von der Konkurrenz abheben"],
        ],
      },
      { type: "exercise", title: "Welches Wort passt nicht?" },
      { type: "exercise", title: "Unternehmensgründung — was gehört zusammen?" },
      {
        type: "text", style: "default",
        content: "## Wortbildung: Nomen mit dem Präfix Un-\n\nPrefiks **Un-** ima tri značenja:\n\n1. **Negacija** (suprotno): _die Unabhängigkeit_, _die Unvernunft_, _die Unschuld_\n2. **Negativna ocena** (nešto loše): _das Unwetter_, _der Unmensch_, _die Unzeit_\n3. **Naglašavanje veličine** (jako mnogo): _eine Unsumme_, _eine Unmenge_, _eine Unzahl_\n\n👉 Sortiraj imenice po značenju u vežbi ispod.",
      },
      { type: "exercise", title: "Nomen mit Un- — sortiere nach Bedeutung" },
      { type: "text", style: "info", content: "💡 **Aussprache — Komposita:** Naglasak je uvek na prvom delu složenice: **FAHR**rad, **LUFT**verschmutzung, **LAS**tenrad, **RAD**schnellweg, **PARK**platz." },
    ],
    exercises: [
      {
        title: "Welches Wort passt nicht?", exercise_type: "quiz",
        questions: [
          quiz("ein Geschäft … — welches Verb passt NICHT?", ["eröffnen", "umtauschen", "übernehmen"], 1),
          quiz("eine Firma … — welches Verb passt NICHT?", ["gründen", "konsumieren", "leiten"], 1),
          quiz("ein Produkt … — welches Verb passt NICHT?", ["zurückzahlen", "präsentieren", "anbieten"], 0),
          quiz("ein Modell … — welches Verb passt NICHT?", ["bauen", "lösen", "entwickeln"], 1),
          quiz("Unternehmerin … — welches Verb passt NICHT?", ["werden", "sein", "treiben"], 2),
          quiz("Kunden … — welches Verb passt NICHT?", ["überzeugen", "betreuen", "verbrauchen"], 2),
          quiz("Schulden … — welches Verb passt NICHT?", ["zurückschicken", "machen", "haben"], 0),
          quiz("Waren … — welches Verb passt NICHT?", ["unterstützen", "herstellen", "produzieren"], 0),
          quiz("Geld … — welches Verb passt NICHT?", ["zur Verfügung stellen", "einnehmen", "ausstellen"], 2),
        ],
      },
      {
        title: "Wortfeld Mobilität — was ist gemeint?", exercise_type: "quiz",
        questions: [
          quiz("Ein Problem für die Umwelt, das durch Abgase entsteht:", ["die Luftverschmutzung", "der Radschnellweg", "das Dienstrad"], 0),
          quiz("Der Teil des Fahrrads, der aus Metall oder Bambus besteht:", ["der Helm", "der Rahmen", "der Gehweg"], 1),
          quiz("Ein Auto, das einem vom Arbeitgeber gestellt wird:", ["der Dienstwagen", "das Lastenrad", "das Rennrad"], 0),
          quiz("Ein Fahrrad, mit dem man größere Gegenstände transportieren kann:", ["das Dienstrad", "das Lastenrad", "das Rennrad"], 1),
          quiz("Ein Fahrradweg, auf dem man mit hohem Tempo fahren kann:", ["der Gehweg", "der Radschnellweg", "der Abstand"], 1),
          quiz("Was Fußgänger oft tun müssen, wenn Radfahrer auf dem Gehweg fahren:", ["ausweichen", "vermarkten", "nachwachsen"], 0),
        ],
      },
      match("Unternehmensgründung — was gehört zusammen?", [
        { de: "eine Geschäftsidee entwickeln", sr: "Was wollen Sie anbieten?" },
        { de: "ein Produkt vermarkten", sr: "Wie machen Sie Werbung?" },
        { de: "eine Konkurrenzanalyse machen", sr: "Gibt es bereits andere Firmen?" },
        { de: "sich von der Konkurrenz abheben", sr: "Was unterscheidet Ihr Start-up?" },
        { de: "einen Finanzplan erstellen", sr: "Woher bekommen Sie das Geld?" },
      ], "Ordne jedem Schritt die passende Frage zu."),
      categorize("Nomen mit Un- — sortiere nach Bedeutung",
        "Sortiere die Nomen nach der Bedeutung des Präfixes Un-.",
        ["Negation", "Negative Bewertung", "Betonung der Größe"],
        [
          { text: "die Unabhängigkeit", category: 0 },
          { text: "die Unvernunft", category: 0 },
          { text: "die Unschuld", category: 0 },
          { text: "das Unwetter", category: 1 },
          { text: "der Unmensch", category: 1 },
          { text: "die Unzeit", category: 1 },
          { text: "eine Unsumme", category: 2 },
          { text: "eine Unmenge", category: 2 },
          { text: "eine Unzahl", category: 2 },
        ]),
    ],
  },

  // ═══ L13.3 — Grammatik ═══
  {
    order: 2,
    title: "Lektion 13 · Grammatik",
    lessonType: "text",
    vimeoId: null,
    sections: [
      { type: "badge", module: "", category: "grammatik" },
      { type: "text", style: "info", content: "Dva gramatička fokusa: **Adjektive mit fester Präposition** i **Relativsätze mit wer, wen, wem**." },
      { type: "text", style: "default", content: "## Adjektive mit fester Präposition\n\nNeki pridevi uvek idu sa određenim predlogom (i padežom) — mora se naučiti napamet." },
      {
        type: "table",
        headers: ["Adjektiv + Präposition", "Kasus", "Prevod", "Beispiel"],
        rows: [
          ["verwandt mit", "Dativ", "srodan sa", "Bambus ist mit Gras verwandt."],
          ["unempfindlich gegen", "Akkusativ", "neosetljiv na", "Bambus ist unempfindlich gegen Rost."],
          ["interessiert an", "Dativ", "zainteresovan za", "Ich war an diesen Rädern interessiert."],
          ["bekannt für", "Akkusativ", "poznat po", "Ghana ist bekannt für seinen Bambus."],
          ["offen für", "Akkusativ", "otvoren za", "Die Frauen waren offen für eine Zusammenarbeit."],
          ["begeistert von", "Dativ", "oduševljen", "Ich bin vom Akku begeistert."],
          ["geeignet für", "Akkusativ", "pogodan za", "Es ist für heiße Tage geeignet."],
          ["gewöhnt an", "Akkusativ", "naviknut na", "Ich bin daran gewöhnt."],
          ["vorbereitet auf", "Akkusativ", "pripremljen za", "Darauf bin ich vorbereitet."],
          ["stolz auf", "Akkusativ", "ponosan na", "Ich bin stolz auf mein Rennrad."],
        ],
      },
      { type: "exercise", title: "E-Bike Testbericht — Adjektive mit Präposition" },
      {
        type: "text", style: "default",
        content: "## Relativsätze mit wer, wen, wem\n\nKada se relativna rečenica ne odnosi na konkretnu imenicu nego na „onoga ko…“, koristi se **wer / wen / wem** (prema padežu u sporednoj rečenici), a u glavnoj **der / den / dem**.\n\n- **wer** (Nom.): _Wer in Ghana ein Rad hat, der schiebt es meistens._\n- **wen** (Akk.): _Wen das Thema interessiert, dem schicken wir unsere Broschüre._\n- **wem** (Dat.): _Wem die Umwelt wichtig ist, den werden wir begeistern._\n\n💡 Padež određuje **glavni glagol**. Ako su zamenice u istom padežu, demonstrativna može da otpadne: _Wer mit dem Fahrrad fährt, (der) steht nicht im Stau._",
      },
      { type: "youtube", videoId: "VlelHwelOug", label: "Video: Relativsätze B2/C1 mit wer, wem, wen (Deutsch mit Danai)" },
      { type: "exercise", title: "Gehzeug — wer/wen/wem + der/den/dem" },
      { type: "exercise", title: "Relativsätze selbst formulieren" },
    ],
    exercises: [
      {
        title: "E-Bike Testbericht — Adjektive mit Präposition", exercise_type: "quiz",
        questions: [
          quiz("Die Marke Smaragd ist ___ bekannt, keine Kompromisse einzugehen.", ["davon", "damit", "dafür"], 2),
          quiz("Es ist ___ heiße Sommertage ebenso geeignet wie …", ["für", "an", "auf"], 0),
          quiz("… ebenso geeignet wie ___ Regen oder Schnee.", ["für", "an", "auf"], 0),
          quiz("Der Akku ist erstaunlich unempfindlich ___ Hitze und Kälte.", ["mit", "auf", "gegen"], 2),
          quiz("Als E-Bike-Fahrerin bin ich ___ gewöhnt, den Akku öfter zu laden.", ["damit", "darüber", "daran"], 2),
          quiz("___ bin ich vorbereitet und plane meine Strecken.", ["Darauf", "Davon", "Dafür"], 0),
          quiz("Daher war ich ___ der Kapazität dieses Akkus begeistert.", ["von", "bei", "mit"], 0),
          quiz("Wer ___ einem echten Ganzjahresrad interessiert ist, macht nichts falsch.", ["über", "an", "mit"], 1),
        ],
      },
      {
        title: "Gehzeug — wer/wen/wem + der/den/dem", exercise_type: "quiz",
        questions: [
          quiz("Ergänze: „___ jeden Tag Autos sieht, ___ fällt es oft gar nicht auf.“", ["Wen … dem", "Wer … dem", "Wer … der"], 1),
          quiz("Ergänze: „___ mit dem Auto fährt, ___ nimmt sich ein großes Stück vom öffentlichen Raum.“", ["Wer … der", "Wer … dem", "Wen … der"], 0),
          quiz("Ergänze: „___ zu Fuß geht, ___ fehlt dieser Raum dann.“", ["Wem … dem", "Wer … dem", "Wer … der"], 1),
          quiz("Ergänze: „___ einen großen Gegenstand transportiert, ___ ist es erlaubt, die Straße zu benutzen.“", ["Wer … den", "Wen … dem", "Wer … dem"], 2),
          quiz("Ergänze: „Doch ___ das ärgert, ___ muss sich fragen: Warum bin ich so unterwegs?“", ["Wen … der", "Wer … den", "Wen … den"], 0),
        ],
      },
      essay("Relativsätze selbst formulieren",
        "Formuliere 3 Sätze mit wer, wen oder wem zum Thema Fahrrad. Beispiel: Wer mit dem Fahrrad zur Arbeit fährt, bleibt fit und spart Geld."),
    ],
  },

  // ═══ L13.4 — Schreiben + Extra Beruf (Kundenanfrage) ═══
  {
    order: 3,
    title: "Lektion 13 · Schreiben + Extra Beruf",
    lessonType: "text",
    vimeoId: null,
    sections: [
      { type: "badge", module: "Extra Beruf", category: "schreiben" },
      { type: "text", style: "info", content: "**Extra Beruf:** formalna **Kundenanfrage** (poslovni upit). Naučićeš strukturu i napisati svoj upit." },
      {
        type: "text", style: "default",
        content: "## Bamboorad — Fahrräder, die nachwachsen\n\n_Jeder Bambus wächst anders und so ist auch jedes Fahrrad ein Unikat. Bei uns finden Sie genau das Rad, das individuell zu Ihnen passt._ — Sophia Ofuso, Gründerin von Bamboorad",
      },
      {
        type: "text", style: "default",
        content: "## Mustertext: Kundenanfrage an Bamboorad\n\n**Von:** office@radnachmass.de · **An:** office@bamboorad.de · **Betreff:** Interesse an Zusammenarbeit\n\nSehr geehrte Frau Ofuso,\n\nbei meinem Besuch auf der Fahrradmesse _Bikes & More_ vor zwei Wochen wurde ich auf Ihre Fahrräder aus Bambus aufmerksam und wäre an einer geschäftlichen Zusammenarbeit interessiert.\n\nIch führe das Unternehmen _Rad nach Maß_, das drei erfolgreiche Fahrradgeschäfte im Raum Leipzig umfasst und auf individuelle Fahrräder spezialisiert ist.\n\nIm nächsten Geschäftsjahr möchten wir unser Sortiment erweitern und denken, dass Ihre Bambusräder eine hervorragende Ergänzung wären. Ich bitte Sie um die Zusendung eines Katalogs mit Informationen zu lieferbaren Größen, Ausstattung und technischen Details. Unser Jahresbedarf wird bei schätzungsweise 80–100 Stück liegen. Interessant wäre, ab welcher Stückzahl Sie einen Mengenrabatt gewähren. Könnten Sie auch Angaben zu Liefer- und Vorlaufzeiten sowie Stornogebühren machen?\n\nIch bedanke mich im Voraus und stehe Ihnen für weitere Fragen gern zur Verfügung.\n\nMit freundlichen Grüßen\nFlorian Traballa\n\n_Geschäftsführer, Rad nach Maß · Leipzig_\n\n👉 Uradi vežbe ispod, pa na kraju napiši svoj upit.",
      },
      { type: "exercise", title: "Kundenanfrage — Struktur ordnen" },
      { type: "exercise", title: "Formale Ausdrücke — was bedeuten sie?" },
      {
        type: "text", style: "beispiele",
        content: "## Redemittel — Kundenanfrage\n\n- _Bei meinem Besuch auf … wurde ich auf … aufmerksam._\n- _… ist ein Unternehmen mit Sitz in …, das auf … spezialisiert ist._\n- _Wir möchten unser Sortiment um … erweitern._\n- _Ich bitte Sie um die Zusendung Ihres Katalogs / Ihrer Preisliste._\n- _Ich stehe Ihnen für weitere Fragen gern zur Verfügung._",
      },
      { type: "exercise", title: "Schreibaufgabe: Kundenanfrage" },
    ],
    exercises: [
      {
        title: "Kundenanfrage — Struktur ordnen", exercise_type: "quiz",
        questions: [{
          question: "Bringe die Textabschnitte einer Kundenanfrage in die richtige Reihenfolge.",
          question_type: "word_order",
          options: { type: "word_order", items: [
            "Anrede", "Einleitung", "Vorstellung des eigenen Unternehmens",
            "Gegenstand der Anfrage", "Schlusssatz", "Grußformel und Unterschrift", "Signatur",
          ] },
          correct_answer: "Anrede Einleitung Vorstellung des eigenen Unternehmens Gegenstand der Anfrage Schlusssatz Grußformel und Unterschrift Signatur",
          explanation: null,
        }],
      },
      match("Formale Ausdrücke — was bedeuten sie?", [
        { de: "an einer Zusammenarbeit interessiert sein", sr: "zusammenarbeiten wollen" },
        { de: "sein Sortiment erweitern", sr: "neue Produkte anbieten" },
        { de: "um Zusendung bitten", sr: "etwas geschickt bekommen wollen" },
        { de: "einen Rabatt gewähren", sr: "einen niedrigeren Preis anbieten" },
        { de: "für Fragen zur Verfügung stehen", sr: "bereit sein, Fragen zu beantworten" },
      ], "Ordne jedem Ausdruck seine Bedeutung zu."),
      essay("Schreibaufgabe: Kundenanfrage",
        "Verfasse eine Kundenanfrage (min. 120 Wörter). Szenario: Du führst einen Fahrradverleih in einer Touristenstadt und möchtest Bambusräder von Bamboorad in dein Sortiment aufnehmen. Struktur: Anrede, Einleitung, Vorstellung, Anfrage (Katalog, Preise, Mengenrabatt, Lieferzeiten), Schlusssatz, Grußformel."),
    ],
  },

  // ═══ L13.5 — Abschlusstest ═══
  {
    order: 4,
    title: "Lektion 13 · Abschlusstest",
    lessonType: "text",
    vimeoId: null,
    sections: [
      { type: "badge", module: "Abschlusstest" },
      { type: "text", style: "info", content: "**Završni test lekcije 13** — vokabular, pridevi sa predlogom, relativne rečenice (wer/wen/wem) i komunikacija. Preporučeni prag: **70%**." },
      { type: "exercise", title: "1 · Wörter: Reza Hosseini" },
      { type: "exercise", title: "2 · Adjektive mit Präposition" },
      { type: "exercise", title: "3 · Relativsätze — Nürnberg und die Eisenbahn" },
      { type: "exercise", title: "4 · Kommunikation — Redemittel zuordnen" },
    ],
    exercises: [
      {
        title: "1 · Wörter: Reza Hosseini", exercise_type: "quiz",
        questions: [
          quiz("Reza Hosseini hat sich selbstständig gemacht. ___ (1): ein Transportunternehmen.", ["Seine Geschäftsidee", "Sein Finanzplan"], 0),
          quiz("Statt mit einem Lkw transportiert Reza die Waren mit dem ___ (2).", ["Radschnellweg", "Lastenrad"], 1),
          quiz("Man muss sich von der Konkurrenz ___ (3) und etwas Neues machen.", ["abheben", "überzeugen"], 0),
          quiz("Viele seiner Kunden sind ___ (4) umweltfreundlichen Lösungen interessiert.", ["von", "an"], 1),
          quiz("Wir haben in Berlin ein Problem ___ (5).", ["mit der Luftverschmutzung", "mit dem Rahmen"], 0),
          quiz("Wenn ___ (6) ökologische Produkte transportieren lässt …", ["ein junger Anwohner", "ein junges Start-up"], 1),
          quiz("… ökologische Produkte ___ (7) und transportieren lässt …", ["befürchtet", "vermarktet"], 1),
          quiz("___ (8) Kälte bin ich relativ unempfindlich.", ["Für", "Gegen"], 1),
        ],
      },
      {
        title: "2 · Adjektive mit Präposition", exercise_type: "quiz",
        questions: [
          quiz("Ghana ist bekannt ___ seinen Bambus.", ["für", "an", "gegen"], 0),
          quiz("Ich war sofort ___ diesen Fahrrädern interessiert.", ["für", "an", "auf"], 1),
          quiz("Bambus ist unempfindlich ___ Rost.", ["für", "an", "gegen"], 2),
          quiz("Die Frauen waren offen ___ eine Zusammenarbeit.", ["für", "an", "gegen"], 0),
          quiz("Ich bin stolz ___ mein neues Rennrad.", ["auf", "für", "an"], 0),
        ],
      },
      {
        title: "3 · Relativsätze — Nürnberg und die Eisenbahn", exercise_type: "quiz",
        questions: [
          quiz("Ergänze: „___ die Geschichte der Eisenbahn interessiert, ___ wird ein Besuch in Nürnberg gefallen.“", ["Wer … den", "Wen … den", "Wen … dem"], 1),
          quiz("Ergänze: „___ sich schon mit dem Thema beschäftigt hat, ___ weiß, dass die erste Eisenbahn 1835 fuhr.“", ["Wer … der", "Wer … dem", "Wen … der"], 0),
          quiz("Ergänze: „___ mehr darüber erfahren möchte, ___ ist ein Besuch im Verkehrsmuseum zu empfehlen.“", ["Wer … den", "Wer … dem", "Wem … dem"], 1),
          quiz("Ergänze: „___ sich für einen Besuch entscheidet, ___ erwarten viele historische Züge.“", ["Wen … den", "Wer … dem", "Wer … den"], 2),
          quiz("Ergänze: „___ eine kleine Wanderung Spaß macht, ___ kann die Strecke zu Fuß gehen.“", ["Wem … der", "Wer … der", "Wem … dem"], 0),
        ],
      },
      match("4 · Kommunikation — Redemittel zuordnen", [
        { de: "Verärgerung ausdrücken", sr: "Das finde ich sehr ärgerlich." },
        { de: "Widersprechen", sr: "Das sehe ich ganz anders als Sie." },
        { de: "Vorschlag machen", sr: "Was halten Sie von folgendem Vorschlag?" },
        { de: "Das Wort ergreifen", sr: "Ich würde gern direkt etwas dazu sagen." },
        { de: "Sich gegen eine Unterbrechung wehren", sr: "Lassen Sie mich doch bitte ausreden." },
      ], "Ordne jeder Funktion den passenden Ausdruck zu."),
    ],
  },
];
