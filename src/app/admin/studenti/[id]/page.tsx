"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Course, UserProfile } from "@/lib/types";

interface AccessRow {
  id: string;
  course_id: string;
  granted_at: string;
  expires_at: string | null;
}

export default function AdminStudentDetalji() {
  const params = useParams();
  const supabase = createClient();
  const [student, setStudent] = useState<UserProfile | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [accessRows, setAccessRows] = useState<AccessRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Add access form
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  // Confirm delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: studentData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", params.id)
        .single();
      if (studentData) setStudent(studentData as UserProfile);

      const { data: courses } = await supabase.from("courses").select("*");
      if (courses) setAllCourses(courses as Course[]);

      const { data: access } = await supabase
        .from("course_access")
        .select("id, course_id, granted_at, expires_at")
        .eq("user_id", params.id)
        .order("granted_at", { ascending: false });
      if (access) setAccessRows(access as AccessRow[]);

      setLoading(false);
    };
    load();
  }, [params.id, supabase]);

  const accessCourseIds = accessRows.map((a) => a.course_id);
  const availableCourses = allCourses.filter((c) => !accessCourseIds.includes(c.id));
  const now = new Date().toISOString();

  async function addAccess() {
    if (!selectedCourseId) return;

    const insertData: Record<string, unknown> = {
      user_id: params.id,
      course_id: selectedCourseId,
    };
    if (expiresAt) {
      insertData.expires_at = new Date(expiresAt).toISOString();
    }

    const { data } = await supabase
      .from("course_access")
      .insert(insertData)
      .select("id, course_id, granted_at, expires_at")
      .single();

    if (data) {
      setAccessRows([data as AccessRow, ...accessRows]);
      setShowAddForm(false);
      setSelectedCourseId("");
      setExpiresAt("");
    }
  }

  async function removeAccess(accessId: string) {
    await supabase.from("course_access").delete().eq("id", accessId);
    setAccessRows(accessRows.filter((a) => a.id !== accessId));
    setConfirmDeleteId(null);
  }

  async function extendAccess(accessId: string, currentExpires: string | null) {
    const baseDate = currentExpires && currentExpires > now
      ? new Date(currentExpires)
      : new Date();
    const newExpires = new Date(baseDate);
    newExpires.setFullYear(newExpires.getFullYear() + 1);

    const { data } = await supabase
      .from("course_access")
      .update({ expires_at: newExpires.toISOString() })
      .eq("id", accessId)
      .select("id, course_id, granted_at, expires_at")
      .single();

    if (data) {
      setAccessRows(
        accessRows.map((a) => (a.id === accessId ? (data as AccessRow) : a))
      );
    }
  }

  function getStatus(expires_at: string | null): { label: string; color: string } {
    if (!expires_at) return { label: "Neograničen", color: "text-green-600" };
    if (expires_at > now) {
      const days = Math.ceil(
        (new Date(expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return {
        label: days <= 30 ? `Ističe za ${days} dana` : "Aktivan",
        color: days <= 30 ? "text-yellow-600" : "text-green-600",
      };
    }
    return { label: "Istekao", color: "text-koral" };
  }

  if (loading) return <div className="text-gray-400">Učitavanje...</div>;
  if (!student) return <div className="text-koral">Student nije pronađen.</div>;

  return (
    <div>
      <Link
        href="/admin/studenti"
        className="text-sm text-plava hover:underline mb-4 inline-block"
      >
        ← Nazad na listu
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {student.full_name || "Bez imena"}
      </h1>
      <p className="text-gray-500 mb-1">{student.email}</p>
      <p className="text-xs text-gray-400 mb-8">
        Registrovan: {new Date(student.created_at).toLocaleDateString("sr-RS")}
      </p>

      {/* Course Access Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Pristup kursevima</h2>
        {availableCourses.length > 0 && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-sm bg-plava text-white px-4 py-2 rounded-lg hover:bg-plava-dark transition-colors"
          >
            + Dodaj pristup
          </button>
        )}
      </div>

      {/* Add Access Form */}
      {showAddForm && (
        <div className="bg-plava-light rounded-xl p-4 mb-4 flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Kurs</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">Izaberi kurs...</option>
              {availableCourses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Datum isteka (opciono)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <button
            onClick={addAccess}
            disabled={!selectedCourseId}
            className="px-4 py-2 bg-plava text-white rounded-lg text-sm font-medium hover:bg-plava-dark transition-colors disabled:opacity-50"
          >
            Dodeli
          </button>
          <button
            onClick={() => { setShowAddForm(false); setSelectedCourseId(""); setExpiresAt(""); }}
            className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700"
          >
            Otkaži
          </button>
        </div>
      )}

      {/* Access Table */}
      {accessRows.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="text-left px-6 py-3">Kurs</th>
                <th className="text-left px-6 py-3">Dodeljeno</th>
                <th className="text-left px-6 py-3">Ističe</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {accessRows.map((access) => {
                const course = allCourses.find((c) => c.id === access.course_id);
                const status = getStatus(access.expires_at);
                const isConfirming = confirmDeleteId === access.id;

                return (
                  <tr key={access.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {course?.title ?? "Nepoznat kurs"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(access.granted_at).toLocaleDateString("sr-RS")}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {access.expires_at
                        ? new Date(access.expires_at).toLocaleDateString("sr-RS")
                        : "—"}
                    </td>
                    <td className={`px-6 py-4 text-xs font-medium ${status.color}`}>
                      {status.label}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => extendAccess(access.id, access.expires_at)}
                          className="text-xs text-plava hover:underline"
                        >
                          Produži
                        </button>
                        {isConfirming ? (
                          <span className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Sigurno?</span>
                            <button
                              onClick={() => removeAccess(access.id)}
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
                            onClick={() => setConfirmDeleteId(access.id)}
                            className="text-xs text-koral hover:underline"
                          >
                            Ukloni
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
          Nema dodeljenih kurseva.
        </div>
      )}
    </div>
  );
}
