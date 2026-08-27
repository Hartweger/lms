import { describe, it, expect } from "vitest";
import { uRed, danOnly, jeZaKnjizenje, predlozenaKategorija } from "./sef-ulazne";

describe("danOnly", () => {
  it("seče vreme sa datuma", () => {
    expect(danOnly("2026-08-27T10:30:00Z")).toBe("2026-08-27");
    expect(danOnly("2026-08-27")).toBe("2026-08-27");
  });

  it("prazno i besmisleno daju null, ne izmišljen datum", () => {
    expect(danOnly(null)).toBe(null);
    expect(danOnly("")).toBe(null);
    expect(danOnly("nije datum")).toBe(null);
  });
});

describe("uRed", () => {
  const sef = {
    invoiceId: 5619601,
    cirInvoiceId: "CIR-1",
    documentNumber: "2026/145",
    supplierName: "VERCEL INC",
    supplierVatRegistrationNumber: "111222333",
    amount: 2400,
    sumWithoutVat: 2000,
    vatAmount: 400,
    currency: "RSD",
    sentDate: "2026-08-25T09:00:00Z",
    dueDate: "2026-09-01T00:00:00Z",
    status: "New",
  };

  it("prepisuje sve što nam treba", () => {
    expect(uRed(sef)).toEqual({
      sef_invoice_id: "5619601",
      cir_invoice_id: "CIR-1",
      broj_dokumenta: "2026/145",
      dobavljac_naziv: "VERCEL INC",
      dobavljac_pib: "111222333",
      iznos: 2400,
      iznos_bez_pdv: 2000,
      pdv: 400,
      valuta: "RSD",
      datum: "2026-08-25",
      rok_placanja: "2026-09-01",
      status: "New",
    });
  });

  it("bez datuma slanja uzima datum prometa", () => {
    const r = uRed({ ...sef, sentDate: null, deliveryDate: "2026-08-20T00:00:00Z" });
    expect(r?.datum).toBe("2026-08-20");
  });

  it("bez identifikatora vraća null - inače bi je svaki prolaz dodavao ponovo", () => {
    expect(uRed({ ...sef, invoiceId: undefined })).toBe(null);
  });

  it("valuta se podrazumeva kao RSD kad je nema", () => {
    expect(uRed({ ...sef, currency: null })?.valuta).toBe("RSD");
  });
});

describe("jeZaKnjizenje", () => {
  it("otkazana, obrisana i stornirana nisu trošak", () => {
    expect(jeZaKnjizenje("Cancelled")).toBe(false);
    expect(jeZaKnjizenje("Storno")).toBe(false);
    expect(jeZaKnjizenje("Deleted")).toBe(false);
  });

  it("obična faktura jeste", () => {
    expect(jeZaKnjizenje("New")).toBe(true);
    expect(jeZaKnjizenje("Approved")).toBe(true);
    expect(jeZaKnjizenje(null)).toBe(true);
  });
});

describe("predlozenaKategorija", () => {
  it("prepoznaje alate koje stvarno koristimo", () => {
    expect(predlozenaKategorija("VERCEL INC.")).toBe("alati-hosting");
    expect(predlozenaKategorija("Supabase Pte Ltd")).toBe("alati-hosting");
  });

  it("prepoznaje oglase", () => {
    expect(predlozenaKategorija("Meta Platforms Ireland")).toBe("oglasi");
  });

  it("radije ništa nego pogrešno", () => {
    expect(predlozenaKategorija("NEPOZNATO DOO")).toBe(null);
    expect(predlozenaKategorija(null)).toBe(null);
  });
});
