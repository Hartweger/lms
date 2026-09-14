import { describe, it, expect } from "vitest";
import { essayPassed, canRewriteEssay } from "./essay-retry";

describe("essayPassed", () => {
  it("prag je 60% od maxPoints (podrazumevano 5 → 3)", () => {
    expect(essayPassed(3, 5)).toBe(true);
    expect(essayPassed(2, 5)).toBe(false);
    expect(essayPassed(1, 5)).toBe(false);
  });
  it("radi i sa većim maxPoints (ispiti 40/20 bodova)", () => {
    expect(essayPassed(24, 40)).toBe(true);
    expect(essayPassed(23, 40)).toBe(false);
    expect(essayPassed(12, 20)).toBe(true);
  });
  it("bez ocene = nije položeno", () => {
    expect(essayPassed(null, 5)).toBe(false);
    expect(essayPassed(undefined, 5)).toBe(false);
  });
});

describe("canRewriteEssay", () => {
  // Ana M. (A1.2, 14.09.2026): esej „Ne znam" ocenjen 1/5, „Pokušaj ponovo" ništa nije
  // radilo jer se ocenjen rad uvek ponovo učita umesto polja za pisanje.
  it("ocenjen rad ispod praga sme ponovo da se piše", () => {
    expect(canRewriteEssay("published", 1, 5)).toBe(true);
    expect(canRewriteEssay("published", 2, 5)).toBe(true);
  });
  it("položen rad se ne piše ponovo (profesorka ne ocenjuje bez potrebe)", () => {
    expect(canRewriteEssay("published", 3, 5)).toBe(false);
    expect(canRewriteEssay("published", 5, 5)).toBe(false);
  });
  it("rad koji čeka pregled se ne piše ponovo", () => {
    expect(canRewriteEssay("pending", null, 5)).toBe(false);
  });
});
