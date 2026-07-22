import { describe, it, expect } from "vitest";
import {
  belgradeDate,
  chargesToProcess,
  MAX_RETRIES,
  retryDecision,
  retryStartDate,
  type RetryState,
} from "./subscription-charges";
import type { RecurringCharge } from "./nestpay-recurring";

const naplata = (n: number, stanje: "ok" | "ceka" | "povracaj" | "pala"): RecurringCharge => ({
  installmentNo: n,
  oid: `2026-300-${n}`,
  transStat: stanje === "ceka" ? "PN" : stanje === "pala" ? "D" : "C",
  amountRsd: stanje === "ceka" || stanje === "pala" ? null : 3199,
  plannedAt: "2026-08-21 14:39:00.0",
  succeeded: stanje === "ok",
  failed: stanje === "pala",
  retryable: stanje === "pala",
  refund: stanje === "povracaj",
});

describe("chargesToProcess", () => {
  it("vraća samo uspele naplate koje još nisu obrađene", () => {
    const r = chargesToProcess(
      [naplata(1, "ok"), naplata(2, "ok"), naplata(3, "ceka")],
      ["2026-300-1"],
    );
    expect(r.map((c) => c.installmentNo)).toEqual([2]);
  });

  it("prazno kad je sve obrađeno", () => {
    expect(chargesToProcess([naplata(1, "ok")], ["2026-300-1"])).toEqual([]);
  });

  it("preskače naplate na čekanju", () => {
    expect(chargesToProcess([naplata(2, "ceka")], [])).toEqual([]);
  });

  it("preskače povraćaj (novac je vraćen, nije naplaćen)", () => {
    expect(chargesToProcess([naplata(2, "povracaj")], [])).toEqual([]);
  });
});

const stanje = (s: Partial<RetryState> = {}): RetryState => ({
  retry_oid: null,
  retry_count: 0,
  retry_planned_for: null,
  ...s,
});

describe("retryDecision", () => {
  it("bez pale naplate nema šta da se radi", () => {
    expect(retryDecision(stanje(), undefined, "2026-07-22")).toBe("none");
  });

  it("novu palu naplatu odmah ponovo inicira", () => {
    expect(retryDecision(stanje(), naplata(2, "pala"), "2026-07-22")).toBe("retry");
  });

  it("čeka dok zakazani pokušaj ne dođe na red", () => {
    // Update je juče zakazao pokušaj za danas; termin serije možda još nije prošao.
    // Bez ovoga bi se STARTDATE svakog jutra pomerao i naplata se nikad ne bi desila.
    const s = stanje({ retry_oid: "2026-300-2", retry_count: 1, retry_planned_for: "2026-07-22" });
    expect(retryDecision(s, naplata(2, "pala"), "2026-07-22")).toBe("wait");
  });

  it("kad zakazani datum prođe a naplata je i dalje pala, pokušava ponovo", () => {
    const s = stanje({ retry_oid: "2026-300-2", retry_count: 1, retry_planned_for: "2026-07-22" });
    expect(retryDecision(s, naplata(2, "pala"), "2026-07-23")).toBe("retry");
  });

  it("posle 30 pokušaja odustaje (bankina granica)", () => {
    const s = stanje({ retry_oid: "2026-300-2", retry_count: MAX_RETRIES, retry_planned_for: "2026-07-21" });
    expect(retryDecision(s, naplata(2, "pala"), "2026-07-22")).toBe("exhausted");
  });

  it("druga pala naplata kreće sa brojačem od nule", () => {
    // Brojač od 30 važi PO NAPLATI: iscrpljen brojač rate 2 ne sme da blokira ratu 5.
    const s = stanje({ retry_oid: "2026-300-2", retry_count: MAX_RETRIES, retry_planned_for: "2026-07-21" });
    expect(retryDecision(s, naplata(5, "pala"), "2026-07-22")).toBe("retry");
  });
});

describe("retryStartDate", () => {
  it("zakazuje za sutra po beogradskom kalendaru", () => {
    // Cron ide u 5h UTC; termin serije je u satu inicijalne kupovine i danas je
    // možda već prošao, pa je sutra jedini nedvosmislen izbor.
    expect(retryStartDate(new Date("2026-07-22T03:00:00Z"))).toBe("2026-07-23");
  });
});

describe("belgradeDate", () => {
  it("kasno veče po UTC je već sutra u Beogradu", () => {
    expect(belgradeDate(new Date("2026-07-22T22:30:00Z"))).toBe("2026-07-23");
  });
});
