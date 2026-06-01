// READ-ONLY: dump B1.2 lekcija (order_index, title, sekcije) radi pregleda pre izmena.
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: course } = await sb.from("courses").select("id, title, slug").eq("slug", "nemacki-b1-2").single();
console.log("KURS:", course?.title, course?.id);
const { data: lessons } = await sb.from("lessons").select("id, order_index, title, sections").eq("course_id", course.id).order("order_index");
console.log("LEKCIJA:", lessons.length);
for (const l of lessons) {
  const types = (l.sections || []).map((s) => s.type).join(",");
  console.log(`  #${l.order_index}  ${l.title}  [${types}]`);
}
writeFileSync("scripts/b12-dump.json", JSON.stringify(lessons, null, 2));
console.log("\n→ pun dump u scripts/b12-dump.json");
