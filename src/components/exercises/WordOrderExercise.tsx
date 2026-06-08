"use client";

import { useState } from "react";

interface WordOrderProps {
  words: string[];
  correctAnswer: string;
  hint: string;
  onAnswer: (correct: boolean) => void;
}

// Normalizuj kao kod provere: ukloni razmak ispred interpunkcije.
function normalize(s: string): string {
  return s.replace(/\s+([.,!?;:])/g, "$1");
}

// Fisher–Yates, ali garantuje da ponuđeni redosled NIJE već tačan odgovor
// (kad postoji više od jednog mogućeg rasporeda). Ranije se ništa nije mešalo,
// pa su se reči javljale u tačnom redosledu.
function shuffleTokens(
  tokens: { id: number; word: string }[],
  correctAnswer: string
): { id: number; word: string }[] {
  if (tokens.length < 2) return [...tokens];
  const target = normalize(correctAnswer);
  let shuffled = [...tokens];
  for (let attempt = 0; attempt < 20; attempt++) {
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    if (normalize(shuffled.map((t) => t.word).join(" ")) !== target) break;
  }
  return shuffled;
}

export default function WordOrderExercise({ words, correctAnswer, hint, onAnswer }: WordOrderProps) {
  // Stabilni id po poziciji — radi ispravno i kad se reč ponavlja u rečenici
  // (npr. dva „ich" / „die"). Ranije je filter po stringu brisao SVE iste reči
  // odjednom, pa se nikad nije moglo doći do dugmeta „Proveri".
  const [tokens] = useState(() =>
    shuffleTokens(words.map((word, i) => ({ id: i, word })), correctAnswer)
  );
  const [placed, setPlaced] = useState<{ id: number; word: string }[]>([]);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const available = tokens.filter((t) => !placed.some((p) => p.id === t.id));

  const handlePlace = (token: { id: number; word: string }) => {
    if (answered) return;
    setPlaced([...placed, token]);
  };

  const handleRemove = (index: number) => {
    if (answered) return;
    setPlaced(placed.filter((_, i) => i !== index));
  };

  const handleCheck = () => {
    const result = normalize(placed.map((p) => p.word).join(" "));
    const correct = result === normalize(correctAnswer);
    setIsCorrect(correct);
    setAnswered(true);
    onAnswer(correct);
  };

  return (
    <div>
      <p className="text-lg font-medium text-gray-900 mb-1">Poređaj reči u pravilnu rečenicu:</p>
      <p className="text-sm text-plava mb-4">({hint})</p>

      {/* Placed words area */}
      <div className="min-h-[56px] border-2 border-dashed border-gray-200 rounded-xl p-3 flex gap-2 flex-wrap mb-2">
        {placed.map((token, i) => (
          <button
            key={token.id}
            onClick={() => handleRemove(i)}
            className="px-4 py-2 bg-plava text-white rounded-lg text-sm font-medium hover:bg-koral transition-colors"
            title="Klikni da vratiš"
          >
            {token.word}
          </button>
        ))}
        {placed.length === 0 && (
          <span className="text-gray-300 text-sm py-2">Tvoja rečenica...</span>
        )}
      </div>
      {!answered && placed.length > 0 && (
        <p className="text-xs text-gray-400 mb-4">Klikni na plavu reč da je vratiš nazad</p>
      )}
      {!answered && placed.length === 0 && (
        <p className="text-xs text-gray-400 mb-4">Klikni na reči ispod redom da sastaviš rečenicu</p>
      )}

      {/* Available words */}
      <div className="flex gap-2 flex-wrap mb-6">
        {available.map((token) => (
          <button
            key={token.id}
            onClick={() => handlePlace(token)}
            disabled={answered}
            className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-700 hover:border-plava cursor-pointer"
          >
            {token.word}
          </button>
        ))}
      </div>

      {!answered && placed.length === tokens.length && (
        <button
          onClick={handleCheck}
          className="bg-plava text-white px-6 py-3 rounded-lg hover:bg-plava-dark transition-colors"
        >
          Proveri
        </button>
      )}

      {answered && isCorrect && (
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 text-sm text-green-700">
          Tačno! Bravo!
        </div>
      )}
      {answered && !isCorrect && (
        <div className="bg-koral-light border-l-4 border-koral rounded-lg p-4 text-sm text-koral-dark">
          Netačno. Tačan odgovor: <strong>{correctAnswer}</strong>
        </div>
      )}
    </div>
  );
}
