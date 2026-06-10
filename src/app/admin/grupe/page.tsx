"use client";

import { useEffect, useState, useCallback } from "react";
import { computeEndDate } from "@/lib/groups";

interface Group {
  id: string;
  level: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  duration_weeks: number | null;
  days: number[] | null;
  session_time: string | null;
  min_seats: number;
  max_seats: number;
  price: number | null;
  manual_enrolled: number | null;
  professor_id: string | null;
  content_course_id: string | null;
  gcal_event_id: string | null;
  meet_link: string | null;
  notes_url: string | null;
  enrolled: number;
  professor?: { full_name: string } | null;
  content_course?: { slug: string; title: string } | null;
}
interface Prof {
  id: string;
  full_name: string;
}
interface Course {
  id: string;
  slug: string;
  title: string;
}

const STATUSI = ["planiran", "uskoro", "otvoren", "u_toku", "zavrsena", "otkazana"];
const AKTIVNI_STATUSI = ["planiran", "uskoro", "otvoren", "u_toku"];
const STATUS_BOJA: Record<string, string> = {
  planiran: "bg-gray-100 text-gray-600",
  uskoro: "bg-amber-100 text-amber-700",
  otvoren: "bg-green-100 text-green-700",
  u_toku: "bg-sky-100 text-sky-700",
  zavrsena: "bg-gray-100 text-gray-400",
  otkazana: "bg-red-50 text-red-500",
};
const DANI: [number, string][] = [
  [1, "pon"],
  [2, "uto"],
  [3, "sre"],
  [4, "čet"],
  [5, "pet"],
  [6, "sub"],
  [7, "ned"],
];

const emptyForm: Partial<Group> = {
  level: "",
  status: "planiran",
  days: [],
  min_seats: 3,
  max_seats: 6,
};

const inputCls =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-plava/40";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

export default function AdminGrupePage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showArhiva, setShowArhiva] = useState(false);
  const [profs, setProfs] = useState<Prof[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<Partial<Group> | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [enrollEmail, setEnrollEmail] = useState("");
  const [members, setMembers] = useState<
    { user_id: string; email: string; full_name: string | null }[]
  >([]);

  const fetchGroups = useCallback(async () => {
    const r = await fetch("/api/admin/grupe");
    if (r.ok) {
      const j = await r.json();
      setGroups(j.groups || []);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    fetch("/api/admin/profesori")
      .then((r) => (r.ok ? r.json() : { professors: [] }))
      .then((j) => setProfs(j.professors || []))
      .catch(() => {});
    fetch("/api/admin/grupe/courses")
      .then((r) => (r.ok ? r.json() : { courses: [] }))
      .then((j) => setCourses(j.courses || []))
      .catch(() => {});
  }, []);

  function startNew() {
    setForm({ ...emptyForm });
    setMembers([]);
    setSavedAt(0);
  }
  function startEdit(g: Group) {
    setForm({ ...g });
    setMembers([]);
    setSavedAt(0);
  }
  function cancelEdit() {
    setForm(null);
    setMembers([]);
    setEnrollEmail("");
    setSavedAt(0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    const method = form.id ? "PATCH" : "POST";
    const url = form.id ? `/api/admin/grupe/${form.id}` : "/api/admin/grupe";
    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const j = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok) {
      alert("Greška: " + (j.error || "nešto nije u redu"));
      return;
    }
    // Ostani u formi posle čuvanja (da možeš da nastaviš — npr. „Napravi/osveži termin").
    if (!form.id && j.id) setForm({ ...form, id: j.id }); // nova grupa → pređi u režim izmene
    setSavedAt(Date.now());
    fetchGroups();
  }

  async function cancelGroup(id: string) {
    if (!confirm("Otkazati grupu?")) return;
    await fetch(`/api/admin/grupe/${id}`, { method: "DELETE" });
    fetchGroups();
  }

  // Napravi termin (ako ga nema) ili pomeri postojeći na nove datume — ISTI Meet, BEZ reseta prijava.
  async function osveziTermin() {
    if (!form?.id) return;
    if (!confirm("Napravi/osveži termin?\n\nNapravi Google event+Meet (ako ne postoji) ili pomeri postojeći na nove datume — ISTI Meet link. Prijave OSTAJU. Sačuvaj izmene pre ovoga ako si menjala datum.")) return;
    setSaving(true);
    const r = await fetch(`/api/admin/grupe/${form.id}/osvezi-termin`, { method: "POST" });
    const j = await r.json();
    setSaving(false);
    if (!r.ok) { alert("Greška: " + j.error); return; }
    alert("Termin osvežen! ✅\n\nMeet: " + (j.meetLink || "—") + "\nBeleške: " + (j.notesUrl || "(zadržane postojeće)"));
    cancelEdit();
    fetchGroups();
  }

  // Napravi/osveži termin direktno iz reda (bez ulaska u Izmeni).
  async function napraviTerminRow(g: Group) {
    if (!confirm(`Napravi termin za grupu ${g.level}?\n\nPravi Google Meet + beleške + sve termine iz rasporeda. Prijave ostaju.`)) return;
    setSaving(true);
    const r = await fetch(`/api/admin/grupe/${g.id}/osvezi-termin`, { method: "POST" });
    const j = await r.json().catch(() => ({}));
    setSaving(false);
    if (!r.ok) { alert("Greška: " + (j.error || "nešto nije u redu")); return; }
    alert("Termin napravljen! ✅\n\nMeet: " + (j.meetLink || "—") + "\nBeleške: " + (j.notesUrl || "(zadržane)"));
    fetchGroups();
  }

  // Dupliraj grupu → otvori formu sa istim nivoom/profesorom/rasporedom, prazan datum, status planiran.
  function dupliraj(g: Group) {
    setForm({
      level: g.level, status: "planiran", professor_id: g.professor_id,
      content_course_id: g.content_course_id, days: g.days ? [...g.days] : [],
      session_time: g.session_time, duration_weeks: g.duration_weeks,
      min_seats: g.min_seats, max_seats: g.max_seats, start_date: null,
    });
    setMembers([]); setSavedAt(0);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Nova generacija — isprazni prijave (0/6) + NOV Meet/beleške.
  async function novaGeneracija() {
    if (!form?.id) return;
    if (!confirm("NOVA generacija?\n\nPRAZNI broj upisanih na 0 i pravi NOV Meet + nove beleške (novi ciklus). Pristup sadržaju prethodnim polaznicima OSTAJE. Koristi kad prethodna grupa završi/popuni.")) return;
    setSaving(true);
    const r = await fetch(`/api/admin/grupe/${form.id}/nova-generacija`, { method: "POST" });
    const j = await r.json();
    setSaving(false);
    if (!r.ok) { alert("Greška: " + j.error); return; }
    alert("Nova generacija otvorena! ✅ (0/6)\n\nMeet: " + (j.meetLink || "—") + "\nBeleške: " + (j.notesUrl || "—"));
    cancelEdit();
    fetchGroups();
  }

  async function addMember() {
    if (!form?.id) return;
    const r = await fetch(`/api/admin/grupe/${form.id}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: enrollEmail }),
    });
    const j = await r.json();
    if (!r.ok) {
      alert("Greška: " + j.error);
      return;
    }
    setMembers((m) => [
      ...m,
      { user_id: j.user_id, email: enrollEmail, full_name: j.full_name },
    ]);
    setEnrollEmail("");
    fetchGroups();
  }

  function toggleDay(n: number) {
    if (!form) return;
    const cur = form.days || [];
    setForm({
      ...form,
      days: cur.includes(n) ? cur.filter((d) => d !== n) : [...cur, n],
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-montserrat text-2xl font-bold text-gray-900">Grupe</h1>
        {!form && (
          <button
            type="button"
            onClick={startNew}
            className="bg-plava text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
          >
            + Nova grupa
          </button>
        )}
      </div>

      {/* Form */}
      {form && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-xl p-5 mb-8 space-y-4"
        >
          <h2 className="font-semibold text-gray-800">
            {form.id ? "Izmena grupe" : "Nova grupa"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Nivo</label>
              <input
                type="text"
                required
                value={form.level || ""}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                placeholder="A1.1"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select
                value={form.status || "planiran"}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={inputCls}
              >
                {STATUSI.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Profesor</label>
              <select
                value={form.professor_id || ""}
                onChange={(e) =>
                  setForm({ ...form, professor_id: e.target.value || null })
                }
                className={inputCls}
              >
                <option value="">—</option>
                {profs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Sadržajni kurs (daje pristup)</label>
              <select
                value={form.content_course_id || ""}
                onChange={(e) =>
                  setForm({ ...form, content_course_id: e.target.value || null })
                }
                className={inputCls}
              >
                <option value="">—</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.slug}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Početak</label>
              <input
                type="date"
                value={form.start_date || ""}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value || null })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Kraj (računa se)</label>
              <input
                type="text"
                readOnly
                value={computeEndDate(form.start_date ?? null, form.days ?? null, form.duration_weeks ?? null) ?? "—"}
                title="Računa se iz početka + broja nedelja; upisuje se kad otvoriš termin."
                className={inputCls + " bg-gray-50 text-gray-500"}
              />
            </div>
            <div>
              <label className={labelCls}>Trajanje (nedelja)</label>
              <input
                type="number"
                value={form.duration_weeks ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    duration_weeks: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Sat</label>
              <input
                type="text"
                value={form.session_time || ""}
                onChange={(e) =>
                  setForm({ ...form, session_time: e.target.value || null })
                }
                placeholder="18:00-19:00"
                className={inputCls}
              />
            </div>
            {/* Cena se ne unosi ovde — naplata ide po ceni kursa (courses tabela). */}
            <div>
              <label className={labelCls}>Min mesta</label>
              <input
                type="number"
                value={form.min_seats ?? 3}
                onChange={(e) =>
                  setForm({ ...form, min_seats: Number(e.target.value) })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Max mesta</label>
              <input
                type="number"
                value={form.max_seats ?? 6}
                onChange={(e) =>
                  setForm({ ...form, max_seats: Number(e.target.value) })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Prikazano zauzeto (za sajt)</label>
              <input
                type="number"
                value={form.manual_enrolled ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    manual_enrolled: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="auto"
                className={inputCls}
              />
              <p className="mt-1 text-xs text-gray-400">
                Prazno = računa se iz stvarnih polaznika. Broj = toliko mesta prikaži zauzeto na sajtu.
              </p>
            </div>
          </div>

          <div>
            <label className={labelCls}>Dani</label>
            <div className="flex flex-wrap gap-3">
              {DANI.map(([n, lbl]) => (
                <label
                  key={n}
                  className="flex items-center gap-1.5 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={(form.days || []).includes(n)}
                    onChange={() => toggleDay(n)}
                    className="rounded"
                  />
                  {lbl}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-plava text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {form.id ? "Sačuvaj izmene" : "Dodaj grupu"}
            </button>
            {savedAt > 0 && (
              <span className="text-green-600 text-sm font-medium self-center">Sačuvano ✓</span>
            )}
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
            >
              Otkaži
            </button>
            {form.id && (
              <>
                <button
                  type="button"
                  onClick={osveziTermin}
                  disabled={saving}
                  className="ml-auto bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  title="Napravi event+Meet ili pomeri postojeći na nove datume (isti Meet). Prijave ostaju."
                >
                  Napravi / osveži termin
                </button>
                <button
                  type="button"
                  onClick={novaGeneracija}
                  disabled={saving}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  title="Isprazni prijave (0/6) + nov Meet/beleške (novi ciklus)"
                >
                  Nova generacija
                </button>
              </>
            )}
          </div>

          {/* Polaznici — samo za postojeću grupu */}
          {form.id && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-1">Polaznici</h3>
              <p className="text-xs text-gray-400 mb-3">
                Dodavanje polaznika kreira nalog (ako ne postoji) i daje pristup
                sadržajnom kursu. Koristi prave mejlove.
              </p>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="email"
                  value={enrollEmail}
                  onChange={(e) => setEnrollEmail(e.target.value)}
                  placeholder="mejl polaznika"
                  className={inputCls + " max-w-xs"}
                />
                <button
                  type="button"
                  onClick={addMember}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
                >
                  Dodaj polaznika
                </button>
              </div>
              {members.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-gray-700">
                  {members.map((m) => (
                    <li key={m.user_id}>
                      ✓ {m.email} {m.full_name ? `(${m.full_name})` : ""}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-gray-400">
                Trenutno upisanih u bazi:{" "}
                {groups.find((g) => g.id === form.id)?.enrolled ?? 0}
              </p>
            </div>
          )}
        </form>
      )}

      {/* Lista grupa — aktivne gore (po datumu), arhiva sakrivena, sa upozorenjima */}
      {(() => {
        const t0 = new Date(); t0.setHours(0, 0, 0, 0);
        const daysUntil = (d: string | null) => d ? Math.round((new Date(d + "T00:00:00").getTime() - t0.getTime()) / 86400000) : null;
        const hasSchedule = (g: Group) => !!(g.start_date && g.days?.length && g.session_time && g.duration_weeks);
        const hasTermin = (g: Group) => !!(g.gcal_event_id || g.meet_link);
        const needsTermin = (g: Group) => AKTIVNI_STATUSI.includes(g.status) && hasSchedule(g) && !hasTermin(g);
        const lowEnroll = (g: Group) => { const d = daysUntil(g.start_date); return AKTIVNI_STATUSI.includes(g.status) && d !== null && d >= 0 && d <= 7 && g.enrolled < g.min_seats; };

        const byStart = (a: Group, b: Group) => (a.start_date || "9999").localeCompare(b.start_date || "9999");
        const aktivne = groups.filter((g) => AKTIVNI_STATUSI.includes(g.status)).sort(byStart);
        const arhiva = groups.filter((g) => !AKTIVNI_STATUSI.includes(g.status)).sort((a, b) => (b.start_date || "0").localeCompare(a.start_date || "0"));
        const visible = showArhiva ? [...aktivne, ...arhiva] : aktivne;

        const kreceNedelja = aktivne.filter((g) => { const d = daysUntil(g.start_date); return d !== null && d >= 0 && d <= 7; }).length;
        const bezTermina = aktivne.filter(needsTermin).length;
        const ispodMin = aktivne.filter(lowEnroll).length;

        return (
          <>
            {/* Mini-pregled */}
            <div className="flex flex-wrap gap-2 mb-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600">{aktivne.length} aktivnih</span>
              <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700">{kreceNedelja} kreće (≤7 dana)</span>
              {bezTermina > 0 && <span className="px-3 py-1 rounded-full bg-red-100 text-red-600">🔴 {bezTermina} bez termina</span>}
              {ispodMin > 0 && <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700">🟡 {ispodMin} ispod min</span>}
            </div>
            <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-3 font-medium">Nivo</th>
                    <th className="px-4 py-3 font-medium">Profesor</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Početak</th>
                    <th className="px-4 py-3 font-medium">Upisani / Max</th>
                    <th className="px-4 py-3 font-medium">Termin</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((g) => {
                    const aktivna = AKTIVNI_STATUSI.includes(g.status);
                    return (
                      <tr key={g.id} className="border-b border-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {g.level}
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            {needsTermin(g) && <span className="text-[11px] text-red-500">🔴 Treba termin</span>}
                            {lowEnroll(g) && <span className="text-[11px] text-amber-600">🟡 Malo upisa</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{g.professor?.full_name || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BOJA[g.status] || "bg-gray-100 text-gray-600"}`}>{g.status}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{g.start_date || "—"}</td>
                        <td className={`px-4 py-3 ${aktivna && g.enrolled < g.min_seats ? "text-red-500" : "text-gray-600"}`}>{g.enrolled}/{g.max_seats}</td>
                        <td className="px-4 py-3">
                          {hasTermin(g) ? (
                            <div className="flex gap-2 text-xs">
                              {g.meet_link && <a href={g.meet_link} target="_blank" rel="noreferrer" className="text-plava hover:underline" title="Meet">🎥 Meet</a>}
                              {g.notes_url && <a href={g.notes_url} target="_blank" rel="noreferrer" className="text-plava hover:underline" title="Beleške">📝</a>}
                            </div>
                          ) : needsTermin(g) ? (
                            <button type="button" onClick={() => napraviTerminRow(g)} disabled={saving} className="text-xs bg-plava text-white px-2 py-1 rounded-lg hover:bg-plava-dark disabled:opacity-50">Napravi termin</button>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3 whitespace-nowrap">
                            <button type="button" onClick={() => startEdit(g)} className="text-plava hover:underline">Izmeni</button>
                            <button type="button" onClick={() => dupliraj(g)} className="text-gray-500 hover:underline">Dupliraj</button>
                            {g.status !== "otkazana" && g.status !== "zavrsena" && (
                              <button type="button" onClick={() => cancelGroup(g.id)} className="text-red-500 hover:underline">Otkaži</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                        {groups.length === 0 ? "Nema grupa. Klikni „+ Nova grupa” da dodaš prvu." : "Nema aktivnih grupa."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {arhiva.length > 0 && (
              <button type="button" onClick={() => setShowArhiva(!showArhiva)} className="text-sm text-plava hover:underline mt-3">
                {showArhiva ? "Sakrij arhivu" : `Prikaži arhivu (${arhiva.length} završenih/otkazanih)`}
              </button>
            )}
          </>
        );
      })()}
    </div>
  );
}
