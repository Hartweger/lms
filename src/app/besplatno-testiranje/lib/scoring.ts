// src/app/test-nivoa/lib/scoring.ts
import type { HalfLevel, Question } from "./questions";
import { HALF_LEVELS } from "./questions";

export interface BlockScore {
  level: HalfLevel;
  correct: number;
  total: number;
}

export interface TestResult {
  scores: BlockScore[];
  recommendedLevel: HalfLevel | "C1+";
  totalCorrect: number;
  totalQuestions: number;
}

export function scoreBlock(questions: Question[], answers: Record<string, number>): number {
  let correct = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correctIndex) {
      correct++;
    }
  }
  return correct;
}

export function shouldContinue(score: number): "auto" | "ask" | "stop" {
  if (score >= 8) return "auto";
  if (score >= 4) return "ask";
  return "stop";
}

export function getRecommendedLevel(scores: BlockScore[]): HalfLevel | "C1+" {
  for (const block of scores) {
    if (block.correct < 8) {
      return block.level;
    }
  }
  // Passed all blocks
  if (scores.length === HALF_LEVELS.length) {
    return "C1+";
  }
  // Stopped early — recommend the next level after last completed
  const lastLevel = scores[scores.length - 1]?.level;
  const lastIndex = HALF_LEVELS.indexOf(lastLevel);
  if (lastIndex < HALF_LEVELS.length - 1) {
    return HALF_LEVELS[lastIndex + 1];
  }
  return "C1+";
}

export function calculateResult(scores: BlockScore[]): TestResult {
  const totalCorrect = scores.reduce((sum, s) => sum + s.correct, 0);
  const totalQuestions = scores.reduce((sum, s) => sum + s.total, 0);
  return {
    scores,
    recommendedLevel: getRecommendedLevel(scores),
    totalCorrect,
    totalQuestions,
  };
}
