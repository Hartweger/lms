"use client";

import { useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";

export interface QuizOption {
  text?: string;
  image?: string;
  alt?: string;
}

interface QuizProps {
  question: string;
  options: (string | QuizOption)[];
  correctAnswer: number;
  explanation: string | null;
  onAnswer: (correct: boolean) => void;
}

function normalizeOption(opt: string | QuizOption): QuizOption {
  if (typeof opt === "string") return { text: opt };
  return opt;
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

  const hasImages = options.some((o) => typeof o === "object" && o.image);

  return (
    <div>
      {question.includes("<") ? (
        <div className="text-lg font-medium text-gray-900 mb-6" dangerouslySetInnerHTML={{ __html: sanitizeHtml(question) }} />
      ) : (
        <p className="text-lg font-medium text-gray-900 mb-6">{question}</p>
      )}
      <div className={hasImages ? "grid grid-cols-2 sm:grid-cols-3 gap-3" : "space-y-3"}>
        {options.map((raw, i) => {
          const opt = normalizeOption(raw);
          let cls = "text-left border-2 rounded-xl transition-colors ";
          if (!answered) {
            cls += "border-gray-100 hover:border-plava hover:bg-plava-light text-gray-700 cursor-pointer";
          } else if (i === correctAnswer) {
            cls += "border-green-500 bg-green-50 text-green-700";
          } else if (i === selected) {
            cls += "border-koral bg-koral-light text-koral-dark";
          } else {
            cls += "border-gray-100 text-gray-400";
          }

          if (opt.image) {
            return (
              <button key={i} onClick={() => handleSelect(i)} className={`${cls} p-2 flex flex-col items-center gap-2`} disabled={answered}>
                <img
                  src={opt.image}
                  alt={opt.alt || opt.text || `Option ${i + 1}`}
                  className="w-full max-h-40 object-contain rounded-lg"
                />
                {opt.text && <span className="text-sm font-medium text-center">{opt.text}</span>}
              </button>
            );
          }

          return (
            <button key={i} onClick={() => handleSelect(i)} className={`${cls} w-full px-5 py-4`} disabled={answered}>
              {opt.text}
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
          Tačno! Bravo!
        </div>
      )}
    </div>
  );
}
