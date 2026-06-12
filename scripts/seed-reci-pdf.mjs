/**
 * Kači PDF priručnike na Supabase Storage (bucket blog-media/flashcards/) i dodaje
 * „Preuzmi reči (PDF)" dugme (pdf blok) u svaku „Modul N — Reči" lekciju A1.1.
 * Idempotentno: upsert fajla + zamena pdf sekcije (zadržava wordset blok).
 *
 *   node scripts/seed-reci-pdf.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const COURSE_ID = "0e9a62b5-9b1c-44b6-a8cb-9b1985abe0cb";
const BUCKET = "blog-media";

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: lessons, error } = await sb.from("lessons")
  .select("id,title,sections").eq("course_id", COURSE_ID).order("order_index");
if (error) { console.error("ERR:", error.message); process.exit(1); }

for (const l of lessons) {
  const m = l.title.match(/^Modul\s*(\d+)\s*[—-]\s*Reči$/);
  if (!m) continue;
  const n = Number(m[1]);
  const file = path.join(__dirname, "flashcards", "pdf", `a1-1-lektion-${n}.pdf`);
  const key = `flashcards/a1-1-lektion-${n}.pdf`;
  if (!fs.existsSync(file)) { console.warn(`! nema PDF za Modul ${n}`); continue; }

  if (!APPLY) { console.log(`Modul ${n}: upload ${key} + pdf dugme (dry-run)`); continue; }

  const { error: ue } = await sb.storage.from(BUCKET).upload(key, fs.readFileSync(file), {
    contentType: "application/pdf", upsert: true,
  });
  if (ue) { console.error(`Modul ${n}: upload GREŠKA ${ue.message}`); continue; }
  const url = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;

  // zadrži wordset blok, zameni/dodaj pdf blok
  const secs = Array.isArray(l.sections) ? l.sections.filter((s) => s.type !== "pdf") : [];
  secs.push({ type: "pdf", url, label: "Preuzmi reči (PDF)" });
  const { error: le } = await sb.from("lessons").update({ sections: secs }).eq("id", l.id);
  console.log(`Modul ${n}: ${le ? "GREŠKA " + le.message : "PDF + dugme OK → " + url}`);
}
console.log(APPLY ? "GOTOVO ✓" : "(dry-run — dodaj --apply)");
