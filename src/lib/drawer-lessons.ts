// Lista lekcija za LessonDrawer. module_name je GENERATED kolona u bazi
// (izvučena iz sections badge sekcije) - vidi migraciju 060_lekcija_perf.sql.
export interface DrawerLessonRow {
  id: string;
  title: string;
  order_index: number;
  module_name: string | null;
}

export function buildDrawerLessons(lessons: DrawerLessonRow[], completedIds: Set<string>) {
  return lessons.map((l) => ({
    id: l.id,
    title: l.title,
    order_index: l.order_index,
    completed: completedIds.has(l.id),
    module: l.module_name ?? "",
  }));
}
