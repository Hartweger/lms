import { describe, it, expect } from "vitest";
import { normalizeDialogSummary } from "./dialog-summary";

const GOALS = ["Pozdravi prodavca", "Pitaj za cenu", "Plati i pozdravi se"];

describe("normalizeDialogSummary", () => {
  it("Sentry 83bb858a: summary samo sa corrections, bez goals_completed", () => {
    // Tačan oblik koji Haiku vrati kad dijalog završi pre poslednje razmene
    const raw = {
      corrections: [
        { original: "Ich möchte ein Brot", corrected: "Ich möchte ein Brot, bitte", explanation: "učtivija forma" },
      ],
    };
    const result = normalizeDialogSummary(raw, GOALS);
    expect(result.goals_completed).toHaveLength(3);
    expect(result.goals_completed[0]).toEqual({ goal: GOALS[0], completed: false });
    expect(result.corrections).toHaveLength(1);
    expect(result.score).toBe(0);
    expect(result.total).toBe(3);
  });

  it("null/undefined summary daje fallback", () => {
    for (const raw of [null, undefined]) {
      const result = normalizeDialogSummary(raw, GOALS);
      expect(result.goals_completed).toHaveLength(3);
      expect(result.corrections).toEqual([]);
      expect(result.score).toBe(0);
      expect(result.total).toBe(3);
    }
  });

  it("validan summary prolazi netaknut", () => {
    const raw = {
      goals_completed: [
        { goal: GOALS[0], completed: true },
        { goal: GOALS[1], completed: true },
        { goal: GOALS[2], completed: false },
      ],
      corrections: [{ original: "a", corrected: "b", explanation: "c" }],
      score: 2,
      total: 3,
    };
    expect(normalizeDialogSummary(raw, GOALS)).toEqual(raw);
  });

  it("goals_completed koji nije niz se zamenjuje fallbackom", () => {
    const result = normalizeDialogSummary({ goals_completed: "sve ispunjeno", score: 3, total: 3 }, GOALS);
    expect(result.goals_completed).toHaveLength(3);
    expect(result.goals_completed.every((g) => !g.completed)).toBe(true);
  });

  it("ne-numerički score/total se saniraju, score se ograničava na total", () => {
    const result = normalizeDialogSummary({ score: "5" as unknown as number, total: -1 }, GOALS);
    expect(result.score).toBe(0);
    expect(result.total).toBe(3);

    const capped = normalizeDialogSummary({ score: 99, total: 3 }, GOALS);
    expect(capped.score).toBe(3);
  });

  it("prazni stringovi u goals ne ulaze u total", () => {
    const result = normalizeDialogSummary(null, ["Cilj 1", "", "  "]);
    expect(result.total).toBe(1);
  });

  it("nevalidni elementi u corrections se filtriraju", () => {
    const result = normalizeDialogSummary(
      { corrections: [null, "tekst", { original: "x" }] },
      GOALS
    );
    expect(result.corrections).toEqual([{ original: "x", corrected: "", explanation: "" }]);
  });
});
