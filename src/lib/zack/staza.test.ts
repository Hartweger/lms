import { describe, it, expect } from "vitest";
import { predlozenaLekcija, znakStaze, type StavkaStaze } from "./staza";

/** Kratak način da se napiše kartica; podrazumevano prazan album od 10 reči. */
const lekcija = (broj: number, delovi: Partial<StavkaStaze> = {}): StavkaStaze => ({
  broj,
  naziv: `Lekcija ${broj}`,
  zalepljene: 0,
  ukupno: 10,
  neotvorenaKesica: 0,
  ...delovi,
});

describe("predlozenaLekcija", () => {
  it("prazna staza nema znak", () => {
    expect(predlozenaLekcija([])).toBeNull();
  });

  it("sasvim novo dete dobija prvu lekciju", () => {
    expect(predlozenaLekcija([lekcija(1), lekcija(2), lekcija(3)])).toBe(1);
  });

  it("kesica koja čeka je jača od započete lekcije", () => {
    const staza = [
      lekcija(1, { zalepljene: 4 }),
      lekcija(2),
      lekcija(3, { neotvorenaKesica: 2 }),
    ];
    expect(predlozenaLekcija(staza)).toBe(3);
  });

  it("kesica u punom albumu i dalje vuče znak na sebe", () => {
    const staza = [
      lekcija(1, { zalepljene: 10, neotvorenaKesica: 1 }),
      lekcija(2, { zalepljene: 3 }),
    ];
    expect(predlozenaLekcija(staza)).toBe(1);
  });

  it("od više kesica bira najmanji broj lekcije", () => {
    const staza = [
      lekcija(1, { zalepljene: 10 }),
      lekcija(2, { neotvorenaKesica: 1 }),
      lekcija(3, { neotvorenaKesica: 5 }),
    ];
    expect(predlozenaLekcija(staza)).toBe(2);
  });

  it("započeta lekcija ide pre prazne", () => {
    const staza = [lekcija(1, { zalepljene: 10 }), lekcija(2), lekcija(3, { zalepljene: 1 })];
    expect(predlozenaLekcija(staza)).toBe(3);
  });

  it("od više započetih bira najmanji broj lekcije", () => {
    const staza = [lekcija(1, { zalepljene: 9 }), lekcija(2, { zalepljene: 2 })];
    expect(predlozenaLekcija(staza)).toBe(1);
  });

  it("kad su započete gotove, znak ide na prvu praznu", () => {
    const staza = [lekcija(1, { zalepljene: 10 }), lekcija(2, { zalepljene: 10 }), lekcija(3)];
    expect(predlozenaLekcija(staza)).toBe(3);
  });

  it("kad su svi albumi puni, nema znaka", () => {
    const staza = [lekcija(1, { zalepljene: 10 }), lekcija(2, { zalepljene: 10 })];
    expect(predlozenaLekcija(staza)).toBeNull();
  });

  it("znak ne zavisi od redosleda u kom spisak stigne", () => {
    const staza = [lekcija(3), lekcija(1), lekcija(2)];
    expect(predlozenaLekcija(staza)).toBe(1);
  });

  it("lekcija bez ijedne reči se ne predlaže", () => {
    const staza = [lekcija(1, { zalepljene: 10 }), lekcija(2, { ukupno: 0 }), lekcija(3)];
    expect(predlozenaLekcija(staza)).toBe(3);
  });

  it("staza od samih praznih lekcija bez reči nema znak", () => {
    expect(predlozenaLekcija([lekcija(1, { ukupno: 0 }), lekcija(2, { ukupno: 0 })])).toBeNull();
  });

  it("više zalepljenih nego reči se broji kao pun album, ne kao započet", () => {
    const staza = [lekcija(1, { zalepljene: 12 }), lekcija(2, { zalepljene: 10 })];
    expect(predlozenaLekcija(staza)).toBeNull();
  });
});

describe("znakStaze", () => {
  it("detetu bez ijedne sličice ide natpis Kreni odavde", () => {
    expect(znakStaze([lekcija(1), lekcija(2)])).toEqual({ broj: 1, tekst: "Kreni odavde" });
  });

  it("detetu koje je već nešto zalepilo ide natpis Nastavi", () => {
    const staza = [lekcija(1, { zalepljene: 3 }), lekcija(2)];
    expect(znakStaze(staza)).toEqual({ broj: 1, tekst: "Nastavi" });
  });

  it("kesica koja čeka je već zarađena, pa i tu ide natpis Nastavi", () => {
    const staza = [lekcija(1, { neotvorenaKesica: 2 }), lekcija(2)];
    expect(znakStaze(staza)).toEqual({ broj: 1, tekst: "Nastavi" });
  });

  it("kad znaka nema, nema ni natpisa", () => {
    expect(znakStaze([lekcija(1, { zalepljene: 10 })])).toBeNull();
    expect(znakStaze([])).toBeNull();
  });
});
