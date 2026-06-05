/** Upload A2.1 modul PDF-ova + „Preuzmi reči (PDF)" dugme. node scripts/seed-a2-1-pdf.mjs --apply */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const COURSE_ID = "16a471dd-9544-4da1-8f74-a52469a6e726";
const BUCKET = "blog-media";

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data: lessons } = await sb.from("lessons").select("id,title,sections").eq("course_id", COURSE_ID).order("order_index");

for (const l of lessons) {
  const m = l.title.match(/^Modul\s*(\d+)\s*—\s*Reči$/);
  if (!m) continue;
  const n = m[1];
  const file = path.join(__dirname, "flashcards", "pdf", `a2-1-lektion-${n}.pdf`);
  const key = `flashcards/a2-1-lektion-${n}.pdf`;
  if (!fs.existsSync(file)) { console.warn(`! nema PDF ${n}`); continue; }
  if (!APPLY) { console.log(`${l.title}: + ${key} (dry-run)`); continue; }
  const { error: ue } = await sb.storage.from(BUCKET).upload(key, fs.readFileSync(file), { contentType: "application/pdf", upsert: true });
  if (ue) { console.error(`${l.title}: GREŠKA ${ue.message}`); continue; }
  const url = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
  const secs = (l.sections || []).filter((s) => s.type !== "pdf");
  secs.push({ type: "pdf", url, label: "Preuzmi reči (PDF)" });
  const { error: le } = await sb.from("lessons").update({ sections: secs }).eq("id", l.id);
  console.log(`${l.title}: ${le ? "GREŠKA " + le.message : "OK"}`);
}
console.log(APPLY ? "GOTOVO ✓" : "(dry-run)");
