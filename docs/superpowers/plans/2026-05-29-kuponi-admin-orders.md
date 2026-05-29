# Kuponi + Admin kreiranje narudžbina — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add coupon support to checkout flow and admin manual order creation to the admin narudžbine page.

**Architecture:** Coupons: validate API + checkout form coupon field + orders API applies discount. Admin orders: add POST to admin orders API + form in NarudzbineClient. Admin kuponi page for CRUD.

**Tech Stack:** Next.js App Router, Supabase, Tailwind CSS

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/app/api/coupons/validate/route.ts` | GET — validate coupon code |
| `src/app/kupovina/[slug]/CheckoutForm.tsx` | + coupon input field (modify) |
| `src/app/api/orders/route.ts` | + coupon validation & discount (modify) |
| `src/app/api/admin/coupons/route.ts` | GET list + POST create coupon |
| `src/app/api/admin/coupons/[id]/route.ts` | PATCH toggle active |
| `src/app/admin/kuponi/page.tsx` | Server page — load coupons |
| `src/app/admin/kuponi/KuponiClient.tsx` | Client — list + create + toggle |
| `src/app/api/admin/orders/route.ts` | + POST admin create order (modify) |
| `src/app/admin/narudzbine/NarudzbineClient.tsx` | + "Nova narudžbina" form (modify) |
| `src/components/AdminSidebar.tsx` | + "Kuponi" link (modify) |

---

### Task 1: Create coupons table in database

The `coupons` table is defined in migration 021 but does NOT exist in the database.

**Files:**
- Note: SQL runs in Supabase dashboard

- [ ] **Step 1: Run SQL in Supabase SQL Editor**

```sql
CREATE TABLE IF NOT EXISTS coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null,
  amount numeric not null,
  min_order int,
  max_uses int,
  usage_count int not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read active coupons"
    ON coupons FOR SELECT
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can do anything with coupons"
    ON coupons FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
          AND user_profiles.role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

- [ ] **Step 2: Verify table exists**

Query: `SELECT * FROM coupons LIMIT 1;` — should return empty result set, not error.

---

### Task 2: Coupon validation API

**Files:**
- Create: `src/app/api/coupons/validate/route.ts`

- [ ] **Step 1: Create validation endpoint**

```typescript
// src/app/api/coupons/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: "Kod je obavezan." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: coupon } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .single();

  if (!coupon) {
    return NextResponse.json({ error: "Kupon ne postoji ili nije aktivan." }, { status: 404 });
  }

  // Check expiry
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ error: "Kupon je istekao." }, { status: 400 });
  }

  // Check usage limit
  if (coupon.max_uses !== null && coupon.usage_count >= coupon.max_uses) {
    return NextResponse.json({ error: "Kupon je iskorišćen maksimalan broj puta." }, { status: 400 });
  }

  return NextResponse.json({
    code: coupon.code,
    discountPercent: Number(coupon.amount),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/coupons/validate/route.ts
git commit -m "feat: add coupon validation API endpoint"
```

---

### Task 3: Add coupon field to CheckoutForm

**Files:**
- Modify: `src/app/kupovina/[slug]/CheckoutForm.tsx`

- [ ] **Step 1: Add coupon state and UI**

Add these state variables after the existing ones (after line 40 `const [error, setError] = ...`):

```typescript
const [showCoupon, setShowCoupon] = useState(false);
const [couponCode, setCouponCode] = useState("");
const [couponLoading, setCouponLoading] = useState(false);
const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
const [couponError, setCouponError] = useState<string | null>(null);
```

Add this function after the state declarations:

```typescript
async function validateCoupon() {
  if (!couponCode.trim()) return;
  setCouponLoading(true);
  setCouponError(null);

  try {
    const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(couponCode.trim())}`);
    const data = await res.json();

    if (!res.ok) {
      setCouponError(data.error || "Nepoznata greška.");
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(data);
  } catch {
    setCouponError("Greška pri proveri kupona.");
  } finally {
    setCouponLoading(false);
  }
}

function removeCoupon() {
  setAppliedCoupon(null);
  setCouponCode("");
  setCouponError(null);
  setShowCoupon(false);
}
```

Add computed discounted price after `displayEur`:

```typescript
const discountedRsd = appliedCoupon
  ? Math.round(priceRsd * (1 - appliedCoupon.discountPercent / 100))
  : priceRsd;

const discountedEur = appliedCoupon
  ? Math.ceil((discountedRsd / EUR_RATE) * (1 + PAYPAL_SURCHARGE))
  : displayEur;
```

- [ ] **Step 2: Update price display in order summary card**

Replace the order summary card content (the price section inside `<div className="text-right flex-shrink-0">`) with:

```tsx
<div className="text-right flex-shrink-0">
  {paymentMethod === "uplatnica" ? (
    <div>
      {appliedCoupon && (
        <p className="text-gray-400 line-through text-sm">{formatPrice(priceRsd)} din</p>
      )}
      <p className="font-bold text-gray-900">{formatPrice(discountedRsd)} din</p>
    </div>
  ) : (
    <div>
      {appliedCoupon && (
        <p className="text-gray-400 line-through text-sm">{displayEur} €</p>
      )}
      <p className="font-bold text-gray-900">{discountedEur} €</p>
      <p className="text-xs text-gray-400 mt-0.5">+12% PayPal naknada</p>
    </div>
  )}
</div>
```

- [ ] **Step 3: Add coupon input UI**

Add this block right after the order summary card closing `</div>` (after line 99) and before the personal info section:

```tsx
{/* Coupon */}
<div className="bg-white border border-gray-200 rounded-xl p-5">
  {!showCoupon && !appliedCoupon ? (
    <button
      type="button"
      onClick={() => setShowCoupon(true)}
      className="text-sm text-plava hover:underline"
    >
      Imaš kupon?
    </button>
  ) : appliedCoupon ? (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-sm font-medium text-green-600">
          Kupon {appliedCoupon.code} — {appliedCoupon.discountPercent}% popusta
        </span>
      </div>
      <button
        type="button"
        onClick={removeCoupon}
        className="text-xs text-koral hover:underline"
      >
        Ukloni
      </button>
    </div>
  ) : (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="Unesi kupon kod"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-plava focus:border-transparent uppercase"
        />
        <button
          type="button"
          onClick={validateCoupon}
          disabled={couponLoading || !couponCode.trim()}
          className="px-4 py-2.5 bg-plava text-white rounded-lg text-sm font-medium hover:bg-plava-dark disabled:opacity-50 transition-colors"
        >
          {couponLoading ? "..." : "Primeni"}
        </button>
      </div>
      {couponError && (
        <p className="text-koral text-xs mt-2">{couponError}</p>
      )}
    </div>
  )}
</div>
```

- [ ] **Step 4: Update form submission to include coupon**

In `handleSubmit`, update the fetch body to include coupon code:

```typescript
body: JSON.stringify({
  courseSlug,
  fullName,
  email,
  country,
  paymentMethod,
  couponCode: appliedCoupon?.code || null,
}),
```

- [ ] **Step 5: Commit**

```bash
git add "src/app/kupovina/[slug]/CheckoutForm.tsx"
git commit -m "feat: add coupon field to checkout form"
```

---

### Task 4: Add coupon logic to orders API

**Files:**
- Modify: `src/app/api/orders/route.ts`

- [ ] **Step 1: Add coupon validation and discount to POST handler**

After the course loading block (after line 42), add coupon validation:

```typescript
// Validate coupon if provided
let discountPercent = 0;
let couponCode: string | null = null;

const rawCouponCode = (await request.clone().json()).couponCode;

if (rawCouponCode) {
  const { data: coupon } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", rawCouponCode.trim().toUpperCase())
    .eq("is_active", true)
    .single();

  if (coupon) {
    const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > new Date();
    const notMaxed = coupon.max_uses === null || coupon.usage_count < coupon.max_uses;

    if (notExpired && notMaxed) {
      discountPercent = Number(coupon.amount);
      couponCode = coupon.code;
    }
  }
}
```

Actually, better approach — extract couponCode from the already-parsed body. Modify the destructuring at the top of the handler:

Change line 8-9 from:
```typescript
const { fullName, email, country, courseSlug, paymentMethod } =
  await request.json();
```

To:
```typescript
const { fullName, email, country, courseSlug, paymentMethod, couponCode: rawCouponCode } =
  await request.json();
```

Then add coupon validation after course loading (after the `if (courseError || !course)` block):

```typescript
// Validate and apply coupon
let discountPercent = 0;
let validCouponCode: string | null = null;

if (rawCouponCode) {
  const { data: coupon } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", String(rawCouponCode).trim().toUpperCase())
    .eq("is_active", true)
    .single();

  if (coupon) {
    const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > new Date();
    const notMaxed = coupon.max_uses === null || coupon.usage_count < coupon.max_uses;

    if (notExpired && notMaxed) {
      discountPercent = Number(coupon.amount);
      validCouponCode = coupon.code;
    }
  }
}

const discount = discountPercent > 0
  ? Math.round(course.price * discountPercent / 100)
  : 0;
const finalPrice = course.price - discount;
```

- [ ] **Step 2: Update order insert to use discounted price**

Update the insert object to use the computed values. Change:
- `subtotal: course.price,` stays
- `total: course.price,` → `total: finalPrice,`
- Add `discount,` and `coupon_code: validCouponCode,`
- PayPal EUR should be based on finalPrice: change `calculatePaypalEur(course.price)` → `calculatePaypalEur(finalPrice)`

- [ ] **Step 3: Increment coupon usage after order creation**

After the order is successfully created (after the `if (orderError || !order)` check), add:

```typescript
// Increment coupon usage
if (validCouponCode) {
  await supabase.rpc("increment_coupon_usage", { coupon_code: validCouponCode });
}
```

Wait — we don't have an RPC. Simpler approach with raw update:

```typescript
if (validCouponCode) {
  await supabase
    .from("coupons")
    .update({ usage_count: supabase.rpc ? undefined : 0 })
    .eq("code", validCouponCode);
}
```

Actually, simplest safe approach — just use SQL-like increment. Supabase doesn't support atomic increment easily, so:

```typescript
if (validCouponCode) {
  const { data: coupon } = await supabase
    .from("coupons")
    .select("usage_count")
    .eq("code", validCouponCode)
    .single();

  if (coupon) {
    await supabase
      .from("coupons")
      .update({ usage_count: coupon.usage_count + 1 })
      .eq("code", validCouponCode);
  }
}
```

- [ ] **Step 4: Update email to use finalPrice**

Change `sendPaymentInstructionsEmail` call to use `finalPrice` instead of `course.price`:

```typescript
await sendPaymentInstructionsEmail(
  email,
  fullName,
  course.title,
  order.order_number,
  finalPrice,
  paymentMethod,
  paypalEur
);
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/orders/route.ts
git commit -m "feat: apply coupon discount in orders API"
```

---

### Task 5: Admin coupons API

**Files:**
- Create: `src/app/api/admin/coupons/route.ts`
- Create: `src/app/api/admin/coupons/[id]/route.ts`

- [ ] **Step 1: Create GET + POST /api/admin/coupons**

```typescript
// src/app/api/admin/coupons/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin" ? admin : null;
}

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { data: coupons } = await admin
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  return NextResponse.json({ coupons: coupons ?? [] });
}

export async function POST(request: Request) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { code, amount, maxUses, expiresAt } = await request.json();

  if (!code || !amount) {
    return NextResponse.json({ error: "Kod i procenat su obavezni." }, { status: 400 });
  }

  const { data: coupon, error } = await admin
    .from("coupons")
    .insert({
      code: code.trim().toUpperCase(),
      discount_type: "percent",
      amount: Number(amount),
      max_uses: maxUses ? Number(maxUses) : null,
      expires_at: expiresAt || null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Kupon sa tim kodom već postoji." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ coupon });
}
```

- [ ] **Step 2: Create PATCH /api/admin/coupons/[id]**

```typescript
// src/app/api/admin/coupons/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { is_active } = await request.json();

  const { data: coupon, error } = await admin
    .from("coupons")
    .update({ is_active })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ coupon });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/coupons/route.ts "src/app/api/admin/coupons/[id]/route.ts"
git commit -m "feat: add admin coupons API — list, create, toggle"
```

---

### Task 6: Admin kuponi page

**Files:**
- Create: `src/app/admin/kuponi/page.tsx`
- Create: `src/app/admin/kuponi/KuponiClient.tsx`
- Modify: `src/components/AdminSidebar.tsx`

- [ ] **Step 1: Create server page**

```typescript
// src/app/admin/kuponi/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import KuponiClient from "./KuponiClient";

export const dynamic = "force-dynamic";

export default async function AdminKuponiPage() {
  const supabase = createAdminClient();
  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  return <KuponiClient initialCoupons={coupons ?? []} />;
}
```

- [ ] **Step 2: Create client component**

```typescript
// src/app/admin/kuponi/KuponiClient.tsx
"use client";

import { useState } from "react";
import type { Coupon } from "@/lib/types";

interface Props {
  initialCoupons: Coupon[];
}

export default function KuponiClient({ initialCoupons }: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function createCoupon() {
    if (!code.trim() || !amount) return;
    setSaving(true);
    setFormError(null);

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          amount: Number(amount),
          maxUses: maxUses ? Number(maxUses) : null,
          expiresAt: expiresAt || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error);
        return;
      }

      setCoupons([data.coupon, ...coupons]);
      setShowForm(false);
      setCode("");
      setAmount("");
      setMaxUses("");
      setExpiresAt("");
    } catch {
      setFormError("Greška pri kreiranju kupona.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !currentActive }),
    });

    if (res.ok) {
      setCoupons(
        coupons.map((c) =>
          c.id === id ? { ...c, is_active: !currentActive } : c
        )
      );
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kuponi</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm bg-plava text-white px-4 py-2 rounded-lg hover:bg-plava-dark transition-colors"
        >
          {showForm ? "Otkaži" : "+ Novi kupon"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-plava-light rounded-xl p-5 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Kod</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="LETO20"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white uppercase"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Popust (%)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="20"
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Max korišćenja (opciono)</label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="50"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Važi do (opciono)</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              />
            </div>
          </div>
          {formError && <p className="text-koral text-xs">{formError}</p>}
          <button
            onClick={createCoupon}
            disabled={saving || !code.trim() || !amount}
            className="px-4 py-2 bg-plava text-white rounded-lg text-sm font-medium hover:bg-plava-dark disabled:opacity-50 transition-colors"
          >
            {saving ? "Kreiranje..." : "Kreiraj kupon"}
          </button>
        </div>
      )}

      {/* Table */}
      {coupons.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="text-left px-6 py-3">Kod</th>
                <th className="text-left px-6 py-3">Popust</th>
                <th className="text-left px-6 py-3">Iskorišćeno</th>
                <th className="text-left px-6 py-3">Važi do</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono font-medium text-gray-900">
                    {coupon.code}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{coupon.amount}%</td>
                  <td className="px-6 py-4 text-gray-600">
                    {coupon.usage_count}
                    {coupon.max_uses !== null && ` / ${coupon.max_uses}`}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {coupon.expires_at
                      ? new Date(coupon.expires_at).toLocaleDateString("sr-RS")
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        coupon.is_active
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {coupon.is_active ? "Aktivan" : "Neaktivan"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleActive(coupon.id, coupon.is_active)}
                      className={`text-xs hover:underline ${
                        coupon.is_active ? "text-koral" : "text-green-600"
                      }`}
                    >
                      {coupon.is_active ? "Deaktiviraj" : "Aktiviraj"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm">
          Nema kupona.
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add "Kuponi" link to AdminSidebar**

In `src/components/AdminSidebar.tsx`, add after the "Narudžbine" link:

```typescript
{ href: "/admin/kuponi", label: "Kuponi" },
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/kuponi/page.tsx src/app/admin/kuponi/KuponiClient.tsx src/components/AdminSidebar.tsx
git commit -m "feat: add admin kuponi page — list, create, toggle active"
```

---

### Task 7: Admin manual order creation — API

**Files:**
- Modify: `src/app/api/admin/orders/route.ts`

- [ ] **Step 1: Add POST handler to admin orders API**

Add this after the existing `GET` function in `src/app/api/admin/orders/route.ts`:

```typescript
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { email, courseId, totalAmount, paymentMethod, markAsPaid } = await request.json();

  if (!email || !courseId || !totalAmount || !paymentMethod) {
    return NextResponse.json({ error: "Sva polja su obavezna." }, { status: 400 });
  }

  // Load course
  const { data: course } = await admin
    .from("courses")
    .select("id, slug, title, price")
    .eq("id", courseId)
    .single();

  if (!course) {
    return NextResponse.json({ error: "Kurs nije pronađen." }, { status: 404 });
  }

  // Find or create user
  let userId: string;
  const emailLower = email.toLowerCase().trim();

  const { data: existingProfile } = await admin
    .from("user_profiles")
    .select("id")
    .eq("email", emailLower)
    .single();

  if (existingProfile) {
    userId = existingProfile.id;
  } else {
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email: emailLower,
      email_confirm: true,
    });
    if (createErr || !newUser.user) {
      return NextResponse.json({ error: "Greška pri kreiranju korisnika." }, { status: 500 });
    }
    userId = newUser.user.id;
    await admin.from("user_profiles").upsert({
      id: userId,
      email: emailLower,
      full_name: emailLower,
      role: "student",
    });
  }

  // Generate order number
  const { generateOrderNumber } = await import("@/lib/order-utils");
  const orderNumber = await generateOrderNumber();

  // Create order
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      user_id: userId,
      email: emailLower,
      full_name: emailLower,
      country: "RS",
      items: [{ course_id: course.id, course_slug: course.slug, title: course.title, price: Number(totalAmount) }],
      subtotal: Number(totalAmount),
      total: Number(totalAmount),
      payment_method: paymentMethod,
      payment_status: markAsPaid ? "completed" : "pending",
      order_number: orderNumber,
      granted: !!markAsPaid,
    })
    .select("*")
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Greška pri kreiranju narudžbine." }, { status: 500 });
  }

  // If marked as paid, grant access + send welcome email
  if (markAsPaid) {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { data: existing } = await admin
      .from("course_access")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", course.id)
      .single();

    if (!existing) {
      await admin.from("course_access").insert({
        user_id: userId,
        course_id: course.id,
        expires_at: expiresAt.toISOString(),
      });
    }

    const { sendWelcomeEmail } = await import("@/lib/email");
    await sendWelcomeEmail(emailLower, emailLower, [course.title]);
  }

  return NextResponse.json({ order });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/orders/route.ts
git commit -m "feat: add POST admin orders API — manual order creation"
```

---

### Task 8: Admin "Nova narudžbina" form in NarudzbineClient

**Files:**
- Modify: `src/app/admin/narudzbine/NarudzbineClient.tsx`
- Modify: `src/app/admin/narudzbine/page.tsx`

- [ ] **Step 1: Pass courses list to client**

Update `src/app/admin/narudzbine/page.tsx`:

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import NarudzbineClient from "./NarudzbineClient";

export const dynamic = "force-dynamic";

export default async function AdminNarudzbinePage() {
  const supabase = createAdminClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug, price")
    .eq("is_purchasable", true)
    .order("title");

  return <NarudzbineClient initialOrders={orders ?? []} courses={courses ?? []} />;
}
```

- [ ] **Step 2: Add "Nova narudžbina" form to NarudzbineClient**

In `src/app/admin/narudzbine/NarudzbineClient.tsx`:

Update the Props interface and add course type:

```typescript
interface CourseOption {
  id: string;
  title: string;
  slug: string;
  price: number;
}

interface Props {
  initialOrders: Order[];
  courses: CourseOption[];
}
```

Update the function signature:

```typescript
export default function NarudzbineClient({ initialOrders, courses }: Props) {
```

Add new state after existing state:

```typescript
const [showNewForm, setShowNewForm] = useState(false);
const [newEmail, setNewEmail] = useState("");
const [newCourseId, setNewCourseId] = useState("");
const [newAmount, setNewAmount] = useState("");
const [newPayment, setNewPayment] = useState("uplatnica");
const [newMarkPaid, setNewMarkPaid] = useState(false);
const [newLoading, setNewLoading] = useState(false);
const [newError, setNewError] = useState<string | null>(null);
```

Add create order function:

```typescript
async function createOrder() {
  if (!newEmail || !newCourseId || !newAmount) return;
  setNewLoading(true);
  setNewError(null);

  try {
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newEmail,
        courseId: newCourseId,
        totalAmount: Number(newAmount),
        paymentMethod: newPayment,
        markAsPaid: newMarkPaid,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setNewError(data.error);
      return;
    }

    setOrders([data.order, ...orders]);
    setShowNewForm(false);
    setNewEmail("");
    setNewCourseId("");
    setNewAmount("");
    setNewPayment("uplatnica");
    setNewMarkPaid(false);
  } catch {
    setNewError("Greška pri kreiranju narudžbine.");
  } finally {
    setNewLoading(false);
  }
}
```

Add auto-fill price when course is selected:

```typescript
function handleCourseChange(courseId: string) {
  setNewCourseId(courseId);
  const course = courses.find((c) => c.id === courseId);
  if (course) setNewAmount(String(course.price));
}
```

Update the header to add the button — replace the existing header div with:

```tsx
<div className="flex items-center justify-between mb-6">
  <h1 className="text-2xl font-bold text-gray-900">Narudžbine</h1>
  <div className="flex items-center gap-3">
    <span className="text-sm text-gray-500">{orders.length} ukupno</span>
    <button
      onClick={() => setShowNewForm(!showNewForm)}
      className="text-sm bg-plava text-white px-4 py-2 rounded-lg hover:bg-plava-dark transition-colors"
    >
      {showNewForm ? "Otkaži" : "+ Nova narudžbina"}
    </button>
  </div>
</div>
```

Add the form after the header, before filter buttons:

```tsx
{showNewForm && (
  <div className="bg-plava-light rounded-xl p-5 mb-6 space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs text-gray-500 block mb-1">Email kupca</label>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="kupac@email.com"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Kurs</label>
        <select
          value={newCourseId}
          onChange={(e) => handleCourseChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">Izaberi kurs...</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} ({c.price.toLocaleString("sr-RS")} din)
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Iznos (RSD)</label>
        <input
          type="number"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Način plaćanja</label>
        <select
          value={newPayment}
          onChange={(e) => setNewPayment(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="uplatnica">Uplatnica</option>
          <option value="paypal">PayPal</option>
        </select>
      </div>
    </div>
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={newMarkPaid}
        onChange={(e) => setNewMarkPaid(e.target.checked)}
        className="rounded"
      />
      Označi odmah kao plaćeno (daje pristup kursu)
    </label>
    {newError && <p className="text-koral text-xs">{newError}</p>}
    <button
      onClick={createOrder}
      disabled={newLoading || !newEmail || !newCourseId || !newAmount}
      className="px-4 py-2 bg-plava text-white rounded-lg text-sm font-medium hover:bg-plava-dark disabled:opacity-50 transition-colors"
    >
      {newLoading ? "Kreiranje..." : "Kreiraj narudžbinu"}
    </button>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/narudzbine/page.tsx src/app/admin/narudzbine/NarudzbineClient.tsx
git commit -m "feat: add admin manual order creation form"
```

---

### Task 9: End-to-end verification

- [ ] **Step 1: Create coupons table** (if not already done in Task 1)

- [ ] **Step 2: Test coupon flow**

1. Create a coupon in `/admin/kuponi` (e.g. TEST20, 20%)
2. Go to `/kupovina/paket-a1-a2`
3. Click "Imaš kupon?", enter TEST20, click "Primeni"
4. Verify: old price crossed out, new price 20% lower
5. Submit order, verify order has discount + coupon_code

- [ ] **Step 3: Test admin order creation**

1. Go to `/admin/narudzbine`
2. Click "+ Nova narudžbina"
3. Enter email, select course, set amount
4. Check "Označi odmah kao plaćeno"
5. Verify: order appears as completed, course_access granted

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: kuponi and admin order adjustments from testing"
```
