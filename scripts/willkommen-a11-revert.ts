/**
 * Vrati Willkommen A1.1 lekciju na staru verziju iz backup-a.
 * Run: npx tsx scripts/willkommen-a11-revert.ts
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
  const backupPath = path.resolve(__dirname, "willkommen-a11-backup.json");
  const backup = JSON.parse(fs.readFileSync(backupPath, "utf-8"));
  const { error } = await supabase
    .from("lessons")
    .update({ sections: backup.sections })
    .eq("id", LESSON_ID);
  if (error) {
    console.error("Greška:", error);
    process.exit(1);
  }
  console.log(`✅ Vraćeno na staru verziju (${backup.sections.length} sekcija).`);
}

main();
