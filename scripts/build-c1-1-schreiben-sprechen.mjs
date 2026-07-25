// C1.1 - dodaje lekciju „Schreiben und Sprechen“ (produktivne veštine): Redemittel + 4 pismena zadatka
// (po jedan na temu svakog modula) + 2 usmena zadatka (Vortrag, Diskussion).
// Kurs `nemacki-c1-1` je imao 0 essay i 0 sprechen vežbi - ovo popunjava tu rupu.
// Idempotentno (lekcija se traži po naslovu, vežbe se brišu po naslovu pa ponovo prave).
// Dry-run default; --apply za upis.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const CID = "3bfe17d7-62fa-4b06-b844-b10db9acd5ed";
const LESSON_TITLE = "Schreiben und Sprechen - C1.1";
const MODULE = "Schreiben und Sprechen";

const SECTIONS = [
  { type: "badge", module: MODULE, category: "schreiben" },
  {
    type: "text",
    style: "info",
    content: `## 🎯 O ovoj lekciji

Do sada si u kursu radio/la na razumevanju, gramatici i rečima. Ovde vežbaš ono što se na ispitu i u stvarnom životu najviše broji - da sam/a proizvedeš tekst i govor na nivou C1.

U lekciji te čekaju:

• **4 pismena zadatka** (Schreiben) - po jedan na temu svakog modula, u formatima koji se traže na C1: prilog u diskusiji, formalno pismo, komentar i stručno mišljenje;
• **2 usmena zadatka** (Sprechen) - izlaganje (Vortrag) i diskusija; svoj odgovor snimaš direktno u pregledaču;
• **Redemittel** - gotove formulacije koje ti trebaju za oba dela.

Kad pošalješ zadatak, on stiže profesorki na pregled. Ne moraš da uradiš sve odjednom - najbolje je po jedan zadatak posle svakog modula.`,
  },
  {
    type: "text",
    style: "default",
    content: `## ✍️ Redemittel: Schreiben (Diskussionsbeitrag, Kommentar, Stellungnahme)

**Einleitung - Thema einführen**
• In letzter Zeit wird immer häufiger darüber diskutiert, ob ...
• Die Frage, ob ..., beschäftigt derzeit nicht nur Fachleute, sondern auch ...
• Kaum ein Thema wird so kontrovers diskutiert wie ...

**Eigene Position markieren**
• Meiner Ansicht nach überwiegen die Vorteile, und zwar aus mehreren Gründen.
• Ich vertrete den Standpunkt, dass ...
• Bei aller berechtigten Kritik halte ich es für sinnvoll, ...

**Argumente entfalten und stützen**
• Ein zentrales Argument dafür ist, dass ...
• Dies lässt sich anhand eines Beispiels aus meinem Heimatland verdeutlichen: ...
• Hinzu kommt, dass ... Nicht zuletzt spielt eine Rolle, dass ...

**Gegenargumente einräumen (konzessiv)**
• Zwar wird oft eingewandt, dass ..., doch übersieht dieser Einwand, dass ...
• Es trifft zu, dass ...; daraus folgt jedoch keineswegs, dass ...
• So berechtigt dieser Hinweis auch sein mag, er entkräftet nicht das Argument, dass ...

**Schluss**
• Abschließend lässt sich festhalten, dass ...
• Aus den genannten Gründen plädiere ich dafür, ...
• Ob sich diese Entwicklung durchsetzt, bleibt abzuwarten; entscheidend wird sein, ob ...

**Formalno pismo - okvir**
• Sehr geehrte Damen und Herren, / Sehr geehrter Herr ...,
• Mit Interesse habe ich erfahren, dass ... / Ich wende mich an Sie, weil ...
• Ich wäre Ihnen sehr verbunden, wenn Sie ... könnten.
• Über eine baldige Rückmeldung würde ich mich freuen. Mit freundlichen Grüßen, ...

💡 Na C1 se ne ocenjuje samo tačnost nego i **povezanost teksta**. Koristi konektore koje si učio/la u modulima (dennoch, zumal, insofern, folglich, wohingegen) i izbegavaj da svaku rečenicu počinješ sa „ich“.`,
  },
  {
    type: "text",
    style: "default",
    content: `## 🗣️ Redemittel: Sprechen (Vortrag und Diskussion)

**Vortrag - Einstieg**
• Ich möchte heute auf das Thema ... eingehen, das mir aus folgendem Grund wichtig erscheint: ...
• Mein Vortrag gliedert sich in drei Teile: Zunächst ..., anschließend ..., abschließend ...

**Vortrag - Hauptteil gliedern**
• Lassen Sie mich zunächst auf ... eingehen.
• Damit komme ich zum zweiten Punkt, nämlich ...
• Besonders hervorheben möchte ich, dass ...

**Vortrag - Schluss**
• Zusammenfassend lässt sich sagen, dass ...
• Ich komme damit zum Schluss und möchte folgende Frage in den Raum stellen: ...

**Diskussion - Standpunkt äußern**
• Ich bin der festen Überzeugung, dass ...
• Aus meiner Sicht spricht vieles dafür, dass ...

**Diskussion - auf andere reagieren**
• Da muss ich Ihnen entschieden widersprechen, denn ...
• Ihrem Argument kann ich insofern zustimmen, als ...
• Das ist ein berechtigter Einwand, allerdings sollte man bedenken, dass ...

**Diskussion - vermitteln und abschließen**
• Vielleicht können wir uns darauf einigen, dass ...
• Ich schlage vor, dass wir es folgendermaßen halten: ...

💡 Pre snimanja napravi kratak plan (3 tačke, po dve reči). Ne piši ceo govor - na C1 se čuje kad se tekst čita. Ako zapneš, koristi „Moment, lassen Sie mich das anders formulieren ...“ umesto da staneš.`,
  },
  { type: "text", style: "info", content: `### Kako se zadatak ocenjuje` },
  {
    type: "table",
    headers: ["Šta se gleda", "Na šta da paziš"],
    rows: [
      ["Ispunjenost zadatka", "Obradi sve tačke iz zadatka, ne samo one lakše."],
      ["Koherencija", "Jasan uvod, razrada i zaključak; konektori umesto pukog nabrajanja."],
      ["Rečnik", "Precizne kolokacije umesto opštih reči: ne „machen“, nego „einen Beitrag leisten“."],
      ["Struktura rečenice", "Smenjuj duže i kraće rečenice; koristi proširene atribute i nominalizacije."],
      ["Tačnost", "Padeži posle predloga, red reči u zavisnoj rečenici, kongruencija."],
    ],
  },
  { type: "text", style: "info", content: `Preporučena dužina i vreme dati su uz svaki zadatak.` },
];

const ESSAYS = [
  {
    title: "Schreiben 1: Freundschaft im digitalen Zeitalter",
    task: `Teil 1 (vorgeschlagene Arbeitszeit: 50 Minuten)

Für das Internetforum „Gesellschaft heute“ verfassen Sie einen Diskussionsbeitrag zu diesem Thema:

Freundschaft auf Knopfdruck
Verlernen wir durch soziale Netzwerke, echte Nähe aufzubauen?

- Erläutern Sie, welche Rolle soziale Netzwerke für Freundschaften in Ihrem Umfeld spielen.
- Nennen Sie Gründe, warum digitale Kontakte persönliche Begegnungen nur begrenzt ersetzen können.
- Gehen Sie auf ein Gegenargument ein und entkräften Sie es.
- Ziehen Sie ein begründetes Fazit.

Schreiben Sie einen zusammenhängenden Text von circa 230 Wörtern. Achten Sie auf einen sachlichen Stil und auf klare Übergänge zwischen den Absätzen.`,
  },
  {
    title: "Schreiben 2: Mobilität - formelle Beschwerde",
    task: `Teil 2 (vorgeschlagene Arbeitszeit: 25 Minuten)

In Ihrer Stadt wurde die Buslinie, mit der Sie täglich zur Arbeit fahren, ab dem kommenden Monat auf einen Zweistundentakt reduziert. Für Berufstätige und für Menschen mit eingeschränkter Mobilität bedeutet das eine erhebliche Verschlechterung. Schreiben Sie eine Beschwerde an die Geschäftsleitung der Verkehrsbetriebe, Frau Dr. Reinhardt.

- Eröffnen Sie Ihr Schreiben höflich und zeigen Sie Verständnis für wirtschaftliche Sachzwänge.
- Schildern Sie konkret, welche Probleme die Taktausdünnung verursacht.
- Weisen Sie darauf hin, welche Personengruppen besonders betroffen sind.
- Formulieren Sie einen konkreten Vorschlag und bitten Sie um eine Stellungnahme.

Schreiben Sie circa 150 Wörter. Achten Sie auf die Textsortenmerkmale eines formellen Briefes (Anrede, Betreff, Grußformel).`,
  },
  {
    title: "Schreiben 3: Nachhaltigkeit - Verzicht oder Innovation?",
    task: `Teil 1 (vorgeschlagene Arbeitszeit: 50 Minuten)

Für eine Studierendenzeitschrift schreiben Sie einen Kommentar zu folgender These:

„Den Klimawandel werden wir nicht durch persönlichen Verzicht aufhalten, sondern durch technische Innovation.“

- Erläutern Sie, was für diese These spricht.
- Stellen Sie dar, wo die Grenzen eines rein technischen Lösungsansatzes liegen.
- Beziehen Sie sich auf ein Beispiel aus Ihrem Land oder aus den Medien.
- Nehmen Sie abschließend klar Stellung.

Schreiben Sie einen zusammenhängenden Text von circa 230 Wörtern. Ein Kommentar darf pointiert sein - argumentieren Sie dennoch nachvollziehbar.`,
  },
  {
    title: "Schreiben 4: Fehlerkultur am Arbeitsplatz",
    task: `Teil 2 (vorgeschlagene Arbeitszeit: 30 Minuten)

Sie arbeiten in einem Unternehmen, das eine neue interne Regel einführen will: Jeder Fehler mit finanziellen Folgen soll künftig namentlich in einem monatlichen Bericht aufgeführt werden. Die Personalabteilung bittet die Belegschaft um schriftliche Rückmeldungen. Schreiben Sie eine Stellungnahme an die Personalleitung.

- Ordnen Sie das Anliegen der Geschäftsführung sachlich ein.
- Legen Sie dar, welche Wirkung eine solche Regelung auf den Umgang mit Fehlern hätte.
- Schlagen Sie eine Alternative vor, die Transparenz ermöglicht, ohne Einzelne bloßzustellen.
- Schließen Sie mit einer höflichen Aufforderung zur Diskussion.

Schreiben Sie circa 180 Wörter in einem sachlich-höflichen Register.`,
  },
];

const SPRECHEN = [
  {
    title: "Sprechen 1: Vortrag - Mehrsprachigkeit",
    task: `Teil 1 - Vortrag halten (circa 5 Minuten)

Wählen Sie EIN Thema und halten Sie dazu einen kurzen Vortrag. Strukturieren Sie ihn mit Einleitung, Hauptteil und Schluss. Nehmen Sie Ihren Vortrag auf.

Thema A: Mehrsprachigkeit in der Schule
Sollten Kinder in der Schule konsequent auch in ihrer Familiensprache unterrichtet werden?
- Beschreiben Sie die Situation mehrsprachiger Kinder anhand eines Beispiels.
- Nennen Sie Vorteile und mögliche Schwierigkeiten.
- Begründen Sie Ihre eigene Position.

Thema B: Sprache und Identität
Verändert sich die Persönlichkeit, wenn man eine andere Sprache spricht?
- Schildern Sie eigene Erfahrungen mit dem Wechsel zwischen Sprachen.
- Erläutern Sie, woran das liegen könnte.
- Ziehen Sie ein Fazit.

Tipp: Sprechen Sie frei anhand von Stichpunkten. Ein abgelesener Text ist auf C1-Niveau deutlich hörbar.`,
  },
  {
    title: "Sprechen 2: Diskussion - Ewig leben?",
    task: `Teil 2 - Diskussion führen (circa 5 Minuten)

Sie nehmen an einer Podiumsdiskussion teil. Das Thema lautet:

„Lebensverlängerung um jeden Preis - sollte die Forschung alles tun, um das menschliche Leben deutlich zu verlängern?“

- Legen Sie Ihren Standpunkt dar und begründen Sie ihn mit mindestens zwei Argumenten.
- Gehen Sie auf folgenden Einwand ein: „Eine alternde Gesellschaft kann sich das weder finanziell noch sozial leisten.“
- Reagieren Sie höflich, aber bestimmt, und formulieren Sie am Ende einen Kompromissvorschlag.

Nehmen Sie Ihren Beitrag auf. Nutzen Sie die Redemittel für Widerspruch und Vermittlung aus dieser Lektion.`,
  },
];

// ---------- upis ----------
const { data: existing } = await sb.from("lessons").select("id,title,order_index").eq("course_id", CID).order("order_index");
const maxOrder = Math.max(0, ...(existing ?? []).map((l) => l.order_index ?? 0));
let lesson = (existing ?? []).find((l) => l.title === LESSON_TITLE);

console.log(`Kurs nemacki-c1-1: ${existing?.length ?? 0} lekcija, max order ${maxOrder}`);
if (!lesson) {
  console.log(`+ NOVA LEKCIJA: "${LESSON_TITLE}" (order ${maxOrder + 1}, modul "${MODULE}")`);
  if (APPLY) {
    const { data, error } = await sb.from("lessons").insert({
      course_id: CID, title: LESSON_TITLE, order_index: maxOrder + 1, lesson_type: "text", sections: SECTIONS,
    }).select("id,title,order_index").single();
    if (error) throw error;
    lesson = data;
  }
} else {
  console.log(`~ Lekcija "${LESSON_TITLE}" postoji (order ${lesson.order_index}) - osvežavam sekcije`);
  if (APPLY) {
    const { error } = await sb.from("lessons").update({ sections: SECTIONS }).eq("id", lesson.id);
    if (error) throw error;
  }
}

console.log(`  Schreiben: ${ESSAYS.length} zadatka, Sprechen: ${SPRECHEN.length} zadatka`);
for (const e of [...ESSAYS, ...SPRECHEN]) console.log(`   - ${e.title}`);

if (!APPLY) {
  console.log("\n[DRY] --apply za upis.");
  process.exit(0);
}

let idx = 0;
for (const { title, task, kind } of [
  ...ESSAYS.map((e) => ({ ...e, kind: "essay" })),
  ...SPRECHEN.map((e) => ({ ...e, kind: "sprechen" })),
]) {
  await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("title", title);
  const { data: ex, error: exErr } = await sb.from("exercises")
    .insert({ lesson_id: lesson.id, title, exercise_type: kind, order_index: idx })
    .select("id").single();
  if (exErr) throw exErr;
  const { error: qErr } = await sb.from("exercise_questions").insert({
    exercise_id: ex.id, question: task, options: { type: kind }, correct_answer: "",
    question_type: kind, order_index: 0,
  });
  if (qErr) throw qErr;
  idx++;
}

console.log(`\n✓ Gotovo - lekcija "${LESSON_TITLE}" ima ${ESSAYS.length + SPRECHEN.length} zadataka (4 Schreiben + 2 Sprechen).`);
