// FSP "Terapija, dijagnostika i simptomi po organima" - 888 kartica iz Google Doc-a
// (scripts/_fsp-terapija-source.md). Po organu: naslov + wordset (Quizlet učenje).
// 15 organa = 15 setova ("svaki tab nov set"). Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const LESSON_ID = "30b4823e-5720-4fd6-afe0-987262292a29"; // FSP > Terapija po organima

// izvorni naziv -> {display (pravi srpski), slug}
const ORGANS = {
  "Jetra i zucna kesa": ["Jetra i žučna kesa", "jetra-zucna-kesa"],
  "koža": ["Koža", "koza"],
  "metabolizam": ["Metabolizam", "metabolizam"],
  "mozak": ["Mozak", "mozak"],
  "oko": ["Oko", "oko"],
  "creva": ["Creva", "creva"],
  "urinarni sistem i polni organi": ["Urinarni sistem i polni organi", "urinarni-polni"],
  "aparat za kretanje": ["Aparat za kretanje", "aparat-kretanje"],
  "pankreas i slezina": ["Pankreas i slezina", "pankreas-slezina"],
  "zeludac": ["Želudac", "zeludac"],
  "venski sistem": ["Venski sistem", "venski-sistem"],
  "uho-grlo-nos": ["Uho, grlo, nos", "uho-grlo-nos"],
  "stitna zlezda": ["Štitna žlezda", "stitna-zlezda"],
  "srce": ["Srce", "srce"],
  "pluca": ["Pluća", "pluca"],
};

const fixDash = (s) => s.replace(/[–—]/g, "-");

function parse() {
  const t = readFileSync("scripts/_fsp-terapija-source.md", "utf8");
  let cur = null;
  const data = {}, order = [];
  for (const raw of t.split("\n")) {
    const s = raw.trim();
    const h = s.match(/^#{1,6}\s+(.*)$/);
    if (h) { const n = h[1].trim(); if (ORGANS[n]) { cur = n; if (!data[cur]) { data[cur] = []; order.push(cur); } } continue; }
    const m = s.split(/\s[–-]\s/);
    if (cur && m.length >= 2 && m[0] && m.slice(1).join(" - ").trim()) {
      data[cur].push({ front: fixDash(m[0].trim()), back: fixDash(m.slice(1).join(" - ").trim()) });
    }
  }
  return { data, order };
}

function buildSections() {
  const { data, order } = parse();
  const sections = [
    { type: "badge", module: "Rečnik", category: "wortschatz" },
    { type: "text", style: "default", content:
`## Terapija, dijagnostika i simptomi po organima

Najobimniji rečnik na kursu - po organu imaš set kartica sa simptomima, bolestima, laboratorijskim analizama, dijagnostikom i terapijom. Vežbaj svaki organ kao kartice (kviz, kucanje, igra memorije); ne moraš sve odjednom - biraj organ koji ti treba.` },
  ];
  let total = 0;
  for (const o of order) {
    const [display, slug] = ORGANS[o];
    sections.push({ type: "text", style: "default", content: `## ${display}` });
    sections.push({ type: "wordset", title: display, setKey: `fsp-terapija-${slug}`, frontLabel: "DE", backLabel: "SR", items: data[o] });
    total += data[o].length;
  }
  return { sections, order, data, total };
}

async function main() {
  const { sections, order, data, total } = buildSections();
  const { data: lesson, error: le } = await sb.from("lessons").select("title,sections").eq("id", LESSON_ID).single();
  if (le || !lesson) throw new Error("Lekcija nije nađena: " + (le?.message || ""));
  console.log(`\nLekcija: ${lesson.title}`);
  console.log(`Organa (wordset tabova): ${order.length} | ukupno kartica: ${total}`);
  order.forEach((o) => console.log(`  ${ORGANS[o][0].padEnd(32)} ${data[o].length}`));
  console.log(`Sekcija: ${(lesson.sections || []).length} -> ${sections.length}`);

  if (!APPLY) { console.log("\n[DRY-RUN] Nije upisano. --apply za primenu.\n"); return; }

  const { error: ue } = await sb.from("lessons").update({ sections, lesson_type: "text" }).eq("id", LESSON_ID);
  if (ue) throw new Error("Update: " + ue.message);
  console.log("✓ Sekcije ažurirane (15 wordset setova)");

  const { data: oldEx } = await sb.from("exercises").select("id").eq("lesson_id", LESSON_ID);
  if (oldEx?.length) {
    const ids = oldEx.map((e) => e.id);
    await sb.from("exercise_questions").delete().in("exercise_id", ids);
    await sb.from("exercises").delete().in("id", ids);
    console.log(`✓ Obrisano starih vežbi: ${ids.length}`);
  }
  console.log("\nGotovo. Pregled: /lekcija/" + LESSON_ID + "\n");
}
main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
