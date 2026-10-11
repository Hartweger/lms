import { describe, it, expect } from "vitest";
import { normalizeEmail, pickMatch, pickAllByEmail } from "./match";

describe("normalizeEmail", () => {
  it("trimuje, lowercase-uje", () => {
    expect(normalizeEmail("  Foo@Bar.RS ")).toBe("foo@bar.rs");
  });
  it("vraća null za prazno/nevalidno", () => {
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail("nije-mejl")).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
  });
});

describe("pickMatch", () => {
  const rows = [
    { id: "a", email: "ana@x.rs", instagram_handle: null },
    { id: "b", email: null, instagram_handle: "marko_ig" },
  ];
  it("spaja po mejlu (case-insensitive)", () => {
    expect(pickMatch(rows, { email: "ANA@x.rs", instagram: null })).toBe("a");
  });
  it("spaja po instagram handle-u kad nema mejla", () => {
    expect(pickMatch(rows, { email: null, instagram: "Marko_IG" })).toBe("b");
  });
  it("vraća null kad nema poklapanja", () => {
    expect(pickMatch(rows, { email: "novi@x.rs", instagram: "niko" })).toBeNull();
  });
  it("mejl ima prioritet nad IG-om", () => {
    const r = [{ id: "a", email: "ana@x.rs", instagram_handle: "drugi" }];
    expect(pickMatch(r, { email: "ana@x.rs", instagram: "marko_ig" })).toBe("a");
  });
});

describe("pickAllByEmail", () => {
  const rows = [
    { id: "a", email: "Ana@X.rs" },
    { id: "b", email: "ana@x.rs " },
    { id: "c", email: "drugi@x.rs" },
    { id: "d", email: null },
  ];
  it("vraća sve redove sa istim mejlom, bez obzira na velika slova i razmake", () => {
    expect(pickAllByEmail(rows, " ANA@x.rs").map((r) => r.id)).toEqual(["a", "b"]);
  });
  it("prazan ili nevalidan mejl ne poklapa ništa (ni redove bez mejla)", () => {
    expect(pickAllByEmail(rows, null)).toEqual([]);
    expect(pickAllByEmail(rows, "")).toEqual([]);
    expect(pickAllByEmail(rows, "nije-mejl")).toEqual([]);
  });
});
