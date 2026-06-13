# CRM za lidove i komunikaciju — Implementation Plan (v1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Da nijedan upit/lid ne propadne — jedno mesto (`/admin/crm`) koje hvata kontakte sa svih kanala, pamti istoriju komunikacije i gura prodaju kroz panel „Za danas".

**Architecture:** Dve nove Supabase tabele (`crm_contacts`, `crm_interactions`) u istoj bazi kao LMS. Centralni helper `upsertContact`/`logInteraction` radi dedup (po mejlu, pa po IG handle-u). Postojeće rute (`api/kontakt`, `api/naki/sales/lead`, `api/naki/email`, `api/masterclass-reci`) dobijaju upis u CRM; nova ruta `api/crm/ingest` prima ManyChat (IG/WA). Admin UI po HubSpot timeline obrascu. Sve čitanje/pisanje preko service-role (`createAdminClient`); admin auth preko postojećeg `requireAdmin` obrasca.

**Tech Stack:** Next.js App Router, Supabase (Postgres + RLS), `@supabase/supabase-js`, Resend, vitest. Postojeći helperi: `src/lib/supabase/admin.ts`, `src/lib/supabase/server.ts`, `src/lib/rate-limit.ts`, `src/lib/email.ts`.

---

## File Structure

**Create:**
- `supabase/migrations/055_crm.sql` — tabele, indeksi, RLS
- `src/lib/crm/types.ts` — tipovi (stage/source/channel/direction)
- `src/lib/crm/match.ts` — čiste funkcije: `normalizeEmail`, `pickMatch` (dedup logika)
- `src/lib/crm/match.test.ts` — testovi za čiste funkcije
- `src/lib/crm/contacts.ts` — `upsertContact`, `logInteraction` (DB orkestracija)
- `src/app/api/crm/ingest/route.ts` — ManyChat webhook (token-zaštićen)
- `src/app/api/crm/ingest/validate.ts` — čista validacija payload-a
- `src/app/api/crm/ingest/validate.test.ts` — test validacije
- `src/app/api/admin/crm/route.ts` — GET lista + POST ručni unos
- `src/app/api/admin/crm/[id]/route.ts` — PATCH (faza/sledeći korak/beleška) + GET detalji
- `src/app/api/admin/crm/[id]/email/route.ts` — slanje mejla + upis u timeline
- `src/app/admin/crm/page.tsx` — server stranica (Za danas + tabela)
- `src/app/admin/crm/CrmListClient.tsx` — klijent tabela/filteri
- `src/app/admin/crm/[id]/page.tsx` — server stranica (profil)
- `src/app/admin/crm/[id]/CrmDetailClient.tsx` — klijent profil (timeline, akcije)
- `scripts/crm-backfill.mjs` — jednokratni uvoz `naki_profiles` + `masterclass_signups`

**Modify:**
- `src/app/api/kontakt/route.ts` — dodati CRM upis
- `src/app/api/naki/sales/lead/route.ts` — dodati CRM upis
- `src/app/api/naki/email/route.ts` — dodati CRM upis (mejl + razgovor)
- `src/app/api/masterclass-reci/route.ts` — dodati CRM upis
- `src/components/AdminSidebar.tsx` — nav link „CRM"

---

## Task 1: Migracija — tabele, indeksi, RLS

**Files:**
- Create: `supabase/migrations/055_crm.sql`

- [ ] **Step 1: Napiši migraciju**

```sql
-- CRM za lidove i komunikaciju (v1)
-- Dve tabele; postojeće tabele se samo čitaju, ne diraju.

-- ── Kontakti (lid ILI polaznik, isti zapis kroz ceo životni ciklus) ──
create table if not exists public.crm_contacts (
  id                  uuid primary key default gen_random_uuid(),
  email               text,
  name                text,
  phone               text,
  instagram_handle    text,
  user_id             uuid references auth.users on delete set null,
  stage               text not null default 'nov'
                        check (stage in ('nov','kontaktiran','zainteresovan','ponuda','upisan','izgubljen')),
  source              text not null default 'rucno'
                        check (source in ('naki','smile','kontakt-forma','masterclass','manychat','instagram','whatsapp','rucno')),
  level               text,
  tags                text[] not null default '{}',
  note                text,
  owner               text,
  next_action         text,
  next_action_at      timestamptz,
  last_interaction_at timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

-- email jedinstven case-insensitive (samo kad postoji); dozvoli više kontakata bez mejla
create unique index if not exists crm_contacts_email_uidx
  on public.crm_contacts (lower(email)) where email is not null;
create index if not exists crm_contacts_ig_idx     on public.crm_contacts (lower(instagram_handle)) where instagram_handle is not null;
create index if not exists crm_contacts_stage_idx  on public.crm_contacts (stage);
create index if not exists crm_contacts_source_idx on public.crm_contacts (source);
create index if not exists crm_contacts_next_idx   on public.crm_contacts (next_action_at);
create index if not exists crm_contacts_user_idx   on public.crm_contacts (user_id);

-- ── Interakcije (vremenska traka) ──
create table if not exists public.crm_interactions (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid not null references public.crm_contacts on delete cascade,
  channel     text not null
                check (channel in ('mejl','naki','smile','manychat','instagram','whatsapp','beleska','sistem')),
  direction   text not null default 'dolazna'
                check (direction in ('dolazna','odlazna','interna')),
  summary     text,
  body        text,
  occurred_at timestamptz not null default now(),
  meta        jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists crm_interactions_contact_idx
  on public.crm_interactions (contact_id, occurred_at desc);

-- ── RLS: sav pristup preko service-role iz API ruta. Bez anon/authenticated policy. ──
alter table public.crm_contacts     enable row level security;
alter table public.crm_interactions enable row level security;
-- Namerno bez policy-ja: service-role zaobilazi RLS; anon/authenticated nemaju pristup.
```

- [ ] **Step 2: Primeni migraciju**

Primeni preko Supabase SQL Editora ili Management API (vidi memoriju „Supabase DDL — kako primeniti"). Nalepi ceo `055_crm.sql`.

- [ ] **Step 3: Verifikuj da tabele postoje**

U SQL Editoru:
```sql
select table_name from information_schema.tables
where table_schema='public' and table_name in ('crm_contacts','crm_interactions');
```
Expected: 2 reda.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/055_crm.sql
git commit -m "feat(crm): migracija crm_contacts + crm_interactions"
```

---

## Task 2: Tipovi

**Files:**
- Create: `src/lib/crm/types.ts`

- [ ] **Step 1: Napiši tipove**

```typescript
export type CrmStage =
  | "nov" | "kontaktiran" | "zainteresovan" | "ponuda" | "upisan" | "izgubljen";

export type CrmSource =
  | "naki" | "smile" | "kontakt-forma" | "masterclass"
  | "manychat" | "instagram" | "whatsapp" | "rucno";

export type CrmChannel =
  | "mejl" | "naki" | "smile" | "manychat"
  | "instagram" | "whatsapp" | "beleska" | "sistem";

export type CrmDirection = "dolazna" | "odlazna" | "interna";

export const CRM_STAGES: CrmStage[] = [
  "nov", "kontaktiran", "zainteresovan", "ponuda", "upisan", "izgubljen",
];

export interface CrmContact {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  instagram_handle: string | null;
  user_id: string | null;
  stage: CrmStage;
  source: CrmSource;
  level: string | null;
  tags: string[];
  note: string | null;
  owner: string | null;
  next_action: string | null;
  next_action_at: string | null;
  last_interaction_at: string;
  created_at: string;
}

export interface CrmInteraction {
  id: string;
  contact_id: string;
  channel: CrmChannel;
  direction: CrmDirection;
  summary: string | null;
  body: string | null;
  occurred_at: string;
  meta: Record<string, unknown> | null;
  created_at: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/crm/types.ts
git commit -m "feat(crm): tipovi"
```

---

## Task 3: Čiste funkcije za dedup (TDD)

**Files:**
- Create: `src/lib/crm/match.ts`
- Test: `src/lib/crm/match.test.ts`

- [ ] **Step 1: Napiši padajuće testove**

```typescript
import { describe, it, expect } from "vitest";
import { normalizeEmail, pickMatch } from "./match";

describe("normalizeEmail", () => {
  it("trimuje, lowercase-uje", () => {
    expect(normalizeEmail("  Foo@Bar.RS ")).toBe("foo@bar.rs");
  });
  it("vraća null za prazno/nevalidno", () => {
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail("nije-mejl")).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
  });
});

describe("pickMatch", () => {
  const rows = [
    { id: "a", email: "ana@x.rs", instagram_handle: null },
    { id: "b", email: null, instagram_handle: "marko_ig" },
  ];
  it("spaja po mejlu (case-insensitive)", () => {
    expect(pickMatch(rows, { email: "ANA@x.rs", instagram: null })).toBe("a");
  });
  it("spaja po instagram handle-u kad nema mejla", () => {
    expect(pickMatch(rows, { email: null, instagram: "Marko_IG" })).toBe("b");
  });
  it("vraća null kad nema poklapanja", () => {
    expect(pickMatch(rows, { email: "novi@x.rs", instagram: "niko" })).toBeNull();
  });
  it("mejl ima prioritet nad IG-om", () => {
    const r = [{ id: "a", email: "ana@x.rs", instagram_handle: "drugi" }];
    expect(pickMatch(r, { email: "ana@x.rs", instagram: "marko_ig" })).toBe("a");
  });
});
```

- [ ] **Step 2: Pokreni test — mora da padne**

Run: `npx vitest run src/lib/crm/match.test.ts`
Expected: FAIL — „Cannot find module './match'" ili „normalizeEmail is not a function".

- [ ] **Step 3: Implementiraj**

```typescript
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const e = raw.trim().toLowerCase();
  return EMAIL_RE.test(e) ? e : null;
}

function normHandle(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const h = raw.trim().replace(/^@/, "").toLowerCase();
  return h.length ? h : null;
}

interface MatchRow { id: string; email: string | null; instagram_handle: string | null }

export function pickMatch(
  rows: MatchRow[],
  key: { email: string | null; instagram: string | null },
): string | null {
  const email = normalizeEmail(key.email);
  if (email) {
    const byEmail = rows.find((r) => normalizeEmail(r.email) === email);
    if (byEmail) return byEmail.id;
  }
  const ig = normHandle(key.instagram);
  if (ig) {
    const byIg = rows.find((r) => normHandle(r.instagram_handle) === ig);
    if (byIg) return byIg.id;
  }
  return null;
}
```

- [ ] **Step 4: Pokreni test — mora da prođe**

Run: `npx vitest run src/lib/crm/match.test.ts`
Expected: PASS (6 testova).

- [ ] **Step 5: Commit**

```bash
git add src/lib/crm/match.ts src/lib/crm/match.test.ts
git commit -m "feat(crm): dedup helperi normalizeEmail + pickMatch"
```

---

## Task 4: `upsertContact` + `logInteraction` (DB orkestracija)

**Files:**
- Create: `src/lib/crm/contacts.ts`

Napomena: koristi `SupabaseClient` tip iz `@supabase/supabase-js`. Pozivaoci uvek prosleđuju **admin** klijent (`createAdminClient()`), jer RLS blokira anon.

- [ ] **Step 1: Implementiraj helpere**

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail, pickMatch } from "./match";
import type { CrmSource, CrmChannel, CrmDirection } from "./types";

export interface UpsertInput {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  instagram?: string | null;
  source: CrmSource;
  level?: string | null;
  userId?: string | null;
}

/**
 * Pronađe postojeći kontakt (po mejlu, pa po IG handle-u) ili kreira nov.
 * Ažurira last_interaction_at; popunjava prazna polja, ne gazi postojeća.
 * Vraća contact id ili null ako upis ne uspe.
 */
export async function upsertContact(
  admin: SupabaseClient,
  input: UpsertInput,
): Promise<string | null> {
  const email = normalizeEmail(input.email);
  const instagram = input.instagram?.trim().replace(/^@/, "").toLowerCase() || null;

  // Učitaj kandidate (mali skup: po mejlu ili IG-u)
  const filters: string[] = [];
  if (email) filters.push(`email.ilike.${email}`);
  if (instagram) filters.push(`instagram_handle.ilike.${instagram}`);

  let existingId: string | null = null;
  if (filters.length) {
    const { data: rows } = await admin
      .from("crm_contacts")
      .select("id,email,instagram_handle")
      .or(filters.join(","))
      .limit(50);
    existingId = pickMatch(rows ?? [], { email, instagram });
  }

  const now = new Date().toISOString();

  if (existingId) {
    // Popuni samo prazna polja (coalesce), uvek osveži last_interaction_at
    const patch: Record<string, unknown> = { last_interaction_at: now };
    if (input.name) patch.name = input.name;
    if (input.phone) patch.phone = input.phone;
    if (email) patch.email = email;
    if (instagram) patch.instagram_handle = instagram;
    if (input.level) patch.level = input.level;
    if (input.userId) patch.user_id = input.userId;
    // ne diramo postojeća popunjena polja: radimo to kroz uslovni select-update
    const { data: cur } = await admin
      .from("crm_contacts")
      .select("name,phone,level,user_id")
      .eq("id", existingId)
      .single();
    if (cur?.name) delete patch.name;
    if (cur?.phone) delete patch.phone;
    if (cur?.level) delete patch.level;
    if (cur?.user_id) delete patch.user_id;
    await admin.from("crm_contacts").update(patch).eq("id", existingId);
    return existingId;
  }

  const { data, error } = await admin
    .from("crm_contacts")
    .insert({
      email,
      name: input.name || null,
      phone: input.phone || null,
      instagram_handle: instagram,
      user_id: input.userId || null,
      source: input.source,
      level: input.level || null,
      stage: "nov",
      last_interaction_at: now,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[crm] upsertContact insert failed", error);
    return null;
  }
  return data.id;
}

export interface LogInput {
  contactId: string;
  channel: CrmChannel;
  direction?: CrmDirection;
  summary?: string | null;
  body?: string | null;
  meta?: Record<string, unknown> | null;
  occurredAt?: string;
}

export async function logInteraction(
  admin: SupabaseClient,
  input: LogInput,
): Promise<void> {
  const occurred = input.occurredAt || new Date().toISOString();
  const { error } = await admin.from("crm_interactions").insert({
    contact_id: input.contactId,
    channel: input.channel,
    direction: input.direction || "dolazna",
    summary: input.summary || null,
    body: input.body || null,
    meta: input.meta || null,
    occurred_at: occurred,
  });
  if (error) console.error("[crm] logInteraction failed", error);
  else {
    await admin
      .from("crm_contacts")
      .update({ last_interaction_at: occurred })
      .eq("id", input.contactId);
  }
}
```

- [ ] **Step 2: Tipska provera**

Run: `npx tsc --noEmit`
Expected: bez grešaka u `src/lib/crm/`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/crm/contacts.ts
git commit -m "feat(crm): upsertContact + logInteraction"
```

---

## Task 5: Ingest iz kontakt forme

**Files:**
- Modify: `src/app/api/kontakt/route.ts`

- [ ] **Step 1: Dodaj CRM upis posle uspešnog slanja mejla**

U `src/app/api/kontakt/route.ts`, na vrh dodaj importe:
```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertContact, logInteraction } from "@/lib/crm/contacts";
```

Posle `await resend.emails.send({...})` (a pre `return NextResponse.json({ success: true })`), dodaj:
```typescript
  // Upis u CRM da upit ne propadne (best-effort; ne ruši formu ako padne)
  try {
    const admin = createAdminClient();
    const contactId = await upsertContact(admin, {
      email,
      name,
      source: "kontakt-forma",
    });
    if (contactId) {
      await logInteraction(admin, {
        contactId,
        channel: "mejl",
        direction: "dolazna",
        summary: `Kontakt forma: ${category}`,
        body: message,
        meta: { category },
      });
    }
  } catch (e) {
    console.error("[kontakt] CRM upis nije uspeo", e);
  }
```

- [ ] **Step 2: Tipska provera**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 3: Ručni test (dev)**

```bash
npm run dev
```
U drugom terminalu:
```bash
curl -s -X POST http://localhost:3000/api/kontakt -H 'content-type: application/json' \
  -d '{"name":"Test Lid","email":"testlid@example.com","category":"Upis","message":"Zanima me B1 kurs"}'
```
Expected: `{"success":true}`. U Supabase: novi red u `crm_contacts` (source `kontakt-forma`) + 1 `crm_interactions`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/kontakt/route.ts
git commit -m "feat(crm): hvataj kontakt formu u CRM"
```

---

## Task 6: Ingest iz Smile-a

**Files:**
- Modify: `src/app/api/naki/sales/lead/route.ts`

- [ ] **Step 1: Dodaj CRM upis (lid + razgovor)**

Na vrh dodaj importe:
```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertContact, logInteraction } from "@/lib/crm/contacts";
```

U `route.ts` postoji `body` sa `email` i `name`. Proširi čitanje da uhvati i razgovor (ako frontend šalje `history`); odmah ispod parsiranja `name` dodaj:
```typescript
  const history = Array.isArray(body?.history) ? body.history : [];
  const convo = history
    .filter((m: { role?: string; content?: string }) => typeof m?.content === "string")
    .map((m: { role?: string; content?: string }) =>
      `${m.role === "user" ? "Korisnik" : "Smile"}: ${String(m.content).trim()}`)
    .join("\n")
    .slice(0, 8000);
```

Posle uspešnog slanja welcome mejla (pre `return NextResponse.json({ ok: true })`), dodaj:
```typescript
  try {
    const admin = createAdminClient();
    const contactId = await upsertContact(admin, { email, name, source: "smile" });
    if (contactId) {
      await logInteraction(admin, {
        contactId,
        channel: "smile",
        direction: "dolazna",
        summary: "Razgovor sa Smile asistentom",
        body: convo || "(lid ostavio mejl preko Smile-a)",
      });
    }
  } catch (e) {
    console.error("[smile] CRM upis nije uspeo", e);
  }
```

- [ ] **Step 2: Tipska provera**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/naki/sales/lead/route.ts
git commit -m "feat(crm): hvataj Smile lidove + razgovor u CRM"
```

---

## Task 7: Ingest iz NaKI email-capture

**Files:**
- Modify: `src/app/api/naki/email/route.ts`

- [ ] **Step 1: Dodaj CRM upis posle validacije mejla**

Na vrh dodaj import:
```typescript
import { upsertContact, logInteraction } from "@/lib/crm/contacts";
```

Ruta već koristi `createAdminClient()` negde u telu. Posle tačke gde su `email`, `name`, `level`, `history` poznati i mejl validiran (`EMAIL_RE.test(email)`), dodaj:
```typescript
  try {
    const adminCrm = createAdminClient();
    const convo = history
      .filter((m) => typeof m.content === "string")
      .map((m) => `${m.role === "user" ? "Korisnik" : "NaKI"}: ${m.content.trim()}`)
      .join("\n")
      .slice(0, 8000);
    const contactId = await upsertContact(adminCrm, {
      email, name, level, source: "naki",
    });
    if (contactId) {
      await logInteraction(adminCrm, {
        contactId,
        channel: "naki",
        direction: "dolazna",
        summary: "NaKI tutor — plan učenja",
        body: convo,
        meta: { level, session_id: sessionId },
      });
    }
  } catch (e) {
    console.error("[naki] CRM upis nije uspeo", e);
  }
```

- [ ] **Step 2: Tipska provera**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/naki/email/route.ts
git commit -m "feat(crm): hvataj NaKI lidove u CRM"
```

---

## Task 8: Ingest iz masterclass prijave

**Files:**
- Modify: `src/app/api/masterclass-reci/route.ts`

- [ ] **Step 1: Dodaj CRM upis posle insert-a u masterclass_signups**

Na vrh dodaj importe:
```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertContact, logInteraction } from "@/lib/crm/contacts";
```

Posle uspešnog `insert` u `masterclass_signups` (gde je `trimmedEmail` poznat), dodaj:
```typescript
  try {
    const admin = createAdminClient();
    const contactId = await upsertContact(admin, {
      email: trimmedEmail,
      source: "masterclass",
    });
    if (contactId) {
      await logInteraction(admin, {
        contactId,
        channel: "sistem",
        direction: "dolazna",
        summary: "Prijava na masterclass „reci\"",
        body: null,
        meta: { masterclass: "reci" },
      });
    }
  } catch (e) {
    console.error("[masterclass] CRM upis nije uspeo", e);
  }
```

- [ ] **Step 2: Tipska provera + commit**

Run: `npx tsc --noEmit`
Expected: bez grešaka.
```bash
git add src/app/api/masterclass-reci/route.ts
git commit -m "feat(crm): hvataj masterclass prijave u CRM"
```

---

## Task 9: ManyChat webhook `api/crm/ingest`

**Files:**
- Create: `src/app/api/crm/ingest/validate.ts`
- Test: `src/app/api/crm/ingest/validate.test.ts`
- Create: `src/app/api/crm/ingest/route.ts`

Env: dodati `CRM_INGEST_TOKEN` u Vercel env (deljeni tajni token koji ManyChat šalje u headeru `x-crm-token`).

- [ ] **Step 1: Napiši padajući test validacije**

```typescript
import { describe, it, expect } from "vitest";
import { parseIngest } from "./validate";

describe("parseIngest", () => {
  it("prihvata validan IG payload", () => {
    const r = parseIngest({ name: "Marko", instagram_handle: "@marko", message: "ćao", channel: "instagram" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.channel).toBe("instagram");
      expect(r.value.instagram).toBe("@marko");
    }
  });
  it("odbija nepoznat kanal", () => {
    const r = parseIngest({ message: "x", channel: "telepatija" });
    expect(r.ok).toBe(false);
  });
  it("odbija ako nema nijednog identifikatora (ni mejl ni IG ni telefon)", () => {
    const r = parseIngest({ message: "x", channel: "instagram" });
    expect(r.ok).toBe(false);
  });
  it("podrazumeva channel whatsapp kad je prosleđen", () => {
    const r = parseIngest({ phone: "+38160", message: "zdravo", channel: "whatsapp" });
    expect(r.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Pokreni — mora da padne**

Run: `npx vitest run src/app/api/crm/ingest/validate.test.ts`
Expected: FAIL — modul ne postoji.

- [ ] **Step 3: Implementiraj validaciju**

```typescript
import type { CrmChannel } from "@/lib/crm/types";

const VALID: CrmChannel[] = ["instagram", "whatsapp", "manychat"];

export interface IngestValue {
  email: string | null;
  name: string | null;
  phone: string | null;
  instagram: string | null;
  message: string | null;
  channel: CrmChannel;
}

export type ParseResult =
  | { ok: true; value: IngestValue }
  | { ok: false; error: string };

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, 4000) : null;
}

export function parseIngest(body: unknown): ParseResult {
  if (!body || typeof body !== "object") return { ok: false, error: "Neispravan payload." };
  const b = body as Record<string, unknown>;
  const channel = str(b.channel);
  if (!channel || !(VALID as string[]).includes(channel)) {
    return { ok: false, error: "Nepoznat kanal." };
  }
  const email = str(b.email);
  const phone = str(b.phone);
  const instagram = str(b.instagram_handle ?? b.instagram);
  if (!email && !phone && !instagram) {
    return { ok: false, error: "Nedostaje identifikator (mejl/telefon/instagram)." };
  }
  return {
    ok: true,
    value: {
      email,
      name: str(b.name),
      phone,
      instagram,
      message: str(b.message),
      channel: channel as CrmChannel,
    },
  };
}
```

- [ ] **Step 4: Pokreni test — mora da prođe**

Run: `npx vitest run src/app/api/crm/ingest/validate.test.ts`
Expected: PASS (4 testa).

- [ ] **Step 5: Implementiraj rutu**

```typescript
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertContact, logInteraction } from "@/lib/crm/contacts";
import { parseIngest } from "./validate";
import type { CrmSource } from "@/lib/crm/types";

export async function POST(request: Request) {
  const token = request.headers.get("x-crm-token");
  if (!process.env.CRM_INGEST_TOKEN || token !== process.env.CRM_INGEST_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseIngest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const v = parsed.value;

  const admin = createAdminClient();
  const source: CrmSource = v.channel === "manychat" ? "manychat" : v.channel;
  const contactId = await upsertContact(admin, {
    email: v.email,
    name: v.name,
    phone: v.phone,
    instagram: v.instagram,
    source,
  });
  if (!contactId) {
    return NextResponse.json({ error: "Upis nije uspeo." }, { status: 500 });
  }
  await logInteraction(admin, {
    contactId,
    channel: v.channel,
    direction: "dolazna",
    summary: `Poruka sa ${v.channel}`,
    body: v.message,
  });
  return NextResponse.json({ ok: true, contact_id: contactId });
}
```

- [ ] **Step 6: Tipska provera**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 7: Dodaj env i testiraj lokalno**

Dodaj u `.env.local`: `CRM_INGEST_TOKEN=dev-tajni-token`. Restartuj `npm run dev`.
```bash
curl -s -X POST http://localhost:3000/api/crm/ingest \
  -H 'content-type: application/json' -H 'x-crm-token: dev-tajni-token' \
  -d '{"name":"Marko IG","instagram_handle":"@marko_test","message":"Koliko košta B1?","channel":"instagram"}'
```
Expected: `{"ok":true,"contact_id":"..."}`. Bez tokena → 401.

- [ ] **Step 8: Commit**

```bash
git add src/app/api/crm/ingest/
git commit -m "feat(crm): api/crm/ingest webhook za ManyChat (IG/WA)"
```

> **Ručni korak (Nataša):** U Vercel env dodati `CRM_INGEST_TOKEN`. U ManyChat-u dodati „External Request" korak (POST na `https://www.hartweger.rs/api/crm/ingest`, header `x-crm-token`, body sa `name/instagram_handle/email/phone/message/channel`).

---

## Task 10: Admin API — lista, ručni unos, izmena

**Files:**
- Create: `src/app/api/admin/crm/route.ts`
- Create: `src/app/api/admin/crm/[id]/route.ts`

- [ ] **Step 1: `route.ts` — GET lista + POST ručni unos**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertContact } from "@/lib/crm/contacts";

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
  const { data, error } = await admin
    .from("crm_contacts")
    .select("*")
    .order("last_interaction_at", { ascending: false })
    .limit(2000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const { name, email, phone, instagram, level, note } = body;
  if (!name && !email && !phone && !instagram) {
    return NextResponse.json({ error: "Unesi bar ime, mejl, telefon ili Instagram." }, { status: 400 });
  }
  const contactId = await upsertContact(admin, {
    name, email, phone, instagram, level, source: "rucno",
  });
  if (!contactId) return NextResponse.json({ error: "Upis nije uspeo." }, { status: 500 });
  if (note) await admin.from("crm_contacts").update({ note }).eq("id", contactId);
  return NextResponse.json({ contact_id: contactId });
}
```

- [ ] **Step 2: `[id]/route.ts` — GET detalji + PATCH izmena**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CRM_STAGES, type CrmStage } from "@/lib/crm/types";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? admin : null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const patch: Record<string, unknown> = {};
  if (typeof body.stage === "string") {
    if (!CRM_STAGES.includes(body.stage as CrmStage)) {
      return NextResponse.json({ error: "Nepoznata faza." }, { status: 400 });
    }
    patch.stage = body.stage;
  }
  if ("next_action" in body) patch.next_action = body.next_action || null;
  if ("next_action_at" in body) patch.next_action_at = body.next_action_at || null;
  if ("note" in body) patch.note = body.note || null;
  if ("level" in body) patch.level = body.level || null;
  if (Array.isArray(body.tags)) patch.tags = body.tags;

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Nema izmena." }, { status: 400 });
  }
  const { data, error } = await admin
    .from("crm_contacts").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contact: data });
}
```

- [ ] **Step 3: Tipska provera + commit**

Run: `npx tsc --noEmit`
Expected: bez grešaka.
```bash
git add src/app/api/admin/crm/route.ts src/app/api/admin/crm/[id]/route.ts
git commit -m "feat(crm): admin API lista/unos/izmena kontakta"
```

---

## Task 11: Admin API — slanje mejla iz profila

**Files:**
- Create: `src/app/api/admin/crm/[id]/email/route.ts`

- [ ] **Step 1: Implementiraj rutu**

```typescript
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logInteraction } from "@/lib/crm/contacts";

const FROM = "Hartweger <kurs@hartweger.rs>";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? admin : null;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();
  if (!subject || !message) {
    return NextResponse.json({ error: "Naslov i poruka su obavezni." }, { status: 400 });
  }

  const { data: contact } = await admin
    .from("crm_contacts").select("email,name").eq("id", id).single();
  if (!contact?.email) {
    return NextResponse.json({ error: "Kontakt nema mejl adresu." }, { status: 400 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Mejl servis nije dostupan." }, { status: 503 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;color:#333;line-height:1.6;">
    ${esc(message).replace(/\n/g, "<br>")}
    <p style="margin-top:16px;">Srdačno,<br>Hartweger tim</p>
  </div>`;
  try {
    await resend.emails.send({ from: FROM, to: contact.email, replyTo: "info@hartweger.rs", subject, html });
  } catch (e) {
    console.error("[crm] slanje mejla palo", e);
    return NextResponse.json({ error: "Slanje nije uspelo." }, { status: 502 });
  }

  await logInteraction(admin, {
    contactId: id,
    channel: "mejl",
    direction: "odlazna",
    summary: subject,
    body: message,
  });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Tipska provera + commit**

Run: `npx tsc --noEmit`
Expected: bez grešaka.
```bash
git add src/app/api/admin/crm/[id]/email/route.ts
git commit -m "feat(crm): slanje mejla iz profila + upis u timeline"
```

---

## Task 12: Admin stranica `/admin/crm` (Za danas + tabela)

**Files:**
- Create: `src/app/admin/crm/page.tsx`
- Create: `src/app/admin/crm/CrmListClient.tsx`

- [ ] **Step 1: Server stranica (učitava kontakte)**

```tsx
import { createAdminClient } from "@/lib/supabase/admin";
import type { CrmContact } from "@/lib/crm/types";
import CrmListClient from "./CrmListClient";

export const dynamic = "force-dynamic";

export default async function AdminCrmPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("crm_contacts")
    .select("*")
    .order("last_interaction_at", { ascending: false })
    .limit(2000);
  return <CrmListClient contacts={(data ?? []) as CrmContact[]} />;
}
```

- [ ] **Step 2: Klijent — panel „Za danas" + filtrirana tabela**

```tsx
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
```

- [ ] **Step 3: Tipska provera + lint**

Run: `npx tsc --noEmit && npx next lint --file src/app/admin/crm/CrmListClient.tsx`
Expected: bez grešaka.

- [ ] **Step 4: Vizuelni test (dev)**

`npm run dev` → otvori `http://localhost:3000/admin/crm` ulogovan kao admin. Treba da vidiš „Za danas" panel + tabelu sa test kontaktima iz prethodnih taskova.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/crm/page.tsx src/app/admin/crm/CrmListClient.tsx
git commit -m "feat(crm): /admin/crm lista + Za danas panel"
```

---

## Task 13: Admin profil `/admin/crm/[id]` (timeline + akcije)

**Files:**
- Create: `src/app/admin/crm/[id]/page.tsx`
- Create: `src/app/admin/crm/[id]/CrmDetailClient.tsx`

- [ ] **Step 1: Server stranica (kontakt + interakcije + „kao polaznik")**

```tsx
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CrmContact, CrmInteraction } from "@/lib/crm/types";
import CrmDetailClient from "./CrmDetailClient";

export const dynamic = "force-dynamic";

export default async function CrmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: contact } = await admin.from("crm_contacts").select("*").eq("id", id).single();
  if (!contact) notFound();

  const { data: interactions } = await admin
    .from("crm_interactions").select("*").eq("contact_id", id)
    .order("occurred_at", { ascending: false }).limit(500);

  // „Kao polaznik": ako je povezan user_id, pročitaj kurseve (best-effort)
  let courses: { course_id: string; expires_at: string | null }[] = [];
  if (contact.user_id) {
    const { data: access } = await admin
      .from("course_access").select("course_id, expires_at").eq("user_id", contact.user_id);
    courses = access ?? [];
  }

  return (
    <CrmDetailClient
      contact={contact as CrmContact}
      interactions={(interactions ?? []) as CrmInteraction[]}
      courses={courses}
    />
  );
}
```

> Napomena: ako kolona `course_access.expires_at` ne postoji pod tim imenom, koristi `select("*")` i prikaži sirovo — `courses` je samo informativni panel, ne sme da obori stranicu.

- [ ] **Step 2: Klijent — zaglavlje, sledeći korak, timeline, akcije**

```tsx
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
          <h2 className="mb-2 font-semibold">Pošalji mejl</h2>
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
```

- [ ] **Step 3: Tipska provera + lint**

Run: `npx tsc --noEmit && npx next lint --file src/app/admin/crm/[id]/CrmDetailClient.tsx`
Expected: bez grešaka.

- [ ] **Step 4: Vizuelni test (dev)**

Otvori profil jednog test kontakta (`/admin/crm/<id>`). Promeni fazu → ostaje posle refresh-a. Pošalji probni mejl na svoju adresu → stiže + nova „odlazna" stavka u istoriji.

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/crm/[id]/page.tsx" "src/app/admin/crm/[id]/CrmDetailClient.tsx"
git commit -m "feat(crm): profil kontakta — timeline, faza, sledeći korak, slanje mejla"
```

---

## Task 14: Nav link u AdminSidebar

**Files:**
- Modify: `src/components/AdminSidebar.tsx`

- [ ] **Step 1: Dodaj link**

U nizu `links` (posle reda `{ href: "/admin/naki", label: "NaKI & Smile" }`), dodaj:
```typescript
  { href: "/admin/crm", label: "CRM" },
```

- [ ] **Step 2: Vizuelni test + commit**

`npm run dev` → „CRM" se vidi u sidebaru i vodi na `/admin/crm`.
```bash
git add src/components/AdminSidebar.tsx
git commit -m "feat(crm): nav link u admin sidebaru"
```

---

## Task 15: Backfill postojećih lidova (jednokratno)

**Files:**
- Create: `scripts/crm-backfill.mjs`

Cilj: uvezi postojeće `naki_profiles` i `masterclass_signups` u `crm_contacts` da CRM ne krene prazan.

- [ ] **Step 1: Napiši skriptu**

```javascript
// Jednokratni uvoz postojećih lidova u crm_contacts.
// Pokretanje: node scripts/crm-backfill.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Fali SUPABASE env."); process.exit(1); }
const db = createClient(url, key);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const norm = (e) => (typeof e === "string" && EMAIL_RE.test(e.trim().toLowerCase()) ? e.trim().toLowerCase() : null);

async function exists(email) {
  const { data } = await db.from("crm_contacts").select("id").ilike("email", email).limit(1);
  return data?.[0]?.id ?? null;
}

let created = 0, skipped = 0;

// naki_profiles
const { data: naki } = await db.from("naki_profiles").select("email,name,level").limit(10000);
for (const p of naki ?? []) {
  const email = norm(p.email);
  if (!email) { skipped++; continue; }
  if (await exists(email)) { skipped++; continue; }
  await db.from("crm_contacts").insert({ email, name: p.name || null, level: p.level || null, source: "naki", stage: "nov" });
  created++;
}

// masterclass_signups
const { data: mc } = await db.from("masterclass_signups").select("email").limit(10000);
for (const m of mc ?? []) {
  const email = norm(m.email);
  if (!email) { skipped++; continue; }
  if (await exists(email)) { skipped++; continue; }
  await db.from("crm_contacts").insert({ email, source: "masterclass", stage: "nov" });
  created++;
}

console.log(`Backfill gotov: kreirano ${created}, preskočeno ${skipped}.`);
```

- [ ] **Step 2: Pokreni (sa env iz .env.local)**

```bash
set -a; source .env.local; set +a; node scripts/crm-backfill.mjs
```
Expected: ispis „Backfill gotov: kreirano N, preskočeno M." Proveri u `/admin/crm` da su se pojavili.

- [ ] **Step 3: Commit**

```bash
git add scripts/crm-backfill.mjs
git commit -m "chore(crm): backfill skripta za naki_profiles + masterclass"
```

---

## Završna verifikacija

- [ ] `npx vitest run src/lib/crm src/app/api/crm` — svi testovi prolaze.
- [ ] `npx tsc --noEmit` — bez grešaka.
- [ ] `npm run build` — build prolazi.
- [ ] Deploy: `vercel --prod` (vidi memoriju „Vercel deploy — kako"); posle deploya proveri `/admin/crm` na produkciji.
- [ ] Ručni koraci (Nataša): `CRM_INGEST_TOKEN` u Vercel env + ManyChat External Request korak.

---

## Self-review (popunjeno pri pisanju plana)

**Spec coverage:**
- crm_contacts + crm_interactions → Task 1. ✓
- Dedup po email/IG → Task 3 (čiste fn) + Task 4 (orkestracija). ✓
- Ingest forma/Smile/NaKI/masterclass → Task 5–8. ✓
- ManyChat webhook → Task 9. ✓
- „Za danas" + tabela → Task 12. ✓
- Profil timeline + „Pošalji mejl" + faza + sledeći korak → Task 11, 13. ✓
- Ručni unos kontakta → Task 10 (POST) + Task 12 (forma). ✓
- „Kao polaznik" panel (čita postojeće tabele) → Task 13. ✓
- RLS bez anon → Task 1. ✓
- Testovi (dedup, validacija ingest-a) → Task 3, 9. ✓
- v2 stavke (šabloni+kupon, razlog gubitka, Gmail auto-sync, kanban) → namerno van plana. ✓

**Type consistency:** `upsertContact`/`logInteraction` potpisi iz Task 4 koriste se identično u Task 5–11; `CrmStage`/`CRM_STAGES`/`CrmContact`/`CrmInteraction` iz Task 2 koriste se u Task 10/12/13. `parseIngest` iz Task 9 koristi `CrmChannel` iz Task 2. ✓

**Placeholder scan:** nema TODO/TBD; sav kod je konkretan. Jedina uslovna napomena (course_access kolona) ima eksplicitno uputstvo da ne obara stranicu. ✓
