/**
 * Izvor istine za sve što na sajtu stoji u sekciji „Besplatno" (tab u
 * `KurseviKatalog.tsx`). Pravilo Nataše (23.09.2026): sve iz te sekcije
 * komunicira se kao POTPUNO besplatno - bez cene, bez kupovine, bez
 * „pogledaj pre kupovine".
 *
 * Povod: Smile je „VIDEO + B1 ispit - kompletna priprema" (besplatan Goethe
 * masterclass) nudio kao kurs koji se kupuje. Prompt je za besplatne stvari
 * imao samo pojedinačna pravila (NaKI, test nivoa), a spisak nije postojao.
 *
 * `besplatno.test.ts` pada ako se kartice u tabu „Besplatno" i ovaj spisak
 * raziđu - prikazano i izgovoreno moraju biti isto (ista pouka kao kod
 * otvorenih grupnih termina, koji se čitaju iz istog izvora kao /raspored).
 */
export type BesplatnaPonuda = {
  naslov: string;
  href: string;
  opis: string;
  /** Slug u `courses` - stavka ispada iz spiska ako kurs više nije besplatan u bazi. */
  slug?: string;
  /** Poštena ograda koju Smile mora da prenese ako pominje stavku. */
  napomena?: string;
};

export const BESPLATNO_PONUDA: BesplatnaPonuda[] = [
  {
    naslov: "Besplatno testiranje nivoa",
    href: "/besplatno-testiranje",
    opis: "kratak test nivoa, rezultat odmah",
  },
  {
    naslov: "Masterclass: Kako da naučiš reči na stranom jeziku",
    href: "/masterclass-reci",
    opis: "90 minuta sa Natašom, uz materijale za preuzimanje",
    napomena: "video se otključava čim na stranici ostavi mejl - ništa se ne plaća",
  },
  {
    naslov: "Položi Goethe B1 - kompletna priprema",
    href: "/kurs/polozi-goethe-b1",
    slug: "polozi-goethe-b1",
    opis: "video priprema za sve delove B1 ispita, sa modelltestovima",
  },
  {
    naslov: "Položi Goethe B2 - Leseverstehen",
    href: "/kurs/polozi-goethe-b2",
    slug: "polozi-goethe-b2",
    opis: "uvod u B2 ispit i tri Leseverstehen modelltesta",
    napomena: "nepotpun je - pokriva samo čitanje, nije priprema za ceo ispit",
  },
  {
    naslov: "Položi Goethe C1",
    href: "/kurs/polozi-goethe-c1",
    slug: "polozi-goethe-c1",
    opis: "priprema za C1 - tekstovi, esej, govor i slušanje",
  },
  {
    naslov: "NaKI - AI asistent za nemački",
    href: "/naki",
    opis: "vežbanje i objašnjenja na srpskom, bez naloga",
  },
];
