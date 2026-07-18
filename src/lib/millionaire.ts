// src/lib/millionaire.ts
// Čista logika igre "Milioner" - bez React-a, bez mreže (testabilnost).
// Pitanja i odgovore vodi komponenta; ovde je samo stanje igre.

export const LADDER = [
  100, 200, 300, 500, 1_000,
  2_000, 4_000, 8_000, 16_000, 32_000,
  64_000, 125_000, 250_000, 500_000, 1_000_000,
] as const;

// Sigurni stepenici: posle 5. i 10. pitanja (indeksi 4 i 9).
const SAFE_LEVELS = [4, 9] as const;

export type MillionaireStatus = "playing" | "won" | "lost" | "walked";

export type MillionaireState = {
  questionCount: number;
  level: number;           // indeks trenutnog pitanja (0-based)
  status: MillionaireStatus;
  correctCount: number;
  usedFiftyFifty: boolean;
  usedSwap: boolean;
  hiddenOptions: number[]; // indeksi opcija sklonjeni 50:50 (samo tekuće pitanje)
};

/** Lestvica za igru od n pitanja: za n<15 prvih n-1 suma + milion na vrhu. n<1 se klampuje na 1. */
export function ladderFor(n: number): number[] {
  const safe = Math.max(1, n);
  if (safe >= LADDER.length) return [...LADDER];
  return [...LADDER.slice(0, safe - 1), LADDER[LADDER.length - 1]];
}

/** Sigurni stepenici koji postoje u igri od n pitanja (mora biti pre poslednjeg pitanja). */
export function safeLevelsFor(n: number): number[] {
  const safe = Math.max(1, n);
  return SAFE_LEVELS.filter((l) => l < safe - 1);
}

export function createGame(questionCount: number): MillionaireState {
  return {
    questionCount: Math.max(1, questionCount),
    level: 0,
    status: "playing",
    correctCount: 0,
    usedFiftyFifty: false,
    usedSwap: false,
    hiddenOptions: [],
  };
}

export function answer(state: MillionaireState, isCorrect: boolean): MillionaireState {
  if (state.status !== "playing") return state;
  if (!isCorrect) return { ...state, status: "lost", hiddenOptions: [] };
  const correctCount = state.correctCount + 1;
  const isLast = state.level >= state.questionCount - 1;
  return {
    ...state,
    correctCount,
    level: isLast ? state.level : state.level + 1,
    status: isLast ? "won" : "playing",
    hiddenOptions: [],
  };
}

export function walkAway(state: MillionaireState): MillionaireState {
  if (state.status !== "playing") return state;
  return { ...state, status: "walked", hiddenOptions: [] };
}

/** 50:50 - sakrij do dve pogrešne opcije (sa <=2 pogrešne sakrije sve, ostaje samo tačna). */
export function applyFiftyFifty(
  state: MillionaireState,
  correctIndex: number,
  optionCount: number,
  rng: () => number,
): MillionaireState {
  if (state.status !== "playing" || state.usedFiftyFifty) return state;
  const wrong = Array.from({ length: optionCount }, (_, i) => i).filter((i) => i !== correctIndex);
  if (wrong.length === 0) return state; // nema šta da se sakrije - ne troši džoker
  // Fisher-Yates sa prosleđenim rng
  for (let i = wrong.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [wrong[i], wrong[j]] = [wrong[j], wrong[i]];
  }
  const hidden = wrong.slice(0, Math.min(2, wrong.length));
  return { ...state, usedFiftyFifty: true, hiddenOptions: hidden };
}

/** Zameni pitanje - logika samo troši džoker; novo pitanje bira komponenta. */
export function useSwap(state: MillionaireState): MillionaireState {
  if (state.status !== "playing" || state.usedSwap) return state;
  return { ...state, usedSwap: true, hiddenOptions: [] };
}

/** Osvojeni poeni na kraju igre (za "playing" vraća trenutno osigurano kao informaciju). */
export function wonPoints(state: MillionaireState): number {
  const ladder = ladderFor(state.questionCount);
  if (state.status === "won") return ladder[ladder.length - 1];
  if (state.status === "walked" || state.status === "playing") {
    return state.correctCount > 0 ? ladder[state.correctCount - 1] : 0;
  }
  // lost: pada na najviši sigurni stepenik ispod dostignutog
  const passed = safeLevelsFor(state.questionCount).filter((l) => l < state.correctCount);
  return passed.length > 0 ? ladder[passed[passed.length - 1]] : 0;
}
