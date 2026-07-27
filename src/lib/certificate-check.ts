import type { SupabaseClient } from "@supabase/supabase-js";
import { sendCourseCompletedEmail } from "@/lib/email";
import { passesThreshold } from "@/lib/certificate-threshold";

/**
 * Per-modul provera Modelltest sertifikata: SVAKI modul mora ≥60%
 * (kod kurseva iz certificate-threshold: strogo >60%).
 * - quiz/grouped vežbe (Lesen, Hören): najbolji exercise_attempt → score/total.
 * - essay vežbe (Schreiben) i sprechen vežbe (Sprechen): ZASEBNI moduli, oba ocenjuje
 *   profesorka (professor_score 1-5); modul = zbir ocena / zbir maxPoints (default 5).
 * Sertifikat se izdaje samo kad su svi moduli urađeni I svaki ≥60%. Idempotentno (unique user+course).
 */
const NIL = "00000000-0000-0000-0000-000000000000";

/**
 * Podela vežbi na module ispita.
 *
 * Sprechen se snima i šalje profesorki na pregled kroz isti tok kao esej
 * (essay_submissions + audio_url, status „pending" → professor_score), pa se i boduje isto.
 * Ali je ZASEBAN modul, a ne slepljen sa Schreibenom: pravilo je da svaki modul mora ≥60%,
 * pa spojen modul ne sme da dozvoli da odličan Schreiben pokrije pao Sprechen.
 *
 * Ranije je sprechen upadao u quiz grupu i lomio se na dve strane: ko preskoči vežbu -
 * sertifikat se tiho blokira („incomplete"), ko je uradi - dobija automatskih 100%,
 * jer SprechenExercise javlja tačan odgovor čim se snimak otpremi, pre nego što ga je iko preslušao.
 */
export function groupExercisesForCertificate<T extends { exercise_type: string | null }>(exercises: T[]) {
  return {
    quiz: exercises.filter((e) => e.exercise_type !== "essay" && e.exercise_type !== "sprechen"),
    essay: exercises.filter((e) => e.exercise_type === "essay"),
    sprechen: exercises.filter((e) => e.exercise_type === "sprechen"),
  };
}

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

  // Prag zavisi od kursa (podrazumevano ≥60%, za neke strogo >60%).
  const { data: courseRow } = await admin.from("courses").select("slug").eq("id", courseId).single();
  const courseSlug = (courseRow?.slug as string | undefined) ?? null;

  const { quiz: quizEx, essay: essayEx, sprechen: sprechenEx } = groupExercisesForCertificate(exercises);
  // Po modulu čuvamo (score, total) - prag se poredi celobrojno, bez zaokruživanja.
  const moduleScores: { score: number; total: number }[] = [];

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
    moduleScores.push({ score: b.score, total: b.total });
  }

  // Moduli koje ocenjuje profesorka (Schreiben = eseji, Sprechen = snimci). Oba idu kroz
  // essay_submissions i moraju biti ocenjena; težinski po maxPoints (40/40/20), default 5.
  const gradedModule = async (exs: { id: string }[]) => {
    const ids = exs.map((e) => e.id);
    const { data: subs } = await admin
      .from("essay_submissions")
      .select("exercise_id, professor_score, reviewed_at")
      .eq("user_id", userId)
      .in("exercise_id", ids);
    const { data: eqs } = await admin
      .from("exercise_questions")
      .select("exercise_id, options")
      .in("exercise_id", ids);
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
    if (gradedByEx.size < exs.length) return null; // nije sve ocenjeno
    let score = 0, max = 0;
    for (const [exId, s] of gradedByEx) { score += s.professor_score; max += maxByEx.get(exId) ?? 5; }
    return { score, total: max };
  };

  // Schreiben modul
  if (essayEx.length > 0) {
    const m = await gradedModule(essayEx);
    if (!m) return { eligible: false, percent: 0, reason: "schreiben-incomplete" };
    moduleScores.push(m);
  }

  // Sprechen modul - zaseban, da odličan Schreiben ne pokrije pao Sprechen.
  if (sprechenEx.length > 0) {
    const m = await gradedModule(sprechenEx);
    if (!m) return { eligible: false, percent: 0, reason: "sprechen-incomplete" };
    moduleScores.push(m);
  }

  const overall = Math.round(
    (moduleScores.reduce((a, m) => a + (m.total > 0 ? m.score / m.total : 0), 0) / moduleScores.length) * 100,
  );
  const allPass = moduleScores.every((m) => passesThreshold(m.score, m.total, courseSlug));
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
