// B2 (Goethe-Zertifikat) — Modelltest 1, Modul LESEN — PUN TEKSTUALNI test (zamenjuje PDF-embed).
// Tekst čitanja u context panelu + prava pitanja/opcije. Verno prepisano iz Cornelsen Prüfungstraining B2.
// Takođe kreira video lekciju "O ispitu — Goethe B2" (Vimeo 590289804).
// Dry-run default; --apply za upis.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const SLUG = "polozi-goethe-b2";
const VIDEO_TITLE = "O ispitu — Goethe B2";
const VIDEO_ID = "590289804";
const LESSON_TITLE = "Leseverstehen – Modelltest 1";
const EX = "Leseverstehen — Modelltest 1";

// ── Opcije ──────────────────────────────────────────────────────────────────
const P1 = ["a — Holger", "b — Julia", "c — Katja", "d — Ricardo"];                       // Teil 1: 4 osobe
const ABC = ["a", "b", "c"];                                                              // Teil 3: a/b/c (tekst u pitanju)
// Teil 2: umetanje rečenica a–h
const S2 = [
  "a — Deshalb wird diese Entwicklung auch kritisch gesehen.",
  "b — Und es wird immer mehr Ausleihsysteme geben.",
  "c — Denn sie waren sehr unsicher und gefährlich.",
  "d — Der Fahrer saß auf dem Rahmen und bewegte sich mithilfe seiner Beine.",
  "e — Trotzdem muss hier noch einiges getan werden.",
  "f — Im 20. Jahrhundert wurde Mobilität immer wichtiger.",
  "g — Die Menschen wollten auf ihr Auto nicht verzichten.",
  "h — Dadurch konnten auch die Preise sinken.",
];
// Teil 4: Äußerungen b–h (a je Beispiel)
const A4 = ["b", "c", "d", "e", "f", "g", "h"];
// Teil 5: Überschriften a–h
const H5 = [
  "a — Angebote für Kinder und Jugendliche",
  "b — Downloadbereich",
  "c — Öffnungszeiten der Bibliothek",
  "d — Gebühren",
  "e — Veranstaltungen",
  "f — Medienforum",
  "g — Ausleihfristen",
  "h — Verhaltensregeln",
];

// ── Tekstovi (context paneli) ────────────────────────────────────────────────
const T1 = { type: "text", title: "Teil 1 — Wie wir wohnen …", content:
"Sie lesen in einem Forum, wie Menschen über ihre Wohnsituation und Wohnformen denken. Auf welche der vier Personen treffen die einzelnen Aussagen zu? Die Personen können mehrmals gewählt werden.\n\n" +
"**a Holger**\nEigentlich war ich immer ein Stadtmensch. Da die Mieten für Wohnraum in den Städten immer mehr steigen und gutes Wohnen bald unbezahlbar wird, haben meine Frau und ich uns entschieden, die Stadt zu verlassen. Seit einem halben Jahr leben wir auf dem Land, in einem kleinen Dorf. Und ich muss sagen, wir bereuen unsere Entscheidung nicht. Natürlich müssen wir jetzt viel mehr das Auto benutzen als früher, aber im Gegensatz zu unserer Wohnung in der Stadt gibt es jetzt keine Parkplatzprobleme mehr, wir sind nicht mehr gezwungen, stundenlang einen Parkplatz suchen zu müssen. Toll ist hier die Ruhe auf dem Land, auch wenn mich die Hektik der Stadt nicht wirklich stört, aber es ist schon angenehm, in der Natur zu leben. Ich finde, Wohnen auf dem Land kann durchaus eine Alternative zu den hohen Mietkosten in den Städten sein.\n\n" +
"**b Julia**\nIch brauche Leben, kulturelle Angebote, kurze Wege zur Arbeit. Auf dem Land zu leben, wäre nichts für mich. Für mich ist es wichtig, in der Stadt zu wohnen, im Zentrum. Was mir in unserem Haus vor allem gefällt, ist der gute Kontakt zu den Nachbarn. Bei uns gibt es einen großen Hof, im Sommer grillen wir oft oder sitzen zusammen und plaudern. Vor Kurzem wurde unser Haus saniert, es wurde außen komplett isoliert und wir bekamen neue Fenster und Türen. All das hat zu einer höheren Miete geführt. Dagegen steht aber, dass die Kosten für Strom und Gas gesunken sind. Und Umbaumaßnahmen, die die Wohnung ökologischer machen und bei denen man auch noch Geld spart, finde ich sehr sinnvoll. Dafür zahle ich dann auch gern etwas mehr. Sparen kann man ja bei den Möbeln und der Einrichtung. Man muss nicht immer das Teuerste anschaffen.\n\n" +
"**c Katja**\nIch habe eine relativ günstige Wohnung. Trotzdem gebe ich das meiste Geld für Wohnen aus. Und das finde ich in Ordnung. Wenn ich den ganzen Tag bei der Arbeit war, brauche ich in meiner freien Zeit eine schöne Umgebung, in der ich mich wohlfühle. Und dazu gehören schöne, bequeme Möbel und schöne Farben. Ich war sogar bei einer Einrichtungsberaterin, die mir Tipps gegeben hat, wie ich meine Zimmer schön gestalten kann. Super ist auch, dass die Wohnung am Stadtrand liegt, es gibt hier kaum Verkehr. Da ich eine sehr stressige Arbeit habe, sind in meiner Freizeit Erholung und Ruhe für mich sehr wichtig. Deswegen bin ich auch an den Stadtrand gezogen. Das Leben hier ist wirklich eine Alternative zum hektischen Stadtleben.\n\n" +
"**d Ricardo**\nIch werde bald 65 und möchte mich über Wohnprojekte im Alter informieren oder über Mehrgenerationenhäuser. Denn am wichtigsten ist für mich der Kontakt zu den Mitmenschen im Haus. Und im Alter alleine zu sein, das macht mir Angst. Wohnen war für mich nie so wichtig, aber jetzt im Alter wird sich das für mich ändern. Nach wie vor bin ich aber der Meinung, dass in Deutschland Wohnen eine zu große Rolle spielt. Es gibt so viele Zeitschriften mit Einrichtungstipps, immer soll man neue teure Möbel kaufen, auf die neuesten Einrichtungstrends achten. Etwas Luxus brauche auch ich, aber man muss es ja nicht übertreiben. Vielleicht wird in Deutschland für Wohnen so viel Geld ausgegeben, weil aufgrund des schlechten Wetters die Leute hier sehr viel zu Hause sind. In meiner alten Heimat, Spanien, war Wohnen natürlich auch wichtig, aber man traf sich nicht so oft in der Wohnung, sondern draußen, auf der Straße, in Cafés." };

const T2 = { type: "text", title: "Teil 2 — Die Geschichte des Fahrrads", content:
"Sie lesen in einer Zeitschrift einen Artikel über die Geschichte des Fahrrads. Welche Sätze passen in die Lücken? Zwei Sätze passen nicht. (Die Sätze a–h stehen unten bei den Antwortmöglichkeiten.)\n\n" +
"**Die Geschichte des Fahrrads — Eine Reise in die Vergangenheit und Zukunft**\n\n" +
"Noch nie war Radfahren in Deutschland so beliebt. So werden jährlich über vier Millionen neue Fahrräder verkauft, wobei man den Umsatz an Fahrrädern mit Elektroantrieb, den E-Bikes, nicht vergessen darf, der kontinuierlich ansteigt. Aber wie hat die Geschichte des Fahrrads eigentlich begonnen? __(0)__\n\n" +
"Wer es sich damals leisten konnte, war mit dem Pferd unterwegs. Doch Pferde mussten gefüttert werden und aufgrund sehr schlechter Ernten war Futter für die Pferde teuer und knapp. 1817 entwickelte der Karlsruher Karl Drais eine Laufmaschine mit zwei Rädern, aber noch ohne Pedale. __(10)__ Jetzt konnte man ganz ohne Pferdekraft 15 Kilometer in einer Stunde zurücklegen.\n\n" +
"40 Jahre später wurde der Pedalantrieb erfunden, gefolgt von den Hochrädern, Fahrrädern mit einem riesigen Vorderrad und einem kleinen Hinterrad. Durch die unterschiedliche Größe der Räder wurde es möglich, mit einer Trittbewegung eine viel größere Strecke zurückzulegen. Aber man musste schon sehr geübt sein, um mit diesen Rädern fahren zu können. __(11)__ Durch die Entwicklung des Kettenantriebs wurde das Ende dieser Hochräder eingeläutet. Jetzt war es möglich, Vorder- und Hinterrad gleich groß anzufertigen und trotzdem schnell voranzukommen. Zu dieser Zeit war das Fahrrad alles andere als ein Massenartikel. Für die meisten Menschen war es unbezahlbar.\n\n" +
"__(12)__ Die Arbeiter mussten zu den Fabriken kommen können, und das Fahrrad wurde immer beliebter. Durch die Fließbandfertigung konnte die Stückzahl der hergestellten Fahrräder beträchtlich gesteigert werden. __(13)__ Die Begeisterung für das Radfahren änderte sich in den 1950er-Jahren, als sich Deutschland zum Autoland entwickelte, denn zum Wirtschaftswunder gehörte es, im Besitz eines eigenen Volkswagens zu sein.\n\n" +
"Nach den Ölkrisen in den 1970er-Jahren und einem zunehmenden Bewusstsein für die Ökologie erlebte das Fahrrad seinen zweiten Boom. Immer mehr Radwege wurden angelegt. __(14)__ Die Entwicklung schneller und sicherer Radschnellwege, durch die mehrere Hundert Kilometer voneinander entfernte Städte miteinander verbunden werden, steckt noch in den Anfängen.\n\n" +
"Und die Zukunft des Fahrrads? Man ist sich ziemlich sicher, dass aus dem Fahrrad ein Smart-Bike werden wird: ein Fahrrad, das mit einem Navigationssystem versehen und durch Apps mit zahlreichen Funktionen vernetzt ist. __(15)__ Nicht nur für Fahrräder, auch für E-Bikes.\n\n" +
"*Beispiel (0): „Gehen wir 200 Jahre zurück.“*" };

const T3 = { type: "text", title: "Teil 3 — Retro-Trend: Gefühl durch Vinyl", content:
"Sie lesen in einer Zeitung einen Artikel über Produkte aus vergangenen Zeiten, die heute wieder in Mode kommen. Wählen Sie bei jeder Aufgabe die richtige Lösung.\n\n" +
"**Retro-Trend: Gefühl durch Vinyl**\n\n" +
"Mit einem Smartphone kann der Konsument von heute alles machen – Musik abspielen, Fotografieren, Nachrichten oder ganze Bücher lesen. Und doch stillt das kleine Gerät längst nicht die Bedürfnisse aller Konsumenten.\n\n" +
"Technik-Fan Brandon Salt testet auf seinem YouTube-Kanal etwas, das wie eine Schreibmaschine klingt. Doch tatsächlich bearbeiten seine Finger hier eine kabellose Computertastatur in mattem Schwarz und mit roten Tasten, die über Bluetooth mit einem Rechner verbunden ist. Und das findet er toll. Modernste Technik, verbunden mit dem Design, Klang und Gefühl einer längst vergangenen Zeit.\n\n" +
"Nostalgie ist ein Trend, mit dem sich momentan viel Geld verdienen lässt: Unternehmen bieten Produkte im Design aus alten Tagen an. Oder sie verkaufen Produkte, die wirklich aus einem anderen Jahrzehnt stammen: Schallplatten, Polaroid-Kameras, Notizbücher, Bücher. Noch nie war „analog“ so angesagt. Der Verkauf von Schallplatten ist zum Beispiel seit neun Jahren in Folge gestiegen. Knapp die Hälfte der Käufer von Vinyl-Schallplatten im Jahr 2016 war 35 Jahre alt oder jünger.\n\n" +
"Doch ein Teenager kann beim Abspielen von Platten keine Nostalgie empfinden. Andersrum sind viele ältere Konsumenten sehr froh über ihren e-Book-Reader, mit dem sie die Schrift vergrößern können. Was steckt also dahinter? „Wenn du konsumierst, dann drückst du deine Identität aus“, sagt Konsumentenforscherin Daphne Kasriel-Alexander. In einer digitalen Welt sei das Analoge das Besondere, das Faszinierende. Junge Menschen wollten individuell sein, nicht mehr mitschwimmen, sondern aus dem Mainstream herausstechen.\n\n" +
"Doch es gibt noch einen weiteren Grund. In der Welt des Scrollens und Wischens wollen sich Konsumenten wieder mehr mit Produkten zum Fühlen und Riechen umgeben. „Im Digitalen hast du nur zwei Dimensionen und durch die kannst du scrollen“, sagt David Sax, Autor des Buches „Die Rache der Analogen“. Das vergleicht er mit einem Besuch im Plattenladen oder in der Buchhandlung. Dort könne man die Sachen anfassen, riechen, mit Leuten reden.\n\n" +
"Zu diesen emotionalen Motiven kommt laut Sax noch ein handfestes hinzu: Produktivität. In der digitalen Welt lauern viele Ablenkungen. Auf dem Handy blinken allerlei WhatsApp-Nachrichten, und das alle paar Minuten, wenn man eigentlich arbeiten will oder lesen will. Inzwischen gibt es bereits Telefone, mit denen nur telefoniert und Nachrichten geschrieben werden können: zurück zur Einfachheit.\n\n" +
"Und zurück zur Einfachheit wollen offenbar vor allem Menschen unter 35, die im digitalen Zeitalter aufgewachsen sind, sagt Sax. Und die machen einen Großteil der Konsumenten aus. In den USA zählen 80 Millionen Menschen zu den sogenannten Millenials, die zwischen 1980 und 2000 geboren wurden. Damit repräsentieren sie ein Viertel der gesamten amerikanischen Bevölkerung mit einer Kaufkraft von 200 Milliarden Dollar im Jahr." };

const T4 = { type: "text", title: "Teil 4 — Umweltschutz durch weniger Plastik", content:
"Sie lesen in einer Zeitschrift verschiedene Meinungsäußerungen zu einem Umweltproblem. Welche Äußerung passt zu welcher Überschrift? Eine Äußerung passt nicht. Die Äußerung a ist das Beispiel und kann nicht noch einmal verwendet werden.\n\n" +
"**a (Beispiel) — Patrick, Münster**\nEigentlich braucht man ein komplettes Verbot von Plastikverpackungen. Der Verbrauch von Plastiktüten nimmt aufgrund neuer Gesetze bereits ab – das ist sinnvoll, aber das reicht nicht. Auch die Hersteller müssen hier in die Pflicht genommen werden. Sonst ändert sich nicht wirklich etwas.\n\n" +
"**b — Andrea, Göttingen**\nWir Verbraucher haben es in der Hand. Wenn wir kein Plastik mehr verwenden, wird auch keines mehr hergestellt. Die Entwicklung eines ökologischen Bewusstseins beginnt in der Schule. Schulprojekte, die in diese Richtung gehen, müssen unbedingt gefördert werden.\n\n" +
"**c — Jens, Stuttgart**\nMan darf nicht vergessen, dass es neben Plastik auch noch andere Probleme gibt. Wenn es zum Beispiel keine Plastikverpackungen mehr gibt, benötigt man anderes Verpackungsmaterial. Und für Papier muss man Bäume fällen, das ist auch nicht gerade umweltfreundlich. Das Hauptproblem ist nicht die Verpackung, sondern unser Konsum.\n\n" +
"**d — Claudia, Frankfurt**\nWir wissen – denke ich – inzwischen alle, dass Plastik schädlich für die Umwelt ist. Hier hat bei den Verbrauchern schon ein Umdenken stattgefunden. Bei den Herstellern geht das langsamer, auf der anderen Seite ist Recycling aber auch schon ein riesiger Industriezweig geworden. Es ist halt immer dasselbe: Alles muss sich lohnen, auch der Umweltschutz.\n\n" +
"**e — Natalia, Zürich**\nWenn nicht mehr passiert, wird es in 30 Jahren in den Meeren mehr Plastik als Fische geben. Zum Glück arbeitet man an Techniken, diesen Plastikmüll aus den Meeren zu entfernen. Riesige Anlagen sind geplant, um ihn zu recyceln und erneut als Rohstoff zu verkaufen. Auch wenn das noch Zukunftsmusik ist: An dieser Entwicklung wird kein Weg vorbeigehen.\n\n" +
"**f — Mehmet, Klagenfurt**\nEs hat sich schon einiges getan: Der Verbrauch von Plastiktüten ist beträchtlich zurückgegangen. Ich denke aber, dass das daran liegt, dass diese heute in der Regel nicht mehr kostenlos ausgegeben werden. Aber wen schreckt eine Gebühr von 10 bis 20 Cent pro Tüte denn wirklich ab? Das sollte viel teurer sein.\n\n" +
"**g — Ewa, Magdeburg**\nKaum jemand will beim Einkaufen immer ein schlechtes Gewissen haben. Reduktion von Plastikverpackungen ist natürlich wichtig, aber auf freiwilliger Basis. Verbote gibt es schon genug, und sie funktionieren nicht. Vor allem, wer soll das kontrollieren?\n\n" +
"**h — Tobias, Köln**\nWichtig ist, dass wir Konsumenten aktiv werden. Inzwischen gibt es an vielen Orten Unverpackt-Läden, die alle Sachen ohne Verpackung verkaufen. Der Kunde bringt seine eigenen Behälter mit. Oder man kann sich Behälter ausleihen. An diesen Projekten kann man sehen, dass es nicht darum geht, weniger zu konsumieren, sondern anders." };

const T5 = { type: "text", title: "Teil 5 — Stadtbibliothek: Nutzungsbedingungen", content:
"Sie interessieren sich für die Angebote der Stadtbibliothek und lesen die Nutzungsbedingungen. Welche der Überschriften aus dem Inhaltsverzeichnis passen zu den Paragraphen? Vier Überschriften werden nicht gebraucht.\n\n" +
"**Inhaltsverzeichnis:** a Angebote für Kinder und Jugendliche · b Downloadbereich · c Öffnungszeiten der Bibliothek · d Gebühren · e Veranstaltungen · f Medienforum · g Ausleihfristen · h Verhaltensregeln\n\n" +
"**§ (Beispiel) — Lösung: d (Gebühren)**\nFür die Benutzung der Einrichtungen der Stadtbibliothek und das Ausleihen von Medien benötigt man einen Leseausweis, der 20,00 € pro Jahr kostet. Studenten zahlen einen ermäßigten Beitrag, Kinder und Jugendliche unter 18 Jahren können die Angebote der Bibliothek kostenlos benutzen.\n\n" +
"**§ 28**\nBücher dürfen vier Wochen, CDs und DVDs 14 Tage mit nach Hause genommen werden. Dieser Zeitraum kann verlängert werden, wenn das betreffende Medium (Buch, CD, DVD) nicht von einem anderen Nutzer vorbestellt ist. Bestimmte Medien (Zeitungen, Zeitschriften, Nachschlagewerke) dürfen die Bibliothek nicht verlassen.\n\n" +
"**§ 29**\nEs ist nicht erlaubt, Taschen und Ähnliches in die Bibliotheksräume mitzunehmen. Bitte benutzen Sie die Schließfächer am Haupteingang. An der Information können Sie für 1 Euro Tragetaschen erwerben, die in die Bücherei mitgenommen werden dürfen. In der Bücherei ist Essen und Trinken streng verboten. Im zweiten Stock steht Ihnen wochentags und samstags von 9 bis 18 Uhr eine Cafeteria zur Verfügung.\n\n" +
"**§ 30**\nDie Stadtbücherei bietet Ihnen sowohl im Haus wie auch online von zu Hause aus zahlreiche digitale Angebote zum Recherchieren, Arbeiten oder einfach, um sich zu informieren. Sie können auch elektronische Medien (E-Books, E-Video, E-Music) 14 Tage auf Ihren Computer herunterladen. Hierfür benötigen Sie ein Passwort, das Sie mit Ihrem Leseausweis erhalten." };

// ── Pitanja: [context, items, tekst pitanja, tačan index] ────────────────────
const Q = [
  // Teil 1 — matching a–d (osobe). Ključ: 1b 2d 3b 4c 5a 6d 7b 8c 9d
  [T1, P1, "Wer könnte auf Luxus beim Wohnen verzichten?", 1],
  [T1, P1, "Wer denkt, dass Wohnen oft überbewertet wird?", 3],
  [T1, P1, "Wer kann sich nicht vorstellen, auf dem Land zu wohnen?", 1],
  [T1, P1, "Wer hat zwar eine bezahlbare Wohnung, aber dennoch hohe Wohnkosten?", 2],
  [T1, P1, "Für wen ist ein Stellplatz für das Auto wichtig?", 0],
  [T1, P1, "Wer interessiert sich für alternative Wohnformen?", 3],
  [T1, P1, "Für wen sind sowohl Umweltschutz als auch bezahlbare Energiekosten wichtig?", 1],
  [T1, P1, "Wer wünscht sich unbedingt eine ruhige Wohnumgebung?", 2],
  [T1, P1, "Wer macht sich Sorgen um seine Zukunft?", 3],
  // Teil 2 — umetanje rečenica a–h. Ključ: 10d 11c 12f 13h 14e 15b
  [T2, S2, "Lücke 10 — Welcher Satz passt?", 3],
  [T2, S2, "Lücke 11 — Welcher Satz passt?", 2],
  [T2, S2, "Lücke 12 — Welcher Satz passt?", 5],
  [T2, S2, "Lücke 13 — Welcher Satz passt?", 7],
  [T2, S2, "Lücke 14 — Welcher Satz passt?", 4],
  [T2, S2, "Lücke 15 — Welcher Satz passt?", 1],
  // Teil 3 — a/b/c (tekst opcija u pitanju). Ključ: 16c 17c 18b 19c 20a 21c
  [T3, ABC, "Branden Salt ist begeistert, weil … a) er mit seiner alten Schreibmaschine weiter arbeiten kann. b) er sich technisches Wissen von früher angeeignet hat. c) es ihm Spaß macht, Altes mit Neuem zu kombinieren.", 2],
  [T3, ABC, "Woran kann man den Retrotrend erkennen? a) Es werden mehr Schallplatten verkauft als früher. b) Immer mehr Musiker veröffentlichen analog. c) Produkte aus vergangener Zeit finden großen Absatz.", 2],
  [T3, ABC, "Nach Auffassung von Frau Kasriel-Alexander … a) haben vor allem ältere Menschen Probleme mit der neuen Technik. b) ist für viele Verbraucher die digitale Welt zu unpersönlich geworden. c) lässt sich die Digitalisierung nicht aufhalten.", 1],
  [T3, ABC, "Der Nachteil des Online-Kaufs besteht nach Auffassung von David Sax darin, dass … a) er unsicher ist. b) es selten Kontakte zum Verkäufer gibt. c) keine Gefühle angesprochen werden.", 2],
  [T3, ABC, "Bei den Smartphones sieht Sax die Tendenz, dass … a) es Probleme mit der Konzentration geben kann. b) man nur noch telefoniert und Nachrichten schreibt. c) sie immer einfacher zu bedienen sein werden.", 0],
  [T3, ABC, "Das Bedürfnis nach einfacherer Technik zeigt sich heute in den USA … a) bei den meisten Konsumenten. b) bei Verbrauchern mit gutem Einkommen. c) hauptsächlich bei jüngeren Menschen.", 2],
  // Teil 4 — Überschrift → Äußerung (b–h). Ključ: 22g 23c 24f 25e 26b 27h
  [T4, A4, "Überschrift 22: „Zum Umweltschutz sollte keiner gezwungen werden.“ — Welche Äußerung passt?", 5],
  [T4, A4, "Überschrift 23: „Wichtig ist, den Verbrauch einzuschränken.“ — Welche Äußerung passt?", 1],
  [T4, A4, "Überschrift 24: „Wichtig ist, Umweltschutz auch über den Preis zu steuern.“ — Welche Äußerung passt?", 4],
  [T4, A4, "Überschrift 25: „Neue Methoden werden sicher bei der Wiederverwertung helfen.“ — Welche Äußerung passt?", 3],
  [T4, A4, "Überschrift 26: „Umweltschutz muss gelernt werden.“ — Welche Äußerung passt?", 0],
  [T4, A4, "Überschrift 27: „Umdenken beim Einkauf muss nicht Verzicht bedeuten.“ — Welche Äußerung passt?", 6],
  // Teil 5 — Paragraph → Überschrift (a–h). Ključ: 28g 29h 30b
  [T5, H5, "§ 28 — Welche Überschrift passt?", 6],
  [T5, H5, "§ 29 — Welche Überschrift passt?", 7],
  [T5, H5, "§ 30 — Welche Überschrift passt?", 1],
];

// ── Upis ─────────────────────────────────────────────────────────────────────
const { data: course } = await sb.from("courses").select("id").eq("slug", SLUG).single();
if (!course) throw new Error(`Kurs ${SLUG} ne postoji`);

console.log(`Kurs ${SLUG}: ${course.id} | pitanja: ${Q.length}`);
if (!APPLY) {
  // brza provera duplikata tačnih odgovora po Teil-u tipa matching (a–d u Teil1 sme da se ponavlja)
  console.log("[DRY] Lekcije koje bi nastale: 1) video, 2) Modelltest 1 (5 delova / 30 zadataka). Pokreni sa --apply.");
  process.exit(0);
}

// 1) Video lekcija (idempotentno po naslovu)
{
  const { data: ex } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", VIDEO_TITLE).maybeSingle();
  const payload = { course_id: course.id, title: VIDEO_TITLE, order_index: 0, lesson_type: "video", vimeo_video_id: VIDEO_ID,
    sections: [{ type: "badge", module: "Goethe-Zertifikat B2" }, { type: "video", vimeo_video_id: VIDEO_ID, title: VIDEO_TITLE },
      { type: "text", style: "info", content: "Pogledaj video pre nego što kreneš sa Modelltestovima — objašnjava strukturu Goethe-Zertifikat B2 ispita." }] };
  if (ex) { await sb.from("lessons").update(payload).eq("id", ex.id); console.log(`~ video lekcija ažurirana (${ex.id})`); }
  else { const { data: c } = await sb.from("lessons").insert(payload).select("id").single(); console.log(`+ video lekcija kreirana (${c.id})`); }
}

// 2) Modelltest 1 lekcija (idempotentno po naslovu)
let lessonId;
{
  const { data: ex } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", LESSON_TITLE).maybeSingle();
  const payload = { course_id: course.id, title: LESSON_TITLE, order_index: 1, lesson_type: "text",
    sections: [{ type: "badge", module: "Leseverstehen B2" },
      { type: "text", style: "info", content: "Modelltest Lesen (Goethe-Zertifikat B2), 5 delova / 30 zadataka. Tekst za čitanje stoji iznad pitanja u svakom delu." }] };
  if (ex) { lessonId = ex.id; await sb.from("lessons").update(payload).eq("id", ex.id); console.log(`~ Modelltest 1 lekcija ažurirana (${ex.id})`); }
  else { const { data: c } = await sb.from("lessons").insert(payload).select("id").single(); lessonId = c.id; console.log(`+ Modelltest 1 lekcija kreirana (${c.id})`); }
}

// 3) Vežba + pitanja
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
