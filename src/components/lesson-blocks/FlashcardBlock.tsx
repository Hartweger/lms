"use client";

import { useState, useCallback } from "react";
import type { FlashcardSection } from "@/lib/section-types";
import SpeakButton from "@/components/SpeakButton";

export default function FlashcardBlock({ items, frontLabel, backLabel }: FlashcardSection) {
  const fLabel = frontLabel || "DE";
  const bLabel = backLabel || "SR";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reversed, setReversed] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [order, setOrder] = useState<number[]>(items.map((_, i) => i));

  const front = reversed ? items[order[currentIndex]].back : items[order[currentIndex]].front;
  const back = reversed ? items[order[currentIndex]].front : items[order[currentIndex]].back;

  const next = useCallback(() => {
    setFlipped(false);
    setCurrentIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setFlipped(false);
    setCurrentIndex((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  const toggleDirection = () => {
    setReversed(!reversed);
    setFlipped(false);
  };

  const toggleShuffle = () => {
    if (shuffled) {
      setOrder(items.map((_, i) => i));
    } else {
      const newOrder = items.map((_, i) => i);
      for (let i = newOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
      }
      setOrder(newOrder);
    }
    setShuffled(!shuffled);
    setCurrentIndex(0);
    setFlipped(false);
  };

  return (
    <div className="border-2 border-ljubicasta bg-ljubicasta-light rounded-xl p-5 md:p-6 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">Kartice</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDirection}
            className="text-xs px-3 py-1.5 rounded-full bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 transition-colors"
          >
            {reversed ? `${bLabel} → ${fLabel}` : `${fLabel} → ${bLabel}`}
          </button>
          <button
            onClick={toggleShuffle}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              shuffled
                ? "bg-ljubicasta text-white border-ljubicasta"
                : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
            }`}
          >
            Pomešaj
          </button>
        </div>
      </div>

      {/* Card */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="bg-white rounded-xl shadow-sm cursor-pointer select-none min-h-[160px] flex items-center justify-center p-8 transition-all hover:shadow-md"
      >
        <div className="text-center">
          <p className={`text-lg font-bold ${flipped ? "text-ljubicasta" : "text-gray-900"} inline-flex items-center gap-2`}>
            {flipped ? back : front}
            {(!reversed && !flipped) || (reversed && flipped) ? (
              <SpeakButton text={!reversed ? front : back} />
            ) : null}
          </p>
          {!flipped && (
            <p className="text-xs text-gray-300 mt-3">klikni da vidiš odgovor</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={prev}
          className="w-11 h-11 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center transition-colors"
        >
          ←
        </button>
        <span className="text-sm text-gray-400">
          {currentIndex + 1} / {items.length}
        </span>
        <button
          onClick={next}
          className="w-11 h-11 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center transition-colors"
        >
          →
        </button>
      </div>
    </div>
  );
}
