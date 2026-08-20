import { describe, it, expect } from "vitest";
import type { Rec } from "./rec";
import { napraviGrupe, miniProvera, GRUPA_NAJVISE } from "./ucenje";

function rngNiz(vrednosti: number[]): () => number {
  let i = 0;
  return () => vrednosti[i++ % vrednosti.length];
}

const rec = (id: string, redni: number): Rec => ({
  id,
  redni_broj: redni,
  de: `Wort${redni}`,
  sr: `reč${redni}`,
  rod: "das",
  mnozina: null,
  vrsta: "imenica",
  izuzetak: false,
});

const spisak = (n: number) => Array.from({ length: n }, (_, i) => rec(`r${i + 1}`, i + 1));

describe("napraviGrupe", () => {
  it("čuva didaktički redosled (redni_broj), ne meša", () => {
    const grupe = napraviGrupe(spisak(12));
    expect(grupe.flat().map((r) => r.redni_broj)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("nijedna grupa nije veća od GRUPA_NAJVISE", () => {
    for (const n of [1, 5, 6, 7, 13, 26, 31]) {
      for (const g of napraviGrupe(spisak(n))) {
        expect(g.length).toBeLessThanOrEqual(GRUPA_NAJVISE);
        expect(g.length).toBeGreaterThan(0);
      }
    }
  });

  it("grupe su ujednačene: 7 reči daje 4+3, ne 6+1", () => {
    expect(napraviGrupe(spisak(7)).map((g) => g.length)).toEqual([4, 3]);
  });

  it("prazan spisak daje prazan niz grupa", () => {
    expect(napraviGrupe([])).toEqual([]);
  });
});

describe("miniProvera", () => {
  it("pravi najviše 3 pitanja brzog biranja iz reči grupe", () => {
    const sve = spisak(12);
    const grupa = sve.slice(0, 6);
    const pitanja = miniProvera(grupa, sve, rngNiz([0.2, 0.5, 0.8, 0.1]));
    expect(pitanja).toHaveLength(3);
    for (const p of pitanja) {
      expect(p.igra).toBe("brzo-biranje");
      if (p.igra === "brzo-biranje") {
        expect(grupa.some((r) => r.id === p.recId)).toBe(true);
      }
    }
  });

  it("grupa od jedne reči daje jedno pitanje", () => {
    const sve = spisak(5);
    expect(miniProvera(sve.slice(0, 1), sve, rngNiz([0.5]))).toHaveLength(1);
  });
});
