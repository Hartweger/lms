"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import KursKartica from "@/components/KursKartica";
import type { Course } from "@/lib/types";

export default function Pocetna() {
  const supabase = useMemo(() => createClient(), []);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (data) setCourses(data as Course[]);
      setLoading(false);
    };
    load();
  }, [supabase]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Naučite <span className="text-plava">nemački</span> jezik
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Video kursevi, individualna nastava i grupni časovi sa iskusnim profesorima
        </p>
      </div>

      {/* Course grid */}
      {loading ? (
        <p className="text-center text-gray-400">Učitavanje...</p>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <KursKartica key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400">Kursevi će uskoro biti dostupni.</p>
      )}
    </div>
  );
}
