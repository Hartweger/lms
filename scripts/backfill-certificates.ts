/**
 * Backfill certificates for users who already qualify on a Modelltest but never
 * got a certificate (e.g. they passed during the window after migration 027
 * removed client-side cert insertion, before the new /api/certificate route was
 * deployed).
 *
 * Eligibility mirrors /api/certificate exactly:
 *   - lesson title contains "Modelltest"
 *   - user attempted ALL exercises on that lesson (full coverage)
 *   - sum(best score per exercise) / sum(best total) >= 60%
 *
 * Uses the service-role key (bypasses RLS). Dry-run by default.
 *
 *   npx tsx scripts/backfill-certificates.ts           # dry-run: report only
 *   npx tsx scripts/backfill-certificates.ts --apply    # issue missing certs
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("=");
  if (k && v.length) process.env[k.trim()] = v.join("=").trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(`Certificate backfill — mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

  // 1. Modelltest lessons (+ their course).
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, course_id")
    .ilike("title", "%modelltest%");
  if (!lessons || lessons.length === 0) {
    console.log("No Modelltest lessons found.");
    return;
  }
  console.log(`Found ${lessons.length} Modelltest lessons.\n`);

  // qualifying (user_id, course_id) pairs
  const qualifying = new Map<string, { userId: string; courseId: string; percent: number }>();

  for (const lesson of lessons) {
    const { data: exercises } = await supabase
      .from("exercises")
      .select("id")
      .eq("lesson_id", lesson.id);
    const exerciseIds = (exercises ?? []).map((e: { id: string }) => e.id);
    if (exerciseIds.length === 0) continue;

    const { data: attempts } = await supabase
      .from("exercise_attempts")
      .select("user_id, exercise_id, score, total_questions")
      .in("exercise_id", exerciseIds);

    // group: user -> exercise -> best
    const byUser = new Map<string, Map<string, { score: number; total: number }>>();
    for (const a of attempts ?? []) {
      if (!byUser.has(a.user_id)) byUser.set(a.user_id, new Map());
      const exMap = byUser.get(a.user_id)!;
      const prev = exMap.get(a.exercise_id);
      if (!prev || a.score > prev.score) exMap.set(a.exercise_id, { score: a.score, total: a.total_questions });
    }

    let lessonQualified = 0;
    let lessonPartial = 0;
    for (const [userId, exMap] of byUser.entries()) {
      const fullCoverage = exMap.size >= exerciseIds.length;
      let sumScore = 0, sumTotal = 0;
      for (const { score, total } of exMap.values()) { sumScore += score; sumTotal += total; }
      const percent = sumTotal > 0 ? Math.round((sumScore / sumTotal) * 100) : 0;
      if (percent >= 60 && !fullCoverage) lessonPartial++;
      if (percent >= 60 && fullCoverage) {
        lessonQualified++;
        const key = `${userId}:${lesson.course_id}`;
        const existing = qualifying.get(key);
        if (!existing || percent > existing.percent) {
          qualifying.set(key, { userId, courseId: lesson.course_id, percent });
        }
      }
    }
    console.log(
      `  [${lesson.title}] exercises=${exerciseIds.length}, qualified(full)=${lessonQualified}, qualified-but-partial(skipped)=${lessonPartial}`
    );
  }

  // 2. Filter out users who already have a certificate for that course.
  const pairs = [...qualifying.values()];
  let toIssue = 0, already = 0;
  const inserts: { user_id: string; course_id: string }[] = [];
  for (const { userId, courseId } of pairs) {
    const { data: existing } = await supabase
      .from("certificates")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();
    if (existing) { already++; continue; }
    toIssue++;
    inserts.push({ user_id: userId, course_id: courseId });
  }

  console.log(`\nQualifying (user,course) pairs: ${pairs.length}`);
  console.log(`  already have certificate: ${already}`);
  console.log(`  NEW certificates to issue: ${toIssue}`);

  if (!APPLY) {
    console.log("\nDry-run only — re-run with --apply to issue the certificates.");
    return;
  }

  let ok = 0, err = 0;
  for (const row of inserts) {
    const { error } = await supabase.from("certificates").insert(row);
    if (error) { err++; console.error(`  ERROR ${row.user_id}/${row.course_id}: ${error.message}`); }
    else ok++;
  }
  console.log(`\nIssued: ${ok}, errors: ${err}`);
}

main().catch(console.error);
