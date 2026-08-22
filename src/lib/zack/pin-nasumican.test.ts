import { describe, expect, it } from "vitest";
import { napraviNasumicniPin, pinJeIspravan, slabPin } from "./pin";

describe("napraviNasumicniPin", () => {
  it("uvek daje četiri cifre", () => {
    for (let i = 0; i < 300; i++) expect(pinJeIspravan(napraviNasumicniPin())).toBe(true);
  });

  it("nikad ne daje očigledan PIN (1111, 1234, 4321)", () => {
    for (let i = 0; i < 300; i++) expect(slabPin(napraviNasumicniPin())).toBe(false);
  });

  it("zadržava vodeće nule - PIN je niz cifara, ne broj", () => {
    // Bez padStart bi 42 postalo „42" i prijava bi pucala na dužini.
    const svi = Array.from({ length: 400 }, () => napraviNasumicniPin());
    expect(svi.every((p) => p.length === 4)).toBe(true);
  });

  it("ne vraća stalno isti PIN", () => {
    const skup = new Set(Array.from({ length: 100 }, () => napraviNasumicniPin()));
    expect(skup.size).toBeGreaterThan(50);
  });
});
