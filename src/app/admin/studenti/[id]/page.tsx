"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Course, UserProfile } from "@/lib/types";

export default function AdminStudentDetalji() {
  const params = useParams();
  const supabase = createClient();
  const [student, setStudent] = useState<UserProfile | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [accessCourseIds, setAccessCourseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: studentData } = await supabase.from("user_profiles").select("*").eq("id", params.id).single();
      if (studentData) setStudent(studentData as UserProfile);
      const { data: courses } = await supabase.from("courses").select("*");
      if (courses) setAllCourses(courses as Course[]);
      const { data: access } = await supabase.from("course_access").select("course_id").eq("user_id", params.id);
      if (access) setAccessCourseIds(access.map((a) => a.course_id));
      setLoading(false);
    };
    load();
  }, [params.id, supabase]);

  const toggleAccess = async (courseId: string) => {
    if (accessCourseIds.includes(courseId)) {
      await supabase.from("course_access").delete().eq("user_id", params.id).eq("course_id", courseId);
      setAccessCourseIds(accessCourseIds.filter((id) => id !== courseId));
    } else {
      await supabase.from("course_access").insert({ user_id: params.id, course_id: courseId });
      setAccessCourseIds([...accessCourseIds, courseId]);
    }
  };

  if (loading) return <div className="text-gray-400">Učitavanje...</div>;
  if (!student) return <div className="text-koral">Student nije pronađen.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{student.full_name || "Bez imena"}</h1>
      <p className="text-gray-500 mb-8">{student.email}</p>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Pristup kursevima</h2>
      <div className="space-y-3">
        {allCourses.map((course) => {
          const hasAccess = accessCourseIds.includes(course.id);
          return (
            <div key={course.id} className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
              <div>
                <div className="font-medium text-gray-900">{course.title}</div>
                <div className="text-xs text-gray-400">{course.course_type}</div>
              </div>
              <button
                onClick={() => toggleAccess(course.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  hasAccess ? "bg-koral-light text-koral hover:bg-koral hover:text-white" : "bg-plava-light text-plava hover:bg-plava hover:text-white"
                }`}
              >
                {hasAccess ? "Ukloni pristup" : "Dodeli pristup"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
