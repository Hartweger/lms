// FSP "Skraćenice" - nemačke medicinske skraćenice za Arztbrief.
// Jedan wordset (Quizlet učenje): front = skraćenica, back = pun nemački pojam.
// Izvor: textutil "FSP novi/Skracenice.docx". Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const LESSON_ID = "e8e1fa27-8b96-4b46-8188-4e27290b2e78"; // FSP > Modul 3 Rečnik > Skraćenice
const DOCX = "/Users/natasahartweger/Documents/Claude/sajt/FSP novi/Skracenice.docx";

const fixDash = (s) => s.replace(/[–—]/g, "-");

function parse() {
  const t = execFileSync("textutil", ["-convert", "txt", "-stdout", DOCX], { encoding: "utf8" });
  const seen = new Set();
  const items = [];
  // Pojedinačan unos: "Pun pojam: SKR". Linije se mogu spajati u izvoru,
  // pa razdvajamo na granici " <SKR> <Veliko>" tako što parsiramo "term: abbrev"
  // parove. Najpouzdanije: obradi liniju po liniju; ako linija ima više ":",
  // razbij je na uzastopne "term: abbrev" segmente preko regexa.
  const re = /([^:]+?):\s*([^:]+?)(?=\s+\S[^:]*:|\s*$)/g;
  const norm = (a) => a.toLowerCase().replace(/\s+/g, "");
  let first = null; // ključ prvog unosa -> kad se ponovi, počela je druga kopija
  let done = false;
  for (const raw of t.split("\n")) {
    if (done) break;
    const line = raw.trim();
    if (!line || !line.includes(":")) continue;
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(line)) !== null) {
      const term = fixDash(m[1].trim());
      const abbr = fixDash(m[2].trim());
      if (!term || !abbr) continue;
      const key = norm(abbr);
      // doc je dupliran: kad ponovo naiđemo na PRVI unos, prekidamo (druga kopija
      // ima neuredne spojene linije koje stvaraju lažne delimične unose)
      if (first === null) first = key;
      else if (key === first) { done = true; break; }
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ front: abbr, back: term });
    }
  }
  return items;
}

function buildSections() {
  const items = parse();
  const sections = [
    { type: "badge", module: "Rečnik", category: "wortschatz" },
    { type: "text", style: "default", content:
`## Skraćenice

Nemačke medicinske skraćenice koje stalno srećeš u Arztbrief-u i na viziti. Vežbaj ih kao kartice (kviz, kucanje, igra memorije) - na prednjoj strani je skraćenica, a ti se setiš punog pojma. Ne moraš sve odjednom; vrati se setu kad god ti zatreba.` },
    { type: "wordset", title: "Skraćenice", setKey: "fsp-skracenice",
      frontLabel: "Skraćenica", backLabel: "Značenje", items },
  ];
  return { sections, items };
}

async function main() {
  const { sections, items } = buildSections();
  const { data: lesson, error: le } = await sb.from("lessons").select("title,sections").eq("id", LESSON_ID).single();
  if (le || !lesson) throw new Error("Lekcija nije nađena: " + (le?.message || ""));
  console.log(`\nLekcija: ${lesson.title}`);
  console.log(`Wordset setova: 1 | ukupno kartica: ${items.length}`);
  console.log(`Sekcija: ${(lesson.sections || []).length} -> ${sections.length}`);
  console.log("Uzorak kartica:");
  for (const it of items.slice(0, 5)) console.log(`  ${it.front.padEnd(10)} -> ${it.back}`);
  const bad = items.filter((it) => /[–—]/.test(it.front + it.back));
  console.log(`Kartice sa –/—: ${bad.length}`);

  if (!APPLY) { console.log("\n[DRY-RUN] Nije upisano. --apply za primenu.\n"); return; }

  const { error: ue } = await sb.from("lessons").update({ sections, lesson_type: "text" }).eq("id", LESSON_ID);
  if (ue) throw new Error("Update: " + ue.message);
  console.log("✓ Sekcije ažurirane (1 wordset set)");

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
