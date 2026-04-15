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

const typeLabels: Record<string, string> = {
  video: "Video kurs",
  individual: "1:1 Nastava",
  group: "Grupna nastava",
};

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
        <span className="text-xs font-semibold uppercase tracking-wider text-plava">
          {typeLabels[typedCourse.course_type]}
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
          {typedCourse.title}
        </h1>
        <p className="text-gray-500 mt-4 text-lg">{typedCourse.description}</p>
      </div>

      {/* Price + CTA */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-3xl font-bold text-plava">
            {typedCourse.price.toLocaleString("sr-RS")} RSD
          </div>
          {lessonCount && (
            <div className="text-sm text-gray-400 mt-1">{lessonCount} lekcija</div>
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
          <Link
            href={user ? "#kupovina" : "/prijava"}
            className="bg-koral text-white px-8 py-3 rounded-lg font-medium hover:bg-koral-dark transition-colors"
          >
            {user ? "Kupi kurs" : "Prijavi se za kupovinu"}
          </Link>
        )}
      </div>

      {/* Free preview lessons */}
      {previewLessons && previewLessons.length > 0 && (
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
