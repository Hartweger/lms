"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CrmContact, CrmInteraction, CrmStage } from "@/lib/crm/types";
import { CRM_STAGES } from "@/lib/crm/types";

const STAGE_LABEL: Record<CrmStage, string> = {
  nov: "Nov", kontaktiran: "Kontaktiran", zainteresovan: "Zainteresovan",
  ponuda: "Ponuda", upisan: "Upisan", izgubljen: "Izgubljen",
};

export default function CrmDetailClient({
  contact, interactions, courses,
}: {
  contact: CrmContact;
  interactions: CrmInteraction[];
  courses: { course_id: string; expires_at: string | null }[];
}) {
  const router = useRouter();
  const [stage, setStage] = useState<CrmStage>(contact.stage);
  const [nextAction, setNextAction] = useState(contact.next_action ?? "");
  const [nextAt, setNextAt] = useState(contact.next_action_at?.slice(0, 10) ?? "");
  const [note, setNote] = useState(contact.note ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [drafting, setDrafting] = useState(false);

  async function draftReply() {
    setDrafting(true);
    const res = await fetch(`/api/admin/crm/${contact.id}/draft`, { method: "POST" });
    setDrafting(false);
    if (res.ok) {
      const d = await res.json();
      setSubject(d.subject ?? "");
      setMessage(d.message ?? "");
    } else {
      alert((await res.json()).error ?? "AI predlog nije uspeo.");
    }
  }

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    const res = await fetch(`/api/admin/crm/${contact.id}`, {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) alert((await res.json()).error ?? "Greška.");
    else router.refresh();
  }

  async function sendEmail() {
    if (!subject.trim() || !message.trim()) { alert("Naslov i poruka su obavezni."); return; }
    setBusy(true);
    const res = await fetch(`/api/admin/crm/${contact.id}/email`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ subject, message }),
    });
    setBusy(false);
    if (res.ok) { setSubject(""); setMessage(""); router.refresh(); }
    else alert((await res.json()).error ?? "Slanje nije uspelo.");
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="space-y-4 md:col-span-2">
        <header className="rounded border p-4">
          <h1 className="text-xl font-bold">{contact.name || "Bez imena"}</h1>
          <div className="mt-1 text-sm text-gray-600">
            {contact.email && <div>✉ {contact.email}</div>}
            {contact.phone && <div>☎ {contact.phone}</div>}
            {contact.instagram_handle && <div>IG @{contact.instagram_handle}</div>}
            <div className="mt-1 text-xs text-gray-400">Izvor: {contact.source} · Nivo: {contact.level || "—"}</div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <select value={stage} disabled={busy}
              onChange={(e) => { const s = e.target.value as CrmStage; setStage(s); patch({ stage: s }); }}
              className="rounded border px-2 py-1 text-sm">
              {CRM_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
            </select>
          </div>
        </header>

        <section className="rounded border p-4">
          <h2 className="mb-2 font-semibold">Sledeći korak</h2>
          <input value={nextAction} onChange={(e) => setNextAction(e.target.value)}
            placeholder="npr. poslati ponudu za B1"
            className="mb-2 w-full rounded border px-2 py-1 text-sm" />
          <div className="flex gap-2">
            <input type="date" value={nextAt} onChange={(e) => setNextAt(e.target.value)}
              className="rounded border px-2 py-1 text-sm" />
            <button disabled={busy} onClick={() => patch({ next_action: nextAction, next_action_at: nextAt || null })}
              className="rounded bg-black px-3 py-1 text-sm text-white">Sačuvaj</button>
          </div>
        </section>

        <section className="rounded border p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Pošalji mejl</h2>
            <button disabled={drafting || busy} onClick={draftReply}
              className="rounded border px-2 py-1 text-xs disabled:opacity-50">
              {drafting ? "Pišem predlog…" : "✨ Predloži odgovor (AI)"}
            </button>
          </div>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Naslov"
            className="mb-2 w-full rounded border px-2 py-1 text-sm" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Poruka…"
            rows={4} className="mb-2 w-full rounded border px-2 py-1 text-sm" />
          <button disabled={busy || !contact.email} onClick={sendEmail}
            className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-50">
            {contact.email ? "Pošalji" : "Nema mejl adresu"}
          </button>
        </section>

        <section className="rounded border p-4">
          <h2 className="mb-3 font-semibold">Istorija</h2>
          <ul className="space-y-3">
            {interactions.map((it) => (
              <li key={it.id} className="border-l-2 border-gray-200 pl-3">
                <div className="text-xs text-gray-400">
                  {it.occurred_at.slice(0, 16).replace("T", " ")} · {it.channel} · {it.direction}
                </div>
                {it.summary && <div className="text-sm font-medium">{it.summary}</div>}
                {it.body && <div className="whitespace-pre-wrap text-sm text-gray-700">{it.body}</div>}
              </li>
            ))}
            {interactions.length === 0 && <li className="text-sm text-gray-500">Nema interakcija.</li>}
          </ul>
        </section>
      </div>

      <div className="space-y-4">
        <section className="rounded border p-4">
          <h2 className="mb-2 font-semibold">Beleška</h2>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4}
            className="mb-2 w-full rounded border px-2 py-1 text-sm" />
          <button disabled={busy} onClick={() => patch({ note })}
            className="rounded bg-black px-3 py-1 text-sm text-white">Sačuvaj belešku</button>
        </section>

        <section className="rounded border p-4">
          <h2 className="mb-2 font-semibold">Kao polaznik</h2>
          {contact.user_id ? (
            courses.length ? (
              <ul className="text-sm">
                {courses.map((c) => (
                  <li key={c.course_id}>
                    {c.course_id}{c.expires_at ? ` — ističe ${c.expires_at.slice(0, 10)}` : ""}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-gray-500">Registrovan, bez aktivnih kurseva.</p>
          ) : <p className="text-sm text-gray-500">Još nije polaznik (samo lid).</p>}
        </section>
      </div>
    </div>
  );
}
