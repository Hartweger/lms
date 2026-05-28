import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import ProgressBar from "@/components/ProgressBar";
import type { Course } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface CourseWithProgress extends Course {
  progress: number;
  totalLessons: number;
  completedLessons: number;
  currentLessonId: string | null;
  currentLessonTitle: string | null;
}

export default async function AdminStudentPregled({ params }: PageProps) {
  const { id: studentId } = await params;

  // Verify current user is admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/prijava");

  const { data: adminProfile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") redirect("/dashboard");

  // Use admin client to read student data (bypasses RLS)
  const admin = createAdminClient();

  const { data: student } = await admin
    .from("user_profiles")
    .select("id, full_name, email")
    .eq("id", studentId)
    .single();

  if (!student) notFound();

  // Get student's active course access
  const now = new Date().toISOString();
  const { data: accessList } = await admin
    .from("course_access")
    .select("course_id, expires_at")
    .eq("user_id", studentId);

  const courseIds = (accessList ?? [])
    .filter((a) => !a.expires_at || a.expires_at >= now)
    .map((a) => a.course_id);

  let courses: CourseWithProgress[] = [];

  if (courseIds.length > 0) {
    const { data: courseData } = await admin
      .from("courses")
      .select("*")
      .in("id", courseIds);

    if (courseData) {
      courses = await Promise.all(
        (courseData as Course[]).map(async (course) => {
          const { data: lessons } = await admin
            .from("lessons")
            .select("id, title, order_index")
            .eq("course_id", course.id)
            .order("order_index");

          const lessonList = lessons ?? [];
          const lessonIds = lessonList.map((l) => l.id);
          let completedLessons = 0;
          let currentLessonId: string | null = null;
          let currentLessonTitle: string | null = null;

          if (lessonIds.length > 0) {
            const { data: progress } = await admin
              .from("lesson_progress")
              .select("lesson_id")
              .eq("user_id", studentId)
              .eq("completed", true)
              .in("lesson_id", lessonIds);

            const completedIds = new Set(progress?.map((p) => p.lesson_id) ?? []);
            completedLessons = completedIds.size;

            const firstUncompleted = lessonList.find((l) => !completedIds.has(l.id));
            if (firstUncompleted) {
              currentLessonId = firstUncompleted.id;
              currentLessonTitle = firstUncompleted.title;
            } else if (lessonList.length > 0) {
              const lastLesson = lessonList[lessonList.length - 1];
              currentLessonId = lastLesson.id;
              currentLessonTitle = lastLesson.title;
            }
          }

          const totalLessons = lessonList.length;
          const progressPercent = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

          return {
            ...course,
            progress: progressPercent,
            totalLessons,
            completedLessons,
            currentLessonId,
            currentLessonTitle,
          };
        })
      );
    }
  }

  // Check certificates
  const { data: certificates } = await admin
    .from("certificates")
    .select("id, course_id")
    .eq("user_id", studentId);

  const certifiedCourseIds = new Set(certificates?.map((c) => c.course_id) ?? []);
  const getCertificateId = (courseId: string) =>
    certificates?.find((c) => c.course_id === courseId)?.id ?? null;

  const primaryCourse = courses[0] ?? null;
  const secondaryCourses = courses.slice(1);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Admin banner */}
      <div className="bg-gray-900 text-white rounded-xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Pregled kao student</p>
          <p className="font-bold">{student.full_name || student.email}</p>
        </div>
        <Link
          href={`/admin/studenti/${studentId}`}
          className="text-sm bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Nazad na admin
        </Link>
      </div>

      {/* Student dashboard replica */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Zdravo, {student.full_name || "učeniče"}!
        </h1>
      </div>

      {primaryCourse ? (
        <>
          {/* Primary Course Block */}
          <div className="bg-white rounded-xl p-5 border-2 border-plava shadow-sm mb-4">
            <div className="text-xs font-bold text-plava tracking-wide mb-2">
              {primaryCourse.progress === 100 ? "KURS ZAVRŠEN" : "TRENUTNI KURS"}
            </div>
            <h2 className="font-bold text-lg text-gray-900 mb-1">
              {primaryCourse.title}
            </h2>
            {primaryCourse.currentLessonTitle && (
              <p className="text-sm text-gray-500 mb-3">
                {primaryCourse.progress === 100 ? "Poslednja lekcija:" : "Sledeća lekcija:"} {primaryCourse.currentLessonTitle}
              </p>
            )}
            <ProgressBar progress={primaryCourse.progress} className="mb-1" />
            <p className="text-xs text-gray-400 mb-4">
              {primaryCourse.completedLessons} od {primaryCourse.totalLessons} lekcija
            </p>
            {primaryCourse.progress === 100 && certifiedCourseIds.has(primaryCourse.id) && (
              <div className="bg-green-50 text-green-700 border border-green-200 py-3 rounded-lg text-sm text-center mb-2">
                Sertifikat izdat
              </div>
            )}
            <Link
              href={primaryCourse.currentLessonId ? `/lekcija/${primaryCourse.currentLessonId}` : `/kurs/${primaryCourse.slug}`}
              className="block w-full text-center bg-plava text-white py-3 rounded-lg font-bold text-sm hover:bg-plava-dark transition-colors"
            >
              Pogledaj lekciju
            </Link>
          </div>

          {/* Secondary Courses */}
          {secondaryCourses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 tracking-wide mb-2">
                OSTALI KURSEVI
              </p>
              <div className="space-y-2">
                {secondaryCourses.map((course) => (
                  <div key={course.id} className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-gray-900">
                          {course.title}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {course.completedLessons} od {course.totalLessons} lekcija ({course.progress}%)
                        </p>
                      </div>
                      {course.progress === 100 && certifiedCourseIds.has(course.id) ? (
                        <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                          Sertifikat
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-plava bg-plava-light px-3 py-1.5 rounded-lg">
                          {course.progress}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-400">Ovaj student nema aktivne kurseve.</p>
        </div>
      )}
    </div>
  );
}
