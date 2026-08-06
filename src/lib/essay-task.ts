// Tekst zadatka za pregled eseja (profesorski i admin panel).
//
// essay_submissions pamti samo exercise_id, ne i pitanje - a test vežbe pored
// essay pitanja imaju i kviz/spajanje pitanja. Pravi zadatak se zato prepoznaje
// po options.type essay/speak/listen_write (isto pravilo po kom ExerciseRunner
// bira komponentu); ako ga nema, ostaje prvo pitanje kao do sada.

interface QuestionRow {
  exercise_id: string;
  question: string | null;
  options: unknown;
}

const SUBMISSION_TYPES = new Set(["essay", "speak", "listen_write"]);

// options ume da bude i dvostruko enkodiran JSON string (vidi ExerciseRunner)
function parseOptions(options: unknown): { type?: string; maxPoints?: number } | null {
  let o = options;
  if (typeof o === "string") {
    try {
      o = JSON.parse(o);
    } catch {
      return null;
    }
  }
  if (!o || typeof o !== "object" || Array.isArray(o)) return null;
  return o as { type?: string; maxPoints?: number };
}

export function pickSubmissionQuestions(rows: QuestionRow[]): {
  taskByEx: Record<string, string>;
  maxByEx: Record<string, number>;
} {
  const task: Record<string, string> = {};
  const max: Record<string, number> = {};
  const fallbackTask: Record<string, string> = {};
  const fallbackMax: Record<string, number> = {};

  for (const q of rows) {
    const opts = parseOptions(q.options);
    const mp = typeof opts?.maxPoints === "number" ? opts.maxPoints : 5;
    if (SUBMISSION_TYPES.has(opts?.type ?? "")) {
      if (q.question && task[q.exercise_id] === undefined) {
        task[q.exercise_id] = q.question;
        max[q.exercise_id] = mp;
      }
    }
    if (q.question && fallbackTask[q.exercise_id] === undefined) fallbackTask[q.exercise_id] = q.question;
    if (fallbackMax[q.exercise_id] === undefined) fallbackMax[q.exercise_id] = mp;
  }

  return {
    taskByEx: { ...fallbackTask, ...task },
    maxByEx: { ...fallbackMax, ...max },
  };
}
