// C1.1 - Lesetexte + Leseverstehen, MODUL 4 (Fehlerkultur, Wendepunkte, Datenlücken).
// Dodaje u svaku od 3 lekcije: (a) text sekciju "## 📖 Lesetext: ..." posle Lernziele, pre "## 📘",
// (b) quiz vežbu sa 6 pitanja koja dele isti options.context (okida GroupedExamExercise).
// Idempotentno: stara "## 📖" sekcija se uklanja, vežba se briše po naslovu pa ponovo pravi.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const CID = "3bfe17d7-62fa-4b06-b844-b10db9acd5ed";
const READ_MARK = "## 📖";
const GRAM_MARK = "## 📘";

const LESSONS = [
  // ────────────────────────────────────────────────────────────────────────
  {
    lesson: "Fehlerkultur - Entschuldigung!",
    textTitle: "Die unterschätzte Kraft der Entschuldigung",
    body: `Es ist ein Moment, den alle aus dem Berufsalltag kennen: Eine Frist wird versäumt, eine Zahl im Quartalsbericht stimmt nicht, eine vertrauliche E-Mail geht an den falschen Verteiler. Ein Versehen, das niemand beabsichtigt hat - und dennoch breitet sich jene angespannte Stille aus, die das Betriebsklima zuverlässig vergiftet. Bemerkenswert ist dabei weniger der Fehler selbst als das, was auf ihn folgt. Während in manchen Teams offen darüber gesprochen wird, wem ein Fehler unterlaufen ist, herrscht anderswo ein gnadenloser Perfektionismus, der jedes Schuldeingeständnis als Schwäche deutet.

Genau darin liegt das eigentliche Problem. Die weit verbreitete Annahme, ein Eingeständnis schwäche die eigene Position, hält sich hartnäckig, obwohl zahlreiche Untersuchungen aus der Organisationspsychologie das Gegenteil nahelegen. Wer für einen selbst verschuldeten Schaden geradesteht, beweist Selbstreflexion und Konfliktfähigkeit - Eigenschaften, die gerade in Führungspositionen hoch geschätzt werden. Mithilfe einer klar formulierten Entschuldigung lässt sich ein Konflikt häufig binnen weniger Minuten bereinigen, während ohne sie oft wochenlange Umwege nötig sind. Wer dagegen ausweicht und die Verantwortung auf die Umstände schiebt, zwingt alle Beteiligten dazu, das Vorgefallene weiter mit sich herumzutragen, wodurch aus einer Kleinigkeit ein dauerhafter Konflikt entsteht.

Entscheidend ist allerdings die Form. Ein hastiges „Tut mir leid, aber der Zeitdruck war enorm" ist eine Floskel, die von mangelndem Einfühlungsvermögen zeugt: Das kleine Wörtchen „aber" verwandelt das Bedauern in eine Rechtfertigung, womit die beabsichtigte Wirkung ins Gegenteil verkehrt wird. Überzeugend ist eine Entschuldigung erst dann, wenn drei Elemente zusammenkommen - die Benennung des konkreten Fehlers, ein Ausdruck aufrichtigen Bedauerns und ein Vorschlag, wie sich der entstandene Schaden ausgleichen lässt. Auf diese Weise erfährt das Gegenüber, dass es nicht um die Rettung des eigenen Ansehens geht, sondern um eine echte Versöhnung.

Vor einem Missverständnis sei allerdings gewarnt: Mehr ist nicht automatisch besser. Wer sich mittels übertriebener Selbstanklage für jede Kleinigkeit entschuldigt, signalisiert keine Höflichkeit, sondern Unsicherheit, und schwächt damit das eigene Durchsetzungsvermögen. Ein angemessenes Maß ist deshalb ratsam - und es lässt sich erlernen.

Eine Fehlerkultur, in der Missgeschicke benannt statt verschwiegen werden, ist somit kein Zeichen von Nachlässigkeit, sondern eine wirtschaftliche Notwendigkeit: Nur wer die eigenen Fehler kennt, kann sie ein zweites Mal vermeiden. Dass ein offener Umgang mit ihnen zugleich das zwischenmenschliche Miteinander verbessert, ist ein Nebeneffekt, auf den kein Unternehmen verzichten sollte.`,
    help: `**Wortschatzhilfe**

• *jemandem unterläuft ein Fehler* - nekome se potkrade greška
• *für etwas geradestehen* - snositi odgovornost za nešto
• *einen Konflikt bereinigen* - raščistiti, izgladiti sukob
• *von etwas zeugen* - svedočiti o nečemu
• *die Floskel* - isprazna fraza, floskula
• *das Einfühlungsvermögen* - sposobnost uživljavanja, empatija
• *das Durchsetzungsvermögen* - sposobnost da se izboriš za svoje
• *das Missgeschick* - nezgoda, peh`,
    exTitle: "Leseverstehen: Fehlerkultur",
    questions: [
      {
        q: "Welche Aussage gibt die Hauptaussage des Textes am besten wieder?",
        items: [
          "Fehler sollten im Berufsalltag um jeden Preis vermieden werden, weil sie das Betriebsklima zerstören.",
          "Eine Entschuldigung wirkt umso besser, je häufiger und ausführlicher sie ausgesprochen wird.",
          "Eine gut formulierte Entschuldigung ist kein Zeichen von Schwäche, sondern nützt dem Betrieb und den Beziehungen.",
          "Führungskräfte sollten Fehler ihrer Mitarbeitenden konsequent öffentlich ansprechen.",
        ],
        correct: 2,
        exp: "Ceo tekst brani tezu da priznanje greške jača poziciju - i ekonomski i međuljudski.",
      },
      {
        q: "Was geschieht laut Text, wenn jemand die Verantwortung auf die Umstände schiebt?",
        items: [
          "Aus einer Kleinigkeit entwickelt sich ein dauerhafter Konflikt.",
          "Die Kolleginnen und Kollegen übernehmen die Verantwortung an seiner Stelle.",
          "Der Fehler wird von der Führungsebene offiziell untersucht.",
          "Das Team verzeiht den Fehler schneller als sonst.",
        ],
        correct: 0,
        exp: "U drugom pasusu piše da svi uključeni nastavljaju da nose teret - „wodurch aus einer Kleinigkeit ein dauerhafter Konflikt entsteht\".",
      },
      {
        q: "Welche drei Elemente muss eine überzeugende Entschuldigung laut Text enthalten?",
        items: [
          "Eine Erklärung der Umstände, ein Versprechen und eine Bitte um Verständnis.",
          "Ein Schuldeingeständnis, eine E-Mail an alle Beteiligten und ein persönliches Gespräch.",
          "Den Ausdruck des Bedauerns, ein Lob für das Team und einen Terminvorschlag.",
          "Die Benennung des konkreten Fehlers, aufrichtiges Bedauern und einen Vorschlag zur Wiedergutmachung.",
        ],
        correct: 3,
        exp: "Treći pasus taksativno nabraja upravo ta tri elementa.",
      },
      {
        q: "Warum wird der Satz „Tut mir leid, aber der Zeitdruck war enorm\" im Text kritisiert?",
        items: [
          "Weil er zu formell klingt und im Berufsalltag unpassend wirkt.",
          "Weil das Wörtchen „aber\" das Bedauern in eine Rechtfertigung verwandelt.",
          "Weil er den konkreten Fehler zu ausführlich beschreibt.",
          "Weil er ohne Anrede formuliert ist.",
        ],
        correct: 1,
        exp: "Tekst izričito kaže da „aber\" pretvara žaljenje u opravdanje i obrće dejstvo izvinjenja.",
      },
      {
        q: "Was bedeutet der Ausdruck „für einen Schaden geradestehen\" in diesem Text?",
        items: [
          "einen Schaden rechtzeitig bemerken und melden",
          "einen Schaden über eine Versicherung abwickeln",
          "die Verantwortung für einen Schaden übernehmen",
          "einen Schaden für unbedeutend erklären",
        ],
        correct: 2,
        exp: "„Geradestehen für etwas\" znači preuzeti odgovornost, a ne samo prijaviti ili umanjiti štetu.",
      },
      {
        q: "Welche Absicht verfolgt der Text in erster Linie?",
        items: [
          "Er schildert die Geschichte der Fehlerkultur in deutschen Unternehmen.",
          "Er argumentiert für einen offeneren Umgang mit Fehlern und erklärt, wovon die Wirkung einer Entschuldigung abhängt.",
          "Er liefert eine formale Vorlage für Entschuldigungs-E-Mails.",
          "Er berichtet über die Ergebnisse einer neuen Umfrage unter Führungskräften.",
        ],
        correct: 1,
        exp: "Reč je o komentaru koji zastupa stav i uz to objašnjava od čega zavisi dejstvo izvinjenja.",
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────────
  {
    lesson: "Wendepunkte - Geschichte und Geschichten",
    textTitle: "Ein Land, zwei Erinnerungen",
    body: `Wer heute durch die Innenstadt von Halle geht, sieht sanierte Fassaden, gut besuchte Cafés und Lastenräder vor den Läden. Nichts davon erinnert an den wirtschaftlichen Zusammenbruch, der die Region in den frühen Neunzigerjahren tief erschüttert hat. Und doch beginnt hier fast jedes Gespräch über die Wende früher oder später mit demselben Satz: „Damals wurde unser Leben auf den Kopf gestellt."

Kerstin L., 61, war Chemielaborantin in einem Kombinat, das kurz nach der Wiedervereinigung geschlossen wurde. Sie schildert diesen Wandel ohne Bitterkeit, aber mit spürbarer Nüchternheit. „Zutiefst enttäuscht war ich vor allem darüber, dass niemand nach unserer Erfahrung gefragt hat", sagt sie. Ihr Abschluss wurde nicht anerkannt; hätte sie in ihrem Beruf weiterarbeiten wollen, hätte sie mit Mitte dreißig noch einmal eine Ausbildung beginnen müssen. Sie entschied sich anders und wurde Pflegerin. „Ohne die Wende hätte ich diesen Weg nie gehen können - und ich hätte ihn auch nie gehen müssen."

Solche doppelten Sätze hört man in Ostdeutschland häufig. Sie beschreiben genau, wie eng Gewinn und Verlust hier beieinanderliegen. Reisefreiheit, freie Wahlen und ein deutlich gestiegener Lebensstandard werden kaum bestritten. Zugleich beklagen viele, dass die ostdeutsche Wirtschaftskraft bis heute hinter der westdeutschen zurückbleibt und dass Ostdeutsche in Spitzenpositionen von Justiz, Wissenschaft und Wirtschaft deutlich unterrepräsentiert sind. Hätten damals nicht so viele Betriebe innerhalb weniger Jahre schließen müssen, sähe diese Bilanz vermutlich anders aus.

Der Historiker Jonas W., der die Erinnerungskultur der Region erforscht, warnt jedoch davor, die Erzählung vom benachteiligten Osten zu verabsolutieren. „Klischees sind auf beiden Seiten weit verbreitet", merkt er an. „Wer ausschließlich auf Statistiken schaut, übersieht, dass hier Millionen Biografien innerhalb weniger Jahre neu geschrieben wurden - im Guten wie im Schlechten."

Eine dritte Perspektive kommt von den Jüngeren. Für Studierende, die lange nach 1990 geboren wurden, ist die Teilung Geschichte; ihre Fragen betreffen Mieten, Klima und Arbeitsbedingungen. Und doch, so beobachtet Jonas W., griffen auch sie in Diskussionen regelmäßig auf die Kategorien „Ost" und „West" zurück - auf Kategorien also, die sie selbst nie erlebt haben.

Mehr als drei Jahrzehnte nach dem Mauerfall lässt sich deshalb festhalten: Ein politischer Wandel vollzieht sich in Monaten, ein gesellschaftlicher in Generationen. Wer verstehen will, warum in Halle Zufriedenheit und Enttäuschung so dicht nebeneinanderliegen, muss beide Zeitrechnungen zusammendenken.`,
    help: `**Wortschatzhilfe**

• *der Zusammenbruch* - slom, raspad
• *die Wende* - preokret (period nemačkog ujedinjenja)
• *etwas auf den Kopf stellen* - okrenuti nešto naglavačke
• *spürbar* - osetan, primetan
• *die Wirtschaftskraft* - privredna snaga
• *deutlich unterrepräsentiert* - znatno nedovoljno zastupljen
• *verabsolutieren* - proglasiti jedinom istinom, uzdići u apsolut
• *sich vollziehen* - odigrati se, odvijati se`,
    exTitle: "Leseverstehen: Wendepunkte",
    questions: [
      {
        q: "Welches Anliegen verfolgt die Reportage in erster Linie?",
        items: [
          "Sie will belegen, dass die Wiedervereinigung wirtschaftlich gescheitert ist.",
          "Sie zeigt, dass die Wende bis heute unterschiedlich erinnert wird und Gewinne wie Verluste mit sich brachte.",
          "Sie fordert eine finanzielle Entschädigung für die Menschen in Ostdeutschland.",
          "Sie beschreibt, wie sich die Innenstädte in Ostdeutschland baulich verändert haben.",
        ],
        correct: 1,
        exp: "Tekst namerno spaja tri perspektive - Kerstin, istoričara i mlade - da bi pokazao koliko se sećanja razlikuju.",
      },
      {
        q: "Warum hat Kerstin L. ihren Beruf gewechselt?",
        items: [
          "Weil sie sich schon vor der Wende für die Pflege interessiert hatte.",
          "Weil ihr Kombinat sie in eine andere Abteilung versetzt hatte.",
          "Weil sie in Westdeutschland eine besser bezahlte Stelle gefunden hatte.",
          "Weil ihr Abschluss nicht anerkannt wurde und sie sonst noch einmal eine Ausbildung hätte beginnen müssen.",
        ],
        correct: 3,
        exp: "U drugom pasusu stoji da joj diploma nije priznata i da bi inače morala ponovo na školovanje.",
      },
      {
        q: "Was wird im Text als weitgehend unbestritten dargestellt?",
        items: [
          "Die Reisefreiheit, die freien Wahlen und der gestiegene Lebensstandard.",
          "Die gleichmäßige Verteilung von Spitzenpositionen zwischen Ost und West.",
          "Die rasche Angleichung der ostdeutschen Wirtschaftskraft.",
          "Das Verschwinden gegenseitiger Klischees.",
        ],
        correct: 0,
        exp: "Treći pasus kaže da se sloboda putovanja, slobodni izbori i viši životni standard „kaum bestritten\" - jedva da se dovode u pitanje.",
      },
      {
        q: "Wovor warnt der Historiker Jonas W.?",
        items: [
          "Vor einer erneuten politischen Teilung des Landes.",
          "Vor der Schließung weiterer Industriebetriebe.",
          "Davor, die Erzählung vom benachteiligten Osten zu verabsolutieren.",
          "Vor einem zu schnellen Anstieg der Lebenshaltungskosten.",
        ],
        correct: 2,
        exp: "On upozorava da se priča o zapostavljenom istoku ne sme pretvoriti u jedinu istinu, jer klišei postoje na obe strane.",
      },
      {
        q: "Was bedeutet die Wendung „etwas wird auf den Kopf gestellt\" in diesem Zusammenhang?",
        items: [
          "Etwas verändert sich von Grund auf.",
          "Etwas wird gründlich durchsucht.",
          "Etwas wird bewusst falsch dargestellt.",
          "Etwas wird wieder in Ordnung gebracht.",
        ],
        correct: 0,
        exp: "Izraz znači da se nešto iz temelja menja - ovde: ceo život posle preokreta.",
      },
      {
        q: "Welche Schlussfolgerung zieht der Text am Ende?",
        items: [
          "Die Unterschiede zwischen Ost und West sind inzwischen vollständig verschwunden.",
          "Die jüngere Generation interessiert sich nicht mehr für die Geschichte der Teilung.",
          "Nur wirtschaftliche Maßnahmen können die verbliebenen Unterschiede beseitigen.",
          "Politischer Wandel geht schnell, gesellschaftlicher Wandel braucht Generationen.",
        ],
        correct: 3,
        exp: "Poslednji pasus izričito suprotstavlja političku promenu (meseci) i društvenu (generacije).",
      },
    ],
  },
  // ────────────────────────────────────────────────────────────────────────
  {
    lesson: "Datenlücken - Alle Menschen im Blick",
    textTitle: "Der Durchschnittsmensch, den es nicht gibt",
    body: `Ein klassischer Crashtest-Dummy ist 1,75 Meter groß und wiegt 78 Kilogramm. Diese Werte stammen aus den Sechzigerjahren und beschreiben den Körper eines durchschnittlichen erwachsenen Mannes. Jahrzehntelang wurden Fahrzeuge fast ausschließlich an diesem Modell geprüft, weshalb der Schutz für alle, deren Körpermaße davon abweichen, systematisch schlechter ausfiel. Unfallstatistiken zeigen bis heute ein beträchtliches Ungleichgewicht: Bei vergleichbaren Unfällen tragen Frauen häufiger schwere Verletzungen davon. Die Ursache liegt dabei nicht in der Technik selbst, sondern in den Daten, auf denen sie beruht.

Fachleute sprechen von einer Datenlücke. Überall dort, wo Messwerte über bestimmte Gruppen fehlen, wird stillschweigend der am besten dokumentierte Fall zur Norm erhoben. Infolgedessen entstehen Produkte, die für einen Teil der Zielgruppe hervorragend funktionieren und für alle übrigen nur ungefähr. Dahinter steckt selten böser Wille; es ist die Bequemlichkeit vorhandener Datensätze.

Die Beispiele reichen weit über den Straßenverkehr hinaus. Spracherkennungssysteme wurden lange überwiegend mit männlichen Stimmen trainiert, folglich verstanden sie höhere Stimmlagen deutlich schlechter. Dosierungsempfehlungen für Medikamente beruhten auf Studien, an denen kaum Frauen teilnahmen, weswegen bestimmte Nebenwirkungen erst spät auffielen. Selbst im Alltag zeigt sich dasselbe Muster: Werkzeuge sind auf eine rechtshändige Nutzung zugeschnitten, Farbskalen in Apps vernachlässigen die weit verbreitete Farbsehschwäche, und Schutzkleidung wird in Größen angeboten, die einen Teil der Beschäftigten von vornherein ausschließen. Und Algorithmen, die aus vorhandenen Daten lernen, reproduzieren genau die Muster, die sie darin finden; infolge von Datenlücken werden bestehende Ungleichheiten also nicht nur abgebildet, sondern zusätzlich verstärkt.

Die gute Nachricht lautet: Diese Lücken lassen sich schließen. Immer mehr Hochschulen beziehen Gender- und Diversitätsaspekte in ihre Lehre ein, demzufolge kommen künftige Ingenieurinnen und Ingenieure gar nicht erst auf die Idee, den eigenen Körper zum Maßstab zu erklären. Unternehmen holen vor der Markteinführung systematisch die Meinungen unterschiedlicher Nutzergruppen ein, sodass Schwachstellen früher identifiziert werden. Und infolge der Verbesserung der Spracherkennungstechnologie werden heute auch Stimmen zuverlässig erkannt, an denen frühere Systeme gescheitert sind.

Der „Durchschnittsmensch" ist am Ende eine statistische Konstruktion, der in der Wirklichkeit niemand entspricht. Wer ihn zum Maßstab erhebt, entwirft Produkte für eine Minderheit und nennt das Ergebnis Standard. Wer dagegen die Vielfalt der späteren Nutzung von Anfang an im Blick hat, gewinnt nicht allein an Gerechtigkeit: Ein Produkt, das für mehr Menschen funktioniert, ist schlicht das bessere Produkt.`,
    help: `**Wortschatzhilfe**

• *die Datenlücke* - rupa u podacima
• *die Körpermaße* (nur Pl.) - telesne mere
• *etwas zur Norm erheben* - proglasiti nešto normom
• *die Schwachstelle* - slaba tačka
• *Meinungen einholen* - pribaviti mišljenja
• *vorhanden* - postojeći, raspoloživ
• *etwas im Blick haben* - imati nešto u vidu
• *die Zielgruppe* - ciljna grupa`,
    exTitle: "Leseverstehen: Datenlücken",
    questions: [
      {
        q: "Worauf führt der Text die schwereren Unfallfolgen für Frauen zurück?",
        items: [
          "Auf eine im Durchschnitt geringere Fahrpraxis.",
          "Auf die schlechtere Qualität kleinerer Fahrzeuge.",
          "Auf Testverfahren, die sich an den Maßen eines durchschnittlichen Mannes orientieren.",
          "Auf zu selten gewartete Airbags.",
        ],
        correct: 2,
        exp: "Prvi pasus kaže da su vozila decenijama testirana samo na modelu prosečnog muškarca.",
      },
      {
        q: "Was ist die zentrale These des Textes?",
        items: [
          "Nicht die Technik selbst, sondern die unvollständige Datengrundlage führt zu Produkten, die nur einem Teil der Nutzenden gerecht werden.",
          "Technische Produkte sollten grundsätzlich getrennt für Frauen und für Männer entwickelt werden.",
          "Algorithmen sind für die Produktentwicklung generell ungeeignet.",
          "Die Sicherheit im Straßenverkehr hat sich in den letzten Jahrzehnten kaum verbessert.",
        ],
        correct: 0,
        exp: "Tekst izričito kaže da uzrok nije u tehnici, nego u podacima na kojima ona počiva.",
      },
      {
        q: "Welches Beispiel nennt der Text für Folgen fehlender Daten außerhalb des Straßenverkehrs?",
        items: [
          "Fahrradhelme, die für Kinder zu schwer sind.",
          "Spracherkennungssysteme, die höhere Stimmlagen schlechter verstanden.",
          "Bildschirme, die zu hell eingestellt sind.",
          "Verpackungen, die sich nur schwer öffnen lassen.",
        ],
        correct: 1,
        exp: "U trećem pasusu se navode sistemi za prepoznavanje govora trenirani pretežno na muškim glasovima.",
      },
      {
        q: "Was tun Unternehmen laut Text, um Schwachstellen früher zu erkennen?",
        items: [
          "Sie verlängern die Garantiezeit ihrer Produkte.",
          "Sie verkleinern ihr Sortiment.",
          "Sie verschieben die Markteinführung um mehrere Jahre.",
          "Sie holen vor der Markteinführung die Meinungen unterschiedlicher Nutzergruppen ein.",
        ],
        correct: 3,
        exp: "Četvrti pasus navodi da firme pre izlaska proizvoda na tržište sistematski prikupljaju mišljenja različitih grupa korisnika.",
      },
      {
        q: "Was ist im Text mit einer „Datenlücke\" gemeint?",
        items: [
          "Ein technischer Fehler, durch den gespeicherte Daten verloren gehen.",
          "Das Fehlen von Messwerten über bestimmte Gruppen von Menschen.",
          "Eine Gesetzeslücke beim Schutz personenbezogener Daten.",
          "Eine Unterbrechung bei der Übertragung großer Datenmengen.",
        ],
        correct: 1,
        exp: "Drugi pasus definiše pojam: nedostaju izmerene vrednosti o pojedinim grupama, pa najbolje dokumentovan slučaj postaje norma.",
      },
      {
        q: "Welche Haltung nimmt der Text am Schluss ein?",
        items: [
          "Er hält das Problem für technisch nicht lösbar.",
          "Er empfiehlt, auf statistische Durchschnittswerte vollständig zu verzichten.",
          "Er sieht in einer breiteren Datenbasis nicht nur einen Gewinn an Gerechtigkeit, sondern auch an Produktqualität.",
          "Er fordert gesetzliche Strafen für Unternehmen, die Datenlücken nicht schließen.",
        ],
        correct: 2,
        exp: "Poslednja rečenica kaže da proizvod koji radi za više ljudi jednostavno jeste bolji proizvod.",
      },
    ],
  },
];

const words = (s) => s.trim().split(/\s+/).length;
const isText = (s) => s && s.type === "text" && typeof s.content === "string";

for (const L of LESSONS) {
  const { data: lesson } = await sb.from("lessons").select("id,sections").eq("course_id", CID).eq("title", L.lesson).maybeSingle();
  if (!lesson) { console.error(`✗ Lekcija "${L.lesson}" ne postoji - preskačem.`); continue; }

  const existing = Array.isArray(lesson.sections) ? lesson.sections : [];
  const had = existing.some((s) => isText(s) && s.content.startsWith(READ_MARK));
  const base = existing.filter((s) => !(isText(s) && s.content.startsWith(READ_MARK)));
  let idx = base.findIndex((s) => isText(s) && s.content.startsWith(GRAM_MARK));
  if (idx === -1) idx = base.length;

  const section = { type: "text", style: "beispiele", content: `${READ_MARK} Lesetext: ${L.textTitle}\n\n${L.body}\n\n${L.help}` };
  const context = { type: "text", title: L.textTitle, content: L.body };

  console.log(`${had ? "~" : "+"} "${L.lesson}"`);
  console.log(`   Lesetext: „${L.textTitle}" - ${words(L.body)} reči, sekcija ${had ? "(zamena)" : "(dodavanje)"} na poziciju ${idx} od ${base.length}`);
  console.log(`   Vežba: „${L.exTitle}" - ${L.questions.length} pitanja, tačni: ${L.questions.map((q) => q.correct).join(", ")}`);

  if (!APPLY) continue;

  const next = base.slice();
  next.splice(idx, 0, section);
  const { error: upErr } = await sb.from("lessons").update({ sections: next }).eq("id", lesson.id);
  if (upErr) { console.error("   ✗ update sections:", upErr.message); continue; }

  await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("title", L.exTitle);
  const { data: rest } = await sb.from("exercises").select("order_index").eq("lesson_id", lesson.id);
  const order = (rest || []).reduce((m, e) => Math.max(m, e.order_index ?? 0), 0) + 1;
  const { data: ex, error: exErr } = await sb.from("exercises").insert({ lesson_id: lesson.id, title: L.exTitle, exercise_type: "quiz", order_index: order }).select("id").single();
  if (exErr) { console.error("   ✗ insert exercise:", exErr.message); continue; }

  const rows = L.questions.map((q, i) => ({
    exercise_id: ex.id,
    question: q.q,
    options: { type: "quiz", items: q.items, context },
    correct_answer: String(q.correct),
    explanation: q.exp,
    question_type: "quiz",
    order_index: i + 1,
  }));
  const { error: qErr } = await sb.from("exercise_questions").insert(rows);
  if (qErr) { console.error("   ✗ insert questions:", qErr.message); continue; }
  console.log(`   ✓ upisano (exercise order_index ${order})`);
}
console.log(APPLY ? "✓ Gotovo (C1.1 Modul 4 - Lesetexte + Leseverstehen)" : "[DRY] --apply za upis.");
