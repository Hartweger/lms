// Faza učenja reči: kartice u malim grupama, posle svake grupe kratka provera.
// Bez srca i bez upisa grešaka - uči se rukama, greška ovde nije podatak.
import { napraviPitanja, type Pitanje } from "./pitanja";
import type { Rec } from "./rec";

/** Najviše kartica u jednoj grupi. Preko toga učenje postaje čitanje. */
export const GRUPA_NAJVISE = 6;

/** Koliko pitanja nosi mini provera jedne grupe. */
export const PROVERA_PITANJA = 3;

/**
 * Reči lekcije u grupama za učenje. Redosled se NE meša: redni_broj je
 * didaktički redosled koji je autor lekcije odredio. Grupe su ujednačene
 * (7 reči je 4+3, ne 6+1), da poslednja grupa ne bude patrljak.
 */
export function napraviGrupe(reci: readonly Rec[]): Rec[][] {
  if (reci.length === 0) return [];
  const poRedu = [...reci].sort((a, b) => a.redni_broj - b.redni_broj);
  const brojGrupa = Math.ceil(poRedu.length / GRUPA_NAJVISE);
  const osnovna = Math.ceil(poRedu.length / brojGrupa);

  const grupe: Rec[][] = [];
  for (let i = 0; i < poRedu.length; i += osnovna) {
    grupe.push(poRedu.slice(i, i + osnovna));
  }
  return grupe;
}

/**
 * Mini provera grupe: pitanja brzog biranja o UPRAVO viđenim rečima, sa
 * pogrešnim odgovorima iz cele lekcije, da izbor ne bude prozirno mali.
 * Nije nova vrsta pitanja - isti tip pokreće i pravu igru brzog biranja.
 */
export function miniProvera(
  grupa: readonly Rec[],
  pool: readonly Rec[],
  rng: () => number
): Pitanje[] {
  return napraviPitanja(grupa, "brzo-biranje", Math.min(PROVERA_PITANJA, grupa.length), rng, pool);
}
