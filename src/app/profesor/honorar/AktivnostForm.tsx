"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Activity = { id: string; description: string; amount: number; activity_date: string; status: string; reject_reason: string | null };
const fmt = (n: number) => n.toLocaleString("de-DE");
const STATUS_LABEL: Record<string, string> = { na_cekanju: "Na čekanju", odobreno: "Odobreno", odbijeno: "Odbijeno" };

export default function AktivnostForm({ activities }: { activities: Activity[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [activityDate, setActivityDate] = useState(new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(new Date()));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch("/api/profesor/aktivnost", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, amount: Number(amount), activityDate }),
    });
    setBusy(false);
    if (!res.ok) { setErr((await res.json()).error || "Greška"); return; }
    setDescription(""); setAmount(""); setOpen(false);
    router.refresh();
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Dodatne aktivnosti</h3>
        <button onClick={() => setOpen((v) => !v)} className="text-sm px-3 py-1.5 rounded-lg bg-plava-light text-plava font-medium">
          {open ? "Otkaži" : "Prijavi aktivnost"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="bg-white rounded-xl shadow-sm p-4 mb-4 space-y-3">
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opis (npr. ispravljeni testovi)"
            className="w-full border rounded-lg px-3 py-2 text-sm" required />
          <div className="flex gap-3">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="1" placeholder="Iznos (din)"
              className="flex-1 border rounded-lg px-3 py-2 text-sm" required />
            <input value={activityDate} onChange={(e) => setActivityDate(e.target.value)} type="date"
              className="flex-1 border rounded-lg px-3 py-2 text-sm" required />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button disabled={busy} className="px-4 py-2 rounded-lg bg-plava text-white text-sm font-medium disabled:opacity-50">
            {busy ? "Šaljem…" : "Pošalji na odobravanje"}
          </button>
        </form>
      )}

      {activities.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {activities.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">{a.description}<span className="text-gray-400"> · {a.activity_date}</span></td>
                  <td className="px-4 py-3 text-right">{fmt(a.amount)} din</td>
                  <td className="px-4 py-3 text-right">
                    <span className={a.status === "odobreno" ? "text-green-600" : a.status === "odbijeno" ? "text-red-500" : "text-gray-500"}>
                      {STATUS_LABEL[a.status]}
                    </span>
                    {a.status === "odbijeno" && a.reject_reason && <div className="text-xs text-gray-400">{a.reject_reason}</div>}
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
