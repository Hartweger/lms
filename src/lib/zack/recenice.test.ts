import { describe, it, expect } from "vitest";
import type { Rec } from "./rec";
import {
  rastaviRecenicu,
  prikazPlocica,
  proveriSlaganje,
  napraviPitanjaRecenica,
  PRAZNINA_PRIKAZ,
  type Recenica,
} from "./recenice";

/** Deterministički rng za testove, isti obrazac kao u pitanja.test.ts. */
function rngNiz(vrednosti: number[]): () => number {
  let i = 0;
  return () => vrednosti[i++ % vrednosti.length];
}

const rec = (delovi: Partial<Rec>): Rec => ({
  id: "r1",
  redni_broj: 1,
  de: "Hund",
  sr: "pas",
  rod: "der",
  mnozina: "die Hunde",
  vrsta: "imenica",
  izuzetak: false,
  ...delovi,
});

const recenica = (delovi: Partial<Recenica>): Recenica => ({
  id: "s1",
  redni_broj: 1,
  de: "Ich komme aus Serbien.",
  sr: "Dolazim iz Srbije.",
  praznina: "komme",
  distraktori: ["kommst", "kommt", "kommen"],
  rec_id: "r1",
  samo_dopuna: false,
  ...delovi,
});

describe("rastaviRecenicu", () => {
  it("odvaja završni znak od pločica", () => {
    expect(rastaviRecenicu("Mach das Buch auf!")).toEqual({
      reci: ["Mach", "das", "Buch", "auf"],
      znak: "!",
    });
  });

  it("rečenica bez znaka dobija tačku", () => {
    expect(rastaviRecenicu("Ich komme aus Serbien")).toEqual({
      reci: ["Ich", "komme", "aus", "Serbien"],
      znak: ".",
    });
  });

  it("višak razmaka ne pravi prazne pločice", () => {
    expect(rastaviRecenicu("  Wie  geht's?  ").reci).toEqual(["Wie", "geht's"]);
  });
});

describe("prikazPlocica", () => {
  const pool = [rec({ de: "Buch", vrsta: "imenica" }), rec({ id: "r2", de: "machen", vrsta: "glagol" })];

  it("prva reč ide malim slovom da ne oda rešenje", () => {
    expect(prikazPlocica(["Mach", "das", "Buch"], pool)).toEqual(["mach", "das", "Buch"]);
  });

  it("imenica na prvom mestu zadržava veliko slovo", () => {
    expect(prikazPlocica(["Buch", "und", "Heft"], pool)[0]).toBe("Buch");
  });

  it("ime iz ugrađenog spiska zadržava veliko slovo", () => {
    expect(prikazPlocica(["Anna", "ist", "nett"], pool)[0]).toBe("Anna");
  });

  it("reči posle prve se ne diraju", () => {
    expect(prikazPlocica(["Wo", "wohnst", "du"], pool)).toEqual(["wo", "wohnst", "du"]);
  });
});

describe("proveriSlaganje", () => {
  const tacan = ["Mach", "das", "Buch", "auf"];

  it("prihvata tačan redosled bez obzira na malo slovo prve pločice", () => {
    expect(proveriSlaganje(["mach", "das", "Buch", "auf"], tacan)).toBe(true);
  });

  it("odbija pogrešan redosled", () => {
    expect(proveriSlaganje(["das", "mach", "Buch", "auf"], tacan)).toBe(false);
  });

  it("dve iste pločice su ravnopravne (poredi se tekst, ne identitet)", () => {
    expect(proveriSlaganje(["die", "Frau", "und", "die", "Katze"], ["die", "Frau", "und", "die", "Katze"])).toBe(true);
  });

  it("nepotpun niz nije tačan", () => {
    expect(proveriSlaganje(["mach", "das"], tacan)).toBe(false);
  });
});

describe("napraviPitanjaRecenica - slagalica", () => {
  it("preskače rečenice označene samo_dopuna", () => {
    const p = napraviPitanjaRecenica(
      [recenica({ samo_dopuna: true })],
      "slagalica",
      5,
      rngNiz([0.1, 0.5, 0.9]),
      []
    );
    expect(p).toEqual([]);
  });

  it("pločice su permutacija reči i nikad tačan redosled iz prve", () => {
    const p = napraviPitanjaRecenica([recenica({})], "slagalica", 1, rngNiz([0, 0, 0, 0]), []);
    expect(p).toHaveLength(1);
    if (p[0].igra !== "slagalica") throw new Error("očekivana slagalica");
    expect([...p[0].plocice].sort()).toEqual(["aus", "ich", "komme", "Serbien"].sort());
    expect(p[0].plocice.map((x) => x.toLowerCase())).not.toEqual(
      p[0].tacan.map((x) => x.toLowerCase())
    );
    expect(p[0].znak).toBe(".");
    expect(p[0].recId).toBe("r1");
  });
});

describe("napraviPitanjaRecenica - dopuna", () => {
  it("pravi prazninu od tačno 6 crta i nudi 4 opcije", () => {
    const p = napraviPitanjaRecenica([recenica({})], "dopuna", 1, rngNiz([0.3, 0.7, 0.2]), []);
    expect(p).toHaveLength(1);
    if (p[0].igra !== "dopuna") throw new Error("očekivana dopuna");
    expect(p[0].saPrazninom).toBe(`Ich ${PRAZNINA_PRIKAZ} aus Serbien.`);
    expect(p[0].opcije).toHaveLength(4);
    expect(p[0].opcije).toContain("komme");
    expect(p[0].tacan).toBe("komme");
    expect(p[0].prevod).toBe("Dolazim iz Srbije.");
  });

  it("rečenicu čija se praznina ne javlja tačno jednom preskače (pada u korist deteta)", () => {
    const p = napraviPitanjaRecenica(
      [recenica({ de: "Komm, komm her!", praznina: "komm" })],
      "dopuna",
      5,
      rngNiz([0.5]),
      []
    );
    expect(p).toEqual([]);
  });

  it("samo_dopuna rečenice ulaze u dopunu", () => {
    const p = napraviPitanjaRecenica([recenica({ samo_dopuna: true })], "dopuna", 5, rngNiz([0.5]), []);
    expect(p).toHaveLength(1);
  });
});
