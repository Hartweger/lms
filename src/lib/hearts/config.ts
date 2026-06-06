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
export const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000];
export const LEVEL_STEP_AFTER = 350;
