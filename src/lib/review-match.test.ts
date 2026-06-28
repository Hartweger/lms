import { describe, it, expect } from "vitest";
import { normName, nameKey, respondedRecently } from "./review-match";

describe("normName", () => {
  it("skida kvačice i mala/velika slova", () => {
    expect(normName("Nataša Tomić")).toBe("natasa tomic");
    expect(normName("Anđela Gajević")).toBe("andela gajevic");
  });
  it("čisti zagrade i višak razmaka", () => {
    expect(normName("Marija Pešić (Arsenović)")).toBe("marija pesic arsenovic");
    expect(normName("  Ivan   Srnić ")).toBe("ivan srnic");
  });
});

describe("nameKey - redosled imena nebitan", () => {
  it("isto ime u oba redosleda daje isti ključ", () => {
    expect(nameKey("Koprivica Bozidar")).toBe(nameKey("Bozidar Koprivica"));
    expect(nameKey("Nataša Tomić")).toBe("natasa tomic");
  });
});

describe("respondedRecently", () => {
  const set = new Set([nameKey("Nataša Tomić"), nameKey("Koprivica Bozidar")]);
  it("prepoznaje da je popunio (i obrnut redosled)", () => {
    expect(respondedRecently("Tomić Nataša", set)).toBe(true);
    expect(respondedRecently("Bozidar Koprivica", set)).toBe(true);
  });
  it("ko nije popunio -> false", () => {
    expect(respondedRecently("Marko Marković", set)).toBe(false);
    expect(respondedRecently("", set)).toBe(false);
  });
});
