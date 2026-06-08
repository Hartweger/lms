// Verbatim sadržaj Goethe-Zertifikat B2 — Modelltest 1 (Cornelsen Prüfungstraining, ISBN 9783061217754).
// Tekst doslovan iz PDF-a; tačni odgovori iz „Lösungen Modelltest 1". Bez Supabase logike — samo podaci.
// Shema:
//   LESEN/HOEREN: [{ teil, info, text?, audioFile?, questions: [{ q, items, correct }] }]
//     - items: niz opcija (stringovi), correct: index tačne (0-based)
//   SCHREIBEN/SPRECHEN: [{ teil, aufgabe }]
// OCR-ukrasne napomene iz knjige ("Sehen Sie sich den Test kurz an…") su izostavljene (nisu deo ispita).

const PERS = ["a — Holger", "b — Julia", "c — Katja", "d — Ricardo"];
const RF = ["richtig", "falsch"];

// ─────────────────────────────────────────────────────────── LESEN ───────────
const LESEN_T1_TEXT = `Wie wir wohnen …

a — Holger
Eigentlich war ich immer ein Stadtmensch. Da die Mieten für Wohnraum in den Städten immer mehr steigen und gutes Wohnen bald unbezahlbar wird, haben meine Frau und ich uns entschieden, die Stadt zu verlassen. Seit einem halben Jahr leben wir auf dem Land, in einem kleinen Dorf. Und ich muss sagen, wir bereuen unsere Entscheidung nicht. Natürlich müssen wir jetzt viel mehr das Auto benutzen als früher, aber im Gegensatz zu unserer Wohnung in der Stadt gibt es jetzt keine Parkplatzprobleme mehr, wir sind nicht mehr gezwungen, stundenlang einen Parkplatz suchen zu müssen. Toll ist hier die Ruhe auf dem Land, auch wenn mich die Hektik der Stadt nicht wirklich stört, aber es ist schon angenehm, in der Natur zu leben. Ich finde, Wohnen auf dem Land kann durchaus eine Alternative zu den hohen Mietkosten in den Städten sein.

b — Julia
Ich brauche Leben, kulturelle Angebote, kurze Wege zur Arbeit. Auf dem Land zu leben, wäre nichts für mich. Für mich ist es wichtig, in der Stadt zu wohnen, im Zentrum. Was mir in unserem Haus vor allem gefällt, ist der gute Kontakt zu den Nachbarn. Bei uns gibt es einen großen Hof, im Sommer grillen wir oft oder sitzen zusammen und plaudern. Vor Kurzem wurde unser Haus saniert, es wurde außen komplett isoliert und wir bekamen neue Fenster und Türen. All das hat zu einer höheren Miete geführt. Dagegen steht aber, dass die Kosten für Strom und Gas gesunken sind. Und Umbaumaßnahmen, die die Wohnung ökologischer machen und bei denen man auch noch Geld spart, finde ich sehr sinnvoll. Dafür zahle ich dann auch gern etwas mehr. Sparen kann man ja bei den Möbeln und der Einrichtung. Man muss nicht immer das Teuerste anschaffen.

c — Katja
Ich habe eine relativ günstige Wohnung. Trotzdem gebe ich das meiste Geld für Wohnen aus. Und das finde ich in Ordnung. Wenn ich den ganzen Tag bei der Arbeit war, brauche ich in meiner freien Zeit eine schöne Umgebung, in der ich mich wohlfühle. Und dazu gehören schöne, bequeme Möbel und schöne Farben. Ich war sogar bei einer Einrichtungsberaterin, die mir Tipps gegeben hat, wie ich meine Zimmer schön gestalten kann. Super ist auch, dass die Wohnung am Stadtrand liegt, es gibt hier kaum Verkehr. Da ich eine sehr stressige Arbeit habe, sind in meiner Freizeit Erholung und Ruhe für mich sehr wichtig. Deswegen bin ich auch an den Stadtrand gezogen. Das Leben hier ist wirklich eine Alternative zum hektischen Stadtleben.

d — Ricardo
Ich werde bald 65 und möchte ich mich über Wohnprojekte im Alter informieren oder über Mehrgenerationenhäuser. Denn am wichtigsten ist für mich der Kontakt zu den Mitmenschen im Haus. Und im Alter alleine zu sein, das macht mir Angst. Wohnen war für mich nie so wichtig, aber jetzt im Alter wird sich das für mich ändern. Nach wie vor bin ich aber der Meinung, dass in Deutschland Wohnen eine zu große Rolle spielt. Es gibt so viele Zeitschriften mit Einrichtungstipps, immer soll man neue teure Möbel kaufen, auf die neuesten Einrichtungstrends achten. Etwas Luxus brauche auch ich, aber man muss es ja nicht übertreiben. Vielleicht wird in Deutschland für Wohnen so viel Geld ausgegeben, weil aufgrund des schlechten Wetters die Leute hier sehr viel zu Hause sind. In meiner alten Heimat, Spanien, war Wohnen natürlich auch wichtig, aber man traf sich nicht so oft in der Wohnung, sondern draußen, auf der Straße, in Cafés.`;

const LESEN_T2_TEXT = `Die Geschichte des Fahrrads — Eine Reise in die Vergangenheit und Zukunft

Noch nie war Radfahren in Deutschland so beliebt. So werden jährlich über vier Millionen neue Fahrräder verkauft, wobei man den Umsatz an Fahrrädern mit Elektroantrieb, den E-Bikes, nicht vergessen darf, der kontinuierlich ansteigt. Aber wie hat die Geschichte des Fahrrads eigentlich begonnen? __(0)__

Wer es sich damals leisten konnte, war mit dem Pferd unterwegs. Doch Pferde mussten gefüttert werden und aufgrund sehr schlechter Ernten war Futter für die Pferde teuer und knapp. 1817 entwickelte der Karlsruher Karl Drais eine Laufmaschine mit zwei Rädern, aber noch ohne Pedale. __(10)__ Jetzt konnte man ganz ohne Pferdekraft 15 Kilometer in einer Stunde zurücklegen.

40 Jahre später wurde der Pedalantrieb erfunden, gefolgt von den Hochrädern, Fahrrädern mit einem riesigen Vorderrad und einem kleinen Hinterrad. Durch die unterschiedliche Größe der Räder wurde es möglich, mit einer Trittbewegung eine viel größere Strecke zurückzulegen. Aber man musste schon sehr geübt sein, um mit diesen Rädern fahren zu können. __(11)__ Durch die Entwicklung des Kettenantriebs wurde das Ende dieser Hochräder eingeläutet. Jetzt war es möglich, Vorder- und Hinterrad gleich groß anzufertigen und trotzdem schnell voranzukommen. Zu dieser Zeit war das Fahrrad alles andere als ein Massenartikel. Für die meisten Menschen war es unbezahlbar. __(12)__ Die Arbeiter mussten zu den Fabriken kommen können, und das Fahrrad wurde immer beliebter. Durch die Fließbandfertigung konnte die Stückzahl der hergestellten Fahrräder beträchtlich gesteigert werden. __(13)__ Die Begeisterung für das Radfahren änderte sich in den 1950er-Jahren, als sich Deutschland zum Autoland entwickelte, denn zum Wirtschaftswunder gehörte es, im Besitz eines eigenen Volkswagens zu sein.

Nach den Ölkrisen in den 1970er-Jahren und einem zunehmenden Bewusstsein für die Ökologie erlebte das Fahrrad seinen zweiten Boom. Immer mehr Radwege wurden angelegt. __(14)__ Die Entwicklung schneller und sicherer Radschnellwege, durch die mehrere Hundert Kilometer voneinander entfernte Städte miteinander verbunden werden, steckt noch in den Anfängen.

Und die Zukunft des Fahrrads? Man ist sich ziemlich sicher, dass aus dem Fahrrad ein Smart-Bike werden wird: ein Fahrrad, das mit einem Navigationssystem versehen und durch Apps mit zahlreichen Funktionen vernetzt ist. __(15)__ Nicht nur für Fahrräder, auch für E-Bikes.

Sätze (Beispiel 0: „Gehen wir 200 Jahre zurück.“):
a) Deshalb wird diese Entwicklung auch kritisch gesehen.
b) Und es wird immer mehr Ausleihsysteme geben.
c) Denn sie waren sehr unsicher und gefährlich.
d) Der Fahrer saß auf dem Rahmen und bewegte sich mithilfe seiner Beine.
e) Trotzdem muss hier noch einiges getan werden.
f) Im 20. Jahrhundert wurde Mobilität immer wichtiger.
g) Die Menschen wollten auf ihr Auto nicht verzichten.
h) Dadurch konnten auch die Preise sinken.`;

const T2_ITEMS = [
  "a) Deshalb wird diese Entwicklung auch kritisch gesehen.",
  "b) Und es wird immer mehr Ausleihsysteme geben.",
  "c) Denn sie waren sehr unsicher und gefährlich.",
  "d) Der Fahrer saß auf dem Rahmen und bewegte sich mithilfe seiner Beine.",
  "e) Trotzdem muss hier noch einiges getan werden.",
  "f) Im 20. Jahrhundert wurde Mobilität immer wichtiger.",
  "g) Die Menschen wollten auf ihr Auto nicht verzichten.",
  "h) Dadurch konnten auch die Preise sinken.",
];

const LESEN_T3_TEXT = `Retro-Trend: Gefühl durch Vinyl

Mit einem Smartphone kann der Konsument von heute alles machen – Musik abspielen, Fotografieren, Nachrichten oder ganze Bücher lesen. Und doch stillt das kleine Gerät längst nicht die Bedürfnisse aller Konsumenten.

Technik-Fan Brandon Salt testet auf seinem YouTube-Kanal etwas, das wie eine Schreibmaschine klingt. Doch tatsächlich bearbeiten seine Finger hier eine kabellose Computertastatur in mattem Schwarz und mit roten Tasten, die über Bluetooth mit einem Rechner verbunden ist. Und das findet er toll. Modernste Technik, verbunden mit dem Design, Klang und Gefühl einer längst vergangenen Zeit.

Nostalgie ist ein Trend, mit dem sich momentan viel Geld verdienen lässt: Unternehmen bieten Produkte im Design aus alten Tagen an. Oder sie verkaufen Produkte, die wirklich aus einem anderen Jahrzehnt stammen: Schallplatten, Polaroid-Kameras, Notizbücher, Bücher. Noch nie war „analog“ so angesagt. Der Verkauf von Schallplatten ist zum Beispiel seit neun Jahren in Folge gestiegen. Knapp die Hälfte der Käufer von Vinyl-Schallplatten im Jahr 2016 war 35 Jahre alt oder jünger.

Doch ein Teenager kann beim Abspielen von Platten keine Nostalgie empfinden. Andersrum sind viele ältere Konsumenten sehr froh über ihren e-Book-Reader, mit dem sie die Schrift vergrößern können. Was steckt also dahinter? „Wenn du konsumierst, dann drückst du deine Identität aus“, sagt Konsumentenforscherin Daphne Kasriel-Alexander. In einer digitalen Welt sei das Analoge das Besondere, das Faszinierende. Junge Menschen wollten individuell sein, nicht mehr mitschwimmen, sondern aus dem Mainstream herausstechen.

Doch es gibt noch einen weiteren Grund. In der Welt des Scrollens und Wischens wollen sich Konsumenten wieder mehr mit Produkten zum Fühlen und Riechen umgeben. „Im Digitalen hast du nur zwei Dimensionen und durch die kannst du scrollen“, sagt David Sax, Autor des Buches „Die Rache des Analogen“. Das vergleicht er mit einem Besuch im Plattenladen oder in der Buchhandlung. Dort könne man die Sachen anfassen, riechen, mit Leuten reden.

Zu diesen emotionalen Motiven kommt laut Sax noch ein handfestes hinzu: Produktivität. In der digitalen Welt lauern viele Ablenkungen. Auf dem Handy blinken allerlei WhatsApp-Nachrichten, und das alle paar Minuten, wenn ich eigentlich fokussiert arbeiten oder lesen will. Inzwischen gibt es bereits Telefone, mit denen nur telefoniert und Nachrichten geschrieben werden können: zurück zur Einfachheit.

Und zurück zur Einfachheit wollen offenbar vor allem Menschen unter 35, die im digitalen Zeitalter aufgewachsen sind, sagt Sax. Und die machen einen Großteil der Konsumenten aus. In den USA zählen 80 Millionen Menschen zu den sogenannten Millenials, die zwischen 1980 und 2000 geboren wurden. Damit repräsentieren sie ein Viertel der gesamten amerikanischen Bevölkerung mit einer Kaufkraft von 200 Milliarden Dollar im Jahr.`;

const LESEN_T4_TEXT = `Umweltschutz durch weniger Plastik — Meinungsäußerungen

a) Eigentlich braucht man ein komplettes Verbot von Plastikverpackungen. Der Verbrauch von Plastiktüten nimmt aufgrund neuer Gesetze bereits ab – das ist sinnvoll, aber das reicht nicht. Auch die Hersteller müssen hier in die Pflicht genommen werden. Sonst ändert sich nicht wirklich etwas. (Patrick, Münster)

b) Wir Verbraucher haben es in der Hand. Wenn wir kein Plastik mehr verwenden, wird auch keines mehr hergestellt. Die Entwicklung eines ökologischen Bewusstseins beginnt in der Schule. Schulprojekte, die in diese Richtung gehen, müssen unbedingt gefördert werden. (Andrea, Göttingen)

c) Man darf nicht vergessen, dass es neben Plastik auch noch andere Probleme gibt. Wenn es zum Beispiel keine Plastikverpackungen mehr gibt, benötigt man anderes Verpackungsmaterial. Und für Papier muss man Bäume fällen, das ist auch nicht gerade umweltfreundlich. Das Hauptproblem ist nicht die Verpackung, sondern unser Konsum. (Jens, Stuttgart)

d) Wir wissen – denke ich – inzwischen alle, dass Plastik schädlich für die Umwelt ist. Hier hat bei den Verbrauchern schon ein Umdenken stattgefunden. Bei den Herstellern geht das langsamer, auf der anderen Seite ist Recycling aber auch schon ein riesiger Industriezweig geworden. Es ist halt immer dasselbe: Alles muss sich lohnen, auch der Umweltschutz. (Claudia, Frankfurt)

e) Wenn nicht mehr passiert, wird es in 30 Jahren in den Meeren mehr Plastik als Fische geben. Zum Glück arbeitet man an Techniken, diesen Plastikmüll aus den Meeren zu entfernen. Riesige Anlagen sind geplant, um ihn zu recyceln und erneut als Rohstoff zu verkaufen. Auch wenn das noch Zukunftsmusik ist: An dieser Entwicklung wird kein Weg vorbeigehen. (Natalia, Zürich)

f) Es hat sich schon einiges getan: Der Verbrauch von Plastiktüten ist beträchtlich zurückgegangen. Ich denke aber weniger, dass das daran liegt, dass diese heute in der Regel nicht mehr kostenlos ausgegeben werden. Aber wen schreckt eine Gebühr von 10 bis 20 Cent pro Tüte denn wirklich ab? Das sollte viel teurer sein. (Mehmet, Klagenfurt)

g) Kaum jemand will beim Einkaufen immer ein schlechtes Gewissen haben. Reduktion von Plastikverpackungen ist natürlich wichtig, aber auf freiwilliger Basis. Verbote gibt es schon genug, und sie funktionieren nicht. Vor allem, wer soll das kontrollieren? (Ewa, Magdeburg)

h) Wichtig ist, dass wir Konsumenten aktiv werden. Inzwischen gibt es an vielen Orten Unverpackt-Läden, die alle Sachen ohne Verpackung verkaufen. Der Kunde bringt seine eigenen Behälter mit. Oder man kann sich Behälter ausleihen. An diesen Projekten kann man sehen, dass es nicht darum geht, weniger zu konsumieren, sondern anders. (Tobias, Köln)`;

const T4_ITEMS = ["a — Patrick", "b — Andrea", "c — Jens", "d — Claudia", "e — Natalia", "f — Mehmet", "g — Ewa", "h — Tobias"];

const LESEN_T5_TEXT = `STADTBIBLIOTHEK — Nutzungsbedingungen

Inhaltsverzeichnis:
a) Angebote für Kinder und Jugendliche
b) Downloadbereich
c) Öffnungszeiten der Bibliothek
d) Gebühren
e) Veranstaltungen
f) Medienforum
g) Ausleihfristen
h) Verhaltensregeln

§ (Beispiel 0)
Für die Benutzung der Einrichtungen der Stadtbibliothek und das Ausleihen von Medien benötigt man einen Leseausweis, der 20,00 € pro Jahr kostet. Studenten zahlen einen ermäßigten Beitrag, Kinder und Jugendliche unter 18 Jahren können die Angebote der Bibliothek kostenlos benutzen.

§ 28
Bücher dürfen vier Wochen, CDs und DVDs 14 Tage mit nach Hause genommen werden. Dieser Zeitraum kann verlängert werden, wenn das betreffende Medium (Buch, CD, DVD) nicht von einem anderen Nutzer vorbestellt ist. Bestimmte Medien (Zeitungen, Zeitschriften, Nachschlagewerke) dürfen die Bibliothek nicht verlassen.

§ 29
Es ist nicht erlaubt, Taschen und Ähnliches in die Bibliotheksräume mitzunehmen. Bitte benutzen Sie die Schließfächer am Haupteingang. An der Information können Sie für 1 Euro Tragetaschen erwerben, die in die Bücherei mitgenommen werden dürfen. In der Bücherei ist Essen und Trinken streng verboten. Im zweiten Stock steht Ihnen wochentags und samstags von 9 bis 18 Uhr eine Cafeteria zur Verfügung.

§ 30
Die Stadtbücherei bietet Ihnen sowohl im Haus wie auch online von zu Hause aus zahlreiche digitale Angebote zum Recherchieren, Arbeiten oder einfach, um sich zu informieren. Sie können auch elektronische Medien (E-Books, E-Video, E-Music) 14 Tage auf Ihren Computer herunterladen. Hierfür benötigen Sie ein Passwort, das Sie mit Ihrem Leseausweis erhalten.`;

const T5_ITEMS = [
  "a) Angebote für Kinder und Jugendliche",
  "b) Downloadbereich",
  "c) Öffnungszeiten der Bibliothek",
  "d) Gebühren",
  "e) Veranstaltungen",
  "f) Medienforum",
  "g) Ausleihfristen",
  "h) Verhaltensregeln",
];

export const LESEN = [
  {
    teil: 1,
    info: "Lesen Teil 1 · Arbeitszeit: 18 Minuten. Sie lesen in einem Forum, wie Menschen über ihre Wohnsituation und Wohnformen denken. Auf welche der vier Personen treffen die einzelnen Aussagen zu? Die Personen können mehrmals gewählt werden.",
    text: LESEN_T1_TEXT,
    questions: [
      { q: "Beispiel: Wer findet, dass die Mieten in den Städten zu hoch sind?", items: PERS, correct: 0 },
      { q: "Wer könnte auf Luxus beim Wohnen verzichten?", items: PERS, correct: 1 },
      { q: "Wer denkt, dass Wohnen oft überbewertet wird?", items: PERS, correct: 3 },
      { q: "Wer kann sich nicht vorstellen, auf dem Land zu wohnen?", items: PERS, correct: 1 },
      { q: "Wer hat zwar eine bezahlbare Wohnung, aber dennoch hohe Wohnkosten?", items: PERS, correct: 2 },
      { q: "Für wen ist ein Stellplatz für das Auto wichtig?", items: PERS, correct: 0 },
      { q: "Wer interessiert sich für alternative Wohnformen?", items: PERS, correct: 3 },
      { q: "Für wen sind sowohl Umweltschutz als auch bezahlbare Energiekosten wichtig?", items: PERS, correct: 1 },
      { q: "Wer wünscht sich unbedingt eine ruhige Wohnumgebung?", items: PERS, correct: 2 },
      { q: "Wer macht sich Sorgen um seine Zukunft?", items: PERS, correct: 3 },
    ],
  },
  {
    teil: 2,
    info: "Lesen Teil 2 · Arbeitszeit: 12 Minuten. Sie lesen in einer Zeitschrift einen Artikel über die Geschichte des Fahrrads. Welche Sätze passen in die Lücken? Zwei Sätze passen nicht.",
    text: LESEN_T2_TEXT,
    questions: [
      { q: "Welcher Satz passt in Lücke 10?", items: T2_ITEMS, correct: 3 },
      { q: "Welcher Satz passt in Lücke 11?", items: T2_ITEMS, correct: 2 },
      { q: "Welcher Satz passt in Lücke 12?", items: T2_ITEMS, correct: 5 },
      { q: "Welcher Satz passt in Lücke 13?", items: T2_ITEMS, correct: 7 },
      { q: "Welcher Satz passt in Lücke 14?", items: T2_ITEMS, correct: 4 },
      { q: "Welcher Satz passt in Lücke 15?", items: T2_ITEMS, correct: 1 },
    ],
  },
  {
    teil: 3,
    info: "Lesen Teil 3 · Arbeitszeit: 12 Minuten. Sie lesen in einer Zeitung einen Artikel über Produkte aus vergangenen Zeiten, die heute wieder in Mode kommen. Wählen Sie bei jeder Aufgabe die richtige Lösung.",
    text: LESEN_T3_TEXT,
    questions: [
      { q: "Beispiel: Viele Verbraucher …", items: ["fotografieren nur noch mit dem Smartphone.", "sind mit den Möglichkeiten des Smartphones zufrieden.", "vermissen bei ihrem Smartphone etwas."], correct: 2 },
      { q: "Branden Salt ist begeistert, weil …", items: ["er mit seiner alten Schreibmaschine weiter arbeiten kann.", "er sich technisches Wissen von früher angeeignet hat.", "es ihm Spaß macht, Altes mit Neuem zu kombinieren."], correct: 2 },
      { q: "Woran kann man den Retrotrend erkennen?", items: ["Es werden mehr Schallplatten verkauft als früher.", "Immer mehr Musiker veröffentlichen analog.", "Produkte aus vergangener Zeit finden großen Absatz."], correct: 2 },
      { q: "Nach Auffassung von Frau Kasriel-Alexander …", items: ["haben vor allem ältere Menschen Probleme mit der neuen Technik.", "ist für viele Verbraucher die digitale Welt zu unpersönlich geworden.", "lässt sich die Digitalisierung nicht aufhalten."], correct: 1 },
      { q: "Der Nachteil des Online-Kaufs besteht nach Auffassung von David Sax darin, dass …", items: ["er unsicher ist.", "es selten Kontakte zum Verkäufer gibt.", "keine Gefühle angesprochen werden."], correct: 2 },
      { q: "Bei den Smartphones sieht Sax die Tendenz, dass …", items: ["es Probleme mit der Konzentration geben kann.", "man nur noch telefoniert und Nachrichten schreibt.", "sie immer einfacher zu bedienen sein werden."], correct: 0 },
      { q: "Das Bedürfnis nach einfacherer Technik zeigt sich heute in den USA …", items: ["bei den meisten Konsumenten.", "bei Verbrauchern mit gutem Einkommen.", "hauptsächlich bei jüngeren Menschen."], correct: 2 },
    ],
  },
  {
    teil: 4,
    info: "Lesen Teil 4 · Arbeitszeit: 12 Minuten. Sie lesen in einer Zeitschrift verschiedene Meinungsäußerungen zu einem Umweltproblem. Welche Äußerung passt zu welcher Überschrift? Eine Äußerung passt nicht. Die Äußerung a ist das Beispiel und kann nicht noch einmal verwendet werden.",
    text: LESEN_T4_TEXT,
    questions: [
      { q: "Beispiel: Verbraucher und Industrie müssen aktiv werden", items: T4_ITEMS, correct: 0 },
      { q: "Zum Umweltschutz sollte keiner gezwungen werden", items: T4_ITEMS, correct: 6 },
      { q: "Wichtig ist, den Verbrauch einzuschränken", items: T4_ITEMS, correct: 2 },
      { q: "Wichtig ist, Umweltschutz auch über den Preis zu steuern", items: T4_ITEMS, correct: 5 },
      { q: "Neue Methoden werden sicher bei der Wiederverwertung helfen", items: T4_ITEMS, correct: 4 },
      { q: "Umweltschutz muss gelernt werden", items: T4_ITEMS, correct: 1 },
      { q: "Umdenken beim Einkauf muss nicht Verzicht bedeuten", items: T4_ITEMS, correct: 7 },
    ],
  },
  {
    teil: 5,
    info: "Lesen Teil 5 · Arbeitszeit: 6 Minuten. Sie interessieren sich für die Angebote der Stadtbibliothek und lesen die Nutzungsbedingungen. Welche der Überschriften aus dem Inhaltsverzeichnis passen zu den Paragraphen? Vier Überschriften werden nicht gebraucht.",
    text: LESEN_T5_TEXT,
    questions: [
      { q: "Beispiel (Absatz über Leseausweis/Gebühren)", items: T5_ITEMS, correct: 3 },
      { q: "Welche Überschrift passt zu § 28?", items: T5_ITEMS, correct: 6 },
      { q: "Welche Überschrift passt zu § 29?", items: T5_ITEMS, correct: 7 },
      { q: "Welche Überschrift passt zu § 30?", items: T5_ITEMS, correct: 1 },
    ],
  },
];

// ─────────────────────────────────────────────────────────── HÖREN ───────────
// Audio mapiranje (iz trajanja, potvrditi slušanjem): 02→Teil1, 03→Teil2, 04→Teil3, 05→Teil4.
// 01.mp3 = opšti uvod/Beispiel (ne koristi se kao Teil audio).
const ABC2 = (a, b, c) => [a, b, c];

export const HOEREN = [
  {
    teil: 1,
    info: "Hören Teil 1. Sie hören fünf Gespräche und Äußerungen. Sie hören jeden Text einmal. Zu jedem Text lösen Sie zwei Aufgaben. Wählen Sie bei jeder Aufgabe die richtige Lösung.",
    audioFile: "9783061217754_Goethe-Zertifikat_B2_02.mp3",
    questions: [
      { q: "Beispiel 01: Der Mann interessiert sich für einen Sprachkurs.", items: RF, correct: 1 },
      { q: "Beispiel 02: Wenn man einen Sprachkurs machen möchte, sollte man …", items: ABC2("im Internet einen Platz reservieren.", "jetzt schon die Beratung besuchen.", "sich am 31. August anmelden."), correct: 1 },
      { q: "1. Die Frau soll im Innen- und Außendienst arbeiten.", items: RF, correct: 0 },
      { q: "2. Die Frau hat große Lust, …", items: ABC2("auch in ihrer Freizeit Projekte zu entwickeln.", "Kunden zu empfangen.", "selbstständig zu arbeiten."), correct: 2 },
      { q: "3. Die Freunde unterhalten sich über Vor- und Nachteile der Online-Kommunikation.", items: RF, correct: 0 },
      { q: "4. Beide finden es wichtig, …", items: ABC2("bei der Weitergabe von persönlichen Daten aufzupassen.", "Freunde persönlich zu treffen.", "im Internet Hilfe für Klausuren zu suchen."), correct: 0 },
      { q: "5. Die Frau interessiert sich für eine neue Diät.", items: RF, correct: 1 },
      { q: "6. Die Frau hat ihre Ernährung geändert, weil …", items: ABC2("Freunde sie davon überzeugt haben.", "sie sich bisher zu ungesund ernährt hat.", "sie Tiere schützen will."), correct: 2 },
      { q: "7. Eine Journalistin berichtet über eine Musikveranstaltung.", items: RF, correct: 0 },
      { q: "8. Was wird zum Wettbewerb gesagt?", items: ABC2("Deutschland hat gute Chancen, zu gewinnen.", "Die Sendung wird nicht nur in Europa ausgestrahlt.", "Die Teilnahme ist dieses Jahr gratis."), correct: 1 },
      { q: "9. Ein Moderator berichtet über die Sicherheit im Zugverkehr.", items: RF, correct: 1 },
      { q: "10. Um etwas gegen Verspätungen tun zu können, ist es wichtig, dass …", items: ABC2("die Zahl der Baustellen reduziert wird.", "Fahrpläne korrigiert werden.", "man die aktuellen Probleme richtig erkennt."), correct: 2 },
    ],
  },
  {
    teil: 2,
    info: "Hören Teil 2. Sie hören im Radio ein Interview mit einer Persönlichkeit aus der Wissenschaft. Sie hören den Text zweimal. Wählen Sie bei jeder Aufgabe die richtige Lösung.",
    audioFile: "9783061217754_Goethe-Zertifikat_B2_03.mp3",
    questions: [
      { q: "11. In einer Umfrage war die Mehrheit der Befragten dafür,", items: ABC2("Bargeld abzuschaffen.", "nur noch mit Karte zu zahlen.", "weiter auch bar zahlen zu können."), correct: 2 },
      { q: "12. Warum wollen viele Deutsche das Bargeld behalten?", items: ABC2("Sie befürchten den Verlust ihrer Privatsphäre.", "Sie finden, dass Geldscheine sehr schön aussehen.", "Sie lieben es, mit Bargeld einzukaufen."), correct: 0 },
      { q: "13. Was könnte nach Auffassung des Ökonomen ein Vorteil einer bargeldlosen Wirtschaft sein?", items: ABC2("Die Preise würden sinken.", "Kriminelle hätten weniger Möglichkeiten.", "Man bräuchte weniger Polizei."), correct: 1 },
      { q: "14. Was hat sich in den letzten Jahren verändert?", items: ABC2("Man hat sich daran gewöhnt, bargeldlos zu zahlen.", "Smartphone-Apps sind heute sehr erfolgreich.", "Zahlungen mit Handy gelten heute als sicher."), correct: 0 },
      { q: "15. Was ist nach Auffassung des Ökonomen das eigentliche Problem für viele Menschen?", items: ABC2("Der Wertverlust des Geldes.", "Die raschen technischen Veränderungen.", "Die veränderten Gewohnheiten."), correct: 1 },
      { q: "16. Was meint der Ökonom, wenn er sagt, dass der Mensch viel Fantasie hat?", items: ABC2("Der Mensch wird neues Geld erfinden.", "Der Mensch wird nur noch digital handeln.", "Der Mensch wird sich andere Formen des Handels überlegen."), correct: 2 },
    ],
  },
  {
    teil: 3,
    info: "Hören Teil 3. Sie hören im Radio ein Gespräch mit mehreren Personen. Die Personen sprechen über Stress am Arbeitsplatz. Sie hören den Text einmal. Wählen Sie bei jeder Aufgabe: Wer sagt das?",
    audioFile: "9783061217754_Goethe-Zertifikat_B2_04.mp3",
    questions: [
      { q: "17. Ich helfe Arbeitnehmern, die Stress haben.", items: ["Moderatorin", "Stressberaterin", "Betriebsratsmitglied"], correct: 1 },
      { q: "18. Es wird oft nicht gesehen, dass Stress ein Problem ist.", items: ["Moderatorin", "Stressberaterin", "Betriebsratsmitglied"], correct: 0 },
      { q: "19. Maßnahmen zur Vorbeugung sind wichtig.", items: ["Moderatorin", "Stressberaterin", "Betriebsratsmitglied"], correct: 2 },
      { q: "20. Mitarbeiter müssen konkret motiviert werden, etwas gegen Stress zu unternehmen.", items: ["Moderatorin", "Stressberaterin", "Betriebsratsmitglied"], correct: 2 },
      { q: "21. Es besteht der Wunsch nach verbindlichen Regelungen zum Stressabbau.", items: ["Moderatorin", "Stressberaterin", "Betriebsratsmitglied"], correct: 0 },
      { q: "22. Maßnahmen zum Stressabbau sollen in den Betrieben geklärt werden.", items: ["Moderatorin", "Stressberaterin", "Betriebsratsmitglied"], correct: 2 },
    ],
  },
  {
    teil: 4,
    info: "Hören Teil 4. Sie hören einen kurzen Vortrag. Der Redner spricht über das Thema „Prüfungsängste überwinden“. Sie hören den Text zweimal. Wählen Sie bei jeder Aufgabe die richtige Lösung.",
    audioFile: "9783061217754_Goethe-Zertifikat_B2_05.mp3",
    questions: [
      { q: "23. Aufregung vor einer Prüfung …", items: ABC2("ist nicht nur negativ.", "schadet der Konzentration.", "sollte man vermeiden."), correct: 0 },
      { q: "24. Bei der Prüfungsvorbereitung sollte man …", items: ABC2("an seinen Schwächen arbeiten.", "sich an den gestellten Anforderungen orientieren.", "sich zuerst auf die einfachen Aufgaben konzentrieren."), correct: 1 },
      { q: "25. Auswendiglernen …", items: ABC2("ist für viele Menschen die beste Methode.", "ist in Einzelfällen sinnvoll.", "kann auch zu noch größerem Stress führen."), correct: 1 },
      { q: "26. Herr Lohmann rät dazu, …", items: ABC2("auch in der Freizeit Prüfungsstoff zu wiederholen.", "immer nach zehn Stunden eine lange Pause einzulegen.", "nach einem Plan zu arbeiten."), correct: 2 },
      { q: "27. Morgenmenschen …", items: ABC2("haben keine spezifischen Vorteile.", "können Prüfungen besser bewältigen.", "sind am nächsten Tag konzentrierter."), correct: 0 },
      { q: "28. Laut Herrn Lohmann …", items: ABC2("kann man am besten in Bibliotheken arbeiten.", "kann man sich zu Hause schlecht vorbereiten.", "sind Ablenkungen häufig schwer zu vermeiden."), correct: 2 },
      { q: "29. Es gibt auch Menschen, die …", items: ABC2("auch vor einer Prüfung Freizeitstress brauchen.", "mit Atemübungen nichts anfangen können.", "Prüfungsstress lieben."), correct: 0 },
      { q: "30. Am Abend vor der Prüfung sollte man …", items: ABC2("früh ins Bett gehen.", "nur noch wiederholen, was Spaß macht.", "sich nicht mehr mit der Prüfung beschäftigen."), correct: 2 },
    ],
  },
];

// ─────────────────────────────────────────────────────── SCHREIBEN ───────────
export const SCHREIBEN = [
  {
    teil: 1,
    aufgabe: "Sie schreiben einen Forumsbeitrag zum Thema fleischreiche Ernährung. Äußern Sie Ihre Meinung zu fleischreicher Ernährung im Alltag.\n\n• Nennen Sie Gründe, warum eine Ernährung mit Fleisch so verbreitet ist.\n• Nennen Sie andere Möglichkeiten, sich zu ernähren.\n• Nennen Sie Vorteile anderer Ernährung.\n\nDenken Sie an eine Einleitung und einen Schluss. Bei der Bewertung wird darauf geachtet, wie genau die Inhaltspunkte bearbeitet sind, wie korrekt der Text ist und wie gut die Sätze und Abschnitte sprachlich miteinander verknüpft sind. Schreiben Sie mindestens 150 Wörter.",
  },
  {
    teil: 2,
    aufgabe: "Montagmorgen im Büro. Wegen starker Arbeitsüberlastung haben Sie es letzte Woche versäumt, eine wichtige Bestellung aufzugeben. Schreiben Sie eine Nachricht an Ihren Vorgesetzten, Herrn Schumann.\n\n• Entschuldigen Sie sich für Ihren Fehler.\n• Erklären Sie, weshalb das passieren konnte.\n• Bitten Sie um Verständnis für Ihre Situation.\n• Machen Sie einen Vorschlag zur Lösung des Problems.\n\nÜberlegen Sie sich eine passende Reihenfolge für die Inhaltspunkte. Vergessen Sie nicht Anrede und Gruß. Schreiben Sie mindestens 100 Wörter.",
  },
];

// ──────────────────────────────────────────────────────── SPRECHEN ───────────
export const SPRECHEN = [
  {
    teil: 1,
    aufgabe: "Sprechen Teil 1: Vortrag halten (circa 4 Minuten; circa acht Minuten für beide Teilnehmende zusammen). Sie nehmen an einem Seminar teil und sollen dort einen kurzen Vortrag halten. Wählen Sie ein Thema (A oder B) aus. Strukturieren Sie Ihren Vortrag mit einer Einleitung, einem Hauptteil und einem Schluss.\n\nTeilnehmende/-r A:\nThema A — Methoden zum Deutschlernen: • Beschreiben Sie mehrere Formen. • Nennen Sie Vor- und Nachteile und bewerten Sie diese. • Beschreiben Sie eine Methode genauer.\nThema B — Reisen: • Beschreiben Sie mehrere Möglichkeiten (z. B. Zugreise). • Nennen Sie Vor- und Nachteile und bewerten Sie diese. • Beschreiben Sie eine Möglichkeit genauer.\n\nTeilnehmende/-r B:\nThema A — Freunde kennenlernen: • Beschreiben Sie mehrere Alternativen. • Nennen Sie Vor- und Nachteile und bewerten Sie diese. • Beschreiben Sie eine Möglichkeit genauer.\nThema B — Verkehrsmittel: • Beschreiben Sie mehrere Alternativen (z. B. Wie fahren Sie zur Arbeit / zur Uni). • Nennen Sie Vor- und Nachteile und bewerten Sie diese. • Beschreiben Sie eine Möglichkeit genauer.",
  },
  {
    teil: 2,
    aufgabe: "Sprechen Teil 2: Diskussion führen (circa fünf Minuten für beide Teilnehmende zusammen). Sie sind Teilnehmende eines Debattierclubs und diskutieren über die aktuelle Frage:\n\n„Sollte Studieren kostenlos sein?“\n\n• Tauschen Sie zuerst Ihren Standpunkt und Ihre Argumente aus.\n• Reagieren Sie dann auf die Argumente Ihrer Gesprächspartnerin / Ihres Gesprächspartners.\n• Fassen Sie am Ende zusammen: Sind Sie dafür oder dagegen?\n\nStichpunkte zur Hilfe: • Studiengebühren werden sinnvoll genutzt? • Staat soll das Studium ganz/teilweise finanzieren? • Chancengleichheit wird größer/kleiner? • Qualität des Unterrichts wird besser/schlechter?",
  },
];
