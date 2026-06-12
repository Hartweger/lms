import { beforeAll, describe, expect, it } from "vitest";
import { odjavaToken, odjavaUrl } from "./optout";

beforeAll(() => {
  process.env.CRON_SECRET = "test-tajna";
});

describe("odjavaToken", () => {
  it("isti mejl uvek daje isti token", () => {
    expect(odjavaToken("ana@example.com")).toBe(odjavaToken("ana@example.com"));
  });

  it("normalizuje velika slova i razmake", () => {
    expect(odjavaToken("  Ana@Example.COM ")).toBe(odjavaToken("ana@example.com"));
  });

  it("različiti mejlovi daju različite tokene", () => {
    expect(odjavaToken("ana@example.com")).not.toBe(odjavaToken("ivan@example.com"));
  });
});

describe("odjavaUrl", () => {
  it("sadrži enkodovan mejl i token", () => {
    const url = odjavaUrl("Ana@Example.com");
    expect(url).toContain("/api/odjava?e=ana%40example.com&t=");
    expect(url).toContain(odjavaToken("ana@example.com"));
  });
});
