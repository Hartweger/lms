// PRIMENA backfill-plana po kursu. Čita ispit-materijali/BACKFILL-PLAN.json, idempotentno dodaje
// blokove na kraj sekcija lekcije. vimeo → preskače (ručna provera). pdf → re-host sa starog WP
// (ako je dostupan; inače odloži). Dry-run default; --apply.
// Upotreba: node scripts/apply-wp-link-backfill.mjs --course="B1.1" [--apply]
import { readFileSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { client, getCourse } from "./lib/exam-packer.mjs";

const APPLY = process.argv.includes("--apply");
const courseArg = (process.argv.find((a) => a.startsWith("--course=")) || "").split("=")[1] || "";
if (!courseArg) { console.error("Daj --course=\"<deo naziva>\" (npr. B1.1)"); process.exit(1); }

const DIR = "/Users/natasahartweger/Documents/Claude/sajt/LMS/ispit-materijali/";
const plan = JSON.parse(readFileSync(DIR + "BACKFILL-PLAN.json", "utf8"));
const norm = (t) => (t || "").toLowerCase().replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ")
  .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, " ").replace(/^\s*\d+[\s.)–-]*/, "")
  .replace(/[^a-zäöüß0-9]+/gi, " ").trim().replace(/\s+/g, " ");

const sb = client();
const WP_PDF_AUTH = "Basic " + Buffer.from("Nati:cEbg CO8J 1dPP olXw sK4W zDor").toString("base64");

// lepše labele: članak → pravi naslov iz magazina; pdf → iz imena fajla
const { data: blog } = await sb.from("blog_posts").select("slug,title");
const blogTitle = Object.fromEntries((blog || []).map((b) => [b.slug, b.title]));
const prettyFn = (fn) => "📖 " + decodeURIComponent(fn).replace(/\.pdf$/i, "").replace(/[-_]+/g, " ").trim();
const enrich = (kind, block) => {
  if (kind === "clanak") { const slug = (block.href.match(/\/magazin\/([a-z0-9-]+)/) || [])[1]; if (slug && blogTitle[slug]) block.label = "📜 " + blogTitle[slug]; }
  return block;
};

const entries = plan.filter((p) => p.course.toLowerCase().includes(courseArg.toLowerCase()));
if (!entries.length) { console.error(`Nema stavki za kurs koji sadrži "${courseArg}".`); process.exit(1); }
const courseTitle = entries[0].course;
console.log(`Kurs: ${courseTitle} | lekcija u planu: ${entries.length} | ${APPLY ? "APPLY" : "DRY"}`);

// nađi kurs + lekcije
const { data: courses } = await sb.from("courses").select("id,title,slug");
const course = courses.find((c) => c.title === courseTitle);
if (!course) throw new Error("kurs nije nađen: " + courseTitle);
const { data: lessons } = await sb.from("lessons").select("id,title,sections").eq("course_id", course.id);
const byNorm = new Map(lessons.map((l) => [norm(l.title), l]));

const tokenOf = (b) => (b.videoId || b.href || (b._source || "").split("/").pop() || "").toLowerCase();
const clean = (b) => { const c = { ...b }; delete c._note; delete c._source; delete c._PROVERITI; return c; };

let totalAdd = 0, totalSkip = 0, deferred = [];
for (const e of entries) {
  const lesson = byNorm.get(norm(e.lesson));
  if (!lesson) { console.log(`  ⚠️  lekcija nije nađena u bazi: "${e.lesson}" — preskačem`); continue; }
  const sections = [...(lesson.sections || [])];
  const blob = () => JSON.stringify(sections).toLowerCase();
  const toAdd = [];
  for (const it of e.items) {
    if (it.kind === "vimeo") { totalSkip++; continue; }                       // ručna provera
    let block = enrich(it.kind, clean(it.block));
    if (it.kind === "pdf") {
      // re-host sa starog WP
      const fn = (it.source || "").split("/").pop().split("?")[0];
      const dest = `kursevi/${course.slug}/${fn}`;
      if (blob().includes(fn.toLowerCase())) { totalSkip++; continue; }
      if (!APPLY) { block = { type: "pdf", url: `<re-host:${fn}>`, label: prettyFn(fn) }; }
      else {
        try {
          // node fetch blokiran WAF-om (TLS otisak) → skidamo curl-om u temp pa upload
          const tmp = `/tmp/wpbf_${fn}`;
          // /wp-content/ fajlovi su sad na old.hartweger.rs (www je novi app → 403)
          const src = it.source.replace(/:\/\/(www\.)?hartweger\.rs\//i, "://old.hartweger.rs/");
          execFileSync("curl", ["-fsSL", "--max-time", "40", "-o", tmp, src]);
          const buf = readFileSync(tmp);
          if (buf.length < 1000 || buf.slice(0, 4).toString() !== "%PDF") throw new Error("nije validan PDF");
          const { error } = await sb.storage.from("blog-media").upload(dest, buf, { contentType: "application/pdf", upsert: true });
          if (error) throw error;
          try { unlinkSync(tmp); } catch {}
          block = { type: "pdf", url: sb.storage.from("blog-media").getPublicUrl(dest).data.publicUrl, label: prettyFn(fn) };
        } catch (err) { deferred.push(`${e.lesson} → ${fn} (${err.message})`); continue; }
      }
    } else {
      const tok = tokenOf(it.block);
      if (tok && blob().includes(tok)) { totalSkip++; continue; }
    }
    sections.push(block); toAdd.push(`${it.kind}:${block.label || block.videoId || block.href || block.url}`);
  }
  if (toAdd.length) {
    console.log(`  ${e.lesson}: + ${toAdd.join(" | ")}`);
    totalAdd += toAdd.length;
    if (APPLY) { const { error } = await sb.from("lessons").update({ sections }).eq("id", lesson.id); if (error) throw error; }
  }
}
console.log(`\n${APPLY ? "UPISANO" : "[DRY] bi dodalo"}: ${totalAdd} | preskočeno (već postoji/vimeo): ${totalSkip}`);
if (deferred.length) console.log(`PDF odloženo (stari WP nedostupan): ${deferred.length}\n  ` + deferred.join("\n  "));
if (!APPLY) console.log("\nDodaj --apply za upis.");
