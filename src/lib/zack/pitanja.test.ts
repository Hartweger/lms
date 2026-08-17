import { describe, it, expect } from "vitest";
import type { Rec } from "./rec";
import { napraviPitanja, ponudjeni } from "./pitanja";

const R = (i: number, over: Partial<Rec> = {}): Rec => ({
  id: `r${i}`,
  redni_broj: i,
  de: `de${i}`,
  sr: `sr${i}`,
  rod: "der",
  mnozina: `mn${i}`,
  vrsta: "imenica",
  izuzetak: false,
  ...over,
});

const RECI = [R(1), R(2), R(3), R(4), R(5), R(6)];
const nula = () => 0;

describe("ponudjeni", () => {
  it("stavlja tačan odgovor i tri pogrešna", () => {
    const opcije = ponudjeni("sr1", ["sr2", "sr3", "sr4", "sr5"], 4, nula);
    expect(opcije).toHaveLength(4);
    expect(opcije).toContain("sr1");
  });

  it("nikad ne ponavlja tačan odgovor među pogrešnima", () => {
    const opcije = ponudjeni("sr1", ["sr1", "sr2", "sr3"], 4, nula);
    expect(opcije.filter((o) => o === "sr1")).toHaveLength(1);
  });

  it("kad nema dovoljno pogrešnih, vraća koliko ih ima", () => {
    const opcije = ponudjeni("sr1", ["sr2"], 4, nula);
    expect(opcije).toHaveLength(2);
  });

  it("izbacuje duplikate među pogrešnima", () => {
    const opcije = ponudjeni("sr1", ["sr2", "sr2", "sr3"], 4, nula);
    expect(opcije).toHaveLength(3);
  });
});

describe("napraviPitanja, brzo-biranje", () => {
  it("pravi traženi broj pitanja sa četiri ponuđena odgovora", () => {
    const p = napraviPitanja(RECI, "brzo-biranje", 3, nula);
    expect(p).toHaveLength(3);
    expect(p[0]).toMatchObject({ igra: "brzo-biranje" });
    if (p[0].igra !== "brzo-biranje") throw new Error("pogrešna igra");
    expect(p[0].opcije).toHaveLength(4);
    expect(p[0].opcije).toContain(p[0].tacan);
  });
});

describe("napraviPitanja, rod", () => {
  it("uzima samo imenice koje imaju rod", () => {
    const reci = [R(1, { rod: "der" }), R(2, { rod: "nema", vrsta: "glagol" }), R(3, { rod: "das" })];
    const p = napraviPitanja(reci, "rod", 10, nula);
    expect(p).toHaveLength(2);
    if (p[0].igra !== "rod") throw new Error("pogrešna igra");
    expect(["der", "die", "das"]).toContain(p[0].tacan);
  });
});

describe("napraviPitanja, mnozina", () => {
  it("preskače reči bez upisane množine", () => {
    const reci = [R(1, { mnozina: "Häuser" }), R(2, { mnozina: null }), R(3, { mnozina: "Bäume" })];
    const p = napraviPitanja(reci, "mnozina", 10, nula);
    expect(p).toHaveLength(2);
  });
});

describe("napraviPitanja, diktat", () => {
  it("pita prevod i očekuje nemačku reč", () => {
    const p = napraviPitanja([R(1)], "diktat", 1, nula);
    expect(p[0]).toEqual({ igra: "diktat", recId: "r1", prevod: "sr1", tacan: "de1" });
  });
});

describe("napraviPitanja, parovi", () => {
  it("vraća jedno pitanje sa najviše šest parova", () => {
    const p = napraviPitanja(RECI, "parovi", 6, nula);
    expect(p).toHaveLength(1);
    if (p[0].igra !== "parovi") throw new Error("pogrešna igra");
    expect(p[0].parovi).toHaveLength(6);
  });
});

describe("napraviPitanja, granice", () => {
  it("na prazan spisak reči vraća prazno", () => {
    expect(napraviPitanja([], "brzo-biranje", 5, nula)).toEqual([]);
  });

  it("ne pravi više pitanja nego što ima reči", () => {
    expect(napraviPitanja([R(1), R(2)], "brzo-biranje", 10, nula)).toHaveLength(2);
  });
});
