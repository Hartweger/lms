// AUDIT (read-only): pronalazi linkove/embed-ove koji su na starom WP-u (old.hartweger.rs, LearnDash)
// postojali u lekcijama, a fale u novom LMS-u. NE upisuje ništa — pravi izveštaj za zajednički pregled.
// Pokretanje: node scripts/audit-wp-lesson-links.mjs  → piše ispit-materijali/AUDIT-wp-linkovi.md
import { writeFileSync } from "node:fs";
import { client } from "./lib/exam-packer.mjs";

const WP = "https://old.hartweger.rs/wp-json/ldlms/v2";
const AUTH = "Basic " + Buffer.from("Nati:cEbg CO8J 1dPP olXw sK4W zDor").toString("base64");
const OUT = "/Users/natasahartweger/Documents/Claude/sajt/LMS/ispit-materijali/AUDIT-wp-linkovi.md";

const norm = (t) => (t || "")
  .toLowerCase()
  .replace(/<[^>]+>/g, " ")
  .replace(/&[a-z]+;/g, " ")
  .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, " ") // emoji
  .replace(/^\s*\d+[\s.)–-]*/, "") // vodeći broj "01 ", "1) "
  .replace(/[^a-zäöüß0-9]+/gi, " ")
  .trim().replace(/\s+/g, " ");

// Izvuci resurse (iframe + a href) iz WP HTML-a, kategorizovano + token za poređenje.
function extractResources(html) {
  const res = [];
  const push = (kind, url, token) => res.push({ kind, url, token });
  for (const m of html.matchAll(/<iframe[^>]+src=["']([^"']+)["']/gi)) {
    const u = m[1];
    if (/vimeo\.com\/video\/(\d+)/i.test(u)) push("vimeo", u, RegExp.$1);
    else if (/quizlet\.com\/(\d+)/i.test(u)) push("quizlet", u, RegExp.$1);
    else if (/docs\.google\.com\/presentation\/d\/([\w-]+)/i.test(u)) push("slides", u, RegExp.$1);
    else if (/docs\.google\.com\/document\/d\/([\w-]+)/i.test(u)) push("gdoc", u, RegExp.$1);
    else if (/youtube\.com|youtu\.be/i.test(u)) push("youtube", u, (u.match(/[\w-]{11}/) || [u])[0]);
    else push("iframe", u, u);
  }
  for (const m of html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)) {
    const u = m[1];
    if (/^#|^mailto:|^tel:|javascript:/i.test(u)) continue;
    if (/quizlet\.com\/(\d+)/i.test(u)) push("quizlet", u, RegExp.$1);
    else if (/docs\.google\.com\/presentation\/d\/([\w-]+)/i.test(u)) push("slides", u, RegExp.$1);
    else if (/docs\.google\.com\/document\/d\/([\w-]+)/i.test(u)) push("gdoc", u, RegExp.$1);
    else if (/drive\.google\.com\/[^"']*?([\w-]{20,})/i.test(u)) push("gdrive", u, RegExp.$1);
    else if (/\.pdf($|\?)/i.test(u)) push("pdf", u, (u.split("/").pop() || u).split("?")[0]);
    else if (/hartweger\.rs\/([a-z0-9-]+)\/?$/i.test(u) && !/wp-content|wp-admin/i.test(u)) push("clanak", u, RegExp.$1);
    else if (/^https?:\/\//i.test(u)) push("extern", u, u);
  }
  return res;
}

// 1) STARI WP — sve lekcije (paginirano)
async function fetchAllOld() {
  const all = [];
  for (let page = 1; page <= 99; page++) {
    const r = await fetch(`${WP}/sfwd-lessons?per_page=100&page=${page}&_fields=id,title,content,course`, { headers: { Authorization: AUTH } });
    if (!r.ok) { if (r.status === 400) break; throw new Error(`WP ${r.status} page ${page}`); }
    const batch = await r.json();
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

console.log("Povlačim stare WP lekcije...");
const old = await fetchAllOld();
console.log(`  ${old.length} starih lekcija.`);

// 2) NOVI LMS — sve lekcije + kurs
const sb = client();
const { data: courses } = await sb.from("courses").select("id,title,slug");
const courseById = Object.fromEntries(courses.map((c) => [c.id, c]));
const { data: newLessons } = await sb.from("lessons").select("id,title,course_id,vimeo_video_id,sections");
// indeks novih po normalizovanom naslovu
const newByTitle = new Map();
for (const l of newLessons) {
  const k = norm(l.title);
  if (!newByTitle.has(k)) newByTitle.set(k, []);
  newByTitle.get(k).push(l);
}
const blobOf = (l) => (JSON.stringify(l.sections || []) + " " + (l.vimeo_video_id || "")).toLowerCase();

// 3) DIFF
const report = [];      // { course, oldTitle, newTitle, missing:[{kind,url}] }
const unmatched = [];    // stare lekcije sa resursima bez novog para
let oldWithRes = 0;

for (const o of old) {
  const html = (o.content && o.content.rendered) || "";
  const resources = extractResources(html);
  if (!resources.length) continue;
  oldWithRes++;
  const k = norm(o.title && o.title.rendered);
  const matches = newByTitle.get(k) || [];
  if (!matches.length) { unmatched.push({ title: (o.title && o.title.rendered) || "", resources }); continue; }
  for (const nl of matches) {
    const blob = blobOf(nl);
    const missing = resources.filter((res) => !blob.includes(String(res.token).toLowerCase()));
    if (missing.length) report.push({ course: courseById[nl.course_id]?.title || "?", oldTitle: (o.title && o.title.rendered) || "", newTitle: nl.title, missing });
  }
}

// 4) Izveštaj (markdown)
const byKind = {};
for (const r of report) for (const m of r.missing) byKind[m.kind] = (byKind[m.kind] || 0) + 1;

let md = `# AUDIT — WP linkovi/embed-ovi koji fale u novom LMS-u\n\n`;
md += `Staro lekcija: ${old.length} · sa resursima: ${oldWithRes} · novih lekcija: ${newLessons.length}\n\n`;
md += `**Lekcija sa nečim što fali: ${report.length}** · nesparenih (stara ima resurs, nema novog para po naslovu): ${unmatched.length}\n\n`;
md += `Tipovi koji fale (ukupno): ${Object.entries(byKind).map(([k, n]) => `${k}=${n}`).join(", ")}\n\n---\n\n`;

const grouped = {};
for (const r of report) { (grouped[r.course] ||= []).push(r); }
for (const course of Object.keys(grouped).sort()) {
  md += `## ${course}\n\n`;
  for (const r of grouped[course]) {
    md += `### ${r.newTitle}\n`;
    for (const m of r.missing) md += `- **${m.kind}**: ${m.url}\n`;
    md += `\n`;
  }
}
md += `\n---\n\n## Nesparene stare lekcije (nema novog para po naslovu)\n\n`;
for (const u of unmatched) md += `- **${u.title}** — ${u.resources.map((r) => r.kind).join(", ")}\n`;

writeFileSync(OUT, md);
console.log(`\nGOTOVO → ${OUT}`);
console.log(`Lekcija sa nečim što fali: ${report.length} | nesparenih: ${unmatched.length}`);
console.log(`Tipovi: ${Object.entries(byKind).map(([k, n]) => `${k}=${n}`).join(", ")}`);
console.log(`Kursevi pogođeni: ${Object.keys(grouped).sort().join(", ")}`);
