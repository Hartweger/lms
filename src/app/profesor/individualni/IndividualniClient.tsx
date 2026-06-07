"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { remainingLessons } from "@/lib/individual-lessons";

export interface EnrollmentRow {
  id: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  nivo: string;
  professorName: string;
  packageLessons: number;
  lessonsUsed: number;
  status: string;
  expiresAt: string | null;
  notesUrl: string | null;
  lessons: { id: string; date: string }[];
}

function todayISO(): string {
  // Lokalni datum (Europe/Belgrade) u YYYY-MM-DD bez UTC pomeranja.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function IndividualniClient({ rows, showProfessor }: { rows: EnrollmentRow[]; showProfessor: boolean }) {
  const router = useRouter();
  const [dateById, setDateById] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [openHistory, setOpenHistory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const activeRows = rows.filter((r) => r.status === "active");
  const archivedCount = rows.length - activeRows.length;
  const visibleRows = showArchived ? rows : activeRows;

  async function addLesson(enrollmentId: string) {
    const lessonDate = dateById[enrollmentId] || todayISO();
    setBusy(enrollmentId); setError(null);
    try {
      const res = await fetch("/api/profesor/individualni-cas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, lessonDate }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || "Greška."); return; }
      router.refresh();
    } catch { setError("Greška u mreži."); }
    finally { setBusy(null); }
  }

  async function removeLesson(lessonId: string, enrollmentId: string) {
    setBusy(enrollmentId); setError(null);
    try {
      const res = await fetch("/api/profesor/individualni-cas", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || "Greška."); return; }
      router.refresh();
    } catch { setError("Greška u mreži."); }
    finally { setBusy(null); }
  }

  return (
    <div>
      {error && <p className="text-koral text-sm mb-3">{error}</p>}
      {archivedCount > 0 && (
        <button type="button" onClick={() => setShowArchived(!showArchived)} className="text-sm text-plava hover:underline mb-3">
          {showArchived ? "Sakrij završene" : `Prikaži i završene (${archivedCount})`}
        </button>
      )}
      {visibleRows.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">Nema aktivnih individualnih polaznika.</p>
      ) : (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="text-left px-6 py-3">Polaznik</th>
              {showProfessor && <th className="text-left px-6 py-3">Profesorka</th>}
              <th className="text-left px-6 py-3">Kurs</th>
              <th className="text-left px-6 py-3">Časovi</th>
              <th className="text-left px-6 py-3">Upiši održan čas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visibleRows.map((r) => {
              const remaining = remainingLessons(r.lessonsUsed, r.packageLessons);
              const done = r.status === "completed";
              return (
                <tr key={r.id} className="hover:bg-gray-50 align-top">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{r.studentName || "—"}</div>
                    <div className="text-xs text-gray-400">{r.studentEmail}</div>
                    {r.notesUrl && (
                      <a href={r.notesUrl} target="_blank" rel="noreferrer" className="text-xs text-plava hover:underline">📝 Beleške</a>
                    )}
                  </td>
                  {showProfessor && <td className="px-6 py-4 text-gray-600">{r.professorName || "—"}</td>}
                  <td className="px-6 py-4 text-gray-600">
                    {r.courseTitle}
                    {r.expiresAt && <div className="text-xs text-gray-400">rok: {new Date(r.expiresAt).toLocaleDateString("sr-Latn")}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className={`font-medium ${done ? "text-gray-400" : "text-gray-900"}`}>{r.lessonsUsed}/{r.packageLessons}</div>
                    <div className="text-xs text-gray-400">{done ? "završeno" : `još ${remaining}`}</div>
                    {r.lessons.length > 0 && (
                      <button type="button" onClick={() => setOpenHistory(openHistory === r.id ? null : r.id)} className="text-xs text-plava hover:underline mt-1">
                        {openHistory === r.id ? "sakrij" : "istorija"}
                      </button>
                    )}
                    {openHistory === r.id && (
                      <ul className="mt-1 space-y-0.5">
                        {r.lessons.map((l) => (
                          <li key={l.id} className="text-xs text-gray-500 flex items-center gap-2">
                            {new Date(l.date).toLocaleDateString("sr-Latn")}
                            <button type="button" onClick={() => removeLesson(l.id, r.id)} disabled={busy === r.id} className="text-koral hover:underline">×</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={dateById[r.id] ?? todayISO()}
                        onChange={(e) => setDateById({ ...dateById, [r.id]: e.target.value })}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => addLesson(r.id)}
                        disabled={busy === r.id}
                        className="bg-plava hover:bg-plava-dark disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 rounded-lg whitespace-nowrap"
                      >
                        {busy === r.id ? "..." : "Upiši čas"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
