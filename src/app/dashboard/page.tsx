import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProgressBar from "@/components/ProgressBar";
import quotesData from "@/data/quotes.json";
import type { Course } from "@/lib/types";

export const dynamic = "force-dynamic";

interface CourseWithProgress extends Course {
  progress: number;
  totalLessons: number;
  completedLessons: number;
  currentLessonId: string | null;
  currentLessonTitle: string | null;
  lastActivityAt: string | null;
}

async function getCourseProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  course: Course
): Promise<CourseWithProgress> {
  // Get all lessons ordered by index
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .eq("course_id", course.id)
    .order("order_index");

  const lessonList = lessons ?? [];
  const lessonIds = lessonList.map((l) => l.id);
  let completedLessons = 0;
  let lastActivityAt: string | null = null;
  let currentLessonId: string | null = null;
  let currentLessonTitle: string | null = null;

  if (lessonIds.length > 0) {
    // Get completed lessons with timestamps
    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("lesson_id, completed_at")
      .eq("user_id", userId)
      .eq("completed", true)
      .in("lesson_id", lessonIds);

    const completedIds = new Set(progress?.map((p) => p.lesson_id) ?? []);
    completedLessons = completedIds.size;

    // Find most recent activity
    if (progress && progress.length > 0) {
      lastActivityAt = progress.reduce((latest, p) =>
        p.completed_at && (!latest || p.completed_at > latest) ? p.completed_at : latest,
        null as string | null
      );
    }

    // Find first uncompleted lesson (current lesson)
    const firstUncompleted = lessonList.find((l) => !completedIds.has(l.id));
    if (firstUncompleted) {
      currentLessonId = firstUncompleted.id;
      currentLessonTitle = firstUncompleted.title;
    } else if (lessonList.length > 0) {
      // All completed — show last lesson
      const lastLesson = lessonList[lessonList.length - 1];
      currentLessonId = lastLesson.id;
      currentLessonTitle = lastLesson.title;
    }
  }

  const totalLessons = lessonList.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return {
    ...course,
    progress: progressPercent,
    totalLessons,
    completedLessons,
    currentLessonId,
    currentLessonTitle,
    lastActivityAt,
  };
}

function getRandomQuote() {
  const quotes = quotesData.quotes;
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: accessList } = await supabase
    .from("course_access")
    .select("course_id")
    .eq("user_id", user.id);

  const courseIds = accessList?.map((a) => a.course_id) ?? [];
  let courses: CourseWithProgress[] = [];

  if (courseIds.length > 0) {
    const { data: courseData } = await supabase
      .from("courses")
      .select("*")
      .in("id", courseIds);

    if (courseData) {
      courses = await Promise.all(
        (courseData as Course[]).map((course) =>
          getCourseProgress(supabase, user.id, course)
        )
      );

      // Sort: most recently interacted first
      courses.sort((a, b) => {
        if (!a.lastActivityAt && !b.lastActivityAt) return 0;
        if (!a.lastActivityAt) return 1;
        if (!b.lastActivityAt) return -1;
        return b.lastActivityAt.localeCompare(a.lastActivityAt);
      });
    }
  }

  const quote = getRandomQuote();
  const primaryCourse = courses[0] ?? null;
  const secondaryCourses = courses.slice(1);
  const allCompleted = primaryCourse?.progress === 100;

  // Check for existing certificates
  const { data: certificates } = await supabase
    .from("certificates")
    .select("id, course_id")
    .eq("user_id", user.id);

  const certifiedCourseIds = new Set(certificates?.map((c) => c.course_id) ?? []);
  const getCertificateId = (courseId: string) =>
    certificates?.find((c) => c.course_id === courseId)?.id ?? null;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Greeting + Quote */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Zdravo, {profile?.full_name || "učeniče"}! 👋
        </h1>
        <p className="text-sm text-gray-500 italic mt-1">
          „{quote.text_de}"
          {quote.show_translation && (
            <span className="text-gray-400"> — {quote.text_sr}</span>
          )}
        </p>
      </div>

      {primaryCourse ? (
        <>
          {/* Primary Course Block */}
          <div className="bg-white rounded-xl p-5 border-2 border-plava shadow-sm mb-4">
            <div className="text-xs font-bold text-plava tracking-wide mb-2">
              {allCompleted ? "PONOVI KURS" : "NASTAVI GDE SI STAO"}
            </div>
            <h2 className="font-bold text-lg text-gray-900 mb-1">
              {primaryCourse.title}
            </h2>
            {primaryCourse.currentLessonTitle && (
              <p className="text-sm text-gray-500 mb-3">
                {primaryCourse.currentLessonTitle}
              </p>
            )}
            <ProgressBar progress={primaryCourse.progress} className="mb-1" />
            <p className="text-xs text-gray-400 mb-4">
              {primaryCourse.completedLessons} od {primaryCourse.totalLessons} lekcija
            </p>
            {/* Certificate status */}
            {allCompleted && certifiedCourseIds.has(primaryCourse.id) && (
              <Link
                href={`/sertifikat/${getCertificateId(primaryCourse.id)}`}
                className="block w-full text-center bg-green-50 text-green-700 border border-green-200 py-3 rounded-lg font-bold text-sm mb-2 hover:bg-green-100 transition-colors"
              >
                Preuzmi sertifikat
              </Link>
            )}
            {allCompleted && !certifiedCourseIds.has(primaryCourse.id) && (
              <div className="bg-plava-light text-plava-dark text-sm rounded-lg p-3 mb-2 text-center">
                Sve lekcije završene! Položi završni ispit za sertifikat.
              </div>
            )}

            <Link
              href={primaryCourse.currentLessonId ? `/lekcija/${primaryCourse.currentLessonId}` : `/kurs/${primaryCourse.slug}`}
              className="block w-full text-center bg-plava text-white py-3 rounded-lg font-bold text-sm hover:bg-plava-dark transition-colors"
            >
              ▶ {allCompleted ? "Ponovi" : "Nastavi"}
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
                    <Link
                      href={course.currentLessonId ? `/lekcija/${course.currentLessonId}` : `/kurs/${course.slug}`}
                      className="flex items-center justify-between hover:opacity-80 transition-opacity"
                    >
                      <div>
                        <h3 className="font-bold text-sm text-gray-900">
                          {course.title}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {course.completedLessons} od {course.totalLessons} lekcija
                        </p>
                      </div>
                      {course.progress === 100 && certifiedCourseIds.has(course.id) ? (
                        <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                          Sertifikat
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-plava bg-plava-light px-3 py-1.5 rounded-lg">
                          Nastavi →
                        </span>
                      )}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">Nemaš upisane kurseve.</p>
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
