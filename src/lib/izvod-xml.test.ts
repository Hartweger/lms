import { describe, it, expect } from "vitest";
import { procitajIzvod, nadjiBrojNarudzbine, dan } from "./izvod-xml";

// Izmišljen izvod, ali TAČNE strukture koju Banca Intesa šalje (potvrđeno na
// pravom izvodu br. 171, 28.08.2026). Pravi izvod ne ide u repo - javan je.
const IZVOD = `<?xml version="1.0" encoding="UTF-8"?>
<pmtnotification>
  <notificationtype>ibank.payment.notification.ledger</notificationtype>
  <curdef>RSD</curdef>
  <acctid>160-0000000000000-11</acctid>
  <stmtnumber>171</stmtnumber>
  <ledgerbal><balamt>100000.00</balamt><dtasof>2026-08-27T00:00:00</dtasof></ledgerbal>
  <availbal><balamt>140250.00</balamt><dtasof>2026-08-27T00:00:00</dtasof></availbal>
  <trnlist count="3">
    <stmttrn>
      <trntype>ibank.payment.pp3</trntype>
      <fitid>AAA111</fitid>
      <benefit>credit</benefit>
      <payeeinfo><name>NEXT PROBA DOO NOVI PAZAR</name><city/></payeeinfo>
      <payeeaccountinfo><acctid>205-0000000000000-22</acctid><bankid>205</bankid></payeeaccountinfo>
      <dtposted>2026-08-27T00:00:00</dtposted>
      <trnamt>40250.00</trnamt>
      <purpose>Placanje po predracunu 2026-419</purpose>
      <purposecode>221</purposecode>
      <refnumber>2026-419</refnumber>
      <payeerefnumber>97-1234</payeerefnumber>
    </stmttrn>
    <stmttrn>
      <fitid>BBB222</fitid>
      <benefit>debit</benefit>
      <payeeinfo><name>Banca Intesa AD Beograd</name></payeeinfo>
      <payeeaccountinfo><acctid>160-0000000000001-33</acctid></payeeaccountinfo>
      <dtposted>2026-08-27T00:00:00</dtposted>
      <trnamt>2340.00</trnamt>
      <purpose>NATASA HARTWEGER,debitna kartica,ANTHROPIC &amp; CO,DUBLIN,IE</purpose>
      <purposecode>284</purposecode>
      <refnumber>3228067867,27-AUG-26</refnumber>
      <payeerefnumber>313NPAR262375916,3786006</payeerefnumber>
    </stmttrn>
    <stmttrn>
      <fitid>CCC333</fitid>
      <benefit>credit</benefit>
      <payeeinfo><name>Banca Intesa Beograd</name></payeeinfo>
      <payeeaccountinfo><acctid>160-0000000000079-33</acctid></payeeaccountinfo>
      <dtposted>2026-08-27T00:00:00</dtposted>
      <trnamt>112249.83</trnamt>
      <purpose>KART.TRANS 24.08.2026</purpose>
      <purposecode>284</purposecode>
      <refnumber/>
      <payeerefnumber>05-600-001-IB021334</payeerefnumber>
    </stmttrn>
  </trnlist>
</pmtnotification>`;

describe("procitajIzvod", () => {
  const izvod = procitajIzvod(IZVOD);

  it("čita zaglavlje izvoda", () => {
    expect(izvod.racun).toBe("160-0000000000000-11");
    expect(izvod.broj).toBe(171);
    expect(izvod.datum).toBe("2026-08-27");
    expect(izvod.stanje).toBe(140250);
  });

  it("broj računa ostaje tekst - vodeće nule i crtice se ne smeju izgubiti", () => {
    expect(izvod.stavke[0].racunDruge).toBe("205-0000000000000-22");
  });

  it("smer se čita iz benefit, ne iz znaka iznosa", () => {
    expect(izvod.stavke.map((s) => s.smer)).toEqual(["priliv", "odliv", "priliv"]);
    expect(izvod.stavke.every((s) => s.iznos > 0)).toBe(true);
  });

  it("uplata firme nosi sve što treba za uparivanje", () => {
    expect(izvod.stavke[0]).toMatchObject({
      fitid: "AAA111",
      smer: "priliv",
      iznos: 40250,
      datum: "2026-08-27",
      naziv: "NEXT PROBA DOO NOVI PAZAR",
      svrha: "Placanje po predracunu 2026-419",
      sifra: "221",
      pozivNaBroj: "2026-419",
    });
  });

  it("znak & u nazivu se dekodira, ne ostaje &amp;", () => {
    expect(izvod.stavke[1].svrha).toContain("ANTHROPIC & CO");
  });

  it("prazan poziv na broj je null, ne prazan tekst", () => {
    expect(izvod.stavke[2].pozivNaBroj).toBe(null);
  });

  it("izvod sa jednom stavkom nije izuzetak", () => {
    const jedna = IZVOD.replace(/<stmttrn>[\s\S]*<\/stmttrn>/, `<stmttrn>
      <fitid>X1</fitid><benefit>credit</benefit><trnamt>100.00</trnamt>
      <dtposted>2026-08-27T00:00:00</dtposted>
    </stmttrn>`);
    expect(procitajIzvod(jedna).stavke).toHaveLength(1);
  });

  it("izvod bez ijedne promene ne puca", () => {
    const prazan = IZVOD.replace(/<trnlist[\s\S]*<\/trnlist>/, "<trnlist count=\"0\"/>");
    expect(procitajIzvod(prazan).stavke).toEqual([]);
  });

  it("tuđi XML se odbija jasnom greškom", () => {
    expect(() => procitajIzvod("<nesto><drugo/></nesto>")).toThrow("Nije izvod");
  });
});

describe("dan", () => {
  it("seče vreme", () => {
    expect(dan("2026-08-27T00:00:00")).toBe("2026-08-27");
    expect(dan("")).toBe(null);
    expect(dan(null)).toBe(null);
  });
});

describe("nadjiBrojNarudzbine", () => {
  const stavka = procitajIzvod(IZVOD).stavke[0];

  it("nalazi broj u pozivu na broj", () => {
    expect(nadjiBrojNarudzbine(stavka, ["2026-419", "2026-420"])).toBe("2026-419");
  });

  it("nalazi broj i kad je platilac upisao samo u svrhu", () => {
    const bezPoziva = { ...stavka, pozivNaBroj: null };
    expect(nadjiBrojNarudzbine(bezPoziva, ["2026-419"])).toBe("2026-419");
  });

  it("banka dopisuje rep uz poziv na broj - i dalje se nalazi", () => {
    const saRepom = { ...stavka, pozivNaBroj: "00-2026-419/27-AUG-26", svrha: null };
    expect(nadjiBrojNarudzbine(saRepom, ["2026-419"])).toBe("2026-419");
  });

  it("duži broj ima prednost - 2026-41 ne sme da pokupi uplatu za 2026-419", () => {
    expect(nadjiBrojNarudzbine(stavka, ["2026-41", "2026-419"])).toBe("2026-419");
  });

  it("kad nema poklapanja vraća null, ne pogađa", () => {
    expect(nadjiBrojNarudzbine(stavka, ["2026-777"])).toBe(null);
    expect(nadjiBrojNarudzbine({ ...stavka, pozivNaBroj: null, svrha: null, pozivDruge: null }, ["2026-419"])).toBe(null);
  });
});
