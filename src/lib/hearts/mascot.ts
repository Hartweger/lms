// src/lib/hearts/mascot.ts
import type { MascotState } from "@/components/mascot/MascotBear";
import { daysBetween } from "./dates";

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
