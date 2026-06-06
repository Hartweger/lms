// C1 Leseverstehen test → lekcija "LESEN C1" (polozi-goethe-c1). 4 dela, 30 zadataka.
// Tekstovi idu kao context panel uz pitanja. Dry-run default; --apply. Idempotentno.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const EX_TITLE = "Leseverstehen — Modelltest C1";

const CTX1 = { type: "text", title: "Teil 1 — Gesunder Schlaf (Zeitschrift)", content:
"**Gesunder Schlaf — Schlafmangel führt zu Schädigung des Gehirns**\n\nDie moderne Industriegesellschaft mit ihrem 24-Stunden-Rhythmus bringt immer mehr Menschen um ihren Schlaf. Die Folgen von Schlafstörungen und Schlafmangel dürfen __(0)__ unterschätzt werden. Sie können langfristig zu schwerwiegenden Beeinträchtigungen der Leistungs- und Konzentrationsfähigkeit führen. Auch psychische Störungen zählen zu den Langzeitfolgen von Schlafstörungen.\n\nDie Kriterien für guten oder schlechten Schlaf __(1)__ sich an drei einfachen Fragen festmachen: Schlafe ich leicht ein? Habe ich ruhig durchgeschlafen? Wie bewerte ich selbst die Qualität meines Schlafs? Einschlafstörungen sind das meistverbreitete Problem. Dazu gehört auch die Schwierigkeit, die ganze Nacht durchzuschlafen bzw. der erfolglose __(2)__, wieder einzuschlafen, wenn man einmal aufgewacht ist. Die Ursachen sind hauptsächlich psychischer Art. Ein weiteres Problem ist das Einnicken tagsüber und das Gefühl, ständig schläfrig zu sein, __(3)__ man eigentlich glaubt, ausreichend geschlafen zu haben.\n\nDass Schlafverhalten die Leistungsfähigkeit beeinflusst, __(4)__ belegen zahlreiche Laborstudien. Im Tiefschlaf wird Wissen reaktiviert, verarbeitet und __(5)__ besser gespeichert. Alte Synapsen werden neu geordnet, neu gefestigte Inhalte in vorhandenes Wissen __(6)__.\n\nEine Studie wies nach, dass Schulkinder, die gut geschlafen haben, am nächsten Tag zu höherer Leistung __(7)__ waren. Wenn das Gehirn nachts nicht genug Ruhe bekommt, versucht es, am Tag __(8)__ zu kommen." };

const CTX2 = { type: "text", title: "Teil 2 — Ratte, rette mich (Internet)", content:
"**Ratte, rette mich: Trainierte Nager sollen Vermisste suchen**\n\nNach einem Erdbeben setzen Rettungstrupps oft speziell ausgebildete Suchhunde ein, um Vermisste aufzuspüren. Die Hunde können Gerüche feiner wahrnehmen als Menschen. Sie bellen, wenn sie jemanden finden. Allerdings können selbst Hunde nicht an jede Stelle vordringen. Daher könnten Suchteams künftig um eine tierische Einheit erweitert werden — ausgerechnet Ratten.\n\nEine NGO mit Sitz in Tansania setzt schon seit Jahren erfolgreich Riesenhamsterratten ein, um in ehemaligen Kriegsgebieten nach Landminen zu suchen. Anders als Metalldetektoren ignorieren die Ratten jeglichen Metallschrott und erschnüffeln nur den Sprengstoff. Die HeroRATs werden auch trainiert, um Tuberkulose herauszuriechen — das gleiche Prinzip wie bei Landminen: Sie erkennen den Geruch spezifischer Moleküle.\n\nDie Ratten haben einen erstaunlichen Geruchssinn. Menschen haben 380 Duftstoffrezeptoren, Hunde 900, eine Ratte über 1.200. Bei der Suche dringen Hunde nicht in die Trümmer ein, sondern schnüffeln nur außen. Ratten sind klein und können dichten Schutt durchdringen. Sie sind genauso trainierbar wie Hunde, aber nicht an die Person gebunden, die sie trainiert.\n\nBeim Training lernen die Tiere zuerst, an ihren Ausgangspunkt zurückzukehren: Sobald sie einen Piepton hören, laufen sie zur Trainerin/zum Trainer und erhalten eine Belohnung. Im zweiten Schritt tragen sie einen Rucksack mit Gummiball, der mit einem Mikroschalter verbunden ist. Sie lernen, am Ball zu ziehen, sobald sie einen Menschen aufspüren — das Signal ertönt und sie kehren zurück.\n\nLaut Trainerin unterscheiden sich die Ratten in Persönlichkeit und Fähigkeiten; einige lernen schneller. Die HeroRAT Magawa fand 39 Landminen und 28 Sprengkörper und erhielt eine Goldmedaille — die erste Ratte mit einer solchen Auszeichnung." };

const CTX3 = { type: "text", title: "Teil 3 — Beförderung (Kommentar) — rečenice a–j", content:
"**Wieso Sie noch lange auf Ihre Beförderung warten können**\n\nGerade läuft es gut im Team. Doch dann wechselt ein Kollege in eine andere Abteilung, und eingespielte Prozesse weichen großer Überforderung. Die meisten Unternehmen verlassen sich auf Führungskräfte, __[16]__. Obwohl die Mitarbeitendenentwicklung zu den Hauptaufgaben gehört, gibt es kaum Anreize.\n\nWenn gute Mitarbeitende das Team verlassen, ist es Aufgabe der Führungskraft, Ersatz zu finden — das kostet Mühe. __[17]__ Diese Mitarbeitenden will man als zukünftige Führungskräfte am wenigsten verlieren. __[18]__\n\nDas strategische Halten nimmt verschiedene Formen an: weniger Hilfe bei der Karriereplanung, keine explizite Ermutigung. __[19]__ Bestehende Talentpools werden nicht ausgeschöpft. __[20]__\n\nWeil Frauen mehr Wert auf Unterstützung legen, sind die Folgen für sie ärger. __[21]__ Das vergrößert Geschlechterunterschiede.\n\nTrotz der Veränderungen lohnt es sich, die Anreize besser zu gestalten. __[22]__ Unternehmen müssen nicht nur die Anreize der Führungskräfte berücksichtigen. __[23]__\n\n**Rečenice:**\na) Dabei handeln die meisten Führungskräfte nicht aus böser Absicht.\nb) Damit geben sie Bewerbungen für höhere Positionen auf, die gut zu ihnen passen würden.\nc) Das hat zur Folge, dass qualifizierte Mitarbeitende in ihren Positionen stecken bleiben.\nd) Die bisherige Praxis der Mitarbeiterförderung lässt zu wünschen übrig.\ne) Die mangelnden Karriereoptionen wirken demotivierend.\nf) Diese müssen nicht unbedingt finanzieller Art sein.\ng) Sie sollen Mitarbeitende bei der Karriereentwicklung unterstützen und Beförderungsmöglichkeiten aufzeigen.\nh) Doch Führungskräfte erhalten trotz des erhöhten Arbeitsaufwands keine Kompensation.\ni) Solche Maßnahmen tragen dazu bei, dass sich Mitarbeitende auf interne Ausschreibungen bewerben.\nj) Zusätzlich muss es gelingen zu versichern, dass interne Karriereschritte gern gesehen werden." };

const CTX4 = { type: "text", title: "Teil 4 — Photovoltaik (3 Meinungen)", content:
"**Wege zur Energiewende — Photovoltaik auf privaten Dächern**\n\n**a) Leoni Brinkhaus, Professorin für solare Energietechnik:** Lange war Sonnenenergie wegen hoher Kosten unterlegen. Die Probleme fossiler Brennstoffe (CO₂, steigende Preise) und Nuklearkatastrophen helfen der Solarenergie zurück auf den Markt — schon 10 % der Energieversorgung in Deutschland. Neue Technik und sinkende Kosten machen die Sonne attraktiv; viele Hausbesitzer wünschen sich saubere, unabhängige Stromversorgung. Die Umrüstung wird derzeit noch finanziell vom Staat unterstützt — ein wichtiges Signal für die Klimaneutralität.\n\n**b) Timo Probst, Dozent für Architektur:** Ein Umdenken im Energieverbrauch ist dringend geboten. Bei Neubauten ist eine Solaranlage finanziell und bautechnisch kein Problem, auch Mieterprojekte sind leicht umsetzbar. Anders im Bestand oder bei denkmalgeschützten Gebäuden: Lage und Neigungswinkel (optimal südlich, schattenfrei, ~35°) sind entscheidend. Bei Denkmalschutz ist die Montage prinzipiell zulässig, braucht aber die Genehmigung der Denkmalbehörde.\n\n**c) Ivanka Kovacs, Ingenieurin für Versorgungstechnik:** Rund 1,5 Mio. Eigentümer nutzen schon eine Anlage; Sonnenstrom vom eigenen Dach kostet nur etwa halb so viel wie aus dem Netz. Förderprogramme machen Mieterstrommodelle lohnender: Der Eigentümer verpachtet die Dachfläche an ein Unternehmen, das die Anlage betreibt und die Mieter mit günstigem Strom beliefert; Überschüsse gehen ins Netz. Derzeit gibt es rund hundert solcher Projekte; einige Modalitäten (Anbieterwechsel, Stromzähler) sind noch zu regeln." };

const ABCD = (a, b, c, d) => [a, b, c, d];
const ABC = (a, b, c) => [a, b, c];
const SENT = ["a) Dabei handeln die meisten Führungskräfte nicht aus böser Absicht.", "b) Damit geben sie Bewerbungen für höhere Positionen auf …", "c) Das hat zur Folge, dass qualifizierte Mitarbeitende stecken bleiben.", "d) Die bisherige Praxis der Mitarbeiterförderung lässt zu wünschen übrig.", "e) Die mangelnden Karriereoptionen wirken demotivierend.", "f) Diese müssen nicht unbedingt finanzieller Art sein.", "g) Sie sollen Mitarbeitende bei der Karriereentwicklung unterstützen …", "h) Doch Führungskräfte erhalten keine Kompensation dafür.", "i) Solche Maßnahmen tragen dazu bei, dass sich Mitarbeitende bewerben.", "j) Zusätzlich muss man versichern, dass interne Karriereschritte gern gesehen werden."];
const AUT = ["a) Brinkhaus (solare Energietechnik)", "b) Probst (Architektur)", "c) Kovacs (Versorgungstechnik)", "Keiner / kein Text passt"];

const q = (n, txt, head = "") => `${head}<strong>${n}.</strong> ${txt}`;
const H1 = "<strong>Leseverstehen Teil 1</strong> — Pročitaj tekst i izaberi a/b/c/d za svaku prazninu.<br><br>";
const H2 = "<strong>Teil 2</strong> — Pročitaj tekst i izaberi tačan odgovor.<br><br>";
const H3 = "<strong>Teil 3</strong> — Koja rečenica (a–j) ide u prazninu? Dve ne odgovaraju.<br><br>";
const H4 = "<strong>Teil 4</strong> — Koji autor (a/b/c) odgovara izjavi? Ako nijedan: Keiner.<br><br>";

const QS = [
  // Teil 1 — cloze a/b/c/d  (a=0 b=1 c=2 d=3)
  { q: q(1, "Die Kriterien … ___ sich festmachen.", H1), items: ABCD("lassen", "können", "werden", "würden"), c: "0", ctx: CTX1 },
  { q: q(2, "… der erfolglose ___, wieder einzuschlafen."), items: ABCD("Versuch", "Bereich", "Fehler", "Umgang"), c: "0", ctx: CTX1 },
  { q: q(3, "… ständig schläfrig zu sein, ___ man glaubt, genug geschlafen zu haben."), items: ABCD("weshalb", "dennoch", "obwohl", "denn"), c: "2", ctx: CTX1 },
  { q: q(4, "… dass Schlafverhalten die Leistung beeinflusst, ___ belegen Studien."), items: ABCD("was", "das", "wie", "die"), c: "1", ctx: CTX1 },
  { q: q(5, "Im Tiefschlaf wird Wissen verarbeitet und ___ besser gespeichert."), items: ABCD("womit", "wodurch", "somit", "sodass"), c: "2", ctx: CTX1 },
  { q: q(6, "… neu gefestigte Inhalte in vorhandenes Wissen ___."), items: ABCD("gestrichen", "untersucht", "beobachtet", "integriert"), c: "3", ctx: CTX1 },
  { q: q(7, "… dass Schulkinder zu höherer Leistung ___ waren."), items: ABCD("entschlossen", "überzeugt", "fähig", "nötig"), c: "2", ctx: CTX1 },
  { q: q(8, "… versucht es, am Tag ___ zu kommen."), items: ABCD("in Bewegung", "zur Vernunft", "in Kontakt", "zur Ruhe"), c: "3", ctx: CTX1 },
  // Teil 2 — a/b/c  (a=0 b=1 c=2)
  { q: q(9, "Ausgebildete Suchhunde …", H2), items: ABC("erreichen alle Verschütteten.", "geben bei Erfolg ein akustisches Signal.", "sind zuverlässiger als Ratten."), c: "1", ctx: CTX2 },
  { q: q(10, "Die HeroRATS …"), items: ABC("finden Altmetall schneller als Menschen.", "nutzen den ähnlichen Geruch von Sprengstoff und Bakterien.", "suchen Waffen und Krankheiten mit derselben Methode."), c: "2", ctx: CTX2 },
  { q: q(11, "Was ist das Besondere an Ratten?"), items: ABC("Ihr Gehirn wandelt elektrische in olfaktorische Signale um.", "Ihre Riechzellen können mehr Duftreize verarbeiten.", "Ihre Riechzellen sind feiner als die von Menschen."), c: "1", ctx: CTX2 },
  { q: q(12, "Im Vergleich zu Hunden …"), items: ABC("ist für Ratten die Trainerin/der Trainer austauschbar.", "riechen Ratten Verschüttete aus Distanz.", "sind Ratten lernfähiger beim Training."), c: "0", ctx: CTX2 },
  { q: q(13, "Beim Training lernen die Ratten, …"), items: ABC("auf Zuruf zurückzugehen.", "das Finden einer Person akustisch anzuzeigen.", "den Personen einen Rucksack zu bringen."), c: "1", ctx: CTX2 },
  { q: q(14, "Die Trainerin erklärt, dass …"), items: ABC("die Rettungskräfte mit Verschütteten sprechen.", "die Tiere ihren eigenen Charakter haben.", "manche Ratten ungeeignet sind."), c: "1", ctx: CTX2 },
  { q: q(15, "Die britische Organisation …"), items: ABC("erkennt die Leistung besonderer Individuen an.", "unterstützt die Entfernung von Minen.", "kümmert sich um Tiere mit speziellen Fähigkeiten."), c: "0", ctx: CTX2 },
  // Teil 3 — izbor rečenice a–j (a=0 … j=9)
  { q: q(16, "Koja rečenica ide u [16]?", H3), items: SENT, c: "6", ctx: CTX3 },
  { q: q(17, "Koja rečenica ide u [17]?"), items: SENT, c: "7", ctx: CTX3 },
  { q: q(18, "Koja rečenica ide u [18]?"), items: SENT, c: "2", ctx: CTX3 },
  { q: q(19, "Koja rečenica ide u [19]?"), items: SENT, c: "0", ctx: CTX3 },
  { q: q(20, "Koja rečenica ide u [20]?"), items: SENT, c: "4", ctx: CTX3 },
  { q: q(21, "Koja rečenica ide u [21]?"), items: SENT, c: "1", ctx: CTX3 },
  { q: q(22, "Koja rečenica ide u [22]?"), items: SENT, c: "5", ctx: CTX3 },
  { q: q(23, "Koja rečenica ide u [23]?"), items: SENT, c: "9", ctx: CTX3 },
  // Teil 4 — uparivanje sa autorom (a=0 b=1 c=2 keiner=3)
  { q: q(24, "Solaranlagen können den Strombedarf in Deutschland bereits decken.", H4), items: AUT, c: "3", ctx: CTX4 },
  { q: q(25, "Das erneute Interesse ist nicht nur sinkenden Kosten geschuldet."), items: AUT, c: "0", ctx: CTX4 },
  { q: q(26, "Bei denkmalgeschützten Gebäuden ist eine Genehmigung nötig."), items: AUT, c: "1", ctx: CTX4 },
  { q: q(27, "Solaranlagen auf Denkmälern anzubringen ist nicht möglich."), items: AUT, c: "3", ctx: CTX4 },
  { q: q(28, "Ein Anstieg an Mieterstrom-Projekten ist zu erwarten."), items: AUT, c: "2", ctx: CTX4 },
  { q: q(29, "Noch nicht alle Modalitäten zu Mieterstrom-Modellen sind geregelt."), items: AUT, c: "2", ctx: CTX4 },
  { q: q(30, "Staatliche Förderung von Photovoltaik ist eine Möglichkeit zur Klimaneutralität."), items: AUT, c: "0", ctx: CTX4 },
];

const { data: course } = await sb.from("courses").select("id").eq("slug", "polozi-goethe-c1").single();
const { data: lesson } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", "LESEN C1").single();
console.log(`LESEN C1 lekcija: ${lesson.id} | pitanja: ${QS.length}`);
if (!APPLY) { console.log("[DRY] dodaj --apply za upis."); process.exit(0); }

await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("title", EX_TITLE);
const { data: ex, error: exErr } = await sb.from("exercises").insert({ lesson_id: lesson.id, title: EX_TITLE, exercise_type: "quiz", order_index: 0 }).select("id").single();
if (exErr) { console.log("ERR ex:", exErr.message); process.exit(1); }
let i = 0;
for (const item of QS) {
  const { error } = await sb.from("exercise_questions").insert({
    exercise_id: ex.id, question: item.q,
    options: { type: "quiz", items: item.items, context: item.ctx },
    correct_answer: item.c, question_type: "quiz", order_index: i++,
  });
  if (error) { console.log("ERR q", i, error.message); process.exit(1); }
}
console.log(`✓ "${EX_TITLE}": ${QS.length} pitanja upisano na LESEN C1`);
