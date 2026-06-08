import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeLessonStatus } from "@/lib/individual-lessons";
import { nivoForSlug, nextNivoFor, individualniSlugForNivo } from "@/lib/course-nivo";
import { sendOneLessonLeftEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/site-url";

// Profesor (svoje) ili admin (sve). Vraća { admin, userId, isAdmin } ili null.
async function requireStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "professor" && profile?.role !== "admin") return null;
  return { admin, userId: user.id, isAdmin: profile.role === "admin" };
}

// Učita enrollment i proveri da staff sme da ga dira (admin sve, profesor samo svoje).
async function loadOwnedEnrollment(admin: ReturnType<typeof createAdminClient>, enrollmentId: string, userId: string, isAdmin: boolean) {
  const { data: enr } = await admin
    .from("individual_enrollments")
    .select("id, professor_id, package_lessons, user_id, course_id, one_left_email_sent_at")
    .eq("id", enrollmentId)
    .single();
  if (!enr) return { error: "Upis nije pronađen", status: 404 as const };
  if (!isAdmin && enr.professor_id !== userId) return { error: "Nije tvoj polaznik", status: 403 as const };
  return { enr };
}

// Prebroji časove i ažuriraj lessons_used + status na enrollmentu.
async function recountLessons(admin: ReturnType<typeof createAdminClient>, enrollmentId: string, packageLessons: number) {
  const { count } = await admin.from("individual_lessons").select("*", { count: "exact", head: true }).eq("enrollment_id", enrollmentId);
  const used = count ?? 0;
  await admin.from("individual_enrollments").update({
    lessons_used: used,
    status: computeLessonStatus(used, packageLessons),
  }).eq("id", enrollmentId);
  return used;
}

export async function POST(request: Request) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { enrollmentId, lessonDate } = await request.json();
  if (!enrollmentId || !lessonDate) return NextResponse.json({ error: "enrollmentId i lessonDate su obavezni" }, { status: 400 });

  const owned = await loadOwnedEnrollment(staff.admin, enrollmentId, staff.userId, staff.isAdmin);
  if ("error" in owned) return NextResponse.json({ error: owned.error }, { status: owned.status });

  const { error } = await staff.admin.from("individual_lessons").insert({
    enrollment_id: enrollmentId,
    professor_id: owned.enr.professor_id,
    lesson_date: lessonDate,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const used = await recountLessons(staff.admin, enrollmentId, owned.enr.package_lessons);

  // Kad preostane tačno 1 čas → mejl polazniku „još 1 čas" (TAČNO JEDNOM po upisu). Best-effort.
  if (used === owned.enr.package_lessons - 1 && !owned.enr.one_left_email_sent_at) {
    try {
      const [{ data: student }, { data: course }] = await Promise.all([
        staff.admin.from("user_profiles").select("email, full_name").eq("id", owned.enr.user_id).single(),
        staff.admin.from("courses").select("slug").eq("id", owned.enr.course_id).single(),
      ]);
      const nivo = course?.slug ? (nivoForSlug(course.slug) ?? "") : "";
      const nextNivo = nivo ? nextNivoFor(nivo) : null;
      const nextSlug = nextNivo ? individualniSlugForNivo(nextNivo) : null;
      if (student?.email) {
        await sendOneLessonLeftEmail(student.email, student.full_name || "", {
          nivo, nextLevelLabel: nextNivo,
          courseUrl: nextSlug ? `${SITE_URL}/kursevi/${nextSlug}` : null,
        });
      }
      // Označi poslato (i ako mejl tiho padne — ne spamuj na svaki re-count).
      await staff.admin.from("individual_enrollments").update({ one_left_email_sent_at: new Date().toISOString() }).eq("id", enrollmentId);
    } catch (e) {
      console.error("[individualni-cas] 'još 1 čas' mejl pao:", e);
    }
  }

  return NextResponse.json({ ok: true, lessonsUsed: used });
}

export async function DELETE(request: Request) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { lessonId } = await request.json();
  if (!lessonId) return NextResponse.json({ error: "lessonId je obavezan" }, { status: 400 });

  const { data: lesson } = await staff.admin
    .from("individual_lessons").select("id, enrollment_id").eq("id", lessonId).single();
  if (!lesson) return NextResponse.json({ error: "Čas nije pronađen" }, { status: 404 });

  const owned = await loadOwnedEnrollment(staff.admin, lesson.enrollment_id, staff.userId, staff.isAdmin);
  if ("error" in owned) return NextResponse.json({ error: owned.error }, { status: owned.status });

  await staff.admin.from("individual_lessons").delete().eq("id", lessonId);
  const used = await recountLessons(staff.admin, lesson.enrollment_id, owned.enr.package_lessons);
  return NextResponse.json({ ok: true, lessonsUsed: used });
}
