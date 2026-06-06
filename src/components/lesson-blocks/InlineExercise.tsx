"use client";

import ExerciseRunner from "@/components/exercises/ExerciseRunner";
import type { Exercise, ExerciseQuestion } from "@/lib/types";

/**
 * Vežba ugnežđena direktno u tok lekcije (ispod sadržaja na koji se odnosi).
 * Koristi isti ExerciseRunner kao /vezba/[id], bez „sledeća vežba“ navigacije.
 */
export default function InlineExercise({
  exercise,
  questions,
  level,
}: {
  exercise: Exercise;
  questions: ExerciseQuestion[];
  level?: string;
}) {
  if (!questions || questions.length === 0) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm">
      <ExerciseRunner
        exercise={exercise}
        questions={questions}
        level={level}
        nextExerciseId={null}
        nextLessonId={null}
      />
    </div>
  );
}
