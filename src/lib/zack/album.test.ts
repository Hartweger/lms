import { describe, it, expect } from "vitest";
import type { Rec } from "./rec";
import { brojac, DANA_DO_BLEDENJA, stanjeAlbuma, type ZapisSlicice } from "./album";

const R = (i: number, over: Partial<Rec> = {}): Rec => ({
  id: `r${i}`,
  redni_broj: i,
  de: `de${i}`,
  sr: `sr${i}`,
  rod: "der",
  mnozina: null,
  vrsta: "imenica",
  izuzetak: false,
  ...over,
});

const SADA = new Date("2026-08-17T12:00:00Z");
const preDana = (n: number) =>
  new Date(SADA.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

// Podrazumevano je sličica davno zalepljena, da bi sat bledenja vodio
// `poslednje_tacno_at`, ono što ovi testovi zapravo ispituju. Kad je lepljenje
// skoro, ono je kasniji datum pa bi progutalo prag i test bi prolazio uprazno.
const Z = (recId: string, over: Partial<ZapisSlicice> = {}): ZapisSlicice => ({
  rec_id: recId,
  zalepljena_at: preDana(365),
  poslednje_tacno_at: preDana(1),
  ...over,
});

describe("stanjeAlbuma", () => {
  it("reč bez zapisa je prazno mesto", () => {
    const [s] = stanjeAlbuma([R(1)], [], SADA);
    expect(s.stanje).toBe("prazno");
    expect(s.rec.de).toBe("de1");
  });

  it("zarađena a nezalepljena sličica je u ruci", () => {
    const [s] = stanjeAlbuma([R(1)], [Z("r1", { zalepljena_at: null })], SADA);
    expect(s.stanje).toBe("u-ruci");
  });

  it("skoro ponovljena sličica je zalepljena", () => {
    const [s] = stanjeAlbuma([R(1)], [Z("r1")], SADA);
    expect(s.stanje).toBe("zalepljena");
  });

  it("sličica bledi posle praga bez ponavljanja", () => {
    const [s] = stanjeAlbuma(
      [R(1)],
      [Z("r1", { poslednje_tacno_at: preDana(DANA_DO_BLEDENJA + 1) })],
      SADA
    );
    expect(s.stanje).toBe("izbledela");
  });

  it("tačno na pragu još ne bledi", () => {
    const [s] = stanjeAlbuma(
      [R(1)],
      [Z("r1", { poslednje_tacno_at: preDana(DANA_DO_BLEDENJA) })],
      SADA
    );
    expect(s.stanje).toBe("zalepljena");
  });

  it("nezalepljena sličica ne bledi, jer je dete još nije ni zalepilo", () => {
    const [s] = stanjeAlbuma(
      [R(1)],
      [Z("r1", { zalepljena_at: null, poslednje_tacno_at: preDana(90) })],
      SADA
    );
    expect(s.stanje).toBe("u-ruci");
  });

  it("čuva redosled iz lekcije", () => {
    const stanja = stanjeAlbuma([R(3), R(1), R(2)], [], SADA);
    expect(stanja.map((s) => s.rec.redni_broj)).toEqual([1, 2, 3]);
  });

  it("zapis za nepostojeću reč se ignoriše", () => {
    const stanja = stanjeAlbuma([R(1)], [Z("r1"), Z("r99")], SADA);
    expect(stanja).toHaveLength(1);
  });
});

describe("brojac", () => {
  it("broji samo zalepljene, izbledele se računaju kao zalepljene", () => {
    const stanja = stanjeAlbuma(
      [R(1), R(2), R(3), R(4)],
      [
        Z("r1"),
        Z("r2", { poslednje_tacno_at: preDana(DANA_DO_BLEDENJA + 5) }),
        Z("r3", { zalepljena_at: null }),
      ],
      SADA
    );
    expect(brojac(stanja)).toEqual({ zalepljene: 2, ukupno: 4 });
  });

  it("prazan album je nula od nula", () => {
    expect(brojac([])).toEqual({ zalepljene: 0, ukupno: 0 });
  });
});

describe("bledenje kreće od ulaska u album", () => {
  it("sličica dugo držana u ruci ne ulazi u album već siva", () => {
    const [s] = stanjeAlbuma(
      [R(1)],
      [Z("r1", { zalepljena_at: preDana(1), poslednje_tacno_at: preDana(90) })],
      SADA
    );
    expect(s.stanje).toBe("zalepljena");
  });

  it("davno zalepljena i davno neponovljena i dalje bledi", () => {
    const [s] = stanjeAlbuma(
      [R(1)],
      [Z("r1", { zalepljena_at: preDana(90), poslednje_tacno_at: preDana(90) })],
      SADA
    );
    expect(s.stanje).toBe("izbledela");
  });

  it("pokvaren datum nikad ne bledi sličicu", () => {
    const [s] = stanjeAlbuma(
      [R(1)],
      [Z("r1", { poslednje_tacno_at: "ovo-nije-datum" })],
      SADA
    );
    expect(s.stanje).toBe("zalepljena");
  });
});
