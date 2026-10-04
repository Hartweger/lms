"use client";

import { useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { collapseDigits, spellNumbers } from "@/lib/german-numbers";

interface TypingProps {
  question: string;
  correctAnswer: string;
  explanation: string | null;
  onAnswer: (correct: boolean) => void;
}

// Izjednači tipografske varijante koje polaznik ne može da kuca pouzdano:
// sve crtice u "-", sve navodnike/apostrofe u "'", višestruke razmake u jedan.
function unifyTypography(s: string): string {
  return s
    .replace(/[—–‒―−]/g, "-")
    .replace(/[„“”«»]/g, '"')
    .replace(/[‚’‘´`]/g, "'")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(s: string): string {
  return unifyTypography(s).toLowerCase().replace(/[.!?]+$/g, "")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/\s+/g, " ").trim();
}

// Najblaže poređenje: samo slova/brojevi - interpunkcija i crtice se ignorišu.
function lettersOnly(s: string): string {
  return normalize(s).replace(/[^a-z0-9äöüß ]/gi, "").replace(/\s+/g, " ").trim();
}

// Brojevi: "069 123 456", "069123456" i "null sechs neun ..." su isti odgovor,
// kao i "25" i "fünfundzwanzig".
function numbersCanonical(s: string): string {
  return collapseDigits(lettersOnly(spellNumbers(s.toLowerCase())));
}

export function checkAnswer(input: string, answer: string): boolean {
  // Support multiple correct answers separated by |
  const answers = answer.split("|").map((a) => a.trim());
  const inputNorm = normalize(input);
  const inputLetters = lettersOnly(input);
  const inputDigits = collapseDigits(inputLetters);
  const inputNumbers = numbersCanonical(input);
  return answers.some((a) => {
    if (normalize(a) === inputNorm) return true;
    if (lettersOnly(a) === inputLetters) return true;
    return collapseDigits(lettersOnly(a)) === inputDigits || numbersCanonical(a) === inputNumbers;
  });
}

export default function TypingExercise({ question, correctAnswer, explanation, onAnswer }: TypingProps) {
  const [input, setInput] = useState("");
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (answered || !input.trim()) return;
    const correct = checkAnswer(input, correctAnswer);
    setIsCorrect(correct);
    setAnswered(true);
    onAnswer(correct);
  };

  return (
    <div>
      {question.includes("<") ? (
        <div className="text-lg font-medium text-gray-900 mb-4" dangerouslySetInnerHTML={{ __html: sanitizeHtml(question) }} />
      ) : (
        <p className="text-lg font-medium text-gray-900 mb-4">{question}</p>
      )}
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
              Tačan odgovor: <strong>{correctAnswer.split("|").map((a) => a.trim()).join(" ili ")}</strong>
              {explanation && <p className="mt-1">{explanation}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
