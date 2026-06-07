"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface GroupSessions {
  id: string;
  level: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  professorName: string;
  sessions: { id: string; date: string; source: string }[];
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function SesijeClient({ rows, showProfessor }: { rows: GroupSessions[]; showProfessor: boolean }) {
  const router = useRouter();
  const [dateById, setDateById] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const activeRows = rows.filter((g) => g.status === "otvoren" || g.status === "u_toku");
  const archivedCount = rows.length - activeRows.length;
  const visibleRows = showArchived ? rows : activeRows;

  async function addSession(groupId: string) {
    const sessionDate = dateById[groupId] || todayISO();
    setBusy(groupId); setError(null);
    try {
      const res = await fetch("/api/profesor/grupna-sesija", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, sessionDate }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || "Greška."); return; }
      router.refresh();
    } catch { setError("Greška u mreži."); }
    finally { setBusy(null); }
  }

  async function removeSession(sessionId: string, groupId: string) {
    setBusy(groupId); setError(null);
    try {
      const res = await fetch("/api/profesor/grupna-sesija", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error || "Greška."); return; }
      router.refresh();
    } catch { setError("Greška u mreži."); }
    finally { setBusy(null); }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-koral text-sm">{error}</p>}
      {archivedCount > 0 && (
        <button type="button" onClick={() => setShowArchived(!showArchived)} className="text-sm text-plava hover:underline">
          {showArchived ? "Sakrij završene" : `Prikaži i završene (${archivedCount})`}
        </button>
      )}
      {visibleRows.length === 0 && <p className="text-gray-400 text-sm py-8 text-center">Nema aktivnih grupa.</p>}
      {visibleRows.map((g) => (
        <div key={g.id} className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="font-semibold text-gray-900">Grupa {g.level}</span>
              {showProfessor && g.professorName && <span className="text-sm text-gray-500"> · {g.professorName}</span>}
              <span className="text-xs text-gray-400 ml-2">{g.sessions.length} sesija</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateById[g.id] ?? todayISO()}
                onChange={(e) => setDateById({ ...dateById, [g.id]: e.target.value })}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900"
              />
              <button
                type="button"
                onClick={() => addSession(g.id)}
                disabled={busy === g.id}
                className="bg-plava hover:bg-plava-dark disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 rounded-lg whitespace-nowrap"
              >
                {busy === g.id ? "..." : "Dodaj sesiju"}
              </button>
            </div>
          </div>
          {g.sessions.length === 0 ? (
            <p className="text-sm text-gray-400">Nema evidentiranih sesija.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {g.sessions.map((s) => (
                <span key={s.id} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${s.source === "auto" ? "bg-gray-100 text-gray-600" : "bg-plava-light text-plava"}`}>
                  {new Date(s.date).toLocaleDateString("sr-Latn")}
                  <button type="button" onClick={() => removeSession(s.id, g.id)} disabled={busy === g.id} className="text-koral hover:font-bold" title="Skini (otkazan)">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
