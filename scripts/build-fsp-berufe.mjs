// VOKABULAR: FSP lekcija "Zanimanja" iz "FSP novi" materijala (berufe_vezbe.html).
// Ilustrovana galerija zanimanja + wordset (Quizlet učenje) + kompletna lista (vocabulary)
// + 4 vežbe (kviz, richtig/falsch, klik spoiler, pisanje). Dry-run default; --apply. Idempotentno.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const LESSON_ID = "c8cbcb15-13e7-4901-8831-8b2ea75a75c4"; // FSP > Zanimanja
const IMG = (k) => `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog-media/fsp/illustrations/berufe-${k}.svg`;

// Ilustrovana zanimanja (redosled + DE/SR iz ICONORDER/ICONNAMES u HTML-u, 20 sličica)
const ilustrovana = [
  ["arzt", "der Arzt / die Ärztin", "lekar"],
  ["pflege", "der Pflegefachmann / die Pflegefachfrau", "med. sestra / negovatelj"],
  ["apotheker", "der Apotheker / die Apothekerin", "apotekar"],
  ["friseur", "der Friseur / die Friseurin", "frizer"],
  ["koch", "der Koch / die Köchin", "kuvar"],
  ["kellner", "der Kellner / die Kellnerin", "konobar"],
  ["baecker", "der Bäcker / die Bäckerin", "pekar"],
  ["metzger", "der Metzger / die Metzgerin", "mesar"],
  ["florist", "der Florist / die Floristin", "cvećar"],
  ["gaertner", "der Gärtner / die Gärtnerin", "baštovan"],
  ["lehrer", "der Lehrer / die Lehrerin", "nastavnik"],
  ["polizist", "der Polizist / die Polizistin", "policajac"],
  ["busfahrer", "der Busfahrer / die Busfahrerin", "vozač autobusa"],
  ["brieftraeger", "der Briefträger / die Briefträgerin", "poštar"],
  ["fotograf", "der Fotograf / die Fotografin", "fotograf"],
  ["software", "der Softwareentwickler / die Softwareentwicklerin", "programer"],
  ["elektroniker", "der Elektroniker / die Elektronikerin", "elektroničar"],
  ["maler", "der Maler und Lackierer", "moler i lakirer"],
  ["tischler", "der Tischler / die Tischlerin", "stolar"],
  ["maurer", "der Maurer / die Maurerin", "zidar"],
];

// Kompletna lista zanimanja sa opisom (de + op -> spojeno) i prevod (sr) - iz BERUFE niza
const berufe = [
  ["Angestellter im Bauamt", "Kümmert sich um Baugenehmigungen, überwacht Bauarbeiten und plant Bauvorhaben.", "službenik u građevinskom uredu"],
  ["Arzt / Ärztin", "Diagnostiziert Krankheiten und behandelt Patienten.", "lekar"],
  ["Astrologe / Astrologin", "Erstellt Horoskope und berät anhand astrologischer Daten.", "astrolog"],
  ["Backshop-Betreiber", "Betreibt einen Laden für Brot, Brötchen und Backwaren.", "vlasnik pekare/pekarskog kioska"],
  ["Bauingenieur / Bauingenieurin", "Plant und überwacht Bauprojekte wie Gebäude, Straßen oder Brücken.", "građevinski inženjer"],
  ["Beamter / Beamtin", "Arbeitet im öffentlichen Dienst und erfüllt staatliche Aufgaben.", "državni službenik"],
  ["Bergarbeiter / Bergarbeiterin", "Fördert Rohstoffe wie Kohle oder Erz.", "rudar"],
  ["Copy-Shop-Betreiber", "Bietet Druck- und Kopierdienstleistungen an.", "vlasnik kopirnice"],
  ["Drogeriemitarbeiter", "Verkauft Kosmetik, Haushaltswaren und Ähnliches.", "radnik u drogeriji"],
  ["Energieberater / Energieberaterin", "Berät Kunden zu Stromtarifen und Anbietern.", "savetnik za energiju"],
  ["Finanzbeamter / Finanzbeamtin", "Bearbeitet Steuererklärungen und berät Steuerzahler.", "poreski službenik"],
  ["Finanzberater / Finanzberaterin", "Hilft, finanzielle Ziele mit passenden Produkten zu erreichen.", "finansijski savetnik"],
  ["Florist / Floristin", "Gestaltet und verkauft Blumen und Pflanzen.", "cvećar"],
  ["Forstarbeiter / Forstarbeiterin", "Pflegt Wälder und fällt Bäume.", "šumski radnik"],
  ["Friseur / Friseurin", "Schneidet, stylt und färbt Haare.", "frizer"],
  ["Gebäudebetreuer", "Überwacht und wartet Gebäude und technische Anlagen.", "upravnik zgrade"],
  ["Gebäudereiniger", "Reinigt Gebäude, Fenster und Oberflächen.", "čistač zgrada"],
  ["Geschäftsvertreter", "Präsentiert und verkauft Produkte einer Firma.", "trgovački predstavnik"],
  ["Gärtner / Gärtnerin", "Pflanzt und pflegt Gärten und Grünflächen.", "baštovan"],
  ["Hausmeister / Hausmeisterin", "Betreut Gebäude, führt kleinere Reparaturen durch.", "domar"],
  ["Kanalarbeiter / Kanalarbeiterin", "Reinigt und wartet Abwasserkanäle.", "radnik na kanalizaciji"],
  ["Kaufmann / Kauffrau", "Arbeitet z. B. in Buchhaltung, Vertrieb oder Kundenservice.", "trgovac/komercijalista"],
  ["Kommunikationstrainer", "Hilft, kommunikative Fähigkeiten zu verbessern.", "trener komunikacije"],
  ["Konditor / Konditorin", "Stellt Torten, Gebäck und Süßspeisen her.", "poslastičar"],
  ["Koch / Köchin", "Bereitet Speisen zu.", "kuvar"],
  ["Chefkoch / Chefköchin", "Leitet die Küche und organisiert Arbeitsabläufe.", "šef kuhinje"],
  ["Konstrukteur-Ingenieur", "Entwickelt technische Produkte von der Idee bis zur Fertigung.", "konstruktor-inženjer"],
  ["Kundenbetreuer", "Pflegt Kundenkontakte und bearbeitet Anliegen.", "referent za korisnike"],
  ["Lehrer / Lehrerin", "Unterrichtet und bildet Schüler aus.", "nastavnik/učitelj"],
  ["Medizintechniker", "Entwickelt, wartet und repariert medizinische Geräte.", "medicinski tehničar (oprema)"],
  ["Notar / Notarin", "Beurkundet Rechtsgeschäfte und beglaubigt Unterschriften.", "notar/javni beležnik"],
  ["Pflegefachmann / Pflegefachfrau", "Pflegt und betreut Patienten.", "medicinska sestra/negovatelj"],
  ["Pförtner / Pförtnerin", "Kontrolliert den Zugang zu Gebäuden.", "portir"],
  ["Polizist / Polizistin", "Schützt die Bevölkerung und bekämpft Kriminalität.", "policajac"],
  ["Redakteur / Redakteurin", "Verfasst und bearbeitet Texte für Medien.", "urednik/novinar"],
  ["Reiseverkehrskaufmann", "Organisiert Reisen und berät zu Reiseangeboten.", "turistički agent"],
  ["Rechtsanwalt / Rechtsanwältin", "Vertritt Menschen rechtlich und berät juristisch.", "advokat"],
  ["Schaffner / Schaffnerin", "Kontrolliert Fahrkarten und betreut Fahrgäste im Zug.", "kondukter"],
  ["Schneider / Schneiderin", "Fertigt Kleidung an oder passt sie an.", "krojač"],
  ["Technischer Zeichner", "Erstellt technische Pläne und Zeichnungen.", "tehnički crtač"],
  ["Tierpfleger / Tierpflegerin", "Kümmert sich um Tiere in Zoos oder Tierheimen.", "negovatelj životinja"],
  ["Trachtengeschäft-Verkäufer", "Verkauft traditionelle Kleidung.", "prodavac narodne nošnje"],
  ["Verkäufer im Baumarkt", "Berät zu Baumaterialien und Werkzeugen.", "prodavac u gvožđari"],
  ["Busfahrer / Busfahrerin", "Fährt Busse im öffentlichen Nahverkehr.", "vozač autobusa"],
  ["Straßenbahnfahrer", "Steuert Straßenbahnen.", "vozač tramvaja"],
  ["Müllwerker / Müllwerkerin", "Sammelt Müll und entsorgt ihn korrekt.", "komunalni radnik/đubretar"],
  ["Briefträger / Briefträgerin", "Stellt Briefe und Pakete zu.", "poštar"],
  ["Paketbote / Paketbotin", "Bringt Pakete direkt zu den Kunden.", "dostavljač paketa"],
  ["Pflegeassistent", "Unterstützt Pflegekräfte bei der Versorgung.", "pomoćni negovatelj"],
  ["Zahnarzthelfer", "Hilft Zahnärzten und pflegt Instrumente.", "zubni asistent"],
  ["Medizinischer Fachangestellter", "Organisiert Termine und assistiert bei Untersuchungen.", "medicinski administrativni radnik"],
  ["Einzelhandelsverkäufer", "Berät Kunden und verkauft Waren im Einzelhandel.", "prodavac u maloprodaji"],
  ["Kassierer / Kassiererin", "Scannt Produkte an der Kasse und nimmt Zahlungen entgegen.", "kasir"],
  ["Lagerarbeiter / Lagerarbeiterin", "Verlädt, lagert und verwaltet Waren.", "magacioner"],
  ["Speditionskaufmann", "Organisiert den Transport von Gütern.", "špediter"],
  ["Berufskraftfahrer", "Transportiert Waren mit Lkws.", "profesionalni vozač (kamiondžija)"],
  ["Produktionsmitarbeiter", "Bedient Maschinen und überwacht Produktion.", "radnik u proizvodnji"],
  ["Mechatroniker / Mechatronikerin", "Repariert mechanische und elektronische Systeme.", "mehatroničar"],
  ["Elektroniker / Elektronikerin", "Installiert und repariert elektrische Anlagen.", "elektroničar"],
  ["Maler und Lackierer", "Streicht und gestaltet Räume und Fassaden.", "moler i lakirer"],
  ["Tischler / Tischlerin", "Fertigt Möbel und Holzprodukte an.", "stolar"],
  ["Dachdecker / Dachdeckerin", "Deckt Dächer und sorgt für Abdichtung.", "krovopokrivač"],
  ["Fliesenleger / Fliesenlegerin", "Verlegt Fliesen innen und außen.", "keramičar"],
  ["Sanitärinstallateur", "Installiert Wasserleitungen und Sanitäranlagen.", "vodoinstalater"],
  ["Bauhelfer / Bauhelferin", "Unterstützt Fachkräfte auf Baustellen.", "pomoćni građevinski radnik"],
  ["Maurer / Maurerin", "Baut Wände und Gebäude aus Stein oder Beton.", "zidar"],
  ["Landschaftsgärtner", "Plant und pflegt Parks und Grünanlagen.", "pejzažni baštovan"],
  ["Kosmetiker / Kosmetikerin", "Führt Hautpflege und Schönheitsbehandlungen durch.", "kozmetičar"],
  ["Tierarzthelfer", "Hilft Tierärzten bei Behandlung und Pflege.", "veterinarski tehničar"],
  ["Metzger / Metzgerin", "Stellt Fleisch- und Wurstwaren her und verkauft sie.", "mesar"],
  ["Lebensmitteltechniker", "Überwacht die Herstellung von Lebensmitteln.", "prehrambeni tehnolog"],
  ["Qualitätsprüfer", "Kontrolliert Produkte auf Qualität und Funktion.", "kontrolor kvaliteta"],
  ["Callcenter-Agent", "Beantwortet Kundenanfragen telefonisch oder per E-Mail.", "agent kol-centra"],
  ["Bürokaufmann / Bürokauffrau", "Organisiert Büroarbeiten wie Termine und Buchhaltung.", "kancelarijski službenik"],
  ["Verwaltungsangestellter", "Erledigt Aufgaben in Behörden und verwaltet Unterlagen.", "administrativni radnik"],
  ["Steuerfachangestellter", "Unterstützt Steuerberater bei Steuerunterlagen.", "poreski referent"],
  ["Versicherungskaufmann", "Berät zu Versicherungen und erstellt Verträge.", "agent osiguranja"],
  ["Immobilienkaufmann", "Vermittelt und verwaltet Immobilien.", "agent za nekretnine"],
  ["Bankkaufmann / Bankkauffrau", "Berät Kunden zu Finanzprodukten wie Konten und Krediten.", "bankarski službenik"],
  ["Hotelfachmann / Hotelfachfrau", "Organisiert Abläufe im Hotel und betreut Gäste.", "hotelijer"],
  ["Restaurantfachmann", "Bedient Gäste und sorgt für guten Service.", "ugostiteljski radnik"],
  ["Kellner / Kellnerin", "Serviert Speisen und Getränke.", "konobar"],
  ["Barista", "Bereitet Kaffeegetränke zu und berät Kunden.", "barista"],
  ["Reinigungskraft", "Reinigt und pflegt Räume und Gebäude.", "čistačica/spremačica"],
  ["Sicherheitsdienstmitarbeiter", "Sorgt für Sicherheit von Gebäuden oder Veranstaltungen.", "radnik obezbeđenja"],
  ["Wachmann / Wachfrau", "Überwacht Gebäude, Gelände oder Personen.", "čuvar"],
  ["Fachinformatiker", "Entwickelt und verwaltet IT-Systeme.", "informatičar"],
  ["Softwareentwickler", "Programmiert Softwareanwendungen.", "programer"],
  ["IT-Systemelektroniker", "Installiert und wartet IT-Systeme und Netzwerke.", "IT sistem-elektroničar"],
  ["Fotograf / Fotografin", "Macht und bearbeitet Fotos.", "fotograf"],
  ["Sozialarbeiter / Sozialarbeiterin", "Unterstützt Menschen in schwierigen Lebenslagen.", "socijalni radnik"],
  ["Logopäde / Logopädin", "Behandelt Sprach-, Sprech- und Schluckstörungen.", "logoped"],
  ["Hebamme / Entbindungspfleger", "Betreut Frauen während Schwangerschaft und Geburt.", "babica/akušer"],
  ["Apotheker / Apothekerin", "Gibt Medikamente ab und berät Patienten.", "apotekar"],
];

const sections = [
  { type: "badge", module: "Wortschatz", category: "wortschatz" },
  { type: "text", style: "default", content:
`## Berufe - zanimanja

Na FSP ispitu i u svakodnevnoj komunikaciji često treba da imenuješ zanimanje i ukratko opišeš šta ta osoba radi. Prvo pregledaj ilustracije i kompletnu listu, pa nauči osnovne pojmove kao kartice i proveri znanje kroz vežbe.` },

  { type: "text", style: "default", content: "## Berufe - zanimanja (sa ilustracijama)" },
  { type: "gallery", title: "Česta zanimanja sa sličicama", items: ilustrovana.map(([k, de, sr]) => ({ image: IMG(k), de, sr })) },

  { type: "text", style: "default", content: "## Häufige Berufe lernen - osnovna zanimanja\n\nVežbaj osnovna zanimanja kao kartice (kviz, kucanje, igra memorije):" },
  { type: "wordset", title: "Osnovna zanimanja", setKey: "fsp-berufe", frontLabel: "DE", backLabel: "SR",
    items: ilustrovana.map(([, de, sr]) => ({ front: de, back: sr })) },

  { type: "text", style: "default", content: "## Alle Berufe - kompletna lista zanimanja\n\nOpis (was macht man?) i prevod za sva zanimanja iz materijala:" },
  { type: "vocabulary", rows: berufe.map(([de, op, sr]) => [`${de} - ${op}`, sr]) },

  { type: "text", style: "uebung", content: "## Vežbe\n\nProveri šta si naučio:" },
  { type: "exercise", title: "Aufgabe 1 - Was macht dieser Beruf?" },
  { type: "exercise", title: "Aufgabe 2 - Richtig oder falsch?" },
  { type: "spoiler", title: "Aufgabe 3 - klikni za rešenje", items: [
    { question: "Wer diagnostiziert Krankheiten und behandelt Patienten?", answer: "der Arzt / die Ärztin (lekar)." },
    { question: "Wer schneidet, stylt und färbt Haare?", answer: "der Friseur / die Friseurin (frizer)." },
    { question: "Wer baut Wände und Gebäude aus Stein oder Beton?", answer: "der Maurer / die Maurerin (zidar)." },
    { question: "Wer stellt Fleisch- und Wurstwaren her und verkauft sie?", answer: "der Metzger / die Metzgerin (mesar)." },
    { question: "Wer gibt Medikamente ab und berät Patienten?", answer: "der Apotheker / die Apothekerin (apotekar)." },
  ] },
  { type: "exercise", title: "Aufgabe 4 - Schreiben Sie den Beruf" },
];

const exercises = [
  {
    title: "Aufgabe 1 - Was macht dieser Beruf?",
    exercise_type: "quiz",
    questions: [
      { q: "Was macht ein Arzt / eine Ärztin?", opts: ["Reinigt und wartet Abwasserkanäle.", "Diagnostiziert Krankheiten und behandelt Patienten.", "Berät zu Baumaterialien und Werkzeugen."], c: 1, e: "der Arzt / die Ärztin = lekar." },
      { q: "Was macht ein Friseur / eine Friseurin?", opts: ["Stellt Fleisch- und Wurstwaren her und verkauft sie.", "Berät Kunden zu Stromtarifen und Anbietern.", "Schneidet, stylt und färbt Haare."], c: 2, e: "der Friseur / die Friseurin = frizer." },
      { q: "Was macht ein Koch / eine Köchin?", opts: ["Unterstützt Steuerberater bei Steuerunterlagen.", "Bereitet Speisen zu.", "Bietet Druck- und Kopierdienstleistungen an."], c: 1, e: "der Koch / die Köchin = kuvar." },
      { q: "Was macht ein Polizist / eine Polizistin?", opts: ["Schützt die Bevölkerung und bekämpft Kriminalität.", "Hilft, finanzielle Ziele mit passenden Produkten zu erreichen.", "Plant und überwacht Bauprojekte wie Gebäude, Straßen oder Brücken."], c: 0, e: "der Polizist / die Polizistin = policajac." },
      { q: "Was macht ein Rechtsanwalt / eine Rechtsanwältin?", opts: ["Beurkundet Rechtsgeschäfte und beglaubigt Unterschriften.", "Verkauft Kosmetik, Haushaltswaren und Ähnliches.", "Vertritt Menschen rechtlich und berät juristisch."], c: 2, e: "der Rechtsanwalt / die Rechtsanwältin = advokat." },
      { q: "Was macht ein Briefträger / eine Briefträgerin?", opts: ["Bietet Druck- und Kopierdienstleistungen an.", "Organisiert Büroarbeiten wie Termine und Buchhaltung.", "Stellt Briefe und Pakete zu."], c: 2, e: "der Briefträger / die Briefträgerin = poštar." },
      { q: "Was macht ein Berufskraftfahrer?", opts: ["Unterstützt Steuerberater bei Steuerunterlagen.", "Serviert Speisen und Getränke.", "Transportiert Waren mit Lkws."], c: 2, e: "der Berufskraftfahrer = profesionalni vozač (kamiondžija)." },
      { q: "Was macht ein Logopäde / eine Logopädin?", opts: ["Behandelt Sprach-, Sprech- und Schluckstörungen.", "Installiert Wasserleitungen und Sanitäranlagen.", "Programmiert Softwareanwendungen."], c: 0, e: "der Logopäde / die Logopädin = logoped." },
    ],
  },
  {
    title: "Aufgabe 2 - Richtig oder falsch?",
    exercise_type: "true_false",
    questions: [
      { q: "Richtig oder falsch? „Ein Arzt diagnostiziert Krankheiten und behandelt Patienten.“", a: "true", e: "Richtig - das ist die Aufgabe eines Arztes." },
      { q: "Richtig oder falsch? „Ein Maurer schneidet und färbt Haare.“", a: "false", e: "Falsch - ein Maurer baut Wände aus Stein oder Beton. Haare schneidet der Friseur." },
      { q: "Richtig oder falsch? „Ein Apotheker gibt Medikamente ab und berät Patienten.“", a: "true", e: "Richtig." },
      { q: "Richtig oder falsch? „Ein Briefträger bereitet Speisen zu.“", a: "false", e: "Falsch - ein Briefträger stellt Briefe und Pakete zu. Speisen bereitet der Koch zu." },
      { q: "Richtig oder falsch? „Ein Pflegefachmann pflegt und betreut Patienten.“", a: "true", e: "Richtig." },
      { q: "Richtig oder falsch? „Ein Polizist verlegt Fliesen innen und außen.“", a: "false", e: "Falsch - ein Polizist schützt die Bevölkerung. Fliesen verlegt der Fliesenleger." },
    ],
  },
  {
    title: "Aufgabe 4 - Schreiben Sie den Beruf",
    exercise_type: "typing",
    questions: [
      { q: "Napiši zanimanje (der ...): „lekar koji leči pacijente“.", a: "Arzt|Ärztin|der Arzt|die Ärztin", e: "der Arzt / die Ärztin." },
      { q: "Napiši zanimanje: „osoba koja šiša, stilizuje i farba kosu“.", a: "Friseur|Friseurin|der Friseur|die Friseurin", e: "der Friseur / die Friseurin." },
      { q: "Napiši zanimanje: „osoba koja izdaje lekove u apoteci“.", a: "Apotheker|Apothekerin|der Apotheker|die Apothekerin", e: "der Apotheker / die Apothekerin." },
      { q: "Napiši zanimanje: „osoba koja zida zidove od cigle ili betona“.", a: "Maurer|Maurerin|der Maurer|die Maurerin", e: "der Maurer / die Maurerin." },
      { q: "Napiši zanimanje: „osoba koja priprema jela u kuhinji“.", a: "Koch|Köchin|der Koch|die Köchin", e: "der Koch / die Köchin." },
      { q: "Napiši zanimanje: „osoba koja neguje i brine o pacijentima“.", a: "Pflegefachmann|Pflegefachfrau|Pfleger", e: "der Pflegefachmann / die Pflegefachfrau." },
    ],
  },
];

function buildRows(ex, exId) {
  return ex.questions.map((q, i) => {
    if (ex.exercise_type === "quiz")
      return { exercise_id: exId, question: q.q, options: { type: "quiz", items: q.opts }, correct_answer: String(q.c), explanation: q.e, order_index: i };
    if (ex.exercise_type === "true_false")
      return { exercise_id: exId, question: q.q, options: null, correct_answer: q.a, explanation: q.e, order_index: i };
    return { exercise_id: exId, question: q.q, options: { type: "typing" }, correct_answer: q.a, explanation: q.e, order_index: i };
  });
}

async function main() {
  const { data: lesson, error: le } = await sb.from("lessons").select("id,title,sections").eq("id", LESSON_ID).single();
  if (le || !lesson) throw new Error("Lekcija nije nađena: " + (le?.message || ""));
  console.log(`\nLekcija: ${lesson.title} (${LESSON_ID})`);
  console.log(`Sekcija: ${(lesson.sections || []).length} -> ${sections.length}`);
  console.log(`Galerija: ${ilustrovana.length} | Wordset: ${ilustrovana.length} | Vocabulary: ${berufe.length}`);
  console.log(`Vežbe: ${exercises.map((e) => `${e.title.split(" - ")[0]}=${e.exercise_type}/${e.questions.length}`).join(", ")} + spoiler`);

  // Provera crtica
  const dump = JSON.stringify(sections) + JSON.stringify(exercises);
  if (/[–—]/.test(dump)) throw new Error("Pronađena en/em crtica - zameni običnom crticom!");

  if (!APPLY) { console.log("\n[DRY-RUN] Nije upisano. --apply za primenu.\n"); return; }

  const { error: ue } = await sb.from("lessons").update({ sections, lesson_type: "text" }).eq("id", LESSON_ID);
  if (ue) throw new Error("Update sekcija: " + ue.message);
  console.log("✓ Sekcije ažurirane");

  const { data: oldEx } = await sb.from("exercises").select("id").eq("lesson_id", LESSON_ID);
  if (oldEx?.length) {
    const ids = oldEx.map((e) => e.id);
    await sb.from("exercise_questions").delete().in("exercise_id", ids);
    await sb.from("exercises").delete().in("id", ids);
    console.log(`✓ Obrisano starih vežbi: ${ids.length}`);
  }
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const { data: row, error: ee } = await sb.from("exercises").insert({ lesson_id: LESSON_ID, title: ex.title, exercise_type: ex.exercise_type, order_index: i }).select("id").single();
    if (ee) throw new Error("Insert vežbe: " + ee.message);
    const { error: qe } = await sb.from("exercise_questions").insert(buildRows(ex, row.id));
    if (qe) throw new Error("Insert pitanja: " + qe.message);
    console.log(`✓ ${ex.title} (${ex.exercise_type}, ${ex.questions.length})`);
  }
  console.log("\nGotovo. Pregled: /lekcija/" + LESSON_ID + "\n");
}
main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
