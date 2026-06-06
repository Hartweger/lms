import type { FlashcardItem } from "../src/lib/flashcard-types";

export interface ParseResult { cards: FlashcardItem[]; skipped: string[]; }

/** Quizlet export: "front<TAB>back" po liniji. Prazni back → skipped. Više prevoda (/ ili ,) → "a|b". */
export function parseQuizlet(text: string): ParseResult {
  const cards: FlashcardItem[] = [];
  const skipped: string[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const [frontRaw, backRaw = ""] = line.split("\t");
    const front = frontRaw.trim();
    const back = backRaw.trim();
    if (!front) continue;
    if (!back) { skipped.push(front); continue; }
    const variants = back.split(/[/,]/).map((s) => s.trim()).filter(Boolean);
    cards.push({ front, back: variants.join("|") });
  }
  return { cards, skipped };
}
