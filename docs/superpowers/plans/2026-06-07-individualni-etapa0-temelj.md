# Individualni kursevi — Etapa 0 (Temelj) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Postaviti šemu i podatke (product_variants iz WC, prof config, nove tabele) na koje se grade Etape 1–4 individualnih kurseva.

**Architecture:** Jedna migracija (040) dodaje prof config kolone + `included_lessons` + tri nove tabele (`individual_enrollments`, `individual_lessons`, `group_sessions`). Migracija 041 (idempotentan SQL seed) puni prof config + `included_lessons`. Skripta `seed-individual-variants.mjs` puni postojeću (praznu) `product_variants` tabelu iz WooCommerce API-ja, sa ručnim ispravkama (Marija→standard, FIDE→Katarina, FSP→Milica). Cene su izvor istine za checkout (Etapa 1).

**Tech Stack:** Postgres/Supabase (SQL migracije), Node ESM skripta (`fetch` ka WC REST), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-07-individualni-kursevi-design.md` (Etapa 0).

**Reference podaci (iz starog `apps-script-2/Config.js` + WC API):**
- Profesorke (email → calendar.app.google):
  - Hristina `hristina@hartweger.rs` `https://calendar.app.google/ZjskhvmBoWNYjMbt8`
  - Marija `marija@hartweger.rs` `https://calendar.app.google/nAhWsy5CJZchHB5c8`
  - Milica `milica@hartweger.rs` `https://calendar.app.google/Wd3LMCvyGm6Veedx5`
  - Suzana `suzana@hartweger.rs` `https://calendar.app.google/XhgrDbo8iAVJJyAM6`
  - Katarina `katarina@hartweger.rs` `https://calendar.app.google/ikcyRjvdwsVBfsTc7`
  - Natasa `natasa@hartweger.rs` `https://calendar.app.google/pLednA2FiPJSN9Fg9`
  - Danica `danica@hartweger.rs` `https://calendar.app.google/SvZGH4RbhGvcZh6JA`
- Honorar rate (RSD): sve 1400 (ind) / 1600 (grp); **Katarina 1600 / 1800**.
- WC (kategorija 357 + 370), `WC id → naš courses.slug`:
  - 35766 → `individualni-kurs-nemackog-jezika-a11`
  - 35767 → `individualni-kurs-nemackog-jezika-a1-2`
  - 46494 → `paket-nivo-a1-a1-1-a1-2-individualni-standard`
  - 35758 → `individualni-kurs-nemackog-jezika-a2`
  - 35761 → `individualni-kurs-nemackog-jezika-a2-2`
  - 39308 → `individualni-kurs-nemackog-jezika-b11`
  - 39309 → `individualni-kurs-nemackog-jezika-b1-2`
  - 46656 → `individualni-kurs-nemackog-jezika-b2-1`
  - 46457 → `individualni-polozi-fide` (*simple* → Katarina, 24360 RSD)
  - 45206 → `fsp-individualni` (*simple* → Milica, 20500 RSD)
  - 47575 → `individualni-mesecni-paketi` (paket4/8/12)
- WC pristup (read-only): `https://hartweger.rs/wp-json/wc/v3/`,
  CK `ck_5fa42d3e78f75b6ddc9b166f70f0efddb3625322`, CS `cs_55c370aec2ab635f6e6fe83e76ea2b645d486bc4`.

---

## File Structure

- **Create** `supabase/migrations/040_individual_courses.sql` — kolone + 3 nove tabele + RLS.
- **Create** `supabase/migrations/041_seed_professor_config.sql` — idempotentan UPDATE prof config + `included_lessons`.
- **Create** `src/lib/wc-variant-map.ts` — čiste funkcije: `normalizeFirstName`, `profEmailForWcName`, `mapWcVariationsToRows`. Bez I/O (testabilno).
- **Create** `src/lib/wc-variant-map.test.ts` — Vitest za mapiranje.
- **Create** `scripts/seed-individual-variants.mjs` — povlači WC, koristi `wc-variant-map`, upisuje u `product_variants`.
- **Create** `scripts/verify-individual-foundation.mjs` — provera (broj varijacija po kursu, prof config popunjen).

---

## Task 1: Migracija 040 — kolone i nove tabele

**Files:**
- Create: `supabase/migrations/040_individual_courses.sql`

- [ ] **Step 1: Napiši migraciju**

```sql
-- 040: Individualni kursevi — prof config kolone, included_lessons, nove tabele.

-- Prof config (na user_profiles; NULL za ne-profesorke).
alter table public.user_profiles
  add column if not exists calendar_url text,
  add column if not exists honorar_ind int,
  add column if not exists honorar_grp int;

-- Broj časova uključen u "po nivou" individualni kurs (mesečni paket: iz package_type).
alter table public.courses
  add column if not exists included_lessons int;

-- Roster individualnih upisa (zamena za prof IND Google Sheet).
create table if not exists public.individual_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id),
  course_id uuid not null references public.courses(id),
  professor_id uuid references public.user_profiles(id),
  order_id uuid references public.orders(id),
  package_lessons int not null,
  lessons_used int not null default 0,
  notes_doc_url text,
  status text not null default 'active'
    check (status in ('active','completed','expired','cancelled')),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_ind_enroll_user on public.individual_enrollments(user_id);
create index if not exists idx_ind_enroll_prof on public.individual_enrollments(professor_id);

-- Log održanih individualnih časova (lessons_used = broj redova po enrollmentu).
create table if not exists public.individual_lessons (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.individual_enrollments(id) on delete cascade,
  professor_id uuid not null references public.user_profiles(id),
  lesson_date date not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_ind_lessons_prof_date on public.individual_lessons(professor_id, lesson_date);

-- Log održanih grupnih sesija (za honorar). source: 'auto' (iz rasporeda) | 'manual'.
create table if not exists public.group_sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  professor_id uuid references public.user_profiles(id),
  session_date date not null,
  source text not null default 'manual' check (source in ('manual','auto')),
  created_at timestamptz not null default now(),
  unique (group_id, session_date)
);
create index if not exists idx_grp_sessions_prof_date on public.group_sessions(professor_id, session_date);

-- RLS: app koristi service-role (zaobilazi RLS); ove politike su za korisnički kontekst (Etapa 2+).
alter table public.individual_enrollments enable row level security;
alter table public.individual_lessons enable row level security;
alter table public.group_sessions enable row level security;

create policy "ind_enroll student read own"
  on public.individual_enrollments for select
  using (auth.uid() = user_id);

create policy "ind_enroll staff all"
  on public.individual_enrollments for all
  using (exists (select 1 from public.user_profiles p
    where p.id = auth.uid() and p.role in ('admin','professor')));

create policy "ind_lessons staff all"
  on public.individual_lessons for all
  using (exists (select 1 from public.user_profiles p
    where p.id = auth.uid() and p.role in ('admin','professor')));

create policy "grp_sessions staff all"
  on public.group_sessions for all
  using (exists (select 1 from public.user_profiles p
    where p.id = auth.uid() and p.role in ('admin','professor')));
```

- [ ] **Step 2: Primeni migraciju**

Primeni 040 na Supabase (po `reference_supabase_ddl`: SQL Editor ili Management API `sbp_` token).
Run lokalno za proveru sintakse ako postoji lokalni Supabase, inače primeni direktno na projekat.

- [ ] **Step 3: Verifikuj da tabele/kolone postoje**

Run (psql/Management API ili check skripta iz Task 6):
```sql
select column_name from information_schema.columns
  where table_name='user_profiles' and column_name in ('calendar_url','honorar_ind','honorar_grp');
select table_name from information_schema.tables
  where table_name in ('individual_enrollments','individual_lessons','group_sessions');
```
Expected: 3 kolone + 3 tabele.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/040_individual_courses.sql
git commit -m "feat(db): migracija 040 — prof config, included_lessons, individual_enrollments/lessons + group_sessions"
```

---

## Task 2: Migracija 041 — seed prof config + included_lessons

**Files:**
- Create: `supabase/migrations/041_seed_professor_config.sql`

- [ ] **Step 1: Napiši idempotentan seed**

```sql
-- 041: Seed prof config (calendar + honorar) i included_lessons. Idempotentno (po email/slug).

-- Profesorke: calendar + honorar (sve 1400/1600 osim Katarine 1600/1800).
update public.user_profiles set calendar_url='https://calendar.app.google/ZjskhvmBoWNYjMbt8', honorar_ind=1400, honorar_grp=1600 where email='hristina@hartweger.rs';
update public.user_profiles set calendar_url='https://calendar.app.google/nAhWsy5CJZchHB5c8', honorar_ind=1400, honorar_grp=1600 where email='marija@hartweger.rs';
update public.user_profiles set calendar_url='https://calendar.app.google/Wd3LMCvyGm6Veedx5', honorar_ind=1400, honorar_grp=1600 where email='milica@hartweger.rs';
update public.user_profiles set calendar_url='https://calendar.app.google/XhgrDbo8iAVJJyAM6', honorar_ind=1400, honorar_grp=1600 where email='suzana@hartweger.rs';
update public.user_profiles set calendar_url='https://calendar.app.google/ikcyRjvdwsVBfsTc7', honorar_ind=1600, honorar_grp=1800 where email='katarina@hartweger.rs';
update public.user_profiles set calendar_url='https://calendar.app.google/pLednA2FiPJSN9Fg9', honorar_ind=1400, honorar_grp=1600 where email='natasa@hartweger.rs';
update public.user_profiles set calendar_url='https://calendar.app.google/SvZGH4RbhGvcZh6JA', honorar_ind=1400, honorar_grp=1600 where email='danica@hartweger.rs';

-- included_lessons po "po nivou" individualnim kursevima (staro PAKET_PO_NIVOU).
update public.courses set included_lessons=7  where slug='individualni-kurs-nemackog-jezika-a11';
update public.courses set included_lessons=7  where slug='individualni-kurs-nemackog-jezika-a1-2';
update public.courses set included_lessons=14 where slug='paket-nivo-a1-a1-1-a1-2-individualni-standard';
update public.courses set included_lessons=10 where slug='individualni-kurs-nemackog-jezika-a2';
update public.courses set included_lessons=10 where slug='individualni-kurs-nemackog-jezika-a2-2';
update public.courses set included_lessons=10 where slug='individualni-kurs-nemackog-jezika-b11';
update public.courses set included_lessons=10 where slug='individualni-kurs-nemackog-jezika-b1-2';
update public.courses set included_lessons=10 where slug='individualni-kurs-nemackog-jezika-b2-1';
update public.courses set included_lessons=5  where slug='fsp-individualni';
update public.courses set included_lessons=10 where slug='individualni-polozi-fide'; -- POTVRDITI sa Natašom (default 10)
```

- [ ] **Step 2: Primeni 041 i proveri**

Primeni na Supabase. Proveri:
```sql
select email, calendar_url is not null as cal, honorar_ind, honorar_grp
  from user_profiles where email like '%@hartweger.rs' and honorar_ind is not null;
select slug, included_lessons from courses where included_lessons is not null order by slug;
```
Expected: 7 profesorki sa cal=true; 10 kurseva sa included_lessons.
**Ako neka profesorka NIJE pogođena** (0 redova za njen email) → njen `user_profiles` ne postoji još; zabeleži i reši u Task 6 (precheck).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/041_seed_professor_config.sql
git commit -m "feat(db): migracija 041 — seed prof calendar/honorar + included_lessons"
```

---

## Task 3: Čiste funkcije za mapiranje WC varijacija (TDD)

**Files:**
- Create: `src/lib/wc-variant-map.ts`
- Test: `src/lib/wc-variant-map.test.ts`

- [ ] **Step 1: Napiši failing test**

```typescript
import { describe, it, expect } from "vitest";
import { normalizeFirstName, profEmailForWcName, mapWcVariationsToRows } from "./wc-variant-map";

describe("normalizeFirstName", () => {
  it("uzima prvo ime, skida dijakritike, lowercase", () => {
    expect(normalizeFirstName("Nataša Hartweger")).toBe("natasa");
    expect(normalizeFirstName("Marija Radojkvić-Stanojić")).toBe("marija");
    expect(normalizeFirstName("Hristina Šarčević")).toBe("hristina");
  });
});

describe("profEmailForWcName", () => {
  it("mapira prvo ime na @hartweger.rs email", () => {
    expect(profEmailForWcName("Nataša Hartweger")).toBe("natasa@hartweger.rs");
    expect(profEmailForWcName("Katarina Todosijević")).toBe("katarina@hartweger.rs");
  });
  it("vraća null za nepoznato ime", () => {
    expect(profEmailForWcName("Petar Petrović")).toBeNull();
  });
});

describe("mapWcVariationsToRows", () => {
  const profIdByEmail = {
    "natasa@hartweger.rs": "uuid-natasa",
    "marija@hartweger.rs": "uuid-marija",
    "suzana@hartweger.rs": "uuid-suzana",
  };

  it("po nivou: jedan red po profesorki, package_type null", () => {
    const rows = mapWcVariationsToRows({
      courseId: "c-a11",
      isMonthly: false,
      profIdByEmail,
      variations: [
        { price: "23000", attributes: [{ name: "Profesor", option: "Suzana Marjanović" }] },
        { price: "28000", attributes: [{ name: "Profesor", option: "Nataša Hartweger" }] },
      ],
    });
    expect(rows).toEqual([
      { course_id: "c-a11", professor_id: "uuid-suzana", package_type: null, price: 23000, paypal_price_eur: null, is_active: true },
      { course_id: "c-a11", professor_id: "uuid-natasa", package_type: null, price: 28000, paypal_price_eur: null, is_active: true },
    ]);
  });

  it("mesečni: Marija dobija standard cenu (WP greška se ignoriše)", () => {
    const rows = mapWcVariationsToRows({
      courseId: "c-mp",
      isMonthly: true,
      profIdByEmail,
      variations: [
        { price: "28000", attributes: [{ name: "Profesor", option: "Marija Radojković Stanojić" }, { name: "Paket", option: "paket8" }] },
        { price: "27500", attributes: [{ name: "Profesor", option: "Suzana Marjanović" }, { name: "Paket", option: "paket8" }] },
      ],
    });
    const marija = rows.find((r) => r.professor_id === "uuid-marija" && r.package_type === "paket8");
    expect(marija?.price).toBe(27500); // standard, ne 28000
  });

  it("preskače varijaciju za nepoznatu/neseed-ovanu profesorku", () => {
    const rows = mapWcVariationsToRows({
      courseId: "c-a11", isMonthly: false, profIdByEmail,
      variations: [{ price: "23000", attributes: [{ name: "Profesor", option: "Danica Nepoznata" }] }],
    });
    expect(rows).toEqual([]);
  });
});
```

- [ ] **Step 2: Pokreni test — mora pasti**

Run: `npx vitest run src/lib/wc-variant-map.test.ts`
Expected: FAIL ("Cannot find module './wc-variant-map'").

- [ ] **Step 3: Implementiraj**

```typescript
// src/lib/wc-variant-map.ts
// Čisto mapiranje WooCommerce varijacija → redovi za product_variants. Bez I/O.

const PROF_EMAILS: Record<string, string> = {
  natasa: "natasa@hartweger.rs",
  marija: "marija@hartweger.rs",
  milica: "milica@hartweger.rs",
  suzana: "suzana@hartweger.rs",
  katarina: "katarina@hartweger.rs",
  hristina: "hristina@hartweger.rs",
  danica: "danica@hartweger.rs",
};

// Standardne mesečne cene po package_type (Marijine više cene u WP-u su greška → standard).
const MONTHLY_STANDARD: Record<string, number> = { paket4: 14000, paket8: 27500, paket12: 41000 };

export function normalizeFirstName(s: string): string {
  return String(s).trim().split(/\s+/)[0].toLowerCase()
    .replace(/č|ć/g, "c").replace(/š/g, "s").replace(/ž/g, "z").replace(/đ/g, "dj");
}

export function profEmailForWcName(name: string): string | null {
  return PROF_EMAILS[normalizeFirstName(name)] ?? null;
}

interface WcAttr { name: string; option: string }
interface WcVariation { price: string; attributes: WcAttr[] }

export interface VariantRow {
  course_id: string;
  professor_id: string;
  package_type: string | null;
  price: number;
  paypal_price_eur: number | null;
  is_active: boolean;
}

function attr(v: WcVariation, name: string): string | null {
  const a = v.attributes.find((x) => x.name.toLowerCase() === name.toLowerCase());
  return a ? a.option : null;
}

export function mapWcVariationsToRows(input: {
  courseId: string;
  isMonthly: boolean;
  profIdByEmail: Record<string, string>;
  variations: WcVariation[];
}): VariantRow[] {
  const rows: VariantRow[] = [];
  for (const v of input.variations) {
    const profName = attr(v, "Profesor");
    if (!profName) continue;
    const email = profEmailForWcName(profName);
    if (!email) continue;
    const profId = input.profIdByEmail[email];
    if (!profId) continue; // profesorka nije u bazi/seed-u — preskoči

    const packageType = input.isMonthly ? attr(v, "Paket") : null;
    let price = parseInt(String(v.price), 10);
    // Marija ispravka: za mesečni koristi standard cenu po paketu.
    if (input.isMonthly && email === "marija@hartweger.rs" && packageType && MONTHLY_STANDARD[packageType] != null) {
      price = MONTHLY_STANDARD[packageType];
    }
    rows.push({
      course_id: input.courseId,
      professor_id: profId,
      package_type: packageType,
      price,
      paypal_price_eur: null, // izvodi se calculatePaypalEur na checkout-u
      is_active: true,
    });
  }
  return rows;
}
```

- [ ] **Step 4: Pokreni test — mora proći**

Run: `npx vitest run src/lib/wc-variant-map.test.ts`
Expected: PASS (3 describe bloka).

- [ ] **Step 5: Commit**

```bash
git add src/lib/wc-variant-map.ts src/lib/wc-variant-map.test.ts
git commit -m "feat(individual): WC->product_variants mapiranje (cisto, TDD)"
```

---

## Task 4: Seed skripta — WC → product_variants

**Files:**
- Create: `scripts/seed-individual-variants.mjs`

- [ ] **Step 1: Napiši skriptu**

```javascript
// scripts/seed-individual-variants.mjs
// Povlači WC varijacije individualnih kurseva i puni product_variants. Idempotentno
// (briše postojeće varijacije za te kurseve, pa upisuje). Pokretanje (tsx razrešava .ts import):
//   npx tsx scripts/seed-individual-variants.mjs [--apply]
// Bez --apply samo ispisuje izveštaj (dry-run). Kredencijali iz .env.local.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { mapWcVariationsToRows } from "../src/lib/wc-variant-map.ts";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const WC = "https://hartweger.rs/wp-json/wc/v3";
const CK = "ck_5fa42d3e78f75b6ddc9b166f70f0efddb3625322";
const CS = "cs_55c370aec2ab635f6e6fe83e76ea2b645d486bc4";
const APPLY = process.argv.includes("--apply");

// WC product id → naš courses.slug + da li je mesečni (ima Paket atribut).
const WC_TO_SLUG = [
  { id: 35766, slug: "individualni-kurs-nemackog-jezika-a11", monthly: false },
  { id: 35767, slug: "individualni-kurs-nemackog-jezika-a1-2", monthly: false },
  { id: 46494, slug: "paket-nivo-a1-a1-1-a1-2-individualni-standard", monthly: false },
  { id: 35758, slug: "individualni-kurs-nemackog-jezika-a2", monthly: false },
  { id: 35761, slug: "individualni-kurs-nemackog-jezika-a2-2", monthly: false },
  { id: 39308, slug: "individualni-kurs-nemackog-jezika-b11", monthly: false },
  { id: 39309, slug: "individualni-kurs-nemackog-jezika-b1-2", monthly: false },
  { id: 46656, slug: "individualni-kurs-nemackog-jezika-b2-1", monthly: false },
  { id: 47575, slug: "individualni-mesecni-paketi", monthly: true },
];

// Simple proizvodi (bez WC varijacija) → fiksna profesorka + cena.
const SIMPLE = [
  { slug: "individualni-polozi-fide", profEmail: "katarina@hartweger.rs", price: 24360 },
  { slug: "fsp-individualni", profEmail: "milica@hartweger.rs", price: 20500 },
];

async function wc(path) {
  const url = `${WC}${path}${path.includes("?") ? "&" : "?"}consumer_key=${CK}&consumer_secret=${CS}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WC ${res.status} za ${path}`);
  return res.json();
}

async function main() {
  const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Mape: slug→course_id, prof email→id.
  const { data: courses } = await supa.from("courses").select("id, slug");
  const courseIdBySlug = Object.fromEntries((courses ?? []).map((c) => [c.slug, c.id]));
  const { data: profs } = await supa.from("user_profiles").select("id, email").eq("role", "professor");
  const profIdByEmail = Object.fromEntries((profs ?? []).map((p) => [p.email, p.id]));

  const allRows = [];
  const report = [];

  for (const m of WC_TO_SLUG) {
    const courseId = courseIdBySlug[m.slug];
    if (!courseId) { report.push(`SKIP: nema kursa za slug ${m.slug}`); continue; }
    const variations = await wc(`/products/${m.id}/variations?per_page=100`);
    const rows = mapWcVariationsToRows({ courseId, isMonthly: m.monthly, profIdByEmail, variations });
    report.push(`${m.slug}: ${rows.length} varijacija (WC ${variations.length})`);
    allRows.push({ courseId, rows });
    await new Promise((r) => setTimeout(r, 2500)); // WC rate-limit
  }

  for (const s of SIMPLE) {
    const courseId = courseIdBySlug[s.slug];
    const profId = profIdByEmail[s.profEmail];
    if (!courseId || !profId) { report.push(`SKIP simple: ${s.slug} (course=${!!courseId}, prof=${!!profId})`); continue; }
    allRows.push({ courseId, rows: [{ course_id: courseId, professor_id: profId, package_type: null, price: s.price, paypal_price_eur: null, is_active: true }] });
    report.push(`${s.slug}: 1 (simple, ${s.profEmail})`);
  }

  console.log("\n=== IZVEŠTAJ MAPIRANJA ===");
  report.forEach((r) => console.log(" ", r));
  const total = allRows.reduce((n, x) => n + x.rows.length, 0);
  console.log(`Ukupno varijacija: ${total}\n`);

  if (!APPLY) { console.log("DRY-RUN (bez --apply). Ništa nije upisano."); return; }

  for (const { courseId, rows } of allRows) {
    await supa.from("product_variants").delete().eq("course_id", courseId);
    if (rows.length) {
      const { error } = await supa.from("product_variants").insert(rows);
      if (error) throw new Error(`insert za ${courseId}: ${error.message}`);
    }
  }
  console.log("UPISANO.");
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Pokreni dry-run (bez upisa)**

Run:
```bash
npx tsx scripts/seed-individual-variants.mjs
```
Expected: izveštaj sa ~11 linija; svaki „po nivou" kurs 4–5 varijacija, mesečni 18 (6 prof × 3), FIDE/FSP po 1.
**Ako neki kurs kaže „nema kursa za slug" ili prof 0** → reši pre `--apply` (slug/prof ne postoji u bazi).

- [ ] **Step 3: Primeni**

Run:
```bash
npx tsx scripts/seed-individual-variants.mjs --apply
```
Expected: „UPISANO."

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-individual-variants.mjs
git commit -m "feat(individual): seed product_variants iz WooCommerce (idempotentno)"
```

---

## Task 5: Verifikacija temelja

**Files:**
- Create: `scripts/verify-individual-foundation.mjs`

- [ ] **Step 1: Napiši check skriptu**

```javascript
// scripts/verify-individual-foundation.mjs — provera Etape 0. Pokretanje: node scripts/verify-individual-foundation.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const supa = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
let ok = true;
const fail = (m) => { console.error("✗", m); ok = false; };
const pass = (m) => console.log("✓", m);

const { data: profs } = await supa.from("user_profiles")
  .select("email, calendar_url, honorar_ind, honorar_grp").eq("role", "professor");
const configured = (profs ?? []).filter((p) => p.calendar_url && p.honorar_ind && p.honorar_grp);
configured.length >= 7 ? pass(`prof config: ${configured.length} profesorki`) : fail(`prof config: samo ${configured.length} (očekivano ≥7)`);

const { data: variants } = await supa.from("product_variants").select("course_id, professor_id, package_type, price");
(variants?.length ?? 0) >= 40 ? pass(`product_variants: ${variants.length} redova`) : fail(`product_variants: ${variants?.length} (premalo)`);

const badPrice = (variants ?? []).filter((v) => !v.price || v.price <= 0);
badPrice.length === 0 ? pass("sve varijacije imaju cenu") : fail(`${badPrice.length} varijacija bez cene`);

const { data: lessons } = await supa.from("courses").select("slug, included_lessons").not("included_lessons", "is", null);
(lessons?.length ?? 0) >= 10 ? pass(`included_lessons: ${lessons.length} kurseva`) : fail(`included_lessons: ${lessons?.length}`);

process.exit(ok ? 0 : 1);
```

- [ ] **Step 2: Pokreni**

Run:
```bash
node scripts/verify-individual-foundation.mjs
```
Expected: sve ✓, exit 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/verify-individual-foundation.mjs
git commit -m "chore(individual): verifikator temelja (Etapa 0)"
```

---

## Precheck (pre Task 2/4 ako iskrsne)

Ako migracija 041 ne pogodi profesorku ili seed kaže „prof 0":
- Profesorke moraju postojati u `user_profiles` sa `role='professor'` i tačnim `@hartweger.rs` mejlom.
  Proveri: `select email, role from user_profiles where email like '%@hartweger.rs';`
- Danica je na porodiljskom — ako njen nalog ne postoji, kreiraj profil (ili je dodaj ručno);
  bez varijacija je svejedno (ne pojavljuje se u checkout-u).
- FIDE/FSP sadržaj kurs (`polozi-fide`, `fsp`) i `course_unlocks` već postoje (migracija 030) — ne dirati.

---

## Definition of Done (Etapa 0)

- Migracije 040 + 041 primenjene; 3 nove tabele + prof config kolone postoje.
- `product_variants` popunjen iz WC (Marija→standard, FIDE→Katarina, FSP→Milica).
- `npx vitest run src/lib/wc-variant-map.test.ts` zeleno.
- `verify-individual-foundation.mjs` izlazi 0.
- **Nije potreban deploy** (samo baza/podaci); Etapa 1 koristi ovo.
