"use client";

import { useState } from "react";

interface TrueFalseProps {
  question: string;
  correctAnswer: boolean;
  explanation: string | null;
  onAnswer: (correct: boolean) => void;
}

export default function TrueFalseExercise({ question, correctAnswer, explanation, onAnswer }: TrueFalseProps) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (value: boolean) => {
    if (answered) return;
    setSelected(value);
    setAnswered(true);
    onAnswer(value === correctAnswer);
  };

  return (
    <div>
      <p className="text-lg font-medium text-gray-900 mb-6">{question}</p>
      <div className="flex gap-4">
        {[true, false].map((value) => {
          let cls = "flex-1 text-center py-4 border-2 rounded-xl text-lg font-semibold transition-colors cursor-pointer ";
          if (!answered) {
            cls += "border-gray-100 hover:border-plava hover:bg-plava-light text-gray-700";
          } else if (value === correctAnswer) {
            cls += "border-green-500 bg-green-50 text-green-700";
          } else if (value === selected) {
            cls += "border-koral bg-koral-light text-koral-dark";
          } else {
            cls += "border-gray-100 text-gray-400";
          }
          return (
            <button key={String(value)} onClick={() => handleSelect(value)} className={cls} disabled={answered}>
              {value ? "Tačno" : "Netačno"}
            </button>
          );
        })}
      </div>
      {answered && selected !== correctAnswer && explanation && (
        <div className="mt-4 bg-koral-light border-l-4 border-koral rounded-lg p-4 text-sm text-koral-dark">
          {explanation}
        </div>
      )}
    </div>
  );
}
