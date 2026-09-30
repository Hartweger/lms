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
 * Zvezdice i znak jednakosti se brišu SVE, upareno ili ne - naivan pristup koji
 * traži par (**...**, ==...==) ne pogađa ugnežđene ili nezatvorene oznake
 * (npr. "**a *b* c**" ili "==a" bez zatvaranja) i ostavlja smeće na kartici.
 * Nemačka reč ili naš prevod u rečniku realno nikad ne sadrže * ili = kao deo
 * teksta, pa je bezuslovno brisanje bezbedno i pouzdanije od uparivanja.
 */
function clean(value: string): string {
  return value
    .replace(/<[^>]*>/g, "") // HTML tagovi (i nezatvoreni, dokle god tag sam ima ">")
    .replace(/[*=]/g, "") // markdown-lite oznake: bold/kurziv/marker, upareno ili ne
    .replace(/\s+/g, " ")
    .trim();
}

export function deriveWordsetItems(rows: WortschatzRow[]): WordsetItem[] {
  const out: WordsetItem[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const front = clean(row.de ?? "");
    const back = clean(row.sr ?? "");
    if (!front || !back) continue;
    const key = front.toLowerCase();
    if (seen.has(key)) continue; // isti front sa različitim prevodom - zadržava se prvo pojavljivanje
    seen.add(key);
    out.push({ idx: out.length, front, back });
  }
  return out;
}

/** Napredak se pamti po card_id koji se računa iz set_key - zato prefiks i UUID. */
export function wordsetSetKey(wordsetId: string): string {
  return `sw_${wordsetId}`;
}

export function wordsetTitle(position: number | null, lessonDate: string): string {
  if (position && position > 0) return `Termin ${position} - reči`;
  const [y, m, d] = lessonDate.split("-");
  return `Reči - ${Number(d)}.${Number(m)}.${y}.`;
}
