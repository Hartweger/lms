"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import QuizExercise from "./QuizExercise";
import FillBlankExercise from "./FillBlankExercise";
import MatchPairsExercise from "./MatchPairsExercise";
import WordOrderExercise from "./WordOrderExercise";
import EssayExercise from "./EssayExercise";
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
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [showXpAnimation, setShowXpAnimation] = useState(false);
  const [xpGained, setXpGained] = useState(0);

  const question = questions[currentIndex];

  const handleAnswer = (correct: boolean) => {
    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const bonus = newStreak >= 3 ? 5 : 0;
      const gained = 10 + bonus;
      setXp(xp + gained);
      setXpGained(gained);
      setShowXpAnimation(true);
      setTimeout(() => setShowXpAnimation(false), 1000);
      setScore(score + 1);
    } else {
      setStreak(0);
    }
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
    const stars = percent >= 90 ? 3 : percent >= 50 ? 2 : 1;
    const isPerfect = percent === 100;

    return (
      <div className="text-center py-8 relative overflow-hidden">
        {/* Confetti for perfect score */}
        {isPerfect && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10px`,
                  backgroundColor: ['#4fb1d3', '#e57b78', '#fbbf24', '#34d399', '#a78bfa'][i % 5],
                  animation: `confetti-fall ${1.5 + Math.random() * 2}s ease-in forwards`,
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Stars */}
        <div className="text-4xl mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={i < stars ? "opacity-100" : "opacity-20"}>
              ⭐
            </span>
          ))}
        </div>

        <div className="text-5xl font-bold text-plava mb-2">{percent}%</div>
        <p className="text-gray-500 mb-1">Tacnih odgovora: {score} od {questions.length}</p>
        <p className="text-plava font-bold mb-1">{xp} XP zaradjeno</p>
        <p className="text-sm text-gray-400">
          {percent === 100 ? "Savrseno! 🎉" : percent >= 90 ? "Odlicno!" : percent >= 70 ? "Vrlo dobro!" : percent >= 50 ? "Dobro, nastavi da vezbas!" : "Pokusaj ponovo!"}
        </p>
        <button
          onClick={() => {
            setCurrentIndex(0);
            setScore(0);
            setFinished(false);
            setShowNext(false);
            setStreak(0);
            setXp(0);
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-plava font-bold">{xp} XP</span>
            {showXpAnimation && (
              <span className="text-xs text-green-500 font-bold animate-bounce">
                +{xpGained}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-400">{currentIndex + 1} / {questions.length}</span>
        </div>
      </div>
      <div className="bg-gray-100 rounded-full h-2 mb-6 overflow-hidden">
        <div
          className="bg-plava h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Streak counter */}
      {streak >= 2 && (
        <div className="text-center mb-4 animate-bounce">
          <span className="text-lg font-bold text-orange-500">
            🔥 {streak} u nizu!
          </span>
        </div>
      )}

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
        {exercise.exercise_type === "listen_write" && (
          <EssayExercise
            key={question.id}
            task={question.question}
            level="A1"
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
