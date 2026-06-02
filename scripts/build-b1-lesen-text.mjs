// B1 Leseverstehen — PUN TEKSTUALNI test (zamenjuje PDF-ključ verziju).
// Tekstovi u context panelu + prava pitanja/opcije. Grupni prikaz po tekstu. Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const EX = "Leseverstehen — Modelltest B1";

const RF = ["richtig", "falsch"], JN = ["Ja", "Nein"], ABC = ["a", "b", "c"];
const MATCH = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "X (nijedan)"];

const T1 = { type: "text", title: "Teil 1 — StefansAlltagsblog.at", content:
"**StefansAlltagsblog.at — Was so jeden Tag passiert … (Dienstag, 5. Juni)**\n\nDieser Tag fing wirklich sehr merkwürdig an: Beim Frühstück habe ich einen Unfall beobachtet! Wenn das Wetter schön ist, sitze ich morgens gern mit meinem Müsliteller auf dem Balkon. Ich wohne direkt am Sachsendamm, drei Stockwerke unter mir brausen morgens sehr viele Autos vorbei, obwohl es eine Einbahnstraße ist. Ich kann die Autos nicht sehen, aber sehr gut hören. Heute Morgen war ich gerade fertig mit meinem Müsli, als plötzlich Bremsen kreischten, Leute schrien – und dann krachte es. Ich sah hinunter: Ein kleiner Lieferwagen stand schräg auf der Straße, ein alter schwarzer Mercedes war ihm hinten hineingefahren.\n\nDer Mercedesfahrer, ein Herr in mittleren Jahren, stieg aus und ging nach vorn zur Tür des Lieferwagens. Er machte die Tür auf, aber da war niemand. Immer mehr Leute kamen dazu. Dann kam aus dem Haus gegenüber ein junger Mann angerannt, in einer Art Uniform, ohne Zweifel ein Paketfahrer. Er zog sofort sein Handy aus der Tasche, und kurz darauf hörte man das Polizeiauto.\n\nIch bin dann zur Universität gegangen und habe nicht mehr an die Sache gedacht. Erst heute Abend fiel sie mir wieder ein, als ich beim Gemüsehändler an der Ecke war. Er hatte alles gesehen. Ich fragte ihn, ob er den Paketfahrer kennt. Er kannte ihn nicht, aber er wusste, dass Frau Wendler im zweiten Stock ständig im Internet Sachen bestellt, die mit dem Paketlieferservice kommen.\n\nDer Gemüsehändler erzählte, dass zwei junge Frauen gesagt hatten, der Mercedesfahrer habe vor dem Unfall im Auto telefoniert. Das Paketauto war schließlich weggefahren, aber den alten Mercedes musste der Reparaturdienst abholen. Wir diskutierten noch, ob der Mercedesfahrer Schuld hatte oder nicht – wir glaubten eigentlich beide. Der Paketfahrer hatte allerdings in zweiter Reihe geparkt, das war natürlich auch nicht richtig. Aber trotzdem: „Wer drauffährt, zahlt“, sagte der Gemüsehändler.\n\nBis bald, Stefan" };

const T2A = { type: "text", title: "Teil 2 — Mit Granny Aupair in die Welt", content:
"**Mit Granny Aupair in die Welt**\n\nDie Hamburger Agentur Granny Aupair schickt ältere Frauen weltweit in Familien oder in soziale Projekte. Eine Aufenthaltsdauer ist nicht vorgeschrieben. Karin Dörner ist Witwe, 65 Jahre alt, bis vor einem Jahr war sie als Lehrerin tätig. Jetzt sitzt sie in ihrem Schlafzimmer in Neumünster auf dem Bett und überlegt, was sie mitnehmen soll. Frau Dörner hat sich für sechs Monate als Au-pair-Großmutter bei einer Familie in Phnom Penh beworben. Sie soll sich um einen kleinen Jungen kümmern, der aus einer amerikanisch-deutschen Familie stammt. Der Kleine ist vier Jahre alt, und die Mutter, die in Kambodscha für UNICEF arbeitet, befürchtet, dass er seine deutschen Sprachkenntnisse vergessen könnte.\n\nFrau Dörner hat sich über das Leben in Kambodscha gut informiert: über das ungesunde feucht-heiße Klima, über die großen sozialen Unterschiede. Ihre Gastfamilie wohnt in einer großen 6-Zimmer-Wohnung mit Klimaanlage und Hausmädchen, was für eine kambodschanische Durchschnittsfamilie unerreichbar ist. Sie weiß, dass sie in sechs Monaten keine echte Verbindung zum Land finden kann; auch in der Landessprache Khmer wird sie nur wenige Wörter lernen. Sie hat aber in den letzten Monaten englische und französische Sprachkurse besucht und hofft, dass sie gut vorbereitet ist für die große Reise. *(aus einer deutschen Zeitung)*" };

const T2B = { type: "text", title: "Teil 2 — Haben schöne Frauen mehr Erfolg im Beruf?", content:
"**Haben schöne Frauen mehr Erfolg im Beruf?**\n\nPsychologen haben herausgefunden, dass wir symmetrische Gesichter mit glatter Haut und hohen Wangenknochen unbewusst mit positiven Eigenschaften verbinden. Wir glauben, dass schöne Menschen freundlich, zuverlässig und kompetent sind. Zwei Studien zeigen: Die Wiener School of Education hat drei Gymnasialklassen untersucht und fand heraus, dass attraktive Jugendliche um 0,5 bis 0,75 Notenpunkte besser beurteilt werden als andere Schüler mit gleichen Leistungen. In der Schule stimmt das also – aber im Beruf?\n\nZwei Wissenschaftler an der Universität in Tel Aviv verschickten für ihre Studie 2500 Bewerbungen mit Fotos. Die Hälfte der Fotos zeigten schöne Männer und Frauen, die anderen gehörten zu durchschnittlichen Gesichtern. Das Resultat war erstaunlich: Gutaussehende Männer wurden doppelt so oft angefragt wie die durchschnittlichen Bewerber. Bei den Frauen war das Gegenteil der Fall: Von den schönen Frauen bekamen nur 10 % eine positive Antwort, während von den alltäglichen Damen etwa ein Drittel zur Vorstellung eingeladen wurde. Die Wissenschaftler fanden heraus, dass in den Personalbüros fast ausschließlich Frauen sitzen – und die glauben offenbar, dass schöne Frauen das Betriebsklima stören. *(aus einer österreichischen Zeitung)*" };

const T3 = { type: "text", title: "Teil 3 — Stellenanzeigen (A–J)", content:
"Pročitaj situacije i izaberi koji oglas odgovara. Ako nijedan ne odgovara: **X**.\n\n**A** — Wir suchen Hilfe bei der Kinderbetreuung. Zwei Jungs (4 und 6 Jahre) mittags von der Schule abholen, Essen, Spielen. Mo–Fr, jeweils 4 Std.\n**B** — Hilfskräfte gesucht: Studentenjob im Postdienst, Einpacken/Sortieren von Briefsendungen. Samstags, sonntags, nachts. Sehr gute Deutschkenntnisse, gute Bezahlung.\n**C** — Russische Literatur: Workshop „Russland schreibt“, Sa/So 3./4. Juli, sehr gute Russischkenntnisse.\n**D** — Paketfahrer gesucht: Führerschein, Stadtkenntnis, Deutschkenntnisse. Guter Verdienst, Arbeitszeit nach Vereinbarung, angemessene Sozialleistungen.\n**E** — Ponyhof sucht Aushilfskräfte: Gruppenbetreuung im Juli/August, Gäste 8–14 Jahre, jeweils 14 Tage.\n**F** — Praktikums-Börse Hotel und Restaurant: Praktikumsplätze 3–6 Monate, auch für Anfänger mit geringen Sprachkenntnissen.\n**G** — Übersetzungsbüro sucht freie Mitarbeiter: alle europäischen Sprachen, von zu Hause, Probe-Übersetzung.\n**H** — 400-Euro-Job im kleinen Teeladen: freundlich, im Team. Di–Sa von 10.00 bis 14.00 Uhr.\n**I** — Computer-Notdienst: Gruppe von Fachleuten auf Abruf in festgelegten Zeiträumen. Abrechnung wöchentlich.\n**J** — Clara-Zetkin-Institut sucht Mitarbeiter (3 Monate): Katalogisierung/Archivierung von Texten, Internet-Recherche, Mitarbeit in der Presseabteilung." };

const T4 = { type: "text", title: "Teil 4 — Rentenalter auf 70 (Leserbriefe)", content:
"Treba li podići starosnu granicu za penziju na 70 godina? Pročitaj komentare i odluči za svaku osobu: **Ja** ili **Nein**.\n\n**Wolfram (39, Berlin):** Warum denkt niemand daran, dass wir die Arbeitsplätze für die jungen Leute brauchen? Es ist für den Staat billiger, wenn die Alten keine Rente beanspruchen, sondern weiter Gehalt von der Firma bekommen, am liebsten bis sie achtzig sind! Aber so geht es nicht: Wir brauchen junge Ideen und jungen Enthusiasmus.\n\n**Martin (24, Erfurt):** Jeder weiß, dass heute alle länger fit bleiben. Warum sollen sie nicht auch länger im Produktionsprozess bleiben? Wer länger gearbeitet hat, hat größere Erfahrung. Es ist unsinnig, wenn gut ausgebildete Arbeitskräfte im besten Lebensalter in Rente gehen.\n\n**Michaela (32, Wien):** Ist es nicht das, was wir uns alle wünschen? Mit siebzig oder achtzig noch topfit im Arbeitsleben? Das ist wunderbar, aber es ist eine Illusion. In Wirklichkeit fangen die meisten Menschen schon mit sechzig an, einen Leistungsabfall zu zeigen.\n\n**Corinna (32, Linz):** Früher waren alte Menschen für die Familie wichtig. Als sie in Rente gingen, machten sie in der eigenen Familie weiter. Das ist heute nicht mehr so. Viele ältere Menschen langweilen sich, werden nicht mehr gebraucht und verfallen in Depressionen. Warum sollen sie nicht arbeiten, solange sie können?\n\n**Sybille (19, Zug):** Ich habe gerade erst das Abitur gemacht; die Vorstellung, in Rente zu gehen, liegt mir also noch sehr fern. Ich glaube, man könnte das Rentenalter recht hoch ansetzen, für alle, die das wollen. Und für diejenigen, die das nicht wollen, müsste man Möglichkeiten schaffen, vorher auszusteigen.\n\n**Gloria (54, Wolfenbüttel):** Wenn man sich die demografische Entwicklung anschaut, haben wir keine andere Wahl: Wir müssen länger arbeiten. Allerdings scheint es mir übertrieben, das Rentenalter gleich auf siebzig zu erhöhen. Wenn wir die Grenze um ein Jahr erhöhen, wäre das schon eine große Hilfe. Wenn man mehr fordert, bringt man die Arbeitnehmer in Schwierigkeiten.\n\n**Gilbert (61, Heidelberg):** Ich denke, dass wir ein System finden könnten, das für alle attraktiv wäre. Die dramatische Erhöhung des Rentenalters ist unausweichlich, sonst können unsere Kinder die Renten nicht mehr bezahlen. Siebzig Jahre finde ich ganz vernünftig. Aber es muss Möglichkeiten geben, diese Grenze nach oben ebenso wie nach unten zu überschreiten." };

const T5 = { type: "text", title: "Teil 5 — Hausordnung „Wohnpark am See“", content:
"**WOHNPARK „AM SEE“ — Liebe Gäste,**\n\nin unserer Wohnanlage leben Menschen, die sich erholen wollen. Bitte beachten Sie folgende Regeln:\n\nLaute Musik, Lärm und Kinderspiele im Hausflur sind zu unterlassen. Von 13.00 bis 15.00 und von 22.00 bis 8.00 Uhr soll absolute Ruhe herrschen.\n\nDas Eingangstor ist geschlossen zu halten, auf jeden Fall nach 21.00 Uhr. Der Wohnungsschlüssel darf nicht kopiert werden, da dies zur Beschädigung der Schlösser führen kann. Wenn Sie einen zweiten Wohnungsschlüssel brauchen, wenden Sie sich an den Hausmeister. Der Schlüssel öffnet auch die Garage, den Fahrradkeller und den Waschraum. Mit dem Wohnungsschlüssel lässt sich auch das Eingangstor öffnen.\n\nDas Abstellen von Kinderwagen und Fahrrädern in den Hausfluren ist verboten. In den Kellerräumen ist dafür ausreichend Platz; außerdem gibt es Stellplätze hinter den Garagen.\n\nDas Halten von Hunden und anderen Haustieren in den Wohnungen ist nicht gestattet. Wenn Sie Ihr Haustier mitbringen wollen, müssen Sie beim Verwalter einen schriftlichen Antrag stellen.\n\nDie Benutzung des Waschraums während der Ruhezeiten ist nicht gestattet. Sie brauchen zum Waschen und Trocknen 50-Cent-Münzen. Nach dem Waschen müssen Sie den Waschraum sauber zurücklassen.\n\nDie Balkons und Terrassen dürfen nicht als Abstellplatz benutzt werden. Die Liegestühle auf der Sonnenwiese stehen allen Mietern zur Verfügung; das Reservieren durch Handtücher ist verboten." };

// pitanja: [context, items, tekst, tačan index]
const Q = [
  // Teil 1 (R/F)
  [T1, RF, "Die Straße unter Stefans Balkon ist morgens ziemlich laut.", 0],
  [T1, RF, "Der Paketfahrer lieferte gerade etwas ab.", 0],
  [T1, RF, "Stefan blieb zu Hause, um das Geschehen zu beobachten.", 1],
  [T1, RF, "Am Abend musste Stefan noch etwas einkaufen.", 0],
  [T1, RF, "Stefan erfährt, dass der Mercedes stark beschädigt war.", 0],
  [T1, RF, "Stefan und sein Gesprächspartner denken, dass nur der Mercedesfahrer Fehler gemacht hat.", 1],
  // Teil 2A (a/b/c) — Granny Aupair
  [T2A, ABC, "Frau Dörner … a) will eine Rundreise durch Kambodscha machen. b) will in einer Familie arbeiten. c) will die Sprache des Landes lernen.", 1],
  [T2A, ABC, "Frau Dörner weiß, dass … a) sie in Phnom Penh in einer Durchschnittsfamilie leben wird. b) das Wetter in Kambodscha für Europäer schwierig ist. c) in der Gastfamilie niemand Deutsch spricht.", 1],
  [T2A, ABC, "Um sich vorzubereiten, hat Frau Dörner … a) ein Klimatraining gemacht. b) einen Kurs über die Kultur im alten Kambodscha besucht. c) ihre Fremdsprachenkenntnisse verbessert.", 2],
  // Teil 2B (a/b/c) — Schöne Frauen
  [T2B, ABC, "Wissenschaftler haben bewiesen, … a) dass attraktive Menschen überall leicht Erfolg haben. b) dass Schönheit und gute Leistung zusammengehören. c) dass Lehrer sich vom Aussehen beeinflussen lassen.", 2],
  [T2B, ABC, "Wie wurde die Studie in Tel Aviv organisiert? a) Auf 50 % der Fotos waren gutaussehende Männer. b) 10 % der Fotos zeigten unattraktive Personen. c) 50 % der Fotos zeigten normale Leute mit alltäglichem Aussehen.", 2],
  [T2B, ABC, "Was fanden die Wissenschaftler heraus? a) Für die Firma ist wichtig, dass neue Mitarbeiter keinen Streit verursachen. b) Gutes Aussehen ist für Männer genauso wichtig wie für Frauen. c) Bewerber mit durchschnittlichem Aussehen haben bessere Chancen.", 0],
  // Teil 3 (matching A–J / X)
  [T3, MATCH, "Erdal M. lebt seit einem Jahr in Deutschland. Er fährt täglich drei Stunden den Lieferwagen einer Wäscherei und braucht mehr Geld.", 3],
  [T3, MATCH, "Susan S. ist Amerikanerin und studiert in Köln Journalistik. Sie sucht ein Praktikum, das zu ihrem Studium passt.", 9],
  [T3, MATCH, "Marian B. ist seit vier Monaten in Berlin und besucht 3× pro Woche vormittags einen Deutschkurs. Sie möchte einen Job, bei dem sie Deutsch sprechen kann.", 0],
  [T3, MATCH, "Ewa R. aus Bulgarien spricht fließend Deutsch, Russisch und Italienisch. Sie lebt auf dem Lande und hat ein Baby.", 6],
  [T3, MATCH, "Luella M. sucht eine Anstellung in einem Hotel in Österreich oder der Schweiz. Sie arbeitet schon in einem Hamburger Hotel.", 10],
  [T3, MATCH, "Jaime L. hat Informatik studiert, spielt abends in einer Band, möchte aber in seinem Beruf arbeiten.", 8],
  [T3, MATCH, "Georg N. schreibt seine Examensarbeit, braucht Geld, kann aber nur am Wochenende arbeiten.", 1],
  // Teil 4 (Ja/Nein) — za Erhöhung auf 70?
  [T4, JN, "Wolfram (39, Berlin) — ist er für die Erhöhung des Rentenalters auf 70?", 1],
  [T4, JN, "Martin (24, Erfurt) — für die Erhöhung?", 0],
  [T4, JN, "Michaela (32, Wien) — für die Erhöhung?", 1],
  [T4, JN, "Corinna (32, Linz) — für die Erhöhung?", 0],
  [T4, JN, "Sybille (19, Zug) — für die Erhöhung?", 0],
  [T4, JN, "Gloria (54, Wolfenbüttel) — für die Erhöhung auf 70?", 1],
  [T4, JN, "Gilbert (61, Heidelberg) — für die Erhöhung?", 0],
  // Teil 5 (a/b/c) — Hausordnung
  [T5, ABC, "Wenn Sie Ihre Katze mitnehmen wollen, … a) muss sie immer in der Wohnung bleiben. b) müssen Sie den Hausmeister fragen. c) brauchen Sie eine schriftliche Genehmigung.", 2],
  [T5, ABC, "Fahrräder … a) kann man beim Hausmeister mieten. b) muss man immer in den Keller tragen. c) kann man auch draußen (hinter den Garagen) abstellen.", 2],
  [T5, ABC, "Der Mieter bekommt nur den Wohnungsschlüssel, … a) weil die Schlösser leicht kaputt gehen. b) weil der Schlüssel überall in der Anlage passt. c) weil der Eingang immer offen ist.", 1],
  [T5, ABC, "Man kann die Wäsche mit der Maschine waschen, … a) wenn man passende Geldstücke (50 Cent) hat. b) wenn der Hausmeister einverstanden ist. c) wenn der Waschraum geöffnet ist.", 0],
];

const { data: course } = await sb.from("courses").select("id").eq("slug", "polozi-goethe-b1").single();
const { data: lesson } = await sb.from("lessons").select("id,sections").eq("course_id", course.id).eq("title", "Leseverstehen – Modelltest B1").single();
console.log(`Lesen lekcija: ${lesson.id} | pitanja: ${Q.length}`);
if (!APPLY) { console.log("[DRY] --apply (zamenjuje test punim tekstom, uklanja PDF sekciju)."); process.exit(0); }

// lekcija sekcije: badge + info (bez PDF-a, tekst je u testu)
await sb.from("lessons").update({ sections: [
  { type: "badge", module: "Leseverstehen B1" },
  { type: "text", style: "info", content: "Modelltest Lesen (Goethe-Zertifikat B1), 5 delova / 30 zadataka. Tekst za čitanje stoji iznad pitanja u svakom delu." },
]}).eq("id", lesson.id);

await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("title", EX);
const { data: ex } = await sb.from("exercises").insert({ lesson_id: lesson.id, title: EX, exercise_type: "quiz", order_index: 0 }).select("id").single();
let i = 0;
for (const [ctx, items, q, correct] of Q) {
  await sb.from("exercise_questions").insert({
    exercise_id: ex.id, question: `<strong>Aufgabe ${i + 1}</strong> — ${q}`,
    options: { type: "quiz", items, context: ctx }, correct_answer: String(correct), question_type: "quiz", order_index: i++,
  });
}
console.log(`✓ "${EX}": ${Q.length} pitanja sa tekstovima (6 grupa po tekstu)`);
