"use client";

import { useState } from "react";

interface FillBlankProps {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string | null;
  onAnswer: (correct: boolean) => void;
}

export default function FillBlankExercise({ question, options, correctAnswer, explanation, onAnswer }: FillBlankProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (word: string) => {
    if (answered) return;
    setSelected(word);
    setAnswered(true);
    onAnswer(word === correctAnswer);
  };

  const parts = question.split("___");

  return (
    <div>
      <div className="text-lg text-gray-900 mb-6 leading-relaxed">
        {parts[0]}
        <span className="inline-block min-w-[100px] border-b-[3px] border-plava text-center mx-1 px-2 font-semibold text-plava">
          {selected || "___"}
        </span>
        {parts[1]}
      </div>
      <div className="flex gap-3 flex-wrap">
        {options.map((word) => {
          let cls = "px-5 py-3 rounded-full border-2 text-sm font-medium transition-colors ";
          if (!answered) {
            cls += "border-gray-200 hover:border-plava hover:bg-plava-light text-gray-700 cursor-pointer";
          } else if (word === correctAnswer) {
            cls += "border-green-500 bg-green-50 text-green-700";
          } else if (word === selected) {
            cls += "border-koral bg-koral-light text-koral-dark";
          } else {
            cls += "border-gray-100 text-gray-300";
          }
          return (
            <button key={word} onClick={() => handleSelect(word)} className={cls} disabled={answered}>
              {word}
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
          Tacno!
        </div>
      )}
    </div>
  );
}
