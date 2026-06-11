import { describe, it, expect } from "vitest";
import { monthKey, kategorijaForItem, allocateOrderTotal, type FinOrder, expenseMonthsInYear, type ExpenseRow, buildFinansije, type FinansijeInput } from "./finansije";

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

function fixture(overrides: Partial<FinansijeInput> = {}): FinansijeInput {
  return {
    year: 2026, mesec: null, nowKey: "2026-06",
    orders: [
      // jun: video kurs 9000 (Ana)
      { id: "o1", user_id: "ana", created_at: "2026-06-03T10:00:00Z", total: 9000,
        items: [{ course_id: "c-video", course_slug: "osnove-gramatike", title: "Gramatika", price: 9000 }] },
      // jun: grupni 6000 (Maja, članica grupe g1)
      { id: "o2", user_id: "maja", created_at: "2026-06-05T10:00:00Z", total: 6000,
        items: [{ course_id: "c-grupni", course_slug: "grupni-a1", title: "Grupni A1", price: 6000 }] },
      // maj: individualni 14000 (Ivan, prof Hristina)
      { id: "o3", user_id: "ivan", created_at: "2026-05-10T10:00:00Z", total: 14000,
        items: [{ course_id: "c-ind", course_slug: "nemacki-1na1-a1", title: "1:1 A1", price: 14000 }] },
      // jun: individualni obnova (Ivan, prof Hristina) — 2. mesec plaćanja → retencija 2
      { id: "o4", user_id: "ivan", created_at: "2026-06-10T10:00:00Z", total: 14000,
        items: [{ course_id: "c-ind", course_slug: "nemacki-1na1-a1", title: "1:1 A1", price: 14000 }] },
    ],
    courses: [
      { id: "c-video", title: "Gramatika", slug: "osnove-gramatike", course_type: "video" },
      { id: "c-grupni", title: "Grupni A1", slug: "grupni-a1", course_type: "group" },
      { id: "c-ind", title: "1:1 A1", slug: "nemacki-1na1-a1", course_type: "individual" },
    ],
    professors: [
      { id: "p-hristina", full_name: "Hristina", honorar_ind: 1400, honorar_grp: 1600 },
      { id: "p-katarina", full_name: "Katarina", honorar_ind: 1600, honorar_grp: 1800 },
    ],
    lessons: [
      { lesson_date: "2026-06-02", professor_id: "p-hristina", course_id: "c-ind" },
      { lesson_date: "2026-06-09", professor_id: "p-hristina", course_id: "c-ind" },
    ],
    sessions: [
      { session_date: "2026-06-04", professor_id: "p-katarina", group_id: "g1", course_id: "c-grupni" },
      { session_date: "2026-06-11", professor_id: "p-katarina", group_id: "g1", course_id: "c-grupni" },
    ],
    expenses: [
      { id: "e1", name: "Meta oglasi", category: "marketing", amount: 5000, course_id: null,
        expense_date: "2026-06-01", recurring: false, ended_at: null, note: null },
      { id: "e2", name: "Snimanje videa", category: "materijali", amount: 3000, course_id: "c-video",
        expense_date: "2026-06-01", recurring: false, ended_at: null, note: null },
    ],
    indProfByOrderId: { o3: "p-hristina", o4: "p-hristina" },
    indEnrollments: [{ professor_id: "p-hristina", user_id: "ivan", status: "active" }],
    groups: [{ id: "g1", level: "A1.1", status: "u_toku", max_seats: 6, professor_id: "p-katarina",
      purchasable_course_id: "c-grupni", session_time: "ut/čet 18h" }],
    groupMembers: [{ group_id: "g1", user_id: "maja", status: "active" }],
    ...overrides,
  };
}

describe("buildFinansije — P&L po mesecima", () => {
  it("prihod po kategoriji pada u pravi mesec", () => {
    const d = buildFinansije(fixture());
    const jun = d.months[5];
    expect(jun.prihod.video).toBe(9000);
    expect(jun.prihod.grupni).toBe(6000);
    expect(jun.prihod.individualni).toBe(14000);
    expect(jun.prihodUkupno).toBe(29000);
    expect(d.months[4].prihodUkupno).toBe(14000); // maj
  });
  it("honorari po profesorki: časovi × stopa", () => {
    const jun = buildFinansije(fixture()).months[5];
    expect(jun.honorari["p-hristina"]).toBe(2 * 1400);
    expect(jun.honorari["p-katarina"]).toBe(2 * 1800); // Katarina grp stopa je 1800 (premium)
    expect(jun.honorariUkupno).toBe(2800 + 3600);
  });
  it("troškovi po kategoriji i neto", () => {
    const jun = buildFinansije(fixture()).months[5];
    expect(jun.troskovi.marketing).toBe(5000);
    expect(jun.troskovi.materijali).toBe(3000);
    expect(jun.neto).toBe(29000 - 6400 - 8000);
  });
  it("totals za celu godinu", () => {
    const d = buildFinansije(fixture());
    expect(d.totals.prihod).toBe(43000);
    expect(d.totals.honorari).toBe(6400);
    expect(d.totals.troskovi).toBe(8000);
    expect(d.totals.neto).toBe(43000 - 14400);
    expect(d.totals.marzaPct).toBe(Math.round(((43000 - 14400) / 43000) * 100));
  });
  it("porudžbine van godine ne ulaze u months", () => {
    const f = fixture();
    f.orders.push({ id: "o5", user_id: "x", created_at: "2025-12-01T10:00:00Z", total: 99999,
      items: [{ course_id: "c-video", course_slug: "osnove-gramatike", title: "G", price: 99999 }] });
    expect(buildFinansije(f).totals.prihod).toBe(43000);
  });
});

describe("buildFinansije — marže po kursevima", () => {
  it("kurs: prihod − honorar − direktni troškovi", () => {
    const d = buildFinansije(fixture());
    const video = d.kursevi.find((k) => k.course_id === "c-video")!;
    expect(video.prihod).toBe(9000);
    expect(video.honorar).toBe(0);
    expect(video.direktniTroskovi).toBe(3000);
    expect(video.marza).toBe(6000);
    const ind = d.kursevi.find((k) => k.course_id === "c-ind")!;
    expect(ind.prihod).toBe(28000);
    expect(ind.honorar).toBe(2800);
    expect(ind.marza).toBe(25200);
  });
  it("opšti troškovi = nealocirani; kursevi sortirani po marži", () => {
    const d = buildFinansije(fixture());
    expect(d.opstiTroskovi).toBe(5000);
    const marze = d.kursevi.map((k) => k.marza);
    expect([...marze].sort((a, b) => b - a)).toEqual(marze);
  });
  it("mesec filter sužava sekcije, ali ne P&L", () => {
    const d = buildFinansije(fixture({ mesec: 5 })); // samo maj
    const ind = d.kursevi.find((k) => k.course_id === "c-ind")!;
    expect(ind.prihod).toBe(14000);  // samo majska porudžbina
    expect(ind.honorar).toBe(0);     // junski časovi ispadaju
    expect(d.months[5].prihodUkupno).toBe(29000); // P&L i dalje cela godina
  });
});
