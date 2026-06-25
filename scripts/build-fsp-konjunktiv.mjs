// PILOT: Obogaćuje FSP lekciju "Indirektni govor" (Konjunktiv I) Natašinim
// dorađenim sadržajem iz "FSP novi/Konjunktiv I ...docx".
// - tekst lekcije -> text/mistakes/table/vocabulary blokovi
// - 5 HTML vežbi sa dna dokumenta -> native vežbe (4x quiz + 1x typing)
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

const LESSON_ID = "f40d65d5-7bfb-4c99-9062-cc243c9fd065"; // FSP > Indirektni govor

// ---------- SEKCIJE ----------
const sections = [
  { type: "badge", module: "Gramatika", category: "grammatik" },

  { type: "text", style: "default", content:
`## Konjunktiv I i Fachsprachprüfung: šta je važno znati?

Ako si se pripremao za Fachsprachprüfung (FSP) ili pratio diskusije na društvenim mrežama, verovatno si naišao na dosta polemike oko upotrebe **Konjunktiva I**. Ovaj oblik često zbunjuje lekare, pa se stiče utisak da mu je značaj na ispitu veći nego što zaista jeste.

**Šta je Konjunktiv I?** Kada prenosimo nečije reči, koristimo indirektni govor, koji se izražava Konjunktivom I. Sreće se u novinskim člancima i vestima, ali i u lekarskim izveštajima - omogućava nam da jasno prenesemo nečije reči bez direktnog citiranja.

**Da li se koristi u praksi?** Retko. Mnogim lekarima zvuči previše formalno, pa komisije sve češće kritikuju preteranu upotrebu Konjunktiva I pri predstavljanju pacijenta. Često se naglašava da treba govoriti „normalno".

**Da li ga ipak treba znati za ispit?** Da - od tebe se očekuje nemački na nivou C1. Komisije traže jasnu i preciznu komunikaciju, ali postoje situacije u kojima mogu da zatraže Konjunktiv I pri predstavljanju slučaja. Zato budi spreman da ga pravilno upotrebiš kada se to očekuje.` },

  { type: "text", style: "info", content:
`### Kada koristiti Konjunktiv I na FSP-u?

- **U pisanju (Arztbrief):** preporučuje se, da komisiji pokažeš da vladaš C1 gramatikom. U pisanom izrazu koristi se češće nego u govoru.
- **U govoru:** uglavnom nije potrebno. Ako ti komisija sugeriše da ga koristiš (ili ne), postupi po tome.` },

  { type: "text", style: "default", content: "### Česte greške pri upotrebi Konjunktiva I" },
  { type: "mistakes", items: [
    { wrong: "Herr Schmidt sei 1,90 groß und 90 kg schwer.", correct: "Herr Schmidt ist 1,90 groß und 90 kg schwer.", explanation: "Lični/objektivni podaci → Indikativ." },
    { wrong: "Der Patient habe sich bei uns wegen … vorgestellt.", correct: "Der Patient stellte sich wegen … vor.", explanation: "Uvod u Arzt-Arzt-Gespräch → Indikativ." },
    { wrong: "Der Patient sei zu uns wegen … gekommen.", correct: "Die Patientin kam zu uns wegen …", explanation: "Uvodna rečenica → Indikativ." },
    { wrong: "Die Patientin sei Raucherin mit 20 Packungsjahren.", correct: "Die Patientin ist Raucherin mit 20 Packungsjahren.", explanation: "Sumiranje objektivne informacije → Indikativ." },
    { wrong: "Die gynäkologische Anamnese sei unauffällig gewesen.", correct: "Die gynäkologische Anamnese war unauffällig.", explanation: "Objektivan nalaz → Indikativ." },
    { wrong: "Der Patient berichte über akute Abdominalschmerzen.", correct: "Der Patient berichtete über akute Abdominalschmerzen.", explanation: "Glagol koji uvodi tuđe reči ide u Indikativ." },
  ] },

  { type: "text", style: "default", content:
`### Osnovna pravila Konjunktiva I

Za Konjunktiv I koristimo **osnovu glagola** i dodajemo posebne nastavke. Glagol **sein** je izuzetak i uči se napamet:

- ich **sei**
- du **seiest**
- er/sie/es **sei**
- wir **seien**
- ihr **seiet**
- sie/Sie **seien**

Za sve druge glagole uzimamo osnovu (skidamo *-en*) i dodajemo nastavke: *machen → mach*, *leiden → leid*, *haben → hab*, *können → könn*.` },

  { type: "table",
    headers: ["", "können", "fühlen", "nachlassen", "haben"],
    rows: [
      ["ich", "könne / könnte", "fühle / würde fühlen", "lasse nach / würde nachlassen", "habe / hätte"],
      ["du", "könnest", "fühlest", "lassest nach", "habest"],
      ["er/sie/es", "könne", "fühle", "lasse nach", "habe"],
      ["wir", "können / könnten", "fühlen / würden fühlen", "lassen nach / würden nachlassen", "haben / hätten"],
      ["ihr", "könnet", "fühlet", "lasset nach", "habet"],
      ["sie/Sie", "können", "fühlen", "lassen nach", "haben"],
    ] },

  { type: "text", style: "info", content:
`**Olakšica za FSP:** dovoljno je da naučiš **3. lice jednine u Konjunktivu I** (npr. *er/sie/es habe*) za prenošenje informacija, a za množinu koristiš **Konjunktiv II** (npr. *sie würden*). Kada Konjunktiv I izgleda isto kao indikativ, koristimo Konjunktiv II da izbegnemo dvosmislenost.` },

  { type: "text", style: "default", content:
`### Složeni glagolski oblici

Kod složenih vremena u Konjunktiv I prebacujemo **samo glagol koji se menja**, ostatak rečenice ostaje isti.` },
  { type: "table",
    headers: ["Pacijent kaže (direktno)", "Indirektni govor (Konjunktiv I)"],
    rows: [
      ["Ich habe an Angina pectoris gelitten.", "Sie habe an Angina pectoris gelitten."],
      ["Ich bin 2006 wegen Appendizitis operiert worden.", "Sie sei 2006 wegen Appendizitis operiert worden."],
      ["Ich habe schmerzbedingt nicht schlafen können.", "Sie habe schmerzbedingt nicht schlafen können."],
      ["Ich habe nicht operiert werden können.", "Sie habe nicht operiert werden können."],
    ] },

  { type: "text", style: "default", content:
`Konjunktiv I ima dva vremena: **prezent** i **perfekt**. Ako pacijent koristi preterit, prebacujemo ga u perfekt:

- *Sie litt an starken Brustschmerzen.* → *Sie habe an starken Brustschmerzen gelitten.*
- *Er wurde operiert.* → *Er sei operiert worden.*` },

  { type: "text", style: "default", content: "### Glagoli koji prenose tuđe reči" },
  { type: "vocabulary", rows: [
    ["berichten", "izveštavati"],
    ["hinzufügen", "dodati"],
    ["angeben", "navesti"],
    ["erzählen von", "pričati o"],
    ["fragen nach", "pitati za"],
    ["sagen", "reći"],
  ] },

  { type: "text", style: "info", content:
`**Napomena uz vežbe:** u primerima i vežbama pacijent je žena - **die Patientin**, pa je glagol u 3. licu jednine („sie habe", „sie sei", „sie könne"). Ako je tvoj pacijent muškarac, pravilo je isto, samo umesto „sie" koristiš „er" („er habe", „er sei"). Zato se ne zbuni kada svuda vidiš „sie".` },

  { type: "text", style: "uebung", content: "## Vežbe\n\nProveri šta si naučio:" },
  { type: "exercise", title: "Aufgabe 1 - Konjunktiv I oder Indikativ?" },
  { type: "exercise", title: "Aufgabe 2 - Richtig oder falsch?" },
  { type: "spoiler", title: "Aufgabe 3 - klikni za rešenje", items: [
    { question: "Bringen Sie in die indirekte Rede (3. P. Sg.): „Ich habe seit einer Woche Kopfschmerzen.“", answer: "Sie habe seit einer Woche Kopfschmerzen. (Singular → Konjunktiv I: „habe“.)" },
    { question: "Bringen Sie in die indirekte Rede (3. P. Sg.): „Ich kann den linken Arm nicht bewegen.“", answer: "Sie könne den linken Arm nicht bewegen. (Singular → Konjunktiv I: „könne“.)" },
    { question: "Finden Sie den Fehler: „Der Patient sei wegen Bauchschmerzen zu uns gekommen.“", answer: "Pogrešno: „sei“. Uvodna rečenica (Arzt-Arzt) → Indikativ: „Der Patient kam wegen Bauchschmerzen zu uns.“" },
    { question: "Finden Sie den Fehler: „Die Patientin berichte über Schwindel seit zwei Tagen.“", answer: "Pogrešno: „berichte“. Glagol koji uvodi tuđe reči → Indikativ: „Die Patientin berichtete über Schwindel seit zwei Tagen.“" },
    { question: "Bringen Sie in den Plural (indirekte Rede): „Die Schmerzen strahlen in den Rücken aus.“", answer: "Die Schmerzen würden in den Rücken ausstrahlen. (Plural → Konjunktiv II: „würden ausstrahlen“.)" },
  ] },
  { type: "exercise", title: "Aufgabe 4 - Schreiben Sie die indirekte Rede" },
];

// ---------- VEŽBE ----------
const exercises = [
  {
    title: "Aufgabe 1 - Konjunktiv I oder Indikativ?",
    exercise_type: "quiz",
    questions: [
      { q: "Der Patient ______ über stechende Schmerzen.", opts: ["berichte", "berichtete"], c: 1, e: "Einleitendes Verb -> Indikativ." },
      { q: "Die Patientin gab an, sie ______ seit drei Tagen Fieber.", opts: ["habe", "hat"], c: 0, e: "Patientenaussage -> Konjunktiv I." },
      { q: "Die körperliche Untersuchung ______ unauffällig.", opts: ["sei", "war"], c: 1, e: "Objektiver Befund -> Indikativ." },
      { q: "Der Patient erzählte, er ______ nachts nicht schlafen.", opts: ["könne", "kann"], c: 0, e: "Patientenaussage -> Konjunktiv I." },
      { q: "Frau Keller ______ 1,72 m groß.", opts: ["sei", "ist"], c: 1, e: "Objektive Personendaten -> Indikativ." },
    ],
  },
  {
    title: "Aufgabe 2 - Richtig oder falsch?",
    exercise_type: "true_false",
    questions: [
      { q: "Richtig oder falsch? „Frau Wagner ist 65 Jahre alt und Rentnerin.“", c: "true", e: "Tačno. Objektivni lični podaci idu u Indikativ." },
      { q: "Richtig oder falsch? „Herr Klein sei Raucher mit 30 Packungsjahren.“", c: "false", e: "Netačno. Sumiranje objektivne informacije -> Indikativ: „Herr Klein ist Raucher mit 30 Packungsjahren.“" },
      { q: "Richtig oder falsch? „Die Patientin gab an, sie habe seit drei Tagen Fieber.“", c: "true", e: "Tačno. Iskaz pacijenta -> Konjunktiv I: „habe“." },
      { q: "Richtig oder falsch? „Der Patient sei wegen Bauchschmerzen zu uns gekommen.“", c: "false", e: "Netačno. Uvodna rečenica (Arzt-Arzt) -> Indikativ: „Der Patient kam wegen Bauchschmerzen zu uns.“" },
      { q: "Richtig oder falsch? „Die körperliche Untersuchung war unauffällig.“", c: "true", e: "Tačno. Objektivan nalaz ide u Indikativ." },
      { q: "Richtig oder falsch? „Die Patientin berichte über Schwindel seit zwei Tagen.“", c: "false", e: "Netačno. Glagol koji uvodi tuđe reči -> Indikativ: „Die Patientin berichtete über Schwindel seit zwei Tagen.“" },
    ],
  },
  {
    title: "Aufgabe 4 - Schreiben Sie die indirekte Rede",
    exercise_type: "typing",
    questions: [
      { q: "Schreiben Sie die indirekte Rede (3. P. Sg.): „Ich litt jahrelang an Migräne.“", a: "Sie habe jahrelang an Migräne gelitten|Er habe jahrelang an Migräne gelitten", e: "Sie/Er habe jahrelang an Migräne gelitten." },
      { q: "Schreiben Sie die indirekte Rede (3. P. Sg.): „Ich wurde als Kind am Blinddarm operiert.“", a: "Sie sei als Kind am Blinddarm operiert worden|Er sei als Kind am Blinddarm operiert worden", e: "Sie/Er sei als Kind am Blinddarm operiert worden." },
      { q: "Schreiben Sie die indirekte Rede (3. P. Sg.): „Ich nahm damals Kortison ein.“", a: "Sie habe damals Kortison eingenommen|Er habe damals Kortison eingenommen", e: "Sie/Er habe damals Kortison eingenommen." },
    ],
  },
];

function buildRows(ex, exId) {
  return ex.questions.map((q, i) => {
    if (ex.exercise_type === "quiz") {
      return { exercise_id: exId, question: q.q, options: { type: "quiz", items: q.opts }, correct_answer: String(q.c), explanation: q.e, order_index: i };
    }
    if (ex.exercise_type === "true_false") {
      return { exercise_id: exId, question: q.q, options: null, correct_answer: q.c, explanation: q.e, order_index: i };
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
  console.log(`Vežbe za kreiranje: ${exercises.length} (${exercises.map((e) => `${e.title.split(" - ")[0]}=${e.questions.length} [${e.exercise_type}]`).join(", ")})`);

  if (!APPLY) {
    console.log("\n[DRY-RUN] Ništa nije upisano. Pokreni sa --apply da primeniš.\n");
    console.log("Pregled novih sekcija:");
    sections.forEach((s, i) => console.log(`  ${i + 1}. ${s.type}${s.title ? " → " + s.title : ""}${s.headers ? " [" + s.headers.join("|") + "]" : ""}`));
    return;
  }

  // 1) sekcije
  const { error: ue } = await sb.from("lessons").update({ sections, title: "Indirektni govor (Konjunktiv I)" }).eq("id", LESSON_ID);
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

  console.log("\nGotovo. Pregledaj uživo: /kurs/fsp → Indirektni govor (Konjunktiv I)\n");
}

main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
