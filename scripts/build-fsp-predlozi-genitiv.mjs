// Obogaćuje FSP lekciju "Predlozi sa genitivom" Natašinim dorađenim
// sadržajem iz "FSP novi/Predlozi sa genitivom.docx".
// - lista predloga (predlog/primer/prevod) -> table blok
// - HTML vežbe sa dna dokumenta -> native vežbe (4x quiz/typing) + 1 inline spoiler
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

const LESSON_ID = "fa3f9c57-3b00-4c7c-ab6a-9ea8fc7dfe5e"; // FSP > Predlozi sa genitivom

// ---------- SEKCIJE ----------
const sections = [
  { type: "badge", module: "Gramatika", category: "grammatik" },

  { type: "text", style: "default", content:
`## Predlozi sa genitivom u Fachsprachprüfung

U medicinskom nemačkom često ćeš naići na predloge koji zahtevaju **genitiv**. Oni ti omogućavaju da precizno opišeš uzrok, vreme, mesto ili odnos - na primer kada objašnjavaš zašto je pacijent došao (*wegen der Schmerzen*) ili gde se nalazi nalaz (*innerhalb des Gewebes*).

Ovi predlozi zvuče formalno i deluju vrlo profesionalno, pa će ti pomoći da na ispitu pokažeš nivo C1. Važno je da uz njih uvek upotrebiš **pravilan padežni oblik člana i imenice u genitivu**.` },

  { type: "text", style: "info", content:
`### Kako se gradi genitiv posle ovih predloga?

- maskulin: *der Brustkorb* -> **des Brustkorbs**
- neutrum: *das Gewebe* -> **des Gewebes**
- feminin: *die Verletzung* -> **der Verletzung**
- množina: *die Schmerzen* -> **der Schmerzen**

Imenice muškog i srednjeg roda u genitivu dobijaju nastavak **-s** ili **-es**.` },

  { type: "text", style: "default", content: "### Najvažniji predlozi sa genitivom" },
  { type: "table",
    headers: ["Predlog", "Primer", "Prevod"],
    rows: [
      ["wegen", "wegen der Schmerzen", "zbog"],
      ["aufgrund", "aufgrund einer Verletzung", "zbog, na osnovu"],
      ["bezüglich", "bezüglich der Therapieoptionen", "u vezi sa"],
      ["während", "während der Genesungszeit", "tokom"],
      ["innerhalb", "innerhalb des Gewebes", "unutar"],
      ["außerhalb", "außerhalb des Gehörgangs", "van"],
      ["oberhalb", "Taubheit oberhalb der Hüfte", "odozgo, iznad"],
      ["unterhalb", "Druck unterhalb des Brustkorbs", "odozdo, ispod"],
      ["trotz", "Trotz der Schwierigkeiten verlief die Operation erfolgreich.", "uprkos"],
      ["angesichts", "angesichts der laborchemischen Befunde", "s obzirom na"],
      ["dank", "dank der frühzeitigen Diagnose", "zahvaljujući"],
      ["mithilfe", "Die Rehabilitation erfolgt mithilfe gezielter Übungen und Therapien.", "uz pomoć"],
    ] },

  { type: "text", style: "uebung", content: "## Vežbe\n\nProveri šta si naučio:" },
  { type: "exercise", title: "Aufgabe 1 - Der richtige Genitiv" },
  { type: "exercise", title: "Aufgabe 2 - Richtig oder falsch?" },

  { type: "text", style: "default", content: "### Aufgabe 3 - Bedeutung der Präpositionen\n\nSetiš li se šta znače ovi predlozi sa genitivom? Razmisli, pa klikni da vidiš rešenje:" },
  { type: "spoiler", title: "Aufgabe 3 - klikni za rešenje", items: [
    { question: "oberhalb", answer: "odozgo, iznad - npr. Taubheit oberhalb der Hüfte." },
    { question: "unterhalb", answer: "odozdo, ispod - npr. Druck unterhalb des Brustkorbs." },
    { question: "angesichts", answer: "s obzirom na - npr. angesichts der laborchemischen Befunde." },
    { question: "innerhalb", answer: "unutar - npr. innerhalb des Gewebes." },
    { question: "aufgrund", answer: "zbog, na osnovu - npr. aufgrund einer Verletzung." },
    { question: "mithilfe", answer: "uz pomoć - npr. mithilfe gezielter Übungen." },
  ] },

  { type: "exercise", title: "Aufgabe 4 - Setzen Sie den Genitiv" },
];

// ---------- VEŽBE ----------
const exercises = [
  {
    title: "Aufgabe 1 - Der richtige Genitiv",
    exercise_type: "quiz",
    questions: [
      { q: "Der Patient kam wegen ______ in die Notaufnahme. (die Schmerzen, Pl.)", opts: ["der Schmerzen", "den Schmerzen"], c: 0, e: "wegen + genitiv, plural -> der Schmerzen." },
      { q: "Die Beschwerden traten aufgrund ______ auf. (die Verletzung, f.)", opts: ["eine Verletzung", "einer Verletzung"], c: 1, e: "aufgrund + genitiv, feminin -> einer Verletzung." },
      { q: "Innerhalb ______ zeigte sich eine Veränderung. (das Gewebe, n.)", opts: ["des Gewebes", "dem Gewebe"], c: 0, e: "innerhalb + genitiv, neutrum -> des Gewebes." },
      { q: "Die Entzündung liegt außerhalb ______. (der Gehörgang, m.)", opts: ["dem Gehörgang", "des Gehörgangs"], c: 1, e: "außerhalb + genitiv, maskulin -> des Gehörgangs." },
      { q: "Während ______ soll der Patient sich schonen. (die Genesungszeit, f.)", opts: ["der Genesungszeit", "die Genesungszeit"], c: 0, e: "während + genitiv, feminin -> der Genesungszeit." },
      { q: "Der Druck wurde unterhalb ______ festgestellt. (der Brustkorb, m.)", opts: ["des Brustkorbs", "den Brustkorb"], c: 0, e: "unterhalb + genitiv, maskulin -> des Brustkorbs." },
    ],
  },
  {
    title: "Aufgabe 2 - Richtig oder falsch?",
    exercise_type: "true_false",
    questions: [
      { q: "Wegen der Schmerzen kam der Patient in die Notaufnahme.", tf: true, e: "Tačno. wegen + genitiv -> wegen der Schmerzen." },
      { q: "Wegen den Schmerzen kam der Patient in die Notaufnahme.", tf: false, e: "Netačno: „den“. wegen + genitiv -> Wegen der Schmerzen kam der Patient in die Notaufnahme." },
      { q: "Während die Genesungszeit soll er sich schonen.", tf: false, e: "Netačno: „die“. während + genitiv -> Während der Genesungszeit soll er sich schonen." },
      { q: "Innerhalb des Gewebes zeigte sich eine Veränderung.", tf: true, e: "Tačno. innerhalb + genitiv -> innerhalb des Gewebes." },
      { q: "Innerhalb dem Gewebe zeigte sich eine Veränderung.", tf: false, e: "Netačno: „dem“. innerhalb + genitiv -> Innerhalb des Gewebes zeigte sich eine Veränderung." },
      { q: "Trotz die Schwierigkeiten verlief die OP gut.", tf: false, e: "Netačno: „die“. trotz + genitiv -> Trotz der Schwierigkeiten verlief die OP gut." },
    ],
  },
  {
    title: "Aufgabe 4 - Setzen Sie den Genitiv",
    exercise_type: "typing",
    questions: [
      { q: "oberhalb ______ (die Hüfte)", a: "der Hüfte", e: "Lösung: der Hüfte." },
      { q: "unterhalb ______ (der Brustkorb)", a: "des Brustkorbs|des Brustkorbes", e: "Lösung: des Brustkorbs." },
      { q: "angesichts ______ (die Befunde, Pl.)", a: "der Befunde", e: "Lösung: der Befunde." },
      { q: "trotz ______ (die Schwierigkeiten, Pl.)", a: "der Schwierigkeiten", e: "Lösung: der Schwierigkeiten." },
      { q: "aufgrund ______ (eine Verletzung)", a: "einer Verletzung", e: "Lösung: einer Verletzung." },
    ],
  },
];

function buildRows(ex, exId) {
  return ex.questions.map((q, i) => {
    if (ex.exercise_type === "quiz") {
      return { exercise_id: exId, question: q.q, options: { type: "quiz", items: q.opts }, correct_answer: String(q.c), explanation: q.e, order_index: i };
    }
    if (ex.exercise_type === "true_false") {
      return { exercise_id: exId, question: `Richtig oder falsch? „${q.q}“`, options: null, correct_answer: q.tf ? "true" : "false", explanation: q.e, order_index: i };
    }
    // typing — mora { type: "typing" } (options:null pada na default quiz pa nema polja)
    return { exercise_id: exId, question: q.q, options: { type: "typing" }, correct_answer: q.a, explanation: q.e, order_index: i };
  });
}

async function main() {
  const { data: lesson, error: le } = await sb.from("lessons").select("id,title,sections").eq("id", LESSON_ID).single();
  if (le || !lesson) throw new Error("Lekcija nije nađena: " + (le?.message || ""));

  console.log(`\nLekcija: ${lesson.title} (${LESSON_ID})`);
  console.log(`Trenutno sekcija: ${(lesson.sections || []).length} → novo: ${sections.length}`);
  console.log(`Vežbe za kreiranje: ${exercises.length} (${exercises.map((e) => `${e.exercise_type}=${e.questions.length}`).join(", ")})`);

  if (!APPLY) {
    console.log("\n[DRY-RUN] Ništa nije upisano. Pokreni sa --apply da primeniš.\n");
    console.log("Pregled novih sekcija:");
    sections.forEach((s, i) => console.log(`  ${i + 1}. ${s.type}${s.title ? " → " + s.title : ""}${s.headers ? " [" + s.headers.join("|") + "]" : ""}`));
    return;
  }

  // 1) sekcije
  const { error: ue } = await sb.from("lessons").update({ sections, title: "Predlozi sa genitivom" }).eq("id", LESSON_ID);
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

  console.log("\nGotovo. Pregledaj uživo: /kurs/fsp → Predlozi sa genitivom\n");
}

main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
