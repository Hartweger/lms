import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInactivityReminder } from "@/lib/email";

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Find users with active course access who haven't completed a lesson in 7+ days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // Get all students with active access
  const { data: activeAccess } = await supabase
    .from("course_access")
    .select("user_id, course_id, courses:course_id (title)")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (!activeAccess || activeAccess.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Group by user
  const userCourses = new Map<string, { courseId: string; title: string }[]>();
  for (const a of activeAccess) {
    const list = userCourses.get(a.user_id) ?? [];
    const course = a.courses as unknown as { title: string } | null;
    list.push({ courseId: a.course_id, title: course?.title ?? "" });
    userCourses.set(a.user_id, list);
  }

  let sent = 0;

  for (const [userId, courses] of userCourses) {
    // Check last activity
    const { data: lastProgress } = await supabase
      .from("lesson_progress")
      .select("completed_at")
      .eq("user_id", userId)
      .eq("completed", true)
      .order("completed_at", { ascending: false })
      .limit(1);

    const lastActivity = lastProgress?.[0]?.completed_at;

    // Skip if active within last 7 days
    if (lastActivity && new Date(lastActivity) > sevenDaysAgo) continue;

    // Skip if never had activity (brand new user — they'll get welcome email)
    if (!lastActivity && !lastProgress?.length) continue;

    // Get user info
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (!profile?.email) continue;

    // Skip if we already sent a reminder in the last 14 days
    const { data: recentReminder } = await supabase
      .from("inactivity_reminders")
      .select("id")
      .eq("user_id", userId)
      .gte("sent_at", fourteenDaysAgo.toISOString())
      .limit(1);

    if (recentReminder && recentReminder.length > 0) continue;

    // Find their most recent course and next lesson
    const primaryCourse = courses[0];
    let nextLessonTitle: string | null = null;

    const { data: lessons } = await supabase
      .from("lessons")
      .select("id, title, order_index")
      .eq("course_id", primaryCourse.courseId)
      .order("order_index");

    if (lessons && lessons.length > 0) {
      const { data: completed } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .eq("completed", true)
        .in("lesson_id", lessons.map((l) => l.id));

      const completedIds = new Set(completed?.map((c) => c.lesson_id) ?? []);
      const nextLesson = lessons.find((l) => !completedIds.has(l.id));
      nextLessonTitle = nextLesson?.title ?? null;
    }

    await sendInactivityReminder(
      profile.email,
      profile.full_name ?? "",
      primaryCourse.title,
      nextLessonTitle
    );

    // Log the reminder so we don't send again for 14 days
    await supabase
      .from("inactivity_reminders")
      .insert({ user_id: userId });

    sent++;
  }

  console.log(`[cron/inactivity] Sent ${sent} reminder emails`);
  return NextResponse.json({ sent });
}
