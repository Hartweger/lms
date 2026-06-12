// src/lib/hearts/mascot.test.ts
import { describe, it, expect } from "vitest";
import { getMascotState } from "./mascot";

const base = { lastActiveDate: "2026-06-06", currentStreak: 1, dailyGoalMet: false };

describe("getMascotState", () => {
  it("prelazak nivoa → celebrate (najjači prioritet)", () => {
    expect(getMascotState(base, "2026-06-06", { justLeveledUp: true })).toBe("celebrate");
  });
  it("odličan test → celebrate", () => {
    expect(getMascotState(base, "2026-06-06", { justAcedTest: true })).toBe("celebrate");
  });
  it("7+ dana odsutan → sad", () => {
    expect(getMascotState({ ...base, lastActiveDate: "2026-05-28" }, "2026-06-06")).toBe("sad");
  });
  it("3-6 dana odsutan → sleepy", () => {
    expect(getMascotState({ ...base, lastActiveDate: "2026-06-02" }, "2026-06-06")).toBe("sleepy");
  });
  it("niz ≥3 → proud", () => {
    expect(getMascotState({ ...base, currentStreak: 3 }, "2026-06-06")).toBe("proud");
  });
  it("dnevni cilj ispunjen → proud", () => {
    expect(getMascotState({ ...base, dailyGoalMet: true }, "2026-06-06")).toBe("proud");
  });
  it("podrazumevano → happy", () => {
    expect(getMascotState(base, "2026-06-06")).toBe("happy");
  });
});
