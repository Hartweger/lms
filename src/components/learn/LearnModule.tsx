"use client";
import { useState } from "react";
import type { FlashcardItem } from "@/lib/flashcard-types";
import { buildQuizOptions, type Direction } from "@/lib/flashcard-grading";
import { cardId } from "@/lib/flashcard-card-id";
import { recordAttempt, type CardProgress } from "@/lib/flashcard-progress";
import QuizExercise from "@/components/exercises/QuizExercise";
import MatchPairsExercise from "@/components/exercises/MatchPairsExercise";
import LearnTyping from "./LearnTyping";
import MemoryGame from "./MemoryGame";

type Mode = "guided" | "quiz" | "typing" | "memory";

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
  const BATCH = 6; // uči u malim grupama (Quizlet-style) da „naučeno" raste odmah
  const idOf = (c: FlashcardItem) => cardId(setKey, c.front, c.back);
  const [prog, setProg] = useState<Map<string, CardProgress>>(() => new Map(initialProgress));
  const nonMastered = () => items.filter((c) => (prog.get(idOf(c))?.status ?? "new") !== "mastered");
  const [queue, setQueue] = useState<FlashcardItem[]>(() => nonMastered().slice(0, BATCH)); // tekuća grupa
  const [pool, setPool] = useState<FlashcardItem[]>(() => nonMastered().slice(BATCH));      // čeka na red
  const [seen, setSeen] = useState(0);

  const total = items.length;
  // Jeftino — računa se svaki render (nema potrebe za memoizacijom).
  const masteredCount = items.filter((c) => prog.get(idOf(c))?.status === "mastered").length;
  const learningCount = items.filter((c) => prog.get(idOf(c))?.status === "learning").length;

  // Posle svih hook-ova (Rules of Hooks): zaseban režim igre memorije.
  if (mode === "memory") return <MemoryGame items={items} onExit={onExit} />;

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
  // Izbor vežbe po režimu: guided = prvo kviz (prepoznavanje), pa kucanje (prisećanje).
  const wantTyping = mode === "typing" ? true : mode === "quiz" ? false : (p?.correct_count ?? 0) >= 1;
  const quiz = wantTyping ? null : buildQuizOptions(card, items, direction);
  const doTyping = wantTyping || !quiz; // ako set ima < 4 kartice, kviz nije moguć → kucanje
  // Spajanje parova kao pauza — samo u vođenom režimu, na svakih 8 odgovora, koristi tekuću grupu (varira).
  const showMatch = mode === "guided" && seen > 0 && seen % 8 === 0 && queue.length >= 4;

  const advance = async (correct: boolean) => {
    const updated = await recordAttempt(setKey, card, correct, p);
    const np = new Map(prog); np.set(id, updated); setProg(np);
    setSeen((s) => s + 1);
    if (updated.status === "mastered") {
      // kartica savladana → izađe iz grupe, povuci sledeću iz pool-a
      const next = pool[0];
      setQueue((q) => (next ? [...q.slice(1), next] : q.slice(1)));
      if (next) setPool((pl) => pl.slice(1));
    } else {
      // još nije savladana → na kraj tekuće grupe (brzo se vrati)
      setQueue((q) => [...q.slice(1), card]);
    }
  };

  if (showMatch) {
    const pairs = queue.slice(0, 6).map((c) => ({ de: c.front, sr: c.back.split("|")[0].trim() }));
    return (
      <Frame mastered={masteredCount} learning={learningCount} total={total} onExit={onExit}>
        <p className="text-sm text-gray-500 mb-2">Pauza — spoji parove 🧩 <span className="text-gray-400">(ne računa se)</span></p>
        <MatchPairsExercise pairs={pairs} onAnswer={() => setSeen((s) => s + 1)} />
      </Frame>
    );
  }

  return (
    <Frame mastered={masteredCount} learning={learningCount} total={total} onExit={onExit}>
      {!doTyping && quiz ? (
        <QuizExercise
          key={id + seen}
          question={direction === "de-sr" ? card.front : card.back.replace(/\|/g, " / ")}
          options={quiz.options}
          correctAnswer={quiz.correctIndex}
          explanation={null}
          onAnswer={(correct) => advance(correct)}
        />
      ) : (
        <LearnTyping key={id + seen} card={card} direction={direction === "de-sr" ? "sr-de" : "de-sr"} onResult={(correct) => advance(correct)} />
      )}
    </Frame>
  );
}

function Frame({ mastered, learning, total, onExit, children }: { mastered: number; learning: number; total: number; onExit: () => void; children: React.ReactNode }) {
  const pct = (n: number) => (total ? (n / total) * 100 : 0);
  return (
    <div>
      <button onClick={onExit} className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 mb-3">← Nazad</button>
      {/* Dvobojna traka: tamno = naučeno, svetlo = u toku */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex mb-1">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct(mastered)}%` }} />
        <div className="h-full bg-emerald-200 transition-all" style={{ width: `${pct(learning)}%` }} />
      </div>
      <p className="text-xs text-gray-500 mb-3">
        naučeno <span className="font-semibold text-emerald-600">{mastered}</span> · u toku <span className="font-semibold text-emerald-500">{learning}</span> · od {total}
      </p>
      {children}
    </div>
  );
}
