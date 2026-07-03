// Obračun napretka po kursu iz BATCH podataka (perf audit jul 2026):
// dashboard je radio 2 upita PO KURSU; sada 2 upita ukupno + ova čista funkcija.
export interface ProgressLessonRow {
  id: string;
  course_id: string;
  order_index: number;
  title: string;
}

export interface ProgressEntry {
  lesson_id: string;
  completed_at: string | null;
}

export interface CourseProgressFields {
  progress: number;
  totalLessons: number;
  completedLessons: number;
  currentLessonId: string | null;
  currentLessonTitle: string | null;
  lastActivityAt: string | null;
}

export function computeCoursesProgress<C extends { id: string }>(
  courses: C[],
  lessons: ProgressLessonRow[],
  progress: ProgressEntry[]
): (C & CourseProgressFields)[] {
  const lessonsByCourse = new Map<string, ProgressLessonRow[]>();
  for (const l of lessons) {
    const arr = lessonsByCourse.get(l.course_id) ?? [];
    arr.push(l);
    lessonsByCourse.set(l.course_id, arr);
  }
  const completedAt = new Map(progress.map((p) => [p.lesson_id, p.completed_at]));

  return courses.map((course) => {
    const lessonList = (lessonsByCourse.get(course.id) ?? []).sort(
      (a, b) => a.order_index - b.order_index
    );

    let completedLessons = 0;
    let lastActivityAt: string | null = null;
    for (const l of lessonList) {
      if (!completedAt.has(l.id)) continue;
      completedLessons++;
      const at = completedAt.get(l.id) ?? null;
      if (at && (!lastActivityAt || at > lastActivityAt)) lastActivityAt = at;
    }

    const firstUncompleted = lessonList.find((l) => !completedAt.has(l.id));
    const current = firstUncompleted ?? lessonList[lessonList.length - 1] ?? null;

    const totalLessons = lessonList.length;
    return {
      ...course,
      progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      totalLessons,
      completedLessons,
      currentLessonId: current?.id ?? null,
      currentLessonTitle: current?.title ?? null,
      lastActivityAt,
    };
  });
}
