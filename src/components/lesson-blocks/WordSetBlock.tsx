"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { WordSetSection } from "@/lib/flashcard-types";
import { loadSetProgress, type CardProgress } from "@/lib/flashcard-progress";

// Lazy-load: Learn kod se ne učitava dok korisnik ne izabere režim
const LearnModule = dynamic(() => import("@/components/learn/LearnModule"), { ssr: false });

type LearnMode = "guided" | "quiz" | "typing" | "memory";

export default function WordSetBlock({ title, setKey, items }: WordSetSection) {
  const [mode, setMode] = useState<LearnMode | null>(null);
  const [progress, setProgress] = useState<Map<string, CardProgress> | null>(null);

  useEffect(() => {
    if (mode && !progress) loadSetProgress(setKey).then(setProgress);
  }, [mode, progress, setKey]);

  if (mode && progress) {
    return (
      <div className="border-2 border-ljubicasta bg-ljubicasta-light rounded-xl p-4 md:p-6">
        <LearnModule setKey={setKey} items={items} initialProgress={progress} mode={mode} onExit={() => setMode(null)} />
      </div>
    );
  }

  return (
    <div className="border-2 border-ljubicasta bg-ljubicasta-light rounded-xl p-5 md:p-6 text-center">
      <div className="text-3xl mb-2">🧠</div>
      <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600 mb-1">{items.length} reči · možeš da ih vežbaš na više načina - izaberi koji ti odgovara.</p>
      <p className="text-xs text-gray-500 mb-4">💡 Savet: sledeći put kad se vratiš, probaj drugi način - tako bolje zapamtiš.</p>
      {mode ? (
        <p className="text-sm text-gray-500">Učitavam…</p>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => setMode("guided")}
            className="bg-ljubicasta text-white rounded-xl px-6 py-3 font-bold w-full max-w-xs"
          >
            Uči ovaj set
          </button>
          <p className="text-xs text-gray-400">vođeno: kviz → kucanje, prati napredak</p>
          <p className="text-xs text-gray-500 mt-2">ili vežbaj na jedan način:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => setMode("quiz")} className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">Samo kviz</button>
            <button onClick={() => setMode("typing")} className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">Samo kucanje</button>
            <button onClick={() => setMode("memory")} className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">🧩 Igra memorije</button>
          </div>
        </div>
      )}
    </div>
  );
}
