/** Jedna kartica — front/back obavezni, sve ostalo opciono (radi za sve nivoe A1–B2). */
export interface FlashcardItem {
  front: string;            // nemački
  back: string;             // srpski (više prevoda razdvojeno sa "|")
  article?: "der" | "die" | "das";
  plural?: string;
  example?: string;
  image?: string;
  hint?: string;
  audio?: string;
}

/** „REČI" blok: ceo set kartica jednog modula. */
export interface WordSetSection {
  type: "wordset";
  title: string;            // npr. "Lektion 1 — Reči"
  setKey: string;           // stabilan ključ seta (za card_id i progress), npr. "a1-1-lektion-1"
  frontLabel?: string;      // default "DE"
  backLabel?: string;       // default "SR"
  items: FlashcardItem[];
}
