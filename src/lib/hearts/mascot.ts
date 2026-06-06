// src/lib/hearts/mascot.ts
import type { MascotState } from "@/components/mascot/MascotBear";

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}

type Stats = { lastActiveDate: string | null; currentStreak: number; dailyGoalMet: boolean };
type Context = { justLeveledUp?: boolean; justAcedTest?: boolean };

export function getMascotState(stats: Stats, today: string, ctx: Context = {}): MascotState {
  if (ctx.justLeveledUp || ctx.justAcedTest) return "celebrate";
  if (stats.lastActiveDate) {
    const away = daysBetween(stats.lastActiveDate, today);
    if (away >= 7) return "sad";
    if (away >= 3) return "sleepy";
  }
  if (stats.currentStreak >= 3 || stats.dailyGoalMet) return "proud";
  return "happy";
}
