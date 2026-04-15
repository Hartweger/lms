"use client";

import { useState } from "react";

interface WordwallProps {
  url: string;
  onAnswer: (correct: boolean) => void;
}

export default function WordwallExercise({ url, onAnswer }: WordwallProps) {
  const [done, setDone] = useState(false);

  const handleDone = () => {
    if (done) return;
    setDone(true);
    // Small delay so user sees the confirmation before moving on
    setTimeout(() => onAnswer(true), 500);
  };

  return (
    <div>
      <div className="rounded-xl overflow-hidden border border-gray-100">
        <iframe
          src={url}
          width="100%"
          frameBorder="0"
          allowFullScreen
          className="w-full h-[350px] md:h-[500px]"
        />
      </div>
      <div className="mt-4 text-center">
        {!done ? (
          <button
            onClick={handleDone}
            className="bg-plava text-white px-6 py-3 rounded-lg font-medium hover:bg-plava-dark transition-colors"
          >
            Završio/la sam vežbu ✓
          </button>
        ) : (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 text-sm text-green-700">
            Odlično! Klikni "Sledeće pitanje" da nastaviš.
          </div>
        )}
      </div>
    </div>
  );
}
