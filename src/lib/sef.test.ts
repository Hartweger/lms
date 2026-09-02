import { describe, it, expect } from "vitest";
import { izvuciSefId, izvuciStatus, poljeIz, jeZavrsenStatus, trazipaznju } from "./sef";

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

  it("pravi odgovor SEF-a: uzima SalesInvoiceId, ne InvoiceId", () => {
    // Zabelezeno na demou 26.08.2026. `InvoiceId` je jednak `PurchaseInvoiceId` -
    // to je broj sa strane PRIMAOCA. Nama treba izlazna faktura, jer po njoj
    // webhook javlja promene statusa.
    expect(
      izvuciSefId({ InvoiceId: 5619601, SalesInvoiceId: 5747642, PurchaseInvoiceId: 5619601 }),
    ).toBe("5747642");
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

describe("izvuciStatus / poljeIz", () => {
  // Pravi odgovor SEF-a, zabeležen 02.09.2026 za fakturu 470879420. Polja su
  // VELIKIM početnim slovom, iako specifikacija navodi mala. Zbog toga je faktura
  // 2026-419 pet dana stajala na „šalje se", a bila je PRIHVAĆENA od 31.08.
  const pravi = {
    Status: "Approved",
    InvoiceId: 470879420,
    GlobUniqId: "8a2983dc-8b68-4d40-af8d-5958b94ea778",
    CirStatus: "None",
    Version: 8,
    LastModifiedUtc: "2026-08-31T10:04:21.5781047+00:00",
  };

  it("čita Status pisan velikim slovom", () => {
    expect(izvuciStatus(pravi)).toBe("Approved");
  });

  it("čita i status pisan malim slovom, kako spec navodi", () => {
    expect(izvuciStatus({ status: "Rejected" })).toBe("Rejected");
  });

  it("bez statusa vraća null, ne izmišlja", () => {
    expect(izvuciStatus({})).toBe(null);
    expect(izvuciStatus(null)).toBe(null);
    expect(izvuciStatus({ Status: "" })).toBe(null);
  });

  it("poljeIz ne zavisi od velikog slova", () => {
    expect(poljeIz(pravi, "invoiceid")).toBe(470879420);
    expect(poljeIz(pravi, "lastModifiedUtc")).toBe("2026-08-31T10:04:21.5781047+00:00");
    expect(poljeIz(pravi, "nema")).toBeUndefined();
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
