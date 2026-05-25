/**
 * Create 27 empty lessons for the B1.1 course
 * Run: npx tsx scripts/create-b11-lessons.ts
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

const COURSE_SLUG = "nemacki-b1-1";

const LESSONS = [
  // Modul 1: Glück im Alltag
  { order: 0, title: "Rotkäppchen und das Präteritum" },
  { order: 1, title: "Als oder wenn" },
  { order: 2, title: "Glück" },
  { order: 3, title: "Schreiben B1 — E-Mail an einen Freund" },
  // Modul 2: Unterhaltung
  { order: 4, title: "Relativne rečenice" },
  { order: 5, title: "Obwohl vs. weil" },
  { order: 6, title: "Filme und Serien" },
  // Modul 3: Gesund bleiben
  { order: 7, title: "Genitiv" },
  { order: 8, title: "Pasiv prezenta sa modalnim glagolima" },
  { order: 9, title: "Profis gesucht: Krankenpfleger" },
  { order: 10, title: "Blutgruppen — wichtige Entdeckung" },
  { order: 11, title: "Pflegekrise — LV + Schreiben" },
  // Modul 4: Sprachen
  { order: 12, title: "Konjunktiv II — Irreale Wünsche" },
  { order: 13, title: "Sprechblockaden? Nur Mut!" },
  { order: 14, title: "Spielerisch Sprachen lernen — LV" },
  { order: 15, title: "Wortschatz B1 — Prüfungsvorbereitung" },
  // Modul 5: Eine Arbeit finden
  { order: 16, title: "Infinitiv mit zu" },
  { order: 17, title: "Jobsuche" },
  { order: 18, title: "Berufswechsel — LV" },
  { order: 19, title: "Geschlechtergerechte Sprache" },
  { order: 20, title: "Sprechen Prüfung B1 — Ein Thema präsentieren" },
  // Modul 6: Dienstleistung
  { order: 21, title: "Finalsätze (um+zu vs. damit)" },
  { order: 22, title: "Temporale Präpositionen + es gibt / es ist" },
  // Modul 7: Rund ums Wohnen
  { order: 23, title: "Zweiteilige Konnektoren" },
  { order: 24, title: "Konjunktiv II der Vergangenheit" },
  { order: 25, title: "Umzug — HV" },
  { order: 26, title: "Schreiben B1 — Hotel Mama" },
];

async function main() {
  // Find course by slug
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, title")
    .eq("slug", COURSE_SLUG)
    .single();

  if (courseError || !course) {
    console.error("Course not found:", courseError?.message);
    process.exit(1);
  }

  console.log(`Course found: ${course.title} (${course.id})`);

  // Fetch existing lessons for this course
  const { data: existingLessons, error: fetchError } = await supabase
    .from("lessons")
    .select("order_index")
    .eq("course_id", course.id);

  if (fetchError) {
    console.error("Failed to fetch existing lessons:", fetchError.message);
    process.exit(1);
  }

  const existingOrders = new Set(
    (existingLessons ?? []).map((l: { order_index: number }) => l.order_index)
  );

  let inserted = 0;
  let skipped = 0;

  for (const lesson of LESSONS) {
    if (existingOrders.has(lesson.order)) {
      console.log(`SKIP  [${lesson.order}] ${lesson.title}`);
      skipped++;
      continue;
    }

    const { error: insertError } = await supabase.from("lessons").insert({
      course_id: course.id,
      title: lesson.title,
      order_index: lesson.order,
      lesson_type: "text",
      is_free_preview: lesson.order === 0 || lesson.order === 1,
    });

    if (insertError) {
      console.error(`ERROR [${lesson.order}] ${lesson.title}: ${insertError.message}`);
    } else {
      console.log(`OK    [${lesson.order}] ${lesson.title}`);
      inserted++;
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
}

main();
