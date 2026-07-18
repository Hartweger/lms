// src/lib/hearts/award.test.ts
import { describe, it, expect } from "vitest";
import { applyAward, type Progress } from "./award";

const fresh: Progress = {
  total_hearts: 0, level: 1, current_streak: 0, longest_streak: 0,
  last_active_date: null, hearts_today: 0,
};

describe("applyAward", () => {
  it("dodaje srca za završenu lekciju i postavlja niz na 1", () => {
    const r = applyAward(fresh, { reason: "lesson_complete" }, "2026-06-06");
    expect(r.next.total_hearts).toBe(20);
    expect(r.next.current_streak).toBe(1);
    expect(r.next.hearts_today).toBe(20);
    expect(r.next.last_active_date).toBe("2026-06-06");
  });

  it("daily_login se dodeljuje samo jednom dnevno", () => {
    const first = applyAward(fresh, { reason: "daily_login" }, "2026-06-06");
    expect(first.next.total_hearts).toBe(10);
    const second = applyAward(first.next, { reason: "daily_login" }, "2026-06-06");
    expect(second.next.total_hearts).toBe(10); // bez promene
    expect(second.awarded).toBe(0);
  });

  it("test ≥90% nosi test_pass + bonus (dnevni cilj već ispunjen, bez dodatnog bonusa)", () => {
    const met: Progress = { ...fresh, hearts_today: 60, last_active_date: "2026-06-06", current_streak: 1 };
    const r = applyAward(met, { reason: "test_pass", percent: 95 }, "2026-06-06");
    expect(r.awarded).toBe(75); // 50 + 25 (dnevni cilj je već pređen → nema +20)
  });

  it("vežba: srca = 10*tačni (+5 ako je bilo niza)", () => {
    const r = applyAward(fresh, { reason: "exercise", correct: 4, hadStreak: true }, "2026-06-06");
    expect(r.awarded).toBe(45); // 40 + 5
  });

  it("prelazak nivoa diže flag leveledUp", () => {
    const near: Progress = { ...fresh, total_hearts: 90, level: 1 };
    const r = applyAward(near, { reason: "lesson_complete" }, "2026-06-06");
    expect(r.next.total_hearts).toBe(110);
    expect(r.next.level).toBe(2);
    expect(r.leveledUp).toBe(true);
  });

  it("dnevni cilj (≥50 danas) diže flag dailyGoalMet i dodeljuje bonus jednom", () => {
    const r = applyAward(fresh, { reason: "test_pass", percent: 80 }, "2026-06-06"); // 50 danas
    expect(r.dailyGoalMet).toBe(true);
    expect(r.awarded).toBe(50 + 20); // test_pass + daily_goal bonus
  });

  it("nov dan resetuje hearts_today pre dodele", () => {
    const yesterday: Progress = {
      ...fresh, total_hearts: 60, hearts_today: 60, last_active_date: "2026-06-05", current_streak: 1,
    };
    const r = applyAward(yesterday, { reason: "exercise", correct: 1, hadStreak: false }, "2026-06-06");
    expect(r.next.hearts_today).toBe(10); // reset na 0, pa +10
    expect(r.dailyGoalMet).toBe(false);
    expect(r.next.current_streak).toBe(2); // juče → +1
  });

  it("vežba bez tačnih odgovora ne nosi srca", () => {
    const r = applyAward(fresh, { reason: "exercise", correct: 0, hadStreak: false }, "2026-06-06");
    expect(r.awarded).toBe(0);
    expect(r.next.total_hearts).toBe(0);
  });

  // hearts_today 60 = dnevni cilj vec presao, testiramo cistu baznu nagradu
  it("millionaire_win nosi fiksnih 50 srca", () => {
    const prev: Progress = {
      total_hearts: 0, level: 1, current_streak: 0, longest_streak: 0,
      last_active_date: "2026-07-18", hearts_today: 60,
    };
    const r = applyAward(prev, { reason: "millionaire_win" }, "2026-07-18");
    expect(r.awarded).toBe(50);
  });
});
