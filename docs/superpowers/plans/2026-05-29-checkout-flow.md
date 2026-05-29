# Checkout Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable customers to purchase courses via uplatnica (bank slip) or PayPal, with admin confirmation triggering course access.

**Architecture:** Server-rendered checkout page loads course data, client-side form handles country-dependent payment selection. API route creates order + user, redirects to thank-you page showing payment instructions. Admin page lists pending orders with confirm button that grants access + sends welcome email.

**Tech Stack:** Next.js (App Router), Supabase (admin client for user creation), Resend (emails), IPS QR code generation

---

## File Structure

| File | Responsibility |
|------|---------------|
| `supabase/migrations/025_orders_order_number.sql` | Add `order_number` TEXT column to orders table |
| `src/lib/order-utils.ts` | Order number generation, EUR rate constant, payment config |
| `src/lib/email.ts` | Add `sendPaymentInstructionsEmail()` (modify existing) |
| `src/app/api/orders/route.ts` | POST — create order + user |
| `src/app/kupovina/[slug]/page.tsx` | Server: load course data |
| `src/app/kupovina/[slug]/CheckoutForm.tsx` | Client: checkout form with country-dependent payment |
| `src/app/kupovina/hvala/[orderId]/page.tsx` | Thank you page with payment instructions + IPS QR |
| `src/app/api/admin/orders/route.ts` | GET — list orders for admin |
| `src/app/api/admin/orders/[id]/confirm/route.ts` | POST — confirm payment, grant access |
| `src/app/admin/narudzbine/page.tsx` | Admin orders list page |
| `src/app/admin/narudzbine/NarudzbineClient.tsx` | Client component — filters + confirm button |
| `src/components/AdminSidebar.tsx` | Add "Narudžbine" link (modify existing) |

---

### Task 1: Database — add order_number column

The `orders` table exists in migration 021 but needs a human-readable sequential order number for poziv na broj.

**Files:**
- Create: `supabase/migrations/025_orders_order_number.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Add sequential order number for poziv na broj (uplatnica)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number text UNIQUE;
```

- [ ] **Step 2: Run migration against Supabase**

Run: `npx supabase db push` or execute SQL directly in Supabase dashboard.
Expected: Column `order_number` added to `orders` table.

- [ ] **Step 3: Verify orders table exists**

Before proceeding, verify the `orders` table actually exists in the database (migration 021 may not have been applied). Check via Supabase dashboard or run:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'orders';
```
If the table doesn't exist, run the full migration 021 SQL first.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/025_orders_order_number.sql
git commit -m "feat: add order_number column to orders table"
```

---

### Task 2: Order utilities — number generation, payment config

**Files:**
- Create: `src/lib/order-utils.ts`

- [ ] **Step 1: Create order-utils.ts**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";

// Hardcoded EUR exchange rate — admin updates manually
export const EUR_RATE = 117;

// PayPal surcharge percentage
export const PAYPAL_SURCHARGE = 0.12;

// Bank account details for uplatnica
export const BANK_DETAILS = {
  primalac: "Hartweger, Beograd, 11070 Beograd",
  racun: "170-10559767000-18",
  sifraPalcanja: "189",
  model: "",
} as const;

export const PAYPAL_ME_URL = "https://www.paypal.com/paypalme/natasahartweger1";

/**
 * Generate next order number in format YYYY-NNN (e.g. 2026-001)
 * Used as poziv na broj for uplatnica payments.
 */
export async function generateOrderNumber(): Promise<string> {
  const supabase = createAdminClient();
  const year = new Date().getFullYear();
  const yearStart = `${year}-01-01T00:00:00Z`;

  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", yearStart);

  const seq = (count ?? 0) + 1;
  return `${year}-${String(seq).padStart(3, "0")}`;
}

/**
 * Calculate PayPal price in EUR with 12% surcharge
 */
export function calculatePaypalEur(priceRsd: number): number {
  return Math.ceil((priceRsd / EUR_RATE) * (1 + PAYPAL_SURCHARGE));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/order-utils.ts
git commit -m "feat: add order utility functions — number generation, payment config"
```

---

### Task 3: Payment instructions email

**Files:**
- Modify: `src/lib/email.ts` — add `sendPaymentInstructionsEmail()`

- [ ] **Step 1: Add sendPaymentInstructionsEmail to email.ts**

Add this function at the end of `src/lib/email.ts`:

```typescript
export async function sendPaymentInstructionsEmail(
  to: string,
  name: string,
  courseTitle: string,
  orderNumber: string,
  totalRsd: number,
  paymentMethod: "uplatnica" | "paypal",
  paypalEur?: number
) {
  const paymentBlock =
    paymentMethod === "uplatnica"
      ? `
      <div style="background: #f8fcfd; border-left: 3px solid #4fb1d3; border-radius: 6px; padding: 14px 16px; margin: 0 0 20px;">
        <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Podaci za uplatu</div>
        <table style="font-size: 14px; color: #1a1a2e; line-height: 1.8;">
          <tr><td style="color: #666; padding-right: 12px;">Primalac:</td><td><strong>Hartweger, Beograd, 11070 Beograd</strong></td></tr>
          <tr><td style="color: #666; padding-right: 12px;">Broj računa:</td><td><strong>170-10559767000-18</strong></td></tr>
          <tr><td style="color: #666; padding-right: 12px;">Iznos:</td><td><strong>${totalRsd.toLocaleString("sr-RS")} RSD</strong></td></tr>
          <tr><td style="color: #666; padding-right: 12px;">Poziv na broj:</td><td><strong>${orderNumber}</strong></td></tr>
          <tr><td style="color: #666; padding-right: 12px;">Svrha:</td><td>Placanje porudzbine #${orderNumber}</td></tr>
          <tr><td style="color: #666; padding-right: 12px;">Šifra plaćanja:</td><td>189</td></tr>
        </table>
      </div>`
      : `
      <div style="background: #f8fcfd; border-left: 3px solid #4fb1d3; border-radius: 6px; padding: 14px 16px; margin: 0 0 20px;">
        <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">PayPal uplata</div>
        <p style="font-size: 14px; color: #1a1a2e; margin: 0 0 8px;">
          Iznos: <strong>${paypalEur} EUR</strong> (uključena provizija od 12%)
        </p>
        <p style="font-size: 14px; color: #1a1a2e; margin: 0 0 12px;">
          U napomeni navedite broj narudžbine: <strong>${orderNumber}</strong>
        </p>
        <div style="text-align: center; margin: 16px 0;">
          <a href="https://www.paypal.com/paypalme/natasahartweger1/${paypalEur}EUR" style="display: inline-block; background: #0070ba; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">
            Plati putem PayPal-a
          </a>
        </div>
      </div>`;

  try {
    const resend = getResend();
    if (!resend) return;
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Narudžbina #${orderNumber} — instrukcije za uplatu`,
      html: `
<!DOCTYPE html>
<html lang="sr">
<head><meta charset="utf-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #f8f9fa; margin: 0; padding: 0;">
  <div style="max-width: 520px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 24px; font-weight: 700; color: #4fb1d3;">Hartweger</div>
        <div style="font-size: 13px; color: #999; margin-top: 4px;">Škola nemačkog jezika</div>
      </div>

      <h1 style="font-size: 20px; color: #1a1a2e; margin: 0 0 16px;">
        Zdravo, ${name || "učeniče"}!
      </h1>

      <p style="font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 16px;">
        Hvala na narudžbini! Naručili ste kurs <strong>${courseTitle}</strong>.
        Kada primimo uplatu, aktiviraćemo pristup i obavestiti vas mejlom.
      </p>

      ${paymentBlock}

      <p style="font-size: 13px; color: #999; line-height: 1.5; margin: 0;">
        Imate pitanje? Odgovorite na ovaj mejl ili nas kontaktirajte na
        <a href="mailto:info@hartweger.rs" style="color: #4fb1d3; text-decoration: none;">info@hartweger.rs</a>
      </p>

    </div>

    <div style="text-align: center; padding: 20px; font-size: 12px; color: #bbb;">
      <p style="margin: 0;">Hartweger — Škola nemačkog jezika</p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    });
    console.log(`[email] Payment instructions sent to ${to} for order ${orderNumber}`);
  } catch (error) {
    console.error(`[email] Failed to send payment instructions to ${to}:`, error);
  }
}
```

Note: `FROM` and `getResend()` are already defined at the top of `email.ts`.

- [ ] **Step 2: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat: add payment instructions email for checkout orders"
```

---

### Task 4: Orders API — create order endpoint

**Files:**
- Create: `src/app/api/orders/route.ts`

- [ ] **Step 1: Create the orders API route**

```typescript
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOrderNumber, calculatePaypalEur } from "@/lib/order-utils";
import { sendPaymentInstructionsEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { fullName, email, country, courseSlug, paymentMethod } =
      await request.json();

    if (!fullName || !email || !courseSlug || !paymentMethod) {
      return NextResponse.json(
        { error: "Sva polja su obavezna." },
        { status: 400 }
      );
    }

    if (!["uplatnica", "paypal"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Nepoznat način plaćanja." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Load course
    const { data: course } = await supabase
      .from("courses")
      .select("id, title, slug, price, paypal_price_eur")
      .eq("slug", courseSlug)
      .eq("is_purchasable", true)
      .single();

    if (!course) {
      return NextResponse.json(
        { error: "Kurs nije pronađen." },
        { status: 404 }
      );
    }

    // 2. Find or create user
    let userId: string;
    const emailLower = email.toLowerCase().trim();

    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("email", emailLower)
      .single();

    if (existingProfile) {
      userId = existingProfile.id;
    } else {
      const { data: newUser, error: createErr } =
        await supabase.auth.admin.createUser({
          email: emailLower,
          email_confirm: true,
        });
      if (createErr || !newUser.user) {
        console.error("[orders] Failed to create user:", createErr);
        return NextResponse.json(
          { error: "Greška pri kreiranju naloga." },
          { status: 500 }
        );
      }
      userId = newUser.user.id;

      await supabase.from("user_profiles").upsert({
        id: userId,
        email: emailLower,
        full_name: fullName.trim(),
        role: "student",
      });
    }

    // 3. Generate order number
    const orderNumber = await generateOrderNumber();

    // 4. Calculate totals
    const totalRsd = course.price;
    const paypalEur =
      paymentMethod === "paypal" ? calculatePaypalEur(totalRsd) : null;

    // 5. Create order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        email: emailLower,
        full_name: fullName.trim(),
        country: country || "RS",
        items: [
          {
            course_id: course.id,
            course_slug: course.slug,
            title: course.title,
            price: course.price,
          },
        ],
        subtotal: totalRsd,
        discount: 0,
        total: totalRsd,
        payment_method: paymentMethod,
        payment_status: "pending",
        order_number: orderNumber,
        paypal_note: paypalEur ? `${paypalEur} EUR` : null,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      console.error("[orders] Failed to create order:", orderErr);
      return NextResponse.json(
        { error: "Greška pri kreiranju narudžbine." },
        { status: 500 }
      );
    }

    // 6. Send payment instructions email
    await sendPaymentInstructionsEmail(
      emailLower,
      fullName.trim(),
      course.title,
      orderNumber,
      totalRsd,
      paymentMethod as "uplatnica" | "paypal",
      paypalEur ?? undefined
    );

    console.log(
      `[orders] Order ${orderNumber} created for ${emailLower}: ${course.title} (${paymentMethod})`
    );

    return NextResponse.json({ orderId: order.id, orderNumber });
  } catch (error) {
    console.error("[orders] Error:", error);
    return NextResponse.json(
      { error: "Greška na serveru." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/orders/route.ts
git commit -m "feat: add POST /api/orders — create order and user"
```

---

### Task 5: Checkout page — server component + client form

**Files:**
- Create: `src/app/kupovina/[slug]/page.tsx`
- Create: `src/app/kupovina/[slug]/CheckoutForm.tsx`

- [ ] **Step 1: Create server page (loads course data)**

```typescript
// src/app/kupovina/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutForm from "./CheckoutForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("title")
    .eq("slug", slug)
    .eq("is_purchasable", true)
    .single();
  if (!course) return { title: "Kupovina — Hartweger" };
  return {
    title: `Kupovina: ${course.title} — Hartweger`,
    robots: { index: false },
  };
}

export default async function KupovinaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, slug, price, paypal_price_eur, description, category")
    .eq("slug", slug)
    .eq("is_purchasable", true)
    .single();

  if (!course) notFound();

  return (
    <section className="bg-gradient-to-b from-plava-light/40 to-white min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-10 md:py-16">
        <h1 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 mb-2">
          Kupovina
        </h1>
        <p className="text-gray-500 mb-8">
          {course.title}
        </p>

        <CheckoutForm
          courseSlug={course.slug}
          courseTitle={course.title}
          priceRsd={course.price}
          priceEur={course.paypal_price_eur}
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create client checkout form**

```typescript
// src/app/kupovina/[slug]/CheckoutForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EUR_RATE, PAYPAL_SURCHARGE } from "@/lib/order-utils";

// Common countries for the dropdown
const COUNTRIES = [
  { code: "RS", name: "Srbija" },
  { code: "DE", name: "Nemačka" },
  { code: "AT", name: "Austrija" },
  { code: "CH", name: "Švajcarska" },
  { code: "BA", name: "Bosna i Hercegovina" },
  { code: "HR", name: "Hrvatska" },
  { code: "ME", name: "Crna Gora" },
  { code: "MK", name: "Severna Makedonija" },
  { code: "SI", name: "Slovenija" },
  { code: "US", name: "SAD" },
  { code: "GB", name: "Velika Britanija" },
  { code: "CA", name: "Kanada" },
  { code: "OTHER", name: "Druga zemlja" },
];

function formatPrice(price: number): string {
  return price.toLocaleString("de-DE");
}

interface Props {
  courseSlug: string;
  courseTitle: string;
  priceRsd: number;
  priceEur: number | null;
}

export default function CheckoutForm({
  courseSlug,
  courseTitle,
  priceRsd,
  priceEur,
}: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("RS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSrbija = country === "RS";
  const paymentMethod = isSrbija ? "uplatnica" : "paypal";

  // Calculate PayPal EUR price
  const paypalEur = priceEur ?? Math.ceil((priceRsd / EUR_RATE) * (1 + PAYPAL_SURCHARGE));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          country,
          courseSlug,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Greška pri kreiranju narudžbine.");
        setLoading(false);
        return;
      }

      router.push(`/kupovina/hvala/${data.orderId}`);
    } catch {
      setError("Greška na serveru. Pokušajte ponovo.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-bold text-gray-900 mb-1">{courseTitle}</h2>
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold text-gray-900">
            {formatPrice(priceRsd)} din
          </span>
          {!isSrbija && (
            <span className="text-koral font-bold">≈ {paypalEur}€</span>
          )}
        </div>
      </div>

      {/* Form fields */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Ime i prezime
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava/30 focus:border-plava"
            placeholder="Marko Marković"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava/30 focus:border-plava"
            placeholder="marko@email.com"
          />
        </div>

        <div>
          <label
            htmlFor="country"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Zemlja
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-plava/30 focus:border-plava"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payment method info */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Način plaćanja
        </h3>
        {isSrbija ? (
          <div className="flex items-center gap-3 bg-plava-light rounded-lg px-4 py-3">
            <span className="text-xl">🏦</span>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                Opšta uplatnica
              </p>
              <p className="text-xs text-gray-500">
                Dobićete podatke za uplatu na sledeću stranicu i na email
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-blue-50 rounded-lg px-4 py-3">
            <span className="text-xl">💳</span>
            <div>
              <p className="font-medium text-gray-900 text-sm">PayPal</p>
              <p className="text-xs text-gray-500">
                {paypalEur}€ (uključena provizija od 12% za konverziju u EUR)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-koral-light text-koral px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-koral hover:bg-koral-dark text-white font-bold text-lg py-4 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-koral/20 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {loading ? "Obrada..." : "Naruči"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Klikom na &quot;Naruči&quot; prihvatate naše uslove korišćenja.
        Pristup kursu se aktivira nakon potvrde uplate.
      </p>
    </form>
  );
}
```

- [ ] **Step 3: Export order-utils constants for client**

The `CheckoutForm` imports `EUR_RATE` and `PAYPAL_SURCHARGE` from `order-utils.ts`. Since `generateOrderNumber()` uses the admin client (server-only), we need to split or ensure tree-shaking works. The simplest approach: the constants are plain values so they tree-shake fine. But `createAdminClient` import at module top level will break the client bundle.

Fix `src/lib/order-utils.ts`: move the `generateOrderNumber` function's import inside the function body:

```typescript
// Replace the top import line:
// import { createAdminClient } from "@/lib/supabase/admin";
// With a dynamic import inside generateOrderNumber:

export async function generateOrderNumber(): Promise<string> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  // ... rest stays the same
}
```

Remove the static `import { createAdminClient }` from the top of the file.

- [ ] **Step 4: Commit**

```bash
git add src/app/kupovina/[slug]/page.tsx src/app/kupovina/[slug]/CheckoutForm.tsx src/lib/order-utils.ts
git commit -m "feat: add checkout page with country-dependent payment"
```

---

### Task 6: Thank you page with payment instructions + IPS QR

**Files:**
- Create: `src/app/kupovina/hvala/[orderId]/page.tsx`

- [ ] **Step 1: Create thank you page**

```typescript
// src/app/kupovina/hvala/[orderId]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { BANK_DETAILS, PAYPAL_ME_URL } from "@/lib/order-utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hvala na narudžbini — Hartweger",
  robots: { index: false },
};

/**
 * Generate IPS QR code string per NBS specification.
 * Format: K:PR|V:01|C:1|R:{racun}|N:{primalac}|I:RSD{iznos}|P:{svrha}|SF:{sifra}|RO:{poziv}
 */
function generateIpsQrData(
  orderNumber: string,
  totalRsd: number
): string {
  const amount = totalRsd.toFixed(2);
  return [
    "K:PR",
    "V:01",
    "C:1",
    `R:${BANK_DETAILS.racun}`,
    `N:${BANK_DETAILS.primalac}`,
    `I:RSD${amount}`,
    `P:Placanje porudzbine #${orderNumber}`,
    `SF:${BANK_DETAILS.sifraPalcanja}`,
    `RO:${orderNumber}`,
  ].join("|");
}

export default async function HvalaPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) notFound();

  const items = order.items as { title: string }[];
  const courseTitle = items[0]?.title || "Kurs";
  const isUplatnica = order.payment_method === "uplatnica";

  // IPS QR data for uplatnica
  const ipsData = isUplatnica
    ? generateIpsQrData(order.order_number, order.total)
    : null;

  // QR code via Google Charts API (simple, no dependencies)
  const qrUrl = ipsData
    ? `https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${encodeURIComponent(ipsData)}&choe=UTF-8`
    : null;

  // PayPal EUR amount
  const paypalEur = order.paypal_note
    ? parseInt(order.paypal_note)
    : null;

  return (
    <section className="bg-gradient-to-b from-plava-light/40 to-white min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-10 md:py-16">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">✓</div>
          <h1 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 mb-2">
            Hvala na narudžbini!
          </h1>
          <p className="text-gray-500">
            Narudžbina <strong>#{order.order_number}</strong> za kurs{" "}
            <strong>{courseTitle}</strong>
          </p>
        </div>

        {/* Payment instructions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          {isUplatnica ? (
            <>
              <h2 className="font-bold text-gray-900 mb-4">
                Podaci za uplatu
              </h2>
              <table className="w-full text-sm mb-6">
                <tbody className="divide-y divide-gray-50">
                  <tr>
                    <td className="py-2.5 text-gray-500 w-36">Primalac</td>
                    <td className="py-2.5 font-medium text-gray-900">
                      {BANK_DETAILS.primalac}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-gray-500">Broj računa</td>
                    <td className="py-2.5 font-medium text-gray-900">
                      {BANK_DETAILS.racun}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-gray-500">Iznos</td>
                    <td className="py-2.5 font-medium text-gray-900">
                      {order.total.toLocaleString("sr-RS")} RSD
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-gray-500">Poziv na broj</td>
                    <td className="py-2.5 font-bold text-plava">
                      {order.order_number}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-gray-500">Svrha</td>
                    <td className="py-2.5 text-gray-900">
                      Placanje porudzbine #{order.order_number}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-gray-500">Šifra plaćanja</td>
                    <td className="py-2.5 text-gray-900">
                      {BANK_DETAILS.sifraPalcanja}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* IPS QR Code */}
              {qrUrl && (
                <div className="text-center border-t border-gray-100 pt-5">
                  <p className="text-sm text-gray-500 mb-3">
                    Skeniraj QR kod bankovnom aplikacijom:
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt="IPS QR kod za plaćanje"
                    width={200}
                    height={200}
                    className="mx-auto"
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="font-bold text-gray-900 mb-4">
                PayPal uplata
              </h2>
              <p className="text-sm text-gray-600 mb-2">
                Iznos: <strong>{paypalEur} EUR</strong>{" "}
                <span className="text-gray-400">
                  (uključena provizija od 12%)
                </span>
              </p>
              <p className="text-sm text-gray-600 mb-5">
                U napomeni navedite broj narudžbine:{" "}
                <strong>{order.order_number}</strong>
              </p>
              <a
                href={`${PAYPAL_ME_URL}/${paypalEur}EUR`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold py-3.5 rounded-xl transition-colors text-[15px]"
              >
                Plati putem PayPal-a — {paypalEur}€
              </a>
            </>
          )}
        </div>

        {/* Info */}
        <div className="bg-plava-light rounded-xl p-5 mb-6">
          <p className="text-sm text-gray-600">
            📧 Poslali smo instrukcije i na{" "}
            <strong>{order.email}</strong>. Kada primimo uplatu,
            aktiviraćemo pristup i obavestiti vas mejlom.
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/kursevi"
            className="text-plava hover:underline text-sm font-medium"
          >
            ← Nazad na kurseve
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify locally**

Run: `npm run dev`
Navigate to `/kupovina/[some-purchasable-slug]`, fill form, submit, check thank you page renders.

- [ ] **Step 3: Commit**

```bash
git add src/app/kupovina/hvala/[orderId]/page.tsx
git commit -m "feat: add thank you page with payment instructions and IPS QR"
```

---

### Task 7: Admin orders API endpoints

**Files:**
- Create: `src/app/api/admin/orders/route.ts`
- Create: `src/app/api/admin/orders/[id]/confirm/route.ts`

- [ ] **Step 1: Create GET /api/admin/orders**

```typescript
// src/app/api/admin/orders/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { data: orders } = await admin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  return NextResponse.json({ orders: orders ?? [] });
}
```

- [ ] **Step 2: Create POST /api/admin/orders/[id]/confirm**

```typescript
// src/app/api/admin/orders/[id]/confirm/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  // Load order
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (!order)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (order.payment_status === "completed")
    return NextResponse.json({ error: "Već potvrđeno" }, { status: 400 });

  // Grant access for each course in items
  const items = order.items as {
    course_id: string;
    course_slug: string;
    title: string;
  }[];
  const defaultExpiry = new Date();
  defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
  const courseTitles: string[] = [];

  for (const item of items) {
    const { data: existing } = await admin
      .from("course_access")
      .select("id")
      .eq("user_id", order.user_id)
      .eq("course_id", item.course_id)
      .single();

    if (!existing) {
      await admin.from("course_access").insert({
        user_id: order.user_id,
        course_id: item.course_id,
        expires_at: defaultExpiry.toISOString(),
      });
    }
    courseTitles.push(item.title);
  }

  // Update order status
  await admin
    .from("orders")
    .update({ payment_status: "completed", granted: true })
    .eq("id", id);

  // Send welcome email
  if (courseTitles.length > 0) {
    await sendWelcomeEmail(order.email, order.full_name, courseTitles);
  }

  console.log(
    `[admin] Order ${order.order_number} confirmed — access granted to ${order.email}`
  );

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/orders/route.ts src/app/api/admin/orders/[id]/confirm/route.ts
git commit -m "feat: add admin orders API — list and confirm payment"
```

---

### Task 8: Admin narudžbine page

**Files:**
- Create: `src/app/admin/narudzbine/page.tsx`
- Create: `src/app/admin/narudzbine/NarudzbineClient.tsx`
- Modify: `src/components/AdminSidebar.tsx`

- [ ] **Step 1: Create server page**

```typescript
// src/app/admin/narudzbine/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import NarudzbineClient from "./NarudzbineClient";

export const dynamic = "force-dynamic";

export default async function AdminNarudzbinePage() {
  const supabase = createAdminClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  return <NarudzbineClient initialOrders={orders ?? []} />;
}
```

- [ ] **Step 2: Create client component with filters and confirm button**

```typescript
// src/app/admin/narudzbine/NarudzbineClient.tsx
"use client";

import { useState } from "react";
import type { Order } from "@/lib/types";

type Filter = "all" | "pending" | "completed";

interface Props {
  initialOrders: Order[];
}

export default function NarudzbineClient({ initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<Filter>("all");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    if (filter === "pending") return o.payment_status === "pending";
    if (filter === "completed") return o.payment_status === "completed";
    return true;
  });

  const pendingCount = orders.filter(
    (o) => o.payment_status === "pending"
  ).length;

  async function confirmPayment(orderId: string) {
    setLoadingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/confirm`, {
        method: "POST",
      });
      if (res.ok) {
        setOrders(
          orders.map((o) =>
            o.id === orderId
              ? { ...o, payment_status: "completed", granted: true }
              : o
          )
        );
      }
    } catch {
      // silently fail — admin can retry
    }
    setLoadingId(null);
    setConfirmingId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Narudžbine</h1>
        {pendingCount > 0 && (
          <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
            {pendingCount} na čekanju
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(
          [
            ["all", "Sve"],
            ["pending", "Na čekanju"],
            ["completed", "Potvrđene"],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              filter === key
                ? "bg-plava text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="text-left px-6 py-3">#</th>
              <th className="text-left px-6 py-3">Kupac</th>
              <th className="text-left px-6 py-3">Kurs</th>
              <th className="text-left px-6 py-3">Iznos</th>
              <th className="text-left px-6 py-3">Plaćanje</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-left px-6 py-3">Datum</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((order) => {
              const items = order.items as { title: string }[];
              const courseTitle = items[0]?.title || "—";
              const isPending = order.payment_status === "pending";
              const isConfirming = confirmingId === order.id;
              const isLoading = loadingId === order.id;

              return (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    {order.order_number}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {order.full_name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {order.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{courseTitle}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {order.total.toLocaleString("sr-RS")} din
                    {order.paypal_note && (
                      <div className="text-xs text-gray-400">
                        {order.paypal_note}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 capitalize">
                    {order.payment_method}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        isPending
                          ? "bg-yellow-50 text-yellow-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {isPending ? "Na čekanju" : "Potvrđeno"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(order.created_at).toLocaleDateString(
                      "sr-RS"
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isPending &&
                      (isConfirming ? (
                        <span className="flex items-center justify-end gap-2">
                          <span className="text-xs text-gray-500">
                            Sigurno?
                          </span>
                          <button
                            onClick={() => confirmPayment(order.id)}
                            disabled={isLoading}
                            className="text-xs text-green-600 font-medium hover:underline disabled:opacity-50"
                          >
                            {isLoading ? "..." : "Da"}
                          </button>
                          <button
                            onClick={() => setConfirmingId(null)}
                            className="text-xs text-gray-400 hover:underline"
                          >
                            Ne
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmingId(order.id)}
                          className="text-xs bg-green-50 text-green-600 font-medium px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          Potvrdi uplatu
                        </button>
                      ))}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-8 text-center text-gray-400"
                >
                  Nema narudžbina.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add "Narudžbine" to AdminSidebar**

In `src/components/AdminSidebar.tsx`, add the link after "Pristup":

```typescript
// Find this line:
  { href: "/admin/pristup", label: "Pristup" },
// Add after it:
  { href: "/admin/narudzbine", label: "Narudžbine" },
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/narudzbine/page.tsx src/app/admin/narudzbine/NarudzbineClient.tsx src/components/AdminSidebar.tsx
git commit -m "feat: add admin orders page with confirm payment flow"
```

---

### Task 9: Add Order type to types.ts (order_number field)

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add order_number to Order interface**

In `src/lib/types.ts`, find the `Order` interface and add the `order_number` field:

```typescript
// Find:
  granted: boolean;
  created_at: string;
}
// In the Order interface, add before granted:
  order_number: string;
```

The full field should be:
```typescript
export interface Order {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  country: string;
  items: unknown;
  subtotal: number;
  discount: number;
  total: number;
  coupon_code: string | null;
  payment_method: string;
  payment_status: string;
  nestpay_transaction_id: string | null;
  paypal_note: string | null;
  fiscomm_invoice_id: string | null;
  order_number: string;
  granted: boolean;
  created_at: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add order_number field to Order type"
```

---

### Task 10: End-to-end verification

- [ ] **Step 1: Verify database**

Check that `orders` table exists with `order_number` column in Supabase dashboard.

- [ ] **Step 2: Test checkout flow**

1. Go to `/kursevi/[purchasable-slug]`, click "Kupi kurs"
2. Fill form with test data (Srbija), click "Naruči"
3. Verify: order created in DB, thank you page shows uplatnica details + QR code
4. Check email sent (Resend dashboard or test inbox)

- [ ] **Step 3: Test PayPal flow**

1. Same checkout but select a non-Serbia country
2. Verify: PayPal button shows with EUR amount
3. Thank you page shows PayPal link

- [ ] **Step 4: Test admin confirm flow**

1. Go to `/admin/narudzbine`
2. Find the test order (pending)
3. Click "Potvrdi uplatu" → "Da"
4. Verify: status changes to completed, course_access record created, welcome email sent

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: checkout flow adjustments from e2e testing"
```
