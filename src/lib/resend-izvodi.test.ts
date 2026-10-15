import { describe, it, expect } from "vitest";
import { jeXmlIzvod, odBanke } from "./resend-izvodi";

describe("jeXmlIzvod", () => {
  it("prepoznaje izvod", () => {
    expect(jeXmlIzvod("[160-6000001689258-40][197].xml", "text/xml")).toBe(true);
  });

  it("preskače potpis koji ide uz svaki mejl banke", () => {
    expect(jeXmlIzvod("smime.p7s", "application/pkcs7-signature")).toBe(false);
  });

  it("preskače PDF verziju istog izvoda", () => {
    expect(jeXmlIzvod("[160-6000001689258-40][197].Pdf", "application/pdf")).toBe(false);
  });

  it("bez imena se oslanja na tip", () => {
    expect(jeXmlIzvod(null, "application/xml")).toBe(true);
    expect(jeXmlIzvod(null, "application/pdf")).toBe(false);
  });
});

describe("odBanke", () => {
  it("prihvata adresu banke, i kad ide uz prikazano ime", () => {
    expect(odBanke("info@mail.bancaintesa.rs")).toBe(true);
    expect(odBanke("Banca Intesa <info@mail.bancaintesa.rs>")).toBe(true);
  });

  it("odbija tuđu poštu", () => {
    expect(odBanke("neko@gmail.com")).toBe(false);
    expect(odBanke(null)).toBe(false);
  });

  it("prikazano ime ne može da se predstavi kao banka", () => {
    // Ime se lako lažira; sudi samo adresa u uglastim zagradama.
    expect(odBanke("info@mail.bancaintesa.rs <napadac@example.com>")).toBe(false);
  });

  it("slična adresa na tuđem domenu ne prolazi", () => {
    expect(odBanke("info@bancaintesa.rs.example.com")).toBe(false);
  });
});
