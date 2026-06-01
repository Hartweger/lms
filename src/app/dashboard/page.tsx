import Link from "next/link";
import { Play, RotateCcw, ArrowRight, Award, GraduationCap, BookOpen } from "lucide-react";
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
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isProfessor = profile?.role === "professor";

  let courseIds: string[] = [];

  if (isAdmin || isProfessor) {
    // Admins and professors see all courses
    const { data: allCourses } = await supabase
      .from("courses")
      .select("id");
    courseIds = allCourses?.map((c) => c.id) ?? [];
  } else {
    // Students: filter out expired access
    const { data: accessList } = await supabase
      .from("course_access")
      .select("course_id, expires_at")
      .eq("user_id", user.id);

    const now = new Date().toISOString();
    courseIds = (accessList ?? [])
      .filter((a) => !a.expires_at || a.expires_at >= now)
      .map((a) => a.course_id);
  }

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
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Greeting + Quote */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Zdravo, {profile?.full_name || "učeniče"}!
        </h1>
        <p className="text-sm text-gray-500 italic mt-1">
          „{quote.text_de}“
          {quote.show_translation && (
            <span className="text-gray-400"> — {quote.text_sr}</span>
          )}
        </p>
      </div>

      {primaryCourse ? (
        <>
          {/* Primary Course Block */}
          <div className="bg-white rounded-2xl p-6 border border-plava/30 shadow-md mb-8 sm:flex sm:items-center sm:gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-koral tracking-wide mb-2">
                <BookOpen className="w-3.5 h-3.5" strokeWidth={2.5} />
                {allCompleted ? "PONOVI KURS" : "NASTAVI SA UČENJEM"}
              </div>
              <h2 className="font-bold text-xl text-gray-900 mb-1">
                {primaryCourse.title}
              </h2>
              {primaryCourse.currentLessonTitle && (
                <p className="text-sm text-gray-500 mb-3">
                  {primaryCourse.currentLessonTitle}
                </p>
              )}
              <ProgressBar progress={primaryCourse.progress} className="mb-1" />
              <p className="text-xs text-gray-400">
                {primaryCourse.completedLessons} od {primaryCourse.totalLessons} lekcija
              </p>
            </div>

            <div className="mt-5 sm:mt-0 sm:w-56 shrink-0 space-y-2">
              {/* Certificate status */}
              {allCompleted && certifiedCourseIds.has(primaryCourse.id) && (
                <Link
                  href={`/sertifikat/${getCertificateId(primaryCourse.id)}`}
                  className="flex items-center justify-center gap-2 w-full bg-green-50 text-green-700 border border-green-200 py-3 rounded-xl font-bold text-sm hover:bg-green-100 transition-colors"
                >
                  <Award className="w-4 h-4" strokeWidth={2.5} />
                  Preuzmi sertifikat
                </Link>
              )}
              {allCompleted && !certifiedCourseIds.has(primaryCourse.id) && (
                <div className="bg-plava-light text-plava-dark text-sm rounded-xl p-3 text-center">
                  Sve lekcije završene! Položi završni ispit za sertifikat.
                </div>
              )}

              <Link
                href={primaryCourse.currentLessonId ? `/lekcija/${primaryCourse.currentLessonId}` : `/kurs/${primaryCourse.slug}`}
                className="flex items-center justify-center gap-2 w-full bg-plava text-white py-3 rounded-xl font-bold text-sm hover:bg-plava-dark transition-colors"
              >
                {allCompleted ? (
                  <RotateCcw className="w-4 h-4" strokeWidth={2.5} />
                ) : (
                  <Play className="w-4 h-4 fill-current" strokeWidth={2.5} />
                )}
                {allCompleted ? "Ponovi" : "Nastavi"}
              </Link>
            </div>
          </div>

          {/* Secondary Courses */}
          {secondaryCourses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 tracking-wide mb-3">
                OSTALI KURSEVI
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {secondaryCourses.map((course) => (
                  <Link
                    key={course.id}
                    href={course.currentLessonId ? `/lekcija/${course.currentLessonId}` : `/kurs/${course.slug}`}
                    className="flex flex-col bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md hover:border-plava/30 transition-all"
                  >
                    <h3 className="font-bold text-sm text-gray-900">
                      {course.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5 mb-3">
                      {course.completedLessons} od {course.totalLessons} lekcija
                    </p>
                    <ProgressBar progress={course.progress} className="mb-3" />
                    {course.progress === 100 && certifiedCourseIds.has(course.id) ? (
                      <span className="mt-auto inline-flex items-center gap-1 self-start text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                        <Award className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Sertifikat
                      </span>
                    ) : (
                      <span className="mt-auto inline-flex items-center gap-1 self-start text-xs font-semibold text-plava bg-plava-light px-3 py-1.5 rounded-lg">
                        Nastavi
                        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="text-center py-16">
          <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-gray-400 mb-4">Nemaš upisane kurseve.</p>
          <a
            href="https://hartweger.rs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-plava text-white px-6 py-3 rounded-xl font-bold hover:bg-plava-dark transition-colors"
          >
            Kupi kurs na hartweger.rs
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </a>
        </div>
      )}
    </div>
  );
}
