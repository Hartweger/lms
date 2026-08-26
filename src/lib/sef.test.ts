import { describe, it, expect } from "vitest";
import { izvuciSefId, jeZavrsenStatus, trazipaznju } from "./sef";

describe("izvuciSefId", () => {
  // Spec kaže objekat, ali isti endpoint je objavljen i kao text/plain, pa odgovor
  // ume da bude goli broj. Ako ga ne prepoznamo, faktura je na SEF-u a mi mislimo
  // da nije prošla - i lako je pošaljemo dvaput.
  it("goli broj", () => {
    expect(izvuciSefId(12345)).toBe("12345");
  });

  it("broj kao tekst, i kad je pod navodnicima", () => {
    expect(izvuciSefId("12345")).toBe("12345");
    expect(izvuciSefId(' "12345" ')).toBe("12345");
  });

  it("objekat po specifikaciji", () => {
    expect(izvuciSefId({ salesInvoiceId: 998877, invoiceId: 111 })).toBe("998877");
    expect(izvuciSefId({ invoiceId: 555 })).toBe("555");
  });

  it("ne zavisi od velikog slova u imenu polja", () => {
    expect(izvuciSefId({ InvoiceId: 777 })).toBe("777");
    expect(izvuciSefId({ SalesInvoiceID: 888 })).toBe("888");
  });

  it("id kao tekst unutar objekta", () => {
    expect(izvuciSefId({ invoiceId: "424242" })).toBe("424242");
  });

  it("ne izmišlja id kad ga nema", () => {
    expect(izvuciSefId(null)).toBe(null);
    expect(izvuciSefId({})).toBe(null);
    expect(izvuciSefId("Faktura je primljena")).toBe(null);
    expect(izvuciSefId({ purchaseInvoiceId: 999 })).toBe(null);
    expect(izvuciSefId({ invoiceId: null })).toBe(null);
  });
});

describe("statusi", () => {
  it("završeni statusi se više ne osvežavaju", () => {
    expect(jeZavrsenStatus("Approved")).toBe(true);
    expect(jeZavrsenStatus("Rejected")).toBe(true);
    expect(jeZavrsenStatus("Sent")).toBe(false);
    expect(jeZavrsenStatus(null)).toBe(false);
  });

  it("odbijena i pogrešna traže da neko pogleda", () => {
    expect(trazipaznju("Rejected")).toBe(true);
    expect(trazipaznju("Mistake")).toBe(true);
    expect(trazipaznju("Approved")).toBe(false);
  });
});
