"use client";
import { useMemo, useState } from "react";
import type { FlashcardItem } from "@/lib/flashcard-types";
import { buildQuizOptions, type Direction } from "@/lib/flashcard-grading";
import { cardId } from "@/lib/flashcard-card-id";
import { recordAttempt, type CardProgress } from "@/lib/flashcard-progress";
import QuizExercise from "@/components/exercises/QuizExercise";
import MatchPairsExercise from "@/components/exercises/MatchPairsExercise";
import LearnTyping from "./LearnTyping";

type Mode = "guided" | "quiz" | "typing" | "match" | "memory";

export default function LearnModule({
  setKey, items, direction = "de-sr", initialProgress, mode = "guided", onExit,
}: {
  setKey: string;
  items: FlashcardItem[];
  direction?: Direction;
  initialProgress: Map<string, CardProgress>;
  mode?: Mode;
  onExit: () => void;
}) {
  const idOf = (c: FlashcardItem) => cardId(setKey, c.front, c.back);
  const [prog, setProg] = useState<Map<string, CardProgress>>(() => new Map(initialProgress));
  const [typedOk, setTypedOk] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<FlashcardItem[]>(() =>
    items.filter((c) => (prog.get(idOf(c))?.status ?? "new") !== "mastered"));
  const [seen, setSeen] = useState(0);

  const total = items.length;
  const masteredCount = useMemo(
    () => items.filter((c) => prog.get(idOf(c))?.status === "mastered").length,
    [prog, items]);

  if (queue.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-3">🏆</div>
        <p className="text-lg font-bold mb-1">Set savladan! {total}/{total}</p>
        <p className="text-sm text-gray-500 mb-5">Vrati se sutra da osvežiš.</p>
        <button onClick={onExit} className="bg-emerald-600 text-white rounded-xl px-6 py-3 font-bold">Završi</button>
      </div>
    );
  }

  const card = queue[0];
  const id = idOf(card);
  const p = prog.get(id);
  const useTyping = (p?.correct_count ?? 0) >= 1;
  const quiz = useTyping ? null : buildQuizOptions(card, items, direction);
  const showMatch = seen > 0 && seen % 8 === 0 && items.length >= 4;

  const advance = async (correct: boolean, viaTyping: boolean) => {
    const newTyped = new Set(typedOk);
    if (correct && viaTyping) newTyped.add(id);
    setTypedOk(newTyped);
    const updated = await recordAttempt(setKey, card, correct, viaTyping, p);
    if (updated.status === "mastered" && !newTyped.has(id)) updated.status = "learning";
    const np = new Map(prog); np.set(id, updated); setProg(np);
    setSeen((s) => s + 1);
    setQueue((q) => {
      const rest = q.slice(1);
      if (updated.status === "mastered") return rest;
      return [...rest, card];
    });
  };

  if (showMatch) {
    const pairs = items.slice(0, 6).map((c) => ({ de: c.front, sr: c.back.split("|")[0].trim() }));
    return (
      <Frame mastered={masteredCount} total={total} onExit={onExit}>
        <p className="text-sm text-gray-500 mb-2">Pauza — spoji parove 🧩</p>
        <MatchPairsExercise pairs={pairs} onAnswer={() => setSeen((s) => s + 1)} />
      </Frame>
    );
  }

  return (
    <Frame mastered={masteredCount} total={total} onExit={onExit}>
      {quiz ? (
        <QuizExercise
          key={id + seen}
          question={direction === "de-sr" ? card.front : card.back.replace(/\|/g, " / ")}
          options={quiz.options}
          correctAnswer={quiz.correctIndex}
          explanation={null}
          onAnswer={(correct) => advance(correct, false)}
        />
      ) : (
        <LearnTyping key={id + seen} card={card} direction={direction === "de-sr" ? "sr-de" : "de-sr"} onResult={(correct) => advance(correct, true)} />
      )}
    </Frame>
  );
}

function Frame({ mastered, total, onExit, children }: { mastered: number; total: number; onExit: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 mr-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${total ? (mastered / total) * 100 : 0}%` }} />
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">Naučeno {mastered}/{total}</span>
        <button onClick={onExit} className="ml-3 text-xs text-gray-400">✕</button>
      </div>
      {children}
    </div>
  );
}
