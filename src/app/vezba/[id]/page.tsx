import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ExerciseRunner from "@/components/exercises/ExerciseRunner";
import type { Exercise, ExerciseQuestion } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function VezbaStranica({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: exercise } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", id)
    .single();

  if (!exercise) notFound();

  const typedExercise = exercise as Exercise;

  const { data: questions } = await supabase
    .from("exercise_questions")
    .select("*")
    .eq("exercise_id", typedExercise.id)
    .order("order_index");

  // Get lesson + course info for breadcrumb and level
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, course_id, courses(title)")
    .eq("id", typedExercise.lesson_id)
    .single();

  // Find next lesson
  let nextLessonId: string | null = null;
  if (lesson) {
    const { data: currentLesson } = await supabase
      .from("lessons")
      .select("order_index")
      .eq("id", lesson.id)
      .single();

    if (currentLesson) {
      const { data: nextLesson } = await supabase
        .from("lessons")
        .select("id")
        .eq("course_id", lesson.course_id)
        .gt("order_index", currentLesson.order_index)
        .order("order_index")
        .limit(1)
        .single();

      nextLessonId = nextLesson?.id || null;
    }
  }

  // Check if current user is admin
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
  }

  // Extract level from course title (e.g. "Nemački A1.1" → "A1")
  const courseTitle = (lesson?.courses as unknown as { title: string } | null)?.title || "";
  const levelMatch = courseTitle.match(/(A1|A2|B1|B2|C1|C2)/i);
  const courseLevel = levelMatch ? levelMatch[1].toUpperCase() : "A1";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        {lesson && (
          <Link href={`/lekcija/${lesson.id}`} className="text-sm text-plava hover:underline">
            &larr; {lesson.title}
          </Link>
        )}
        {isAdmin && lesson && (
          <Link href={`/admin/vezbe/${lesson.id}`} className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors">
            Uredi vežbu
          </Link>
        )}
      </div>

      {questions && questions.length > 0 ? (
        <ExerciseRunner
          exercise={typedExercise}
          questions={questions as ExerciseQuestion[]}
          level={courseLevel}
          nextLessonId={nextLessonId}
        />
      ) : (
        <p className="text-gray-400 text-center py-8">Ova vežba nema pitanja.</p>
      )}
    </div>
  );
}
