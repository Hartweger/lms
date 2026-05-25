/**
 * Migrate LearnDash progress to new LMS
 * Run: npx tsx scripts/migrate-learndash-progress.ts
 *
 * Reads LearnDash CSV export and marks lessons as completed
 * based on the number of steps completed in each course.
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

// Map LearnDash course names to LMS slugs
const COURSE_MAP: Record<string, string> = {
  "A1.1": "nemacki-a1-1",
  "A1.2": "nemacki-a1-2",
  "A2.1": "nemacki-a2-1",
  "A2.2": "nemacki-a2-2",
  "B1.1": "nemacki-b1-1",
  "B1.2": "nemacki-b1-2",
  "B2.1": "nemacki-b2-1",
  "Položi FSP": "polozi-fsp",
  "Položi fide test": "polozi-fide",
  "Položi C1": "polozi-c1",
  "Položi GOETHE B1": "polozi-goethe-b1",
  "Kurs konvezacije 1": "kurs-konverzacije",
  "Kurs za mame i trudnice – nemački jezik za svakodnevne situacije": "kurs-za-mame",
  "Gramatika A2-B1": "gramatika-a2-b1",
};

interface CsvRow {
  email: string;
  courseName: string;
  completedSteps: number;
  totalSteps: number;
  courseCompleted: boolean;
}

function parseCsv(filePath: string): CsvRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  // Handle different line endings (\r, \n, \r\n)
  const lines = content.split(/\r\n|\r|\n/);
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parse (no quotes in these fields)
    const parts = line.split(",");
    const email = parts[2]?.trim();
    const courseName = parts[4]?.trim();
    const completedSteps = parseInt(parts[5] || "0") || 0;
    const totalSteps = parseInt(parts[6] || "0") || 0;
    const courseCompleted = parts[7]?.trim() === "DA";

    if (email && courseName && completedSteps > 0) {
      rows.push({ email, courseName, completedSteps, totalSteps, courseCompleted });
    }
  }

  return rows;
}

async function main() {
  const csvPath = path.resolve(__dirname, "../../../learndash/learndash_reports_user_courses_e5a77005f0_08a6632.csv");

  if (!fs.existsSync(csvPath)) {
    console.error("CSV not found:", csvPath);
    return;
  }

  console.log("Parsing LearnDash CSV...");
  const rows = parseCsv(csvPath);
  console.log(`Found ${rows.length} progress entries\n`);

  // Pre-load all courses and their lessons
  const courseCache: Record<string, { id: string; lessons: { id: string; order_index: number }[] }> = {};

  for (const [ldName, slug] of Object.entries(COURSE_MAP)) {
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!course) continue;

    const { data: lessons } = await supabase
      .from("lessons")
      .select("id, order_index")
      .eq("course_id", course.id)
      .order("order_index");

    if (lessons) {
      courseCache[ldName] = { id: course.id, lessons };
    }
  }

  console.log(`Loaded ${Object.keys(courseCache).length} courses\n`);

  // Pre-load all user profiles by email
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, email");

  const emailToUserId: Record<string, string> = {};
  for (const p of profiles ?? []) {
    if (p.email) emailToUserId[p.email.toLowerCase()] = p.id;
  }
  console.log(`Loaded ${Object.keys(emailToUserId).length} user profiles\n`);

  // Process progress
  let migrated = 0;
  let skipped = 0;
  let noUser = 0;
  let noCourse = 0;

  // Batch progress records
  const progressRecords: { user_id: string; lesson_id: string; completed: boolean; completed_at: string }[] = [];

  for (const row of rows) {
    const userId = emailToUserId[row.email.toLowerCase()];
    if (!userId) {
      noUser++;
      continue;
    }

    const courseData = courseCache[row.courseName];
    if (!courseData) {
      noCourse++;
      continue;
    }

    // Calculate how many lessons to mark as completed
    // LearnDash "steps" include lessons + quizzes, our LMS only has lessons
    // Use ratio: (completedSteps / totalSteps) * ourLessonsCount
    const ratio = row.totalSteps > 0 ? row.completedSteps / row.totalSteps : 0;
    const lessonsToMark = Math.round(ratio * courseData.lessons.length);

    if (lessonsToMark === 0) {
      skipped++;
      continue;
    }

    // Mark first N lessons as completed
    const lessonsToComplete = courseData.lessons
      .sort((a, b) => a.order_index - b.order_index)
      .slice(0, lessonsToMark);

    for (const lesson of lessonsToComplete) {
      progressRecords.push({
        user_id: userId,
        lesson_id: lesson.id,
        completed: true,
        completed_at: new Date().toISOString(),
      });
    }

    migrated++;
  }

  console.log(`Prepared ${progressRecords.length} progress records for ${migrated} users\n`);

  // Insert in batches of 500
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < progressRecords.length; i += BATCH_SIZE) {
    const batch = progressRecords.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("lesson_progress")
      .upsert(batch, { onConflict: "user_id,lesson_id" });

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
    } else {
      inserted += batch.length;
      process.stdout.write(`\r  Inserted: ${inserted}/${progressRecords.length}`);
    }
  }

  console.log("\n\nDone!");
  console.log(`  Migrated: ${migrated} users`);
  console.log(`  Progress records: ${inserted}`);
  console.log(`  Skipped (0 progress): ${skipped}`);
  console.log(`  No user in LMS: ${noUser}`);
  console.log(`  No course mapped: ${noCourse}`);
}

main().catch(console.error);
