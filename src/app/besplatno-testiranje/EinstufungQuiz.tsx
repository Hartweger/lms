// src/app/test-nivoa/EinstufungQuiz.tsx
"use client";

import { useState, useCallback } from "react";
import { HALF_LEVELS, getQuestionsForLevel, type HalfLevel } from "./lib/questions";
import { scoreBlock, shouldContinue, calculateResult, type BlockScore, type TestResult } from "./lib/scoring";
import QuizIntro from "./components/QuizIntro";
import QuizProgress from "./components/QuizProgress";
import QuizQuestion from "./components/QuizQuestion";
import QuizLevelTransition from "./components/QuizLevelTransition";
import QuizEmailGate from "./components/QuizEmailGate";
import QuizResult from "./components/QuizResult";

type Phase = "intro" | "question" | "transition" | "email" | "result";

export default function EinstufungQuiz() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [blockScores, setBlockScores] = useState<BlockScore[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [showFullResult, setShowFullResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentLevel = HALF_LEVELS[currentLevelIndex];
  const currentQuestions = getQuestionsForLevel(currentLevel);
  const currentQuestion = currentQuestions[currentQuestionIndex];

  const handleStart = useCallback(() => {
    setPhase("question");
  }, []);

  const handleAnswer = useCallback((answerIndex: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);

    const questionId = currentQuestions[currentQuestionIndex].id;
    const newAnswers = { ...answers, [questionId]: answerIndex };
    setAnswers(newAnswers);

    // Auto-advance after short delay
    setTimeout(() => {
      setSelectedAnswer(null);

      if (currentQuestionIndex < 9) {
        // Next question in block
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Block complete - score it
        const score = scoreBlock(currentQuestions, newAnswers);
        const newBlockScores = [...blockScores, { level: currentLevel, correct: score, total: 10 }];
        setBlockScores(newBlockScores);

        const action = shouldContinue(score);
        const isLastLevel = currentLevelIndex >= HALF_LEVELS.length - 1;

        if (isLastLevel || action === "stop") {
          // Go to results
          const testResult = calculateResult(newBlockScores);
          setResult(testResult);
          setPhase("email");
        } else {
          // Show transition screen
          setPhase("transition");
        }
      }
    }, 400);
  }, [selectedAnswer, currentQuestionIndex, currentQuestions, answers, blockScores, currentLevel, currentLevelIndex]);

  const handleContinue = useCallback(() => {
    setCurrentLevelIndex(currentLevelIndex + 1);
    setCurrentQuestionIndex(0);
    setPhase("question");
  }, [currentLevelIndex]);

  const handleStop = useCallback(() => {
    const testResult = calculateResult(blockScores);
    setResult(testResult);
    setPhase("email");
  }, [blockScores]);

  const handleEmailSubmit = useCallback(async (email: string) => {
    if (!result) return;
    setIsSubmitting(true);
    try {
      const scores: Record<string, number> = {};
      for (const s of result.scores) {
        scores[s.level] = s.correct;
      }
      await fetch("/api/besplatno-testiranje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          scores,
          recommendedLevel: result.recommendedLevel,
          totalQuestions: result.totalQuestions,
          totalCorrect: result.totalCorrect,
        }),
      });
    } catch {
      // Silently fail - still show result
    }
    setIsSubmitting(false);
    setShowFullResult(true);
    setPhase("result");
  }, [result]);

  const handleEmailSkip = useCallback(async () => {
    if (result) {
      try {
        const scores: Record<string, number> = {};
        for (const s of result.scores) {
          scores[s.level] = s.correct;
        }
        await fetch("/api/besplatno-testiranje-anon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scores,
            recommendedLevel: result.recommendedLevel,
            totalQuestions: result.totalQuestions,
            totalCorrect: result.totalCorrect,
          }),
        });
      } catch {
        // Silently fail
      }
    }
    setShowFullResult(false);
    setPhase("result");
  }, [result]);

  // Get last block score for transition screen
  const lastBlockScore = blockScores[blockScores.length - 1];
  const lastAction = lastBlockScore ? shouldContinue(lastBlockScore.correct) : "stop";
  const nextLevel = currentLevelIndex < HALF_LEVELS.length - 1 ? HALF_LEVELS[currentLevelIndex + 1] : undefined;

  return (
    <div className="min-h-[60vh] py-8 px-4">
      {phase === "intro" && (
        <QuizIntro onStart={handleStart} />
      )}

      {phase === "question" && currentQuestion && (
        <div className="max-w-2xl mx-auto">
          <QuizProgress
            currentLevel={currentLevel}
            questionIndex={currentQuestionIndex}
            totalBlocks={blockScores.length}
          />
          <QuizQuestion
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleAnswer}
            selectedAnswer={selectedAnswer}
          />
        </div>
      )}

      {phase === "transition" && lastBlockScore && (
        <QuizLevelTransition
          completedLevel={lastBlockScore.level}
          score={lastBlockScore.correct}
          action={lastAction}
          nextLevel={nextLevel}
          onContinue={handleContinue}
          onStop={handleStop}
        />
      )}

      {phase === "email" && result && (
        <QuizEmailGate
          recommendedLevel={result.recommendedLevel}
          onSubmit={handleEmailSubmit}
          onSkip={handleEmailSkip}
          isLoading={isSubmitting}
        />
      )}

      {phase === "result" && result && (
        <>
          <QuizResult
            result={result}
            showFull={showFullResult}
            onRequestEmail={!showFullResult ? () => setPhase("email") : undefined}
          />
          <div className="text-center mt-8">
            <button
              onClick={() => {
                setPhase("intro");
                setCurrentLevelIndex(0);
                setCurrentQuestionIndex(0);
                setAnswers({});
                setBlockScores([]);
                setSelectedAnswer(null);
                setResult(null);
                setShowFullResult(false);
              }}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Uradi test ponovo
            </button>
          </div>
        </>
      )}
    </div>
  );
}
