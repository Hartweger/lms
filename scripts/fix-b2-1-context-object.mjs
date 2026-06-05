// FIX: options.context je bio STRING → grupni prikaz ne prikazuje tekst.
// Prebacuje u objekat { type:"text", title, content }. Idempotentno. --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const CID = "3729f3f5-2582-44ff-bb10-c4cc2ab5676b";

const { data: lessons } = await sb.from("lessons").select("id,title").eq("course_id", CID);
let fixed = 0, checked = 0;
for (const l of lessons) {
  const { data: exs } = await sb.from("exercises").select("id,title").eq("lesson_id", l.id);
  for (const ex of exs) {
    const { data: qs } = await sb.from("exercise_questions").select("id,options").eq("exercise_id", ex.id);
    for (const q of qs) {
      const o = q.options;
      if (!o || typeof o !== "object" || typeof o.context !== "string") continue;
      checked++;
      const titleMatch = o.context.match(/\*\*(.+?)\*\*/);
      const title = titleMatch ? titleMatch[1].trim() : "Lesetext";
      const newOptions = { ...o, context: { type: "text", title, content: o.context } };
      console.log(`${APPLY ? "fix" : "[dry]"} "${l.title}" / "${ex.title}" → title="${title}"`);
      if (APPLY) { const { error } = await sb.from("exercise_questions").update({ options: newOptions }).eq("id", q.id); if (error) throw error; }
      fixed++;
    }
  }
}
console.log(`\n${APPLY ? "✓ Ispravljeno" : "[DRY]"}: ${fixed} pitanja sa string-context → objekat.`);
