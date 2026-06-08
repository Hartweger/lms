"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ProfessorRow {
  id: string;
  full_name: string;
  email: string;
  studentCount: number;
  groupCount?: number;
}

interface AssignmentRow {
  id: string;
  student_id: string;
  course_id: string;
  assigned_via: "manual" | "wc_variation" | "individual" | "group";
  student_name: string;
  student_email: string;
  course_title: string;
}

interface StudentOption {
  id: string;
  full_name: string | null;
  email: string;
}

interface CourseOption {
  id: string;
  title: string;
}

export default function AdminProfesori() {
  const supabase = createClient();
  const [professors, setProfessors] = useState<ProfessorRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail view
  const [selectedProf, setSelectedProf] = useState<ProfessorRow | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [allStudents, setAllStudents] = useState<StudentOption[]>([]);
  const [allCourses, setAllCourses] = useState<CourseOption[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Add form
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/admin/profesori");
      if (res.ok) {
        const { professors: rows } = await res.json();
        setProfessors(rows);
      }
      setLoading(false);
    };
    load();
  }, []);

  const openDetail = async (prof: ProfessorRow) => {
    setSelectedProf(prof);
    setLoadingDetail(true);

    const res = await fetch(`/api/admin/profesori/${prof.id}`);
    if (res.ok) {
      const data = await res.json();
      setAssignments(data.assignments);
      setAllStudents(data.students);
      setAllCourses(data.courses);
    }
    setLoadingDetail(false);
  };

  const addAssignment = async () => {
    if (!selectedProf || !selectedStudentId || !selectedCourseId) return;

    const { data, error } = await supabase
      .from("professor_students")
      .insert({
        professor_id: selectedProf.id,
        student_id: selectedStudentId,
        course_id: selectedCourseId,
        assigned_via: "manual",
      })
      .select("id, student_id, course_id, assigned_via")
      .single();

    if (error) {
      if (error.code === "23505") {
        alert("Ovaj student je već dodeljen za ovaj kurs.");
      } else {
        alert("Greška: " + error.message);
      }
      return;
    }

    if (data) {
      const student = allStudents.find((s) => s.id === data.student_id);
      const course = allCourses.find((c) => c.id === data.course_id);
      setAssignments([
        ...assignments,
        {
          id: data.id,
          student_id: data.student_id,
          course_id: data.course_id,
          assigned_via: data.assigned_via,
          student_name: student?.full_name ?? "",
          student_email: student?.email ?? "",
          course_title: course?.title ?? "",
        },
      ]);
      setSelectedStudentId("");
      setSelectedCourseId("");

      // Update count
      setProfessors(professors.map((p) =>
        p.id === selectedProf.id ? { ...p, studentCount: p.studentCount + 1 } : p
      ));
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    await supabase.from("professor_students").delete().eq("id", assignmentId);
    setAssignments(assignments.filter((a) => a.id !== assignmentId));
    setConfirmDeleteId(null);

    if (selectedProf) {
      setProfessors(professors.map((p) =>
        p.id === selectedProf.id ? { ...p, studentCount: Math.max(0, p.studentCount - 1) } : p
      ));
    }
  };

  if (loading) return <div className="text-gray-400">Učitavanje...</div>;

  // Detail view
  if (selectedProf) {
    return (
      <div>
        <button
          onClick={() => { setSelectedProf(null); setAssignments([]); }}
          className="text-sm text-plava hover:underline mb-4 inline-block"
        >
          ← Nazad na listu
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">{selectedProf.full_name}</h1>
        <p className="text-gray-500 mb-6">{selectedProf.email}</p>

        {/* Add assignment form */}
        <div className="bg-plava-light rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Student</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">Izaberi studenta...</option>
              {allStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name || s.email} ({s.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Kurs</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">Izaberi kurs...</option>
              {allCourses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <button
            onClick={addAssignment}
            disabled={!selectedStudentId || !selectedCourseId}
            className="px-4 py-2 bg-plava text-white rounded-lg text-sm font-medium hover:bg-plava-dark transition-colors disabled:opacity-50"
          >
            Dodeli
          </button>
        </div>

        {/* Current assignments */}
        {loadingDetail ? (
          <div className="text-gray-400">Učitavanje...</div>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
            Nema dodeljenih studenata.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="text-left px-6 py-3">Student</th>
                  <th className="text-left px-6 py-3">Kurs</th>
                  <th className="text-left px-6 py-3">Dodeljeno</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{a.student_name || "—"}</div>
                      <div className="text-xs text-gray-400">{a.student_email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{a.course_title}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        a.assigned_via === "individual"
                          ? "bg-green-50 text-green-600"
                          : a.assigned_via === "wc_variation"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {a.assigned_via === "individual" ? "Individualni (kupovina)" : a.assigned_via === "wc_variation" ? "WC automatski" : a.assigned_via === "group" ? "Grupni" : "Ručno"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {confirmDeleteId === a.id ? (
                        <span className="flex items-center justify-end gap-1">
                          <span className="text-xs text-gray-500">Sigurno?</span>
                          <button
                            onClick={() => removeAssignment(a.id)}
                            className="text-xs text-koral font-medium hover:underline"
                          >
                            Da
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs text-gray-400 hover:underline"
                          >
                            Ne
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(a.id)}
                          className="text-xs text-koral hover:underline"
                        >
                          Ukloni
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profesori</h1>

      {professors.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
          Nema profesora. Kreiraj nalog u Supabase sa role=professor.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="text-left px-6 py-3">Ime</th>
                <th className="text-left px-6 py-3">Email</th>
                <th className="text-left px-6 py-3">Studenata</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {professors.map((prof) => (
                <tr key={prof.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{prof.full_name || "—"}</td>
                  <td className="px-6 py-4 text-gray-500">{prof.email}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {prof.studentCount + (prof.groupCount ?? 0)}
                    {(prof.studentCount > 0 || (prof.groupCount ?? 0) > 0) && (
                      <span className="text-xs text-gray-400 ml-1">
                        ({prof.studentCount} 1:1{(prof.groupCount ?? 0) > 0 ? ` · ${prof.groupCount} grupni` : ""})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openDetail(prof)}
                      className="text-plava hover:underline text-sm"
                    >
                      Upravljaj
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
