import { describe, expect, it } from "vitest";
import { jeOtkljucano, noviRokClanstva } from "./clanstvo";

const SADA = new Date("2026-08-19T12:00:00Z");
const SUTRA = "2026-08-20T12:00:00Z";
const JUCE = "2026-08-18T12:00:00Z";

const dete = (delovi: Partial<Parameters<typeof jeOtkljucano>[0]>) => ({
  roditeljId: "r-1",
  oslobodjeno: false,
  clanstvoDo: null,
  ...delovi,
});

describe("jeOtkljucano", () => {
  it("oslobođeno dete je otključano i bez ijedne naplate", () => {
    expect(jeOtkljucano(dete({ oslobodjeno: true }), SADA)).toBe(true);
  });

  it("dete bez roditelja (interna probna deca) je uvek otključano", () => {
    expect(jeOtkljucano(dete({ roditeljId: null }), SADA)).toBe(true);
  });

  it("važeće članstvo otključava", () => {
    expect(jeOtkljucano(dete({ clanstvoDo: SUTRA }), SADA)).toBe(true);
  });

  it("isteklo članstvo zaključava", () => {
    expect(jeOtkljucano(dete({ clanstvoDo: JUCE }), SADA)).toBe(false);
  });

  it("bez članstva je zaključano", () => {
    expect(jeOtkljucano(dete({}), SADA)).toBe(false);
  });

  it("pokvaren datum se tretira kao da članstvo ne važi (naš podatak o naplati, ne detetov rad)", () => {
    expect(jeOtkljucano(dete({ clanstvoDo: "nije-datum" }), SADA)).toBe(false);
  });

  it("oslobođeno pobedjuje istekao datum - pilot porodici se ne gleda naplata", () => {
    expect(jeOtkljucano(dete({ oslobodjeno: true, clanstvoDo: JUCE }), SADA)).toBe(true);
  });
});

describe("noviRokClanstva", () => {
  const NOVI = new Date("2026-09-26T12:00:00Z");

  it("bez postojećeg roka važi novi", () => {
    expect(noviRokClanstva(null, NOVI)).toEqual(NOVI);
  });

  it("kraći postojeći rok se produžava", () => {
    expect(noviRokClanstva(JUCE, NOVI)).toEqual(NOVI);
  });

  it("duži postojeći rok se NE skraćuje (poll sa zakašnjenjem ne sme da oduzme plaćeno)", () => {
    const dalji = "2026-10-10T12:00:00Z";
    expect(noviRokClanstva(dalji, NOVI)).toEqual(new Date(dalji));
  });

  it("pokvaren postojeći rok se zamenjuje novim", () => {
    expect(noviRokClanstva("nije-datum", NOVI)).toEqual(NOVI);
  });
});
