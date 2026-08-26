import { describe, it, expect } from "vitest";
import { staDostaje, type FirmaRed } from "./FirmeClient";

function firma(over: Partial<FirmaRed> = {}): FirmaRed {
  return {
    pib: "109925860",
    naziv: "Proba DOO",
    adresa: "Neka 1",
    grad: "Beograd",
    maticniBroj: "21268372",
    email: "racunovodstvo@proba.rs",
    brojNarudzbina: 1,
    ...over,
  };
}

describe("staDostaje", () => {
  it("potpuna firma nema šta da fali", () => {
    expect(staDostaje(firma())).toEqual([]);
  });

  it("hvata matični broj i grad - to su polja koja SEF traži", () => {
    expect(staDostaje(firma({ maticniBroj: null }))).toEqual(["matični broj"]);
    expect(staDostaje(firma({ grad: null }))).toEqual(["grad"]);
    expect(staDostaje(firma({ maticniBroj: null, grad: null }))).toEqual(["matični broj", "grad"]);
  });

  it("adresa i mejl ne blokiraju SEF, pa se ne prijavljuju kao nedostatak", () => {
    expect(staDostaje(firma({ adresa: null, email: null }))).toEqual([]);
  });
});
