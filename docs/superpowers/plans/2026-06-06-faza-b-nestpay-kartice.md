# Faza B — NestPay kartice + rate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodati plaćanje karticom (NestPay 3D Secure, Banca Intesa) i „na rate" na checkout novog LMS-a, sa automatskim dodeljivanjem pristupa po uspešnoj naplati i hardening-om (server-side provera + reconciliation).

**Architecture:** Verni port `wc-serbian-nestpay` v1.2.2 (ver2 hash, `3d_pay_hosting`). Čista, testabilna jedinica `src/lib/nestpay.ts` (hash + form). Tok: `/api/orders` kreira `pending` narudžbinu → stranica `/kupovina/kartica/[orderId]` auto-submit formu na Intesa gateway → banka POST-uje na `/api/nestpay/callback` → verifikacija hash-a + server-side `query` + provera iznosa → `grantAccessForOrder()` → redirect na hvala-stranu. Reconciliation cron hvata pale callback-ove.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supabase (admin client), Node `crypto` (sha512), vitest.

**Env varijable (Vercel) — dodati pre deploya:**
```
NESTPAY_MERCHANT_ID=13IN002739
NESTPAY_STORE_KEY=<iz WC payment_gateways API-ja / Intesa naloga>
NESTPAY_PAYMENT_URL=https://bib.eway2pay.com/fim/est3Dgate
NESTPAY_API_URL=https://bib.eway2pay.com/fim/api
NESTPAY_USERNAME=NATadmin
NESTPAY_CURRENCY=941
NEXT_PUBLIC_SITE_URL=https://kurs.hartweger.rs   # za okUrl/failUrl (postojeća ako već postoji)
```

---

## File Structure

- `src/lib/nestpay.ts` — **Create.** Čiste funkcije: `requestHash()`, `verifyCallbackHash()`, `buildPaymentFields()`, `queryTransaction()`, env config. Bez Next/DB zavisnosti (osim fetch za query).
- `src/lib/nestpay.test.ts` — **Create.** Vitest unit testovi za hash/verify/fields.
- `src/lib/grant-access.ts` — **Create.** `grantAccessForOrder(orderId)` izdvojeno iz confirm rute (deli ga kartica callback + admin confirm).
- `src/app/api/admin/orders/[id]/confirm/route.ts` — **Modify.** Koristi `grantAccessForOrder()`.
- `src/app/api/orders/route.ts` — **Modify.** Prihvati `kartica`/`kartica_rate`; za karticu vrati `{ orderId, paymentMethod }` bez mejla.
- `src/app/kupovina/kartica/[orderId]/page.tsx` — **Create.** Server stranica koja gradi i auto-submit-uje NestPay formu.
- `src/app/api/nestpay/callback/route.ts` — **Create.** Prima bankin POST, verifikuje, hardening, grant, redirect.
- `src/app/api/cron/nestpay-reconcile/route.ts` — **Create.** Reconciliation za `pending` kartične narudžbine.
- `vercel.json` — **Modify.** Dodati cron.
- `src/app/kupovina/[slug]/CheckoutForm.tsx` — **Modify.** Dugmad za karticu (RS).
- `src/app/kupovina/hvala/[orderId]/page.tsx` — **Modify.** Prikaz statusa kartice.
- `supabase/migrations/033_nestpay_fields.sql` — **Create.** Nove kolone.

---

### Task 0: Commit spec na grani

- [ ] **Step 1: Commit spec dokument**

```bash
cd /Users/natasahartweger/Documents/Claude/sajt/LMS/lms-placanja
git add docs/superpowers/specs/2026-06-06-blok-bc-placanja-nestpay-fiscomm-design.md
git commit -m "docs: spec za Blok B+C plaćanja (NestPay + Fiscomm)"
```

---

### Task 1: DB migracija — NestPay kolone

**Files:**
- Create: `supabase/migrations/033_nestpay_fields.sql`

`orders.payment_method` je `text` bez CHECK constraint-a, pa `kartica`/`kartica_rate` ne traže izmenu. Dodajemo samo NestPay kolone.

- [ ] **Step 1: Napiši migraciju**

```sql
-- 033_nestpay_fields.sql — NestPay kartično plaćanje
alter table orders
  add column if not exists nestpay_trans_id text,
  add column if not exists nestpay_status text,          -- 'charged' | 'failed' | 'reserved'
  add column if not exists nestpay_response jsonb;

-- index za reconciliation (pending kartične narudžbine)
create index if not exists idx_orders_pending_card
  on orders (payment_status, created_at)
  where payment_method in ('kartica', 'kartica_rate');
```

- [ ] **Step 2: Primeni migraciju na Supabase**

Primeni preko Supabase SQL Editora ili Management API (vidi memoriju `reference_supabase_ddl`). Service-role samo za podatke, DDL preko SQL Editora.
Expected: kolone postoje (`select nestpay_status from orders limit 1;` ne baca grešku).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/033_nestpay_fields.sql
git commit -m "feat(db): NestPay kolone na orders"
```

---

### Task 2: `src/lib/nestpay.ts` — čiste funkcije + testovi (TDD)

**Files:**
- Create: `src/lib/nestpay.ts`
- Test: `src/lib/nestpay.test.ts`

NestPay ver2 hash (PHP `base64_encode(pack('H*', hash('sha512', s)))`) = Node `createHash('sha512').update(s,'utf8').digest('base64')` (base64 binarnog digesta).

- [ ] **Step 1: Napiši failing test**

```ts
// src/lib/nestpay.test.ts
import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { requestHash, verifyCallbackHash, buildPaymentFields } from "./nestpay";

const STORE_KEY = "TEST_STORE_KEY";

// nezavisna referentna implementacija (ista formula kao plugin)
function refHash(s: string): string {
  return crypto.createHash("sha512").update(s, "utf8").digest("base64");
}

describe("requestHash (ver2)", () => {
  it("slaže polja tačnim redosledom i formulom", () => {
    const out = requestHash({
      merchantId: "M1",
      oid: "2026-001",
      amount: "37000.00",
      okUrl: "https://x/ok",
      failUrl: "https://x/fail",
      transactionType: "Auth",
      rnd: "RND123",
      currency: "941",
      storeKey: STORE_KEY,
    });
    const expected = refHash(
      "M1|2026-001|37000.00|https://x/ok|https://x/fail|Auth||RND123||||941|" + STORE_KEY
    );
    expect(out).toBe(expected);
  });
});

describe("verifyCallbackHash", () => {
  it("prihvata validan potpis po HASHPARAMS", () => {
    const params: Record<string, string> = {
      clientid: "M1", oid: "2026-001", AuthCode: "A1", ProcReturnCode: "00",
      Response: "Approved", HASHPARAMS: "clientid|oid|AuthCode|ProcReturnCode|Response",
    };
    const toHash = ["M1", "2026-001", "A1", "00", "Approved"].join("|") + "|" + STORE_KEY;
    params.HASH = refHash(toHash);
    expect(verifyCallbackHash(params, STORE_KEY)).toBe(true);
  });

  it("odbija pogrešan potpis", () => {
    const params: Record<string, string> = {
      clientid: "M1", oid: "2026-001", HASHPARAMS: "clientid|oid", HASH: "wrong",
    };
    expect(verifyCallbackHash(params, STORE_KEY)).toBe(false);
  });
});

describe("buildPaymentFields", () => {
  it("postavlja obavezna NestPay polja", () => {
    const f = buildPaymentFields({
      orderNumber: "2026-001", amountRsd: 37000,
      okUrl: "https://x/ok", failUrl: "https://x/fail",
      email: "a@b.rs", fullName: "Ana Anic",
    });
    expect(f.storetype).toBe("3d_pay_hosting");
    expect(f.hashAlgorithm).toBe("ver2");
    expect(f.currency).toBe("941");
    expect(f.trantype).toBe("Auth");
    expect(f.amount).toBe("37000.00");
    expect(f.oid).toBe("2026-001");
    expect(typeof f.hash).toBe("string");
    expect(f.hash.length).toBeGreaterThan(20);
  });
});
```

- [ ] **Step 2: Pokreni test — mora da padne**

Run: `npx vitest run src/lib/nestpay.test.ts`
Expected: FAIL ("Cannot find module './nestpay'" / funkcije nedefinisane)

- [ ] **Step 3: Implementiraj `src/lib/nestpay.ts`**

```ts
// src/lib/nestpay.ts — NestPay 3D_PAY_HOSTING (Banca Intesa), ver2 hash
import crypto from "node:crypto";

export const NESTPAY = {
  merchantId: process.env.NESTPAY_MERCHANT_ID ?? "",
  storeKey: process.env.NESTPAY_STORE_KEY ?? "",
  username: process.env.NESTPAY_USERNAME ?? "",
  paymentUrl: process.env.NESTPAY_PAYMENT_URL ?? "https://bib.eway2pay.com/fim/est3Dgate",
  apiUrl: process.env.NESTPAY_API_URL ?? "https://bib.eway2pay.com/fim/api",
  currency: process.env.NESTPAY_CURRENCY ?? "941",
};

function sha512Base64(s: string): string {
  return crypto.createHash("sha512").update(s, "utf8").digest("base64");
}

export function requestHash(p: {
  merchantId: string; oid: string; amount: string; okUrl: string;
  failUrl: string; transactionType: string; rnd: string; currency: string; storeKey: string;
}): string {
  // tačan ver2 raspored iz plugina (prazna polja namerna)
  const s = [
    p.merchantId, p.oid, p.amount, p.okUrl, p.failUrl, p.transactionType,
    "", p.rnd, "", "", "", p.currency, p.storeKey,
  ].join("|");
  return sha512Base64(s);
}

export function verifyCallbackHash(params: Record<string, string>, storeKey: string): boolean {
  const hashParams = params.HASHPARAMS;
  const receivedHash = params.HASH;
  if (!hashParams || !receivedHash) return false;
  const values = hashParams.split("|").map((name) => params[name] ?? "");
  const s = values.join("|") + "|" + storeKey;
  const computed = sha512Base64(s);
  // konstantno-vremensko poređenje
  const a = Buffer.from(computed);
  const b = Buffer.from(receivedHash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function buildPaymentFields(o: {
  orderNumber: string; amountRsd: number; okUrl: string; failUrl: string;
  email?: string; fullName?: string;
}): Record<string, string> {
  const amount = o.amountRsd.toFixed(2); // 2 decimale, tačka
  const rnd = crypto.randomBytes(16).toString("hex");
  const transactionType = "Auth";
  const hash = requestHash({
    merchantId: NESTPAY.merchantId, oid: o.orderNumber, amount,
    okUrl: o.okUrl, failUrl: o.failUrl, transactionType, rnd,
    currency: NESTPAY.currency, storeKey: NESTPAY.storeKey,
  });
  return {
    clientid: NESTPAY.merchantId,
    amount,
    okUrl: o.okUrl,
    failUrl: o.failUrl,
    trantype: transactionType,
    currency: NESTPAY.currency,
    rnd,
    storetype: "3d_pay_hosting",
    hashAlgorithm: "ver2",
    lang: "sr",
    oid: o.orderNumber,
    encoding: "UTF-8",
    hash,
    BillToName: o.fullName ?? "",
    email: o.email ?? "",
  };
}

// Hardening: server-to-server provera statusa (CC5Request XML query)
export async function queryTransaction(oid: string): Promise<{ procReturnCode: string; amount: string } | null> {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><CC5Request><Name>${NESTPAY.username}</Name><Password>${NESTPAY.storeKey}</Password><ClientId>${NESTPAY.merchantId}</ClientId><OrderId>${oid}</OrderId><Extra><ORDERSTATUS>QUERY</ORDERSTATUS></Extra></CC5Request>`;
  const res = await fetch(NESTPAY.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ DATA: xml }).toString(),
  });
  if (!res.ok) return null;
  const text = await res.text();
  const proc = text.match(/<ProcReturnCode>([^<]*)<\/ProcReturnCode>/)?.[1] ?? "";
  const amt = text.match(/<(?:CHARGE_TYPE_CD|Total|amount)>([^<]*)<\//i)?.[1] ?? "";
  return { procReturnCode: proc, amount: amt };
}
```

- [ ] **Step 4: Pokreni test — mora da prođe**

Run: `npx vitest run src/lib/nestpay.test.ts`
Expected: PASS (sve specifikacije zelene)

- [ ] **Step 5: Commit**

```bash
git add src/lib/nestpay.ts src/lib/nestpay.test.ts
git commit -m "feat(nestpay): hash/verify/form čiste funkcije + testovi"
```

---

### Task 3: Izdvoji `grantAccessForOrder()` (reuse za karticu + admin confirm)

**Files:**
- Create: `src/lib/grant-access.ts`
- Modify: `src/app/api/admin/orders/[id]/confirm/route.ts`

- [ ] **Step 1: Kreiraj `src/lib/grant-access.ts`** (logika kopirana 1:1 iz confirm rute)

```ts
// src/lib/grant-access.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email";

interface OrderItem { course_id: string; course_slug: string; title: string; price: number; }

/** Dodeljuje pristup za narudžbinu (course_unlocks → course_access), označava completed+granted, šalje welcome mejl. Idempotentno. */
export async function grantAccessForOrder(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: order, error } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (error || !order) return { ok: false, error: "Order not found" };
  if (order.payment_status === "completed") return { ok: true }; // idempotentno

  const items: OrderItem[] = order.items ?? [];
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const purchasedIds = items.map((i) => i.course_id);
  const { data: unlocks } = await admin
    .from("course_unlocks")
    .select("purchasable_course_id, content_course_id")
    .in("purchasable_course_id", purchasedIds);

  const contentCourseIds = new Set<string>();
  for (const item of items) {
    const mapped = (unlocks ?? []).filter((u) => u.purchasable_course_id === item.course_id);
    if (mapped.length > 0) mapped.forEach((u) => contentCourseIds.add(u.content_course_id));
    else { console.warn(`[grant] No course_unlocks for ${item.course_slug} (${item.course_id}) — granting product itself`); contentCourseIds.add(item.course_id); }
  }

  for (const courseId of contentCourseIds) {
    const { data: existing } = await admin
      .from("course_access").select("id")
      .eq("user_id", order.user_id).eq("course_id", courseId).single();
    if (!existing) {
      await admin.from("course_access").insert({
        user_id: order.user_id, course_id: courseId, expires_at: expiresAt.toISOString(),
      });
    }
  }

  await admin.from("orders").update({ payment_status: "completed", granted: true }).eq("id", orderId);
  await sendWelcomeEmail(order.email, order.full_name, items.map((i) => i.title));
  return { ok: true };
}
```

- [ ] **Step 2: Refaktoriši confirm rutu da koristi helper**

U `src/app/api/admin/orders/[id]/confirm/route.ts` zameni ceo blok od `const items: OrderItem[] = order.items ?? [];` do `await sendWelcomeEmail(...)` jednim pozivom:

```ts
import { grantAccessForOrder } from "@/lib/grant-access";
// ... posle provere admin role i order postojanja / payment_status != completed:
const result = await grantAccessForOrder(id);
if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
return NextResponse.json({ ok: true });
```
(Ukloni sad neiskorišćene importe `createAdminClient` ako ostaju samo za role-check — zadrži ono što treba; `OrderItem` interfejs i grant petlju obrisati jer su u helperu.)

- [ ] **Step 3: Build provera**

Run: `npm run build` (ili `npx tsc --noEmit`)
Expected: bez TS grešaka; confirm ruta kompajlira.

- [ ] **Step 4: Commit**

```bash
git add src/lib/grant-access.ts "src/app/api/admin/orders/[id]/confirm/route.ts"
git commit -m "refactor: izdvoj grantAccessForOrder za reuse"
```

---

### Task 4: `/api/orders` — prihvati karticu

**Files:**
- Modify: `src/app/api/orders/route.ts`

- [ ] **Step 1: Proširi validaciju metoda**

Zameni:
```ts
    if (paymentMethod !== "uplatnica" && paymentMethod !== "paypal") {
```
sa:
```ts
    const ALLOWED = ["uplatnica", "paypal", "kartica", "kartica_rate"];
    if (!ALLOWED.includes(paymentMethod)) {
```

- [ ] **Step 2: Za karticu — preskoči mejl, vrati paymentMethod**

Posle `insert` narudžbine, obmotaj slanje mejla tako da ide samo za nekartične metode:
```ts
    const isCard = paymentMethod === "kartica" || paymentMethod === "kartica_rate";
    if (!isCard) {
      await sendPaymentInstructionsEmail(email, fullName, course.title, order.order_number, finalPrice, paymentMethod, paypalEur);
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      paymentMethod,
    });
```
(Za karticu narudžbina ostaje `payment_status='pending'` dok callback ne potvrdi.)

- [ ] **Step 3: Build provera**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/orders/route.ts
git commit -m "feat(orders): prihvati kartica/kartica_rate metode"
```

---

### Task 5: Stranica koja redirektuje na NestPay

**Files:**
- Create: `src/app/kupovina/kartica/[orderId]/page.tsx`

- [ ] **Step 1: Kreiraj server stranicu sa auto-submit formom**

```tsx
// src/app/kupovina/kartica/[orderId]/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPaymentFields, NESTPAY } from "@/lib/nestpay";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function KarticaPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders").select("id, order_number, total, email, full_name, payment_method, payment_status")
    .eq("id", orderId).single();

  if (!order || (order.payment_method !== "kartica" && order.payment_method !== "kartica_rate")) notFound();

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kurs.hartweger.rs";
  const callbackUrl = `${base}/api/nestpay/callback`;
  const fields = buildPaymentFields({
    orderNumber: order.order_number,
    amountRsd: order.total,
    okUrl: callbackUrl,
    failUrl: callbackUrl,
    email: order.email,
    fullName: order.full_name,
  });

  return (
    <html>
      <body>
        <form id="np" method="POST" action={NESTPAY.paymentUrl}>
          {Object.entries(fields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <noscript><button type="submit">Nastavi na plaćanje</button></noscript>
        </form>
        <script dangerouslySetInnerHTML={{ __html: `document.getElementById('np').submit();` }} />
        <p style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: 40 }}>Preusmeravamo te na sigurno plaćanje…</p>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Poveži CheckoutForm redirect (privremeno ručno testiranje)**

Build provera: `npx tsc --noEmit` → bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add "src/app/kupovina/kartica/[orderId]/page.tsx"
git commit -m "feat(nestpay): auto-submit stranica ka Intesa gateway-u"
```

---

### Task 6: Callback ruta + hardening

**Files:**
- Create: `src/app/api/nestpay/callback/route.ts`

- [ ] **Step 1: Kreiraj callback rutu**

```ts
// src/app/api/nestpay/callback/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCallbackHash, queryTransaction, NESTPAY } from "@/lib/nestpay";
import { grantAccessForOrder } from "@/lib/grant-access";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const params: Record<string, string> = {};
  form.forEach((v, k) => { params[k] = String(v); });

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kurs.hartweger.rs";
  const admin = createAdminClient();
  const oid = params.oid ?? "";

  // 1) verifikacija potpisa
  if (!verifyCallbackHash(params, NESTPAY.storeKey)) {
    console.error("[nestpay] invalid signature for oid", oid);
    return NextResponse.redirect(`${base}/kupovina/greska`, { status: 303 });
  }

  const { data: order } = await admin
    .from("orders").select("*").eq("order_number", oid).single();
  if (!order) {
    console.error("[nestpay] order not found for oid", oid);
    return NextResponse.redirect(`${base}/kupovina/greska`, { status: 303 });
  }

  // idempotencija
  if (order.payment_status === "completed") {
    return NextResponse.redirect(`${base}/kupovina/hvala/${order.id}`, { status: 303 });
  }

  await admin.from("orders").update({
    nestpay_trans_id: params.TransId ?? null,
    nestpay_response: params,
  }).eq("id", order.id);

  const approved = params.ProcReturnCode === "00";

  if (!approved) {
    await admin.from("orders").update({ nestpay_status: "failed" }).eq("id", order.id);
    return NextResponse.redirect(`${base}/kupovina/hvala/${order.id}?status=fail`, { status: 303 });
  }

  // 2) HARDENING — server-side query + provera iznosa
  const q = await queryTransaction(oid);
  if (!q || q.procReturnCode !== "00") {
    console.error("[nestpay] server query mismatch for", oid, q);
    await admin.from("orders").update({ nestpay_status: "failed" }).eq("id", order.id);
    return NextResponse.redirect(`${base}/kupovina/hvala/${order.id}?status=fail`, { status: 303 });
  }
  const paid = parseFloat(params.amount ?? "0");
  if (Math.abs(paid - Number(order.total)) > 0.5) {
    console.error("[nestpay] amount mismatch", { paid, total: order.total, oid });
    await admin.from("orders").update({ nestpay_status: "failed" }).eq("id", order.id);
    return NextResponse.redirect(`${base}/kupovina/hvala/${order.id}?status=fail`, { status: 303 });
  }

  // 3) grant
  await admin.from("orders").update({ nestpay_status: "charged" }).eq("id", order.id);
  await grantAccessForOrder(order.id);

  return NextResponse.redirect(`${base}/kupovina/hvala/${order.id}?status=ok`, { status: 303 });
}
```

- [ ] **Step 2: Build provera**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/nestpay/callback/route.ts
git commit -m "feat(nestpay): callback + hardening (query + provera iznosa) + grant"
```

---

### Task 7: Reconciliation cron

**Files:**
- Create: `src/app/api/cron/nestpay-reconcile/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Kreiraj cron rutu**

```ts
// src/app/api/cron/nestpay-reconcile/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { queryTransaction } from "@/lib/nestpay";
import { grantAccessForOrder } from "@/lib/grant-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString(); // starije od 15 min
  const { data: pending } = await admin
    .from("orders").select("id, order_number, total")
    .in("payment_method", ["kartica", "kartica_rate"])
    .eq("payment_status", "pending")
    .lt("created_at", cutoff)
    .limit(50);

  let reconciled = 0;
  for (const o of pending ?? []) {
    const q = await queryTransaction(o.order_number);
    if (q?.procReturnCode === "00") {
      await admin.from("orders").update({ nestpay_status: "charged" }).eq("id", o.id);
      await grantAccessForOrder(o.id);
      reconciled++;
    }
  }
  return NextResponse.json({ checked: pending?.length ?? 0, reconciled });
}
```

- [ ] **Step 2: Dodaj cron u `vercel.json`**

```json
{
  "crons": [
    { "path": "/api/cron/inactivity", "schedule": "0 9 * * *" },
    { "path": "/api/cron/nestpay-reconcile", "schedule": "*/15 * * * *" }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron/nestpay-reconcile/route.ts vercel.json
git commit -m "feat(nestpay): reconciliation cron za pale callback-ove"
```

---

### Task 8: CheckoutForm — dugmad za karticu (RS)

**Files:**
- Modify: `src/app/kupovina/[slug]/CheckoutForm.tsx`

Trenutno: `const paymentMethod = country === "RS" ? "uplatnica" : "paypal";` (fiksno). Uvodimo izbor metoda za RS.

- [ ] **Step 1: Dodaj state za izbor metoda (RS)**

Posle `const [country, setCountry] = useState("RS");` dodaj:
```ts
  const [rsMethod, setRsMethod] = useState<"kartica" | "kartica_rate" | "uplatnica">("kartica");
  const paymentMethod = country === "RS" ? rsMethod : "paypal";
  const isCard = paymentMethod === "kartica" || paymentMethod === "kartica_rate";
```
Ukloni staru liniju `const paymentMethod = country === "RS" ? "uplatnica" : "paypal";`.

- [ ] **Step 2: Render izbora metoda za RS** (u „Način plaćanja" kartici, samo kad `country === "RS"`)

Dodaj iznad postojećeg prikaza, unutar `country === "RS"` grane, tri radio opcije:
```tsx
{country === "RS" && (
  <div className="space-y-2 mb-4">
    {[
      { v: "kartica", label: "Platnom karticom", desc: "Visa, Mastercard, Maestro — sigurno plaćanje preko Banca Intesa." },
      { v: "kartica_rate", label: "Karticom na rate", desc: "Na rate za podobne kartice (banka prikazuje opcije rata)." },
      { v: "uplatnica", label: "Uplatnica / internet bankarstvo", desc: "Podaci za uplatu stižu na email; pristup po potvrdi uplate." },
    ].map((m) => (
      <label key={m.v} className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer ${rsMethod === m.v ? "border-[#0AB3D7] bg-[#E8F7FC]" : "border-gray-200"}`}>
        <input type="radio" name="rsMethod" value={m.v} checked={rsMethod === m.v}
          onChange={() => setRsMethod(m.v as typeof rsMethod)} className="mt-1" />
        <span><span className="block font-semibold text-gray-900 text-sm">{m.label}</span>
          <span className="block text-gray-500 text-xs mt-0.5">{m.desc}</span></span>
      </label>
    ))}
  </div>
)}
```

- [ ] **Step 3: Za karticu — redirect na NestPay stranicu umesto hvala**

U `handleSubmit`, zameni `router.push(\`/kupovina/hvala/${data.orderId}\`);` sa:
```ts
      if (isCard) {
        window.location.href = `/kupovina/kartica/${data.orderId}`;
      } else {
        router.push(`/kupovina/hvala/${data.orderId}`);
      }
```

- [ ] **Step 4: Build + lint provera**

Run: `npx tsc --noEmit && npm run build`
Expected: bez grešaka; checkout se renderuje.

- [ ] **Step 5: Commit**

```bash
git add "src/app/kupovina/[slug]/CheckoutForm.tsx"
git commit -m "feat(checkout): izbor kartica/rate/uplatnica za RS"
```

---

### Task 9: Hvala-strana — status kartice

**Files:**
- Modify: `src/app/kupovina/hvala/[orderId]/page.tsx`

- [ ] **Step 1: Pročitaj `?status` i prikaži poruku za karticu**

Na vrhu sadržaja hvala-strane, ako je `payment_method` kartica, prikaži poruku prema `searchParams.status`:
- `ok` → „Plaćanje uspešno! Pristup kursu je aktiviran — proveri email."
- `fail` → „Plaćanje nije uspelo. Tvoja kartica nije naplaćena. Pokušaj ponovo ili izaberi uplatnicu."
- bez statusa → neutralno („Obrađujemo tvoje plaćanje…").

Konkretno (page je već async server komponenta — dodaj `searchParams`):
```tsx
export default async function HvalaPage({ params, searchParams }: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { orderId } = await params;
  const { status } = await searchParams;
  // ... postojeće učitavanje narudžbine ...
  const isCard = order.payment_method === "kartica" || order.payment_method === "kartica_rate";
  // u JSX, pre postojećeg uplatnica/paypal prikaza:
  // {isCard && status === "ok" && (<div className="...success...">Plaćanje uspešno! Pristup je aktiviran.</div>)}
  // {isCard && status === "fail" && (<div className="...error...">Plaćanje nije uspelo — kartica nije naplaćena.</div>)}
}
```
(Postojeći uplatnica/PayPal blokovi se prikazuju samo kad `!isCard`.)

- [ ] **Step 2: Build provera**

Run: `npx tsc --noEmit && npm run build`
Expected: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add "src/app/kupovina/hvala/[orderId]/page.tsx"
git commit -m "feat(checkout): status kartice na hvala-strani"
```

---

### Task 10: Ručna integraciona verifikacija (test gateway)

NestPay test gateway: `https://testsecurepay.eway2pay.com/fim/est3Dgate` + test kredencijali (env override pri testu).

- [ ] **Step 1:** Privremeno postavi test env (`NESTPAY_PAYMENT_URL`, `NESTPAY_API_URL`, `NESTPAY_MERCHANT_ID`, `NESTPAY_USERNAME`, `NESTPAY_STORE_KEY` = test vrednosti) i pokreni preview deploy.
- [ ] **Step 2:** Kupi RS kurs → „Platnom karticom" → test karticom → potvrdi: redirect na gateway, callback `00`, `payment_status='completed'`, `course_access` upisan, hvala-strana `status=ok`.
- [ ] **Step 3:** Ponovi sa odbijajućom test karticom → `status=fail`, bez grant-a.
- [ ] **Step 4:** „Karticom na rate" → potvrdi da gateway prikazuje opcije rata.
- [ ] **Step 5:** Vrati produkcione env vrednosti.

---

## Self-Review (popunjeno)

- **Pokrivenost spec-a:** kartice (Task 2,5,6,8), rate (Task 8 dugme — isti tok), hardening query+iznos (Task 6), reconciliation (Task 7), auto-grant (Task 3,6), `orders` polja (Task 1), hvala-strana (Task 9), env (header). Fiskalizacija je Faza C — van ovog plana (namerno).
- **Bez placeholdera:** sav kod konkretan; test vektori nezavisno računati u testu.
- **Konzistentnost tipova:** `requestHash`/`verifyCallbackHash`/`buildPaymentFields`/`queryTransaction` isti potpisi u lib, testu i rutama; `grantAccessForOrder(orderId)` isti svuda; polja `nestpay_status`/`nestpay_trans_id`/`nestpay_response` ista u migraciji i rutama; `payment_status` vrednosti `pending`/`completed` kao u postojećem kodu.
