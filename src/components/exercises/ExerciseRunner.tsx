"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import QuizExercise from "./QuizExercise";
import FillBlankExercise from "./FillBlankExercise";
import MatchPairsExercise from "./MatchPairsExercise";
import WordOrderExercise from "./WordOrderExercise";
import EssayExercise from "./EssayExercise";
import WordwallExercise from "./WordwallExercise";
import DialogExercise from "./DialogExercise";
import TrueFalseExercise from "./TrueFalseExercise";
import CategorizeExercise from "./CategorizeExercise";
import TypingExercise from "./TypingExercise";
import ConversationExercise from "./ConversationExercise";
import type { Exercise, ExerciseQuestion } from "@/lib/types";

interface ExerciseRunnerProps {
  exercise: Exercise;
  questions: ExerciseQuestion[];
  level?: string;
  nextExerciseId?: string | null;
  nextLessonId?: string | null;
  courseId?: string | null;
  isModelltest?: boolean;
}

export default function ExerciseRunner({ exercise, questions, level = "A1", nextExerciseId, nextLessonId, courseId, isModelltest }: ExerciseRunnerProps) {
  const supabase = createClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [showXpAnimation, setShowXpAnimation] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [dialogTotal, setDialogTotal] = useState(0);
  const [results, setResults] = useState<{ question: string; correct: boolean }[]>([]);
  const [dialogAttempts, setDialogAttempts] = useState(0);
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [modelltestTotal, setModelltestTotal] = useState<{ score: number; total: number } | null>(null);

  // Enter key advances to next question
  useEffect(() => {
    if (!showNext) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showNext]);

  // Fetch previous dialog attempts count
  useEffect(() => {
    if (exercise.exercise_type !== "dialog") return;
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string } | null } }) => {
      if (!user) return;
      supabase.from("exercise_attempts")
        .select("id", { count: "exact", head: true })
        .eq("exercise_id", exercise.id)
        .eq("user_id", user.id)
        .then(({ count }: { count: number | null }) => { setDialogAttempts(count || 0); });
    });
  }, [exercise.id, exercise.exercise_type, supabase]);

  const question = questions[currentIndex];

  // Parse options — handles both old format (string[]) and new format ({ type, items })
  function parseOptions(opts: unknown): { type: string; items: unknown } {
    if (!opts) {
      // Check if it's a true_false question by looking at correct_answer
      const ca = question?.correct_answer?.toLowerCase();
      if (ca === "true" || ca === "false") {
        return { type: "true_false", items: null };
      }
      return { type: "quiz", items: [] };
    }

    // New format: { type: "quiz", items: [...] }
    if (typeof opts === "object" && !Array.isArray(opts) && opts !== null) {
      const o = opts as Record<string, unknown>;
      if (o.type) {
        return { type: o.type as string, items: o.items ?? null };
      }
    }

    // Old format: string[] or JSON string
    if (Array.isArray(opts)) return { type: "quiz", items: opts };
    if (typeof opts === "string") {
      try {
        const parsed = JSON.parse(opts);
        if (typeof parsed === "object" && parsed.type) return { type: parsed.type, items: parsed.items };
        if (Array.isArray(parsed)) return { type: "quiz", items: parsed };
      } catch { /* not JSON */ }
      return { type: "quiz", items: [opts] };
    }
    return { type: "quiz", items: [] };
  }

  function getItemsAsStringArray(items: unknown): string[] {
    if (Array.isArray(items)) return items.map(String);
    return [];
  }

  const handleAnswer = (correct: boolean) => {
    // Strip HTML for review display, keep only last meaningful line
    const cleanQuestion = question.question
      .replace(/<[^>]*>/g, "")
      .split("\n")
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0)
      .pop() || question.question;

    // Skip scoring for Beispiel questions
    const isBeispiel = question.question.toLowerCase().includes("beispiel") ||
      question.explanation?.includes("Beispiel");
    if (isBeispiel) {
      setShowNext(true);
      return;
    }

    setResults([...results, { question: cleanQuestion, correct }]);
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
          total_questions: questions.filter(
            (q) => !q.question.toLowerCase().includes("beispiel") && !q.explanation?.includes("Beispiel")
          ).length,
        });

        // Modelltest: calculate total score across ALL exercises on this lesson
        if (isModelltest && courseId) {
          // Get all exercises on the same lesson
          const { data: siblingExs } = await supabase
            .from("exercises")
            .select("id")
            .eq("lesson_id", exercise.lesson_id);

          const siblingIds = (siblingExs || []).map((e: { id: string }) => e.id);

          // Get best attempt for each sibling exercise (except current — use live score)
          let totalScore = score;
          let totalQuestions = questions.length;

          for (const sid of siblingIds) {
            if (sid === exercise.id) continue;
            const { data: bestAttempt } = await supabase
              .from("exercise_attempts")
              .select("score, total_questions")
              .eq("exercise_id", sid)
              .eq("user_id", user.id)
              .order("score", { ascending: false })
              .limit(1)
              .single();

            if (bestAttempt) {
              totalScore += bestAttempt.score;
              totalQuestions += bestAttempt.total_questions;
            }
          }

          const overallPercent = Math.round((totalScore / totalQuestions) * 100);
          setModelltestTotal({ score: totalScore, total: totalQuestions });

          if (overallPercent >= 60) {
            const { data: existing } = await supabase
              .from("certificates")
              .select("id")
              .eq("user_id", user.id)
              .eq("course_id", courseId)
              .single();

            if (existing) {
              setCertificateId(existing.id);
            } else {
              const { data: newCert } = await supabase
                .from("certificates")
                .insert({ user_id: user.id, course_id: courseId })
                .select("id")
                .single();
              if (newCert) setCertificateId(newCert.id);
            }
          }
        }
      }
    }
  };

  if (finished) {
    const scoredQuestions = questions.filter(
      (q) => !q.question.toLowerCase().includes("beispiel") && !q.explanation?.includes("Beispiel")
    );
    const totalForScore = exercise.exercise_type === "dialog" ? dialogTotal : scoredQuestions.length;
    const percent = Math.round((score / totalForScore) * 100);
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
        <p className="text-gray-500 mb-1">
          {exercise.exercise_type === "dialog"
            ? `Ispunjeno ciljeva: ${score} od ${totalForScore}`
            : `Tačnih odgovora: ${score} od ${totalForScore}`}
        </p>
        <p className="text-plava font-bold mb-1">{xp} XP zarađeno</p>
        {isModelltest && modelltestTotal ? (() => {
          const overallPercent = Math.round((modelltestTotal.score / modelltestTotal.total) * 100);
          return overallPercent >= 60 ? (
            <div className="mt-2">
              <p className="text-lg font-bold text-green-600">Položio/la! Čestitamo!</p>
              <p className="text-sm text-gray-500 mb-1">
                Ukupan rezultat: {modelltestTotal.score} od {modelltestTotal.total} ({overallPercent}%)
              </p>
              <p className="text-sm text-gray-400">Minimum za prolaz: 60%</p>
              {certificateId && (
                <a
                  href={`/sertifikat/${certificateId}`}
                  className="inline-block mt-4 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Pogledaj sertifikat
                </a>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-lg font-bold text-koral">Nije položeno</p>
              <p className="text-sm text-gray-500 mb-1">
                Ukupan rezultat: {modelltestTotal.score} od {modelltestTotal.total} ({overallPercent}%)
              </p>
              <p className="text-sm text-gray-400">Minimum za prolaz: 60%. Pokušaj ponovo!</p>
            </div>
          );
        })() : (
          <p className="text-sm text-gray-400">
            {percent === 100 ? "Savršeno! 🎉" : percent >= 90 ? "Odlično!" : percent >= 70 ? "Vrlo dobro!" : percent >= 50 ? "Dobro, nastavi da vežbaš!" : "Pokušaj ponovo!"}
          </p>
        )}

        {/* Pregled odgovora */}
        {results.length > 0 && exercise.exercise_type !== "dialog" && (
          <div className="mt-8 text-left max-w-md mx-auto">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Pregled odgovora:</h4>
            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={i} className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${r.correct ? "bg-green-50 text-green-700" : "bg-koral-light text-koral-dark"}`}>
                  <span className="shrink-0">{r.correct ? "✓" : "✗"}</span>
                  <span>{r.question}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => {
            setCurrentIndex(0);
            setScore(0);
            setFinished(false);
            setShowNext(false);
            setStreak(0);
            setXp(0);
            setResults([]);
          }}
          className="mt-6 bg-plava text-white px-6 py-3 rounded-lg hover:bg-plava-dark transition-colors"
        >
          Pokušaj ponovo
        </button>
        {nextExerciseId && (
          <a
            href={`/vezba/${nextExerciseId}`}
            className="mt-3 block text-center bg-plava text-white px-6 py-3 rounded-lg hover:bg-plava-dark transition-colors font-medium"
          >
            Sledeća vežba →
          </a>
        )}
        {!nextExerciseId && nextLessonId && (
          <a
            href={`/lekcija/${nextLessonId}`}
            className="mt-3 block text-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Sledeća lekcija →
          </a>
        )}
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

      {/* Audio player — per-question if audio_url exists */}
      {question?.audio_url && (
        <div className="mb-6 bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-2">Poslušaj audio:</p>
          <audio controls className="w-full" key={question.audio_url}>
            <source src={question.audio_url} type="audio/mpeg" />
          </audio>
        </div>
      )}

      {/* Streak counter */}
      {streak >= 2 && (
        <div className="text-center mb-4 animate-bounce">
          <span className="text-lg font-bold text-orange-500">
            🔥 {streak} u nizu!
          </span>
        </div>
      )}

      {/* Question — type determined per-question from options.type, or exercise_type as fallback */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        {(() => {
          // Dialog exercise — handles its own flow, including summary
          if (exercise.exercise_type === "dialog") {
            const dialogConfig = question.options as {
              scenario: string;
              ai_role: string;
              level: string;
              dialog_mode: "guided" | "free";
              max_turns: number;
              goals: string[];
              intro_text: string;
              opening_message: string;
              system_prompt_extra?: string;
            };
            return (
              <DialogExercise
                key={question.id}
                exerciseId={exercise.id}
                config={dialogConfig}
                previousAttempts={dialogAttempts}
                onComplete={(dialogScore, total) => {
                  // Save attempt to DB, but don't set finished — DialogExercise shows its own summary
                  supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string } | null } }) => {
                    if (user) {
                      supabase.from("exercise_attempts").insert({
                        exercise_id: exercise.id,
                        user_id: user.id,
                        score: dialogScore,
                        total_questions: total,
                      });
                    }
                  });
                }}
              />
            );
          }

          // For listen_write exercises, always use EssayExercise
          if (exercise.exercise_type === "listen_write") {
            return (
              <EssayExercise
                key={question.id}
                task={question.question}
                level={level}
                onAnswer={handleAnswer}
                exerciseId={exercise.id}
                lessonId={exercise.lesson_id}
              />
            );
          }

          const parsed = parseOptions(question.options);
          const qType = parsed.type;
          const items = parsed.items;

          if (qType === "quiz") {
            return (
              <QuizExercise
                key={question.id}
                question={question.question}
                options={getItemsAsStringArray(items)}
                correctAnswer={parseInt(question.correct_answer)}
                explanation={question.explanation}
                onAnswer={handleAnswer}
              />
            );
          }
          if (qType === "fill_blank") {
            return (
              <FillBlankExercise
                key={question.id}
                question={question.question}
                options={getItemsAsStringArray(items)}
                correctAnswer={question.correct_answer}
                explanation={question.explanation}
                onAnswer={handleAnswer}
              />
            );
          }
          if (qType === "match_pairs") {
            return (
              <MatchPairsExercise
                key={question.id}
                pairs={Array.isArray(items) ? items as { de: string; sr: string }[] : []}
                onAnswer={handleAnswer}
              />
            );
          }
          if (qType === "word_order") {
            return (
              <WordOrderExercise
                key={question.id}
                words={getItemsAsStringArray(items)}
                correctAnswer={question.correct_answer}
                hint={question.question}
                onAnswer={handleAnswer}
              />
            );
          }
          if (qType === "true_false") {
            return (
              <TrueFalseExercise
                key={question.id}
                question={question.question}
                correctAnswer={question.correct_answer === "true"}
                explanation={question.explanation}
                onAnswer={handleAnswer}
              />
            );
          }
          if (qType === "categorize") {
            const catData = items as { categories: string[]; items: { text: string; category: number }[] };
            return (
              <CategorizeExercise
                key={question.id}
                question={question.question}
                categories={catData.categories}
                items={catData.items}
                onAnswer={handleAnswer}
              />
            );
          }
          if (qType === "typing") {
            return (
              <TypingExercise
                key={question.id}
                question={question.question}
                correctAnswer={question.correct_answer}
                explanation={question.explanation}
                onAnswer={handleAnswer}
              />
            );
          }
          if (qType === "conversation") {
            const convData = items as { messages: { speaker: string; text: string }[]; options: string[] };
            return (
              <ConversationExercise
                key={question.id}
                messages={convData.messages}
                question={question.question}
                options={convData.options}
                correctAnswer={parseInt(question.correct_answer)}
                explanation={question.explanation}
                onAnswer={handleAnswer}
              />
            );
          }
          if (qType === "wordwall") {
            const url = typeof items === "string" ? items : Array.isArray(items) ? items[0] : "";
            return (
              <WordwallExercise
                key={question.id}
                url={url as string}
                onAnswer={(correct) => {
                  handleAnswer(correct);
                  // Auto-advance after wordwall — no need for extra "next" click
                  setTimeout(() => handleNext(), 800);
                }}
              />
            );
          }
          // Fallback: essay
          return (
            <EssayExercise
              key={question.id}
              task={question.question}
              level="A1"
              onAnswer={handleAnswer}
              exerciseId={exercise.id}
              lessonId={exercise.lesson_id}
            />
          );
        })()}
      </div>

      {/* Next button */}
      {showNext && (
        <div className="mt-4 text-right">
          <button
            onClick={handleNext}
            className="bg-plava text-white px-6 py-3 rounded-lg hover:bg-plava-dark transition-colors"
          >
            {currentIndex < questions.length - 1 ? "Sledeće pitanje \u2192" : "Završi vežbu"}
          </button>
        </div>
      )}
    </div>
  );
}
