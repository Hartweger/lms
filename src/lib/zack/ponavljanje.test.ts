import { describe, it, expect } from "vitest";
import { izaberiStare, kvotaStarih, pitanjaSaStarima, NAJVISE_STARIH, type StaraRec } from "./ponavljanje";
import { napraviPitanja, type Pitanje } from "./pitanja";
import type { Rec, Rod } from "./rec";

const R = (id: string, over: Partial<Rec> = {}): Rec => ({
  id,
  redni_broj: Number(id.replace(/\D/g, "")) || 1,
  de: `de-${id}`,
  sr: `sr-${id}`,
  rod: "der" as Rod,
  mnozina: `mn-${id}`,
  vrsta: "imenica",
  izuzetak: false,
  ...over,
});

const S = (id: string, izbledela = false, gresaka = 0, over: Partial<Rec> = {}): StaraRec => ({
  rec: R(id, over),
  izbledela,
  gresaka,
});

/** Prost determinisan izvor slučajnosti, isti kao u milioner.test.ts. */
function nizRng(seme: number): () => number {
  let s = seme;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

const nula = () => 0;

/** Ključevi reči koje jedno pitanje pokriva, za proveru porekla pitanja. */
function recIdovi(p: Pitanje): string[] {
  return p.igra === "parovi" ? p.parovi.map((x) => x.recId) : [p.recId];
}

describe("kvotaStarih", () => {
  it("partija od osam pitanja prima dve stare", () => {
    expect(kvotaStarih(8)).toBe(2);
  });

  it("ispod četiri pitanja starih nema", () => {
    expect(kvotaStarih(0)).toBe(0);
    expect(kvotaStarih(3)).toBe(0);
  });

  it("nikad više od gornje granice, ni u dugom toku skakača", () => {
    expect(kvotaStarih(60)).toBe(NAJVISE_STARIH);
    expect(kvotaStarih(1000)).toBe(NAJVISE_STARIH);
  });

  it("pokvaren ulaz ne obara kvotu nego daje nulu", () => {
    expect(kvotaStarih(-5)).toBe(0);
    expect(kvotaStarih(Number.NaN)).toBe(0);
  });
});

describe("izaberiStare", () => {
  it("bez kandidata ili bez mesta vraća prazno", () => {
    expect(izaberiStare([], 3, nula)).toEqual([]);
    expect(izaberiStare([S("a")], 0, nula)).toEqual([]);
  });

  it("reč sa greškom ulazi pre izbledele, a izbledela pre obične", () => {
    const kandidati = [S("obicna"), S("bleda", true), S("gresna", false, 2)];
    for (let seme = 1; seme <= 5; seme++) {
      const izbor = izaberiStare(kandidati, 2, nizRng(seme));
      expect(izbor.map((r) => r.id)).toEqual(["gresna", "bleda"]);
    }
  });

  it("više grešaka ima prednost nad manje", () => {
    const kandidati = [S("jedna", false, 1), S("tri", false, 3), S("dve", true, 2)];
    const izbor = izaberiStare(kandidati, 3, nizRng(7));
    expect(izbor.map((r) => r.id)).toEqual(["tri", "dve", "jedna"]);
  });

  it("ne vraća više nego što kandidata ima", () => {
    expect(izaberiStare([S("a"), S("b")], 10, nizRng(1))).toHaveLength(2);
  });

  it("isti rng daje isti izbor, a polazni niz ostaje netaknut", () => {
    const kandidati = [S("a"), S("b"), S("c"), S("d"), S("e")];
    const pre = kandidati.map((s) => s.rec.id);
    const prvi = izaberiStare(kandidati, 3, nizRng(42));
    const drugi = izaberiStare(kandidati, 3, nizRng(42));
    expect(prvi.map((r) => r.id)).toEqual(drugi.map((r) => r.id));
    expect(kandidati.map((s) => s.rec.id)).toEqual(pre);
  });

  it("među jednakima bira nasumično, ne uvek iste", () => {
    const kandidati = Array.from({ length: 8 }, (_, i) => S(`r${i}`));
    const vidjene = new Set<string>();
    for (let seme = 1; seme <= 30; seme++) {
      for (const r of izaberiStare(kandidati, 2, nizRng(seme))) vidjene.add(r.id);
    }
    expect(vidjene.size).toBeGreaterThan(2);
  });
});

describe("pitanjaSaStarima", () => {
  const LEKCIJA = Array.from({ length: 8 }, (_, i) => R(`l${i}`));
  const STARE = [
    S("s0", true, 2),
    S("s1", true),
    S("s2", false, 1),
    S("s3"),
    S("s4"),
  ];

  it("bez starih (prva lekcija) vraća isto što i napraviPitanja", () => {
    const sa = pitanjaSaStarima(LEKCIJA, [], "brzo-biranje", 8, nizRng(3));
    const bez = napraviPitanja(LEKCIJA, "brzo-biranje", 8, nizRng(3));
    expect(sa).toEqual(bez);
    expect(sa).toHaveLength(8);
    for (const p of sa) {
      expect(recIdovi(p)[0]?.startsWith("l")).toBe(true);
    }
  });

  it("Parovi ostaju čisto lekcijski i sa punim džepom starih", () => {
    const pitanja = pitanjaSaStarima(LEKCIJA, STARE, "parovi", 8, nizRng(4));
    expect(pitanja).toHaveLength(1);
    for (const id of recIdovi(pitanja[0])) {
      expect(id.startsWith("l")).toBe(true);
    }
  });

  it("u partiju od osam ulaze tačno dve stare, ukupan broj se ne menja", () => {
    const pitanja = pitanjaSaStarima(LEKCIJA, STARE, "brzo-biranje", 8, nizRng(5));
    expect(pitanja).toHaveLength(8);
    const starih = pitanja.filter((p) => recIdovi(p)[0]?.startsWith("s")).length;
    expect(starih).toBe(2);
  });

  it("prednost imaju greške pa izbledele: ulaze s0 i s2", () => {
    for (let seme = 1; seme <= 5; seme++) {
      const pitanja = pitanjaSaStarima(LEKCIJA, STARE, "diktat", 8, nizRng(seme));
      const stare = pitanja.flatMap((p) => recIdovi(p)).filter((id) => id.startsWith("s"));
      expect([...stare].sort()).toEqual(["s0", "s2"]);
    }
  });

  it("stara reč nepodobna za igru ne ulazi u kvotu (rod bez roda)", () => {
    const bezRoda = [S("s9", true, 5, { rod: "nema" }), S("s8", true)];
    const pitanja = pitanjaSaStarima(LEKCIJA, bezRoda, "rod", 8, nizRng(6));
    const stare = pitanja.flatMap((p) => recIdovi(p)).filter((id) => id.startsWith("s"));
    expect(stare).toEqual(["s8"]);
  });

  it("reč koja je i u lekciji se ne računa kao stara", () => {
    const duplikat = [S("l0", true, 9)];
    const pitanja = pitanjaSaStarima(LEKCIJA, duplikat, "brzo-biranje", 8, nizRng(7));
    const koliko = pitanja.filter((p) => recIdovi(p)[0] === "l0").length;
    expect(koliko).toBeLessThanOrEqual(1);
  });

  it("u dugom toku skakača stare stoje u ranom delu, ne na kraju", () => {
    const pitanja = pitanjaSaStarima(LEKCIJA, STARE, "skakac", 60, nizRng(8));
    expect(pitanja).toHaveLength(60);
    const mesta = pitanja
      .map((p, i) => (recIdovi(p)[0]?.startsWith("s") ? i : -1))
      .filter((i) => i >= 0);
    expect(mesta).toHaveLength(4);
    for (const mesto of mesta) {
      expect(mesto).toBeLessThan(16);
    }
  });

  it("staro pitanje množine nudi odgovore i iz lekcijskog skupa", () => {
    const pitanja = pitanjaSaStarima(LEKCIJA, STARE, "mnozina", 8, nizRng(9));
    const staro = pitanja.find(
      (p) => p.igra === "mnozina" && recIdovi(p)[0]?.startsWith("s")
    );
    expect(staro).toBeDefined();
    if (staro && staro.igra === "mnozina") {
      const izLekcije = staro.opcije.filter((o) => o.startsWith("mn-l")).length;
      expect(izLekcije).toBeGreaterThan(0);
    }
  });
});
