import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LekcijaContent from "@/components/LekcijaContent";
import type { Lesson, Exercise } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function LekcijaStranica({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch lesson — RLS handles access control
  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", id)
    .single();

  if (!lesson) notFound();

  const typedLesson = lesson as Lesson;

  // Get course info
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, slug")
    .eq("id", typedLesson.course_id)
    .single();

  // Get all lessons in this course that the user can see
  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id, title, order_index, is_free_preview")
    .eq("course_id", typedLesson.course_id)
    .order("order_index");

  // Mark lesson as completed if user is logged in
  const { data: { user } } = await supabase.auth.getUser();
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

  // Fetch exercises for this lesson
  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("lesson_id", typedLesson.id)
    .order("order_index");

  // Find prev/next lessons
  const currentIndex = allLessons?.findIndex((l) => l.id === typedLesson.id) ?? -1;
  const prevLesson = currentIndex > 0 ? allLessons?.[currentIndex - 1] : null;
  const nextLesson = allLessons && currentIndex < allLessons.length - 1
    ? allLessons[currentIndex + 1]
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      {course && (
        <Link
          href={`/kurs/${course.slug}`}
          className="text-sm text-plava hover:underline mb-4 inline-block"
        >
          ← {course.title}
        </Link>
      )}

      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
        {typedLesson.title}
      </h1>

      {/* Lesson content */}
      <LekcijaContent lesson={typedLesson} />

      {/* Exercises */}
      {exercises && exercises.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-gray-900 mb-3">Vezbe</h3>
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
                    {ex.exercise_type === "quiz" ? "Kviz" : ex.exercise_type === "fill_blank" ? "Popuni" : ex.exercise_type === "match_pairs" ? "Spoji" : ex.exercise_type === "word_order" ? "Poredaj" : "Slusaj"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Lesson navigation */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
        {prevLesson ? (
          <Link
            href={`/lekcija/${prevLesson.id}`}
            className="text-sm text-plava hover:underline"
          >
            ← {prevLesson.title}
          </Link>
        ) : (
          <div />
        )}
        {nextLesson ? (
          <Link
            href={`/lekcija/${nextLesson.id}`}
            className="text-sm text-plava hover:underline"
          >
            {nextLesson.title} →
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* Sidebar: lesson list */}
      {allLessons && allLessons.length > 1 && (
        <div className="mt-8 bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">Sve lekcije</h3>
          <div className="space-y-2">
            {allLessons.map((l, i) => (
              <Link
                key={l.id}
                href={`/lekcija/${l.id}`}
                className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
                  l.id === typedLesson.id
                    ? "bg-plava-light text-plava font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-gray-100 text-xs flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                {l.title}
                {l.is_free_preview && (
                  <span className="text-[10px] text-plava bg-plava-light px-2 py-0.5 rounded-full ml-auto">
                    Besplatno
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
