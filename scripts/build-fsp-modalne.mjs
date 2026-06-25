// Obogaćuje FSP lekciju "Modalne rečce" (Modalpartikeln).
// Ispravke (Nataša/Milica, jun 2026):
//   - iz teksta objašnjenja uklonjene polomljene zvezdice (**...****) iz migracije;
//   - dodate vežbe iz Natašinog HTML-a "modalpartikeln_vezbe.html" (ranije ih nije bilo).
// Native tipovi (po standardu): 4x quiz + 1x typing.
//   Aufgabe 1 - Welche Partikel passt?      (quiz, izbor rečce za situaciju)
//   Aufgabe 2 - Welche Funktion?            (quiz, funkcija obeležene rečce - <b> bold u pitanju)
//   Aufgabe 3 - Partikel und Funktion       (quiz, rečca -> tipična funkcija)
//   Aufgabe 4 - Wohin gehört die Partikel?  (quiz, pozicija rečce u rečenici)
//   Aufgabe 5 - Ergänzen Sie die Partikel   (typing, dopuni rečcu; više tačnih preko "|")
// Tabela značenja/upotrebe ostaje (Natašin sadržaj, nije menjana).
// Dry-run default; pokreni sa --apply da primeniš (idempotentno re-pokretanje).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const LESSON_ID = "7f15bb9a-896f-45ec-8183-025b2b893cde"; // FSP > Modalne rečce

// ---------- SEKCIJE ----------
const sections = [
  { type: "badge", module: "Gramatika", category: "grammatik" },

  { type: "text", style: "default", content:
`## Modalne rečce

💬 **Šta su modalne rečce?** To su male reči poput *mal*, *halt*, *eben*, *ja*, *eh*, koje na prvi pogled deluju nevažno, ali imaju važnu ulogu u svakodnevnoj komunikaciji - naročito u anamnezi sa pacijentima.

🎓 **Zašto su važne na Fachsprachprüfung-u?** Na ispitu iz stručnog jezika ocenjuje se koliko prirodno i tečno komuniciraš sa pacijentom. Korišćenje modalnih rečci doprinosi autentičnosti i pokazuje tvoje stvarno znanje jezika.

📖 **Kako ih učiti?** Najlakše ih je čuti mnogo puta u autentičnom govoru (filmovi, podkasti, razgovori) kako bi „uhvatio osećaj" kada i kako se koriste.` },

  { type: "table",
    headers: ["Modalpartikel", "Značenje / Upotreba", "Primer"],
    rows: [
      ["ja", "1. Negativna/pozitivna iznenađenja\n\n2. Upozorenje (Imperativ)\n\n3. Informacija je verovatno poznata", "Das hat ja gar wehgetan!\n\nBleiben Sie ja im Bett!\n\nSie sind ja schon über siebzig, deshalb müssen wir eine Koloskopie machen."],
      ["doch", "1. Ublažavanje imperativa\n\n2. Pojačavanje izjave (iznenađenje, ljutnja)\n\n3. Blaga zamerka", "Stellen Sie sich doch mal auf die Waage!\n\nIch trinke doch gar keinen Alkohol!\n\nIch habe Ihnen doch gesagt, dass Sie die Tabletten regelmäßig nehmen müssen."],
      ["denn", "Zainteresovano pitanje", "Wo haben Sie denn die Schmerzen?"],
      ["eigentlich", "1. Zainteresovano pitanje, kada menjamo temu\n\n2. U stvarnosti / nakon preciznijeg razmišljanja", "Arbeiten Sie eigentlich schon lange hier im Krankenhaus?\n\nEigentlich tut der Fuß gar nicht mehr so doll weh."],
      ["mal", "1. Ljubazni zahtev / savet\n\n2. Uraditi nešto brzo\n\n3. Nesigurnost / pretpostavka", "Heben Sie bitte mal den Arm!\n\nIch messe Ihnen jetzt mal den Blutdruck.\n\nIch schaue mal nach Ihren Werten."],
      ["wohl", "Nesigurnost ili pretpostavka", "Ich habe mich wohl bei meiner Nachbarin angesteckt."],
      ["bloß", "1. Upozorenje\n\n2. Iznenađeno, zabrinuto ili ljutito pitanje", "Fassen Sie mich bloß nicht mit Ihren kalten Händen an!\n\nWas ist denn bloß mit meinen Beinen los?"],
      ["aber", "1. Iznenađenje / empatija\n\n2. Razočaranje / ljutnja", "Die Wunde ist aber schnell verheilt!\n\nDas hat jetzt aber ganz schön wehgetan!"],
      ["schon", "Ohrabrenje / umirenje (obično sa „werden\")", "Das wird schon wieder!"],
    ] },

  { type: "text", style: "info", content:
`**Savet:** modalne rečce stoje skoro uvek u sredini rečenice (Mittelfeld), posle glagola i subjekta - npr. *Heben Sie* **mal** *den Arm!* Ne uče se napamet po pravilu, nego po osećaju: što ih više čuješ u kontekstu, lakše ćeš ih sam koristiti.` },

  { type: "text", style: "uebung", content: "## Vežbe\n\nProveri šta si naučio:" },
  { type: "exercise", title: "Aufgabe 1 - Welche Partikel passt?" },
  { type: "exercise", title: "Aufgabe 2 - Welche Funktion?" },
  { type: "exercise", title: "Aufgabe 3 - Partikel und Funktion zuordnen" },
  { type: "exercise", title: "Aufgabe 4 - Wohin gehört die Partikel?" },
  { type: "exercise", title: "Aufgabe 5 - Ergänzen Sie die Partikel" },
];

// ---------- VEŽBE (4x quiz + 1x typing) ----------
const exercises = [
  // Aufgabe 1 - izbor rečce koja odgovara situaciji
  {
    title: "Aufgabe 1 - Welche Partikel passt?",
    exercise_type: "quiz",
    questions: [
      { q: "Sie möchten höflich und freundlich um etwas bitten: „Heben Sie bitte ______ den Arm!“", opts: ["mal", "bloß", "aber"], c: 0, e: "„mal“ macht die Bitte freundlicher und unverbindlicher." },
      { q: "Sie stellen eine interessierte Frage nach den Schmerzen: „Wo haben Sie ______ die Schmerzen?“", opts: ["doch", "denn", "schon"], c: 1, e: "„denn“ signalisiert echtes Interesse bei einer Frage." },
      { q: "Sie beruhigen den Patienten: „Das wird ______ wieder!“", opts: ["schon", "denn", "eigentlich"], c: 0, e: "„schon“ (mit werden) wirkt beruhigend und ermutigend." },
      { q: "Sie warnen eindringlich: „Bleiben Sie ______ im Bett!“", opts: ["denn", "ja", "mal"], c: 1, e: "„ja“ verstärkt die Warnung im Imperativ." },
      { q: "Sie äußern eine Vermutung: „Sie haben sich ______ bei jemandem angesteckt.“", opts: ["wohl", "denn", "bloß"], c: 0, e: "„wohl“ drückt eine Vermutung aus." },
      { q: "Sie wechseln freundlich das Thema: „Arbeiten Sie ______ schon lange hier?“", opts: ["bloß", "eigentlich", "ja"], c: 1, e: "„eigentlich“ leitet einen interessierten Themenwechsel ein." },
    ],
  },
  // Aufgabe 2 - funkcija obeležene rečce (bold preko <b> -> sanitizeHtml)
  {
    title: "Aufgabe 2 - Welche Funktion?",
    exercise_type: "quiz",
    questions: [
      { q: "„Stellen Sie sich <b>doch</b> mal auf die Waage!“", opts: ["Bitte abschwächen", "Warnung", "Vermutung"], c: 0, e: "„doch“ macht die Aufforderung weicher, freundlicher." },
      { q: "„Ich trinke <b>doch</b> gar keinen Alkohol!“", opts: ["Höfliche Bitte", "Nachdrückliche Aussage (Überraschung/Ärger)", "Interessierte Frage"], c: 1, e: "Hier verstärkt „doch“ eine Aussage - Widerspruch/Ärger." },
      { q: "„Die Wunde ist <b>aber</b> schnell verheilt!“", opts: ["Überraschung", "Warnung", "Bitte"], c: 0, e: "„aber“ drückt (positive) Überraschung aus." },
      { q: "„Fassen Sie mich <b>bloß</b> nicht mit kalten Händen an!“", opts: ["Vermutung", "Warnung", "Empathie"], c: 1, e: "„bloß“ verstärkt eine Warnung." },
      { q: "„Sie sind <b>ja</b> schon über siebzig, deshalb machen wir eine Koloskopie.“", opts: ["Bekannte Information", "Warnung", "Bitte"], c: 0, e: "„ja“ verweist auf eine (vermutlich) bekannte Information." },
    ],
  },
  // Aufgabe 3 - rečca -> tipična funkcija
  {
    title: "Aufgabe 3 - Partikel und Funktion zuordnen",
    exercise_type: "quiz",
    questions: [
      { q: "Welche Funktion hat „denn“ typischerweise?", opts: ["interessierte Frage", "Warnung", "Vermutung"], c: 0, e: "„denn“ → interessierte Frage." },
      { q: "Welche Funktion hat „wohl“ typischerweise?", opts: ["Bitte", "Vermutung", "Überraschung"], c: 1, e: "„wohl“ → Vermutung." },
      { q: "Welche Funktion hat „mal“ typischerweise?", opts: ["freundliche Bitte/Aufforderung", "Warnung", "Vorwurf"], c: 0, e: "„mal“ → freundliche, unverbindliche Bitte." },
      { q: "Welche Funktion hat „schon“ (mit werden) typischerweise?", opts: ["Warnung", "Beruhigung/Ermutigung", "interessierte Frage"], c: 1, e: "„schon“ (mit werden) → Beruhigung." },
      { q: "Welche Funktion hat „eigentlich“ typischerweise?", opts: ["interessierte Frage / Themenwechsel", "Vorwurf", "Warnung"], c: 0, e: "„eigentlich“ → interessierte Frage, Themenwechsel." },
    ],
  },
  // Aufgabe 4 - pozicija rečce u rečenici
  {
    title: "Aufgabe 4 - Wohin gehört die Partikel?",
    exercise_type: "quiz",
    questions: [
      { q: "Wohin gehört „mal“? Heben Sie ______ den Arm!", opts: ["vor „Heben“", "nach „Sie“", "am Satzende"], c: 1, e: "„Heben Sie mal den Arm!“ - Partikel im Mittelfeld nach dem Subjekt." },
      { q: "Wohin gehört „denn“? Wo haben Sie ______ die Schmerzen?", opts: ["am Anfang", "nach „Sie“", "ganz am Ende"], c: 1, e: "„Wo haben Sie denn die Schmerzen?“ - Partikel im Mittelfeld." },
      { q: "Wohin gehört „schon“? Das wird ______ wieder!", opts: ["vor „Das“", "nach „wird“", "am Ende"], c: 1, e: "„Das wird schon wieder!“ - Partikel im Mittelfeld nach dem Verb." },
    ],
  },
  // Aufgabe 5 - dopuni rečcu (typing; više tačnih preko "|")
  {
    title: "Aufgabe 5 - Ergänzen Sie die Partikel",
    exercise_type: "typing",
    questions: [
      { q: "Beruhigung: „Das wird ______ wieder!“", a: "schon", e: "schon" },
      { q: "Interessierte Frage: „Wo tut es ______ weh?“", a: "denn", e: "denn" },
      { q: "Vermutung: „Ich habe mich ______ erkältet.“", a: "wohl", e: "wohl" },
      { q: "Freundliche Bitte: „Machen Sie bitte ______ den Mund auf.“", a: "mal", e: "mal" },
      { q: "Warnung im Imperativ: „Nehmen Sie ______ nicht zu viele Tabletten!“", a: "ja|bloß", e: "ja / bloß" },
    ],
  },
];

function buildRows(ex, exId) {
  return ex.questions.map((q, i) => {
    if (ex.exercise_type === "quiz") {
      return { exercise_id: exId, question: q.q, question_type: "quiz", options: { type: "quiz", items: q.opts }, correct_answer: String(q.c), explanation: q.e, order_index: i };
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
  console.log(`Vežbe za kreiranje: ${exercises.length} (${exercises.map((e) => `${e.title.split(" - ")[0]}=${e.questions.length} [${e.exercise_type}]`).join(", ")})`);

  if (!APPLY) {
    console.log("\n[DRY-RUN] Ništa nije upisano. Pokreni sa --apply da primeniš.\n");
    console.log("Pregled novih sekcija:");
    sections.forEach((s, i) => console.log(`  ${i + 1}. ${s.type}${s.title ? " → " + s.title : ""}${s.headers ? " [" + s.headers.join("|") + "]" : ""}`));
    return;
  }

  // 1) sekcije
  const { error: ue } = await sb.from("lessons").update({ sections, title: "Modalne rečce" }).eq("id", LESSON_ID);
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

  console.log("\nGotovo. Pregledaj uživo: /kurs/fsp → Modalne rečce\n");
}

main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
