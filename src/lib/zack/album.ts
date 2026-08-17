// Stanje albuma se računa u trenutku čitanja, ne pozadinskim poslom.
// Bledenje je time besplatno i nema crona koji može da zakaže.
import type { Rec } from "./rec";

/** Posle koliko dana bez tačnog odgovora sličica posivi. */
export const DANA_DO_BLEDENJA = 21;

export type ZapisSlicice = {
  rec_id: string;
  zalepljena_at: string | null;
  poslednje_tacno_at: string;
};

export type Stanje = "prazno" | "u-ruci" | "zalepljena" | "izbledela";

export type StavkaAlbuma = { rec: Rec; stanje: Stanje };

const DAN = 24 * 60 * 60 * 1000;

export function stanjeAlbuma(
  reci: readonly Rec[],
  zapisi: readonly ZapisSlicice[],
  sada: Date
): StavkaAlbuma[] {
  const poRecId = new Map(zapisi.map((z) => [z.rec_id, z]));

  return [...reci]
    .sort((a, b) => a.redni_broj - b.redni_broj)
    .map((rec) => {
      const z = poRecId.get(rec.id);
      if (!z) return { rec, stanje: "prazno" as const };
      if (!z.zalepljena_at) return { rec, stanje: "u-ruci" as const };

      // Sat bledenja kreće od kasnijeg od dva datuma. Vreme koje je sličica
      // provela u ruci se ne broji, jer tada nije ni bila u albumu.
      const odKada = Math.max(
        Date.parse(z.zalepljena_at),
        Date.parse(z.poslednje_tacno_at)
      );
      // Pokvaren ili neprepoznat datum daje NaN. Namerno pada u korist deteta:
      // Number.isFinite to hvata eksplicitno, da ponašanje ne zavisi od toga
      // što je poređenje sa NaN slučajno false.
      if (!Number.isFinite(odKada)) return { rec, stanje: "zalepljena" as const };

      const dana = (sada.getTime() - odKada) / DAN;
      return { rec, stanje: dana > DANA_DO_BLEDENJA ? ("izbledela" as const) : ("zalepljena" as const) };
    });
}

/**
 * Brojač koji vidi i dete i roditelj. Izbledela sličica se i dalje broji kao
 * zalepljena, jer detetu ništa nije oduzeto, samo je pobledelo.
 */
export function brojac(stavke: readonly StavkaAlbuma[]): { zalepljene: number; ukupno: number } {
  return {
    zalepljene: stavke.filter((s) => s.stanje === "zalepljena" || s.stanje === "izbledela").length,
    ukupno: stavke.length,
  };
}
