// src/lib/hearts/dates.ts
/** Razlika u danima između dva ISO datuma "YYYY-MM-DD" (UTC-sidreno). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}
