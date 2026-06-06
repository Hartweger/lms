// src/lib/hearts/streak.ts
/** Datumi su ISO "YYYY-MM-DD" (lokalni dan). */
function daysBetween(a: string, b: string): number {
  const da = Date.parse(a + "T00:00:00Z");
  const db = Date.parse(b + "T00:00:00Z");
  return Math.round((db - da) / 86400000);
}

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
