// Osnovni tipovi i sitni alati za zack. Sve ostalo u lib/zack se oslanja na ovo.

export type Rod = "der" | "die" | "das" | "nema";
export type Vrsta = "imenica" | "glagol" | "pridev" | "ostalo";

export type Rec = {
  id: string;
  redni_broj: number;
  de: string;
  sr: string;
  rod: Rod;
  mnozina: string | null;
  vrsta: Vrsta;
  izuzetak: boolean;
  /**
   * Oznaka slike iz lokalnog skupa (Twemoji), npr. „1fa91" za stolicu.
   * NULL je normalno stanje: konkretne imenice se crtaju, glagoli i apstraktne
   * reci ne. Slika stoji SAMO na slicici, nikad u pitanju, jer bi inace dete
   * pokazivalo na sliku umesto da prevodi.
   */
  ikonica?: string | null;
};

/** Boja sličice po rodu. Iste tri boje se koriste u nemačkim učionicama. */
export const ROD_BOJA: Record<Rod, string> = {
  der: "#0B54C9",
  die: "#E5342A",
  das: "#FFC400",
  nema: "#16161A",
};

export function bojaZaRod(rod: Rod): string {
  return ROD_BOJA[rod];
}

/**
 * Fisher-Yates, sa ubrizganim izvorom slučajnosti da bi se moglo testirati.
 * Polazni niz ostaje netaknut.
 */
export function promesaj<T>(niz: readonly T[], rng: () => number): T[] {
  const kopija = [...niz];
  for (let i = kopija.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [kopija[i], kopija[j]] = [kopija[j], kopija[i]];
  }
  return kopija;
}
