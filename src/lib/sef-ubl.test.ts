import { describe, it, expect } from "vitest";
import { napraviUbl, obracunajUbl, SEF_CUSTOMIZATION_ID, type UblFaktura } from "./sef-ubl";

const prodavac = {
  naziv: "NATAŠA HARTWEGER PR STUDIO",
  pib: "108712117",
  maticniBroj: "64000000",
  ulica: "Jurija Gagarina 20",
  grad: "Beograd",
  email: "info@hartweger.rs",
};

const kupac = {
  naziv: "PROBA DOO & SIN",
  pib: "109925860",
  maticniBroj: "21268372",
  ulica: "Save Kovačevića 296",
  grad: "Novi Pazar",
  email: "racunovodstvo@proba.rs",
};

function faktura(over: Partial<UblFaktura> = {}): UblFaktura {
  return {
    broj: "2026-408",
    datumIzdavanja: "2026-08-26",
    datumPrometa: "2026-08-26",
    datumValute: "2026-09-02",
    prodavac,
    kupac,
    racun: "160-6000001689258-40",
    pozivNaBroj: "2026-408",
    stavke: [{ opis: "Individualni kurs A2.1", jedinicnaSaPdv: 38500, kolicina: 1 }],
    ukupnoSaPdv: 38500,
    ...over,
  };
}

describe("obracunajUbl", () => {
  it("PDV je tačno 20% osnovice, na dve decimale", () => {
    const o = obracunajUbl(faktura());
    expect(o.ukupnoNeto).toBe(32083.33);
    expect(o.pdv).toBe(6416.67);
    // Ovo je provera koju SEF radi i zbog koje bi cele dinare odbio.
    expect(o.pdv).toBe(Math.round(o.ukupnoNeto * 0.2 * 100) / 100);
  });

  it("iznos linije je tačno cena puta količina", () => {
    const o = obracunajUbl(
      faktura({
        stavke: [{ opis: "Grupni kurs A2.1", jedinicnaSaPdv: 19600, kolicina: 2 }],
        ukupnoSaPdv: 39200,
      }),
    );
    expect(o.linije[0].cenaBezPdv).toBe(16333.33);
    expect(o.linije[0].neto).toBe(32666.66);
    expect(o.linije[0].neto).toBe(Math.round(o.linije[0].cenaBezPdv * 2 * 100) / 100);
  });

  it("razlika prema naplaćenom iznosu ide u zaokruženje, ne u PDV", () => {
    const f = faktura({
      stavke: [
        { opis: "Individualni kurs A2.1", jedinicnaSaPdv: 38500, kolicina: 1 },
        { opis: "Grupni kurs A2.1", jedinicnaSaPdv: 19600, kolicina: 2 },
      ],
      ukupnoSaPdv: 77700,
    });
    const o = obracunajUbl(f);
    expect(o.ukupnoBruto + o.zaokruzenje).toBe(f.ukupnoSaPdv);
    expect(Math.abs(o.zaokruzenje)).toBeLessThan(0.1);
  });

  it("nema zaokruženja kad se iznosi lepo poklope", () => {
    const o = obracunajUbl(
      faktura({
        stavke: [{ opis: "Kurs", jedinicnaSaPdv: 12000, kolicina: 1 }],
        ukupnoSaPdv: 12000,
      }),
    );
    expect(o.zaokruzenje).toBe(0);
  });
});

describe("napraviUbl", () => {
  it("nosi srpski profil i tip fakture 380", () => {
    const xml = napraviUbl(faktura());
    expect(xml).toContain(`<cbc:CustomizationID>${SEF_CUSTOMIZATION_ID}</cbc:CustomizationID>`);
    expect(xml).toContain("<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>");
    expect(xml).toContain("<cbc:DocumentCurrencyCode>RSD</cbc:DocumentCurrencyCode>");
  });

  it("PayableAmount je tačno ono što firma plaća", () => {
    const xml = napraviUbl(
      faktura({
        stavke: [
          { opis: "Individualni kurs A2.1", jedinicnaSaPdv: 38500, kolicina: 1 },
          { opis: "Grupni kurs A2.1", jedinicnaSaPdv: 19600, kolicina: 2 },
        ],
        ukupnoSaPdv: 77700,
      }),
    );
    expect(xml).toContain(`<cbc:PayableAmount currencyID="RSD">77700.00</cbc:PayableAmount>`);
    expect(xml).toContain(`<cbc:PayableRoundingAmount currencyID="RSD">0.01</cbc:PayableRoundingAmount>`);
  });

  it("PIB ide sa RS prefiksom u poreskoj shemi, bez prefiksa u EndpointID", () => {
    const xml = napraviUbl(faktura());
    expect(xml).toContain(`<cbc:EndpointID schemeID="9948">108712117</cbc:EndpointID>`);
    expect(xml).toContain("<cbc:CompanyID>RS108712117</cbc:CompanyID>");
    expect(xml).toContain("<cbc:CompanyID>RS109925860</cbc:CompanyID>");
  });

  it("matični broj ide u PartyLegalEntity, ne u poresku shemu", () => {
    const xml = napraviUbl(faktura());
    expect(xml).toMatch(/<cac:PartyLegalEntity>[\s\S]*?<cbc:CompanyID>64000000<\/cbc:CompanyID>/);
    expect(xml).toMatch(/<cac:PartyLegalEntity>[\s\S]*?<cbc:CompanyID>21268372<\/cbc:CompanyID>/);
  });

  it("račun i poziv na broj su u PaymentMeans", () => {
    const xml = napraviUbl(faktura());
    expect(xml).toContain("<cbc:ID>160-6000001689258-40</cbc:ID>");
    expect(xml).toContain("<cbc:PaymentID>2026-408</cbc:PaymentID>");
  });

  it("ampersand u nazivu firme ne razbija XML", () => {
    const xml = napraviUbl(faktura());
    expect(xml).toContain("PROBA DOO &amp; SIN");
    expect(xml).not.toContain("PROBA DOO & SIN");
  });

  it("svaka stavka dobija svoj redni broj i liniju", () => {
    const xml = napraviUbl(
      faktura({
        stavke: [
          { opis: "Prvi", jedinicnaSaPdv: 10000, kolicina: 1 },
          { opis: "Drugi", jedinicnaSaPdv: 20000, kolicina: 3 },
        ],
        ukupnoSaPdv: 70000,
      }),
    );
    expect((xml.match(/<cac:InvoiceLine>/g) ?? []).length).toBe(2);
    expect(xml).toContain(`<cbc:InvoicedQuantity unitCode="H87">3</cbc:InvoicedQuantity>`);
  });

  it("zbir linija se poklapa sa LineExtensionAmount", () => {
    const f = faktura({
      stavke: [
        { opis: "Prvi", jedinicnaSaPdv: 38500, kolicina: 1 },
        { opis: "Drugi", jedinicnaSaPdv: 19600, kolicina: 2 },
      ],
      ukupnoSaPdv: 77700,
    });
    const o = obracunajUbl(f);
    const xml = napraviUbl(f);
    const linije = [...xml.matchAll(/<cbc:LineExtensionAmount currencyID="RSD">([\d.]+)<\/cbc:LineExtensionAmount>/g)]
      .map((m) => Number(m[1]));
    // Prvi pogodak je zbir u LegalMonetaryTotal, ostali su linije.
    const zbirLinija = linije.slice(1).reduce((a, n) => a + n, 0);
    expect(Math.round(zbirLinija * 100) / 100).toBe(o.ukupnoNeto);
  });

  it("redosled elemenata prati UBL sekvencu", () => {
    // SEF je 26.08.2026. odbio XML sa porukom „has invalid child element 'Delivery'"
    // jer su Delivery i PaymentMeans stajali PRE stranaka. UBL 2.1 ima propisan
    // redosled i ne prašta. Objavljeni primeri ga prikazuju drugačije - ne veruj im.
    const xml = napraviUbl(faktura());
    const redosled = [...xml.matchAll(/<cac:(\w+)>/g)]
      .map((m) => m[1])
      .filter((t) =>
        [
          "InvoicePeriod", "AccountingSupplierParty", "AccountingCustomerParty",
          "Delivery", "PaymentMeans", "TaxTotal", "LegalMonetaryTotal", "InvoiceLine",
        ].includes(t),
      );
    expect(redosled).toEqual([
      "InvoicePeriod",
      "AccountingSupplierParty",
      "AccountingCustomerParty",
      "Delivery",
      "PaymentMeans",
      "TaxTotal",
      "LegalMonetaryTotal",
      "InvoiceLine",
    ]);
  });

  it("bez stavki baca grešku umesto praznog XML-a", () => {
    expect(() => napraviUbl(faktura({ stavke: [] }))).toThrow("Faktura bez stavki");
  });
});
