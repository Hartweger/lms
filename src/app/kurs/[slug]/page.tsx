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
      images: [{ url: "/og/share.png", width: 1200, height: 630, alt: "Hartweger — Škola nemačkog jezika" }],
      title: course.title,
      description: course.description,
    },
  };
}

export const dynamic = "force-dynamic";

// Group lessons into modules based on badge.module in sections
function groupByModules(lessons: Lesson[]) {
  const modules: { name: string; lessons: Lesson[] }[] = [];
  let currentName = "";
  let current: Lesson[] = [];

  for (const lesson of lessons) {
    // Determine module name from badge section, test title, or modelltest
    let moduleName = "";
    if (lesson.sections) {
      const badge = lesson.sections.find((s) => s.type === "badge") as { type: string; module?: string } | undefined;
      if (badge?.module) moduleName = badge.module;
    }
    // Test lessons: "Test Modul X" or "Test: Modul X"
    if (lesson.title.match(/^Test:?\s+Modul/i)) {
      moduleName = moduleName || "Test";
    }
    // Modelltest
    if (lesson.title.toLowerCase().includes("modelltest")) {
      moduleName = "Završni ispit";
    }
    // Fallback
    if (!moduleName) moduleName = currentName || "Lekcije";

    if (moduleName !== currentName) {
      if (current.length > 0) {
        modules.push({ name: currentName, lessons: current });
      }
      currentName = moduleName;
      current = [lesson];
    } else {
      current.push(lesson);
    }
  }
  if (current.length > 0) {
    modules.push({ name: currentName, lessons: current });
  }

  return modules;
}

const moduleColors = [
  "bg-plava text-white",
  "bg-koral text-white",
  "bg-zelena text-white",
  "bg-narandzasta text-white",
  "bg-ljubicasta text-white",
  "bg-plava-dark text-white",
  "bg-koral-dark text-white",
  "bg-gray-700 text-white",
];

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

  const { data: previewLessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", typedCourse.id)
    .eq("is_free_preview", true)
    .order("order_index");

  let allLessons: Lesson[] = [];
  const { data: { user } } = await supabase.auth.getUser();
  let hasAccess = false;
  let accessExpired = false;
  if (user) {
    // Check if user is admin
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    // Admins and professors see all course content (but not financial/admin area).
    const isStaff = userProfile?.role === "admin" || userProfile?.role === "professor";

    if (isStaff) {
      hasAccess = true;
    } else {
      const { data: access } = await supabase
        .from("course_access")
        .select("id, expires_at")
        .eq("user_id", user.id)
        .eq("course_id", typedCourse.id)
        .single();
      if (access) {
        const now = new Date().toISOString();
        if (access.expires_at && access.expires_at < now) {
          hasAccess = false;
          accessExpired = true;
        } else {
          hasAccess = true;
        }
      }
    }
    if (hasAccess) {
      const { data: lessons } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", typedCourse.id)
        .order("order_index");
      allLessons = (lessons as Lesson[]) || [];
    }
  }

  const modules = hasAccess ? groupByModules(allLessons) : [];

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
        <div></div>
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

      {/* Handbook link */}
      {hasAccess && typedCourse.handbook_url && (
        <div className="bg-plava-light rounded-xl p-5 mb-8 flex items-center gap-4">
          <span className="text-2xl shrink-0">📖</span>
          <div className="flex-1">
            <div className="font-bold text-gray-900">Priručnik za kurs</div>
            <div className="text-sm text-gray-600">PDF priručnik sa svim lekcijama i vežbama</div>
          </div>
          <a
            href={typedCourse.handbook_url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-plava text-white px-5 py-2.5 rounded-lg font-medium hover:bg-plava-dark transition-colors text-sm shrink-0"
          >
            Otvori →
          </a>
        </div>
      )}

      {/* Expired access message */}
      {accessExpired && (
        <div className="bg-koral-light border border-koral rounded-xl p-6 mb-6 text-center">
          <p className="text-koral-dark font-medium mb-2">Tvoj pristup ovom kursu je istekao.</p>
          <a href="https://www.hartweger.rs" className="text-plava hover:underline">
            Obnovi pristup na hartweger.rs →
          </a>
        </div>
      )}

      {/* Lessons grouped by module */}
      {hasAccess && modules.length > 0 && (
        <div className="space-y-6">
          {modules.map((mod, mi) => (
            <div key={mi}>
              {/* Module header */}
              <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-3 ${moduleColors[mi % moduleColors.length]}`}>
                {mod.name}
              </div>
              <div className="space-y-2">
                {mod.lessons.map((lesson) => {
                  const isTest = lesson.title.startsWith("Test:") || lesson.title.startsWith("Test Modul");
                  return (
                    <Link
                      key={lesson.id}
                      href={`/lekcija/${lesson.id}`}
                      className={`block rounded-lg p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow ${
                        isTest ? "bg-koral-light border-l-4 border-koral" : "bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isTest ? (
                          <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-koral text-white text-xs font-bold flex items-center justify-center shrink-0">
                            ✓
                          </span>
                        ) : (
                          <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-plava-light text-plava text-xs md:text-sm font-bold flex items-center justify-center shrink-0">
                            {lesson.order_index}
                          </span>
                        )}
                        <span className={`font-medium text-sm md:text-base ${isTest ? "text-koral-dark" : "text-gray-900"}`}>
                          {lesson.title}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Free preview lessons */}
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
