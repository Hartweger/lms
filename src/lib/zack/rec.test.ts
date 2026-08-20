import { describe, it, expect } from "vitest";
import {
  BOJA_MNOZINA,
  bojaZaRod,
  imaMnozinu,
  mnozinaReci,
  promesaj,
  ROD_BOJA,
  type Rec,
} from "./rec";

const R = (mnozina: string | null): Rec => ({
  id: "r1",
  redni_broj: 1,
  de: "der Hunger",
  sr: "glad",
  rod: "der",
  mnozina,
  vrsta: "imenica",
  izuzetak: false,
});

describe("bojaZaRod", () => {
  it("der je plava, die crvena, das zelena", () => {
    expect(bojaZaRod("der")).toBe("#0B54C9");
    expect(bojaZaRod("die")).toBe("#E5342A");
    expect(bojaZaRod("das")).toBe("#2E9E4F");
  });

  it("žuta je množina i nije ni jedan rod", () => {
    expect(BOJA_MNOZINA).toBe("#FFC400");
    expect(Object.values(ROD_BOJA)).not.toContain(BOJA_MNOZINA);
  });

  it("reč bez roda dobija mastilo", () => {
    expect(bojaZaRod("nema")).toBe("#16161A");
  });

  it("paleta ima tačno četiri unosa", () => {
    expect(Object.keys(ROD_BOJA)).toHaveLength(4);
  });
});

describe("imaMnozinu", () => {
  it("prava množina se prepoznaje i vraća bez ivičnih razmaka", () => {
    expect(imaMnozinu(R("die Häuser"))).toBe(true);
    expect(mnozinaReci(R("  die Häuser  "))).toBe("die Häuser");
  });

  it("prazna kolona znači da množine nema", () => {
    for (const prazno of [null, "", "   "]) {
      expect(imaMnozinu(R(prazno))).toBe(false);
      expect(mnozinaReci(R(prazno))).toBeNull();
    }
  });

  it("crtica, kosa crta i duge crtice iz tabele znače da množine nema", () => {
    for (const oznaka of ["-", " - ", "/", " / ", "–", "—"]) {
      expect(imaMnozinu(R(oznaka))).toBe(false);
      expect(mnozinaReci(R(oznaka))).toBeNull();
    }
  });
});

describe("promesaj", () => {
  it("ne menja polazni niz", () => {
    const polazni = ["a", "b", "c"];
    promesaj(polazni, () => 0);
    expect(polazni).toEqual(["a", "b", "c"]);
  });

  it("je predvidljiv kad je slučajni broj uvek nula", () => {
    expect(promesaj(["a", "b", "c"], () => 0)).toEqual(["b", "c", "a"]);
  });

  it("zadržava sve elemente", () => {
    const rezultat = promesaj([1, 2, 3, 4, 5], () => 0.5);
    expect([...rezultat].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
