"use client";

import { useMemo, useState } from "react";

export type NakiRow = {
  id: number;
  session_id: string;
  role: "user" | "assistant";
  message: string;
  level: string | null;
  created_at: string;
  user_id: string | null;
};

type Session = {
  sessionId: string;
  started: string;
  level: string | null;
  loggedIn: boolean;
  rows: NakiRow[];
};

function fmt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("sr-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NakiLogs({
  rows,
  usage,
}: {
  rows: NakiRow[];
  usage: { day: string; count: number }[];
}) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  // Grupiši po sesiji (ulazni niz je najnovije-prvo; okreni unutar sesije za hronološki red)
  const sessions = useMemo<Session[]>(() => {
    const map = new Map<string, NakiRow[]>();
    for (const r of rows) {
      const arr = map.get(r.session_id) ?? [];
      arr.push(r);
      map.set(r.session_id, arr);
    }
    const list: Session[] = [];
    for (const [sessionId, arr] of map) {
      const chrono = [...arr].sort((a, b) => a.created_at.localeCompare(b.created_at));
      const level = chrono.find((r) => r.level)?.level ?? null;
      list.push({
        sessionId,
        started: chrono[0]?.created_at ?? "",
        level,
        loggedIn: chrono.some((r) => r.user_id),
        rows: chrono,
      });
    }
    // Najnovije sesije prvo
    return list.sort((a, b) => b.started.localeCompare(a.started));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) =>
      s.rows.some((r) => r.message.toLowerCase().includes(q))
    );
  }, [sessions, query]);

  return (
    <div>
      {/* Dnevni promet */}
      {usage.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {usage.map((u) => (
            <div
              key={u.day}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-center"
            >
              <div className="text-xs text-gray-400">{u.day}</div>
              <div className="text-sm font-semibold text-gray-900">{u.count}</div>
            </div>
          ))}
        </div>
      )}

      <input
        className="mb-4 w-full max-w-md rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-plava"
        placeholder="Pretraži po sadržaju poruke…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <p className="mb-3 text-xs text-gray-400">
        {filtered.length} sesija{filtered.length === 1 ? "" : "a"} · {rows.length} poruka ukupno
      </p>

      <div className="space-y-2">
        {filtered.map((s) => {
          const open = openId === s.sessionId;
          const firstUser = s.rows.find((r) => r.role === "user");
          return (
            <div key={s.sessionId} className="rounded-xl border border-gray-200 bg-white">
              <button
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                onClick={() => setOpenId(open ? null : s.sessionId)}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm text-gray-900">
                    {firstUser?.message ?? "(bez korisničke poruke)"}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-400">
                    {fmt(s.started)} · {s.rows.length} poruka
                    {s.level ? ` · ${s.level}` : ""}
                    {s.loggedIn ? " · ulogovan" : ""}
                  </div>
                </div>
                <span className="shrink-0 text-gray-400">{open ? "▲" : "▼"}</span>
              </button>

              {open && (
                <div className="space-y-2 border-t border-gray-100 p-4">
                  {s.rows.map((r) => (
                    <div
                      key={r.id}
                      className={
                        r.role === "user"
                          ? "max-w-[85%] self-end whitespace-pre-wrap rounded-2xl rounded-br-sm bg-plava px-3.5 py-2 text-sm text-white ml-auto"
                          : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-gray-100 px-3.5 py-2 text-sm text-gray-900"
                      }
                    >
                      {r.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400">Nema razgovora za prikaz.</p>
        )}
      </div>
    </div>
  );
}
