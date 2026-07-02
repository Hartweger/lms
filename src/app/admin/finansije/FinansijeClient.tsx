"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  KATEGORIJA_LABELS, EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, MESECI_KRATKO,
  type FinansijeData, type ExpenseRow, type Kategorija, type ExpenseCategory,
} from "@/lib/finansije";

function din(n: number): string {
  return `${Math.round(n).toLocaleString("sr-RS")} din`;
}

const KATEGORIJE: Kategorija[] = ["video", "grupni", "individualni", "paket", "ostalo"];

interface Props {
  data: FinansijeData;
  year: number;
  mesec: number | null;
  pendingTotal: number;
  profName: Record<string, string>;
  expenses: ExpenseRow[];
  courseOptions: { id: string; title: string }[];
  ukupanSaldo: Record<string, number>;
}

export default function FinansijeClient({ data, year, mesec, pendingTotal, profName, expenses, courseOptions, ukupanSaldo }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");

  const periodLabel = mesec ? `${MESECI_KRATKO[mesec - 1]} ${year}.` : `${year}.`;

  // Filter promene idu kroz URL - server preračuna.
  function setPeriod(g: number, m: number | null) {
    const p = new URLSearchParams({ godina: String(g) });
    if (m) p.set("mesec", String(m));
    setSendMsg("");
    router.push(`/admin/finansije?${p.toString()}`);
  }

  async function saveExpense(form: FormData) {
    setSaving(true); setErr("");
    const body = {
      name: form.get("name"),
      category: form.get("category"),
      amount: form.get("amount"),
      course_id: form.get("course_id") || null,
      expense_date: form.get("expense_date"),
      recurring: form.get("recurring") === "on",
      ended_at: form.get("ended_at") || null,
      note: form.get("note") || null,
    };
    try {
      const res = await fetch(editing ? `/api/admin/expenses/${editing.id}` : "/api/admin/expenses", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr((data as { error?: string }).error ?? "Greška pri čuvanju."); return; }
      setModalOpen(false); setEditing(null);
      router.refresh();
    } catch {
      setErr("Greška na mreži - pokušaj ponovo.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteExpense(id: string) {
    if (!confirm("Obrisati ovaj trošak?")) return;
    const res = await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  async function posaljiObracun() {
    if (!mesec) return;
    const now = new Date();
    const tekuci = year === now.getFullYear() && mesec === now.getMonth() + 1;
    if (!confirm(`Poslati obračun za ${periodLabel} svim profesorkama sa stavkama u tom mesecu?${tekuci ? " Mesec još traje - obračun će biti nepotpun." : ""} Saldo u mejlu je današnji, ne istorijski.`)) return;
    setSending(true); setSendMsg("");
    try {
      const res = await fetch("/api/admin/finansije/posalji-obracun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ godina: year, mesec }),
      });
      const d = await res.json().catch(() => ({}));
      setSendMsg(res.ok
        ? `Poslato: ${(d as { poslato?: number }).poslato ?? 0}, preskočeno: ${(d as { preskoceno?: number }).preskoceno ?? 0}.`
        : (d as { error?: string }).error ?? "Greška pri slanju.");
    } catch {
      setSendMsg("Greška na mreži - pokušaj ponovo.");
    } finally {
      setSending(false);
    }
  }

  // Period filter za listu troškova (prikaz onih koji važe u izabranom periodu)
  const visibleExpenses = expenses.filter((e) => {
    const start = e.expense_date.slice(0, 7);
    if (!e.recurring) {
      return mesec
        ? start === `${year}-${String(mesec).padStart(2, "0")}`
        : start.startsWith(`${year}-`);
    }
    const end = e.ended_at ? e.ended_at.slice(0, 7) : "9999-12";
    const from = mesec ? `${year}-${String(mesec).padStart(2, "0")}` : `${year}-01`;
    const to = mesec ? from : `${year}-12`;
    return start <= to && end >= from;
  });

  const aktivniMeseci = data.months.filter((m) => m.prihodUkupno || m.honorariUkupno || m.troskoviUkupno);
  const honorarProfIds = [...new Set(data.months.flatMap((m) => Object.keys(m.honorari)))];
  const trosakKategorije = [...new Set(data.months.flatMap((m) => Object.keys(m.troskovi)))];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Finansije</h1>
          <a href="/admin/obaveze" className="text-sm px-3 py-1.5 rounded-lg bg-plava-light text-plava font-medium">Obaveze prema profesorkama →</a>
        </div>
        <div className="flex gap-2">
          <select value={year} onChange={(e) => setPeriod(Number(e.target.value), mesec)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
            {[year - 1, year, year + 1].filter((g) => g >= 2026).map((g) => <option key={g} value={g}>{g}.</option>)}
          </select>
          <select value={mesec ?? ""} onChange={(e) => setPeriod(year, e.target.value ? Number(e.target.value) : null)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">Cela godina</option>
            {MESECI_KRATKO.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Kartice - za izabrani period (mesec filter utiče preko sekcijskih suma) */}
      <PeriodCards data={data} mesec={mesec} pendingTotal={pendingTotal} periodLabel={periodLabel} />

      {/* P&L po mesecima - uvek cela godina */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 overflow-x-auto">
        <h2 className="font-semibold mb-3">Pregled po mesecima - {year}.</h2>
        <table className="text-sm w-full min-w-[900px]">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="py-1 pr-3 font-medium"></th>
              {aktivniMeseci.map((m) => <th key={m.month} className="py-1 px-2 text-right font-medium">{MESECI_KRATKO[m.month - 1]}</th>)}
              <th className="py-1 pl-3 text-right font-semibold text-gray-600">Ukupno</th>
            </tr>
          </thead>
          <tbody>
            {KATEGORIJE.filter((k) => data.months.some((m) => m.prihod[k])).map((k) => (
              <Row key={k} label={KATEGORIJA_LABELS[k]} cells={aktivniMeseci.map((m) => m.prihod[k])} indent pctOf={data.totals.prihod} />
            ))}
            <Row label="Prihod" cells={aktivniMeseci.map((m) => m.prihodUkupno)} bold />
            {honorarProfIds.map((pid) => (
              <Row key={pid} label={profName[pid] ?? pid} cells={aktivniMeseci.map((m) => -(m.honorari[pid] ?? 0))} indent negative pctOf={data.totals.prihod} />
            ))}
            <Row label="Honorari" cells={aktivniMeseci.map((m) => -m.honorariUkupno)} bold negative pctOf={data.totals.prihod} />
            {trosakKategorije.map((cat) => (
              <Row key={cat} label={EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory] ?? cat} cells={aktivniMeseci.map((m) => -(m.troskovi[cat] ?? 0))} indent negative pctOf={data.totals.prihod} />
            ))}
            <Row label="Troškovi" cells={aktivniMeseci.map((m) => -m.troskoviUkupno)} bold negative pctOf={data.totals.prihod} />
            <tr className="border-t-2 border-gray-200">
              <td className="py-2 pr-3 font-bold">Neto zarada</td>
              {aktivniMeseci.map((m) => {
                const pct = m.prihodUkupno > 0 ? Math.round((m.neto / m.prihodUkupno) * 100) : null;
                return (
                  <td key={m.month} className={`py-2 px-2 text-right font-bold ${m.neto < 0 ? "text-red-600" : "text-green-700"}`}>
                    {din(m.neto)}
                    {pct !== null && <span className="block text-xs text-gray-400 font-normal">({pct}%)</span>}
                  </td>
                );
              })}
              <td className={`py-2 pl-3 text-right font-bold ${data.totals.neto < 0 ? "text-red-600" : "text-green-700"}`}>
                {din(data.totals.neto)}
                {data.totals.marzaPct !== null && <span className="block text-xs text-gray-400 font-normal">({data.totals.marzaPct}%)</span>}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Marže po kursevima */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 overflow-x-auto">
        <h2 className="font-semibold mb-3">Marže po kursevima - {periodLabel}</h2>
        <table className="text-sm w-full min-w-[700px]">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="py-1 pr-3 font-medium">Kurs</th><th className="py-1 px-2 font-medium">Tip</th>
              <th className="py-1 px-2 text-right font-medium">Prihod</th><th className="py-1 px-2 text-right font-medium">Honorari</th>
              <th className="py-1 px-2 text-right font-medium">Troškovi</th><th className="py-1 px-2 text-right font-medium">Marža</th>
              <th className="py-1 pl-2 text-right font-medium">%</th>
            </tr>
          </thead>
          <tbody>
            {data.kursevi.map((k) => (
              <tr key={k.course_id} className="border-t border-gray-50">
                <td className="py-2 pr-3">{k.title}</td>
                <td className="py-2 px-2 text-gray-500">{KATEGORIJA_LABELS[k.kategorija]}</td>
                <td className="py-2 px-2 text-right">{din(k.prihod)}</td>
                <td className="py-2 px-2 text-right">{k.honorar ? `−${din(k.honorar)}` : "-"}</td>
                <td className="py-2 px-2 text-right">{k.direktniTroskovi ? `−${din(k.direktniTroskovi)}` : "-"}</td>
                <td className={`py-2 px-2 text-right font-semibold ${k.marza < 0 ? "text-red-600" : ""}`}>{din(k.marza)}</td>
                <td className="py-2 pl-2 text-right text-gray-500">{k.marzaPct !== null ? `${k.marzaPct}%` : "-"}</td>
              </tr>
            ))}
            <tr className="border-t border-gray-200">
              <td className="py-2 pr-3 text-gray-500" colSpan={5}>Opšti troškovi (nealocirani)</td>
              <td className="py-2 px-2 text-right text-red-600">−{din(data.opstiTroskovi)}</td><td />
            </tr>
            {(() => {
              const netoKursevi = data.kursevi.reduce((s, k) => s + k.marza, 0) - data.opstiTroskovi;
              return (
                <tr className="border-t-2 border-gray-200">
                  <td className="py-2 pr-3 font-bold" colSpan={5}>Neto zarada</td>
                  <td className={`py-2 px-2 text-right font-bold ${netoKursevi < 0 ? "text-red-600" : "text-green-700"}`}>{din(netoKursevi)}</td>
                  <td />
                </tr>
              );
            })()}
          </tbody>
        </table>
      </section>

      {/* Po grupama */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 overflow-x-auto">
        <h2 className="font-semibold mb-1">Po grupama - {periodLabel}</h2>
        <p className="text-xs text-gray-400 mb-3">Crveno = grupa ispod break-even tačke (honorar veći od prihoda u periodu).</p>
        <table className="text-sm w-full min-w-[700px]">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="py-1 pr-3 font-medium">Grupa</th><th className="py-1 px-2 font-medium">Profesorka</th>
              <th className="py-1 px-2 font-medium">Status</th><th className="py-1 px-2 text-center font-medium">Popunjenost</th>
              <th className="py-1 px-2 text-right font-medium">Prihod</th><th className="py-1 px-2 text-right font-medium">Honorar</th>
              <th className="py-1 px-2 text-right font-medium">Zarada</th><th className="py-1 pl-2 text-right font-medium">Po članu</th>
            </tr>
          </thead>
          <tbody>
            {data.grupe.map((g) => (
              <tr key={g.group_id} className={`border-t border-gray-50 ${g.zarada < 0 ? "bg-red-50" : ""}`}>
                <td className="py-2 pr-3">{g.naziv}</td>
                <td className="py-2 px-2">{g.profesorka}</td>
                <td className="py-2 px-2 text-gray-500">{g.status}</td>
                <td className="py-2 px-2 text-center">{g.clanovi}/{g.maxSeats}</td>
                <td className="py-2 px-2 text-right">{din(g.prihod)}</td>
                <td className="py-2 px-2 text-right">−{din(g.honorar)}</td>
                <td className={`py-2 px-2 text-right font-semibold ${g.zarada < 0 ? "text-red-600" : ""}`}>{din(g.zarada)}</td>
                <td className="py-2 pl-2 text-right text-gray-500">{g.clanovi > 0 ? din(g.zaradaPoClanu) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(() => {
          // Prosečna popunjenost po nivou - samo aktivne/otvorene grupe
          const aktivneGrupe = data.grupe.filter((g) => g.status === "u_toku" || g.status === "otvoren");
          if (aktivneGrupe.length === 0) return null;
          const byLevel = new Map<string, { ukupnoClanovi: number; ukupnoSeats: number }>();
          for (const g of aktivneGrupe) {
            const agg = byLevel.get(g.level) ?? { ukupnoClanovi: 0, ukupnoSeats: 0 };
            agg.ukupnoClanovi += g.clanovi;
            agg.ukupnoSeats += g.maxSeats;
            byLevel.set(g.level, agg);
          }
          const delovi = [...byLevel.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([nivo, { ukupnoClanovi, ukupnoSeats }]) => {
              const pct = ukupnoSeats > 0 ? Math.round((ukupnoClanovi / ukupnoSeats) * 100) : 0;
              return `${nivo}: ${pct}%`;
            });
          return (
            <p className="mt-2 text-xs text-gray-400">
              Prosečna popunjenost po nivou: {delovi.join(" · ")}
            </p>
          );
        })()}
      </section>

      {/* Po profesorkama */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h2 className="font-semibold">Po profesorkama - {periodLabel}</h2>
          <div className="flex items-center gap-2">
            {sendMsg && <span className="text-xs text-gray-500">{sendMsg}</span>}
            <button onClick={posaljiObracun} disabled={!mesec || sending}
              title={!mesec ? "Izaberi konkretan mesec da bi poslala obračun." : undefined}
              className="bg-plava text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
              {sending ? "Šaljem..." : "Pošalji obračun profesorkama"}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-3">Retencija = prosečan broj meseci u kojima polaznik plaća (cela istorija, ne samo izabrani period). Prihod uključuje i autorski procenat video kurseva (FSP/FIDE); retencija se odnosi samo na polaznike časova. Zarađeno = časovi + autorski procenat + odobrene aktivnosti. Ukupan saldo danas je ista brojka kao na Obavezama (bez autorskog procenta) i ne zavisi od izabranog perioda. P&L tabela gore ne uključuje aktivnosti - one ulaze samo u ovaj pregled.</p>
        <table className="text-sm w-full min-w-[1000px]">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="py-1 pr-3 font-medium">Profesorka</th>
              <th className="py-1 px-2 text-right font-medium">Prihod koji donosi</th>
              <th className="py-1 px-2 text-right font-medium">Zarađeno</th>
              <th className="py-1 px-2 text-right font-medium">Isplaćeno</th>
              <th className="py-1 px-2 text-right font-medium">Saldo perioda</th>
              <th className="py-1 px-2 text-right font-medium">Ukupan saldo danas</th>
              <th className="py-1 px-2 text-right font-medium">Neto doprinos</th>
              <th className="py-1 px-2 text-center font-medium">Aktivni polaznici</th>
              <th className="py-1 pl-2 text-right font-medium">Retencija (mes.)</th>
            </tr>
          </thead>
          <tbody>
            {data.profesorke.map((p) => (
              <tr key={p.professor_id} className="border-t border-gray-50">
                <td className="py-2 pr-3">{p.ime}</td>
                <td className="py-2 px-2 text-right">{din(p.prihod)}</td>
                <td className="py-2 px-2 text-right">−{din(p.zaradjeno)}</td>
                <td className="py-2 px-2 text-right">{din(p.isplaceno)}</td>
                <td className={`py-2 px-2 text-right ${p.saldoPerioda > 0 ? "text-red-600 font-semibold" : ""}`}>{din(p.saldoPerioda)}</td>
                <td className={`py-2 px-2 text-right ${(ukupanSaldo[p.professor_id] ?? 0) > 0 ? "text-red-600 font-semibold" : ""}`}>{din(ukupanSaldo[p.professor_id] ?? 0)}</td>
                <td className={`py-2 px-2 text-right font-semibold ${p.neto < 0 ? "text-red-600" : ""}`}>{din(p.neto)}</td>
                <td className="py-2 px-2 text-center">{p.aktivniPolaznici}</td>
                <td className="py-2 pl-2 text-right">{p.retencijaMeseci ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Troškovi CRUD */}
      <section className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Troškovi - {periodLabel}</h2>
          <button onClick={() => { setEditing(null); setModalOpen(true); }}
            className="bg-plava text-white text-sm px-4 py-2 rounded-lg hover:opacity-90">
            + Dodaj trošak
          </button>
        </div>
        <table className="text-sm w-full">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="py-1 pr-3 font-medium">Naziv</th><th className="py-1 px-2 font-medium">Kategorija</th>
              <th className="py-1 px-2 text-right font-medium">Iznos</th><th className="py-1 px-2 font-medium">Od</th>
              <th className="py-1 px-2 font-medium">Tip</th><th className="py-1 px-2 font-medium">Kurs</th><th />
            </tr>
          </thead>
          <tbody>
            {visibleExpenses.map((e) => (
              <tr key={e.id} className="border-t border-gray-50">
                <td className="py-2 pr-3">{e.name}</td>
                <td className="py-2 px-2 text-gray-500">{EXPENSE_CATEGORY_LABELS[e.category as ExpenseCategory] ?? e.category}</td>
                <td className="py-2 px-2 text-right">{din(e.amount)}{e.recurring ? "/mes." : ""}</td>
                <td className="py-2 px-2 text-gray-500">{e.expense_date}</td>
                <td className="py-2 px-2 text-gray-500">{e.recurring ? (e.ended_at ? `mesečni do ${e.ended_at}` : "mesečni") : "jednokratni"}</td>
                <td className="py-2 px-2 text-gray-500">{e.course_id ? courseOptions.find((c) => c.id === e.course_id)?.title ?? "?" : "opšti"}</td>
                <td className="py-2 pl-2 text-right whitespace-nowrap">
                  <button onClick={() => { setEditing(e); setModalOpen(true); }} className="text-plava text-xs mr-3">Izmeni</button>
                  <button onClick={() => deleteExpense(e.id)} className="text-red-500 text-xs">Obriši</button>
                </td>
              </tr>
            ))}
            {visibleExpenses.length === 0 && (
              <tr><td colSpan={7} className="py-4 text-center text-gray-400">Nema troškova za ovaj period.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">{editing ? "Izmeni trošak" : "Novi trošak"}</h3>
            <form onSubmit={(e) => { e.preventDefault(); saveExpense(new FormData(e.currentTarget)); }} className="space-y-3 text-sm">
              <label className="block">Naziv
                <input name="name" required defaultValue={editing?.name ?? ""} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2" />
              </label>
              <label className="block">Kategorija
                <select name="category" defaultValue={editing?.category ?? "marketing"} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 bg-white">
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</option>)}
                </select>
              </label>
              <label className="block">Iznos (din)
                <input name="amount" type="number" min="1" step="1" required defaultValue={editing?.amount ?? ""} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2" />
              </label>
              <label className="block">Datum (za mesečne: od kog meseca)
                <input name="expense_date" type="date" required defaultValue={editing?.expense_date ?? new Date().toISOString().slice(0, 10)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2" />
              </label>
              <label className="flex items-center gap-2">
                <input name="recurring" type="checkbox" defaultChecked={editing?.recurring ?? false} />
                Mesečni trošak (ponavlja se svakog meseca)
              </label>
              <label className="block">Prestaje (samo za mesečne; prazno = aktivan)
                <input name="ended_at" type="date" defaultValue={editing?.ended_at ?? ""} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2" />
              </label>
              <label className="block">Kurs (opciono - direktan trošak kursa)
                <select name="course_id" defaultValue={editing?.course_id ?? ""} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 bg-white">
                  <option value="">- opšti trošak -</option>
                  {courseOptions.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </label>
              <label className="block">Napomena
                <input name="note" defaultValue={editing?.note ?? ""} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2" />
              </label>
              {err && <p className="text-red-600">{err}</p>}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="bg-plava text-white px-4 py-2 rounded-lg disabled:opacity-50">
                  {saving ? "Čuvam…" : "Sačuvaj"}
                </button>
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200">Otkaži</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, cells, bold, indent, negative, pctOf }: { label: string; cells: number[]; bold?: boolean; indent?: boolean; negative?: boolean; pctOf?: number }) {
  const total = cells.reduce((a, b) => a + b, 0);
  const cls = (n: number) => `py-1 px-2 text-right ${bold ? "font-semibold" : ""} ${negative && n !== 0 ? "text-red-600/80" : ""}`;
  const pct = pctOf && pctOf > 0 && total !== 0 ? Math.round(Math.abs(total) / pctOf * 100) : null;
  return (
    <tr className={bold ? "border-t border-gray-100" : ""}>
      <td className={`py-1 pr-3 ${indent ? "pl-4 text-gray-500" : ""} ${bold ? "font-semibold" : ""}`}>{label}</td>
      {cells.map((c, i) => <td key={i} className={cls(c)}>{c !== 0 ? din(c) : "-"}</td>)}
      <td className={`py-1 pl-3 text-right ${bold ? "font-semibold" : "text-gray-500"}`}>
        {total !== 0 ? din(total) : "-"}
        {pct !== null && <span className="block text-xs text-gray-400 font-normal">({pct}%)</span>}
      </td>
    </tr>
  );
}

function PeriodCards({ data, mesec, pendingTotal, periodLabel }: { data: FinansijeData; mesec: number | null; pendingTotal: number; periodLabel: string }) {
  // Za mesec filter: sume iz tog meseca; za godinu: totals.
  const m = mesec ? data.months[mesec - 1] : null;
  const prihod = m ? m.prihodUkupno : data.totals.prihod;
  const rashodi = m ? m.honorariUkupno + m.troskoviUkupno : data.totals.rashodi;
  const neto = prihod - rashodi;
  const marza = prihod > 0 ? Math.round((neto / prihod) * 100) : null;
  const cards = [
    { label: `Prihod - ${periodLabel}`, value: din(prihod), sub: pendingTotal ? `+ ${din(pendingTotal)} na čekanju` : null, color: "" },
    { label: "Rashodi", value: din(rashodi), sub: null, color: "" },
    { label: "Neto zarada", value: din(neto), sub: null, color: neto < 0 ? "text-red-600" : "text-green-700" },
    { label: "Marža", value: marza !== null ? `${marza}%` : "-", sub: null, color: "" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400">{c.label}</div>
          <div className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</div>
          {c.sub && <div className="text-xs text-gray-400 mt-1">{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}
