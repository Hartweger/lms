import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import LekcijaContent from "@/components/LekcijaContent";
import LekcijaGate from "@/components/LekcijaGate";
import LessonDrawer from "@/components/LessonDrawer";
import LessonCompleteButton from "@/components/LessonCompleteButton";
import { exerciseKindBadge } from "@/lib/exercise-kind";
import { getFixedTranslations } from "@/lib/fixed-translations";
import { getFixedWriting } from "@/lib/fixed-writing";
import { isExamLessonTitle } from "@/lib/certificate-check";
import { buildDrawerLessons } from "@/lib/drawer-lessons";
import type { Lesson, Exercise, ExerciseQuestion } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function LekcijaStranica({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", id)
    .single();

  if (!lesson) {
    // RLS vraća null i kad lekcija POSTOJI a korisnik nema pristup (odjavljen iz mejla,
    // istekao pristup). Gate umesto mrtvog 404. Minimalan admin select - sadržaj
    // lekcije ne sme da procuri odjavljenima.
    const adminGate = createAdminClient();
    const { data: gated } = await adminGate
      .from("lessons")
      .select("id, title, course_id, courses:course_id(title)")
      .eq("id", id)
      .single();
    if (!gated) notFound();
    const { data: { user: gateUser } } = await supabase.auth.getUser();
    const gatedCourse = gated.courses as unknown as { title: string } | null;
    return (
      <LekcijaGate
        lessonTitle={gated.title as string}
        courseTitle={gatedCourse?.title ?? ""}
        loggedIn={!!gateUser}
      />
    );
  }

  const typedLesson = lesson as Lesson;

  // Nezavisni upiti idu paralelno - ranije je 6+ upita išlo sekvencijalno,
  // a za drawer se povlačio pun sections jsonb SVIH lekcija kursa (MB po pregledu).
  // module_name je GENERATED kolona (migracija 060) - sections više ne treba.
  const [{ data: course }, { data: allLessons }, { data: exercises }, { data: { user } }] =
    await Promise.all([
      supabase.from("courses").select("id, title, slug").eq("id", typedLesson.course_id).single(),
      supabase
        .from("lessons")
        .select("id, title, order_index, is_free_preview, module_name")
        .eq("course_id", typedLesson.course_id)
        .order("order_index"),
      supabase.from("exercises").select("*").eq("lesson_id", typedLesson.id).order("order_index"),
      supabase.auth.getUser(),
    ]);

  // Inline vežbe: koje vežbe su referencirane „exercise“ sekcijama u sadržaju
  const lessonSections = (typedLesson.sections as { type: string; title?: string }[] | null) ?? [];
  const inlineTitles = new Set(
    lessonSections.filter((s) => s.type === "exercise" && s.title).map((s) => s.title as string)
  );
  const inlineIds = inlineTitles.size > 0 && exercises
    ? (exercises as Exercise[]).filter((e) => inlineTitles.has(e.title)).map((e) => e.id)
    : [];

  const [progressRes, inlineQuestionsRes] = await Promise.all([
    user && allLessons
      ? supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", user.id)
          .eq("completed", true)
          .in("lesson_id", allLessons.map((l) => l.id))
      : Promise.resolve({ data: null }),
    inlineIds.length > 0
      ? supabase.from("exercise_questions").select("*").in("exercise_id", inlineIds).order("order_index")
      : Promise.resolve({ data: null }),
  ]);

  const completedLessonIds = new Set(progressRes.data?.map((p) => p.lesson_id) ?? []);

  const drawerLessons = buildDrawerLessons(allLessons ?? [], completedLessonIds);
  const completedCount = drawerLessons.filter((l) => l.completed).length;

  // Nivo iz naslova kursa (npr. „Nemački B2.2“ → „B2“)
  const levelMatch = (course?.title || "").match(/(A1|A2|B1|B2|C1|C2)/i);
  const courseLevel = levelMatch ? levelMatch[1].toUpperCase() : "A1";

  const inlineExercises: Record<string, { exercise: Exercise; questions: ExerciseQuestion[] }> = {};
  if (inlineIds.length > 0 && exercises) {
    const byExercise = new Map<string, ExerciseQuestion[]>();
    for (const q of (inlineQuestionsRes.data as ExerciseQuestion[] | null) ?? []) {
      const arr = byExercise.get(q.exercise_id) ?? [];
      arr.push(q);
      byExercise.set(q.exercise_id, arr);
    }
    for (const e of exercises as Exercise[]) {
      if (inlineTitles.has(e.title)) inlineExercises[e.title] = { exercise: e, questions: byExercise.get(e.id) ?? [] };
    }
  }

  // Donja lista „Vežbe i testovi“ prikazuje samo vežbe koje NISU inline
  const bottomExercises = (exercises as Exercise[] | null)?.filter((e) => !inlineTitles.has(e.title)) ?? [];

  // Find prev/next
  const currentIndex = allLessons?.findIndex((l) => l.id === typedLesson.id) ?? -1;
  const prevLesson = currentIndex > 0 ? allLessons?.[currentIndex - 1] : null;
  const nextLesson = allLessons && currentIndex < allLessons.length - 1
    ? allLessons[currentIndex + 1]
    : null;

  const totalLessons = allLessons?.length ?? 0;
  const lessonNumber = currentIndex + 1;

  // Uvodna (prva) lekcija — „Willkommen": dugme ka sledećoj glasi „Počni prvu lekciju →"
  const isIntroLesson = currentIndex === 0 && !!nextLesson;
  const nextLabel = isIntroLesson ? "Počni prvu lekciju →" : null;

  // Manuelno označavanje završetka (Nataša: pravo dugme, bez auto-čekiranja na otvaranje)
  const lessonCompleted = completedLessonIds.has(typedLesson.id);
  const levelComplete = totalLessons > 0 && completedCount === totalLessons;
  const willCompleteLevel = !lessonCompleted && completedCount === totalLessons - 1;

  // Završni ispit (Modelltest): nije obična lekcija - bez „Završi lekciju", sa sertifikatom.
  const isExamLesson = isExamLessonTitle(typedLesson.title);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <LessonDrawer
          courseTitle={course?.title ?? ""}
          lessons={drawerLessons}
          currentLessonId={typedLesson.id}
          totalLessons={totalLessons}
          completedCount={completedCount}
        />
        <span className="text-sm text-gray-400">
          {lessonNumber} / {totalLessons}
        </span>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
        {typedLesson.title}
      </h1>

      {/* Lesson content */}
      <LekcijaContent lesson={typedLesson} inlineExercises={inlineExercises} level={courseLevel} isModelltest={isExamLesson} courseId={course?.id ?? null} />

      {/* Exercises (samo one koje nisu inline u sadržaju) */}
      {bottomExercises.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-gray-900 mb-3">Vežbe i testovi</h3>
          <div className="space-y-2">
            {bottomExercises.map((ex) => {
              const kind = exerciseKindBadge(ex.title, course?.title || course?.slug);
              return (
              <Link
                key={ex.id}
                href={`/vezba/${ex.id}`}
                className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-gray-900">{ex.title}</span>
                  <span className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${kind.test ? "bg-koral-light text-koral-dark" : "bg-plava-light text-plava"}`}>
                    {kind.label}
                  </span>
                </div>
              </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* AI vežbe - prevod i/ili pisanje, samo na lekcijama koje ih imaju */}
      {(getFixedTranslations(typedLesson.title) || getFixedWriting(typedLesson.title)) && (
        <div className="mt-8">
          <h3 className="font-semibold text-gray-900 mb-3">AI vežbe</h3>
          <div className="space-y-3">
            {getFixedTranslations(typedLesson.title) && (
              <Link
                href={`/vezba/ai-prevod/${typedLesson.id}`}
                className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Prevedi rečenice (AI prevod)</span>
                  <span className="text-xs text-plava bg-plava-light px-3 py-1 rounded-full">AI prevod</span>
                </div>
              </Link>
            )}
            {getFixedWriting(typedLesson.title) && (
              <Link
                href={`/vezba/ai-schreiben/${typedLesson.id}`}
                className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Napiši rečenice (AI vežba pisanja)</span>
                  <span className="text-xs text-plava bg-plava-light px-3 py-1 rounded-full">AI pisanje</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Završetak lekcije + navigacija (jedno dugme „Završi i nastavi →"). Završni ispit nema „Završi lekciju". */}
      {user && !isExamLesson ? (
        <LessonCompleteButton
          lessonId={typedLesson.id}
          initialCompleted={lessonCompleted}
          willCompleteLevel={willCompleteLevel}
          levelComplete={levelComplete}
          prevLessonId={prevLesson?.id ?? null}
          nextLessonId={nextLesson?.id ?? null}
          nextLabel={nextLabel}
        />
      ) : (
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
          {prevLesson ? (
            <Link
              href={`/lekcija/${prevLesson.id}`}
              className="flex-1 text-center py-3 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ← Prethodna
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {nextLesson ? (
            <Link
              href={`/lekcija/${nextLesson.id}`}
              className="flex-1 text-center py-3 bg-plava text-white rounded-lg text-sm font-bold hover:bg-plava-dark transition-colors"
            >
              {nextLabel || "Sledeća →"}
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      )}
    </div>
  );
}
