"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PartnerSummary } from "@/lib/partners";

type CourseOpt = { id: string; title: string; slug: string };
const fmt = (n: number) => n.toLocaleString("de-DE");

const DEFAULT_SLUG = "nh-academy-gen2";

export default function SaradniciClient({ partners, courses }: { partners: PartnerSummary[]; courses: CourseOpt[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultCourse = courses.find((c) => c.slug === DEFAULT_SLUG)?.id ?? courses[0]?.id ?? "";
  const [form, setForm] = useState({ name: "", email: "", feeRsd: "5000", code: "", percent: "10", courseId: defaultCourse, expiresDate: "" });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = await fetch("/api/admin/saradnici", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, feeRsd: Number(form.feeRsd), percent: Number(form.percent), expiresDate: form.expiresDate || null }),
    });
    setBusy(false);
    if (!res.ok) { setError((await res.json()).error || "Greška"); return; }
    setShowForm(false);
    setForm({ name: "", email: "", feeRsd: "5000", code: "", percent: "10", courseId: defaultCourse, expiresDate: "" });
    router.refresh();
  }

  const inp = "w-full border rounded-lg px-3 py-2 text-sm";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Saradnici</h1>
        <button onClick={() => { setShowForm((v) => !v); setError(null); }}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#0AB3D7] text-white hover:bg-[#088BAD] transition-colors">
          + Novi saradnik
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-[#E8F7FC] rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Novi saradnik i njegov kod</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="text-xs font-medium text-gray-600">Ime
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} placeholder="npr. Ana" /></label>
            <label className="text-xs font-medium text-gray-600">Mejl (opciono)
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} /></label>
            <label className="text-xs font-medium text-gray-600">Iznos po upisu (RSD)
              <input required type="number" min="0" value={form.feeRsd} onChange={(e) => setForm({ ...form, feeRsd: e.target.value })} className={inp} /></label>
            <label className="text-xs font-medium text-gray-600">Kod
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={`${inp} font-mono`} placeholder="npr. ANA" /></label>
            <label className="text-xs font-medium text-gray-600">Popust (%)
              <input required type="number" min="1" max="100" value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })} className={inp} /></label>
            <label className="text-xs font-medium text-gray-600">Proizvod
              <select required value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} className={inp}>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select></label>
            <label className="text-xs font-medium text-gray-600">Važi do (opciono)
              <input type="date" value={form.expiresDate} onChange={(e) => setForm({ ...form, expiresDate: e.target.value })} className={inp} /></label>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#0AB3D7] text-white disabled:opacity-50">{busy ? "..." : "Sačuvaj"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600">Otkaži</button>
          </div>
        </form>
      )}

      {partners.length === 0 ? (
        <p className="text-gray-400 text-sm">Još nema saradnika.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3">Saradnik</th>
                <th className="text-left px-4 py-3">Kodovi</th>
                <th className="text-right px-4 py-3">Po upisu</th>
                <th className="text-right px-4 py-3">Upisane</th>
                <th className="text-right px-4 py-3">Pripada</th>
                <th className="text-right px-4 py-3">Isplaćeno</th>
                <th className="text-right px-4 py-3">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {partners.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50 ${p.is_active ? "" : "text-gray-400"}`}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/saradnici/${p.id}`} className="font-medium text-plava hover:underline">{p.name}</Link>
                    {!p.is_active && <span className="ml-2 text-xs">neaktivan</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {p.codes.length === 0 ? "-" : p.codes.map((c) => (
                      <span key={c.id} className={`inline-block mr-2 ${c.is_active ? "text-gray-900" : "text-gray-400 line-through"}`}>{c.code}</span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-right">{fmt(p.fee_rsd)}</td>
                  <td className="px-4 py-3 text-right">{p.upisane}</td>
                  <td className="px-4 py-3 text-right">{fmt(p.pripada)}</td>
                  <td className="px-4 py-3 text-right">{fmt(p.isplaceno)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${p.saldo > 0 ? "text-gray-900" : ""}`}>{fmt(p.saldo)} din</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
