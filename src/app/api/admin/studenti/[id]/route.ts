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

  // Uplate (narudžbine) ovog polaznika
  const { data: orders } = await admin
    .from("orders")
    .select("order_number, items, total, payment_status, payment_method, created_at, fiscal_referent_number, coupon_code")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  // Individualni upisi (+ ime profesora i naziv kursa)
  const { data: indRaw } = await admin
    .from("individual_enrollments")
    .select("id, course_id, professor_id, package_lessons, lessons_used, expires_at, status, created_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false });
  const profIds = [...new Set((indRaw ?? []).map((e) => e.professor_id).filter(Boolean))];
  const { data: profs } = profIds.length
    ? await admin.from("user_profiles").select("id, full_name").in("id", profIds)
    : { data: [] };
  const profName = new Map((profs ?? []).map((p) => [p.id, p.full_name as string]));
  const courseTitle = new Map((courses ?? []).map((c: { id: string; title: string }) => [c.id, c.title]));
  const individualEnrollments = (indRaw ?? []).map((e) => ({
    id: e.id,
    courseTitle: courseTitle.get(e.course_id) ?? "-",
    professorId: e.professor_id,
    professor: e.professor_id ? (profName.get(e.professor_id) ?? "-") : "-",
    packageLessons: e.package_lessons,
    lessonsUsed: e.lessons_used,
    expiresAt: e.expires_at,
    status: e.status,
  }));

  // Lista profesora (za admin zamenu profesora na 1:1 upisu)
  const { data: allProfs } = await admin
    .from("user_profiles").select("id, full_name").eq("role", "professor").order("full_name");

  // Grupni upisi (+ nivo grupe)
  const { data: geRaw } = await admin
    .from("group_enrollments")
    .select("group_id, status, enrolled_at")
    .eq("user_id", id)
    .order("enrolled_at", { ascending: false });
  const groupIds = [...new Set((geRaw ?? []).map((e) => e.group_id))];
  const { data: groups } = groupIds.length
    ? await admin.from("groups").select("id, level, type, status, end_date").in("id", groupIds)
    : { data: [] };
  const groupMap = new Map((groups ?? []).map((g) => [g.id, g]));
  const groupEnrollments = (geRaw ?? []).map((e) => {
    const g = groupMap.get(e.group_id);
    return { level: g?.level ?? "-", type: g?.type ?? "", groupStatus: g?.status ?? "", endDate: g?.end_date ?? null, status: e.status, enrolledAt: e.enrolled_at };
  });

  // Poslednja prijava (iz auth-a)
  let lastSignIn: string | null = null;
  try {
    const { data: authUser } = await admin.auth.admin.getUserById(id);
    lastSignIn = authUser?.user?.last_sign_in_at ?? null;
  } catch { /* ignore */ }

  return NextResponse.json({
    student, courses, access, lessonProgress: progressList,
    orders: orders ?? [], individualEnrollments, groupEnrollments, lastSignIn,
    professors: allProfs ?? [],
  });
}
