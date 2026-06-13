# Obaveze prema profesorkama — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Voditi pun saldo prema svakoj profesorki (zarađeno − isplaćeno), uz self-service prijavu dodatnih aktivnosti sa odobravanjem, beleženje isplata sa mejlom, i admin promenu izvođača časa za zamene.

**Architecture:** Saldo se računa uživo iz postojećih izvora (`individual_lessons`, `group_sessions`) + dve nove tabele (`professor_payments`, `professor_activities`). Čista logika u `src/lib/honorar.ts` (testirana), I/O u novom `src/lib/professor-payable.ts`. UI: proširenje `/profesor/honorar` (saldo + prijava aktivnosti) i nova admin stranica `/admin/obaveze` (pregled, inbox, isplata, zamena). Zamena = promena `professor_id` na postojećoj sesiji (bez nove tabele, bez duplog časa).

**Tech Stack:** Next.js App Router (server + client komponente), Supabase (PostgREST + service-role admin klijent), Resend (mejl), Vitest (unit testovi za čistu logiku), Tailwind.

**Reference spec:** `docs/superpowers/specs/2026-06-13-obaveze-prema-profesorkama-design.md`

---

## File Structure

- Create: `supabase/migrations/053_professor_payables.sql` — DDL za dve nove tabele.
- Modify: `src/lib/honorar.ts` — dodaj čistu funkciju `computeBalance` + `sumActivities`.
- Modify: `src/lib/honorar.test.ts` — testovi za nove funkcije.
- Create: `src/lib/professor-payable.ts` — I/O sloj: učitaj zarađeno+isplaćeno+saldo po profesorki.
- Modify: `src/lib/email.ts` — `sendPaymentEmail`.
- Create: `src/app/api/profesor/aktivnost/route.ts` — profesorka prijavi aktivnost (POST).
- Create: `src/app/api/admin/aktivnosti/[id]/route.ts` — admin odobri/odbij (PATCH).
- Create: `src/app/api/admin/profesori/[id]/isplata/route.ts` — zabeleži isplatu + mejl (POST).
- Create: `src/app/api/admin/zamena/route.ts` — promeni izvođača sesije (POST).
- Create: `src/app/profesor/honorar/AktivnostForm.tsx` — klijent forma za prijavu aktivnosti + lista.
- Modify: `src/app/profesor/honorar/page.tsx` — prikaži saldo + ugradi `AktivnostForm`.
- Create: `src/app/admin/obaveze/page.tsx` — server: učitaj payable za sve profesorke + aktivnosti na čekanju.
- Create: `src/app/admin/obaveze/ObavezeClient.tsx` — klijent: tabela saldo, inbox aktivnosti, isplata, zamena.
- Modify: `src/app/admin/finansije/FinansijeClient.tsx` — link ka `/admin/obaveze`.

---

## Task 1: DB migracija — nove tabele

**Files:**
- Create: `supabase/migrations/053_professor_payables.sql`

- [ ] **Step 1: Napiši migraciju**

```sql
-- 053_professor_payables.sql
-- Obaveze prema profesorkama: isplate + dodatne aktivnosti (sa odobravanjem).

create table if not exists professor_payments (
  id            uuid primary key default gen_random_uuid(),
  professor_id  uuid not null references user_profiles(id) on delete cascade,
  payment_date  date not null,
  amount        integer not null check (amount > 0),   -- bruto din
  note          text,
  created_by    uuid references user_profiles(id),
  created_at    timestamptz not null default now()
);
create index if not exists idx_prof_payments_prof on professor_payments(professor_id);

create table if not exists professor_activities (
  id            uuid primary key default gen_random_uuid(),
  professor_id  uuid not null references user_profiles(id) on delete cascade,
  description   text not null,
  amount        integer not null check (amount > 0),   -- bruto din
  activity_date date not null,
  status        text not null default 'na_cekanju'
                  check (status in ('na_cekanju','odobreno','odbijeno')),
  reject_reason text,
  submitted_by  uuid references user_profiles(id),
  approved_by   uuid references user_profiles(id),
  decided_at    timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_prof_activities_prof on professor_activities(professor_id);
create index if not exists idx_prof_activities_status on professor_activities(status);
```

- [ ] **Step 2: Primeni migraciju na Supabase**

Primeni SQL preko Supabase SQL Editor-a (ili Management API sa `sbp_` tokenom — vidi memoriju `reference_supabase_ddl`). Service-role se NE koristi za DDL.

- [ ] **Step 3: Verifikuj tabele**

U SQL Editor-u: `select * from professor_payments limit 1;` i `select * from professor_activities limit 1;` — očekuj prazan rezultat bez greške.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/053_professor_payables.sql
git commit -m "feat(obaveze): migracija za professor_payments i professor_activities"
```

---

## Task 2: Čista logika — computeBalance + sumActivities (TDD)

**Files:**
- Modify: `src/lib/honorar.ts`
- Test: `src/lib/honorar.test.ts`

- [ ] **Step 1: Napiši test koji pada**

Dodaj na kraj `src/lib/honorar.test.ts`:

```typescript
import { computeBalance, sumActivities } from "./honorar";

describe("sumActivities", () => {
  it("sabira samo odobrene aktivnosti", () => {
    const rows = [
      { amount: 3000, status: "odobreno" as const },
      { amount: 1500, status: "na_cekanju" as const },
      { amount: 2000, status: "odbijeno" as const },
      { amount: 500, status: "odobreno" as const },
    ];
    expect(sumActivities(rows)).toBe(3500);
  });
  it("prazno → 0", () => {
    expect(sumActivities([])).toBe(0);
  });
});

describe("computeBalance", () => {
  it("zarađeno (časovi + aktivnosti) − isplaćeno", () => {
    expect(computeBalance(18800, 3500, 20000)).toEqual({
      earnedLessons: 18800, earnedActivities: 3500, earned: 22300, paid: 20000, balance: 2300,
    });
  });
  it("preplata daje negativan saldo", () => {
    expect(computeBalance(5000, 0, 8000).balance).toBe(-3000);
  });
  it("sve nule", () => {
    expect(computeBalance(0, 0, 0)).toEqual({
      earnedLessons: 0, earnedActivities: 0, earned: 0, paid: 0, balance: 0,
    });
  });
});
```

- [ ] **Step 2: Pokreni test — mora da padne**

Run: `npx vitest run src/lib/honorar.test.ts`
Expected: FAIL — `computeBalance`/`sumActivities` nisu definisani.

- [ ] **Step 3: Implementiraj u `src/lib/honorar.ts`**

Dodaj na kraj fajla:

```typescript
/** Zbir samo odobrenih dodatnih aktivnosti. */
export function sumActivities(rows: { amount: number; status: "na_cekanju" | "odobreno" | "odbijeno" }[]): number {
  return rows.reduce((s, r) => (r.status === "odobreno" ? s + (r.amount || 0) : s), 0);
}

export interface BalanceResult {
  earnedLessons: number; earnedActivities: number; earned: number; paid: number; balance: number;
}

/** Saldo profesorke: (zarada od časova + odobrene aktivnosti) − isplaćeno. */
export function computeBalance(earnedLessons: number, earnedActivities: number, paid: number): BalanceResult {
  const earned = earnedLessons + earnedActivities;
  return { earnedLessons, earnedActivities, earned, paid, balance: earned - paid };
}
```

- [ ] **Step 4: Pokreni test — mora da prođe**

Run: `npx vitest run src/lib/honorar.test.ts`
Expected: PASS (svi testovi zeleni).

- [ ] **Step 5: Commit**

```bash
git add src/lib/honorar.ts src/lib/honorar.test.ts
git commit -m "feat(obaveze): computeBalance i sumActivities sa testovima"
```

---

## Task 3: I/O sloj — professor-payable.ts

**Files:**
- Create: `src/lib/professor-payable.ts`

- [ ] **Step 1: Implementiraj loader**

```typescript
// src/lib/professor-payable.ts
// I/O: učitaj zarađeno (časovi + odobrene aktivnosti) i isplaćeno po profesorki, vrati saldo.
import { createAdminClient } from "@/lib/supabase/admin";
import { computeBalance, sumActivities, type BalanceResult } from "@/lib/honorar";

export interface ProfPayable extends BalanceResult {
  professorId: string;
  name: string;
  email: string | null;
}

const DEFAULT_IND = 1400;
const DEFAULT_GRP = 1600;

/**
 * Saldo za jednu profesorku (ako je profId zadat) ili sve profesorke sa honorar konfiguracijom.
 * Časovi se broje SVI održani do danas (sve vreme), po rati profesorke.
 */
export async function loadPayables(profId?: string): Promise<ProfPayable[]> {
  const admin = createAdminClient();
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(new Date());

  let q = admin.from("user_profiles").select("id, full_name, email, honorar_ind, honorar_grp").not("honorar_ind", "is", null);
  if (profId) q = q.eq("id", profId);
  const { data: profs } = await q;

  const result: ProfPayable[] = [];
  for (const p of profs ?? []) {
    const rateInd = p.honorar_ind ?? DEFAULT_IND;
    const rateGrp = p.honorar_grp ?? DEFAULT_GRP;
    const [{ count: indCount }, { count: grpCount }, { data: acts }, { data: pays }] = await Promise.all([
      admin.from("individual_lessons").select("*", { count: "exact", head: true })
        .eq("professor_id", p.id).lte("lesson_date", today),
      admin.from("group_sessions").select("*", { count: "exact", head: true })
        .eq("professor_id", p.id).eq("cancelled", false).lte("session_date", today),
      admin.from("professor_activities").select("amount, status").eq("professor_id", p.id),
      admin.from("professor_payments").select("amount").eq("professor_id", p.id),
    ]);
    const earnedLessons = (indCount ?? 0) * rateInd + (grpCount ?? 0) * rateGrp;
    const earnedActivities = sumActivities((acts ?? []) as { amount: number; status: "na_cekanju" | "odobreno" | "odbijeno" }[]);
    const paid = (pays ?? []).reduce((s, r) => s + (r.amount || 0), 0);
    const bal = computeBalance(earnedLessons, earnedActivities, paid);
    result.push({ professorId: p.id, name: p.full_name || p.email || "-", email: p.email, ...bal });
  }
  return result;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: bez grešaka u `src/lib/professor-payable.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/professor-payable.ts
git commit -m "feat(obaveze): professor-payable I/O loader za saldo"
```

---

## Task 4: Mejl isplate — sendPaymentEmail

**Files:**
- Modify: `src/lib/email.ts`

- [ ] **Step 1: Dodaj funkciju (posle `sendHonorarSummaryEmail`)**

Prati postojeći obrazac (`FROM`, `esc`, `getResend`, try/catch):

```typescript
export async function sendPaymentEmail(
  profEmail: string,
  profIme: string,
  opts: { amount: number; date: string; balance: number; note?: string | null },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = profIme ? profIme.split(" ")[0] : "";
    const fmt = (n: number) => n.toLocaleString("de-DE");
    const saldoLine = opts.balance > 0
      ? `Preostali saldo (još ti dugujemo): <strong>${fmt(opts.balance)} din</strong>.`
      : opts.balance < 0
        ? `Stanje: <strong>${fmt(-opts.balance)} din</strong> preplate.`
        : `Saldo je izmiren — <strong>0 din</strong>.`;
    await resend.emails.send({
      from: FROM,
      to: profEmail,
      replyTo: "info@hartweger.rs",
      subject: `Isplata honorara — ${fmt(opts.amount)} din`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p>Isplaćeno ti je <strong>${fmt(opts.amount)} din</strong> (datum: ${esc(opts.date)}).${opts.note ? " Napomena: " + esc(opts.note) + "." : ""}</p>
<p>${saldoLine}</p>
<p style="font-size:13px;color:#666">Ako nešto ne štima, javi nam na info@hartweger.rs.</p>
<p style="margin-top:20px">Hartweger tim</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendPaymentEmail pao:", e);
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat(obaveze): sendPaymentEmail mejl o isplati"
```

---

## Task 5: API — profesorka prijavi aktivnost

**Files:**
- Create: `src/app/api/profesor/aktivnost/route.ts`

- [ ] **Step 1: Implementiraj rutu**

Prati obrazac iz `src/app/api/profesor/grupna-sesija/route.ts` (`requireStaff`):

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const admin = createAdminClient();
  const { data: me } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "professor" && me?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const description = String(body.description ?? "").trim();
  const amount = Math.round(Number(body.amount));
  const activityDate = String(body.activityDate ?? "").trim();
  if (!description) return NextResponse.json({ error: "Opis je obavezan" }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Iznos mora biti veći od 0" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(activityDate)) return NextResponse.json({ error: "Datum nije validan" }, { status: 400 });

  const { error } = await admin.from("professor_activities").insert({
    professor_id: user.id,
    description, amount, activity_date: activityDate,
    status: "na_cekanju", submitted_by: user.id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/profesor/aktivnost/route.ts
git commit -m "feat(obaveze): API prijava dodatne aktivnosti (profesor)"
```

---

## Task 6: API — admin odobri/odbij aktivnost

**Files:**
- Create: `src/app/api/admin/aktivnosti/[id]/route.ts`

- [ ] **Step 1: Implementiraj rutu**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user.id : null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await verifyAdmin();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const { action, reason } = await request.json();
  if (action !== "odobri" && action !== "odbij") {
    return NextResponse.json({ error: "action mora biti 'odobri' ili 'odbij'" }, { status: 400 });
  }
  const admin = createAdminClient();

  // Samo iz statusa 'na_cekanju' (idempotentno: ne diraj već odlučeno).
  const { data: row } = await admin.from("professor_activities").select("status").eq("id", id).single();
  if (!row) return NextResponse.json({ error: "Aktivnost nije pronađena" }, { status: 404 });
  if (row.status !== "na_cekanju") return NextResponse.json({ error: "Već je odlučeno" }, { status: 409 });

  const { error } = await admin.from("professor_activities").update({
    status: action === "odobri" ? "odobreno" : "odbijeno",
    reject_reason: action === "odbij" ? (String(reason ?? "").trim() || null) : null,
    approved_by: adminId,
    decided_at: new Date().toISOString(),
  }).eq("id", id).eq("status", "na_cekanju");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/aktivnosti/[id]/route.ts
git commit -m "feat(obaveze): API odobravanje/odbijanje aktivnosti (admin)"
```

---

## Task 7: API — zabeleži isplatu + mejl

**Files:**
- Create: `src/app/api/admin/profesori/[id]/isplata/route.ts`

- [ ] **Step 1: Implementiraj rutu**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadPayables } from "@/lib/professor-payable";
import { sendPaymentEmail } from "@/lib/email";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user.id : null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await verifyAdmin();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id: professorId } = await params;
  const body = await request.json();
  const amount = Math.round(Number(body.amount));
  const paymentDate = String(body.paymentDate ?? "").trim();
  const note = String(body.note ?? "").trim() || null;
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Iznos mora biti veći od 0" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) return NextResponse.json({ error: "Datum nije validan" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("professor_payments").insert({
    professor_id: professorId, payment_date: paymentDate, amount, note, created_by: adminId,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Saldo posle isplate + mejl profesorki (mejl pada tiho ako Resend nije konfigurisan).
  const [pay] = await loadPayables(professorId);
  if (pay?.email) {
    await sendPaymentEmail(pay.email, pay.name, { amount, date: paymentDate, balance: pay.balance, note });
  }
  return NextResponse.json({ ok: true, balance: pay?.balance ?? null });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/profesori/[id]/isplata/route.ts
git commit -m "feat(obaveze): API beleženje isplate + mejl profesorki"
```

---

## Task 8: API — zamena (promeni izvođača sesije)

**Files:**
- Create: `src/app/api/admin/zamena/route.ts`

Promena `professor_id` na grupnoj sesiji za dati `groupId` + `sessionDate`. Ako sesija ne postoji, kreira je pod novom profesorkom (`source: "manual"`). Rezultat: jedan red, novi vlasnik — bez duplog časa.

- [ ] **Step 1: Implementiraj rutu**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user.id : null;
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { groupId, sessionDate, newProfessorId } = await request.json();
  if (!groupId || !newProfessorId || !/^\d{4}-\d{2}-\d{2}$/.test(String(sessionDate ?? ""))) {
    return NextResponse.json({ error: "groupId, sessionDate i newProfessorId su obavezni" }, { status: 400 });
  }
  const admin = createAdminClient();

  // Validacija: cilj je profesor/admin.
  const { data: target } = await admin.from("user_profiles").select("role").eq("id", newProfessorId).single();
  if (target?.role !== "professor" && target?.role !== "admin") {
    return NextResponse.json({ error: "Cilj nije profesor" }, { status: 400 });
  }

  // Postojeća sesija za (grupa, datum)?
  const { data: existing } = await admin.from("group_sessions")
    .select("id").eq("group_id", groupId).eq("session_date", sessionDate).maybeSingle();

  if (existing) {
    const { error } = await admin.from("group_sessions")
      .update({ professor_id: newProfessorId, cancelled: false }).eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, mode: "reassigned" });
  }

  const { error } = await admin.from("group_sessions").insert({
    group_id: groupId, professor_id: newProfessorId, session_date: sessionDate, source: "manual",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, mode: "created" });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/zamena/route.ts
git commit -m "feat(obaveze): API zamena - promeni izvođača grupne sesije"
```

---

## Task 9: UI profesorka — saldo + prijava aktivnosti

**Files:**
- Create: `src/app/profesor/honorar/AktivnostForm.tsx`
- Modify: `src/app/profesor/honorar/page.tsx`

- [ ] **Step 1: Napravi klijent komponentu**

`src/app/profesor/honorar/AktivnostForm.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Activity = { id: string; description: string; amount: number; activity_date: string; status: string; reject_reason: string | null };
const fmt = (n: number) => n.toLocaleString("de-DE");
const STATUS_LABEL: Record<string, string> = { na_cekanju: "Na čekanju", odobreno: "Odobreno", odbijeno: "Odbijeno" };

export default function AktivnostForm({ activities }: { activities: Activity[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [activityDate, setActivityDate] = useState(new Intl.DateTimeFormat("sv-SE").format(new Date()));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch("/api/profesor/aktivnost", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, amount: Number(amount), activityDate }),
    });
    setBusy(false);
    if (!res.ok) { setErr((await res.json()).error || "Greška"); return; }
    setDescription(""); setAmount(""); setOpen(false);
    router.refresh();
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Dodatne aktivnosti</h3>
        <button onClick={() => setOpen((v) => !v)} className="text-sm px-3 py-1.5 rounded-lg bg-plava-light text-plava font-medium">
          {open ? "Otkaži" : "Prijavi aktivnost"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="bg-white rounded-xl shadow-sm p-4 mb-4 space-y-3">
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opis (npr. ispravljeni testovi)"
            className="w-full border rounded-lg px-3 py-2 text-sm" required />
          <div className="flex gap-3">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="1" placeholder="Iznos (din)"
              className="flex-1 border rounded-lg px-3 py-2 text-sm" required />
            <input value={activityDate} onChange={(e) => setActivityDate(e.target.value)} type="date"
              className="flex-1 border rounded-lg px-3 py-2 text-sm" required />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button disabled={busy} className="px-4 py-2 rounded-lg bg-plava text-white text-sm font-medium disabled:opacity-50">
            {busy ? "Šaljem…" : "Pošalji na odobravanje"}
          </button>
        </form>
      )}

      {activities.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {activities.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">{a.description}<span className="text-gray-400"> · {a.activity_date}</span></td>
                  <td className="px-4 py-3 text-right">{fmt(a.amount)} din</td>
                  <td className="px-4 py-3 text-right">
                    <span className={a.status === "odobreno" ? "text-green-600" : a.status === "odbijeno" ? "text-red-500" : "text-gray-500"}>
                      {STATUS_LABEL[a.status]}
                    </span>
                    {a.status === "odbijeno" && a.reject_reason && <div className="text-xs text-gray-400">{a.reject_reason}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Ugradi u `page.tsx` (profesorka grana)**

U `src/app/profesor/honorar/page.tsx`, u bloku `if (!isAdmin || prof)` (profesorka pregled), učitaj saldo + aktivnosti i prikaži ih ispod tabele. Dodaj importe na vrhu:

```tsx
import AktivnostForm from "./AktivnostForm";
import { loadPayables } from "@/lib/professor-payable";
```

Unutar profesorka grane, posle postojećih `il`/`gs` upita i pre `return`, dodaj:

```tsx
    const [payable] = await loadPayables(ctx.profId);
    const { data: acts } = await admin.from("professor_activities")
      .select("id, description, amount, activity_date, status, reject_reason")
      .eq("professor_id", ctx.profId).order("created_at", { ascending: false });
```

Zatim, unutar `return (...)`, odmah posle tabele a pre poslednjeg `<p>`, ubaci saldo blok i formu:

```tsx
        {payable && (
          <div className="bg-white rounded-xl shadow-sm p-4 mt-4 grid grid-cols-3 gap-3 text-center">
            <div><div className="text-xs text-gray-400 uppercase">Zarađeno</div><div className="font-bold text-gray-900">{fmt(payable.earned)} din</div></div>
            <div><div className="text-xs text-gray-400 uppercase">Isplaćeno</div><div className="font-bold text-gray-900">{fmt(payable.paid)} din</div></div>
            <div><div className="text-xs text-gray-400 uppercase">Saldo</div><div className="font-bold text-plava">{fmt(payable.balance)} din</div></div>
          </div>
        )}
        <AktivnostForm activities={acts ?? []} />
```

(Napomena: saldo je „sve vreme", a tabela iznad je po mesecima izabrane godine — to je u redu; saldo je zbirno stanje.)

- [ ] **Step 3: Type-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: build prolazi bez grešaka.

- [ ] **Step 4: Commit**

```bash
git add src/app/profesor/honorar/AktivnostForm.tsx src/app/profesor/honorar/page.tsx
git commit -m "feat(obaveze): profesorka vidi saldo i prijavljuje aktivnosti"
```

---

## Task 10: UI admin — stranica Obaveze (saldo, inbox, isplata, zamena)

**Files:**
- Create: `src/app/admin/obaveze/page.tsx`
- Create: `src/app/admin/obaveze/ObavezeClient.tsx`

- [ ] **Step 1: Server stranica `page.tsx`**

```tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { loadPayables } from "@/lib/professor-payable";
import ObavezeClient from "./ObavezeClient";

export const dynamic = "force-dynamic";

export default async function AdminObavezePage() {
  const admin = createAdminClient();
  const payables = await loadPayables();

  const { data: pending } = await admin.from("professor_activities")
    .select("id, professor_id, description, amount, activity_date, created_at")
    .eq("status", "na_cekanju").order("created_at", { ascending: true });

  const { data: groups } = await admin.from("groups")
    .select("id, level, professor_id").in("status", ["otvoren", "u_toku"]);

  const { data: profs } = await admin.from("user_profiles")
    .select("id, full_name").eq("role", "professor").order("full_name");

  const profName: Record<string, string> = Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name ?? "-"]));

  return (
    <ObavezeClient
      payables={payables}
      pending={(pending ?? []).map((a) => ({ ...a, profName: profName[a.professor_id] ?? "-" }))}
      groups={(groups ?? []).map((g) => ({ id: g.id, label: `${g.level} (${profName[g.professor_id] ?? "?"})` }))}
      profs={(profs ?? []).map((p) => ({ id: p.id, name: p.full_name ?? "-" }))}
    />
  );
}
```

- [ ] **Step 2: Klijent `ObavezeClient.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Payable = { professorId: string; name: string; earned: number; paid: number; balance: number };
type Pending = { id: string; profName: string; description: string; amount: number; activity_date: string };
type Group = { id: string; label: string };
type Prof = { id: string; name: string };
const fmt = (n: number) => n.toLocaleString("de-DE");
const today = () => new Intl.DateTimeFormat("sv-SE").format(new Date());

export default function ObavezeClient({ payables, pending, groups, profs }: { payables: Payable[]; pending: Pending[]; groups: Group[]; profs: Prof[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [payDate, setPayDate] = useState(today());
  const [note, setNote] = useState("");

  async function decide(id: string, action: "odobri" | "odbij") {
    const reason = action === "odbij" ? (prompt("Razlog odbijanja (opciono):") ?? "") : "";
    setBusy(id);
    await fetch(`/api/admin/aktivnosti/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    setBusy(null); router.refresh();
  }

  async function pay(professorId: string) {
    setBusy(professorId);
    const res = await fetch(`/api/admin/profesori/${professorId}/isplata`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount), paymentDate: payDate, note }),
    });
    setBusy(null);
    if (!res.ok) { alert((await res.json()).error || "Greška"); return; }
    setPayFor(null); setAmount(""); setNote(""); router.refresh();
  }

  // Zamena
  const [zGroup, setZGroup] = useState("");
  const [zDate, setZDate] = useState(today());
  const [zProf, setZProf] = useState("");
  async function zamena(e: React.FormEvent) {
    e.preventDefault();
    setBusy("zamena");
    const res = await fetch("/api/admin/zamena", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: zGroup, sessionDate: zDate, newProfessorId: zProf }),
    });
    setBusy(null);
    if (!res.ok) { alert((await res.json()).error || "Greška"); return; }
    alert("Izvođač promenjen."); router.refresh();
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Obaveze prema profesorkama</h1>

      {/* Saldo po profesorki */}
      <section className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr><th className="text-left px-4 py-3">Profesorka</th><th className="text-right px-4 py-3">Zarađeno</th><th className="text-right px-4 py-3">Isplaćeno</th><th className="text-right px-4 py-3">Saldo</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {payables.map((p) => (
              <tr key={p.professorId}>
                <td className="px-4 py-3 text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-right">{fmt(p.earned)}</td>
                <td className="px-4 py-3 text-right">{fmt(p.paid)}</td>
                <td className="px-4 py-3 text-right font-bold text-plava">{fmt(p.balance)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setPayFor(payFor === p.professorId ? null : p.professorId); setAmount(String(Math.max(0, p.balance))); }}
                    className="text-sm px-3 py-1.5 rounded-lg bg-plava-light text-plava font-medium">Zabeleži isplatu</button>
                  {payFor === p.professorId && (
                    <div className="mt-2 flex flex-wrap gap-2 justify-end">
                      <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="1" placeholder="Iznos" className="w-28 border rounded-lg px-2 py-1" />
                      <input value={payDate} onChange={(e) => setPayDate(e.target.value)} type="date" className="border rounded-lg px-2 py-1" />
                      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Napomena" className="w-32 border rounded-lg px-2 py-1" />
                      <button disabled={busy === p.professorId} onClick={() => pay(p.professorId)} className="px-3 py-1 rounded-lg bg-plava text-white disabled:opacity-50">Snimi</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Inbox aktivnosti */}
      <section>
        <h2 className="font-medium text-gray-900 mb-3">Aktivnosti na čekanju ({pending.length})</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {pending.length === 0 ? <p className="px-4 py-4 text-gray-400 text-sm">Nema stavki na čekanju.</p> : (
            <table className="w-full text-sm"><tbody className="divide-y divide-gray-50">
              {pending.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 text-gray-900">{a.profName}</td>
                  <td className="px-4 py-3">{a.description}<span className="text-gray-400"> · {a.activity_date}</span></td>
                  <td className="px-4 py-3 text-right">{fmt(a.amount)} din</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button disabled={busy === a.id} onClick={() => decide(a.id, "odobri")} className="px-3 py-1 rounded-lg bg-green-600 text-white disabled:opacity-50">Odobri</button>
                    <button disabled={busy === a.id} onClick={() => decide(a.id, "odbij")} className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50">Odbij</button>
                  </td>
                </tr>
              ))}
            </tbody></table>
          )}
        </div>
      </section>

      {/* Zamena */}
      <section>
        <h2 className="font-medium text-gray-900 mb-3">Zamena — promeni ko je držao čas</h2>
        <form onSubmit={zamena} className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-end">
          <label className="text-sm">Grupa<br /><select value={zGroup} onChange={(e) => setZGroup(e.target.value)} required className="border rounded-lg px-2 py-1 mt-1"><option value="">—</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select></label>
          <label className="text-sm">Datum<br /><input value={zDate} onChange={(e) => setZDate(e.target.value)} type="date" required className="border rounded-lg px-2 py-1 mt-1" /></label>
          <label className="text-sm">Ko je odradio<br /><select value={zProf} onChange={(e) => setZProf(e.target.value)} required className="border rounded-lg px-2 py-1 mt-1"><option value="">—</option>{profs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <button disabled={busy === "zamena"} className="px-4 py-2 rounded-lg bg-plava text-white text-sm font-medium disabled:opacity-50">Primeni</button>
        </form>
        <p className="text-xs text-gray-400 mt-2">Premešta tu jednu sesiju na izabranu profesorku (ne duplira čas). Ako sesija za taj datum ne postoji, kreira je.</p>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Type-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: build prolazi bez grešaka.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/obaveze/page.tsx src/app/admin/obaveze/ObavezeClient.tsx
git commit -m "feat(obaveze): admin stranica Obaveze (saldo, inbox, isplata, zamena)"
```

---

## Task 11: Link ka Obavezama iz Finansija

**Files:**
- Modify: `src/app/admin/finansije/FinansijeClient.tsx`

- [ ] **Step 1: Dodaj link na vrhu FinansijeClient-a**

Pronađi glavni naslov/zaglavlje u `FinansijeClient.tsx` (npr. `<h1>`) i odmah pored njega dodaj:

```tsx
<a href="/admin/obaveze" className="text-sm px-3 py-1.5 rounded-lg bg-plava-light text-plava font-medium">Obaveze prema profesorkama →</a>
```

(Ako postoji red sa dugmadima/filterima, ubaci link u taj red da se uklopi.)

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: prolazi.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/finansije/FinansijeClient.tsx
git commit -m "feat(obaveze): link iz Finansija ka stranici Obaveze"
```

---

## Task 12: Mejl honorara — dodaj saldo na dno (opciono poboljšanje)

**Files:**
- Modify: `src/lib/email.ts` (`sendHonorarProfEmail`)
- Modify: `src/app/api/cron/honorari/route.ts`

- [ ] **Step 1: Proširi `sendHonorarProfEmail` opcionim saldom**

Dodaj `balance?: number` u `opts` i, ako je prosleđen, renderuj red ispod „Ukupno":

```tsx
${typeof opts.balance === "number" ? `<p style="font-size:13px;color:#666">Trenutni saldo (zarađeno − isplaćeno): <strong>${fmt(opts.balance)} din</strong>.</p>` : ""}
```

- [ ] **Step 2: Prosledi saldo iz crona**

U `src/app/api/cron/honorari/route.ts`, pre slanja mejla profesorki, dodaj:

```typescript
import { loadPayables } from "@/lib/professor-payable";
// ... unutar petlje, pre sendHonorarProfEmail:
const [pay] = await loadPayables(p.id);
```

i u poziv `sendHonorarProfEmail(...)` dodaj `balance: pay?.balance` u `opts`.

- [ ] **Step 3: Type-check + test crona ručno**

Run: `npx tsc --noEmit`
Ručno (posle deploya): pozovi cron sa `?month=YYYY-MM` i `Bearer CRON_SECRET`, proveri da mejl sadrži saldo.

- [ ] **Step 4: Commit**

```bash
git add src/lib/email.ts src/app/api/cron/honorari/route.ts
git commit -m "feat(obaveze): saldo na dnu mesečnog honorar mejla"
```

---

## Završna verifikacija (posle deploya)

Po pravilu „deploy → smoke test" (PostToolUse hook gađa `/lekcija/[id]`; ovde ručno proveri i nove rute):

- [ ] Profesorka prijavi aktivnost → pojavi se „na čekanju" kod nje i u admin inbox-u.
- [ ] Admin odobri → uđe u „Zarađeno" i saldo, nestane iz inbox-a; odbij → status „odbijeno" + razlog.
- [ ] Admin zabeleži isplatu → saldo se umanji, profesorki stigne mejl sa preostalim saldom.
- [ ] Zamena: izaberi grupu+datum+drugu profesorku → original izgubi sesiju, zamena dobije (po svojoj rati), broj sesija nepromenjen (nema duplog časa).
- [ ] `npx vitest run src/lib/honorar.test.ts` zeleno.
