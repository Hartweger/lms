// FSP "Fachsprache vs. Patientensprache" - Quizlet-style wordset.
// Front = Fachbegriff (stručni termin), back = Patientensprache (laički).
// Izvor: "quizlet, Fachbegriffe.docx" (textutil -> HTML zbog <br> granica).
// JEDAN wordset (izvor je ravan, bez sekcijskih naslova). Dry-run default; --apply.
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

const LESSON_ID = "e5ece504-e655-4a08-872b-ddbe2c688792"; // FSP > M3 Rečnik > Fachsprache vs. Patientensprache
const DOCX = "/Users/natasahartweger/Documents/Claude/sajt/FSP novi/quizlet, Fachbegriffe.docx";

const fixDash = (s) => s.replace(/[–—]/g, "-");
const stripTags = (s) => s.replace(/<[^>]+>/g, "");
const decode = (s) => s
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");

function parse() {
  let html = execFileSync("textutil", ["-convert", "html", "-stdout", DOCX], { encoding: "utf8" });
  // izbaci <head>/<style> (CSS pravila sadrže dvotačke i lažno parsiraju)
  html = html.replace(/<head[\s\S]*?<\/head>/i, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (body) html = body[1];
  // granice redova = </p> i <br> -> jedan termin po fragmentu
  const frags = html
    .split(/<\/p>|<br\s*\/?>/i)
    .map((f) => decode(stripTags(f)).replace(/ /g, " ").trim())
    .filter(Boolean);
  const items = [];
  for (const line of frags) {
    const i = line.indexOf(":");
    if (i < 0) continue; // nema dvotačke -> nije termin (ili sekcijski naslov; ovde ih nema)
    const front = fixDash(line.slice(0, i).trim());
    const back = fixDash(line.slice(i + 1).trim());
    if (front && back) items.push({ front, back });
  }
  return items;
}

function buildSections() {
  const items = parse();
  const sections = [
    { type: "badge", module: "Rečnik", category: "wortschatz" },
    { type: "text", style: "default", content:
`## Fachsprache vs. Patientensprache

Na FSP-u ti treba dvostruki rečnik: stručni termin (Fachsprache) koji koristiš sa kolegama i u dokumentaciji, i laički izraz (Patientensprache) kojim isti pojam objasniš pacijentu. Na karticama je s prednje strane stručni termin, a sa zadnje kako ga pacijent kaže ili kako mu ga ti objašnjavaš. Vežbaj kao kartice (kviz, kucanje, igra memorije) dok ti oba registra ne dođu sama od sebe.` },
    { type: "wordset", title: "Fachsprache vs. Patientensprache", setKey: "fsp-fachsprache",
      frontLabel: "Fachsprache", backLabel: "Patientensprache", items },
  ];
  return { sections, total: items.length, items };
}

async function main() {
  const { sections, total, items } = buildSections();
  const { data: lesson, error: le } = await sb.from("lessons").select("title,sections").eq("id", LESSON_ID).single();
  if (le || !lesson) throw new Error("Lekcija nije nađena: " + (le?.message || ""));
  console.log(`\nLekcija: ${lesson.title}`);
  console.log(`Wordset-ova: 1 | ukupno kartica: ${total}`);
  console.log(`Sekcija: ${(lesson.sections || []).length} -> ${sections.length}`);
  console.log("Uzorak kartica:");
  for (const c of items.slice(0, 3)) console.log(`  ${c.front}  |  ${c.back}`);
  const dashHits = items.filter((c) => /[–—]/.test(c.front + c.back)).length;
  console.log(`En/em crtica u karticama: ${dashHits} (mora 0)`);

  if (!APPLY) { console.log("\n[DRY-RUN] Nije upisano. --apply za primenu.\n"); return; }

  const { error: ue } = await sb.from("lessons").update({ sections, lesson_type: "text" }).eq("id", LESSON_ID);
  if (ue) throw new Error("Update: " + ue.message);
  console.log("✓ Sekcije ažurirane (1 wordset)");

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
