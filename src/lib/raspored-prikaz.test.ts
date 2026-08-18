import { describe, expect, it } from "vitest";
import {
  LEVEL_ORDER,
  SPECIAL_LEVELS,
  formatPrice,
  getFilterKey,
  getLevelColors,
  getNivoKey,
  nivoColors,
  terminPrikaz,
} from "./raspored-prikaz";
import type { GrupaRaspored } from "./raspored";

const grupa = (o: Partial<GrupaRaspored> = {}): GrupaRaspored => ({
  nivo: "A2.1", prof: "Milica", status: "Otvoren za upis",
  pocetak: "05.08.2026", trajanje: "7", dani: "pon, sre", daniPuni: "Ponedeljak, Sreda",
  sat: "18:00-19:00", maks: "6", upisanih: "2", slobodnih: "4", full: false,
  checkoutSlug: null, cena: null, cenaEur: null,
  uToku: false, sledeciCas: "", ukupnoCasova: 14, preostaloCasova: 14,
  ...o,
});

describe("raspored-prikaz", () => {
  it("getNivoKey vadi nivo iz oznake grupe", () => {
    expect(getNivoKey("A1.1")).toBe("A1");
    expect(getNivoKey("b2.2")).toBe("B2");
  });
  it("formatPrice koristi tačku kao separator hiljada", () => {
    expect(formatPrice(19600)).toBe("19.600");
  });
  it("boja definisana za svaki CEFR nivo", () => {
    LEVEL_ORDER.forEach((l) => expect(nivoColors[l]).toBeDefined());
  });
});

// Zamka koja se ponovila dva puta: grupa čiji nivo nije CEFR ("Konverzacija B1+")
// je ćutke ispadala sa /raspored i /grupni-kursevi jer se filtriralo po prva 2
// slova nivoa. Poseban nivo dobija svoj ključ i boju, a nepoznat nivo i dalje
// prolazi (sa sivim fallbackom) umesto da nestane.
describe("getFilterKey", () => {
  it("CEFR podnivo svodi na nivo", () => {
    expect(getFilterKey("A1.1")).toBe("A1");
    expect(getFilterKey("b2.2")).toBe("B2");
    expect(getFilterKey("C1.2")).toBe("C1");
  });
  it("poseban kurs zadržava ceo naziv kao ključ", () => {
    expect(getFilterKey("Konverzacija B1+")).toBe("Konverzacija B1+");
  });
  it("nepoznat nivo ne pada u CEFR kofu", () => {
    expect(LEVEL_ORDER).not.toContain(getFilterKey("Dečji nemački"));
    expect(getFilterKey("Dečji nemački")).toBe("Dečji nemački");
  });
});

describe("getLevelColors", () => {
  it("CEFR nivo dobija boju svog nivoa", () => {
    expect(getLevelColors("A1.2")).toEqual(nivoColors.A1);
  });
  it("poseban kurs dobija svoju boju, ne boju nivoa po prva 2 slova", () => {
    const konverzacija = getLevelColors("Konverzacija B1+");
    expect(konverzacija.text).toBe(SPECIAL_LEVELS["Konverzacija B1+"].text);
    expect(konverzacija).not.toEqual(nivoColors.C1);
  });
  it("nepoznat nivo dobija sivi fallback umesto pada", () => {
    expect(getLevelColors("Dečji nemački")).toEqual({ bg: "#f3f4f6", text: "#374151" });
  });
});

describe("terminPrikaz", () => {
  it("grupa koja tek počinje: datum početka + trajanje", () => {
    expect(terminPrikaz(grupa())).toEqual({
      uToku: false, labela: "Početak", datum: "05.08.2026", napomena: "7 nedelja",
    });
  });
  it("labela za početak može da se prilagodi stranici", () => {
    expect(terminPrikaz(grupa(), "Sledeći termin")?.labela).toBe("Sledeći termin");
  });
  it("grupa u toku: NE prikazuje prošli datum, nego sledeći čas i preostalo", () => {
    const p = terminPrikaz(grupa({ uToku: true, sledeciCas: "10.08.2026", preostaloCasova: 13 }));
    expect(p).toEqual({
      uToku: true, labela: "Grupa je u toku - sledeći čas", datum: "10.08.2026",
      napomena: "ostalo 13 od 14 časova",
    });
    expect(p?.datum).not.toBe("05.08.2026");
  });
  it("u toku bez poznatog sledećeg časa: samo konstatacija, bez datuma", () => {
    expect(terminPrikaz(grupa({ uToku: true, sledeciCas: "", preostaloCasova: 0 }))).toEqual({
      uToku: true, labela: "Grupa je u toku", datum: "", napomena: null,
    });
  });
  it("bez datuma početka nema šta da se prikaže", () => {
    expect(terminPrikaz(grupa({ pocetak: "" }))).toBeNull();
  });
});
