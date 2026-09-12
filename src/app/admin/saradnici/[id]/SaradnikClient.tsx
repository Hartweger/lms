"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PartnerDetail } from "@/lib/partners";

type CourseOpt = { id: string; title: string; slug: string };
const fmt = (n: number) => n.toLocaleString("de-DE");
const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(new Date());
const datum = (iso: string) => new Date(iso).toLocaleDateString("sr-RS");

const STATUS: Record<string, { label: string; cls: string }> = {
  completed: { label: "plaćeno", cls: "bg-green-50 text-green-600" },
  pending: { label: "čeka", cls: "bg-yellow-50 text-yellow-700" },
  refunded: { label: "storno", cls: "bg-gray-100 text-gray-500" },
};

export default function SaradnikClient({ partner, courses }: { partner: PartnerDetail; courses: CourseOpt[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showPay, setShowPay] = useState(false);
  const [amount, setAmount] = useState(String(Math.max(0, partner.saldo)));
  const [payDate, setPayDate] = useState(today());
  const [payNote, setPayNote] = useState("");

  const [showEdit, setShowEdit] = useState(false);
  const [edit, setEdit] = useState({ name: partner.name, email: partner.email ?? "", feeRsd: String(partner.fee_rsd), note: partner.note ?? "" });

  const [showCode, setShowCode] = useState(false);
  const defaultCourse = courses.find((c) => c.slug === "nh-academy-gen2")?.id ?? courses[0]?.id ?? "";
  const [code, setCode] = useState({ code: "", percent: "10", courseId: defaultCourse, expiresDate: "" });

  async function call(key: string, url: string, method: string, body: unknown, onOk: () => void) {
    setBusy(key); setError(null);
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(null);
    if (!res.ok) { setError((await res.json()).error || "Greška"); return; }
    onOk();
    router.refresh();
  }

  const inp = "border rounded-lg px-2 py-1 text-sm";

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/saradnici" className="text-sm text-gray-500 hover:underline">← Saradnici</Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {partner.name}
            {!partner.is_active && <span className="ml-3 text-sm font-normal text-gray-400">neaktivan</span>}
          </h1>
          <div className="flex gap-2">
            <button onClick={() => setShowEdit((v) => !v)} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700">Izmeni</button>
            <button onClick={() => setShowCode((v) => !v)} disabled={!partner.is_active} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50">Dodaj kod</button>
            <button onClick={() => { setShowPay((v) => !v); setAmount(String(Math.max(0, partner.saldo))); }} className="text-sm px-3 py-1.5 rounded-lg bg-plava-light text-plava font-medium">Zabeleži isplatu</button>
          </div>
        </div>
        {partner.email && <p className="text-sm text-gray-500 mt-1">{partner.email}</p>}
        {partner.note && <p className="text-sm text-gray-500 mt-1">{partner.note}</p>}
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {showEdit && (
        <div className="bg-[#E8F7FC] rounded-xl p-4 mb-6 flex flex-wrap gap-2 items-end">
          <label className="text-xs text-gray-600">Ime<br /><input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={inp} /></label>
          <label className="text-xs text-gray-600">Mejl<br /><input value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} className={inp} /></label>
          <label className="text-xs text-gray-600">Iznos po upisu<br /><input type="number" min="0" value={edit.feeRsd} onChange={(e) => setEdit({ ...edit, feeRsd: e.target.value })} className={`${inp} w-28`} /></label>
          <label className="text-xs text-gray-600">Napomena<br /><input value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} className={`${inp} w-64`} /></label>
          <button disabled={busy === "edit"} onClick={() => call("edit", `/api/admin/saradnici/${partner.id}`, "PATCH", { ...edit, feeRsd: Number(edit.feeRsd) }, () => setShowEdit(false))}
            className="px-3 py-1 rounded-lg bg-plava text-white disabled:opacity-50">Snimi</button>
          <button disabled={busy === "toggle"} onClick={() => { if (confirm(partner.is_active ? "Deaktivirati saradnika? Gase se i svi njegovi kodovi." : "Aktivirati saradnika? Kodove aktiviraj posebno na stranici Kuponi.")) call("toggle", `/api/admin/saradnici/${partner.id}`, "PATCH", { isActive: !partner.is_active }, () => setShowEdit(false)); }}
            className={`px-3 py-1 rounded-lg ${partner.is_active ? "bg-red-50 text-[#F78687]" : "bg-green-50 text-green-600"} disabled:opacity-50`}>
            {partner.is_active ? "Deaktiviraj" : "Aktiviraj"}
          </button>
        </div>
      )}

      {showCode && (
        <div className="bg-[#E8F7FC] rounded-xl p-4 mb-6 flex flex-wrap gap-2 items-end">
          <label className="text-xs text-gray-600">Kod<br /><input value={code.code} onChange={(e) => setCode({ ...code, code: e.target.value.toUpperCase() })} className={`${inp} font-mono`} placeholder="npr. ANA-IG" /></label>
          <label className="text-xs text-gray-600">Popust %<br /><input type="number" min="1" max="100" value={code.percent} onChange={(e) => setCode({ ...code, percent: e.target.value })} className={`${inp} w-20`} /></label>
          <label className="text-xs text-gray-600">Proizvod<br />
            <select value={code.courseId} onChange={(e) => setCode({ ...code, courseId: e.target.value })} className={inp}>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select></label>
          <label className="text-xs text-gray-600">Važi do<br /><input type="date" value={code.expiresDate} onChange={(e) => setCode({ ...code, expiresDate: e.target.value })} className={inp} /></label>
          <button disabled={busy === "code"} onClick={() => call("code", `/api/admin/saradnici/${partner.id}/kuponi`, "POST", { ...code, percent: Number(code.percent), expiresDate: code.expiresDate || null }, () => { setShowCode(false); setCode({ ...code, code: "", expiresDate: "" }); })}
            className="px-3 py-1 rounded-lg bg-plava text-white disabled:opacity-50">Snimi</button>
        </div>
      )}

      {showPay && (
        <div className="bg-[#E8F7FC] rounded-xl p-4 mb-6 flex flex-wrap gap-2 items-end">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="1" placeholder="Iznos" className={`${inp} w-28`} />
          <input value={payDate} onChange={(e) => setPayDate(e.target.value)} type="date" className={inp} />
          <input value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="Napomena" className={`${inp} w-48`} />
          <button disabled={busy === "pay"} onClick={() => call("pay", `/api/admin/saradnici/${partner.id}/isplate`, "POST", { amount: Number(amount), paidAt: payDate, note: payNote }, () => { setShowPay(false); setPayNote(""); })}
            className="px-3 py-1 rounded-lg bg-plava text-white disabled:opacity-50">Snimi</button>
        </div>
      )}

      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {[
          ["Po upisu", `${fmt(partner.fee_rsd)} din`],
          ["Upisane", String(partner.upisane)],
          ["Pripada", `${fmt(partner.pripada)} din`],
          ["Isplaćeno", `${fmt(partner.isplaceno)} din`],
          ["Saldo", `${fmt(partner.saldo)} din`],
        ].map(([l, v]) => (
          <div key={l} className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-xs text-gray-500 uppercase">{l}</div>
            <div className="text-lg font-semibold text-gray-900">{v}</div>
          </div>
        ))}
      </section>

      <section className="mb-8">
        <h2 className="font-medium text-gray-900 mb-3">Kodovi</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm"><tbody className="divide-y divide-gray-50">
            {partner.codes.map((c) => (
              <tr key={c.id} className={c.is_active ? "" : "text-gray-400"}>
                <td className="px-4 py-3 font-mono">{c.code}</td>
                <td className="px-4 py-3">{c.amount}%</td>
                <td className="px-4 py-3">{c.course_title ?? "svi proizvodi"}</td>
                <td className="px-4 py-3">{c.expires_at ? `do ${datum(c.expires_at)}` : "bez isteka"}</td>
                <td className="px-4 py-3">{c.is_active ? "aktivan" : "ugašen"}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
        <p className="text-xs text-gray-400 mt-2">Paljenje i gašenje pojedinačnog koda je na stranici <Link href="/admin/kuponi" className="underline">Kuponi</Link>.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-medium text-gray-900 mb-3">Porudžbine sa kodom ({partner.orders.length})</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          {partner.orders.length === 0 ? <p className="px-4 py-4 text-gray-400 text-sm">Još nema porudžbina.</p> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs"><tr>
                <th className="text-left px-4 py-3">Datum</th><th className="text-left px-4 py-3">Kupac</th><th className="text-left px-4 py-3">Proizvod</th>
                <th className="text-right px-4 py-3">Plaćeno</th><th className="text-right px-4 py-3">Saradniku</th><th className="text-left px-4 py-3">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {partner.orders.map((o) => {
                  const s = STATUS[o.payment_status] ?? { label: o.payment_status, cls: "bg-gray-100 text-gray-500" };
                  return (
                    <tr key={o.id} className={o.payment_status === "completed" ? "" : "text-gray-400"}>
                      <td className="px-4 py-3">{datum(o.created_at)}{o.order_number && <span className="block text-xs text-gray-400">{o.order_number}</span>}</td>
                      <td className="px-4 py-3">{o.full_name}<span className="block text-xs text-gray-400">{o.email}</span></td>
                      <td className="px-4 py-3">{o.product_title}</td>
                      <td className="px-4 py-3 text-right">{fmt(o.total)}</td>
                      <td className="px-4 py-3 text-right">{o.partner_fee != null ? fmt(o.partner_fee) : "-"}</td>
                      <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-medium text-gray-900 mb-3">Isplate ({partner.payouts.length})</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          {partner.payouts.length === 0 ? <p className="px-4 py-4 text-gray-400 text-sm">Još nema isplata.</p> : (
            <table className="w-full text-sm"><tbody className="divide-y divide-gray-50">
              {partner.payouts.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">{datum(p.paid_at)}</td>
                  <td className="px-4 py-3 text-right">{fmt(p.amount)} din</td>
                  <td className="px-4 py-3 text-gray-500">{p.note ?? ""}</td>
                </tr>
              ))}
            </tbody></table>
          )}
        </div>
      </section>
    </div>
  );
}
