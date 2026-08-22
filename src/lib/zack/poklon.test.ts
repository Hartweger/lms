import { describe, expect, it } from "vitest";
import {
  POKLON_DO,
  jePoklonStavka,
  napraviPoklonMeta,
  poklonVazi,
  vecUzetPoklon,
  vremeZaPodsetnik,
} from "./poklon";

const PRE_ROKA = new Date("2026-08-21T10:00:00+02:00");
const POSLEDNJI_TREN = new Date("2026-09-14T23:59:59+02:00");
const NA_ROKU = new Date(POKLON_DO);
const POSLE_ROKA = new Date("2026-09-16T09:00:00+02:00");

describe("poklonVazi", () => {
  it("pre roka poklon važi", () => {
    expect(poklonVazi(PRE_ROKA)).toBe(true);
  });

  it("poslednji trenutak pred rok još važi", () => {
    expect(poklonVazi(POSLEDNJI_TREN)).toBe(true);
  });

  it("tačno na rok više ne važi - tog dana igre miruju", () => {
    expect(poklonVazi(NA_ROKU)).toBe(false);
  });

  it("posle roka ne važi", () => {
    expect(poklonVazi(POSLE_ROKA)).toBe(false);
  });
});

describe("napraviPoklonMeta i jePoklonStavka", () => {
  it("napravljena oznaka se prepoznaje kao poklon", () => {
    const stavka = { course_slug: "zack-clanstvo", zack_poklon: napraviPoklonMeta() };
    expect(jePoklonStavka(stavka)).toBe(true);
  });

  it("oznaka nosi rok, da se iz same porudžbine vidi šta je obećano", () => {
    expect(napraviPoklonMeta().do).toBe(POKLON_DO);
  });

  it("plaćena stavka nije poklon", () => {
    expect(jePoklonStavka({ course_slug: "zack-clanstvo", dete_id: "d-1" })).toBe(false);
  });

  it("stavka koja ne postoji nije poklon", () => {
    expect(jePoklonStavka(undefined)).toBe(false);
    expect(jePoklonStavka(null)).toBe(false);
  });

  it("podmetnuta vrednost umesto oznake se ne priznaje", () => {
    expect(jePoklonStavka({ zack_poklon: true })).toBe(false);
    expect(jePoklonStavka({ zack_poklon: "da" })).toBe(false);
    expect(jePoklonStavka({ zack_poklon: {} })).toBe(false);
  });
});

describe("vecUzetPoklon", () => {
  const poklonska = { items: [{ course_slug: "zack-clanstvo", zack_poklon: napraviPoklonMeta() }] };
  const placena = { items: [{ course_slug: "zack-clanstvo", dete_id: "d-1" }] };

  it("bez ijedne ranije porudžbine poklon se sme dati", () => {
    expect(vecUzetPoklon([])).toBe(false);
  });

  it("ranija poklon-porudžbina zatvara vrata - jedan poklon po mejlu", () => {
    expect(vecUzetPoklon([poklonska])).toBe(true);
  });

  it("plaćene porudžbine ne troše poklon", () => {
    expect(vecUzetPoklon([placena, placena])).toBe(false);
  });

  it("poklon se prepozna i kad nije prva porudžbina po redu", () => {
    expect(vecUzetPoklon([placena, poklonska])).toBe(true);
  });

  it("porudžbina bez stavki ne ruši proveru", () => {
    expect(vecUzetPoklon([{ items: null }, { items: [] }, { items: "nije-niz" }])).toBe(false);
  });
});

describe("vremeZaPodsetnik", () => {
  // Dete na poklonu: rok mu je tačno rok akcije.
  const NA_POKLONU = POKLON_DO;

  it("van prozora - četiri dana pre isteka ćuti", () => {
    expect(vremeZaPodsetnik(new Date("2026-09-10T09:00:00+02:00"), NA_POKLONU)).toBe(false);
  });

  it("u prozoru - tri dana pre isteka je vreme", () => {
    expect(vremeZaPodsetnik(new Date("2026-09-12T09:00:00+02:00"), NA_POKLONU)).toBe(true);
  });

  it("dan pred istek je i dalje vreme", () => {
    expect(vremeZaPodsetnik(new Date("2026-09-14T20:00:00+02:00"), NA_POKLONU)).toBe(true);
  });

  it("posle isteka se ne šalje - podsetnik na prošlost je opominjanje", () => {
    expect(vremeZaPodsetnik(new Date("2026-09-15T09:00:00+02:00"), NA_POKLONU)).toBe(false);
  });

  it("dete koje je prešlo na članstvo se preskače - njemu ništa ne ističe", () => {
    expect(vremeZaPodsetnik(new Date("2026-09-12T09:00:00+02:00"), "2026-10-20T00:00:00+02:00")).toBe(false);
  });

  it("dete bez roka (oslobođeno ili bez članstva) se preskače", () => {
    expect(vremeZaPodsetnik(new Date("2026-09-12T09:00:00+02:00"), null)).toBe(false);
  });

  it("pokvaren datum ne ruši cron", () => {
    expect(vremeZaPodsetnik(new Date("2026-09-12T09:00:00+02:00"), "nije-datum")).toBe(false);
  });
});
