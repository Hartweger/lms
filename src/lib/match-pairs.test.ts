import { describe, it, expect } from "vitest";
import {
  buildSrTokens,
  resolveSrClick,
  isComplete,
  isTokenUsed,
  type MatchPair,
} from "./match-pairs";

// The exact A2.2 "Test Modul 1" question that was unsolvable in production:
// two pronouns map to the same Konjunktiv II form "wäre".
const KONJ: MatchPair[] = [
  { de: "ich", sr: "wäre" },
  { de: "du", sr: "wärst" },
  { de: "wir", sr: "wären" },
  { de: "er/sie/es", sr: "wäre" },
];

/** Simulate a full play-through: select each `de` and click a still-free token
 *  whose value matches. Returns the final `matched` map. */
function playThrough(pairs: MatchPair[]): Record<string, number> {
  const tokens = buildSrTokens(pairs);
  const matched: Record<string, number> = {};
  for (const p of pairs) {
    const token = tokens.find(
      (t) => t.value === p.sr && !isTokenUsed(matched, t.id),
    )!;
    const reserved = resolveSrClick(pairs, matched, p.de, token);
    if (reserved !== null) matched[p.de] = reserved;
  }
  return matched;
}

describe("match-pairs with duplicate target values", () => {
  it("can be completed fully even when two prompts share a target", () => {
    const matched = playThrough(KONJ);
    expect(isComplete(KONJ, matched)).toBe(true);
    expect(Object.keys(matched).sort()).toEqual(
      ["du", "er/sie/es", "ich", "wir"],
    );
  });

  it("reserves two DISTINCT token instances for the duplicate value", () => {
    const matched = playThrough(KONJ);
    // ich and er/sie/es both map to "wäre" but must use different token ids
    expect(matched["ich"]).not.toBe(matched["er/sie/es"]);
  });

  it("matching the first 'wäre' does NOT lock the second 'wäre' token", () => {
    const tokens = buildSrTokens(KONJ); // ids: 0=wäre, 1=wärst, 2=wären, 3=wäre
    const matched: Record<string, number> = { ich: 0 }; // first wäre used
    const secondWaere = tokens[3];
    expect(isTokenUsed(matched, secondWaere.id)).toBe(false);
    expect(resolveSrClick(KONJ, matched, "er/sie/es", secondWaere)).toBe(3);
  });

  it("rejects clicking an already-used token instance", () => {
    const tokens = buildSrTokens(KONJ);
    const matched: Record<string, number> = { ich: 0 };
    expect(resolveSrClick(KONJ, matched, "er/sie/es", tokens[0])).toBeNull();
  });

  it("rejects a value mismatch", () => {
    const tokens = buildSrTokens(KONJ);
    expect(resolveSrClick(KONJ, {}, "du", tokens[0])).toBeNull(); // du ≠ wäre
  });
});
