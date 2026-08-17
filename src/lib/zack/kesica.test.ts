import { describe, it, expect } from "vitest";
import type { Rec } from "./rec";
import { KESICA_NAJVISE, otvoriKesicu } from "./kesica";

const R = (i: number, izuzetak = false): Rec => ({
  id: `r${i}`,
  redni_broj: i,
  de: `de${i}`,
  sr: `sr${i}`,
  rod: "der",
  mnozina: null,
  vrsta: "imenica",
  izuzetak,
});

const nula = () => 0;

describe("otvoriKesicu", () => {
  it("daje samo reči koje je dete tačno odgovorilo", () => {
    const kesica = otvoriKesicu([R(1), R(2), R(3)], ["r1", "r2"], new Set(), nula);
    expect(kesica.map((r) => r.id).sort()).toEqual(["r1", "r2"]);
  });

  it("ne daje reč koju dete već ima", () => {
    const kesica = otvoriKesicu([R(1), R(2)], ["r1", "r2"], new Set(["r1"]), nula);
    expect(kesica.map((r) => r.id)).toEqual(["r2"]);
  });

  it("ne daje više od najvećeg broja po kesici", () => {
    const reci = [R(1), R(2), R(3), R(4), R(5), R(6), R(7)];
    const svi = reci.map((r) => r.id);
    expect(otvoriKesicu(reci, svi, new Set(), nula)).toHaveLength(KESICA_NAJVISE);
  });

  it("u jednoj kesici je najviše jedan izuzetak", () => {
    const reci = [R(1, true), R(2, true), R(3, true), R(4), R(5)];
    const kesica = otvoriKesicu(reci, reci.map((r) => r.id), new Set(), nula);
    expect(kesica.filter((r) => r.izuzetak)).toHaveLength(1);
  });

  it("kesica sme da bude samo izuzetak ako drugih reči nema", () => {
    const reci = [R(1, true)];
    expect(otvoriKesicu(reci, ["r1"], new Set(), nula)).toHaveLength(1);
  });

  it("prazna kesica kad je sve već sakupljeno", () => {
    expect(otvoriKesicu([R(1)], ["r1"], new Set(["r1"]), nula)).toEqual([]);
  });

  it("prazna kesica kad nije bilo nijednog tačnog odgovora", () => {
    expect(otvoriKesicu([R(1), R(2)], [], new Set(), nula)).toEqual([]);
  });
});
