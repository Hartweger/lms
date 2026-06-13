"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Payable = { professorId: string; name: string; earned: number; paid: number; balance: number };
type Pending = { id: string; profName: string; description: string; amount: number; activity_date: string };
type Group = { id: string; label: string };
type Prof = { id: string; name: string };
const fmt = (n: number) => n.toLocaleString("de-DE");
const today = () => new Intl.DateTimeFormat("sv-SE").format(new Date());

export default function ObavezeClient({ payables, pending, groups, profs }: { payables: Payable[]; pending: Pending[]; groups: Group[]; profs: Prof[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [payDate, setPayDate] = useState(today());
  const [note, setNote] = useState("");

  async function decide(id: string, action: "odobri" | "odbij") {
    const reason = action === "odbij" ? (prompt("Razlog odbijanja (opciono):") ?? "") : "";
    setBusy(id);
    const res = await fetch(`/api/admin/aktivnosti/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    setBusy(null);
    if (!res.ok) { alert((await res.json()).error || "Greška"); return; }
    router.refresh();
  }

  async function pay(professorId: string) {
    setBusy(professorId);
    const res = await fetch(`/api/admin/profesori/${professorId}/isplata`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount), paymentDate: payDate, note }),
    });
    setBusy(null);
    if (!res.ok) { alert((await res.json()).error || "Greška"); return; }
    setPayFor(null); setAmount(""); setNote(""); setPayDate(today()); router.refresh();
  }

  const [zGroup, setZGroup] = useState("");
  const [zDate, setZDate] = useState(today());
  const [zProf, setZProf] = useState("");
  async function zamena(e: React.FormEvent) {
    e.preventDefault();
    setBusy("zamena");
    const res = await fetch("/api/admin/zamena", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: zGroup, sessionDate: zDate, newProfessorId: zProf }),
    });
    setBusy(null);
    if (!res.ok) { alert((await res.json()).error || "Greška"); return; }
    alert("Izvođač promenjen."); setZGroup(""); setZDate(today()); setZProf(""); router.refresh();
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Obaveze prema profesorkama</h1>

      <section className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr><th className="text-left px-4 py-3">Profesorka</th><th className="text-right px-4 py-3">Zarađeno</th><th className="text-right px-4 py-3">Isplaćeno</th><th className="text-right px-4 py-3">Saldo</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {payables.map((p) => (
              <tr key={p.professorId}>
                <td className="px-4 py-3 text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-right">{fmt(p.earned)} din</td>
                <td className="px-4 py-3 text-right">{fmt(p.paid)} din</td>
                <td className="px-4 py-3 text-right font-bold text-plava">{fmt(p.balance)} din</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setPayFor(payFor === p.professorId ? null : p.professorId); setAmount(String(Math.max(0, p.balance))); }}
                    className="text-sm px-3 py-1.5 rounded-lg bg-plava-light text-plava font-medium">Zabeleži isplatu</button>
                  {payFor === p.professorId && (
                    <div className="mt-2 flex flex-wrap gap-2 justify-end">
                      <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="1" placeholder="Iznos" className="w-28 border rounded-lg px-2 py-1" />
                      <input value={payDate} onChange={(e) => setPayDate(e.target.value)} type="date" className="border rounded-lg px-2 py-1" />
                      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Napomena" className="w-32 border rounded-lg px-2 py-1" />
                      <button disabled={busy === p.professorId} onClick={() => pay(p.professorId)} className="px-3 py-1 rounded-lg bg-plava text-white disabled:opacity-50">Snimi</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-medium text-gray-900 mb-3">Aktivnosti na čekanju ({pending.length})</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {pending.length === 0 ? <p className="px-4 py-4 text-gray-400 text-sm">Nema stavki na čekanju.</p> : (
            <table className="w-full text-sm"><tbody className="divide-y divide-gray-50">
              {pending.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 text-gray-900">{a.profName}</td>
                  <td className="px-4 py-3">{a.description}<span className="text-gray-400"> · {a.activity_date}</span></td>
                  <td className="px-4 py-3 text-right">{fmt(a.amount)} din</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button disabled={busy === a.id} onClick={() => decide(a.id, "odobri")} className="px-3 py-1 rounded-lg bg-green-600 text-white disabled:opacity-50">Odobri</button>
                    <button disabled={busy === a.id} onClick={() => decide(a.id, "odbij")} className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50">Odbij</button>
                  </td>
                </tr>
              ))}
            </tbody></table>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-medium text-gray-900 mb-3">Zamena - promeni ko je držao čas</h2>
        <form onSubmit={zamena} className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-end">
          <label className="text-sm">Grupa<br /><select value={zGroup} onChange={(e) => setZGroup(e.target.value)} required className="border rounded-lg px-2 py-1 mt-1"><option value="">-</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select></label>
          <label className="text-sm">Datum<br /><input value={zDate} onChange={(e) => setZDate(e.target.value)} type="date" required className="border rounded-lg px-2 py-1 mt-1" /></label>
          <label className="text-sm">Ko je odradio<br /><select value={zProf} onChange={(e) => setZProf(e.target.value)} required className="border rounded-lg px-2 py-1 mt-1"><option value="">-</option>{profs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <button disabled={busy === "zamena"} className="px-4 py-2 rounded-lg bg-plava text-white text-sm font-medium disabled:opacity-50">Primeni</button>
        </form>
        <p className="text-xs text-gray-400 mt-2">Premešta tu jednu sesiju na izabranu profesorku (ne duplira čas). Ako sesija za taj datum ne postoji, kreira je.</p>
      </section>
    </div>
  );
}
