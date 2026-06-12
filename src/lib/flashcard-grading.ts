import type { FlashcardItem } from "./flashcard-types";

export type Direction = "de-sr" | "sr-de";
export type GradeStatus = "correct" | "almost" | "wrong";
export interface GradeResult { status: GradeStatus; fullForm: string; }

function normalize(s: string): string {
  return s.trim().toLowerCase()
    .replace(/[.,!?;:]+/g, "")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

/** Skup prihvatljivih odgovora za zadati smer. Član i množina su opcioni (dodaju se kao varijante). */
function acceptedAnswers(card: FlashcardItem, dir: Direction): string[] {
  if (dir === "de-sr") return card.back.split("|").map((s) => s.trim());
  // „front" može da nosi više oblika („üben, hat geübt") - prihvati svaki pojedinačno i ceo niz.
  const forms = card.front.split(",").map((s) => s.trim()).filter(Boolean);
  const out = [...forms, card.front];
  if (card.article) for (const f of forms) out.push(`${card.article} ${f}`);
  if (card.plural) {
    out.push(card.plural);
    // Pun rečnički oblik (jednina + množina) - baš ono što prikazujemo kao „Tačan odgovor".
    // normalize() svejedno skida zarez, pa pokriva i unos sa i bez zareza.
    for (const f of forms) {
      out.push(`${f}, ${card.plural}`);
      if (card.article) out.push(`${card.article} ${f}, ${card.plural}`);
    }
  }
  return out;
}

/** Pun oblik za prikaz („evo tačno"): nemački sa članom i množinom ako postoje. */
export function fullForm(card: FlashcardItem, dir: Direction): string {
  if (dir === "de-sr") return card.back.replace(/\|/g, " / ");
  const article = card.article ? `${card.article} ` : "";
  const plural = card.plural ? `, ${card.plural}` : "";
  return `${article}${card.front}${plural}`;
}

export function gradeTyping(input: string, card: FlashcardItem, dir: Direction): GradeResult {
  const inN = normalize(input);
  const accepted = acceptedAnswers(card, dir).map(normalize);
  const ff = fullForm(card, dir);
  if (accepted.some((a) => a === inN)) return { status: "correct", fullForm: ff };
  // „skoro" samo za reči od bar 4 slova - na kraćima je 1 greška preveliki udeo (npr. "da" vs "ja").
  if (accepted.some((a) => a.length >= 4 && levenshtein(a, inN) <= 1)) return { status: "almost", fullForm: ff };
  return { status: "wrong", fullForm: ff };
}

export interface QuizOptionsResult { options: string[]; correctIndex: number; }

/** 1 tačan + 3 distraktora iz pool-a. null ako pool ima < 4 kartice. */
export function buildQuizOptions(card: FlashcardItem, pool: FlashcardItem[], dir: Direction): QuizOptionsResult | null {
  const answerOf = (c: FlashcardItem) => (dir === "de-sr" ? c.back.split("|")[0].trim() : c.front);
  const correct = answerOf(card);
  const distractPool = pool.filter((c) => answerOf(c) !== correct).map(answerOf);
  const uniqueDistract = Array.from(new Set(distractPool));
  if (uniqueDistract.length < 3) return null;
  const picked = uniqueDistract.slice(0, 3);
  const options = [correct, ...picked];
  const rot = correct.length % 4;
  const rotated = options.slice(rot).concat(options.slice(0, rot));
  return { options: rotated, correctIndex: rotated.indexOf(correct) };
}
