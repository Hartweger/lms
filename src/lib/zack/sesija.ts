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
