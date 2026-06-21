/** B1.2 Modelltest 4 — HÖREN modul (30 zadataka, Teil 1-4) + audio (CD2). Transkribovano tačno; rešenja iz Lösungen.
 *  Audio: CD2 trake 08(T1),09(T2),10(T3),12(T4). Dry-run; --apply za upload+upis. */
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
const EX = "Hören - Modelltest 4";
const CD2 = "/Users/natasahartweger/Documents/Claude/sajt/LMS/B1/Cornelsen B1 /Hören/Cornelsen Prüfungstraining B1 CD2";
const BUCKET = "blog-media";

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: lesson } = await sb.from("lessons").select("id, sections").eq("course_id", course.id).eq("title", LESSON).maybeSingle();
if (!lesson) { console.log("⚠️ Lekcija Modelltest 4 ne postoji (prvo Lesen)."); process.exit(1); }
const { data: exExist } = await sb.from("exercises").select("id").eq("lesson_id", lesson.id).eq("title", EX).maybeSingle();
if (exExist) { console.log("⚠️ Hören vežba već postoji."); process.exit(1); }

const RF = ["Richtig", "Falsch"];
const ABC = (a, b, c) => [`a - ${a}`, `b - ${b}`, `c - ${c}`];
const WSW = ["a - Moderator", "b - Britta Wolfing", "c - Gerold Graf"];

const C1 = "*Hören Teil 1. Sie hören fünf kurze Texte. Sie hören jeden Text zweimal. Zu jedem Text lösen Sie zwei Aufgaben.*\n\n**Beispiel:** Die Betriebsfeier findet am Freitag statt. → *Falsch* · Wann möchte Frau Stolz einen Rückruf? → *spätestens bis morgen 16 Uhr*";
const C2 = "*Hören Teil 2. Sie hören einen Text einmal. Auf einer Versammlung in der Firma Albatros hören Sie folgende Präsentation.*";
const C3 = "*Hören Teil 3. Sie hören ein Gespräch einmal. Sie sitzen in einem Café und hören, wie sich zwei Frauen über den Beruf unterhalten.*";
const C4 = "*Hören Teil 4. Sie hören eine Diskussion im Radio zweimal. Ordnen Sie zu: Wer sagt was? In der Radiosendung „Brauchen wir die anonyme Bewerbung?“ diskutiert der Moderator mit Britta Wolfing und Gerold Graf.* (Beispiel: „Mein Beruf ist es, Bewerber an Firmen zu vermitteln …“ → Britta Wolfing)";

// [teil, stem, items, correctIdx, context, audioKey]
const Q = [
  [1, "(Text 1) Herr Eberlein bekommt die Nachricht, wo sein Rucksack ist.", RF, 0, C1, "t1"],
  [1, "(Text 1) Was soll er tun?", ABC("Zur Polizei gehen.", "Im Fundbüro nachfragen.", "Noch einmal im Café „Belvedere“ suchen."), 0, C1, "t1"],
  [1, "(Text 2) Die Volkshochschule Minden bekommt eine Nachricht.", RF, 1, C1, "t1"],
  [1, "(Text 2) Herr Melchior …", ABC("muss auf einen freien Platz warten.", "soll seine Anmeldung für den Kurs bestätigen.", "kann die Gebühr am ersten Kurstag zahlen."), 1, C1, "t1"],
  [1, "(Text 3) Der Zug kann nicht nach Niederfelden weiterfahren.", RF, 1, C1, "t1"],
  [1, "(Text 3) Die Reisenden …", ABC("müssen 45 Minuten auf die Busse warten.", "sollen in Busse nach Hannover umsteigen.", "kommen um 13:30 Uhr in Hannover an."), 1, C1, "t1"],
  [1, "(Text 4) Bernd hat überraschend Geld bekommen.", RF, 0, C1, "t1"],
  [1, "(Text 4) Bernd …", ABC("hat seinen Freunden schon oft geholfen.", "lädt seine Freunde zu sich nach Hause ein.", "lädt die Freunde zu einem Wochenende in Konstanz ein."), 2, C1, "t1"],
  [1, "(Text 5) Das Wetter in Vorarlberg wird heute Nachmittag schlechter.", RF, 0, C1, "t1"],
  [1, "(Text 5) Übermorgen …", ABC("gibt es keinen Regen.", "wird es noch sehr windig sein.", "sinken die Temperaturen noch tiefer."), 0, C1, "t1"],
  [2, "Die Mitarbeiter der Firma Albatros …", ABC("wollen einen Ausflug nach Auersberg machen.", "werden bald in Auersberg arbeiten.", "bekommen einen neuen Firmenleiter."), 1, C2, "t2"],
  [2, "Ein Vorteil von Auersberg ist:", ABC("Die Umgebung ist sehr schön.", "Es gibt viele Arbeitsplätze in Industriebetrieben.", "Es gibt viel Landwirtschaft."), 0, C2, "t2"],
  [2, "Was sagt Frau Kaspar über die Verkehrssituation?", ABC("Durch die Autobahn gibt es Verkehrslärm.", "Es gibt gute Verbindungen.", "Es gibt keine öffentlichen Verkehrsmittel."), 1, C2, "t2"],
  [2, "Für Kinder …", ABC("gibt es wenig Betreuungsangebote.", "sind die kurzen Wege sehr praktisch.", "gibt es im Ort kaum Freizeitangebote."), 1, C2, "t2"],
  [2, "Die Stadt Auersberg …", ABC("hat ein Konzerthaus mit Musikschule.", "hat ein sehr großes Kulturangebot.", "bietet nur wenige Kulturveranstaltungen."), 2, C2, "t2"],
  [3, "Isa hat das Studium nicht abgeschlossen.", RF, 0, C3, "t3"],
  [3, "Ein Freund hat Isa eine Lehrstelle in seiner Firma gegeben.", RF, 1, C3, "t3"],
  [3, "Isa ging mit dem Meister in die Personalabteilung.", RF, 1, C3, "t3"],
  [3, "Isa ist sehr zufrieden mit ihrer Arbeitsstelle.", RF, 0, C3, "t3"],
  [3, "Isas Eltern haben sich über Isas Entscheidung gefreut.", RF, 1, C3, "t3"],
  [3, "Manche Kunden wollten ihr Auto lieber von einem Mann reparieren lassen.", RF, 0, C3, "t3"],
  [3, "Claudia ist unzufrieden, weil sie keine Arbeit hat.", RF, 1, C3, "t3"],
  [4, "Bewerber können wegen ihres Alters Nachteile haben.", WSW, 2, C4, "t4"],
  [4, "Persönliche Angaben in der Bewerbung sind notwendig.", WSW, 1, C4, "t4"],
  [4, "Für die Auswahl geeigneter Bewerber braucht man kein Foto.", WSW, 2, C4, "t4"],
  [4, "Mitarbeiter in Personalabteilungen brauchen Fortbildung.", WSW, 1, C4, "t4"],
  [4, "Die Bewerbung ohne Foto ist in einigen Ländern üblich.", WSW, 0, C4, "t4"],
  [4, "Viele Personalchefs lehnen die anonyme Bewerbung aus Bequemlichkeit ab.", WSW, 2, C4, "t4"],
  [4, "Die Erfahrungen mit der anonymen Bewerbung waren nicht immer positiv.", WSW, 0, C4, "t4"],
  [4, "Personalchefs müssen oft schnell eine Auswahl treffen.", WSW, 1, C4, "t4"],
];

console.log("HÖREN Modelltest 4 — pitanja:", Q.length);
if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

// upload audija
const tracks = { t1: "08-AudioTrack 08.mp3", t2: "09-AudioTrack 09.mp3", t3: "10-AudioTrack 10.mp3", t4: "12-AudioTrack 12.mp3" };
const urls = {};
for (const [k, fn] of Object.entries(tracks)) {
  const buf = readFileSync(`${CD2}/${fn}`);
  const path = `kursevi/b1-2/modelltest4-hoeren/${k}.mp3`;
  const { error } = await sb.storage.from(BUCKET).upload(path, buf, { contentType: "audio/mpeg", upsert: true });
  if (error) { console.error("upload", k, error.message); process.exit(1); }
  urls[k] = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
console.log("Audio okačen:", Object.keys(urls).join(", "));

await sb.from("lessons").update({ sections: [...lesson.sections, { type: "exercise", title: EX }] }).eq("id", lesson.id);
const { data: ex } = await sb.from("exercises").insert({ lesson_id: lesson.id, title: EX, exercise_type: "quiz", order_index: 2 }).select("id").single();
let oi = 1;
for (const [teil, stem, items, ci, ctx, ak] of Q) {
  await sb.from("exercise_questions").insert({
    exercise_id: ex.id, question: `<strong>Hören · Teil ${teil}</strong><br>${stem}`,
    question_type: "quiz", correct_answer: String(ci), explanation: null, order_index: oi++, audio_url: urls[ak],
    options: { type: "quiz", items, context: { type: "text", title: `Hören - Teil ${teil}`, content: ctx } },
  });
}
console.log(`\nGOTOVO ✓  Hören modul (${Q.length} pitanja + 4 audija).`);
