// Obogaćuje FSP lekciju "Deklinacija prideva" Natašinim sadržajem iz
// "FSP novi/Deklinacija prideva.docx".
// - objašnjenje + 3 tabele deklinacije (neodređeni / određeni / bez člana) -> text/table blokovi
// NOVI STANDARDNI ŠABLON vežbi (tačno 4 stavke):
//   Aufgabe 1 - quiz (izaberi tačan nastavak prideva u medicinskoj rečenici)
//   Aufgabe 2 - true_false (richtig/falsch na celu rečenicu, mix tačnih i pogrešnih)
//   Aufgabe 3 - spoiler "klikni za rešenje" (fraza -> tačan oblik + zašto)
//   Aufgabe 4 - typing (napiši tačan oblik)
// Rezultat: 3 DB vežbe (quiz, true_false, typing) + 1 spoiler sekcija.
// Inline reference na 3 vežbe preko {type:"exercise", title}; spoiler inline.
// Dry-run default; pokreni sa --apply da primeniš na bazu (idempotentno re-pokretanje).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const LESSON_ID = "bcac28e9-e4a0-466d-940c-a78adb3b28b4"; // FSP > Deklinacija prideva

// ---------- SEKCIJE ----------
const sections = [
  { type: "badge", module: "Gramatika", category: "grammatik" },

  { type: "text", style: "default", content:
`## Deklinacija prideva u nemačkom jeziku

Pridevi u nemačkom jeziku se menjaju (dekliniraju) prema tri faktora:

1. **rodu imenice** koju opisuju - da li je imenica muškog roda (der), ženskog roda (die) ili srednjeg roda (das)?
2. **broju imenice** - da li je imenica u jednini ili množini?
3. **članu** koji stoji ispred prideva i imenice - da li je pridev upotrebljen uz određeni član (der, die, das), neodređeni član (ein, eine) ili bez člana.

U primerima koji slede koristimo pridev **verletzt** (povređen) uz imenice **Arm** (m.), **Hand** (f.), **Bein** (n.) i množinu **Arme**.` },

  { type: "text", style: "default", content:
`### Neodređeni član

Deklinacija prideva uz neodređeni član (ein, eine). U množini neodređeni član ne postoji, pa tu nema oblika.` },
  { type: "table",
    headers: ["", "Arm (m.)", "Hand (f.)", "Bein (n.)", "Arme (p.)"],
    rows: [
      ["Nominativ", "ein verletzter Arm", "eine verletzte Hand", "ein verletztes Bein", "-"],
      ["Akkusativ", "einen verletzten Arm", "eine verletzte Hand", "ein verletztes Bein", "-"],
      ["Dativ", "einem verletzten Arm", "einer verletzten Hand", "einem verletzten Bein", "-"],
      ["Genitiv", "eines verletzten Arms", "einer verletzten Hand", "eines verletzten Beins", "-"],
    ] },
  { type: "text", style: "info", content:
`Ovako se pridevi menjaju i sa:

- prisvojnim članom u jednini (mein-, dein-, sein-, ihr-, euer-, unser-...)
- negativnim članom u jednini (kein, keine, keines...)` },

  { type: "text", style: "default", content:
`### Određeni član

Deklinacija prideva uz određeni član (der, die, das, die za množinu).` },
  { type: "table",
    headers: ["", "Arm (m.)", "Hand (f.)", "Bein (n.)", "Arme (p.)"],
    rows: [
      ["Nominativ", "der verletzte Arm", "die verletzte Hand", "das verletzte Bein", "die verletzten Arme"],
      ["Akkusativ", "den verletzten Arm", "die verletzte Hand", "das verletzte Bein", "die verletzten Arme"],
      ["Dativ", "dem verletzten Arm", "der verletzten Hand", "dem verletzten Bein", "den verletzten Armen"],
      ["Genitiv", "des verletzten Arms", "der verletzten Hand", "des verletzten Beins", "der verletzten Arme"],
    ] },
  { type: "text", style: "info", content:
`Ovako se pridevi menjaju i sa:

- upitnim rečima (welcher, welche, welches...)
- pokaznim članovima sa nastavcima (dies-, jen-, manch-, jede-...)` },

  { type: "text", style: "default", content:
`### Bez člana

Deklinacija prideva kada ispred njega nema člana (tzv. jaka deklinacija).` },
  { type: "table",
    headers: ["", "Arm (m.)", "Hand (f.)", "Bein (n.)", "Arme (p.)"],
    rows: [
      ["Nominativ", "verletzter Arm", "verletzte Hand", "verletztes Bein", "verletzte Arme"],
      ["Akkusativ", "verletzten Arm", "verletzte Hand", "verletztes Bein", "verletzte Arme"],
      ["Dativ", "verletztem Arm", "verletzter Hand", "verletztem Bein", "verletzten Armen"],
      ["Genitiv", "verletzten Arms", "verletzter Hand", "verletzten Beins", "verletzter Arme"],
    ] },
  { type: "text", style: "info", content:
`Ovako se pridevi menjaju i sa:

- brojevima u množini (zwei, drei, vier, sechsundzwanzig...)
- u množini sa: wenige, einige` },

  { type: "text", style: "uebung", content: "## Vežbe\n\nProveri šta si naučio:" },
  { type: "exercise", title: "Aufgabe 1 - Wähle die richtige Form" },
  { type: "exercise", title: "Aufgabe 2 - Richtig oder falsch?" },
  { type: "text", style: "default", content: "### Aufgabe 3 - klikni za rešenje\n\nPogledaj frazu, pa klikni da vidiš tačan deklinovan oblik i objašnjenje:" },
  { type: "spoiler", title: "Aufgabe 3 - klikni za rešenje", items: [
    { question: "untersuchen + (der, Akk., m.) verletzt- Arm", answer: "den verletzten Arm - Akkusativ maskulin, određeni član → nastavak -en." },
    { question: "klagen über + (ein, Akk., f.) verletzt- Hand", answer: "eine verletzte Hand - Akkusativ feminin, neodređeni član → nastavak -e." },
    { question: "versorgen + (das, Akk., n.) verletzt- Bein", answer: "das verletzte Bein - Akkusativ neutrum, određeni član → nastavak -e." },
    { question: "kommen mit + (ein, Dat., n.) verletzt- Bein", answer: "einem verletzten Bein - Dativ, neodređeni član → nastavak -en." },
    { question: "behandeln + (-, Akk., Pl.) verletzt- Arme", answer: "verletzte Arme - Akkusativ množina bez člana (jaka deklinacija) → nastavak -e." },
  ] },
  { type: "exercise", title: "Aufgabe 4 - Schreibe die richtige Form" },
];

// ---------- VEŽBE ----------
const exercises = [
  // Aufgabe 1 - QUIZ: izaberi tačan oblik prideva (nastavak) u pravoj medicinskoj rečenici.
  {
    title: "Aufgabe 1 - Wähle die richtige Form",
    exercise_type: "quiz",
    questions: [
      { q: "Der Arzt untersucht den verletzt___ Arm. (Akk. · m. · best. Artikel)", opts: ["-e", "-en", "-es"], c: 1, e: "Akkusativ maskulin, određeni član → nastavak -en." },
      { q: "Die verletzt___ Hand tut sehr weh. (Nom. · f. · best. Artikel)", opts: ["-e", "-en", "-er"], c: 0, e: "Nominativ feminin, određeni član → nastavak -e." },
      { q: "Der Patient kommt mit dem verletzt___ Bein in die Klinik. (Dat. · n. · best. Artikel)", opts: ["-e", "-en", "-em"], c: 1, e: "Dativ, određeni član → nastavak -en." },
      { q: "Sie hat einen verletzt___ Arm. (Akk. · m. · unbest. Artikel)", opts: ["-er", "-en", "-em"], c: 1, e: "Akkusativ maskulin → nastavak -en." },
      { q: "Er klagt über ein verletzt___ Bein. (Akk. · n. · unbest. Artikel)", opts: ["-e", "-es", "-en"], c: 1, e: "Nom./Akk. neutrum, neodređeni član → nastavak -es." },
      { q: "Die Krankenschwester versorgt eine verletzt___ Hand. (Akk. · f. · unbest. Artikel)", opts: ["-e", "-en", "-er"], c: 0, e: "Akkusativ feminin, neodređeni član → nastavak -e." },
    ],
  },
  // Aufgabe 2 - RICHTIG/FALSCH: cela rečenica, mix tačnih i pogrešnih.
  {
    title: "Aufgabe 2 - Richtig oder falsch?",
    exercise_type: "true_false",
    questions: [
      { q: "Richtig oder falsch? „Der Arzt untersucht den verletzte Arm.“", a: "false", e: "Pogrešno. Akkusativ maskulin, određeni član → „den verletzten Arm“." },
      { q: "Richtig oder falsch? „Sie klagt über eine verletzte Hand.“", a: "true", e: "Tačno. Akkusativ feminin, neodređeni član → „eine verletzte Hand“." },
      { q: "Richtig oder falsch? „Wir versorgen das verletzten Bein.“", a: "false", e: "Pogrešno. Akkusativ neutrum, određeni član → „das verletzte Bein“." },
      { q: "Richtig oder falsch? „Mit einem verletzte Bein kam er in die Klinik.“", a: "false", e: "Pogrešno. Dativ, neodređeni član → „einem verletzten Bein“." },
      { q: "Richtig oder falsch? „Der Patient hat einen verletzten Arm.“", a: "true", e: "Tačno. Akkusativ maskulin, neodređeni član → „einen verletzten Arm“." },
      { q: "Richtig oder falsch? „Die verletzte Hand wird verbunden.“", a: "true", e: "Tačno. Nominativ feminin, određeni član → „die verletzte Hand“." },
    ],
  },
  // Aufgabe 4 - PISANJE: napiši tačan oblik (više dozvoljenih preko "|").
  {
    title: "Aufgabe 4 - Schreibe die richtige Form",
    exercise_type: "typing",
    questions: [
      { q: "verletzt- + Arm (Nominativ, m., bez člana)", a: "verletzter Arm", e: "verletzter Arm" },
      { q: "verletzt- + Hand (Dativ, f., bez člana)", a: "verletzter Hand", e: "verletzter Hand" },
      { q: "verletzt- + Bein (Nominativ, n., bez člana)", a: "verletztes Bein", e: "verletztes Bein" },
      { q: "verletzt- + Arme (Dativ, Pl., bez člana)", a: "verletzten Armen", e: "verletzten Armen" },
    ],
  },
];

function buildRows(ex, exId) {
  return ex.questions.map((q, i) => {
    if (ex.exercise_type === "quiz") {
      return { exercise_id: exId, question: q.q, question_type: "quiz", options: { type: "quiz", items: q.opts }, correct_answer: String(q.c), explanation: q.e, order_index: i };
    }
    if (ex.exercise_type === "true_false") {
      // true_false - options:null; renderer prepoznaje po correct_answer "true"/"false".
      return { exercise_id: exId, question: q.q, question_type: "true_false", options: null, correct_answer: q.a, explanation: q.e, order_index: i };
    }
    // typing - mora { type: "typing" } (options:null pada na default quiz pa nema polja)
    return { exercise_id: exId, question: q.q, question_type: "typing", options: { type: "typing" }, correct_answer: q.a, explanation: q.e, order_index: i };
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
  const { error: ue } = await sb.from("lessons").update({ sections, title: "Deklinacija prideva" }).eq("id", LESSON_ID);
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

  console.log("\nGotovo. Pregledaj uživo: /kurs/fsp → Deklinacija prideva\n");
}

main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
