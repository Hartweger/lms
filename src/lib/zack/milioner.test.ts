import { describe, it, expect } from "vitest";
import {
  dozvoljeneTacke,
  duzinaPartije,
  polaPola,
  sastaviPartiju,
  zameniPitanje,
  NAJMANJE_PITANJA,
  NAJVISE_PITANJA,
  type GramatickaTacka,
  type GramatickoPitanje,
  type PitanjePartije,
} from "./milioner";

const T = (redni: number, odLekcije: number): GramatickaTacka => ({
  id: `t${redni}`,
  redni_broj: redni,
  naziv: `tačka ${redni}`,
  objasnjenje: `objašnjenje ${redni}`,
  primer: `primer ${redni}`,
  od_lekcije: odLekcije,
});

const P = (
  id: string,
  tackaId: string,
  tezina: number,
  over: Partial<GramatickoPitanje> = {}
): GramatickoPitanje => ({
  id,
  gramatika_id: tackaId,
  pitanje: `pitanje ${id}`,
  // Kao u bazi: tačan odgovor je upisan prvi, dakle `tacan` je nula.
  opcije: [`${id}-tacan`, `${id}-a`, `${id}-b`, `${id}-v`],
  tacan: 0,
  tezina,
  ...over,
});

/** Četiri obrađene tačke i četiri neobrađene, kao Maximal 1 posle prve lekcije. */
const TACKE = [T(1, 1), T(2, 1), T(3, 1), T(4, 1), T(5, 2), T(6, 2), T(7, 2), T(8, 2)];

/** Sedamnaest dozvoljenih (10 lakih, 4 srednja, 3 teška) i trinaest zabranjenih. */
const PITANJA: GramatickoPitanje[] = [
  ...Array.from({ length: 10 }, (_, i) => P(`l${i}`, `t${(i % 4) + 1}`, 1)),
  ...Array.from({ length: 4 }, (_, i) => P(`s${i}`, `t${(i % 4) + 1}`, 2)),
  ...Array.from({ length: 3 }, (_, i) => P(`x${i}`, `t${(i % 4) + 1}`, 3)),
  ...Array.from({ length: 13 }, (_, i) => P(`z${i}`, `t${(i % 4) + 5}`, (i % 3) + 1)),
];

const nula = () => 0;
/** Prost determinisan izvor slučajnosti, da svaki poziv ne vraća isto. */
function nizRng(seme: number): () => number {
  let s = seme;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

const naEkran = (p: GramatickoPitanje, tezina = p.tezina): PitanjePartije => ({
  id: p.id,
  gramatikaId: p.gramatika_id,
  pitanje: p.pitanje,
  opcije: [...p.opcije],
  tacan: p.tacan,
  tezina,
});

describe("dozvoljeneTacke", () => {
  it("pušta samo tačke obrađene do te lekcije", () => {
    const d = dozvoljeneTacke(TACKE, 1);
    expect(d.map((t) => t.redni_broj)).toEqual([1, 2, 3, 4]);
  });

  it("iz druge lekcije puštaju se i tačke prve", () => {
    expect(dozvoljeneTacke(TACKE, 2)).toHaveLength(8);
  });

  it("pre prve lekcije nema nijedne tačke", () => {
    expect(dozvoljeneTacke(TACKE, 0)).toEqual([]);
  });
});

describe("duzinaPartije", () => {
  it("iz obilja uzima gornju granicu", () => {
    expect(duzinaPartije(30)).toBe(NAJVISE_PITANJA);
  });

  it("kad ih ima taman, ostavlja jedno u rezervi za zamenu", () => {
    expect(duzinaPartije(15)).toBe(14);
    expect(duzinaPartije(13)).toBe(12);
  });

  it("ispod donje granice ne silazi zbog rezerve", () => {
    expect(duzinaPartije(NAJMANJE_PITANJA)).toBe(NAJMANJE_PITANJA);
  });

  it("kad pitanja nema dovoljno, uzima koliko ih ima", () => {
    expect(duzinaPartije(5)).toBe(5);
    expect(duzinaPartije(0)).toBe(0);
  });
});

describe("sastaviPartiju, pravilo o obrađenom gradivu", () => {
  it("NIKAD ne uzme pitanje iz tačke koja nije obrađena", () => {
    // Petnaest partija, jer je ovo pravilo koje ne sme da padne ni jednom.
    for (let s = 1; s <= 15; s++) {
      const partija = sastaviPartiju(TACKE, PITANJA, 1, nizRng(s));
      const izvori = new Set(partija.pitanja.map((p) => p.gramatikaId));
      expect(izvori.size).toBeGreaterThan(0);
      for (const izvor of izvori) {
        expect(["t1", "t2", "t3", "t4"]).toContain(izvor);
      }
      expect(partija.pitanja.some((p) => p.id.startsWith("z"))).toBe(false);
    }
  });

  it("ni rezerva ne sme da sadrži neobrađeno gradivo", () => {
    const partija = sastaviPartiju(TACKE, PITANJA, 1, nizRng(7));
    for (const p of partija.rezerva) {
      expect(["t1", "t2", "t3", "t4"]).toContain(p.gramatikaId);
    }
  });

  it("iz druge lekcije se otvaraju i tačke druge lekcije", () => {
    const partija = sastaviPartiju(TACKE, PITANJA, 2, nizRng(3));
    const izvori = new Set([...partija.pitanja, ...partija.rezerva].map((p) => p.gramatikaId));
    expect([...izvori].some((i) => ["t5", "t6", "t7", "t8"].includes(i))).toBe(true);
  });

  it("bez ijedne dozvoljene tačke partija je prazna, a ne puna tuđeg gradiva", () => {
    const partija = sastaviPartiju(TACKE, PITANJA, 0, nizRng(1));
    expect(partija.pitanja).toEqual([]);
    expect(partija.tacke).toEqual([]);
  });
});

describe("sastaviPartiju, oblik partije", () => {
  it("pitanja idu od lakših ka težim", () => {
    const partija = sastaviPartiju(TACKE, PITANJA, 1, nizRng(11));
    const tezine = partija.pitanja.map((p) => p.tezina);
    expect(tezine).toEqual([...tezine].sort((a, b) => a - b));
  });

  it("ne ponavlja isto pitanje u istoj partiji", () => {
    for (let s = 1; s <= 10; s++) {
      const partija = sastaviPartiju(TACKE, PITANJA, 1, nizRng(s));
      const idovi = partija.pitanja.map((p) => p.id);
      expect(new Set(idovi).size).toBe(idovi.length);
    }
  });

  it("pitanje iz partije ne stoji istovremeno i u rezervi", () => {
    const partija = sastaviPartiju(TACKE, PITANJA, 1, nizRng(5));
    const uPartiji = new Set(partija.pitanja.map((p) => p.id));
    expect(partija.rezerva.some((p) => uPartiji.has(p.id))).toBe(false);
  });

  it("iz sedamnaest dozvoljenih pravi partiju u rasponu, sa rezervom", () => {
    const partija = sastaviPartiju(TACKE, PITANJA, 1, nizRng(2));
    expect(partija.pitanja.length).toBeGreaterThanOrEqual(NAJMANJE_PITANJA);
    expect(partija.pitanja.length).toBeLessThanOrEqual(NAJVISE_PITANJA);
    expect(partija.rezerva.length).toBeGreaterThan(0);
  });

  it("čuva retka teška pitanja umesto da seče sa kraja", () => {
    const partija = sastaviPartiju(TACKE, PITANJA, 1, nizRng(9));
    expect(partija.pitanja.filter((p) => p.tezina === 3)).toHaveLength(3);
  });

  it("kad pitanja nema dovoljno, uzima koliko ih ima i ne ponavlja ih", () => {
    const malo = PITANJA.filter((p) => p.id.startsWith("l")).slice(0, 4);
    const partija = sastaviPartiju(TACKE, malo, 1, nizRng(4));
    expect(partija.pitanja).toHaveLength(4);
    expect(new Set(partija.pitanja.map((p) => p.id)).size).toBe(4);
  });

  it("vraća samo one tačke koje su stvarno ušle u partiju, po rednom broju", () => {
    const jedna = PITANJA.filter((p) => p.gramatika_id === "t2").slice(0, 2);
    const partija = sastaviPartiju(TACKE, jedna, 1, nizRng(6));
    expect(partija.tacke.map((t) => t.redni_broj)).toEqual([2]);
  });

  it("meša ponuđene odgovore, da tačan ne bude uvek prvo dugme", () => {
    // Sva pitanja u bazi imaju `tacan` nula. Kad bi se opcije prikazivale kako
    // stoje, dete bi posle trećeg pitanja biralo prvo dugme bez čitanja.
    const partija = sastaviPartiju(TACKE, PITANJA, 1, nizRng(8));
    expect(partija.pitanja.every((p) => p.tacan === 0)).toBe(false);
  });

  it("posle mešanja tačan indeks i dalje pokazuje na tačan tekst", () => {
    const partija = sastaviPartiju(TACKE, PITANJA, 1, nizRng(12));
    for (const p of partija.pitanja) {
      expect(p.opcije[p.tacan]).toBe(`${p.id}-tacan`);
      expect(p.opcije).toHaveLength(4);
    }
  });

  it("preskače pokvaren red umesto da obori celu partiju", () => {
    const pokvarena: GramatickoPitanje[] = [
      P("dobro", "t1", 1),
      P("van-niza", "t1", 1, { tacan: 9 }),
      P("duplikat", "t1", 1, { opcije: ["a", "a", "b", "v"] }),
      P("prazno", "t1", 1, { opcije: [] }),
    ];
    const partija = sastaviPartiju(TACKE, pokvarena, 1, nizRng(1));
    expect(partija.pitanja.map((p) => p.id)).toEqual(["dobro"]);
  });
});

describe("sastaviPartiju, ranije promašena pitanja", () => {
  // Od deset lakih u partiju stane osam, pa bez grešaka svako od njih ume da
  // završi u rezervi. Sa greškom to ne sme da se desi.
  it("pitanje sa ranijom greškom ulazi u partiju pre pitanja bez nje", () => {
    const greske = new Map([
      ["l3", 2],
      ["l7", 1],
    ]);
    for (let s = 1; s <= 15; s++) {
      const partija = sastaviPartiju(TACKE, PITANJA, 1, nizRng(s), greske);
      const idovi = new Set(partija.pitanja.map((p) => p.id));
      expect(idovi.has("l3")).toBe(true);
      expect(idovi.has("l7")).toBe(true);
    }
  });

  it("unutar svoje težine promašena idu prva, više grešaka ispred manje", () => {
    const greske = new Map([
      ["l3", 2],
      ["l7", 1],
    ]);
    const partija = sastaviPartiju(TACKE, PITANJA, 1, nizRng(4), greske);
    expect(partija.pitanja[0].id).toBe("l3");
    expect(partija.pitanja[1].id).toBe("l7");
  });

  it("raspored težina se ne kvari: greška na lakom ne dira srednja ni teška", () => {
    const greske = new Map([
      ["l1", 5],
      ["x0", 3],
    ]);
    const brojPoTezini = (pitanja: readonly PitanjePartije[]) =>
      [1, 2, 3].map((t) => pitanja.filter((p) => p.tezina === t).length);

    const sa = sastaviPartiju(TACKE, PITANJA, 1, nizRng(6), greske);
    const bez = sastaviPartiju(TACKE, PITANJA, 1, nizRng(6));
    expect(brojPoTezini(sa.pitanja)).toEqual(brojPoTezini(bez.pitanja));

    const tezine = sa.pitanja.map((p) => p.tezina);
    expect(tezine).toEqual([...tezine].sort((a, b) => a - b));
  });

  it("bez grešaka je ponašanje isto kao i do sad", () => {
    const staro = sastaviPartiju(TACKE, PITANJA, 1, nizRng(5));
    const novo = sastaviPartiju(TACKE, PITANJA, 1, nizRng(5), new Map());
    expect(novo).toEqual(staro);
  });

  it("greška na neobrađenom pitanju ne otvara neobrađeno gradivo", () => {
    const greske = new Map([["z0", 9]]);
    const partija = sastaviPartiju(TACKE, PITANJA, 1, nizRng(2), greske);
    expect(partija.pitanja.some((p) => p.id === "z0")).toBe(false);
  });
});

describe("polaPola", () => {
  it("uvek ostavlja tačan odgovor", () => {
    const p = naEkran(P("a", "t1", 1));
    for (let s = 1; s <= 20; s++) {
      const ostaje = polaPola(p, nizRng(s));
      expect(ostaje).toContain(p.tacan);
    }
  });

  it("ostavlja tačno dva odgovora, tačan i jedan netačan", () => {
    const p = naEkran(P("a", "t1", 1));
    const ostaje = polaPola(p, nizRng(3));
    expect(ostaje).toHaveLength(2);
    expect(ostaje.filter((i) => i !== p.tacan)).toHaveLength(1);
  });

  it("ne premešta odgovore koje ostavlja", () => {
    const p = naEkran(P("a", "t1", 1));
    const ostaje = polaPola(p, nizRng(5));
    expect(ostaje).toEqual([...ostaje].sort((a, b) => a - b));
  });

  it("radi i kad tačan odgovor nije prvi", () => {
    const p: PitanjePartije = { ...naEkran(P("a", "t1", 1)), tacan: 2 };
    const ostaje = polaPola(p, nula);
    expect(ostaje).toContain(2);
    expect(ostaje).toHaveLength(2);
  });
});

describe("zameniPitanje", () => {
  const trenutno = naEkran(P("sada", "t1", 2));
  const rezerva = [
    naEkran(P("lako", "t1", 1)),
    naEkran(P("srednje", "t2", 2)),
    naEkran(P("tesko", "t3", 3)),
  ];

  it("nikad ne vraća isto pitanje", () => {
    const zamena = zameniPitanje([trenutno, ...rezerva], trenutno, new Set());
    expect(zamena?.id).not.toBe(trenutno.id);
  });

  it("daje pitanje iste težine kad ga ima", () => {
    const zamena = zameniPitanje(rezerva, trenutno, new Set());
    expect(zamena?.id).toBe("srednje");
  });

  it("kad iste težine nema, daje bilo koje neiskorišćeno", () => {
    const zamena = zameniPitanje(rezerva, trenutno, new Set(["srednje"]));
    expect(zamena).not.toBeNull();
    expect(["lako", "tesko"]).toContain(zamena?.id);
  });

  it("ne vraća pitanje koje je već bilo na ekranu", () => {
    const zamena = zameniPitanje(rezerva, trenutno, new Set(["lako", "srednje"]));
    expect(zamena?.id).toBe("tesko");
  });

  it("kad rezerve nema, vraća ništa i pomoć se ne troši", () => {
    expect(zameniPitanje([], trenutno, new Set())).toBeNull();
    expect(zameniPitanje(rezerva, trenutno, new Set(["lako", "srednje", "tesko"]))).toBeNull();
  });
});
