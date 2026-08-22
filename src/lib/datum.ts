// Datum ispisan onako kako ga čovek čita: „15. septembra 2026".
//
// Postoji jer je `toLocaleDateString("sr-RS")` davao „15. 9. 2026", pa je isti
// rok u istom mejlu umeo da stoji u dva oblika. Mesec je u GENITIVU, jer se
// uvek pojavljuje u konstrukciji „do 15. septembra".
//
// NAMERNO BEZ IJEDNOG UVOZA - koriste ga i klijentske komponente i vitest.

const MESECI_GENITIV = [
  "januara", "februara", "marta", "aprila", "maja", "juna",
  "jula", "avgusta", "septembra", "oktobra", "novembra", "decembra",
] as const;

/**
 * Beograd, ne UTC: rok „2026-09-15T00:00:00+02:00" u UTC-u pada na 14. septembar
 * u 22h, pa bi bez zone pisalo „14. septembra" - dan manje nego što roditelju
 * stvarno traje.
 */
export function datumSlovima(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  const delovi = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(d);
  const uzmi = (tip: string) => Number(delovi.find((p) => p.type === tip)?.value ?? "0");
  const dan = uzmi("day");
  const mesec = uzmi("month");
  const godina = uzmi("year");
  if (!dan || !mesec || !godina) return "";
  return `${dan}. ${MESECI_GENITIV[mesec - 1]} ${godina}`;
}
