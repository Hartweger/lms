"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import QuizExercise from "./QuizExercise";
import FillBlankExercise from "./FillBlankExercise";
import MatchPairsExercise from "./MatchPairsExercise";
import WordOrderExercise from "./WordOrderExercise";
import type { Exercise, ExerciseQuestion } from "@/lib/types";

interface ExerciseRunnerProps {
  exercise: Exercise;
  questions: ExerciseQuestion[];
}

export default function ExerciseRunner({ exercise, questions }: ExerciseRunnerProps) {
  const supabase = createClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const question = questions[currentIndex];

  const handleAnswer = (correct: boolean) => {
    if (correct) setScore((s) => s + 1);
    setShowNext(true);
  };

  const handleNext = async () => {
    setShowNext(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setFinished(true);
      // Save attempt
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("exercise_attempts").insert({
          exercise_id: exercise.id,
          user_id: user.id,
          score,
          total_questions: questions.length,
        });
      }
    }
  };

  if (finished) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <div className="text-center py-8">
        <div className="text-5xl font-bold text-plava mb-2">{percent}%</div>
        <p className="text-gray-500 mb-1">Tacnih odgovora: {score} od {questions.length}</p>
        <p className="text-sm text-gray-400">
          {percent === 100 ? "Savrseno!" : percent >= 70 ? "Odlicno!" : percent >= 50 ? "Dobro, nastavi da vezbas!" : "Pokusaj ponovo!"}
        </p>
        <button
          onClick={() => {
            setCurrentIndex(0);
            setScore(0);
            setFinished(false);
            setShowNext(false);
          }}
          className="mt-6 bg-plava text-white px-6 py-3 rounded-lg hover:bg-plava-dark transition-colors"
        >
          Pokusaj ponovo
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-plava">{exercise.title}</span>
        <span className="text-sm text-gray-400">{currentIndex + 1} / {questions.length}</span>
      </div>
      <div className="bg-gray-100 rounded-full h-2 mb-6 overflow-hidden">
        <div
          className="bg-plava h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        {exercise.exercise_type === "quiz" && (
          <QuizExercise
            key={question.id}
            question={question.question}
            options={question.options as string[]}
            correctAnswer={parseInt(question.correct_answer)}
            explanation={question.explanation}
            onAnswer={handleAnswer}
          />
        )}
        {exercise.exercise_type === "fill_blank" && (
          <FillBlankExercise
            key={question.id}
            question={question.question}
            options={question.options as string[]}
            correctAnswer={question.correct_answer}
            explanation={question.explanation}
            onAnswer={handleAnswer}
          />
        )}
        {exercise.exercise_type === "match_pairs" && (
          <MatchPairsExercise
            key={question.id}
            pairs={question.options as { de: string; sr: string }[]}
            onAnswer={handleAnswer}
          />
        )}
        {exercise.exercise_type === "word_order" && (
          <WordOrderExercise
            key={question.id}
            words={question.options as string[]}
            correctAnswer={question.correct_answer}
            hint={question.question}
            onAnswer={handleAnswer}
          />
        )}
      </div>

      {/* Next button */}
      {showNext && (
        <div className="mt-4 text-right">
          <button
            onClick={handleNext}
            className="bg-plava text-white px-6 py-3 rounded-lg hover:bg-plava-dark transition-colors"
          >
            {currentIndex < questions.length - 1 ? "Sledece pitanje \u2192" : "Zavrsi vezbu"}
          </button>
        </div>
      )}
    </div>
  );
}
