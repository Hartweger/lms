import { createAdminClient } from "@/lib/supabase/admin";
import { nivoForSlug } from "@/lib/course-nivo";
import { resolveProfessorView } from "@/lib/professor-view";
import IndividualniClient, { type EnrollmentRow } from "./IndividualniClient";

export const dynamic = "force-dynamic";

export default async function ProfesorIndividualni({ searchParams }: { searchParams: Promise<{ prof?: string }> }) {
  const { prof } = await searchParams;
  const ctx = await resolveProfessorView(prof);
  if (!ctx) return null;
  const admin = createAdminClient();
  const isAdmin = ctx.isAdmin;

  // Profesor vidi svoje upise; admin sve - osim kad „uđe kao" profesor (?prof) → samo tog profesora.
  let q = admin.from("individual_enrollments")
    .select("id, user_id, course_id, professor_id, package_lessons, lessons_used, status, expires_at, notes_doc_url, created_at")
    .order("created_at", { ascending: false });
  if (!isAdmin || prof) q = q.eq("professor_id", ctx.profId);
  const { data: enrollments } = await q;

  if (!enrollments || enrollments.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">Nema individualnih polaznika.</p>
        <p className="text-sm text-gray-300 mt-2">Pojaviće se ovde čim neko kupi individualni kurs.</p>
      </div>
    );
  }

  const userIds = [...new Set(enrollments.map((e) => e.user_id))];
  const courseIds = [...new Set(enrollments.map((e) => e.course_id))];
  const profIds = [...new Set(enrollments.map((e) => e.professor_id).filter(Boolean) as string[])];
  const enrollmentIds = enrollments.map((e) => e.id);

  const [{ data: profiles }, { data: courses }, { data: lessons }] = await Promise.all([
    admin.from("user_profiles").select("id, full_name, email").in("id", [...userIds, ...profIds]),
    admin.from("courses").select("id, title, slug").in("id", courseIds),
    admin.from("individual_lessons").select("id, enrollment_id, lesson_date").in("enrollment_id", enrollmentIds).order("lesson_date", { ascending: true }),
  ]);

  const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const cMap = new Map((courses ?? []).map((c) => [c.id, c]));
  const lByEnr = new Map<string, { id: string; date: string }[]>();
  for (const l of lessons ?? []) {
    const list = lByEnr.get(l.enrollment_id) ?? [];
    list.push({ id: l.id, date: l.lesson_date });
    lByEnr.set(l.enrollment_id, list);
  }

  const rows: EnrollmentRow[] = enrollments.map((e) => {
    const student = pMap.get(e.user_id);
    const course = cMap.get(e.course_id);
    const prof = e.professor_id ? pMap.get(e.professor_id) : null;
    return {
      id: e.id,
      studentName: student?.full_name || "",
      studentEmail: student?.email || "",
      courseTitle: course?.title || "",
      nivo: course?.slug ? (nivoForSlug(course.slug) ?? "") : "",
      professorName: prof?.full_name || "",
      packageLessons: e.package_lessons,
      lessonsUsed: e.lessons_used,
      status: e.status,
      expiresAt: e.expires_at,
      notesUrl: e.notes_doc_url,
      lessons: lByEnr.get(e.id) ?? [],
    };
  });

  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">{rows.length} individualnih polaznika{isAdmin ? " (svi profesori)" : ""}</p>
      <IndividualniClient rows={rows} showProfessor={isAdmin} />
    </div>
  );
}
