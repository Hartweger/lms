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

  // ----- Studio stilovi (TV izgled "Milionera") -----
  const LOZ = "polygon(22px 0, calc(100% - 22px) 0, 100% 50%, calc(100% - 22px) 100%, 22px 100%, 0 50%)";
  const stageStyle: React.CSSProperties = {
    background: "radial-gradient(ellipse at 50% -20%, #1a3a80 0%, #0b1c4a 45%, #050c24 100%)",
  };
  const goldGlow: React.CSSProperties = { textShadow: "0 0 24px rgba(255, 200, 80, 0.55)" };

  // Izdužena šestougaona plocica sa "metalnim" okvirom: spoljni sloj je okvir,
  // unutrašnji sloj (umanjen za 2px) je ispuna - clip-path ne dozvoljava pravi border.
  const plate = (fill: string, border: string) => (
    <>
      <span aria-hidden className="absolute inset-0" style={{ clipPath: LOZ, background: border }} />
      <span aria-hidden className="absolute inset-[2px]" style={{ clipPath: LOZ, background: fill }} />
    </>
  );
  const PLATE_IDLE = { fill: "linear-gradient(180deg, #10245e 0%, #081231 100%)", border: "linear-gradient(180deg, #7d9bea, #2d4488)" };
  const PLATE_SELECTED = { fill: "linear-gradient(180deg, #ffb63c 0%, #e07c00 100%)", border: "linear-gradient(180deg, #ffe7ae, #b36200)" };
  const PLATE_CORRECT = { fill: "linear-gradient(180deg, #33d072 0%, #0d8f45 100%)", border: "linear-gradient(180deg, #c2ffd8, #0a6e36)" };
  const PLATE_WRONG = { fill: "linear-gradient(180deg, #e5484d 0%, #97101c 100%)", border: "linear-gradient(180deg, #ffc2c5, #6e0a12)" };

  // ----- Kraj igre -----
  if (finished) {
    const won = game.status === "won";
    return (
      <div className="relative overflow-hidden rounded-2xl text-center py-12 px-4" style={stageStyle}>
        {won && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${(i * 61) % 100}%`,
                  top: "-10px",
                  backgroundColor: ["#ffd257", "#ffb02e", "#fff3c4", "#0AB3D7", "#ffffff"][i % 5],
                  animation: `confetti-fall ${1.5 + ((i * 37) % 20) / 10}s ease-in forwards`,
                  animationDelay: `${((i * 13) % 8) / 10}s`,
                }}
              />
            ))}
          </div>
        )}
        <div className="text-6xl mb-4">{won ? "🏆" : game.status === "walked" ? "💼" : "💥"}</div>
        <div className="text-5xl font-extrabold tracking-wide text-[#ffd257] mb-3" style={goldGlow}>
          {points.toLocaleString("sr-RS")}
        </div>
        <div className="text-xs uppercase tracking-[0.35em] text-white/60 mb-4">poena</div>
        <p className="text-white/85 mb-1">
          {won
            ? "MILION! Odgovorila/o si tačno na sva pitanja! 🎉"
            : game.status === "walked"
              ? `Odustala/o si i nosiš osvojeno. Tačnih odgovora: ${game.correctCount} od ${main.length}.`
              : `Pogrešan odgovor. Tačnih odgovora: ${game.correctCount} od ${main.length}.`}
        </p>
        {won && <p className="text-[#ffd257] font-bold mb-1">+50 ❤️ bonus za milion!</p>}
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
        {saved && <p className="text-xs text-white/40 mt-2">Rezultat sačuvan ✓</p>}
        <button
          onClick={playAgain}
          className="relative mt-7 px-10 py-3 font-bold text-[#081231] transition-transform hover:scale-105"
        >
          {plate(PLATE_SELECTED.fill, PLATE_SELECTED.border)}
          <span className="relative">Igraj ponovo</span>
        </button>
      </div>
    );
  }

  // ----- Igra -----
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 sm:p-6" style={stageStyle}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Lestvica - desktop sa strane, mobilno sažeto iznad */}
        <div className="md:order-2 md:w-52 shrink-0">
          <div className="hidden md:flex flex-col-reverse gap-0.5 rounded-xl bg-black/30 p-3 border border-white/10">
            {ladder.map((sum, i) => {
              const current = i === game.level;
              const passed = i < game.level;
              const safe = safeLevels.includes(i);
              return (
                <div
                  key={i}
                  className={`text-sm px-3 py-1 flex justify-between tabular-nums tracking-wide ${
                    current
                      ? "font-bold text-[#081231]"
                      : passed
                        ? "text-white/25"
                        : safe
                          ? "text-white font-bold"
                          : "text-[#ffd257]"
                  }`}
                  style={current ? { clipPath: LOZ, background: "linear-gradient(180deg, #ffb63c, #e07c00)" } : undefined}
                >
                  <span>{safe && !current ? "◆ " : ""}{i + 1}.</span>
                  <span>{sum.toLocaleString("sr-RS")}</span>
                </div>
              );
            })}
          </div>
          <div className="md:hidden text-center text-sm text-white/60">
            Pitanje {game.level + 1} od {main.length} · igraš za{" "}
            <span className="font-bold text-[#ffd257]">{ladder[game.level].toLocaleString("sr-RS")}</span> poena
          </div>
        </div>

        <div className="flex-1 md:order-1 flex flex-col">
          {/* Džokeri */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setGame(applyFiftyFifty(game, correctIndex, opts.length, Math.random))}
              disabled={game.usedFiftyFifty || revealed}
              title="Skloni dva pogrešna odgovora"
              className="w-14 h-9 rounded-[50%] border-2 text-xs font-bold transition-all border-[#7d9bea] text-[#ffd257] bg-black/30 hover:shadow-[0_0_14px_rgba(125,155,234,0.7)] disabled:border-white/15 disabled:text-white/25 disabled:line-through disabled:shadow-none"
            >
              50:50
            </button>
            <button
              onClick={swapQuestion}
              disabled={game.usedSwap || reserves.length === 0 || revealed}
              title={reserves.length === 0 ? "Nema rezervnih pitanja" : "Zameni pitanje drugim"}
              className="h-9 px-3 rounded-[50%] border-2 text-xs font-bold transition-all border-[#7d9bea] text-[#ffd257] bg-black/30 hover:shadow-[0_0_14px_rgba(125,155,234,0.7)] disabled:border-white/15 disabled:text-white/25 disabled:line-through disabled:shadow-none"
            >
              🔄 Zameni
            </button>
            {game.correctCount > 0 && (
              <button
                onClick={() => finishWith(walkAway(game))}
                disabled={revealed}
                className="ml-auto px-3 py-1.5 rounded-full border border-[#ffd257]/40 text-xs text-[#ffd257]/80 hover:text-[#ffd257] hover:border-[#ffd257] transition-colors"
              >
                Odustani i nosi {points.toLocaleString("sr-RS")}
              </button>
            )}
          </div>

          {/* Pitanje */}
          <div className="relative px-8 py-5 mb-6 text-center">
            {plate("linear-gradient(180deg, #0d1d4d 0%, #071027 100%)", "linear-gradient(180deg, #7d9bea, #2d4488)")}
            <div
              className="relative text-lg font-medium text-white"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.question) }}
            />
          </div>

          {/* Odgovori */}
          <div className="grid gap-3 sm:grid-cols-2">
            {opts.map((opt, i) => {
              const hidden = game.hiddenOptions.includes(i);
              const letter = String.fromCharCode(65 + i); // A, B, C, D
              let p = PLATE_IDLE;
              let textCls = "text-white";
              if (revealed && i === correctIndex) { p = PLATE_CORRECT; textCls = "text-white"; }
              else if (revealed && i === selected) { p = PLATE_WRONG; textCls = "text-white"; }
              else if (selected === i) { p = PLATE_SELECTED; textCls = "text-[#081231]"; }
              return (
                <button
                  key={i}
                  onClick={() => !revealed && setSelected(i)}
                  disabled={hidden || revealed}
                  className={`relative text-left px-8 py-3 transition-transform enabled:hover:scale-[1.02] ${hidden ? "opacity-0 pointer-events-none" : ""}`}
                >
                  {plate(p.fill, p.border)}
                  <span className="relative flex items-baseline gap-2">
                    <span className={`font-bold ${selected === i && !revealed ? "text-[#081231]" : "text-[#ffd257]"}`}>{letter}:</span>
                    <span className={textCls}>{opt}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Konačan odgovor */}
          {selected !== null && !revealed && (
            <button
              onClick={confirmAnswer}
              className="relative mt-5 mx-auto px-10 py-3 font-bold text-[#081231] transition-transform hover:scale-105"
            >
              {plate(PLATE_SELECTED.fill, PLATE_SELECTED.border)}
              <span className="relative">Konačan odgovor?</span>
            </button>
          )}
          {revealed && selected !== correctIndex && question.explanation && (
            <p className="mt-4 text-sm text-white/70 text-center">{question.explanation}</p>
          )}
        </div>
      </div>
    </div>
  );
}
