"use client";

import { useState } from "react";

interface QuizProps {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string | null;
  onAnswer: (correct: boolean) => void;
}

export default function QuizExercise({ question, options, correctAnswer, explanation, onAnswer }: QuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    onAnswer(index === correctAnswer);
  };

  return (
    <div>
      <p className="text-lg font-medium text-gray-900 mb-6">{question}</p>
      <div className="space-y-3">
        {options.map((option, i) => {
          let cls = "w-full text-left px-5 py-4 border-2 rounded-xl transition-colors ";
          if (!answered) {
            cls += "border-gray-100 hover:border-plava hover:bg-plava-light text-gray-700 cursor-pointer";
          } else if (i === correctAnswer) {
            cls += "border-green-500 bg-green-50 text-green-700";
          } else if (i === selected) {
            cls += "border-koral bg-koral-light text-koral-dark";
          } else {
            cls += "border-gray-100 text-gray-400";
          }
          return (
            <button key={i} onClick={() => handleSelect(i)} className={cls} disabled={answered}>
              {option}
            </button>
          );
        })}
      </div>
      {answered && selected !== correctAnswer && explanation && (
        <div className="mt-4 bg-koral-light border-l-4 border-koral rounded-lg p-4 text-sm text-koral-dark">
          {explanation}
        </div>
      )}
      {answered && selected === correctAnswer && (
        <div className="mt-4 bg-green-50 border-l-4 border-green-500 rounded-lg p-4 text-sm text-green-700">
          Tacno! Bravo!
        </div>
      )}
    </div>
  );
}
