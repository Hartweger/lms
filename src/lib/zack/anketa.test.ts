import { describe, expect, it } from "vitest";
import {
  danaIzmedju,
  jeVracaSeKljuc,
  vremeZaPin,
  vremeZaPovratak,
  ocistiOmiljeno,
  ocistiSmeta,
  vremeZaAktivaciju,
  vremeZaAnketu,
  vremeZaIstek,
  NAJVISE_SLOVA_SMETA,
} from "./anketa";

const ROK = "2026-09-15T00:00:00+02:00";
const UZETO = "2026-08-25T10:00:00+02:00";

describe("vremeZaPin", () => {
  // Izmereno prve večeri akcije: od 25 poklona osmoro dece nije imalo PIN, a
  // bez njega prijava ne radi - zato ovaj mejl ide već sutradan.
  const osnova = { napravljeno: UZETO, pinPostavljen: false, clanstvoDo: ROK };

  it("istog dana se ćuti - roditelj možda upravo postavlja PIN", () => {
    expect(vremeZaPin({ ...osnova, sada: new Date("2026-08-25T22:00:00+02:00") })).toBe(false);
  });

  it("sutradan ide mejl", () => {
    expect(vremeZaPin({ ...osnova, sada: new Date("2026-08-26T09:00:00+02:00") })).toBe(true);
  });

  it("dete koje PIN ima se preskače", () => {
    expect(vremeZaPin({ ...osnova, pinPostavljen: true, sada: new Date("2026-08-26T09:00:00+02:00") })).toBe(false);
  });

  it("posle isteka poklona nema šta da se otključa", () => {
    expect(vremeZaPin({ ...osnova, sada: new Date("2026-09-20T09:00:00+02:00") })).toBe(false);
  });
});

describe("vremeZaAktivaciju", () => {
  const osnova = { napravljeno: UZETO, poslednjiDan: null, pinPostavljen: true, clanstvoDo: ROK };

  it("drugog dana se ćuti - detetu se daje vremena", () => {
    expect(vremeZaAktivaciju({ ...osnova, sada: new Date("2026-08-27T09:00:00+02:00") })).toBe(false);
  });

  it("trećeg dana ide jedan mejl da kod čeka", () => {
    expect(vremeZaAktivaciju({ ...osnova, sada: new Date("2026-08-28T09:00:00+02:00") })).toBe(true);
  });

  it("dete BEZ PIN-a se preskače - njemu je već otišao svoj mejl, ne dva o istom", () => {
    expect(
      vremeZaAktivaciju({ ...osnova, pinPostavljen: false, sada: new Date("2026-08-28T09:00:00+02:00") })
    ).toBe(false);
  });

  it("dete koje se ijednom igralo nema šta da aktivira", () => {
    expect(
      vremeZaAktivaciju({ ...osnova, poslednjiDan: "2026-08-26", sada: new Date("2026-08-29T09:00:00+02:00") })
    ).toBe(false);
  });

  it("posle isteka poklona podsećanje na kod nema smisla", () => {
    expect(vremeZaAktivaciju({ ...osnova, sada: new Date("2026-09-20T09:00:00+02:00") })).toBe(false);
  });
});

describe("vremeZaAnketu", () => {
  const osnova = { napravljeno: UZETO, poslednjiDan: "2026-08-31", clanstvoDo: ROK };

  it("šestog dana je prerano", () => {
    expect(vremeZaAnketu({ ...osnova, sada: new Date("2026-08-30T09:00:00+02:00") })).toBe(false);
  });

  it("sedmog dana ide anketa", () => {
    expect(vremeZaAnketu({ ...osnova, sada: new Date("2026-09-01T09:00:00+02:00") })).toBe(true);
  });

  it("dete koje nikad nije vežbalo se NE pita za utisak", () => {
    expect(vremeZaAnketu({ ...osnova, poslednjiDan: null, sada: new Date("2026-09-01T09:00:00+02:00") })).toBe(false);
  });

  it("posle isteka anketu zamenjuje mejl o isteku - ne dva mejla o istoj stvari", () => {
    expect(vremeZaAnketu({ ...osnova, sada: new Date("2026-09-16T09:00:00+02:00") })).toBe(false);
  });

  it("dete koje je prešlo na članstvo nije u poklon-nizu", () => {
    expect(
      vremeZaAnketu({ ...osnova, clanstvoDo: "2026-10-25T00:00:00+02:00", sada: new Date("2026-09-01T09:00:00+02:00") })
    ).toBe(true);
  });
});

describe("vremeZaIstek", () => {
  it("na sam dan roka se ćuti - dete je tog dana možda još igralo", () => {
    expect(vremeZaIstek(new Date("2026-09-15T00:00:00+02:00"), ROK)).toBe(true);
  });

  it("dan posle roka ide mejl", () => {
    expect(vremeZaIstek(new Date("2026-09-16T09:00:00+02:00"), ROK)).toBe(true);
  });

  it("pre roka se ne šalje", () => {
    expect(vremeZaIstek(new Date("2026-09-14T09:00:00+02:00"), ROK)).toBe(false);
  });

  it("posle tri dana prozor se zatvara - stara vest se ne šalje", () => {
    expect(vremeZaIstek(new Date("2026-09-19T09:00:00+02:00"), ROK)).toBe(false);
  });

  it("dete bez roka se preskače", () => {
    expect(vremeZaIstek(new Date("2026-09-16T09:00:00+02:00"), null)).toBe(false);
  });
});

describe("čišćenje odgovora", () => {
  it("prima samo poznate ključeve prvog pitanja", () => {
    expect(jeVracaSeKljuc("sam")).toBe(true);
    expect(jeVracaSeKljuc("podmetnuto")).toBe(false);
    expect(jeVracaSeKljuc(5)).toBe(false);
  });

  it("nepoznate i duple odgovore drugog pitanja tiho odbacuje", () => {
    expect(ocistiOmiljeno(["album", "album", "nepostoji", 7])).toEqual(["album"]);
    expect(ocistiOmiljeno("nije-niz")).toEqual([]);
  });

  it("prazan slobodan tekst je NULL, a predugačak se seče", () => {
    expect(ocistiSmeta("   ")).toBe(null);
    expect(ocistiSmeta(42)).toBe(null);
    expect(ocistiSmeta("a".repeat(NAJVISE_SLOVA_SMETA + 500))?.length).toBe(NAJVISE_SLOVA_SMETA);
  });
});

describe("danaIzmedju", () => {
  // Ovo je razlog postojanja funkcije: poklon uzet u 13h, cron u 11h ujutru.
  // Po satima bi trećeg dana bilo proteklo 2 dana i 22 sata, pa bi ceo niz
  // stalno kasnio jedan dan.
  it("broji kalendarske dane, ne sate", () => {
    expect(danaIzmedju(new Date("2026-08-25T13:00:00+02:00"), new Date("2026-08-28T11:00:00+02:00"))).toBe(3);
  });

  it("isti dan je nula, ma koliko sati prošlo", () => {
    expect(danaIzmedju(new Date("2026-08-25T00:30:00+02:00"), new Date("2026-08-25T23:30:00+02:00"))).toBe(0);
  });

  it("prelaz meseca ne pravi skok", () => {
    expect(danaIzmedju(new Date("2026-08-31T20:00:00+02:00"), new Date("2026-09-01T08:00:00+02:00"))).toBe(1);
  });
});

describe("vremeZaPovratak", () => {
  const ROK_ = "2026-09-15T00:00:00+02:00";

  it("dete koje je igralo juče se NE dira - jedna preskočena večer nije prekid", () => {
    expect(
      vremeZaPovratak({ sada: new Date("2026-08-24T11:00:00+02:00"), poslednjiDan: "2026-08-23", clanstvoDo: ROK_ })
    ).toBe(false);
  });

  it("posle dva dana tišine ide mejl", () => {
    expect(
      vremeZaPovratak({ sada: new Date("2026-08-24T11:00:00+02:00"), poslednjiDan: "2026-08-22", clanstvoDo: ROK_ })
    ).toBe(true);
  });

  it("dete koje NIKAD nije igralo ovde ne spada - njemu ide mejl o kodu", () => {
    expect(
      vremeZaPovratak({ sada: new Date("2026-08-24T11:00:00+02:00"), poslednjiDan: null, clanstvoDo: ROK_ })
    ).toBe(false);
  });

  it("posle isteka poklona album ionako miruje", () => {
    expect(
      vremeZaPovratak({ sada: new Date("2026-09-20T11:00:00+02:00"), poslednjiDan: "2026-09-01", clanstvoDo: ROK_ })
    ).toBe(false);
  });

  it("pokvaren datum ne ruši cron", () => {
    expect(
      vremeZaPovratak({ sada: new Date("2026-08-24T11:00:00+02:00"), poslednjiDan: "nije-datum", clanstvoDo: ROK_ })
    ).toBe(false);
  });
});
