// src/lib/hearts/streak.ts
import { daysBetween } from "./dates";

export function nextStreak(
  lastActiveDate: string | null,
  today: string,
  currentStreak: number
): { streak: number; isNewDay: boolean } {
  if (!lastActiveDate) return { streak: 1, isNewDay: true };
  const diff = daysBetween(lastActiveDate, today);
  if (diff <= 0) return { streak: currentStreak, isNewDay: false };
  if (diff === 1) return { streak: currentStreak + 1, isNewDay: true };
  return { streak: 1, isNewDay: true };
}
