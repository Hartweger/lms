# Raspored/grupe u Supabase (temelj Bloka D) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preseliti grupe (raspored) iz Google Sheet-a u Supabase: tabele + admin CRUD + ručni upis polaznika sa dodelom pristupa + automatsko zatvaranje završenih grupa + prikaz na sajtu iz baze.

**Architecture:** Dve Supabase tabele (`groups`, `group_enrollments`) sa RLS. Admin `/admin/grupe` (klijent) preko API ruta (`/api/admin/grupe/*`) koje rade pod service-role-om (auth-gejt: prijavljen + role=admin). Upis polaznika koristi istu „nađi-ili-kreiraj + grant pristupa" logiku kao `scripts/migrate-ld-access.ts`. Javni prikaz: `fetchRaspored()` reimplementiran da čita iz baze (isti `GrupaRaspored` oblik). Vercel cron dnevno zatvara grupe kojima je prošao kraj.

**Tech Stack:** Next.js (App Router) + Supabase (service-role `createAdminClient`, server `createClient`), TypeScript, vitest, Vercel cron (`vercel.json`).

**Spec:** `docs/superpowers/specs/2026-06-06-raspored-grupe-supabase-design.md`

---

## File Structure

- `supabase/migrations/035_groups.sql` — **Create.** `groups` + `group_enrollments` + RLS + indeksi.
- `src/lib/groups.ts` — **Create.** Čiste pomoćne funkcije: `formatDays`, `formatPocetak`, `mapGroupToRaspored`, `nextExpiry`. Bez IO.
- `src/lib/groups.test.ts` — **Create.** vitest za čiste funkcije.
- `src/app/api/admin/grupe/route.ts` — **Create.** GET (lista), POST (kreiranje).
- `src/app/api/admin/grupe/[id]/route.ts` — **Create.** PATCH (izmena/status), DELETE (otkazivanje).
- `src/app/api/admin/grupe/[id]/enroll/route.ts` — **Create.** POST (dodaj polaznika po mejlu → nalog + enrollment + grant), DELETE (ukloni → cancelled).
- `src/app/admin/grupe/page.tsx` — **Create.** Admin UI: lista + forma + sekcija polaznika.
- `src/components/AdminSidebar.tsx` — **Modify.** Dodati link „Grupe".
- `src/lib/raspored.ts` — **Modify.** `fetchRaspored()` čita iz Supabase (isti oblik); zadržati `GrupaRaspored`.
- `src/app/api/cron/close-groups/route.ts` — **Create.** Dnevno: `u_toku` + prošao `end_date` → `zavrsena`.
- `vercel.json` — **Modify.** Dodati cron `/api/cron/close-groups`.

Auth-gejt i `createAdminClient` obrazac kopirati iz `src/app/api/admin/studenti/route.ts`. Grant logika iz `scripts/migrate-ld-access.ts`. Cron-auth (`Bearer CRON_SECRET`) iz `src/app/api/cron/inactivity/route.ts`.

---

## Task 1: Migracija 035 — tabele `groups` + `group_enrollments`

**Files:** Create: `supabase/migrations/035_groups.sql`

- [ ] **Step 1: Napiši migraciju**

Create `supabase/migrations/035_groups.sql`:

```sql
-- 035: Grupe (raspored) u Supabase — zamena za Google Sheet "Raspored".
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_course_id UUID REFERENCES public.courses(id),
  purchasable_course_id UUID REFERENCES public.courses(id),
  level TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'grupni',
  professor_id UUID REFERENCES public.user_profiles(id),
  status TEXT NOT NULL DEFAULT 'planiran'
    CHECK (status IN ('planiran','uskoro','otvoren','u_toku','zavrsena','otkazana')),
  start_date DATE,
  end_date DATE,
  duration_weeks INT,
  days SMALLINT[] NOT NULL DEFAULT '{}',
  session_time TEXT,
  min_seats INT NOT NULL DEFAULT 3,
  max_seats INT NOT NULL DEFAULT 6,
  price NUMERIC(10,2),
  calendar_id TEXT,
  notes TEXT,
  notes_link TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_groups_status ON public.groups(status);
CREATE INDEX idx_groups_professor ON public.groups(professor_id);

CREATE TABLE public.group_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);
CREATE INDEX idx_group_enrollments_group ON public.group_enrollments(group_id);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_enrollments ENABLE ROW LEVEL SECURITY;

-- Javno čitanje samo otvorenih/uskoro grupa (za prikaz na sajtu).
CREATE POLICY "Public can read open groups" ON public.groups
  FOR SELECT USING (status IN ('otvoren','uskoro'));
-- Staff (admin/professor) pun pristup grupama.
CREATE POLICY "Staff manage groups" ON public.groups
  FOR ALL USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin','professor')
  );
-- Enrollments: samo staff (service-role ruta ionako zaobilazi RLS).
CREATE POLICY "Staff manage enrollments" ON public.group_enrollments
  FOR ALL USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin','professor')
  );
```

- [ ] **Step 2: Primeni na bazu (ručno)**

Primeniti u Supabase SQL Editoru (vidi `reference_supabase_ddl`). Verifikacija:
```sql
SELECT table_name FROM information_schema.tables WHERE table_name IN ('groups','group_enrollments');
```
Expected: dva reda.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/035_groups.sql
git commit -m "feat(db): groups + group_enrollments tabele (temelj Bloka D)"
```

---

## Task 2: Čiste pomoćne funkcije + testovi

**Files:** Create `src/lib/groups.ts`, `src/lib/groups.test.ts`

- [ ] **Step 1: Napiši padajući test** — `src/lib/groups.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatDays, formatPocetak, mapGroupToRaspored, nextExpiry } from "./groups";

describe("formatDays", () => {
  it("mapira brojeve dana u srpske skraćenice", () => {
    expect(formatDays([1, 3])).toBe("pon, sre");
    expect(formatDays([])).toBe("");
    expect(formatDays(null)).toBe("");
  });
});

describe("formatPocetak", () => {
  it("YYYY-MM-DD → dd.MM.yyyy", () => {
    expect(formatPocetak("2026-06-15")).toBe("15.06.2026");
    expect(formatPocetak(null)).toBe("");
  });
});

describe("nextExpiry (nikad ne skraćuj)", () => {
  it("uzima veći od postojećeg i danas+365", () => {
    const far = Date.now() + 800 * 86400000;
    expect(nextExpiry(far)).toBe(far);                 // postojeći dalji → ostaje
    expect(nextExpiry(null)).toBeGreaterThan(Date.now()); // novi = ~danas+365
  });
});

describe("mapGroupToRaspored", () => {
  it("mapira red grupe u GrupaRaspored oblik", () => {
    const r = mapGroupToRaspored(
      { level: "A1.1", status: "otvoren", start_date: "2026-06-15", duration_weeks: 8, days: [1, 3], session_time: "18:00", max_seats: 6 },
      "Nataša Hartweger", 2,
    );
    expect(r).toMatchObject({
      nivo: "A1.1", prof: "Nataša Hartweger", status: "Otvoren za upis",
      pocetak: "15.06.2026", trajanje: "8", dani: "pon, sre", sat: "18:00",
      maks: "6", upisanih: "2", slobodnih: "4",
    });
  });
});
```

- [ ] **Step 2: Pokreni — mora da padne**

Run: `npx vitest run src/lib/groups.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implementiraj** — `src/lib/groups.ts`:

```ts
import type { GrupaRaspored } from "./raspored";

export const DAY_LABELS: Record<number, string> = {
  1: "pon", 2: "uto", 3: "sre", 4: "čet", 5: "pet", 6: "sub", 7: "ned",
};

export function formatDays(days: number[] | null): string {
  if (!days || !days.length) return "";
  return days.map((d) => DAY_LABELS[d] ?? "").filter(Boolean).join(", ");
}

export function formatPocetak(d: string | null): string {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}

const YEAR_MS = 365 * 86400000;
// Vrati ms roka: max(postojeći, danas+365) — nikad ne skraćuje.
export function nextExpiry(existingMs: number | null): number {
  const base = Date.now() + YEAR_MS;
  return existingMs != null && existingMs > base ? existingMs : base;
}

const STATUS_LABEL: Record<string, string> = {
  otvoren: "Otvoren za upis", uskoro: "Uskoro", u_toku: "U toku",
  zavrsena: "Završena", planiran: "Planiran", otkazana: "Otkazana",
};

export interface GroupRowForDisplay {
  level: string;
  status: string;
  start_date: string | null;
  duration_weeks: number | null;
  days: number[] | null;
  session_time: string | null;
  max_seats: number;
}

export function mapGroupToRaspored(g: GroupRowForDisplay, profName: string, enrolled: number): GrupaRaspored {
  return {
    nivo: g.level,
    prof: profName,
    status: STATUS_LABEL[g.status] ?? g.status,
    pocetak: formatPocetak(g.start_date),
    trajanje: g.duration_weeks != null ? String(g.duration_weeks) : "",
    dani: formatDays(g.days),
    sat: g.session_time ?? "",
    maks: String(g.max_seats),
    upisanih: String(enrolled),
    slobodnih: String(Math.max(0, g.max_seats - enrolled)),
  };
}
```

- [ ] **Step 4: Pokreni — mora da prođe**

Run: `npx vitest run src/lib/groups.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/groups.ts src/lib/groups.test.ts
git commit -m "feat(grupe): ciste pomocne funkcije (formatDays/mapToRaspored/nextExpiry) + testovi"
```

---

## Task 3: Admin API — CRUD grupa

**Files:** Create `src/app/api/admin/grupe/route.ts`, `src/app/api/admin/grupe/[id]/route.ts`

- [ ] **Step 1: Lista + kreiranje** — `src/app/api/admin/grupe/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? admin : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { data: groups } = await admin.from("groups")
    .select("*, professor:professor_id(full_name), content_course:content_course_id(slug,title)")
    .order("start_date", { ascending: false });
  const { data: enr } = await admin.from("group_enrollments").select("group_id").eq("status", "active");
  const counts: Record<string, number> = {};
  (enr || []).forEach((e) => { counts[e.group_id] = (counts[e.group_id] || 0) + 1; });
  const withCounts = (groups || []).map((g) => ({ ...g, enrolled: counts[g.id] || 0 }));
  return NextResponse.json({ groups: withCounts });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await req.json();
  const { data, error } = await admin.from("groups").insert({
    content_course_id: body.content_course_id || null,
    purchasable_course_id: body.purchasable_course_id || null,
    level: body.level,
    type: body.type || "grupni",
    professor_id: body.professor_id || null,
    status: body.status || "planiran",
    start_date: body.start_date || null,
    end_date: body.end_date || null,
    duration_weeks: body.duration_weeks ?? null,
    days: body.days || [],
    session_time: body.session_time || null,
    min_seats: body.min_seats ?? 3,
    max_seats: body.max_seats ?? 6,
    price: body.price ?? null,
    notes: body.notes || null,
    source: "rucni-unos-2026-06",
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id });
}
```

- [ ] **Step 2: Izmena + otkazivanje** — `src/app/api/admin/grupe/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? admin : null;
}

const FIELDS = ["content_course_id","purchasable_course_id","level","type","professor_id","status","start_date","end_date","duration_weeks","days","session_time","min_seats","max_seats","price","notes"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const f of FIELDS) if (f in body) patch[f] = body[f];
  const { error } = await admin.from("groups").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const { error } = await admin.from("groups").update({ status: "otkazana", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Provera** — `npx tsc --noEmit` (bez grešaka u tim fajlovima) i `npx eslint src/app/api/admin/grupe/route.ts src/app/api/admin/grupe/[id]/route.ts` (čisto).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/grupe/route.ts "src/app/api/admin/grupe/[id]/route.ts"
git commit -m "feat(grupe): admin API CRUD grupa"
```

---

## Task 4: Admin API — upis polaznika + dodela pristupa

**Files:** Create `src/app/api/admin/grupe/[id]/enroll/route.ts`

- [ ] **Step 1: Implementiraj** — `src/app/api/admin/grupe/[id]/enroll/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nextExpiry } from "@/lib/groups";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? admin : null;
}

// POST: dodaj polaznika po mejlu → nađi-ili-kreiraj nalog + enrollment + grant pristupa na content kurs.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id: groupId } = await params;
  const email = (((await req.json()).email as string) || "").toLowerCase().trim();
  if (!email.includes("@")) return NextResponse.json({ error: "Neispravan mejl" }, { status: 400 });

  const { data: group } = await admin.from("groups").select("content_course_id").eq("id", groupId).single();
  if (!group) return NextResponse.json({ error: "Grupa ne postoji" }, { status: 404 });

  // find-or-create user (tiho, bez mejla)
  const { data: prof } = await admin.from("user_profiles").select("id, full_name").eq("email", email).maybeSingle();
  let uid = prof?.id as string | undefined;
  if (!uid) {
    const { data: nu, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
    if (error || !nu?.user) return NextResponse.json({ error: error?.message || "createUser pao" }, { status: 400 });
    uid = nu.user.id;
    await admin.from("user_profiles").upsert({ id: uid, email, role: "student" });
  }

  // enrollment (idempotentno)
  await admin.from("group_enrollments").upsert(
    { group_id: groupId, user_id: uid, status: "active" }, { onConflict: "group_id,user_id" },
  );

  // grant pristupa na sadržajni kurs (nikad ne skraćuj)
  if (group.content_course_id) {
    const { data: cur } = await admin.from("course_access")
      .select("expires_at").eq("user_id", uid).eq("course_id", group.content_course_id).maybeSingle();
    const curMs = cur?.expires_at ? new Date(cur.expires_at).getTime() : null;
    const finalExp = new Date(nextExpiry(curMs)).toISOString();
    await admin.from("course_access").upsert(
      { user_id: uid, course_id: group.content_course_id, expires_at: finalExp, source: "grupa-rucni-unos" },
      { onConflict: "user_id,course_id" },
    );
  }
  return NextResponse.json({ ok: true, user_id: uid, full_name: prof?.full_name || null });
}

// DELETE: ukloni polaznika iz grupe (pristup se NE oduzima).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id: groupId } = await params;
  const userId = (await req.json()).user_id as string;
  const { error } = await admin.from("group_enrollments")
    .update({ status: "cancelled" }).eq("group_id", groupId).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Provera** — `npx tsc --noEmit` i `npx eslint "src/app/api/admin/grupe/[id]/enroll/route.ts"` (čisto).

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/admin/grupe/[id]/enroll/route.ts"
git commit -m "feat(grupe): upis polaznika po mejlu + dodela pristupa (nadji-ili-kreiraj, MAX rok)"
```

---

## Task 5: Admin UI `/admin/grupe` + sidebar

**Files:** Create `src/app/admin/grupe/page.tsx`; Modify `src/components/AdminSidebar.tsx`

- [ ] **Step 1: Stranica** — `src/app/admin/grupe/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Helper ruta za kurseve (lista za padajući meni)** — dodati u `src/app/api/admin/grupe/route.ts` NE; umesto toga kreirati `src/app/api/admin/grupe/courses/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { data } = await admin.from("courses").select("id, slug, title").order("slug");
  return NextResponse.json({ courses: data || [] });
}
```

- [ ] **Step 3: Sidebar link** — u `src/components/AdminSidebar.tsx` dodati stavku za „Grupe" pored postojećih (npr. odmah posle „Kursevi"). Naći niz linkova i dodati `{ href: "/admin/grupe", label: "Grupe" }` u istom obliku kao postojeće stavke (proveri tačan oblik u fajlu pre izmene).

- [ ] **Step 4: Provera** — `npx tsc --noEmit` i `npm run build` (ili `npx next build` ako brže) prolazi bez grešaka u novim fajlovima. (Profesori ruta `/api/admin/profesori` već vraća `{ professors: [...] }` — potvrditi polje; ako se zove drugačije, uskladiti `setProfs`.)

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/grupe/page.tsx src/app/api/admin/grupe/courses/route.ts src/components/AdminSidebar.tsx
git commit -m "feat(grupe): admin UI /admin/grupe + sidebar link"
```

---

## ⏸ Operativni checkpoint (Nataša, pre Task 6)

1. Primeniti migraciju 035 (Task 1 Step 2) ako već nije.
2. Deploy (`vercel --prod`) da admin proradi.
3. **Nataša ručno unese trenutno aktivne/otvorene grupe** kroz `/admin/grupe` (+ polaznike gde treba pristup).
4. Tek kad su grupe unete → Task 6 (swap prikaza), da javna stranica ne bude prazna.

---

## Task 6: `fetchRaspored()` čita iz Supabase

**Files:** Modify `src/lib/raspored.ts`

- [ ] **Step 1: Zameni implementaciju** — `src/lib/raspored.ts` (zadržati `GrupaRaspored` interfejs, zameniti `RASPORED_URL` i telo `fetchRaspored`):

```ts
import { createAdminClient } from "@/lib/supabase/admin";
import { mapGroupToRaspored } from "@/lib/groups";

export interface GrupaRaspored {
  nivo: string; prof: string; status: string; pocetak: string; trajanje: string;
  dani: string; sat: string; maks: string; upisanih: string; slobodnih: string;
}

// Server-only: čita grupe iz Supabase (zamena za Google Sheet RasporedAPI).
export async function fetchRaspored(): Promise<GrupaRaspored[]> {
  const admin = createAdminClient();
  const { data: groups } = await admin.from("groups")
    .select("id, level, status, start_date, duration_weeks, days, session_time, max_seats, professor:professor_id(full_name)")
    .in("status", ["otvoren", "uskoro"]);
  if (!groups?.length) return [];

  const ids = groups.map((g) => g.id);
  const { data: enr } = await admin.from("group_enrollments").select("group_id").in("group_id", ids).eq("status", "active");
  const counts: Record<string, number> = {};
  (enr || []).forEach((e) => { counts[e.group_id] = (counts[e.group_id] || 0) + 1; });

  const rows = groups.map((g) => {
    const prof = Array.isArray(g.professor) ? g.professor[0] : g.professor;
    return mapGroupToRaspored(g, prof?.full_name || "", counts[g.id] || 0);
  });
  // Otvoren prvo, pa po nivou (kao stari RasporedAPI)
  rows.sort((a, b) => {
    const ao = a.status.toLowerCase().includes("otvoren") ? 0 : 1;
    const bo = b.status.toLowerCase().includes("otvoren") ? 0 : 1;
    return ao !== bo ? ao - bo : a.nivo.localeCompare(b.nivo);
  });
  return rows;
}
```

- [ ] **Step 2: Provera** — `npx tsc --noEmit` čist. `grep -rn "RASPORED_URL\|script.google" src/lib/raspored.ts` → prazno (uklonjen Apps Script poziv). Potvrditi da `src/app/grupni-kursevi/page.tsx` i `src/app/kursevi/[slug]/page.tsx` su server komponente (nemaju `"use client"`) jer `fetchRaspored` sada koristi service-role.

- [ ] **Step 3: Vizuelni spot-check (posle deploya)** — otvoriti `/grupni-kursevi` i jednu stranicu kursa; potvrditi da se grupe prikazuju isto kao ranije (nivo, profesor, datum, slobodna mesta). Uporediti sa unetim grupama.

- [ ] **Step 4: Commit**

```bash
git add src/lib/raspored.ts
git commit -m "feat(grupe): fetchRaspored cita iz Supabase (gasi RasporedAPI Apps Script)"
```

---

## Task 7: Cron — auto-zatvaranje završenih grupa

**Files:** Create `src/app/api/cron/close-groups/route.ts`; Modify `vercel.json`

- [ ] **Step 1: Cron ruta** — `src/app/api/cron/close-groups/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await admin.from("groups")
    .update({ status: "zavrsena", updated_at: new Date().toISOString() })
    .eq("status", "u_toku").lt("end_date", today).select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ closed: data?.length || 0 });
}
```

- [ ] **Step 2: Registruj cron** — `vercel.json` (dodati u `crons` niz):

```json
{
  "crons": [
    { "path": "/api/cron/inactivity", "schedule": "0 9 * * *" },
    { "path": "/api/cron/close-groups", "schedule": "0 1 * * *" }
  ]
}
```

- [ ] **Step 3: Provera** — `npx tsc --noEmit` čist. JSON validan (`node -e "require('./vercel.json')"`).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/cron/close-groups/route.ts vercel.json
git commit -m "feat(grupe): dnevni cron auto-zatvara zavrsene grupe (u_toku + prosao kraj)"
```

---

## Self-Review

**Spec coverage:**
- `groups` + `group_enrollments` + RLS → Task 1. ✓
- Izveden broj upisanih, slobodna mesta → Task 2 (`mapGroupToRaspored`) + GET ruta count + fetchRaspored. ✓
- Admin CRUD `/admin/grupe` → Task 3 (API) + Task 5 (UI). ✓
- Upis polaznika po mejlu → nalog + grant pristupa (MAX rok, source) → Task 4. ✓
- Status: ručno (admin form/PATCH) + auto-`zavrsena` cron → Task 3 + Task 7. ✓
- `fetchRaspored` iz baze (isti oblik), gasi RasporedAPI → Task 6. ✓
- Cutover redosled (grupe pre swap-a) → Operativni checkpoint pre Task 6. ✓
- `days` strukturisano, `session_time` (ne `time`) → Task 1/2/5. ✓
- Bez importera (ručni unos) → checkpoint korak 3. ✓

**Placeholder scan:** Nema TBD/TODO; kod kompletan. Jedina „proveri oblik" napomena: AdminSidebar stavka (Task 5 Step 3) i polje `professors` iz `/api/admin/profesori` (Task 5 Step 4) — eksplicitno traženo da se potvrdi oblik u postojećem fajlu pre izmene (nije placeholder logike, nego usklađivanje sa postojećim).

**Type consistency:** `GrupaRaspored` definisan u `raspored.ts`, `groups.ts` ga uvozi type-only (bez ciklusa). `nextExpiry(number|null)` isti u Task 2 i Task 4. `mapGroupToRaspored(GroupRowForDisplay, string, number)` isti u Task 2 i Task 6. `requireAdmin()` obrazac isti u Task 3/4. `source` vrednosti: grupa=`rucni-unos-2026-06`, pristup=`grupa-rucni-unos`.

**Otvoreno:** Nema — sve spec stavke pokrivene.
