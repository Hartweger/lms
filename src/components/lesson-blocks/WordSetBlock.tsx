"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { WordSetSection } from "@/lib/flashcard-types";
import { loadSetProgress, type CardProgress } from "@/lib/flashcard-progress";

// Lazy-load: Learn kod se ne učitava dok korisnik ne klikne „Uči"
const LearnModule = dynamic(() => import("@/components/learn/LearnModule"), { ssr: false });

export default function WordSetBlock({ title, setKey, items }: WordSetSection) {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState<Map<string, CardProgress> | null>(null);

  useEffect(() => {
    if (open && !progress) loadSetProgress(setKey).then(setProgress);
  }, [open, progress, setKey]);

  if (open && progress) {
    return (
      <div className="border-2 border-ljubicasta bg-ljubicasta-light rounded-xl p-4 md:p-6">
        <LearnModule setKey={setKey} items={items} initialProgress={progress} onExit={() => setOpen(false)} />
      </div>
    );
  }

  return (
    <div className="border-2 border-ljubicasta bg-ljubicasta-light rounded-xl p-5 md:p-6 text-center">
      <div className="text-3xl mb-2">🧠</div>
      <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600 mb-4">{items.length} reči · uči kroz kviz i kucanje, prati napredak</p>
      <button onClick={() => setOpen(true)} className="bg-ljubicasta text-white rounded-xl px-6 py-3 font-bold">
        {open ? "Učitavam…" : "Uči ovaj set"}
      </button>
    </div>
  );
}
