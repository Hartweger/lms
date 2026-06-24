// Za zadate esej-id-jeve vrati dodeljenu profesorku (ako postoji), da admin u
// /admin/eseji vidi koje radove pregleda profesor, a koji su "njegovi" (bez profa).
// Dodela = professor_students match na (student_id = esej.user_id, course_id = lekcija.course_id).
// Admin-only, service-role (zaobilazi RLS).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

  const { essayIds } = await request.json();
  if (!Array.isArray(essayIds) || essayIds.length === 0) {
    return NextResponse.json({ assignees: {} });
  }

  // Esej → user_id + lesson_id.
  const { data: essays } = await admin
    .from("essay_submissions")
    .select("id, user_id, lesson_id")
    .in("id", essayIds);
  if (!essays || essays.length === 0) return NextResponse.json({ assignees: {} });

  // Lekcija → course_id.
  const lessonIds = [...new Set(essays.map((e) => e.lesson_id as string))];
  const { data: lessons } = await admin
    .from("lessons")
    .select("id, course_id")
    .in("id", lessonIds);
  const courseByLesson = new Map<string, string>();
  for (const l of lessons ?? []) courseByLesson.set(l.id as string, l.course_id as string);

  // Sve dodele za te učenike.
  const studentIds = [...new Set(essays.map((e) => e.user_id as string))];
  const { data: links } = await admin
    .from("professor_students")
    .select("professor_id, student_id, course_id")
    .in("student_id", studentIds);

  // Imena profesora.
  const profIds = [...new Set((links ?? []).map((l) => l.professor_id as string))];
  const profName = new Map<string, string>();
  if (profIds.length > 0) {
    const { data: profs } = await admin
      .from("user_profiles")
      .select("id, full_name")
      .in("id", profIds);
    for (const p of profs ?? []) profName.set(p.id as string, (p.full_name as string) ?? "");
  }

  // Mapa (student_id|course_id) → professor_id.
  const linkKey = (s: string, c: string) => `${s}|${c}`;
  const byKey = new Map<string, string>();
  for (const l of links ?? []) byKey.set(linkKey(l.student_id as string, l.course_id as string), l.professor_id as string);

  const assignees: Record<string, { professorName: string }> = {};
  for (const e of essays) {
    const courseId = courseByLesson.get(e.lesson_id as string);
    if (!courseId) continue;
    const profId = byKey.get(linkKey(e.user_id as string, courseId));
    if (profId) assignees[e.id as string] = { professorName: profName.get(profId) || "Profesor" };
  }

  return NextResponse.json({ assignees });
}
