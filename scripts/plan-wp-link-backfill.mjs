// PLANER (read-only): čita postojeći ispit-materijali/AUDIT-wp-linkovi.md (ne zavisi od starog WP-a),
// filtrira šum, mapira prenosive resurse na LMS blokove, repointuje članke na /magazin ako postoje.
// Piše ispit-materijali/BACKFILL-PLAN.md (+ .json). NE upisuje u bazu.
import { readFileSync, writeFileSync } from "node:fs";
import { client } from "./lib/exam-packer.mjs";

const DIR = "/Users/natasahartweger/Documents/Claude/sajt/LMS/ispit-materijali/";
const md = readFileSync(DIR + "AUDIT-wp-linkovi.md", "utf8");

// parse: ## Course / ### Lesson / - **kind**: url
const rows = [];
let course = null, lesson = null;
for (const line of md.split("\n")) {
  let m;
  if ((m = line.match(/^## (.+?)(\s+\(\d+ lekcija\))?$/)) && !/^## Nesparene/.test(line)) { course = m[1].trim(); lesson = null; }
  else if (/^## Nesparene/.test(line)) { course = "__UNMATCHED__"; }
  else if ((m = line.match(/^### (.+)$/))) lesson = m[1].trim();
  else if ((m = line.match(/^- \*\*(\w+)\*\*: (.+)$/)) && course && lesson && course !== "__UNMATCHED__") rows.push({ course, lesson, kind: m[1], url: m[2].trim() });
}

const sb = client();
const { data: blog } = await sb.from("blog_posts").select("slug");
const blogSlugs = new Set((blog || []).map((b) => b.slug));

// noise filter + block mapping
function toBlock(kind, url) {
  if (/hartweger\.rs\/[^"']*\/embed\//i.test(url)) return null;               // WP članak /embed/ šum (NE youtube)
  if (/youtube\.com\/watch|youtu\.be/i.test(url)) return null;                // duplikat embeda
  if (/hartweger\.rs\/kursevi\/.*\/(testovi|lekcije)\//i.test(url)) return null; // stari LD interni

  if (kind === "youtube") { const id = (url.match(/embed\/([\w-]{11})/) || [])[1]; return id ? { type: "youtube", videoId: id } : null; }
  if (kind === "quizlet") { const id = (url.match(/quizlet\.com\/(\d+)/) || [])[1]; return id ? { type: "link", linkType: "quizlet", href: `https://quizlet.com/${id}/match`, label: "📚 Vežba na Quizlet" } : null; }
  if (kind === "slides") { const id = (url.match(/presentation\/d\/([\w-]+)/) || [])[1]; return id ? { type: "link", linkType: "external", href: `https://docs.google.com/presentation/d/${id}/edit?usp=sharing`, label: "📊 Präsentation ansehen" } : null; }
  if (kind === "gdoc") return { type: "link", linkType: "external", href: url, label: "📄 Dokument" };
  if (kind === "gdrive") return { type: "link", linkType: "external", href: url, label: "📁 Materijal (Google Drive)" };
  if (kind === "pdf") return { type: "pdf", url: "<RE-HOST→Supabase>", label: "📖 PDF", _source: url };
  if (kind === "clanak") { const slug = (url.match(/hartweger\.rs\/([a-z0-9-]+)\/?$/i) || [])[1]; const ok = slug && blogSlugs.has(slug); return { type: "link", linkType: "external", href: ok ? `/magazin/${slug}` : url, label: "📜 Članak", _note: ok ? "repoint→magazin" : "⚠️ nije u blog_posts" }; }
  if (kind === "iframe") return null;                                         // ostali iframe = šum
  if (kind === "extern") { if (/learngerman\.dw\.com|dw\.com\/de/i.test(url)) return { type: "link", linkType: "dw", href: url, label: "Deutsche Welle" }; return null; }
  if (kind === "vimeo") return { type: "_PROVERITI_vimeo", url }; // ručno: da li video stvarno fali
  return null;
}

const plan = {};
const byKind = {};
let dropped = 0;
for (const r of rows) {
  const block = toBlock(r.kind, r.url);
  if (!block) { dropped++; continue; }
  const key = r.course + "||" + r.lesson;
  (plan[key] ||= { course: r.course, lesson: r.lesson, items: [] }).items.push({ kind: r.kind, block, source: r.url });
  byKind[r.kind] = (byKind[r.kind] || 0) + 1;
}

const entries = Object.values(plan);
const byCourse = {};
for (const p of entries) (byCourse[p.course] ||= []).push(p);

let out = `# BACKFILL PLAN — prenosivi WP resursi (čisto, bez šuma)\n\n`;
out += `Lekcija sa predlogom: ${entries.length} · stavki: ${Object.values(byKind).reduce((a, b) => a + b, 0)} · odbačeno kao šum: ${dropped}\n`;
out += `Tipovi: ${Object.entries(byKind).map(([k, n]) => `${k}=${n}`).join(", ")}\n\n`;
out += `Legenda: **pdf** = re-host na Supabase pre upisa · **clanak** = repoint na /magazin ako postoji · **_PROVERITI_vimeo** = ručno proveriti da li video stvarno fali.\n\n---\n\n`;
for (const ct of Object.keys(byCourse).sort()) {
  out += `## ${ct}  (${byCourse[ct].length} lekcija)\n\n`;
  for (const p of byCourse[ct]) {
    out += `### ${p.lesson}\n`;
    for (const it of p.items) {
      const tgt = it.block.href || it.block.videoId || it.block._source || it.block.url || "";
      out += `- **${it.kind}**${it.block._note ? ` _(${it.block._note})_` : ""}: \`${tgt}\`\n`;
    }
    out += `\n`;
  }
}
writeFileSync(DIR + "BACKFILL-PLAN.md", out);
writeFileSync(DIR + "BACKFILL-PLAN.json", JSON.stringify(entries, null, 2));
console.log(`GOTOVO → ${DIR}BACKFILL-PLAN.md`);
console.log(`Lekcija: ${entries.length} · stavki: ${Object.values(byKind).reduce((a, b) => a + b, 0)} · šum odbačen: ${dropped}`);
console.log(`Tipovi: ${Object.entries(byKind).map(([k, n]) => `${k}=${n}`).join(", ")}`);
console.log(`Kursevi: ${Object.keys(byCourse).sort().map((c) => `${c}(${byCourse[c].length})`).join(" · ")}`);
