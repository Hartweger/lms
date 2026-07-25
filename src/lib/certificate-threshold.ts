/**
 * Prag za sertifikat - jedno mesto istine. Server ga primenjuje (certificate-check),
 * klijent ga samo prikazuje (ExerciseRunner). Ako se raziđu, polaznik vidi „Položio/la!"
 * a sertifikat ne stigne - zato oba koriste ove funkcije.
 *
 * Podrazumevano: ≥60% (svi nivoi A1-B2).
 * nemacki-c1-1: STROGO iznad 60% (Nataša, 25.07.2026) - 15/25 nije dovoljno, 16/25 jeste.
 */

/** Kursevi (slug) kod kojih prolaz znači strogo VIŠE od 60%, ne tačno 60%. */
const STRICTLY_ABOVE: ReadonlySet<string> = new Set(["nemacki-c1-1"]);

export function isStrictCourse(courseSlug?: string | null): boolean {
  return !!courseSlug && STRICTLY_ABOVE.has(courseSlug);
}

/**
 * Da li rezultat prolazi prag. Poređenje je celobrojno (score*10 vs total*6) da
 * 15/25 ne bi zbog zaokruživanja ispalo „preko 60%".
 */
export function passesThreshold(score: number, total: number, courseSlug?: string | null): boolean {
  if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0) return false;
  const left = score * 10;
  const right = total * 6;
  return isStrictCourse(courseSlug) ? left > right : left >= right;
}

/** Tekst praga za polaznika: „60%" ili „preko 60%". */
export function passLabel(courseSlug?: string | null): string {
  return isStrictCourse(courseSlug) ? "preko 60%" : "60%";
}
