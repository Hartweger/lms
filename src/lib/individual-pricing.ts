// src/lib/individual-pricing.ts
// Čiste funkcije nad product_variants za individualne kurseve. Bez I/O.

export interface ProfRef { id: string; full_name: string }
export interface Variant {
  id: string;
  professor_id: string | null;
  package_type: string | null;
  price: number;
  paypal_price_eur: number | null;
  professor?: ProfRef | null;
}

/** Distinct profesorke iz varijacija, u zatečenom redosledu. */
export function professorsFromVariants(variants: Variant[]): ProfRef[] {
  const seen = new Set<string>();
  const out: ProfRef[] = [];
  for (const v of variants) {
    if (v.professor && v.professor_id && !seen.has(v.professor_id)) {
      seen.add(v.professor_id);
      out.push({ id: v.professor.id, full_name: v.professor.full_name });
    }
  }
  return out;
}

/** Sortirani distinct package_type-ovi (prazno za "po nivou"). */
export function packageTypesFromVariants(variants: Variant[]): string[] {
  const set = new Set<string>();
  for (const v of variants) if (v.package_type) set.add(v.package_type);
  return Array.from(set).sort();
}

/** Razreši varijaciju po (professorId, packageType). null ako ne postoji. */
export function resolveVariant(
  variants: Variant[],
  sel: { professorId: string | null; packageType: string | null },
): Variant | null {
  return variants.find(
    (v) => v.professor_id === sel.professorId && (v.package_type ?? null) === (sel.packageType ?? null),
  ) ?? null;
}

/** Broj časova: paketX → X, inače included_lessons kursa. */
export function lessonsForVariant(variant: { package_type: string | null }, includedLessons: number | null): number {
  if (variant.package_type) {
    const m = variant.package_type.match(/(\d+)/);
    if (m) return parseInt(m[1], 10);
  }
  return includedLessons ?? 0;
}
