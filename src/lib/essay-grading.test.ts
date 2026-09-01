import { describe, it, expect } from "vitest";
import {
  buildGradingPrompt,
  computePoints,
  computeScore,
  countWords,
  normalizeCriteria,
  pickGradingModel,
} from "./essay-grading";

describe("computeScore", () => {
  it("sve petice → 5", () => {
    expect(computeScore({ erfuellung: 5, kohaerenz: 5, wortschatz: 5, korrektheit: 5 })).toBe(5);
  });

  it("Erfüllung 0 obara na 1 bez obzira na jezik", () => {
    expect(computeScore({ erfuellung: 0, kohaerenz: 5, wortschatz: 5, korrektheit: 5 })).toBe(1);
  });

  it("komunikativni uspeh sa slabijom gramatikom ostaje 5 (Erfüllung x2)", () => {
    // (2*5 + 5 + 5 + 3) / 5 = 4.6 → 5
    expect(computeScore({ erfuellung: 5, kohaerenz: 5, wortschatz: 5, korrektheit: 3 })).toBe(5);
  });

  it("delimično ispunjen zadatak vuče naniže", () => {
    // (2*2 + 4 + 4 + 4) / 5 = 3.2 → 3
    expect(computeScore({ erfuellung: 2, kohaerenz: 4, wortschatz: 4, korrektheit: 4 })).toBe(3);
  });

  it("minimum je 1, ne 0", () => {
    expect(computeScore({ erfuellung: 1, kohaerenz: 0, wortschatz: 0, korrektheit: 0 })).toBe(1);
  });
});

describe("computePoints", () => {
  it("sve petice → pun broj bodova", () => {
    expect(computePoints({ erfuellung: 5, kohaerenz: 5, wortschatz: 5, korrektheit: 5 }, 40)).toBe(40);
  });

  it("Erfüllung 0 → 0 bodova (Goethe pravilo)", () => {
    expect(computePoints({ erfuellung: 0, kohaerenz: 5, wortschatz: 5, korrektheit: 5 }, 40)).toBe(0);
  });

  it("srednji rad na skali 20", () => {
    // (2*4 + 4 + 3 + 3) / 25 = 0.72 → 14.4 → 14
    expect(computePoints({ erfuellung: 4, kohaerenz: 4, wortschatz: 3, korrektheit: 3 }, 20)).toBe(14);
  });
});

describe("normalizeCriteria", () => {
  it("đubre → nule", () => {
    expect(normalizeCriteria(null)).toEqual({ erfuellung: 0, kohaerenz: 0, wortschatz: 0, korrektheit: 0 });
    expect(normalizeCriteria("x")).toEqual({ erfuellung: 0, kohaerenz: 0, wortschatz: 0, korrektheit: 0 });
  });

  it("klampuje van opsega i zaokružuje", () => {
    expect(normalizeCriteria({ erfuellung: 7, kohaerenz: -2, wortschatz: 3.6, korrektheit: "5" })).toEqual({
      erfuellung: 5, kohaerenz: 0, wortschatz: 4, korrektheit: 0,
    });
  });
});

describe("pickGradingModel", () => {
  it("A1 → Haiku, A2+ → Sonnet (kalibracija avgust 2026)", () => {
    expect(pickGradingModel("A1")).toContain("haiku");
    expect(pickGradingModel("A2")).toContain("sonnet");
    expect(pickGradingModel("B1")).toContain("sonnet");
    expect(pickGradingModel("B2")).toContain("sonnet");
    expect(pickGradingModel("C1")).toContain("sonnet");
    expect(pickGradingModel("")).toContain("haiku");
  });
});

describe("countWords", () => {
  it("broji reči, prazan tekst je 0", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("  Hallo   Welt \n wie geht's ")).toBe(4);
  });
});

describe("buildGradingPrompt", () => {
  it("sadrži nivo, broj reči i zadatak", () => {
    const p = buildGradingPrompt({ task: "Stell dich vor", text: "Ich heiße Ana", level: "A2" });
    expect(p).toContain("nivou A2");
    expect(p).toContain("3 reči");
    expect(p).toContain("Stell dich vor");
    expect(p).not.toContain("ISPITNA");
  });

  it("ispitni režim se najavljuje", () => {
    const p = buildGradingPrompt({ task: "t", text: "x", level: "B1", isExam: true });
    expect(p).toContain("ISPITNA");
  });
});
