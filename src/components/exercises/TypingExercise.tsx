"use client";

import { useState } from "react";

interface TypingProps {
  question: string;
  correctAnswer: string;
  explanation: string | null;
  onAnswer: (correct: boolean) => void;
}

function normalize(s: string): string {
  return s.trim().toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/\s+/g, " ");
}

export default function TypingExercise({ question, correctAnswer, explanation, onAnswer }: TypingProps) {
  const [input, setInput] = useState("");
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (answered || !input.trim()) return;
    const correct = normalize(input) === normalize(correctAnswer);
    setIsCorrect(correct);
    setAnswered(true);
    onAnswer(correct);
  };

  return (
    <div>
      <p className="text-lg font-medium text-gray-900 mb-4">{question}</p>
      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={answered}
          placeholder="Upiši odgovor..."
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-plava text-gray-900"
          autoComplete="off"
          spellCheck={false}
        />
        {!answered && (
          <button
            onClick={handleSubmit}
            className="bg-plava text-white px-6 py-3 rounded-xl font-semibold hover:bg-plava-dark transition-colors"
          >
            Proveri
          </button>
        )}
      </div>
      {answered && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${isCorrect ? "bg-green-50 text-green-700" : "bg-koral-light text-koral-dark"}`}>
          {isCorrect ? "Tačno!" : (
            <>
              Tačan odgovor: <strong>{correctAnswer}</strong>
              {explanation && <p className="mt-1">{explanation}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
