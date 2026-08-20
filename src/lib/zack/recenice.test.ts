import { describe, it, expect } from "vitest";
import type { StaraRec } from "./ponavljanje";
import type { Rec } from "./rec";
import {
  rastaviRecenicu,
  prikazPlocica,
  podobnaZaSlagalicu,
  promesajPlocice,
  proveriSlaganje,
  napraviPitanjaRecenica,
  recenicnaPitanja,
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

  it("imenica upisana sa članom zadržava veliko slovo na goloj pločici", () => {
    // Stariji udžbenici („maximal-*") imenicu čuvaju kao „die Mutter", a
    // pločica nosi samo „Mutter". Bez skidanja člana bi ovde pisalo „mutter".
    const saClanom = [rec({ de: "die Mutter", vrsta: "imenica" })];
    expect(prikazPlocica(["Mutter", "kocht", "gern"], saClanom)[0]).toBe("Mutter");
  });

  it("goli zapis imenice i dalje radi", () => {
    const bezClana = [rec({ de: "Mutter", vrsta: "imenica" })];
    expect(prikazPlocica(["Mutter", "kocht", "gern"], bezClana)[0]).toBe("Mutter");
  });

  it("reč koja nije imenica ide malim slovom i kad je u spisku sa članom", () => {
    // „Die" je ovde član iz zapisa, ne dokaz da je prva reč imenica.
    const spisak = [rec({ de: "die Mutter", vrsta: "imenica" })];
    expect(prikazPlocica(["Kocht", "die", "Mutter"], spisak)[0]).toBe("kocht");
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

describe("promesajPlocice", () => {
  // rng koji uvek vrati skoro jedinicu daje u Fisher-Yatesu j === i, dakle
  // NEIZMEŠAN niz. Baš tu zamena mora da uskoči, inače rečenica stigne već
  // složena i ne pita ništa.
  const bezMesanja = () => 0.999999;

  it("neizmešan niz ipak ne stiže složen", () => {
    const plocice = ["ich", "komme", "aus", "Serbien"];
    const izmesano = promesajPlocice(plocice, bezMesanja);
    expect(proveriSlaganje(izmesano, plocice)).toBe(false);
    expect([...izmesano].sort()).toEqual([...plocice].sort());
  });

  it("pločica koja se od prve razlikuje SAMO po velikom slovu ne služi za zamenu", () => {
    // „sie" i „Sie" su za proveru ista pločica, pa zamena sa njom ostavlja
    // rečenicu i dalje složenom.
    const plocice = ["sie", "Sie", "grüßt"];
    const izmesano = promesajPlocice(plocice, bezMesanja);
    expect(proveriSlaganje(izmesano, plocice)).toBe(false);
  });

  it("spisak od jedne pločice se vraća kakav jeste", () => {
    expect(promesajPlocice(["hallo"], bezMesanja)).toEqual(["hallo"]);
  });
});

describe("podobnaZaSlagalicu", () => {
  it("dve pločice su premalo", () => {
    expect(podobnaZaSlagalicu(recenica({ de: "Ich komme." }))).toBe(false);
  });

  it("tri pločice su taman", () => {
    expect(podobnaZaSlagalicu(recenica({ de: "Ich komme heute." }))).toBe(true);
  });

  it("šest pločica je još uvek u granici", () => {
    expect(podobnaZaSlagalicu(recenica({ de: "Ich komme heute aus der Schule." }))).toBe(true);
  });

  it("sedam pločica je previše za ekran", () => {
    expect(podobnaZaSlagalicu(recenica({ de: "Ich komme heute aus der großen Schule." }))).toBe(
      false
    );
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

  it("zapeta uz izvađenu reč ostaje na svom mestu", () => {
    const p = napraviPitanjaRecenica(
      [recenica({ de: "Komm, bitte her!", praznina: "Komm", distraktori: ["Kommt", "Kommen"] })],
      "dopuna",
      1,
      rngNiz([0.4, 0.8]),
      []
    );
    expect(p).toHaveLength(1);
    if (p[0].igra !== "dopuna") throw new Error("očekivana dopuna");
    expect(p[0].saPrazninom).toBe(`${PRAZNINA_PRIKAZ}, bitte her!`);
  });
});

describe("napraviPitanjaRecenica - koliko", () => {
  // Bez ove granice bi `slice(0, -1)` vratio skoro sve umesto ničega, pa bi
  // partija od nula pitanja detetu ispala puna.
  it("nula i manje ne daju nijedno pitanje", () => {
    const spisak = [recenica({ id: "s1" }), recenica({ id: "s2" }), recenica({ id: "s3" })];
    expect(napraviPitanjaRecenica(spisak, "dopuna", 0, rngNiz([0.5]), [])).toEqual([]);
    expect(napraviPitanjaRecenica(spisak, "dopuna", -1, rngNiz([0.5]), [])).toEqual([]);
  });
});

describe("recenicnaPitanja", () => {
  const lekcijske = (koliko: number): Recenica[] =>
    Array.from({ length: koliko }, (_, i) =>
      recenica({ id: `s${i}`, de: `Ich komme aus Serbien${i}.` })
    );

  it("bez starih reči vraća samo lekcijske rečenice", () => {
    const p = recenicnaPitanja([recenica({})], [], [], "dopuna", 8, rngNiz([0.5]), []);
    expect(p).toHaveLength(1);
    expect(p.every((x) => x.igra === "dopuna" && x.recenicaId === "s1")).toBe(true);
  });

  it("stara rečenica ulazi kad je njena glavna reč izabrana", () => {
    const stara: StaraRec = { rec: rec({ id: "r9" }), izbledela: true, gresaka: 2 };
    const staraRecenica = recenica({
      id: "s9",
      rec_id: "r9",
      de: "Wo wohnst du?",
      praznina: "wohnst",
    });
    const p = recenicnaPitanja(
      lekcijske(8),
      [staraRecenica],
      [stara],
      "dopuna",
      8,
      rngNiz([0.1, 0.9, 0.4, 0.6]),
      []
    );
    expect(p.some((x) => x.igra === "dopuna" && x.recenicaId === "s9")).toBe(true);
    // Stara pitanja ULAZE u dogovoreni broj, ne preko njega.
    expect(p).toHaveLength(8);
  });

  it("stara reč bez svoje rečenice ne oduzima mesto lekciji", () => {
    const stara: StaraRec = { rec: rec({ id: "r9" }), izbledela: true, gresaka: 2 };
    const p = recenicnaPitanja(lekcijske(8), [], [stara], "dopuna", 8, rngNiz([0.3, 0.7]), []);
    expect(p).toHaveLength(8);
  });

  it("stara reč sa podobnom rečenicom pretekne onu bez nje", () => {
    // Kvota je tačno jedna stara (floor(4 * 0.25)). `r8` ima više grešaka, pa
    // po rangiranju ide prva - ali nema nijednu rečenicu, pa bi njen izbor
    // pojeo celu kvotu i od ponavljanja kroz rečenice ne bi ostalo ništa.
    const bezRecenice: StaraRec = { rec: rec({ id: "r8" }), izbledela: true, gresaka: 9 };
    const saRecenicom: StaraRec = { rec: rec({ id: "r9" }), izbledela: false, gresaka: 1 };
    const staraRecenica = recenica({
      id: "s9",
      rec_id: "r9",
      de: "Wo wohnst du?",
      praznina: "wohnst",
    });
    const p = recenicnaPitanja(
      lekcijske(4),
      [staraRecenica],
      [bezRecenice, saRecenicom],
      "dopuna",
      4,
      rngNiz([0.1, 0.9, 0.4, 0.6]),
      []
    );
    expect(p.some((x) => x.igra === "dopuna" && x.recenicaId === "s9")).toBe(true);
    expect(p).toHaveLength(4);
  });

  it("podobnost se gleda po IGRI: rečenica samo za dopunu ne kvalifikuje za slagalicu", () => {
    const stara: StaraRec = { rec: rec({ id: "r9" }), izbledela: true, gresaka: 9 };
    const samoDopuna = recenica({
      id: "s9",
      rec_id: "r9",
      de: "Wo wohnst du?",
      praznina: "wohnst",
      samo_dopuna: true,
    });
    const p = recenicnaPitanja(
      lekcijske(4),
      [samoDopuna],
      [stara],
      "slagalica",
      4,
      rngNiz([0.3, 0.7]),
      []
    );
    expect(p.some((x) => x.igra === "slagalica" && x.recenicaId === "s9")).toBe(false);
    expect(p).toHaveLength(4);
  });

  it("rečenica stare reči koja nije izabrana ne ulazi", () => {
    const staraRecenica = recenica({ id: "s9", rec_id: "r9", de: "Wo wohnst du?", praznina: "wohnst" });
    const p = recenicnaPitanja(lekcijske(4), [staraRecenica], [], "dopuna", 8, rngNiz([0.5]), []);
    expect(p.some((x) => x.igra === "dopuna" && x.recenicaId === "s9")).toBe(false);
  });
});
