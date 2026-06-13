// Objava pregledanog Schreiben-a + mejl učeniku, u jednom koraku (Resend ključ je samo na serveru).
// Profesor sme samo svoje učenike; admin sve.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEssayFeedbackEmail } from "@/lib/email";

async function requireStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "professor" && profile?.role !== "admin") return null;
  return { admin, userId: user.id, isAdmin: profile.role === "admin" };
}

const one = <T,>(x: T | T[] | null | undefined): T | null =>
  Array.isArray(x) ? (x[0] ?? null) : (x ?? null);

export async function POST(request: Request) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { essayId, professorFeedback, professorScore } = await request.json();
  if (!essayId || typeof essayId !== "string") return NextResponse.json({ error: "essayId je obavezan" }, { status: 400 });
  if (typeof professorScore !== "number" || !Number.isInteger(professorScore) || professorScore < 1 || professorScore > 5) {
    return NextResponse.json({ error: "professorScore mora biti ceo broj 1-5" }, { status: 400 });
  }

  const { admin, userId, isAdmin } = staff;

  // Učitaj esej + učenika + lekciju.
  const { data: essay } = await admin
    .from("essay_submissions")
    .select("id, status, user_id, lesson_id, user_profiles(full_name, email), lessons(title, course_id)")
    .eq("id", essayId)
    .single();
  if (!essay) return NextResponse.json({ error: "Esej nije pronađen" }, { status: 404 });
  if (essay.status === "published") return NextResponse.json({ ok: true, alreadyPublished: true });

  const student = one(essay.user_profiles as unknown) as { full_name: string | null; email: string | null } | null;
  const lesson = one(essay.lessons as unknown) as { title: string | null; course_id: string } | null;

  // Profesor sme samo ako mu je taj (učenik, kurs) dodeljen.
  if (!isAdmin) {
    const { data: link } = await admin
      .from("professor_students")
      .select("id")
      .eq("professor_id", userId)
      .eq("student_id", essay.user_id as string)
      .eq("course_id", (lesson?.course_id as string) ?? "")
      .maybeSingle();
    if (!link) return NextResponse.json({ error: "Nije tvoj učenik" }, { status: 403 });
  }

  // Upis (prioritet - ovo mora da prođe).
  const { error: updErr } = await admin
    .from("essay_submissions")
    .update({
      professor_feedback: professorFeedback ?? null,
      professor_score: professorScore,
      status: "published",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", essayId);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // Mejl učeniku (best-effort - pad mejla ne ruši objavu).
  if (student?.email) {
    await sendEssayFeedbackEmail({
      to: student.email,
      studentName: student.full_name ?? "",
      lessonTitle: lesson?.title ?? "Schreiben",
      lessonId: essay.lesson_id as string,
      score: professorScore,
      feedback: professorFeedback ?? null,
    });
  }

  return NextResponse.json({ ok: true });
}
