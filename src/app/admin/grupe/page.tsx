"use client";
import { useEffect, useState, useCallback } from "react";

interface Group {
  id: string; level: string; status: string; start_date: string | null;
  end_date: string | null; duration_weeks: number | null; days: number[] | null;
  session_time: string | null; min_seats: number; max_seats: number; price: number | null;
  professor_id: string | null; content_course_id: string | null; enrolled: number;
  professor?: { full_name: string } | null; content_course?: { slug: string; title: string } | null;
}
interface Prof { id: string; full_name: string }
interface Course { id: string; slug: string; title: string }

const STATUSI = ["planiran","uskoro","otvoren","u_toku","zavrsena","otkazana"];
const DANI = [[1,"pon"],[2,"uto"],[3,"sre"],[4,"čet"],[5,"pet"],[6,"sub"],[7,"ned"]] as const;

export default function GrupeAdmin() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [profs, setProfs] = useState<Prof[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [edit, setEdit] = useState<Partial<Group> | null>(null);
  const [enrollEmail, setEnrollEmail] = useState("");
  const [members, setMembers] = useState<{ user_id: string; email: string; full_name: string | null }[]>([]);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/grupe"); const j = await r.json();
    setGroups(j.groups || []);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/admin/profesori").then((r) => r.json()).then((j) => setProfs(j.professors || []));
    fetch("/api/admin/grupe/courses").then((r) => r.json()).then((j) => setCourses(j.courses || [])).catch(() => {});
  }, []);

  async function save() {
    if (!edit) return;
    const method = edit.id ? "PATCH" : "POST";
    const url = edit.id ? `/api/admin/grupe/${edit.id}` : "/api/admin/grupe";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(edit) });
    if (!r.ok) { alert("Greška: " + (await r.json()).error); return; }
    setEdit(null); load();
  }
  async function cancel(id: string) {
    if (!confirm("Otkazati grupu?")) return;
    await fetch(`/api/admin/grupe/${id}`, { method: "DELETE" }); load();
  }
  async function addMember(id: string) {
    const r = await fetch(`/api/admin/grupe/${id}/enroll`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: enrollEmail }) });
    const j = await r.json();
    if (!r.ok) { alert("Greška: " + j.error); return; }
    setMembers((m) => [...m, { user_id: j.user_id, email: enrollEmail, full_name: j.full_name }]);
    setEnrollEmail(""); load();
  }

  const blank: Partial<Group> = { level: "", status: "planiran", days: [], min_seats: 3, max_seats: 6 };

  return (
    <div style={{ padding: 24 }}>
      <h1>Grupe</h1>
      <button onClick={() => { setEdit(blank); setMembers([]); }}>+ Nova grupa</button>
      <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
        <thead><tr><th>Nivo</th><th>Profesor</th><th>Status</th><th>Početak</th><th>Upisani/Max</th><th></th></tr></thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.id} style={{ borderTop: "1px solid #ddd" }}>
              <td>{g.level}</td><td>{g.professor?.full_name || "—"}</td><td>{g.status}</td>
              <td>{g.start_date || "—"}</td>
              <td style={{ color: g.enrolled < g.min_seats ? "#c00" : "inherit" }}>{g.enrolled}/{g.max_seats}</td>
              <td>
                <button onClick={() => { setEdit(g); setMembers([]); }}>Izmeni</button>
                {g.status !== "otkazana" && <button onClick={() => cancel(g.id)}>Otkaži</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {edit && (
        <div style={{ marginTop: 24, padding: 16, border: "1px solid #ccc" }}>
          <h2>{edit.id ? "Izmena grupe" : "Nova grupa"}</h2>
          <label>Nivo <input value={edit.level || ""} onChange={(e) => setEdit({ ...edit, level: e.target.value })} /></label>
          <label> Sadržajni kurs
            <select value={edit.content_course_id || ""} onChange={(e) => setEdit({ ...edit, content_course_id: e.target.value })}>
              <option value="">—</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.slug}</option>)}
            </select></label>
          <label> Profesor
            <select value={edit.professor_id || ""} onChange={(e) => setEdit({ ...edit, professor_id: e.target.value })}>
              <option value="">—</option>
              {profs.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select></label>
          <label> Status
            <select value={edit.status || "planiran"} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
              {STATUSI.map((s) => <option key={s} value={s}>{s}</option>)}
            </select></label>
          <label> Početak <input type="date" value={edit.start_date || ""} onChange={(e) => setEdit({ ...edit, start_date: e.target.value })} /></label>
          <label> Kraj <input type="date" value={edit.end_date || ""} onChange={(e) => setEdit({ ...edit, end_date: e.target.value })} /></label>
          <label> Trajanje (ned) <input type="number" value={edit.duration_weeks ?? ""} onChange={(e) => setEdit({ ...edit, duration_weeks: e.target.value ? Number(e.target.value) : null })} /></label>
          <label> Sat <input value={edit.session_time || ""} onChange={(e) => setEdit({ ...edit, session_time: e.target.value })} placeholder="18:00" /></label>
          <div>Dani: {DANI.map(([n, lbl]) => (
            <label key={n}><input type="checkbox" checked={(edit.days || []).includes(n)}
              onChange={(e) => setEdit({ ...edit, days: e.target.checked ? [...(edit.days || []), n] : (edit.days || []).filter((d) => d !== n) })} />{lbl}</label>
          ))}</div>
          <label> Min <input type="number" value={edit.min_seats ?? 3} onChange={(e) => setEdit({ ...edit, min_seats: Number(e.target.value) })} /></label>
          <label> Max <input type="number" value={edit.max_seats ?? 6} onChange={(e) => setEdit({ ...edit, max_seats: Number(e.target.value) })} /></label>
          <label> Cena <input type="number" value={edit.price ?? ""} onChange={(e) => setEdit({ ...edit, price: e.target.value ? Number(e.target.value) : null })} /></label>
          <div style={{ marginTop: 12 }}>
            <button onClick={save}>Sačuvaj</button> <button onClick={() => setEdit(null)}>Otkaži</button>
          </div>

          {edit.id && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #eee" }}>
              <h3>Polaznici (dodavanje daje pristup sadržaju)</h3>
              <input value={enrollEmail} onChange={(e) => setEnrollEmail(e.target.value)} placeholder="mejl polaznika" />
              <button onClick={() => addMember(edit.id!)}>Dodaj</button>
              <ul>{members.map((m) => <li key={m.user_id}>{m.email} {m.full_name ? `(${m.full_name})` : ""}</li>)}</ul>
              <small>Postojeći broj upisanih: {groups.find((g) => g.id === edit.id)?.enrolled ?? 0}</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
