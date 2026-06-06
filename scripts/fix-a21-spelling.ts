/**
 * Fix A2.1 spelling: restore German umlauts/ß and Serbian diacritics in
 * lesson `sections` JSON for course `nemacki-a2-1`.
 *
 * Background: lessons 12 and 15–24 were authored without ä/ö/ü/ß and without
 * č/ć/š/ž/đ. Lessons 0–11, 13, 14 are clean. This is a CURATED dictionary of
 * known-wrong → correct tokens — NOT a blind rule — so that legitimately
 * umlaut-less words (e.g. Präteritum "konnte/durfte/musste", "Agrarwissenschaft")
 * are left intact.
 *
 * SAFETY: dry-run is the default. Nothing is written unless you pass --apply.
 *
 *   npx tsx scripts/fix-a21-spelling.ts            # dry-run: print every change
 *   npx tsx scripts/fix-a21-spelling.ts --apply    # write fixes to the DB
 *   npx tsx scripts/fix-a21-spelling.ts --source    # also patch this seed file
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join("=").trim();
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const COURSE_SLUG = "nemacki-a2-1";
const APPLY = process.argv.includes("--apply");
const PATCH_SOURCE = process.argv.includes("--source");

// ─── Correction dictionary (lista svih grešaka) ───
// `word: true`  → matched with \b word boundaries (safe for short tokens).
// `word: false` → literal substring (for phrases or tokens with punctuation).
type Rule = { from: string; to: string; word?: boolean };

// ---- GERMAN: missing umlauts / ß ----
const DE: Rule[] = [
  // L12 Bewerbungen
  { from: "Vorstellungsgesprach", to: "Vorstellungsgespräch" },
  { from: "fliessend", to: "fließend" },
  { from: "Grussen", to: "Grüßen" },
  { from: "Personliche", to: "Persönliche" },
  { from: "wurde ich mich sehr freuen", to: "würde ich mich sehr freuen" },
  // L15 Reflexive Verben
  { from: "regelmassig", to: "regelmäßig" },
  { from: "regelmasig", to: "regelmäßig" },
  { from: "ernahren", to: "ernähren" },
  { from: "ernahre", to: "ernähre" },
  { from: "fuhlen", to: "fühlen" },
  { from: "Jorg", to: "Jörg", word: true },
  { from: "geandert", to: "geändert" },
  { from: "andern", to: "ändern", word: true },
  { from: "Cafe", to: "Café", word: true },
  { from: "verspatet", to: "verspätet" },
  // L16/L18 Verben mit Präposition + wo(r)/da(r)
  { from: "uberhaupt", to: "überhaupt" },
  { from: "Woruber", to: "Worüber" },
  { from: "Daruber", to: "Darüber" },
  { from: "Wofur", to: "Wofür" },
  { from: "Dafur", to: "Dafür" },
  { from: "argern", to: "ärgern" },
  { from: "argert", to: "ärgert" },
  { from: "Fussball", to: "Fußball" }, // also covers Fussball*  compounds
  { from: "geniessen", to: "genießen" },
  { from: "grossen", to: "großen" },
  { from: "fruhstuckt", to: "frühstückt" },
  { from: "Huhnchen", to: "Hühnchen" },
  { from: "Gemuse", to: "Gemüse" },
  { from: "Nussen", to: "Nüssen" },
  { from: "Stuck", to: "Stück", word: true },
  // L19 Modalverben (ONLY present-tense forms get the umlaut; Präteritum konnte/durfte/musste stays!)
  { from: "Prateritum", to: "Präteritum" },
  { from: "konnen", to: "können", word: true },
  { from: "durfen", to: "dürfen", word: true },
  { from: "mussen", to: "müssen", word: true },
  { from: "mogen", to: "mögen", word: true },
  { from: "mochten", to: "möchten", word: true },
  { from: "mochte", to: "möchte", word: true },
  { from: "Universitat", to: "Universität" },
  // L20–L22 Schule / Ausbildung
  { from: "Schultute", to: "Schultüte" },
  { from: "Kindertagesstatte", to: "Kindertagesstätte" },
  { from: "Forderunterricht", to: "Förderunterricht" },
  { from: "Elterngesprach", to: "Elterngespräch" },
  { from: "Prufung", to: "Prüfung" },
  { from: "Wechselprapositionen", to: "Wechselpräpositionen" },
  { from: "Mull", to: "Müll", word: true },
  { from: "Lekture", to: "Lektüre" },
  { from: "Tater", to: "Täter", word: true },
  { from: "Verdachtige", to: "Verdächtige" },
  // short prepositions (word-bounded; do these last)
  { from: "fur", to: "für", word: true },
  { from: "Fur", to: "Für", word: true },
  { from: "uber", to: "über", word: true },
  { from: "Uber", to: "Über", word: true },
];

// ---- SERBIAN: missing č/ć/š/ž/đ ----
const SR: Rule[] = [
  // Nemačka family
  { from: "Nemackoj", to: "Nemačkoj" },
  { from: "Nemackom", to: "Nemačkom" },
  { from: "Nemacka", to: "Nemačka" },
  { from: "nemacka", to: "nemačka" },
  // škola family
  { from: "Skola", to: "Škola", word: true },
  { from: "skola", to: "škola", word: true },
  { from: "skole", to: "škole", word: true },
  { from: "skoli", to: "školi", word: true },
  { from: "skolu", to: "školu", word: true },
  { from: "Skolska", to: "Školska" },
  { from: "skolska", to: "školska" },
  { from: "skolsku", to: "školsku" },
  { from: "skolski", to: "školski" },
  { from: "skolskom", to: "školskom" },
  { from: "skolskim", to: "školskim" },
  { from: "skolskih", to: "školskih" },
  { from: "predskolsko", to: "predškolsko" },
  { from: "Predskolsko", to: "Predškolsko" },
  // vrtić family
  { from: "vrtic", to: "vrtić", word: true },
  { from: "vrtici", to: "vrtići", word: true },
  { from: "vrticu", to: "vrtiću", word: true },
  // čitanje family
  { from: "Citaj", to: "Čitaj" },
  { from: "Citanje", to: "Čitanje" },
  { from: "citati", to: "čitati" },
  { from: "Procitaj", to: "Pročitaj" },
  { from: "procitanog", to: "pročitanog" },
  // priča family
  { from: "pricati", to: "pričati" },
  { from: "pricu", to: "priču" },
  { from: "price", to: "priče" },
  { from: "prica", to: "priča", word: true },
  { from: "kriminalisticka", to: "kriminalistička" },
  // verbs / words
  { from: "svedocanstvo", to: "svedočanstvo" },
  { from: "sadrzis", to: "sadržiš" },
  { from: "navodis", to: "navodiš" },
  { from: "Postovane", to: "Poštovane" },
  { from: "postovanjem", to: "poštovanjem" },
  { from: "tecno", to: "tečno" },
  { from: "necemu", to: "nečemu" },
  { from: "buducnosti", to: "budućnosti" },
  { from: "uzivati", to: "uživati" },
  { from: "medjuvremenu", to: "međuvremenu" },
  { from: "izmedju", to: "između" },
  { from: "vaznost", to: "važnost" },
  { from: "uravnotezen", to: "uravnotežen" },
  { from: "pohadjanja", to: "pohađanja" },
  { from: "produzeni", to: "produženi" },
  { from: "funkcionise", to: "funkcioniše" },
  { from: "ucenik", to: "učenik" },
  { from: "smece", to: "smeće" },
  { from: "naruciiti", to: "naručiti" }, // note: also fixes the doubled-i typo
  { from: "poboljsas", to: "poboljšaš" },
  { from: "pocinilac", to: "počinilac" },
  { from: "zrtva", to: "žrtva", word: true },
  { from: "osumnjiceni", to: "osumnjičeni" },
  { from: "razumes", to: "razumeš" },
  { from: "pokusaj", to: "pokušaj" },
  { from: "recnik", to: "rečnik", word: true },
  { from: "recenica", to: "rečenica" },
  { from: "recenice", to: "rečenice" },
  { from: "pocinje", to: "počinje" },
  { from: "tusirati", to: "tuširati" },
  { from: "osecati", to: "osećati" },
  { from: "svadjati", to: "svađati" },
  { from: "pozuriti", to: "požuriti" },
  { from: "zavrsetak", to: "završetak" },
  { from: "razlicitih", to: "različitih" },
  { from: "godisnji", to: "godišnji" },
  { from: "najvaznije", to: "najvažnije" },
  { from: "proslosti", to: "prošlosti" },
  { from: "proslo", to: "prošlo", word: true },
  { from: "obavestenje", to: "obaveštenje" },
  { from: "domacim", to: "domaćim" },
  { from: "slatkisima", to: "slatkišima" },
  { from: "drzavne", to: "državne" },
  { from: "Drzavne", to: "Državne" },
  { from: "visu", to: "višu", word: true },
  { from: "dobijes", to: "dobiješ" },
  { from: "mozda", to: "možda" },
  { from: "igracica", to: "igračica" },
  { from: "igrac", to: "igrač", word: true },
  { from: "navijac", to: "navijač", word: true },
  { from: "tacan", to: "tačan", word: true },
  { from: "licno", to: "lično", word: true },
  { from: "udruzenje", to: "udruženje" },
  { from: "interesujes", to: "interesuješ" },
  { from: "Cime", to: "Čime", word: true },
  { from: "cekati", to: "čekati" },
  { from: "cekas", to: "čekaš" },
  { from: "zalis", to: "žališ" },
  { from: "zaliti", to: "žaliti" },
  { from: "odreci", to: "odreći" },
  { from: "pomoc", to: "pomoć", word: true },
  // short / ambiguous words handled via phrases or word boundaries
  { from: "moze", to: "može", word: true },
  { from: "Moze", to: "Može", word: true },
  { from: "mozes", to: "možeš", word: true },
  { from: "ponovis", to: "ponoviš", word: true },
  { from: "naucio", to: "naučio", word: true },
  { from: "nacina", to: "načina", word: true },
  { from: "nacin", to: "način", word: true },
  { from: "pise", to: "piše", word: true },
  { from: "cak", to: "čak", word: true },
  { from: "pomazu", to: "pomažu", word: true },
  { from: "sta", to: "šta", word: true },
  { from: "Sta", to: "Šta", word: true },
  { from: "reci", to: "reči", word: true },
  // phrases (handle the ambiguous "sto" = što only in context)
  { from: "necemu sto se desilo", to: "nečemu što se desilo", word: false },
  { from: "sve sto si naucio", to: "sve što si naučio", word: false },
  { from: "da das savete", to: "da daš savete", word: false }, // typo: "da daš"
];

const RULES = [...DE, ...SR];

function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function toRegex(r: Rule): RegExp {
  return r.word ? new RegExp(`\\b${esc(r.from)}\\b`, "g") : new RegExp(esc(r.from), "g");
}

// Apply all rules to a string, returning the fixed string + per-rule hit counts.
function fixString(input: string): { out: string; hits: Map<string, number> } {
  let out = input;
  const hits = new Map<string, number>();
  for (const r of RULES) {
    const re = toRegex(r);
    let count = 0;
    out = out.replace(re, () => {
      count++;
      return r.to;
    });
    if (count) hits.set(`${r.from} → ${r.to}`, count);
  }
  return { out, hits };
}

// Leftover sanity scan: telltale ASCII-German tokens that still need umlaut/ß.
// Excludes genuinely umlaut-less correct forms (musste, konnten, hatte, wurde).
// Only a REVIEW flag — never auto-fixes.
const LEFTOVER =
  /\b(fur|Fur|uber|Uber|fuhlen|fuhle|Prufung|Grussen|konnen|durfen|mussen|mogen|Fussball|gross|grosse|grosser|Strasse|spat|Spat|fruh|naturlich|uberhaupt|ware|mochte|Geschaft|Lander|Gesprach|Bucher|spater|Schuler|Universitat|Prasens|Prateritum|wahlen|erklaren|grun|Tur|Schlussel|gemutlich|Loffel|horen|wunschen|Kuche)\b/g;

async function main() {
  console.log(`A2.1 spelling fix — mode: ${APPLY ? "APPLY (writing to DB)" : "DRY-RUN (no writes)"}\n`);

  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .select("id, title")
    .eq("slug", COURSE_SLUG)
    .single();
  if (courseErr || !course) {
    console.error("Course not found:", courseErr?.message);
    return;
  }

  const { data: lessons, error: lessonsErr } = await supabase
    .from("lessons")
    .select("id, title, order_index, sections")
    .eq("course_id", course.id)
    .order("order_index");
  if (lessonsErr || !lessons) {
    console.error("Lessons not found:", lessonsErr?.message);
    return;
  }

  let totalChanges = 0;
  let changedLessons = 0;
  const backup: Record<string, unknown> = {};

  for (const lesson of lessons) {
    if (!lesson.sections) continue;
    const before = JSON.stringify(lesson.sections);
    const { out, hits } = fixString(before);

    // Always scan the (post-fix) content for leftovers, even if nothing changed.
    const leftoverAll = out.match(LEFTOVER);
    if (out === before) {
      if (leftoverAll) {
        console.log(
          `[${lesson.order_index}] ${lesson.title} — no dict hits, but ⚠️ leftover: ${[...new Set(leftoverAll)].join(", ")}`
        );
      }
      continue;
    }

    changedLessons++;
    const lessonChanges = [...hits.values()].reduce((a, b) => a + b, 0);
    totalChanges += lessonChanges;

    console.log(`[${lesson.order_index}] ${lesson.title} — ${lessonChanges} replacements`);
    for (const [rule, n] of [...hits.entries()].sort()) {
      console.log(`     ${n}×  ${rule}`);
    }

    const leftover = out.match(LEFTOVER);
    if (leftover) {
      console.log(`     ⚠️  suspicious leftover tokens: ${[...new Set(leftover)].join(", ")}`);
    }

    if (APPLY) {
      backup[lesson.id] = lesson.sections; // original, for rollback
      const fixed = JSON.parse(out);
      const { error: updErr } = await supabase
        .from("lessons")
        .update({ sections: fixed })
        .eq("id", lesson.id);
      console.log(updErr ? `     ERROR: ${updErr.message}` : `     ✓ written`);
    }
  }

  if (APPLY && Object.keys(backup).length) {
    const backupPath = path.resolve(__dirname, "a21-sections-backup.json");
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), "utf-8");
    console.log(`\nBackup of original sections written to ${backupPath}`);
  }

  console.log(`\n${changedLessons} lessons changed, ${totalChanges} total replacements.`);
  if (!APPLY) console.log("Dry-run only — re-run with --apply to write to the DB.");

  // Optionally patch the local seed file so source stays in sync.
  if (PATCH_SOURCE) {
    const srcPath = path.resolve(__dirname, "import-a21-sections.ts");
    const src = fs.readFileSync(srcPath, "utf-8");
    const { out, hits } = fixString(src);
    const n = [...hits.values()].reduce((a, b) => a + b, 0);
    if (out !== src) {
      if (APPLY) {
        fs.writeFileSync(srcPath, out, "utf-8");
        console.log(`\nSource file patched: ${n} replacements in import-a21-sections.ts`);
      } else {
        console.log(`\n[--source dry-run] would make ${n} replacements in import-a21-sections.ts`);
      }
    }
  }
}

main().catch(console.error);
