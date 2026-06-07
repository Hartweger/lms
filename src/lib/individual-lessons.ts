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
