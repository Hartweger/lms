"use client";

import { useState } from "react";
import Link from "next/link";

interface Task {
  prompt: string;
  solution: string;
}

interface Result {
  correct: boolean;
  feedback: string;
  corrected: string;
}

interface AiWritingExerciseProps {
  lessonId: string;
  lessonTitle: string;
  instruction: string;
}

export default function AiWritingExercise({ lessonId, lessonTitle, instruction }: AiWritingExerciseProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [results, setResults] = useState<{ task: Task; answer: string; result: Result }[]>([]);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setLoading(true);
    setError(null);
    setStarted(true);
    try {
      const res = await fetch("/api/ai-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, action: "generate", mode: "writing" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Greška.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setTasks(data.sentences);
    } catch {
      setError("Greška pri povezivanju.");
    }
    setLoading(false);
  };

  const check = async () => {
    if (!answer.trim()) return;
    setChecking(true);
    setError(null);
    const current = tasks[currentIndex];
    try {
      const res = await fetch("/api/ai-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          action: "check",
          mode: "writing",
          sentence: current.prompt,
          answer: answer.trim(),
          correct: current.solution,
        }),
      });
      const data = await res.json();
      setResult(data);
      setResults([...results, { task: current, answer: answer.trim(), result: data }]);
    } catch {
      setError("Greška pri proveri.");
    }
    setChecking(false);
  };

  const next = () => {
    if (currentIndex + 1 >= tasks.length) {
      setFinished(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      setAnswer("");
      setResult(null);
    }
  };

  const restart = () => {
    setTasks([]);
    setCurrentIndex(0);
    setAnswer("");
    setResult(null);
    setResults([]);
    setFinished(false);
    setStarted(false);
    setError(null);
  };

  if (!started) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 px-4">
        <div className="text-3xl mb-4">✍️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Napiši rečenice</h2>
        <p className="text-sm text-gray-500 mb-2">{lessonTitle}</p>
        <p className="text-xs text-gray-400 mb-6 max-w-sm mx-auto">
          {instruction} AI proverava tvoj odgovor i može povremeno sadržati greške.
        </p>
        <button
          onClick={start}
          className="bg-plava text-white px-8 py-3 rounded-lg font-medium hover:bg-plava-dark transition-colors"
        >
          Počni
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <p className="text-gray-400">Učitavam zadatke...</p>
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 px-4">
        <p className="text-koral mb-4">{error}</p>
        <button onClick={restart} className="text-plava hover:underline text-sm">Pokušaj ponovo</button>
      </div>
    );
  }

  if (finished) {
    const correctCount = results.filter((r) => r.result.correct).length;
    return (
      <div className="max-w-lg mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">{correctCount === results.length ? "🎉" : correctCount >= results.length / 2 ? "👍" : "💪"}</div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{correctCount} / {results.length} tačno</h2>
          <p className="text-sm text-gray-500">
            {correctCount === results.length ? "Sve tačno! Odlično!" : "Pogledaj ispravke ispod."}
          </p>
        </div>
        <div className="space-y-4 mb-8">
          {results.map((r, i) => (
            <div key={i} className={`rounded-xl p-4 ${r.result.correct ? "bg-green-50" : "bg-koral-light"}`}>
              <p className="text-xs text-gray-500 mb-1">Zadatak:</p>
              <p className="text-sm font-medium text-gray-900 mb-2">{r.task.prompt}</p>
              <p className="text-xs text-gray-500 mb-1">Tvoj odgovor:</p>
              <p className={`text-sm mb-1 ${r.result.correct ? "text-green-700" : "text-koral-dark"}`}>{r.answer}</p>
              {!r.result.correct && (
                <>
                  <p className="text-xs text-gray-500 mb-1">Tačno:</p>
                  <p className="text-sm text-green-700 font-medium">{r.result.corrected}</p>
                </>
              )}
              <p className="text-xs text-gray-400 mt-2">{r.result.feedback}</p>
            </div>
          ))}
        </div>
        <Link
          href={`/lekcija/${lessonId}`}
          className="block w-full text-center py-3 bg-plava text-white rounded-lg text-sm font-medium hover:bg-plava-dark transition-colors"
        >
          Nazad na lekciju
        </Link>
      </div>
    );
  }

  const current = tasks[currentIndex];

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs text-gray-400">{currentIndex + 1} / {tasks.length}</span>
        <div className="flex gap-1">
          {tasks.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < currentIndex ? (results[i]?.result.correct ? "bg-green-400" : "bg-koral") :
                i === currentIndex ? "bg-plava" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 mb-6">
        <p className="text-xs text-gray-400 mb-2">{instruction}</p>
        <p className="text-lg font-medium text-gray-900 whitespace-pre-line">{current?.prompt}</p>
      </div>

      {!result ? (
        <div onKeyDown={(e) => { if (e.key === "Enter" && answer.trim() && !checking) check(); }}>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Napiši rečenicu na nemačkom..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-plava transition-colors"
            autoFocus
            disabled={checking}
          />
          <button
            onClick={check}
            disabled={!answer.trim() || checking}
            className="w-full mt-3 bg-plava text-white py-3 rounded-xl font-medium hover:bg-plava-dark transition-colors disabled:opacity-50"
          >
            {checking ? "Proveravam..." : "Proveri"}
          </button>
        </div>
      ) : (
        <div>
          <div className={`rounded-xl p-4 mb-4 ${result.correct ? "bg-green-50 border border-green-200" : "bg-koral-light border border-koral/20"}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{result.correct ? "✅" : "❌"}</span>
              <span className={`font-bold text-sm ${result.correct ? "text-green-700" : "text-koral-dark"}`}>
                {result.correct ? "Tačno!" : "Nije sasvim tačno"}
              </span>
            </div>
            {!result.correct && (
              <p className="text-sm text-green-700 font-medium mb-1">{result.corrected}</p>
            )}
            <p className="text-xs text-gray-500">{result.feedback}</p>
          </div>
          <button
            onClick={next}
            autoFocus
            className="w-full bg-plava text-white py-3 rounded-xl font-medium hover:bg-plava-dark transition-colors"
          >
            {currentIndex + 1 >= tasks.length ? "Pogledaj rezultate" : "Sledeća →"}
          </button>
        </div>
      )}

      {error && <p className="text-koral text-sm mt-3">{error}</p>}
    </div>
  );
}
