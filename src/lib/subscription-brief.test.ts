import { describe, it, expect } from "vitest";
import { buildSubscriptionBrief, rataIzOida } from "./subscription-brief";

const prazno = { naplaceneRate: [], aktivne: [], otkazane: [] };

describe("rataIzOida", () => {
  it("čita redni broj rate iz oid-a banke", () => {
    expect(rataIzOida("2026-227-3", "2026-227")).toBe(3);
  });

  it("inicijalna naplata nema sufiks - broj porudžbine se ne čita kao rata", () => {
    expect(rataIzOida("2026-227", "2026-227")).toBeNull();
  });

  it("oid iz druge serije ne pripada ovoj pretplati", () => {
    expect(rataIzOida("2026-999-2", "2026-227")).toBeNull();
  });
});

describe("buildSubscriptionBrief", () => {
  it("sabira aktivne pretplate u mesečni prihod", () => {
    const b = buildSubscriptionBrief({
      ...prazno,
      aktivne: [
        { ime: "Anja Bunić", amount: 3199, baseOid: "2026-227", retryOid: null, retryCount: 0 },
        { ime: "Sonja Kricak", amount: 3199, baseOid: "2026-228", retryOid: null, retryCount: 0 },
      ],
    });
    expect(b.aktivnih).toBe(2);
    expect(b.mesecno).toBe(6398);
  });

  it("pala naplata se prepoznaje po zakazanom ponovnom pokušaju", () => {
    const b = buildSubscriptionBrief({
      ...prazno,
      aktivne: [
        { ime: "Milan Tošić", amount: 3199, baseOid: "2026-233", retryOid: "2026-233-4", retryCount: 2 },
        { ime: "Anja Bunić", amount: 3199, baseOid: "2026-227", retryOid: null, retryCount: 0 },
      ],
    });
    expect(b.pale).toEqual([{ ime: "Milan Tošić", rata: 4, pokusaj: 2, odbijeno: false }]);
  });

  // Zamka 25.08.2026: dok se `retry_oid` upisivao samo posle prihvaćenog zahteva,
  // odbijena naplata (Sonja Kricak, rata 2) nije ulazila u pregled uopšte - a to je
  // baš slučaj u kome se ništa ne rešava samo od sebe.
  it("odbijen zahtev banci se vidi kao pala naplata, i to označen", () => {
    const b = buildSubscriptionBrief({
      ...prazno,
      aktivne: [
        {
          ime: "Sonja Kricak",
          amount: 3199,
          baseOid: "2026-228",
          retryOid: "2026-228-2",
          retryCount: 1,
          lastRetryError: "<CC5Response><RESULT>Failed</RESULT></CC5Response>",
        },
      ],
    });
    expect(b.pale).toEqual([{ ime: "Sonja Kricak", rata: 2, pokusaj: 1, odbijeno: true }]);
    expect(b.aktivnih).toBe(1);
    expect(b.mesecno).toBe(3199);
  });

  it("pretplata i dalje ulazi u mesečni prihod dok se naplata pokušava", () => {
    const b = buildSubscriptionBrief({
      ...prazno,
      aktivne: [{ ime: "Milan Tošić", amount: 3199, baseOid: "2026-233", retryOid: "2026-233-4", retryCount: 1 }],
    });
    expect(b.mesecno).toBe(3199);
  });

  it("otkazane nose razlog kao čitljiv tekst", () => {
    const b = buildSubscriptionBrief({
      ...prazno,
      otkazane: [
        { ime: "Milena Vukić", paidPayments: 4, totalPayments: 12, cancelReason: "skupo" },
        { ime: "Sonja Kricak", paidPayments: 1, totalPayments: 12, cancelReason: null },
      ],
    });
    expect(b.otkazano).toEqual([
      { ime: "Milena Vukić", placeno: 4, ukupno: 12, razlog: "Preskupo mi je" },
      { ime: "Sonja Kricak", placeno: 1, ukupno: 12, razlog: "bez odgovora" },
    ]);
  });

  it("prenosi juče naplaćene rate", () => {
    const b = buildSubscriptionBrief({
      ...prazno,
      naplaceneRate: [{ ime: "Anja Bunić", rata: 2, ukupno: 12, iznos: 3199 }],
    });
    expect(b.naplaceno).toEqual([{ ime: "Anja Bunić", rata: 2, ukupno: 12, iznos: 3199 }]);
  });

  it("polaznik bez upisanog imena ne ruši izveštaj", () => {
    const b = buildSubscriptionBrief({
      ...prazno,
      naplaceneRate: [{ ime: null, rata: 2, ukupno: 12, iznos: 3199 }],
      aktivne: [{ ime: null, amount: 3199, baseOid: "2026-999", retryOid: "2026-999-2", retryCount: 1 }],
      otkazane: [{ ime: null, paidPayments: 1, totalPayments: 12, cancelReason: null }],
    });
    expect(b.naplaceno[0].ime).toBe("-");
    expect(b.pale[0].ime).toBe("-");
    expect(b.otkazano[0].ime).toBe("-");
  });

  it("bez ijedne pretplate izveštaj je prazan, ne pada", () => {
    const b = buildSubscriptionBrief(prazno);
    expect(b).toEqual({ naplaceno: [], pale: [], otkazano: [], aktivnih: 0, mesecno: 0 });
  });
});

// Odluka Nataše 09.09.2026: pala rata NE traži ništa ručno - cron sam gasi pokušaje
// (CORE-5107), polaznik dobije mejl, pristup se sam vrati kad sledeća rata prođe.
// Do 16.09. se ista odbijena rata ponavljala u pregledu SVAKI dan do kraja serije
// (retry_oid se ne briše), sa tekstom „vidi da li treba ručno".
describe("odbijena pala rata se javlja samo jednom", () => {
  const prozor = { od: "2026-09-15T00:00:00.000Z", do: "2026-09-16T00:00:00.000Z" };
  const sonja = (lastRetryAt: string) => ({
    ime: "Sonja Kricak",
    amount: 3199,
    baseOid: "2026-228",
    retryOid: "2026-228-2",
    retryCount: 30,
    lastRetryError: "CORE-5107 - banka ne prepoznaje zapis",
    lastRetryAt,
  });

  it("odbijena juče - ulazi u pregled", () => {
    const b = buildSubscriptionBrief({ ...prazno, aktivne: [sonja("2026-09-15T03:00:00.000Z")], prozor });
    expect(b.pale).toEqual([{ ime: "Sonja Kricak", rata: 2, pokusaj: 30, odbijeno: true }]);
  });

  it("odbijena pre dva dana - više se ne ponavlja, ali ostaje u mesečnom prihodu", () => {
    const b = buildSubscriptionBrief({ ...prazno, aktivne: [sonja("2026-09-13T03:00:00.000Z")], prozor });
    expect(b.pale).toEqual([]);
    expect(b.aktivnih).toBe(1);
    expect(b.mesecno).toBe(3199);
  });

  it("zakazan ponovni pokušaj (nije odbijen) se i dalje vidi svaki dan dok traje", () => {
    const b = buildSubscriptionBrief({
      ...prazno,
      prozor,
      aktivne: [{ ime: "Milan Tošić", amount: 3199, baseOid: "2026-233", retryOid: "2026-233-4", retryCount: 2, lastRetryAt: "2026-09-01T03:00:00.000Z" }],
    });
    expect(b.pale).toEqual([{ ime: "Milan Tošić", rata: 4, pokusaj: 2, odbijeno: false }]);
  });

  it("bez prozora (stari pozivi) ponašanje je nepromenjeno", () => {
    const b = buildSubscriptionBrief({ ...prazno, aktivne: [sonja("2026-09-01T03:00:00.000Z")] });
    expect(b.pale).toHaveLength(1);
  });
});
