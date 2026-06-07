import { describe, it, expect } from "vitest";
import { canDeleteOrder, orderTotals, orderFiscalStatus } from "./order-utils";

describe("canDeleteOrder", () => {
  it("dozvoljava brisanje pending narudžbine koja nije dodeljena", () =>
    expect(canDeleteOrder({ payment_status: "pending", granted: false })).toBe(true));

  it("zabranjuje brisanje potvrđene narudžbine", () =>
    expect(canDeleteOrder({ payment_status: "completed", granted: true })).toBe(false));

  it("zabranjuje brisanje ako je pristup dodeljen iako je status pending", () =>
    expect(canDeleteOrder({ payment_status: "pending", granted: true })).toBe(false));

  it("zabranjuje brisanje ako je status completed a granted false (fiskalizovano može da postoji)", () =>
    expect(canDeleteOrder({ payment_status: "completed", granted: false })).toBe(false));
});

describe("orderTotals", () => {
  it("zbraja potvrđene i pending iznose odvojeno", () =>
    expect(
      orderTotals([
        { payment_status: "completed", total: 3500 },
        { payment_status: "completed", total: 1500 },
        { payment_status: "pending", total: 2000 },
      ])
    ).toEqual({ confirmed: 5000, pending: 2000 }));

  it("prazna lista daje nule", () =>
    expect(orderTotals([])).toEqual({ confirmed: 0, pending: 0 }));

  it("ignoriše ostale statuse (npr. refunded) u oba zbira", () =>
    expect(
      orderTotals([
        { payment_status: "refunded", total: 9999 },
        { payment_status: "completed", total: 100 },
      ])
    ).toEqual({ confirmed: 100, pending: 0 }));
});

describe("orderFiscalStatus", () => {
  it("pending narudžbina nema fiskalni status (računa još nema)", () =>
    expect(orderFiscalStatus({ payment_status: "pending", fiscalized_at: null })).toBe("na"));

  it("potvrđena + fiskalizovana je ok", () =>
    expect(
      orderFiscalStatus({ payment_status: "completed", fiscalized_at: "2026-06-07T10:00:00Z" })
    ).toBe("ok"));

  it("potvrđena bez fiskalizacije je missing (upozorenje)", () =>
    expect(orderFiscalStatus({ payment_status: "completed", fiscalized_at: null })).toBe("missing"));
});
