"use client";

import { useState } from "react";
import Link from "next/link";

interface DialogMessage {
  role: "user" | "assistant";
  content: string;
}

interface Translation {
  de: string;
  sr: string;
}

interface AiDialogExerciseProps {
  lessonId: string;
  lessonTitle: string;
}

export default function AiDialogExercise({ lessonId, lessonTitle }: AiDialogExerciseProps) {
  const [messages, setMessages] = useState<DialogMessage[]>([]);
  const [scenario, setScenario] = useState<string | null>(null);
  const [options, setOptions] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [turnNumber, setTurnNumber] = useState(1);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startDialog = async () => {
    setStarted(true);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai-dialog-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, messages: [], turnNumber: 1 }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Greška pri pokretanju.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setScenario(data.scenario || null);
      setMessages([{ role: "assistant", content: data.aiMessage }]);
      setOptions(data.options || null);
      setTurnNumber(2);
    } catch {
      setError("Greška pri povezivanju sa serverom.");
    }
    setLoading(false);
  };

  const selectOption = async (option: string) => {
    setLoading(true);
    setError(null);

    const newMessages: DialogMessage[] = [
      ...messages,
      { role: "user", content: option },
    ];
    setMessages(newMessages);
    setOptions(null);

    try {
      const res = await fetch("/api/ai-dialog-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, messages: newMessages, turnNumber }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Greška.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.aiMessage }]);
      setOptions(data.options || null);
      setTurnNumber(turnNumber + 1);

      if (data.finished) {
        setFinished(true);
        setSummary(data.summary || null);
        setTranslations(data.translations || []);
      }
    } catch {
      setError("Greška pri povezivanju sa serverom.");
    }
    setLoading(false);
  };

  const restart = () => {
    setMessages([]);
    setScenario(null);
    setOptions(null);
    setLoading(false);
    setFinished(false);
    setSummary(null);
    setTranslations([]);
    setTurnNumber(1);
    setStarted(false);
    setError(null);
  };

  // Pre-start state
  if (!started) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 px-4">
        <div className="text-3xl mb-4">💬</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Vežbaj u dijalogu</h2>
        <p className="text-sm text-gray-500 mb-2">{lessonTitle}</p>
        <p className="text-xs text-gray-400 mb-6 max-w-sm mx-auto">
          Vodićeš kratki razgovor na nemačkom u 5 koraka — biraš jedan od dva ponuđena odgovora.
          Na kraju dobijaš ceo dijalog sa prevodom.
          Ova vežba koristi veštačku inteligenciju i može povremeno sadržati greške.
        </p>
        <button
          onClick={startDialog}
          className="bg-plava text-white px-8 py-3 rounded-lg font-medium hover:bg-plava-dark transition-colors"
        >
          Započni dijalog
        </button>
      </div>
    );
  }

  // Finished state
  if (finished) {
    return (
      <div className="max-w-lg mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🎉</div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Bravo!</h2>
          {summary && <p className="text-sm text-gray-500">{summary}</p>}
        </div>

        {/* Translation review */}
        {translations.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Ceo dijalog sa prevodom:</h3>
            <div className="space-y-3">
              {translations.map((t, i) => (
                <div key={i} className="text-sm">
                  <p className="font-medium text-gray-900">{t.de}</p>
                  <p className="text-gray-400 text-xs">{t.sr}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <Link
            href={`/lekcija/${lessonId}`}
            className="block w-full text-center py-3 bg-plava text-white rounded-lg text-sm font-medium hover:bg-plava-dark transition-colors"
          >
            Nazad na lekciju
          </Link>
        </div>
      </div>
    );
  }

  // Active dialog state
  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {/* Scenario */}
      {scenario && (
        <div className="bg-plava-light rounded-lg px-4 py-3 mb-6 text-sm text-plava-dark">
          {scenario}
        </div>
      )}

      {/* Messages */}
      <div className="space-y-3 mb-6">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                msg.role === "user"
                  ? "bg-plava text-white rounded-br-md"
                  : "bg-gray-100 text-gray-900 rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-400 px-4 py-3 rounded-2xl rounded-bl-md text-sm">
              ...
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      {options && !loading && (
        <div className="space-y-2">
          {options.map((option, i) => (
            <button
              key={i}
              onClick={() => selectOption(option)}
              className="w-full text-left px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm hover:border-plava hover:bg-plava-light transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-koral-light text-koral-dark px-4 py-3 rounded-lg text-sm mt-4">
          {error}
        </div>
      )}

      {/* Turn indicator */}
      <div className="mt-6 flex justify-center">
        <span className="text-xs text-gray-300">
          {turnNumber - 1} / 5
        </span>
      </div>
    </div>
  );
}
