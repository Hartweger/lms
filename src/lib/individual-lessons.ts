// src/lib/individual-lessons.ts
// Čiste funkcije za individualne časove (broj preostalih + status upisa). Bez I/O.

/** Preostali časovi u paketu (ne ide ispod 0). */
export function remainingLessons(lessonsUsed: number, packageLessons: number): number {
  return Math.max(0, packageLessons - lessonsUsed);
}

/** Status upisa na osnovu iskorišćenih časova: 'completed' kad je paket potrošen. */
export function computeLessonStatus(lessonsUsed: number, packageLessons: number): "active" | "completed" {
  return packageLessons > 0 && lessonsUsed >= packageLessons ? "completed" : "active";
}

/** Datum YYYY-MM-DD → dd.mm.yyyy. za poruke profesorki. Neispravan ulaz vraća kako jeste. */
export function formatLessonDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}.` : iso;
}

/**
 * Poruka kad za isti upis i isti datum već postoji čas, inače null.
 * Zaštita od dvostrukog slanja: profesorka klikne „Upiši čas", tabela se još osvežava
 * i pokazuje stari broj, pa klikne opet - drugi klik je pravio duplikat.
 * Dvostruki čas istog dana (intenzivna nastava) postoji, zato ovde ne blokiramo nemo
 * nego upućujemo na ručni unos.
 */
export function duplicateLessonError(existingOnDate: number, lessonDate: string): string | null {
  if (existingOnDate <= 0) return null;
  return `Čas za ${formatLessonDate(lessonDate)} je već upisan. Ako je tog dana stvarno održan još jedan čas, javi Nataši - dvostruki čas istog dana se upisuje ručno.`;
}
