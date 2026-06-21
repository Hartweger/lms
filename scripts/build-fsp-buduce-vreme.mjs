// Obogaćuje FSP lekciju "Buduće vreme" Natašinim sadržajem iz
// "FSP novi/buduce vreme.docx".
// - tekst lekcije + Futur I tabela -> text/table blokovi
// - NOVI STANDARDNI ŠABLON: tačno 4 zadatka
//   Aufgabe 1 = quiz, Aufgabe 2 = true_false, Aufgabe 3 = spoiler (klikni za rešenje),
//   Aufgabe 4 = typing.
// - Izbačeno: "Welche Funktion hat der Satz?" (teorija/funkcija, ne upotreba)
//   i "Wo steht der Infinitiv?" (teorija reda reči).
// Inline reference na vežbe preko {type:"exercise", title}; spoiler inline.
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

const LESSON_ID = "c5fb70b6-dc72-4a7c-894c-146494c07ee6"; // FSP > Buduće vreme

// ---------- SEKCIJE ----------
const sections = [
  { type: "badge", module: "Gramatika", category: "grammatik" },

  { type: "text", style: "default", content:
`## Kako pravilno koristiti buduće vreme na nemačkom jeziku?

Jedno od ključnih područja na koje treba da obratiš pažnju jeste pravilna upotreba glagola u budućem vremenu. Tokom razgovora sa pacijentima, kolegama odnosno komisijom, trebalo bi da izneseš planove ili daš instrukcije.

Ovde ćemo proći kroz upotrebu sadašnjeg vremena uz vremenske oznake, kao i kroz **Futur I**, što će ti pomoći da tačno komuniciraš buduće radnje u medicinskom kontekstu.` },

  { type: "text", style: "default", content:
`### Sadašnje vreme + vremenska oznaka (Präsens + Zeitangabe)

U medicinskoj praksi, često ćeš koristiti sadašnje vreme kada govoriš o budućim radnjama, posebno kada su te radnje sigurne i planirane. Evo nekoliko vremenskih oznaka:

- **übermorgen** - prekosutra
- **am Wochenende** - za vikend
- **nächstes Jahr** - sledeće godine` },

  { type: "text", style: "info", content:
`**Primeri:**

- *Am Donnerstag operieren wir Sie.* - U četvrtak vas operišemo.
- *Am Wochenende führen wir die Untersuchung durch.* - Za vikend ćemo obaviti pregled.` },

  { type: "text", style: "default", content:
`### Futur I

Za ostale medicinske situacije i planove u budućnosti, koristićeš **Futur I**, koji se formira sa pomoćnim glagolom **werden** i infinitivom glavnog glagola.` },

  { type: "table",
    headers: ["Person", "werden", "Infinitiv"],
    rows: [
      ["ich", "werde", "untersuchen"],
      ["du", "wirst", "verschreiben"],
      ["er/sie/es", "wird", "warten"],
      ["wir", "werden", "abwarten"],
      ["ihr", "werdet", "entfernen"],
      ["sie/Sie", "werden", "nachfragen"],
    ] },

  { type: "text", style: "default", content:
`### Kada koristimo Futur I?

**1. Pretpostavke**

U medicini, često ćeš morati da iznosiš pretpostavke o budućem stanju pacijenata:

- *In 2 Tagen wird es Ihnen bestimmt besser.* - Za dva dana će vam sigurno biti bolje.

Ovakve pretpostavke koriste se uz reči kao što su na primer **„wohl"**, **„bestimmt"** i **„wahrscheinlich"**, koje ukazuju na određeni stepen sigurnosti u prognozi.

**2. Instrukcije**

Davanje jasnih instrukcija pacijentima je od presudne važnosti:

- *Sie werden die Salbe 2x täglich eincremen.* - Nanosite mast 2 puta dnevno.

**3. Obećanja i planovi**

Obećanja ili iznošenje planova u vezi sa tretmanom pacijenata:

- *Machen Sie sich keine Sorgen. Ich werde Ihnen helfen.* - Ne brinite. Pomoći ću vam.
- *Morgen werden wir wieder Blutdruck messen, oder?* - Sutra ćemo ponovo meriti pritisak, zar ne?` },

  { type: "text", style: "uebung", content: "## Vežbe\n\nProveri šta si naučio:" },
  { type: "exercise", title: "Aufgabe 1 - Futur I bilden" },
  { type: "exercise", title: "Aufgabe 2 - Richtig oder falsch?" },

  { type: "spoiler", title: "Aufgabe 3 - klikni za rešenje", items: [
    { question: "„Ich wird Ihnen ein Rezept ausstellen.“", answer: "Pogrešno: „wird“. ich → „werde“: „Ich werde Ihnen ein Rezept ausstellen.“" },
    { question: "„Wir werden die Untersuchung durchführen morgen.“", answer: "Pogrešno: vremenska oznaka „morgen“ ne ide na kraj: „Wir werden morgen die Untersuchung durchführen.“" },
    { question: "„Am Donnerstag operieren wir Sie.“", answer: "Tačno! Präsens + vremenska oznaka izražava planiranu budućnost." },
    { question: "„Sie werden sich bald besser fühlen werden.“", answer: "Pogrešno: samo jedno „werden“ - drugo je višak: „Sie werden sich bald besser fühlen.“" },
  ] },

  { type: "exercise", title: "Aufgabe 4 - Im Futur I formulieren" },
];

// ---------- VEŽBE ----------
const exercises = [
  {
    title: "Aufgabe 1 - Futur I bilden",
    exercise_type: "quiz",
    questions: [
      { q: "Ich ______ Sie gleich untersuchen. (ich)", opts: ["werde", "wirst", "wird"], c: 0, e: "ich → werde." },
      { q: "Wir ______ morgen den Blutdruck messen. (wir)", opts: ["wird", "werden", "werdet"], c: 1, e: "wir → werden." },
      { q: "Der Arzt ______ Ihnen ein Medikament verschreiben. (er)", opts: ["wird", "werde", "wirst"], c: 0, e: "er/sie/es → wird." },
      { q: "Sie ______ die Salbe zweimal täglich auftragen. (Sie)", opts: ["werdet", "wirst", "werden"], c: 2, e: "Sie (Höflichkeit) → werden." },
      { q: "Du ______ bald wieder gesund sein. (du)", opts: ["wirst", "wird", "werde"], c: 0, e: "du → wirst." },
    ],
  },
  {
    title: "Aufgabe 2 - Richtig oder falsch?",
    exercise_type: "true_false",
    questions: [
      { s: "Ich wird Ihnen ein Rezept ausstellen.", c: false, e: "Falsch: ich → „werde“. Richtig: „Ich werde Ihnen ein Rezept ausstellen.“" },
      { s: "Wir werden morgen die Untersuchung durchführen.", c: true, e: "Richtig: werden + Infinitiv am Satzende, Zeitangabe vorne." },
      { s: "Wir werden die Untersuchung durchführen morgen.", c: false, e: "Falsch: „morgen“ darf nicht ans Ende. Richtig: „Wir werden morgen die Untersuchung durchführen.“" },
      { s: "Am Donnerstag operieren wir Sie.", c: true, e: "Richtig: Präsens + Zeitangabe drückt geplante Zukunft aus." },
      { s: "Sie werden sich bald besser fühlen werden.", c: false, e: "Falsch: nur ein „werden“ - das zweite ist zu viel. Richtig: „Sie werden sich bald besser fühlen.“" },
      { s: "Der Arzt wird Ihnen ein Medikament verschreiben.", c: true, e: "Richtig: er/sie/es → wird, Infinitiv am Satzende." },
    ],
  },
  {
    title: "Aufgabe 4 - Im Futur I formulieren",
    exercise_type: "typing",
    questions: [
      { q: "Schreiben Sie den Satz im Futur I: (ich / Ihnen / ein Medikament / verschreiben)", a: "Ich werde Ihnen ein Medikament verschreiben", e: "Ich werde Ihnen ein Medikament verschreiben." },
      { q: "Schreiben Sie den Satz im Futur I: (wir / morgen / den Blutdruck / messen)", a: "Wir werden morgen den Blutdruck messen", e: "Wir werden morgen den Blutdruck messen." },
      { q: "Schreiben Sie den Satz im Futur I: (Sie / die Tabletten / zweimal täglich / einnehmen)", a: "Sie werden die Tabletten zweimal täglich einnehmen|Sie werden die Tabletten 2x täglich einnehmen", e: "Sie werden die Tabletten zweimal täglich einnehmen." },
      { q: "Schreiben Sie den Satz im Futur I: (es / Ihnen / bald / besser gehen)", a: "Es wird Ihnen bald besser gehen", e: "Es wird Ihnen bald besser gehen." },
    ],
  },
];

function buildRows(ex, exId) {
  return ex.questions.map((q, i) => {
    if (ex.exercise_type === "quiz") {
      return { exercise_id: exId, question: q.q, options: { type: "quiz", items: q.opts }, correct_answer: String(q.c), explanation: q.e, order_index: i };
    }
    if (ex.exercise_type === "true_false") {
      return { exercise_id: exId, question: `Richtig oder falsch? „${q.s}“`, options: null, correct_answer: q.c ? "true" : "false", explanation: q.e, order_index: i };
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
  console.log(`Vežbe za kreiranje: ${exercises.length} (${exercises.map((e) => `${e.title.split(" - ")[0]}=${e.questions.length}`).join(", ")})`);

  if (!APPLY) {
    console.log("\n[DRY-RUN] Ništa nije upisano. Pokreni sa --apply da primeniš.\n");
    console.log("Pregled novih sekcija:");
    sections.forEach((s, i) => console.log(`  ${i + 1}. ${s.type}${s.title ? " → " + s.title : ""}${s.headers ? " [" + s.headers.join("|") + "]" : ""}`));
    return;
  }

  // 1) sekcije
  const { error: ue } = await sb.from("lessons").update({ sections }).eq("id", LESSON_ID);
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

  console.log("\nGotovo. Pregledaj uživo: /kurs/fsp → Buduće vreme\n");
}

main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
