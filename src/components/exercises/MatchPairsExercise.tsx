"use client";

import { useState, useEffect } from "react";

interface MatchPairsProps {
  pairs: { de: string; sr: string }[];
  onAnswer: (correct: boolean) => void;
}

export default function MatchPairsExercise({ pairs, onAnswer }: MatchPairsProps) {
  const [selectedDe, setSelectedDe] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({});
  const [wrong, setWrong] = useState<string | null>(null);

  const [shuffledSr] = useState(() =>
    [...pairs].sort(() => Math.random() - 0.5).map((p) => p.sr)
  );

  const allMatched = Object.keys(matched).length === pairs.length;

  useEffect(() => {
    if (allMatched) {
      onAnswer(true);
    }
  }, [allMatched, onAnswer]);

  const handleDeClick = (de: string) => {
    if (matched[de]) return;
    setSelectedDe(de);
    setWrong(null);
  };

  const handleSrClick = (sr: string) => {
    if (!selectedDe || Object.values(matched).includes(sr)) return;
    const pair = pairs.find((p) => p.de === selectedDe);
    if (pair?.sr === sr) {
      setMatched({ ...matched, [selectedDe]: sr });
      setSelectedDe(null);
    } else {
      setWrong(sr);
      setTimeout(() => setWrong(null), 800);
    }
  };

  return (
    <div>
      <p className="text-lg font-medium text-gray-900 mb-6">Spoji nemacku rec sa prevodom:</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          {pairs.map((p) => (
            <button
              key={p.de}
              onClick={() => handleDeClick(p.de)}
              disabled={!!matched[p.de]}
              className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                matched[p.de]
                  ? "border-green-500 bg-green-50 text-green-700"
                  : selectedDe === p.de
                  ? "border-plava bg-plava-light text-plava"
                  : "border-gray-200 hover:border-plava text-gray-700 cursor-pointer"
              }`}
            >
              {p.de}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {shuffledSr.map((sr) => (
            <button
              key={sr}
              onClick={() => handleSrClick(sr)}
              disabled={Object.values(matched).includes(sr)}
              className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                Object.values(matched).includes(sr)
                  ? "border-green-500 bg-green-50 text-green-700"
                  : wrong === sr
                  ? "border-koral bg-koral-light text-koral-dark"
                  : "border-gray-200 hover:border-plava text-gray-700 cursor-pointer"
              }`}
            >
              {sr}
            </button>
          ))}
        </div>
      </div>
      {allMatched && (
        <div className="mt-4 bg-green-50 border-l-4 border-green-500 rounded-lg p-4 text-sm text-green-700">
          Sve tacno! Bravo!
        </div>
      )}
    </div>
  );
}
