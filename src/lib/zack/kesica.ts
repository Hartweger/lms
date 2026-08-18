// Šta ulazi u kesicu posle odigrane igre.
// Pravilo: dobija se samo ono što je dete tačno odgovorilo i što još nema,
// a izuzeci (sjajne sličice) su namerno retki, najviše jedan po kesici.
import { promesaj, type Rec } from "./rec";

export const KESICA_NAJVISE = 5;

export function otvoriKesicu(
  reciLekcije: readonly Rec[],
  tacniRecIdovi: readonly string[],
  vecImam: ReadonlySet<string>,
  rng: () => number
): Rec[] {
  const zaradjene = reciLekcije.filter(
    (r) => tacniRecIdovi.includes(r.id) && !vecImam.has(r.id)
  );

  const obicne = promesaj(zaradjene.filter((r) => !r.izuzetak), rng);
  const izuzeci = promesaj(zaradjene.filter((r) => r.izuzetak), rng);

  const kesica = obicne.slice(0, KESICA_NAJVISE);
  if (izuzeci.length > 0) {
    if (kesica.length < KESICA_NAJVISE) kesica.push(izuzeci[0]);
    else kesica[KESICA_NAJVISE - 1] = izuzeci[0];
  }

  return kesica;
}
