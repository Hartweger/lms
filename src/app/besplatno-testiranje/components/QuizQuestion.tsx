// src/app/test-nivoa/components/QuizQuestion.tsx

import type { Question } from "../lib/questions";

interface QuizQuestionProps {
  question: Question;
  onAnswer: (answerIndex: number) => void;
  selectedAnswer: number | null;
}

const optionLabels = ["a", "b", "c", "d"];

export default function QuizQuestion({ question, onAnswer, selectedAnswer }: QuizQuestionProps) {
  return (
    <div className="max-w-2xl mx-auto animate-[fadeIn_0.3s_ease-in]">
      {question.context && (
        <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-2 font-medium">Pročitaj tekst:</p>
          <p className="text-gray-700 text-sm leading-relaxed italic">{question.context}</p>
        </div>
      )}
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {question.question}
      </h2>
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswer(index)}
            disabled={selectedAnswer !== null}
            className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
              selectedAnswer === null
                ? "border-gray-200 hover:border-plava hover:bg-plava-light cursor-pointer"
                : selectedAnswer === index
                  ? "border-plava bg-plava-light"
                  : "border-gray-100 opacity-50"
            }`}
          >
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-sm font-medium mr-3">
              {optionLabels[index]}
            </span>
            <span className="text-gray-800">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
