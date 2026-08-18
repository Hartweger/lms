// Tok jedne odigrane igre. Čista funkcija stanja, bez ijednog poziva ka mreži,
// da bi komponenta igre mogla da bude tanka.
import type { Pitanje } from "./pitanja";

/** Srca su životi unutar igre, ne dnevni limit. Aplikacija je plaćena. */
export const SRCA = 3;

export type Sesija = {
  pitanja: Pitanje[];
  indeks: number;
  srca: number;
  tacni: string[];
  gotovo: boolean;
};

/** Koje reči jedno pitanje pokriva. Parovi pokrivaju sve svoje odjednom. */
export function tacniRecIdovi(p: Pitanje): string[] {
  return p.igra === "parovi" ? p.parovi.map((x) => x.recId) : [p.recId];
}

export function novaSesija(pitanja: Pitanje[]): Sesija {
  return {
    pitanja,
    indeks: 0,
    srca: SRCA,
    tacni: [],
    gotovo: pitanja.length === 0,
  };
}

export function odgovori(s: Sesija, tacno: boolean): Sesija {
  if (s.gotovo) return s;

  const srca = tacno ? s.srca : s.srca - 1;
  const tacni = tacno
    ? [...s.tacni, ...tacniRecIdovi(s.pitanja[s.indeks]).filter((id) => !s.tacni.includes(id))]
    : s.tacni;
  const indeks = s.indeks + 1;

  return {
    ...s,
    indeks,
    srca,
    tacni,
    gotovo: srca <= 0 || indeks >= s.pitanja.length,
  };
}

/**
 * Beleži tačno rešene reči BEZ prelaska na sledeće pitanje.
 * Postoji zbog igre Parovi, gde jedno pitanje pokriva više reči, pa dete mora da
 * zadrži svaki spojen par i onda kad ne spoji sve.
 */
export function zabeleziTacne(s: Sesija, recIdovi: readonly string[]): Sesija {
  if (s.gotovo) return s;
  const novi = recIdovi.filter((id) => !s.tacni.includes(id));
  return novi.length === 0 ? s : { ...s, tacni: [...s.tacni, ...novi] };
}

/**
 * Uzima srce BEZ prelaska na sledeće pitanje. Koristi Parovi kod pogrešnog spoja,
 * gde bi `odgovori(s, false)` odmah završio celu igru, jer je to jedno pitanje.
 */
export function oduzmiSrce(s: Sesija): Sesija {
  if (s.gotovo) return s;
  const srca = s.srca - 1;
  return { ...s, srca, gotovo: srca <= 0 };
}

/** Završava igru na zahtev deteta. Sve zabeleženo ostaje zarađeno. */
export function odustani(s: Sesija): Sesija {
  return s.gotovo ? s : { ...s, gotovo: true };
}

/**
 * Da li se igra završila zato što su nestala srca, za razliku od toga da je dete
 * prešlo sva pitanja. Kesica se dodeljuje u oba slučaja, ali ekran kraja treba da
 * kaže različitu stvar.
 */
export function palaZbogSrca(s: Sesija): boolean {
  return s.gotovo && s.srca <= 0;
}
