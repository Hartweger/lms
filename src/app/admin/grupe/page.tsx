"use client";

import { useEffect, useState, useCallback } from "react";

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
  const [profs, setProfs] = useState<Prof[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<Partial<Group> | null>(null);
  const [saving, setSaving] = useState(false);
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
  }
  function startEdit(g: Group) {
    setForm({ ...g });
    setMembers([]);
  }
  function cancelEdit() {
    setForm(null);
    setMembers([]);
    setEnrollEmail("");
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
    setSaving(false);
    if (!r.ok) {
      alert("Greška: " + (await r.json()).error);
      return;
    }
    cancelEdit();
    fetchGroups();
  }

  async function cancelGroup(id: string) {
    if (!confirm("Otkazati grupu?")) return;
    await fetch(`/api/admin/grupe/${id}`, { method: "DELETE" });
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
              <label className={labelCls}>Kraj</label>
              <input
                type="date"
                value={form.end_date || ""}
                onChange={(e) =>
                  setForm({ ...form, end_date: e.target.value || null })
                }
                className={inputCls}
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
            <div>
              <label className={labelCls}>Cena (RSD)</label>
              <input
                type="number"
                value={form.price ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className={inputCls}
              />
            </div>
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
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
            >
              Otkaži
            </button>
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

      {/* Lista grupa */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="px-4 py-3 font-medium">Nivo</th>
              <th className="px-4 py-3 font-medium">Profesor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Početak</th>
              <th className="px-4 py-3 font-medium">Upisani / Max</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id} className="border-b border-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{g.level}</td>
                <td className="px-4 py-3 text-gray-600">
                  {g.professor?.full_name || "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">{g.status}</td>
                <td className="px-4 py-3 text-gray-600">{g.start_date || "—"}</td>
                <td
                  className={`px-4 py-3 ${
                    g.enrolled < g.min_seats ? "text-red-500" : "text-gray-600"
                  }`}
                >
                  {g.enrolled}/{g.max_seats}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => startEdit(g)}
                      className="text-plava hover:underline"
                    >
                      Izmeni
                    </button>
                    {g.status !== "otkazana" && (
                      <button
                        type="button"
                        onClick={() => cancelGroup(g.id)}
                        className="text-red-500 hover:underline"
                      >
                        Otkaži
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {groups.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Nema grupa. Klikni „+ Nova grupa” da dodaš prvu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
