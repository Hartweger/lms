"use client";

import { useState } from "react";
import {
  buildSrTokens,
  resolveSrClick,
  isTokenUsed,
  isComplete,
  type SrToken,
} from "@/lib/match-pairs";

interface MatchPairsProps {
  pairs: { de: string; sr: string }[];
  onAnswer: (correct: boolean) => void;
}

export default function MatchPairsExercise({ pairs, onAnswer }: MatchPairsProps) {
  const [selectedDe, setSelectedDe] = useState<string | null>(null);
  // de -> reserved right-token id (NOT the value: two pairs may share a value)
  const [matched, setMatched] = useState<Record<string, number>>({});
  const [wrong, setWrong] = useState<number | null>(null);

  const [shuffledSr] = useState<SrToken[]>(() =>
    [...buildSrTokens(pairs)].sort(() => Math.random() - 0.5)
  );
  const [done, setDone] = useState(false);

  const allMatched = isComplete(pairs, matched);

  const handleDeClick = (de: string) => {
    if (matched[de] !== undefined) return;
    setSelectedDe(de);
    setWrong(null);
  };

  const handleSrClick = (token: SrToken) => {
    if (!selectedDe || isTokenUsed(matched, token.id)) return;
    const reserved = resolveSrClick(pairs, matched, selectedDe, token);
    if (reserved !== null) {
      const newMatched = { ...matched, [selectedDe]: reserved };
      setMatched(newMatched);
      setSelectedDe(null);
      if (isComplete(pairs, newMatched) && !done) {
        setDone(true);
        onAnswer(true);
      }
    } else {
      setWrong(token.id);
      setTimeout(() => setWrong(null), 800);
    }
  };

  return (
    <div>
      <p className="text-lg font-medium text-gray-900 mb-2">Spoji parove:</p>
      <p className="text-xs text-gray-400 mb-4">Klikni na pojam levo, pa na ono što mu odgovara desno</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          {pairs.map((p) => (
            <button
              key={p.de}
              onClick={() => handleDeClick(p.de)}
              disabled={matched[p.de] !== undefined}
              className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                matched[p.de] !== undefined
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
          {shuffledSr.map((token) => {
            const used = isTokenUsed(matched, token.id);
            return (
              <button
                key={token.id}
                onClick={() => handleSrClick(token)}
                disabled={used}
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  used
                    ? "border-green-500 bg-green-50 text-green-700"
                    : wrong === token.id
                    ? "border-koral bg-koral-light text-koral-dark"
                    : "border-gray-200 hover:border-plava text-gray-700 cursor-pointer"
                }`}
              >
                {token.value}
              </button>
            );
          })}
        </div>
      </div>
      {allMatched && (
        <div className="mt-4 bg-green-50 border-l-4 border-green-500 rounded-lg p-4 text-sm text-green-700">
          Sve tačno! Bravo!
        </div>
      )}
    </div>
  );
}
