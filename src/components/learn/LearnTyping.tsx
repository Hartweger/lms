"use client";
import { useState } from "react";
import type { FlashcardItem } from "@/lib/flashcard-types";
import { gradeTyping, type Direction } from "@/lib/flashcard-grading";

export default function LearnTyping({
  card, direction, onResult,
}: {
  card: FlashcardItem;
  direction: Direction;
  onResult: (correct: boolean) => void; // almost se računa kao correct
}) {
  const prompt = direction === "sr-de" ? card.back.replace(/\|/g, " / ") : card.front;
  const subtitle = direction === "sr-de" ? "Napiši na nemačkom (član nije obavezan):" : "Napiši na srpskom:";
  const [input, setInput] = useState("");
  const [done, setDone] = useState<null | { status: string; fullForm: string }>(null);

  // Korak 1: „Proveri" — POKAŽI tačan odgovor (ne prelazi). Prazno → otkrije odgovor (gradeTyping("") = wrong + pun oblik).
  const check = () => {
    if (done) return;
    setDone(gradeTyping(input, card, direction));
  };
  // Korak 2: „Dalje" — tek sad pređi na sledeću.
  const next = () => {
    if (done) onResult(done.status !== "wrong");
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{subtitle}</p>
      <p className="text-2xl font-bold text-gray-900 mb-4">{prompt}</p>
      <input
        value={input} onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { if (done) next(); else check(); } }}
        disabled={!!done} autoFocus
        className="w-full border-2 border-sky-300 rounded-xl p-3 text-lg focus:outline-none focus:border-sky-500"
        placeholder="…"
      />
      {!done && (
        <button onClick={check} className="mt-3 w-full bg-rose-500 text-white rounded-xl py-3 font-bold">Proveri</button>
      )}
      {done && (
        <>
          <div className={`mt-3 rounded-xl p-3 text-sm ${done.status === "wrong" ? "bg-rose-50 text-rose-700" : done.status === "almost" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>
            {done.status === "correct" && <>✓ Tačno! <b>{done.fullForm}</b></>}
            {done.status === "almost" && <>Skoro! Tačno je <b>{done.fullForm}</b>. Priznato ✓</>}
            {done.status === "wrong" && <>Tačan odgovor: <b>{done.fullForm}</b></>}
          </div>
          <button onClick={next} className="mt-3 w-full bg-gray-900 text-white rounded-xl py-3 font-bold">Dalje →</button>
        </>
      )}
    </div>
  );
}
