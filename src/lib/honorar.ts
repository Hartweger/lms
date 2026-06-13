// src/lib/honorar.ts - čiste funkcije za mesečni obračun honorara. Bez I/O.

export interface HonorarResult {
  ind: number; grp: number;
  indTotal: number; grpTotal: number; total: number;
}

/** Obračun: ind časovi × rata + grp sesije × rata. */
export function computeHonorar(ind: number, grp: number, rateInd: number, rateGrp: number): HonorarResult {
  const indTotal = ind * rateInd;
  const grpTotal = grp * rateGrp;
  return { ind, grp, indTotal, grpTotal, total: indTotal + grpTotal };
}

export const MESECI = ["januar","februar","mart","april","maj","jun","jul","avgust","septembar","oktobar","novembar","decembar"];

export interface MonthHonorar { month: number; ind: number; grp: number; indTotal: number; grpTotal: number; total: number }

/** Agregacija honorara po mesecima za godinu, iz lista datuma časova/sesija (yyyy-mm-dd). */
export function aggregateMonthly(year: number, indDates: string[], grpDates: string[], rateInd: number, rateGrp: number): { months: MonthHonorar[]; yearTotal: number } {
  const months: MonthHonorar[] = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, ind: 0, grp: 0, indTotal: 0, grpTotal: 0, total: 0 }));
  const bump = (dates: string[], key: "ind" | "grp") => {
    for (const d of dates) {
      const [y, m] = String(d).split("-").map(Number);
      if (y === year && m >= 1 && m <= 12) months[m - 1][key]++;
    }
  };
  bump(indDates, "ind");
  bump(grpDates, "grp");
  let yearTotal = 0;
  for (const mo of months) {
    const h = computeHonorar(mo.ind, mo.grp, rateInd, rateGrp);
    mo.indTotal = h.indTotal; mo.grpTotal = h.grpTotal; mo.total = h.total;
    yearTotal += h.total;
  }
  return { months, yearTotal };
}

/** Prethodni mesec u odnosu na dati datum → { year, month(1-12), label }. */
export function previousMonth(now: Date): { year: number; month: number; label: string } {
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth(); // 0-11 = prethodni mesec (jer getUTCMonth daje tekući 0-indeksiran)
  if (month === 0) { month = 12; year -= 1; } // januar → decembar prethodne godine
  return { year, month, label: `${MESECI[month - 1]} ${year}.` };
}

/** Opseg datuma meseca za upit: [from, toExclusive) u "yyyy-mm-dd". */
export function monthDateRange(year: number, month: number): { from: string; toExclusive: string } {
  const p2 = (n: number) => String(n).padStart(2, "0");
  const from = `${year}-${p2(month)}-01`;
  const ny = month === 12 ? year + 1 : year;
  const nm = month === 12 ? 1 : month + 1;
  const toExclusive = `${ny}-${p2(nm)}-01`;
  return { from, toExclusive };
}

/** Zbir samo odobrenih dodatnih aktivnosti. */
export function sumActivities(rows: { amount: number; status: "na_cekanju" | "odobreno" | "odbijeno" }[]): number {
  return rows.reduce((s, r) => (r.status === "odobreno" ? s + (r.amount || 0) : s), 0);
}

export interface BalanceResult {
  earnedLessons: number; earnedActivities: number; earned: number; paid: number; balance: number;
}

/** Saldo profesorke: (zarada od časova + odobrene aktivnosti) − isplaćeno. */
export function computeBalance(earnedLessons: number, earnedActivities: number, paid: number): BalanceResult {
  const earned = earnedLessons + earnedActivities;
  return { earnedLessons, earnedActivities, earned, paid, balance: earned - paid };
}
