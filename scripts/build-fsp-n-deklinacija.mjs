// Obogaćuje FSP lekciju "N-deklinacija" Natašinim dorađenim sadržajem iz
// "FSP novi/N- Deklinacija.docx".
// - tekst + tabele deklinacije (Dermatologe; Herz; Name; Herr) -> text/table blokovi
// - NOVI STANDARD: tačno 4 vežbe redom -> Aufgabe 1 (quiz) + Aufgabe 2 (true_false)
//   + Aufgabe 3 (spoiler sekcija, inline) + Aufgabe 4 (typing).
// Inline reference na 3 DB vežbe preko {type:"exercise", title}; spoiler inline.
// Dry-run default; pokreni sa --apply da primeniš na bazu (idempotentno, reverzibilno).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const LESSON_ID = "dd475263-aa49-45c8-b7f5-95895cf0c615"; // FSP > N-deklinacija

// ---------- SEKCIJE ----------
const sections = [
  { type: "badge", module: "Gramatika", category: "grammatik" },

  { type: "text", style: "default", content:
`## N-deklinacija: šta je i zašto je važna za FSP

**N-deklinacija** znači da određene imenice u svim padežima osim nominativa jednine dobijaju nastavak **-en** (ili ponekad **-n**). Ilustrujmo to na primeru reči *der Dermatologe*.

U N-deklinaciju spadaju **imenice muškog roda**. One u svim padežima osim nominativa jednine dobijaju nastavak -en (ili -n).` },

  { type: "text", style: "default", content: "### Primer: der Dermatologe" },
  { type: "table",
    headers: ["", "Singular (jednina)", "Plural (množina)"],
    rows: [
      ["Nominativ", "der Dermatologe", "die Dermatologen"],
      ["Akkusativ", "den Dermatologen", "die Dermatologen"],
      ["Dativ", "dem Dermatologen", "den Dermatologen"],
      ["Genitiv", "des Dermatologen", "der Dermatologen"],
    ] },

  { type: "text", style: "info", content:
`### Koje imenice spadaju u N-deklinaciju?

**1. Imenice koje se završavaju na -e, -ant, -ent, -ist, -oge, -at, -it:**
- *der Junge, der Kunde, der Kollege, der Deutsche*
- *der Laborant, der Praktikant*
- *der Automat*
- *der Student, der Präsident, der Patient, der Assistent*
- *der Spezialist, der Polizist*

**2. Druge imenice:**
- *der Mensch, der Herr, das Herz, der Chirurg, der Therapeut, der Nachbar*` },

  { type: "text", style: "default", content:
`### Izuzeci: Herr, Name i Herz

Imenice **der Herr**, **der Name** i **das Herz** treba naučiti napamet, jer imaju nepravilnu deklinaciju.` },

  { type: "text", style: "default", content: "**das Herz**" },
  { type: "table",
    headers: ["", "Singular (jednina)", "Plural (množina)"],
    rows: [
      ["Nominativ", "das Herz", "die Herzen"],
      ["Akkusativ", "das Herz", "die Herzen"],
      ["Dativ", "dem Herzen", "den Herzen"],
      ["Genitiv", "des Herzens", "der Herzen"],
    ] },

  { type: "text", style: "default", content: "**der Name**" },
  { type: "table",
    headers: ["", "Singular (jednina)", "Plural (množina)"],
    rows: [
      ["Nominativ", "der Name", "die Namen"],
      ["Akkusativ", "den Namen", "die Namen"],
      ["Dativ", "dem Namen", "den Namen"],
      ["Genitiv", "des Namens", "der Namen"],
    ] },

  { type: "text", style: "default", content: "**der Herr**" },
  { type: "table",
    headers: ["", "Singular (jednina)", "Plural (množina)"],
    rows: [
      ["Nominativ", "der Herr", "die Herren"],
      ["Akkusativ", "den Herrn", "die Herren"],
      ["Dativ", "dem Herrn", "den Herren"],
      ["Genitiv", "des Herrn", "der Herren"],
    ] },

  { type: "text", style: "info", content:
`**Savet za FSP:** mnoge reči iz svakodnevice u ambulanti spadaju u N-deklinaciju - *der Patient, der Kollege, der Assistent, der Chirurg, der Therapeut*. Zato pazi na nastavak -en kada koristiš ove imenice u akuzativu, dativu i genitivu.` },

  { type: "text", style: "uebung", content: "## Vežbe\n\nProveri šta si naučio:" },
  { type: "exercise", title: "Aufgabe 1 - Die richtige Form" },
  { type: "exercise", title: "Aufgabe 2 - Richtig oder falsch?" },
  { type: "spoiler", title: "Aufgabe 3 - klikni za rešenje", items: [
    { question: "Ich habe den Patient untersucht.", answer: "Pogrešno: „Patient“. Akuzativ → „Ich habe den Patienten untersucht.“" },
    { question: "Der Bericht des Chirurg liegt vor.", answer: "Pogrešno: „Chirurg“. Genitiv → „Der Bericht des Chirurgen liegt vor.“" },
    { question: "Sie arbeitet mit einem Praktikant zusammen.", answer: "Pogrešno: „Praktikant“. Dativ → „Sie arbeitet mit einem Praktikanten zusammen.“" },
    { question: "Der Kollegen ist heute krank.", answer: "Pogrešno: „Kollegen“. Nominativ jednine → „Der Kollege ist heute krank.“ (bez -n)" },
  ] },
  { type: "exercise", title: "Aufgabe 4 - Schreiben Sie die richtige Form" },
];

// ---------- VEŽBE (tačno 3 DB vežbe: quiz, true_false, typing) ----------
const exercises = [
  {
    title: "Aufgabe 1 - Die richtige Form",
    exercise_type: "quiz",
    questions: [
      { q: "Ich überweise den Befund an den ______. (Akk.)", opts: ["Dermatologe", "Dermatologen"], c: 1, e: "Akkusativ → den Dermatologen." },
      { q: "Der Patient spricht mit dem ______. (Dat.)", opts: ["Assistent", "Assistenten"], c: 1, e: "Dativ → dem Assistenten." },
      { q: "Das ist die Praxis des ______. (Gen.)", opts: ["Spezialisten", "Spezialist"], c: 0, e: "Genitiv → des Spezialisten." },
      { q: "Der ______ hat heute frei. (Nom.)", opts: ["Kollege", "Kollegen"], c: 0, e: "Nominativ Singular → der Kollege (bez -n)." },
      { q: "Wir bitten den ______ um Geduld. (Akk.)", opts: ["Kunde", "Kunden"], c: 1, e: "Akkusativ → den Kunden." },
    ],
  },
  {
    title: "Aufgabe 2 - Richtig oder falsch?",
    exercise_type: "true_false",
    questions: [
      { q: "Richtig oder falsch? „Ich habe den Patienten untersucht.“", c: "true", e: "Tačno. Akuzativ → „den Patienten“ (N-deklinacija)." },
      { q: "Richtig oder falsch? „Der Bericht des Chirurg liegt vor.“", c: "false", e: "Pogrešno. Genitiv → „des Chirurgen“." },
      { q: "Richtig oder falsch? „Sie arbeitet mit einem Praktikant zusammen.“", c: "false", e: "Pogrešno. Dativ → „mit einem Praktikanten“." },
      { q: "Richtig oder falsch? „Der Kollege ist heute krank.“", c: "true", e: "Tačno. Nominativ jednine → „der Kollege“ (bez -n)." },
      { q: "Richtig oder falsch? „Wir begrüßen den Herrn Schmidt.“", c: "true", e: "Tačno. Akuzativ → „den Herrn“." },
      { q: "Richtig oder falsch? „Die Diagnose des Spezialist ist eindeutig.“", c: "false", e: "Pogrešno. Genitiv → „des Spezialisten“." },
    ],
  },
  {
    title: "Aufgabe 4 - Schreiben Sie die richtige Form",
    exercise_type: "typing",
    questions: [
      { q: "Ich danke dem ______ (Patient, Dativ).", a: "Patienten", e: "Patienten" },
      { q: "Die Diagnose des ______ (Spezialist, Genitiv) ist eindeutig.", a: "Spezialisten", e: "Spezialisten" },
      { q: "Wir begrüßen den ______ (Herr, Akkusativ) Schmidt.", a: "Herrn", e: "Herrn" },
      { q: "Bitte nennen Sie mir Ihren ______ (Name, Akkusativ).", a: "Namen", e: "Namen" },
      { q: "Die Operation am ______ (Herz, Dativ) war erfolgreich.", a: "Herzen", e: "Herzen" },
    ],
  },
];

function buildRows(ex, exId) {
  return ex.questions.map((q, i) => {
    if (ex.exercise_type === "quiz") {
      return { exercise_id: exId, question: q.q, options: { type: "quiz", items: q.opts }, correct_answer: String(q.c), explanation: q.e, order_index: i };
    }
    if (ex.exercise_type === "true_false") {
      // true_false — options null, correct_answer "true"/"false"
      return { exercise_id: exId, question: q.q, options: null, correct_answer: q.c, explanation: q.e, order_index: i };
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
  console.log(`Vežbe za kreiranje: ${exercises.length} (${exercises.map((e) => `${e.title.split(" – ")[0]}=${e.questions.length}`).join(", ")})`);

  if (!APPLY) {
    console.log("\n[DRY-RUN] Ništa nije upisano. Pokreni sa --apply da primeniš.\n");
    console.log("Pregled novih sekcija:");
    sections.forEach((s, i) => console.log(`  ${i + 1}. ${s.type}${s.title ? " → " + s.title : ""}${s.headers ? " [" + s.headers.join("|") + "]" : ""}`));
    return;
  }

  // 1) sekcije
  const { error: ue } = await sb.from("lessons").update({ sections, title: "N-deklinacija" }).eq("id", LESSON_ID);
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

  console.log("\nGotovo. Pregledaj uživo: /kurs/fsp → N-deklinacija\n");
}

main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
