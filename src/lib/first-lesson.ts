// src/lib/first-lesson.ts
// „Prva lekcija" za aktivacione tokove (welcome mejl, hvala stranica): kupljeni
// proizvod → course_unlocks → content kursevi → prva lekcija po order_index.
// Kursevi bez lekcija (paketi/1:1/grupni bez sadržaja) se preskaču.
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export interface LessonLite {
  id: string;
  title: string;
  course_id: string;
  order_index: number | null;
}

/** Čista logika izbora - prvi kurs iz redosleda koji ima lekcije, pa najmanji order_index. */
export function pickFirstLesson(
  lessons: LessonLite[],
  courseIdsInOrder: string[],
): { id: string; title: string } | null {
  for (const cid of courseIdsInOrder) {
    const inCourse = lessons
      .filter((l) => l.course_id === cid)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    if (inCourse.length > 0) return { id: inCourse[0].id, title: inCourse[0].title };
  }
  return null;
}

/** Prva lekcija za date CONTENT kurseve (redosled = prioritet). */
export async function firstLessonForCourses(
  admin: AdminClient,
  courseIds: string[],
): Promise<{ id: string; title: string } | null> {
  if (courseIds.length === 0) return null;
  const { data: lessons } = await admin
    .from("lessons")
    .select("id, title, course_id, order_index")
    .in("course_id", courseIds);
  return pickFirstLesson((lessons ?? []) as LessonLite[], courseIds);
}

/** Prva lekcija za stavke porudžbine (proizvod → course_unlocks → content kurs). */
export async function firstLessonForOrder(
  admin: AdminClient,
  items: { course_id: string }[],
): Promise<{ id: string; title: string } | null> {
  const purchasedIds = items.map((i) => i.course_id);
  if (purchasedIds.length === 0) return null;
  const { data: unlocks } = await admin
    .from("course_unlocks")
    .select("purchasable_course_id, content_course_id")
    .in("purchasable_course_id", purchasedIds);
  const contentIds: string[] = [];
  for (const pid of purchasedIds) {
    const mapped = (unlocks ?? []).filter((u) => u.purchasable_course_id === pid);
    // Bez unlocks mapiranja proizvod JESTE sadržaj (isto ponašanje kao grant-access).
    for (const cid of mapped.length > 0 ? mapped.map((u) => u.content_course_id) : [pid]) {
      if (!contentIds.includes(cid)) contentIds.push(cid);
    }
  }
  return firstLessonForCourses(admin, contentIds);
}
