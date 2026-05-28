import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: profId } = await params;
  const admin = createAdminClient();

  const [assignRes, studentRes, courseRes] = await Promise.all([
    admin.from("professor_students").select("id, student_id, course_id, assigned_via").eq("professor_id", profId),
    admin.from("user_profiles").select("id, full_name, email").eq("role", "student").order("full_name"),
    admin.from("courses").select("id, title"),
  ]);

  const studentMap = new Map(
    (studentRes.data ?? []).map((s: { id: string; full_name: string | null; email: string }) => [s.id, s])
  );
  const courseMap = new Map(
    (courseRes.data ?? []).map((c: { id: string; title: string }) => [c.id, c])
  );

  const assignments = (assignRes.data ?? []).map((a: { id: string; student_id: string; course_id: string; assigned_via: string }) => {
    const student = studentMap.get(a.student_id) as { full_name: string | null; email: string } | undefined;
    const course = courseMap.get(a.course_id) as { title: string } | undefined;
    return {
      id: a.id,
      student_id: a.student_id,
      course_id: a.course_id,
      assigned_via: a.assigned_via,
      student_name: student?.full_name ?? "",
      student_email: student?.email ?? "",
      course_title: course?.title ?? "Nepoznat kurs",
    };
  });

  const students = (studentRes.data ?? []).map((s: { id: string; full_name: string | null; email: string }) => ({
    id: s.id, full_name: s.full_name, email: s.email,
  }));

  const courses = (courseRes.data ?? []).map((c: { id: string; title: string }) => ({
    id: c.id, title: c.title,
  }));

  return NextResponse.json({ assignments, students, courses });
}
