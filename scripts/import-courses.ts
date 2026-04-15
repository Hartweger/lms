/**
 * Import all courses and lessons into Supabase
 * Run: npx tsx scripts/import-courses.ts
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load env vars FIRST
const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join("=").trim();
  }
}

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface LessonData {
  title: string;
  lesson_type: string;
  order_index: number;
  vimeo_video_id?: string;
  is_free_preview?: boolean;
  content?: string;
}

interface CourseData {
  title: string;
  slug: string;
  description: string;
  course_type: string;
  price: number;
  is_published: boolean;
  lessons: LessonData[];
}

async function importCourses() {
  const raw = fs.readFileSync("scripts/course-data.json", "utf-8");
  const { courses } = JSON.parse(raw) as { courses: CourseData[] };

  console.log(`\nImporting ${courses.length} courses...\n`);

  let totalLessons = 0;
  let totalVideos = 0;

  for (const course of courses) {
    // Check if course already exists
    const { data: existing } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", course.slug)
      .single();

    if (existing) {
      console.log(`  ⏭  ${course.title} — already exists, skipping`);
      continue;
    }

    // Create course
    const { data: newCourse, error: courseError } = await supabase
      .from("courses")
      .insert({
        title: course.title,
        slug: course.slug,
        description: course.description,
        course_type: course.course_type,
        price: course.price,
        is_published: course.is_published,
      })
      .select("id")
      .single();

    if (courseError || !newCourse) {
      console.error(`  ✗ ${course.title} — FAILED:`, courseError?.message);
      continue;
    }

    // Create lessons
    let lessonCount = 0;
    let videoCount = 0;

    for (const lesson of course.lessons) {
      const { error: lessonError } = await supabase
        .from("lessons")
        .insert({
          course_id: newCourse.id,
          title: lesson.title,
          lesson_type: lesson.lesson_type,
          content: lesson.content || "",
          vimeo_video_id: lesson.vimeo_video_id || null,
          order_index: lesson.order_index,
          is_free_preview: lesson.is_free_preview || false,
        });

      if (lessonError) {
        console.error(`    ✗ Lesson "${lesson.title}" — FAILED:`, lessonError.message);
      } else {
        lessonCount++;
        if (lesson.vimeo_video_id) videoCount++;
      }
    }

    totalLessons += lessonCount;
    totalVideos += videoCount;
    console.log(`  ✓ ${course.title} — ${lessonCount} lekcija (${videoCount} videa)`);
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  Kursevi: ${courses.length}`);
  console.log(`  Lekcije: ${totalLessons}`);
  console.log(`  Videa: ${totalVideos}`);
  console.log(`═══════════════════════════════════════\n`);
}

importCourses().catch(console.error);
