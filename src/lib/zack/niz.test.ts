import { describe, it, expect } from "vitest";
import { noviNiz } from "./niz";

describe("noviNiz", () => {
  it("prvi put u životu: niz kreće od 1", () => {
    expect(noviNiz(null, "2026-08-17", 0)).toEqual({ niz: 1, promenjen: true });
  });

  it("igralo je danas: niz ostaje isti i baza se ne dira", () => {
    expect(noviNiz("2026-08-17", "2026-08-17", 4)).toEqual({ niz: 4, promenjen: false });
  });

  it("drugi tačan odgovor istog dana ne diže niz", () => {
    const prvi = noviNiz("2026-08-16", "2026-08-17", 4);
    expect(prvi).toEqual({ niz: 5, promenjen: true });
    // Posle prvog upisa poslednji dan je danas, pa svaki sledeći odgovor miruje.
    expect(noviNiz("2026-08-17", "2026-08-17", prvi.niz)).toEqual({ niz: 5, promenjen: false });
  });

  it("igralo je juče: niz raste za jedan", () => {
    expect(noviNiz("2026-08-16", "2026-08-17", 11)).toEqual({ niz: 12, promenjen: true });
  });

  it("preskočen tačno jedan dan: niz kreće od 1", () => {
    expect(noviNiz("2026-08-15", "2026-08-17", 12)).toEqual({ niz: 1, promenjen: true });
  });

  it("posle dugog odsustva niz kreće od 1, bez ostatka starog", () => {
    expect(noviNiz("2026-05-01", "2026-08-17", 40)).toEqual({ niz: 1, promenjen: true });
  });

  it("prelaz preko kraja meseca broji se kao juče", () => {
    expect(noviNiz("2026-01-31", "2026-02-01", 3)).toEqual({ niz: 4, promenjen: true });
  });

  it("prelaz preko kraja meseca sa preskočenim danom kreće od 1", () => {
    expect(noviNiz("2026-01-30", "2026-02-01", 3)).toEqual({ niz: 1, promenjen: true });
  });

  it("prelaz preko kraja godine broji se kao juče", () => {
    expect(noviNiz("2026-12-31", "2027-01-01", 9)).toEqual({ niz: 10, promenjen: true });
  });

  it("29.02.2028 pa 01.03.2028 je juče pa danas u prestupnoj godini", () => {
    expect(noviNiz("2028-02-29", "2028-03-01", 6)).toEqual({ niz: 7, promenjen: true });
  });

  it("28.02.2028 pa 01.03.2028 je preskočen 29. februar", () => {
    expect(noviNiz("2028-02-28", "2028-03-01", 6)).toEqual({ niz: 1, promenjen: true });
  });

  it("28.02.2027 pa 01.03.2027 je juče pa danas u godini koja nije prestupna", () => {
    expect(noviNiz("2027-02-28", "2027-03-01", 2)).toEqual({ niz: 3, promenjen: true });
  });

  it("datum iz budućnosti ne diže niz, ali ga ni ne obara", () => {
    expect(noviNiz("2026-09-01", "2026-08-17", 12)).toEqual({ niz: 12, promenjen: false });
  });

  it("29.02. u godini koja nije prestupna je neispravan datum, niz kreće od 1", () => {
    expect(noviNiz("2027-02-29", "2027-03-01", 8)).toEqual({ niz: 1, promenjen: true });
  });

  it("neispravan datum se tretira kao da nikad nije igralo", () => {
    expect(noviNiz("juče", "2026-08-17", 8)).toEqual({ niz: 1, promenjen: true });
    expect(noviNiz("", "2026-08-17", 8)).toEqual({ niz: 1, promenjen: true });
    expect(noviNiz("17.08.2026", "2026-08-17", 8)).toEqual({ niz: 1, promenjen: true });
    expect(noviNiz("2026-13-01", "2026-08-17", 8)).toEqual({ niz: 1, promenjen: true });
    expect(noviNiz("2026-08-17T10:00:00Z", "2026-08-17", 8)).toEqual({ niz: 1, promenjen: true });
  });

  it("na smeće nikad ne baca grešku", () => {
    expect(() => noviNiz(null, "ne valja", 3)).not.toThrow();
    expect(noviNiz("2026-08-16", "ne valja", 3)).toEqual({ niz: 1, promenjen: true });
    expect(noviNiz("2026-08-16", "2026-08-17", Number.NaN)).toEqual({ niz: 1, promenjen: true });
  });

  it("niz od 1 posle jučerašnjeg igranja postaje 2, dakle prvi koji se prikazuje", () => {
    expect(noviNiz("2026-08-16", "2026-08-17", 1)).toEqual({ niz: 2, promenjen: true });
  });
});
