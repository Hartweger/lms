import { describe, it, expect } from "vitest";
import { remainingLessons, computeLessonStatus, formatLessonDate, duplicateLessonError } from "./individual-lessons";

describe("remainingLessons", () => {
  it("računa preostale", () => { expect(remainingLessons(3, 7)).toBe(4); });
  it("ne ide ispod 0", () => { expect(remainingLessons(9, 7)).toBe(0); });
});

describe("computeLessonStatus", () => {
  it("active dok ima preostalih", () => { expect(computeLessonStatus(6, 7)).toBe("active"); });
  it("completed kad je potrošeno", () => { expect(computeLessonStatus(7, 7)).toBe("completed"); });
  it("completed i kad pređe", () => { expect(computeLessonStatus(8, 7)).toBe("completed"); });
  it("active za paket 0 (bez definisanog broja)", () => { expect(computeLessonStatus(0, 0)).toBe("active"); });
});

describe("formatLessonDate", () => {
  it("ISO → dd.mm.yyyy.", () => { expect(formatLessonDate("2026-07-17")).toBe("17.07.2026."); });
  it("dopunjava nule", () => { expect(formatLessonDate("2026-01-09")).toBe("09.01.2026."); });
  it("neispravan datum vraća kako jeste", () => { expect(formatLessonDate("nije-datum")).toBe("nije-datum"); });
});

describe("duplicateLessonError", () => {
  it("nema časa tog dana → sme da se upiše", () => {
    expect(duplicateLessonError(0, "2026-07-17")).toBeNull();
  });
  it("već postoji čas tog dana → poruka sa datumom", () => {
    const poruka = duplicateLessonError(1, "2026-07-17");
    expect(poruka).toContain("17.07.2026.");
    expect(poruka).toContain("već upisan");
  });
  it("poruka upućuje na Natašu za stvarni dvostruki čas", () => {
    expect(duplicateLessonError(1, "2026-07-17")).toContain("Nataši");
  });
  it("radi i kad ih ima više", () => {
    expect(duplicateLessonError(3, "2026-05-29")).not.toBeNull();
  });
  it("negativan broj se ponaša kao nula", () => {
    expect(duplicateLessonError(-1, "2026-07-17")).toBeNull();
  });
});
