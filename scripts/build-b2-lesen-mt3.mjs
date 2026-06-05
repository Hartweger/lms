// B2 — Modelltest 3, Modul LESEN — pun tekstualni test. Verno iz Cornelsen Prüfungstraining B2.
// OCR greške iz starog ključa razrešene i proverene kroz sadržaj: T2#14=c, T3#17=c, T4#24=g.
// Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const SLUG = "polozi-goethe-b2";
const LESSON_TITLE = "Leseverstehen – Modelltest 3";
const EX = "Leseverstehen — Modelltest 3";

const P1 = ["a — Thomas", "b — Helen", "c — Paolo", "d — Amina"];
const ABC = ["a", "b", "c"];
const S2 = [
  "a — Ein Beispiel sind die zahlreichen Solaranlagen, wie man sie überall auf den Dächern sieht.",
  "b — Wann sollen weitere Atomkraftwerke geschlossen werden?",
  "c — Trotzdem kommt es immer häufiger zu Protesten.",
  "d — Allerdings ist das nur die halbe Wahrheit.",
  "e — Dennoch gibt es oft zu wenig Wind.",
  "f — Und das soll schon Ende 2022 der Fall sein.",
  "g — Grund dafür war das Reaktorunglück in Tschernobyl.",
  "h — Was soll mit dem Atommüll geschehen?",
];
const A4 = ["b", "c", "d", "e", "f", "g", "h"];
const H5 = [
  "a — Rechte und Pflichten der Mitglieder",
  "b — Aufwandsentschädigungen",
  "c — Zweck und Ziel des Vereins",
  "d — Beendigung",
  "e — Entlohnung und Honorare",
  "f — steuerliche Regelungen",
  "g — Aufnahme in den Verein",
  "h — Organe des Vereins",
];

const T1 = { type: "text", title: "Teil 1 — Gesundes Leben", content:
"Sie lesen in einem Forum, wie Menschen über gesundes Leben denken. Auf welche der vier Personen treffen die einzelnen Aussagen zu? Die Personen können mehrmals gewählt werden.\n\n" +
"**a Thomas**\nWichtig für ein gesundes Leben sind natürlich eine gesunde Ernährung, viel Bewegung und ausreichender Schlaf. Nur, wie kann man diese Ziele erreichen? Oft ist es ein langer Lernprozess, mit schlechten, alten Gewohnheiten aufzuhören. Jeder weiß doch zum Beispiel, dass Rauchen schädlich ist – warum hört man dann nicht einfach auf? Gesund zu leben, bedeutet für mich das Treffen von bewussten Entscheidungen, auf bestimmte Dinge zu verzichten. Aber diese Entscheidungen muss man freiwillig treffen. Ich habe früher sehr ungesund gelebt, mich viel von Fastfood ernährt oder überhaupt nicht über meine Gesundheit nachgedacht. Auf Druck von außen habe ich dann Diäten gemacht, dann auch viele Kilos verloren, danach aber immer wieder zugenommen und gegessen wie früher. Inzwischen habe ich erkannt, dass die Ursachen für meine ungesunde Lebensweise persönliche Probleme waren, an denen ich jetzt arbeite. Dazu brauche ich keine Diät. Und das meine ich mit Lernprozess.\n\n" +
"**b Helen**\nIch denke, den Vorsatz, gesund zu leben, reduziert man zu oft auf gesunde Ernährung. Klar, ohne gesunde Ernährung geht gar nichts, aber es gibt viele andere Faktoren, die meiner Meinung nach für ein gesundes Leben viel wichtiger sind. Gesund leben heißt doch immer auch sich wohlfühlen, sein Leben genießen. Stress vermeiden. Nicht nur der Körper ist vital, auch der Geist. Und da gibt es eine Wechselwirkung: Wenn ich mich körperlich gut fühle, bin ich auch im Kopf vitaler. Und umgekehrt. Wenn ich mich gesund ernähre und trotzdem mit meinem Leben unzufrieden bin, lebe ich nicht gesund. Wenn ich zum Beispiel nicht schlafen kann, lasse ich meinen Tag Revue passieren. Welche schönen Dinge habe ich erlebt? Ich versuche, den Tag mit einem guten Gefühl abzuschließen. Dann schlafe ich ein und wache morgens entspannter auf. Übrigens: Im Internet gibt es hierzu zahlreiche Tipps und Ratgeber.\n\n" +
"**c Paolo**\nIch denke, ich lebe seit einiger Zeit sehr gesund. Ich bin zufrieden mit mir. Ich esse kein Fleisch mehr, esse sehr viel Obst und Gemüse, achte darauf, dass ich wenig Stress habe, und wenn der Stress zunimmt, mache ich Sport oder gönne mir auch mal ein Wellnesswochenende. Ich merke aber, dass ich beim Thema gesunde Ernährung zunehmend unsicherer werde. Jeden Monat präsentieren Politiker einen neuen Lebensmittelskandal: Hormone und Antibiotika in Fleisch und Fisch, Pestizide in Obst und Gemüse. Klar sind dann viele Menschen frustriert und sagen, ich esse weiter wie gehabt, es ist ja sowieso alles zu spät. Ich sehe das zwar nicht so extrem, aber inzwischen bin ich auch nicht mehr so streng mit mir. Wenn ich einmal Lust auf ungesundes Essen habe, dann gönne ich mir das auch. Auf einer Party halt einmal Chips und Cola, ohne dass ich das hinterher schlimm finden muss, und wenn ich mal eine rauche, sind mir die kritischen Blicke meiner Umgebung auch gleich. Die nächsten Tage ernähre ich mich dann wieder gesund und rauche nicht mehr.\n\n" +
"**d Amina**\nIch habe nicht das Gefühl, dass unsere Gesellschaft gesünder wird, trotz aller Artikel in Zeitschriften und trotz aller Ratgeber, die massenhaft in Buchläden angeboten werden. Zwar geht der Tabakkonsum zurück, das gilt aber nicht für Alkohol und vor allen Dingen Zucker. Auch immer mehr Kinder haben heute schon Übergewicht. Ich finde, dagegen vorzugehen, ist nicht nur Aufgabe der Erziehung, sondern auch Aufgabe des Staates. Wieso kann man zum Beispiel nicht die Fernsehwerbung für Kinder für zucker- und fetthaltige Lebensmittel einschränken? Man sollte sich weitere Maßnahmen überlegen, in erster Linie um Kinder und Jugendliche an gesunde Ernährung zu gewöhnen. Wir versuchen mit gutem Beispiel voranzugehen. Ein Tipp: Wir kochen zu Hause gemeinsam. Wenn unsere Kleinen beim Salatwaschen oder Gemüseputzen mithelfen, essen sie auch lieber." };

const T2 = { type: "text", title: "Teil 2 — Die Energiewende", content:
"Sie lesen in einer Zeitschrift einen Artikel über die Energiewende. Welche Sätze passen in die Lücken? Zwei Sätze passen nicht.\n\n" +
"**Die Energiewende – die Politik hat sich ehrgeizige Ziele gesetzt**\n\n" +
"Was versteht man eigentlich unter Energiewende? Einmal die Verabschiedung von den herkömmlichen Energieträgern Kohle, Erdöl und Erdgas, auch fossile Brennstoffe genannt. __(0)__ An ihrer Stelle sollen die erneuerbaren Energiequellen Sonne, Wasser und Wind treten, also Energieträger, die es immer geben wird. Bis 2050 sollen 80 % der Energie aus erneuerbaren Energien erzeugt werden. Zur Energiewende gehört ebenfalls der Ausstieg aus der Kernenergie.\n\n" +
"Schon in den 1970er-Jahren begann in Deutschland die Diskussion über die Kernenergie, bekannt geworden auch durch das Motto der Anti-Atomkraft-Bewegung „Atomkraft? Nein danke!“ In den 1990er-Jahren wurde in der Gesellschaft die Debatte über einen Ausstieg aus der Kernenergie noch breiter geführt. __(10)__ Dieses ereignete sich 1986.\n\n" +
"Vertreter der Atomenergie betonen immer wieder, dass Atomkraftwerke klimafreundlich seien, da während ihres Betriebs kein CO₂ ausgestoßen werde. __(11)__ Denn für den Abbau von Uran, das für die Herstellung von Atomkraft erforderlich ist, den Bau der Atomkraftwerke und die Endlagerung des Atommülls ist ein hoher Energieaufwand nötig, durch den Treibhausgase entstehen. Das Hauptargument gegen die Energiegewinnung aus Atomkraft ist allerdings die Gefährlichkeit. Auch eine andere Frage ist bis heute nicht geklärt: __(12)__ Dieser wird über viele Generationen die Umwelt belasten. Nach dem Reaktorunglück in Fukushima 2013 setzte sich die Bundesregierung das ehrgeizige Ziel, dass in absehbarer Zeit in Deutschland das letzte Atomkraftwerk vom Netz gehen soll. __(13)__ Ob dieses Ziel erreicht werden kann, ist aber mehr als fraglich.\n\n" +
"Das vermutlich größte Problem bei der Umwandlung der Energieversorgung stellt heute der Ausbau der Stromnetze dar. Wie kann es zum Beispiel gelingen, den Strom aus Windkraftanlagen, die meistens in den windreichen Regionen im Norden Deutschlands stehen, in die anderen Regionen Deutschlands zu transportieren? Eigentlich sind viele Bürger mit der Energiewende einverstanden. __(14)__ Die Menschen wehren sich gegen neue Stromleitungen, die durch ihre Ortschaften gehen, oder möchten keine hässlichen Windräder vor ihrer Haustür stehen haben.\n\n" +
"Sinnvoll wäre es, über eine dezentrale Versorgung mit Energie nachzudenken. __(15)__ Auf alle Fälle müssten die Bürger und Bürgerinnen bei der Realisierung der Energiewende besser beteiligt werden.\n\n" +
"*Beispiel (0): „Aber diese Energien sind endlich.“*" };

const T3 = { type: "text", title: "Teil 3 — Können wir ohne Freunde leben?", content:
"Sie lesen in einer Zeitung einen Artikel über Freundschaften. Wählen Sie bei jeder Aufgabe die richtige Lösung.\n\n" +
"**Können wir ohne Freunde leben?**\n\n" +
"Immer mehr Menschen nutzen soziale Netzwerke für die Beziehungspflege. „Freunde“ sind wichtig für die soziale Anbindung und das eigene Image. Doch mangels Zeit und Verbindlichkeit wird echte Freundschaft für viele zur Mangelware. Können wir auch ohne Freunde leben?\n\n" +
"In die Praxis des Hochschullehrers und Psychoanalytikers Prof. Dr. Andreas Hamburger kommen viele Menschen, die mit Beziehungsproblemen kämpfen. Viele sprechen über Probleme, die sie keinem Freund mitteilen können, weil sie letztlich Zweifel haben, ob es sich um wahre Freunde handelt. Nach den Erfahrungen des Psychoanalytikers ist Freundschaft tatsächlich heute für eine wachsende Zahl von Menschen Mangelware. Jedoch nicht, weil es an Kontakten mangelt, sondern weil Tiefe fehlt, die es erst ermöglicht, sich anderen Personen zu öffnen.\n\n" +
"Auch die Soziologin Dr. Ursula Nötzold, die an der Hochschule Landshut lehrt und seit Jahrzehnten zum Thema Freundschaft forscht, bestätigt die These, dass ein möglicher Mangel an Freundschaft heute in der Regel nicht auf einem Mangel an Kontakten gründet. Sondern vielmehr auf ein Zuviel an Kontakten und der damit verbundenen Überforderung, damit adäquat umzugehen.\n\n" +
"Sie sieht jedoch auch einen positiven Trend. Die Vorstellung von Freundschaft ist im Wandel, weg von einem überhöhten Freundschaftsideal hin zu alltagstauglichen, lebbaren Freundschaften. Die können nämlich auch aus Interessensgemeinschaften entstehen und zwar dort, wo sich die Menschen im Alltag begegnen, sei es in der Arbeitswelt oder in der Freizeit. Zweckbündnisse, aus denen Freundschaften werden können, ohne dass anfangs zu viel vom anderen erwartet wird.\n\n" +
"Allerdings erschwert ein noch immer weit verbreitetes Statusdenken Freundschaften, zum Beispiel für den Landarzt Rene Vogelsang. Er genießt hohes Ansehen, doch seine berufliche Position lässt für eine Hemmschwelle für das Entstehen neuer Freundschaften und macht es schwierig, sich auf Augenhöhe zu fühlen. Inzwischen trifft er sich regelmäßig mit Kollegen aus dem Landkreis. Was zunächst als Zweckbündnis gestartet war, daraus sind inzwischen freundschaftliche Beziehungen gewachsen.\n\n" +
"In der Freundschaft sieht die Soziologin Nötzold auch deshalb die passende Beziehungsform für die heutige Zeit, weil sie dem individualistischen Zeitgeist entspricht. Freundschaft beruht auf Freiwilligkeit. Sie kommt zustande, wenn genügend Übereinstimmung und Sympathie vorhanden sind. Und sie kann jederzeit auch wieder gekündigt werden.\n\n" +
"Medienwissenschaftler an der Universität München haben das Verhalten von Mädchen zwischen 12 und 16 Jahren untersucht. Es zeigte sich ein deutlicher Trend, sich und die beste Freundin immer stärker durch Filme, Fotos und Kommentare im Netz zu inszenieren. Auch wenn es die Freundschaft nach alten Mustern immer noch gibt: Die Freundschaften, die ins Netz gestellt werden, sind für die Mädchen echt. Die virtuelle Freundschaftswelt ist für sie so real wie der Gang ins Klassenzimmer." };

const T4 = { type: "text", title: "Teil 4 — Mehrsprachige Erziehung", content:
"Sie lesen in einer Zeitschrift verschiedene Meinungsäußerungen zu dem Thema „mehrsprachige Erziehung“. Welche Äußerung passt zu welcher Überschrift? Eine Äußerung passt nicht. Die Äußerung a ist das Beispiel und kann nicht noch einmal verwendet werden.\n\n" +
"**a (Beispiel) — Alex, Frankfurt**\nWir alle wissen, wie schwer es ist, im Erwachsenenalter Fremdsprachen zu lernen. Umso wichtiger ist es, bereits in Kindergärten und Kitas eine weitere Sprache zu lernen, und zwar spielerisch, ohne Grammatikpaukerei, Regeln und ohne Angst haben zu müssen, Fehler zu machen.\n\n" +
"**b — Jasmin, Bonn**\nIn der Diskussion über die mehrsprachige Erziehung orientiert man sich zu stark an deutschen Kindern, die schon früh eine andere Sprache, meistens Englisch, lernen sollen. Deutschland ist jedoch ein Einwanderungsland. Bei den Kindern aus anderen Ländern geht es nicht nur darum, Deutsch zu lernen, sondern den Reichtum ihrer eigenen Sprache nicht zu verlieren.\n\n" +
"**c — Oleg, Wien**\nBei aller Mehrsprachigkeit: Ich finde, die Kinder sollten zuerst einmal richtig Deutsch lernen, sonst können sie Probleme bekommen. Man darf nicht vergessen: Eine fremde Sprache lernt man erst, wenn man seine eigene beherrscht. Und wenn man aus einem anderen Land kommt, ist Deutsch die Sprache der Integration.\n\n" +
"**d — Lena, Stuttgart**\nEs ist doch eine Realität: In Deutschland wachsen immer mehr Kinder mehrsprachig auf, aber an Schulen wird meistens nur bilingualer Unterricht in Englisch oder Französisch angeboten. Hier ist ein Umdenken erforderlich. Man muss einfach erkennen, dass alle Sprachen den gleichen Wert haben.\n\n" +
"**e — Sebastian, Berlin**\nIch finde mehrsprachige Erziehung ist oft der Wunsch ehrgeiziger Eltern, die wollen, dass ihre Kinder schon im Kindergarten eine besondere Leistung erbringen. Man sollte die Kinder aber nicht überfordern, später in der Schule wird sich ja herausstellen, ob sie wirklich sprachbegabt sind oder andere Talente haben.\n\n" +
"**f — Fatia, Bern**\nIch finde bei mehrsprachiger Erziehung brauchen die Kinder klare Strukturen. Wenn die Eltern aus unterschiedlichen Ländern kommen, sollte die Mutter immer nur in ihrer Sprache mit dem Kind sprechen und der Vater in seiner. Die emotionale Bindung einer Sprache zu einer Person finde ich sehr entscheidend.\n\n" +
"**g — Jan, Regensburg**\nWer mehrere Sprachen spricht, hat bessere Möglichkeiten im Beruf und ist auch geübter darin, andere Kulturen besser kennenzulernen. Letztendlich ist das auch ein Ziel der Politik. Alle EU-Bürgerinnen und -Bürger sollten zusätzlich zu ihrer Muttersprache zwei Fremdsprachen sprechen können, auch wenn das viel Arbeit bedeutet.\n\n" +
"**h — Uta, Heilbronn**\nBei allen Vorzügen einer mehrsprachigen Erziehung: Was ist denn, wenn das Kind während der Pubertät keine Lust mehr auf die Sprache seiner Eltern hat? Oder es fühlt sich überfordert, weil nach der spielerischen frühkindlichen Phase jetzt richtig gelernt werden muss. Man sollte nicht so tun, als gäbe es keine Schwierigkeiten." };

const T5 = { type: "text", title: "Teil 5 — Freundschaftsverein „MultiKulti“ (Satzungsauszug)", content:
"Sie möchten sich sozial engagieren und lesen Auszüge aus einer Vereinssatzung. Welche der Überschriften aus dem Inhaltsverzeichnis passen zu den Paragraphen? Vier Überschriften werden nicht gebraucht.\n\n" +
"**Inhaltsverzeichnis:** a Rechte und Pflichten der Mitglieder · b Aufwandsentschädigungen · c Zweck und Ziel des Vereins · d Beendigung · e Entlohnung und Honorare · f steuerliche Regelungen · g Aufnahme in den Verein · h Organe des Vereins\n\n" +
"**§ (Beispiel) — Lösung: c (Zweck und Ziel des Vereins)**\nDer Verein stellt sich zur Aufgabe, die Verständigung zwischen den zahlreichen Kulturen im Stadtteil aktiv zu fördern, unter anderem durch Kulturveranstaltungen, Ausstellungen, internationale Feste, Deutsch- und andere Sprachkurse, Beratungen, Hausaufgabenhilfe, Mütter-Kind-Gruppen.\n\n" +
"**§ 28**\nDer Verein ist vom Finanzamt als gemeinnütziger Verein anerkannt und verfolgt ausschließlich und unmittelbar gemeinnützige Zwecke. Mittel des Vereins dürfen nur für die in der Vereinssatzung genannten Zwecke verwendet werden. Mitgliedsbeiträge und Spenden können beim Finanzamt geltend gemacht werden. Spendenquittungen erteilt der Vorstand.\n\n" +
"**§ 29**\nMitglieder können alle Personen werden, die die Ziele des Vereins unterstützen. Um Mitglied im Verein zu werden, bedarf es einer schriftlichen Anmeldung. Minderjährige benötigen die Zustimmung des Erziehungsberechtigten. Über den Erwerb der Mitgliedschaft entscheidet der Vorstand. Zur Höhe des Mitgliedsbeitrags wird auf die Beitragsordnung des Vereins verwiesen.\n\n" +
"**§ 30**\nDer Verein kann durch Beschluss der Mitgliederversammlung aufgelöst werden. Für den Beschluss ist eine 3/4-Mehrheit erforderlich. Der ehemalige Vorstand muss die Auflösung im Vereinsregister anmelden und diese auch dem Finanzamt mitteilen. Nach Auflösung des Vereins wird sein übrig gebliebenes Vermögen einer Einrichtung oder einem Verein, der ähnliche Ziele verfolgt, übertragen. Hierüber entscheidet die Mitgliederversammlung." };

const Q = [
  // Teil 1 — matching a–d. Ključ: 1d 2c 3a 4c 5b 6d 7b 8a 9c
  [T1, P1, "Wer findet, dass Gesundheitsratgeber keinen großen Einfluss haben?", 3],
  [T1, P1, "Wer weiß manchmal gar nicht mehr genau, welche Ernährung eigentlich gesund ist?", 2],
  [T1, P1, "Wer findet, dass man Menschen nicht zu gesundem Leben zwingen kann?", 0],
  [T1, P1, "Wer möchte sich kein schlechtes Gewissen einreden lassen?", 2],
  [T1, P1, "Für wen bedeutet gesundes Leben in erster Linie positives Denken?", 1],
  [T1, P1, "Wer fordert, dass die Politik aktiver wird?", 3],
  [T1, P1, "Für wen ist gesundes Essen nicht das einzig Entscheidende?", 1],
  [T1, P1, "Wer denkt, dass es Zeit braucht, bis es gelingt, gesund zu leben?", 0],
  [T1, P1, "Wer möchte sowohl gut leben als auch genießen?", 2],
  // Teil 2 — umetanje a–h. Ključ: 10g 11d 12h 13f 14c 15a
  [T2, S2, "Lücke 10 — Welcher Satz passt?", 6],
  [T2, S2, "Lücke 11 — Welcher Satz passt?", 3],
  [T2, S2, "Lücke 12 — Welcher Satz passt?", 7],
  [T2, S2, "Lücke 13 — Welcher Satz passt?", 5],
  [T2, S2, "Lücke 14 — Welcher Satz passt?", 2],
  [T2, S2, "Lücke 15 — Welcher Satz passt?", 0],
  // Teil 3 — a/b/c. Ključ: 16a 17c 18a 19b 20a 21a
  [T3, ABC, "Viele Klienten von Andreas Hamburger haben Schwierigkeiten, … a) anderen Menschen zu vertrauen. b) Kontakte zu knüpfen. c) über ihre Probleme zu sprechen.", 0],
  [T3, ABC, "Nach Meinung von Frau Nötzold gibt es heute so wenige Freundschaften, weil man … a) im Grunde heute viel mehr Kontakte hat, als man in der Regel haben sollte. b) mit Freundschaften zu viele schlechte Erfahrungen gemacht hat. c) nicht mehr in der Lage ist, mit den zahlreichen Bekanntschaften umzugehen.", 2],
  [T3, ABC, "Wie haben sich Freundschaften verändert? a) Die Ansprüche an Freundschaften sind nicht mehr so hoch. b) Freunde findet man heute meistens im Beruf. c) Freundschaften werden nur noch nach längerer Zeit geschlossen.", 0],
  [T3, ABC, "Das Beispiel eines Landarztes zeigt, dass … a) aus kollegialen Beziehungen nur selten Freundschaften entstehen. b) bei Freundschaften auf Herkunft und berufliche Stellung geachtet wird. c) man auf dem Land leichter Freunde findet.", 1],
  [T3, ABC, "Freundschaften der heutigen Zeit … a) entsprechen der aktuellen Lebensweise. b) halten nur noch kurze Zeit. c) sind stabiler als früher.", 0],
  [T3, ABC, "Bei Mädchen zwischen 12 und 16 Jahren … a) bestehen neben Freundschaften in sozialen Netzwerken auch noch traditionelle Freundschaften. b) führen Internetfreundschaften oft zu wirklichen Kontakten. c) werden Freundschaften hauptsächlich in der Schule geschlossen.", 0],
  // Teil 4 — Überschrift → Äußerung (b–h). Ključ: 22f 23c 24g 25h 26d 27b
  [T4, A4, "Überschrift 22: „Mehrsprachigkeit in der Familie braucht Regeln.“ — Welche Äußerung passt?", 4],
  [T4, A4, "Überschrift 23: „Deutsch lernen muss im Vordergrund stehen.“ — Welche Äußerung passt?", 1],
  [T4, A4, "Überschrift 24: „Bessere Karrierechancen und größere Weltoffenheit.“ — Welche Äußerung passt?", 5],
  [T4, A4, "Überschrift 25: „Probleme nicht verschweigen.“ — Welche Äußerung passt?", 6],
  [T4, A4, "Überschrift 26: „Herausforderung für die Schule.“ — Welche Äußerung passt?", 2],
  [T4, A4, "Überschrift 27: „Mehrsprachigkeit in Zeiten der Migration.“ — Welche Äußerung passt?", 0],
  // Teil 5 — Paragraph → Überschrift (a–h). Ključ: 28f 29g 30d
  [T5, H5, "§ 28 — Welche Überschrift passt?", 5],
  [T5, H5, "§ 29 — Welche Überschrift passt?", 6],
  [T5, H5, "§ 30 — Welche Überschrift passt?", 3],
];

const { data: course } = await sb.from("courses").select("id").eq("slug", SLUG).single();
if (!course) throw new Error(`Kurs ${SLUG} ne postoji`);
console.log(`Kurs ${SLUG}: ${course.id} | pitanja: ${Q.length}`);
if (!APPLY) { console.log("[DRY] Modelltest 3 (5 delova / 30 zadataka). Pokreni sa --apply."); process.exit(0); }

let lessonId;
{
  const { data: ex } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", LESSON_TITLE).maybeSingle();
  const payload = { course_id: course.id, title: LESSON_TITLE, order_index: 3, lesson_type: "text",
    sections: [{ type: "badge", module: "Leseverstehen B2" },
      { type: "text", style: "info", content: "Modelltest Lesen (Goethe-Zertifikat B2), 5 delova / 30 zadataka. Tekst za čitanje stoji iznad pitanja u svakom delu." }] };
  if (ex) { lessonId = ex.id; await sb.from("lessons").update(payload).eq("id", ex.id); console.log(`~ Modelltest 3 lekcija ažurirana (${ex.id})`); }
  else { const { data: c } = await sb.from("lessons").insert(payload).select("id").single(); lessonId = c.id; console.log(`+ Modelltest 3 lekcija kreirana (${c.id})`); }
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
