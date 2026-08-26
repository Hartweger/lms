import { describe, it, expect } from "vitest";
import { sastaviDokument } from "./dokument-podaci";

const kupac = {
  naziv: "Test DOO",
  adresa: "Neka ulica 1, Beograd",
  pib: "123456789",
  maticniBroj: "87654321",
  email: "racunovodstvo@test.rs",
};

const osnova = { tip: "faktura" as const, broj: "2026-408", datum: "26.08.2026.", kupac };

describe("sastaviDokument", () => {
  it("jedna stavka: bez PDV je cena/1.2, PDV je razlika", () => {
    const d = sastaviDokument({
      ...osnova,
      narudzbine: [{ opis: "Grupni kurs A2.1", total: 19600 }],
    });
    expect(d.stavke).toEqual([
      { opis: "Grupni kurs A2.1", kolicina: 1, cenaBezPdv: 16333, iznosBezPdv: 16333 },
    ]);
    expect(d.ukupnoBezPdv).toBe(16333);
    expect(d.pdv).toBe(3267);
    expect(d.ukupnoSaPdv).toBe(19600);
  });

  it("iste stavke se spajaju u jednu sa količinom", () => {
    const d = sastaviDokument({
      ...osnova,
      narudzbine: [
        { opis: "Grupni kurs A2.1", total: 19600 },
        { opis: "Grupni kurs A2.1", total: 19600 },
      ],
    });
    // Kao u Natašinoj tabeli: 16.333 x 2 se prikazuje kao 32.667, ne 32.666.
    // Jedinična cena i iznos se zaokružuju odvojeno, jedno se ne izvodi iz drugog.
    expect(d.stavke).toEqual([
      { opis: "Grupni kurs A2.1", kolicina: 2, cenaBezPdv: 16333, iznosBezPdv: 32667 },
    ]);
    expect(d.ukupnoBezPdv).toBe(32667);
    expect(d.ukupnoSaPdv).toBe(39200);
  });

  it("isti kurs po različitoj ceni ostaje zasebna stavka", () => {
    const d = sastaviDokument({
      ...osnova,
      narudzbine: [
        { opis: "Individualni kurs A2.1", total: 33000 },
        { opis: "Individualni kurs A2.1", total: 30000 },
      ],
    });
    expect(d.stavke).toHaveLength(2);
    expect(d.stavke.map((s) => s.cenaBezPdv)).toEqual([27500, 25000]);
  });

  it("ostatak od zaokruživanja ide na poslednju stavku, zbir se poklapa", () => {
    // 2 x 38.500 sa PDV = 77.000. Bez PDV po stavci je 32.083,33 -> naivno
    // zaokruživanje daje 64.166, a treba 64.167. Razlika ide na poslednju stavku.
    // Isti postupak koji je Natašina tabela radila ručno (32.083 + 32.084).
    const d = sastaviDokument({
      ...osnova,
      narudzbine: [
        { opis: "Individualni kurs A2.1 Nataša", total: 38500 },
        { opis: "Individualni kurs A2.2 Nataša", total: 38500 },
      ],
    });
    expect(d.stavke.map((s) => s.iznosBezPdv)).toEqual([32083, 32084]);
    expect(d.ukupnoBezPdv).toBe(64167);
    expect(d.pdv).toBe(12833);
    expect(d.ukupnoSaPdv).toBe(77000);
    expect(d.stavke.reduce((a, s) => a + s.iznosBezPdv, 0)).toBe(d.ukupnoBezPdv);
  });

  it("zbir stavki uvek daje ukupno bez PDV, ma koliko cena bilo", () => {
    const cene = [19600, 23000, 33000, 38500, 4680, 2880, 21200, 14000];
    for (let n = 1; n <= cene.length; n++) {
      const d = sastaviDokument({
        ...osnova,
        narudzbine: cene.slice(0, n).map((total, i) => ({ opis: `Kurs ${i}`, total })),
      });
      expect(d.stavke.reduce((a, s) => a + s.iznosBezPdv, 0)).toBe(d.ukupnoBezPdv);
      expect(d.ukupnoBezPdv + d.pdv).toBe(d.ukupnoSaPdv);
    }
  });

  it("redosled stavki prati prvo pojavljivanje, ne abecedu", () => {
    const d = sastaviDokument({
      ...osnova,
      narudzbine: [
        { opis: "Video kurs B1", total: 11600 },
        { opis: "Grupni kurs A1.1", total: 19600 },
        { opis: "Video kurs B1", total: 11600 },
      ],
    });
    expect(d.stavke.map((s) => s.opis)).toEqual(["Video kurs B1", "Grupni kurs A1.1"]);
    expect(d.stavke[0].kolicina).toBe(2);
  });

  it("bez narudžbina baca grešku umesto praznog dokumenta", () => {
    expect(() => sastaviDokument({ ...osnova, narudzbine: [] })).toThrow("Dokument bez stavki");
  });
});
