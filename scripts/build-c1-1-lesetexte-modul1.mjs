// C1.1 - Lesetexte + Leseverstehen vežbe, MODUL 1 (Freundschaft, Selbstbilder, Mehrsprachigkeit).
// Dry-run po defaultu; upis samo uz --apply. Idempotentno: menja sopstvenu "## 📖" sekciju i sopstvenu vežbu.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const CID = "3bfe17d7-62fa-4b06-b844-b10db9acd5ed";
const MARK = "## 📖";
const GRAMMAR_MARK = "## 📘";

// ---------------------------------------------------------------------------
// LEKCIJA 1 - Freundschaft (konditionale Zusammenhänge + Modalpartikeln)
// ---------------------------------------------------------------------------
const T1_TITLE = "Freundschaft auf Distanz - warum enge Bindungen Pflege brauchen";
const T1 = `Es gibt diesen einen Moment, den fast alle kennen: Man scrollt durch die Kontaktliste, bleibt bei einem Namen hängen und stellt fest, dass das letzte richtige Gespräch zwei Jahre zurückliegt. Nichts ist vorgefallen, es gab keinen Streit um Geld, keine große Enttäuschung, keine bewusste Entscheidung. Die Freundschaft ist einfach leiser geworden - und irgendwann verstummt. Woran liegt das denn?

Soziologinnen und Soziologen beschreiben diesen Prozess seit Langem als normale Begleiterscheinung von Umbruchphasen. Wer umzieht, ein Kind bekommt, den Beruf wechselt oder eine Trennung hinter sich bringt, ordnet seinen Freundeskreis unbewusst neu. In den vergangenen Jahrzehnten hat sich allerdings etwas verschoben: Die Erwartungen an Freundschaften sind gestiegen, während die Zeit, die für ihre Pflege zur Verfügung steht, knapper geworden ist. Freundschaft, so ließe sich zugespitzt sagen, ist von einer selbstverständlichen Nebenbeziehung zu einem Projekt geworden, das man immer wieder neu aushandeln muss.

Die Berliner Beziehungsforscherin Miriam Kolb hält das keineswegs für ein Drama. „Eine Freundschaft hält jede Lebensphase aus, vorausgesetzt, dass beide Seiten ihre Erwartungen regelmäßig anpassen", sagt sie. Problematisch werde es erst, wenn eine Person am alten Bild festhalte: an den spontanen Abenden, den langen Telefonaten, der ständigen Verfügbarkeit. „Das muss man loslassen, sonst wird man zwangsläufig enttäuscht. Das ist eben so."

Damit rückt eine Fähigkeit in den Mittelpunkt, die lange unterschätzt wurde: Kompromissbereitschaft. Angenommen, zwei Freundinnen leben in verschiedenen Städten und in vollkommen unterschiedlichen Konstellationen - die eine mit drei Kindern, die andere in Schichtarbeit -, dann funktioniert der Kontakt nur, falls beide bereit sind, ihre Vorstellung von Nähe zu verändern. Für den Fall, dass ein Treffen erneut verschoben werden muss, hilft es, kleine Formen der Aufmerksamkeit fest zu verabreden: eine Sprachnachricht zwischen zwei Erledigungen, ein Anruf auf dem Weg zur nächsten Besorgung. Im Falle einer echten Krise zeige sich dann sehr schnell, ob die Substanz noch da sei, sagt Kolb.

Hinzu kommt eine dritte Entwicklung: Die Grenzen zwischen Freundschaft und Familie verschwimmen. Freundinnen und Freunde übernehmen Aufgaben, die früher der Verwandtschaft vorbehalten waren. Sie sind Patin oder Pate, Notfallkontakt, manchmal sogar Erbin. Bei einer solchen Nähe stellt sich die Frage nach Verbindlichkeit ganz neu - und mit ihr die Frage, was man einer anderen Person überhaupt anvertrauen darf.

Vielleicht liegt genau darin der eigentliche Befund. Freundschaft ist kein Zustand, sondern eine Praxis: Wer sie führen will, muss sie immer wieder herstellen. „Ruf doch mal an", sagt Kolb zum Abschied und lacht. „Du weißt ja selbst, wie das läuft. Unspektakulär, aber es wirkt schon."`;

const W1 = `- die Umbruchphase - faza velikih promena, prelomni period
- der Freundeskreis - krug prijatelja
- aushandeln - ispregovarati, dogovoriti pregovorima
- die Kompromissbereitschaft - spremnost na kompromis
- die Erledigung / die Besorgung - obaveza koju treba obaviti / nabavka
- verschwimmen - postati nejasan, zamagliti se (o granicama)
- die Verbindlichkeit - obavezujuća ozbiljnost dogovora
- anvertrauen - poveriti (nekome nešto)`;

// ---------------------------------------------------------------------------
// LEKCIJA 2 - Selbstbilder (Artikelwörter + Adjektivdeklination)
// ---------------------------------------------------------------------------
const T2_TITLE = "Zwischen Hochstapelei und Selbstzweifel";
const T2 = `Wer beruflich erfolgreich ist, müsste eigentlich wissen, dass er es ist. Die Forschung zeigt allerdings seit Jahrzehnten, dass diese naheliegende Annahme selten zutrifft. Zwischen dem, was Menschen tatsächlich leisten, und dem, was sie sich selbst zutrauen, klafft eine Lücke - und zwar in beide Richtungen.

Auf der einen Seite steht das sogenannte Imposter-Phänomen, das erstmals 1978 von zwei amerikanischen Psychologinnen beschrieben wurde. Betroffen sind Menschen, die sämtliche beruflichen Erfolge nicht der eigenen Kompetenz, sondern äußeren Umständen zuschreiben: Glück, Zufall, dem Wohlwollen anderer. Jede gelungene Präsentation bestätigt sie nicht, sondern erhöht die Angst, beim nächsten Mal als Betrügerin oder Betrüger entlarvt zu werden. „Solche absurden Zweifel sind erstaunlich hartnäckig", erklärt die Arbeitspsychologin Ines Fahrner. „Diese innere Unsicherheit lässt sich durch Lob kaum abbauen, denn jedes positive Feedback wird sofort umgedeutet."

Auf der anderen Seite steht das Hochstapeln, also die systematische Überschätzung der eigenen Fähigkeiten. Manche selbstsicheren Personen treten in jeder schwierigen Situation souverän auf, wissen bei allen offenen Fragen sofort Rat und wirken dadurch kompetenter, als sie sind. In Auswahlverfahren zahlt sich dieses Auftreten aus: Wer Klarheit ausstrahlt, wird häufiger befördert - unabhängig davon, ob die fachliche Grundlage wirklich vorhanden ist.

Beide Muster haben dieselbe Wurzel. Sie entstehen dort, wo Selbstwahrnehmung und Fremdwahrnehmung auseinanderfallen. Das Selbstkonzept, also die Gesamtheit aller Vorstellungen über die eigene Person, wird nämlich nicht laufend an der Realität überprüft; es wird gepflegt, verteidigt und gegen widersprechende Informationen abgeschirmt. Deshalb staunen viele Betroffene, wenn sie in einem Feedbackgespräch zum ersten Mal hören, wie andere sie wahrnehmen.

Aufschlussreich ist die gesellschaftliche Wertung dieser beiden Extreme. Bescheidenheit gilt als sympathische Eigenschaft, Arroganz wird dagegen abgelehnt. In der betrieblichen Praxis wird jedoch nicht die bescheidene, sondern die selbstbewusste Variante belohnt. Wer sich selbst systematisch unterschätzt, meldet sich seltener zu Wort und übernimmt seltener Verantwortung - trotz hoher Leistungsbereitschaft und ausgeprägter Zuverlässigkeit.

Was hilft? Fahrner rät, das eigene Selbstbild wie eine These zu prüfen: Welche konkreten Belege gibt es dafür, dass ich inkompetent bin? Welche sprechen dagegen? Wer diese Fragen schriftlich beantwortet, begreift meistens rasch, dass jenes düstere Bild vom eigenen Können auf wenigen Erinnerungen beruht. Selbstsicherheit, so verdeutlicht dieser Zugang, ist eben keine angeborene Eigenschaft, sondern das Ergebnis einer geübten Wahrnehmung.`;

const W2 = `- die Selbstwahrnehmung / die Fremdwahrnehmung - slika o samom sebi / slika koju drugi imaju o nekome
- entlarven - raskrinkati, razotkriti
- zuschreiben - pripisati (nekome nešto)
- hartnäckig - uporan, tvrdokoran
- umdeuten - drugačije protumačiti, preokrenuti značenje
- die Leistungsbereitschaft - spremnost na zalaganje
- befördern - unaprediti (na poslu)
- verdeutlichen - pojasniti, razjasniti`;

// ---------------------------------------------------------------------------
// LEKCIJA 3 - Mehrsprachigkeit (kausale Zusammenhänge)
// ---------------------------------------------------------------------------
const T3_TITLE = "In jeder Sprache ein anderer Mensch?";
const T3 = `Dr. Alenka Bervar leitet an der Universität Graz eine Forschungsgruppe zur Mehrsprachigkeit. Anlässlich der Veröffentlichung ihrer neuen Studie haben wir mit ihr gesprochen.

Frau Bervar, viele mehrsprachige Menschen sagen, sie fühlten sich in ihren Sprachen unterschiedlich. Ist das mehr als ein Gefühl?

Es ist deutlich mehr. Wir haben 640 bilinguale und mehrsprachige Personen befragt, und ein großer Teil der Befragten beschreibt genau das: In der Erstsprache wirken sie emotionaler, in der später erlernten Sprache tendenziell sachlicher und distanzierter. Aufgrund dieser sehr stabilen Ergebnisse gehen wir heute davon aus, dass die Sprachwahl tatsächlich beeinflusst, wie jemand auf andere wirkt.

Woran liegt das?

Vor allem daran, dass die Erstsprache mit früher Erfahrung verknüpft ist. Wer in einer Sprache getröstet, gelobt und auch geschimpft wurde, verfügt in ihr über ein dichtes Netz an Erinnerungen. In einer Fremdsprache fehlt diese Nähe; mangels emotionaler Vorgeschichte bleibt vieles kühler. Deshalb klingt dieselbe Person in zwei Sprachen mitunter wie zwei verschiedene Menschen. Das kann belastend sein, hat aber auch eine befreiende Seite: Viele Studienteilnehmerinnen berichten, dass sie sich in der zweiten Sprache mehr trauen, zumal die Normen und Rollen der Erstsprache dort nicht gelten.

Verändert sich also die Persönlichkeit?

Diesen Begriff vermeide ich. Die Persönlichkeit bleibt; es verändert sich lediglich die Version, die aktiviert wird. Menschen passen sich unbewusst an den Kontext an, in dem sie eine Sprache erlernt haben. Wer Deutsch ausschließlich im Beruf gelernt hat, klingt auf Deutsch pflichtbewusster und gewissenhafter - nicht weil er es ist, sondern weil er die Sprache in genau diesem Rahmen verwendet.

Welche Rolle spielen Dialekt und Standardsprache?

Eine größere, als man gemeinhin denkt. Zwischen Regionalsprache und Hochdeutsch wechseln viele Menschen ebenso souverän wie zwischen zwei Fremdsprachen. Angesichts solcher Beobachtungen ist die alte Vorstellung von der einen richtigen Sprache kaum noch zu halten.

Was folgt daraus für die Schulen?

Sehr viel. Kinder bringen Familiensprachen mit, die im Unterricht meist keine Rolle spielen. Aus diesem Grund fordern wir, diese Sprachen sichtbar zu machen - nicht als Folklore, sondern als kognitive Ressource. Dass das mancherorts noch als Schnapsidee gilt, liegt weniger an der Forschung als an der Verwaltung: Es fehlt an Personal, und mangels ausgebildeter Lehrkräfte scheitern gute Konzepte oft schon im ersten Jahr.

Ihre wichtigste These in einem Satz?

Mehrsprachigkeit ist kein Sonderfall, sondern der Normalfall - und da mehr als die Hälfte der Weltbevölkerung mehrsprachig lebt, sollten wir endlich aufhören, sie als Ausnahme zu behandeln.`;

const W3 = `- die/der Befragte - ispitanica / ispitanik
- verknüpft mit + Dativ - povezan sa
- mangels + Genitiv - u nedostatku, zbog nedostatka
- zumal - tim pre što, pogotovo jer
- angesichts + Genitiv - s obzirom na, imajući u vidu
- pflichtbewusst / gewissenhaft - odgovoran, svestan dužnosti / savestan
- die Schnapsidee - suluda, blesava zamisao
- die Ressource - resurs, potencijal`;

const LESSONS = [
  {
    title: "Freundschaft - Was bedeutet das eigentlich?",
    textTitle: T1_TITLE,
    text: T1,
    hilfe: W1,
    exTitle: "Leseverstehen: Freundschaft im Wandel",
    questions: [
      [
        "Welche Aussage gibt die Hauptaussage des Textes am besten wieder?",
        [
          "Freundschaften enden in der Regel durch einen konkreten Streit.",
          "Freundschaften bleiben nur bestehen, wenn beide Seiten sie aktiv gestalten und ihre Erwartungen anpassen.",
          "Freundschaften sind heute unwichtiger als früher, weil die Familie ihre Rolle übernimmt.",
          "Freundschaften funktionieren nur dann, wenn beide Personen in derselben Stadt leben.",
        ],
        1,
        "Tekst kroz sve pasuse pokazuje da prijateljstvo nije stanje nego praksa koja traži stalno usklađivanje očekivanja.",
      ],
      [
        "Wie erklärt der Text, dass Freundschaften in Umbruchphasen oft leiser werden?",
        [
          "Weil Menschen ihren Freundeskreis in solchen Phasen unbewusst neu ordnen.",
          "Weil in solchen Phasen fast immer ein Streit um Geld entsteht.",
          "Weil Umbruchphasen nach Ansicht der Forschung nur selten vorkommen.",
          "Weil die meisten Menschen den Kontakt in solchen Phasen bewusst abbrechen.",
        ],
        0,
        "U drugom pasusu stoji da onaj ko se seli, dobija dete ili menja posao nesvesno iznova uređuje svoj krug prijatelja.",
      ],
      [
        "Was ist laut Miriam Kolb die Voraussetzung dafür, dass eine Freundschaft jede Lebensphase übersteht?",
        [
          "Dass sich beide Seiten möglichst häufig persönlich treffen.",
          "Dass sich beide Seiten in derselben Lebenssituation befinden.",
          "Dass beide Seiten ihre Erwartungen regelmäßig anpassen.",
          "Dass beide Seiten auf feste Rituale und Gewohnheiten verzichten.",
        ],
        2,
        "Kolb doslovno kaže: prijateljstvo izdrži svaku životnu fazu pod uslovom da obe strane redovno prilagođavaju očekivanja.",
      ],
      [
        "Welchen praktischen Rat enthält der Text für Freundschaften über große Entfernungen?",
        [
          "Man sollte auf persönliche Treffen von vornherein ganz verzichten.",
          "Man sollte die Freundschaft beenden, wenn Treffen mehrfach verschoben werden.",
          "Man sollte sich unbedingt auf einen festen wöchentlichen Termin einigen.",
          "Man sollte kleine Formen der Aufmerksamkeit im Alltag fest verabreden.",
        ],
        3,
        "Tekst preporučuje da se dogovore mali oblici pažnje - glasovna poruka između dve obaveze ili poziv usput.",
      ],
      [
        "Welche Absicht verfolgt der Text vor allem?",
        [
          "Er will zeigen, dass Freundschaft weniger ein Zustand als eine ständige Praxis ist.",
          "Er will vor den Gefahren sozialer Netzwerke warnen.",
          "Er will belegen, dass Freundschaften unter Erwachsenen grundsätzlich scheitern.",
          "Er will die Leserinnen und Leser auffordern, ihren Freundeskreis deutlich zu verkleinern.",
        ],
        0,
        "Zaključak eksplicitno kaže: prijateljstvo nije stanje nego praksa koju treba stalno iznova uspostavljati.",
      ],
      [
        "„Die Grenzen zwischen Freundschaft und Familie verschwimmen.\" Was bedeutet „verschwimmen\" hier?",
        [
          "Die Grenzen werden strenger kontrolliert.",
          "Die Grenzen verschwinden vollständig.",
          "Die Grenzen sind nicht mehr klar zu erkennen.",
          "Die Grenzen werden schriftlich neu festgehalten.",
        ],
        2,
        "„Verschwimmen\" znači da nešto gubi jasne obrise - granice postoje, ali se više ne raspoznaju jasno.",
      ],
    ],
  },
  {
    title: "Selbstbilder - Hoch- und Tiefstapeln",
    textTitle: T2_TITLE,
    text: T2,
    hilfe: W2,
    exTitle: "Leseverstehen: Selbstbild und Fremdbild",
    questions: [
      [
        "Welche Aussage fasst die Kernthese des Textes am besten zusammen?",
        [
          "Menschen mit großem Selbstbewusstsein sind meistens auch fachlich am besten.",
          "Das Imposter-Phänomen betrifft nahezu alle Berufstätigen.",
          "Selbsteinschätzung und tatsächliche Leistung stimmen häufig nicht überein - und zwar in beide Richtungen.",
          "Bescheidenheit wird im Berufsleben zuverlässig belohnt.",
        ],
        2,
        "Već u prvom pasusu stoji da između učinka i samoprocene postoji jaz, i to u oba smera - to je okosnica celog teksta.",
      ],
      [
        "Welche Funktion hat der letzte Absatz im Text?",
        [
          "Er fasst die Entstehungsgeschichte des Imposter-Phänomens zusammen.",
          "Er widerlegt die zuvor dargestellten Forschungsergebnisse.",
          "Er warnt davor, das eigene Selbstbild infrage zu stellen.",
          "Er bietet einen praktischen Ansatz, das eigene Selbstbild zu überprüfen.",
        ],
        3,
        "Poslednji pasus donosi konkretan savet: proveriti sliku o sebi kao tezu, pisanim putem, uz argumente za i protiv.",
      ],
      [
        "Wie gehen Menschen mit Imposter-Phänomen laut Text mit ihren Erfolgen um?",
        [
          "Sie führen sie auf äußere Umstände wie Glück und Zufall zurück.",
          "Sie nutzen sie, um eine höhere Bezahlung zu fordern.",
          "Sie berichten möglichst vielen Kolleginnen und Kollegen davon.",
          "Sie werden durch sie dauerhaft selbstsicherer.",
        ],
        0,
        "U tekstu piše da sve poslovne uspehe pripisuju spoljnim okolnostima - sreći, slučaju, naklonosti drugih - a ne sopstvenoj kompetenciji.",
      ],
      [
        "Was sagt der Text über Auswahlverfahren im Beruf?",
        [
          "Sie erkennen fachliche Schwächen in der Regel zuverlässig.",
          "Ein selbstsicheres Auftreten erhöht die Chance auf eine Beförderung.",
          "Bescheidene Personen werden in ihnen deutlich bevorzugt.",
          "Sie spielen für den beruflichen Aufstieg kaum eine Rolle.",
        ],
        1,
        "Tekst kaže da se nastup isplati: ko zrači jasnoćom, češće biva unapređen, nezavisno od stvarne stručne osnove.",
      ],
      [
        "Warum wird das Selbstkonzept laut Text nur selten korrigiert?",
        [
          "Weil es von Vorgesetzten bewusst geschützt wird.",
          "Weil es sich im Erwachsenenalter biologisch nicht mehr verändern kann.",
          "Weil Feedbackgespräche in den meisten Betrieben unüblich sind.",
          "Weil widersprechende Informationen von ihm abgeschirmt werden.",
        ],
        3,
        "U četvrtom pasusu piše da se samokoncept ne proverava stalno u stvarnosti, već se neguje, brani i štiti od protivrečnih informacija.",
      ],
      [
        "„... beim nächsten Mal als Betrügerin oder Betrüger entlarvt zu werden.\" Was bedeutet „entlarven\" in diesem Zusammenhang?",
        [
          "jemanden für seine Leistung öffentlich loben",
          "aufdecken, dass jemand nicht der ist, für den er gehalten wird",
          "jemanden zu einer neuen Aufgabe überreden",
          "jemanden vor Kritik in Schutz nehmen",
        ],
        1,
        "„Entlarven\" znači razotkriti nekoga - pokazati da nije ono za šta se izdaje ili za šta ga drugi smatraju.",
      ],
    ],
  },
  {
    title: "Mehrsprachigkeit - Wie wir Sprachen (er)leben",
    textTitle: T3_TITLE,
    text: T3,
    hilfe: W3,
    exTitle: "Leseverstehen: Mehrsprachigkeit und Persönlichkeit",
    questions: [
      [
        "Welche Kernaussage vertritt Frau Bervar im Interview?",
        [
          "Mehrsprachige Menschen haben mehrere voneinander getrennte Persönlichkeiten.",
          "Die Sprachwahl beeinflusst die Wirkung einer Person, ohne dass sich ihre Persönlichkeit ändert.",
          "Die Erstsprache sollte im Alltag möglichst vermieden werden.",
          "Fremdsprachen lassen sich nur im Kindesalter wirklich erlernen.",
        ],
        1,
        "Bervar izričito odbacuje pojam promene ličnosti: ličnost ostaje, menja se samo verzija koja se aktivira u datom jeziku.",
      ],
      [
        "Wie erklärt Bervar die stärkere emotionale Wirkung der Erstsprache?",
        [
          "Durch die größere Zahl an Wörtern, die man in ihr kennt.",
          "Durch die einfachere Grammatik der Erstsprache.",
          "Durch die frühen Erfahrungen, die mit dieser Sprache verknüpft sind.",
          "Durch den Unterricht, in dem sie systematisch gelernt wurde.",
        ],
        2,
        "Objašnjenje glasi da je prvi jezik povezan sa ranim iskustvima - tešenjem, pohvalom, grdnjom - pa u njemu postoji gusta mreža sećanja.",
      ],
      [
        "Warum trauen sich viele Studienteilnehmerinnen in der zweiten Sprache mehr?",
        [
          "Weil dort die Normen und Rollen der Erstsprache nicht gelten.",
          "Weil sie in der zweiten Sprache über einen größeren Wortschatz verfügen.",
          "Weil sie in der zweiten Sprache seltener korrigiert werden.",
          "Weil ihnen die zweite Sprache emotional näher ist.",
        ],
        0,
        "U tekstu stoji rečenica sa „zumal\": u drugom jeziku norme i uloge prvog jezika ne važe, pa se ljudi više usuđuju.",
      ],
      [
        "Woran scheitern gute Konzepte für Familiensprachen an Schulen laut Bervar vor allem?",
        [
          "An der ablehnenden Haltung der Eltern.",
          "An fehlenden Forschungsergebnissen.",
          "An Kindern, die ihre Familiensprache verbergen wollen.",
          "Am Mangel an ausgebildeten Lehrkräften.",
        ],
        3,
        "Bervar kaže da problem nije u istraživanju nego u upravi: nedostaje kadra, pa dobri koncepti propadaju „mangels ausgebildeter Lehrkräfte\".",
      ],
      [
        "Welche Absicht verfolgt Bervar mit dem letzten Satz des Interviews?",
        [
          "Sie will zeigen, dass Mehrsprachigkeit nur eine kleine Minderheit betrifft.",
          "Sie will vor den Risiken früher Mehrsprachigkeit warnen.",
          "Sie will den Blick auf Mehrsprachigkeit als Normalfall verschieben.",
          "Sie will für Sprachkurse für Erwachsene werben.",
        ],
        2,
        "Poslednja rečenica kaže da višejezičnost nije izuzetak nego pravilo i da bi trebalo prestati da se tretira kao izuzetak.",
      ],
      [
        "„Dass das mancherorts noch als Schnapsidee gilt ...\" Was ist mit „Schnapsidee\" gemeint?",
        [
          "eine verrückte, unüberlegte Idee",
          "ein Vorschlag, der besonders viel Geld kostet",
          "eine Idee, die unmittelbar aus der Forschung stammt",
          "ein Plan, der bereits mehrfach erfolgreich erprobt wurde",
        ],
        0,
        "„Schnapsidee\" je jedna od teško prevodivih nemačkih reči iz ove lekcije i znači suludu, nepromišljenu zamisao.",
      ],
    ],
  },
];

// --- provere pre upisa -----------------------------------------------------
const BAD_DASH = /[–—]/;
function checkNoBadDash(label, s) {
  if (BAD_DASH.test(s)) { console.error(`✗ ${label}: sadrži dugu crticu (– ili —) - popravi pre upisa.`); process.exit(1); }
}
function wordCount(s) { return s.trim().split(/\s+/).length; }

for (const L of LESSONS) {
  checkNoBadDash(`${L.title} / tekst`, L.text);
  checkNoBadDash(`${L.title} / Wortschatzhilfe`, L.hilfe);
  for (const [q, items, , expl] of L.questions) {
    checkNoBadDash(`${L.title} / pitanje`, q + " " + items.join(" ") + " " + expl);
  }
}

// --- upis ------------------------------------------------------------------
for (const L of LESSONS) {
  const { data: lesson } = await sb.from("lessons").select("id,sections").eq("course_id", CID).eq("title", L.title).maybeSingle();
  if (!lesson) { console.error(`✗ "${L.title}" ne postoji - preskačem`); continue; }

  const existing = Array.isArray(lesson.sections) ? lesson.sections : [];
  const had = existing.some((s) => s.type === "text" && typeof s.content === "string" && s.content.startsWith(MARK));
  const wc = wordCount(L.text);
  const spread = L.questions.map(([, , c]) => c).join(",");
  console.log(`${had ? "~" : "+"} "${L.title}"`);
  console.log(`   Lesetext: "${L.textTitle}" (${wc} reči) ${had ? "- zamena" : "- dodavanje"}`);
  console.log(`   Vežba: "${L.exTitle}" - ${L.questions.length} pitanja, tačni indeksi: ${spread}`);
  if (wc < 350 || wc > 450) console.warn(`   ⚠ dužina van opsega 350-450 reči (${wc})`);
  if (!APPLY) continue;

  // 1) sekcija sa Lesetext-om: skini staru svoju, ubaci novu pre prvog "## 📘"
  const base = existing.filter((s) => !(s.type === "text" && typeof s.content === "string" && s.content.startsWith(MARK)));
  let idx = base.findIndex((s) => s.type === "text" && typeof s.content === "string" && s.content.startsWith(GRAMMAR_MARK));
  if (idx === -1) idx = base.length;
  base.splice(idx, 0, {
    type: "text",
    style: "beispiele",
    content: `${MARK} Lesetext: ${L.textTitle}\n\n${L.text}\n\n**Wortschatzhilfe**\n\n${L.hilfe}`,
  });
  const { error: upErr } = await sb.from("lessons").update({ sections: base }).eq("id", lesson.id);
  if (upErr) { console.error(`   ✗ update sekcija: ${upErr.message}`); continue; }

  // 2) vežba: obriši svoju staru po naslovu, napravi novu na max(order_index)+1
  await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("title", L.exTitle);
  const { data: rest } = await sb.from("exercises").select("order_index").eq("lesson_id", lesson.id);
  const nextIdx = (rest || []).reduce((m, e) => Math.max(m, e.order_index ?? 0), 0) + 1;
  const { data: ex, error: exErr } = await sb.from("exercises")
    .insert({ lesson_id: lesson.id, title: L.exTitle, exercise_type: "quiz", order_index: nextIdx })
    .select("id").single();
  if (exErr) { console.error(`   ✗ insert vežbe: ${exErr.message}`); continue; }

  const context = { type: "text", title: L.textTitle, content: L.text };
  let i = 0;
  for (const [question, items, correct, explanation] of L.questions) {
    const { error } = await sb.from("exercise_questions").insert({
      exercise_id: ex.id,
      question,
      options: { type: "quiz", items, context },
      correct_answer: String(correct),
      explanation,
      question_type: "quiz",
      order_index: i++,
    });
    if (error) console.error(`   ✗ pitanje ${i}: ${error.message}`);
  }
  console.log(`   ✓ upisano (vežba order_index=${nextIdx})`);
}

console.log(APPLY ? "✓ Gotovo (C1.1 Modul 1 - Lesetexte + Leseverstehen)" : "[DRY] --apply za upis.");
