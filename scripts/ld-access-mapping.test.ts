import { describe, it, expect } from "vitest";
import {
  normalizeEmail, expiryFromPaid, mergeExpiry, relatedIdsToSlugs, resolveSlugs,
} from "./ld-access-mapping";

describe("normalizeEmail", () => {
  it("lowercase + trim", () => {
    expect(normalizeEmail("  Ana@Gmail.COM ")).toBe("ana@gmail.com");
  });
  it("nevalidan → null", () => {
    expect(normalizeEmail("nije-mejl")).toBeNull();
    expect(normalizeEmail("ana@gmail.con")).toBeNull(); // tipfeler .con
    expect(normalizeEmail("")).toBeNull();
  });
});

describe("expiryFromPaid / mergeExpiry", () => {
  it("dodaje 365 dana", () => {
    const paid = Date.parse("2026-01-01T00:00:00Z");
    expect(expiryFromPaid(paid)).toBe(paid + 365 * 86400000);
  });
  it("mergeExpiry uzima veći (nikad ne skraćuje)", () => {
    expect(mergeExpiry(100, 200)).toBe(200);
    expect(mergeExpiry(300, 200)).toBe(300);
    expect(mergeExpiry(null, 200)).toBe(200);
  });
});

describe("relatedIdsToSlugs", () => {
  it("prevodi LD id → slug, nepoznate izbacuje", () => {
    expect(relatedIdsToSlugs([25340, 28450, 99999])).toEqual(["nemacki-a1-1", "nemacki-a1-2"]);
  });
});

describe("resolveSlugs", () => {
  const related = { 100: ["nemacki-a1-1", "nemacki-a1-2"] }; // VIDEO A1 (preko _related_course)

  it("naziv-override ima prioritet (individualni A1.1 → video)", () => {
    expect(resolveSlugs(0, "INDIVIDUALNI KURS  nemačkog jezika A1.1 - Nataša Hartweger", related))
      .toEqual(["nemacki-a1-1"]);
  });
  it("konverzacije → kurs-konverzacije", () => {
    expect(resolveSlugs(0, "GRUPNI KURS konverzacije na nemačkom jeziku 2", related))
      .toEqual(["kurs-konverzacije"]);
  });
  it("Masterclass Sprechen B1 → polozi-goethe-b1", () => {
    expect(resolveSlugs(0, "Masterclass - SPRECHEN i SCHREIBEN B1", related))
      .toEqual(["polozi-goethe-b1"]);
  });
  it("isključeni (free/usluga/obnavljanje) → [] ", () => {
    expect(resolveSlugs(123, "Testiranje", related)).toEqual([]);
    expect(resolveSlugs(0, "INDIVIDUALNI KURS A2 – obnavljanje", related)).toEqual([]);
    expect(resolveSlugs(0, "📘 Paket individualnih časova KTŽ – Kako ti želiš", related)).toEqual([]);
    expect(resolveSlugs(0, "Deklinacija prideva", related)).toEqual([]); // port kasnije
  });
  it("preko _related_course kad nema override/excl", () => {
    expect(resolveSlugs(100, "VIDEO kurs nemačkog jezika A1", related))
      .toEqual(["nemacki-a1-1", "nemacki-a1-2"]);
  });
  it("nepoznat proizvod (nije u mapi) → null", () => {
    expect(resolveSlugs(555, "Neki novi proizvod", related)).toBeNull();
  });
});
