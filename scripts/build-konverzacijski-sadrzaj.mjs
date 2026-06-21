// Build sadržajnog kursa "Konverzacijski (B1+)": 7 lekcija sa wordset karticama
// iz scripts/konverzacijski-wordsets/*.tsv. + course_unlocks + groups.content_course_id.
// Dry-run podrazumevano; --apply za upis.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const CONTENT_SLUG = "konverzacijski-b1-sadrzaj";
const PURCHASABLE_ID = "ec98eaf9-3297-40c8-8233-ea4855162f27"; // grupni-konverzacijski-kurs-nemackog-b1
const GROUP_ID = "b443d05f-7e87-4935-943c-634c4912c504";       // Konverzacija B1+

const DIR = "scripts/konverzacijski-wordsets";
const TOPICS = [
  { file: "set-hobby-beruf-alltag.tsv",        title: "Hobby, Beruf & Alltag",        key: "konv-b1-hobby-beruf-alltag" },
  { file: "set-familie-feste-erziehung.tsv",   title: "Familie, Feste & Erziehung",   key: "konv-b1-familie-feste-erziehung" },
  { file: "set-stadt-und-landleben.tsv",       title: "Stadt- und Landleben",         key: "konv-b1-stadt-und-landleben" },
  { file: "set-arbeit-karriere.tsv",           title: "Arbeit & Karriere",            key: "konv-b1-arbeit-karriere" },
  { file: "set-reisen-urlaub.tsv",             title: "Reisen & Urlaub",              key: "konv-b1-reisen-urlaub" },
  { file: "set-umwelt-umweltschutz.tsv",       title: "Umwelt & Umweltschutz",        key: "konv-b1-umwelt-umweltschutz" },
  { file: "set-internet-digitalisierung.tsv",  title: "Internet & Digitalisierung",   key: "konv-b1-internet-digitalisierung" },
];

function parseTsv(path) {
  return readFileSync(path, "utf8").split("\n")
    .map((l) => l.replace(/\r$/, ""))
    .filter((l) => l.trim() && l.includes("\t"))
    .map((l) => { const [front, back] = l.split("\t"); return { front: front.trim(), back: back.trim() }; });
}

const lessons = TOPICS.map((t, i) => {
  const items = parseTsv(`${DIR}/${t.file}`);
  return {
    order_index: i + 1,
    title: t.title,
    section: { type: "wordset", title: `${t.title} - Reči`, setKey: t.key, frontLabel: "DE", backLabel: "SR", items },
    count: items.length,
  };
});

console.log("Sadržajni kurs:", CONTENT_SLUG);
lessons.forEach((l) => console.log(`  #${l.order_index} ${l.title} — ${l.count} reči (setKey ${l.section.setKey})`));
console.log("Ukupno reči:", lessons.reduce((s, l) => s + l.count, 0));
console.log("Primer kartice:", JSON.stringify(lessons[0].section.items[0]));

if (!APPLY) { console.log("\nDry-run — pokreni sa --apply za upis."); process.exit(0); }

// 1) Sadržajni kurs (upsert po slug-u)
let { data: course } = await sb.from("courses").select("id").eq("slug", CONTENT_SLUG).maybeSingle();
let contentId = course?.id;
if (!contentId) {
  const { data, error } = await sb.from("courses").insert({
    title: "Konverzacijski kurs nemačkog (B1+)",
    slug: CONTENT_SLUG,
    description: "Setovi reči po temama za konverzacijski kurs B1+.",
    course_type: "video",
    is_published: true,
    is_purchasable: false,
  }).select("id").single();
  if (error) { console.error("course insert:", error.message); process.exit(1); }
  contentId = data.id;
  console.log("✓ sadržajni kurs kreiran:", contentId);
} else {
  console.log("sadržajni kurs već postoji:", contentId);
}

// 2) Lekcije: obriši postojeće pa upiši sveže (idempotentno)
await sb.from("lessons").delete().eq("course_id", contentId);
for (const l of lessons) {
  const { error } = await sb.from("lessons").insert({
    course_id: contentId,
    title: l.title,
    lesson_type: "text",
    order_index: l.order_index,
    sections: [l.section],
  });
  if (error) { console.error(`lesson ${l.title}:`, error.message); process.exit(1); }
  console.log(`✓ lekcija #${l.order_index} ${l.title} (${l.count} reči)`);
}

// 3) course_unlocks: grupni → sadržajni
{
  const { error } = await sb.from("course_unlocks").upsert(
    { purchasable_course_id: PURCHASABLE_ID, content_course_id: contentId },
    { onConflict: "purchasable_course_id,content_course_id" },
  );
  if (error) console.error("course_unlocks:", error.message); else console.log("✓ course_unlocks vezan");
}

// 4) groups.content_course_id
{
  const { error } = await sb.from("groups").update({ content_course_id: contentId }).eq("id", GROUP_ID);
  if (error) console.error("groups update:", error.message); else console.log("✓ groups.content_course_id postavljen");
}

console.log("Gotovo. contentId =", contentId);
