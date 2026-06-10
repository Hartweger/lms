import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Admin menja profesora na individualnom (1:1) upisu.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  const { data: me } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { enrollmentId, professorId } = await request.json();
  if (!enrollmentId || !professorId) {
    return NextResponse.json({ error: "Nedostaju podaci." }, { status: 400 });
  }

  // Učitaj upis (treba nam student i kurs za professor_students)
  const { data: enr } = await admin
    .from("individual_enrollments")
    .select("id, user_id, course_id")
    .eq("id", enrollmentId)
    .single();
  if (!enr) return NextResponse.json({ error: "Upis nije pronađen." }, { status: 404 });

  // Profesor mora postojati i biti professor
  const { data: prof } = await admin
    .from("user_profiles").select("id, full_name").eq("id", professorId).eq("role", "professor").maybeSingle();
  if (!prof) return NextResponse.json({ error: "Profesor nije validan." }, { status: 400 });

  // 1) Promeni profesora na upisu
  const { error: e1 } = await admin
    .from("individual_enrollments").update({ professor_id: professorId }).eq("id", enrollmentId);
  if (e1) return NextResponse.json({ error: e1.message }, { status: 400 });

  // 2) Reasign professor_students (individualna veza student↔profesor za taj kurs)
  await admin.from("professor_students")
    .delete().eq("student_id", enr.user_id).eq("course_id", enr.course_id).eq("assigned_via", "individual");
  await admin.from("professor_students")
    .insert({ professor_id: professorId, student_id: enr.user_id, course_id: enr.course_id, assigned_via: "individual" });

  return NextResponse.json({ ok: true, professor: prof.full_name });
}
