// FSP "Brojevi": magazin link + slušna vežba "Zahlen und Daten hören"
// (audio iz ElevenLabs MP3-a + 12 popuni-prazninu pitanja iz _fsp-brojevi-questions.json).
// Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const LESSON_ID = "b33ca9e8-530d-4cb8-a0e3-8fa22d4edcc2"; // FSP > Brojevi
const AUDIO_URL = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/blog-media/fsp/audio/zahlen-daten.mp3`;
const MAGAZIN = "https://www.hartweger.rs/magazin/kako-govori-lekar-u-nemackoj-jednostavni-trikovi-za-tacne-brojeve-i-mere";

const Q = JSON.parse(readFileSync("scripts/_fsp-brojevi-questions.json", "utf8"));

// varijante odgovora: dd.mm.yyyy -> i d.m.yyyy (bez vodecih nula)
function variants(a) {
  const set = new Set([a]);
  const d = a.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (d) set.add(`${+d[1]}.${+d[2]}.${d[3]}`);
  return [...set].join("|");
}

const sections = [
  { type: "badge", module: "Rečnik", category: "wortschatz" },
  { type: "text", style: "default", content:
`## Zahlen und Daten - brojevi i datumi

Na ispitu moraš tačno da razumeš i zabeležiš brojeve: datum rođenja, težinu, visinu, vrednosti, doze. Nemački ima svoj način čitanja brojeva (decimalni zarez, datumi), pa vežbaj baš slušanje.

Detaljno objašnjenje sa trikovima pročitaj u članku ispod, pa odradi slušnu vežbu.` },
  { type: "link", linkType: "external", href: MAGAZIN, label: "Članak: Kako lekar govori brojeve i mere u Nemačkoj" },
  { type: "text", style: "uebung", content:
`## Vežba: Zahlen und Daten hören

Pusti audio i upiši brojeve/datume koje čuješ. Pazi na nemački format (zarez kod decimala, datum dd.mm.gggg).` },
  { type: "audio", url: AUDIO_URL, label: "Audio - Zahlen und Daten" },
  { type: "exercise", title: "Zahlen und Daten hören" },
];

async function main() {
  const { data: lesson, error: le } = await sb.from("lessons").select("title,sections").eq("id", LESSON_ID).single();
  if (le || !lesson) throw new Error("Lekcija nije nađena: " + (le?.message || ""));
  console.log(`Lekcija: ${lesson.title} | sekcija ${(lesson.sections || []).length} -> ${sections.length} | pitanja: ${Q.length}`);
  console.log("Audio:", AUDIO_URL);
  Q.slice(0, 3).forEach((q) => console.log(`  ${q.pre}[${q.a}]${q.post}`));

  if (!APPLY) { console.log("\n[DRY-RUN] --apply za primenu.\n"); return; }

  const { error: ue } = await sb.from("lessons").update({ sections, lesson_type: "text" }).eq("id", LESSON_ID);
  if (ue) throw new Error("Update: " + ue.message);
  console.log("✓ Sekcije ažurirane");

  const { data: oldEx } = await sb.from("exercises").select("id").eq("lesson_id", LESSON_ID);
  if (oldEx?.length) {
    const ids = oldEx.map((e) => e.id);
    await sb.from("exercise_questions").delete().in("exercise_id", ids);
    await sb.from("exercises").delete().in("id", ids);
    console.log(`✓ Obrisano starih vežbi: ${ids.length}`);
  }
  const { data: ex } = await sb.from("exercises").insert({ lesson_id: LESSON_ID, title: "Zahlen und Daten hören", exercise_type: "typing", order_index: 0 }).select("id").single();
  const rows = Q.map((q, i) => ({
    exercise_id: ex.id,
    question: `${q.pre}______${q.post}`,
    options: { type: "typing" },
    correct_answer: variants(q.a),
    explanation: `Lösung: ${q.a}`,
    order_index: i,
  }));
  const { error: qe } = await sb.from("exercise_questions").insert(rows);
  if (qe) throw new Error("Insert pitanja: " + qe.message);
  console.log(`✓ Vežba "Zahlen und Daten hören" (typing, ${rows.length} pitanja)`);
  console.log("\nGotovo. Pregled: /lekcija/" + LESSON_ID + "\n");
}
main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
