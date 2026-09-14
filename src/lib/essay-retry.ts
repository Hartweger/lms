/**
 * Pravilo za ponovno pisanje Schreiben rada.
 *
 * Ocenjen rad (status „published") se učitava umesto polja za pisanje, pa runnerovo
 * „Pokušaj ponovo" samo ponovo prikaže istu ocenu. Ana M. (A1.2, 14.09.2026) je tako
 * ostala na „Ne znam" 1/5 bez načina da napiše novi rad i dobije sertifikat.
 *
 * Ponovo sme da se piše SAMO pao rad (ispod 60% od maxPoints) - položen rad se ne
 * šalje profesorki na ponovno ocenjivanje. Prag je isti kao za sertifikat.
 */
export function essayPassed(score: number | null | undefined, maxPoints: number): boolean {
  if (typeof score !== "number" || !Number.isFinite(score) || maxPoints <= 0) return false;
  return score * 10 >= maxPoints * 6;
}

export function canRewriteEssay(status: string | null | undefined, score: number | null | undefined, maxPoints: number): boolean {
  return status === "published" && !essayPassed(score, maxPoints);
}
