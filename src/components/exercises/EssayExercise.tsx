"use client";

import { useState } from "react";

interface EssayProps {
  task: string;
  level: string;
  onAnswer: (correct: boolean) => void;
}

interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

interface AIFeedback {
  feedback: string;
  corrections: Correction[];
  score: number | null;
}

export default function EssayExercise({ task, level, onAnswer }: EssayProps) {
  const [text, setText] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<AIFeedback | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setChecking(true);

    try {
      const response = await fetch("/api/check-essay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, task, level }),
      });
      const data = await response.json();
      setResult(data);
      onAnswer((data.score || 0) >= 3);
    } catch {
      setResult({
        feedback: "Greška pri proveri. Pokušaj ponovo.",
        corrections: [],
        score: null,
      });
    }
    setChecking(false);
  };

  const scoreLabels: Record<number, string> = {
    1: "Treba još vežbe",
    2: "Na dobrom si putu",
    3: "Dobro!",
    4: "Vrlo dobro!",
    5: "Odlično!",
  };

  const scoreColors: Record<number, string> = {
    1: "text-koral",
    2: "text-orange-500",
    3: "text-yellow-600",
    4: "text-green-500",
    5: "text-green-600",
  };

  return (
    <div>
      <div className="mb-4">
        <p className="text-lg font-medium text-gray-900 mb-2">Zadatak:</p>
        <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{task}</p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={!!result}
        placeholder="Napiši odgovor na nemačkom..."
        rows={6}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-plava focus:border-transparent resize-none text-gray-700 disabled:bg-gray-50"
      />

      {!result && (
        <button
          onClick={handleSubmit}
          disabled={checking || !text.trim()}
          className="mt-4 bg-plava text-white px-6 py-3 rounded-lg hover:bg-plava-dark transition-colors disabled:opacity-50"
        >
          {checking ? "AI proverava..." : "Proveri odgovor"}
        </button>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          {/* Score */}
          {result.score && (
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-bold ${scoreColors[result.score]}`}>
                {result.score}/5
              </span>
              <span className={`text-sm font-medium ${scoreColors[result.score]}`}>
                {scoreLabels[result.score]}
              </span>
            </div>
          )}

          {/* Feedback */}
          <div className="bg-plava-light rounded-xl p-4">
            <p className="text-sm text-gray-700">{result.feedback}</p>
          </div>

          {/* Corrections */}
          {result.corrections && result.corrections.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Ispravke:</h4>
              {result.corrections.map((c, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-100 p-3">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-koral line-through">{c.original}</span>
                    <span className="text-gray-400">&rarr;</span>
                    <span className="text-green-600 font-medium">{c.corrected}</span>
                  </div>
                  {c.explanation && (
                    <p className="text-xs text-gray-400 mt-1">{c.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
