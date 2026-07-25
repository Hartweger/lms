import { describe, it, expect } from "vitest";
import { passesThreshold, passLabel, isStrictCourse } from "./certificate-threshold";

describe("passesThreshold", () => {
  it("podrazumevano (A1-B2): tačno 60% prolazi", () => {
    expect(passesThreshold(15, 25, "nemacki-a2-1")).toBe(true);
    expect(passesThreshold(6, 10, "nemacki-b1-2")).toBe(true);
    expect(passesThreshold(3, 5, null)).toBe(true);
  });

  it("podrazumevano: ispod 60% ne prolazi", () => {
    expect(passesThreshold(14, 25, "nemacki-a2-1")).toBe(false);
    expect(passesThreshold(5, 10, null)).toBe(false);
  });

  it("C1.1: tačno 60% NE prolazi, mora strogo iznad", () => {
    // Nataša 25.07.2026: za C1.1 sertifikat ide tek od 16/25.
    expect(passesThreshold(15, 25, "nemacki-c1-1")).toBe(false);
    expect(passesThreshold(16, 25, "nemacki-c1-1")).toBe(true);
    expect(passesThreshold(25, 25, "nemacki-c1-1")).toBe(true);
    expect(passesThreshold(14, 25, "nemacki-c1-1")).toBe(false);
  });

  it("nema deljenja nulom ni NaN-a", () => {
    expect(passesThreshold(0, 0, "nemacki-c1-1")).toBe(false);
    expect(passesThreshold(5, 0, null)).toBe(false);
    expect(passesThreshold(NaN, 25, null)).toBe(false);
  });
});

describe("passLabel / isStrictCourse", () => {
  it("prikazuje prag koji server zaista primenjuje", () => {
    expect(passLabel("nemacki-c1-1")).toBe("preko 60%");
    expect(passLabel("nemacki-a1-1")).toBe("60%");
    expect(passLabel(null)).toBe("60%");
  });

  it("strogi prag važi samo za C1.1", () => {
    expect(isStrictCourse("nemacki-c1-1")).toBe(true);
    expect(isStrictCourse("nemacki-b2-2")).toBe(false);
    expect(isStrictCourse(undefined)).toBe(false);
  });
});
