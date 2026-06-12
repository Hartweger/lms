// Normalizacija AI-generisanog summary objekta iz /api/dialog.
// Haiku ponekad vrati summary bez goals_completed (naročito kad dijalog
// završi pre poslednje razmene) - nikad ne verovati AI izlazu.

export interface GoalResult {
  goal: string;
  completed: boolean;
}

export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

export interface DialogSummary {
  goals_completed: GoalResult[];
  corrections: Correction[];
  score: number;
  total: number;
}

export function normalizeDialogSummary(raw: unknown, goals: string[]): DialogSummary {
  const goalsCount = goals.filter((g) => g.trim()).length;
  const summary = (raw && typeof raw === "object" ? raw : {}) as Partial<DialogSummary>;

  const goalsCompleted = Array.isArray(summary.goals_completed)
    ? summary.goals_completed.filter(
        (g): g is GoalResult => !!g && typeof g === "object" && typeof g.goal === "string"
      ).map((g) => ({ goal: g.goal, completed: g.completed === true }))
    : goals.map((g) => ({ goal: g, completed: false }));

  const corrections = Array.isArray(summary.corrections)
    ? summary.corrections.filter(
        (c): c is Correction => !!c && typeof c === "object" && typeof c.original === "string"
      ).map((c) => ({
        original: c.original,
        corrected: typeof c.corrected === "string" ? c.corrected : "",
        explanation: typeof c.explanation === "string" ? c.explanation : "",
      }))
    : [];

  const total = typeof summary.total === "number" && summary.total > 0 ? summary.total : goalsCount;
  const rawScore = typeof summary.score === "number" ? summary.score : 0;
  const score = Math.min(Math.max(rawScore, 0), total);

  return { goals_completed: goalsCompleted, corrections, score, total };
}
