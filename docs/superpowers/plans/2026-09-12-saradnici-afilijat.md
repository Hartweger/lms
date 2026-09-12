# Saradnici (afilijat kodovi) - plan implementacije

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Spoljni saradnik (prvi: Ana) ima kupon kod; kupac dobija 10%, saradniku pripada fiksan iznos po plaćenom upisu, Nataša u adminu vidi saldo, beleži isplate i dodaje nove saradnike bez SQL-a.

**Architecture:** Nova tabela `partners` + `partner_payouts`, kupon i porudžbina dobijaju `partner_id` (porudžbina i snimak `partner_fee`). Obračun je čista funkcija nad plaćenim porudžbinama i isplatama. Admin stranica `/admin/saradnici` (lista + detalj) i četiri admin API rute. Kasa (`/api/orders`) samo upisuje saradnika na porudžbinu.

**Tech Stack:** Next.js 15 App Router (route handlers sa `params: Promise<...>`), Supabase (service-role kroz `requireAdmin()` / `createAdminClient()`), vitest, Tailwind sa postojećim admin klasama (`bg-plava`, `bg-plava-light`, `text-plava`).

Spec: `docs/superpowers/specs/2026-09-12-saradnici-afilijat-design.md`

Repo: `/Users/natasahartweger/Documents/Claude/sajt/LMS/lms`, grana `main` (trunk-based). Komande: `./node_modules/.bin/tsc --noEmit`, `npx vitest run <fajl>`, `npm run lint`.

**Redosled i produkcija:** migracija (Task 1) ide na produkciju odmah, ali sa kuponom ANA **neaktivnim**. Aktivira se tek posle deploya i smoke testa (Task 10), da nijedna porudžbina sa ANA ne nastane pre nego što kasa zna da upiše `partner_fee`.

---

## Mapa fajlova

| Fajl | Uloga |
|---|---|
| `supabase/migrations/107_partners.sql` | tabele, kolone, RLS, Ana + ANA (neaktivan) |
| `src/lib/partner-balance.ts` (+ `.test.ts`) | čist obračun: upisane / pripada / isplaćeno / saldo |
| `src/lib/belgrade-date.ts` (+ `.test.ts`) | „važi do" datum → 23:59:59 po Beogradu kao ISO |
| `src/lib/partners.ts` | I/O: učitaj saradnike sa saldom, detalj jednog |
| `src/lib/types.ts` | `Coupon.partner_id`, `Coupon.partners` |
| `src/app/api/orders/route.ts` | upis `partner_id` + `partner_fee` na porudžbinu |
| `src/app/api/admin/saradnici/route.ts` | POST novi saradnik + kupon |
| `src/app/api/admin/saradnici/[id]/route.ts` | PATCH izmena / deaktivacija |
| `src/app/api/admin/saradnici/[id]/isplate/route.ts` | POST isplata |
| `src/app/api/admin/saradnici/[id]/kuponi/route.ts` | POST dodatni kod |
| `src/app/admin/saradnici/page.tsx` + `SaradniciClient.tsx` | lista + forma za novog |
| `src/app/admin/saradnici/[id]/page.tsx` + `SaradnikClient.tsx` | detalj: porudžbine, isplate, izmena, dodaj kod |
| `src/app/admin/kuponi/page.tsx` + `KuponiClient.tsx` | oznaka „saradnik: Ana" |
| `src/components/AdminSidebar.tsx` | link „Saradnici" |

---

### Task 1: Migracija 107 (baza)

**Files:**
- Create: `supabase/migrations/107_partners.sql`

- [ ] **Step 1: Napiši migraciju**

```sql
-- 107: saradnici (afilijat kodovi). Spoljni saradnik deli kupon; kupac dobija popust,
-- saradniku od Nataše pripada fiksan iznos po PLAĆENOM upisu. Prvi saradnik: Ana za
-- NH Academy Gen II (kod ANA, 10%, 5.000 RSD po upisu, do 29.9.2026).
-- Spec: docs/superpowers/specs/2026-09-12-saradnici-afilijat-design.md

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  fee_rsd int not null check (fee_rsd >= 0),
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

-- Bez politika: anon i prijavljeni ne vide ništa, service role (admin rute) zaobilazi RLS.
alter table public.partners enable row level security;

create table if not exists public.partner_payouts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id),
  amount int not null check (amount > 0),
  paid_at date not null,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.partner_payouts enable row level security;

alter table public.coupons add column if not exists partner_id uuid references public.partners(id);

-- Snimak u trenutku porudžbine: promena iznosa saradniku važi samo za buduće prodaje.
alter table public.orders add column if not exists partner_id uuid references public.partners(id);
alter table public.orders add column if not exists partner_fee int;

create index if not exists orders_partner_id_idx on public.orders(partner_id) where partner_id is not null;
create index if not exists coupons_partner_id_idx on public.coupons(partner_id) where partner_id is not null;

-- Ana. Kupon je NEAKTIVAN dok kod na kasi ne bude deployovan (da porudžbina ne nastane
-- bez partner_fee). Aktivira se ručno posle smoke testa:
--   update public.coupons set is_active = true where code = 'ANA';
insert into public.partners (name, fee_rsd, note)
select 'Ana', 5000, 'NH Academy Gen II, kod ANA'
where not exists (select 1 from public.partners where name = 'Ana');

insert into public.coupons (code, discount_type, amount, expires_at, is_active, applies_to_course_id, partner_id)
select 'ANA', 'percent', 10, '2026-09-29 21:59:59+00', false, c.id, p.id
from public.courses c, public.partners p
where c.slug = 'nh-academy-gen2' and p.name = 'Ana'
on conflict (code) do nothing;
```

- [ ] **Step 2: Primeni na produkciju**

Run: `node scripts/db-apply.mjs supabase/migrations/107_partners.sql`
Expected: bez greške. (Alternativa ako skripta zataji: Supabase MCP `apply_migration` na projektu `rzmyglynjcygsbicssbt` sa imenom `partners`.)

- [ ] **Step 3: Proveri**

SQL (Supabase MCP `execute_sql`):
```sql
select p.name, p.fee_rsd, c.code, c.is_active, c.expires_at, k.slug
from partners p join coupons c on c.partner_id = p.id join courses k on k.id = c.applies_to_course_id;
```
Expected: jedan red: Ana, 5000, ANA, false, 2026-09-29 21:59:59+00, nh-academy-gen2.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/107_partners.sql
git commit -m "feat(saradnici): migracija 107 - partners, partner_payouts, partner_id na kuponu i porudžbini, Ana/ANA neaktivan

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Čist obračun `computePartnerBalance`

**Files:**
- Create: `src/lib/partner-balance.ts`
- Test: `src/lib/partner-balance.test.ts`

- [ ] **Step 1: Napiši test koji pada**

```ts
import { describe, it, expect } from "vitest";
import { computePartnerBalance } from "./partner-balance";

describe("computePartnerBalance", () => {
  it("prazno daje nule", () => {
    expect(computePartnerBalance([], [])).toEqual({ upisane: 0, pripada: 0, isplaceno: 0, saldo: 0 });
  });

  it("broji samo completed porudžbine", () => {
    const orders = [
      { payment_status: "completed", partner_fee: 5000 },
      { payment_status: "pending", partner_fee: 5000 },
      { payment_status: "refunded", partner_fee: 5000 },
    ];
    expect(computePartnerBalance(orders, [])).toEqual({ upisane: 1, pripada: 5000, isplaceno: 0, saldo: 5000 });
  });

  it("fee se čita sa porudžbine, pa promena iznosa ne dira stare prodaje", () => {
    const orders = [
      { payment_status: "completed", partner_fee: 5000 },
      { payment_status: "completed", partner_fee: 6000 },
    ];
    expect(computePartnerBalance(orders, []).pripada).toBe(11000);
  });

  it("porudžbina bez partner_fee (null) se broji kao upisana ali sa 0", () => {
    const orders = [{ payment_status: "completed", partner_fee: null }];
    expect(computePartnerBalance(orders, [])).toEqual({ upisane: 1, pripada: 0, isplaceno: 0, saldo: 0 });
  });

  it("isplate se oduzimaju, negativan saldo je dozvoljen", () => {
    const orders = [{ payment_status: "completed", partner_fee: 5000 }];
    const payouts = [{ amount: 4000 }, { amount: 3000 }];
    expect(computePartnerBalance(orders, payouts)).toEqual({ upisane: 1, pripada: 5000, isplaceno: 7000, saldo: -2000 });
  });
});
```

- [ ] **Step 2: Pokreni test, mora da padne**

Run: `npx vitest run src/lib/partner-balance.test.ts`
Expected: FAIL, „Failed to resolve import ./partner-balance".

- [ ] **Step 3: Implementacija**

```ts
// src/lib/partner-balance.ts
// Čist obračun za saradnika (afilijat kod). Broje se SAMO plaćene porudžbine:
// pending (odbijena kartica, neplaćena uplatnica) i refunded (storno) ne ulaze.
// Fee se čita sa porudžbine (snimak), ne sa saradnika.

export interface PartnerOrderLike {
  payment_status: string;
  partner_fee: number | null;
}

export interface PayoutLike {
  amount: number;
}

export interface PartnerBalance {
  upisane: number;
  pripada: number;
  isplaceno: number;
  saldo: number;
}

export function computePartnerBalance(orders: PartnerOrderLike[], payouts: PayoutLike[]): PartnerBalance {
  const placene = orders.filter((o) => o.payment_status === "completed");
  const pripada = placene.reduce((s, o) => s + (o.partner_fee ?? 0), 0);
  const isplaceno = payouts.reduce((s, p) => s + p.amount, 0);
  return { upisane: placene.length, pripada, isplaceno, saldo: pripada - isplaceno };
}
```

- [ ] **Step 4: Testovi prolaze**

Run: `npx vitest run src/lib/partner-balance.test.ts`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/partner-balance.ts src/lib/partner-balance.test.ts
git commit -m "feat(saradnici): computePartnerBalance - obračun po plaćenim porudžbinama

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: „Važi do" datum → kraj dana po Beogradu

**Files:**
- Create: `src/lib/belgrade-date.ts`
- Test: `src/lib/belgrade-date.test.ts`

- [ ] **Step 1: Test koji pada**

```ts
import { describe, it, expect } from "vitest";
import { krajDanaBeograd } from "./belgrade-date";

describe("krajDanaBeograd", () => {
  it("letnje vreme (CEST) daje +02:00", () => {
    expect(krajDanaBeograd("2026-09-29")).toBe("2026-09-29T23:59:59+02:00");
  });
  it("zimsko vreme (CET) daje +01:00", () => {
    expect(krajDanaBeograd("2026-12-01")).toBe("2026-12-01T23:59:59+01:00");
  });
  it("odbija loš format", () => {
    expect(() => krajDanaBeograd("29.9.2026")).toThrow();
  });
});
```

- [ ] **Step 2: Pokreni, pada**

Run: `npx vitest run src/lib/belgrade-date.test.ts`
Expected: FAIL, import se ne rešava.

- [ ] **Step 3: Implementacija**

```ts
// src/lib/belgrade-date.ts
// „Važi do" iz admin forme je samo datum (YYYY-MM-DD). Kupon treba da važi ceo taj dan
// po Beogradu, pa se pravi ISO string 23:59:59 sa offsetom koji Beograd ima TOG dana
// (leti +02:00, zimi +01:00). Postgres timestamptz ga čita direktno.

export function krajDanaBeograd(datum: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) throw new Error(`Loš datum: ${datum}`);
  const podne = new Date(`${datum}T12:00:00Z`);
  const delovi = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Belgrade", timeZoneName: "shortOffset" }).formatToParts(podne);
  const tz = delovi.find((d) => d.type === "timeZoneName")?.value ?? "GMT+1"; // npr. "GMT+2"
  const sati = Number(tz.replace("GMT", "")) || 0;
  const znak = sati >= 0 ? "+" : "-";
  const hh = String(Math.abs(sati)).padStart(2, "0");
  return `${datum}T23:59:59${znak}${hh}:00`;
}
```

- [ ] **Step 4: Prolazi**

Run: `npx vitest run src/lib/belgrade-date.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/belgrade-date.ts src/lib/belgrade-date.test.ts
git commit -m "feat(saradnici): krajDanaBeograd - datum iz forme kao kraj dana po Beogradu

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Tipovi + kasa upisuje saradnika na porudžbinu

**Files:**
- Modify: `src/lib/types.ts:220-233` (interface `Coupon`)
- Modify: `src/app/api/orders/route.ts` (oko linije 288-386 validacija kupona; 525-545 update grana; 604-624 insert grana)

- [ ] **Step 1: Proširi `Coupon` tip**

U `src/lib/types.ts` u `interface Coupon` posle `applies_to_course_id` dodaj:

```ts
  partner_id: string | null;
  /** Popunjeno samo kad upit radi join `partners(name)` (admin kuponi). */
  partners?: { name: string } | null;
```

- [ ] **Step 2: U `/api/orders` zapamti saradnika uz validan kupon**

Odmah ispod `let validCouponCode: string | null = null;` (linija ~289) dodaj:

```ts
    // Saradnik (afilijat kod): snimak iznosa u trenutku porudžbine - vidi partner-balance.ts.
    let partnerId: string | null = null;
    let partnerFee: number | null = null;
```

U bloku gde kupon prolazi (linija ~382):

```ts
        if (notExpired && notMaxed && renewalOk) {
          couponForDiscount = { discount_type: coupon.discount_type, amount: Number(coupon.amount) };
          validCouponCode = coupon.code;
          if (coupon.partner_id) {
            const { data: partner } = await supabase
              .from("partners")
              .select("id, fee_rsd, is_active")
              .eq("id", coupon.partner_id)
              .single();
            if (partner?.is_active) {
              partnerId = partner.id;
              partnerFee = partner.fee_rsd;
            }
          }
        }
```

U `update({...})` grani za ponovo iskorišćenu pending porudžbinu (linija ~533), odmah ispod `coupon_code: validCouponCode,` dodaj:

```ts
          partner_id: partnerId,
          partner_fee: partnerFee,
```

Isto u `insert({...})` grani (linija ~615), ispod `coupon_code: validCouponCode,`:

```ts
          partner_id: partnerId,
          partner_fee: partnerFee,
```

(Reuse bez koda tako briše i raniji snimak, isto kao što briše `coupon_code`.)

- [ ] **Step 3: Tipovi prolaze**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 4: Postojeći testovi prolaze**

Run: `npx vitest run`
Expected: sve zeleno (nema testova za orders rutu; ovo je regresija za ostalo).

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/app/api/orders/route.ts
git commit -m "feat(saradnici): porudžbina pamti partner_id i partner_fee uz kupon saradnika

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: I/O sloj `src/lib/partners.ts`

**Files:**
- Create: `src/lib/partners.ts`

- [ ] **Step 1: Napiši modul**

```ts
// src/lib/partners.ts
// I/O za saradnike (afilijat kodovi): učitaj sve sa saldom, ili detalj jednog.
// Računica je u partner-balance.ts (čisto), ovde samo upiti.
import { createAdminClient } from "@/lib/supabase/admin";
import { computePartnerBalance, type PartnerBalance } from "@/lib/partner-balance";

export interface PartnerRow {
  id: string;
  name: string;
  email: string | null;
  fee_rsd: number;
  is_active: boolean;
  note: string | null;
  created_at: string;
}

export interface PartnerCode {
  id: string;
  code: string;
  amount: number;
  is_active: boolean;
  expires_at: string | null;
  usage_count: number;
  course_title: string | null;
}

export interface PartnerOrderRow {
  id: string;
  order_number: string | null;
  email: string;
  full_name: string;
  created_at: string;
  total: number;
  partner_fee: number | null;
  payment_status: string;
  product_title: string;
}

export interface PartnerPayoutRow {
  id: string;
  amount: number;
  paid_at: string;
  note: string | null;
}

export interface PartnerSummary extends PartnerRow, PartnerBalance {
  codes: PartnerCode[];
}

export interface PartnerDetail extends PartnerSummary {
  orders: PartnerOrderRow[];
  payouts: PartnerPayoutRow[];
}

type OrderRaw = {
  id: string; order_number: string | null; email: string; full_name: string; created_at: string;
  total: number; partner_fee: number | null; payment_status: string; partner_id: string;
  items: { title?: string }[] | null;
};

function mapOrder(o: OrderRaw): PartnerOrderRow {
  return {
    id: o.id, order_number: o.order_number, email: o.email, full_name: o.full_name,
    created_at: o.created_at, total: o.total, partner_fee: o.partner_fee,
    payment_status: o.payment_status, product_title: o.items?.[0]?.title ?? "-",
  };
}

type CouponRaw = {
  id: string; code: string; amount: number; is_active: boolean; expires_at: string | null;
  usage_count: number; partner_id: string; courses: { title: string } | null;
};

function mapCode(c: CouponRaw): PartnerCode {
  return {
    id: c.id, code: c.code, amount: Number(c.amount), is_active: c.is_active,
    expires_at: c.expires_at, usage_count: c.usage_count, course_title: c.courses?.title ?? null,
  };
}

const COUPON_SELECT = "id, code, amount, is_active, expires_at, usage_count, partner_id, courses:applies_to_course_id(title)";
const ORDER_SELECT = "id, order_number, email, full_name, created_at, total, partner_fee, payment_status, partner_id, items";

/** Svi saradnici sa kodovima i saldom. Aktivni prvi, pa po imenu. */
export async function loadPartnerSummaries(): Promise<PartnerSummary[]> {
  const admin = createAdminClient();
  const [pRes, cRes, oRes, payRes] = await Promise.all([
    admin.from("partners").select("*").order("is_active", { ascending: false }).order("name"),
    admin.from("coupons").select(COUPON_SELECT).not("partner_id", "is", null),
    admin.from("orders").select("payment_status, partner_fee, partner_id").not("partner_id", "is", null),
    admin.from("partner_payouts").select("partner_id, amount"),
  ]);
  if (pRes.error || cRes.error || oRes.error || payRes.error) {
    console.error("[partners] DB greška:", pRes.error ?? cRes.error ?? oRes.error ?? payRes.error);
  }
  const partners = (pRes.data ?? []) as PartnerRow[];
  const coupons = (cRes.data ?? []) as unknown as CouponRaw[];
  const orders = (oRes.data ?? []) as { payment_status: string; partner_fee: number | null; partner_id: string }[];
  const payouts = (payRes.data ?? []) as { partner_id: string; amount: number }[];

  return partners.map((p) => ({
    ...p,
    codes: coupons.filter((c) => c.partner_id === p.id).map(mapCode),
    ...computePartnerBalance(orders.filter((o) => o.partner_id === p.id), payouts.filter((x) => x.partner_id === p.id)),
  }));
}

/** Detalj jednog saradnika, ili null ako ne postoji. */
export async function loadPartnerDetail(id: string): Promise<PartnerDetail | null> {
  const admin = createAdminClient();
  const { data: partner, error } = await admin.from("partners").select("*").eq("id", id).maybeSingle();
  if (error || !partner) return null;
  const [cRes, oRes, payRes] = await Promise.all([
    admin.from("coupons").select(COUPON_SELECT).eq("partner_id", id).order("created_at"),
    admin.from("orders").select(ORDER_SELECT).eq("partner_id", id).order("created_at", { ascending: false }),
    admin.from("partner_payouts").select("id, amount, paid_at, note").eq("partner_id", id).order("paid_at", { ascending: false }),
  ]);
  const orders = ((oRes.data ?? []) as unknown as OrderRaw[]).map(mapOrder);
  const payouts = (payRes.data ?? []) as PartnerPayoutRow[];
  return {
    ...(partner as PartnerRow),
    codes: ((cRes.data ?? []) as unknown as CouponRaw[]).map(mapCode),
    orders,
    payouts,
    ...computePartnerBalance(orders, payouts),
  };
}
```

- [ ] **Step 2: Tipovi**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add src/lib/partners.ts
git commit -m "feat(saradnici): loadPartnerSummaries i loadPartnerDetail

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Admin API rute

**Files:**
- Create: `src/app/api/admin/saradnici/route.ts`
- Create: `src/app/api/admin/saradnici/[id]/route.ts`
- Create: `src/app/api/admin/saradnici/[id]/isplate/route.ts`
- Create: `src/app/api/admin/saradnici/[id]/kuponi/route.ts`

Zajednička validacija kupona živi u prvoj ruti i uvozi se u četvrtu, da se ne ponavlja.

- [ ] **Step 1: POST novi saradnik + kupon**

```ts
// src/app/api/admin/saradnici/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/api-auth";
import { krajDanaBeograd } from "@/lib/belgrade-date";

export interface KuponInput {
  code: string;
  percent: number;
  courseId: string;
  expiresDate: string | null; // YYYY-MM-DD ili null
}

/** Vrati očišćen unos kupona ili poruku greške. */
export function parseKuponInput(body: Record<string, unknown>): { ok: true; value: KuponInput } | { ok: false; error: string } {
  const code = String(body.code ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9-]{2,30}$/.test(code)) return { ok: false, error: "Kod: 2-30 znakova, slova, cifre i crtica." };
  const percent = Math.round(Number(body.percent));
  if (!Number.isFinite(percent) || percent < 1 || percent > 100) return { ok: false, error: "Popust mora biti 1-100%." };
  const courseId = String(body.courseId ?? "").trim();
  if (!courseId) return { ok: false, error: "Proizvod je obavezan." };
  const raw = String(body.expiresDate ?? "").trim();
  if (raw && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { ok: false, error: "Datum nije validan." };
  return { ok: true, value: { code, percent, courseId, expiresDate: raw || null } };
}

/** Upiši kupon saradnika. Vraća poruku greške ako kod postoji ili upis padne. */
export async function insertPartnerCoupon(admin: SupabaseClient, partnerId: string, k: KuponInput): Promise<{ error: string; status: number } | null> {
  const { error } = await admin.from("coupons").insert({
    code: k.code,
    discount_type: "percent",
    amount: k.percent,
    applies_to_course_id: k.courseId,
    expires_at: k.expiresDate ? krajDanaBeograd(k.expiresDate) : null,
    is_active: true,
    partner_id: partnerId,
  });
  if (!error) return null;
  if (error.code === "23505") return { error: "Kupon sa tim kodom već postoji.", status: 409 };
  return { error: error.message, status: 500 };
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { admin } = auth;
  const body = (await request.json()) as Record<string, unknown>;

  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Ime je obavezno." }, { status: 400 });
  const email = String(body.email ?? "").trim() || null;
  const feeRsd = Math.round(Number(body.feeRsd));
  if (!Number.isFinite(feeRsd) || feeRsd < 0) return NextResponse.json({ error: "Iznos po upisu mora biti 0 ili više." }, { status: 400 });
  const kupon = parseKuponInput(body);
  if (!kupon.ok) return NextResponse.json({ error: kupon.error }, { status: 400 });

  // Kod se proverava PRE upisa saradnika, da 409 ne ostavi saradnika bez koda.
  const { data: postojeci } = await admin.from("coupons").select("id").eq("code", kupon.value.code).maybeSingle();
  if (postojeci) return NextResponse.json({ error: "Kupon sa tim kodom već postoji." }, { status: 409 });

  const { data: partner, error: pErr } = await admin
    .from("partners")
    .insert({ name, email, fee_rsd: feeRsd, note: String(body.note ?? "").trim() || null })
    .select()
    .single();
  if (pErr || !partner) return NextResponse.json({ error: pErr?.message ?? "Upis saradnika pao." }, { status: 500 });

  const cErr = await insertPartnerCoupon(admin, partner.id, kupon.value);
  if (cErr) {
    // Trka: neko je u međuvremenu napravio isti kod. Ne ostavljamo saradnika bez koda.
    await admin.from("partners").delete().eq("id", partner.id);
    return NextResponse.json({ error: cErr.error }, { status: cErr.status });
  }

  return NextResponse.json({ partner }, { status: 201 });
}
```

- [ ] **Step 2: PATCH izmena / deaktivacija**

```ts
// src/app/api/admin/saradnici/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { admin } = auth;
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "Ime je obavezno." }, { status: 400 });
    patch.name = name;
  }
  if (body.email !== undefined) patch.email = String(body.email).trim() || null;
  if (body.note !== undefined) patch.note = String(body.note).trim() || null;
  if (body.feeRsd !== undefined) {
    const fee = Math.round(Number(body.feeRsd));
    if (!Number.isFinite(fee) || fee < 0) return NextResponse.json({ error: "Iznos po upisu mora biti 0 ili više." }, { status: 400 });
    patch.fee_rsd = fee;
  }
  if (body.isActive !== undefined) patch.is_active = Boolean(body.isActive);
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nema izmena." }, { status: 400 });

  const { data: partner, error } = await admin.from("partners").update(patch).eq("id", id).select().single();
  if (error || !partner) return NextResponse.json({ error: error?.message ?? "Saradnik nije pronađen." }, { status: error ? 500 : 404 });

  // Deaktivacija saradnika gasi i sve njegove kodove - kasa ne dobija novu proveru.
  if (patch.is_active === false) {
    await admin.from("coupons").update({ is_active: false }).eq("partner_id", id);
  }

  return NextResponse.json({ partner });
}
```

- [ ] **Step 3: POST isplata**

```ts
// src/app/api/admin/saradnici/[id]/isplate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { loadPartnerDetail } from "@/lib/partners";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { admin, user } = auth;
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  const amount = Math.round(Number(body.amount));
  const paidAt = String(body.paidAt ?? "").trim();
  const note = String(body.note ?? "").trim() || null;
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Iznos mora biti veći od 0." }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidAt)) return NextResponse.json({ error: "Datum nije validan." }, { status: 400 });

  const { data: partner } = await admin.from("partners").select("id").eq("id", id).maybeSingle();
  if (!partner) return NextResponse.json({ error: "Saradnik nije pronađen." }, { status: 404 });

  const { error } = await admin.from("partner_payouts").insert({ partner_id: id, amount, paid_at: paidAt, note, created_by: user.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const detail = await loadPartnerDetail(id);
  return NextResponse.json({ ok: true, saldo: detail?.saldo ?? null });
}
```

- [ ] **Step 4: POST dodatni kod**

```ts
// src/app/api/admin/saradnici/[id]/kuponi/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { parseKuponInput, insertPartnerCoupon } from "@/app/api/admin/saradnici/route";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { admin } = auth;
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  const { data: partner } = await admin.from("partners").select("id, is_active").eq("id", id).maybeSingle();
  if (!partner) return NextResponse.json({ error: "Saradnik nije pronađen." }, { status: 404 });
  if (!partner.is_active) return NextResponse.json({ error: "Saradnik je deaktiviran. Prvo ga aktiviraj." }, { status: 400 });

  const kupon = parseKuponInput(body);
  if (!kupon.ok) return NextResponse.json({ error: kupon.error }, { status: 400 });

  const cErr = await insertPartnerCoupon(admin, id, kupon.value);
  if (cErr) return NextResponse.json({ error: cErr.error }, { status: cErr.status });
  return NextResponse.json({ ok: true }, { status: 201 });
}
```

Napomena: Next.js dozvoljava samo HTTP handlere kao exporte iz `route.ts`? Ne, dozvoljava i druge exporte, ali `next build` upozorava na neprepoznate exporte u route fajlovima u nekim verzijama. Ako `tsc`/`next build` prigovori, premesti `parseKuponInput`, `KuponInput` i `insertPartnerCoupon` u `src/lib/partner-coupon.ts` i uvezi ih iz oba fajla.

- [ ] **Step 5: Tipovi**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/saradnici
git commit -m "feat(saradnici): admin API - novi saradnik+kupon, izmena, isplata, dodatni kod

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Stranica `/admin/saradnici` (lista + forma) i sidebar

**Files:**
- Create: `src/app/admin/saradnici/page.tsx`
- Create: `src/app/admin/saradnici/SaradniciClient.tsx`
- Modify: `src/components/AdminSidebar.tsx:18` (posle „Kuponi")

- [ ] **Step 1: Server stranica**

```tsx
// src/app/admin/saradnici/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { loadPartnerSummaries } from "@/lib/partners";
import SaradniciClient from "./SaradniciClient";

export const dynamic = "force-dynamic";

export default async function AdminSaradniciPage() {
  const admin = createAdminClient();
  const [partners, { data: courses }] = await Promise.all([
    loadPartnerSummaries(),
    admin.from("courses").select("id, title, slug").eq("is_purchasable", true).order("title"),
  ]);
  return (
    <SaradniciClient
      partners={partners}
      courses={(courses ?? []).map((c) => ({ id: c.id, title: c.title, slug: c.slug }))}
    />
  );
}
```

- [ ] **Step 2: Klijent (lista + forma za novog)**

```tsx
// src/app/admin/saradnici/SaradniciClient.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PartnerSummary } from "@/lib/partners";

type CourseOpt = { id: string; title: string; slug: string };
const fmt = (n: number) => n.toLocaleString("de-DE");

const DEFAULT_SLUG = "nh-academy-gen2";

export default function SaradniciClient({ partners, courses }: { partners: PartnerSummary[]; courses: CourseOpt[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultCourse = courses.find((c) => c.slug === DEFAULT_SLUG)?.id ?? courses[0]?.id ?? "";
  const [form, setForm] = useState({ name: "", email: "", feeRsd: "5000", code: "", percent: "10", courseId: defaultCourse, expiresDate: "" });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = await fetch("/api/admin/saradnici", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, feeRsd: Number(form.feeRsd), percent: Number(form.percent), expiresDate: form.expiresDate || null }),
    });
    setBusy(false);
    if (!res.ok) { setError((await res.json()).error || "Greška"); return; }
    setShowForm(false);
    setForm({ name: "", email: "", feeRsd: "5000", code: "", percent: "10", courseId: defaultCourse, expiresDate: "" });
    router.refresh();
  }

  const inp = "w-full border rounded-lg px-3 py-2 text-sm";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Saradnici</h1>
        <button onClick={() => { setShowForm((v) => !v); setError(null); }}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#0AB3D7] text-white hover:bg-[#088BAD] transition-colors">
          + Novi saradnik
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-[#E8F7FC] rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Novi saradnik i njegov kod</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="text-xs font-medium text-gray-600">Ime
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} placeholder="npr. Ana" /></label>
            <label className="text-xs font-medium text-gray-600">Mejl (opciono)
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} /></label>
            <label className="text-xs font-medium text-gray-600">Iznos po upisu (RSD)
              <input required type="number" min="0" value={form.feeRsd} onChange={(e) => setForm({ ...form, feeRsd: e.target.value })} className={inp} /></label>
            <label className="text-xs font-medium text-gray-600">Kod
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={`${inp} font-mono`} placeholder="npr. ANA" /></label>
            <label className="text-xs font-medium text-gray-600">Popust (%)
              <input required type="number" min="1" max="100" value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })} className={inp} /></label>
            <label className="text-xs font-medium text-gray-600">Proizvod
              <select required value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} className={inp}>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select></label>
            <label className="text-xs font-medium text-gray-600">Važi do (opciono)
              <input type="date" value={form.expiresDate} onChange={(e) => setForm({ ...form, expiresDate: e.target.value })} className={inp} /></label>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#0AB3D7] text-white disabled:opacity-50">{busy ? "..." : "Sačuvaj"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600">Otkaži</button>
          </div>
        </form>
      )}

      {partners.length === 0 ? (
        <p className="text-gray-400 text-sm">Još nema saradnika.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3">Saradnik</th>
                <th className="text-left px-4 py-3">Kodovi</th>
                <th className="text-right px-4 py-3">Po upisu</th>
                <th className="text-right px-4 py-3">Upisane</th>
                <th className="text-right px-4 py-3">Pripada</th>
                <th className="text-right px-4 py-3">Isplaćeno</th>
                <th className="text-right px-4 py-3">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {partners.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50 ${p.is_active ? "" : "text-gray-400"}`}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/saradnici/${p.id}`} className="font-medium text-plava hover:underline">{p.name}</Link>
                    {!p.is_active && <span className="ml-2 text-xs">neaktivan</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {p.codes.length === 0 ? "-" : p.codes.map((c) => (
                      <span key={c.id} className={`inline-block mr-2 ${c.is_active ? "text-gray-900" : "text-gray-400 line-through"}`}>{c.code}</span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-right">{fmt(p.fee_rsd)}</td>
                  <td className="px-4 py-3 text-right">{p.upisane}</td>
                  <td className="px-4 py-3 text-right">{fmt(p.pripada)}</td>
                  <td className="px-4 py-3 text-right">{fmt(p.isplaceno)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${p.saldo > 0 ? "text-gray-900" : ""}`}>{fmt(p.saldo)} din</td>
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

- [ ] **Step 3: Sidebar link**

U `src/components/AdminSidebar.tsx` odmah posle `{ href: "/admin/kuponi", label: "Kuponi" },` dodaj:

```ts
  { href: "/admin/saradnici", label: "Saradnici", indent: true },
```

- [ ] **Step 4: Tipovi + lint**

Run: `./node_modules/.bin/tsc --noEmit && npm run lint`
Expected: bez grešaka.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/saradnici/page.tsx src/app/admin/saradnici/SaradniciClient.tsx src/components/AdminSidebar.tsx
git commit -m "feat(saradnici): /admin/saradnici - lista sa saldom i forma za novog saradnika

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Detalj saradnika `/admin/saradnici/[id]`

**Files:**
- Create: `src/app/admin/saradnici/[id]/page.tsx`
- Create: `src/app/admin/saradnici/[id]/SaradnikClient.tsx`

- [ ] **Step 1: Server stranica**

```tsx
// src/app/admin/saradnici/[id]/page.tsx
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadPartnerDetail } from "@/lib/partners";
import SaradnikClient from "./SaradnikClient";

export const dynamic = "force-dynamic";

export default async function AdminSaradnikPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const [partner, { data: courses }] = await Promise.all([
    loadPartnerDetail(id),
    admin.from("courses").select("id, title, slug").eq("is_purchasable", true).order("title"),
  ]);
  if (!partner) notFound();
  return <SaradnikClient partner={partner} courses={(courses ?? []).map((c) => ({ id: c.id, title: c.title, slug: c.slug }))} />;
}
```

- [ ] **Step 2: Klijent (porudžbine, isplate, izmena, dodaj kod)**

```tsx
// src/app/admin/saradnici/[id]/SaradnikClient.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PartnerDetail } from "@/lib/partners";

type CourseOpt = { id: string; title: string; slug: string };
const fmt = (n: number) => n.toLocaleString("de-DE");
const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(new Date());
const datum = (iso: string) => new Date(iso).toLocaleDateString("sr-RS");

const STATUS: Record<string, { label: string; cls: string }> = {
  completed: { label: "plaćeno", cls: "bg-green-50 text-green-600" },
  pending: { label: "čeka", cls: "bg-yellow-50 text-yellow-700" },
  refunded: { label: "storno", cls: "bg-gray-100 text-gray-500" },
};

export default function SaradnikClient({ partner, courses }: { partner: PartnerDetail; courses: CourseOpt[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showPay, setShowPay] = useState(false);
  const [amount, setAmount] = useState(String(Math.max(0, partner.saldo)));
  const [payDate, setPayDate] = useState(today());
  const [payNote, setPayNote] = useState("");

  const [showEdit, setShowEdit] = useState(false);
  const [edit, setEdit] = useState({ name: partner.name, email: partner.email ?? "", feeRsd: String(partner.fee_rsd), note: partner.note ?? "" });

  const [showCode, setShowCode] = useState(false);
  const defaultCourse = courses.find((c) => c.slug === "nh-academy-gen2")?.id ?? courses[0]?.id ?? "";
  const [code, setCode] = useState({ code: "", percent: "10", courseId: defaultCourse, expiresDate: "" });

  async function call(key: string, url: string, method: string, body: unknown, onOk: () => void) {
    setBusy(key); setError(null);
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(null);
    if (!res.ok) { setError((await res.json()).error || "Greška"); return; }
    onOk();
    router.refresh();
  }

  const inp = "border rounded-lg px-2 py-1 text-sm";

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/saradnici" className="text-sm text-gray-500 hover:underline">← Saradnici</Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {partner.name}
            {!partner.is_active && <span className="ml-3 text-sm font-normal text-gray-400">neaktivan</span>}
          </h1>
          <div className="flex gap-2">
            <button onClick={() => setShowEdit((v) => !v)} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700">Izmeni</button>
            <button onClick={() => setShowCode((v) => !v)} disabled={!partner.is_active} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50">Dodaj kod</button>
            <button onClick={() => { setShowPay((v) => !v); setAmount(String(Math.max(0, partner.saldo))); }} className="text-sm px-3 py-1.5 rounded-lg bg-plava-light text-plava font-medium">Zabeleži isplatu</button>
          </div>
        </div>
        {partner.email && <p className="text-sm text-gray-500 mt-1">{partner.email}</p>}
        {partner.note && <p className="text-sm text-gray-500 mt-1">{partner.note}</p>}
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {showEdit && (
        <div className="bg-[#E8F7FC] rounded-xl p-4 mb-6 flex flex-wrap gap-2 items-end">
          <label className="text-xs text-gray-600">Ime<br /><input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={inp} /></label>
          <label className="text-xs text-gray-600">Mejl<br /><input value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} className={inp} /></label>
          <label className="text-xs text-gray-600">Iznos po upisu<br /><input type="number" min="0" value={edit.feeRsd} onChange={(e) => setEdit({ ...edit, feeRsd: e.target.value })} className={`${inp} w-28`} /></label>
          <label className="text-xs text-gray-600">Napomena<br /><input value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} className={`${inp} w-64`} /></label>
          <button disabled={busy === "edit"} onClick={() => call("edit", `/api/admin/saradnici/${partner.id}`, "PATCH", { ...edit, feeRsd: Number(edit.feeRsd) }, () => setShowEdit(false))}
            className="px-3 py-1 rounded-lg bg-plava text-white disabled:opacity-50">Snimi</button>
          <button disabled={busy === "toggle"} onClick={() => { if (confirm(partner.is_active ? "Deaktivirati saradnika? Gase se i svi njegovi kodovi." : "Aktivirati saradnika? Kodove aktiviraj posebno na stranici Kuponi.")) call("toggle", `/api/admin/saradnici/${partner.id}`, "PATCH", { isActive: !partner.is_active }, () => setShowEdit(false)); }}
            className={`px-3 py-1 rounded-lg ${partner.is_active ? "bg-red-50 text-[#F78687]" : "bg-green-50 text-green-600"} disabled:opacity-50`}>
            {partner.is_active ? "Deaktiviraj" : "Aktiviraj"}
          </button>
        </div>
      )}

      {showCode && (
        <div className="bg-[#E8F7FC] rounded-xl p-4 mb-6 flex flex-wrap gap-2 items-end">
          <label className="text-xs text-gray-600">Kod<br /><input value={code.code} onChange={(e) => setCode({ ...code, code: e.target.value.toUpperCase() })} className={`${inp} font-mono`} placeholder="npr. ANA-IG" /></label>
          <label className="text-xs text-gray-600">Popust %<br /><input type="number" min="1" max="100" value={code.percent} onChange={(e) => setCode({ ...code, percent: e.target.value })} className={`${inp} w-20`} /></label>
          <label className="text-xs text-gray-600">Proizvod<br />
            <select value={code.courseId} onChange={(e) => setCode({ ...code, courseId: e.target.value })} className={inp}>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select></label>
          <label className="text-xs text-gray-600">Važi do<br /><input type="date" value={code.expiresDate} onChange={(e) => setCode({ ...code, expiresDate: e.target.value })} className={inp} /></label>
          <button disabled={busy === "code"} onClick={() => call("code", `/api/admin/saradnici/${partner.id}/kuponi`, "POST", { ...code, percent: Number(code.percent), expiresDate: code.expiresDate || null }, () => { setShowCode(false); setCode({ ...code, code: "", expiresDate: "" }); })}
            className="px-3 py-1 rounded-lg bg-plava text-white disabled:opacity-50">Snimi</button>
        </div>
      )}

      {showPay && (
        <div className="bg-[#E8F7FC] rounded-xl p-4 mb-6 flex flex-wrap gap-2 items-end">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="1" placeholder="Iznos" className={`${inp} w-28`} />
          <input value={payDate} onChange={(e) => setPayDate(e.target.value)} type="date" className={inp} />
          <input value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="Napomena" className={`${inp} w-48`} />
          <button disabled={busy === "pay"} onClick={() => call("pay", `/api/admin/saradnici/${partner.id}/isplate`, "POST", { amount: Number(amount), paidAt: payDate, note: payNote }, () => { setShowPay(false); setPayNote(""); })}
            className="px-3 py-1 rounded-lg bg-plava text-white disabled:opacity-50">Snimi</button>
        </div>
      )}

      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {[
          ["Po upisu", `${fmt(partner.fee_rsd)} din`],
          ["Upisane", String(partner.upisane)],
          ["Pripada", `${fmt(partner.pripada)} din`],
          ["Isplaćeno", `${fmt(partner.isplaceno)} din`],
          ["Saldo", `${fmt(partner.saldo)} din`],
        ].map(([l, v]) => (
          <div key={l} className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-xs text-gray-500 uppercase">{l}</div>
            <div className="text-lg font-semibold text-gray-900">{v}</div>
          </div>
        ))}
      </section>

      <section className="mb-8">
        <h2 className="font-medium text-gray-900 mb-3">Kodovi</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm"><tbody className="divide-y divide-gray-50">
            {partner.codes.map((c) => (
              <tr key={c.id} className={c.is_active ? "" : "text-gray-400"}>
                <td className="px-4 py-3 font-mono">{c.code}</td>
                <td className="px-4 py-3">{c.amount}%</td>
                <td className="px-4 py-3">{c.course_title ?? "svi proizvodi"}</td>
                <td className="px-4 py-3">{c.expires_at ? `do ${datum(c.expires_at)}` : "bez isteka"}</td>
                <td className="px-4 py-3">{c.is_active ? "aktivan" : "ugašen"}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
        <p className="text-xs text-gray-400 mt-2">Paljenje i gašenje pojedinačnog koda je na stranici <Link href="/admin/kuponi" className="underline">Kuponi</Link>.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-medium text-gray-900 mb-3">Porudžbine sa kodom ({partner.orders.length})</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          {partner.orders.length === 0 ? <p className="px-4 py-4 text-gray-400 text-sm">Još nema porudžbina.</p> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs"><tr>
                <th className="text-left px-4 py-3">Datum</th><th className="text-left px-4 py-3">Kupac</th><th className="text-left px-4 py-3">Proizvod</th>
                <th className="text-right px-4 py-3">Plaćeno</th><th className="text-right px-4 py-3">Saradniku</th><th className="text-left px-4 py-3">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {partner.orders.map((o) => {
                  const s = STATUS[o.payment_status] ?? { label: o.payment_status, cls: "bg-gray-100 text-gray-500" };
                  return (
                    <tr key={o.id} className={o.payment_status === "completed" ? "" : "text-gray-400"}>
                      <td className="px-4 py-3">{datum(o.created_at)}{o.order_number && <span className="block text-xs text-gray-400">{o.order_number}</span>}</td>
                      <td className="px-4 py-3">{o.full_name}<span className="block text-xs text-gray-400">{o.email}</span></td>
                      <td className="px-4 py-3">{o.product_title}</td>
                      <td className="px-4 py-3 text-right">{fmt(o.total)}</td>
                      <td className="px-4 py-3 text-right">{o.partner_fee != null ? fmt(o.partner_fee) : "-"}</td>
                      <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-medium text-gray-900 mb-3">Isplate ({partner.payouts.length})</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          {partner.payouts.length === 0 ? <p className="px-4 py-4 text-gray-400 text-sm">Još nema isplata.</p> : (
            <table className="w-full text-sm"><tbody className="divide-y divide-gray-50">
              {partner.payouts.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">{datum(p.paid_at)}</td>
                  <td className="px-4 py-3 text-right">{fmt(p.amount)} din</td>
                  <td className="px-4 py-3 text-gray-500">{p.note ?? ""}</td>
                </tr>
              ))}
            </tbody></table>
          )}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Tipovi + lint**

Run: `./node_modules/.bin/tsc --noEmit && npm run lint`
Expected: bez grešaka.

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/saradnici/[id]"
git commit -m "feat(saradnici): detalj saradnika - porudžbine, isplate, izmena, dodatni kod

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Oznaka „saradnik: Ana" na `/admin/kuponi`

**Files:**
- Modify: `src/app/admin/kuponi/page.tsx:8-11`
- Modify: `src/app/admin/kuponi/KuponiClient.tsx:224-226` (ćelija Kod)

- [ ] **Step 1: Join na saradnika u upitu**

U `src/app/admin/kuponi/page.tsx` zameni `.select("*")` sa:

```ts
    .select("*, partners:partner_id(name)")
```

- [ ] **Step 2: Prikaz u tabeli**

U `KuponiClient.tsx`, ćelija sa kodom (linija ~224) postaje:

```tsx
                    <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">
                      {coupon.code}
                      {coupon.partners?.name && (
                        <a href={`/admin/saradnici/${coupon.partner_id}`}
                           className="ml-2 font-sans text-xs font-normal text-plava hover:underline">
                          saradnik: {coupon.partners.name}
                        </a>
                      )}
                    </td>
```

- [ ] **Step 3: Tipovi + lint**

Run: `./node_modules/.bin/tsc --noEmit && npm run lint`
Expected: bez grešaka. (Ako `tsc` prigovori na oblik `partners` iz Supabase upita, kastuj: `(coupons ?? []) as unknown as Coupon[]`.)

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/kuponi/page.tsx src/app/admin/kuponi/KuponiClient.tsx
git commit -m "feat(saradnici): oznaka saradnika uz kod na /admin/kuponi

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Lokalna provera, deploy, aktivacija ANA, smoke test

**Files:** nema novih. Uključi i već izmenjeni komentar u `src/app/api/cron/academy-cena/route.ts` (brisanje pomena kupona 590 €), ako još nije commit-ovan.

- [ ] **Step 1: Cela provera**

Run: `./node_modules/.bin/tsc --noEmit && npx vitest run && npm run lint`
Expected: sve zeleno.

- [ ] **Step 2: Lokalni pregled admin stranica**

Pokreni dev server kroz preview alat, otvori `/admin/saradnici` (mora da prikaže Anu: kod ANA precrtan jer je neaktivan, 5.000 po upisu, sve nule), `/admin/saradnici/<id>` (prazne porudžbine i isplate), `/admin/kuponi` (uz ANA piše „saradnik: Ana"). Probaj „Zabeleži isplatu" sa 1 din i datumom danas, pa proveri da se saldo promeni na -1; zatim obriši tu probnu isplatu SQL-om: `delete from partner_payouts where amount = 1;`

- [ ] **Step 3: Commit preostalog**

```bash
git add src/app/api/cron/academy-cena/route.ts
git commit -m "docs(academy): bez pomena kupona 590 € u komentaru crona

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 4: NAJAVA pa push (produkcija)**

Nataši reći: „Push na main = uživo. Ide: tabela saradnika, admin stranica Saradnici, kasa pamti saradnika. Kupon ANA je još ugašen. Da pušim?" Tek posle potvrde:

Run: `git push origin main`
Expected: Vercel deploy prolazi (proveri u Vercel MCP `list_deployments` ili `vercel ls`).

- [ ] **Step 5: Aktiviraj ANA**

SQL: `update public.coupons set is_active = true where code = 'ANA';`

- [ ] **Step 6: Smoke test na produkciji**

1. `curl "https://www.hartweger.rs/api/coupons/validate?code=ANA&courseSlug=nh-academy-gen2"` → JSON sa popustom 10% (bez greške).
2. `curl "https://www.hartweger.rs/api/coupons/validate?code=ANA&courseSlug=nemacki-a1-1"` → greška „važi samo za ...".
3. Otvori `https://www.hartweger.rs/kupovina/nh-academy-gen2`, ukucaj ANA, „Primeni" → cena 72.630 RSD.
4. `/admin/saradnici` na produkciji prikazuje Anu sa nulama i aktivnim kodom.
5. Ne praviti probnu porudžbinu na produkciji (fiskalizacija). Prvu pravu porudžbinu sa ANA proveriti u `/admin/saradnici/<id>`: kolona „Saradniku" mora biti 5.000.

- [ ] **Step 7: Javi Nataši**

„Uživo je" + rezultat smoke testa + šta da kaže Ani (kod ANA, 10%, samo NH Academy, do 29.9).

- [ ] **Step 8: Memorija**

Nova memorija `project_saradnici_afilijat.md` (tip project): šta je napravljeno, gde se dodaje novi saradnik (forma na `/admin/saradnici`), zamka da se ANA aktivira tek posle deploya, Balans kao sledeći planirani kod. Indeks `MEMORY.md`: jedan red u „Otvoreno — na meni".

---

## Samoprovera plana

- Spec „Baza": Task 1. „Kasa": Task 4. „Obračun": Task 2 (+ Task 5 I/O). „Admin lista/detalj/forma/dodaj kod/isplata/izmena": Task 6, 7, 8. „/admin/kuponi oznaka": Task 9. „Redosled isporuke + smoke": Task 10. „Važi do → 23:59 Beograd": Task 3.
- Imena su ista kroz sve zadatke: `computePartnerBalance`, `krajDanaBeograd`, `loadPartnerSummaries`, `loadPartnerDetail`, `parseKuponInput`, `insertPartnerCoupon`, polja `feeRsd`, `percent`, `courseId`, `expiresDate`, `paidAt`, `isActive`.
- Odstupanje od speca, namerno: ANA se u migraciji upisuje NEAKTIVAN i pali tek posle deploya (spec je rekao aktivan odmah). Razlog: između migracije i deploya porudžbina sa ANA ne bi imala `partner_fee`.
