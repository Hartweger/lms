import { describe, it, expect } from "vitest";
import { istiRacun, nasRacun } from "./izvod-upis";

describe("istiRacun", () => {
  it("isti račun, bez obzira na crtice i razmake", () => {
    expect(istiRacun("160-0000000000000-11", "160000000000000011")).toBe(true);
    expect(istiRacun("160 0000000000000 11", "160-0000000000000-11")).toBe(true);
  });

  it("tuđi račun ne prolazi", () => {
    expect(istiRacun("205-0000000000000-22", "160-0000000000000-11")).toBe(false);
  });

  it("prazno i besmisleno ne prolaze - inače bi lažan izvod prošao kao naš", () => {
    expect(istiRacun(null, "160-0000000000000-11")).toBe(false);
    expect(istiRacun("", "160-0000000000000-11")).toBe(false);
    expect(istiRacun("bez broja", "160-0000000000000-11")).toBe(false);
    expect(istiRacun("160-0000000000000-11", null)).toBe(false);
  });

  it("delimično poklapanje nije poklapanje", () => {
    expect(istiRacun("160-0000000000000-1", "160-0000000000000-11")).toBe(false);
  });
});

describe("nasRacun", () => {
  const nasi = "160-0000000000000-11, 170-0000000000000-22";

  it("prolazi svaki podešen račun", () => {
    expect(nasRacun("160-0000000000000-11", nasi)).toBe(true);
    expect(nasRacun("170-0000000000000-22", nasi)).toBe(true);
  });

  it("tuđi račun ne prolazi ni kad ih je podešeno više", () => {
    expect(nasRacun("205-0000000000000-33", nasi)).toBe(false);
  });

  it("bez podešenih računa ne prolazi niko", () => {
    expect(nasRacun("160-0000000000000-11", undefined)).toBe(false);
    expect(nasRacun("160-0000000000000-11", "")).toBe(false);
    expect(nasRacun("160-0000000000000-11", " , ")).toBe(false);
  });

  it("jedan račun bez zareza i dalje radi", () => {
    expect(nasRacun("160-0000000000000-11", "160-0000000000000-11")).toBe(true);
  });
});
