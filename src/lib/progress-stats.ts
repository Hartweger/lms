// Čista logika za statistiku napretka po kursu (stopa završavanja / odustajanja).
// Bez DB poziva — testabilno; podaci se prosleđuju iz admin stranice.

export type LessonRef = { id: string; course_id: string };
export type AccessRef = { user_id: string; course_id: string };
export type ProgressRef = { user_id: string; lesson_id: string };

export type CourseProgress = {
  courseId: string;
  totalLessons: number;
  enrolled: number;       // broj upisanih (jedinstveni korisnici sa pristupom)
  notStarted: number;     // 0 završenih lekcija
  inProgress: number;     // između 1 i total-1
  completed: number;      // sve lekcije završene
  avgProgressPct: number; // prosečan napredak po upisanom (0-100)
  completionRatePct: number; // completed / enrolled (0-100)
};

/**
 * Po kursu (samo oni koji imaju lekcije I upisane): koliko ih nije počelo, u toku, završilo,
 * prosečan napredak i stopa završavanja. Lekcije pripadaju kursu direktno (lessons.course_id).
 */
export function computeCourseProgress(
  lessons: LessonRef[],
  access: AccessRef[],
  progress: ProgressRef[]
): CourseProgress[] {
  const lessonCourse = new Map<string, string>();
  const totalByCourse = new Map<string, number>();
  for (const l of lessons) {
    lessonCourse.set(l.id, l.course_id);
    totalByCourse.set(l.course_id, (totalByCourse.get(l.course_id) ?? 0) + 1);
  }

  const completedByUserCourse = new Map<string, number>(); // "user|course" -> broj završenih
  for (const p of progress) {
    const course = lessonCourse.get(p.lesson_id);
    if (!course) continue;
    const k = p.user_id + "|" + course;
    completedByUserCourse.set(k, (completedByUserCourse.get(k) ?? 0) + 1);
  }

  const usersByCourse = new Map<string, Set<string>>();
  for (const a of access) {
    if (!usersByCourse.has(a.course_id)) usersByCourse.set(a.course_id, new Set());
    usersByCourse.get(a.course_id)!.add(a.user_id);
  }

  const out: CourseProgress[] = [];
  for (const [courseId, total] of totalByCourse) {
    const users = usersByCourse.get(courseId);
    if (!users || total === 0) continue;
    let notStarted = 0, inProgress = 0, completed = 0, sumPct = 0;
    for (const u of users) {
      const done = Math.min(completedByUserCourse.get(u + "|" + courseId) ?? 0, total);
      sumPct += (done / total) * 100;
      if (done === 0) notStarted++;
      else if (done >= total) completed++;
      else inProgress++;
    }
    const enrolled = users.size;
    out.push({
      courseId,
      totalLessons: total,
      enrolled,
      notStarted,
      inProgress,
      completed,
      avgProgressPct: Math.round(sumPct / enrolled),
      completionRatePct: Math.round((completed / enrolled) * 100),
    });
  }
  return out;
}
