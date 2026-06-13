"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { CrmContact, CrmStage, CrmSource } from "@/lib/crm/types";
import { CRM_STAGES } from "@/lib/crm/types";

const STAGE_LABEL: Record<CrmStage, string> = {
  nov: "Nov", kontaktiran: "Kontaktiran", zainteresovan: "Zainteresovan",
  ponuda: "Ponuda", upisan: "Upisan", izgubljen: "Izgubljen",
};

export default function CrmListClient({ contacts }: { contacts: CrmContact[] }) {
  const [stage, setStage] = useState<CrmStage | "">("");
  const [source, setSource] = useState<CrmSource | "">("");
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const zaDanas = useMemo(
    () => contacts.filter(
      (c) => c.stage === "nov" ||
        (c.next_action_at && c.next_action_at.slice(0, 10) <= today)
    ).slice(0, 50),
    [contacts, today],
  );

  const filtered = useMemo(() => contacts.filter((c) => {
    if (stage && c.stage !== stage) return false;
    if (source && c.source !== source) return false;
    if (q) {
      const hay = `${c.name ?? ""} ${c.email ?? ""} ${c.instagram_handle ?? ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [contacts, stage, source, q]);

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
            {["naki","smile","kontakt-forma","masterclass","manychat","instagram","whatsapp","rucno"]
              .map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
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
                <td className="p-2">{STAGE_LABEL[c.stage]}</td>
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
