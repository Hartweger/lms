/**
 * Izlistaj sve lekcije kursa (po order_index) — za proveru redosleda.
 * Run: npx tsx scripts/list-lessons.ts "B1.1"
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [key, ...v] = line.split("=");
  if (key && v.length > 0) process.env[key.trim()] = v.join("=").trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const filter = process.argv[2];
if (!filter) {
  console.error('Daj naziv: npx tsx scripts/list-lessons.ts "B1.1"');
  process.exit(1);
}

async function main() {
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .ilike("title", `%${filter}%`);
  if (!courses || courses.length === 0) {
    console.error(`Nema kursa "${filter}".`);
    process.exit(1);
  }
  for (const course of courses) {
    const { data: lessons } = await supabase
      .from("lessons")
      .select("id, title, order_index, sections")
      .eq("course_id", course.id)
      .order("order_index");
    console.log(`\n===== ${course.title}  (${course.id}) — ${lessons?.length ?? 0} lekcija =====`);
    for (const l of lessons ?? []) {
      const badge = ((l.sections as { type: string; module?: string }[] | null) ?? []).find((s) => s.type === "badge");
      const mod = badge?.module ? `  [${badge.module}]` : "";
      console.log(`  ${String(l.order_index).padStart(3)}  ${l.title}${mod}`);
    }
  }
}

main();
