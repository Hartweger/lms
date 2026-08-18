// Ograničavanje pogađanja PIN-a. Četiri cifre je deset hiljada kombinacija,
// što je ništa ako se sme pogađati bez prestanka.
//
// PRAVILO NASLEĐENO IZ CELOG PROIZVODA: pokvaren podatak nikad ne pada na
// detetovu štetu. Neispravan datum zaključavanja znači „nije zaključano",
// isto kao što pokvaren datum kod bledenja znači „nije izbledelo".

export const POKUSAJA_PRE_ZAKLJUCAVANJA = 5;
export const ZAKLJUCAVANJE_MINUTA = 15;

const MINUT = 60 * 1000;

/**
 * Novo stanje posle pogrešnog PIN-a. Peta greška zaključava na 15 minuta i
 * resetuje brojač, da posle isteka ne zaključa iz prve.
 */
export function stanjePosleGreske(
  pokusaji: number,
  sada: Date
): { pokusaji: number; zakljucanoDo: Date | null } {
  const dosadasnji = Number.isInteger(pokusaji) && pokusaji > 0 ? pokusaji : 0;
  const novi = dosadasnji + 1;
  if (novi >= POKUSAJA_PRE_ZAKLJUCAVANJA) {
    return { pokusaji: 0, zakljucanoDo: new Date(sada.getTime() + ZAKLJUCAVANJE_MINUTA * MINUT) };
  }
  return { pokusaji: novi, zakljucanoDo: null };
}

export function jeZakljucano(zakljucanoDo: string | null, sada: Date): boolean {
  if (!zakljucanoDo) return false;
  const t = Date.parse(zakljucanoDo);
  // Pokvaren datum ne sme da zaključa dete.
  if (!Number.isFinite(t)) return false;
  return t > sada.getTime();
}

/** Koliko minuta još, zaokruženo naviše, da poruka nikad ne kaže „0 minuta". */
export function preostaloMinuta(zakljucanoDo: string | null, sada: Date): number {
  if (!jeZakljucano(zakljucanoDo, sada)) return 0;
  const t = Date.parse(zakljucanoDo as string);
  return Math.max(1, Math.ceil((t - sada.getTime()) / MINUT));
}
