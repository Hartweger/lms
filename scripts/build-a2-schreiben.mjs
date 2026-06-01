// Build A2 Schreiben content (Redemittel + mini-vežbe + 3 Schreiben zadatka) na
// lekciji L6 "Priprema za ispit A2" (A2.2), izvor: Cornelsen Prüfungstraining
// Goethe-Zertifikat A2 (Schreiben Teil 1/2 + Übungen).
// Dry-run default; --apply za upis. Idempotentno.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const L6 = "161e0870-c0ec-444e-b553-14cf04ead2e9"; // Priprema za ispit A2 (A2.2)
const MARKER = "Redemittel — pisanje pisama i mejlova";

const NEW_SECTIONS = [
  { type: "text", style: "default", content: `## ${MARKER}\n\nNa ispitu pišeš **dva teksta**: **Teil 1 — SMS** prijatelju (oslovljavaš sa *du*, 20–30 reči) i **Teil 2 — E-Mail** osobi koju ne poznaješ dobro (oslovljavaš sa *Sie*, 30–40 reči). U svakom zadatku obradi **sve tri tačke**.` },
  { type: "text", style: "default", content: "## Anrede — pozdrav na početku" },
  { type: "table", headers: ["Kada / kome", "formell — „Sie“", "informell — „du“"], rows: [
    ["Ne znaš ime", "<mark>Sehr geehrte Damen und Herren,</mark>", "—"],
    ["Znaš ime (zvanično)", "<mark>Sehr geehrter Herr Franke,</mark> / <mark>Sehr geehrte Frau Maier,</mark>", "<mark>Lieber Max,</mark> / <mark>Liebe Julia,</mark>"],
    ["Poznatija osoba", "<mark>Lieber Herr Franke,</mark> / <mark>Liebe Frau Maier,</mark>", "<mark>Hallo Max,</mark> / <mark>Hallo Julia,</mark>"],
  ] },
  { type: "text", style: "default", content: "## Gruß — pozdrav na kraju" },
  { type: "table", headers: ["", "formell — „Sie“", "informell — „du“"], rows: [
    ["Završetak", "<mark>Mit freundlichen Grüßen</mark>", "<mark>Liebe Grüße</mark> / <mark>Viele Grüße</mark>"],
    ["(druga opcija)", "<mark>Herzliche Grüße</mark>", "<mark>Bis bald!</mark> / <mark>Tschüss!</mark>"],
  ] },
  { type: "text", style: "default", content: "## Korisne rečenice po funkciji" },
  { type: "table", headers: ["Funkcija", "Nemački", "Prevod"], rows: [
    ["Zahvaliti", "Vielen Dank für Ihre E-Mail / die Einladung.", "Hvala na mejlu / na pozivu."],
    ["Izviniti se", "Es tut mir leid, aber ich kann leider nicht kommen.", "Žao mi je, ali nažalost ne mogu da dođem."],
    ["Predložiti", "Können wir vielleicht am Samstag …? / Wie wäre es mit …?", "Možemo li možda u subotu…? / Šta kažeš na…?"],
    ["Pitati", "Könnten Sie mir bitte … schicken? / Um wie viel Uhr …?", "Možete li mi poslati…? / U koliko sati…?"],
    ["Želeti / moliti", "Ich möchte gern … / Ich interessiere mich für …", "Želela bih… / Zanima me…"],
    ["Nadati se", "Ich hoffe, dass Sie mir helfen können.", "Nadam se da možete da mi pomognete."],
  ] },
  { type: "text", style: "uebung", content: "## Kako napisati pismo (3 koraka)\n\n1. **Anrede** — pozdrav na početku\n2. **Tri tačke** — napiši 1–2 rečenice za SVAKU od tri tačke iz zadatka\n3. **Gruß + ime** — pozdrav na kraju i potpis\n\n**Pre nego što predaš, proveri:**\n- veliko slovo kod imenica i kod **Sie / Ihnen / Ihr**\n- **der / die / das** (rod)\n- glagol na 2. mestu (a posle **weil** na kraju)" },
  { type: "spoiler", title: "Mini-vežba: prebaci u „Sie“-formu", items: [
    { question: "Wie geht es dir?", answer: "Wie geht es Ihnen?" },
    { question: "Bitte antworte mir schnell.", answer: "Bitte antworten Sie mir schnell." },
    { question: "Bitte sag mir Bescheid.", answer: "Bitte sagen Sie mir Bescheid." },
    { question: "Danke, dass du so schnell geantwortet hast.", answer: "Danke, dass Sie so schnell geantwortet haben." },
    { question: "Ich freue mich auf deinen Besuch.", answer: "Ich freue mich auf Ihren Besuch." },
    { question: "Kannst du mir bitte Informationen schicken?", answer: "Können Sie mir bitte Informationen schicken?" },
  ] },
  { type: "spoiler", title: "Mini-vežba: spoji rečenice sa „weil“", items: [
    { question: "Leider habe ich keine Zeit. Ich habe einen Termin.", answer: "Leider habe ich keine Zeit, weil ich einen Termin habe." },
    { question: "Ich konnte letzte Woche nicht zum Unterricht kommen. Ich war krank.", answer: "Ich konnte letzte Woche nicht zum Unterricht kommen, weil ich krank war." },
    { question: "Ich möchte gern mit euch feiern. Ich habe die Prüfung bestanden.", answer: "Ich möchte gern mit euch feiern, weil ich die Prüfung bestanden habe." },
    { question: "Ich kann nicht einkaufen gehen. Ich muss heute sehr lange arbeiten.", answer: "Ich kann nicht einkaufen gehen, weil ich heute sehr lange arbeiten muss." },
  ] },
  { type: "spoiler", title: "Mini-vežba: spoji rečenice sa „dass“", items: [
    { question: "Ich hoffe … Sie können mir helfen.", answer: "Ich hoffe, dass Sie mir helfen können." },
    { question: "Ich glaube nicht … Ich habe Zeit.", answer: "Ich glaube nicht, dass ich Zeit habe." },
    { question: "Ich habe gelesen … Sie vermieten eine Wohnung.", answer: "Ich habe gelesen, dass Sie eine Wohnung vermieten." },
    { question: "Es tut mir leid … Ich konnte nicht zum Termin kommen.", answer: "Es tut mir leid, dass ich nicht zum Termin kommen konnte." },
  ] },
  { type: "text", style: "default", content: "## Vežbe pisanja (Schreiben)\n\nReši tri zadatka za pisanje u ovoj lekciji — napiši svoj tekst, pa otvori **Musterlösung** ispod da uporediš." },
  { type: "spoiler", title: "Musterlösungen — primeri rešenja (otvori posle pisanja)", items: [
    { question: "Teil 1 — SMS (Julia, Kino)", answer: "Liebe Julia, leider kann ich heute nicht ins Kino kommen, weil ich arbeiten muss. Das tut mir wirklich leid! Können wir vielleicht am Samstag zusammen gehen? Liebe Grüße, Ana" },
    { question: "Teil 2 — E-Mail (Herr Franke)", answer: "Sehr geehrter Herr Franke, vielen Dank für Ihre Einladung! Ich komme sehr gern zu Ihrer Party. Soll ich etwas zu trinken mitbringen? Und um wie viel Uhr beginnt die Party? Mit freundlichen Grüßen, Ana" },
    { question: "Teil 2 — E-Mail (Touristeninformation München)", answer: "Sehr geehrte Damen und Herren, ich möchte im Sommer Urlaub in München machen. Könnten Sie mir bitte Adressen von günstigen Hotels schicken? Außerdem interessiere ich mich für die Sehenswürdigkeiten. Vielen Dank im Voraus! Mit freundlichen Grüßen, Ana" },
  ] },
];

const NEW_EXERCISES = [
  { title: "Schreiben Teil 1 — SMS (Kino)", order_index: 1, question:
`Schreiben — Teil 1 (SMS)

Du wolltest mit deiner Freundin Julia ins Kino gehen, aber du hast keine Zeit. Schreibe eine SMS an Julia.

– Entschuldige dich, dass du nicht kommen kannst.
– Schreib, warum.
– Mach einen Vorschlag, wann ihr ins Kino gehen könnt.

Schreib 20 bis 30 Wörter. Schreib zu allen drei Punkten.` },
  { title: "Schreiben Teil 2 — E-Mail (Einladung)", order_index: 2, question:
`Schreiben — Teil 2 (E-Mail)

In Ihrem Haus gibt es einen neuen Mieter, Herrn Franke. Er macht am Samstag eine Party und hat Sie eingeladen. Schreiben Sie eine E-Mail an Herrn Franke.

– Bedanken Sie sich und sagen Sie, dass Sie gern kommen.
– Sagen Sie, dass Sie etwas zur Party mitbringen wollen.
– Fragen Sie nach der Uhrzeit.

Schreiben Sie 30 bis 40 Wörter. Schreiben Sie zu allen drei Punkten.` },
  { title: "Schreiben Teil 2 — E-Mail (Touristeninformation)", order_index: 3, question:
`Schreiben — Teil 2 (E-Mail)

Sie möchten im Sommer Urlaub in München machen. Schreiben Sie eine E-Mail an die Touristeninformation München.

– Schreiben Sie, warum Sie schreiben.
– Bitten Sie um Adressen von günstigen Hotels.
– Fragen Sie nach den Sehenswürdigkeiten.

Schreiben Sie 30 bis 40 Wörter. Schreiben Sie zu allen drei Punkten.` },
];

// ── PART A: sekcije ──
const { data: l6 } = await sb.from("lessons").select("sections").eq("id", L6).single();
const existing = l6.sections || [];
const alreadyHas = JSON.stringify(existing).includes(MARKER);
console.log(`L6 ima ${existing.length} sekcija; Redemittel već prisutan: ${alreadyHas}`);
if (!alreadyHas) {
  console.log(`  → dodajem ${NEW_SECTIONS.length} novih sekcija (Redemittel + 3 mini-vežbe + Musterlösungen)`);
  if (APPLY) {
    const merged = [...existing, ...NEW_SECTIONS];
    const { error } = await sb.from("lessons").update({ sections: merged }).eq("id", L6);
    console.log(error ? `  ERROR: ${error.message}` : `  ✓ sekcije upisane (${merged.length} ukupno)`);
  }
} else console.log("  → preskačem sekcije (već dodato)");

// ── PART B: Schreiben vežbe ──
const { data: exExisting } = await sb.from("exercises").select("title").eq("lesson_id", L6);
const have = new Set((exExisting || []).map(e => e.title));
for (const ex of NEW_EXERCISES) {
  if (have.has(ex.title)) { console.log(`  vežba "${ex.title}" već postoji — preskačem`); continue; }
  console.log(`  → vežba "${ex.title}" (listen_write)`);
  if (APPLY) {
    const { data: created, error } = await sb.from("exercises").insert({ lesson_id: L6, title: ex.title, exercise_type: "listen_write", order_index: ex.order_index }).select("id").single();
    if (error || !created) { console.log(`    ERROR exercise: ${error?.message}`); continue; }
    const { error: qErr } = await sb.from("exercise_questions").insert({ exercise_id: created.id, question: ex.question, options: null, correct_answer: "essay", explanation: null, order_index: 0 });
    console.log(qErr ? `    ERROR question: ${qErr.message}` : `    ✓ vežba + zadatak upisani`);
  }
}
if (!APPLY) console.log("\nDry-run — pokreni sa --apply za upis.");
