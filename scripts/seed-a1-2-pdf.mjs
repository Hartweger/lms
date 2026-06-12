/** Upload A1.2 PDF-ova (moduli + ispit) + „Preuzmi reči (PDF)" dugme. node scripts/seed-a1-2-pdf.mjs --apply */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const COURSE_ID = "3dc26901-a719-43d5-96eb-5c95de5322cc";
const BUCKET = "blog-media";

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: lessons } = await sb.from("lessons").select("id,title,sections").eq("course_id", COURSE_ID).order("order_index");

async function attach(lesson, pdfName, key) {
  const file = path.join(__dirname, "flashcards", "pdf", pdfName);
  if (!fs.existsSync(file)) { console.warn(`! nema ${pdfName}`); return; }
  if (!APPLY) { console.log(`${lesson.title}: + ${key} (dry-run)`); return; }
  const { error: ue } = await sb.storage.from(BUCKET).upload(key, fs.readFileSync(file), { contentType: "application/pdf", upsert: true });
  if (ue) { console.error(`${lesson.title}: upload GREŠKA ${ue.message}`); return; }
  const url = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
  const secs = (lesson.sections || []).filter((s) => s.type !== "pdf");
  secs.push({ type: "pdf", url, label: "Preuzmi reči (PDF)" });
  const { error: le } = await sb.from("lessons").update({ sections: secs }).eq("id", lesson.id);
  console.log(`${lesson.title}: ${le ? "GREŠKA " + le.message : "OK"}`);
}

for (const l of lessons) {
  const m = l.title.match(/^Modul\s*(\d+)\s*[—-]\s*Reči$/);
  if (m) await attach(l, `a1-2-lektion-${m[1]}.pdf`, `flashcards/a1-2-lektion-${m[1]}.pdf`);
  else if (/Reči za ispit A1/i.test(l.title)) await attach(l, "a1-2-ispit-a1.pdf", "flashcards/a1-2-ispit-a1.pdf");
}
console.log(APPLY ? "GOTOVO ✓" : "(dry-run)");
