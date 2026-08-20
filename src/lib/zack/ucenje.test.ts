import { describe, it, expect } from "vitest";
import type { Rec } from "./rec";
import { napraviGrupe, miniProvera, GRUPA_NAJVISE, PROVERA_PITANJA } from "./ucenje";

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

  it("stvarne veličine lekcija ne ostavljaju patrljak na kraju", () => {
    expect(napraviGrupe(spisak(26)).map((g) => g.length)).toEqual([6, 5, 5, 5, 5]);
    expect(napraviGrupe(spisak(31)).map((g) => g.length)).toEqual([6, 5, 5, 5, 5, 5]);
  });

  it("prazan spisak daje prazan niz grupa", () => {
    expect(napraviGrupe([])).toEqual([]);
  });

  // Pojedinačni primeri gore prolaze i podeli koja na kraju ostavi patrljak, pa
  // se pravilo proverava za SVAKU veličinu lekcije odjednom.
  it("invarijanta za svaku veličinu lekcije", () => {
    for (let n = 1; n <= 40; n++) {
      const grupe = napraviGrupe(spisak(n));
      const duzine = grupe.map((g) => g.length);
      expect(duzine.reduce((a, b) => a + b, 0)).toBe(n);
      expect(Math.max(...duzine)).toBeLessThanOrEqual(GRUPA_NAJVISE);
      expect(Math.max(...duzine) - Math.min(...duzine)).toBeLessThanOrEqual(1);
      expect(grupe.flat().map((r) => r.redni_broj)).toEqual(spisak(n).map((r) => r.redni_broj));
      // Grupa manja od provere bi detetu dala kraću proveru nego što je obećano.
      if (n >= PROVERA_PITANJA) expect(Math.min(...duzine)).toBeGreaterThanOrEqual(PROVERA_PITANJA);
    }
  });

  // Uvoznik lekcije ume da propusti dve reči sa istim rednim brojem. Ređanje
  // mora da ostane stabilno, da red iz tabele ne bi zavisio od načina sortiranja.
  it("dve reči sa istim rednim brojem zadržavaju redosled iz spiska", () => {
    const reci = [rec("prva", 2), rec("druga", 2), rec("treca", 1)];
    expect(napraviGrupe(reci)[0].map((r) => r.id)).toEqual(["treca", "prva", "druga"]);
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
