// src/lib/hearts/config.ts
export const HEART_REWARDS = {
  correct_answer: 10,
  streak_bonus: 5,        // dodatno za niz tačnih ≥3 unutar vežbe
  lesson_complete: 20,
  test_pass: 50,
  test_pass_high: 25,     // dodatno za rezultat ≥90%
  daily_login: 10,
  daily_goal: 20,
} as const;

export const DAILY_GOAL_HEARTS = 50;

// Kumulativni pragovi: indeks = nivo-1. Posle tabele: +350 po nivou.
export const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000] as const;
export const LEVEL_STEP_AFTER = 350;

// Titule po nivou (indeks = nivo-1). Za nivoe iznad liste koristi se poslednja.
export const LEVEL_TITLES = [
  "Početnik",   // 1
  "Radoznali",  // 2
  "Marljivi",   // 3
  "Vredni",     // 4
  "Istrajni",   // 5
  "Napredni",   // 6
  "Majstor",    // 7
  "Šampion",    // 8
  "Heroj",      // 9
  "Legenda",    // 10+
] as const;
