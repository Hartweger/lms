"use client";

import { useCallback, useEffect, useState } from "react";

interface Clanica {
  id: string;
  status: "pending" | "approved" | "rejected";
  ime: string;
  brend: string | null;
  opis: string;
  usluge: string[];
  email: string | null;
  telefon: string | null;
  instagram: string | null;
  linkedin: string | null;
  web: string | null;
  foto_url: string | null;
  sort_order: number;
  created_at: string;
}

const USLUGE: Record<string, string> = {
  engleski: "Engleski",
  nemacki: "Nemački",
  italijanski: "Italijanski",
  turizam: "Turizam",
  marketing: "Marketing",
  matematika: "Matematika",
  rucnopravljeno: "Ručno pravljeno",
  licnirazvoj: "Lični razvoj",
  virtualniasistent: "Virtuelni asistent",
};

const STATUS_LABEL: Record<Clanica["status"], string> = {
  pending: "Na čekanju",
  approved: "Objavljene",
  rejected: "Odbijene",
};

export default function AdminClanicePage() {
  const [clanice, setClanice] = useState<Clanica[]>([]);
  const [tab, setTab] = useState<Clanica["status"]>("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editOpis, setEditOpis] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/clanice");
    const json = await res.json();
    if (res.ok) setClanice(json.clanice ?? []);
    else setError(json.error ?? "Greška pri učitavanju.");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/clanice", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Greška.");
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Trajno obrisati ovu prijavu?")) return;
    setBusy(id);
    try {
      await fetch("/api/admin/clanice", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  const prikazane = clanice.filter((c) => c.status === tab);
  const brojPoStatusu = (s: Clanica["status"]) => clanice.filter((c) => c.status === s).length;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">Članice</h1>
      <p className="text-gray-500 text-sm mb-6">
        Prijave sa natasahartweger.rs/clanice/prijava - odobrene se prikazuju na{" "}
        <a href="https://www.natasahartweger.rs/clanice" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
          stranici članica
        </a>{" "}
        (osveži se do 5 min).
      </p>

      <div className="flex gap-2 mb-6">
        {(Object.keys(STATUS_LABEL) as Clanica["status"][]).map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              tab === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {STATUS_LABEL[s]} ({brojPoStatusu(s)})
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-4">{error}</p>}

      {prikazane.length === 0 && <p className="text-gray-500">Nema prijava u ovoj grupi.</p>}

      <div className="space-y-4">
        {prikazane.map((c) => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-5 flex gap-5">
            <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100">
              {c.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.foto_url} alt={c.ime} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">bez fotke</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-bold">{c.ime}</span>
                {c.brend && <span className="text-gray-500 text-sm">{c.brend}</span>}
                <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString("sr-RS")}</span>
              </div>
              <div className="flex flex-wrap gap-1 my-1.5">
                {c.usluge.map((u) => (
                  <span key={u} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {USLUGE[u] ?? u}
                  </span>
                ))}
              </div>

              <textarea
                value={editOpis[c.id] ?? c.opis}
                onChange={(e) => setEditOpis((p) => ({ ...p, [c.id]: e.target.value }))}
                rows={3}
                className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg p-2.5 mt-1"
              />
              {editOpis[c.id] != null && editOpis[c.id] !== c.opis && (
                <button
                  onClick={() => patch(c.id, { opis: editOpis[c.id] })}
                  disabled={busy === c.id}
                  className="text-xs font-semibold text-blue-600 mt-1"
                >
                  Sačuvaj izmenu opisa
                </button>
              )}

              <p className="text-xs text-gray-500 mt-2 space-x-3">
                {c.email && <span>✉ {c.email}</span>}
                {c.telefon && <span>☎ {c.telefon}</span>}
                {c.instagram && (
                  <a href={c.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Instagram</a>
                )}
                {c.linkedin && (
                  <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">LinkedIn</a>
                )}
                {c.web && (
                  <a href={c.web} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Sajt</a>
                )}
              </p>

              <div className="flex gap-2 mt-3">
                {c.status !== "approved" && (
                  <button
                    onClick={() => patch(c.id, { status: "approved" })}
                    disabled={busy === c.id}
                    className="bg-green-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Odobri
                  </button>
                )}
                {c.status !== "rejected" && (
                  <button
                    onClick={() => patch(c.id, { status: "rejected" })}
                    disabled={busy === c.id}
                    className="bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  >
                    Odbij
                  </button>
                )}
                {c.status === "approved" && (
                  <button
                    onClick={() => patch(c.id, { status: "pending" })}
                    disabled={busy === c.id}
                    className="bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  >
                    Skini sa stranice
                  </button>
                )}
                <button
                  onClick={() => remove(c.id)}
                  disabled={busy === c.id}
                  className="text-red-600 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 ml-auto"
                >
                  Obriši
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
