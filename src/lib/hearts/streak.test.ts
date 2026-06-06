// src/lib/hearts/streak.test.ts
import { describe, it, expect } from "vitest";
import { nextStreak } from "./streak";

describe("nextStreak", () => {
  it("prvi put (nema poslednjeg dana) → niz 1, nov dan", () => {
    expect(nextStreak(null, "2026-06-06", 0)).toEqual({ streak: 1, isNewDay: true });
  });
  it("isti dan → niz nepromenjen, nije nov dan", () => {
    expect(nextStreak("2026-06-06", "2026-06-06", 3)).toEqual({ streak: 3, isNewDay: false });
  });
  it("juče → niz +1, nov dan", () => {
    expect(nextStreak("2026-06-05", "2026-06-06", 3)).toEqual({ streak: 4, isNewDay: true });
  });
  it("prekid (2+ dana) → niz se resetuje na 1, nov dan", () => {
    expect(nextStreak("2026-06-01", "2026-06-06", 9)).toEqual({ streak: 1, isNewDay: true });
  });
});
