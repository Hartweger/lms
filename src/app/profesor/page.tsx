import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveProfessorView } from "@/lib/professor-view";

export const dynamic = "force-dynamic";

interface StudentWithProgress {
  id: string;
  full_name: string;
  email: string;
  course_title: string;
  course_id: string;
  total_lessons: number;
  completed_lessons: number;
  progress: number;
  last_activity: string | null;
}

export default async function ProfesorStudenti({ searchParams }: { searchParams: Promise<{ prof?: string }> }) {
  const { prof } = await searchParams;
  const ctx = await resolveProfessorView(prof);
  if (!ctx) return null;
  const admin = createAdminClient();
  const profId = ctx.profId;

  // Get all students assigned to this professor
  const { data: assignments } = await admin
    .from("professor_students")
    .select("student_id, course_id")
    .eq("professor_id", profId);

  if (!assignments || assignments.length === 0) {
    // Možda nema individualnih, ali ima grupe — uputi na „Moje grupe".
    const { count: groupCount } = await admin
      .from("groups").select("id", { count: "exact", head: true }).eq("professor_id", profId);
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">Nemaš dodeljenih individualnih (1:1) studenata.</p>
        {groupCount && groupCount > 0 ? (
          <p className="text-sm text-gray-500 mt-2">
            Imaš {groupCount} {groupCount === 1 ? "grupu" : "grupe"} — polaznike vidiš u{" "}
            <Link href="/profesor/grupe" className="text-plava underline font-medium">Moje grupe</Link>.
          </p>
        ) : (
          <p className="text-sm text-gray-300 mt-2">Admin će ti dodeliti studente.</p>
        )}
      </div>
    );
  }

  // Get unique student IDs and course IDs
  const studentIds = [...new Set(assignments.map((a) => a.student_id))];
  const courseIds = [...new Set(assignments.map((a) => a.course_id))];

  // Fetch student profiles
  const { data: profiles } = await admin
    .from("user_profiles")
    .select("id, full_name, email")
    .in("id", studentIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  // Fetch course info
  const { data: courses } = await admin
    .from("courses")
    .select("id, title")
    .in("id", courseIds);

  const courseMap = new Map(courses?.map((c) => [c.id, c]) ?? []);

  // Batch fetch: all lessons for relevant courses
  const { data: allLessons } = await admin
    .from("lessons")
    .select("id, course_id")
    .in("course_id", courseIds);

  // Group lessons by course
  const lessonsByCourse = new Map<string, string[]>();
  for (const l of allLessons ?? []) {
    const list = lessonsByCourse.get(l.course_id) ?? [];
    list.push(l.id);
    lessonsByCourse.set(l.course_id, list);
  }

  // Batch fetch: all progress for relevant students
  const { data: allProgress } = await admin
    .from("lesson_progress")
    .select("user_id, lesson_id, completed_at")
    .eq("completed", true)
    .in("user_id", studentIds);

  // Index progress by user+lesson
  const progressByUser = new Map<string, { lesson_id: string; completed_at: string | null }[]>();
  for (const p of allProgress ?? []) {
    const list = progressByUser.get(p.user_id) ?? [];
    list.push({ lesson_id: p.lesson_id, completed_at: p.completed_at });
    progressByUser.set(p.user_id, list);
  }

  // Compute progress per assignment
  const students: StudentWithProgress[] = [];

  for (const assignment of assignments) {
    const profile = profileMap.get(assignment.student_id);
    const course = courseMap.get(assignment.course_id);
    if (!profile || !course) continue;

    const lessonIds = new Set(lessonsByCourse.get(assignment.course_id) ?? []);
    const totalLessons = lessonIds.size;

    const userProgress = (progressByUser.get(assignment.student_id) ?? [])
      .filter((p) => lessonIds.has(p.lesson_id));

    const completedLessons = userProgress.length;
    const lastActivity = userProgress.reduce((latest, p) =>
      p.completed_at && (!latest || p.completed_at > latest)
        ? p.completed_at
        : latest,
      null as string | null
    );

    const progressPercent = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    students.push({
      id: assignment.student_id,
      full_name: profile.full_name ?? "",
      email: profile.email,
      course_title: course.title,
      course_id: assignment.course_id,
      total_lessons: totalLessons,
      completed_lessons: completedLessons,
      progress: progressPercent,
      last_activity: lastActivity,
    });
  }

  // Sort: most recent activity first
  students.sort((a, b) => {
    if (!a.last_activity && !b.last_activity) return 0;
    if (!a.last_activity) return 1;
    if (!b.last_activity) return -1;
    return b.last_activity.localeCompare(a.last_activity);
  });

  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">{students.length} studenata</p>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="text-left px-6 py-3">Ime</th>
              <th className="text-left px-6 py-3">Kurs</th>
              <th className="text-left px-6 py-3">Progres</th>
              <th className="text-left px-6 py-3">Poslednja aktivnost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {students.map((s, i) => (
              <tr key={`${s.id}-${s.course_id}-${i}`} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{s.full_name || "—"}</div>
                  <div className="text-xs text-gray-400">{s.email}</div>
                </td>
                <td className="px-6 py-4 text-gray-600">{s.course_title}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-plava h-2 rounded-full transition-all"
                        style={{ width: `${s.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {s.completed_lessons}/{s.total_lessons}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {s.last_activity
                    ? new Date(s.last_activity).toLocaleDateString("sr-Latn")
                    : "Nema aktivnosti"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
