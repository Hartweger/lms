// Opcije i tačan odgovor ispitnih (grupisanih) vežbi - podržava i stari WP format:
// options kao goli niz (ili JSON string niza), i options=null uz correct_answer "true"/"false" (Richtig/Falsch).

type ExamQuestionLike = { options: unknown; correct_answer: string | null; audio_url?: string | null };

export function examItemsOf(options: unknown, correctAnswer: string | null | undefined): string[] {
  let o = options;
  if (typeof o === "string") {
    try { o = JSON.parse(o); } catch { o = null; }
  }
  if (o && typeof o === "object" && !Array.isArray(o)) {
    const items = (o as { items?: unknown }).items;
    if (Array.isArray(items)) return items.map(String);
  }
  if (Array.isArray(o)) return o.map(String);
  const ca = (correctAnswer ?? "").trim().toLowerCase();
  if (ca === "true" || ca === "false") return ["Richtig", "Falsch"];
  return [];
}

export function examCorrectIndexOf(correctAnswer: string | null | undefined, items: string[]): number {
  const ca = (correctAnswer ?? "").trim();
  if (/^\d+$/.test(ca)) return parseInt(ca, 10);
  const target = ca.toLowerCase() === "true" ? "richtig" : ca.toLowerCase() === "false" ? "falsch" : ca.toLowerCase();
  return items.findIndex((it) => it.trim().toLowerCase() === target);
}

// Grupni prikaz sme da se koristi samo ako svako pitanje ima bar jednu opciju za prikaz -
// inače polaznik ostaje zaglavljen (dugme „Proveri" traži odgovor na sve).
export function canRenderGroupedExam(questions: ExamQuestionLike[]): boolean {
  return questions.every((q) => examItemsOf(q.options, q.correct_answer).length > 0);
}
