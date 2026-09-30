import type { WortschatzRow } from "./class-notes";

export interface WordsetItem {
  idx: number;
  front: string;
  back: string;
}

/**
 * Kartica mora biti ČIST TEKST. Poznata greška iz avgusta 2026: reči prekopirane
 * iz lekcije sa <mark> tagovima prikazivale su se sirove, jer FlashcardBlock
 * namerno ne koristi dangerouslySetInnerHTML.
 *
 * Zvezdice i znak jednakosti se brišu SAMO kad su upareni - pravi rečnik (npr.
 * scripts/flashcards/*.json) ima pojedinačne znake kao deo teksta, ne kao
 * markdown: "zvezdica za Gendern (*)", "(keine Ahnung = nemam pojma)". Ti znaci
 * MORAJU ostati. Nelenji (.+?) unutar para hvata i ugnežđeno - "**a *b* c**"
 * i dalje postaje "a b c" - dok obična [^*]+ klasa to ne bi uspela.
 */
function clean(value: string): string {
  return value
    .replace(/<[^>]*>/g, "") // HTML tagovi (i nezatvoreni, dokle god tag sam ima ">")
    .replace(/==(.+?)==/g, "$1") // marker, uključujući ugnežđeno
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold, uključujući ugnežđeno
    .replace(/\*(.+?)\*/g, "$1") // kurziv
    .replace(/\s+/g, " ")
    .trim();
}

export function deriveWordsetItems(rows: WortschatzRow[]): WordsetItem[] {
  const out: WordsetItem[] = [];
  const indexByKey = new Map<string, number>();
  for (const row of rows) {
    const front = clean(row.de ?? "");
    const back = clean(row.sr ?? "");
    if (!front || !back) continue;
    const key = front.toLowerCase();
    const existingIdx = indexByKey.get(key);
    if (existingIdx !== undefined) {
      // Ista nemačka reč se ponovo pojavila - spoji prevode sa "|", isto kao što
      // flashcard-grading.ts već prihvata svaki od više prevoda na jednoj kartici.
      // Zadržava se oblik i pozicija PRVOG pojavljivanja reči.
      const existing = out[existingIdx];
      const parts = existing.back.split("|");
      if (!parts.includes(back)) existing.back = `${existing.back}|${back}`;
      continue;
    }
    indexByKey.set(key, out.length);
    out.push({ idx: out.length, front, back });
  }
  return out;
}

/** Napredak se pamti po card_id koji se računa iz set_key - zato prefiks i UUID. */
export function wordsetSetKey(wordsetId: string): string {
  return `sw_${wordsetId}`;
}

export function wordsetTitle(position: number | null, lessonDate: string): string {
  // null > 0 je već false, pa je "position &&" suvišno - ?? 0 samo drži TS strict happy.
  if ((position ?? 0) > 0) return `Termin ${position} - reči`;
  const [y, m, d] = lessonDate.split("-");
  return `Reči - ${Number(d)}.${Number(m)}.${y}.`;
}
