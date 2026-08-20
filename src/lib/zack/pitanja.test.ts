import { describe, it, expect } from "vitest";
import type { Rec } from "./rec";
import {
  igreSaDovoljnoReci,
  jeIgra,
  type IgraReci,
  NAJMANJE_ZA_IGRU,
  napraviPitanja,
  podobnaZaIgru,
  ponudjeni,
  SVE_IGRE,
  uKrugovima,
} from "./pitanja";

/** Oznake kojima Nataša u tabeli piše „ova reč nema množinu". */
const OZNAKE_BEZ_MNOZINE = ["-", "–", "—", "/"];

const R = (i: number, over: Partial<Rec> = {}): Rec => ({
  id: `r${i}`,
  redni_broj: i,
  de: `de${i}`,
  sr: `sr${i}`,
  rod: "der",
  mnozina: `mn${i}`,
  vrsta: "imenica",
  izuzetak: false,
  ...over,
});

const RECI = [R(1), R(2), R(3), R(4), R(5), R(6)];
const nula = () => 0;

describe("ponudjeni", () => {
  it("stavlja tačan odgovor i tri pogrešna", () => {
    const opcije = ponudjeni("sr1", ["sr2", "sr3", "sr4", "sr5"], 4, nula);
    expect(opcije).toHaveLength(4);
    expect(opcije).toContain("sr1");
  });

  it("nikad ne ponavlja tačan odgovor među pogrešnima", () => {
    const opcije = ponudjeni("sr1", ["sr1", "sr2", "sr3"], 4, nula);
    expect(opcije.filter((o) => o === "sr1")).toHaveLength(1);
  });

  it("kad nema dovoljno pogrešnih, vraća koliko ih ima", () => {
    const opcije = ponudjeni("sr1", ["sr2"], 4, nula);
    expect(opcije).toHaveLength(2);
  });

  it("izbacuje duplikate među pogrešnima", () => {
    const opcije = ponudjeni("sr1", ["sr2", "sr2", "sr3"], 4, nula);
    expect(opcije).toHaveLength(3);
  });
});

describe("napraviPitanja, brzo-biranje", () => {
  it("pravi traženi broj pitanja sa četiri ponuđena odgovora", () => {
    const p = napraviPitanja(RECI, "brzo-biranje", 3, nula);
    expect(p).toHaveLength(3);
    expect(p[0]).toMatchObject({ igra: "brzo-biranje" });
    if (p[0].igra !== "brzo-biranje") throw new Error("pogrešna igra");
    expect(p[0].opcije).toHaveLength(4);
    expect(p[0].opcije).toContain(p[0].tacan);
  });
});

describe("napraviPitanja, ucenje-reci", () => {
  // Učenje reči je isto pitanje kao brzo biranje, samo u blažoj ljusci. Ako
  // propadne kroz grananje do diktata, dete u fazi učenja umesto da dodirne
  // prevod dobije da kuca nemačku reč koju prvi put vidi.
  it("daje pitanja brzog biranja, ne diktat", () => {
    const p = napraviPitanja(RECI, "ucenje-reci", 2, nula);
    expect(p).toHaveLength(2);
    expect(p.every((x) => x.igra === "brzo-biranje")).toBe(true);
  });

  it("daje ista pitanja kao brzo biranje, red po red", () => {
    expect(napraviPitanja(RECI, "ucenje-reci", 3, nula)).toEqual(
      napraviPitanja(RECI, "brzo-biranje", 3, nula)
    );
  });
});

describe("napraviPitanja, rod", () => {
  it("uzima samo imenice koje imaju rod", () => {
    const reci = [R(1, { rod: "der" }), R(2, { rod: "nema", vrsta: "glagol" }), R(3, { rod: "das" })];
    const p = napraviPitanja(reci, "rod", 10, nula);
    expect(p).toHaveLength(2);
    if (p[0].igra !== "rod") throw new Error("pogrešna igra");
    expect(["der", "die", "das"]).toContain(p[0].tacan);
  });
});

describe("napraviPitanja, skakac", () => {
  // Skakač je drugo telo za isto pitanje, pa mora da izađe pitanje `igra: "rod"`.
  // Da dobije svoj tip pitanja, sesija i spisak tačnih bi morali da nauče još
  // jedan slučaj bez ijednog razloga.
  it("daje ista pitanja kao rod, red po red", () => {
    const reci = [R(1, { rod: "der" }), R(2, { rod: "die" }), R(3, { rod: "das" })];
    expect(napraviPitanja(reci, "skakac", 3, nula)).toEqual(napraviPitanja(reci, "rod", 3, nula));
  });

  it("uzima samo imenice koje imaju rod, isto kao rod", () => {
    const reci = [R(1, { rod: "der" }), R(2, { rod: "nema", vrsta: "glagol" }), R(3, { rod: "das" })];
    const p = napraviPitanja(reci, "skakac", 10, nula);
    // Reč bez roda ne ulazi ni u jedan krug.
    expect(p.every((x) => x.igra === "rod")).toBe(true);
    expect(p.map((x) => (x.igra === "rod" ? x.recId : ""))).not.toContain("r2");
  });

  // Ovo je razlog zbog kog rekord uopšte ima smisla: partija koja staje na broju
  // imenica u lekciji uvek ima isti vrhunac i nema šta da se obori.
  it("ne staje na broju reči, nego daje koliko je traženo", () => {
    const reci = [R(1, { rod: "der" }), R(2, { rod: "die" }), R(3, { rod: "das" })];
    expect(napraviPitanja(reci, "skakac", 20, nula)).toHaveLength(20);
  });

  it("ostale igre i dalje staju na broju reči", () => {
    const reci = [R(1, { rod: "der" }), R(2, { rod: "die" }), R(3, { rod: "das" })];
    expect(napraviPitanja(reci, "rod", 20, nula)).toHaveLength(3);
  });
});

describe("jeIgra", () => {
  // Rute primaju ime igre iz tela zahteva, pa se ono mora proveriti vrednošću.
  it("prihvata svaku postojeću igru", () => {
    expect(SVE_IGRE.every(jeIgra)).toBe(true);
  });

  it("odbija izmišljene igre i sve što nije tekst", () => {
    expect(jeIgra("skakač")).toBe(false);
    expect(jeIgra("")).toBe(false);
    expect(jeIgra(7)).toBe(false);
    expect(jeIgra(null)).toBe(false);
  });
});

describe("uKrugovima", () => {
  /** Prost izvor slučajnosti sa istim redosledom pri svakom pokretanju testa. */
  const seme = (pocetak: number) => {
    let s = pocetak;
    return () => {
      s = (s * 1103515245 + 12345) % 2147483648;
      return s / 2147483648;
    };
  };

  it("daje tačno traženi broj stavki i kad ih u spisku ima manje", () => {
    expect(uKrugovima(["a", "b", "c"], 20, nula)).toHaveLength(20);
  });

  it("u svakom krugu prođe ceo spisak, pa se nijedna reč ne preskače", () => {
    const tok = uKrugovima(["a", "b", "c", "d"], 12, seme(7));
    expect(new Set(tok.slice(0, 4)).size).toBe(4);
    expect(new Set(tok.slice(4, 8)).size).toBe(4);
    expect(new Set(tok.slice(8, 12)).size).toBe(4);
  });

  it("meša svaki krug iznova, pa drugi prolaz nije isti redosled", () => {
    // Sa spiskom od šest stavki bi poklapanje slučajno bilo jedno u 720.
    const tok = uKrugovima(["a", "b", "c", "d", "e", "f"], 12, seme(3));
    expect(tok.slice(0, 6)).not.toEqual(tok.slice(6, 12));
  });

  it("nikad ne pušta dve iste stavke jednu za drugom", () => {
    for (let broj = 2; broj <= 6; broj++) {
      const stavke = Array.from({ length: broj }, (_, i) => `s${i}`);
      for (let s = 1; s <= 40; s++) {
        const tok = uKrugovima(stavke, 60, seme(s));
        for (let i = 1; i < tok.length; i++) {
          expect(tok[i]).not.toBe(tok[i - 1]);
        }
      }
    }
  });

  it("spisak od jedne stavke ne vrti se u prazno, samo se ponavlja", () => {
    expect(uKrugovima(["a"], 3, nula)).toEqual(["a", "a", "a"]);
  });

  it("na prazan spisak i na nulu vraća prazno", () => {
    expect(uKrugovima([], 10, nula)).toEqual([]);
    expect(uKrugovima(["a"], 0, nula)).toEqual([]);
  });
});

describe("podobnaZaIgru, mnozina", () => {
  it("reč sa pravom množinom ulazi u igru", () => {
    expect(podobnaZaIgru(R(1, { mnozina: "die Hunde" }), "mnozina")).toBe(true);
  });

  it("reč kojoj u koloni množine stoji crtica ne ulazi u igru", () => {
    for (const oznaka of OZNAKE_BEZ_MNOZINE) {
      expect(podobnaZaIgru(R(1, { de: "der Hunger", mnozina: oznaka }), "mnozina")).toBe(false);
    }
  });
});

describe("igreSaDovoljnoReci", () => {
  const SVE: IgraReci[] = ["parovi", "brzo-biranje", "skakac", "rod", "mnozina", "diktat"];
  /** Reči od kojih se prave lekcije u ovim proverama, sve podobne za sve igre. */
  const punih = (koliko: number, over: Partial<Rec> = {}) =>
    Array.from({ length: koliko }, (_, i) => R(i + 1, over));

  it("propušta igru koja u lekciji ima tačno NAJMANJE_ZA_IGRU reči", () => {
    expect(igreSaDovoljnoReci(punih(NAJMANJE_ZA_IGRU), ["mnozina"])).toEqual(["mnozina"]);
  });

  it("izbacuje igru kojoj fali jedna reč do granice", () => {
    expect(igreSaDovoljnoReci(punih(NAJMANJE_ZA_IGRU - 1), ["mnozina"])).toEqual([]);
  });

  it("broji SAMO reči podobne za tu igru, ne sve reči lekcije", () => {
    // Lekcija puna reči, ali samo tri imaju množinu: množina ispada, ostale
    // igre ostaju. Baš zbog ovoga se granica i uvodi.
    const reci = [
      ...punih(3, { mnozina: "mn" }),
      ...Array.from({ length: 9 }, (_, i) => R(i + 10, { de: "der Hunger", mnozina: "-" })),
    ];
    const igre = igreSaDovoljnoReci(reci, SVE);
    expect(igre).not.toContain("mnozina");
    expect(igre).toEqual(["parovi", "brzo-biranje", "skakac", "rod", "diktat"]);
  });

  it("lekcija bez ijednog roda ostaje bez roda i skakača", () => {
    const igre = igreSaDovoljnoReci(punih(10, { rod: "nema", vrsta: "glagol" }), SVE);
    expect(igre).not.toContain("rod");
    expect(igre).not.toContain("skakac");
    expect(igre).toContain("diktat");
  });

  it("igre koje primaju svaku reč prolaze čim lekcija ima dovoljno reči", () => {
    expect(igreSaDovoljnoReci(punih(NAJMANJE_ZA_IGRU), ["parovi", "brzo-biranje", "diktat"])).toEqual([
      "parovi",
      "brzo-biranje",
      "diktat",
    ]);
  });

  it("prazna lekcija ne nudi nijednu igru", () => {
    expect(igreSaDovoljnoReci([], SVE)).toEqual([]);
  });

  it("čuva zadati redosled igara", () => {
    expect(igreSaDovoljnoReci(punih(10), SVE)).toEqual(SVE);
  });
});

describe("napraviPitanja, mnozina", () => {
  it("preskače reči bez upisane množine", () => {
    const reci = [R(1, { mnozina: "Häuser" }), R(2, { mnozina: null }), R(3, { mnozina: "Bäume" })];
    const p = napraviPitanja(reci, "mnozina", 10, nula);
    expect(p).toHaveLength(2);
  });

  it("preskače reči kojima množina stoji kao crtica ili kosa crta", () => {
    const reci = [
      R(1, { mnozina: "Häuser" }),
      R(2, { de: "der Hunger", mnozina: "-" }),
      R(3, { de: "der Durst", mnozina: "/" }),
      R(4, { de: "das Wasser", mnozina: "–" }),
    ];
    const p = napraviPitanja(reci, "mnozina", 10, nula);
    expect(p).toHaveLength(1);
  });

  it("crtica se ne nudi ni kao pogrešan odgovor", () => {
    const reci = [
      R(1, { mnozina: "Häuser" }),
      R(2, { mnozina: "-" }),
      R(3, { mnozina: "—" }),
      R(4, { mnozina: "Bäume" }),
    ];
    for (const p of napraviPitanja(reci, "mnozina", 10, nula)) {
      if (p.igra !== "mnozina") throw new Error("pogrešna igra");
      expect(OZNAKE_BEZ_MNOZINE).not.toContain(p.tacan);
      for (const opcija of p.opcije) {
        expect(OZNAKE_BEZ_MNOZINE).not.toContain(opcija);
      }
    }
  });
});

describe("napraviPitanja, diktat", () => {
  it("pita prevod i očekuje nemačku reč", () => {
    const p = napraviPitanja([R(1)], "diktat", 1, nula);
    expect(p[0]).toEqual({ igra: "diktat", recId: "r1", prevod: "sr1", tacan: "de1" });
  });
});

describe("napraviPitanja, parovi", () => {
  it("vraća jedno pitanje sa najviše šest parova", () => {
    const p = napraviPitanja(RECI, "parovi", 6, nula);
    expect(p).toHaveLength(1);
    if (p[0].igra !== "parovi") throw new Error("pogrešna igra");
    expect(p[0].parovi).toHaveLength(6);
  });
});

describe("napraviPitanja, granice", () => {
  it("na prazan spisak reči vraća prazno", () => {
    expect(napraviPitanja([], "brzo-biranje", 5, nula)).toEqual([]);
  });

  it("ne pravi više pitanja nego što ima reči", () => {
    expect(napraviPitanja([R(1), R(2)], "brzo-biranje", 10, nula)).toHaveLength(2);
  });
});
