import { describe, it, expect } from "vitest";
import { chargesToProcess } from "./subscription-charges";
import type { RecurringCharge } from "./nestpay-recurring";

const naplata = (n: number, stanje: "ok" | "ceka" | "povracaj"): RecurringCharge => ({
  installmentNo: n,
  oid: `2026-300-${n}`,
  transStat: stanje === "ceka" ? "PN" : "C",
  amountRsd: stanje === "ceka" ? null : 3199,
  plannedAt: "2026-08-21 14:39:00.0",
  succeeded: stanje === "ok",
  failed: false,
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
