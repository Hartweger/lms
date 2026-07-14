"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { CrmContact, CrmStage, CrmSource } from "@/lib/crm/types";
import { CRM_STAGES } from "@/lib/crm/types";

const STAGE_LABEL: Record<CrmStage, string> = {
  nov: "Nov", kontaktiran: "Kontaktiran", zainteresovan: "Zainteresovan",
  ponuda: "Ponuda", upisan: "Upisan", izgubljen: "Izgubljen",
};

// Završene faze — idu u arhivu, podrazumevano skrivene iz aktivnog spiska.
const ARHIVA_FAZE: CrmStage[] = ["upisan", "izgubljen"];

export default function CrmListClient({ contacts }: { contacts: CrmContact[] }) {
  const [stage, setStage] = useState<CrmStage | "">("");
  const [source, setSource] = useState<CrmSource | "">("");
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [showArhiva, setShowArhiva] = useState(false);
  const [rows, setRows] = useState<CrmContact[]>(contacts);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function changeStage(id: string, newStage: CrmStage) {
    const prev = rows;
    setSavingId(id);
    setRows((rs) => rs.map((c) => (c.id === id ? { ...c, stage: newStage } : c)));
    const res = await fetch(`/api/admin/crm/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });
    setSavingId(null);
    if (!res.ok) {
      setRows(prev);
      alert((await res.json()).error ?? "Greška pri promeni faze.");
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const zaDanas = useMemo(
    () => rows.filter(
      (c) => c.stage === "nov" ||
        (c.next_action_at && c.next_action_at.slice(0, 10) <= today)
    ).slice(0, 50),
    [rows, today],
  );

  const filtered = useMemo(() => rows.filter((c) => {
    // Arhiva (upisan/izgubljen) skrivena dok se izričito ne traži ili ne filtrira po toj fazi
    if (!showArhiva && !stage && ARHIVA_FAZE.includes(c.stage)) return false;
    if (stage && c.stage !== stage) return false;
    if (source && c.source !== source) return false;
    if (q) {
      const hay = `${c.name ?? ""} ${c.email ?? ""} ${c.instagram_handle ?? ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [rows, stage, source, q, showArhiva]);

  const arhivaBroj = useMemo(() => rows.filter((c) => ARHIVA_FAZE.includes(c.stage)).length, [rows]);

  async function createContact(form: FormData) {
    setCreating(false);
    const res = await fetch("/api/admin/crm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"), email: form.get("email"),
        phone: form.get("phone"), instagram: form.get("instagram"),
        note: form.get("note"),
      }),
    });
    if (res.ok) location.reload();
    else alert((await res.json()).error ?? "Greška.");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">CRM — lidovi</h1>
        <button onClick={() => setCreating(true)} className="rounded bg-black px-3 py-2 text-sm text-white">
          + Novi kontakt
        </button>
      </div>

      <details className="rounded border bg-gray-50 p-3 text-sm text-gray-600">
        <summary className="cursor-pointer font-medium text-gray-800">Šta znače faze?</summary>
        <ul className="mt-2 space-y-1">
          <li><b>Nov</b> — upravo stigao upit, niko mu još nije odgovorio.</li>
          <li><b>Kontaktiran</b> — javili smo se, čekamo njegov odgovor.</li>
          <li><b>Zainteresovan</b> — pokazao interes, ali se još nije odlučio.</li>
          <li><b>Ponuda</b> — poslali smo konkretnu ponudu/cenu, čekamo odluku.</li>
          <li><b>Upisan</b> — kupio/upisao se (uspeh, ide u arhivu).</li>
          <li><b>Izgubljen</b> — odustao ili neće (zatvoreno, ide u arhivu).</li>
        </ul>
      </details>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Za danas ({zaDanas.length})</h2>
        {zaDanas.length === 0 ? (
          <p className="text-sm text-gray-500">Nema lidova koji čekaju odgovor. 🎉</p>
        ) : (
          <ul className="divide-y rounded border">
            {zaDanas.map((c) => (
              <li key={c.id} className="flex items-center justify-between p-3">
                <Link href={`/admin/crm/${c.id}`} className="font-medium hover:underline">
                  {c.name || c.email || c.instagram_handle || "Bez imena"}
                </Link>
                <span className="text-xs text-gray-500">
                  {STAGE_LABEL[c.stage]}{c.next_action ? ` — ${c.next_action}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pretraga…"
            className="rounded border px-2 py-1 text-sm" />
          <select value={stage} onChange={(e) => setStage(e.target.value as CrmStage | "")}
            className="rounded border px-2 py-1 text-sm">
            <option value="">Sve faze</option>
            {CRM_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
          </select>
          <select value={source} onChange={(e) => setSource(e.target.value as CrmSource | "")}
            className="rounded border px-2 py-1 text-sm">
            <option value="">Svi izvori</option>
            {["naki","smile","kontakt-forma","masterclass","manychat","instagram","whatsapp","rucno","mejl","testiranje"]
              .map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setShowArhiva((v) => !v)}
            className={`rounded border px-2 py-1 text-sm ${showArhiva ? "bg-gray-800 text-white" : ""}`}
          >
            {showArhiva ? "Sakrij arhivu" : `Prikaži arhivu (${arhivaBroj})`}
          </button>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500">
            <th className="p-2">Ime / kontakt</th><th className="p-2">Faza</th>
            <th className="p-2">Izvor</th><th className="p-2">Nivo</th>
            <th className="p-2">Poslednja akcija</th>
          </tr></thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-2">
                  <Link href={`/admin/crm/${c.id}`} className="font-medium hover:underline">
                    {c.name || "Bez imena"}
                  </Link>
                  <div className="text-xs text-gray-500">{c.email || c.instagram_handle || c.phone}</div>
                </td>
                <td className="p-2">
                  <select
                    value={c.stage}
                    disabled={savingId === c.id}
                    onChange={(e) => changeStage(c.id, e.target.value as CrmStage)}
                    className="rounded border px-1 py-0.5 text-xs disabled:opacity-50"
                  >
                    {CRM_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                  </select>
                </td>
                <td className="p-2">{c.source}</td>
                <td className="p-2">{c.level || "—"}</td>
                <td className="p-2 text-xs text-gray-500">{c.last_interaction_at.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-4 text-sm text-gray-500">Nema rezultata.</p>}
      </section>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setCreating(false)}>
          <form onClick={(e) => e.stopPropagation()}
            action={createContact}
            className="w-80 space-y-2 rounded bg-white p-4">
            <h3 className="font-semibold">Novi kontakt</h3>
            <input name="name" placeholder="Ime" className="w-full rounded border px-2 py-1 text-sm" />
            <input name="email" placeholder="Mejl" className="w-full rounded border px-2 py-1 text-sm" />
            <input name="phone" placeholder="Telefon" className="w-full rounded border px-2 py-1 text-sm" />
            <input name="instagram" placeholder="Instagram" className="w-full rounded border px-2 py-1 text-sm" />
            <textarea name="note" placeholder="Beleška / šta je pitao" className="w-full rounded border px-2 py-1 text-sm" />
            <button className="w-full rounded bg-black py-2 text-sm text-white">Sačuvaj</button>
          </form>
        </div>
      )}
    </div>
  );
}
