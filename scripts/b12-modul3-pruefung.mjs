/** B1.2 Modul 3 — nova Prüfung lekcija: Lesen (Manchmal geht etwas schief, 6 R/F) + Hören (5 Texte, 5 R/F).
 *  Audio trake 16-20 (L10) → Supabase Storage. Sve transkribovano tačno. Dry-run; --apply za upload+upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const LESSON_TITLE = "Prüfung - Lesen und Hören (Modul 3)";
const LESEN_EX = "Manchmal geht etwas schief - richtig oder falsch?";
const HOEREN_EX = "Fünf Texte - richtig oder falsch?";
const AUDIO_DIR = "/Users/natasahartweger/Downloads/Schritte_int_Neu_6_AB_Audio";
const BUCKET = "blog-media";

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: existing } = await sb.from("lessons").select("id").eq("course_id", course.id).eq("title", LESSON_TITLE).maybeSingle();
if (existing) { console.log("⚠️ Lekcija već postoji:", existing.id); process.exit(1); }

const lesenText = "**Manchmal geht halt etwas schief!**\n*Von Vera Hansen*\n\n" +
  "Vorigen Sonntag fuhren mein Mann Max und ich zu Freunden, die 20 Kilometer von uns entfernt wohnen. Ich fuhr mit dem Auto, Max nahm sein Fahrrad. Als er aus der Tür ging, zeigte er auf eine Tüte und sagte: „Hier ist Kleidung drin. Vergiss nicht, sie mitzunehmen.“\n\n" +
  "Nachdem ich in dem Ort, wo unsere Freunde wohnen, angekommen war, parkte ich das Auto. In der Nähe standen Tonnen, in die man Altglas, Altpapier und Altkleider werfen konnte. „Praktisch“, dachte ich, und warf die Tüte in die Kleider-Tonne. Gut gelaunt, weil ich etwas erledigt hatte, kam ich bei unseren Freunden an. Die begrüßten mich herzlich.\n\n" +
  "Bald darauf kam mein Mann. Sofort wollte er wissen, ob ich an die Tüte gedacht hatte. Ich antwortete ihm, dass ich die Tüte gerade in die Altkleider-Tonne geworfen hatte. Max’ Gesicht wurde ernst. Etwas überrascht fragte er: „Du hast die Tüte weggeworfen? Aber warum denn?“\n\n" +
  "Es dauerte einen Moment, bis ich verstand, dass mein Mann keine alten, sondern saubere Kleider in die Tüte getan hatte. Die hatte er mir mitgegeben, weil er sich nach seiner Radtour bei unseren Freunden umziehen wollte. Auch sein Geld und seine Bankkarte waren in der Tüte. Was jetzt?\n\n" +
  "Wir versuchten, die Tüte aus der Tonne zu „fischen“. Als das nicht klappte, rief ich die Polizei. Die lachte über mein Missgeschick, konnte aber auch nicht helfen. Schließlich kam die Feuerwehr. Mit dem passenden Werkzeug schaffte sie es, das Schloss an der Tonne zu öffnen. Da war die Tüte: mit allem, was mein Mann vor seiner Abfahrt eingepackt hatte.";

const lesenAussagen = [
  "Vera und ihr Mann sind getrennt zu ihren Freunden gefahren.",
  "Kurz nach ihrer Ankunft hat Vera die Tüte weggeworfen.",
  "Als Vera von der Tüte in der Tonne erzählte, wurde Max wütend.",
  "In der Tüte waren sowohl Kleidung als auch Max’ Schlüssel.",
  "Die Polizei fand es lustig, was Vera und Max passiert ist.",
  "Max stellte fest, dass in der Tüte ein paar Dinge fehlten.",
];
const lesenSp = [0, 0, 1, 1, 0, 1]; // 0=richtig, 1=falsch

const hoerenAussagen = [
  "Der Sieger des Kochwettbewerbs bekommt auch Geschirr.",
  "Den Autofahrern kommt auf der A43 ein Fahrzeug entgegen.",
  "Für den Alpenrand werden Regen oder Schnee vorhergesagt.",
  "Es wurde abgestimmt, welche Firma den besten Kaffee herstellt.",
  "Auf snackbox.de kann man sich eigene Snacks zusammenstellen.",
];
const hoerenSp = [0, 1, 0, 0, 0];
const CATS = ["richtig", "falsch"];

const audioFiles = [
  "Schritte_int_Neu_6_AB_CD_2_Track_16_L10_Schritt_D_18_1.mp3",
  "Schritte_int_Neu_6_AB_CD_2_Track_17_L10_Schritt_D_18_2.mp3",
  "Schritte_int_Neu_6_AB_CD_2_Track_18_L10_Schritt_D_18_3.mp3",
  "Schritte_int_Neu_6_AB_CD_2_Track_19_L10_Schritt_D_18_4.mp3",
  "Schritte_int_Neu_6_AB_CD_2_Track_20_L10_Schritt_D_18_5.mp3",
];

const listText = (titel, arr) => `**${titel}**\n\n` + arr.map((a, i) => `**${i + 1}.** ${a}`).join("\n");

console.log("=== NOVA LEKCIJA ===", LESSON_TITLE);
console.log("Lesen:", lesenAussagen.length, "R/F →", lesenSp.map((x, i) => `${i + 1}${CATS[x][0].toUpperCase()}`).join(" "));
console.log("Hören:", hoerenAussagen.length, "R/F →", hoerenSp.map((x, i) => `${i + 1}${CATS[x][0].toUpperCase()}`).join(" "), "+ 5 audija");

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

// 1) upload 5 audija
const audioUrls = [];
for (let i = 0; i < audioFiles.length; i++) {
  const buf = readFileSync(`${AUDIO_DIR}/${audioFiles[i]}`);
  const path = `kursevi/b1-2/hoeren-fuenf-texte-l10/text${i + 1}.mp3`;
  const { error } = await sb.storage.from(BUCKET).upload(path, buf, { contentType: "audio/mpeg", upsert: true });
  if (error) { console.error("upload", i + 1, error.message); process.exit(1); }
  audioUrls.push(sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
}
console.log("Audio okačen:", audioUrls.length);

// 2) sekcije
const sections = [
  { type: "badge", module: "Modul 3 · Werbung und Konsum", pruefung: true },
  { type: "text", style: "uebung", content: "## Lesen\n\nLesen Sie den Text und die Aufgaben 1 bis 6. Wählen Sie: Sind die Aussagen richtig oder falsch?" },
  { type: "text", style: "default", content: lesenText },
  { type: "text", style: "default", content: listText("Aussagen 1-6", lesenAussagen) },
  { type: "exercise", title: LESEN_EX },
  { type: "text", style: "uebung", content: "## Hören\n\nSie hören fünf Texte. Zu jedem Text gibt es eine Aussage. Sie hören die Texte zweimal. Markieren Sie: Ist die Aussage richtig oder falsch?" },
  ...audioUrls.map((url, i) => ({ type: "audio", url, label: `Text ${i + 1}` })),
  { type: "text", style: "default", content: listText("Aussagen 1-5", hoerenAussagen) },
  { type: "exercise", title: HOEREN_EX },
];

// 3) lekcija (privremeni order, pa smesti pre "Modul 3 - Reči")
const { data: ins, error: e1 } = await sb.from("lessons").insert({
  course_id: course.id, title: LESSON_TITLE, lesson_type: "text", order_index: 9999, content: "", sections,
}).select("id").single();
if (e1) { console.error("insert lesson:", e1.message); process.exit(1); }
const newId = ins.id;

const { data: all } = await sb.from("lessons").select("id, title, order_index").eq("course_id", course.id).order("order_index");
const rest = all.filter((l) => l.id !== newId);
const ri = rest.findIndex((l) => l.title === "Modul 3 - Reči");
const seq = [];
for (let i = 0; i < rest.length; i++) { if (i === ri) seq.push(newId); seq.push(rest[i].id); } // PRE Reči
for (let i = 0; i < seq.length; i++) await sb.from("lessons").update({ order_index: i }).eq("id", seq[i]);

// 4) vežbe (categorize R/F)
async function mkCat(title, aussagen, sp, oi) {
  const { data: ex, error } = await sb.from("exercises").insert({ lesson_id: newId, title, exercise_type: "categorize", order_index: oi }).select("id").single();
  if (error) { console.error("ex", title, error.message); process.exit(1); }
  const items = aussagen.map((_, i) => ({ text: String(i + 1), category: sp[i] }));
  const { error: e } = await sb.from("exercise_questions").insert({
    exercise_id: ex.id, question: "Ordne jede Nummer zu: richtig oder falsch?", question_type: "categorize",
    correct_answer: "", explanation: null, order_index: 1, options: { type: "categorize", items: { items, categories: CATS } },
  });
  if (e) { console.error("q", title, e.message); process.exit(1); }
}
await mkCat(LESEN_EX, lesenAussagen, lesenSp, 1);
await mkCat(HOEREN_EX, hoerenAussagen, hoerenSp, 2);

console.log(`\nGOTOVO ✓  Lekcija (id=${newId}) u Modulu 3 pre 'Modul 3 - Reči'. Lesen+Hören grid + 5 audija.`);
