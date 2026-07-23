import { describe, it, expect } from "vitest";
import { nestpayTxData, pdvBreakdown, CARD_OUTCOME, MERCHANT } from "./payment-confirmation";

describe("nestpayTxData", () => {
  it("izvlači obavezna EPM polja iz sačuvanog callback-a", () => {
    const tx = nestpayTxData({
      AuthCode: "P12345",
      Response: "Approved",
      ProcReturnCode: "00",
      mdStatus: "1",
      "EXTRA.TRXDATE": "20260722 14:33:21",
    });
    expect(tx.authCode).toBe("P12345");
    expect(tx.response).toBe("Approved");
    expect(tx.procReturnCode).toBe("00");
    expect(tx.mdStatus).toBe("1");
    // TRXDATE je već beogradsko vreme - prikazuje se doslovno, bez tz konverzije
    expect(tx.dateTime).toBe("22.07.2026. u 14:33");
  });

  it("bez TRXDATE koristi _receivedAt, bez oba pada na fallback", () => {
    const withReceived = nestpayTxData({ _receivedAt: "2026-07-01T10:00:00.000Z" });
    expect(withReceived.dateTime).toContain("01.07.2026.");

    const withFallback = nestpayTxData({}, "2026-06-15T08:00:00.000Z");
    expect(withFallback.dateTime).toContain("15.06.2026.");
  });

  it("prazna/odsutna polja prikazuje kao '-' (odbijena transakcija često nema AuthCode)", () => {
    const tx = nestpayTxData({ ProcReturnCode: "99", AuthCode: "" }, "2026-07-01T10:00:00Z");
    expect(tx.authCode).toBe("-");
    expect(tx.procReturnCode).toBe("99");
    expect(nestpayTxData(null).dateTime).toBe("-");
  });
});

describe("pdvBreakdown", () => {
  it("domaći kupac: 20% PDV uračunat u cenu", () => {
    const pdv = pdvBreakdown(12000, "RS");
    expect(pdv.amountRsd).toBe(2000);
    expect(pdv.label).toContain("20%");
  });

  it("inostranstvo: 0% (prati fiskalizaciju)", () => {
    const pdv = pdvBreakdown(12000, "DE");
    expect(pdv.amountRsd).toBe(0);
    expect(pdv.label).toContain("0%");
  });
});

describe("propisani tekstovi (EPM 2.7 - ne menjati bez banke)", () => {
  it("ishod sadrži obaveznu formulaciju o zaduženju računa kartice", () => {
    expect(CARD_OUTCOME.success).toContain("račun platne kartice je zadužen");
    expect(CARD_OUTCOME.fail).toContain("račun platne kartice nije zadužen");
    // neuspeh ne sme da navodi konkretan razlog odbijanja - samo bankin generički tekst
    expect(CARD_OUTCOME.failHint).toContain("pozovite vašu banku");
  });

  it("podaci o trgovcu su kompletni (naziv, PIB, adresa)", () => {
    expect(MERCHANT.pib).toBe("108712117");
    expect(MERCHANT.naziv).toContain("HARTWEGER");
    expect(MERCHANT.adresa).toContain("Jurija Gagarina 20");
  });
});
