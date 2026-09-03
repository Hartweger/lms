import { describe, it, expect } from "vitest";
import { predloziZa, kategorijaZa, predlogObrasca, vrediZapamtiti, type CekaUplatu } from "./izvod-uparivanje";
import type { IzvodStavka } from "./izvod-xml";

function stavka(over: Partial<IzvodStavka> = {}): IzvodStavka {
  return {
    fitid: "X1",
    smer: "priliv",
    iznos: 40250,
    datum: "2026-08-28",
    naziv: "NEXT PROBA DOO",
    racunDruge: "205-0000000000000-22",
    svrha: "Placanje po predracunu 2026-419",
    sifra: "221",
    pozivNaBroj: "2026-419",
    pozivDruge: null,
    ...over,
  };
}

const cekaju: CekaUplatu[] = [
  { id: "o1", orderNumber: "2026-419", total: 40250 },
  { id: "o2", orderNumber: "2026-402", total: 19600 },
];

const bezPravila = new Map<string, string>();

describe("predloziZa - prilivi", () => {
  it("poklapanje poziva na broj i iznosa daje predlog uplate", () => {
    const p = predloziZa(stavka(), cekaju, bezPravila);
    expect(p).toMatchObject({ vrsta: "uplata", orderId: "o1", orderNumber: "2026-419" });
    expect(p.neslaganje).toBeUndefined();
  });

  it("manji iznos je i dalje uplata, ali sa upozorenjem", () => {
    const p = predloziZa(stavka({ iznos: 39250 }), cekaju, bezPravila);
    expect(p.vrsta).toBe("uplata");
    expect(p.razlog).toContain("Fali");
    expect(p.neslaganje).toEqual({ ocekivano: 40250, stiglo: 39250 });
  });

  it("veći iznos se takođe javlja - preplata se ne prećutkuje", () => {
    const p = predloziZa(stavka({ iznos: 41000 }), cekaju, bezPravila);
    expect(p.razlog).toContain("više");
  });

  it("obračun kartičnog prometa nije uplata za kurs", () => {
    const p = predloziZa(
      stavka({ svrha: "KART.TRANS 24.08.2026", pozivNaBroj: "24082026", iznos: 112249 }),
      cekaju,
      bezPravila,
    );
    expect(p.vrsta).toBe("nista");
  });

  it("priliv bez prepoznatog broja ne pripisuje se nikome", () => {
    const p = predloziZa(
      stavka({ pozivNaBroj: "9999", svrha: "nesto deseto" }),
      cekaju,
      bezPravila,
    );
    expect(p.vrsta).toBe("nista");
  });

  it("ne uparuje se sa narudžbinom koja ne čeka uplatu", () => {
    // 2026-500 nije u spisku - makar poziv na broj bio uredan.
    const p = predloziZa(
      stavka({ pozivNaBroj: "2026-500", svrha: null }),
      cekaju,
      bezPravila,
    );
    expect(p.vrsta).toBe("nista");
  });
});

describe("prava uplata sa izvoda 172", () => {
  // Zabeleženo 02.09.2026 na pravom izvodu br. 172 (28.08). Ovo je prva prava
  // uplata firme kroz sistem - NEXT FIBER po fakturi 2026-419. Poziv na broj je
  // TAČNO broj narudžbine, bez repa, i sedi u polju „Poziv na broj (odobrenje)"
  // (u XML-u: `refnumber`).
  const pravaUplata: IzvodStavka = {
    fitid: "000DOPR2624016DT",
    smer: "priliv",
    iznos: 40250,
    datum: "2026-08-28",
    naziv: "DRUŠTVO ZA KABLOVSKE TELEKOMUNIKAC,SAVE KOVACEVICA 296,Novi",
    racunDruge: "155-0000000032839-45",
    svrha: "Promet robe i usluga - finalna potrosnja [08700117711596]",
    sifra: "221",
    pozivNaBroj: "2026-419",
    pozivDruge: null,
  };

  it("uparuje se sa narudžbinom, bez neslaganja", () => {
    const p = predloziZa(pravaUplata, cekaju, bezPravila);
    expect(p).toMatchObject({ vrsta: "uplata", orderId: "o1", orderNumber: "2026-419" });
    expect(p.neslaganje).toBeUndefined();
  });

  it("ne uparuje se kad ta narudžbina više ne čeka uplatu", () => {
    // Već potvrđena narudžbina nije u spisku, pa se uplata ne nudi drugi put.
    const p = predloziZa(pravaUplata, [{ id: "o2", orderNumber: "2026-402", total: 19600 }], bezPravila);
    expect(p.vrsta).toBe("nista");
  });
});

describe("predloziZa - odlivi", () => {
  const odliv = stavka({
    smer: "odliv",
    iznos: 11946,
    naziv: "Banca Intesa AD Beograd",
    svrha: "NATAŠA HARTWEGER,debitna kartica EX9281,FACEBK *VLCD22NKB4,DUBLIN,IE",
    pozivNaBroj: "3228067867,27-AUG-26",
  });

  it("nov dobavljač traži da Nataša izabere kategoriju", () => {
    const p = predloziZa(odliv, cekaju, bezPravila);
    expect(p.vrsta).toBe("trosak");
    expect(p.kategorija).toBe(null);
    expect(p.razlog).toContain("Nov dobavljač");
  });

  it("zapamćena kategorija se predlaže sama", () => {
    const p = predloziZa(odliv, cekaju, new Map([["FACEBK", "oglasi"]]));
    expect(p.kategorija).toBe("oglasi");
    expect(p.razlog).toContain("zapamćena");
  });

  it("premeštanje sopstvenog novca nije trošak", () => {
    const p = predloziZa(
      stavka({ smer: "odliv", svrha: "Prenos sredstava na sopstveni racun" }),
      cekaju,
      bezPravila,
    );
    expect(p.vrsta).toBe("nista");
  });
});

describe("kategorijaZa", () => {
  it("traži i u svrsi, ne samo u nazivu - trgovac je u svrsi", () => {
    expect(
      kategorijaZa(
        { naziv: "Banca Intesa AD Beograd", svrha: "kartica,ANTHROPIC,DUBLIN" },
        new Map([["ANTHROPIC", "alati-hosting"]]),
      ),
    ).toBe("alati-hosting");
  });

  it("ne zavisi od velikih i malih slova", () => {
    expect(
      kategorijaZa({ naziv: "vercel inc", svrha: null }, new Map([["VERCEL", "alati-hosting"]])),
    ).toBe("alati-hosting");
  });

  it("duži obrazac pobeđuje - GOOGLE ADS je precizniji od GOOGLE", () => {
    expect(
      kategorijaZa(
        { naziv: "GOOGLE ADS IRELAND", svrha: null },
        new Map([
          ["GOOGLE", "alati-hosting"],
          ["GOOGLE ADS", "oglasi"],
        ]),
      ),
    ).toBe("oglasi");
  });

  it("bez poklapanja vraća null - ne pogađa", () => {
    expect(kategorijaZa({ naziv: "NEPOZNATO", svrha: null }, new Map([["VERCEL", "x"]]))).toBe(null);
  });
});

describe("predlogObrasca", () => {
  it("iz kartične naplate vadi trgovca posle zvezdice", () => {
    expect(
      predlogObrasca({
        naziv: "Banca Intesa AD Beograd",
        svrha: "NATAŠA HARTWEGER,debitna kartica EX9281,FACEBK *VLCD22NKB4,DUBLIN,IE",
      }),
    ).toBe("FACEBK");
  });

  it("kad nema zvezdice uzima prvi smislen deo, ne 'kartica' ni ime vlasnice", () => {
    expect(
      predlogObrasca({ naziv: "Banca Intesa", svrha: "NATASA HARTWEGER,debitna kartica,ANTHROPIC,IE" }),
    ).toBe("ANTHROPIC");
  });

  it("bez svrhe pada na naziv", () => {
    expect(predlogObrasca({ naziv: "VERCEL INC, Dublin", svrha: null })).toBe("VERCEL INC");
  });
});

describe("vrediZapamtiti", () => {
  it("pamti ime dobavljača", () => {
    expect(vrediZapamtiti("FACEBK")).toBe(true);
    expect(vrediZapamtiti("KNJIŠKI MOLJAC 2012 DOO")).toBe(false); // godina u imenu
    expect(vrediZapamtiti("ANTHROPIC")).toBe(true);
    expect(vrediZapamtiti("Yettel d.o.o. Beograd")).toBe(true);
  });

  it("ne pamti opis vezan za jedan mesec", () => {
    // Ovakva pravila su se stvarno nakupila u avgustu 2026.
    expect(vrediZapamtiti("OBRAČUN TARIFE NA USLUGE PLATNOG PROMETA ZA PERIOD: OD - 21-aug-2026")).toBe(false);
    expect(vrediZapamtiti("Korišćenje BizMobi softverskog rešenja (avgust")).toBe(false);
  });

  it("ne pamti broj računa", () => {
    expect(vrediZapamtiti("11812026-8")).toBe(false);
    expect(vrediZapamtiti("2026-419")).toBe(false);
  });

  it("ne pamti prekratko ni predugačko", () => {
    expect(vrediZapamtiti("AB")).toBe(false);
    expect(vrediZapamtiti("X".repeat(41))).toBe(false);
  });
});
