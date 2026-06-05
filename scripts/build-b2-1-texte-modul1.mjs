// B2.1 — Lesetexte (prekucani iz Vielfalt B2.1 KB), MODUL 1.
// Dodaje text-sekciju (marker "## 📖") u lekcije; idempotentno. Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const COURSE_SLUG = "nemacki-b2-1";
const MARK = "## 📖";

const L1 = `${MARK} Lesetext: Veränderungen wagen – glücklich werden

Den eigenen Weg zu finden und das Leben neu zu gestalten – das wünschen sich viele. Trotzdem fällt es den meisten schwer, vertraute Wege zu verlassen und eine neue Richtung einzuschlagen. Die Gründe dafür sind vielfältig: das fehlende Geld, die Erwartungen der anderen und ganz besonders die Angst vor dem Misserfolg.

Drei Menschen waren auf unterschiedliche Weise mit ihrem Leben unzufrieden, wagten es aber irgendwann, ihr Leben zu hinterfragen und neue Wege zu gehen. Hier berichten sie über die wichtigste Veränderung in ihrem Leben.

**1. Aus dem Lärm in die Ruhe — Jakob Graf, 40, Pädagoge, Berlin**

35 Jahre lang habe ich in einer Großstadt gelebt. Das bedeutet: viel Lärm, Staub und Stress. Je älter ich wurde, desto mehr habe ich mich nach Ruhe und Natur gesehnt. Ich wollte nah am Wasser wohnen, am liebsten auf einem eigenen Hausboot. Es hat ziemlich lange gedauert, bis ich diesen Traum verwirklichen konnte. Ein Baukredit hat mir dabei geholfen – und ohne die Unterstützung meines Vaters hätte das wohl auch nicht geklappt. Seit einem Jahr wohne ich jetzt auf meinem eigenen Hausboot. Und es ist einfach großartig. Als Pädagoge gebe ich meine Begeisterung fürs Wasser nämlich gern an Kinder weiter. Ich arbeite mit Schulen und Kindergärten zusammen und wir organisieren regelmäßig Tagesausflüge. Solche Aktivitäten finde ich wichtig, denn sie bieten den Kindern viele Anregungen. Ich habe gemerkt: Wenn ich am Wasser bin, fühle ich mich ruhiger und mit mir und der Natur verbunden.

**2. Wind und Wellen spüren — Anja Weber, 33, Surflehrerin, Kiel**

Nach dem Abitur habe ich eine Ausbildung zur Bürokauffrau gemacht und gleich danach angefangen zu arbeiten. Relativ schnell habe ich festgestellt, dass dieser Beruf nichts für mich ist. Ich liebe die Bewegung. Im Büro fühlte ich mich einfach eingesperrt. Ich war richtig unglücklich, aber ich hatte natürlich auch Angst, meinen Job aufzugeben. Es hat fünf Jahre gedauert, bis ich all meinen Mut zusammengenommen habe. Ein alter Schulfreund hat mich beraten und unterstützt. Wir haben zusammen eine Surfschule gegründet – und ich habe dann tatsächlich gekündigt. Seitdem sieht mein Alltag komplett anders aus. Am Vormittag sitze ich mit meinen Surfschülern am Strand und erkläre ihnen die wichtigsten Surfregeln. Dann geht's entweder zusammen aufs Wasser oder ich bleibe am Strand und mache Videos von meinen Schülern. Ich zeige sie ihnen dann und gebe ihnen Hinweise für den nächsten Tag. Ich muss sagen: Meine finanzielle Situation ist jetzt deutlich unsicherer. Es ist gar nicht so leicht, sich seinen Lebensunterhalt als Surflehrerin zu verdienen. Aber ich bin mit meinem neuen Beruf sehr zufrieden. Die Nähe zum Meer und der Kontakt zu Menschen machen mich glücklich.

**3. Auch mal „Nein" sagen — Marcel Lauber, 50, Unternehmensberater, Hamburg**

Ich habe steil Karriere gemacht: Ziemlich schnell nach der ersten Stelle habe ich eine Führungsposition bekommen. Ich stand jeden Tag unter Druck. Mein Terminkalender war immer voll. Ich hatte keine Zeit und auch keine Energie für ein Privatleben. Wenn ich zu Hause war, wollte ich nur noch schlafen. Vor fünf Jahren bin ich eines Abends völlig erschöpft nach Hause gefahren und habe einen Unfall verursacht. Ich habe ihn nur knapp überlebt. Das war ein Schock – und der entscheidende Wendepunkt in meinem Leben. Mein altes Leben kam mir plötzlich so sinnlos vor. Ich habe angefangen, meinen Lebensstil zu hinterfragen. Was will ich eigentlich? Was ist mir wichtig? Ich habe ein Jahr Urlaub genommen und angefangen zu meditieren. Das hat mein Leben verändert. Seit zwei Jahren arbeite ich wieder. Den Job habe ich zwar nicht gewechselt, aber meine Einstellung zur Arbeit geändert. Ich lege jetzt großen Wert darauf, bewusster und gesünder zu leben. Darum habe ich auch meine Ernährung umgestellt. In der Mittagspause gehe ich spazieren. Außerdem versuche ich, auf der Arbeit auch mal „Nein" zu sagen. Das kommt nicht immer gut an, aber meine Gesundheit ist mir wichtiger als die Karriere.

*(Quelle: Vielfalt B2.1, Hueber Verlag)*`;

const L2 = `${MARK} Lesetext: Zwischen den Kulturen

*Ein Beitrag zum Internationalen Tag der Migranten – sechs Migrationsgeschichten.*

**1. William Wagner (67)** lebt in Minneapolis in den USA und erforscht seine Familiengeschichte. Dabei hat er herausgefunden, dass sein Urgroßvater Friedrich Deutschland 1893 aus wirtschaftlichen Gründen verlassen hat und in die USA emigriert ist.

**2. Zeliha Yildiz (49)** ist in Deutschland geboren und hat einen türkischen Migrationshintergrund. Ihre Eltern waren sogenannte Gastarbeiter. Sie sind in den 1960er-Jahren eingewandert, um in Deutschland zu arbeiten.

**3. Jaro Babic (33)** und seine Familie sind 1994 aus Bosnien-Herzegowina, im ehemaligen Jugoslawien, vor dem Krieg geflohen. In Deutschland konnten sie Asyl beantragen. Nach dem Krieg kehrten sie nach Bosnien zurück.

**4. Ruth Guttmann (80)** ist 1943 mit ihrer Familie vor den Nationalsozialisten geflohen und fand in Israel eine neue Heimat. Die Familie nahm die israelische Staatsbürgerschaft an. Ruth ist nie wieder nach Deutschland zurückgekehrt.

**5. Oksana Zimmer (36)** ist 1993 mit ihrer Familie aus Russland nach Deutschland gekommen. Da sie nachweisen konnten, dass sie deutsche Vorfahren hatten, wurden sie als Spätaussiedler anerkannt. In Deutschland hoffte die Familie, ihre Lebensbedingungen verbessern zu können.

**6. Ronny Brand (38)** hat schon immer Fernweh gehabt. Mit 16 Jahren brach er von Hamburg zu seiner ersten Reise auf und war seitdem immer unterwegs. In sieben Ländern hat er schon gelebt und gearbeitet. Jetzt hat er sich in Thailand niedergelassen und eine kleine Bar am Strand eröffnet.

*(Quelle: Vielfalt B2.1, Hueber Verlag)*`;

const L3 = `${MARK} Lesetext: Wien am Sonntag – Lieblingsorte

In der Kategorie *Lieblingsorte* verraten uns Wahlwiener, wo sie sich sonntags am liebsten aufhalten. Lernen Sie die Stadt Wien von einer neuen Perspektive kennen!

**Hitomi Sato, Stadtführerin aus Japan — Wiens zentrale Fußgängerzone: der „Graben"**

Wenn ich am Sonntagnachmittag nach einer Stadtführung Zeit habe, setze ich mich gern in mein Stammlokal, das am Graben liegt. Dieses Restaurant ist für mich schon etwas Besonderes: die feine Küche kombiniert österreichische Traditionsgerichte mit asiatischen Einflüssen. Da gibt es immer wieder schöne Überraschungen für mich! Hier kann ich auch stundenlang lesen und schreiben.

**Leandro Costa, Instrumentenbauer aus Brasilien — Ruhe nahe der Großstadt: Nationalpark an der Donau**

Mein Lieblingsort in Wien liegt eigentlich außerhalb Wiens: der Nationalpark an der Donau. Sonntags habe ich oft Heimweh. Dann fahre ich gern in den Nationalpark. Denn wenn ich dort das Singen der Vögel und die Geräusche der Natur höre, fühle ich mich ein bisschen wie in meiner Heimatstadt Manaus am Amazonas.

**Aleeke Bekono-Gruber, Architekt aus Kamerun — Blick über Wien: auf dem Turm des Stephansdoms**

Sonntags gehe ich gern auf den Turm des Stephansdoms, weil man von dort oben ganz wunderbar die vielen alten Häuser aus den verschiedenen Jahrhunderten sieht. Das ist für mich als Architekten ein besonders schönes Erlebnis! Übrigens habe ich meiner Frau auf dem Turm einen Heiratsantrag gemacht.

*(Quelle: Vielfalt B2.1, Hueber Verlag)*`;

const ITEMS = [
  ["Das Leben neu gestalten – Vielfalt B2.1", L1],
  ["Migration", L2],
  ["WIEN", L3],
];

const { data: course } = await sb.from("courses").select("id").eq("slug", COURSE_SLUG).single();
if (!course) { console.error(`Kurs ${COURSE_SLUG} ne postoji`); process.exit(1); }

for (const [title, text] of ITEMS) {
  const { data: lesson } = await sb.from("lessons").select("id,sections").eq("course_id", course.id).eq("title", title).maybeSingle();
  if (!lesson) { console.error(`✗ Lekcija "${title}" ne postoji — preskačem`); continue; }
  const existing = Array.isArray(lesson.sections) ? lesson.sections : [];
  const had = existing.some((s) => s.type === "text" && typeof s.content === "string" && s.content.startsWith(MARK));
  console.log(`${had ? "~" : "+"} "${title}": Lesetext ${had ? "(zamena)" : "(dodavanje)"} (${text.length} zn)`);
  if (!APPLY) continue;
  const base = existing.filter((s) => !(s.type === "text" && typeof s.content === "string" && s.content.startsWith(MARK)));
  const sec = { type: "text", content: text, style: "beispiele" };
  // ubaci posle videa (ili na početak posle badge-a), pre gramatike/vokabulara
  let idx = base.findIndex((s) => s.type === "vocabulary" || (s.type === "text" && typeof s.content === "string" && s.content.startsWith("## 📘")));
  if (idx === -1) idx = base.length;
  base.splice(idx, 0, sec);
  const { error } = await sb.from("lessons").update({ sections: base }).eq("id", lesson.id);
  if (error) throw error;
}
console.log(APPLY ? "✓ Gotovo (Modul 1 Lesetexte)" : "[DRY] Pokreni sa --apply za upis.");
