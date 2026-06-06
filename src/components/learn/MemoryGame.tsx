"use client";
import { useMemo, useState } from "react";
import type { FlashcardItem } from "@/lib/flashcard-types";

interface Tile { key: string; label: string; pairId: number; }

export default function MemoryGame({ items, onExit }: { items: FlashcardItem[]; onExit: () => void }) {
  // uzmi do 6 parova (12 pločica) da stane na telefon
  const round = useMemo(() => {
    const pick = items.slice(0, 6);
    const tiles: Tile[] = [];
    pick.forEach((c, i) => {
      tiles.push({ key: `de${i}`, label: c.front, pairId: i });
      tiles.push({ key: `sr${i}`, label: c.back.split("|")[0].trim(), pairId: i });
    });
    // deterministički raspored (rotacija) da izbegnemo Math.random
    return tiles.map((t, i) => ({ t, o: (i * 7) % tiles.length })).sort((a, b) => a.o - b.o).map((x) => x.t);
  }, [items]);

  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());

  const onTile = (t: Tile) => {
    if (matched.has(t.pairId) || flipped.includes(t.key) || flipped.length === 2) return;
    const next = [...flipped, t.key];
    setFlipped(next);
    if (next.length === 2) {
      const [a, b] = next.map((k) => round.find((x) => x.key === k)!);
      if (a.pairId === b.pairId) { setMatched((m) => new Set(m).add(a.pairId)); setFlipped([]); }
      else setTimeout(() => setFlipped([]), 800);
    }
  };

  const done = matched.size === round.length / 2;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">🧩 Igra memorije — spoji parove</p>
        <button onClick={onExit} className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">← Nazad</button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {round.map((t) => {
          const show = flipped.includes(t.key) || matched.has(t.pairId);
          return (
            <button key={t.key} onClick={() => onTile(t)}
              className={`aspect-[3/4] rounded-xl text-sm font-bold flex items-center justify-center p-1 transition-colors ${
                matched.has(t.pairId) ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-700"
                : show ? "bg-white border-2 border-violet-400 text-gray-800"
                : "bg-violet-500 text-violet-500"}`}>
              {show ? t.label : "•"}
            </button>
          );
        })}
      </div>
      {done && (
        <div className="text-center mt-4">
          <p className="font-bold text-emerald-700 mb-2">Bravo! Sve spojeno 🎉</p>
          <button onClick={onExit} className="bg-violet-500 text-white rounded-xl px-5 py-2 font-bold">Nazad</button>
        </div>
      )}
    </div>
  );
}
