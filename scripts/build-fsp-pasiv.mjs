// Gradi FSP lekciju "Pasiv" Natašinim sadržajem iz "FSP novi/passiv.docx".
// - kratak uvod + Vimeo video (učenje je u videu)
// - native vežbe po standardnom šablonu: quiz + true_false + typing + 1 spoiler (klikni za rešenje)
// Inline reference na vežbe preko {type:"exercise", title}.
// Dry-run default; pokreni sa --apply da primeniš na bazu (sadržaj je reverzibilan).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const LESSON_ID = "d0d349db-0a95-43a4-8830-fdd14a325dc3"; // FSP > Pasiv
const VIMEO_ID = "1013800593";

// ---------- SEKCIJE ----------
const sections = [
  { type: "badge", module: "Gramatika", category: "grammatik" },

  { type: "text", style: "default", content:
`## Pasiv u Fachsprachprüfung

Pasiv je nezaobilazan u medicinskoj komunikaciji - u nalazima, izveštajima i opisu postupaka stalno govorimo o tome šta se sa pacijentom radi, a ne ko to radi (*Der Patient wird untersucht*, *Die OP wird durchgeführt*). Zato ga moraš pravilno koristiti u svim vremenima i sa modalnim glagolima.

U videu ispod Nataša objašnjava kako se pasiv gradi u svim vremenima, kako radi pasiv sa modalnim glagolima i na šta da paziš na ispitu. Pogledaj video, pa proveri znanje kroz vežbe na dnu.` },

  { type: "video", vimeoId: VIMEO_ID },

  { type: "text", style: "info", content:
`### Kratko podsećanje

- **Vorgangspassiv** se gradi sa **werden + Partizip II**.
- U perfektu i pluskvamperfektu Partizip od *werden* glasi **worden** (ne *geworden*): *ist untersucht worden*, *war stabilisiert worden*.
- Sa modalnim glagolom: modalni glagol ostaje, a punoznačni glagol ide u oblik **Partizip II + werden**: *Der Patient muss untersucht werden.*` },

  { type: "text", style: "uebung", content: "## Vežbe\n\nProveri šta si naučio iz videa:" },
  { type: "exercise", title: "Aufgabe 1 - Das richtige Passiv" },
  { type: "exercise", title: "Aufgabe 2 - Richtig oder falsch?" },

  { type: "text", style: "default", content: "### Aufgabe 3 - Aktiv → Passiv\n\nPreoblikuj rečenice iz aktiva u pasiv. Razmisli, pa klikni da vidiš rešenje:" },
  { type: "spoiler", title: "Aufgabe 3 - klikni za rešenje", items: [
    { question: "Aktiv: Der Arzt untersucht den Patienten. (Präsens Passiv)", answer: "Der Patient wird vom Arzt untersucht." },
    { question: "Aktiv: Die Schwester hat die Probe ins Labor geschickt. (Perfekt Passiv)", answer: "Die Probe ist von der Schwester ins Labor geschickt worden." },
    { question: "Aktiv: Das Team führte die OP durch. (Präteritum Passiv)", answer: "Die OP wurde vom Team durchgeführt." },
    { question: "Aktiv: Man muss den Patienten sofort operieren. (Passiv mit Modalverb)", answer: "Der Patient muss sofort operiert werden." },
    { question: "Aktiv: Der Arzt wird den Patienten morgen entlassen. (Futur I Passiv)", answer: "Der Patient wird morgen vom Arzt entlassen werden." },
  ] },

  { type: "exercise", title: "Aufgabe 4 - Aktiv → Passiv" },
];

// ---------- VEŽBE ----------
const exercises = [
  {
    title: "Aufgabe 1 - Das richtige Passiv",
    exercise_type: "quiz",
    questions: [
      { q: "Aktiv: Das Team untersucht den Patienten gründlich. - Der Patient ______ vom Team gründlich untersucht. (Präsens)", opts: ["wird", "ist", "wurde"], c: 0, e: "Präsens Passiv -> wird untersucht." },
      { q: "Aktiv: Das Team untersuchte den Patienten gründlich. - Der Patient ______ vom Team gründlich untersucht. (Präteritum)", opts: ["wird", "wurde", "ist"], c: 1, e: "Präteritum Passiv -> wurde untersucht." },
      { q: "Aktiv: Das Team hat den Patienten gründlich untersucht. - Der Patient ______ vom Team. (Perfekt)", opts: ["wurde untersucht", "ist untersucht worden", "wird untersucht"], c: 1, e: "Perfekt Passiv -> ist untersucht worden." },
      { q: "Aktiv: Das Team hatte den Patienten gründlich untersucht. - Der Patient ______ vom Team. (Plusquamperfekt)", opts: ["war untersucht worden", "ist untersucht worden", "wurde untersucht"], c: 0, e: "Plusquamperfekt Passiv -> war untersucht worden." },
      { q: "Aktiv: Das Team wird den Patienten gründlich untersuchen. - Der Patient ______ vom Team. (Futur I)", opts: ["wird untersucht werden", "wird untersucht worden", "wurde untersucht"], c: 0, e: "Futur I Passiv -> wird untersucht werden." },
      { q: "Aktiv: Das Team muss den Patienten gründlich untersuchen. - Der Patient muss vom Team gründlich ______. (Passiv mit Modalverb)", opts: ["untersucht werden", "untersucht worden", "untersuchen werden"], c: 0, e: "Pasiv sa modalnim glagolom -> muss untersucht werden." },
    ],
  },
  {
    title: "Aufgabe 2 - Richtig oder falsch?",
    exercise_type: "true_false",
    questions: [
      { q: "Der Patient ist gründlich untersucht worden.", c: true, e: "Tačno. Perfekt Passiv: Partizip od werden glasi „worden“ - „ist untersucht worden“." },
      { q: "Der Patient ist gründlich untersucht geworden.", c: false, e: "Pogrešno. U Vorgangspassivu Partizip od werden glasi „worden“, ne „geworden“: „ist untersucht worden“." },
      { q: "Der Patient muss sofort operiert werden.", c: true, e: "Tačno. Pasiv sa modalnim glagolom: „muss operiert werden“." },
      { q: "Der Patient muss sofort operiert worden.", c: false, e: "Pogrešno. Pasiv sa modalnim glagolom traži „operiert werden“: „Der Patient muss sofort operiert werden.“" },
      { q: "Die Probe wurde ins Labor geschickt.", c: true, e: "Tačno. Präteritum Passiv: „wurde geschickt“." },
      { q: "Die Probe wurde ins Labor geschickt worden.", c: false, e: "Pogrešno. Präteritum Passiv završava se sa „geschickt“ - „worden“ je suvišno: „Die Probe wurde ins Labor geschickt.“" },
    ],
  },
  {
    title: "Aufgabe 4 - Aktiv → Passiv",
    exercise_type: "typing",
    questions: [
      { q: "Aktiv: Das Team untersucht den Patienten. Formulieren Sie im Präsens Passiv (mit „vom Team“).", a: "Der Patient wird vom Team untersucht.|Der Patient wird vom Team untersucht", e: "Der Patient wird vom Team untersucht." },
      { q: "Aktiv: Das Team hat den Patienten untersucht. Formulieren Sie im Perfekt Passiv (mit „vom Team“).", a: "Der Patient ist vom Team untersucht worden.|Der Patient ist vom Team untersucht worden", e: "Der Patient ist vom Team untersucht worden." },
      { q: "Aktiv: Das Team muss den Patienten untersuchen. Formulieren Sie im Passiv mit Modalverb (mit „vom Team“).", a: "Der Patient muss vom Team untersucht werden.|Der Patient muss vom Team untersucht werden", e: "Der Patient muss vom Team untersucht werden." },
      { q: "Aktiv: Das Team wird den Patienten untersuchen. Formulieren Sie im Futur I Passiv (mit „vom Team“).", a: "Der Patient wird vom Team untersucht werden.|Der Patient wird vom Team untersucht werden", e: "Der Patient wird vom Team untersucht werden." },
    ],
  },
];

function buildRows(ex, exId) {
  return ex.questions.map((q, i) => {
    if (ex.exercise_type === "quiz") {
      return { exercise_id: exId, question: q.q, options: { type: "quiz", items: q.opts }, correct_answer: String(q.c), explanation: q.e, order_index: i };
    }
    if (ex.exercise_type === "true_false") {
      // question = "Richtig oder falsch? „<rečenica>“", options:null, correct_answer "true"/"false"
      return { exercise_id: exId, question: `Richtig oder falsch? „${q.q}“`, options: null, correct_answer: q.c ? "true" : "false", explanation: q.e, order_index: i };
    }
    // typing - mora { type: "typing" } (options:null pada na default quiz pa nema polja)
    return { exercise_id: exId, question: q.q, options: { type: "typing" }, correct_answer: q.a, explanation: q.e, order_index: i };
  });
}

async function main() {
  const { data: lesson, error: le } = await sb.from("lessons").select("id,title,sections").eq("id", LESSON_ID).single();
  if (le || !lesson) throw new Error("Lekcija nije nađena: " + (le?.message || ""));

  console.log(`\nLekcija: ${lesson.title} (${LESSON_ID})`);
  console.log(`Trenutno sekcija: ${(lesson.sections || []).length} → novo: ${sections.length}`);
  console.log(`Video blok: ${sections.some((s) => s.type === "video") ? "DA (vimeoId " + VIMEO_ID + ")" : "NE"}`);
  console.log(`Spoiler blok: ${sections.filter((s) => s.type === "spoiler").map((s) => s.items.length + " stavki").join(", ") || "nema"}`);
  console.log(`Vežbe za kreiranje: ${exercises.length} (${exercises.map((e) => `${e.title.split(" - ")[0]}[${e.exercise_type}]=${e.questions.length}`).join(", ")})`);

  if (!APPLY) {
    console.log("\n[DRY-RUN] Ništa nije upisano. Pokreni sa --apply da primeniš.\n");
    console.log("Pregled novih sekcija:");
    sections.forEach((s, i) => console.log(`  ${i + 1}. ${s.type}${s.title ? " → " + s.title : ""}${s.vimeoId ? " (vimeo " + s.vimeoId + ")" : ""}`));
    return;
  }

  // 1) sekcije
  const { error: ue } = await sb.from("lessons").update({ sections, title: "Pasiv" }).eq("id", LESSON_ID);
  if (ue) throw new Error("Update sekcija: " + ue.message);
  console.log("✓ Sekcije ažurirane");

  // 2) obriši stare vežbe ove lekcije (idempotentno re-pokretanje)
  const { data: oldEx } = await sb.from("exercises").select("id").eq("lesson_id", LESSON_ID);
  if (oldEx?.length) {
    const ids = oldEx.map((e) => e.id);
    await sb.from("exercise_questions").delete().in("exercise_id", ids);
    await sb.from("exercises").delete().in("id", ids);
    console.log(`✓ Obrisano starih vežbi: ${ids.length}`);
  }

  // 3) nove vežbe + pitanja
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const { data: row, error: ee } = await sb.from("exercises")
      .insert({ lesson_id: LESSON_ID, title: ex.title, exercise_type: ex.exercise_type, order_index: i })
      .select("id").single();
    if (ee) throw new Error("Insert vežbe: " + ee.message);
    const { error: qe } = await sb.from("exercise_questions").insert(buildRows(ex, row.id));
    if (qe) throw new Error("Insert pitanja: " + qe.message);
    console.log(`✓ ${ex.title} (${ex.questions.length} pitanja)`);
  }

  console.log("\nGotovo. Pregledaj uživo: /kurs/fsp → Pasiv\n");
}

main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
