// src/app/test-nivoa/components/QuizLevelTransition.tsx

import type { HalfLevel } from "../lib/questions";

interface QuizLevelTransitionProps {
  completedLevel: HalfLevel;
  score: number;
  action: "auto" | "ask" | "stop";
  nextLevel?: HalfLevel;
  onContinue: () => void;
  onStop: () => void;
}

export default function QuizLevelTransition({
  completedLevel,
  score,
  action,
  nextLevel,
  onContinue,
  onStop,
}: QuizLevelTransitionProps) {
  return (
    <div className="max-w-lg mx-auto text-center py-12">
      <div className="text-5xl mb-4">
        {score >= 8 ? "🎉" : score >= 4 ? "👍" : "📊"}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {completedLevel} - {score}/10
      </h2>
      <div className="w-full bg-gray-100 rounded-full h-3 mb-6">
        <div
          className={`rounded-full h-3 transition-all ${score >= 8 ? "bg-zelena" : score >= 4 ? "bg-narandzasta" : "bg-koral"}`}
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>

      {action === "auto" && nextLevel && (
        <>
          <p className="text-gray-600 mb-6">Odlično! Nastavljamo na {nextLevel}.</p>
          <button
            onClick={onContinue}
            className="bg-plava text-white px-8 py-3 rounded-xl font-medium hover:bg-plava-dark transition-colors"
          >
            Nastavi →
          </button>
        </>
      )}

      {action === "ask" && nextLevel && (
        <>
          <p className="text-gray-600 mb-6">Želiš li da probaš teži nivo?</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={onContinue}
              className="bg-plava text-white px-8 py-3 rounded-xl font-medium hover:bg-plava-dark transition-colors"
            >
              Da, nastavi →
            </button>
            <button
              onClick={onStop}
              className="border-2 border-gray-200 text-gray-600 px-8 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Ne, prikaži rezultat
            </button>
          </div>
        </>
      )}

      {action === "stop" && (
        <>
          <p className="text-gray-600 mb-6">Test je završen. Pogledaj svoj rezultat!</p>
          <button
            onClick={onStop}
            className="bg-plava text-white px-8 py-3 rounded-xl font-medium hover:bg-plava-dark transition-colors"
          >
            Prikaži rezultat →
          </button>
        </>
      )}
    </div>
  );
}
