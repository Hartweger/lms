import { describe, it, expect } from "vitest";
import { normalizujDe, pripremiReci, izracunajBrisanje, NAJVISE_RECI } from "./lekcija-upis";

// „Mädchen“ sa razdvojenim ä, onako kako ume da stigne iz tabele ili sa Maca.
const MADCHEN_NFD = "Ma\u0308dchen";
const MADCHEN_NFC = "M\u00e4dchen";

const rec = (dodatno: Record<string, unknown> = {}) => ({
  de: "der Hund",
  sr: "pas",
  ...dodatno,
});

function greskaZa(ulaz: unknown): string {
  const ishod = pripremiReci(ulaz);
  if (ishod.ok) throw new Error("očekivana je greška, a priprema je prošla");
  return ishod.greska;
}

function reciZa(ulaz: unknown) {
  const ishod = pripremiReci(ulaz);
  if (!ishod.ok) throw new Error(`očekivan je uspeh, a stiglo: ${ishod.greska}`);
  return ishod.reci;
}

describe("normalizujDe", () => {
  it("prevodi razdvojene znake u spojene (NFD u NFC)", () => {
    expect(normalizujDe(MADCHEN_NFD)).toBe(MADCHEN_NFC);
  });

  it("sažima više razmaka u jedan i skida ivice", () => {
    expect(normalizujDe("  der   Hund  ")).toBe("der Hund");
  });

  it("ne spaja dve stvarno različite reči", () => {
    expect(normalizujDe("der Hund")).not.toBe(normalizujDe("Hund"));
    expect(normalizujDe("Bar")).not.toBe(normalizujDe("Bär"));
  });
});

describe("pripremiReci, provera ulaza", () => {
  it("prazan spisak je greška", () => {
    expect(greskaZa([])).toContain("bar jednu reč");
  });

  it("spisak koji nije niz je greška", () => {
    expect(greskaZa({ de: "Hund" })).toContain("niz");
  });

  it("spisak duži od najvećeg dozvoljenog je greška", () => {
    const preduga = Array.from({ length: NAJVISE_RECI + 1 }, (_, i) =>
      rec({ de: `rec${i}` })
    );
    expect(greskaZa(preduga)).toContain(String(NAJVISE_RECI));
  });

  it("prazan de daje grešku sa tačnim brojem reda", () => {
    expect(greskaZa([rec(), rec({ de: "   " }), rec({ de: "Katze" })])).toBe(
      "Reč broj 2: nedostaje nemačka reč"
    );
  });

  it("prazan sr daje grešku sa tačnim brojem reda", () => {
    expect(greskaZa([rec(), rec({ de: "die Katze" }), rec({ de: "das Haus", sr: "" })])).toBe(
      "Reč broj 3: nedostaje prevod na naš jezik"
    );
  });

  it("rod „Der“ nije dozvoljen i poruka kaže šta jeste", () => {
    const g = greskaZa([rec({ rod: "Der" })]);
    expect(g).toContain("Reč broj 1");
    expect(g).toContain("der, die, das ili nema");
  });

  it("rod „muski“ nije dozvoljen", () => {
    expect(greskaZa([rec({ rod: "muski" })])).toContain("nije dozvoljen");
  });

  it("nedozvoljena vrsta daje grešku koja nabraja dozvoljene", () => {
    const g = greskaZa([rec(), rec({ de: "laufen", vrsta: "verb" })]);
    expect(g).toContain("Reč broj 2");
    expect(g).toContain("imenica, glagol, pridev ili ostalo");
  });

  it("ponovljena nemačka reč kaže i pod kojim brojem je prva", () => {
    const g = greskaZa([rec(), rec({ de: "die Katze" }), rec()]);
    expect(g).toContain("Reč broj 3");
    expect(g).toContain("pod brojem 1");
  });

  it("ponovljena reč se hvata i kad se razlikuje samo po normalizaciji", () => {
    const g = greskaZa([rec({ de: MADCHEN_NFD }), rec({ de: `  ${MADCHEN_NFC} ` })]);
    expect(g).toContain("Reč broj 2");
    expect(g).toContain("pod brojem 1");
  });

  it("izuzetak „da“ je greška, ne tihi true", () => {
    expect(greskaZa([rec({ izuzetak: "da" })])).toContain("izuzetak");
  });

  it("izuzetak „false“ je greška, ne tihi true", () => {
    expect(greskaZa([rec({ izuzetak: "false" })])).toContain("izuzetak");
  });

  it("izuzetak 0 je greška, ne tihi false", () => {
    expect(greskaZa([rec({ izuzetak: 0 })])).toContain("izuzetak");
  });

  it("množina koja nije tekst ni prazno je greška", () => {
    expect(greskaZa([rec({ mnozina: 5 })])).toContain("množina");
  });

  it("red koji nije objekat je greška sa brojem reda", () => {
    expect(greskaZa([rec(), "der Hund"])).toContain("Reč broj 2");
  });
});

describe("pripremiReci, ono što prolazi", () => {
  it("redni brojevi idu 1, 2, 3 redom", () => {
    const reci = reciZa([rec(), rec({ de: "die Katze" }), rec({ de: "das Haus" })]);
    expect(reci.map((r) => r.redni_broj)).toEqual([1, 2, 3]);
  });

  it("de se upisuje normalizovano", () => {
    const reci = reciZa([rec({ de: `  das ${MADCHEN_NFD}  ` })]);
    expect(reci[0].de).toBe(`das ${MADCHEN_NFC}`);
  });

  it("kad rod i vrsta nisu poslati, uzimaju se podrazumevani", () => {
    const reci = reciZa([rec()]);
    expect(reci[0].rod).toBe("nema");
    expect(reci[0].vrsta).toBe("ostalo");
    expect(reci[0].mnozina).toBeNull();
    expect(reci[0].izuzetak).toBe(false);
  });

  it("null za rod, vrstu, množinu i izuzetak prolazi kao neposlato", () => {
    const reci = reciZa([rec({ rod: null, vrsta: null, mnozina: null, izuzetak: null })]);
    expect(reci[0].rod).toBe("nema");
    expect(reci[0].vrsta).toBe("ostalo");
  });

  it("prazna množina postaje null", () => {
    expect(reciZa([rec({ mnozina: "  " })])[0].mnozina).toBeNull();
  });

  it("crtica i kosa crta iz tabele postaju null, jer znače da množine nema", () => {
    for (const oznaka of ["-", " - ", "/", "–", "—"]) {
      expect(reciZa([rec({ mnozina: oznaka })])[0].mnozina).toBeNull();
    }
  });

  it("popunjena reč se prenosi cela", () => {
    const reci = reciZa([
      rec({ rod: "der", vrsta: "imenica", mnozina: "die Hunde", izuzetak: true }),
    ]);
    expect(reci[0]).toEqual({
      redni_broj: 1,
      de: "der Hund",
      sr: "pas",
      rod: "der",
      mnozina: "die Hunde",
      vrsta: "imenica",
      izuzetak: true,
    });
  });

  it("spisak tačno na granici prolazi", () => {
    const tacno = Array.from({ length: NAJVISE_RECI }, (_, i) => rec({ de: `rec${i}` }));
    expect(reciZa(tacno)).toHaveLength(NAJVISE_RECI);
  });
});

describe("izracunajBrisanje", () => {
  const postojece = [
    { id: "a", de: "der Hund" },
    { id: "b", de: "die Katze" },
    { id: "c", de: "das Haus" },
  ];

  it("vraća prazno kad je sve ostalo u spisku", () => {
    expect(izracunajBrisanje(postojece, ["der Hund", "die Katze", "das Haus"])).toEqual([]);
  });

  it("vraća samo id izbačene reči, ne i ostalih", () => {
    expect(izracunajBrisanje(postojece, ["der Hund", "das Haus"])).toEqual(["b"]);
  });

  it("poredi po normalizovanom obliku, pa razlika u zapisu ne briše reč", () => {
    const sa = [{ id: "m", de: MADCHEN_NFD }];
    expect(izracunajBrisanje(sa, [`  ${MADCHEN_NFC}  `])).toEqual([]);
  });

  it("normalizuje i postojeću stranu, ne samo novu", () => {
    const sa = [{ id: "m", de: "der  Hund" }];
    expect(izracunajBrisanje(sa, ["der Hund"])).toEqual([]);
  });

  it("kad je spisak potpuno drugačiji, briše se sve postojeće", () => {
    expect(izracunajBrisanje(postojece, ["die Schule"])).toEqual(["a", "b", "c"]);
  });

  it("prazan spisak postojećih daje prazno", () => {
    expect(izracunajBrisanje([], ["der Hund"])).toEqual([]);
  });
});
