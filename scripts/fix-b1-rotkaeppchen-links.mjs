// UZORAK: vraća linkove/resurse koji su na WP-u bili u lekciji "Rotkäppchen und das Präteritum"
// (B1.1), a ispali su pri migraciji: Google Slides, članak (→ novi magazin), Rotkäppchen PDF
// (re-host na Supabase), Quizlet (link). Idempotentno (preskače već postojeće). Dry-run; --apply.
import { readFileSync } from "node:fs";
import { client, getCourse } from "./lib/exam-packer.mjs";

const APPLY = process.argv.includes("--apply");
const sb = client();
const BUCKET = "blog-media";
const PDF_SRC = "https://old.hartweger.rs/wp-content/uploads/2023/11/Rotkaeppchen.pdf";
const PDF_DEST = "kursevi/nemacki-b1-1/Rotkaeppchen.pdf";

const course = await getCourse(sb, "nemacki-b1-1");
const { data: lessons } = await sb.from("lessons").select("id,title,sections").eq("course_id", course.id).ilike("title", "%Rotk%");
if (!lessons?.length) throw new Error("lekcija Rotkäppchen nije nađena");
const lesson = lessons[0];
const sections = [...(lesson.sections || [])];

// postojeći href/url skup (idempotencija)
const has = (pred) => sections.some(pred);
const SLIDES = "https://docs.google.com/presentation/d/1VynKZ27WhlziTZBtFiMMEa7El9vSW0ionNKqVHkyEHc/edit?usp=sharing";
const ARTICLE = "/magazin/preterit-u-nemackom-jeziku";
const QUIZLET = "https://quizlet.com/859668554/match";

// PDF upload (samo na --apply)
let pdfUrl = sb.storage.from(BUCKET).getPublicUrl(PDF_DEST).data.publicUrl;
if (APPLY && !has((s) => s.type === "pdf" && /Rotkaeppchen/i.test(s.url || ""))) {
  const r = await fetch(PDF_SRC); if (!r.ok) throw new Error("PDF dl " + r.status);
  const { error } = await sb.storage.from(BUCKET).upload(PDF_DEST, Buffer.from(await r.arrayBuffer()), { contentType: "application/pdf", upsert: true });
  if (error) throw error;
  console.log("  ✓ Rotkaeppchen.pdf → Supabase");
}

const slidesBlk = { type: "link", linkType: "external", href: SLIDES, label: "📊 Präsentation ansehen" };
const articleBlk = { type: "link", linkType: "external", href: ARTICLE, label: "📜 Präteritum – Erklärung & Beispiel" };
const pdfBlk = { type: "pdf", url: pdfUrl, label: "📖 Märchen „Rotkäppchen“ lesen" };
const quizletBlk = { type: "link", linkType: "quizlet", href: QUIZLET, label: "📚 Wortschatz üben (Quizlet)" };

// gradi novi niz: Slides posle video; članak+PDF posle spoiler; Quizlet na kraj
const out = [];
let added = [];
for (const b of sections) {
  out.push(b);
  if (b.type === "video" && !has((s) => s.type === "link" && s.href === SLIDES)) { out.push(slidesBlk); added.push("Slides"); }
  if (b.type === "spoiler") {
    if (!has((s) => s.type === "link" && s.href === ARTICLE)) { out.push(articleBlk); added.push("članak"); }
    if (!has((s) => s.type === "pdf" && /Rotkaeppchen/i.test(s.url || ""))) { out.push(pdfBlk); added.push("PDF"); }
  }
}
if (!has((s) => s.type === "link" && s.href === QUIZLET)) { out.push(quizletBlk); added.push("Quizlet"); }

console.log(`Lekcija "${lesson.title}" (${lesson.id})`);
console.log("Trenutno blokova:", sections.length, "| dodajem:", added.length ? added.join(", ") : "ništa (sve već postoji)");
console.log("Novi raspored:", out.map((b) => b.type === "link" ? `link(${b.label})` : b.type === "pdf" ? "pdf(Rotkäppchen)" : b.type).join(" → "));

if (!APPLY) { console.log("[DRY] dodaj --apply za upis."); process.exit(0); }
if (!added.length) { console.log("Ništa za upis."); process.exit(0); }
const { error } = await sb.from("lessons").update({ sections: out }).eq("id", lesson.id);
if (error) throw error;
console.log("✓ Sekcije ažurirane.");
