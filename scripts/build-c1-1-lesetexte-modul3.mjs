// C1.1 - MODUL 3: autentični Lesetext (C1) + vežba razumevanja pročitanog u 3 lekcije.
// Tekstovi su originalni (pisani za ovaj kurs), usklađeni sa gramatikom i vokabularom lekcije.
// Dry-run podrazumevano; upis samo uz --apply. Idempotentno: svoju sekciju i svoju vežbu menja, ostalo ne dira.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const APPLY = process.argv.includes("--apply");
const CID = "3bfe17d7-62fa-4b06-b844-b10db9acd5ed"; // nemacki-c1-1
const MARK = "## 📖";   // marker Lesetext sekcije (po njemu se prepoznaje i zamenjuje)
const GRAM = "## 📘";   // prvi gramatički blok - ispred njega ide Lesetext

/* ────────────────────────────────────────────────────────────────────────────
   LEKCIJA 7 - Nachhaltigkeit
   Gramatika u tekstu: Artikelwörter + Adjektivdeklination II (etliche interne,
   viele wohlklingende, mehrerer moderner, wenige konkrete, lauter neue),
   Adjektive mit fester Präposition (beteiligt an, angewiesen auf,
   aufgeschlossen gegenüber, überzeugt von, gespannt auf).
   ──────────────────────────────────────────────────────────────────────────── */
const T1_TITLE = "Nachhaltigkeit ist kein Etikett";
const T1 = `**Kommentar**

Kaum ein anderer Begriff hat in den vergangenen Jahren eine derart steile Karriere gemacht wie „Nachhaltigkeit". Er prangt auf Verpackungen, in Stellenanzeigen und in etlichen internen Leitbildern, die vom Marketing mit sichtbarem Stolz veröffentlicht werden. Wer allerdings genauer hinsieht, entdeckt hinter vielen wohlklingenden Versprechen erstaunlich wenige konkrete Zahlen. Genau darin liegt das Problem.

Nachhaltiges Wirtschaften bedeutet, drei Dimensionen gleichzeitig ernst zu nehmen: ökologisch geht es darum, Ressourcen zu schonen und Emissionen zu senken, ökonomisch darum, langfristig Gewinne zu erzielen, sozial darum, faire Arbeitsbedingungen sicherzustellen. Diese drei Ziele lassen sich nicht gegeneinander ausspielen. Ein Unternehmen, das mithilfe mehrerer moderner Verfahren seinen Wasserverbrauch senkt, gleichzeitig aber seine Belegschaft unter Druck setzt, hat lediglich ein Teilproblem gelöst. Wer dagegen ausschließlich auf soziale Standards verweist, während die Produktion weiterhin das Grundwasser verunreinigt, betreibt in erster Linie Imagepflege.

Hinzu kommt ein zweites Missverständnis: Nachhaltigkeit wird gern als Zuständigkeit einer einzelnen Abteilung verstanden. Tatsächlich ist eine Nachhaltigkeitsmanagerin an nahezu allen Entscheidungen über den Produktionskreislauf beteiligt und zugleich auf die Kooperation der Geschäftsführung angewiesen. Wer für dieses Feld zuständig ist, verhandelt deshalb ununterbrochen - mit dem Einkauf, mit der Produktion und nicht zuletzt mit dem Controlling. Ohne diese Rückendeckung bleibt selbst das vielversprechendste Konzept ein Papier, das niemand in die Praxis umsetzt. Erfreulich ist immerhin, dass sich viele jüngere Beschäftigte gegenüber solchen Veränderungen ausgesprochen aufgeschlossen zeigen; sie sind von der Notwendigkeit überzeugt und fordern sie aktiv ein.

Skeptisch macht mich hingegen der Glaube, Innovationen allein würden das Problem lösen. Zwar entstehen derzeit lauter neue Materialien - hochwertige Verbundstoffe aus nachwachsenden Rohstoffen, biologisch abbaubare Verpackungen, vollständig recycelbare Bauteile -, doch jede dieser Entwicklungen ist aufwendig und teuer. Nur wenige solcher Produkte erreichen bislang den Massenmarkt. Wer also darauf wartet, dass die Technik uns die Entscheidung abnimmt, verschiebt sie lediglich.

Was folgt daraus? Nachhaltigkeit ist kein Etikett, das man auf ein bestehendes Geschäftsmodell klebt, sondern ein Maßstab, an dem sich jede einzelne Entscheidung messen lassen muss. Unternehmen, die das begriffen haben, veröffentlichen überprüfbare Zahlen zur Senkung ihrer Emissionen statt schöner Bilder. Ein Blick in die Berichte der letzten Jahre zeigt allerdings, dass sich die wenigen genannten Werte meist auf einzelne Standorte beziehen und nur selten auf die gesamte Lieferkette. Auf die nächste Generation von Nachhaltigkeitsberichten darf man deshalb gespannt sein - allerdings weniger auf ihre Sprache als auf ihre Nachkommastellen.`;

const T1_HELP = `**Wortschatzhilfe**

• *prangen auf* + Dat. - upadljivo stajati na (nečemu)
• *etwas gegeneinander ausspielen* - suprotstavljati jedno drugom
• *Imagepflege betreiben* - baviti se negovanjem imidža
• *die Rückendeckung* - podrška, zaleđina
• *der Verbundstoff* - kompozitni materijal
• *jemandem eine Entscheidung abnehmen* - odlučiti umesto nekoga
• *der Maßstab* - merilo, kriterijum
• *die Nachkommastelle* - decimalno mesto`;

const Q1 = [
  {
    q: "Welche Aussage gibt die Hauptaussage des Kommentars am besten wieder?",
    o: [
      "Nachhaltigkeit lässt sich am zuverlässigsten durch technische Innovationen erreichen.",
      "Nachhaltigkeit sollte in erster Linie die Aufgabe einer spezialisierten Abteilung sein.",
      "Nachhaltigkeit muss zum Maßstab für jede einzelne unternehmerische Entscheidung werden.",
      "Nachhaltigkeit ist vor allem ein Thema der Werbung und deshalb kaum ernst zu nehmen.",
    ],
    c: 2,
    e: "Poslednji pasus to kaže izričito: nije etiketa nego merilo za svaku pojedinačnu odluku.",
  },
  {
    q: "Welche Absicht verfolgt der Autor mit dem Text?",
    o: [
      "Er kritisiert den heutigen Umgang mit dem Begriff und fordert überprüfbare Angaben.",
      "Er stellt die Ergebnisse einer eigenen wissenschaftlichen Untersuchung vor.",
      "Er warnt Verbraucherinnen und Verbraucher vor biologisch abbaubaren Verpackungen.",
      "Er wirbt für ein bestimmtes Unternehmen und dessen Nachhaltigkeitsbericht.",
    ],
    c: 0,
    e: "Ceo tekst je kritika prazne upotrebe pojma, a na kraju traži proverljive brojke umesto lepih slika.",
  },
  {
    q: "Was kritisiert der Autor an einem Unternehmen, das seinen Wasserverbrauch senkt, zugleich aber seine Belegschaft unter Druck setzt?",
    o: [
      "Es verstößt damit gegen geltende Umweltauflagen.",
      "Es investiert zu wenig in moderne Verfahren.",
      "Es veröffentlicht seine Zahlen zu selten.",
      "Es berücksichtigt nur einen Teil der drei Nachhaltigkeitsdimensionen.",
    ],
    c: 3,
    e: "Tekst kaže da je time rešen samo deo problema - ekološka dimenzija bez socijalne nije dovoljna.",
  },
  {
    q: "Wie beschreibt der Text die Haltung vieler jüngerer Beschäftigter?",
    o: [
      "Sie halten die ganze Debatte für stark übertrieben.",
      "Sie sind Veränderungen gegenüber aufgeschlossen und fordern sie sogar aktiv ein.",
      "Sie sind von der Geschäftsführung enttäuscht und kündigen häufiger als früher.",
      "Sie interessieren sich fast ausschließlich für neue Materialien.",
    ],
    c: 1,
    e: "U trećem pasusu piše da su otvoreni prema promenama, ubeđeni u njihovu neophodnost i da ih aktivno traže.",
  },
  {
    q: "Warum genügt es laut Text nicht, auf neue Materialien zu warten?",
    o: [
      "Weil ihre Entwicklung aufwendig ist und bisher nur wenige dieser Produkte den Massenmarkt erreichen.",
      "Weil sich die neuen Materialien grundsätzlich nicht recyceln lassen.",
      "Weil die Kundschaft solche Produkte durchweg ablehnt.",
      "Weil die Forschung an solchen Materialien in Europa untersagt ist.",
    ],
    c: 0,
    e: "Četvrti pasus: razvoj je skup i zahtevan, a samo malo takvih proizvoda stigne do masovnog tržišta.",
  },
  {
    q: "„... betreibt in erster Linie Imagepflege.\" Was ist mit „Imagepflege betreiben\" an dieser Stelle gemeint?",
    o: [
      "regelmäßig Berichte über soziale Projekte lesen",
      "die Arbeitsbedingungen systematisch verbessern",
      "sich um die Instandhaltung der eigenen Anlagen kümmern",
      "vor allem am guten Ruf nach außen arbeiten",
    ],
    c: 3,
    e: "Iz konteksta: firma se poziva samo na socijalne standarde, a zapravo radi na utisku u javnosti.",
  },
];

/* ────────────────────────────────────────────────────────────────────────────
   LEKCIJA 8 - Altern
   Gramatika u tekstu: adversative Zusammenhänge (während, wohingegen,
   anders als, im Gegensatz dazu, jedoch, dagegen, entgegen + Dativ).
   ──────────────────────────────────────────────────────────────────────────── */
const T2_TITLE = "Länger leben oder besser altern?";
const T2 = `**Magazinartikel**

Die durchschnittliche Lebenserwartung in Europa hat sich innerhalb von gut hundert Jahren nahezu verdoppelt. Was frühere Generationen für einen sehnlichen, aber unerfüllbaren Wunsch hielten, ist heute statistischer Alltag: Ein Kind, das in Deutschland zur Welt kommt, hat gute Aussichten, seinen achtzigsten Geburtstag zu erleben. Die Forschung gibt sich damit jedoch nicht zufrieden. Sie fragt inzwischen nicht mehr nur, wie lange wir leben, sondern ob sich das Altern selbst aufhalten lässt.

Biologisch betrachtet ist Altern der allmähliche Verlust der Fähigkeit, sich zu regenerieren. Unsere Zellen teilen sich mit den Jahren seltener und werden zunehmend träge, während einige Tierarten dieses Problem offenbar nicht kennen: Bei bestimmten Quallen und Süßwasserpolypen bleibt die Wahrscheinlichkeit zu sterben das ganze Leben lang gleich groß, wohingegen das Sterberisiko beim Menschen mit jedem Jahrzehnt deutlich zunimmt. Genau diese Tiere stehen deshalb im Fokus etlicher Labore. Hinzu kommt, dass sich die Frage nach den Grenzen des Lebens längst nicht mehr nur in Forschungseinrichtungen stellt, sondern ebenso in Kliniken, Versicherungen und Parlamenten.

Die Erwartungen, die daran geknüpft werden, gehen weit auseinander. Optimistische Stimmen halten eine deutliche Verjüngung des Gewebes für absehbar; entgegen dieser Einschätzung warnen andere Fachleute davor, Ergebnisse aus dem Labor vorschnell auf den Menschen zu übertragen. Was in der Petrischale gelingt, ist im komplexen Organismus noch lange nicht in greifbarer Nähe. Im Gegensatz dazu ist ein anderer Befund unumstritten: Wer sich regelmäßig bewegt, ausreichend schläft und soziale Kontakte pflegt, verschiebt Gebrechlichkeit und Vergesslichkeit um Jahre.

Und damit stellt sich die eigentliche Frage. Eine Gesellschaft, in der niemand mehr stirbt, hätte weitreichende Konsequenzen, denn Karrieren, Partnerschaften und Rentensysteme sind auf ein Ende hin gedacht. Für viele ist die Aussicht auf ein sehr langes Leben verlockend, wohingegen andere gerade in der Begrenztheit den Wert des einzelnen Lebens sehen. Dass Erfahrung, Gelassenheit und Weisheit mit den Jahren wachsen, spricht für das Alter; die zunehmenden körperlichen Einschränkungen sprechen dagegen. Ethisch strittig bleibt zudem, wer sich eine solche Medizin überhaupt leisten könnte.

Vielleicht ist die Zielsetzung selbst falsch gewählt. Anders als in vielen Schlagzeilen suggeriert wird, geht es in der seriösen Altersforschung kaum um Unsterblichkeit. Ihr eigentliches Ziel ist bescheidener und zugleich wünschenswerter: nicht mehr Jahre um jeden Preis, sondern mehr gesunde Jahre. Wer das Altern hinauszögern will, sollte deshalb weniger auf ein künftiges Präparat hoffen als auf die eigenen Entscheidungen von heute.`;

const T2_HELP = `**Wortschatzhilfe**

• *die Lebenserwartung* - očekivani životni vek
• *sich regenerieren* - obnavljati se, regenerisati se
• *in greifbarer Nähe sein* - biti nadohvat ruke
• *die Gebrechlichkeit* - staračka nemoć, krhkost
• *weitreichende Konsequenzen* - dalekosežne posledice
• *ethisch strittig* - etički sporan
• *die Begrenztheit* - ograničenost, konačnost
• *etwas hinauszögern* - odlagati nešto`;

const Q2 = [
  {
    q: "Worum geht es dem Text vor allem?",
    o: [
      "Um den Nachweis, dass der Mensch in absehbarer Zeit unsterblich sein wird.",
      "Um die Frage, ob gesunde Jahre nicht wichtiger sind als die bloße Lebensdauer.",
      "Um eine Anleitung, wie man das Altern mit Präparaten vollständig stoppt.",
      "Um einen Vergleich der Rentensysteme in verschiedenen europäischen Ländern.",
    ],
    c: 1,
    e: "Poslednji pasus formuliše upravo to: cilj nije više godina po svaku cenu, nego više zdravih godina.",
  },
  {
    q: "Wie steht der Text zu den Versprechen der Verjüngungsforschung?",
    o: [
      "Er lehnt jede Forschung an Tieren grundsätzlich ab.",
      "Er hält diese Versprechen für bereits vollständig eingelöst.",
      "Er gibt sie wieder, mahnt aber zur Zurückhaltung bei der Übertragung auf den Menschen.",
      "Er hält sie für reine Schlagzeilen ohne jede wissenschaftliche Grundlage.",
    ],
    c: 2,
    e: "Tekst navodi optimistične glasove, ali odmah citira stručnjake koji upozoravaju na prenagljeno prenošenje rezultata na čoveka.",
  },
  {
    q: "Was unterscheidet bestimmte Quallen und Süßwasserpolypen laut Text vom Menschen?",
    o: [
      "Ihr Sterberisiko steigt mit zunehmendem Alter nicht an.",
      "Sie werden grundsätzlich älter als achtzig Jahre.",
      "Ihre Zellen teilen sich überhaupt nicht mehr.",
      "Sie altern schneller, sterben aber deutlich später.",
    ],
    c: 0,
    e: "Drugi pasus: verovatnoća umiranja kod njih ostaje ista celog života, dok kod čoveka raste sa svakom decenijom.",
  },
  {
    q: "Welche Maßnahmen verschieben laut Text Gebrechlichkeit und Vergesslichkeit?",
    o: [
      "Regelmäßiges Fasten und synthetische Präparate.",
      "Gentechnische Eingriffe im frühen Erwachsenenalter.",
      "Ein Umzug in eine Region mit besonders hoher Lebenserwartung.",
      "Ausreichend Bewegung, genügend Schlaf und soziale Kontakte.",
    ],
    c: 3,
    e: "Treći pasus navodi baš ta tri nesporna faktora: kretanje, dovoljno sna i socijalni kontakti.",
  },
  {
    q: "Welches ethische Problem nennt der Text im Zusammenhang mit einer solchen Medizin?",
    o: [
      "Dass Tierversuche dafür unvermeidlich wären.",
      "Dass unklar ist, wer sie sich überhaupt leisten könnte.",
      "Dass Ärztinnen und Ärzte dafür nicht ausgebildet sind.",
      "Dass die Forschungsergebnisse nicht veröffentlicht werden dürfen.",
    ],
    c: 1,
    e: "Na kraju četvrtog pasusa stoji da je etički sporno ko bi uopšte mogao da priušti takvu medicinu.",
  },
  {
    q: "„Was in der Petrischale gelingt, ist im komplexen Organismus noch lange nicht in greifbarer Nähe.\" Was bedeutet „in greifbarer Nähe\" hier?",
    o: [
      "räumlich mühelos zu erreichen",
      "in der Fachwelt heftig umstritten",
      "in absehbarer Zeit zu verwirklichen",
      "bereits vollständig abgeschlossen",
    ],
    c: 2,
    e: "Reč je o vremenskoj, ne prostornoj blizini: nešto što se uskoro može ostvariti.",
  },
];

/* ────────────────────────────────────────────────────────────────────────────
   LEKCIJA 9 - Licht
   Gramatika u tekstu: Nominalstil II (Erfindung ... durch, Verbot ... durch,
   Vertrauen in, Schutz vor, Eignung ... für, Nutzen ... für, Einfluss auf,
   Reduzierung des ..., Verzicht auf).
   ──────────────────────────────────────────────────────────────────────────── */
const T3_TITLE = "Die Eroberung der Nacht";
const T3 = `**Magazinartikel**

Wer heute abends einen Schalter betätigt, denkt kaum darüber nach, welche Selbstverständlichkeit damit hergestellt wird. Die Geschichte der künstlichen Beleuchtung ist die Geschichte einer allmählichen Eroberung der Nacht. Am Anfang stand die Nutzbarmachung des Feuers - ein Meilenstein, dessen Bedeutung für die Entwicklung unserer Art kaum zu überschätzen ist. Das Lagerfeuer diente nicht allein der Erwärmung, sondern vor allem dem Schutz vor wilden Tieren und der Erweiterung des Tages über den Sonnenuntergang hinaus.

Mit der Besiedlung von Höhlen und später von festen Innenräumen begann die Suche nach transportierbaren Lichtquellen. Archäologische Funde belegen, dass bereits die Höhlenmalerei auf eine planvolle Beleuchtung unterirdischer Gänge angewiesen war. Die Öllampe der Antike und die mittelalterliche Kerze aus Bienenwachs waren allerdings so kostbar, dass helle Innenräume lange Zeit ein Privileg weniger begüterter Haushalte blieben. Ihr Licht flackerte, es rußte, und der ausströmende Geruch machte längeres Arbeiten unangenehm. Erst die Industrialisierung brachte einen doppelten Bruch: die Einführung der Gaslampe und, wenige Jahrzehnte darauf, die Erfindung der Glühlampe durch den Ingenieur Thomas Alva Edison.

Die Folgen dieses technischen Sprungs waren gravierend. In den Fabrikhallen reichte das schwache, flackernde Licht der Öllampen nicht mehr aus; die neue Glühlampe schien heller und deutlich konstanter, was eine Verlängerung der Arbeitszeit bis weit in die Nacht hinein ermöglichte. Gleichzeitig veränderte die Beleuchtung das Gesicht der Städte: Um die Jahrhundertwende strahlten erste Leuchtreklamen an den Fassaden von Berlin, Paris und London, und in einem regelrechten Wettstreit um die Gunst der Besucher funkelten die Metropolen bis in die Morgenstunden.

Dass jede Lichtquelle irgendwann abgelöst wird, zeigt die jüngste Entwicklung. Das Verbot der klassischen Glühlampe durch die EU und der anschließende Einzug der LED haben binnen weniger Jahre zu einer starken Reduzierung des Stromverbrauchs geführt. Bemerkenswert ist dabei weniger die Technik als das Verhalten der Verbraucherinnen und Verbraucher: Das Vertrauen in die neue Technologie war anfangs gering, die Klage über kaltes, ungemütliches Licht verbreitet. Erst die Verbesserung der Farbtöne und die Eignung der Lampen für nahezu alle Räume haben die Skepsis verschwinden lassen.

Und doch hat der Gewinn eine Kehrseite. Die nahezu vollständige Erhellung unserer Städte führt dazu, dass ein wachsender Teil der Bevölkerung den Sternenhimmel nie in voller Pracht gesehen hat. Der Nutzen heller Straßen für die Sicherheit ist unbestritten; der Einfluss dauerhafter Helligkeit auf den Schlaf des Menschen und auf die Orientierung von Zugvögeln wird jedoch erst seit Kurzem systematisch erforscht. Die nächste Etappe der Lichtgeschichte könnte deshalb nicht in noch mehr Licht bestehen, sondern im bewussten Verzicht darauf.`;

const T3_HELP = `**Wortschatzhilfe**

• *die Nutzbarmachung* - stavljanje u upotrebu, iskorišćavanje
• *begütert* - imućan
• *rußen* - stvarati čađ
• *gravierend* - ozbiljan, težak (o posledicama)
• *der Wettstreit* - nadmetanje
• *die Kehrseite* - naličje, loša strana
• *in voller Pracht* - u punom sjaju
• *der Einzug* (hier) - prodor, uvođenje`;

const Q3 = [
  {
    q: "Welche Entwicklung beschreibt der Artikel?",
    o: [
      "Den Weg von den ersten Feuerstellen bis zur LED und zu den Schattenseiten heller Städte.",
      "Die Geschichte der Elektrizitätsversorgung in europäischen Fabriken.",
      "Die Entstehung der Leuchtreklame im 20. Jahrhundert.",
      "Die Erforschung des Schlafverhaltens von Zugvögeln.",
    ],
    c: 0,
    e: "Tekst ide hronološki od logorske vatre do LED-a i na kraju otvara pitanje svetlosnog zagađenja.",
  },
  {
    q: "Welche Schlussfolgerung zieht der Autor am Ende des Textes?",
    o: [
      "Die LED sollte möglichst bald wieder durch die Glühlampe ersetzt werden.",
      "Der nächste Fortschritt könnte im bewussten Verzicht auf Licht liegen.",
      "Städte sollten nachts vollständig unbeleuchtet bleiben.",
      "Die Erforschung neuer Lichtquellen ist im Wesentlichen abgeschlossen.",
    ],
    c: 1,
    e: "Poslednja rečenica: sledeća etapa možda nije još više svetla, nego svesno odricanje od njega.",
  },
  {
    q: "Warum blieben helle Innenräume vor der Industrialisierung ein Privileg?",
    o: [
      "Weil das Wohnen in Höhlen damals noch weit verbreitet war.",
      "Weil der Gebrauch von Kerzen in Innenräumen verboten war.",
      "Weil Öllampen und Kerzen sehr teuer waren.",
      "Weil Bienenwachs zu dieser Zeit gar nicht verfügbar war.",
    ],
    c: 2,
    e: "U drugom pasusu stoji da su uljanica i vosak bili toliko skupi da su osvetljene prostorije bile privilegija.",
  },
  {
    q: "Was ermöglichte die Glühlampe laut Text in den Fabriken?",
    o: [
      "Eine Senkung der Unfallzahlen auf nahezu null.",
      "Den vollständigen Verzicht auf Gaslampen innerhalb eines Jahres.",
      "Die Abschaffung der Nachtarbeit in der Industrie.",
      "Die Ausdehnung der Arbeitszeit bis weit in die Nacht.",
    ],
    c: 3,
    e: "Treći pasus: jače i postojanije svetlo omogućilo je produženje radnog vremena duboko u noć.",
  },
  {
    q: "Wodurch verschwand laut Text die anfängliche Skepsis gegenüber der LED?",
    o: [
      "Durch bessere Farbtöne und die Eignung der Lampen für fast alle Räume.",
      "Durch eine großangelegte Werbekampagne der Hersteller.",
      "Durch das Verbot sämtlicher anderer Leuchtmittel.",
      "Durch den stark gesunkenen Anschaffungspreis der Lampen.",
    ],
    c: 0,
    e: "Četvrti pasus navodi upravo poboljšanje nijansi svetlosti i primenljivost u skoro svim prostorijama.",
  },
  {
    q: "„Und doch hat der Gewinn eine Kehrseite.\" Was ist mit „Kehrseite\" hier gemeint?",
    o: [
      "eine unerwartete Steigerung",
      "eine gesetzliche Einschränkung",
      "ein technischer Defekt",
      "ein negativer Aspekt derselben Entwicklung",
    ],
    c: 3,
    e: "Sledeće rečenice govore o gubicima (nema zvezdanog neba, uticaj na san i ptice) - dakle o lošoj strani istog napretka.",
  },
];

const LESSONS = [
  { title: "Nachhaltigkeit - Alles im grünen Bereich", tTitle: T1_TITLE, text: T1, help: T1_HELP, exTitle: "Leseverstehen: Nachhaltigkeit", qs: Q1 },
  { title: "Altern - Ewig leben?", tTitle: T2_TITLE, text: T2, help: T2_HELP, exTitle: "Leseverstehen: Altern und Lebenserwartung", qs: Q2 },
  { title: "Licht - Von allen Seiten beleuchtet", tTitle: T3_TITLE, text: T3, help: T3_HELP, exTitle: "Leseverstehen: Kulturgeschichte des Lichts", qs: Q3 },
];

// ── Provera jezičkih pravila: nikad dugačka crta ────────────────────────────
for (const L of LESSONS) {
  const blob = [L.tTitle, L.text, L.help, L.exTitle, ...L.qs.flatMap((x) => [x.q, x.e, ...x.o])].join("\n");
  const bad = blob.match(/[–—]/g);
  if (bad) { console.error(`✗ "${L.title}": pronađena dugačka crta (${bad.length}x) - ispravi pre upisa.`); process.exit(1); }
  if (L.qs.length !== 6) { console.error(`✗ "${L.title}": mora biti tačno 6 pitanja.`); process.exit(1); }
}

const wc = (s) => s.replace(/\*\*|\*/g, "").split(/\s+/).filter(Boolean).length;

// ── Upis ────────────────────────────────────────────────────────────────────
for (const L of LESSONS) {
  const { data: lesson, error: le } = await sb
    .from("lessons").select("id,sections").eq("course_id", CID).eq("title", L.title).maybeSingle();
  if (le) { console.error(`✗ "${L.title}": ${le.message}`); continue; }
  if (!lesson) { console.error(`✗ Lekcija "${L.title}" ne postoji u kursu - preskačem (ne kreiram je).`); continue; }

  const existing = Array.isArray(lesson.sections) ? lesson.sections : [];
  const isMine = (s) => s && s.type === "text" && typeof s.content === "string" && s.content.trimStart().startsWith(MARK);
  const had = existing.some(isMine);

  const base = existing.filter((s) => !isMine(s));
  let idx = base.findIndex((s) => s.type === "text" && typeof s.content === "string" && s.content.trimStart().startsWith(GRAM));
  if (idx === -1) {
    // nema gramatičkog bloka: ubaci odmah posle Lernziele, inače na kraj
    const lz = base.findIndex((s) => s.type === "text" && typeof s.content === "string" && s.content.includes("Lernziele"));
    idx = lz === -1 ? base.length : lz + 1;
  }

  const section = { type: "text", style: "beispiele", content: `${MARK} Lesetext: ${L.tTitle}\n\n${L.text}\n\n${L.help}` };
  const next = [...base.slice(0, idx), section, ...base.slice(idx)];

  const { data: exs } = await sb.from("exercises").select("id,title,order_index").eq("lesson_id", lesson.id);
  const others = (exs || []).filter((e) => e.title !== L.exTitle);
  const maxIdx = others.reduce((m, e) => Math.max(m, e.order_index ?? 0), 0);
  const hadEx = (exs || []).some((e) => e.title === L.exTitle);

  console.log(`\n${had ? "~" : "+"} ${L.title}`);
  console.log(`   Lesetext: „${L.tTitle}" - ${wc(L.text)} reči, sekcija na poziciju ${idx}/${base.length} (${had ? "zamena" : "novo"})`);
  console.log(`   Vežba: „${L.exTitle}" - ${L.qs.length} pitanja, order_index ${maxIdx + 1} (${hadEx ? "zamena" : "novo"})`);
  console.log(`   Tačni odgovori: ${L.qs.map((x) => x.c).join(", ")}`);

  if (!APPLY) continue;

  const { error: ue } = await sb.from("lessons").update({ sections: next }).eq("id", lesson.id);
  if (ue) { console.error(`   ✗ sections: ${ue.message}`); continue; }

  await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("title", L.exTitle);
  const { data: ex, error: ie } = await sb.from("exercises")
    .insert({ lesson_id: lesson.id, title: L.exTitle, exercise_type: "quiz", order_index: maxIdx + 1 })
    .select("id").single();
  if (ie) { console.error(`   ✗ exercises: ${ie.message}`); continue; }

  // context MORA biti objekat i identičan u svih 6 pitanja - tako se okida GroupedExamExercise
  const context = { type: "text", title: L.tTitle, content: L.text };
  const rows = L.qs.map((x, i) => ({
    exercise_id: ex.id,
    question: x.q,
    options: { type: "quiz", items: x.o, context },
    correct_answer: String(x.c),
    explanation: x.e,
    question_type: "quiz",
    order_index: i + 1,
  }));
  const { error: qe } = await sb.from("exercise_questions").insert(rows);
  if (qe) { console.error(`   ✗ exercise_questions: ${qe.message}`); continue; }
  console.log("   ✓ upisano");
}

console.log(APPLY ? "\n✓ Gotovo (C1.1 Modul 3: Lesetexte + Leseverstehen)." : "\n[DRY] Ništa nije upisano - dodaj --apply.");
