import { describe, expect, it } from "vitest";
import {
  POKLON_DO,
  jePoklonStavka,
  napraviPoklonMeta,
  poklonVazi,
  vecUzetPoklon,
} from "./poklon";

const PRE_ROKA = new Date("2026-08-21T10:00:00+02:00");
const POSLEDNJI_TREN = new Date("2026-08-31T23:59:59+02:00");
const NA_ROKU = new Date(POKLON_DO);
const POSLE_ROKA = new Date("2026-09-02T09:00:00+02:00");

describe("poklonVazi", () => {
  it("pre roka poklon važi", () => {
    expect(poklonVazi(PRE_ROKA)).toBe(true);
  });

  it("poslednji trenutak avgusta još važi", () => {
    expect(poklonVazi(POSLEDNJI_TREN)).toBe(true);
  });

  it("tačno na rok više ne važi - 1. septembra igre miruju", () => {
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
