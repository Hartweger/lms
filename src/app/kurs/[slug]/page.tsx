import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Course, Lesson } from "@/lib/types";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("title, description")
    .eq("slug", slug)
    .single();

  if (!course) return { title: "Kurs nije pronađen" };

  return {
    title: `${course.title} — Hartweger`,
    description: course.description,
    openGraph: {
      title: course.title,
      description: course.description,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function KursStranica({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!course) notFound();

  const typedCourse = course as Course;

  // Fetch free preview lessons (RLS allows this for anyone)
  const { data: previewLessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", typedCourse.id)
    .eq("is_free_preview", true)
    .order("order_index");

  // Fetch all lessons if user has access
  let allLessons: Lesson[] = [];

  // Check if current user has access
  const { data: { user } } = await supabase.auth.getUser();
  let hasAccess = false;
  if (user) {
    const { data: access } = await supabase
      .from("course_access")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", typedCourse.id)
      .single();
    hasAccess = !!access;
    if (hasAccess) {
      const { data: lessons } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", typedCourse.id)
        .order("order_index");
      allLessons = (lessons as Lesson[]) || [];
    }
  }

  // Get total lesson count
  const { count: lessonCount } = await supabase
    .from("lessons")
    .select("*", { count: "exact", head: true })
    .eq("course_id", typedCourse.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          {typedCourse.title}
        </h1>
        <p className="text-gray-500 mt-4 text-lg">{typedCourse.description}</p>
      </div>

      {/* CTA */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          {lessonCount && (
            <div className="text-sm text-gray-500">{lessonCount} lekcija</div>
          )}
        </div>
        {hasAccess ? (
          <Link
            href="/dashboard"
            className="bg-plava text-white px-8 py-3 rounded-lg font-medium hover:bg-plava-dark transition-colors"
          >
            Nastavi učenje →
          </Link>
        ) : (
          <a
            href={user ? "https://www.hartweger.rs/prodavnica/" : "/prijava"}
            className="bg-koral text-white px-8 py-3 rounded-lg font-medium hover:bg-koral-dark transition-colors"
          >
            {user ? "Kupi na hartweger.rs →" : "Prijavi se"}
          </a>
        )}
      </div>

      {/* All lessons — for users with access */}
      {hasAccess && allLessons.length > 0 && (
        <div className="mb-8">
          <details open className="group">
            <summary className="flex items-center justify-between cursor-pointer mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Lekcije ({allLessons.length})
              </h2>
              <span className="text-sm text-plava group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="space-y-2">
              {allLessons.map((lesson, i) => (
                <Link
                  key={lesson.id}
                  href={`/lekcija/${lesson.id}`}
                  className="block bg-white rounded-lg p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-plava-light text-plava text-xs md:text-sm font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-900 text-sm md:text-base">{lesson.title}</span>
                    {lesson.lesson_type === "video" && (
                      <span className="text-xs text-gray-400 ml-auto shrink-0">▶</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Free preview lessons — for users without access */}
      {!hasAccess && previewLessons && previewLessons.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Besplatne probne lekcije
          </h2>
          <div className="space-y-3">
            {(previewLessons as Lesson[]).map((lesson, i) => (
              <Link
                key={lesson.id}
                href={`/lekcija/${lesson.id}`}
                className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-plava-light text-plava text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{lesson.title}</div>
                    <div className="text-xs text-plava">Besplatno — klikni za pregled</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
