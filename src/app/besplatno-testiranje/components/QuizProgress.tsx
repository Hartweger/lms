// src/app/test-nivoa/components/QuizProgress.tsx

import type { HalfLevel } from "../lib/questions";

interface QuizProgressProps {
  currentLevel: HalfLevel;
  questionIndex: number;   // 0-9 within current block
  totalBlocks: number;     // how many blocks completed so far
}

export default function QuizProgress({ currentLevel, questionIndex, totalBlocks }: QuizProgressProps) {
  const blockProgress = ((questionIndex + 1) / 10) * 100;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">
          {currentLevel} · Pitanje {questionIndex + 1}/10
        </span>
        <span className="text-xs text-gray-400">
          Blok {totalBlocks + 1}/8
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="bg-plava rounded-full h-2 transition-all duration-300"
          style={{ width: `${blockProgress}%` }}
        />
      </div>
    </div>
  );
}
