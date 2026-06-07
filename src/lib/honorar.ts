// src/lib/honorar.ts — čiste funkcije za mesečni obračun honorara. Bez I/O.

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

const MESECI = ["januar","februar","mart","april","maj","jun","jul","avgust","septembar","oktobar","novembar","decembar"];

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
