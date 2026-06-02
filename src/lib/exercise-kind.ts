// Razlika test vs vežba (Natašino pravilo): sve vezano za ispit = TEST,
// čak i unutar lekcije. Vežba = sitna praktična vežba uz temu u nastavnom kursu.

const EXAM_COURSE = /polo[žz]i|fide|fsp|goethe|gramatik/i;
const EXAM_TITLE = /\btest\b|modell?test|pr[üu]fung|zwischentest|lesen|h[öo]ren|hoeren|schreiben|sprechen|glagoli|\bmodul\b|vortrag|diskussion|modelltest/i;

/** true = TEST (ispitno), false = Vežba (praktična). */
export function isTestExercise(exerciseTitle: string, courseTitleOrSlug?: string | null): boolean {
  if (courseTitleOrSlug && EXAM_COURSE.test(courseTitleOrSlug)) return true;
  return EXAM_TITLE.test(exerciseTitle || "");
}

/** Bedž za prikaz. */
export function exerciseKindBadge(exerciseTitle: string, courseTitleOrSlug?: string | null): { label: string; test: boolean } {
  const test = isTestExercise(exerciseTitle, courseTitleOrSlug);
  return { test, label: test ? "🎯 Test" : "✏️ Vežba" };
}
