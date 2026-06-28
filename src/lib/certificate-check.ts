import type { SupabaseClient } from "@supabase/supabase-js";
import { sendCourseCompletedEmail } from "@/lib/email";

/**
 * Per-modul provera Modelltest sertifikata: SVAKI modul mora ≥60%.
 * - quiz/grouped vežbe (Lesen, Hören): najbolji exercise_attempt → score/total.
 * - essay vežbe (Schreiben): sve moraju biti ocenjene (professor_score 1-5);
 *   modul = prosek professor_score / 5 (≥0.6 = ≥3/5).
 * Sertifikat se izdaje samo kad su svi moduli urađeni I svaki ≥60%. Idempotentno (unique user+course).
 */
const NIL = "00000000-0000-0000-0000-000000000000";

/**
 * Da li je lekcija ZAVRŠNI ispit (Modelltest) - jedini kontekst u kom se sme izdati
 * sertifikat za ceo kurs. Mora se poklapati sa regexom u lekcija stranici (isExamLesson).
 * Bez ove provere, ocena bilo kog Schreiben eseja u običnoj lekciji je izdavala sertifikat.
 */
export function isExamLessonTitle(title: string | null | undefined): boolean {
  return /Modelltest|Završni ispit/.test(title || "");
}

export async function checkAndIssueCertificate(
  admin: SupabaseClient,
  userId: string,
  lessonId: string,
  courseId: string,
): Promise<{ eligible: boolean; percent?: number; certificateId?: string; reason?: string }> {
  const { data: lesson } = await admin.from("lessons").select("id, course_id, title").eq("id", lessonId).single();
  if (!lesson || lesson.course_id !== courseId) return { eligible: false, reason: "mismatch" };
  // Sertifikat se izdaje ISKLJUČIVO za završni ispit (Modelltest), nikad za običnu lekciju.
  if (!isExamLessonTitle(lesson.title)) return { eligible: false, reason: "not-exam-lesson" };

  const { data: exercises } = await admin.from("exercises").select("id, exercise_type").eq("lesson_id", lessonId);
  if (!exercises || exercises.length === 0) return { eligible: false, percent: 0 };

  const quizEx = exercises.filter((e) => e.exercise_type !== "essay");
  const essayEx = exercises.filter((e) => e.exercise_type === "essay");
  const modulePcts: number[] = [];

  // quiz moduli (Lesen, Hören, ...)
  const quizIds = quizEx.map((e) => e.id);
  const { data: attempts } = await admin
    .from("exercise_attempts")
    .select("exercise_id, score, total_questions")
    .eq("user_id", userId)
    .in("exercise_id", quizIds.length ? quizIds : [NIL]);
  const bestByEx = new Map<string, { score: number; total: number }>();
  for (const a of attempts ?? []) {
    const prev = bestByEx.get(a.exercise_id);
    if (!prev || a.score > prev.score) bestByEx.set(a.exercise_id, { score: a.score, total: a.total_questions });
  }
  for (const e of quizEx) {
    const b = bestByEx.get(e.id);
    if (!b || !b.total) return { eligible: false, percent: 0, reason: "incomplete" };
    modulePcts.push(b.score / b.total);
  }

  // Schreiben modul (eseji) - svi moraju biti ocenjeni; težinski po maxPoints (40/40/20), default 5.
  if (essayEx.length > 0) {
    const essayIds = essayEx.map((e) => e.id);
    const { data: subs } = await admin
      .from("essay_submissions")
      .select("exercise_id, professor_score, reviewed_at")
      .eq("user_id", userId)
      .in("exercise_id", essayIds);
    const { data: eqs } = await admin
      .from("exercise_questions")
      .select("exercise_id, options")
      .in("exercise_id", essayIds);
    const maxByEx = new Map<string, number>();
    for (const q of eqs ?? []) {
      const mp = (q.options as { maxPoints?: number } | null)?.maxPoints;
      if (!maxByEx.has(q.exercise_id)) maxByEx.set(q.exercise_id, typeof mp === "number" ? mp : 5);
    }
    const gradedByEx = new Map<string, { professor_score: number; reviewed_at: string | null }>();
    for (const s of subs ?? []) {
      if (s.professor_score == null) continue;
      const prev = gradedByEx.get(s.exercise_id);
      if (!prev || (s.reviewed_at ?? "") > (prev.reviewed_at ?? "")) {
        gradedByEx.set(s.exercise_id, { professor_score: s.professor_score, reviewed_at: s.reviewed_at });
      }
    }
    if (gradedByEx.size < essayEx.length) return { eligible: false, percent: 0, reason: "schreiben-incomplete" };
    let score = 0, max = 0;
    for (const [exId, s] of gradedByEx) { score += s.professor_score; max += maxByEx.get(exId) ?? 5; }
    modulePcts.push(max > 0 ? score / max : 0);
  }

  const overall = Math.round((modulePcts.reduce((a, b) => a + b, 0) / modulePcts.length) * 100);
  const allPass = modulePcts.every((p) => p >= 0.6);
  if (!allPass) return { eligible: false, percent: overall };

  // Idempotentno izdavanje
  const { data: existing } = await admin.from("certificates").select("id").eq("user_id", userId).eq("course_id", courseId).maybeSingle();
  if (existing) return { eligible: true, percent: overall, certificateId: existing.id };

  const { data: created, error } = await admin.from("certificates").insert({ user_id: userId, course_id: courseId }).select("id").single();
  if (error || !created) {
    const { data: again } = await admin.from("certificates").select("id").eq("user_id", userId).eq("course_id", courseId).maybeSingle();
    if (again) return { eligible: true, percent: overall, certificateId: again.id };
    return { eligible: false, reason: "issue-failed" };
  }

  try {
    const [{ data: profile }, { data: course }] = await Promise.all([
      admin.from("user_profiles").select("email, full_name").eq("id", userId).single(),
      admin.from("courses").select("title").eq("id", courseId).single(),
    ]);
    if (profile?.email) await sendCourseCompletedEmail(profile.email, profile.full_name || "", course?.title ?? "Kurs", created.id);
  } catch (e) {
    console.error("[certificate] Slanje čestitke palo:", e);
  }

  return { eligible: true, percent: overall, certificateId: created.id };
}
