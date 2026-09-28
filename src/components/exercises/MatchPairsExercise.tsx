"use client";

import { useState } from "react";
import {
  buildSrTokens,
  resolveSrClick,
  isTokenUsed,
  isComplete,
  type MatchedMap,
  type SrToken,
} from "@/lib/match-pairs";

interface MatchPairsProps {
  pairs: { de: string; sr: string }[];
  onAnswer: (correct: boolean) => void;
}

export default function MatchPairsExercise({ pairs, onAnswer }: MatchPairsProps) {
  // Both sides are identified by row, not by the text on the button: a set may
  // repeat the same prompt on the left or the same target on the right.
  const [selectedDeIdx, setSelectedDeIdx] = useState<number | null>(null);
  const [matched, setMatched] = useState<MatchedMap>({});
  const [wrong, setWrong] = useState<number | null>(null);

  const [shuffledSr] = useState<SrToken[]>(() =>
    [...buildSrTokens(pairs)].sort(() => Math.random() - 0.5)
  );
  const [done, setDone] = useState(false);

  const allMatched = isComplete(pairs, matched);

  const handleDeClick = (idx: number) => {
    if (matched[idx] !== undefined) return;
    setSelectedDeIdx(idx);
    setWrong(null);
  };

  const handleSrClick = (token: SrToken) => {
    if (selectedDeIdx === null || isTokenUsed(matched, token.id)) return;
    const reserved = resolveSrClick(pairs, matched, selectedDeIdx, token);
    if (reserved !== null) {
      const newMatched = { ...matched, [selectedDeIdx]: reserved };
      setMatched(newMatched);
      setSelectedDeIdx(null);
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
          {pairs.map((p, i) => (
            <button
              key={i}
              onClick={() => handleDeClick(i)}
              disabled={matched[i] !== undefined}
              className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                matched[i] !== undefined
                  ? "border-green-500 bg-green-50 text-green-700"
                  : selectedDeIdx === i
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
