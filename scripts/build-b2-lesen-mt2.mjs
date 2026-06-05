// B2 — Modelltest 2, Modul LESEN — pun tekstualni test. Verno iz Cornelsen Prüfungstraining B2.
// Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const SLUG = "polozi-goethe-b2";
const LESSON_TITLE = "Leseverstehen – Modelltest 2";
const EX = "Leseverstehen — Modelltest 2";

const P1 = ["a — Jens", "b — Ivanka", "c — Manuel", "d — Lena"];
const ABC = ["a", "b", "c"];
const S2 = [
  "a — Trendforscher Matthias Horx meint, dass das Buch altmodisch sei.",
  "b — Und was spricht für das E-Book?",
  "c — Aus diesem Grund gibt es immer noch Vorbehalte gegen das digitale Buch.",
  "d — Das ist infolge dieser Entwicklung nachvollziehbar.",
  "e — Dennoch hat sich das Leseverhalten geändert.",
  "f — Außerdem sind neue Produkte auf den Markt gekommen.",
  "g — Denn der emotionale Effekt spielt hier die entscheidende Rolle.",
  "h — Allerdings ist diese Entwicklung bei Produkten der schönen Literatur nicht so eindeutig.",
];
const A4 = ["b", "c", "d", "e", "f", "g", "h"];
const H5 = [
  "a — Verhaltensregeln",
  "b — Zimmerausstattung",
  "c — Bedingungen für den Aufenthalt",
  "d — Essenszeiten",
  "e — Ankunft und Abreise",
  "f — Schließfächer",
  "g — Unterbringung",
  "h — Selbstversorger",
];

const T1 = { type: "text", title: "Teil 1 — Freizeit und Freizeitverhalten", content:
"Sie lesen in einem Forum, wie Menschen über Freizeitverhalten denken. Auf welche der vier Personen treffen die einzelnen Aussagen zu? Die Personen können mehrmals gewählt werden.\n\n" +
"**a Jens**\nFür mich ist Freizeit sehr wichtig. Wahrscheinlich wie für jeden. Das Problem bei vielen Debatten über Freizeit ist ja, dass jeder oft etwas anderes darunter versteht. Für die meisten bedeutet Freizeit arbeitsfrei, also frei haben vom Beruf. Aber greift diese Umschreibung nicht zu kurz? Wenn ich zum Beispiel von der Arbeit frei habe, bedeutet das nicht, dass ich in meiner arbeitsfreien Zeit keine anderen Verpflichtungen hätte, und damit meine ich nicht nur die Hausarbeit, sondern auch feststehende Termine für Hobbys, Sport, Treffen mit Freunden. Für mich bedeutet Freizeit die Anzahl der wirklich freien Stunden, die einem zur Verfügung stehen. Stunden, in denen man sich nichts vornimmt. Ich bleibe zum Beispiel am liebsten in meinen vier Wänden, ohne mir etwas vorzunehmen, auch wenn viele meiner Freunde das überhaupt nicht verstehen. Sie denken, ich würde meine Freizeit verschlafen. Na und?\n\n" +
"**b Ivanka**\nDie Diskussionen über Freizeit und Freizeitgestaltung sind schon sehr sinnvoll, denn sie können dazu führen, über das eigene Leben nachzudenken. Freizeit bedeutet für mich der Zeitraum, in dem ich selbst über mein Leben bestimmen kann, im Gegensatz zur Erwerbsarbeit, die fremdbestimmt ist. Dabei spielt es für mich keine Rolle, ob ich in meiner Freizeit wirklich viel freie Zeit habe oder nicht, entscheidend ist, dass ich ohne Einflüsse von außen meinen Interessen nachgehen kann. Das ist zwar eine etwas idealtypische Vorstellung in einer Zeit, in der der gesamte Freizeitbereich immer mehr vermarktet wird und ein organisiertes Event das andere jagt, aber ich kann einfach nicht verstehen, wie man Einkaufen – verbunden mit irgendwelchen Events in Einkaufszentren – als Freizeitspaß verkaufen kann. Ich finde diese Veranstaltungen nervend, außerdem wird einem das Geld aus der Tasche gezogen. Nicht mit mir! Vielleicht hat man einfach nur verlernt, ohne Einflüsse von außen seine freie Zeit zu verbringen.\n\n" +
"**c Manuel**\nDer Duden bezeichnet Freizeit als Zeit, in der man nicht arbeiten muss, keine besonderen Verpflichtungen hat. Es folgen dann Wortzusammensetzungen wie Freizeitangebot, Freizeitindustrie, Freizeitvergnügen, außer auch Freizeitstress. Und da wären wir beim Punkt. Aus Angst, etwas zu versäumen – hat man doch schon die meiste Zeit seines Lebens für die Berufsarbeit geopfert – entwickeln wir allzu schnell ein ausgedehntes Freizeitprogramm, Aktivitäten von früh bis spät, Sport, Kino, Konzerte, Kurzreisen. Ich habe längere Zeit mit dieser Art von Freizeitstress gelebt. Aber eigentlich habe ich nichts anderes getan, als meine Freizeit genauso wie meinen Beruf zu managen. Irgendwann konnte ich vor Erschöpfung nicht mehr arbeiten und funktionieren und bekam schwere Herz- und Kreislaufprobleme. Heute lerne ich die Wichtigkeit von Phasen wirklicher Ruhe und Nichtstun zu schätzen. Das ist nicht einfach, aber es gelingt mir immer besser.\n\n" +
"**d Lena**\nFür mich bedeutet Freizeit natürlich die freien Stunden, die ich habe. Auch wenn diese freien Stunden durch Aktivitäten voll ausgefüllt sind, bleibt das für mich Freizeit. Wichtig ist, dass ich mich wohlfühle bei dem, was ich tue, auch wenn das manchmal stressig ist. Und ich führe seit Kurzem ein Freizeittagebuch. Klingt etwas seltsam, aber hat seinen Sinn. Da schreibe ich auf, welchen Aktivitäten ich nachgegangen bin, aber auch, worauf ich verzichtet habe und was ich gerne hätte machen wollen. Mit wem habe ich etwas unternommen, wen habe ich versäumt zu treffen? Und so weiter. Und auch, was hat mir keinen Spaß gemacht, was nicht gut funktioniert? So kann ich mein Freizeitprogramm immer verbessern. Klar kann ich auch mal ein paar Tage nichts tun und am Strand liegen. Nach einiger Zeit langweilt mich das aber. Ich brauche Sport und Aktivitäten, um mich wohlzufühlen." };

const T2 = { type: "text", title: "Teil 2 — Lesen: Sind elektronische Bücher die Zukunft?", content:
"Sie lesen in einer Zeitschrift einen Artikel über das Lesen. Welche Sätze passen in die Lücken? Zwei Sätze passen nicht.\n\n" +
"**Lesen: Sind elektronische Bücher die Zukunft?**\n\n" +
"Der italienische Schriftsteller Umberto Eco, Autor der weltbekannten Romane „Im Namen der Rose“ und „Das Foucaultsche Pendel“ hat sie gefürchtet, die elektronischen Lesegeräte. __(0)__ „Wir müssen nicht nur die Waldelefanten, die Orang-Utans und die Bären in den Abruzzen retten, sondern auch die Bücher.“\n\n" +
"Selbst wenn das viele so sehen, trauern längst nicht alle um das Buch. __(10)__ „Das Medium ist linear, langsam, unflexibel, ja fast etwas primitiv.“ Dennoch habe sich das Buch mehr als 1600 Jahre als eine handliche und übersichtliche Informationsquelle bewährt, sodass es überdauern werde, hält der aus Argentinien stammende Schriftsteller und Bücherliebhaber Alberto Manguel dagegen. Auch sei die dreidimensionale Form zu loben, die es möglich mache, gleichzeitig mit Augen und Händen zu navigieren – ein großer Vorteil gegenüber der elektronischen Konkurrenz.\n\n" +
"__(11)__ Ein Argument ist, dass es dem veränderten Leseverhalten der Menschen entgegenkomme. Texte werden immer mehr am Bildschirmen gelesen, wie eine Studie der „Stiftung Lesen“ zeigt.\n\n" +
"Auch wenn die ersten E-Book-Lesegeräte zunächst unhandlich waren, so ermöglichen sie mittlerweile die lesefreundliche Ansicht ganzer Seiten. __(12)__ So gibt es mittlerweile auch eine Kombination aus Texten, Tönen und bewegten Bildern. Und auch die anfangs technischen Probleme – eine geringe Akkulaufzeit und eine schlechte Displayqualität, spielen heute kaum noch eine Rolle. Die Mediengeneration von heute, die mit dem Computer aufwächst, wird vermutlich das Interesse am Buch verlieren. __(13)__\n\n" +
"Nachschlagewerke und Fachbücher haben schnell ihren Weg in das E-Book gefunden, das trifft auch auf viele andere Textsorten zu. __(14)__ Denn bei ihrer Lektüre will man so tief in das Buch eintauchen, dass man dazu ein passendes Umfeld braucht, zum Beispiel das Bett oder die Parkbank. Vielleicht verspürt man auch Lust auf Eselsohren, Lust auf den Geruch gedruckten Papiers. Hier wird daher – so glauben viele Experten – das Buch weiter punkten. __(15)__ Und dieser hält sich bei den elektronischen Lesegeräten in Grenzen. Folglich lässt sich sagen: Das Buch ist tot, lang lebe das Buch!\n\n" +
"*Beispiel (0): „Und er zählte das traditionelle Buch zu den bedrohten Arten.“*" };

const T3 = { type: "text", title: "Teil 3 — Berliner Architekt baut 100-Euro-Behausungen", content:
"Sie lesen in einer Zeitung einen Artikel über eine neue Wohnform. Wählen Sie bei jeder Aufgabe die richtige Lösung.\n\n" +
"**Berliner Architekt baut 100-Euro-Behausungen**\n\n" +
"Eine Wohnung mit Küche, Bad, Bett, Schreibtisch und Sessel, das Ganze passt auf 6,4 Quadratmeter und kostet 100 Euro Miete? Der Berliner Architekt Van Bo Le-Mentzel will mit diesem Raumwunder etwas gegen die steigenden Wohnungspreise und den immer knapperen Wohnraum in Großstädten bewirken. Van Bo Le-Mentzel kam 1979 mit seinen Eltern aus Laos nach Berlin und studierte dort Architektur.\n\n" +
"Zwei Meter ist die Musterwohnung breit, 3,20 Meter lang und verfügt über altbautaugliche 3,60 Meter Deckenhöhe. Das Bett kann als eine Art zweite Etage eingerichtet werden. Für Le-Mentzel kommen hier ganz große Strömungen der Gestaltung zusammen. „Die Effizienz der Raumorganisation kommt vom Bauhaus und die Ästhetik der Proportionen aus dem Barock.“\n\n" +
"Derzeit steht die Mini-Wohnung auf einem Anhänger im Berliner Stadtteil Kreuzberg. Interessenten können sich hier umgucken und zur Probe übernachten. Unter den ersten Besuchern gibt es gleich ein paar Anfragen. Da Rebekka, 34 Jahre, die gerade ihr Hausboot verkauft hat und in eine 50-Quadratmeter-Wohnung gezogen ist, kann sich vorstellen, in der Mini-Wohnung zu leben. „Es ist schön funktional, ich bin ja sehr minimalistisch.“\n\n" +
"Hinter dem Projekt steht die Tinyhouse-Bewegung, die in den USA schon länger aktiv ist und mit platzsparenden Wohnmöglichkeiten experimentiert. Le-Mentzels Wohneinheiten könnten in einem Komplex auf- und nebeneinander gebaut werden, wie es eben passt – so die Vision. In den Wohnkomplexen soll es zudem große Gemeinschaftsräume geben. Diesen Raum könnten die Mieter gemeinsam gestalten. Der Unterschied zur WG: Jeder Mieter hat ein eigenes Bad und eine eigene Küche.\n\n" +
"„Wenn es in jeder Stadt 100-Euro-Wohnungen gäbe, würde das unseren Wohlfahrtstaat und die Flüchtlingspolitik verändern“, heißt es in einer Mitteilung der Tinyhouse University, eines von Le-Mentzel gegründeten Kollektivs von Architekten, Menschen aus dem Bildungssektor und Geflüchteten. „Man bräuchte so keine Flüchtlings- und Obdachlosenheime mehr.“ Ob man die Zielgruppe so weit fassen kann? „Ich könnte mir das vorstellen“, sagt ein 42-jähriger Besucher, der sich die Kreuzberger Wohnbox anschaut. „Es wäre mir einfach zu eng, ich kann mich ja kaum bewegen.“\n\n" +
"Bei der Stadt sieht man das Projekt eher skeptisch. „Ob sich Menschen, die einen dauerhaften Wohnsitz suchen, wirklich für einen 6,4 Quadratmeter großen Wohnwürfel entscheiden, bleibt abzuwarten“, sagt Sprecherin Petra Rohland. Für Menschen, die sehr einfache Wohnformen bevorzugen, sei es vielleicht eine Alternative, aber eine dauerhafte Lösung des Wohnungsproblems sei es nicht. „Wohnen hat auch immer etwas mit Städtebau zu tun und diese Form in das Berliner Stadtbild zu integrieren, würde schwer fallen.“\n\n" +
"Auch darf man nicht vergessen, dass es bürokratische Hindernisse gegen diese neue Wohnform geben wird. Ist diese Wohnform überhaupt mit dem Baurecht vereinbar? Bekommt man problemlos von der jeweiligen Baubehörde eine Genehmigung zum Bau dieser Wohnungen? Und wie verhält es sich mit Wasser, Gas, Kanalisation usw.? Auch wenn man sich mit einem Anhänger irgendwo hinstellen will – um so wohnen zu können, muss vieles geklärt werden." };

const T4 = { type: "text", title: "Teil 4 — Unbegrenzter Urlaub", content:
"Sie lesen in einer Zeitschrift verschiedene Meinungsäußerungen zu einem neuen Urlaubsmodell. Welche Äußerung passt zu welcher Überschrift? Eine Äußerung passt nicht. Die Äußerung a ist das Beispiel und kann nicht noch einmal verwendet werden.\n\n" +
"**a (Beispiel) — Helen, Stuttgart**\nDas Modell, nach dem man bezahlten Urlaub nehmen kann, wann und solange man will, stößt in immer mehr Betrieben auf Interesse. Es stammt aus dem IT-Bereich in den USA und in Großbritannien. Dort wurden bereits positive Erfahrungen damit gemacht.\n\n" +
"**b — Karsten, Dortmund**\nFlexibler Urlaub ist eine logische Weiterentwicklung der Flexibilisierung der Arbeit. Wenn man nicht mehr am Arbeitsplatz anwesend sein muss, braucht man auch keine Regeln mehr für die Urlaubszeiten. Und man kann seinen Urlaub nehmen, wann man möchte, und muss den Chef nicht mehr um Erlaubnis fragen.\n\n" +
"**c — Sarah, Frankfurt**\nSo schön es auch klingt: Wie überall in der flexibilisierten Arbeitswelt ordnet sich alles dem Interesse des Betriebs unter. Voraussetzung ist immer, dass die Arbeit erledigt wird. Der Arbeitnehmer kann zwar selbst bestimmen, wann und wie lange er Urlaub nimmt, aber ob das auch wirklich möglich ist, entscheidet doch wieder der Chef.\n\n" +
"**d — Alex, Offenbach**\nUnbegrenzter Urlaub hört sich gut an, klingt progressiv. Allerdings ist das Modell eine Utopie. Dann könnte man ja auch gleich 365 Tage Urlaub im Jahr nehmen. Firmen, die damit auf den Markt gehen, versuchen eher, sich in einem guten Licht darzustellen und dadurch aktive und engagierte Arbeitnehmer zu finden.\n\n" +
"**e — Dimitri, Basel**\nBei allen Vorzügen besteht doch die Befürchtung, dass man die Arbeit nicht schafft, wenn man Urlaub nimmt. Man kann es sich eigentlich gar nicht leisten, da immer etwas erledigt werden muss. Das kann zu großem Stress führen. Sich frei entscheiden zu müssen, kann im Einzelnen sehr schwierig sein.\n\n" +
"**f — Martin, Berlin**\nDiese Urlaubsform funktioniert nur, wenn im Unternehmen ein gutes Klima herrscht. Man muss einander vertrauen, die Chefs den Mitarbeitern, aber auch die Mitarbeiter untereinander, damit man sicher ist, dass niemand Missbrauch mit diesen Regelungen treibt.\n\n" +
"**g — Eva, Graz**\nGanz wichtig ist, dass bei allen Bedenken vollständig flexibilisierte Urlaubsregelungen die bestehenden Arbeitnehmerschutzgesetze natürlich nicht aufheben werden. Nach dem Bundesurlaubsgesetz hat jeder Arbeitnehmer ein Recht auf 24 Urlaubstage. Dieses Modell kann letztlich also nur positive Effekte in Form weiterer Urlaubstage haben.\n\n" +
"**h — Jan, Magdeburg**\nWie bei der Flexibilisierung der Arbeit besteht auch bei der Flexibilisierung des Urlaubs die große Gefahr, dass die Arbeitnehmer immer isolierter werden. Hier sind die Gewerkschaften gefragt. Sie müssen sich unbedingt etwas überlegen, um auf diese Entwicklung zu reagieren." };

const T5 = { type: "text", title: "Teil 5 — Hausordnung: Jugendherberge", content:
"Sie möchten in einer Jugendherberge übernachten und lesen die Hausordnung. Welche der Überschriften aus dem Inhaltsverzeichnis passen zu den Paragraphen? Vier Überschriften werden nicht gebraucht.\n\n" +
"**Inhaltsverzeichnis:** a Verhaltensregeln · b Zimmerausstattung · c Bedingungen für den Aufenthalt · d Essenszeiten · e Ankunft und Abreise · f Schließfächer · g Unterbringung · h Selbstversorger\n\n" +
"**§ (Beispiel) — Lösung: c (Bedingungen für den Aufenthalt)**\nWenn Sie bei uns übernachten wollen, müssen Sie Mitglied des Deutschen Jugendherbergswerkes oder eines anderen Jugendherbergsverbandes sein. Personen, die nicht Mitglied sind, aber eine deutsche Adresse haben, können an der Rezeption eine Mitgliedskarte erwerben, ausländische Gäste ohne Mitgliedskarte können eine „Internationale Gastkarte“ kaufen.\n\n" +
"**§ 28**\nEine Reservierung ist zu empfehlen. Reservierte Zimmer stehen ab 15 Uhr zur Verfügung und werden bis 18 Uhr freigehalten, danach können sie von anderen Gästen gebucht werden, die bis 22 Uhr Einlass finden. Wenn Sie Ihren Aufenthalt beenden, achten Sie bitte darauf, dass die Zimmer bis 12 Uhr geräumt werden. Ihr Gepäck können Sie gerne bis 20 Uhr im abschließbaren Gepäckraum lassen.\n\n" +
"**§ 29**\nWir bieten ausschließlich Mehrbettzimmer an. In der Regel schlafen die Gäste nach Geschlecht getrennt. Familien und Ehepaare können gemeinsam in einem Zimmer übernachten, insofern es freie Zimmer gibt. Toiletten und Duschen befinden sich auf dem Gang. Die Schlafräume können zu Reinigungszwecken zwischen 10 und 14 oder zwischen 14 und 17 Uhr geschlossen sein.\n\n" +
"**§ 30**\nNehmen Sie Rücksicht auf die anderen Gäste, besonders wenn Sie Mobiltelefone, CD-Player usw. benutzen. Von 22 bis 7 Uhr ist Nachtruhe. Speisen und Getränke dürfen aus dem Speisesaal nicht mitgenommen werden. In den Schlafräumen ist die Zubereitung von Speisen nicht erlaubt. Rauchen und Alkohol sind verboten." };

const Q = [
  // Teil 1 — matching a–d. Ključ: 1c 2d 3a 4d 5b 6c 7b 8d 9b
  [T1, P1, "Wer hat sein Freizeitverhalten verändert?", 2],
  [T1, P1, "Wer hat wenige Probleme mit Freizeitstress?", 3],
  [T1, P1, "Wer vermisst eine klare Definition, was Freizeit eigentlich ist?", 0],
  [T1, P1, "Wer kann sich ein längeres Nichtstun nicht vorstellen?", 3],
  [T1, P1, "Wen stört das kommerzielle Interesse der Freizeitindustrie?", 1],
  [T1, P1, "Für wen kann Nichtstun auch ein Mittel zur Heilung bedeuten?", 2],
  [T1, P1, "Für wen ist die Menge der arbeitsfreien Stunden nicht entscheidend?", 1],
  [T1, P1, "Für wen ist eine Analyse des Freizeitverhaltens wichtig?", 3],
  [T1, P1, "Wer denkt, dass viele Menschen nicht mehr in der Lage sind, ihre Freizeit autonom zu gestalten?", 1],
  // Teil 2 — umetanje a–h. Ključ: 10a 11b 12f 13d 14h 15g
  [T2, S2, "Lücke 10 — Welcher Satz passt?", 0],
  [T2, S2, "Lücke 11 — Welcher Satz passt?", 1],
  [T2, S2, "Lücke 12 — Welcher Satz passt?", 5],
  [T2, S2, "Lücke 13 — Welcher Satz passt?", 3],
  [T2, S2, "Lücke 14 — Welcher Satz passt?", 7],
  [T2, S2, "Lücke 15 — Welcher Satz passt?", 6],
  // Teil 3 — a/b/c. Ključ: 16a 17c 18a 19b 20c 21a
  [T3, ABC, "Kennzeichen der Wohnungen ist, dass … a) hier verschiedene Baustile kombiniert werden. b) sie mehrere Stockwerke haben. c) sie wie Altbauwohnungen aussehen.", 0],
  [T3, ABC, "Seine Musterwohnung … a) kann auch auf dem Wasser stehen. b) wird bereits als Hotel benutzt. c) stößt bereits auf öffentliches Interesse.", 2],
  [T3, ABC, "Was ist das Besondere an den Mini-Wohnungen? a) Man kann sie flexibel anordnen. b) Sie eignen sich vor allem für Wohngemeinschaften. c) Sie sind im US-amerikanischen Baustil entworfen.", 0],
  [T3, ABC, "Le-Mentzel ist der Auffassung, dass die Mini-Wohnungen … a) durchaus auch vergrößert werden sollten. b) eine große gesellschaftliche Wirkung haben können. c) von der Politik gefördert werden müssten.", 1],
  [T3, ABC, "Die Sprecherin der Stadt hat Zweifel am Projekt, da … a) es auch hier Wartelisten geben wird. b) es in der Stadt zu wenig freie Räume gibt. c) sie dafür keine längerfristige Perspektive sieht.", 2],
  [T3, ABC, "Für den Bau der Mini-Wohnungen … a) muss man voraussichtlich viele Vorschriften beachten. b) sind neue Gesetze erforderlich. c) wird Wohnen auf einem Anhänger nur selten genehmigt.", 0],
  // Teil 4 — Überschrift → Äußerung (b–h). Ključ: 22b 23h 24c 25g 26d 27e
  [T4, A4, "Überschrift 22: „Urlaubsanträge gehören der Vergangenheit an.“ — Welche Äußerung passt?", 0],
  [T4, A4, "Überschrift 23: „Die Vertretung der Arbeitnehmer müssen aktiv werden.“ — Welche Äußerung passt?", 6],
  [T4, A4, "Überschrift 24: „Hierarchien werden nicht abgebaut.“ — Welche Äußerung passt?", 1],
  [T4, A4, "Überschrift 25: „Die Vorteile überwiegen die Nachteile.“ — Welche Äußerung passt?", 5],
  [T4, A4, "Überschrift 26: „Unbegrenzter Urlaub ist in erster Linie eine PR-Maßnahme.“ — Welche Äußerung passt?", 2],
  [T4, A4, "Überschrift 27: „Die Verantwortung des Einzelnen steigt.“ — Welche Äußerung passt?", 3],
  // Teil 5 — Paragraph → Überschrift (a–h). Ključ: 28e 29g 30a
  [T5, H5, "§ 28 — Welche Überschrift passt?", 4],
  [T5, H5, "§ 29 — Welche Überschrift passt?", 6],
  [T5, H5, "§ 30 — Welche Überschrift passt?", 0],
];

const { data: course } = await sb.from("courses").select("id").eq("slug", SLUG).single();
if (!course) throw new Error(`Kurs ${SLUG} ne postoji`);
console.log(`Kurs ${SLUG}: ${course.id} | pitanja: ${Q.length}`);
if (!APPLY) { console.log("[DRY] Modelltest 2 (5 delova / 30 zadataka). Pokreni sa --apply."); process.exit(0); }

let lessonId;
{
  const { data: ex } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", LESSON_TITLE).maybeSingle();
  const payload = { course_id: course.id, title: LESSON_TITLE, order_index: 2, lesson_type: "text",
    sections: [{ type: "badge", module: "Leseverstehen B2" },
      { type: "text", style: "info", content: "Modelltest Lesen (Goethe-Zertifikat B2), 5 delova / 30 zadataka. Tekst za čitanje stoji iznad pitanja u svakom delu." }] };
  if (ex) { lessonId = ex.id; await sb.from("lessons").update(payload).eq("id", ex.id); console.log(`~ Modelltest 2 lekcija ažurirana (${ex.id})`); }
  else { const { data: c } = await sb.from("lessons").insert(payload).select("id").single(); lessonId = c.id; console.log(`+ Modelltest 2 lekcija kreirana (${c.id})`); }
}
await sb.from("exercises").delete().eq("lesson_id", lessonId).eq("title", EX);
const { data: exercise } = await sb.from("exercises").insert({ lesson_id: lessonId, title: EX, exercise_type: "quiz", order_index: 0 }).select("id").single();
let i = 0;
for (const [ctx, items, q, correct] of Q) {
  await sb.from("exercise_questions").insert({
    exercise_id: exercise.id, question: `<strong>Aufgabe ${i + 1}</strong> — ${q}`,
    options: { type: "quiz", items, context: ctx }, correct_answer: String(correct), question_type: "quiz", order_index: i++,
  });
}
console.log(`✓ "${EX}": ${Q.length} pitanja (Teil 1–5) upisano.`);
