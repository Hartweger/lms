/** B1.2 Modul 6 — dodaje Hören (5 Meinungen, R/F, trake 42-46 L13) u Lesen Prüfung lekciju; preimenuje u Lesen+Hören.
 *  Svaki audio + tvrdnja + R/F. Rešenja sa slike. Dry-run; --apply za upload+upis. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const APPLY = process.argv.includes("--apply");
const env = {};
for (const r of readFileSync(".env.local", "utf8").split("\n")) {
  const m = r.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const OLD_TITLE = "Prüfung - Leseverstehen: Amir Roughani";
const NEW_TITLE = "Prüfung - Lesen und Hören (Modul 6)";
const AUDIO_DIR = "/Users/natasahartweger/Downloads/Schritte_int_Neu_6_AB_Audio";
const BUCKET = "blog-media";

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: lesson } = await sb.from("lessons").select("id, sections").eq("course_id", course.id).eq("title", OLD_TITLE).maybeSingle();
if (!lesson) { console.log("⚠️ Lesen lekcija nije nađena"); process.exit(1); }
const LID = lesson.id;

const audioFiles = [
  "Schritte_int_Neu_6_AB_CD_2_Track_42_L13_Schritt_C_16_a.mp3",
  "Schritte_int_Neu_6_AB_CD_2_Track_43_L13_Schritt_C_16_b.mp3",
  "Schritte_int_Neu_6_AB_CD_2_Track_44_L13_Schritt_C_16_c.mp3",
  "Schritte_int_Neu_6_AB_CD_2_Track_45_L13_Schritt_C_16_d.mp3",
  "Schritte_int_Neu_6_AB_CD_2_Track_46_L13_Schritt_C_16_e.mp3",
];
// a-e: tvrdnja + R/F (true=richtig)
const AUSS = [
  ["a", "Die Frau würde es gut finden, wenn es einmal pro Jahr einen Tag geben würde, an dem Autos nicht fahren dürfen.", "false"],
  ["b", "Die Person sagt, man soll mehr Fahrrad fahren.", "false"],
  ["c", "Der Mann hat sich schon zum zweiten Mal ein Elektroauto gekauft.", "false"],
  ["d", "Der Mann findet, Fliegen sollte viel teurer werden als es zurzeit ist.", "true"],
  ["e", "Die Person sagt, dass die Regierung alle unterstützen sollte, die alternative Energien wie Sonnenenergie oder Windenergie einsetzen möchten.", "true"],
];

console.log("Hören (5 Meinungen):", AUSS.map((x) => `${x[0]}-${x[2] === "true" ? "R" : "F"}`).join(" "));

if (!APPLY) { console.log("\n(dry-run — dodaj --apply)"); process.exit(0); }

// upload
const urls = [];
for (let i = 0; i < audioFiles.length; i++) {
  const buf = readFileSync(`${AUDIO_DIR}/${audioFiles[i]}`);
  const path = `kursevi/b1-2/hoeren-fuenf-meinungen-l13/meinung${AUSS[i][0]}.mp3`;
  const { error } = await sb.storage.from(BUCKET).upload(path, buf, { contentType: "audio/mpeg", upsert: true });
  if (error) { console.error("upload", i, error.message); process.exit(1); }
  urls.push(sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
}

// dodaj Hören sekcije posle postojećeg sadržaja
let s = [...lesson.sections];
s.push({ type: "text", style: "uebung", content: "## Hören\n\nSie hören die Meinungen von fünf Personen. Sie hören jede Meinung nur einmal. Markieren Sie, ob die Aussagen a-e richtig oder falsch sind." });
AUSS.forEach((a, i) => {
  s.push({ type: "audio", url: urls[i], label: `Meinung ${a[0]}` });
  s.push({ type: "exercise", title: `Aussage ${a[0]} - richtig oder falsch?` });
});
await sb.from("lessons").update({ sections: s, title: NEW_TITLE }).eq("id", LID);

// true_false vežbe
let oi = 10;
for (const [letter, q, ans] of AUSS) {
  const { data: ex } = await sb.from("exercises").insert({ lesson_id: LID, title: `Aussage ${letter} - richtig oder falsch?`, exercise_type: "true_false", order_index: oi++ }).select("id").single();
  await sb.from("exercise_questions").insert({ exercise_id: ex.id, question: q, question_type: "true_false", correct_answer: ans, explanation: null, order_index: 1 });
}
console.log(`\nGOTOVO ✓  Hören dodat (5 audija + R/F), lekcija preimenovana u "${NEW_TITLE}".`);
