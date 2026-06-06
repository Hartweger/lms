// src/lib/hearts/award.ts
import { HEART_REWARDS, DAILY_GOAL_HEARTS } from "./config";
import { levelFromHearts } from "./levels";
import { nextStreak } from "./streak";

export type Progress = {
  total_hearts: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  hearts_today: number;
};

export type AwardInput =
  | { reason: "lesson_complete" }
  | { reason: "daily_login" }
  | { reason: "test_pass"; percent: number }
  | { reason: "exercise"; correct: number; hadStreak: boolean };

export type AwardResult = {
  next: Progress;
  awarded: number;
  leveledUp: boolean;
  dailyGoalMet: boolean;
};

function baseAmount(input: AwardInput): number {
  switch (input.reason) {
    case "lesson_complete": return HEART_REWARDS.lesson_complete;
    case "daily_login": return HEART_REWARDS.daily_login;
    case "test_pass":
      return HEART_REWARDS.test_pass + (input.percent >= 90 ? HEART_REWARDS.test_pass_high : 0);
    case "exercise":
      return input.correct * HEART_REWARDS.correct_answer + (input.hadStreak ? HEART_REWARDS.streak_bonus : 0);
  }
}

export function applyAward(prev: Progress, input: AwardInput, today: string): AwardResult {
  // resetuj "danas" ako je nov dan
  const isNewDay = prev.last_active_date !== today;
  let heartsToday = isNewDay ? 0 : prev.hearts_today;

  // daily_login samo jednom dnevno
  if (input.reason === "daily_login" && !isNewDay) {
    return { next: prev, awarded: 0, leveledUp: false, dailyGoalMet: false };
  }

  let awarded = baseAmount(input);

  // dnevni cilj bonus (jednom, kad pređe prag danas)
  const goalBeforeNow = heartsToday >= DAILY_GOAL_HEARTS;
  const goalAfter = heartsToday + awarded >= DAILY_GOAL_HEARTS;
  const crossedGoal = !goalBeforeNow && goalAfter;
  if (crossedGoal) awarded += HEART_REWARDS.daily_goal;

  const total = prev.total_hearts + awarded;
  heartsToday += awarded;

  const { streak } = nextStreak(prev.last_active_date, today, prev.current_streak);
  const level = levelFromHearts(total);

  const next: Progress = {
    total_hearts: total,
    level,
    current_streak: streak,
    longest_streak: Math.max(prev.longest_streak, streak),
    last_active_date: today,
    hearts_today: heartsToday,
  };

  return {
    next,
    awarded,
    leveledUp: level > prev.level,
    dailyGoalMet: heartsToday >= DAILY_GOAL_HEARTS,
  };
}
