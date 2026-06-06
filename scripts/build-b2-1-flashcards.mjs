// B2.1 — flashcards (kartice) iz već unetog vokabulara (front=nemački, back=srpski).
// Za svaku lekciju sa vocabulary sekcijom dodaje/zamenjuje flashcard sekciju (pre vocabulary).
// Idempotentno. Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const CID = "3729f3f5-2582-44ff-bb10-c4cc2ab5676b";

const { data: lessons } = await sb.from("lessons").select("id,title,sections,order_index").eq("course_id", CID).order("order_index");
let touched = 0;
for (const l of lessons) {
  const secs = Array.isArray(l.sections) ? l.sections : [];
  const voc = secs.find((s) => s.type === "vocabulary");
  if (!voc || !Array.isArray(voc.rows) || !voc.rows.length) continue;
  const items = voc.rows.map((r) => ({ front: r[0], back: r[1] }));
  const hadFc = secs.some((s) => s.type === "flashcard");
  console.log(`${hadFc ? "~" : "+"} "${l.title}": ${items.length} kartica ${hadFc ? "(zamena)" : "(dodavanje)"}`);
  touched++;
  if (!APPLY) continue;
  const base = secs.filter((s) => s.type !== "flashcard");
  const fc = { type: "flashcard", frontLabel: "Nemački", backLabel: "Prevod", items };
  const vIdx = base.findIndex((s) => s.type === "vocabulary");
  base.splice(vIdx, 0, fc); // ubaci flashcard tik pre vocabulary
  const { error } = await sb.from("lessons").update({ sections: base }).eq("id", l.id);
  if (error) throw error;
}
console.log(`\n${APPLY ? "✓ Gotovo" : "[DRY]"} — lekcija sa karticama: ${touched}`);
