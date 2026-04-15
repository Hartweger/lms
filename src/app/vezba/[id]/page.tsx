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

  // Get lesson info for breadcrumb
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, course_id")
    .eq("id", typedExercise.lesson_id)
    .single();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {lesson && (
        <Link href={`/lekcija/${lesson.id}`} className="text-sm text-plava hover:underline mb-4 inline-block">
          &larr; {lesson.title}
        </Link>
      )}

      {questions && questions.length > 0 ? (
        <ExerciseRunner exercise={typedExercise} questions={questions as ExerciseQuestion[]} />
      ) : (
        <p className="text-gray-400 text-center py-8">Ova vezba nema pitanja.</p>
      )}
    </div>
  );
}
