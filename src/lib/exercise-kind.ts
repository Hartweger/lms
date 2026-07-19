// Razlika test vs vežba (Natašino pravilo): sve vezano za ispit = TEST,
// čak i unutar lekcije. Vežba = sitna praktična vežba uz temu u nastavnom kursu.

const EXAM_COURSE = /polo[žz]i|fide|fsp|goethe|gramatik/i;
const EXAM_TITLE = /\btest\b|modell?test|pr[üu]fung|zwischentest|lesen|h[öo]ren|hoeren|schreiben|sprechen|glagoli|\bmodul\b|vortrag|diskussion|modelltest|\bispit\b/i;

// Milioner/Millionär je igra, nikad test - naslov "Millionär: Modul N" bi inače
// upao u EXAM_TITLE zbog reči "Modul".
const GAME_TITLE = /milioner|million[äa]r/i;

/** true = TEST (ispitno), false = Vežba (praktična). */
export function isTestExercise(exerciseTitle: string, courseTitleOrSlug?: string | null): boolean {
  if (GAME_TITLE.test(exerciseTitle || "")) return false;
  if (courseTitleOrSlug && EXAM_COURSE.test(courseTitleOrSlug)) return true;
  return EXAM_TITLE.test(exerciseTitle || "");
}

/** Bedž za prikaz. */
export function exerciseKindBadge(exerciseTitle: string, courseTitleOrSlug?: string | null): { label: string; test: boolean } {
  if (GAME_TITLE.test(exerciseTitle || "")) return { test: false, label: "🎮 Igra" };
  const test = isTestExercise(exerciseTitle, courseTitleOrSlug);
  return { test, label: test ? "🎯 Test" : "✏️ Vežba" };
}
