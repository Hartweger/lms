"use client";

// src/app/test-nivoa/components/QuizEmailGate.tsx

import { useState } from "react";
import type { HalfLevel } from "../lib/questions";

interface QuizEmailGateProps {
  recommendedLevel: HalfLevel | "C1+";
  onSubmit: (email: string) => void;
  onSkip: () => void;
  isLoading: boolean;
}

export default function QuizEmailGate({ recommendedLevel, onSubmit, onSkip, isLoading }: QuizEmailGateProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Unesi ispravnu email adresu.");
      return;
    }
    setError("");
    onSubmit(trimmed);
  }

  return (
    <div className="max-w-lg mx-auto text-center py-8">
      <div className="text-5xl mb-4">📊</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Tvoj nivo: {recommendedLevel}
      </h2>
      <p className="text-gray-600 mb-8">
        Unesi email da vidiš detaljnu analizu i personalizovanu preporuku kursa.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tvoj@email.com"
          className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 text-center text-lg focus:outline-none focus:border-plava transition-colors"
          disabled={isLoading}
        />
        {error && <p className="text-koral text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-plava text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-plava-dark transition-colors disabled:opacity-50"
        >
          {isLoading ? "Šaljem..." : "Prikaži detaljnu analizu →"}
        </button>
      </form>
      <button
        onClick={onSkip}
        className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        Preskoči - prikaži samo osnovni rezultat
      </button>
      <p className="text-xs text-gray-400 mt-4">
        Nema spama. Samo tvoj rezultat + povremeni saveti za učenje nemačkog.
      </p>
    </div>
  );
}
