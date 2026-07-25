// Lista lekcija za LessonDrawer. module_name je GENERATED kolona u bazi
// (izvučena iz sections badge sekcije) - vidi migraciju 060_lekcija_perf.sql.
import { exerciseKindBadge } from "@/lib/exercise-kind";

export interface DrawerLessonRow {
  id: string;
  title: string;
  order_index: number;
  module_name: string | null;
}

/** Vežba/test kursa - u draweru stoje ugnežđeno ispod svoje lekcije. */
export interface DrawerExerciseRow {
  id: string;
  lesson_id: string;
  title: string;
  order_index: number;
}

export interface DrawerExercise {
  id: string;
  title: string;
  test: boolean;
  label: string;
}

export function buildDrawerLessons(
  lessons: DrawerLessonRow[],
  completedIds: Set<string>,
  exercises: DrawerExerciseRow[] = [],
  courseTitleOrSlug?: string | null,
) {
  // Bedž je isti kao u spisku „Vežbe i testovi" na dnu lekcije - da se ne razilaze.
  const byLesson = new Map<string, DrawerExercise[]>();
  for (const e of [...exercises].sort((a, b) => a.order_index - b.order_index)) {
    const kind = exerciseKindBadge(e.title, courseTitleOrSlug);
    const list = byLesson.get(e.lesson_id) ?? [];
    list.push({ id: e.id, title: e.title, test: kind.test, label: kind.label });
    byLesson.set(e.lesson_id, list);
  }

  return lessons.map((l) => ({
    id: l.id,
    title: l.title,
    order_index: l.order_index,
    completed: completedIds.has(l.id),
    module: l.module_name ?? "",
    exercises: byLesson.get(l.id) ?? [],
  }));
}
