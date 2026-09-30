/**
 * Formatiranje datuma časa za prikaz polazniku. `iso` je uvek "YYYY-MM-DD" (Postgres `date`
 * kolona, već dvocifreno popunjena) - bez Date/toLocaleDateString, da format ne zavisi od
 * lokala/vremenske zone izvršavanja (server je uvek UTC, čas je uvek u našoj zoni).
 */

const MESECI = [
  "januar", "februar", "mart", "april", "maj", "jun",
  "jul", "avgust", "septembar", "oktobar", "novembar", "decembar",
];

/** „28.09." - za listu beleški i setova. */
export function formatLessonDateShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}.${m}.`;
}

/** „28. septembar 2026." - za zaglavlje jedne beleške. */
export function formatLessonDateLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const naziv = MESECI[m - 1] ?? "";
  return `${d}. ${naziv} ${y}.`;
}
