"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Course, Lesson } from "@/lib/types";

export default function IzmeniKurs() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("id", params.id)
        .single();
      if (courseData) setCourse(courseData as Course);

      const { data: lessonData } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", params.id)
        .order("order_index");
      if (lessonData) setLessons(lessonData as Lesson[]);

      setLoading(false);
    };
    load();
  }, [params.id, supabase]);

  const handleSaveCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);

    await supabase
      .from("courses")
      .update({
        title: form.get("title") as string,
        description: form.get("description") as string,
        course_type: form.get("course_type") as string,
        price: parseFloat(form.get("price") as string) || 0,
        is_published: form.get("is_published") === "on",
      })
      .eq("id", params.id);

    setSaving(false);
    router.refresh();
  };

  const handleAddLesson = async () => {
    const { data } = await supabase
      .from("lessons")
      .insert({
        course_id: params.id,
        title: "Nova lekcija",
        lesson_type: "text",
        content: "",
        order_index: lessons.length,
      })
      .select()
      .single();

    if (data) setLessons([...lessons, data as Lesson]);
  };

  const handleUpdateLesson = async (lessonId: string, field: string, value: string | boolean) => {
    await supabase
      .from("lessons")
      .update({ [field]: value })
      .eq("id", lessonId);

    setLessons(
      lessons.map((l) => (l.id === lessonId ? { ...l, [field]: value } : l))
    );
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Obrisati lekciju?")) return;
    await supabase.from("lessons").delete().eq("id", lessonId);
    setLessons(lessons.filter((l) => l.id !== lessonId));
  };

  if (loading) return <div className="text-gray-400">Učitavanje...</div>;
  if (!course) return <div className="text-koral">Kurs nije pronađen.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Izmeni kurs</h1>

      <form onSubmit={handleSaveCourse} className="max-w-xl space-y-4 mb-12">
        <input
          name="title"
          defaultValue={course.title}
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-plava"
        />
        <textarea
          name="description"
          defaultValue={course.description}
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-plava"
        />
        <div className="flex gap-4">
          <select
            name="course_type"
            defaultValue={course.course_type}
            className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-plava"
          >
            <option value="video">Video kurs</option>
            <option value="individual">1:1 Nastava</option>
            <option value="group">Grupna nastava</option>
          </select>
          <input
            name="price"
            type="number"
            defaultValue={course.price}
            className="w-32 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-plava"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            name="is_published"
            type="checkbox"
            defaultChecked={course.is_published}
            id="pub"
          />
          <label htmlFor="pub" className="text-sm text-gray-700">Objavljeno</label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-plava text-white px-6 py-2 rounded-lg hover:bg-plava-dark transition-colors disabled:opacity-50 text-sm"
        >
          {saving ? "Čuvam..." : "Sačuvaj izmene"}
        </button>
      </form>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Lekcije</h2>
          <button
            onClick={handleAddLesson}
            className="bg-plava text-white px-4 py-2 rounded-lg text-sm hover:bg-plava-dark transition-colors"
          >
            + Dodaj lekciju
          </button>
        </div>

        <div className="space-y-4">
          {lessons.map((lesson, i) => (
            <div key={lesson.id} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-full bg-plava-light text-plava text-sm font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 space-y-3">
                  <input
                    value={lesson.title}
                    onChange={(e) => handleUpdateLesson(lesson.id, "title", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                  />
                  <div className="flex gap-3">
                    <select
                      value={lesson.lesson_type}
                      onChange={(e) => handleUpdateLesson(lesson.id, "lesson_type", e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="video">Video</option>
                      <option value="text">Tekst</option>
                      <option value="pdf">PDF</option>
                      <option value="image">Slika</option>
                    </select>
                    <label className="flex items-center gap-1 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={lesson.is_free_preview}
                        onChange={(e) =>
                          handleUpdateLesson(lesson.id, "is_free_preview", e.target.checked)
                        }
                      />
                      Besplatan pregled
                    </label>
                  </div>
                  {lesson.lesson_type === "video" && (
                    <input
                      value={lesson.vimeo_video_id ?? ""}
                      onChange={(e) => handleUpdateLesson(lesson.id, "vimeo_video_id", e.target.value)}
                      placeholder="Vimeo Video ID (npr. 123456789)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  )}
                  <textarea
                    value={lesson.content}
                    onChange={(e) => handleUpdateLesson(lesson.id, "content", e.target.value)}
                    placeholder={lesson.lesson_type === "pdf" ? "URL do PDF fajla" : "Sadržaj lekcije..."}
                    rows={lesson.lesson_type === "text" ? 6 : 2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <Link
                  href={`/admin/vezbe/${lesson.id}`}
                  className="text-plava hover:underline text-sm shrink-0"
                >
                  Vežbe
                </Link>
                <button
                  onClick={() => handleDeleteLesson(lesson.id)}
                  className="text-koral hover:text-koral-dark text-sm shrink-0"
                >
                  Obriši
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
