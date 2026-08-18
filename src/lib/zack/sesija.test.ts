import { describe, it, expect } from "vitest";
import type { Pitanje } from "./pitanja";
import {
  novaSesija,
  odgovori,
  odustani,
  oduzmiSrce,
  palaZbogSrca,
  SRCA,
  tacniRecIdovi,
  zabeleziTacne,
} from "./sesija";

const P = (i: number): Pitanje => ({
  igra: "diktat",
  recId: `r${i}`,
  prevod: `sr${i}`,
  tacan: `de${i}`,
});

describe("novaSesija", () => {
  it("kreće od prvog pitanja sa punim srcima", () => {
    const s = novaSesija([P(1), P(2), P(3)]);
    expect(s.indeks).toBe(0);
    expect(s.srca).toBe(SRCA);
    expect(s.gotovo).toBe(false);
    expect(s.tacni).toEqual([]);
  });

  it("prazna igra je odmah gotova", () => {
    expect(novaSesija([]).gotovo).toBe(true);
  });
});

describe("odgovori", () => {
  it("tačan odgovor pomera na sledeće pitanje i pamti reč", () => {
    const s = odgovori(novaSesija([P(1), P(2)]), true);
    expect(s.indeks).toBe(1);
    expect(s.srca).toBe(SRCA);
    expect(s.tacni).toEqual(["r1"]);
  });

  it("netačan odgovor uzima srce ali takođe ide dalje", () => {
    const s = odgovori(novaSesija([P(1), P(2)]), false);
    expect(s.indeks).toBe(1);
    expect(s.srca).toBe(SRCA - 1);
    expect(s.tacni).toEqual([]);
  });

  it("igra se završava kad se odgovori na poslednje pitanje", () => {
    let s = novaSesija([P(1), P(2)]);
    s = odgovori(s, true);
    s = odgovori(s, true);
    expect(s.gotovo).toBe(true);
    expect(s.tacni).toEqual(["r1", "r2"]);
  });

  it("igra se završava kad nestanu srca", () => {
    let s = novaSesija([P(1), P(2), P(3), P(4), P(5)]);
    for (let i = 0; i < SRCA; i++) s = odgovori(s, false);
    expect(s.srca).toBe(0);
    expect(s.gotovo).toBe(true);
  });

  it("odgovor na gotovu igru ništa ne menja", () => {
    const gotova = { ...novaSesija([P(1)]), gotovo: true };
    expect(odgovori(gotova, true)).toEqual(gotova);
  });

  it("ista reč se ne upisuje dvaput", () => {
    let s = novaSesija([P(1), P(1)]);
    s = odgovori(s, true);
    s = odgovori(s, true);
    expect(s.tacni).toEqual(["r1"]);
  });
});

describe("tacniRecIdovi", () => {
  it("parovi upisuju sve reči odjednom kad su svi parovi spojeni", () => {
    const parovi: Pitanje = {
      igra: "parovi",
      parovi: [
        { recId: "r1", de: "a", sr: "b" },
        { recId: "r2", de: "c", sr: "d" },
      ],
    };
    expect(tacniRecIdovi(parovi)).toEqual(["r1", "r2"]);
  });

  it("ostale igre daju jednu reč", () => {
    expect(tacniRecIdovi(P(7))).toEqual(["r7"]);
  });
});

describe("zabeleziTacne", () => {
  it("upisuje reči bez prelaska na sledeće pitanje", () => {
    const s = zabeleziTacne(novaSesija([P(1), P(2)]), ["r1"]);
    expect(s.tacni).toEqual(["r1"]);
    expect(s.indeks).toBe(0);
    expect(s.srca).toBe(SRCA);
    expect(s.gotovo).toBe(false);
  });

  it("ne upisuje istu reč dvaput", () => {
    let s = zabeleziTacne(novaSesija([P(1)]), ["r1"]);
    s = zabeleziTacne(s, ["r1", "r2"]);
    expect(s.tacni).toEqual(["r1", "r2"]);
  });

  it("na gotovoj igri ništa ne menja", () => {
    const gotova = { ...novaSesija([P(1)]), gotovo: true };
    expect(zabeleziTacne(gotova, ["r9"])).toEqual(gotova);
  });
});

describe("oduzmiSrce", () => {
  it("uzima srce bez prelaska na sledeće pitanje", () => {
    const s = oduzmiSrce(novaSesija([P(1), P(2)]));
    expect(s.srca).toBe(SRCA - 1);
    expect(s.indeks).toBe(0);
    expect(s.gotovo).toBe(false);
  });

  it("završava igru kad srca nestanu, ali čuva zarađene reči", () => {
    let s = zabeleziTacne(novaSesija([P(1), P(2)]), ["r1"]);
    for (let i = 0; i < SRCA; i++) s = oduzmiSrce(s);
    expect(s.srca).toBe(0);
    expect(s.gotovo).toBe(true);
    expect(s.tacni).toEqual(["r1"]);
  });
});

describe("odustani", () => {
  it("završava igru na zahtev i čuva sve zabeleženo", () => {
    const s = odustani(zabeleziTacne(novaSesija([P(1), P(2)]), ["r1", "r2"]));
    expect(s.gotovo).toBe(true);
    expect(s.tacni).toEqual(["r1", "r2"]);
    expect(s.srca).toBe(SRCA);
  });
});

describe("palaZbogSrca", () => {
  it("razlikuje potrošena srca od pređenih svih pitanja", () => {
    let pala = novaSesija([P(1), P(2), P(3), P(4), P(5)]);
    for (let i = 0; i < SRCA; i++) pala = odgovori(pala, false);
    expect(palaZbogSrca(pala)).toBe(true);

    let presla = novaSesija([P(1)]);
    presla = odgovori(presla, true);
    expect(palaZbogSrca(presla)).toBe(false);
  });

  it("igra u toku nije pala", () => {
    expect(palaZbogSrca(novaSesija([P(1)]))).toBe(false);
  });
});
