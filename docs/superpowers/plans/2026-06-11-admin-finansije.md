# Admin Finansije Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nova admin stranica `/admin/finansije` — P&L po mesecima, marže po kursevima, zarada po grupama (break-even), profesorke po neto doprinosu sa retencijom, i CRUD ručnih troškova (`expenses` tabela).

**Architecture:** Živ obračun bez snapshot tabela: server component dohvata sirove podatke (orders, lekcije/sesije, grupe, expenses) i prosleđuje ih čistoj funkciji `buildFinansije()` u `src/lib/finansije.ts` (TDD, bez I/O). Klijentska komponenta renderuje tabele i CRUD troškova preko `/api/admin/expenses` ruta.

**Tech Stack:** Next.js 16 (App Router, server components), Supabase (service-role), Tailwind, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-11-admin-finansije-design.md`

**Repo:** `/Users/natasahartweger/Documents/Claude/sajt/LMS/lms` — grana `main` (trunk-based, proveri `git branch --show-current` pre commita).

**VAŽNO za Next.js 16:** pre pisanja page/route koda pročitaj relevantne delove `node_modules/next/dist/docs/` (AGENTS.md upozorava da se konvencije razlikuju od training podataka). Minimum: `searchParams` i `params` su Promise — moraju `await`.

**Konvencije iz kodebaze:**
- Iznosi su **celi dinari (int)** — bez decimala (kao `orders.total`).
- Admin auth na API rutama: inline check kao u `src/app/api/admin/orders/route.ts:7-18`.
- Admin stranice: server component + `createAdminClient()` + client komponenta (šablon `src/app/admin/narudzbine/page.tsx`).
- Testovi: `src/lib/<ime>.test.ts`, pokretanje `npx vitest run src/lib/finansije.test.ts`.
- DDL na produkcijsku bazu: `node scripts/db-apply.mjs supabase/migrations/<fajl>.sql` (koristi `SUPABASE_ACCESS_TOKEN` iz `.env.local`).

---

### Task 1: Migracija 045 — `expenses` tabela + `cancelled_at`

**Files:**
- Create: `supabase/migrations/045_finansije.sql`

- [ ] **Step 1: Napiši migraciju**

```sql
-- 045: Finansije — expenses tabela (ručni troškovi) + cancelled_at na group_enrollments.

create table public.expenses (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text not null check (category in ('marketing','alati-hosting','provizije','materijali','ostalo')),
  amount       int  not null check (amount > 0),
  course_id    uuid references public.courses(id),
  expense_date date not null,
  recurring    boolean not null default false,
  ended_at     date,
  note         text,
  created_at   timestamptz not null default now()
);
create index idx_expenses_date on public.expenses(expense_date);

alter table public.expenses enable row level security;
-- App ide preko service-role API ruta; politika je za korisnički kontekst.
create policy "Admin manage expenses" on public.expenses
  for all using (
    (select role from public.user_profiles where id = auth.uid()) = 'admin'
  );

-- Datum ispisa iz grupe — do sada se beležio samo status, bez vremena.
alter table public.group_enrollments add column if not exists cancelled_at timestamptz;
```

- [ ] **Step 2: Primeni na produkcijsku bazu**

Run: `node scripts/db-apply.mjs supabase/migrations/045_finansije.sql`
Expected: `OK (200/201) — primenjeno: supabase/migrations/045_finansije.sql`

- [ ] **Step 3: Verifikuj da tabela postoji**

Napravi privremeni fajl `/tmp/check-expenses.sql` sa sadržajem:
```sql
select column_name from information_schema.columns where table_name = 'expenses' order by ordinal_position;
```
Run: `node scripts/db-apply.mjs /tmp/check-expenses.sql`
Expected: izlistane kolone `id, name, category, amount, course_id, expense_date, recurring, ended_at, note, created_at`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/045_finansije.sql
git commit -m "feat: expenses tabela + group_enrollments.cancelled_at (migracija 045)"
```

---

### Task 2: `lib/finansije.ts` — osnovni helperi (monthKey, kategorija, raspodela popusta)

**Files:**
- Create: `src/lib/finansije.ts`
- Test: `src/lib/finansije.test.ts`

- [ ] **Step 1: Napiši padajuće testove**

```typescript
// src/lib/finansije.test.ts
import { describe, it, expect } from "vitest";
import { monthKey, kategorijaForItem, allocateOrderTotal, type FinOrder } from "./finansije";

describe("monthKey", () => {
  it("vraća yyyy-mm iz ISO datuma", () => {
    expect(monthKey("2026-06-11")).toBe("2026-06");
    expect(monthKey("2026-06-11T14:30:00.000Z")).toBe("2026-06");
  });
});

describe("kategorijaForItem", () => {
  it("prepoznaje kategorije po slug-u", () => {
    expect(kategorijaForItem("video-a1", null)).toBe("video");
    expect(kategorijaForItem("grupni-a1", null)).toBe("grupni");
    expect(kategorijaForItem("paket-a1-a2", null)).toBe("paket");
  });
  it("koristi course_type kad slug nije prefiksiran", () => {
    expect(kategorijaForItem("nemacki-1na1-a1", "individual")).toBe("individualni");
    expect(kategorijaForItem("osnove-gramatike", "video")).toBe("video");
  });
  it("paket ima prednost nad course_type", () => {
    expect(kategorijaForItem("paket-a1-a2", "video")).toBe("paket");
  });
  it("nepoznato → ostalo", () => {
    expect(kategorijaForItem("nesto", null)).toBe("ostalo");
  });
});

describe("allocateOrderTotal", () => {
  const order = (total: number, prices: number[]): FinOrder => ({
    id: "o1", user_id: "u1", created_at: "2026-06-01T10:00:00Z", total,
    items: prices.map((p, i) => ({ course_id: `c${i}`, course_slug: `kurs-${i}`, title: `Kurs ${i}`, price: p })),
  });

  it("jedna stavka dobija ceo total (i kad postoji popust)", () => {
    expect(allocateOrderTotal(order(9000, [12000]))).toEqual([
      { course_id: "c0", course_slug: "kurs-0", amount: 9000 },
    ]);
  });
  it("popust se deli proporcionalno i zbir = total", () => {
    // 12000 + 6000 = 18000, total 9000 → pola: 6000 + 3000
    const a = allocateOrderTotal(order(9000, [12000, 6000]));
    expect(a.map((x) => x.amount)).toEqual([6000, 3000]);
    expect(a.reduce((s, x) => s + x.amount, 0)).toBe(9000);
  });
  it("zaokruživanje ne gubi dinar — poslednja stavka pokupi ostatak", () => {
    const a = allocateOrderTotal(order(10000, [3000, 3000, 3000]));
    expect(a.reduce((s, x) => s + x.amount, 0)).toBe(10000);
  });
  it("bez stavki → prazno; cene 0 → sve na prvu stavku", () => {
    expect(allocateOrderTotal(order(5000, []))).toEqual([]);
    expect(allocateOrderTotal(order(5000, [0, 0]))[0].amount).toBe(5000);
  });
});
```

- [ ] **Step 2: Pokreni — mora da padne**

Run: `npx vitest run src/lib/finansije.test.ts`
Expected: FAIL — `Cannot find module './finansije'` (ili slično)

- [ ] **Step 3: Implementiraj**

```typescript
// src/lib/finansije.ts — čiste funkcije za admin Finansije (P&L, marže, grupe, profesorke). Bez I/O.

export type Kategorija = "video" | "grupni" | "individualni" | "paket" | "ostalo";

export const KATEGORIJA_LABELS: Record<Kategorija, string> = {
  video: "Video kursevi",
  grupni: "Grupni kursevi",
  individualni: "Individualni kursevi",
  paket: "Paketi",
  ostalo: "Ostalo",
};

export const EXPENSE_CATEGORIES = ["marketing", "alati-hosting", "provizije", "materijali", "ostalo"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  marketing: "Marketing",
  "alati-hosting": "Alati i hosting",
  provizije: "Provizije",
  materijali: "Materijali",
  ostalo: "Ostalo",
};

export interface FinOrderItem { course_id: string; course_slug: string; title: string; price: number }
export interface FinOrder { id: string; user_id: string | null; created_at: string; total: number; items: FinOrderItem[] }
export interface Allocation { course_id: string; course_slug: string; amount: number }

/** "2026-06-11..." → "2026-06" */
export function monthKey(dateStr: string): string {
  return String(dateStr).slice(0, 7);
}

/** Kategorija stavke: prefiks slug-a, pa courses.course_type kao fallback. */
export function kategorijaForItem(slug: string, courseType: string | null | undefined): Kategorija {
  const s = String(slug ?? "");
  if (s.startsWith("paket")) return "paket";
  if (s.startsWith("grupni-") || courseType === "group") return "grupni";
  if (courseType === "individual") return "individualni";
  if (s.startsWith("video-") || courseType === "video") return "video";
  return "ostalo";
}

/**
 * Raspodela order.total na stavke proporcionalno cenama (popust se "razmaže").
 * Zbir iznosa je uvek tačno order.total (ostatak zaokruživanja ide na poslednju stavku).
 */
export function allocateOrderTotal(order: FinOrder): Allocation[] {
  const items = order.items ?? [];
  if (items.length === 0) return [];
  const sum = items.reduce((s, i) => s + (Number(i.price) || 0), 0);
  if (sum <= 0) {
    return items.map((it, i) => ({ course_id: it.course_id, course_slug: it.course_slug, amount: i === 0 ? order.total : 0 }));
  }
  const out: Allocation[] = [];
  let used = 0;
  for (let i = 0; i < items.length; i++) {
    const last = i === items.length - 1;
    const amount = last ? order.total - used : Math.round(((Number(items[i].price) || 0) / sum) * order.total);
    used += amount;
    out.push({ course_id: items[i].course_id, course_slug: items[i].course_slug, amount });
  }
  return out;
}
```

- [ ] **Step 4: Pokreni — mora da prođe**

Run: `npx vitest run src/lib/finansije.test.ts`
Expected: PASS (svi testovi)

- [ ] **Step 5: Commit**

```bash
git add src/lib/finansije.ts src/lib/finansije.test.ts
git commit -m "feat: finansije helperi — kategorije i proporcionalna raspodela popusta"
```

---

### Task 3: `expenseMonthsInYear` — širenje mesečnih troškova

**Files:**
- Modify: `src/lib/finansije.ts` (dodaj na kraj)
- Test: `src/lib/finansije.test.ts` (dodaj na kraj)

- [ ] **Step 1: Dodaj padajuće testove**

```typescript
import { expenseMonthsInYear, type ExpenseRow } from "./finansije";

describe("expenseMonthsInYear", () => {
  const base: ExpenseRow = {
    id: "e1", name: "Vercel", category: "alati-hosting", amount: 2500,
    course_id: null, expense_date: "2026-03-15", recurring: false, ended_at: null, note: null,
  };

  it("jednokratni pada samo u svoj mesec", () => {
    expect(expenseMonthsInYear(base, 2026, "2026-06")).toEqual([3]);
    expect(expenseMonthsInYear(base, 2025, "2026-06")).toEqual([]);
  });
  it("mesečni bez kraja važi od početka do tekućeg meseca", () => {
    const e = { ...base, recurring: true };
    expect(expenseMonthsInYear(e, 2026, "2026-06")).toEqual([3, 4, 5, 6]);
  });
  it("mesečni sa krajem staje u mesecu ended_at", () => {
    const e = { ...base, recurring: true, ended_at: "2026-05-01" };
    expect(expenseMonthsInYear(e, 2026, "2026-12")).toEqual([3, 4, 5]);
  });
  it("mesečni pokriva celu narednu godinu do tekućeg meseca", () => {
    const e = { ...base, expense_date: "2025-11-01", recurring: true };
    expect(expenseMonthsInYear(e, 2026, "2026-02")).toEqual([1, 2]);
  });
});
```

- [ ] **Step 2: Pokreni — novi testovi padaju**

Run: `npx vitest run src/lib/finansije.test.ts`
Expected: FAIL — `expenseMonthsInYear is not a function` (stari testovi i dalje prolaze)

- [ ] **Step 3: Implementiraj (dodaj u `src/lib/finansije.ts`)**

```typescript
export interface ExpenseRow {
  id: string; name: string; category: string; amount: number;
  course_id: string | null; expense_date: string; recurring: boolean;
  ended_at: string | null; note: string | null;
}

/** Meseci (1-12) date godine u kojima trošak važi. nowKey ("yyyy-mm") seče mesečne bez kraja. */
export function expenseMonthsInYear(e: ExpenseRow, year: number, nowKey: string): number[] {
  const startKey = monthKey(e.expense_date);
  if (!e.recurring) {
    return startKey.startsWith(`${year}-`) ? [Number(startKey.slice(5))] : [];
  }
  const endKey = e.ended_at ? monthKey(e.ended_at) : nowKey;
  const months: number[] = [];
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, "0")}`;
    if (key >= startKey && key <= endKey) months.push(m); // string poređenje radi za yyyy-mm
  }
  return months;
}
```

- [ ] **Step 4: Pokreni — prolazi**

Run: `npx vitest run src/lib/finansije.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/finansije.ts src/lib/finansije.test.ts
git commit -m "feat: širenje mesečnih troškova kroz godinu (expenseMonthsInYear)"
```

---

### Task 4: `buildFinansije` — P&L po mesecima + marže po kursevima

**Files:**
- Modify: `src/lib/finansije.ts`
- Test: `src/lib/finansije.test.ts`

- [ ] **Step 1: Dodaj tipove ulaza/izlaza u `src/lib/finansije.ts`**

```typescript
export interface CourseInfo { id: string; title: string; slug: string; course_type: string | null }
export interface ProfInfo { id: string; full_name: string | null; honorar_ind: number | null; honorar_grp: number | null }
export interface LessonRow { lesson_date: string; professor_id: string; course_id: string | null }
export interface SessionRow { session_date: string; professor_id: string | null; group_id: string; course_id: string | null }
export interface GroupInfo {
  id: string; level: string; status: string; max_seats: number;
  professor_id: string | null; purchasable_course_id: string | null; session_time: string | null;
}
export interface GroupMember { group_id: string; user_id: string; status: string }

export interface FinansijeInput {
  year: number;
  mesec: number | null;       // null = cela godina (filter za sekcije, P&L je uvek cela godina)
  nowKey: string;             // tekući "yyyy-mm", za mesečne troškove bez kraja
  orders: FinOrder[];         // SVE completed porudžbine (cela istorija — retencija)
  courses: CourseInfo[];
  professors: ProfInfo[];
  lessons: LessonRow[];       // course_id = individual_enrollments.course_id (spojeno na strani servera)
  sessions: SessionRow[];     // course_id = groups.purchasable_course_id (spojeno na strani servera)
  expenses: ExpenseRow[];
  indProfByOrderId: Record<string, string>;  // order_id → professor_id (iz individual_enrollments)
  indEnrollments: { professor_id: string | null; user_id: string; status: string }[];
  groups: GroupInfo[];
  groupMembers: GroupMember[]; // SVI (i cancelled — atribucija prihoda istorijskih članova)
}

export interface MonthRow {
  month: number;
  prihod: Record<Kategorija, number>; prihodUkupno: number;
  honorari: Record<string, number>; honorariUkupno: number;   // ključ = professor_id
  troskovi: Record<string, number>; troskoviUkupno: number;   // ključ = kategorija troška
  neto: number;
}
export interface CourseRow {
  course_id: string; title: string; kategorija: Kategorija;
  prihod: number; honorar: number; direktniTroskovi: number; marza: number; marzaPct: number | null;
}
export interface GroupRow {
  group_id: string; naziv: string; profesorka: string; status: string;
  clanovi: number; maxSeats: number; prihod: number; honorar: number;
  zarada: number; zaradaPoClanu: number;
}
export interface ProfRow {
  professor_id: string; ime: string; prihod: number; honorar: number; neto: number;
  aktivniPolaznici: number; retencijaMeseci: number | null;
}
export interface FinansijeData {
  months: MonthRow[];
  totals: { prihod: number; pending?: number; honorari: number; troskovi: number; rashodi: number; neto: number; marzaPct: number | null };
  kursevi: CourseRow[];
  opstiTroskovi: number;
  grupe: GroupRow[];
  profesorke: ProfRow[];
}
```

- [ ] **Step 2: Dodaj padajuće testove za P&L i kurseve**

Fixture je zajednički i za Task 5 — definiši ga na vrhu novog `describe` bloka:

```typescript
import { buildFinansije, type FinansijeInput } from "./finansije";

function fixture(overrides: Partial<FinansijeInput> = {}): FinansijeInput {
  return {
    year: 2026, mesec: null, nowKey: "2026-06",
    orders: [
      // jun: video kurs 9000 (Ana)
      { id: "o1", user_id: "ana", created_at: "2026-06-03T10:00:00Z", total: 9000,
        items: [{ course_id: "c-video", course_slug: "osnove-gramatike", title: "Gramatika", price: 9000 }] },
      // jun: grupni 6000 (Maja, članica grupe g1)
      { id: "o2", user_id: "maja", created_at: "2026-06-05T10:00:00Z", total: 6000,
        items: [{ course_id: "c-grupni", course_slug: "grupni-a1", title: "Grupni A1", price: 6000 }] },
      // maj: individualni 14000 (Ivan, prof Hristina)
      { id: "o3", user_id: "ivan", created_at: "2026-05-10T10:00:00Z", total: 14000,
        items: [{ course_id: "c-ind", course_slug: "nemacki-1na1-a1", title: "1:1 A1", price: 14000 }] },
      // jun: individualni obnova (Ivan, prof Hristina) — 2. mesec plaćanja → retencija 2
      { id: "o4", user_id: "ivan", created_at: "2026-06-10T10:00:00Z", total: 14000,
        items: [{ course_id: "c-ind", course_slug: "nemacki-1na1-a1", title: "1:1 A1", price: 14000 }] },
    ],
    courses: [
      { id: "c-video", title: "Gramatika", slug: "osnove-gramatike", course_type: "video" },
      { id: "c-grupni", title: "Grupni A1", slug: "grupni-a1", course_type: "group" },
      { id: "c-ind", title: "1:1 A1", slug: "nemacki-1na1-a1", course_type: "individual" },
    ],
    professors: [
      { id: "p-hristina", full_name: "Hristina", honorar_ind: 1400, honorar_grp: 1600 },
      { id: "p-katarina", full_name: "Katarina", honorar_ind: 1600, honorar_grp: 1800 },
    ],
    lessons: [
      { lesson_date: "2026-06-02", professor_id: "p-hristina", course_id: "c-ind" },
      { lesson_date: "2026-06-09", professor_id: "p-hristina", course_id: "c-ind" },
    ],
    sessions: [
      { session_date: "2026-06-04", professor_id: "p-katarina", group_id: "g1", course_id: "c-grupni" },
      { session_date: "2026-06-11", professor_id: "p-katarina", group_id: "g1", course_id: "c-grupni" },
    ],
    expenses: [
      { id: "e1", name: "Meta oglasi", category: "marketing", amount: 5000, course_id: null,
        expense_date: "2026-06-01", recurring: false, ended_at: null, note: null },
      { id: "e2", name: "Snimanje videa", category: "materijali", amount: 3000, course_id: "c-video",
        expense_date: "2026-06-01", recurring: false, ended_at: null, note: null },
    ],
    indProfByOrderId: { o3: "p-hristina", o4: "p-hristina" },
    indEnrollments: [{ professor_id: "p-hristina", user_id: "ivan", status: "active" }],
    groups: [{ id: "g1", level: "A1.1", status: "u_toku", max_seats: 6, professor_id: "p-katarina",
      purchasable_course_id: "c-grupni", session_time: "ut/čet 18h" }],
    groupMembers: [{ group_id: "g1", user_id: "maja", status: "active" }],
    ...overrides,
  };
}

describe("buildFinansije — P&L po mesecima", () => {
  it("prihod po kategoriji pada u pravi mesec", () => {
    const d = buildFinansije(fixture());
    const jun = d.months[5];
    expect(jun.prihod.video).toBe(9000);
    expect(jun.prihod.grupni).toBe(6000);
    expect(jun.prihod.individualni).toBe(14000);
    expect(jun.prihodUkupno).toBe(29000);
    expect(d.months[4].prihodUkupno).toBe(14000); // maj
  });
  it("honorari po profesorki: časovi × stopa", () => {
    const jun = buildFinansije(fixture()).months[5];
    expect(jun.honorari["p-hristina"]).toBe(2 * 1400);
    expect(jun.honorari["p-katarina"]).toBe(2 * 1600);
    expect(jun.honorariUkupno).toBe(2800 + 3200);
  });
  it("troškovi po kategoriji i neto", () => {
    const jun = buildFinansije(fixture()).months[5];
    expect(jun.troskovi.marketing).toBe(5000);
    expect(jun.troskovi.materijali).toBe(3000);
    expect(jun.neto).toBe(29000 - 6000 - 8000);
  });
  it("totals za celu godinu", () => {
    const d = buildFinansije(fixture());
    expect(d.totals.prihod).toBe(43000);
    expect(d.totals.honorari).toBe(6000);
    expect(d.totals.troskovi).toBe(8000);
    expect(d.totals.neto).toBe(43000 - 14000);
    expect(d.totals.marzaPct).toBe(Math.round(((43000 - 14000) / 43000) * 100));
  });
  it("porudžbine van godine ne ulaze u months", () => {
    const f = fixture();
    f.orders.push({ id: "o5", user_id: "x", created_at: "2025-12-01T10:00:00Z", total: 99999,
      items: [{ course_id: "c-video", course_slug: "osnove-gramatike", title: "G", price: 99999 }] });
    expect(buildFinansije(f).totals.prihod).toBe(43000);
  });
});

describe("buildFinansije — marže po kursevima", () => {
  it("kurs: prihod − honorar − direktni troškovi", () => {
    const d = buildFinansije(fixture());
    const video = d.kursevi.find((k) => k.course_id === "c-video")!;
    expect(video.prihod).toBe(9000);
    expect(video.honorar).toBe(0);
    expect(video.direktniTroskovi).toBe(3000);
    expect(video.marza).toBe(6000);
    const ind = d.kursevi.find((k) => k.course_id === "c-ind")!;
    expect(ind.prihod).toBe(28000);
    expect(ind.honorar).toBe(2800);
    expect(ind.marza).toBe(25200);
  });
  it("opšti troškovi = nealocirani; kursevi sortirani po marži", () => {
    const d = buildFinansije(fixture());
    expect(d.opstiTroskovi).toBe(5000);
    const marze = d.kursevi.map((k) => k.marza);
    expect([...marze].sort((a, b) => b - a)).toEqual(marze);
  });
  it("mesec filter sužava sekcije, ali ne P&L", () => {
    const d = buildFinansije(fixture({ mesec: 5 })); // samo maj
    const ind = d.kursevi.find((k) => k.course_id === "c-ind")!;
    expect(ind.prihod).toBe(14000);  // samo majska porudžbina
    expect(ind.honorar).toBe(0);     // junski časovi ispadaju
    expect(d.months[5].prihodUkupno).toBe(29000); // P&L i dalje cela godina
  });
});
```

- [ ] **Step 3: Pokreni — novi testovi padaju**

Run: `npx vitest run src/lib/finansije.test.ts`
Expected: FAIL — `buildFinansije is not a function`

- [ ] **Step 4: Implementiraj `buildFinansije` (P&L + kursevi; grupe/profesorke prazno za sada)**

```typescript
function emptyKategorije(): Record<Kategorija, number> {
  return { video: 0, grupni: 0, individualni: 0, paket: 0, ostalo: 0 };
}

/** Da li datum upada u izabrani period (godina + opcioni mesec). */
function inPeriod(dateStr: string, year: number, mesec: number | null): boolean {
  const key = monthKey(dateStr);
  if (!key.startsWith(`${year}-`)) return false;
  return mesec === null || Number(key.slice(5)) === mesec;
}

export function buildFinansije(input: FinansijeInput): FinansijeData {
  const courseById = new Map(input.courses.map((c) => [c.id, c]));
  const profById = new Map(input.professors.map((p) => [p.id, p]));
  const rateInd = (pid: string) => profById.get(pid)?.honorar_ind ?? 0;
  const rateGrp = (pid: string | null) => (pid ? profById.get(pid)?.honorar_grp ?? 0 : 0);

  // ---------- P&L po mesecima (uvek cela godina) ----------
  const months: MonthRow[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1, prihod: emptyKategorije(), prihodUkupno: 0,
    honorari: {}, honorariUkupno: 0, troskovi: {}, troskoviUkupno: 0, neto: 0,
  }));
  const monthOf = (dateStr: string): MonthRow | null => {
    const key = monthKey(dateStr);
    return key.startsWith(`${input.year}-`) ? months[Number(key.slice(5)) - 1] : null;
  };

  for (const o of input.orders) {
    const mo = monthOf(o.created_at);
    if (!mo) continue;
    for (const a of allocateOrderTotal(o)) {
      const cat = kategorijaForItem(a.course_slug, courseById.get(a.course_id)?.course_type);
      mo.prihod[cat] += a.amount;
      mo.prihodUkupno += a.amount;
    }
  }
  for (const l of input.lessons) {
    const mo = monthOf(l.lesson_date);
    if (!mo) continue;
    const h = rateInd(l.professor_id);
    mo.honorari[l.professor_id] = (mo.honorari[l.professor_id] ?? 0) + h;
    mo.honorariUkupno += h;
  }
  for (const s of input.sessions) {
    const mo = monthOf(s.session_date);
    if (!mo || !s.professor_id) continue;
    const h = rateGrp(s.professor_id);
    mo.honorari[s.professor_id] = (mo.honorari[s.professor_id] ?? 0) + h;
    mo.honorariUkupno += h;
  }
  for (const e of input.expenses) {
    for (const m of expenseMonthsInYear(e, input.year, input.nowKey)) {
      const mo = months[m - 1];
      mo.troskovi[e.category] = (mo.troskovi[e.category] ?? 0) + e.amount;
      mo.troskoviUkupno += e.amount;
    }
  }
  for (const mo of months) mo.neto = mo.prihodUkupno - mo.honorariUkupno - mo.troskoviUkupno;

  const totals = months.reduce(
    (t, mo) => ({ ...t, prihod: t.prihod + mo.prihodUkupno, honorari: t.honorari + mo.honorariUkupno, troskovi: t.troskovi + mo.troskoviUkupno }),
    { prihod: 0, honorari: 0, troskovi: 0, rashodi: 0, neto: 0, marzaPct: null as number | null }
  );
  totals.rashodi = totals.honorari + totals.troskovi;
  totals.neto = totals.prihod - totals.rashodi;
  totals.marzaPct = totals.prihod > 0 ? Math.round((totals.neto / totals.prihod) * 100) : null;

  // ---------- Sekcije (poštuju mesec filter) ----------
  const inSel = (d: string) => inPeriod(d, input.year, input.mesec);

  const courseAgg = new Map<string, { prihod: number; honorar: number; trosak: number }>();
  const bump = (id: string, field: "prihod" | "honorar" | "trosak", amt: number) => {
    const row = courseAgg.get(id) ?? { prihod: 0, honorar: 0, trosak: 0 };
    row[field] += amt;
    courseAgg.set(id, row);
  };
  for (const o of input.orders) {
    if (!inSel(o.created_at)) continue;
    for (const a of allocateOrderTotal(o)) bump(a.course_id, "prihod", a.amount);
  }
  for (const l of input.lessons) {
    if (!inSel(l.lesson_date) || !l.course_id) continue;
    bump(l.course_id, "honorar", rateInd(l.professor_id));
  }
  for (const s of input.sessions) {
    if (!inSel(s.session_date) || !s.course_id) continue;
    bump(s.course_id, "honorar", rateGrp(s.professor_id));
  }
  let opstiTroskovi = 0;
  for (const e of input.expenses) {
    const meseci = expenseMonthsInYear(e, input.year, input.nowKey)
      .filter((m) => input.mesec === null || m === input.mesec);
    const iznos = meseci.length * e.amount;
    if (iznos === 0) continue;
    if (e.course_id) bump(e.course_id, "trosak", iznos);
    else opstiTroskovi += iznos;
  }

  const kursevi: CourseRow[] = [...courseAgg.entries()].map(([id, agg]) => {
    const c = courseById.get(id);
    const marza = agg.prihod - agg.honorar - agg.trosak;
    return {
      course_id: id,
      title: c?.title ?? id,
      kategorija: kategorijaForItem(c?.slug ?? "", c?.course_type),
      prihod: agg.prihod, honorar: agg.honorar, direktniTroskovi: agg.trosak,
      marza, marzaPct: agg.prihod > 0 ? Math.round((marza / agg.prihod) * 100) : null,
    };
  }).sort((a, b) => b.marza - a.marza);

  return { months, totals, kursevi, opstiTroskovi, grupe: [], profesorke: [] };
}
```

- [ ] **Step 5: Pokreni — prolazi**

Run: `npx vitest run src/lib/finansije.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/finansije.ts src/lib/finansije.test.ts
git commit -m "feat: buildFinansije — P&L po mesecima i marže po kursevima"
```

---

### Task 5: `buildFinansije` — grupe (break-even) i profesorke (neto + retencija)

**Files:**
- Modify: `src/lib/finansije.ts`
- Test: `src/lib/finansije.test.ts`

- [ ] **Step 1: Dodaj padajuće testove**

```typescript
describe("buildFinansije — grupe", () => {
  it("zarada grupe = prihod članova − sesije × stopa", () => {
    const d = buildFinansije(fixture());
    const g = d.grupe.find((x) => x.group_id === "g1")!;
    expect(g.clanovi).toBe(1);
    expect(g.maxSeats).toBe(6);
    expect(g.prihod).toBe(6000);          // Majina porudžbina
    expect(g.honorar).toBe(2 * 1600);     // 2 sesije × Katarina grp stopa
    expect(g.zarada).toBe(6000 - 3200);
    expect(g.zaradaPoClanu).toBe(2800);
    expect(g.profesorka).toBe("Katarina");
  });
  it("grupa ispod break-even ima negativnu zaradu", () => {
    const f = fixture();
    f.orders = f.orders.filter((o) => o.id !== "o2"); // bez Majine uplate
    const g = buildFinansije(f).grupe.find((x) => x.group_id === "g1")!;
    expect(g.prihod).toBe(0);
    expect(g.zarada).toBe(-3200);
  });
});

describe("buildFinansije — profesorke", () => {
  it("prihod profesorke: individualni preko order→enrollment, grupni preko njenih grupa", () => {
    const d = buildFinansije(fixture());
    const hristina = d.profesorke.find((p) => p.professor_id === "p-hristina")!;
    expect(hristina.prihod).toBe(14000);  // junska Ivanova obnova (majska ispada iz... pažnja: mesec=null → cela 2026 → obe = 28000)
    const katarina = d.profesorke.find((p) => p.professor_id === "p-katarina")!;
    expect(katarina.prihod).toBe(6000);   // Majina grupna uplata
    expect(katarina.honorar).toBe(3200);
    expect(katarina.neto).toBe(2800);
  });
  it("sortirane po neto doprinosu", () => {
    const neto = buildFinansije(fixture()).profesorke.map((p) => p.neto);
    expect([...neto].sort((a, b) => b - a)).toEqual(neto);
  });
  it("retencija = prosek različitih meseci plaćanja po polazniku (cela istorija)", () => {
    const d = buildFinansije(fixture());
    const hristina = d.profesorke.find((p) => p.professor_id === "p-hristina")!;
    expect(hristina.retencijaMeseci).toBe(2);  // Ivan: maj + jun
    const katarina = d.profesorke.find((p) => p.professor_id === "p-katarina")!;
    expect(katarina.retencijaMeseci).toBe(1);  // Maja: samo jun
  });
  it("aktivni polaznici: ind enrollment active + grupni active članovi", () => {
    const d = buildFinansije(fixture());
    expect(d.profesorke.find((p) => p.professor_id === "p-hristina")!.aktivniPolaznici).toBe(1);
    expect(d.profesorke.find((p) => p.professor_id === "p-katarina")!.aktivniPolaznici).toBe(1);
  });
});
```

**Pažnja na prvi test:** Hristinin prihod sa `mesec: null` je **28000** (obe Ivanove porudžbine u 2026) — ispravi expect na `28000` pri pisanju, komentar iznad je podsetnik.

- [ ] **Step 2: Pokreni — novi testovi padaju**

Run: `npx vitest run src/lib/finansije.test.ts`
Expected: FAIL — `d.grupe.find(...)` je undefined (grupe su prazan niz)

- [ ] **Step 3: Implementiraj — zameni `return { months, totals, kursevi, opstiTroskovi, grupe: [], profesorke: [] };` sledećim blokom**

```typescript
  // ---------- Atribucija uplata profesorkama (i grupama) ----------
  // Individualne: order_id → professor_id (individual_enrollments).
  // Grupne: stavka grupnog kursa → grupa u kojoj je kupac član → profesorka grupe.
  const memberGroups = new Map<string, string[]>(); // user_id → group_id[]
  for (const gm of input.groupMembers) {
    memberGroups.set(gm.user_id, [...(memberGroups.get(gm.user_id) ?? []), gm.group_id]);
  }
  const groupById = new Map(input.groups.map((g) => [g.id, g]));

  interface ProfPayment { professor_id: string; user_id: string; amount: number; month: string; group_id: string | null }
  const allPayments: ProfPayment[] = []; // cela istorija — za retenciju
  for (const o of input.orders) {
    if (!o.user_id) continue;
    const indProf = input.indProfByOrderId[o.id];
    for (const a of allocateOrderTotal(o)) {
      const cat = kategorijaForItem(a.course_slug, courseById.get(a.course_id)?.course_type);
      if (cat === "individualni" && indProf) {
        allPayments.push({ professor_id: indProf, user_id: o.user_id, amount: a.amount, month: monthKey(o.created_at), group_id: null });
      } else if (cat === "grupni") {
        const gid = (memberGroups.get(o.user_id) ?? []).find((g) => groupById.get(g)?.purchasable_course_id === a.course_id);
        const prof = gid ? groupById.get(gid)?.professor_id : null;
        if (gid && prof) {
          allPayments.push({ professor_id: prof, user_id: o.user_id, amount: a.amount, month: monthKey(o.created_at), group_id: gid });
        }
      }
    }
  }
  const selPayments = allPayments.filter((p) => {
    if (!p.month.startsWith(`${input.year}-`)) return false;
    return input.mesec === null || Number(p.month.slice(5)) === input.mesec;
  });

  // ---------- Grupe ----------
  const grupe: GroupRow[] = input.groups.map((g) => {
    const clanovi = input.groupMembers.filter((m) => m.group_id === g.id && m.status === "active").length;
    const prihod = selPayments.filter((p) => p.group_id === g.id).reduce((s, p) => s + p.amount, 0);
    const honorar = input.sessions
      .filter((s) => s.group_id === g.id && inSel(s.session_date))
      .reduce((s2, s) => s2 + rateGrp(s.professor_id), 0);
    const zarada = prihod - honorar;
    return {
      group_id: g.id,
      naziv: g.session_time ? `${g.level} · ${g.session_time}` : g.level,
      profesorka: (g.professor_id && profById.get(g.professor_id)?.full_name) || "—",
      status: g.status, clanovi, maxSeats: g.max_seats, prihod, honorar,
      zarada, zaradaPoClanu: clanovi > 0 ? Math.round(zarada / clanovi) : zarada,
    };
  }).filter((g) => g.prihod !== 0 || g.honorar !== 0 || g.status === "u_toku" || g.status === "otvoren")
    .sort((a, b) => a.zarada - b.zarada); // najgore prve — to admin treba da vidi

  // ---------- Profesorke ----------
  const profesorke: ProfRow[] = input.professors.map((p) => {
    const prihod = selPayments.filter((x) => x.professor_id === p.id).reduce((s, x) => s + x.amount, 0);
    const honorar =
      input.lessons.filter((l) => l.professor_id === p.id && inSel(l.lesson_date)).length * (p.honorar_ind ?? 0) +
      input.sessions.filter((s) => s.professor_id === p.id && inSel(s.session_date)).length * (p.honorar_grp ?? 0);
    const aktivniInd = new Set(input.indEnrollments.filter((e) => e.professor_id === p.id && e.status === "active").map((e) => e.user_id));
    const njeneGrupe = new Set(input.groups.filter((g) => g.professor_id === p.id).map((g) => g.id));
    const aktivniGrp = new Set(input.groupMembers.filter((m) => njeneGrupe.has(m.group_id) && m.status === "active").map((m) => m.user_id));
    const aktivni = new Set([...aktivniInd, ...aktivniGrp]).size;

    // Retencija: po polazniku broj RAZLIČITIH meseci sa uplatom (cela istorija), pa prosek.
    const mesecePoPolazniku = new Map<string, Set<string>>();
    for (const pay of allPayments) {
      if (pay.professor_id !== p.id) continue;
      mesecePoPolazniku.set(pay.user_id, (mesecePoPolazniku.get(pay.user_id) ?? new Set()).add(pay.month));
    }
    const brojevi = [...mesecePoPolazniku.values()].map((s) => s.size);
    const retencija = brojevi.length > 0
      ? Math.round((brojevi.reduce((a, b) => a + b, 0) / brojevi.length) * 10) / 10
      : null;

    return { professor_id: p.id, ime: p.full_name ?? "—", prihod, honorar, neto: prihod - honorar, aktivniPolaznici: aktivni, retencijaMeseci: retencija };
  }).filter((p) => p.prihod !== 0 || p.honorar !== 0 || p.aktivniPolaznici > 0)
    .sort((a, b) => b.neto - a.neto);

  return { months, totals, kursevi, opstiTroskovi, grupe, profesorke };
```

- [ ] **Step 4: Pokreni — prolazi (ispravi expect 14000→28000 ako test pao na tome)**

Run: `npx vitest run src/lib/finansije.test.ts`
Expected: PASS

- [ ] **Step 5: Pokreni ceo test suite (regresija)**

Run: `npx vitest run`
Expected: PASS — svi postojeći testovi i dalje zeleni

- [ ] **Step 6: Commit**

```bash
git add src/lib/finansije.ts src/lib/finansije.test.ts
git commit -m "feat: buildFinansije — zarada po grupama, profesorke sa retencijom"
```

---

### Task 6: API rute za troškove — `/api/admin/expenses`

**Files:**
- Create: `src/app/api/admin/expenses/route.ts`
- Create: `src/app/api/admin/expenses/[id]/route.ts`

- [ ] **Step 1: Napiši `src/app/api/admin/expenses/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EXPENSE_CATEGORIES } from "@/lib/finansije";

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
  const { data, error } = await admin.from("expenses").select("*").order("expense_date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expenses: data });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json();
  const { name, category, amount, course_id, expense_date, recurring, ended_at, note } = body;

  if (!name || !category || !expense_date) {
    return NextResponse.json({ error: "Naziv, kategorija i datum su obavezni." }, { status: 400 });
  }
  if (!(EXPENSE_CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: "Nepoznata kategorija." }, { status: 400 });
  }
  const iznos = Math.round(Number(amount));
  if (!Number.isFinite(iznos) || iznos <= 0) {
    return NextResponse.json({ error: "Iznos mora biti broj veći od 0." }, { status: 400 });
  }

  const { data, error } = await admin.from("expenses").insert({
    name, category, amount: iznos,
    course_id: course_id || null,
    expense_date,
    recurring: Boolean(recurring),
    ended_at: ended_at || null,
    note: note || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expense: data });
}
```

- [ ] **Step 2: Napiši `src/app/api/admin/expenses/[id]/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EXPENSE_CATEGORIES } from "@/lib/finansije";

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

  const body = await request.json();
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.category !== undefined) {
    if (!(EXPENSE_CATEGORIES as readonly string[]).includes(body.category)) {
      return NextResponse.json({ error: "Nepoznata kategorija." }, { status: 400 });
    }
    patch.category = body.category;
  }
  if (body.amount !== undefined) {
    const iznos = Math.round(Number(body.amount));
    if (!Number.isFinite(iznos) || iznos <= 0) {
      return NextResponse.json({ error: "Iznos mora biti broj veći od 0." }, { status: 400 });
    }
    patch.amount = iznos;
  }
  if (body.course_id !== undefined) patch.course_id = body.course_id || null;
  if (body.expense_date !== undefined) patch.expense_date = body.expense_date;
  if (body.recurring !== undefined) patch.recurring = Boolean(body.recurring);
  if (body.ended_at !== undefined) patch.ended_at = body.ended_at || null;
  if (body.note !== undefined) patch.note = body.note || null;

  const { data, error } = await admin.from("expenses").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expense: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const { error } = await admin.from("expenses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Proveri da se kompajlira**

Run: `npx tsc --noEmit`
Expected: bez grešaka (ili samo postojeće, nove ne sme da bude)

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/expenses
git commit -m "feat: API rute za troškove (expenses CRUD)"
```

---

### Task 7: `cancelled_at` pri ispisu iz grupe

**Files:**
- Modify: `src/app/api/admin/grupe/[id]/nova-generacija/route.ts:47`
- Modify: `src/app/api/admin/grupe/[id]/enroll/route.ts:62`

- [ ] **Step 1: U `nova-generacija/route.ts` (linija ~47) zameni**

```typescript
await admin.from("group_enrollments").update({ status: "cancelled" }).eq("group_id", id).eq("status", "active");
```

sa:

```typescript
await admin.from("group_enrollments").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("group_id", id).eq("status", "active");
```

- [ ] **Step 2: U `enroll/route.ts` (linija ~62) zameni**

```typescript
.update({ status: "cancelled" }).eq("group_id", groupId).eq("user_id", userId);
```

sa:

```typescript
.update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("group_id", groupId).eq("user_id", userId);
```

(Prvo pročitaj oba fajla — ako u međuvremenu ima još mesta koja postavljaju `status: "cancelled"` na `group_enrollments`, ažuriraj i njih: `grep -rn '"cancelled"' src/ | grep group_enrollments`.)

- [ ] **Step 3: Kompajliranje**

Run: `npx tsc --noEmit`
Expected: bez novih grešaka

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/grupe
git commit -m "feat: beleži cancelled_at pri ispisu iz grupe"
```

---

### Task 8: Server stranica `/admin/finansije`

**Files:**
- Create: `src/app/admin/finansije/page.tsx`

- [ ] **Step 1: Napiši stranicu**

```tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { buildFinansije, monthKey, type ExpenseRow, type FinOrder } from "@/lib/finansije";
import FinansijeClient from "./FinansijeClient";

export const dynamic = "force-dynamic";

export default async function AdminFinansijePage({
  searchParams,
}: {
  searchParams: Promise<{ godina?: string; mesec?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.godina) || now.getFullYear();
  const mesec = sp.mesec ? Number(sp.mesec) || null : null;

  const admin = createAdminClient();
  const [ordersRes, coursesRes, profsRes, lessonsRes, sessionsRes, expensesRes, indEnrRes, groupsRes, membersRes] =
    await Promise.all([
      admin.from("orders").select("id, user_id, created_at, total, items, payment_status"),
      admin.from("courses").select("id, title, slug, course_type"),
      admin.from("user_profiles").select("id, full_name, honorar_ind, honorar_grp").eq("role", "professor"),
      admin.from("individual_lessons").select("lesson_date, professor_id, enrollment_id"),
      admin.from("group_sessions").select("session_date, professor_id, group_id"),
      admin.from("expenses").select("*").order("expense_date", { ascending: false }),
      admin.from("individual_enrollments").select("id, user_id, professor_id, order_id, course_id, status"),
      admin.from("groups").select("id, level, status, max_seats, professor_id, purchasable_course_id, session_time"),
      admin.from("group_enrollments").select("group_id, user_id, status"),
    ]);

  const allOrders = ordersRes.data ?? [];
  const completed: FinOrder[] = allOrders
    .filter((o) => o.payment_status === "completed")
    .map((o) => ({ id: o.id, user_id: o.user_id, created_at: o.created_at, total: Number(o.total) || 0, items: o.items ?? [] }));
  const pendingTotal = allOrders
    .filter((o) => o.payment_status === "pending" && monthKey(o.created_at).startsWith(`${year}-`))
    .reduce((s, o) => s + (Number(o.total) || 0), 0);

  // Spajanja za čistu funkciju: lekcija → kurs (preko enrollmenta), sesija → kupovni kurs (preko grupe)
  const enrollments = indEnrRes.data ?? [];
  const enrById = new Map(enrollments.map((e) => [e.id, e]));
  const groups = groupsRes.data ?? [];
  const groupById = new Map(groups.map((g) => [g.id, g]));

  const lessons = (lessonsRes.data ?? []).map((l) => ({
    lesson_date: l.lesson_date,
    professor_id: l.professor_id,
    course_id: enrById.get(l.enrollment_id)?.course_id ?? null,
  }));
  const sessions = (sessionsRes.data ?? []).map((s) => ({
    session_date: s.session_date,
    professor_id: s.professor_id,
    group_id: s.group_id,
    course_id: groupById.get(s.group_id)?.purchasable_course_id ?? null,
  }));
  const indProfByOrderId: Record<string, string> = {};
  for (const e of enrollments) if (e.order_id && e.professor_id) indProfByOrderId[e.order_id] = e.professor_id;

  const data = buildFinansije({
    year, mesec,
    nowKey: monthKey(now.toISOString()),
    orders: completed,
    courses: coursesRes.data ?? [],
    professors: profsRes.data ?? [],
    lessons, sessions,
    expenses: (expensesRes.data ?? []) as ExpenseRow[],
    indProfByOrderId,
    indEnrollments: enrollments.map((e) => ({ professor_id: e.professor_id, user_id: e.user_id, status: e.status })),
    groups,
    groupMembers: membersRes.data ?? [],
  });

  const profName: Record<string, string> = Object.fromEntries(
    (profsRes.data ?? []).map((p) => [p.id, p.full_name ?? "—"])
  );
  const courseOptions = (coursesRes.data ?? [])
    .map((c) => ({ id: c.id, title: c.title }))
    .sort((a, b) => a.title.localeCompare(b.title, "sr"));

  return (
    <FinansijeClient
      data={data}
      year={year}
      mesec={mesec}
      pendingTotal={pendingTotal}
      profName={profName}
      expenses={(expensesRes.data ?? []) as ExpenseRow[]}
      courseOptions={courseOptions}
    />
  );
}
```

- [ ] **Step 2: Kompajliranje (FinansijeClient još ne postoji — pravi se u Task 9, pa je OK da ovde pukne na importu; ako radiš taskove redom, ovaj step uradi posle Task 9)**

Run: `npx tsc --noEmit`
Expected: jedina nova greška je nepostojeći `./FinansijeClient` (nestaje posle Task 9)

- [ ] **Step 3: Commit (zajedno sa Task 9)**

---

### Task 9: `FinansijeClient.tsx` — UI

**Files:**
- Create: `src/app/admin/finansije/FinansijeClient.tsx`

- [ ] **Step 1: Napiši komponentu**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  KATEGORIJA_LABELS, EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, MESECI_KRATKO,
  type FinansijeData, type ExpenseRow, type Kategorija, type ExpenseCategory,
} from "@/lib/finansije";

function din(n: number): string {
  return `${Math.round(n).toLocaleString("sr-RS")} din`;
}

const KATEGORIJE: Kategorija[] = ["video", "grupni", "individualni", "paket", "ostalo"];

interface Props {
  data: FinansijeData;
  year: number;
  mesec: number | null;
  pendingTotal: number;
  profName: Record<string, string>;
  expenses: ExpenseRow[];
  courseOptions: { id: string; title: string }[];
}

export default function FinansijeClient({ data, year, mesec, pendingTotal, profName, expenses, courseOptions }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const periodLabel = mesec ? `${MESECI_KRATKO[mesec - 1]} ${year}.` : `${year}.`;

  // Filter promene idu kroz URL — server preračuna.
  function setPeriod(g: number, m: number | null) {
    const p = new URLSearchParams({ godina: String(g) });
    if (m) p.set("mesec", String(m));
    router.push(`/admin/finansije?${p.toString()}`);
  }

  async function saveExpense(form: FormData) {
    setSaving(true); setErr("");
    const body = {
      name: form.get("name"),
      category: form.get("category"),
      amount: form.get("amount"),
      course_id: form.get("course_id") || null,
      expense_date: form.get("expense_date"),
      recurring: form.get("recurring") === "on",
      ended_at: form.get("ended_at") || null,
      note: form.get("note") || null,
    };
    const res = await fetch(editing ? `/api/admin/expenses/${editing.id}` : "/api/admin/expenses", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) { setErr((await res.json()).error ?? "Greška pri čuvanju."); return; }
    setModalOpen(false); setEditing(null);
    router.refresh();
  }

  async function deleteExpense(id: string) {
    if (!confirm("Obrisati ovaj trošak?")) return;
    const res = await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  // Period filter za listu troškova (prikaz onih koji važe u izabranom periodu)
  const visibleExpenses = expenses.filter((e) => {
    const start = e.expense_date.slice(0, 7);
    if (!e.recurring) {
      return mesec
        ? start === `${year}-${String(mesec).padStart(2, "0")}`
        : start.startsWith(`${year}-`);
    }
    const end = e.ended_at ? e.ended_at.slice(0, 7) : "9999-12";
    const from = mesec ? `${year}-${String(mesec).padStart(2, "0")}` : `${year}-01`;
    const to = mesec ? from : `${year}-12`;
    return start <= to && end >= from;
  });

  const aktivniMeseci = data.months.filter((m) => m.prihodUkupno || m.honorariUkupno || m.troskoviUkupno);
  const honorarProfIds = [...new Set(data.months.flatMap((m) => Object.keys(m.honorari)))];
  const trosakKategorije = [...new Set(data.months.flatMap((m) => Object.keys(m.troskovi)))];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Finansije</h1>
        <div className="flex gap-2">
          <select value={year} onChange={(e) => setPeriod(Number(e.target.value), mesec)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
            {[year - 1, year, year + 1].filter((g) => g >= 2026).map((g) => <option key={g} value={g}>{g}.</option>)}
          </select>
          <select value={mesec ?? ""} onChange={(e) => setPeriod(year, e.target.value ? Number(e.target.value) : null)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">Cela godina</option>
            {MESECI_KRATKO.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Kartice — za izabrani period (mesec filter utiče preko sekcijskih suma) */}
      <PeriodCards data={data} mesec={mesec} pendingTotal={pendingTotal} periodLabel={periodLabel} />

      {/* P&L po mesecima — uvek cela godina */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 overflow-x-auto">
        <h2 className="font-semibold mb-3">Pregled po mesecima — {year}.</h2>
        <table className="text-sm w-full min-w-[900px]">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="py-1 pr-3 font-medium"></th>
              {aktivniMeseci.map((m) => <th key={m.month} className="py-1 px-2 text-right font-medium">{MESECI_KRATKO[m.month - 1]}</th>)}
              <th className="py-1 pl-3 text-right font-semibold text-gray-600">Ukupno</th>
            </tr>
          </thead>
          <tbody>
            {KATEGORIJE.filter((k) => data.months.some((m) => m.prihod[k])).map((k) => (
              <Row key={k} label={KATEGORIJA_LABELS[k]} cells={aktivniMeseci.map((m) => m.prihod[k])} indent />
            ))}
            <Row label="Prihod" cells={aktivniMeseci.map((m) => m.prihodUkupno)} bold />
            {honorarProfIds.map((pid) => (
              <Row key={pid} label={profName[pid] ?? pid} cells={aktivniMeseci.map((m) => -(m.honorari[pid] ?? 0))} indent negative />
            ))}
            <Row label="Honorari" cells={aktivniMeseci.map((m) => -m.honorariUkupno)} bold negative />
            {trosakKategorije.map((cat) => (
              <Row key={cat} label={EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory] ?? cat} cells={aktivniMeseci.map((m) => -(m.troskovi[cat] ?? 0))} indent negative />
            ))}
            <Row label="Troškovi" cells={aktivniMeseci.map((m) => -m.troskoviUkupno)} bold negative />
            <tr className="border-t-2 border-gray-200">
              <td className="py-2 pr-3 font-bold">Neto zarada</td>
              {aktivniMeseci.map((m) => (
                <td key={m.month} className={`py-2 px-2 text-right font-bold ${m.neto < 0 ? "text-red-600" : "text-green-700"}`}>{din(m.neto)}</td>
              ))}
              <td className={`py-2 pl-3 text-right font-bold ${data.totals.neto < 0 ? "text-red-600" : "text-green-700"}`}>{din(data.totals.neto)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Marže po kursevima */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 overflow-x-auto">
        <h2 className="font-semibold mb-3">Marže po kursevima — {periodLabel}</h2>
        <table className="text-sm w-full min-w-[700px]">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="py-1 pr-3 font-medium">Kurs</th><th className="py-1 px-2 font-medium">Tip</th>
              <th className="py-1 px-2 text-right font-medium">Prihod</th><th className="py-1 px-2 text-right font-medium">Honorari</th>
              <th className="py-1 px-2 text-right font-medium">Troškovi</th><th className="py-1 px-2 text-right font-medium">Marža</th>
              <th className="py-1 pl-2 text-right font-medium">%</th>
            </tr>
          </thead>
          <tbody>
            {data.kursevi.map((k) => (
              <tr key={k.course_id} className="border-t border-gray-50">
                <td className="py-2 pr-3">{k.title}</td>
                <td className="py-2 px-2 text-gray-500">{KATEGORIJA_LABELS[k.kategorija]}</td>
                <td className="py-2 px-2 text-right">{din(k.prihod)}</td>
                <td className="py-2 px-2 text-right">{k.honorar ? `−${din(k.honorar)}` : "—"}</td>
                <td className="py-2 px-2 text-right">{k.direktniTroskovi ? `−${din(k.direktniTroskovi)}` : "—"}</td>
                <td className={`py-2 px-2 text-right font-semibold ${k.marza < 0 ? "text-red-600" : ""}`}>{din(k.marza)}</td>
                <td className="py-2 pl-2 text-right text-gray-500">{k.marzaPct !== null ? `${k.marzaPct}%` : "—"}</td>
              </tr>
            ))}
            <tr className="border-t border-gray-200">
              <td className="py-2 pr-3 text-gray-500" colSpan={5}>Opšti troškovi (nealocirani)</td>
              <td className="py-2 px-2 text-right text-red-600">−{din(data.opstiTroskovi)}</td><td />
            </tr>
          </tbody>
        </table>
      </section>

      {/* Po grupama */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 overflow-x-auto">
        <h2 className="font-semibold mb-1">Po grupama — {periodLabel}</h2>
        <p className="text-xs text-gray-400 mb-3">Crveno = grupa ispod break-even tačke (honorar veći od prihoda u periodu).</p>
        <table className="text-sm w-full min-w-[700px]">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="py-1 pr-3 font-medium">Grupa</th><th className="py-1 px-2 font-medium">Profesorka</th>
              <th className="py-1 px-2 font-medium">Status</th><th className="py-1 px-2 text-center font-medium">Popunjenost</th>
              <th className="py-1 px-2 text-right font-medium">Prihod</th><th className="py-1 px-2 text-right font-medium">Honorar</th>
              <th className="py-1 px-2 text-right font-medium">Zarada</th><th className="py-1 pl-2 text-right font-medium">Po članu</th>
            </tr>
          </thead>
          <tbody>
            {data.grupe.map((g) => (
              <tr key={g.group_id} className={`border-t border-gray-50 ${g.zarada < 0 ? "bg-red-50" : ""}`}>
                <td className="py-2 pr-3">{g.naziv}</td>
                <td className="py-2 px-2">{g.profesorka}</td>
                <td className="py-2 px-2 text-gray-500">{g.status}</td>
                <td className="py-2 px-2 text-center">{g.clanovi}/{g.maxSeats}</td>
                <td className="py-2 px-2 text-right">{din(g.prihod)}</td>
                <td className="py-2 px-2 text-right">−{din(g.honorar)}</td>
                <td className={`py-2 px-2 text-right font-semibold ${g.zarada < 0 ? "text-red-600" : ""}`}>{din(g.zarada)}</td>
                <td className="py-2 pl-2 text-right text-gray-500">{g.clanovi > 0 ? din(g.zaradaPoClanu) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Po profesorkama */}
      <section className="bg-white rounded-xl border border-gray-100 p-4 overflow-x-auto">
        <h2 className="font-semibold mb-1">Po profesorkama — {periodLabel}</h2>
        <p className="text-xs text-gray-400 mb-3">Retencija = prosečan broj meseci u kojima polaznik plaća (cela istorija, ne samo izabrani period).</p>
        <table className="text-sm w-full min-w-[700px]">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="py-1 pr-3 font-medium">Profesorka</th>
              <th className="py-1 px-2 text-right font-medium">Prihod koji donosi</th>
              <th className="py-1 px-2 text-right font-medium">Honorar</th>
              <th className="py-1 px-2 text-right font-medium">Neto doprinos</th>
              <th className="py-1 px-2 text-center font-medium">Aktivni polaznici</th>
              <th className="py-1 pl-2 text-right font-medium">Retencija (mes.)</th>
            </tr>
          </thead>
          <tbody>
            {data.profesorke.map((p) => (
              <tr key={p.professor_id} className="border-t border-gray-50">
                <td className="py-2 pr-3">{p.ime}</td>
                <td className="py-2 px-2 text-right">{din(p.prihod)}</td>
                <td className="py-2 px-2 text-right">−{din(p.honorar)}</td>
                <td className={`py-2 px-2 text-right font-semibold ${p.neto < 0 ? "text-red-600" : ""}`}>{din(p.neto)}</td>
                <td className="py-2 px-2 text-center">{p.aktivniPolaznici}</td>
                <td className="py-2 pl-2 text-right">{p.retencijaMeseci ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Troškovi CRUD */}
      <section className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Troškovi — {periodLabel}</h2>
          <button onClick={() => { setEditing(null); setModalOpen(true); }}
            className="bg-plava text-white text-sm px-4 py-2 rounded-lg hover:opacity-90">
            + Dodaj trošak
          </button>
        </div>
        <table className="text-sm w-full">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="py-1 pr-3 font-medium">Naziv</th><th className="py-1 px-2 font-medium">Kategorija</th>
              <th className="py-1 px-2 text-right font-medium">Iznos</th><th className="py-1 px-2 font-medium">Od</th>
              <th className="py-1 px-2 font-medium">Tip</th><th className="py-1 px-2 font-medium">Kurs</th><th />
            </tr>
          </thead>
          <tbody>
            {visibleExpenses.map((e) => (
              <tr key={e.id} className="border-t border-gray-50">
                <td className="py-2 pr-3">{e.name}</td>
                <td className="py-2 px-2 text-gray-500">{EXPENSE_CATEGORY_LABELS[e.category as ExpenseCategory] ?? e.category}</td>
                <td className="py-2 px-2 text-right">{din(e.amount)}{e.recurring ? "/mes." : ""}</td>
                <td className="py-2 px-2 text-gray-500">{e.expense_date}</td>
                <td className="py-2 px-2 text-gray-500">{e.recurring ? (e.ended_at ? `mesečni do ${e.ended_at}` : "mesečni") : "jednokratni"}</td>
                <td className="py-2 px-2 text-gray-500">{e.course_id ? courseOptions.find((c) => c.id === e.course_id)?.title ?? "?" : "opšti"}</td>
                <td className="py-2 pl-2 text-right whitespace-nowrap">
                  <button onClick={() => { setEditing(e); setModalOpen(true); }} className="text-plava text-xs mr-3">Izmeni</button>
                  <button onClick={() => deleteExpense(e.id)} className="text-red-500 text-xs">Obriši</button>
                </td>
              </tr>
            ))}
            {visibleExpenses.length === 0 && (
              <tr><td colSpan={7} className="py-4 text-center text-gray-400">Nema troškova za ovaj period.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">{editing ? "Izmeni trošak" : "Novi trošak"}</h3>
            <form action={saveExpense} className="space-y-3 text-sm">
              <label className="block">Naziv
                <input name="name" required defaultValue={editing?.name ?? ""} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2" />
              </label>
              <label className="block">Kategorija
                <select name="category" defaultValue={editing?.category ?? "marketing"} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 bg-white">
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</option>)}
                </select>
              </label>
              <label className="block">Iznos (din)
                <input name="amount" type="number" min="1" step="1" required defaultValue={editing?.amount ?? ""} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2" />
              </label>
              <label className="block">Datum (za mesečne: od kog meseca)
                <input name="expense_date" type="date" required defaultValue={editing?.expense_date ?? new Date().toISOString().slice(0, 10)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2" />
              </label>
              <label className="flex items-center gap-2">
                <input name="recurring" type="checkbox" defaultChecked={editing?.recurring ?? false} />
                Mesečni trošak (ponavlja se svakog meseca)
              </label>
              <label className="block">Prestaje (samo za mesečne; prazno = aktivan)
                <input name="ended_at" type="date" defaultValue={editing?.ended_at ?? ""} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2" />
              </label>
              <label className="block">Kurs (opciono — direktan trošak kursa)
                <select name="course_id" defaultValue={editing?.course_id ?? ""} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 bg-white">
                  <option value="">— opšti trošak —</option>
                  {courseOptions.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </label>
              <label className="block">Napomena
                <input name="note" defaultValue={editing?.note ?? ""} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2" />
              </label>
              {err && <p className="text-red-600">{err}</p>}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="bg-plava text-white px-4 py-2 rounded-lg disabled:opacity-50">
                  {saving ? "Čuvam…" : "Sačuvaj"}
                </button>
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200">Otkaži</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, cells, bold, indent, negative }: { label: string; cells: number[]; bold?: boolean; indent?: boolean; negative?: boolean }) {
  const total = cells.reduce((a, b) => a + b, 0);
  const cls = (n: number) => `py-1 px-2 text-right ${bold ? "font-semibold" : ""} ${negative && n !== 0 ? "text-red-600/80" : ""}`;
  return (
    <tr className={bold ? "border-t border-gray-100" : ""}>
      <td className={`py-1 pr-3 ${indent ? "pl-4 text-gray-500" : ""} ${bold ? "font-semibold" : ""}`}>{label}</td>
      {cells.map((c, i) => <td key={i} className={cls(c)}>{c !== 0 ? din(c) : "—"}</td>)}
      <td className={`py-1 pl-3 text-right ${bold ? "font-semibold" : "text-gray-500"}`}>{total !== 0 ? din(total) : "—"}</td>
    </tr>
  );
}

function PeriodCards({ data, mesec, pendingTotal, periodLabel }: { data: FinansijeData; mesec: number | null; pendingTotal: number; periodLabel: string }) {
  // Za mesec filter: sume iz tog meseca; za godinu: totals.
  const m = mesec ? data.months[mesec - 1] : null;
  const prihod = m ? m.prihodUkupno : data.totals.prihod;
  const rashodi = m ? m.honorariUkupno + m.troskoviUkupno : data.totals.rashodi;
  const neto = prihod - rashodi;
  const marza = prihod > 0 ? Math.round((neto / prihod) * 100) : null;
  const cards = [
    { label: `Prihod — ${periodLabel}`, value: din(prihod), sub: pendingTotal ? `+ ${din(pendingTotal)} na čekanju` : null, color: "" },
    { label: "Rashodi", value: din(rashodi), sub: null, color: "" },
    { label: "Neto zarada", value: din(neto), sub: null, color: neto < 0 ? "text-red-600" : "text-green-700" },
    { label: "Marža", value: marza !== null ? `${marza}%` : "—", sub: null, color: "" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-400">{c.label}</div>
          <div className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</div>
          {c.sub && <div className="text-xs text-gray-400 mt-1">{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Dodaj `MESECI_KRATKO` u `src/lib/finansije.ts`** (komponenta ga importuje)

```typescript
export const MESECI_KRATKO = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"];
```

- [ ] **Step 3: Kompajliranje + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: bez novih grešaka

Napomena: ako `bg-plava`/`text-plava` klase ne postoje u Tailwind temi, pogledaj kako ih koristi `src/components/AdminSidebar.tsx` (koristi `bg-plava-light text-plava`) i uskladi.

- [ ] **Step 4: Commit (page + client zajedno)**

```bash
git add src/app/admin/finansije src/lib/finansije.ts
git commit -m "feat: /admin/finansije stranica — P&L, marže, grupe, profesorke, troškovi"
```

---

### Task 10: Sidebar link + finalna verifikacija

**Files:**
- Modify: `src/components/AdminSidebar.tsx:19` (links niz)

- [ ] **Step 1: Dodaj link u `links` niz, posle Analitika/Kupci/Napredak grupe**

```typescript
  { href: "/admin/analitika", label: "Analitika", exact: true },
  { href: "/admin/analitika/kupci", label: "Kupci", indent: true },
  { href: "/admin/napredak", label: "Napredak", indent: true },
  { href: "/admin/finansije", label: "Finansije" },
```

- [ ] **Step 2: Pun test run + build**

Run: `npx vitest run && npm run build`
Expected: svi testovi PASS, build prolazi bez grešaka

- [ ] **Step 3: Ručna provera u dev serveru**

Run: `npm run dev`, otvori `http://localhost:3000/admin/finansije` (ulogovan kao admin)
Proveri: kartice prikazuju brojeve, P&L tabela ima mesece, dodavanje troška kroz modal radi (i pojavi se u P&L „Troškovi" redu posle refresh-a), izmena i brisanje rade, filter godina/mesec menja URL i brojeve.

- [ ] **Step 4: Commit**

```bash
git add src/components/AdminSidebar.tsx
git commit -m "feat: Finansije link u admin meniju"
```

---

### Task 11: Deploy

- [ ] **Step 1: Proveri da je migracija 045 primenjena na produkcijsku bazu (Task 1 Step 2) — bez nje stranica puca na `expenses` upitu**

- [ ] **Step 2: Pitaj Natašu za potvrdu, pa deploy**

Run: `vercel --prod` (iz lokala — produkcija NE ide preko git-a)
Expected: deploy prolazi; PostToolUse hook automatski pokreće smoke test

- [ ] **Step 3: Verifikuj na produkciji sa cache-busterom**

Run: `curl -s "https://kurs.hartweger.rs/admin/finansije?cb=$(date +%s)" -o /dev/null -w "%{http_code}"`
Expected: `307` ili `200` (307 = redirect na login za neulogovanog — OK; bitno da nije 500)

---

## Self-Review (urađen)

- **Spec coverage:** expenses tabela + cancelled_at (T1), P&L+marže (T2-T4), grupe+profesorke+retencija (T5), CRUD API (T6), cancelled_at upis (T7), stranica+UI (T8-T9), meni (T10). Van obima iz speca ispoštovan (bez wc_orders, bez exporta, bez auto-provizija).
- **Type consistency:** `buildFinansije` input/output tipovi definisani u T4 Step 1 i korišćeni u T8/T9; `ExpenseRow` ima `note` polje svuda; `EXPENSE_CATEGORIES` deljen između lib/API/UI.
- **Poznata nepreciznost (svesna odluka):** prihod grupne porudžbine se pripisuje prvoj grupi člana sa istim kupovnim kursom — ako polaznik vremenom prođe kroz dve generacije iste grupe, istorijski prihod ide najstarijoj. Za sadašnji obim (grupe od 06.06) zanemarljivo.
