// src/lib/hearts/levels.ts
import { LEVEL_THRESHOLDS, LEVEL_STEP_AFTER, LEVEL_TITLES } from "./config";

/** Kumulativni prag (ukupno srca) za dati nivo (1-baziran). */
export function thresholdForLevel(level: number): number {
  if (level <= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[level - 1];
  const last = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  return last + (level - LEVEL_THRESHOLDS.length) * LEVEL_STEP_AFTER;
}

export function levelFromHearts(total: number): number {
  let level = 1;
  while (total >= thresholdForLevel(level + 1)) level++;
  return level;
}

export function progressToNext(total: number) {
  const level = levelFromHearts(total);
  const base = thresholdForLevel(level);
  const next = thresholdForLevel(level + 1);
  const span = next - base;
  const into = total - base;
  const toNext = next - total;
  const percent = Math.floor((into / span) * 100);
  return { level, into, span, toNext, percent, nextLevel: level + 1 };
}

/** Titula za dati nivo; iznad liste vraća poslednju (Legenda). */
export function titleForLevel(level: number): string {
  const idx = Math.min(Math.max(level, 1), LEVEL_TITLES.length) - 1;
  return LEVEL_TITLES[idx];
}
