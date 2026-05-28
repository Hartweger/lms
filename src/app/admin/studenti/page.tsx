"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Course } from "@/lib/types";

interface StudentRow {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  courseAccess: { course_id: string; expires_at: string | null }[];
  lastActivity: string | null;
  lastSignIn: string | null;
}

type AccessFilter = "all" | "active" | "none" | "expired";
type LoginFilter = "all" | "logged_in" | "never";

export default function AdminStudenti() {
  const supabase = createClient();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");
  const [courseFilter, setCourseFilter] = useState<string>("");
  const [loginFilter, setLoginFilter] = useState<LoginFilter>("all");

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/admin/studenti");
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setCourses(data.courses as Course[]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const now = new Date().toISOString();

  const filtered = useMemo(() => {
    return students.filter((s) => {
      // Search filter
      if (search) {
        const q = search.toLowerCase();
        const nameMatch = s.full_name?.toLowerCase().includes(q);
        const emailMatch = s.email.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch) return false;
      }

      // Access status filter
      if (accessFilter === "active") {
        const hasActive = s.courseAccess.some(
          (a) => !a.expires_at || a.expires_at > now
        );
        if (!hasActive) return false;
      } else if (accessFilter === "none") {
        if (s.courseAccess.length > 0) return false;
      } else if (accessFilter === "expired") {
        const hasExpired = s.courseAccess.some(
          (a) => a.expires_at && a.expires_at <= now
        );
        const hasActive = s.courseAccess.some(
          (a) => !a.expires_at || a.expires_at > now
        );
        if (!hasExpired || hasActive) return false;
      }

      // Login filter
      if (loginFilter === "logged_in" && !s.lastSignIn) return false;
      if (loginFilter === "never" && s.lastSignIn) return false;

      // Course filter
      if (courseFilter) {
        const hasCourse = s.courseAccess.some((a) => a.course_id === courseFilter);
        if (!hasCourse) return false;
      }

      return true;
    });
  }, [students, search, accessFilter, courseFilter, loginFilter, now]);

  function exportCSV() {
    const headers = ["Ime", "Email", "Kursevi", "Status pristupa", "Poslednja aktivnost", "Datum registracije"];
    const rows = filtered.map((s) => {
      const courseNames = s.courseAccess
        .map((a) => {
          const course = courses.find((c) => c.id === a.course_id);
          return course?.title ?? a.course_id;
        })
        .join("; ");

      const hasActive = s.courseAccess.some((a) => !a.expires_at || a.expires_at > now);
      const status = s.courseAccess.length === 0
        ? "Bez pristupa"
        : hasActive
        ? "Aktivan"
        : "Istekao";

      return [
        s.full_name ?? "",
        s.email,
        courseNames,
        status,
        s.lastActivity ? new Date(s.lastActivity).toLocaleDateString("sr-RS") : "",
        new Date(s.created_at).toLocaleDateString("sr-RS"),
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studenti-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="text-gray-400">Učitavanje...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Studenti</h1>
        <button
          onClick={exportCSV}
          className="text-sm bg-white border border-gray-200 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Pretraži po imenu ili emailu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-plava"
        />
        <select
          value={accessFilter}
          onChange={(e) => setAccessFilter(e.target.value as AccessFilter)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white"
        >
          <option value="all">Svi</option>
          <option value="active">Sa aktivnim pristupom</option>
          <option value="none">Bez pristupa</option>
          <option value="expired">Istekao pristup</option>
        </select>
        <select
          value={loginFilter}
          onChange={(e) => setLoginFilter(e.target.value as LoginFilter)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white"
        >
          <option value="all">Sve prijave</option>
          <option value="logged_in">Prijavljivali se</option>
          <option value="never">Nikad se nisu prijavili</option>
        </select>
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white"
        >
          <option value="">Svi kursevi</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 mb-3">
        {filtered.length} od {students.length} studenata
      </p>

      {/* Student Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="text-left px-6 py-3">Ime</th>
              <th className="text-left px-6 py-3">Email</th>
              <th className="text-left px-6 py-3">Kursevi</th>
              <th className="text-left px-6 py-3">Prijavio se</th>
              <th className="text-left px-6 py-3">Poslednja aktivnost</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {student.full_name || "—"}
                </td>
                <td className="px-6 py-4 text-gray-500">{student.email}</td>
                <td className="px-6 py-4 text-gray-500">
                  {student.courseAccess.length > 0
                    ? student.courseAccess.length + " kurs(a)"
                    : "—"}
                </td>
                <td className="px-6 py-4">
                  {student.lastSignIn
                    ? <span className="text-green-600">{new Date(student.lastSignIn).toLocaleDateString("sr-RS")}</span>
                    : <span className="text-gray-300">Nikad</span>}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {student.lastActivity
                    ? new Date(student.lastActivity).toLocaleDateString("sr-RS")
                    : "—"}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/admin/studenti/${student.id}`}
                    className="text-plava hover:underline"
                  >
                    Detalji
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  Nema rezultata.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
