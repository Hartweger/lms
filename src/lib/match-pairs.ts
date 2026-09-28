/**
 * Pure logic for the "Spoji parove" (match pairs) exercise.
 *
 * Key invariant: BOTH sides are tracked by a stable *row identity*, never by the
 * string a button shows.
 *  - Right side: a token id, because two pairs may legitimately share the same
 *    target value (Konjunktiv II: `ich → wäre` and `er/sie/es → wäre`). Tracking
 *    "used" targets by value would lock BOTH "wäre" buttons after the first match.
 *  - Left side: the row index, because the same prompt may appear more than once
 *    in a set (the A1.1 „Modul 2 - Reči" pause game served `ledig` several times).
 *    Keying `matched` by the prompt text collapsed those rows into one entry, so
 *    `isComplete` could never reach `pairs.length` and the exercise was a dead end.
 */

export interface MatchPair {
  de: string;
  sr: string;
}

export interface SrToken {
  id: number;
  value: string;
}

/** Left-row index → reserved right-token id. */
export type MatchedMap = Record<number, number>;

/** Build right-column tokens with stable ids (index into the original pairs). */
export function buildSrTokens(pairs: MatchPair[]): SrToken[] {
  return pairs.map((p, i) => ({ id: i, value: p.sr }));
}

/**
 * Resolve a click on a right-side token while the left row `selectedDeIdx` is active.
 * Returns the token id to reserve, or `null` if the click is invalid
 * (nothing selected, token already used, or value mismatch).
 */
export function resolveSrClick(
  pairs: MatchPair[],
  matched: MatchedMap,
  selectedDeIdx: number | null,
  token: SrToken,
): number | null {
  if (selectedDeIdx === null) return null;
  if (isTokenUsed(matched, token.id)) return null; // this instance already used
  const pair = pairs[selectedDeIdx];
  if (!pair) return null;
  return pair.sr === token.value ? token.id : null;
}

export function isTokenUsed(matched: MatchedMap, tokenId: number): boolean {
  return Object.values(matched).includes(tokenId);
}

export function isComplete(pairs: MatchPair[], matched: MatchedMap): boolean {
  return Object.keys(matched).length === pairs.length;
}
