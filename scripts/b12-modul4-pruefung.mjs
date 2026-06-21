/** B1.2 Modul 4 — Prüfung: Hören (4 Gespräche: R/F + a/b/c, trake 21-24 L11) + Lesen (cloze 10 praznina a/b/c).
 *  Transkribovano tačno, rešenja sa slika. Dry-run; --apply za upload+upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const TITLE = "Prüfung - Lesen und Hören (Modul 4)";
const AUDIO_DIR = "/Users/natasahartweger/Downloads/Schritte_int_Neu_6_AB_Audio";
const BUCKET = "blog-media";

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: ex0 } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", TITLE).maybeSingle();
if (ex0) { console.log("⚠️ Lekcija već postoji:", ex0.id); process.exit(1); }

const audioFiles = [
  "Schritte_int_Neu_6_AB_CD_2_Track_21_L11_Schritt_B_9_1.mp3",
  "Schritte_int_Neu_6_AB_CD_2_Track_22_L11_Schritt_B_9_2.mp3",
  "Schritte_int_Neu_6_AB_CD_2_Track_23_L11_Schritt_B_9_3.mp3",
  "Schritte_int_Neu_6_AB_CD_2_Track_24_L11_Schritt_B_9_4.mp3",
];

// Hören: po Gesprächu — [R/F tvrdnja, R/F odgovor], [MC pitanje, opcije, tačan idx]
const GESPR = [
  { tf: ["Zwei Freundinnen gehen zusammen spazieren.", "false"],
    mc: ["Worum geht es?", ["Yue braucht ein Geschenk für ihre Vermieterin.", "Yue kauft ihrer Vermieterin Erdbeeren.", "Yue möchte ihrer Vermieterin rote Rosen schenken."], "0"] },
  { tf: ["Ein Hausbewohner und der Hausmeister unterhalten sich.", "false"],
    mc: ["Was soll der junge Mann tun?", ["Er soll Herrn Bloch helfen, den Kinderwagen in die Wohnung zu tragen.", "Er soll das Fahrrad vor dem Haus abstellen.", "Er soll das Fahrrad auf den Fahrradstellplatz im Hof stellen."], "2"] },
  { tf: ["Die Schulleiterin telefoniert mit Angelos Vater.", "false"],
    mc: ["Was ist das Problem?", ["Angelos Noten sind nicht in Ordnung.", "Angelo verspätet sich häufig.", "Angelo kann keine Ausbildung machen, weil er immer unpünktlich ist."], "1"] },
  { tf: ["Cara und Melek sind Nachbarinnen.", "true"],
    mc: ["Was möchte Melek?", ["Mit Cara nach Hamburg fahren.", "Den Wohnungs- und Briefkastenschlüssel finden.", "Dass Cara sich ein paar Tage um die Wohnung kümmert."], "2"] },
];

// Lesen cloze
const clozeText = "**Liebe Catarina, lieber Victor,**\n\n" +
  "vielen Dank für Eure E-Mail. Ich habe mich sehr **darüber** *(0)* gefreut. Ich bin jetzt schon **(1)** sechs Wochen in Lima in Peru. Der Aufenthalt hier ist sehr interessant, aber auch ganz schön **(2)**, weil ich ja die Sprache noch nicht so gut spreche. **(3)** ich mit dem Bus unterwegs bin, habe ich immer Angst, **(4)** ich an der falschen Haltestelle aussteige. Es gibt ja **(5)** ganz wenig richtige Haltestellen wie bei uns. Man muss dem Fahrer genau sagen, wohin man will, damit er hält. Deshalb muss ich mir immer etwas Besonderes in der Umgebung merken, wie z. B. ein besonderes Haus oder ein Plakat, **(6)** ich die richtige Straßenecke nicht verpasse. Die Menschen sind hier aber wahnsinnig hilfsbereit. Überall **(7)** ich oft einfach so angesprochen. Die Leute möchten dann alles über mich wissen, woher ich komme, wie lange ich in Peru bleibe und wie es mir **(8)**. Und das alles, **(9)** sie mich gar nicht kennen. Aber das ist hier ganz normal.\n\n" +
  "So, Ihr Lieben, ich muss weitermachen. Beim nächsten Mal erzähle ich **(10)** mehr!\n\nLiebe Grüße\nFrederick";

const CLOZE = [
  ["Ich bin jetzt schon ______ sechs Wochen in Lima in Peru.", ["seit", "für", "vor"], "0"],
  ["Der Aufenthalt ist interessant, aber auch ganz schön ______, weil ich die Sprache noch nicht so gut spreche.", ["angestrengt", "anstrengender", "anstrengend"], "2"],
  ["______ ich mit dem Bus unterwegs bin, habe ich immer Angst, ...", ["Wann", "Wenn", "Als"], "1"],
  ["..., habe ich immer Angst, ______ ich an der falschen Haltestelle aussteige.", ["dass", "ob", "damit"], "0"],
  ["Es gibt ja ______ ganz wenig richtige Haltestellen wie bei uns.", ["nur", "erst", "sogar"], "0"],
  ["..., wie z. B. ein besonderes Haus oder ein Plakat, ______ ich die richtige Straßenecke nicht verpasse.", ["darum", "damit", "um"], "1"],
  ["Überall ______ ich oft einfach so angesprochen.", ["werde", "bin", "habe"], "0"],
  ["... wie lange ich in Peru bleibe und wie es mir ______.", ["gefällt", "gefalle", "gefallt"], "0"],
  ["Und das alles, ______ sie mich gar nicht kennen.", ["da", "trotzdem", "obwohl"], "2"],
  ["Beim nächsten Mal erzähle ich ______ mehr!", ["Euch", "Ihnen", "Dir"], "0"],
];

console.log("=== NOVA LEKCIJA ===", TITLE);
console.log("Hören: 4 Gespräche (R/F + a/b/c), 4 audija");
GESPR.forEach((g, i) => console.log(`   G${i + 1}: ${g.tf[1] === "true" ? "richtig" : "falsch"} | ${g.mc[0]} → ${String.fromCharCode(97 + parseInt(g.mc[2]))}`));
console.log("Lesen: cloze 10 praznina →", CLOZE.map((c, i) => `${i + 1}${c[1][parseInt(c[2])]}`).join(" "));

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

// upload 4 audija
const urls = [];
for (let i = 0; i < audioFiles.length; i++) {
  const buf = readFileSync(`${AUDIO_DIR}/${audioFiles[i]}`);
  const path = `kursevi/b1-2/hoeren-vier-gespraeche-l11/gespraech${i + 1}.mp3`;
  const { error } = await sb.storage.from(BUCKET).upload(path, buf, { contentType: "audio/mpeg", upsert: true });
  if (error) { console.error("upload", i + 1, error.message); process.exit(1); }
  urls.push(sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
}

// sekcije
const sections = [{ type: "badge", module: "Modul 4", pruefung: true },
  { type: "text", style: "uebung", content: "## Hören\n\nSie hören vier Gespräche jeweils zweimal. Zu jedem Gespräch gibt es zwei Aufgaben. Entscheiden Sie bei jedem Gespräch, ob die Aussage dazu richtig oder falsch ist und welche Antwort (a, b oder c) am besten passt." }];
GESPR.forEach((_, i) => {
  sections.push({ type: "text", style: "default", content: `### Gespräch ${i + 1}` });
  sections.push({ type: "audio", url: urls[i], label: `Gespräch ${i + 1}` });
  sections.push({ type: "exercise", title: `Gespräch ${i + 1} - richtig oder falsch?` });
  sections.push({ type: "exercise", title: `Gespräch ${i + 1} - Was passt (a/b/c)?` });
});
sections.push({ type: "text", style: "uebung", content: "## Lesen\n\n**Erfahrungen im Ausland.** Welches Wort (a, b oder c) passt in die Lücken 1 bis 10? Lesen Sie den Text und wählen Sie." });
sections.push({ type: "text", style: "default", content: clozeText });
sections.push({ type: "exercise", title: "Lückentext - welches Wort passt?" });

// lekcija (privremeni order → pre "Modul 4 - Reči")
const { data: ins, error: e1 } = await sb.from("lessons").insert({ course_id: course.id, title: TITLE, lesson_type: "text", order_index: 9999, content: "", sections }).select("id").single();
if (e1) { console.error("insert lesson:", e1.message); process.exit(1); }
const LID = ins.id;
const { data: all } = await sb.from("lessons").select("id, title, order_index").eq("course_id", course.id).order("order_index");
const rest = all.filter((l) => l.id !== LID);
const ri = rest.findIndex((l) => l.title === "Modul 4 - Reči");
const seq = [];
for (let i = 0; i < rest.length; i++) { if (i === ri) seq.push(LID); seq.push(rest[i].id); }
for (let i = 0; i < seq.length; i++) await sb.from("lessons").update({ order_index: i }).eq("id", seq[i]);

// vežbe
let oi = 1;
async function tf(title, q, a) { const { data: e } = await sb.from("exercises").insert({ lesson_id: LID, title, exercise_type: "true_false", order_index: oi++ }).select("id").single(); await sb.from("exercise_questions").insert({ exercise_id: e.id, question: q, question_type: "true_false", correct_answer: a, explanation: null, order_index: 1 }); }
async function quiz(title, items, oneOrMany) { const { data: e } = await sb.from("exercises").insert({ lesson_id: LID, title, exercise_type: "quiz", order_index: oi++ }).select("id").single(); let k = 1; for (const [q, opts, a] of items) await sb.from("exercise_questions").insert({ exercise_id: e.id, question: q, question_type: "quiz", correct_answer: a, explanation: null, order_index: k++, options: { type: "quiz", items: opts } }); }

for (let i = 0; i < GESPR.length; i++) {
  await tf(`Gespräch ${i + 1} - richtig oder falsch?`, GESPR[i].tf[0], GESPR[i].tf[1]);
  await quiz(`Gespräch ${i + 1} - Was passt (a/b/c)?`, [[GESPR[i].mc[0], GESPR[i].mc[1], GESPR[i].mc[2]]]);
}
await quiz("Lückentext - welches Wort passt?", CLOZE.map(([q, o, a]) => [q, o, a]));

console.log(`\nGOTOVO ✓  Lekcija (id=${LID}) — 4 Gespräche (R/F+MC) + Lesen cloze (10). Badge 'Modul 4' (tema da se doda).`);
