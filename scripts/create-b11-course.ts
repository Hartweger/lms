/**
 * Create B1.1 course in Supabase
 * Run: npx tsx scripts/create-b11-course.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join("=").trim();
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Check if course already exists
  const { data: existing } = await supabase
    .from("courses")
    .select("id, title")
    .eq("slug", "nemacki-b1-1")
    .single();

  if (existing) {
    console.log(`Course already exists: ${existing.title} (${existing.id})`);
    return;
  }

  const { data, error } = await supabase
    .from("courses")
    .insert({
      title: "Nemački B1.1",
      slug: "nemacki-b1-1",
      description: "Kurs nemačkog jezika B1.1 prema Schritte International Neu 5 (Lektionen 1-7). Gramatika, vokabular i priprema za ispit B1.",
      course_type: "video",
      is_published: false,
    })
    .select("id, title, slug")
    .single();

  if (error) {
    console.error("Error creating course:", error.message);
    return;
  }

  console.log(`Course created: ${data.title} (${data.id})`);
  console.log(`Slug: ${data.slug}`);
}

main().catch(console.error);
