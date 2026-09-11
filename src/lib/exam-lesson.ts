/**
 * Da li je lekcija ZAVRŠNI ispit (Modelltest) - jedini kontekst u kom se sme izdati
 * sertifikat za ceo kurs, i jedina lekcija koja nema dugme „Završi lekciju".
 *
 * Jedan izvor istine za lekcija stranicu, vezba stranicu, certificate-check i
 * lesson-complete. Zaseban fajl (bez uvoza mejl biblioteke) da bi mogao u
 * klijentski bundle. Regex mora da se poklapa sa ISPIT u
 * scripts/backfill-lesson-progress-ispit.mjs.
 */
export function isExamLessonTitle(title: string | null | undefined): boolean {
  return /Modelltest|Završni ispit/.test(title || "");
}
