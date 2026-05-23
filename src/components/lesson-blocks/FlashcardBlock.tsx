"use client";

import { useState } from "react";

interface FlashcardItem {
  front: string;
  back: string;
}

interface FlashcardBlockProps {
  type: "flashcard";
  items: FlashcardItem[];
}

export default function FlashcardBlock({ items }: FlashcardBlockProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = items[index];

  const next = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % items.length);
  };

  const prev = () => {
    setFlipped(false);
    setIndex((i) => (i - 1 + items.length) % items.length);
  };

  return (
    <div className="border-l-4 border-ljubicasta bg-ljubicasta-light rounded-xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">Kartice</h4>
        <span className="text-xs text-gray-400">
          {index + 1} / {items.length}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        className="w-full bg-white rounded-xl shadow-sm p-8 md:p-10 text-center cursor-pointer hover:shadow-md transition-shadow min-h-[120px] flex items-center justify-center"
      >
        <p className={`text-lg ${flipped ? "text-ljubicasta font-bold" : "font-semibold text-gray-900"}`}>
          {flipped ? card.back : card.front}
        </p>
      </button>

      <p className="text-center text-xs text-gray-400 mt-2">
        {flipped ? "Prevod" : "Klikni za prevod"}
      </p>

      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={prev}
          className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white transition-colors"
        >
          ← Prethodna
        </button>
        <button
          type="button"
          onClick={next}
          className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white transition-colors"
        >
          Sledeća →
        </button>
      </div>
    </div>
  );
}
