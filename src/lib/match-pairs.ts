/**
 * Pure logic for the "Spoji parove" (match pairs) exercise.
 *
 * Key invariant: right-side options are tracked by a stable token *id*, never by
 * their string value. Two pairs may legitimately share the same target value
 * (e.g. Konjunktiv II: `ich → wäre` and `er/sie/es → wäre`). Tracking "used"
 * targets by value would lock BOTH "wäre" buttons after the first match, making
 * the exercise impossible to finish.
 */

export interface MatchPair {
  de: string;
  sr: string;
}

export interface SrToken {
  id: number;
  value: string;
}

/** Build right-column tokens with stable ids (index into the original pairs). */
export function buildSrTokens(pairs: MatchPair[]): SrToken[] {
  return pairs.map((p, i) => ({ id: i, value: p.sr }));
}

/**
 * Resolve a click on a right-side token while `selectedDe` is active.
 * Returns the token id to reserve, or `null` if the click is invalid
 * (nothing selected, token already used, or value mismatch).
 */
export function resolveSrClick(
  pairs: MatchPair[],
  matched: Record<string, number>,
  selectedDe: string | null,
  token: SrToken,
): number | null {
  if (!selectedDe) return null;
  if (Object.values(matched).includes(token.id)) return null; // this instance already used
  const pair = pairs.find((p) => p.de === selectedDe);
  if (!pair) return null;
  return pair.sr === token.value ? token.id : null;
}

export function isTokenUsed(matched: Record<string, number>, tokenId: number): boolean {
  return Object.values(matched).includes(tokenId);
}

export function isComplete(pairs: MatchPair[], matched: Record<string, number>): boolean {
  return Object.keys(matched).length === pairs.length;
}
