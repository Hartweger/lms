"use client";

import { useState } from "react";

interface FillBlankProps {
  question: string; // Text with ______ placeholders (can have multiple)
  options: string[]; // Word bank — correct answers (shuffled for display)
  correctAnswer: string; // Comma-separated answers in order: "komme, bin, wohne"
  explanation: string | null;
  onAnswer: (correct: boolean) => void;
}

export default function FillBlankExercise({ question, options, correctAnswer, explanation, onAnswer }: FillBlankProps) {
  const correctAnswers = correctAnswer.split(",").map((a) => a.trim());
  const blankCount = (question.match(/______/g) || []).length || 1;

  // Shuffle word bank (options + maybe extra distractors)
  const [wordBank] = useState(() => {
    const words = [...options];
    // Shuffle
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
    return words;
  });

  const [filledBlanks, setFilledBlanks] = useState<(string | null)[]>(
    new Array(blankCount).fill(null)
  );
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const handleWordClick = (word: string) => {
    if (answered || usedWords.has(word)) return;

    // Find first empty blank
    const emptyIndex = filledBlanks.findIndex((b) => b === null);
    if (emptyIndex === -1) return;

    const newBlanks = [...filledBlanks];
    newBlanks[emptyIndex] = word;
    setFilledBlanks(newBlanks);
    setUsedWords(new Set([...usedWords, word]));
  };

  const handleBlankClick = (index: number) => {
    if (answered) return;
    const word = filledBlanks[index];
    if (!word) return;

    // Remove word from blank
    const newBlanks = [...filledBlanks];
    newBlanks[index] = null;
    setFilledBlanks(newBlanks);
    const newUsed = new Set(usedWords);
    newUsed.delete(word);
    setUsedWords(newUsed);
  };

  const handleCheck = () => {
    if (answered) return;

    let correct = 0;
    for (let i = 0; i < blankCount; i++) {
      if (filledBlanks[i]?.toLowerCase() === correctAnswers[i]?.toLowerCase()) {
        correct++;
      }
    }

    setCorrectCount(correct);
    setAnswered(true);
    onAnswer(correct === blankCount);
  };

  const allFilled = filledBlanks.every((b) => b !== null);

  // Split question into parts around ______
  const parts = question.split("______");

  return (
    <div>
      {/* Word bank */}
      <div className="flex gap-2 flex-wrap mb-6">
        {wordBank.map((word, i) => {
          const isUsed = usedWords.has(word);
          return (
            <button
              key={`${word}-${i}`}
              onClick={() => handleWordClick(word)}
              disabled={isUsed || answered}
              className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-colors ${
                isUsed
                  ? "border-gray-100 text-gray-300 bg-gray-50"
                  : "border-plava-light text-plava hover:bg-plava-light cursor-pointer"
              }`}
            >
              {word}
            </button>
          );
        })}
      </div>

      {/* Text with blanks */}
      <div className="text-lg text-gray-900 leading-loose mb-6">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <button
                onClick={() => handleBlankClick(i)}
                className={`inline-block min-w-[100px] mx-1 px-3 py-1 border-b-[3px] rounded text-center font-semibold transition-colors ${
                  !answered
                    ? filledBlanks[i]
                      ? "border-plava bg-plava-light text-plava cursor-pointer"
                      : "border-gray-300 text-gray-400"
                    : filledBlanks[i]?.toLowerCase() === correctAnswers[i]?.toLowerCase()
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-koral bg-koral-light text-koral-dark"
                }`}
              >
                {filledBlanks[i] || "______"}
              </button>
            )}
          </span>
        ))}
      </div>

      {/* Show correct answers for wrong ones */}
      {answered && correctCount < blankCount && (
        <div className="mb-4 bg-koral-light border-l-4 border-koral rounded-lg p-4 text-sm text-koral-dark">
          <div className="font-medium mb-1">Tačni odgovori:</div>
          {correctAnswers.map((answer, i) => (
            <span key={i}>
              {i > 0 && ", "}
              <span className={
                filledBlanks[i]?.toLowerCase() === answer.toLowerCase()
                  ? "text-green-700 font-medium"
                  : "text-koral-dark font-bold"
              }>
                {answer}
              </span>
            </span>
          ))}
          {explanation && <div className="mt-2">{explanation}</div>}
        </div>
      )}

      {/* Score */}
      {answered && (
        <div className={`mb-4 rounded-lg p-4 text-sm ${
          correctCount === blankCount
            ? "bg-green-50 border-l-4 border-green-500 text-green-700"
            : "bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700"
        }`}>
          {correctCount === blankCount
            ? "Tačno! Bravo!"
            : `${correctCount} od ${blankCount} tačno`
          }
        </div>
      )}

      {/* Check button */}
      {!answered && (
        <button
          onClick={handleCheck}
          disabled={!allFilled}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            allFilled
              ? "bg-plava text-white hover:bg-plava-dark cursor-pointer"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Proveri
        </button>
      )}
    </div>
  );
}
