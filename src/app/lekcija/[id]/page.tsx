import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LekcijaContent from "@/components/LekcijaContent";
import LessonDrawer from "@/components/LessonDrawer";
import type { Lesson, Exercise } from "@/lib/types";

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

  if (!lesson) notFound();

  const typedLesson = lesson as Lesson;

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, slug")
    .eq("id", typedLesson.course_id)
    .single();

  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id, title, order_index, is_free_preview")
    .eq("course_id", typedLesson.course_id)
    .order("order_index");

  const { data: { user } } = await supabase.auth.getUser();

  // Mark lesson as completed
  if (user && !typedLesson.is_free_preview) {
    await supabase.from("lesson_progress").upsert(
      {
        user_id: user.id,
        lesson_id: typedLesson.id,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );
  }

  // Get completion status for all lessons
  let completedLessonIds = new Set<string>();
  if (user && allLessons) {
    const lessonIds = allLessons.map((l) => l.id);
    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", user.id)
      .eq("completed", true)
      .in("lesson_id", lessonIds);

    completedLessonIds = new Set(progress?.map((p) => p.lesson_id) ?? []);
  }

  // Build lesson list for drawer
  const drawerLessons = (allLessons ?? []).map((l) => ({
    id: l.id,
    title: l.title,
    order_index: l.order_index,
    completed: completedLessonIds.has(l.id),
  }));

  const completedCount = drawerLessons.filter((l) => l.completed).length;

  // Fetch exercises
  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("lesson_id", typedLesson.id)
    .order("order_index");

  // Find prev/next
  const currentIndex = allLessons?.findIndex((l) => l.id === typedLesson.id) ?? -1;
  const prevLesson = currentIndex > 0 ? allLessons?.[currentIndex - 1] : null;
  const nextLesson = allLessons && currentIndex < allLessons.length - 1
    ? allLessons[currentIndex + 1]
    : null;

  const totalLessons = allLessons?.length ?? 0;
  const lessonNumber = currentIndex + 1;

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
      <LekcijaContent lesson={typedLesson} />

      {/* Exercises */}
      {exercises && exercises.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-gray-900 mb-3">Vežbe</h3>
          <div className="space-y-2">
            {(exercises as Exercise[]).map((ex) => (
              <Link
                key={ex.id}
                href={`/vezba/${ex.id}`}
                className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{ex.title}</span>
                  <span className="text-xs text-plava bg-plava-light px-3 py-1 rounded-full">
                    {ex.exercise_type === "quiz" ? "Kviz" : ex.exercise_type === "fill_blank" ? "Popuni" : ex.exercise_type === "match_pairs" ? "Spoji" : ex.exercise_type === "word_order" ? "Poredaj" : "Slušaj"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom navigation */}
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
            Sledeća →
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}
