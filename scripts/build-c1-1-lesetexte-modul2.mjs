// C1.1 - Lesetexte + Leseverstehen vežbe, MODUL 2 (lekcije 4, 5, 6).
// Dodaje u svaku lekciju: (a) text sekciju sa originalnim C1 Lesetext-om (marker "## 📖"),
// (b) quiz vežbu od 6 pitanja sa zajedničkim options.context (okida GroupedExamExercise).
// Idempotentno: stara "## 📖" sekcija se zamenjuje, vežba se briše po naslovu pa ponovo pravi.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const CID = "3bfe17d7-62fa-4b06-b844-b10db9acd5ed";
const READ = "## 📖";
const GRAM = "## 📘";

const LESSONS = [
  {
    lesson: "Mobilität - Eine Frage der Gerechtigkeit?",
    textTitle: "Wer mobil sein darf - Anmerkungen zu einer unterschätzten Gerechtigkeitsfrage",
    body: `*Kommentar*

Dass Mobilität im Berufsleben eine entscheidende Rolle spielt, steht außer Frage. Wer tagtäglich pünktlich am Arbeitsplatz erscheinen, Kinder in die Kita bringen und abends noch einen Kurs besuchen soll, ist auf ein funktionierendes Verkehrsnetz angewiesen. Weniger selbstverständlich ist die Frage, die dahintersteckt: Wem steht diese Mobilität eigentlich zur Verfügung - und wem nicht?

Einer Erhebung der Stadtverwaltung zufolge legen die Bewohnerinnen und Bewohner der äußeren Bezirke im Schnitt doppelt so lange Wege zurück wie die Menschen im Zentrum, obwohl ihre Einkommen deutlich geringer sind. Laut den Verfassern der Studie hängt die Chance auf eine gute Ausbildung heute unmittelbar mit der Verkehrsanbindung des eigenen Wohnorts zusammen. Räumliche Nachteile gingen, so heißt es in dem Bericht, fast immer mit sozialen Nachteilen einher; sie würden in der Verkehrsplanung jedoch regelmäßig übersehen. Die zuständige Dezernentin räumt ein, das kommunale Netz sei über Jahrzehnte an den Bedürfnissen der Autofahrer ausgerichtet worden. Inzwischen, sagt sie, seien mit Fahrgemeinschaften und flexiblen Shuttle-Bussen gute Erfahrungen gemacht worden.

Wer den Ursachen auf den Grund gehen will, stößt allerdings schnell auf ein zweites Hindernis. Für viele Menschen kommt der öffentliche Nahverkehr gar nicht in Frage: Wer im Rollstuhl sitzt, kann die überfüllten Bahnen im Berufsverkehr nicht in Anspruch nehmen, solange nur ein Bruchteil der Haltestellen barrierefrei ausgebaut ist. Hier treten Hindernisse auf, die auf keiner Karte verzeichnet sind. Dass ausgerechnet die Gruppen, die am stärksten von öffentlichen Angeboten abhängen, die höchste Belastung tragen, ist der eigentliche Skandal.

Dabei fehlt es nicht an Ideen. Kommunen, die auf die Idee gekommen sind, Fahrradwege konsequent auszubauen und niedrigere Geschwindigkeitsbegrenzungen durchzusetzen, verzeichnen messbare Erfolge. Ob Leihroller, die nach kurzer Lebensdauer auf dem Müll landen, ein ernst zu nehmender Lösungsansatz sind, darf man dagegen in Frage stellen. Entscheidungen dieser Art werden zu oft nach ihrem Symbolwert und nicht nach ihrer Wirkung getroffen.

Eine seriöse Prognose ist schwierig. Zweifellos aber deutet vieles darauf hin, dass die Anforderungen, die künftige Generationen an Mobilität stellen, andere sein werden als die heutigen. Aller Wahrscheinlichkeit nach wird nicht die Technik über Gerechtigkeit entscheiden, sondern die Frage, wessen Wege überhaupt mitgedacht werden. Es ist durchaus denkbar, dass wir in zwanzig Jahren nicht mehr fragen, wie schnell jemand von A nach B kommt, sondern ob er überhaupt losfahren kann.`,
    wortschatz: `**Wortschatzhilfe**

- *außer Frage stehen* - biti van svake sumnje
- *angewiesen sein auf + Akk.* - biti upućen na, zavisiti od
- *einhergehen mit + Dat.* - ići ruku pod ruku sa nečim
- *einer Sache auf den Grund gehen* - ući u suštinu nečega, detaljno istražiti
- *etwas in Anspruch nehmen* - koristiti (uslugu, ponudu)
- *barrierefrei* - pristupačan, bez barijera
- *etwas in Frage stellen* - kritički preispitati nešto
- *aller Wahrscheinlichkeit nach* - po svoj prilici`,
    exTitle: "Leseverstehen: Mobilität und Gerechtigkeit",
    questions: [
      {
        q: "Was ist das zentrale Anliegen des Kommentars?",
        items: [
          "Er will zeigen, dass Mobilität eng mit sozialer Gerechtigkeit zusammenhängt.",
          "Er will die Vorteile des Elektroautos gegenüber dem Fahrrad hervorheben.",
          "Er will beweisen, dass der öffentliche Nahverkehr zu teuer geworden ist.",
          "Er will die Leserinnen und Leser überzeugen, häufiger Leihroller zu benutzen.",
        ],
        correct: 0,
        exp: "Ceo tekst pokazuje da pristup prevozu zavisi od toga gde i kako ko živi - dakle da je mobilnost pitanje pravednosti. Cene, električni auto i trotineti se pominju samo usput.",
      },
      {
        q: "Was besagt die Erhebung der Stadtverwaltung?",
        items: [
          "Menschen in den äußeren Bezirken verdienen mehr, legen aber kürzere Wege zurück.",
          "Menschen in den äußeren Bezirken legen im Schnitt doppelt so lange Wege zurück, obwohl sie weniger verdienen.",
          "Menschen im Zentrum verzichten häufiger auf das eigene Auto als Menschen am Stadtrand.",
          "Die Einkommen in den äußeren Bezirken sind zuletzt doppelt so stark gestiegen wie im Zentrum.",
        ],
        correct: 1,
        exp: "U tekstu stoji da stanovnici spoljnih delova grada putuju dvostruko duže, iako su im primanja znatno manja. Ostale tvrdnje obrću ili izmišljaju podatke.",
      },
      {
        q: "Warum kommt der öffentliche Nahverkehr laut Text für manche Menschen gar nicht in Frage?",
        items: [
          "Weil die Fahrpreise im Berufsverkehr besonders hoch sind.",
          "Weil die Bahnen zu selten fahren, um pünktlich zur Arbeit zu kommen.",
          "Weil nur ein kleiner Teil der Haltestellen barrierefrei ausgebaut ist.",
          "Weil die kommunalen Fahrgemeinschaften bereits vollständig ausgelastet sind.",
        ],
        correct: 2,
        exp: "Tekst navodi primer osobe u invalidskim kolicima: prevoz joj nije upotrebljiv jer je tek mali deo stajališta pristupačan. O cenama i redu vožnje se ne govori.",
      },
      {
        q: "Wie beurteilt der Autor die Leihroller?",
        items: [
          "Als wichtigste Ergänzung des kommunalen Verkehrsnetzes.",
          "Als Maßnahme, die vor allem älteren Menschen zugutekommt.",
          "Als Projekt, das die Kommunen inzwischen verboten haben.",
          "Als Lösungsansatz, dessen Nutzen man bezweifeln darf.",
        ],
        correct: 3,
        exp: "Autor kaže da se može dovesti u pitanje da li su trotineti ozbiljan korak ka rešenju, jer brzo završe na otpadu. Nigde se ne pominju zabrane ni starije osobe.",
      },
      {
        q: "„Wer den Ursachen auf den Grund gehen will, stößt allerdings schnell auf ein zweites Hindernis.\" Was bedeutet hier „auf den Grund gehen\"?",
        items: [
          "eine Sache endgültig abschließen",
          "etwas nur oberflächlich erwähnen",
          "etwas genau untersuchen, um die Ursachen zu klären",
          "etwas ohne Prüfung als richtig annehmen",
        ],
        correct: 2,
        exp: "Izraz znači detaljno istražiti nešto i doći do uzroka. Rečenica najavljuje upravo dublju analizu, a ne zaključivanje teme.",
      },
      {
        q: "Welche Aussage gibt die Schlussfolgerung des Textes am besten wieder?",
        items: [
          "Entscheidend wird sein, wessen Wege in der Planung überhaupt berücksichtigt werden.",
          "Entscheidend wird sein, wie schnell neue Technologien eingeführt werden.",
          "Entscheidend wird sein, ob die Kommunen genügend Parkhäuser bauen.",
          "Entscheidend wird sein, ob die Menschen bereit sind, auf Mobilität zu verzichten.",
        ],
        correct: 0,
        exp: "U poslednjem pasusu autor kaže da o pravednosti neće odlučiti tehnika, nego čiji se putevi uopšte uzimaju u obzir pri planiranju.",
      },
    ],
  },
  {
    lesson: "Körper und Geist - Mit Schwung in den Alltag!",
    textTitle: "Der bewegte Kopf - warum Denken ohne Körper nicht funktioniert",
    body: `*Populärwissenschaftlicher Artikel*

Wer geistige Arbeit für eine reine Kopfsache hält, unterschätzt das Zusammenspiel von Körper und Gehirn. Die Forschung der letzten zwei Jahrzehnte zeigt: Bewegung ist keine Freizeitbeschäftigung neben der eigentlichen Leistung, sondern deren Voraussetzung.

Der Mechanismus ist inzwischen gut beschrieben. Jede körperliche Aktivität führt zunächst zu einer Anregung der Durchblutung und damit zu einer Erhöhung des Sauerstoffgehalts im Gehirn. Auf die bessere Versorgung folgt die schnellere Verarbeitung von Informationen - ein Effekt, der sich schon nach wenigen Minuten messen lässt. Hinzu kommt die Ausschüttung von Botenstoffen, die sowohl den Abbau von Stress als auch den Aufbau neuer Verbindungen zwischen den Nervenzellen bewirkt. Diese Vernetzung der Zellen ist die eigentliche Grundlage jedes Lernprozesses. Kurz gesagt: Die Steigerung der Muskelaktivität hat eine Verbesserung der Konzentrationsfähigkeit zur Folge.

Bemerkenswert ist, wie gering der nötige Aufwand dabei ausfällt. In einer viel zitierten Untersuchung genügten dreimal täglich fünf Minuten Bewegung zwischendurch, um bei Büroangestellten eine deutliche Förderung der Aufmerksamkeit über den ganzen Nachmittag nachzuweisen. Entscheidend war nicht die Intensität, sondern die Regelmäßigkeit. Wer zwischen zwei Terminen den Nacken lockert, die Schultern kreisen lässt und den Oberkörper einmal nach vorn beugt, tut für seine Leistungsfähigkeit mehr als jemand, der einmal in der Woche bis zur Erschöpfung trainiert - zumal eine derartige Belastung der Gelenke bei untrainierten Menschen eher schadet als nützt.

Bewegung wirkt sich allerdings nicht nur auf das Denken aus. Die Dehnung verkürzter Muskeln, die Verbesserung der Beweglichkeit und das Training von Gleichgewicht und Koordination sind für ältere Menschen von geradezu existenzieller Bedeutung: Wer sicher steht, stürzt seltener und behält seine Selbstständigkeit länger. Auch die Anregung des Stoffwechsels gehört zu den gut belegten Effekten. Nachholen lässt sich das Versäumte übrigens kaum: Wer am Wochenende zwei Stunden Sport treibt, in der übrigen Woche aber kaum vom Schreibtisch aufsteht, profitiert deutlich weniger, als er erwartet.

Warum also bewegen wir uns so wenig? Vermutlich deshalb, weil unser Alltag genau darauf ausgerichtet ist, Bewegung zu vermeiden. Aufzüge, Lieferdienste und Videokonferenzen sind bequem - und ihre Bequemlichkeit hat einen Preis, den wir erst spät bemerken. Wer das ändern will, braucht kein Fitnessstudio, sondern eine Entscheidung: aufstehen, wenn das Telefon klingelt; die Treppe nehmen; das nächste Gespräch im Gehen führen. Es ist anzunehmen, dass diese kleinen Gewohnheiten mehr bewirken als jeder gute Vorsatz, der auf den Januar vertagt wird.`,
    wortschatz: `**Wortschatzhilfe**

- *das Zusammenspiel* - sadejstvo, međusobno delovanje
- *die Anregung der Durchblutung* - podsticanje cirkulacije
- *die Ausschüttung von Botenstoffen* - lučenje neurotransmitera
- *der Abbau von Stress* - smanjenje stresa
- *die Vernetzung der Zellen* - umrežavanje ćelija
- *etwas zur Folge haben* - imati nešto za posledicu
- *die Leistungsfähigkeit* - radna sposobnost, učinak
- *existenziell* - od životne važnosti`,
    exTitle: "Leseverstehen: Bewegung und Gehirn",
    questions: [
      {
        q: "Welches Ziel verfolgt der Artikel in erster Linie?",
        items: [
          "Er will vor den gesundheitlichen Risiken intensiven Sports warnen.",
          "Er will erklären, warum körperliche Bewegung eine Voraussetzung geistiger Leistung ist.",
          "Er will ein bestimmtes Trainingsprogramm für Büroangestellte vorstellen.",
          "Er will zeigen, dass ältere Menschen grundsätzlich anders trainieren müssen als jüngere.",
        ],
        correct: 1,
        exp: "Već u uvodu stoji da kretanje nije razonoda pored pravog rada, nego njegov preduslov - i ceo tekst to objašnjava. Program vežbi se ne nudi.",
      },
      {
        q: "Was geschieht dem Text zufolge zuerst, wenn man sich bewegt?",
        items: [
          "Neue Verbindungen zwischen den Nervenzellen werden aufgebaut.",
          "Der Stoffwechsel kommt für kurze Zeit vollständig zur Ruhe.",
          "Die Muskelaktivität nimmt deutlich ab.",
          "Die Durchblutung wird angeregt und der Sauerstoffgehalt im Gehirn steigt.",
        ],
        correct: 3,
        exp: "Tekst opisuje redosled: prvo se podstiče cirkulacija i raste sadržaj kiseonika, tek zatim slede brža obrada informacija i stvaranje novih veza.",
      },
      {
        q: "Was war in der zitierten Untersuchung ausschlaggebend?",
        items: [
          "Dass die Bewegung regelmäßig stattfand, und nicht, dass sie intensiv war.",
          "Dass die Teilnehmenden mindestens eine Stunde am Stück trainierten.",
          "Dass die Übungen unter Anleitung einer Trainerin durchgeführt wurden.",
          "Dass die Teilnehmenden vor allem am frühen Morgen aktiv waren.",
        ],
        correct: 0,
        exp: "Doslovno stoji: presudan nije bio intenzitet, nego redovnost - tri puta dnevno po pet minuta.",
      },
      {
        q: "Warum sind Gleichgewicht und Koordination für ältere Menschen besonders wichtig?",
        items: [
          "Weil sie dadurch ihren Stoffwechsel vollständig umstellen können.",
          "Weil sich nur so verkürzte Muskeln wieder aufbauen lassen.",
          "Weil sie dadurch seltener stürzen und länger selbstständig bleiben.",
          "Weil sie dadurch auf regelmäßige ärztliche Kontrollen verzichten können.",
        ],
        correct: 2,
        exp: "U tekstu piše: ko stabilno stoji, ređe pada i duže ostaje samostalan. Ostale tvrdnje tekst nigde ne iznosi.",
      },
      {
        q: "„... und ihre Bequemlichkeit hat einen Preis, den wir erst spät bemerken.\" Was ist damit gemeint?",
        items: [
          "Aufzüge und Lieferdienste sind teurer, als die meisten Menschen denken.",
          "Die Preise für bequeme Dienstleistungen steigen von Jahr zu Jahr.",
          "Bequemlichkeit lohnt sich erst nach längerer Zeit.",
          "Die negativen Folgen des bequemen Alltags zeigen sich erst nach langer Zeit.",
        ],
        correct: 3,
        exp: "„Preis\" je ovde upotrebljen preneseno - misli se na posledice po zdravlje koje primetimo tek kasnije, a ne na novac.",
      },
      {
        q: "Welchen Rat gibt der Text am Ende?",
        items: [
          "Man sollte sich in einem Fitnessstudio anmelden, um wirksam zu trainieren.",
          "Man sollte Bewegung in kleine Gewohnheiten des Alltags einbauen.",
          "Man sollte sich für den Januar ein anspruchsvolles sportliches Ziel setzen.",
          "Man sollte Videokonferenzen grundsätzlich vermeiden.",
        ],
        correct: 1,
        exp: "Poslednji pasus izričito kaže da ne treba teretana, nego odluka: ustati kad zvoni telefon, ići stepenicama, razgovarati u hodu.",
      },
    ],
  },
  {
    lesson: "Ausbildungswege - Offene Türen und gläserne Decken",
    textTitle: "„Die Tür stand offen - aber nicht für alle gleich weit\"",
    body: `*Ein Gespräch mit Miriam Kessler, 34, Bauingenieurin, über Herkunft, Ausbildung und unsichtbare Grenzen*

**Frau Kessler, Sie haben zuerst eine Ausbildung gemacht und erst danach studiert. Warum dieser Umweg?**

Umweg würde ich das nicht nennen. Mein Abschlusszeugnis war eher mittelmäßig, wobei mir Mathematik immer leichtgefallen ist. Ein Studium schien in meinem Umfeld schlicht ausgeschlossen; niemand in meiner Familie hatte je eine Universität von innen gesehen. Also habe ich eine Berufsausbildung begonnen - und keinen Tag bereut, wenn die Vergütung damals auch sehr gering war.

**Was ist Ihnen in dieser Zeit aufgefallen?**

Dass ich zum ersten Mal gebraucht wurde. In der Berufsschule fiel mir allerdings auf, dass fast alle meine Mitschüler jünger waren als ich. Nichtsdestotrotz habe ich mich dort wohler gefühlt als je zuvor in der Schule. Der Berufswunsch, den ich mit vierzehn hatte, war mir längst entfallen; erst in der Praxis hat sich mir etwas aufgetan, was ich wirklich wollte.

**Und dann kam doch noch das Studium.**

Ja, mit 25 habe ich mich für Bauingenieurwesen eingeschrieben. Ungeachtet meiner Berufserfahrung war das erste Jahr hart. Für meine Lebenshaltung musste ich selbst aufkommen, weil meine Eltern das nicht konnten - was ihnen sehr missfallen hat, sie hätten mir gern mehr gegönnt. In zwei Klausuren bin ich durchgefallen. Trotzdem wäre ich nie auf die Idee gekommen, das Studium abzubrechen.

**Sie sprechen von einer gläsernen Decke. Wo genau verläuft sie?**

Nicht bei den Noten, meine Abschlussnoten waren ausgezeichnet. Es war etwas anderes: eine Haltung, ein Habitus, den man nicht lernt, sondern mitbringt. Wer weiß, wie man in einem Bewerbungsgespräch über das eigene Können spricht, ohne unangenehm zu wirken, hat sich das meist nicht mühsam antrainiert. Ich schon. Und Praktikumsplätze wurden in meinem Bekanntenkreis nicht weitergereicht, wie das anderswo üblich ist - solche Kontakte fielen mir nicht einfach zu. Im Alltag fällt so etwas kaum jemandem auf, und gerade darin liegt seine Wirkung.

**Was raten Sie jungen Leuten, die heute ratlos vor dieser Entscheidung stehen?**

Erstens: Beide Wege sind gute Wege, wenn sie auch sehr unterschiedlich verlaufen. Zweitens: Fragt nach. Die meisten Hindernisse, auf die ich gestoßen bin, waren nicht fachlicher Natur, sondern eine Frage der Information. Und drittens, bezüglich der Zweifel, die immer wieder auftreten: Sie verschwinden nicht, aber sie werden leiser.`,
    wortschatz: `**Wortschatzhilfe**

- *ausgeschlossen sein* - biti nemoguće, ne dolaziti u obzir
- *die Vergütung* - naknada za rad (tokom obuke)
- *jemandem auffallen* - pasti nekome u oči, primetiti
- *jemandem entfallen* - izmaći nekome iz sećanja, zaboraviti se
- *ungeachtet + Gen.* - uprkos, bez obzira na
- *für etwas aufkommen* - snositi troškove za nešto
- *der Habitus* - habitus, način ponašanja i nastupanja
- *jemandem zufallen* - pripasti nekome (samo od sebe)`,
    exTitle: "Leseverstehen: Ausbildung und Herkunft",
    questions: [
      {
        q: "Worum geht es in dem Interview vor allem?",
        items: [
          "Um die Frage, warum eine Berufsausbildung besser bezahlt wird als ein Studium.",
          "Um die technischen Anforderungen im Beruf der Bauingenieurin.",
          "Um die Frage, welche unsichtbaren Hürden einen Bildungsweg beeinflussen.",
          "Um Kritik an den Zulassungsprüfungen der Universitäten.",
        ],
        correct: 2,
        exp: "Razgovor se stalno vrti oko onoga što se ne vidi u ocenama - porekla, okruženja, kontakata i nastupa. To su „nevidljive prepreke\" iz naslova.",
      },
      {
        q: "Warum entschied sich Miriam Kessler zunächst gegen ein Studium?",
        items: [
          "In ihrem familiären Umfeld erschien ein Studium undenkbar.",
          "Ihre Eltern hatten ihr ausdrücklich davon abgeraten.",
          "Sie war in Mathematik zu schwach für ein technisches Fach.",
          "Sie hatte damals bereits einen festen Arbeitsplatz.",
        ],
        correct: 0,
        exp: "Ona kaže da je studiranje u njenom okruženju delovalo naprosto isključeno, jer niko iz porodice nikada nije bio na fakultetu. Matematika joj je, naprotiv, uvek išla lako.",
      },
      {
        q: "Was sagt sie über ihre Zeit in der Berufsschule?",
        items: [
          "Sie fühlte sich dort wegen ihres Alters ausgeschlossen.",
          "Sie musste die Abschlussprüfung zweimal wiederholen.",
          "Sie bereute ihre Entscheidung schon nach kurzer Zeit.",
          "Sie fühlte sich dort wohler als je zuvor in der Schule, obwohl sie älter war als die meisten.",
        ],
        correct: 3,
        exp: "Primetila je da su joj skoro svi školski drugovi mlađi, ali kaže: „Nichtsdestotrotz habe ich mich dort wohler gefühlt als je zuvor in der Schule.\"",
      },
      {
        q: "Worin besteht die „gläserne Decke\", von der sie spricht?",
        items: [
          "In zu strengen Notenanforderungen an der Universität.",
          "In einem Auftreten und in Kontakten, die man nicht in der Ausbildung erwirbt.",
          "In der fehlenden fachlichen Vorbereitung durch die Berufsschule.",
          "In der schlechten Bezahlung während der Ausbildung.",
        ],
        correct: 1,
        exp: "Izričito kaže da nije reč o ocenama - one su bile odlične - nego o stavu, habitusu i o vezama preko kojih se dolazi do prakse.",
      },
      {
        q: "„... solche Kontakte fielen mir nicht einfach zu.\" Was bedeutet dieser Satz?",
        items: [
          "Solche Kontakte ergaben sich bei ihr nicht von selbst.",
          "Sie lehnte solche Kontakte bewusst ab.",
          "Sie verlor ihre Kontakte nach dem Studium.",
          "Solche Kontakte waren ihr von Anfang an unangenehm.",
        ],
        correct: 0,
        exp: "Glagol „zufallen\" znači da nešto pripadne nekome samo od sebe. Uz negaciju: veze joj nisu dolazile same, morala je da ih stvara.",
      },
      {
        q: "Welche Haltung vertritt Miriam Kessler am Ende des Gesprächs?",
        items: [
          "Junge Leute sollten sich nach Möglichkeit immer für ein Studium entscheiden.",
          "Zweifel sind ein sicheres Zeichen dafür, dass man den falschen Weg gewählt hat.",
          "Beide Bildungswege sind gut, und viele Hürden sind eher ein Informationsproblem.",
          "Ohne die richtigen Beziehungen hat eine Bewerbung keine Aussicht auf Erfolg.",
        ],
        correct: 2,
        exp: "Njen savet je: oba puta su dobra, iako teku različito, a većina prepreka nije bila stručne prirode nego pitanje informisanosti.",
      },
    ],
  },
];

const isRead = (s) => s && s.type === "text" && typeof s.content === "string" && s.content.trimStart().startsWith(READ);
const isGram = (s) => s && s.type === "text" && typeof s.content === "string" && s.content.trimStart().startsWith(GRAM);
const isZiele = (s) => s && s.type === "text" && typeof s.content === "string" && s.content.includes("Lernziele");

let ok = 0;
for (const L of LESSONS) {
  const { data: lesson, error } = await sb.from("lessons").select("id,sections").eq("course_id", CID).eq("title", L.lesson).maybeSingle();
  if (error) { console.error(`✗ "${L.lesson}": greška - ${error.message}`); continue; }
  if (!lesson) { console.error(`✗ Lekcija "${L.lesson}" ne postoji u kursu - preskačem (ne kreiram je).`); continue; }

  const existing = Array.isArray(lesson.sections) ? lesson.sections : [];
  const had = existing.some(isRead);
  const base = existing.filter((s) => !isRead(s));

  // Pozicija: posle Lernziele, pre prvog gramatičkog bloka "## 📘".
  let idx = base.findIndex(isGram);
  if (idx === -1) {
    const z = base.findIndex(isZiele);
    idx = z === -1 ? base.length : z + 1;
  }

  const content = `${READ} Lesetext: ${L.textTitle}\n\n${L.body}\n\n${L.wortschatz}`;
  const words = L.body.replace(/[*#]/g, " ").split(/\s+/).filter(Boolean).length;

  // Vežba ide na kraj: max postojeći order_index + 1.
  const { data: exs } = await sb.from("exercises").select("id,title,order_index").eq("lesson_id", lesson.id);
  const mine = (exs ?? []).filter((e) => e.title === L.exTitle);
  const others = (exs ?? []).filter((e) => e.title !== L.exTitle);
  const nextIdx = others.length ? Math.max(...others.map((e) => e.order_index ?? 0)) + 1 : 1;

  console.log(`${had ? "~" : "+"} ${L.lesson}`);
  console.log(`   Lesetext: "${L.textTitle}" (${words} reči) → sekcija na poziciju ${idx}/${base.length} ${had ? "(zamena stare)" : "(nova)"}`);
  console.log(`   Vežba: "${L.exTitle}" ${mine.length ? "(zamena)" : "(nova)"}, order_index ${nextIdx}, ${L.questions.length} pitanja, tačni: [${L.questions.map((x) => x.correct).join(", ")}]`);

  if (!APPLY) continue;

  const next = base.slice();
  next.splice(idx, 0, { type: "text", style: "beispiele", content });
  const { error: uerr } = await sb.from("lessons").update({ sections: next }).eq("id", lesson.id);
  if (uerr) { console.error(`   ✗ update sekcija: ${uerr.message}`); continue; }

  await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("title", L.exTitle);
  const { data: ex, error: eerr } = await sb.from("exercises").insert({ lesson_id: lesson.id, title: L.exTitle, exercise_type: "quiz", order_index: nextIdx }).select("id").single();
  if (eerr) { console.error(`   ✗ insert vežbe: ${eerr.message}`); continue; }

  // Isti context objekat u svih 6 pitanja → GroupedExamExercise prikazuje tekst u panelu.
  const ctx = { type: "text", title: L.textTitle, content: L.body };
  const rows = L.questions.map((x, i) => ({
    exercise_id: ex.id,
    question: x.q,
    options: { type: "quiz", items: x.items, context: ctx },
    correct_answer: String(x.correct),
    explanation: x.exp,
    question_type: "quiz",
    order_index: i,
  }));
  const { error: qerr } = await sb.from("exercise_questions").insert(rows);
  if (qerr) { console.error(`   ✗ insert pitanja: ${qerr.message}`); continue; }
  console.log("   ✓ upisano");
  ok++;
}
console.log(APPLY ? `✓ Gotovo - obrađeno lekcija: ${ok}/${LESSONS.length}` : "[DRY] pokreni sa --apply za upis.");
