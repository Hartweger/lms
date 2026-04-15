"use client";

import { useState } from "react";

interface WordOrderProps {
  words: string[];
  correctAnswer: string;
  hint: string;
  onAnswer: (correct: boolean) => void;
}

export default function WordOrderExercise({ words, correctAnswer, hint, onAnswer }: WordOrderProps) {
  const [placed, setPlaced] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const available = words.filter((w) => !placed.includes(w));

  const handlePlace = (word: string) => {
    if (answered) return;
    setPlaced([...placed, word]);
  };

  const handleRemove = (index: number) => {
    if (answered) return;
    setPlaced(placed.filter((_, i) => i !== index));
  };

  const handleCheck = () => {
    const result = placed.join(" ");
    const correct = result === correctAnswer;
    setIsCorrect(correct);
    setAnswered(true);
    onAnswer(correct);
  };

  return (
    <div>
      <p className="text-lg font-medium text-gray-900 mb-2">Poredaj reci u pravilnu recenicu:</p>
      <p className="text-sm text-gray-400 mb-6">Prevod: {hint}</p>

      {/* Sentence area */}
      <div className="min-h-[56px] border-2 border-dashed border-gray-200 rounded-xl p-3 flex gap-2 flex-wrap mb-4">
        {placed.map((word, i) => (
          <button
            key={i}
            onClick={() => handleRemove(i)}
            className="px-4 py-2 bg-plava text-white rounded-lg text-sm font-medium"
          >
            {word}
          </button>
        ))}
        {placed.length === 0 && (
          <span className="text-gray-300 text-sm py-2">Klikni na reci ispod...</span>
        )}
      </div>

      {/* Available words */}
      <div className="flex gap-2 flex-wrap mb-6">
        {available.map((word) => (
          <button
            key={word}
            onClick={() => handlePlace(word)}
            disabled={answered}
            className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-700 hover:border-plava cursor-pointer"
          >
            {word}
          </button>
        ))}
      </div>

      {!answered && placed.length === words.length && (
        <button
          onClick={handleCheck}
          className="bg-plava text-white px-6 py-3 rounded-lg hover:bg-plava-dark transition-colors"
        >
          Proveri
        </button>
      )}

      {answered && isCorrect && (
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 text-sm text-green-700">
          Tacno! Bravo!
        </div>
      )}
      {answered && !isCorrect && (
        <div className="bg-koral-light border-l-4 border-koral rounded-lg p-4 text-sm text-koral-dark">
          Netacno. Tacan odgovor: <strong>{correctAnswer}</strong>
        </div>
      )}
    </div>
  );
}
