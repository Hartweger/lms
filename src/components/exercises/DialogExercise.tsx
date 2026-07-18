"use client";

import { useState, useRef, useEffect } from "react";
import { normalizeDialogSummary, type DialogSummary } from "@/lib/dialog-summary";

interface DialogConfig {
  scenario: string;
  ai_role: string;
  level: string;
  dialog_mode: "guided" | "free";
  max_turns: number;
  goals: string[];
  intro_text: string;
  opening_message: string;
  system_prompt_extra?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface DialogExerciseProps {
  exerciseId: string;
  config: DialogConfig;
  previousAttempts: number;
  onComplete: (score: number, total: number) => void;
  // Čuvanje rezultata radi roditelj (ExerciseRunner); ovde se samo prikazuje status
  saving?: boolean;
  saveFailed?: boolean;
  onRetrySave?: () => void;
}

const MAX_ATTEMPTS = 2;

export default function DialogExercise({ exerciseId, config, previousAttempts, onComplete, saving, saveFailed, onRetrySave }: DialogExerciseProps) {
  const [phase, setPhase] = useState<"intro" | "chat" | "summary">("intro");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [turnNumber, setTurnNumber] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completedGoals, setCompletedGoals] = useState<number[]>([]);
  const [summary, setSummary] = useState<DialogSummary | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [attemptCount, setAttemptCount] = useState(previousAttempts);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const startDialog = async () => {
    const initialMessages: ChatMessage[] = [{ role: "assistant", content: config.opening_message }];
    setMessages(initialMessages);
    setPhase("chat");

    // For guided mode, ask AI for the first set of choices
    if (config.dialog_mode === "guided") {
      setLoading(true);
      try {
        const response = await fetch("/api/dialog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exerciseId,
            messages: [...initialMessages, { role: "user", content: "(Student razmišlja šta da kaže...)" }],
            turnNumber: 0,
          }),
        });
        const data = await response.json();
        if (data.choices) {
          setChoices(data.choices);
        }
      } catch {
        // If fetching choices fails, fall back to showing text input
      } finally {
        setLoading(false);
      }
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const newTurn = turnNumber + 1;
    const userMessage: ChatMessage = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setChoices([]);
    setTurnNumber(newTurn);
    setLoading(true);

    try {
      const response = await fetch("/api/dialog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId,
          messages: updatedMessages,
          turnNumber: newTurn,
        }),
      });

      const data = await response.json();

      const aiMessage: ChatMessage = { role: "assistant", content: data.reply };
      setMessages([...updatedMessages, aiMessage]);

      if (data.completed_goals) {
        setCompletedGoals(data.completed_goals);
      }

      if (data.is_finished) {
        const summaryData: DialogSummary = normalizeDialogSummary(data.summary, config.goals);
        setSummary(summaryData);
        setPhase("summary");
        setAttemptCount((prev) => prev + 1);
        onComplete(summaryData.score, summaryData.total);
      } else if (data.choices) {
        setChoices(data.choices);
      }
    } catch {
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: "Greška pri komunikaciji. Pokušaj ponovo." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // --- INTRO SCREEN ---
  if (phase === "intro") {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🗣️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Dijalog: {config.scenario}</h2>
        <p className="text-gray-600 mb-6">{config.intro_text}</p>
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left max-w-md mx-auto">
          <p className="text-sm font-medium text-gray-700 mb-2">Tvoj zadatak:</p>
          <ul className="space-y-1">
            {config.goals.map((goal, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-plava mt-0.5">•</span>
                {goal}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          {config.dialog_mode === "guided" ? "Biraš između ponuđenih odgovora" : "Slobodno piši na nemačkom"} · Max {config.max_turns} razmena
        </p>
        <button
          onClick={startDialog}
          className="bg-plava text-white px-8 py-3 rounded-lg hover:bg-plava-dark transition-colors text-lg"
        >
          Započni dijalog
        </button>
      </div>
    );
  }

  // --- SUMMARY SCREEN ---
  if (phase === "summary" && summary) {
    const percent = summary.total > 0 ? Math.round((summary.score / summary.total) * 100) : 0;
    const stars = percent >= 90 ? 3 : percent >= 50 ? 2 : 1;
    const earnedXp = summary.score * 10;

    const handleRetry = () => {
      setPhase("intro");
      setMessages([]);
      setInput("");
      setTurnNumber(0);
      setLoading(false);
      setCompletedGoals([]);
      setSummary(null);
      setChoices([]);
    };

    return (
      <div className="py-6">
        {/* Stars + Score */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={i < stars ? "opacity-100" : "opacity-20"}>⭐</span>
            ))}
          </div>
          <div className="text-4xl font-bold text-plava mb-1">{percent}%</div>
          <p className="text-gray-500">Ispunjeno ciljeva: {summary.score} od {summary.total}</p>
          <p className="text-plava font-bold">{earnedXp} XP</p>
        </div>

        {/* Rezultat nije upisan u napredak - polaznik mora da vidi i može da ponovi upis */}
        {saveFailed && (
          <div className="mb-4 max-w-md mx-auto text-center">
            <p className="text-sm text-koral-dark bg-koral-light rounded-lg px-4 py-2.5">
              Rezultat nije sačuvan u tvom napretku. Pokušaj ponovo - ako se ponovi, odjavi se i prijavi ponovo.
            </p>
            {onRetrySave && (
              <button
                onClick={onRetrySave}
                disabled={saving}
                className="mt-2 bg-plava text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-plava-dark transition-colors disabled:opacity-50"
              >
                {saving ? "Čuvam..." : "Sačuvaj ponovo"}
              </button>
            )}
          </div>
        )}

        {/* Goals checklist */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Ciljevi:</h3>
          <ul className="space-y-2">
            {summary.goals_completed.map((g, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className={g.completed ? "text-green-500" : "text-koral"}>
                  {g.completed ? "✅" : "❌"}
                </span>
                <span className={g.completed ? "text-gray-700" : "text-gray-400"}>
                  {g.goal}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Corrections */}
        {summary.corrections && summary.corrections.length > 0 && (
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-semibold text-gray-700">Ispravke:</h3>
            {summary.corrections.map((c, i) => (
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

        {/* Retry button - max 2 attempts */}
        <div className="text-center mt-6">
          {attemptCount < MAX_ATTEMPTS ? (
            <button
              onClick={handleRetry}
              className="bg-plava text-white px-6 py-3 rounded-lg hover:bg-plava-dark transition-colors"
            >
              Pokušaj ponovo ({MAX_ATTEMPTS - attemptCount} preostalo)
            </button>
          ) : (
            <p className="text-sm text-gray-400">Iskoristio/la si oba pokušaja.</p>
          )}
        </div>
      </div>
    );
  }

  // --- CHAT SCREEN ---
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Razmena:</span>
          <span className="text-sm font-bold text-plava">{turnNumber}/{config.max_turns}</span>
        </div>
        <div className="flex items-center gap-1">
          {config.goals.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${
                completedGoals.includes(i) ? "bg-green-500" : "bg-gray-200"
              }`}
              title={config.goals[i]}
            />
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-plava text-white rounded-br-md"
                  : "bg-gray-100 text-gray-800 rounded-bl-md"
              }`}
            >
              {msg.role === "assistant" && (
                <span className="text-xs text-gray-400 block mb-1">{config.ai_role}</span>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-gray-400">
              <span className="animate-pulse">Piše...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Guided mode: choices */}
      {config.dialog_mode === "guided" && choices.length > 0 && !loading && (
        <div className="space-y-2 mb-4">
          {choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => sendMessage(choice)}
              className="w-full text-left px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-700 hover:border-plava hover:text-plava transition-colors"
            >
              {choice}
            </button>
          ))}
        </div>
      )}

      {/* Free mode OR guided fallback: text input */}
      {(config.dialog_mode === "free" || (config.dialog_mode === "guided" && choices.length === 0)) && !loading && (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Piši na nemačkom..."
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-plava focus:border-transparent"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className="bg-plava text-white px-4 py-3 rounded-xl hover:bg-plava-dark transition-colors disabled:opacity-50"
          >
            ➤
          </button>
        </div>
      )}
    </div>
  );
}
