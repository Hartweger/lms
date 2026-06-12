/**
 * Upload PDF-ova reči (scripts/flashcards/pdf/<prefix>-modul-N.pdf) na Storage
 * (blog-media/flashcards/) + „Preuzmi reči (PDF)" dugme u „Modul N — Reči" lekcije.
 * Idempotentno: upsert fajla, zamena pdf sekcije (wordset blok ostaje).
 *
 *   node scripts/attach-reci-pdf-generic.mjs <slug> <prefix> [--apply]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const [slug, prefix] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!slug || !prefix) { console.error("Upotreba: node scripts/attach-reci-pdf-generic.mjs <slug> <prefix> [--apply]"); process.exit(1); }
const BUCKET = "blog-media";

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: course } = await sb.from("courses").select("id,title").eq("slug", slug).single();
const { data: lessons } = await sb.from("lessons").select("id,title,sections").eq("course_id", course.id).order("order_index");

for (const l of lessons) {
  const m = l.title.match(/^Modul\s*(\d+)\s*—\s*Reči$/);
  if (!m) continue;
  const n = Number(m[1]);
  const file = path.join(__dirname, "flashcards", "pdf", `${prefix}-modul-${n}.pdf`);
  const key = `flashcards/${prefix}-modul-${n}.pdf`;
  if (!fs.existsSync(file)) { console.warn(`! nema PDF za Modul ${n}`); continue; }
  if (!APPLY) { console.log(`Modul ${n}: upload ${key} + pdf dugme (dry-run)`); continue; }

  const { error: ue } = await sb.storage.from(BUCKET).upload(key, fs.readFileSync(file), { contentType: "application/pdf", upsert: true });
  if (ue) { console.error(`Modul ${n}: upload GREŠKA ${ue.message}`); continue; }
  const url = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
  const secs = (l.sections || []).filter((s) => s.type !== "pdf");
  secs.push({ type: "pdf", url, label: "Preuzmi reči (PDF)" });
  const { error: le } = await sb.from("lessons").update({ sections: secs }).eq("id", l.id);
  console.log(`Modul ${n}: ${le ? "GREŠKA " + le.message : "OK → " + url}`);
}
console.log(APPLY ? "GOTOVO ✓" : "(dry-run)");
