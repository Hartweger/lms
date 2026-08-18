import { describe, expect, it } from "vitest";
import {
  gasiSe,
  izvestajRoditelja,
  izvestajZaDete,
  naRedu,
  naslovIzvestaja,
  nizZaPrikaz,
  noviBrojPraznih,
  opisPoslednjeAktivnosti,
  receniceZaDete,
  type DeteZaIzvestaj,
  type ZapisZaIzvestaj,
} from "./izvestaj";

// Fiksno „sada": sredina meseca, da period od dve nedelje ne prelazi godinu.
const SADA = new Date("2026-08-17T10:00:00Z");
const OD = new Date("2026-08-03T10:00:00Z");

/** Datum pre `dana` dana od SADA, kao ISO tekst. */
function preDana(dana: number): string {
  return new Date(SADA.getTime() - dana * 24 * 60 * 60 * 1000).toISOString();
}

/** Zalepljena sličica: zarađena i tačno odgovorena pre `dana` dana. */
function zalepljena(recId: string, dana: number): ZapisZaIzvestaj {
  return {
    rec_id: recId,
    zaradjena_at: preDana(dana),
    zalepljena_at: preDana(dana),
    poslednje_tacno_at: preDana(dana),
  };
}

function dete(delovi: Partial<DeteZaIzvestaj>): DeteZaIzvestaj {
  return {
    ime: "Petra",
    razred: 5,
    lekcije: [{ broj: 1, naziv: "Hallo", recIdovi: ["r1", "r2", "r3"] }],
    zapisi: [],
    ...delovi,
  };
}

describe("izvestajZaDete", () => {
  it("broji novu sličicu zarađenu u periodu", () => {
    const d = izvestajZaDete(dete({ zapisi: [zalepljena("r1", 3)] }), OD, SADA);
    expect(d.novih).toBe(1);
    expect(d.vezbalo).toBe(true);
    expect(d.zalepljene).toBe(1);
    expect(d.ukupno).toBe(3);
  });

  it("sličicu zarađenu pre perioda ne broji kao novu, ali je broji u albumu", () => {
    const d = izvestajZaDete(dete({ zapisi: [zalepljena("r1", 20)] }), OD, SADA);
    expect(d.novih).toBe(0);
    expect(d.zalepljene).toBe(1);
  });

  it("izbledela sličica se broji kao zalepljena - detetu ništa nije oduzeto", () => {
    // Zarađena pre 40 dana, bledenje počinje posle 21: izbledela je.
    const d = izvestajZaDete(
      dete({ zapisi: [zalepljena("r1", 40), zalepljena("r2", 2)] }),
      OD,
      SADA
    );
    expect(d.zalepljene).toBe(2);
    expect(d.preporuka).toEqual({ vrsta: "izbledele", izbledelih: 1 });
  });

  it("sličica koja još čeka u kesici broji se kao nova, ali ne u albumu", () => {
    const uKesici: ZapisZaIzvestaj = {
      rec_id: "r1",
      zaradjena_at: preDana(1),
      zalepljena_at: null,
      poslednje_tacno_at: preDana(1),
    };
    const d = izvestajZaDete(dete({ zapisi: [uKesici] }), OD, SADA);
    expect(d.novih).toBe(1);
    expect(d.zalepljene).toBe(0);
  });

  it("prazan period: vezbalo je false i nema ni preporuke ni lekcije", () => {
    const d = izvestajZaDete(dete({ zapisi: [zalepljena("r1", 30)] }), OD, SADA);
    expect(d.vezbalo).toBe(false);
    expect(d.gde).toBeNull();
    expect(d.preporuka).toEqual({ vrsta: "nema" });
  });

  it("broji različite dane vežbanja, ne odgovore", () => {
    // Dva odgovora istog dana i jedan trećeg: dva različita dana.
    const d = izvestajZaDete(
      dete({
        lekcije: [{ broj: 1, naziv: "Hallo", recIdovi: ["r1", "r2", "r3"] }],
        zapisi: [zalepljena("r1", 2), zalepljena("r2", 2), zalepljena("r3", 5)],
      }),
      OD,
      SADA
    );
    expect(d.danaVezbanja).toBe(2);
  });

  it("gde: lekcija sa najviše novih sličica u periodu", () => {
    const d = izvestajZaDete(
      dete({
        lekcije: [
          { broj: 1, naziv: "Hallo", recIdovi: ["r1"] },
          { broj: 2, naziv: "Schule", recIdovi: ["r2", "r3"] },
        ],
        zapisi: [zalepljena("r1", 2), zalepljena("r2", 3), zalepljena("r3", 4)],
      }),
      OD,
      SADA
    );
    expect(d.gde?.broj).toBe(2);
    expect(d.gde?.novih).toBe(2);
  });

  it("načeta lekcija koja u periodu stoji postaje preporuka", () => {
    const d = izvestajZaDete(
      dete({
        lekcije: [
          { broj: 1, naziv: "Hallo", recIdovi: ["r1", "r2"] },
          { broj: 2, naziv: "Schule", recIdovi: ["r3"] },
        ],
        // r1 zalepljena odavno (ali ne toliko da izbledi), lekcija 1 stoji
        // načeta; r3 nova u periodu pa dete jeste vežbalo.
        zapisi: [zalepljena("r1", 18), zalepljena("r3", 2)],
      }),
      OD,
      SADA
    );
    expect(d.preporuka).toEqual({
      vrsta: "nacetaLekcija",
      broj: 1,
      naziv: "Hallo",
      zalepljene: 1,
      ukupno: 2,
    });
  });

  it("izbledele imaju prednost nad načetom lekcijom - prvo pravilo koje se poklopi", () => {
    const d = izvestajZaDete(
      dete({
        lekcije: [
          { broj: 1, naziv: "Hallo", recIdovi: ["r1", "r2"] },
          { broj: 2, naziv: "Schule", recIdovi: ["r3"] },
        ],
        zapisi: [zalepljena("r1", 40), zalepljena("r3", 2)],
      }),
      OD,
      SADA
    );
    expect(d.preporuka.vrsta).toBe("izbledele");
  });

  it("pun album daje mirnu čestitku", () => {
    const d = izvestajZaDete(
      dete({
        lekcije: [{ broj: 1, naziv: "Hallo", recIdovi: ["r1", "r2"] }],
        zapisi: [zalepljena("r1", 2), zalepljena("r2", 3)],
      }),
      OD,
      SADA
    );
    expect(d.preporuka).toEqual({ vrsta: "svePuno" });
  });
});

describe("izvestajRoditelja", () => {
  it("više dece: jedno vežba a drugo ne - period nije prazan", () => {
    const vredno = dete({ ime: "Petra", zapisi: [zalepljena("r1", 2)] });
    const mirno = dete({ ime: "Marko", zapisi: [] });
    const r = izvestajRoditelja([vredno, mirno], OD, SADA);
    expect(r.svaPrazna).toBe(false);
    expect(r.deca[0]?.vezbalo).toBe(true);
    expect(r.deca[1]?.vezbalo).toBe(false);
  });

  it("sva deca bez aktivnosti: period je prazan", () => {
    const r = izvestajRoditelja([dete({}), dete({ ime: "Marko" })], OD, SADA);
    expect(r.svaPrazna).toBe(true);
  });
});

describe("gašenje i brojač praznih", () => {
  it("prazan period diže brojač za jedan", () => {
    expect(noviBrojPraznih(true, 0)).toBe(1);
    expect(noviBrojPraznih(true, 1)).toBe(2);
  });

  it("bilo kakva aktivnost vraća brojač na nulu", () => {
    expect(noviBrojPraznih(false, 1)).toBe(0);
    expect(noviBrojPraznih(false, 5)).toBe(0);
  });

  it("gašenje nastupa tek posle dva prazna perioda zaredom", () => {
    expect(gasiSe(0)).toBe(false);
    expect(gasiSe(1)).toBe(false);
    expect(gasiSe(2)).toBe(true);
  });

  it("smeće u brojaču se svodi na nulu umesto da sruši računicu", () => {
    expect(noviBrojPraznih(true, Number.NaN)).toBe(1);
    expect(noviBrojPraznih(true, -3)).toBe(1);
  });
});

describe("naRedu", () => {
  it("roditelj bez ijednog izveštaja je odmah na redu", () => {
    expect(naRedu(null, SADA)).toBe(true);
  });

  it("skorašnji izveštaj znači da nije na redu, stariji od 13 dana jeste", () => {
    expect(naRedu(preDana(5), SADA)).toBe(false);
    expect(naRedu(preDana(13), SADA)).toBe(true);
    expect(naRedu(preDana(20), SADA)).toBe(true);
  });

  it('pokvaren datum znači „na redu je", da se izveštaji ne zaglave zauvek', () => {
    expect(naRedu("nije datum", SADA)).toBe(true);
  });
});

describe("naslovIzvestaja", () => {
  it("jedno, dvoje i troje dece", () => {
    expect(naslovIzvestaja(["Petra"])).toBe("zack! - kako napreduje Petra");
    expect(naslovIzvestaja(["Petra", "Marko"])).toBe("zack! - kako napreduju Petra i Marko");
    expect(naslovIzvestaja(["Petra", "Marko", "Ana"])).toBe(
      "zack! - kako napreduju Petra, Marko i Ana"
    );
  });
});

describe("receniceZaDete", () => {
  it("prazan period je jedna mirna rečenica, bez saveta i bez uzvičnika", () => {
    const d = izvestajZaDete(dete({}), OD, SADA);
    const recenice = receniceZaDete(d);
    expect(recenice).toEqual(["U ove dve nedelje nije bilo vežbanja."]);
    expect(recenice[0]).not.toContain("!");
  });

  it("vredan period vodi vežbanjem, pa znanjem, pa lekcijom po nazivu", () => {
    const d = izvestajZaDete(
      dete({
        lekcije: [
          { broj: 4, naziv: "Meine Familie", recIdovi: ["r1", "r2", "r3"] },
          { broj: 5, naziv: "Schule", recIdovi: ["r4", "r5", "r6"] },
        ],
        zapisi: [zalepljena("r1", 2), zalepljena("r2", 3)],
      }),
      OD,
      SADA
    );
    const recenice = receniceZaDete(d);
    expect(recenice[0]).toBe(
      "Vežbalo je 2 dana u poslednje dve nedelje i naučilo 2 nove reči."
    );
    expect(recenice[1]).toBe("Ukupno zna 2 od 6 reči koje se uče u petom razredu.");
    expect(recenice).toContain(
      'Trenutno radi lekciju „Meine Familie" i zna 2 od 3 njene reči.'
    );
    // Nigde se roditelju ne pominju sličice ni kesice ni spratovi.
    for (const r of recenice) {
      expect(r).not.toMatch(/sličic|kesic|sprat/i);
    }
  });

  it("oblici broja: 1 dan, 1 nova reč", () => {
    const jedna = izvestajZaDete(dete({ zapisi: [zalepljena("r1", 2)] }), OD, SADA);
    expect(receniceZaDete(jedna)[0]).toBe(
      "Vežbalo je 1 dan u poslednje dve nedelje i naučilo 1 novu reč."
    );
  });

  it('bez razreda gradivo postaje „reči iz udžbenika", a nula znanja se ne ispisuje', () => {
    const bezRazreda = izvestajZaDete(
      dete({ razred: null, zapisi: [zalepljena("r1", 2)] }),
      OD,
      SADA
    );
    expect(receniceZaDete(bezRazreda)[1]).toBe("Ukupno zna 1 od 3 reči iz udžbenika.");

    // Sve tri sveže zarađene još čekaju u kesici: dete jeste vežbalo, ali još
    // ništa nije zalepljeno - rečenica „zna 0 od..." izostaje.
    const uKesici = izvestajZaDete(
      dete({
        zapisi: [
          { rec_id: "r1", zaradjena_at: preDana(1), zalepljena_at: null, poslednje_tacno_at: preDana(1) },
        ],
      }),
      OD,
      SADA
    );
    expect(receniceZaDete(uKesici).some((r) => r.startsWith("Ukupno zna"))).toBe(false);
  });

  it("tempo se kaže samo kad je bar blizu lekcije mesečno, nikad kao prekor", () => {
    // 3 reči po lekciji, 2 nove za dve nedelje = 4 mesečno > 1 lekcija.
    const brzo = izvestajZaDete(
      dete({
        lekcije: [
          { broj: 1, naziv: "Hallo", recIdovi: ["r1", "r2", "r3"] },
          { broj: 2, naziv: "Schule", recIdovi: ["r4", "r5", "r6"] },
        ],
        zapisi: [zalepljena("r1", 2), zalepljena("r2", 3)],
      }),
      OD,
      SADA
    );
    // 4 mesečno naspram 3 po lekciji: nešto preko jedne lekcije mesečno.
    expect(receniceZaDete(brzo)).toContain(
      "To je otprilike tempo kojim se prelazi jedna školska lekcija mesečno."
    );

    // 3 nove za dve nedelje = 6 mesečno = dve lekcije od po 3 reči.
    const dupli = izvestajZaDete(
      dete({
        lekcije: [
          { broj: 1, naziv: "Hallo", recIdovi: ["r1", "r2", "r3"] },
          { broj: 2, naziv: "Schule", recIdovi: ["r4", "r5", "r6"] },
        ],
        zapisi: [zalepljena("r1", 2), zalepljena("r2", 3), zalepljena("r4", 4)],
      }),
      OD,
      SADA
    );
    expect(receniceZaDete(dupli)).toContain("To je tempo od oko dve školske lekcije mesečno.");

    // 24 reči po lekciji, 1 nova za dve nedelje: tempo se NE imenuje.
    const polako = izvestajZaDete(
      dete({
        lekcije: [
          { broj: 1, naziv: "Hallo", recIdovi: Array.from({ length: 24 }, (_, i) => `w${i}`) },
          { broj: 2, naziv: "Schule", recIdovi: ["r1"] },
        ],
        zapisi: [zalepljena("w0", 2)],
      }),
      OD,
      SADA
    );
    expect(receniceZaDete(polako).some((r) => r.includes("tempo"))).toBe(false);
  });
});

describe("opisPoslednjeAktivnosti", () => {
  it("danas, juče, pre N dana", () => {
    expect(opisPoslednjeAktivnosti("2026-08-17", "2026-08-17")).toBe("vežbalo danas");
    expect(opisPoslednjeAktivnosti("2026-08-16", "2026-08-17")).toBe("vežbalo juče");
    expect(opisPoslednjeAktivnosti("2026-08-15", "2026-08-17")).toBe("vežbalo pre 2 dana");
  });

  it('staro ili nepoznato je mirno „nije vežbalo u poslednje vreme", bez broja', () => {
    expect(opisPoslednjeAktivnosti(null, "2026-08-17")).toBe("nije vežbalo u poslednje vreme");
    expect(opisPoslednjeAktivnosti("2026-06-01", "2026-08-17")).toBe(
      "nije vežbalo u poslednje vreme"
    );
    expect(opisPoslednjeAktivnosti("pokvaren", "2026-08-17")).toBe(
      "nije vežbalo u poslednje vreme"
    );
  });
});

describe("nizZaPrikaz", () => {
  it("prikazuje se tek od 2 dana i samo dok stvarno traje", () => {
    expect(nizZaPrikaz(9, "2026-08-17", "2026-08-17")).toBe(9);
    expect(nizZaPrikaz(9, "2026-08-16", "2026-08-17")).toBe(9);
    expect(nizZaPrikaz(1, "2026-08-17", "2026-08-17")).toBeNull();
  });

  it("prekinut niz se ne prikazuje - čeka sledeće igranje da se preračuna", () => {
    expect(nizZaPrikaz(9, "2026-08-10", "2026-08-17")).toBeNull();
    expect(nizZaPrikaz(9, null, "2026-08-17")).toBeNull();
  });
});
