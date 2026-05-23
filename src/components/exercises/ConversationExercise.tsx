"use client";

import { useState } from "react";

interface ConversationProps {
  messages: { speaker: string; text: string }[];
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string | null;
  onAnswer: (correct: boolean) => void;
}

export default function ConversationExercise({ messages, question, options, correctAnswer, explanation, onAnswer }: ConversationProps) {
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
      {/* Chat messages */}
      <div className="space-y-3 mb-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.speaker === "du" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
              msg.speaker === "du"
                ? "bg-plava text-white rounded-br-sm"
                : "bg-gray-100 text-gray-900 rounded-bl-sm"
            }`}>
              <p className="text-xs opacity-60 mb-1">{msg.speaker === "du" ? "Du" : msg.speaker}</p>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Question */}
      <p className="text-sm font-medium text-gray-500 mb-3">{question}</p>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option, i) => {
          let cls = "w-full text-left px-4 py-3 border-2 rounded-xl text-sm transition-colors ";
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
        <div className="mt-3 bg-koral-light border-l-4 border-koral rounded-lg p-3 text-sm text-koral-dark">
          {explanation}
        </div>
      )}
    </div>
  );
}
