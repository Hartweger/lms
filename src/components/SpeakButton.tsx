"use client";

import { useCallback, useEffect, useState } from "react";

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
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Voices load asynchronously - populate them on mount and when they change.
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const speak = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!window.speechSynthesis) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;

      // Explicitly pick a German voice - otherwise the browser falls back to the
      // default (often English) voice and reads German text with English phonemes.
      const langPrefix = lang.split("-")[0].toLowerCase();
      const available = voices.length ? voices : window.speechSynthesis.getVoices();
      const deVoice =
        available.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ||
        available.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
      if (deVoice) utterance.voice = deVoice;

      utterance.rate = 0.9;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [text, lang, voices]
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
