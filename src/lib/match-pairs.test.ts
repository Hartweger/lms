import { describe, it, expect } from "vitest";
import {
  buildSrTokens,
  resolveSrClick,
  isComplete,
  isTokenUsed,
  type MatchPair,
  type MatchedMap,
} from "./match-pairs";

// The exact A2.2 "Test Modul 1" question that was unsolvable in production:
// two pronouns map to the same Konjunktiv II form "wäre".
const KONJ: MatchPair[] = [
  { de: "ich", sr: "wäre" },
  { de: "du", sr: "wärst" },
  { de: "wir", sr: "wären" },
  { de: "er/sie/es", sr: "wäre" },
];

// The A1.1 "Modul 2 - Reči" pause game as a student hit it in production:
// the SAME prompt appears more than once on the left side.
const DUPLI_POJMOVI: MatchPair[] = [
  { de: "ledig", sr: "neoženjen" },
  { de: "ledig", sr: "neoženjen" },
  { de: "kennen", sr: "poznavati" },
  { de: "ledig", sr: "neoženjen" },
  { de: "Familienstand", sr: "bračni status" },
];

/** Simulate a full play-through: select each `de` (by its row index) and click a
 *  still-free token whose value matches. Returns the final `matched` map. */
function playThrough(pairs: MatchPair[]): MatchedMap {
  const tokens = buildSrTokens(pairs);
  const matched: MatchedMap = {};
  pairs.forEach((p, i) => {
    const token = tokens.find(
      (t) => t.value === p.sr && !isTokenUsed(matched, t.id),
    )!;
    const reserved = resolveSrClick(pairs, matched, i, token);
    if (reserved !== null) matched[i] = reserved;
  });
  return matched;
}

describe("match-pairs with duplicate target values", () => {
  it("can be completed fully even when two prompts share a target", () => {
    const matched = playThrough(KONJ);
    expect(isComplete(KONJ, matched)).toBe(true);
    expect(Object.keys(matched).sort()).toEqual(["0", "1", "2", "3"]);
  });

  it("reserves two DISTINCT token instances for the duplicate value", () => {
    const matched = playThrough(KONJ);
    // ich (0) and er/sie/es (3) both map to "wäre" but must use different token ids
    expect(matched[0]).not.toBe(matched[3]);
  });

  it("matching the first 'wäre' does NOT lock the second 'wäre' token", () => {
    const tokens = buildSrTokens(KONJ); // ids: 0=wäre, 1=wärst, 2=wären, 3=wäre
    const matched: MatchedMap = { 0: 0 }; // first wäre used
    const secondWaere = tokens[3];
    expect(isTokenUsed(matched, secondWaere.id)).toBe(false);
    expect(resolveSrClick(KONJ, matched, 3, secondWaere)).toBe(3);
  });

  it("rejects clicking an already-used token instance", () => {
    const tokens = buildSrTokens(KONJ);
    const matched: MatchedMap = { 0: 0 };
    expect(resolveSrClick(KONJ, matched, 3, tokens[0])).toBeNull();
  });

  it("rejects a value mismatch", () => {
    const tokens = buildSrTokens(KONJ);
    expect(resolveSrClick(KONJ, {}, 1, tokens[0])).toBeNull(); // du ≠ wäre
  });
});

describe("match-pairs with duplicate prompts on the left", () => {
  it("can be completed fully when the same prompt repeats", () => {
    const matched = playThrough(DUPLI_POJMOVI);
    expect(isComplete(DUPLI_POJMOVI, matched)).toBe(true);
    expect(Object.keys(matched)).toHaveLength(DUPLI_POJMOVI.length);
  });

  it("gives each repeated prompt its own token instance", () => {
    const matched = playThrough(DUPLI_POJMOVI);
    const ledigTokens = [matched[0], matched[1], matched[3]];
    expect(new Set(ledigTokens).size).toBe(3);
  });

  it("matching one 'ledig' row leaves the other rows unmatched", () => {
    const tokens = buildSrTokens(DUPLI_POJMOVI);
    const matched: MatchedMap = { 0: tokens[0].id };
    expect(isComplete(DUPLI_POJMOVI, matched)).toBe(false);
    expect(matched[1]).toBeUndefined();
    expect(matched[3]).toBeUndefined();
  });

  it("resolves the click against the selected ROW, not the first row with that text", () => {
    const tokens = buildSrTokens(DUPLI_POJMOVI);
    // row 4 is Familienstand → only "bračni status" (token id 4) may match
    expect(resolveSrClick(DUPLI_POJMOVI, {}, 4, tokens[4])).toBe(4);
    expect(resolveSrClick(DUPLI_POJMOVI, {}, 4, tokens[0])).toBeNull();
  });
});
