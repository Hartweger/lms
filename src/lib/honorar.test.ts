import { describe, it, expect } from "vitest";
import { computeHonorar, previousMonth, monthDateRange, aggregateMonthly, computeBalance, sumActivities } from "./honorar";
import { computeSessionDates } from "./groups";

describe("computeHonorar", () => {
  it("standardna rata 1400/1600", () => {
    expect(computeHonorar(10, 3, 1400, 1600)).toEqual({ ind: 10, grp: 3, indTotal: 14000, grpTotal: 4800, total: 18800 });
  });
  it("Katarina premium 1600/1800", () => {
    expect(computeHonorar(5, 2, 1600, 1800)).toEqual({ ind: 5, grp: 2, indTotal: 8000, grpTotal: 3600, total: 11600 });
  });
  it("nula časova", () => {
    expect(computeHonorar(0, 0, 1400, 1600).total).toBe(0);
  });
});

describe("previousMonth", () => {
  it("jul → jun iste godine", () => {
    expect(previousMonth(new Date("2026-07-15T00:00:00Z"))).toEqual({ year: 2026, month: 6, label: "jun 2026." });
  });
  it("januar → decembar prethodne", () => {
    expect(previousMonth(new Date("2026-01-03T00:00:00Z"))).toEqual({ year: 2025, month: 12, label: "decembar 2025." });
  });
});

describe("monthDateRange", () => {
  it("jun 2026", () => {
    expect(monthDateRange(2026, 6)).toEqual({ from: "2026-06-01", toExclusive: "2026-07-01" });
  });
  it("decembar → januar sledeće", () => {
    expect(monthDateRange(2025, 12)).toEqual({ from: "2025-12-01", toExclusive: "2026-01-01" });
  });
});

describe("aggregateMonthly", () => {
  it("grupiše po mesecima i sabira godinu, ignoriše druge godine", () => {
    const r = aggregateMonthly(
      2026,
      ["2026-06-05", "2026-06-12", "2026-07-01", "2025-06-01"], // 2 u junu, 1 u julu, 1 lani (ignoriše)
      ["2026-06-03"], // 1 grp u junu
      1400, 1600,
    );
    expect(r.months[5]).toEqual({ month: 6, ind: 2, grp: 1, indTotal: 2800, grpTotal: 1600, total: 4400 }); // jun
    expect(r.months[6].total).toBe(1400); // jul: 1 ind
    expect(r.yearTotal).toBe(5800); // 4400 + 1400
  });
});

describe("computeSessionDates", () => {
  it("2 dana × 2 nedelje = 4 datuma od ponedeljka", () => {
    // 2026-06-01 je ponedeljak. dani [1=pon, 3=sre], 2 nedelje.
    expect(computeSessionDates("2026-06-01", [1, 3], 2)).toEqual(["2026-06-01", "2026-06-03", "2026-06-08", "2026-06-10"]);
  });
  it("prazno bez podataka", () => {
    expect(computeSessionDates(null, [1], 2)).toEqual([]);
    expect(computeSessionDates("2026-06-01", [], 2)).toEqual([]);
  });
});

describe("sumActivities", () => {
  it("sabira samo odobrene aktivnosti", () => {
    const rows = [
      { amount: 3000, status: "odobreno" as const },
      { amount: 1500, status: "na_cekanju" as const },
      { amount: 2000, status: "odbijeno" as const },
      { amount: 500, status: "odobreno" as const },
    ];
    expect(sumActivities(rows)).toBe(3500);
  });
  it("prazno → 0", () => {
    expect(sumActivities([])).toBe(0);
  });
});

describe("computeBalance", () => {
  it("zarađeno (časovi + aktivnosti) − isplaćeno", () => {
    expect(computeBalance(18800, 3500, 20000)).toEqual({
      earnedLessons: 18800, earnedActivities: 3500, earned: 22300, paid: 20000, balance: 2300,
    });
  });
  it("preplata daje negativan saldo", () => {
    expect(computeBalance(5000, 0, 8000).balance).toBe(-3000);
  });
  it("sve nule", () => {
    expect(computeBalance(0, 0, 0)).toEqual({
      earnedLessons: 0, earnedActivities: 0, earned: 0, paid: 0, balance: 0,
    });
  });
});
