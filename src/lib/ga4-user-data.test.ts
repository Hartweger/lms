import { describe, it, expect } from "vitest";
import { normalizeEmailForGoogle, ga4UserData } from "./ga4-user-data";

describe("normalizeEmailForGoogle", () => {
  it("spušta u mala slova i seče razmake", () =>
    expect(normalizeEmailForGoogle("  Test@Example.COM ")).toBe("test@example.com"));
  it("uklanja tačke iz gmail lokalnog dela", () =>
    expect(normalizeEmailForGoogle("pera.peric@gmail.com")).toBe("peraperic@gmail.com"));
  it("uklanja tačke i za googlemail.com", () =>
    expect(normalizeEmailForGoogle("pera.peric@googlemail.com")).toBe("peraperic@googlemail.com"));
  it("NE dira tačke van gmaila", () =>
    expect(normalizeEmailForGoogle("pera.peric@hartweger.rs")).toBe("pera.peric@hartweger.rs"));
  it("null za string bez @", () => expect(normalizeEmailForGoogle("nije-mejl")).toBeNull());
  it("null za prazan string", () => expect(normalizeEmailForGoogle("")).toBeNull());
  it("null za undefined/null", () => {
    expect(normalizeEmailForGoogle(undefined)).toBeNull();
    expect(normalizeEmailForGoogle(null)).toBeNull();
  });
});

describe("ga4UserData", () => {
  it("vraća sha256 heš normalizovanog mejla (poznati vektor)", () =>
    expect(ga4UserData("Test@Example.com ")).toEqual({
      sha256_email_address: "973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b",
    }));
  it("normalizacija ulazi u heš (gmail tačke)", () =>
    // sha256("natasa@example.com") - tačke uklonjene pre heširanja
    expect(ga4UserData("na.tasa@gmail.com")).not.toEqual(ga4UserData("na.tasa@example.com")));
  it("null za nevažeći mejl", () => expect(ga4UserData("nije-mejl")).toBeNull());
  it("null za null/undefined", () => {
    expect(ga4UserData(null)).toBeNull();
    expect(ga4UserData(undefined)).toBeNull();
  });
});
