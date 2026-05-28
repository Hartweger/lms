import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  // Get student profile
  const { data: student } = await admin
    .from("user_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get courses, access, and progress
  const { data: courses } = await admin.from("courses").select("*");

  const { data: access } = await admin
    .from("course_access")
    .select("id, course_id, granted_at, expires_at")
    .eq("user_id", id)
    .order("granted_at", { ascending: false });

  // Get lesson progress per course
  const progressList = [];
  for (const acc of access ?? []) {
    const course = courses?.find((c: { id: string }) => c.id === acc.course_id);
    if (!course) continue;

    const { data: lessons } = await admin
      .from("lessons")
      .select("id, title, order_index")
      .eq("course_id", course.id)
      .order("order_index");

    if (!lessons || lessons.length === 0) continue;

    const { data: completed } = await admin
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", id)
      .eq("completed", true)
      .in("lesson_id", lessons.map((l: { id: string }) => l.id));

    const completedIds = new Set(completed?.map((p: { lesson_id: string }) => p.lesson_id) ?? []);

    progressList.push({
      courseTitle: course.title,
      courseSlug: course.slug,
      lessons: lessons.map((l: { id: string; title: string }) => ({
        id: l.id,
        title: l.title,
        completed: completedIds.has(l.id),
      })),
      completedCount: completedIds.size,
      totalCount: lessons.length,
    });
  }

  return NextResponse.json({ student, courses, access, lessonProgress: progressList });
}
