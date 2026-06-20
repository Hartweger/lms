/**
 * Dump trenutnog sadržaja Willkommen A1.1 lekcije (read-only, backup).
 * Run: npx tsx scripts/willkommen-a11-dump.ts
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

const LESSON_ID = "734aca58-2063-463b-9b19-a458c9ce126f";

async function main() {
  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, course_id, order_index, sections")
    .eq("id", LESSON_ID)
    .single();

  if (error || !data) {
    console.error("Greška:", error);
    process.exit(1);
  }

  const outPath = path.resolve(__dirname, "willkommen-a11-backup.json");
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Naslov: ${data.title}`);
  console.log(`Broj sekcija: ${(data.sections ?? []).length}`);
  console.log(`Backup snimljen: ${outPath}`);
  console.log("\n--- TIPOVI SEKCIJA ---");
  for (const [i, s] of (data.sections ?? []).entries()) {
    console.log(`${i}: ${s.type}${s.style ? " ("+s.style+")" : ""}${s.linkType ? " ["+s.linkType+"]" : ""}`);
  }
}

main();
