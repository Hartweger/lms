"use client";

import { useCallback, useState } from "react";

export default function SpeakButton({
  text,
  lang = "de-DE",
  className = "",
}: {
  text: string;
  lang?: string;
  className?: string;
}) {
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!window.speechSynthesis) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [text, lang]
  );

  return (
    <button
      type="button"
      onClick={speak}
      className={`inline-flex items-center justify-center shrink-0 text-gray-400 hover:text-plava transition-colors ${className}`}
      aria-label={`Izgovori: ${text}`}
      title="Izgovori"
    >
      <svg
        className={`w-4 h-4 ${speaking ? "text-plava animate-pulse" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M11 5L6 9H2v6h4l5 4V5z"
        />
      </svg>
    </button>
  );
}
