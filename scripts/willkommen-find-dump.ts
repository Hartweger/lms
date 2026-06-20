/**
 * Nađi Willkommen (prvu) lekciju kursa po nazivu i napravi backup njenog sadržaja.
 * Run: npx tsx scripts/willkommen-find-dump.ts "A1.2"
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
  console.error('Daj naziv nivoa, npr: npx tsx scripts/willkommen-find-dump.ts "A1.2"');
  process.exit(1);
}

async function main() {
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug")
    .ilike("title", `%${filter}%`);

  if (!courses || courses.length === 0) {
    console.error(`Nema kursa koji sadrži "${filter}".`);
    process.exit(1);
  }
  console.log("Pronađeni kursevi:");
  for (const c of courses) console.log(`  - ${c.title}  (${c.id})`);

  // Uzmi prvi koji najpreciznije odgovara
  const course = courses[0];

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, order_index, sections")
    .eq("course_id", course.id)
    .order("order_index");

  if (!lessons || lessons.length === 0) {
    console.error("Kurs nema lekcije.");
    process.exit(1);
  }

  const willkommen = lessons[0];
  const firstReal = lessons[1];
  const safe = filter.replace(/[^A-Za-z0-9.]/g, "");
  const outPath = path.resolve(__dirname, `willkommen-${safe}-backup.json`);
  fs.writeFileSync(
    outPath,
    JSON.stringify({ course: { id: course.id, title: course.title }, willkommen, firstReal: firstReal && { id: firstReal.id, title: firstReal.title } }, null, 2),
    "utf-8"
  );

  console.log(`\nKurs: ${course.title}`);
  console.log(`Willkommen lekcija: „${willkommen.title}"  id=${willkommen.id}  (sekcija: ${(willkommen.sections ?? []).length})`);
  console.log(`Prva lekcija (CTA): „${firstReal?.title}"  id=${firstReal?.id}`);
  console.log(`Backup: ${outPath}`);
}

main();
