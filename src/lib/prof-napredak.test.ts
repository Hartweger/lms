import { describe, it, expect } from "vitest";
import { platformaBadge, napredakLekcije } from "./prof-napredak";

const NOW = new Date("2026-06-20T12:00:00Z");
function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
}

describe("platformaBadge", () => {
  it("vraća null kada polaznik nema platformu", () => {
    expect(platformaBadge({ hasPlatform: false, completedCount: 0, lastActivity: null, now: NOW })).toBeNull();
  });

  it("'nije počeo' (crveno) kada ima platformu ali nijednu lekciju", () => {
    expect(platformaBadge({ hasPlatform: true, completedCount: 0, lastActivity: null, now: NOW }))
      .toEqual({ label: "nije počeo", tone: "red" });
  });

  it("'aktivna' (zeleno) za aktivnost do 7 dana", () => {
    expect(platformaBadge({ hasPlatform: true, completedCount: 3, lastActivity: daysAgo(2), now: NOW }))
      .toEqual({ label: "aktivna", tone: "green" });
  });

  it("granica 7 dana je još zelena", () => {
    expect(platformaBadge({ hasPlatform: true, completedCount: 3, lastActivity: daysAgo(7), now: NOW }))
      .toEqual({ label: "aktivna", tone: "green" });
  });

  it("8–14 dana je žuto sa brojem dana", () => {
    expect(platformaBadge({ hasPlatform: true, completedCount: 3, lastActivity: daysAgo(10), now: NOW }))
      .toEqual({ label: "10d", tone: "amber" });
  });

  it("granica 14 dana je još žuta", () => {
    expect(platformaBadge({ hasPlatform: true, completedCount: 3, lastActivity: daysAgo(14), now: NOW }))
      .toEqual({ label: "14d", tone: "amber" });
  });

  it("preko 14 dana je crveno sa brojem dana", () => {
    expect(platformaBadge({ hasPlatform: true, completedCount: 3, lastActivity: daysAgo(20), now: NOW }))
      .toEqual({ label: "20d", tone: "red" });
  });
});

describe("napredakLekcije", () => {
  it("X/Y kada je ukupan broj poznat", () => {
    expect(napredakLekcije(12, 40)).toBe("12/40 lekcija");
  });

  it("samo broj kada ukupan nije poznat (fallback)", () => {
    expect(napredakLekcije(8, null)).toBe("8 lekcija");
  });

  it("samo broj kada je ukupan 0", () => {
    expect(napredakLekcije(5, 0)).toBe("5 lekcija");
  });

  it("0/Y kada nije počeo a kurs ima lekcije", () => {
    expect(napredakLekcije(0, 40)).toBe("0/40 lekcija");
  });
});
