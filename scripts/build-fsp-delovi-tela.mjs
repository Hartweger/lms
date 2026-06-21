// FSP "Delovi tela i organi" - Quizlet-style wordset setovi iz "delovi tela.docx".
// Po sekciji: naslov (text) + wordset (Learn modul = vežba). Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const LESSON_ID = "5c9d5540-d144-4cee-bc11-21284818dcaf"; // FSP > Module 3 Rečnik > Delovi tela i organi
const DOCX = "/Users/natasahartweger/Documents/Claude/sajt/FSP novi/delovi tela.docx";

// izvorni naslov sekcije -> slug (za setKey)
const SECTION_SLUGS = {
  "Unutrašnji organi": "unutrasnji-organi",
  "Delovi tela": "delovi-tela",
  "Delovi lica": "delovi-lica",
};

const fixDash = (s) => s.replace(/[–—]/g, "-").trim();

// Da li je linija naslov sekcije? (nema " – ", nije prazna, poznata)
function isSectionHeading(line) {
  return Object.prototype.hasOwnProperty.call(SECTION_SLUGS, line);
}

// Razbij liniju (jedan ili više parova) na {front, back}.
// Liniju delimo na " – " (en dash sa razmacima). Rezultat:
//   [de0, sr0+de1, sr1+de2, ..., srN]
// Srednji komadi: srpski deo (bez članova der/die/das) + nemački sledeći (počinje članom).
function parseLine(line) {
  const parts = line.split(" – ");
  if (parts.length < 2) return [];
  const pairs = [];
  let curDe = parts[0].trim();
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i].trim();
    if (i === parts.length - 1) {
      // poslednji: ceo komad je srpski prevod
      pairs.push({ de: curDe, sr: chunk });
    } else {
      // srpski prevod + početak sledećeg nemačkog (počinje članom der/die/das)
      const m = chunk.match(/\b(der|die|das)\b/);
      if (!m) {
        // ne bi trebalo da se desi; fallback: ceo komad je srpski, nema sledećeg de
        pairs.push({ de: curDe, sr: chunk });
        curDe = "";
        continue;
      }
      const idx = m.index;
      const sr = chunk.slice(0, idx).trim();
      const nextDe = chunk.slice(idx).trim();
      pairs.push({ de: curDe, sr });
      curDe = nextDe;
    }
  }
  return pairs.filter((p) => p.de && p.sr);
}

function parse() {
  const txt = execSync(`textutil -convert txt -stdout ${JSON.stringify(DOCX)}`, { encoding: "utf8" });
  let cur = null;
  const data = {}, order = [];
  const unparsed = [];
  for (const raw of txt.split("\n")) {
    const s = raw.trim();
    if (!s) continue;
    if (isSectionHeading(s)) {
      cur = s;
      if (!data[cur]) { data[cur] = []; order.push(cur); }
      continue;
    }
    if (!cur) { unparsed.push(s); continue; }
    if (!s.includes(" – ") && !s.includes(" - ")) { unparsed.push(s); continue; }
    const pairs = parseLine(s);
    if (!pairs.length) { unparsed.push(s); continue; }
    for (const p of pairs) data[cur].push({ front: fixDash(p.de), back: fixDash(p.sr) });
  }
  return { data, order, unparsed };
}

function buildSections() {
  const { data, order, unparsed } = parse();
  const sections = [
    { type: "badge", module: "Rečnik", category: "wortschatz" },
    { type: "text", style: "default", content:
`## Delovi tela i organi

Rečnik delova tela, lica i unutrašnjih organa na nemačkom. Za svaku grupu imaš set kartica - vežbaj kao kviz, kucanje ili igru memorije. Nemački član (der/die/das) i oznaku množine uči zajedno sa rečju.` },
  ];
  let total = 0;
  for (const o of order) {
    const slug = SECTION_SLUGS[o];
    sections.push({ type: "text", style: "default", content: `## ${o}` });
    sections.push({ type: "wordset", title: o, setKey: `fsp-delovi-${slug}`, frontLabel: "DE", backLabel: "SR", items: data[o] });
    total += data[o].length;
  }
  return { sections, order, data, total, unparsed };
}

async function main() {
  const { sections, order, data, total, unparsed } = buildSections();
  const { data: lesson, error: le } = await sb.from("lessons").select("title,sections").eq("id", LESSON_ID).single();
  if (le || !lesson) throw new Error("Lekcija nije nađena: " + (le?.message || ""));
  console.log(`\nLekcija: ${lesson.title}`);
  console.log(`Sekcija (wordset tabova): ${order.length} | ukupno kartica: ${total}`);
  order.forEach((o) => console.log(`  ${o.padEnd(24)} ${data[o].length}`));
  console.log(`Sekcija u bazi: ${(lesson.sections || []).length} -> ${sections.length}`);
  if (unparsed.length) {
    console.log(`\nNeparsirane linije (${unparsed.length}):`);
    unparsed.forEach((u) => console.log(`  ! ${u.slice(0, 80)}`));
  }
  // sanity: nema en/em dash u karticama
  const bad = [];
  for (const o of order) for (const it of data[o]) if (/[–—]/.test(it.front) || /[–—]/.test(it.back)) bad.push(`${o}: ${it.front} / ${it.back}`);
  if (bad.length) { console.log(`\nUPOZORENJE: en/em dash u karticama (${bad.length}):`); bad.forEach((b) => console.log("  " + b)); }
  else console.log("\nOK: nema –/— u karticama.");

  if (!APPLY) { console.log("\n[DRY-RUN] Nije upisano. --apply za primenu.\n"); return; }

  const { error: ue } = await sb.from("lessons").update({ sections, lesson_type: "text" }).eq("id", LESSON_ID);
  if (ue) throw new Error("Update: " + ue.message);
  console.log(`✓ Sekcije ažurirane (${order.length} wordset setova)`);

  const { data: oldEx } = await sb.from("exercises").select("id").eq("lesson_id", LESSON_ID);
  if (oldEx?.length) {
    const ids = oldEx.map((e) => e.id);
    await sb.from("exercise_questions").delete().in("exercise_id", ids);
    await sb.from("exercises").delete().in("id", ids);
    console.log(`✓ Obrisano starih vežbi: ${ids.length}`);
  } else {
    console.log("✓ Nema starih vežbi za brisanje");
  }
  console.log("\nGotovo. Pregled: /lekcija/" + LESSON_ID + "\n");
}
main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
