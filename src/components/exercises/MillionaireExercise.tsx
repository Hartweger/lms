"use client";

// Vežba "Milioner" - kviz igra sa lestvicom poena i džokerima.
// Pitanja: order_index 0..N-1 su igra (max 15), 15+ su rezerve za "Zameni pitanje".
// correct_answer = INDEKS opcije (kao kod kviza).
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  createGame, answer, walkAway, applyFiftyFifty, useSwap, wonPoints,
  ladderFor, safeLevelsFor, type MillionaireState,
} from "@/lib/millionaire";
import type { Exercise, ExerciseQuestion } from "@/lib/types";

const MAIN_COUNT = 15;

function optionsOf(q: ExerciseQuestion): string[] {
  const raw = q.options;
  if (Array.isArray(raw)) return raw.map(String);
  if (raw && typeof raw === "object") {
    const items = (raw as { items?: unknown }).items;
    if (Array.isArray(items)) return items.map(String);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
      if (Array.isArray(parsed?.items)) return parsed.items.map(String);
    } catch { /* nije JSON */ }
  }
  return [];
}

interface Props {
  exercise: Exercise;
  questions: ExerciseQuestion[];
}

export default function MillionaireExercise({ exercise, questions }: Props) {
  const supabase = createClient();
  const sorted = [...questions].sort((a, b) => a.order_index - b.order_index);
  const main = sorted.slice(0, MAIN_COUNT);
  const initialReserves = sorted.slice(MAIN_COUNT);

  const [game, setGame] = useState<MillionaireState>(() => createGame(main.length));
  const [reserves, setReserves] = useState<ExerciseQuestion[]>(initialReserves);
  // zamene: level -> rezervno pitanje umesto originalnog
  const [overrides, setOverrides] = useState<Record<number, ExerciseQuestion>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [saved, setSaved] = useState(false);

  const ladder = ladderFor(main.length);
  const safeLevels = safeLevelsFor(main.length);
  const question = overrides[game.level] ?? main[game.level];
  const opts = question ? optionsOf(question) : [];
  const correctIndex = question ? parseInt(question.correct_answer) : -1;
  const finished = game.status !== "playing";
  const points = wonPoints(game);

  if (main.length === 0) {
    return <p className="text-gray-500 text-center py-8">Ova vežba još nema pitanja.</p>;
  }

  const saveResult = async (finalGame: MillionaireState) => {
    setSaving(true);
    setSaveFailed(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaveFailed(true); setSaving(false); return; }
    const { error } = await supabase.from("exercise_attempts").insert({
      exercise_id: exercise.id,
      user_id: user.id,
      score: finalGame.correctCount,
      total_questions: main.length,
    });
    if (error) { setSaveFailed(true); setSaving(false); return; }
    setSaved(true);
    // srca: tačni odgovori + poseban bonus za milion (tiho - srca su sekundarna)
    try {
      await fetch("/api/hearts/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "exercise", correct: finalGame.correctCount, hadStreak: finalGame.correctCount >= 3 }),
      });
      if (finalGame.status === "won") {
        await fetch("/api/hearts/award", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "millionaire_win" }),
        });
      }
    } catch { /* tiho */ }
    setSaving(false);
  };

  const finishWith = (next: MillionaireState) => {
    if (game.status !== "playing") return;
    setGame(next);
    if (next.status !== "playing") void saveResult(next);
  };

  const confirmAnswer = () => {
    if (selected === null || revealed) return;
    setRevealed(true);
    const isCorrect = selected === correctIndex;
    setTimeout(() => {
      setRevealed(false);
      setSelected(null);
      finishWith(answer(game, isCorrect));
    }, 1600);
  };

  const swapQuestion = () => {
    if (game.usedSwap || reserves.length === 0 || revealed) return;
    const [replacement, ...rest] = reserves;
    setOverrides({ ...overrides, [game.level]: replacement });
    setReserves(rest);
    setSelected(null);
    setGame(useSwap(game));
  };

  const playAgain = () => {
    setGame(createGame(main.length));
    setOverrides({});
    setReserves(initialReserves);
    setSelected(null);
    setRevealed(false);
    setSaved(false);
    setSaveFailed(false);
  };

  // ----- Kraj igre -----
  if (finished) {
    const won = game.status === "won";
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">{won ? "🏆" : game.status === "walked" ? "💼" : "💥"}</div>
        <div className="text-4xl font-bold text-plava mb-2">{points.toLocaleString("sr-RS")} poena</div>
        <p className="text-gray-500 mb-1">
          {won
            ? "MILION! Odgovorila/o si tačno na sva pitanja! 🎉"
            : game.status === "walked"
              ? `Odustala/o si i nosiš osvojeno. Tačnih odgovora: ${game.correctCount} od ${main.length}.`
              : `Pogrešan odgovor. Tačnih odgovora: ${game.correctCount} od ${main.length}.`}
        </p>
        {won && <p className="text-plava font-bold mb-1">+50 ❤️ bonus za milion!</p>}
        {saveFailed && (
          <div className="mt-4 max-w-md mx-auto">
            <p className="text-sm text-koral-dark bg-koral-light rounded-lg px-4 py-2.5">
              Rezultat nije sačuvan u tvom napretku. Pokušaj ponovo - ako se ponovi, odjavi se i prijavi ponovo.
            </p>
            <button
              onClick={() => void saveResult(game)}
              disabled={saving}
              className="mt-2 bg-plava text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-plava-dark transition-colors disabled:opacity-50"
            >
              {saving ? "Čuvam..." : "Sačuvaj rezultat"}
            </button>
          </div>
        )}
        {saved && <p className="text-xs text-gray-400 mt-2">Rezultat sačuvan ✓</p>}
        <button
          onClick={playAgain}
          className="mt-6 bg-plava text-white px-6 py-3 rounded-lg font-bold hover:bg-plava-dark transition-colors"
        >
          Igraj ponovo
        </button>
      </div>
    );
  }

  // ----- Igra -----
  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Lestvica - desktop sa strane, mobilno sažeto iznad */}
      <div className="md:order-2 md:w-48 shrink-0">
        <div className="hidden md:flex flex-col-reverse gap-1">
          {ladder.map((sum, i) => (
            <div
              key={i}
              className={`text-sm px-3 py-1 rounded flex justify-between ${
                i === game.level
                  ? "bg-plava text-white font-bold"
                  : i < game.level
                    ? "text-gray-300 line-through"
                    : safeLevels.includes(i)
                      ? "text-plava font-bold"
                      : "text-gray-500"
              }`}
            >
              <span>{i + 1}.</span>
              <span>{sum.toLocaleString("sr-RS")}</span>
            </div>
          ))}
        </div>
        <div className="md:hidden text-center text-sm text-gray-500">
          Pitanje {game.level + 1} od {main.length} · igraš za{" "}
          <span className="font-bold text-plava">{ladder[game.level].toLocaleString("sr-RS")}</span> poena
        </div>
      </div>

      <div className="flex-1 md:order-1">
        {/* Džokeri */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setGame(applyFiftyFifty(game, correctIndex, opts.length, Math.random))}
            disabled={game.usedFiftyFifty || revealed}
            title="Skloni dva pogrešna odgovora"
            className="px-3 py-1.5 rounded-full border-2 text-sm font-bold transition-colors border-plava text-plava hover:bg-plava-light disabled:border-gray-200 disabled:text-gray-300 disabled:line-through disabled:hover:bg-transparent"
          >
            50:50
          </button>
          <button
            onClick={swapQuestion}
            disabled={game.usedSwap || reserves.length === 0 || revealed}
            title={reserves.length === 0 ? "Nema rezervnih pitanja" : "Zameni pitanje drugim"}
            className="px-3 py-1.5 rounded-full border-2 text-sm font-bold transition-colors border-plava text-plava hover:bg-plava-light disabled:border-gray-200 disabled:text-gray-300 disabled:line-through disabled:hover:bg-transparent"
          >
            🔄 Zameni pitanje
          </button>
          {game.correctCount > 0 && (
            <button
              onClick={() => finishWith(walkAway(game))}
              disabled={revealed}
              className="ml-auto px-3 py-1.5 rounded-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Odustani i nosi {points.toLocaleString("sr-RS")}
            </button>
          )}
        </div>

        {/* Pitanje */}
        <div
          className="text-lg font-medium text-gray-900 mb-4"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.question) }}
        />

        {/* Odgovori */}
        <div className="grid gap-3 sm:grid-cols-2">
          {opts.map((opt, i) => {
            const hidden = game.hiddenOptions.includes(i);
            const letter = String.fromCharCode(65 + i); // A, B, C, D
            let style = "border-gray-200 hover:border-plava";
            if (revealed && i === correctIndex) style = "border-green-500 bg-green-50";
            else if (revealed && i === selected) style = "border-koral bg-koral-light";
            else if (selected === i) style = "border-plava bg-plava-light";
            return (
              <button
                key={i}
                onClick={() => !revealed && setSelected(i)}
                disabled={hidden || revealed}
                className={`text-left px-4 py-3 rounded-lg border-2 transition-colors ${style} ${hidden ? "opacity-0 pointer-events-none" : ""}`}
              >
                <span className="font-bold text-plava mr-2">{letter}:</span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Konačan odgovor */}
        {selected !== null && !revealed && (
          <button
            onClick={confirmAnswer}
            className="mt-4 w-full bg-plava text-white py-3 rounded-lg font-bold hover:bg-plava-dark transition-colors"
          >
            Konačan odgovor?
          </button>
        )}
        {revealed && selected !== correctIndex && question.explanation && (
          <p className="mt-3 text-sm text-gray-500">{question.explanation}</p>
        )}
      </div>
    </div>
  );
}
