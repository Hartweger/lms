"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Group = { id: string; label: string };
type Req = { id: string; groupLabel: string; session_date: string; status: string; reject_reason: string | null };
const STATUS_LABEL: Record<string, string> = { na_cekanju: "Na cekanju", odobreno: "Odobreno", odbijeno: "Odbijeno" };

export default function ZamenaForm({ groups, requests }: { groups: Group[]; requests: Req[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [sessionDate, setSessionDate] = useState(new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(new Date()));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch("/api/profesor/zamena", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, sessionDate }),
    });
    setBusy(false);
    if (!res.ok) { setErr((await res.json()).error || "Greska"); return; }
    setGroupId(""); setOpen(false); router.refresh();
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Zamene (odradila tudji cas)</h3>
        <button onClick={() => setOpen((v) => !v)} className="text-sm px-3 py-1.5 rounded-lg bg-plava-light text-plava font-medium">
          {open ? "Otkazi" : "Prijavi zamenu"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="bg-white rounded-xl shadow-sm p-4 mb-4 space-y-3">
          <p className="text-xs text-gray-400">Izaberi grupu koju si odradila i datum. Natasa odobrava; cas se prepisuje na tebe.</p>
          <div className="flex gap-3 flex-wrap">
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} required className="flex-1 border rounded-lg px-3 py-2 text-sm">
              <option value="">Izaberi grupu</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
            <input value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} type="date" required className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button disabled={busy} className="px-4 py-2 rounded-lg bg-plava text-white text-sm font-medium disabled:opacity-50">
            {busy ? "Saljem..." : "Posalji na odobravanje"}
          </button>
        </form>
      )}

      {requests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">{r.groupLabel}<span className="text-gray-400"> · {r.session_date}</span></td>
                  <td className="px-4 py-3 text-right">
                    <span className={r.status === "odobreno" ? "text-green-600" : r.status === "odbijeno" ? "text-red-500" : "text-gray-500"}>
                      {STATUS_LABEL[r.status]}
                    </span>
                    {r.status === "odbijeno" && r.reject_reason && <div className="text-xs text-gray-400">{r.reject_reason}</div>}
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
