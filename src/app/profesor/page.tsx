import { createClient } from "@/lib/supabase/server";

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

export default async function ProfesorStudenti() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get all students assigned to this professor
  const { data: assignments } = await supabase
    .from("professor_students")
    .select("student_id, course_id")
    .eq("professor_id", user.id);

  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">Nemaš dodeljene studente.</p>
        <p className="text-sm text-gray-300 mt-2">Admin će ti dodeliti studente.</p>
      </div>
    );
  }

  // Get unique student IDs and course IDs
  const studentIds = [...new Set(assignments.map((a) => a.student_id))];
  const courseIds = [...new Set(assignments.map((a) => a.course_id))];

  // Fetch student profiles
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, full_name, email")
    .in("id", studentIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  // Fetch course info
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .in("id", courseIds);

  const courseMap = new Map(courses?.map((c) => [c.id, c]) ?? []);

  // For each assignment, compute progress
  const students: StudentWithProgress[] = [];

  for (const assignment of assignments) {
    const profile = profileMap.get(assignment.student_id);
    const course = courseMap.get(assignment.course_id);
    if (!profile || !course) continue;

    // Get lesson count for this course
    const { data: lessons } = await supabase
      .from("lessons")
      .select("id")
      .eq("course_id", assignment.course_id);

    const lessonIds = lessons?.map((l) => l.id) ?? [];
    let completedLessons = 0;
    let lastActivity: string | null = null;

    if (lessonIds.length > 0) {
      const { data: progress } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed_at")
        .eq("user_id", assignment.student_id)
        .eq("completed", true)
        .in("lesson_id", lessonIds);

      completedLessons = progress?.length ?? 0;

      if (progress && progress.length > 0) {
        lastActivity = progress.reduce((latest, p) =>
          p.completed_at && (!latest || p.completed_at > latest)
            ? p.completed_at
            : latest,
          null as string | null
        );
      }
    }

    const totalLessons = lessonIds.length;
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
