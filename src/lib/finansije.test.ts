import { describe, it, expect } from "vitest";
import { monthKey, kategorijaForItem, allocateOrderTotal, type FinOrder, expenseMonthsInYear, type ExpenseRow } from "./finansije";

describe("monthKey", () => {
  it("vraća yyyy-mm iz ISO datuma", () => {
    expect(monthKey("2026-06-11")).toBe("2026-06");
    expect(monthKey("2026-06-11T14:30:00.000Z")).toBe("2026-06");
  });
});

describe("kategorijaForItem", () => {
  it("prepoznaje kategorije po slug-u", () => {
    expect(kategorijaForItem("video-a1", null)).toBe("video");
    expect(kategorijaForItem("grupni-a1", null)).toBe("grupni");
    expect(kategorijaForItem("paket-a1-a2", null)).toBe("paket");
  });
  it("koristi course_type kad slug nije prefiksiran", () => {
    expect(kategorijaForItem("nemacki-1na1-a1", "individual")).toBe("individualni");
    expect(kategorijaForItem("osnove-gramatike", "video")).toBe("video");
  });
  it("paket ima prednost nad course_type", () => {
    expect(kategorijaForItem("paket-a1-a2", "video")).toBe("paket");
  });
  it("nepoznato → ostalo", () => {
    expect(kategorijaForItem("nesto", null)).toBe("ostalo");
  });
});

describe("allocateOrderTotal", () => {
  const order = (total: number, prices: number[]): FinOrder => ({
    id: "o1", user_id: "u1", created_at: "2026-06-01T10:00:00Z", total,
    items: prices.map((p, i) => ({ course_id: `c${i}`, course_slug: `kurs-${i}`, title: `Kurs ${i}`, price: p })),
  });

  it("jedna stavka dobija ceo total (i kad postoji popust)", () => {
    expect(allocateOrderTotal(order(9000, [12000]))).toEqual([
      { course_id: "c0", course_slug: "kurs-0", amount: 9000 },
    ]);
  });
  it("popust se deli proporcionalno i zbir = total", () => {
    // 12000 + 6000 = 18000, total 9000 → pola: 6000 + 3000
    const a = allocateOrderTotal(order(9000, [12000, 6000]));
    expect(a.map((x) => x.amount)).toEqual([6000, 3000]);
    expect(a.reduce((s, x) => s + x.amount, 0)).toBe(9000);
  });
  it("zaokruživanje ne gubi dinar — poslednja stavka pokupi ostatak", () => {
    const a = allocateOrderTotal(order(10000, [3000, 3000, 3000]));
    expect(a.reduce((s, x) => s + x.amount, 0)).toBe(10000);
  });
  it("bez stavki → prazno; cene 0 → sve na prvu stavku", () => {
    expect(allocateOrderTotal(order(5000, []))).toEqual([]);
    expect(allocateOrderTotal(order(5000, [0, 0]))[0].amount).toBe(5000);
  });
});

describe("expenseMonthsInYear", () => {
  const base: ExpenseRow = {
    id: "e1", name: "Vercel", category: "alati-hosting", amount: 2500,
    course_id: null, expense_date: "2026-03-15", recurring: false, ended_at: null, note: null,
  };

  it("jednokratni pada samo u svoj mesec", () => {
    expect(expenseMonthsInYear(base, 2026, "2026-06")).toEqual([3]);
    expect(expenseMonthsInYear(base, 2025, "2026-06")).toEqual([]);
  });
  it("mesečni bez kraja važi od početka do tekućeg meseca", () => {
    const e = { ...base, recurring: true };
    expect(expenseMonthsInYear(e, 2026, "2026-06")).toEqual([3, 4, 5, 6]);
  });
  it("mesečni sa krajem staje u mesecu ended_at", () => {
    const e = { ...base, recurring: true, ended_at: "2026-05-01" };
    expect(expenseMonthsInYear(e, 2026, "2026-12")).toEqual([3, 4, 5]);
  });
  it("mesečni pokriva celu narednu godinu do tekućeg meseca", () => {
    const e = { ...base, expense_date: "2025-11-01", recurring: true };
    expect(expenseMonthsInYear(e, 2026, "2026-02")).toEqual([1, 2]);
  });
});
