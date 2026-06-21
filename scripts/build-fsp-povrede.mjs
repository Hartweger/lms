// VOKABULAR LEKCIJA: FSP "Povrede i nezgode" iz "FSP novi" (nezgode_povrede_vezbe.html).
// Ilustrovana galerija (mesto nesreće + glagoli povreda) + wordset (Quizlet učenje)
// + 4 vežbe (kviz, richtig/falsch, spoiler, pisanje). Dry-run default; --apply za primenu. Idempotentno.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const LESSON_ID = "9966aa6f-623b-4333-8157-01331626d1ab"; // FSP > Povrede i nezgode
const IMG = (k) => `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog-media/fsp/illustrations/povrede-${k}.svg`;

// dict iz HTML-a: mesto nesreće + glagoli; [ic, de, sr, note?]
const dict = [
  ["gehweg", "der Bürgersteig / der Gehweg", "trotoar / pešačka staza"],
  ["radweg", "der Radweg", "biciklistička staza"],
  ["bordstein", "der Bordstein", "ivičnjak"],
  ["pfosten", "der Pfosten", "stub / stubić"],
  ["laterne", "der Laternenpfahl", "stub ulične rasvete"],
  ["schutzzaun", "der Schutzzaun", "zaštitna ograda"],
  ["hydrant", "der Hydrant", "hidrant", "N-Deklination!"],
  ["leitplanke", "die Leitplanke", "zaštitna (auto) ograda"],
  ["graben", "der Straßengraben", "putni jarak / kanal"],
  ["absperr", "das Absperrgitter", "zaštitna barijera / gelender"],
  ["pfutze", "die Wasserpfütze", "bara / lokva"],
  ["leiter", "die Leiter", "merdevine / lestve"],
  ["schleudern", "ins Schleudern geraten", "proklizati / izgubiti kontrolu (vozilo)"],
  ["ueberholen", "überholen", "preticati / obići"],
  ["aufprallen", "aufprallen auf/gegen + Akk.", "udariti (u nešto)"],
  ["knallen", "knallen auf + Akk.", "tresnuti / silovito udariti"],
  ["stuerzen", "stürzen auf + Akk.", "pasti (na nešto)"],
  ["fallen", "fallen auf + Akk.", "pasti na (deo tela)"],
  ["hinfallen", "hinfallen", "pasti (bez objekta)"],
  ["ausrutschen", "ausrutschen", "okliznuti se"],
  ["zusammen", "zusammenstoßen", "sudariti se"],
  ["ueberschlagen", "sich überschlagen", "prevrnuti se (preko krova)"],
  ["abstuetzen", "sich abstützen mit + Dativ", "osloniti se / dočekati se"],
  ["stolpern", "stolpern über + Akk.", "saplesti se"],
  ["umknicken", "umknicken mit + Dativ", "uganuti (nogu)"],
  ["anfahren", "anfahren / überfahren", "udariti / pregaziti (vozilom)"],
  ["abrutschen", "abrutschen", "skliznuti (npr. sa merdevina)"],
  ["aufschuerfen", "sich aufschürfen", "ogrebati / oguliti (kožu)"],
];

// SR sa eventualnom napomenom u zagradi
const srWithNote = (sr, note) => (note ? `${sr} (${note})` : sr);

const sections = [
  { type: "badge", module: "Wortschatz", category: "wortschatz" },
  { type: "text", style: "default", content:
`## Unfälle und Verletzungen - mesto nesreće i povrede

U anamnezi na FSP-u često moraš da opišeš gde se nesreća dogodila i šta se tačno desilo. Prvo pregledaj ilustracije sa rečima (mesto nesreće i glagoli povreda), pa vežbaj kroz kartice i zadatke. Obrati pažnju na rekciju glagola (auf + Akk., mit + Dativ).` },

  { type: "text", style: "default", content: "## Wortschatz - mesto nesreće i povrede (sa ilustracijama)" },
  { type: "gallery", title: "Mesto nesreće i glagoli povreda",
    items: dict.map(([k, de, sr, note]) => ({ image: IMG(k), de, sr: srWithNote(sr, note) })) },

  { type: "text", style: "default", content: "## Vokabular kao kartice\n\nVežbaj reči kao kartice (kviz, kucanje, igra memorije):" },
  { type: "wordset", title: "Povrede i nezgode", setKey: "fsp-povrede", frontLabel: "DE", backLabel: "SR",
    items: dict.map(([, de, sr, note]) => ({ front: de, back: srWithNote(sr, note) })) },

  { type: "text", style: "uebung", content: "## Vežbe\n\nProveri šta si naučio:" },
  { type: "exercise", title: "Aufgabe 1 - Orte und Gegenstände am Unfallort" },
  { type: "exercise", title: "Aufgabe 2 - Richtig oder falsch?" },
  { type: "spoiler", title: "Aufgabe 3 - klikni za rešenje", items: [
    { question: "Das Auto verliert auf nasser Straße die Kontrolle und rutscht seitlich weg. Es ___ .", answer: "geriet ins Schleudern (ins Schleudern geraten)." },
    { question: "Das Auto prallt frontal gegen einen Mast. Es ___ auf den Mast.", answer: "prallte auf/gegen (aufprallen auf/gegen + Akkusativ)." },
    { question: "Eine Person rutscht auf dem Eis aus und ___ .", answer: "stürzte / fiel hin (stürzen, hinfallen)." },
    { question: "Zwei Fahrzeuge prallen gegeneinander. Sie ___ .", answer: "stießen zusammen (zusammenstoßen mit + Dativ)." },
    { question: "Beim Fallen fängt er sich mit der Hand ab. Er ___ sich mit der Hand ___ .", answer: "stützte ... ab (sich abstützen mit + Dativ)." },
    { question: "Der Fuß knickt beim Gehen seitlich weg. Er ___ mit dem Fuß ___ .", answer: "knickte ... um (umknicken mit + Dativ)." },
  ] },
  { type: "exercise", title: "Aufgabe 4 - Ergänzen Sie das Verb (Partizip II)" },
];

const exercises = [
  {
    title: "Aufgabe 1 - Orte und Gegenstände am Unfallort",
    exercise_type: "quiz",
    questions: [
      { q: "Der Weg neben der Straße, auf dem Fußgänger gehen.", opts: ["der Bürgersteig / der Gehweg", "der Radweg", "der Straßengraben"], c: 0, e: "der Bürgersteig / der Gehweg - Fußgängerweg." },
      { q: "Die erhöhte Steinkante zwischen Gehweg und Straße.", opts: ["der Pfosten", "der Bordstein", "das Absperrgitter"], c: 1, e: "der Bordstein." },
      { q: "Die hohe Stange mit der Straßenbeleuchtung.", opts: ["der Pfosten", "der Laternenpfahl", "der Hydrant"], c: 1, e: "der Laternenpfahl." },
      { q: "Die Metallbarriere am Rand der Autobahn.", opts: ["der Schutzzaun", "die Leitplanke", "der Bordstein"], c: 1, e: "die Leitplanke." },
      { q: "Eine kleine Wasseransammlung auf dem Boden.", opts: ["der Straßengraben", "die Wasserpfütze", "der Hydrant"], c: 1, e: "die Wasserpfütze." },
      { q: "Womit man auf ein Dach oder zu einer Höhe steigt.", opts: ["die Leiter", "der Pfosten", "der Laternenpfahl"], c: 0, e: "die Leiter." },
    ],
  },
  {
    title: "Aufgabe 2 - Richtig oder falsch?",
    exercise_type: "true_false",
    questions: [
      { q: "Richtig oder falsch? „Auf dem Gehweg fahren normalerweise die Autos.“", a: "false", e: "Falsch - auf dem Gehweg gehen die Fußgänger." },
      { q: "Richtig oder falsch? „Eine Leitplanke ist die Metallbarriere am Rand der Autobahn.“", a: "true", e: "Richtig." },
      { q: "Richtig oder falsch? „Wenn man auf nasser Straße die Kontrolle verliert, gerät man ins Schleudern.“", a: "true", e: "Richtig - ins Schleudern geraten." },
      { q: "Richtig oder falsch? „Zusammenstoßen bedeutet, dass ein Fahrzeug ein anderes langsam überholt.“", a: "false", e: "Falsch - zusammenstoßen heißt, dass zwei Fahrzeuge gegeneinander prallen." },
      { q: "Richtig oder falsch? „Wenn man mit dem Fuß seitlich wegknickt, knickt man um.“", a: "true", e: "Richtig - umknicken mit + Dativ." },
      { q: "Richtig oder falsch? „Sich aufschürfen bedeutet, sich einen Knochen zu brechen.“", a: "false", e: "Falsch - sich aufschürfen heißt, die Haut oberflächlich zu verletzen." },
    ],
  },
  {
    title: "Aufgabe 4 - Ergänzen Sie das Verb (Partizip II)",
    exercise_type: "typing",
    questions: [
      { q: "Der Patient ist auf einer Wasserpfütze ___ und hat sich das Bein verletzt. (ausrutschen)", a: "ausgerutscht", e: "ausgerutscht" },
      { q: "Der Patient ist einfach zu Boden ___ . (hinfallen)", a: "hingefallen", e: "hingefallen" },
      { q: "Das Auto hat sich beim Unfall ___ . (sich überschlagen)", a: "überschlagen|ueberschlagen", e: "überschlagen" },
      { q: "Er sei von der Leiter ___ . (abrutschen)", a: "abgerutscht", e: "abgerutscht" },
      { q: "Er habe sich das Knie ___ . (sich aufschürfen)", a: "aufgeschürft|aufgeschuerft", e: "aufgeschürft" },
      { q: "Er sei mit dem rechten Fuß ___ . (umknicken)", a: "umgeknickt", e: "umgeknickt" },
    ],
  },
];

function buildRows(ex, exId) {
  return ex.questions.map((q, i) => {
    if (ex.exercise_type === "quiz")
      return { exercise_id: exId, question: q.q, options: { type: "quiz", items: q.opts }, correct_answer: String(q.c), explanation: q.e, order_index: i };
    if (ex.exercise_type === "true_false")
      return { exercise_id: exId, question: q.q, options: null, correct_answer: q.a, explanation: q.e, order_index: i };
    return { exercise_id: exId, question: q.q, options: { type: "typing" }, correct_answer: q.a, explanation: q.e, order_index: i };
  });
}

async function main() {
  const { data: lesson, error: le } = await sb.from("lessons").select("id,title,sections").eq("id", LESSON_ID).single();
  if (le || !lesson) throw new Error("Lekcija nije nađena: " + (le?.message || ""));
  console.log(`\nLekcija: ${lesson.title} (${LESSON_ID})`);
  console.log(`Sekcija: ${(lesson.sections || []).length} -> ${sections.length}`);
  console.log(`Galerija: ${dict.length} | Wordset: ${dict.length}`);
  console.log(`Vežbe: ${exercises.map((e) => `${e.title.split(" - ")[0]}=${e.exercise_type}/${e.questions.length}`).join(", ")} + spoiler`);

  if (!APPLY) { console.log("\n[DRY-RUN] Nije upisano. --apply za primenu.\n"); return; }

  const { error: ue } = await sb.from("lessons").update({ sections, lesson_type: "text" }).eq("id", LESSON_ID);
  if (ue) throw new Error("Update sekcija: " + ue.message);
  console.log("✓ Sekcije ažurirane");

  const { data: oldEx } = await sb.from("exercises").select("id").eq("lesson_id", LESSON_ID);
  if (oldEx?.length) {
    const ids = oldEx.map((e) => e.id);
    await sb.from("exercise_questions").delete().in("exercise_id", ids);
    await sb.from("exercises").delete().in("id", ids);
    console.log(`✓ Obrisano starih vežbi: ${ids.length}`);
  }
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const { data: row, error: ee } = await sb.from("exercises").insert({ lesson_id: LESSON_ID, title: ex.title, exercise_type: ex.exercise_type, order_index: i }).select("id").single();
    if (ee) throw new Error("Insert vežbe: " + ee.message);
    const { error: qe } = await sb.from("exercise_questions").insert(buildRows(ex, row.id));
    if (qe) throw new Error("Insert pitanja: " + qe.message);
    console.log(`✓ ${ex.title} (${ex.exercise_type}, ${ex.questions.length})`);
  }
  console.log("\nGotovo. Pregled: /lekcija/" + LESSON_ID + "\n");
}
main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
