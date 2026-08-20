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

/**
 * Oznake kojima se u Natašinoj tabeli piše da reč NEMA množinu: crtica, duga
 * crtica (tabela ume sama da ispravi „-" u „–" ili „—") i kosa crta. Sve to su
 * oznake praznog polja, a ne oblici reči.
 */
const OZNAKE_BEZ_MNOZINE = new Set(["-", "–", "—", "/"]);

/**
 * Množina reči, ili `null` kad je reč nema (Hunger, Durst, Wasser, svi glagoli
 * i pridevi). Jedino mesto koje sme da odlučuje šta stoji u koloni množine.
 *
 * ZAŠTO POSTOJI: u bazi već stoje reči kojima je množina upisana kao crtica,
 * jer je parser tu oznaku sačuvao kao tekst. Zapisi se NE prepravljaju, pa svako
 * čitanje mora da zna da crtica znači prazno. Bez ovoga igra Množina pita „kako
 * glasi u množini: Hunger?" i kao tačan odgovor očekuje crticu.
 */
export function mnozinaReci(rec: Rec): string | null {
  return normalizujMnozinu(rec.mnozina);
}

/** Da li reč uopšte ima množinu. */
export function imaMnozinu(rec: Rec): boolean {
  return mnozinaReci(rec) !== null;
}

/**
 * Isto pravilo nad sirovom vrednošću iz tabele, pre nego što reč postoji.
 * Koristi ga upis lekcije, da nove crtice više ne ulaze u bazu.
 */
export function normalizujMnozinu(vrednost: string | null | undefined): string | null {
  const upisano = (vrednost ?? "").trim();
  if (upisano === "" || OZNAKE_BEZ_MNOZINE.has(upisano)) return null;
  return upisano;
}

/**
 * Boja sličice po rodu - prava učionička konvencija iz nemačkih udžbenika:
 * der plava, die crvena, das zelena. Žuta NIJE rod (vidi BOJA_MNOZINA).
 */
export const ROD_BOJA: Record<Rod, string> = {
  der: "#0B54C9",
  die: "#E5342A",
  // Ista zelena kao Milionerov „tačan odgovor": zasićena i vedra kao plava i
  // crvena pored nje, a mastilo #16161A na njoj daje izmerenih 5.3:1, pa das
  // nosi tamna slova kao nekad na žutoj.
  das: "#2E9E4F",
  nema: "#16161A",
};

/**
 * Žuta u učioničkoj konvenciji znači MNOŽINU: der plava, die crvena, das
 * zelena, množina žuta - kao u nemačkim učionicama. Nagradna žuta (kesica,
 * nalepnica sa imenom) je ista boja, ali sasvim drugo, nagradno značenje.
 */
export const BOJA_MNOZINA = "#FFC400";

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
