import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCourseCompletedEmail } from "@/lib/email";

/**
 * Issue a course certificate - server-side only.
 *
 * The client no longer inserts into `certificates` (RLS denies it). This route
 * authenticates the user, recomputes the Modelltest result from STORED
 * exercise_attempts (best attempt per sibling exercise on the lesson), and
 * issues the certificate only when the total is >= 60%. Idempotent on the
 * unique(user_id, course_id) constraint.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { lessonId?: string; courseId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const { lessonId, courseId } = body;
  if (!lessonId || !courseId) {
    return NextResponse.json({ error: "Missing lessonId or courseId" }, { status: 400 });
  }

  const admin = createAdminClient();

  // The lesson must actually belong to the claimed course.
  const { data: lesson } = await admin
    .from("lessons")
    .select("id, course_id")
    .eq("id", lessonId)
    .single();
  if (!lesson || lesson.course_id !== courseId) {
    return NextResponse.json({ error: "Lesson/course mismatch" }, { status: 400 });
  }

  // All exercises on this lesson.
  const { data: exercises } = await admin
    .from("exercises")
    .select("id")
    .eq("lesson_id", lessonId);
  const exerciseIds = (exercises ?? []).map((e: { id: string }) => e.id);
  if (exerciseIds.length === 0) {
    return NextResponse.json({ eligible: false, percent: 0 });
  }

  // Best attempt per exercise for this user (recomputed server-side).
  const { data: attempts } = await admin
    .from("exercise_attempts")
    .select("exercise_id, score, total_questions")
    .eq("user_id", user.id)
    .in("exercise_id", exerciseIds);

  const bestByExercise = new Map<string, { score: number; total: number }>();
  for (const a of attempts ?? []) {
    const prev = bestByExercise.get(a.exercise_id);
    if (!prev || a.score > prev.score) {
      bestByExercise.set(a.exercise_id, { score: a.score, total: a.total_questions });
    }
  }

  // Require the whole Modelltest to be attempted - otherwise a single easy
  // exercise at 100% could clear the 60% bar on a partial set.
  if (bestByExercise.size < exerciseIds.length) {
    return NextResponse.json({ eligible: false, percent: 0, reason: "incomplete" });
  }

  let sumScore = 0;
  let sumTotal = 0;
  for (const { score, total } of bestByExercise.values()) {
    sumScore += score;
    sumTotal += total;
  }
  const percent = sumTotal > 0 ? Math.round((sumScore / sumTotal) * 100) : 0;

  if (percent < 60) {
    return NextResponse.json({ eligible: false, percent });
  }

  // Idempotent issue.
  const { data: existing } = await admin
    .from("certificates")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ eligible: true, percent, certificateId: existing.id });
  }

  const { data: created, error } = await admin
    .from("certificates")
    .insert({ user_id: user.id, course_id: courseId })
    .select("id")
    .single();
  if (error || !created) {
    // Possible race on the unique constraint - re-read.
    const { data: again } = await admin
      .from("certificates")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();
    if (again) {
      return NextResponse.json({ eligible: true, percent, certificateId: again.id });
    }
    return NextResponse.json({ error: "Issue failed" }, { status: 500 });
  }

  // Čestitka + link ka sertifikatu - SAMO pri prvom izdavanju (unique user+course garantuje
  // jedno slanje; postojeći sertifikat se vraća iznad bez mejla). Best-effort, ne blokira odgovor.
  try {
    const [{ data: profile }, { data: course }] = await Promise.all([
      admin.from("user_profiles").select("email, full_name").eq("id", user.id).single(),
      admin.from("courses").select("title").eq("id", courseId).single(),
    ]);
    if (profile?.email) {
      await sendCourseCompletedEmail(profile.email, profile.full_name || "", course?.title ?? "Kurs", created.id);
    }
  } catch (e) {
    console.error("[certificate] Slanje čestitke palo:", e);
  }

  return NextResponse.json({ eligible: true, percent, certificateId: created.id });
}
