import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProgressBar from "@/components/ProgressBar";
import type { Course } from "@/lib/types";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's courses with access
  const { data: accessList } = await supabase
    .from("course_access")
    .select("course_id")
    .eq("user_id", user.id);

  const courseIds = accessList?.map((a) => a.course_id) ?? [];

  let courses: (Course & { progress: number; totalLessons: number; completedLessons: number })[] = [];

  if (courseIds.length > 0) {
    const { data: courseData } = await supabase
      .from("courses")
      .select("*")
      .in("id", courseIds);

    if (courseData) {
      courses = await Promise.all(
        (courseData as Course[]).map(async (course) => {
          const { count: totalLessons } = await supabase
            .from("lessons")
            .select("*", { count: "exact", head: true })
            .eq("course_id", course.id);

          const { data: lessonIds } = await supabase
            .from("lessons")
            .select("id")
            .eq("course_id", course.id);

          const ids = lessonIds?.map((l) => l.id) ?? [];
          let completedLessons = 0;

          if (ids.length > 0) {
            const { count } = await supabase
              .from("lesson_progress")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("completed", true)
              .in("lesson_id", ids);
            completedLessons = count ?? 0;
          }

          const total = totalLessons ?? 0;
          const progress = total > 0 ? Math.round((completedLessons / total) * 100) : 0;

          return { ...course, progress, totalLessons: total, completedLessons };
        })
      );
    }
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Zdravo, {profile?.full_name || "učeniče"}!
      </h1>
      <p className="text-gray-500 mb-8">Nastavi gde si stao/la</p>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/kurs/${course.slug}`}
              className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <span>
                  {course.completedLessons} od {course.totalLessons} lekcija
                </span>
                <span className="text-plava font-medium">{course.progress}%</span>
              </div>
              <ProgressBar progress={course.progress} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">Još nemate nijedan kurs.</p>
          <Link
            href="/"
            className="inline-block bg-plava text-white px-6 py-3 rounded-lg hover:bg-plava-dark transition-colors"
          >
            Pregledajte kurseve
          </Link>
        </div>
      )}
    </div>
  );
}
