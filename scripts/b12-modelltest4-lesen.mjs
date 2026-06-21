/** B1.2 Završni ispit - Modelltest 4 (Cornelsen B1) — LESEN modul (30 zadataka, Teil 1-5).
 *  Transkribovano tačno; rešenja iz Lösungen. Dry-run; --apply za upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const LESSON = "Završni ispit B1 - Modelltest 4";
const EX = "Lesen - Modelltest 4";

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();

// ── TEKSTOVI ──
const T1 = `*Lesen Teil 1 · Arbeitszeit: 10 Min. Lesen Sie den Text und die Aufgaben 1 bis 6 dazu. Wählen Sie: Sind die Aussagen richtig oder falsch?*

**SusesBlog.de**

Hallo Leute!

Wir sind gestern aus dem Urlaub zurückgekommen. Wir waren auf der Insel Bornholm. Das ist in Dänemark. Wer jetzt denkt, dass man dort im Norden keinen richtigen Sommerurlaub mit Baden und Sonnen machen kann, der irrt sich. Es war zwar nicht immer Badewetter, aber wir hatten viel Sonnenschein und nur einen einzigen Regentag. Und die Insel ist wirklich wunderschön. Es gibt traumhafte Sandstrände, schöne Wälder, nette kleine Ortschaften … Unsere beiden Kinder hatten viel Spaß, wir haben tolle Wanderungen gemacht, waren in einem schönen Freizeitpark, und mein Mann und ich haben uns gut erholen können. Außerdem hatten wir ein schönes Ferienhaus - ziemlich klein, aber sehr gemütlich und mit einem Garten! Es war wirklich fantastisch.

Was ich aber eigentlich erzählen wollte, ist, dass wir im Urlaub etwas ziemlich Lustiges erlebt haben: Schon auf der Hinfahrt haben wir auf der Fähre eine Familie aus Weimar kennengelernt, deren Töchter im selben Alter sind wie unsere beiden Kinder. Die Kleinen haben die ganze Fahrt zusammen gespielt, und mein Mann und ich haben uns nett mit den Eltern unterhalten. Ein paar Tage später haben wir uns dann zufällig beim Eisessen wieder getroffen und den Tag zusammen verbracht. Wir haben uns gut verstanden und irgendwann auch darüber gesprochen, wo wir aufgewachsen sind und was unsere Eltern beruflich machen. Da gab es die erste Überraschung. Sabine, so heißt die Frau, erzählte, dass ihr Vater in einem niedersächsischem Krankenhaus Kinderarzt gewesen ist, und zwar in derselben Klinik wie der Vater meines Mannes, der dort auch Kinderarzt war. Die beiden haben viele Jahre zusammengearbeitet! Am nächsten Tag haben wir uns dann noch einmal getroffen und da kam dann etwas wirklich Witziges heraus. Sabine fragte meinen Mann: „Sag mal, hast du zufällig eine Schwester, die Tanja heißt?“ Mein Mann, völlig überrascht: „Ja, woher weißt du das?“ Sabine fragte weiter: „Kann es sein, dass unsere Familien, als wir noch Kinder waren, mal zusammen Urlaub an der Nordsee gemacht haben, auf der Insel Amrum?“ Da musste mein Mann lachen, denn er konnte sich auf einmal daran erinnern, dass er tatsächlich als Kind schon einmal mit Sabine Urlaub gemacht hat. Was für ein Zufall!

Die Welt ist wirklich klein!

Bis bald eure Suse`;

const T2A = `*Lesen Teil 2 · Arbeitszeit: 20 Min. Lesen Sie den Text aus der Presse und die Aufgaben 7 bis 9 dazu. Wählen Sie bei jeder Aufgabe die richtige Lösung a, b oder c.*

**Pflegekrise in Deutschland**

Schon jetzt sind deutschlandweit 3000 Stellen in der Pflege nicht besetzt. In den nächsten Jahren wird die Situation noch dramatischer werden. In Deutschland werden 750 000 Menschen, die wegen ihres Alters oder einer Erkrankung auf regelmäßige Hilfe und Pflege angewiesen sind, in einem Alters- oder Pflegeheim betreut. Weitere 600 000 werden zu Hause durch einen mobilen Pflegeservice unterstützt. Aufgrund der Bevölkerungsentwicklung werden diese Zahlen in den nächsten Jahren weiter steigen. Damit wird in Zukunft auch immer mehr Pflegepersonal benötigt. Die dreijährige Ausbildung zur Altenpflegefachkraft ist jedoch in Deutschland alles andere als beliebt. Die Gründe dafür sind laut Gerhard Fischer, Arbeitsvermittler für Pflegepersonal, vor allem: „der geringe Verdienst, die fehlenden Karrierechancen, die Schichtarbeit und die schwere körperliche Arbeit“. Er fordert daher, dass die Ausbildungszeit in bestimmten Fällen von bisher drei auf zwei Jahre reduziert werden sollte. „Aber das allein wird auch keine Lösung sein“, so Fischer, „die Löhne in der Pflegebranche müssen steigen, damit der Beruf wieder attraktiver wird, und wir müssen auch schauen, dass wir diesen Arbeitsmarkt für Arbeitnehmer aus dem Ausland attraktiv machen.“

*aus einer deutschen Zeitung*`;

const T2B = `*Lesen Teil 2 · Lesen Sie den Text aus der Presse und die Aufgaben 10 bis 12 dazu. Wählen Sie bei jeder Aufgabe die richtige Lösung a, b oder c.*

**JUNIOR-Wettbewerb 2013 — Münchner Schülerfirma hat die Nase vorn**

Die Schülerfirma „KraGü“ aus München hat den diesjährigen JUNIOR-Bundeswettbewerb gewonnen und darf sich nun „Bestes JUNIOR-Unternehmen 2013“ nennen. Die Münchner Jungunternehmer nähen aus recycelten Krawatten modische und originelle Designergürtel. Als Gewinner des Bundeswettbewerbes werden sie die Bundesrepublik im Juli beim Europawettbewerb der Schülerunternehmen in London vertreten. Platz zwei belegen Schüler des Dillinger Albert-Schweizer-Gymnasiums mit ihrer Firma „The Green Art of Cooking“. Sie haben ein Biokochbuch mit Rezepten aus der Region produziert und vermarktet. Mit etwa 565 Schülerfirmen gab es in diesem Jahr etwa gleich viele JUNIOR-Projekt-Teilnehmer wie im Vorjahr. Ein Jahr lang lernten die Jugendlichen, wie man einen Finanzplan entwickelt, ein Unternehmen aufbaut und organisiert, wie man Kunden gewinnt und einen Geschäftsbericht schreibt. Spielerisch wurden sie so zu Unternehmern. Auf dem Bundeswettbewerb in Mainz stellten gestern die vierzehn besten Schülerfirmen Deutschlands mit einem Messestand und einer Firmenpräsentation ihr Unternehmen vor. Den Sonderpreis für die beste Firmenwebsite gewann die Schülerfirma „Kashinea“ aus Kaiserslautern, die ein eigenes Kosmetikprodukt entwickelt hat.

*aus einer deutschen Zeitung*`;

const T3 = `*Lesen Teil 3 · Arbeitszeit: 10 Min. Lesen Sie die Situationen 13 bis 19 und die Anzeigen a bis j. Welche Anzeige passt zu welcher Situation? Jede Anzeige nur einmal verwenden. Für eine Situation gibt es keine passende Anzeige — in diesem Fall wählen Sie „0“. (Beispiel 0: Alberto möchte einen LCD-Fernseher kaufen → Anzeige c)*

**a** Kaum benutzte Gartengeräte von privat günstig abzugeben! Auch Balkon- und Pflanzenerde. Riesenauswahl. Nur für Selbstabholer. Infos unter: 0172-35655898

**b** Möbelhaus Krombach. Alles, was Sie für Ihr Zuhause brauchen. Wohnzimmermöbel, Schlaf- und Kinderzimmermöbel, Haushaltsgeräte - Kücheneinrichtung. Ab sofort in unserer Schlafzimmerabteilung: jeden Mo. und Mi. fachkundige Beratung zum Thema „gesunder Schlaf“

**c** HIFI Krämer. Radio & TV (LCD, Plasma, 3D). An- und Verkauf. Bei Neukauf eines Fernsehgeräts nehmen wir Ihr altes Gerät in Zahlung. Reparaturservice. Anfahrtskosten im Stadtgebiet: 20 €. (Beispiel)

**d** Unser Ratgeber: Schluss mit Rückenproblemen. Tipps zu Bewegungsabläufen und Muskelaufbauübungen, die Sie problemlos zu Hause machen können. Noch heute online und kostenlos bestellen! www.gesund-werden-durch-fitness.de

**e** Studio 2000. Neu im Sortiment: Alles für Ihren Arbeitsplatz. Tische, Regale und Schränke. Sitzen, Besprechen und Präsentieren. Aufbewahrung, Ordnen, Papier. Bürotechnik. Drucker und Druckerzubehör. www.studio2000.de

**f** Radhaus Bauer. Großes Angebot an Fahrrädern, E-Bikes, Fahrradtaschen, Fahrradbekleidung. Professionelle Beratung. Probefahrten möglich. Fachkundiger Reparaturservice. Aktionswochen: Wir zahlen Ihnen mindestens 80 Euro für Ihr altes Fahrrad, wenn Sie bei uns ein neues kaufen!

**g** Von Privat: Fernsehmöbel zu Top-Preisen. Höhenverstellbares Regal für LCD/Plasma-Fernseher sowie große DVD- und CD-Sammlung wegen Umzugs günstig abzugeben. 0172/45576589

**h** Elektro-Markt. Bei uns finden Sie Waschmaschinen · Geschirrspüler · Elektroherde · Wäschetrockner · Kühlschränke zu einem günstigen Preis. Kundenservice für viele Marken. Fachkundige Verkaufsberatung. Reparatur Ihrer Haushaltsgeräte (in dringenden Fällen auch am Wochenende). Hansaallee 12, 60322 Frankfurt

**i** Motorrad Huber. Für alle, die ihr Traummotorrad einmal testen oder auch eine Zeitlang fahren wollen: Motorräder aller bekannten Marken. Auch Liebhabermodelle. In Top-Zustand, zu günstigen Mietpreisen. www.motorrad-Huber.at

**j** Großer Fahrzeugmarkt. Riesige Auswahl an Neu- und Gebrauchtfahrzeugen, auch Motorräder, Mopeds und Roller, Gebrauchtteile und Zubehör. Bei uns können Sie für Ihr altes Fahrzeug einen guten Preis bekommen. Jeden Samstag 09-18.00 Uhr. Am Industriehof`;

const T4 = `*Lesen Teil 4 · Arbeitszeit: 15 Min. Lesen Sie die Texte 20 bis 26. Wählen Sie: Ist die Person für ein Verbot? In einer Zeitschrift lesen Sie Kommentare zu einem Artikel über ein Verbot von Handys in der Schule. (Beispiel: Jonathan → Nein)*

**Leserbriefe**

**Jonathan, 35, Dresden (Beispiel):** Immer mehr Eltern und Lehrer fordern ein Handyverbot im Unterricht. Ich als Lehrer kann diese Forderung verstehen, allerdings finde ich sie schwer zu realisieren, gerade im Zeitalter der neuen Medien. Aber versuchen sollte man es trotzdem.

**20. Nadja, 16, Wien:** Ich wäre mit einem Verbot vollkommen einverstanden. Bei uns in der Schule nehmen bestimmte Schüler immer wieder das Handy, um gemeine Fotos von anderen Schülern zu machen und ins Netz zu stellen. Das muss aufhören und da wäre es schon gut, wenn man Handys gar nicht mehr benutzen dürfte.

**21. Jens, 18, Dresden:** Bei uns in der Schule wurde lange über störende Handys im Unterricht diskutiert. Wie viele Schüler war auch ich auch gegen ein allgemeines Verbot. Wir haben dann versucht, uns auf Regelungen zu einigen, ohne Verbot. Leider hatte das keinen Erfolg, sodass ich inzwischen meine Meinung geändert habe. Manchmal geht es halt nicht ohne Verbot.

**22. Astrid, 40, St.-Pölten:** Keine Frage, Handys sind ein Problem, nicht nur an der Schule. Man wird einfach gestört, wenn es überall klingelt. Ich würde Handys aber eher in anderen Bereichen des Alltagslebens verbieten, zum Beispiel in U- oder S-Bahnen. In der Schule finde ich es besser, mit den Schülern über die neuen Medien, über die Gefahr und den Nutzen von Handys und Smartphones zu sprechen und gemeinsam Regelungen zu finden.

**23. Karin, 17, Würzburg:** Ich fand es früher immer toll, mein Handy zu zeigen. Aber heute sehe ich das anders. Mit dem Handy ist es genauso wie mit der Kleidung. Es gibt bei uns in der Schule eine richtige Konkurrenz, wer das neuste Modell hat. Ich persönlich kann mir einfach kein teures Smartphone leisten. Deshalb würde ich mich freuen, wenn die Schule ein handyfreier Raum wird.

**24. Robert, 30, Hamburg:** In dem Artikel steht viel über die Gefahren der Handynutzung. Nur werden heute im Unterricht immer mehr Medien benutzt. Das Internet und Smartphones gehört genauso zum Unterricht wie Whiteboards, E-Books usw. Wie soll man dann das Handy verbieten? Das macht doch keinen Sinn.

**25. Tobias, 15, Salzburg:** Schule muss doch auch Spaß machen. Und ich finde es toll, SMS und MMS an meine Freunde zu schicken. Immer, wenn ich das will. Klar kann man es auch manchmal ausschalten. Aber trotzdem: Ohne mein Handy könnte ich nicht leben.

**26. Gunter, 44, Jena:** Ich finde, dass ein Verbot wenig Sinn hat, da die Probleme mit dem Handy nach der Schule weiter gehen. Man sollte sich lieber überlegen, die Schüler im Unterricht auf die Gefahren einer unkontrollierten Handynutzung hinzuweisen. Dabei denke ich neben den finanziellen Problemen, die viele durch unbezahlte Handyverträge haben, auch an gesundheitliche Gefahren durch Handys. Darüber wird viel zu wenig diskutiert.`;

const T5 = `*Lesen Teil 5 · Arbeitszeit: 10 Min. Lesen Sie die Aufgaben 27 bis 30 und den Text dazu. Wählen Sie bei jeder Aufgabe die richtige Lösung a, b oder c. Sie informieren sich über die Nutzungsbedingungen Ihrer Stadtbücherei.*

**Stadtbibliothek — Nutzungsbedingungen**

**Leseausweis:** Für die Benutzung der Einrichtungen der Stadtbibliothek und das Ausleihen von Medien ist eine Gebühr zu zahlen. Die Jahresgebühr für den Leseausweis beträgt 20,00 € pro erwachsenem Nutzer. Studenten zahlen einen ermäßigten Beitrag, Kinder und Jugendliche unter 18 Jahren sind von der Jahresgebühr befreit.

**Ausleihe und Leihfrist:** Zum Ausleihen brauchen Sie einen gültigen Leseausweis. Die Leihfrist für Bücher beträgt vier Wochen, für CDs und DVDs 14 Tage. Bestimmte Medien (Zeitungen, Zeitschriften, Nachschlagewerke) dürfen nicht ausgeliehen werden. Die Leihfrist kann höchstens zweimal verlängert werden. Ist ein Medium von einem anderen Nutzer vorbestellt, ist eine Verlängerung der Leihfrist nicht möglich.

**Verhaltensregeln:** Es ist nicht erlaubt, Taschen und Ähnliches in die Bibliotheksräume mitzunehmen. Bitte benutzen Sie die Schließfächer am Haupteingang. An der Information können Sie auch durchsichtige Tragetaschen für 1,50 Euro kaufen, die in die Bibliothek mitgenommen werden dürfen. In der Bibliothek ist Essen streng verboten. Getränke dürfen mitgebracht werden, allerdings nicht in Papp- oder Plastikbechern, sondern nur in Flaschen, die fest geschlossen werden können.

**Online-Angebote:** Die Stadtbibliothek bietet Ihnen sowohl im Haus wie auch online von zu Hause aus zahlreiche digitale Angebote. Sie können auch elektronische Medien (E-Books, E-Video, E-Music) für einen begrenzten Zeitraum (sieben Tage) auf Ihren Computer herunterladen. Nach sieben Tagen können Sie die Dateien nicht mehr verwenden und ein anderer Kunde kann sie herunterladen. Um dieses Angebot nutzen zu können, brauchen Sie ein Passwort, das Sie mit Ihrem Leseausweis erhalten.`;

const RF = ["Richtig", "Falsch"]; // 0=richtig,1=falsch
const JN = ["Ja", "Nein"]; // 0=ja,1=nein
const ABC = (a, b, c) => [`a - ${a}`, `b - ${b}`, `c - ${c}`];
const ZUO = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "0 - keine Anzeige"];

// pitanja: [teil, stem, items, correctIdx, contextText]
const Q = [
  [1, "Der Urlaub hat Suse sehr gut gefallen.", RF, 0, T1],
  [1, "Das Wetter war leider ziemlich schlecht.", RF, 1, T1],
  [1, "Die Kinder fanden es auf der Insel langweilig.", RF, 1, T1],
  [1, "Suses Familie hat sich mit der anderen Familie zum Eisessen verabredet.", RF, 1, T1],
  [1, "Die Väter von Suses Mann und von Sabine kennen sich.", RF, 0, T1],
  [1, "Sabine und Suses Mann haben sich früher schon einmal getroffen.", RF, 0, T1],
  [2, "In diesem Text geht es um …", ABC("die Probleme in Altersheimen.", "den Mangel an Altenpflegern/-pflegerinnen.", "ausländisches Pflegepersonal."), 1, T2A],
  [2, "Es gibt zu wenig Interessenten für den Pflegeberuf, weil …", ABC("man in der Pflege zu wenig verdient.", "sichere Arbeitsplätze in der Pflege fehlen.", "die Ausbildung teuer ist."), 0, T2A],
  [2, "Herr Fischer sagt, dass Altenpfleger/innen …", ABC("weniger arbeiten sollten.", "aus dem Ausland gebraucht werden.", "eine bessere Ausbildung brauchen."), 1, T2A],
  [2, "In diesem Text geht es um …", ABC("Firmen, bei denen Jugendliche eine Ausbildung machen.", "verschiedene Schulen in Deutschland.", "Unternehmen, die von Schülern geführt werden."), 2, T2B],
  [2, "Das beste JUNIOR-Unternehmen 2013 …", ABC("wurde von der Firma „KraGü“ gewählt.", "stellt Krawatten her.", "fährt im Sommer nach London."), 2, T2B],
  [2, "In diesem Jahr …", ABC("präsentierten sich alle Schülerfirmen auf einer Messe.", "gab es auch einen Preis für die beste Internetseite.", "nahmen besonders viele Schülerfirmen am JUNIOR-Wettbewerb teil."), 1, T2B],
  [3, "13. Gerard hat morgens oft Rückenschmerzen und sucht ein neues Bett. → Welche Anzeige passt?", ZUO, 1, T3],
  [3, "14. Die Waschmaschine von Jonas ist kaputtgegangen. Er möchte sie reparieren lassen. → Welche Anzeige passt?", ZUO, 7, T3],
  [3, "15. Bea möchte ein günstiges Motorrad kaufen. Es muss nicht neu sein. → Welche Anzeige passt?", ZUO, 9, T3],
  [3, "16. Veronica möchte ihr altes Fahrrad verkaufen und ein neues kaufen. → Welche Anzeige passt?", ZUO, 5, T3],
  [3, "17. Paolo sucht für seine Terrasse eine große Menge Blumenerde. Da er kein Auto hat, soll sie geliefert werden. → Welche Anzeige passt?", ZUO, 10, T3],
  [3, "18. Jimmy sucht für sein neues Büro einen Schreibtisch, einen Konferenztisch und Bürostühle. → Welche Anzeige passt?", ZUO, 4, T3],
  [3, "19. Erik braucht für eine Woche ein Motorrad. → Welche Anzeige passt?", ZUO, 8, T3],
  [4, "20. Nadja (16, Wien) — ist sie für ein Verbot?", JN, 0, T4],
  [4, "21. Jens (18, Dresden) — ist er für ein Verbot?", JN, 0, T4],
  [4, "22. Astrid (40, St.-Pölten) — ist sie für ein Verbot?", JN, 1, T4],
  [4, "23. Karin (17, Würzburg) — ist sie für ein Verbot?", JN, 0, T4],
  [4, "24. Robert (30, Hamburg) — ist er für ein Verbot?", JN, 1, T4],
  [4, "25. Tobias (15, Salzburg) — ist er für ein Verbot?", JN, 1, T4],
  [4, "26. Gunter (44, Jena) — ist er für ein Verbot?", JN, 1, T4],
  [5, "27. Der Leseausweis …", ABC("ist für Studenten und Kinder kostenlos.", "kostet für alle Nutzer 20 Euro.", "ist ein Jahr lang gültig."), 2, T5],
  [5, "28. Die Besucher dürfen …", ABC("Zeitschriften nicht mitnehmen.", "alle Medien vier Wochen ausleihen.", "alle Medien zweimal ausleihen."), 0, T5],
  [5, "29. Die Besucher sollen …", ABC("Plastiktüten für die Bücher mitbringen.", "Rucksäcke an der Information abgeben.", "ihre Taschen am Eingang einschließen."), 2, T5],
  [5, "30. Für das Onlineangebot gilt:", ABC("Das Angebot ist zurzeit noch sehr begrenzt.", "E-Books kann man sieben Tage ausleihen.", "Man kann es auch nutzen, wenn man keinen Leseausweis hat."), 1, T5],
];

console.log("LESEN Modelltest 4 — pitanja:", Q.length);
const byTeil = {}; Q.forEach((q) => byTeil[q[0]] = (byTeil[q[0]] || 0) + 1);
console.log("Po Teilu:", JSON.stringify(byTeil));

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

// lekcija (upsert) na kraj kursa
let { data: lesson } = await sb.from("lessons").select("id, sections").eq("course_id", course.id).eq("title", LESSON).maybeSingle();
if (!lesson) {
  const sections = [{ type: "badge", module: "Priprema za ispit", pruefung: true }, { type: "text", style: "info", content: "## Završni ispit B1 — Modelltest 4\n\nGoethe/ÖSD Zertifikat B1. Svaki modul (Lesen, Hören, Schreiben) se boduje posebno. Položiš sva tri ≥60% → dobijaš sertifikat." }, { type: "exercise", title: EX }];
  const { data: ins } = await sb.from("lessons").insert({ course_id: course.id, title: LESSON, lesson_type: "text", order_index: 9999, content: "", sections }).select("id, sections").single();
  lesson = ins;
  // na kraj
  const { data: all } = await sb.from("lessons").select("id, order_index").eq("course_id", course.id).order("order_index");
  const seq = [...all.filter((l) => l.id !== lesson.id).map((l) => l.id), lesson.id];
  for (let i = 0; i < seq.length; i++) await sb.from("lessons").update({ order_index: i }).eq("id", seq[i]);
} else if (!lesson.sections.some((s) => s.type === "exercise" && s.title === EX)) {
  await sb.from("lessons").update({ sections: [...lesson.sections, { type: "exercise", title: EX }] }).eq("id", lesson.id);
}

// duplikat-zaštita vežbe
const { data: exExist } = await sb.from("exercises").select("id").eq("lesson_id", lesson.id).eq("title", EX).maybeSingle();
if (exExist) { console.log("⚠️ Lesen vežba već postoji — prekidam."); process.exit(1); }
const { data: ex } = await sb.from("exercises").insert({ lesson_id: lesson.id, title: EX, exercise_type: "quiz", order_index: 1 }).select("id").single();
let oi = 1;
for (const [teil, stem, items, ci, ctx] of Q) {
  await sb.from("exercise_questions").insert({
    exercise_id: ex.id, question: `<strong>Lesen · Teil ${teil}</strong><br>${stem}`,
    question_type: "quiz", correct_answer: String(ci), explanation: null, order_index: oi++,
    options: { type: "quiz", items, context: { type: "text", title: `Lesen - Teil ${teil}`, content: ctx } },
  });
}
console.log(`\nGOTOVO ✓  Lesen modul (${Q.length} pitanja) u "${LESSON}".`);
