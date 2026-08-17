import { describe, it, expect } from "vitest";
import { bojaZaRod, promesaj, ROD_BOJA } from "./rec";

describe("bojaZaRod", () => {
  it("der je plava, die crvena, das žuta", () => {
    expect(bojaZaRod("der")).toBe("#0B54C9");
    expect(bojaZaRod("die")).toBe("#E5342A");
    expect(bojaZaRod("das")).toBe("#FFC400");
  });

  it("reč bez roda dobija mastilo", () => {
    expect(bojaZaRod("nema")).toBe("#16161A");
  });

  it("paleta ima tačno četiri unosa", () => {
    expect(Object.keys(ROD_BOJA)).toHaveLength(4);
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
