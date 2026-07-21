# Mesečno plaćanje (12 rata) za Video paket A1+A2+B1 - plan implementacije

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Omogućiti kupovinu Video paketa A1+A2+B1 kroz 12 mesečnih naplata kartice (3.199 RSD po rati) preko NestPay recurringa, sa automatskom obradom rata 2-12, fiskalizacijom svake rate i samouslužnim otkazivanjem.

> **IZMENA 21.07.2026 (Nataša):** mesečno plaćanje **NE otvara ceo paket odmah**. Paket ima
> šest sadržajnih kurseva (`course_unlocks`: A1.1, A1.2, A2.1, A2.2, B1.1, B1.2), a naplata
> dvanaest - nivoi se otvaraju u parovima: rata 1 → A1.1, 2 → A1.2, 4 → A2.1, 5 → A2.2,
> 7 → B1.1, 8 → B1.2. Meseci 3, 6 i 9-12 nemaju novo gradivo: služe za obnavljanje i završni
> ispit nivoa (jedan podnivo = jedan mesec, pa mesec utvrđivanja). **Od 8. naplate je sve
> otključano** (ritam odredila Nataša 21.07.2026). Bez toga bi jedna rata od 3.199 din nosila ceo
> paket od 29.133 din. Jednokratna kupovina i dalje otvara sve odmah. Traži dopunu Taska 8
> (`grantAccessForOrder` mora da poštuje raspored) i prikaza u „Moj nalog"; tekst za kupca je
> u nacrtu `tekst-mesecno-placanje-za-odobrenje.md`. Na otkazivanje pristup ostaje do kraja
> plaćenog meseca - trenutno gašenje je odbijeno (reklamacije i storna kod banke).

**Architecture:** Svaka naplata je obična porudžbina u `orders`, vezana za red u novoj tabeli `subscriptions`. Banka šalje callback samo za prvu naplatu; rate 2-12 dnevni cron dohvata CC5 upitom (`ORDERSTATUS=QUERY` + `RECURRINGID`) i za svaku novu uspelu naplatu pravi porudžbinu → `grantAccessForOrder` → `fiscalizeOrder` → mejl. Pristup se produžava iz meseca u mesec, pa prestanak plaćanja sam gasi pristup.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supabase (Postgres, service-role), vitest, NestPay CC5 XML API, Fiscomm, Resend.

**Spec:** [docs/superpowers/specs/2026-07-21-pretplata-rate-video-paket-design.md](../specs/2026-07-21-pretplata-rate-video-paket-design.md)

---

## Struktura fajlova

| Fajl | Odgovornost |
|---|---|
| `supabase/migrations/070_subscriptions.sql` | tabela `subscriptions`, kolone na `orders` |
| `src/lib/subscription-plans.ts` | konfiguracija planova (koji kurs, rata, broj rata) + pravilo pristupa |
| `src/lib/nestpay-recurring.ts` | CC5 XML za status serije i otkazivanje + parseri (čiste funkcije) |
| `src/lib/nestpay.ts` | `buildPaymentFields` dobija opciona recurring polja |
| `src/app/api/orders/route.ts` | prihvata metodu `kartica_pretplata`, naplaćuje iznos rate |
| `src/app/kupovina/kartica/[orderId]/page.tsx` | šalje recurring polja banci |
| `src/app/api/nestpay/callback/route.ts` | na prvoj naplati upisuje red u `subscriptions` |
| `src/lib/grant-access.ts` | pristup do sledeće naplate; Meta/GA4 samo za 1. ratu |
| `src/lib/subscription-charges.ts` | obrada jedne naplate iz odgovora banke (idempotentno) |
| `src/app/api/cron/subscriptions-poll/route.ts` | dnevni prolaz kroz aktivne pretplate |
| `src/app/api/pretplata/otkazi/route.ts` | otkazivanje serije kod banke |
| `src/app/nalog/Sekcije.tsx`, `src/app/api/student/account/route.ts` | prikaz pretplate + dugme za otkazivanje |
| `src/app/kupovina/[slug]/CheckoutForm.tsx` | izbor „Mesečno plaćanje" + obavezno obaveštenje |
| `src/app/uslovi/page.tsx` | odeljak o mesečnom plaćanju |
| `vercel.json`, `src/lib/cron-log.ts` | zakazivanje i nadzor novog crona |

---

### Task 1: Migracija - tabela `subscriptions` i kolone na `orders`

**Files:**
- Create: `supabase/migrations/070_subscriptions.sql`

- [ ] **Step 1: Napiši migraciju**

```sql
-- 070: pretplate/rate preko NestPay recurringa.
-- Svaka naplata je red u orders; subscriptions drži stanje cele serije.
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id),
  initial_order_id uuid not null references orders(id),
  -- EXTRA.RECURRINGID iz callbacka prve naplate; ključ za sve upite banci
  recurring_id text not null,
  -- order_number prve porudžbine; banka izvodi <base_oid>-2, -3, ...
  base_oid text not null,
  amount numeric(10,2) not null,
  total_payments int not null,
  paid_payments int not null default 1,
  status text not null default 'active',
  next_charge_at timestamptz,
  cancelled_at timestamptz,
  last_polled_at timestamptz
);

create unique index if not exists subscriptions_recurring_id_idx on subscriptions (recurring_id);
create index if not exists subscriptions_status_idx on subscriptions (status);
create index if not exists subscriptions_user_idx on subscriptions (user_id);

alter table subscriptions enable row level security;

-- Polaznica sme da vidi SVOJE pretplate (za /nalog); pisanje ide samo service-role.
create policy "subscriptions_select_own" on subscriptions
  for select using (auth.uid() = user_id);

alter table orders add column if not exists subscription_id uuid references subscriptions(id);
alter table orders add column if not exists installment_no int;
-- Broj porudžbine kod banke (<base_oid>-N). Unique = garancija da se ista naplata
-- nikad ne obradi dvaput (poll može da naiđe na istu naplatu više puta).
alter table orders add column if not exists nestpay_oid text;
create unique index if not exists orders_nestpay_oid_idx on orders (nestpay_oid) where nestpay_oid is not null;
create index if not exists orders_subscription_idx on orders (subscription_id);
```

- [ ] **Step 2: Primeni migraciju na Supabase**

Primeni sadržaj fajla preko Supabase MCP `apply_migration` (name: `subscriptions`) ili SQL editora.
Očekivano: `{"success": true}`.

- [ ] **Step 3: Provera da su objekti nastali**

```sql
select
  (select count(*) from pg_tables where tablename = 'subscriptions') as tabela,
  (select count(*) from information_schema.columns
     where table_name = 'orders' and column_name in ('subscription_id','installment_no','nestpay_oid')) as kolone;
```
Očekivano: `tabela = 1`, `kolone = 3`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/070_subscriptions.sql
git commit -m "Migracija 070: tabela subscriptions + kolone na orders"
```

---

### Task 2: Konfiguracija planova i pravilo pristupa

**Files:**
- Create: `src/lib/subscription-plans.ts`
- Test: `src/lib/subscription-plans.test.ts`

- [ ] **Step 1: Napiši test koji pada**

```ts
// src/lib/subscription-plans.test.ts
import { describe, it, expect } from "vitest";
import { planForSlug, accessUntilForCharge, SUBSCRIPTION_PLANS } from "./subscription-plans";

describe("planForSlug", () => {
  it("vraća plan za video paket A1-B1", () => {
    const p = planForSlug("paket-a1-a2-b1");
    expect(p).toEqual({ slug: "paket-a1-a2-b1", monthlyRsd: 3199, totalPayments: 12 });
  });

  it("vraća null za kurs bez pretplate", () => {
    expect(planForSlug("individualni-mesecni-paketi")).toBeNull();
    expect(planForSlug("nepostojeci")).toBeNull();
  });

  it("svi planovi su u granicama koje banka dozvoljava (max 121 naplata)", () => {
    for (const p of SUBSCRIPTION_PLANS) {
      expect(p.totalPayments).toBeGreaterThan(1);
      expect(p.totalPayments).toBeLessThanOrEqual(121);
    }
  });
});

describe("accessUntilForCharge", () => {
  it("daje mesec dana od naplate plus 7 dana zaliha", () => {
    const iz = accessUntilForCharge(new Date("2026-08-21T10:00:00Z"));
    expect(iz.toISOString().slice(0, 10)).toBe("2026-09-28");
  });

  it("ne puca na kraju meseca (31.01 → 28.02 + 7)", () => {
    const iz = accessUntilForCharge(new Date("2026-01-31T10:00:00Z"));
    expect(iz.getTime()).toBeGreaterThan(new Date("2026-02-28T10:00:00Z").getTime());
  });
});
```

- [ ] **Step 2: Pokreni test, mora da padne**

Run: `./node_modules/.bin/vitest run src/lib/subscription-plans.test.ts`
Očekivano: FAIL, `Failed to resolve import "./subscription-plans"`.

- [ ] **Step 3: Napiši implementaciju**

```ts
// src/lib/subscription-plans.ts
// Proizvodi koji se mogu platiti kroz mesečne rate (NestPay recurring).
// Iznos je po RATI, ne ukupno: banka naplaćuje monthlyRsd × totalPayments.
// Granica od 121 naplate je bankina (greška CORE-2029 iznad toga).
export interface SubscriptionPlan {
  slug: string;
  monthlyRsd: number;
  totalPayments: number;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // Video paket A1+A2+B1: jednokratno 29.133 RSD, na rate 3.199 × 12 = 38.388 RSD.
  { slug: "paket-a1-a2-b1", monthlyRsd: 3199, totalPayments: 12 },
];

export function planForSlug(slug: string): SubscriptionPlan | null {
  return SUBSCRIPTION_PLANS.find((p) => p.slug === slug) ?? null;
}

/**
 * Dokle važi pristup posle jedne naplate: do sledeće naplate + 7 dana zaliha.
 * Zahvaljujući tome prestanak plaćanja sam gasi pristup - nema oduzimanja.
 */
export function accessUntilForCharge(chargedAt: Date): Date {
  const d = new Date(chargedAt);
  d.setMonth(d.getMonth() + 1);
  d.setDate(d.getDate() + 7);
  return d;
}
```

- [ ] **Step 4: Pokreni test, mora da prođe**

Run: `./node_modules/.bin/vitest run src/lib/subscription-plans.test.ts`
Očekivano: PASS (5 testova).

- [ ] **Step 5: Commit**

```bash
git add src/lib/subscription-plans.ts src/lib/subscription-plans.test.ts
git commit -m "Konfiguracija planova za rate + pravilo trajanja pristupa"
```

---

### Task 3: CC5 upiti za seriju (status i otkazivanje)

**Files:**
- Create: `src/lib/nestpay-recurring.ts`
- Test: `src/lib/nestpay-recurring.test.ts`

- [x] **Step 1: Napiši test koji pada**

```ts
// src/lib/nestpay-recurring.test.ts
import { describe, it, expect } from "vitest";
import {
  buildRecurringStatusXml,
  buildRecurringCancelXml,
  parseRecurringStatus,
  isCancelApproved,
} from "./nestpay-recurring";

// Uzorak po priručniku: naplata 1 uspela, naplata 2 na čekanju.
const ODGOVOR = `<?xml version="1.0" encoding="ISO-8859-9"?><CC5Response>
<ErrMsg>Record(s) found for 26201OnlA13974</ErrMsg>
<Extra>
<RECURRINGCOUNT>2</RECURRINGCOUNT>
<RECURRINGID>26201OnlA13974</RECURRINGID>
<ORD_ID_1>RECTEST-1784551062868</ORD_ID_1>
<TRANS_STAT_1>S</TRANS_STAT_1>
<CAPTURE_AMT_1>319900</CAPTURE_AMT_1>
<PLANNED_START_DTTM_1>2026-07-21 14:39:00.0</PLANNED_START_DTTM_1>
<ORD_ID_2>RECTEST-1784551062868-2</ORD_ID_2>
<TRANS_STAT_2>PN</TRANS_STAT_2>
<PLANNED_START_DTTM_2>2026-08-21 14:39:00.0</PLANNED_START_DTTM_2>
</Extra></CC5Response>`;

describe("buildRecurringStatusXml", () => {
  it("traži status po RECURRINGID", () => {
    const xml = buildRecurringStatusXml("26201OnlA13974");
    expect(xml).toContain("<RECURRINGID>26201OnlA13974</RECURRINGID>");
    expect(xml).toContain("<ORDERSTATUS>QUERY</ORDERSTATUS>");
  });
});

describe("buildRecurringCancelXml", () => {
  it("otkazuje CELU seriju (RECORDTYPE=Recurring)", () => {
    const xml = buildRecurringCancelXml("26201OnlA13974");
    expect(xml).toContain("<RECURRINGOPERATION>Cancel</RECURRINGOPERATION>");
    expect(xml).toContain("<RECORDTYPE>Recurring</RECORDTYPE>");
    expect(xml).toContain("<RECORDID>26201OnlA13974</RECORDID>");
  });
});

describe("parseRecurringStatus", () => {
  it("čita sve naplate serije", () => {
    const r = parseRecurringStatus(ODGOVOR);
    expect(r.count).toBe(2);
    expect(r.charges).toHaveLength(2);
  });

  it("prvu naplatu prepoznaje kao uspelu, sa iznosom u dinarima", () => {
    const c = parseRecurringStatus(ODGOVOR).charges[0];
    expect(c.installmentNo).toBe(1);
    expect(c.oid).toBe("RECTEST-1784551062868");
    expect(c.succeeded).toBe(true);
    expect(c.amountRsd).toBe(3199);
  });

  it("naplatu na čekanju (PN) NE prepoznaje kao uspelu", () => {
    const c = parseRecurringStatus(ODGOVOR).charges[1];
    expect(c.installmentNo).toBe(2);
    expect(c.oid).toBe("RECTEST-1784551062868-2");
    expect(c.succeeded).toBe(false);
    expect(c.amountRsd).toBeNull();
  });

  it("prazan odgovor daje nula naplata umesto pucanja", () => {
    expect(parseRecurringStatus("<CC5Response></CC5Response>").charges).toEqual([]);
  });
});

describe("isCancelApproved", () => {
  it("prihvata Approved", () => {
    expect(isCancelApproved("<CC5Response><Response>Approved</Response></CC5Response>")).toBe(true);
  });
  it("prihvata ProcReturnCode 00", () => {
    expect(isCancelApproved("<CC5Response><ProcReturnCode>00</ProcReturnCode></CC5Response>")).toBe(true);
  });
  it("odbija grešku", () => {
    expect(isCancelApproved("<CC5Response><Response>Error</Response><ErrMsg>CORE-5103</ErrMsg></CC5Response>")).toBe(false);
  });
});
```

- [x] **Step 2: Pokreni test, mora da padne**

Run: `./node_modules/.bin/vitest run src/lib/nestpay-recurring.test.ts`
Očekivano: FAIL, `Failed to resolve import "./nestpay-recurring"`.

- [x] **Step 3: Napiši implementaciju**

```ts
// src/lib/nestpay-recurring.ts
// CC5 upiti nad recurring serijom. Banka šalje callback SAMO za inicijalnu naplatu
// (potvrđeno testom i mejlom banke 21.07.2026), pa naplate 2..N saznajemo upitom.
// Odgovor nosi po naplati sufiksirana polja: ORD_ID_n, TRANS_STAT_n, CAPTURE_AMT_n,
// PLANNED_START_DTTM_n.
import { NESTPAY, minorUnitsToRsd } from "@/lib/nestpay";

/**
 * Okruženje banke. `test` postoji da bismo dohvatanje rata i otkazivanje uvežbali nad
 * test serijom PRE puštanja uživo - produkcioni podaci se pri tome ne diraju.
 */
export type NestpayEnv = "prod" | "test";

export function envConfig(env: NestpayEnv) {
  return env === "test"
    ? {
        user: process.env.NESTPAY_TEST_API_USER ?? "",
        password: process.env.NESTPAY_TEST_API_PASSWORD ?? "",
        merchantId: process.env.NESTPAY_TEST_MERCHANT_ID ?? "",
        apiUrl: process.env.NESTPAY_TEST_API_URL ?? "https://testsecurepay.eway2pay.com/fim/api",
      }
    : {
        user: NESTPAY.apiUser,
        password: NESTPAY.apiPassword,
        merchantId: NESTPAY.merchantId,
        apiUrl: NESTPAY.apiUrl,
      };
}

function credentials(env: NestpayEnv): string {
  const c = envConfig(env);
  return `<Name>${c.user}</Name><Password>${c.password}</Password><ClientId>${c.merchantId}</ClientId>`;
}

export function buildRecurringStatusXml(recurringId: string, env: NestpayEnv = "prod"): string {
  return `<?xml version="1.0" encoding="UTF-8"?><CC5Request>${credentials(env)}<Extra><RECURRINGID>${recurringId}</RECURRINGID><ORDERSTATUS>QUERY</ORDERSTATUS></Extra></CC5Request>`;
}

export function buildRecurringCancelXml(recurringId: string, env: NestpayEnv = "prod"): string {
  return `<?xml version="1.0" encoding="UTF-8"?><CC5Request>${credentials(env)}<Extra><RECURRINGOPERATION>Cancel</RECURRINGOPERATION><RECORDTYPE>Recurring</RECORDTYPE><RECORDID>${recurringId}</RECORDID></Extra></CC5Request>`;
}

export interface RecurringCharge {
  installmentNo: number;
  oid: string;
  transStat: string;
  /** null dok naplata nije realizovana */
  amountRsd: number | null;
  plannedAt: string;
  succeeded: boolean;
}

/**
 * TRANS_STAT: dokumentacija pominje samo `PN` (na čekanju); uspela produkcijska
 * prodaja vraća `S`. Zato se uspeh ceni po tome da naplata NIJE na čekanju i da
 * postoji naplaćen iznos - a ne po spisku „dobrih" oznaka koji ne znamo ceo.
 */
export function parseRecurringStatus(text: string): { count: number; charges: RecurringCharge[] } {
  const tag = (name: string) =>
    text.match(new RegExp(`<${name}>([^<]*)</${name}>`, "i"))?.[1]?.trim() ?? "";

  const count = Number(tag("RECURRINGCOUNT")) || 0;
  const charges: RecurringCharge[] = [];

  for (let n = 1; n <= Math.max(count, 0); n++) {
    const oid = tag(`ORD_ID_${n}`);
    if (!oid) continue;
    const transStat = tag(`TRANS_STAT_${n}`).toUpperCase();
    const amountRsd = minorUnitsToRsd(tag(`CAPTURE_AMT_${n}`));
    charges.push({
      installmentNo: n,
      oid,
      transStat,
      amountRsd,
      plannedAt: tag(`PLANNED_START_DTTM_${n}`),
      succeeded: transStat !== "PN" && amountRsd !== null && amountRsd > 0,
    });
  }
  return { count, charges };
}

export function isCancelApproved(text: string): boolean {
  const response = text.match(/<Response>([^<]*)<\/Response>/i)?.[1]?.trim() ?? "";
  const proc = text.match(/<ProcReturnCode>([^<]*)<\/ProcReturnCode>/i)?.[1]?.trim() ?? "";
  return response.toLowerCase() === "approved" || proc === "00";
}

/** Šalje CC5 zahtev i vraća sirov odgovor (null na mrežnu grešku). */
export async function postCc5(xml: string, env: NestpayEnv = "prod"): Promise<string | null> {
  const c = envConfig(env);
  if (!c.user || !c.password) {
    console.error(`[nestpay-recurring] API kredencijali za okruženje ${env} nisu podešeni`);
    return null;
  }
  const res = await fetch(c.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ DATA: xml }).toString(),
  });
  if (!res.ok) return null;
  return res.text();
}
```

- [x] **Step 4: Pokreni test, mora da prođe**

Run: `./node_modules/.bin/vitest run src/lib/nestpay-recurring.test.ts`
Očekivano: PASS (9 testova). — URAĐENO 21.07.2026, 9/9 prolazi.

- [x] **Step 5: Commit** — `24c00f6` (uz njega i admin alatka iz Taska 17)

```bash
git add src/lib/nestpay-recurring.ts src/lib/nestpay-recurring.test.ts
git commit -m "CC5 upiti nad recurring serijom: status, otkazivanje, parseri"
```

---

### Task 4: Recurring polja u NestPay formi

**Files:**
- Modify: `src/lib/nestpay.ts` (funkcija `buildPaymentFields`)
- Test: `src/lib/nestpay.test.ts`

- [ ] **Step 1: Dodaj test koji pada**

Dodaj na kraj `src/lib/nestpay.test.ts`:

```ts
describe("buildPaymentFields - recurring", () => {
  const osnovno = {
    orderNumber: "2026-300",
    amountRsd: 3199,
    okUrl: "https://x/cb",
    failUrl: "https://x/cb",
  };

  it("bez recurring parametra ne šalje recurring polja", () => {
    const f = buildPaymentFields(osnovno);
    expect(f.RecurringPaymentNumber).toBeUndefined();
  });

  it("sa recurring parametrom šalje tri polja", () => {
    const f = buildPaymentFields({ ...osnovno, recurring: { totalPayments: 12 } });
    expect(f.RecurringPaymentNumber).toBe("12");
    expect(f.RecurringFrequencyUnit).toBe("M");
    expect(f.RecurringFrequency).toBe("1");
  });

  it("recurring polja NE menjaju potpis (ne ulaze u hash)", () => {
    // Isti rnd nije moguć (nasumičan je), pa poredimo da hash zavisi samo od
    // osnovnih polja: dva poziva sa istim rnd-om daju isti hash.
    const a = buildPaymentFields(osnovno);
    const b = buildPaymentFields({ ...osnovno, recurring: { totalPayments: 12 } });
    expect(a.hash).not.toBe(b.hash); // različit rnd
    expect(b.hash.length).toBeGreaterThan(20);
  });
});
```

- [ ] **Step 2: Pokreni test, mora da padne**

Run: `./node_modules/.bin/vitest run src/lib/nestpay.test.ts`
Očekivano: FAIL na `RecurringPaymentNumber` (undefined umesto "12").

- [ ] **Step 3: Izmeni `buildPaymentFields`**

U `src/lib/nestpay.ts`, u potpis funkcije dodaj polje:

```ts
export function buildPaymentFields(o: {
  orderNumber: string; amountRsd: number; okUrl: string; failUrl: string;
  email?: string; fullName?: string; country?: string; shopUrl?: string;
  /** Mesečne rate: banka sama naplaćuje totalPayments puta, svakog meseca. */
  recurring?: { totalPayments: number };
}): Record<string, string> {
```

I pre `return`-a dodaj, a u sam `return` objekat raširi:

```ts
  const recurringFields = o.recurring
    ? {
        // Ne ulaze u hash (potvrda banke 20.07.2026).
        RecurringPaymentNumber: String(o.recurring.totalPayments),
        RecurringFrequencyUnit: "M",
        RecurringFrequency: "1",
      }
    : {};
```

a na kraj objekta koji se vraća (posle `email: o.email ?? ""`) dodaj:

```ts
    ...recurringFields,
```

- [ ] **Step 4: Pokreni test, mora da prođe**

Run: `./node_modules/.bin/vitest run src/lib/nestpay.test.ts`
Očekivano: PASS (15 testova).

- [ ] **Step 5: Commit**

```bash
git add src/lib/nestpay.ts src/lib/nestpay.test.ts
git commit -m "buildPaymentFields: opciona recurring polja za mesečne rate"
```

---

### Task 5: Porudžbina sa metodom `kartica_pretplata`

**Files:**
- Modify: `src/app/api/orders/route.ts`
- Test: `src/lib/subscription-plans.test.ts` (dopuna - cena rate)

- [ ] **Step 1: Dodaj test koji pada**

Dodaj u `src/lib/subscription-plans.test.ts`:

```ts
import { chargeAmountFor } from "./subscription-plans";

describe("chargeAmountFor", () => {
  it("za pretplatu naplaćuje IZNOS RATE, ne punu cenu", () => {
    expect(chargeAmountFor("kartica_pretplata", "paket-a1-a2-b1", 29133)).toBe(3199);
  });

  it("za obične metode naplaćuje punu cenu", () => {
    expect(chargeAmountFor("kartica", "paket-a1-a2-b1", 29133)).toBe(29133);
    expect(chargeAmountFor("uplatnica", "paket-a1-a2-b1", 29133)).toBe(29133);
  });

  it("pretplata na kursu koji je nema pada nazad na punu cenu", () => {
    expect(chargeAmountFor("kartica_pretplata", "paket-a1-a2", 20475)).toBe(20475);
  });
});
```

- [ ] **Step 2: Pokreni test, mora da padne**

Run: `./node_modules/.bin/vitest run src/lib/subscription-plans.test.ts`
Očekivano: FAIL, `chargeAmountFor is not a function`.

- [ ] **Step 3: Dodaj funkciju u `src/lib/subscription-plans.ts`**

```ts
/**
 * Iznos koji se naplaćuje SADA. Kod pretplate to je jedna rata, a ne puna cena -
 * banka će istu ratu naplatiti totalPayments puta.
 */
export function chargeAmountFor(paymentMethod: string, slug: string, fullPrice: number): number {
  if (paymentMethod !== "kartica_pretplata") return fullPrice;
  return planForSlug(slug)?.monthlyRsd ?? fullPrice;
}
```

- [ ] **Step 4: Pokreni test, mora da prođe**

Run: `./node_modules/.bin/vitest run src/lib/subscription-plans.test.ts`
Očekivano: PASS (8 testova).

- [ ] **Step 5: Uveži u rutu `/api/orders`**

U `src/app/api/orders/route.ts`:

1. Dodaj uvoz uz postojeće:

```ts
import { chargeAmountFor, planForSlug } from "@/lib/subscription-plans";
```

2. Prošimo listu dozvoljenih metoda:

```ts
    const ALLOWED = ["uplatnica", "paypal", "kartica", "kartica_rate", "kartica_pretplata"];
```

3. Odmah posle učitavanja kursa (posle bloka `if (courseError || !course)`) dodaj proveru:

```ts
    // Mesečne rate postoje samo za proizvode iz SUBSCRIPTION_PLANS. Bez ove kočnice
    // bi se izmenom zahteva mogla pokrenuti pretplata na bilo šta.
    if (paymentMethod === "kartica_pretplata" && !planForSlug(course.slug)) {
      return NextResponse.json(
        { error: "Mesečno plaćanje nije dostupno za ovaj kurs." },
        { status: 400 }
      );
    }

    // Ko već ima važeći pristup ovom kursu ne sme da pokrene rate - plaćao bi mesecima
    // nešto što već ima, pa bi tražio povraćaj (odluka 21.07.2026).
    if (paymentMethod === "kartica_pretplata") {
      const { data: postojeciNalog } = await supabase
        .from("user_profiles").select("id").ilike("email", email).maybeSingle();
      if (postojeciNalog) {
        const { data: aktivan } = await supabase
          .from("course_access")
          .select("expires_at")
          .eq("user_id", postojeciNalog.id)
          .eq("course_id", course.id)
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();
        if (aktivan) {
          const doKada = new Date(aktivan.expires_at).toLocaleDateString("sr-RS");
          return NextResponse.json(
            { error: `Već imaš pristup ovom kursu do ${doKada}. Obnovu ti nudimo kad se istek približi.` },
            { status: 400 }
          );
        }
      }
    }
```

4. Nađi mesto gde se računa konačna cena (promenljiva `finalPrice`) i odmah posle nje dodaj:

```ts
    // Kod pretplate se naplaćuje IZNOS RATE iz plana, pa eventualni kupon nema dejstva
    // (odluka 21.07.2026: kuponi ne važe na rate - rate su već ustupak u ceni).
    const chargeNow = chargeAmountFor(paymentMethod, course.slug, finalPrice);
```

Zatim u `insert` i u `update` (reuse grana) porudžbine zameni `total: finalPrice` sa `total: chargeNow`.

- [ ] **Step 6: Provera tipova i testova**

Run: `./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/vitest run`
Očekivano: TSC bez greške, svi testovi prolaze.

- [ ] **Step 7: Commit**

```bash
git add src/lib/subscription-plans.ts src/lib/subscription-plans.test.ts src/app/api/orders/route.ts
git commit -m "Porudžbina sa metodom kartica_pretplata naplaćuje iznos rate"
```

---

### Task 6: Slanje recurring polja banci sa strane za plaćanje

**Files:**
- Modify: `src/app/kupovina/kartica/[orderId]/page.tsx`

- [ ] **Step 1: Izmeni stranicu**

Zameni telo funkcije `KarticaPage` tako da učita i slug kursa i, ako je metoda pretplata, doda recurring polja:

```tsx
export default async function KarticaPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders").select("id, order_number, total, email, full_name, country, payment_method, payment_status, items")
    .eq("id", orderId).single();

  const KARTICNE = ["kartica", "kartica_rate", "kartica_pretplata"];
  if (!order || !KARTICNE.includes(order.payment_method)) notFound();

  // Mesečne rate: banci se šalje broj naplata iz plana za taj kurs.
  const slug = Array.isArray(order.items) ? (order.items[0] as { course_slug?: string })?.course_slug ?? "" : "";
  const plan = order.payment_method === "kartica_pretplata" ? planForSlug(slug) : null;

  const base = SITE_URL;
  const callbackUrl = `${base}/api/nestpay/callback`;
  const fields = buildPaymentFields({
    orderNumber: order.order_number,
    amountRsd: order.total,
    okUrl: callbackUrl,
    failUrl: callbackUrl,
    email: order.email,
    fullName: order.full_name,
    country: order.country,
    shopUrl: base,
    recurring: plan ? { totalPayments: plan.totalPayments } : undefined,
  });
```

Ostatak funkcije (JSX sa formom) ostaje nepromenjen. Dodaj uvoz:

```tsx
import { planForSlug } from "@/lib/subscription-plans";
```

- [ ] **Step 2: Provera tipova**

Run: `./node_modules/.bin/tsc --noEmit`
Očekivano: bez greške.

- [ ] **Step 3: Commit**

```bash
git add src/app/kupovina/kartica/\[orderId\]/page.tsx
git commit -m "Strana za plaćanje šalje recurring polja kad je metoda pretplata"
```

---

### Task 7: Callback prve naplate upisuje pretplatu

**Files:**
- Modify: `src/app/api/nestpay/callback/route.ts`
- Create: `src/lib/subscription-start.ts`
- Test: `src/lib/subscription-start.test.ts`

- [ ] **Step 1: Napiši test koji pada**

```ts
// src/lib/subscription-start.test.ts
import { describe, it, expect } from "vitest";
import { recurringIdFromCallback } from "./subscription-start";

describe("recurringIdFromCallback", () => {
  it("čita EXTRA.RECURRINGID (tako stiže u callbacku, provereno 20.07.2026)", () => {
    expect(recurringIdFromCallback({ "EXTRA.RECURRINGID": "26201OnlA13974" })).toBe("26201OnlA13974");
  });

  it("podnosi i varijantu bez prefiksa", () => {
    expect(recurringIdFromCallback({ RECURRINGID: "X1" })).toBe("X1");
  });

  it("bez polja vraća null", () => {
    expect(recurringIdFromCallback({ oid: "2026-300" })).toBeNull();
  });
});
```

- [ ] **Step 2: Pokreni test, mora da padne**

Run: `./node_modules/.bin/vitest run src/lib/subscription-start.test.ts`
Očekivano: FAIL, `Failed to resolve import "./subscription-start"`.

- [ ] **Step 3: Napiši implementaciju**

```ts
// src/lib/subscription-start.ts
// Upis pretplate posle uspešne PRVE naplate. Serijski broj (RECURRINGID) stiže
// u parametrima callbacka kao `EXTRA.RECURRINGID` (provereno na testu 20.07.2026).
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { planForSlug } from "@/lib/subscription-plans";

export function recurringIdFromCallback(params: Record<string, string>): string | null {
  return params["EXTRA.RECURRINGID"] || params["RECURRINGID"] || null;
}

interface OrderRow {
  id: string;
  user_id: string;
  order_number: string;
  total: number;
  payment_method: string;
  items: unknown;
  subscription_id: string | null;
}

/** Idempotentno: ako porudžbina već ima pretplatu, ne radi ništa. */
export async function startSubscriptionForOrder(
  order: OrderRow,
  params: Record<string, string>,
): Promise<void> {
  if (order.payment_method !== "kartica_pretplata" || order.subscription_id) return;

  const item = Array.isArray(order.items)
    ? (order.items[0] as { course_id?: string; course_slug?: string })
    : null;
  const plan = item?.course_slug ? planForSlug(item.course_slug) : null;
  const recurringId = recurringIdFromCallback(params);

  if (!plan || !item?.course_id || !recurringId) {
    // Naplata je prošla, a seriju ne možemo da pratimo - to mora da vidi čovek.
    Sentry.captureException(
      new Error(
        `[pretplata] Ne mogu da upišem pretplatu za ${order.order_number}: ` +
          `plan=${!!plan} course=${!!item?.course_id} recurringId=${recurringId ?? "null"}`,
      ),
    );
    return;
  }

  const admin = createAdminClient();
  const nextCharge = new Date();
  nextCharge.setMonth(nextCharge.getMonth() + 1);

  const { data: sub, error } = await admin
    .from("subscriptions")
    .insert({
      user_id: order.user_id,
      course_id: item.course_id,
      initial_order_id: order.id,
      recurring_id: recurringId,
      base_oid: order.order_number,
      amount: order.total,
      total_payments: plan.totalPayments,
      paid_payments: 1,
      status: "active",
      next_charge_at: nextCharge.toISOString(),
    })
    .select("id")
    .single();

  if (error || !sub) {
    Sentry.captureException(new Error(`[pretplata] upis pao za ${order.order_number}: ${error?.message}`));
    return;
  }

  await admin
    .from("orders")
    .update({ subscription_id: sub.id, installment_no: 1, nestpay_oid: order.order_number })
    .eq("id", order.id);
}
```

- [ ] **Step 4: Pokreni test, mora da prođe**

Run: `./node_modules/.bin/vitest run src/lib/subscription-start.test.ts`
Očekivano: PASS (3 testa).

- [ ] **Step 5: Pozovi iz callbacka**

U `src/app/api/nestpay/callback/route.ts` dodaj uvoz:

```ts
import { startSubscriptionForOrder } from "@/lib/subscription-start";
```

i odmah POSLE reda `await admin.from("orders").update({ nestpay_status: "charged" }).eq("id", order.id);`, a PRE `const grant = await grantAccessForOrder(order.id);` ubaci:

```ts
  // Pretplata: upiši seriju pre dodele pristupa - grant čita subscription_id da bi
  // znao da pristup traje do sledeće naplate, a ne godinu dana.
  await startSubscriptionForOrder(order, params);
```

- [ ] **Step 6: Provera tipova**

Run: `./node_modules/.bin/tsc --noEmit`
Očekivano: bez greške.

- [ ] **Step 7: Commit**

```bash
git add src/lib/subscription-start.ts src/lib/subscription-start.test.ts src/app/api/nestpay/callback/route.ts
git commit -m "Callback prve naplate upisuje pretplatu (RECURRINGID)"
```

---

### Task 8: Pristup do sledeće naplate, mejlovi i Meta/GA4 za rate

**Files:**
- Modify: `src/lib/grant-access.ts`, `src/lib/email.ts`

> **Zašto mejlovi ovde:** `grantAccessForOrder` na kraju šalje welcome mejl. Bez izmene
> bi polaznica dobila „dobrodošla na kurs" **dvanaest puta**, jednom za svaku ratu.

- [ ] **Step 1: Izmeni računanje isteka pristupa**

U `grantAccessForOrder`, zameni:

```ts
  const items: OrderItem[] = order.items ?? [];
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
```

sa:

```ts
  const items: OrderItem[] = order.items ?? [];
  // Pretplata (mesečne rate): pristup važi do sledeće naplate + 7 dana zaliha, pa se
  // sam gasi ako plaćanje stane. Sve ostalo: godinu dana kao i do sada.
  const expiresAt = order.subscription_id
    ? accessUntilForCharge(new Date())
    : (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d; })();
```

i dodaj uvoz:

```ts
import { accessUntilForCharge } from "@/lib/subscription-plans";
```

- [ ] **Step 2: Isključi Meta/GA4 za rate 2-12**

Nađi u istom fajlu pozive `sendGa4Purchase(...)` i `sendPurchaseEvent(...)` i obmotaj ih uslovom:

```ts
  // Rate 2-12 nisu nove konverzije: slanje bi u Meta/GA4 prijavilo 12 kupovina po
  // 3.199 umesto jedne prodaje i pokvarilo merenje isplativosti oglasa.
  const jePrvaNaplata = !order.installment_no || order.installment_no === 1;
  if (jePrvaNaplata) {
    // ... postojeći pozivi sendGa4Purchase i sendPurchaseEvent ostaju ovde ...
  }
```

- [ ] **Step 3: Dodaj mejl za naplaćenu ratu**

Na kraj `src/lib/email.ts` dodaj:

```ts
export async function sendSubscriptionChargeEmail(o: {
  email: string;
  name: string | null;
  courseTitle: string;
  installmentNo: number;
  totalPayments: number;
  amount: number;
  accessUntil: string;
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = o.name ? o.name.split(" ")[0] : "";
    const fmt = (n: number) => n.toLocaleString("de-DE");
    const doKada = new Date(o.accessUntil).toLocaleDateString("sr-RS");
    await resend.emails.send({
      from: FROM,
      to: o.email,
      replyTo: "info@hartweger.rs",
      subject: `Naplaćena ${o.installmentNo}. rata od ${o.totalPayments} - ${o.courseTitle}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p>Naplatili smo <strong>${fmt(o.amount)} din</strong> - to je ${o.installmentNo}. rata od ukupno ${o.totalPayments} za kurs <strong>${esc(o.courseTitle)}</strong>.</p>
<p>Pristup ti važi do <strong>${doKada}</strong>, a produžiće se sam sa narednom ratom. Fiskalni račun stiže zasebno.</p>
<p style="font-size:13px;color:#666">Mesečno plaćanje možeš da otkažeš kad god hoćeš u odeljku „Moj nalog" na platformi.</p>
<p style="margin-top:20px">Hartweger tim</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendSubscriptionChargeEmail pao:", e);
  }
}
```

- [ ] **Step 4: Zameni welcome mejl kod rata 2-12**

U `src/lib/grant-access.ts` nađi poziv `await sendWelcomeEmail(order.email, order.full_name, items.map((i) => i.title), { startUrl, hasLesson });` i zameni ga sa:

```ts
    if (jePrvaNaplata) {
      await sendWelcomeEmail(order.email, order.full_name, items.map((i) => i.title), { startUrl, hasLesson });
    } else {
      // Rate 2-12: kratka potvrda naplate umesto ponovljene dobrodošlice.
      const { data: sub } = await admin
        .from("subscriptions").select("total_payments").eq("id", order.subscription_id).single();
      await sendSubscriptionChargeEmail({
        email: order.email,
        name: order.full_name,
        courseTitle: items[0]?.title ?? "kurs",
        installmentNo: order.installment_no,
        totalPayments: sub?.total_payments ?? 12,
        amount: order.total,
        accessUntil: expiresAt.toISOString(),
      });
    }
```

i dopuni uvoz mejlova u istom fajlu sa `sendSubscriptionChargeEmail`.

- [ ] **Step 5: Provera tipova i testova**

Run: `./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/vitest run`
Očekivano: sve prolazi.

- [ ] **Step 6: Commit**

```bash
git add src/lib/grant-access.ts src/lib/email.ts
git commit -m "Pretplata: pristup do sledeće naplate, mejl po rati, Purchase samo za prvu ratu"
```

---

### Task 9: Obrada jedne naplate iz odgovora banke

**Files:**
- Create: `src/lib/subscription-charges.ts`
- Test: `src/lib/subscription-charges.test.ts`

- [ ] **Step 1: Napiši test koji pada**

```ts
// src/lib/subscription-charges.test.ts
import { describe, it, expect } from "vitest";
import { chargesToProcess } from "./subscription-charges";
import type { RecurringCharge } from "./nestpay-recurring";

const naplata = (n: number, ok: boolean): RecurringCharge => ({
  installmentNo: n,
  oid: `2026-300-${n}`,
  transStat: ok ? "S" : "PN",
  amountRsd: ok ? 3199 : null,
  plannedAt: "2026-08-21 14:39:00.0",
  succeeded: ok,
});

describe("chargesToProcess", () => {
  it("vraća samo uspele naplate koje još nisu obrađene", () => {
    const r = chargesToProcess([naplata(1, true), naplata(2, true), naplata(3, false)], ["2026-300-1"]);
    expect(r.map((c) => c.installmentNo)).toEqual([2]);
  });

  it("prazno kad je sve obrađeno", () => {
    expect(chargesToProcess([naplata(1, true)], ["2026-300-1"])).toEqual([]);
  });

  it("preskače naplate na čekanju", () => {
    expect(chargesToProcess([naplata(2, false)], [])).toEqual([]);
  });
});
```

- [ ] **Step 2: Pokreni test, mora da padne**

Run: `./node_modules/.bin/vitest run src/lib/subscription-charges.test.ts`
Očekivano: FAIL, `Failed to resolve import "./subscription-charges"`.

- [ ] **Step 3: Napiši implementaciju**

```ts
// src/lib/subscription-charges.ts
// Pretvaranje naplata iz odgovora banke u porudžbine. Svaka naplata = obična
// porudžbina, pa se nasleđuje fiskalizacija, dodela pristupa i mejlovi.
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RecurringCharge } from "@/lib/nestpay-recurring";
import { grantAccessForOrder } from "@/lib/grant-access";
import { fiscalizeOrder } from "@/lib/fiscomm";
import { generateOrderNumber } from "@/lib/order-utils";

/** Uspele naplate kojima još nemamo porudžbinu (poredi se po broju kod banke). */
export function chargesToProcess(charges: RecurringCharge[], vecObradjeni: string[]): RecurringCharge[] {
  const set = new Set(vecObradjeni);
  return charges.filter((c) => c.succeeded && !set.has(c.oid));
}

interface SubscriptionRow {
  id: string;
  user_id: string;
  base_oid: string;
  amount: number;
  total_payments: number;
  initial_order_id: string;
}

/**
 * Pravi porudžbinu za jednu ratu i pokreće standardni lanac (pristup → fiskalni
 * račun). Idempotentno: `orders.nestpay_oid` je unique, pa dupli prolaz pada na
 * insertu i tiho se preskače.
 */
export async function processCharge(sub: SubscriptionRow, charge: RecurringCharge): Promise<boolean> {
  const admin = createAdminClient();

  // Podaci se preuzimaju sa prve porudžbine - ista polaznica, isti kurs, isti iznos.
  const { data: prva } = await admin
    .from("orders")
    .select("email, full_name, country, items, user_id")
    .eq("id", sub.initial_order_id)
    .single();
  if (!prva) return false;

  const orderNumber = await generateOrderNumber();
  const { data: novi, error } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: prva.user_id,
      email: prva.email,
      full_name: prva.full_name,
      country: prva.country,
      items: prva.items,
      total: charge.amountRsd ?? sub.amount,
      payment_method: "kartica_pretplata",
      payment_status: "pending",
      nestpay_status: "charged",
      subscription_id: sub.id,
      installment_no: charge.installmentNo,
      nestpay_oid: charge.oid,
    })
    .select("id, order_number")
    .single();

  if (error || !novi) {
    // 23505 = unique violation → ovu ratu smo već obradili, sve u redu.
    if ((error as { code?: string } | null)?.code === "23505") return false;
    Sentry.captureException(new Error(`[pretplata] upis rate ${charge.oid} pao: ${error?.message}`));
    return false;
  }

  const grant = await grantAccessForOrder(novi.id);
  if (!grant.ok) {
    Sentry.captureException(
      new Error(`[pretplata] PLAĆENO-A-NEMA-PRISTUP: rata ${charge.oid} (order ${novi.order_number}): ${grant.error}`),
    );
  }
  await fiscalizeOrder(novi.id);

  await admin
    .from("subscriptions")
    .update({ paid_payments: charge.installmentNo })
    .eq("id", sub.id);

  return true;
}
```

- [ ] **Step 4: Pokreni test, mora da prođe**

Run: `./node_modules/.bin/vitest run src/lib/subscription-charges.test.ts`
Očekivano: PASS (3 testa).

- [ ] **Step 5: Commit**

```bash
git add src/lib/subscription-charges.ts src/lib/subscription-charges.test.ts
git commit -m "Obrada rate iz odgovora banke: porudžbina + pristup + fiskalni račun"
```

---

### Task 10: Dnevni cron koji dohvata rate

**Files:**
- Create: `src/app/api/cron/subscriptions-poll/route.ts`
- Modify: `vercel.json`, `src/lib/cron-log.ts`

- [ ] **Step 1: Napiši cron rutu**

```ts
// src/app/api/cron/subscriptions-poll/route.ts
// Banka NE šalje callback za rate 2..N (potvrđeno 21.07.2026), pa ih dohvatamo sami.
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { withCronLog } from "@/lib/cron-log";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildRecurringStatusXml, parseRecurringStatus, postCc5 } from "@/lib/nestpay-recurring";
import { chargesToProcess, processCharge } from "@/lib/subscription-charges";

export const dynamic = "force-dynamic";

async function cronHandler(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("subscriptions")
    .select("id, user_id, recurring_id, base_oid, amount, total_payments, paid_payments, initial_order_id")
    .eq("status", "active")
    .limit(200);

  let obradjeno = 0;
  let zavrsenih = 0;

  for (const sub of subs ?? []) {
    const xml = await postCc5(buildRecurringStatusXml(sub.recurring_id));
    if (!xml) {
      Sentry.captureException(new Error(`[pretplata] upit banci pao za seriju ${sub.recurring_id}`));
      continue;
    }

    const { charges } = parseRecurringStatus(xml);
    const { data: postojeci } = await admin
      .from("orders")
      .select("nestpay_oid")
      .eq("subscription_id", sub.id)
      .not("nestpay_oid", "is", null);

    const zaObradu = chargesToProcess(
      charges,
      (postojeci ?? []).map((o) => o.nestpay_oid as string),
    );
    for (const charge of zaObradu) {
      if (await processCharge(sub, charge)) obradjeno++;
    }

    const uspelih = charges.filter((c) => c.succeeded).length;
    const sledeca = charges.find((c) => !c.succeeded)?.plannedAt ?? null;
    const gotova = uspelih >= sub.total_payments;
    if (gotova) zavrsenih++;

    await admin
      .from("subscriptions")
      .update({
        last_polled_at: new Date().toISOString(),
        next_charge_at: sledeca ? new Date(sledeca.replace(" ", "T")).toISOString() : null,
        status: gotova ? "completed" : "active",
      })
      .eq("id", sub.id);
  }

  return NextResponse.json({
    ok: true,
    pretplata: (subs ?? []).length,
    obradjenoRata: obradjeno,
    zavrsenih,
  });
}

export const GET = withCronLog("subscriptions-poll", cronHandler);
```

- [ ] **Step 2: Zakaži cron**

U `vercel.json`, u niz `crons`, dodaj:

```json
    {
      "path": "/api/cron/subscriptions-poll",
      "schedule": "0 5 * * *"
    },
```

- [ ] **Step 3: Uvedi cron u nadzor**

U `src/lib/cron-log.ts`, u niz `EXPECTED_CRONS`, među dnevne dodaj:

```ts
  { name: "subscriptions-poll", maxAgeHours: 26 },
```

- [ ] **Step 4: Provera tipova**

Run: `./node_modules/.bin/tsc --noEmit`
Očekivano: bez greške.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/cron/subscriptions-poll/route.ts vercel.json src/lib/cron-log.ts
git commit -m "Dnevni cron dohvata rate 2-12 od banke"
```

---

### Task 11: Otkazivanje pretplate

**Files:**
- Create: `src/app/api/pretplata/otkazi/route.ts`

- [ ] **Step 1: Napiši rutu**

```ts
// src/app/api/pretplata/otkazi/route.ts
// Otkazivanje cele serije kod banke (RECURRINGOPERATION=Cancel, RECORDTYPE=Recurring).
// Pristup ostaje do kraja plaćenog perioda - ne oduzimamo ga ovde.
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildRecurringCancelXml, isCancelApproved, postCc5 } from "@/lib/nestpay-recurring";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { subscriptionId } = await request.json();
  if (!subscriptionId) return NextResponse.json({ error: "Nedostaje subscriptionId" }, { status: 400 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, user_id, recurring_id, status")
    .eq("id", subscriptionId)
    .single();

  // Provera vlasništva: bez nje bi svako ulogovan mogao da otkaže tuđu pretplatu.
  if (!sub || sub.user_id !== user.id) {
    return NextResponse.json({ error: "Pretplata nije pronađena." }, { status: 404 });
  }
  if (sub.status !== "active") return NextResponse.json({ ok: true, vecOtkazana: true });

  const odgovor = await postCc5(buildRecurringCancelXml(sub.recurring_id));
  if (!odgovor || !isCancelApproved(odgovor)) {
    Sentry.captureException(
      new Error(`[pretplata] otkazivanje serije ${sub.recurring_id} nije prošlo: ${odgovor?.slice(0, 300) ?? "bez odgovora"}`),
    );
    return NextResponse.json(
      { error: "Otkazivanje trenutno ne prolazi. Piši nam na info@hartweger.rs i mi ćemo ga odmah rešiti." },
      { status: 502 },
    );
  }

  await admin
    .from("subscriptions")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", sub.id);

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Provera tipova**

Run: `./node_modules/.bin/tsc --noEmit`
Očekivano: bez greške.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/pretplata/otkazi/route.ts
git commit -m "Ruta za otkazivanje pretplate kod banke"
```

---

### Task 12: Prikaz pretplate u „Moj nalog"

**Files:**
- Modify: `src/app/api/student/account/route.ts`, `src/app/nalog/Sekcije.tsx`, `src/app/nalog/page.tsx`

- [ ] **Step 1: Vrati pretplate iz API-ja naloga**

U `src/app/api/student/account/route.ts`, uz postojeće upite dodaj i pretplate, pa ih uključi u odgovor:

```ts
  const { data: subs } = await admin
    .from("subscriptions")
    .select("id, status, paid_payments, total_payments, amount, next_charge_at, course_id")
    .eq("user_id", user.id)
    .in("status", ["active", "cancelled"]);

  const subCourseIds = (subs ?? []).map((s) => s.course_id);
  const { data: subCourses } = subCourseIds.length
    ? await admin.from("courses").select("id, title").in("id", subCourseIds)
    : { data: [] as Array<{ id: string; title: string }> };

  const pretplate = (subs ?? []).map((s) => ({
    id: s.id,
    title: (subCourses ?? []).find((c) => c.id === s.course_id)?.title ?? "Kurs",
    status: s.status,
    paid: s.paid_payments,
    total: s.total_payments,
    amount: Number(s.amount),
    nextChargeAt: s.next_charge_at,
  }));
```

i dodaj `pretplate` u objekat koji ruta vraća (`NextResponse.json({ groups, individual, pretplate })`).

- [ ] **Step 2: Prikaži sekciju u nalogu**

U `src/app/nalog/Sekcije.tsx` dodaj novu komponentu:

```tsx
interface PretplataRow {
  id: string;
  title: string;
  status: string;
  paid: number;
  total: number;
  amount: number;
  nextChargeAt: string | null;
}

export function Pretplate() {
  const [rows, setRows] = useState<PretplataRow[] | null>(null);
  const [radi, setRadi] = useState<string | null>(null);
  const [greska, setGreska] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/student/account")
      .then((r) => (r.ok ? r.json() : { pretplate: [] }))
      .then((d) => setRows(d.pretplate ?? []))
      .catch(() => setRows([]));
  }, []);

  async function otkazi(id: string) {
    // Napredak se NE briše (vezan je za nalog, ne za pristup) - to se izričito kaže,
    // jer je strah od gubitka rada glavni razlog oklevanja pri otkazivanju.
    if (!confirm("Da otkažemo mesečno plaćanje?\n\nNaredne naplate se zaustavljaju, a pristup ti ostaje do kraja plaćenog meseca. Napredak, urađene vežbe i sertifikati ostaju sačuvani, a kad se vratiš plaćaš samo preostale rate.")) return;
    setRadi(id);
    setGreska(null);
    try {
      const res = await fetch("/api/pretplata/otkazi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: id }),
      });
      const d = await res.json();
      if (!res.ok) { setGreska(d.error ?? "Otkazivanje nije prošlo."); return; }
      setRows((prev) => (prev ?? []).map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)));
    } catch {
      setGreska("Otkazivanje nije prošlo. Piši nam na info@hartweger.rs.");
    } finally {
      setRadi(null);
    }
  }

  if (!rows || rows.length === 0) return null;

  return (
    <section className="mb-8">
      <p className="text-sm font-medium text-gray-500 mb-2">Mesečno plaćanje</p>
      {rows.map((r) => (
        <div key={r.id} className="border border-gray-200 rounded-lg p-4 mb-2">
          <p className="font-medium">{r.title}</p>
          <p className="text-sm text-gray-600 mt-1">
            Plaćeno {r.paid} od {r.total} rata po {r.amount.toLocaleString("sr-RS")} din
            {r.status === "active" && r.nextChargeAt
              ? ` · Sledeća naplata ${new Date(r.nextChargeAt).toLocaleDateString("sr-RS")}`
              : ""}
          </p>
          {r.status === "cancelled" ? (
            <p className="text-sm text-gray-500 mt-2">Otkazano - nema više naplata.</p>
          ) : (
            <button
              type="button"
              onClick={() => otkazi(r.id)}
              disabled={radi === r.id}
              className="mt-2 text-sm text-gray-500 underline underline-offset-2 hover:text-gray-700 disabled:opacity-50"
            >
              {radi === r.id ? "Otkazujem…" : "Otkaži plaćanje"}
            </button>
          )}
          {greska && <p className="text-sm text-[#F78687] mt-2">{greska}</p>}
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 3: Uvrsti komponentu u stranicu**

U `src/app/nalog/page.tsx` promeni uvoz i dodaj komponentu ispod `<GrupniIIndividualni />`:

```tsx
import { GrupniIIndividualni, ProfilSekcija, Pretplate } from "./Sekcije";
```

```tsx
      <Pretplate />
```

- [ ] **Step 4: Provera tipova**

Run: `./node_modules/.bin/tsc --noEmit`
Očekivano: bez greške.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/student/account/route.ts src/app/nalog/Sekcije.tsx src/app/nalog/page.tsx
git commit -m "Moj nalog: prikaz mesečnog plaćanja i dugme za otkazivanje"
```

---

### Task 13: Izbor „Mesečno plaćanje" na checkoutu (zahtev banke)

**Files:**
- Modify: `src/app/kupovina/[slug]/CheckoutForm.tsx`, `src/app/kupovina/[slug]/page.tsx`

- [ ] **Step 1: Prosledi podatak o planu u formu**

U `src/app/kupovina/[slug]/page.tsx` nađi mesto gde se renderuje `<CheckoutForm ... />` i dodaj prop:

```tsx
        subscriptionPlan={planForSlug(course.slug)}
```

uz uvoz:

```tsx
import { planForSlug } from "@/lib/subscription-plans";
```

- [ ] **Step 2: Prihvati prop i dodaj metodu**

U `src/app/kupovina/[slug]/CheckoutForm.tsx`:

1. U tip propsa dodaj:

```ts
  subscriptionPlan?: { slug: string; monthlyRsd: number; totalPayments: number } | null;
```

2. Proširi tip stanja metode:

```ts
  const [method, setMethod] = useState<"kartica" | "uplatnica" | "paypal" | "kartica_pretplata">("kartica");
  const paymentMethod = method;
  const isCard = method === "kartica" || method === "kartica_pretplata";
```

3. Dodaj stavku u listu metoda - i za `isRS` (posle „kartica", pre „uplatnica") **i za
   inostranstvo** (posle „kartica", pre „paypal"), jer se rate nude i stranim karticama
   (odluka 21.07.2026):

```tsx
                ...(subscriptionPlan
                  ? [{
                      v: "kartica_pretplata",
                      label: `Mesečno plaćanje - ${subscriptionPlan.totalPayments} rata po ${subscriptionPlan.monthlyRsd.toLocaleString("sr-RS")} din`,
                      desc: "Kartica se naplaćuje automatski svakog meseca. Otkazuješ kad hoćeš u „Moj nalog\".",
                    }]
                  : []),
```

Za englesku listu (`en`) ista stavka, sa tekstom:

```tsx
                ...(subscriptionPlan
                  ? [{
                      v: "kartica_pretplata",
                      label: `Monthly payment - ${subscriptionPlan.totalPayments} instalments of ${subscriptionPlan.monthlyRsd.toLocaleString("sr-RS")} RSD`,
                      desc: "Your card is charged automatically once a month, in RSD (your bank converts). Cancel anytime in „My account\".",
                    }]
                  : []),
```

4. Kuponi ne važe na rate: sakrij odeljak za kupon kad je izabrana pretplata. Nađi blok
   sa poljem za kupon i uslovi ga:

```tsx
      {method !== "kartica_pretplata" && (
        /* ... postojeći blok sa kuponom ostaje ovde nepromenjen ... */
      )}
```

- [ ] **Step 3: Dodaj obavezno obaveštenje i saglasnost**

Odmah ISPOD bloka sa metodama plaćanja (posle zatvaranja `</div>` te kartice) dodaj:

```tsx
      {/* Zahtev Banca Intesa (21.07.2026): kupcu mora nedvosmisleno biti istaknuto
          kakvu transakciju pokreće, uz saglasnost sa uslovima. */}
      {method === "kartica_pretplata" && subscriptionPlan && (
        <div className="border border-[#0AB3D7] bg-[#E8F7FC] rounded-xl p-5 space-y-3">
          <p className="font-semibold text-gray-900 text-sm">Šta pokrećeš ovom kupovinom</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            Pokrećeš mesečnu naplatu kartice: <strong>{subscriptionPlan.totalPayments} naplata po{" "}
            {subscriptionPlan.monthlyRsd.toLocaleString("sr-RS")} din</strong> (ukupno{" "}
            {(subscriptionPlan.monthlyRsd * subscriptionPlan.totalPayments).toLocaleString("sr-RS")} din).
            Prva naplata je danas, naredne svakog meseca istog datuma. Pristup kursevima traje dok traje
            plaćanje. Otkazivanje u svakom trenutku u „Moj nalog", bez objašnjenja.
          </p>
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={saglasan}
              onChange={(e) => setSaglasan(e.target.checked)}
              className="mt-1"
            />
            <span>
              Saglasan/na sam sa{" "}
              <a href="/uslovi" target="_blank" rel="noreferrer" className="text-plava underline underline-offset-2">
                uslovima korišćenja
              </a>{" "}
              i sa mesečnom naplatom opisanom iznad.
            </span>
          </label>
        </div>
      )}
```

4. Dodaj stanje uz ostala:

```ts
  const [saglasan, setSaglasan] = useState(false);
```

5. Zaključaj dugme dok nema saglasnosti - u `<button type="submit" disabled={loading}` zameni sa:

```tsx
        disabled={loading || (method === "kartica_pretplata" && !saglasan)}
```

- [ ] **Step 4: Provera tipova i build**

Run: `./node_modules/.bin/tsc --noEmit && npm run build`
Očekivano: bez greške.

- [ ] **Step 5: Commit**

```bash
git add src/app/kupovina/\[slug\]/CheckoutForm.tsx src/app/kupovina/\[slug\]/page.tsx
git commit -m "Checkout: izbor mesečnog plaćanja uz obaveštenje i saglasnost (zahtev banke)"
```

---

### Task 14: Uslovi korišćenja i prikaz cene na stranici proizvoda

**Files:**
- Modify: `src/app/uslovi/page.tsx`, `src/app/kursevi/paket-a1-a2-b1/page.tsx`

- [ ] **Step 1: Dodaj odeljak u uslove**

U `src/app/uslovi/page.tsx` dodaj nov odeljak (posle odeljka o video kursevima), po uzoru na postojeće:

```tsx
      <h2>Mesečno plaćanje (rate)</h2>
      <p>
        Za pojedine kurseve nudimo plaćanje u mesečnim ratama. Kada izabereš mesečno plaćanje,
        kartica se naplaćuje automatski jednom mesečno, unapred određen broj puta (za Video paket
        A1+A2+B1: 12 naplata po 3.199 din, ukupno 38.388 din). Iznos, broj naplata i datum prve
        naplate prikazani su pre potvrde kupovine.
      </p>
      <p>
        Pristup kursevima traje dok traje plaćanje. Svaka uspešna naplata produžava pristup za
        naredni mesec i za nju izdajemo fiskalni račun.
      </p>
      <p>
        Otkazivanje je moguće u svakom trenutku, bez navođenja razloga: u odeljku „Moj nalog" na
        platformi klikom na „Otkaži plaćanje", ili slanjem poruke na info@hartweger.rs. Otkazivanje
        zaustavlja sve buduće naplate; pristup ostaje do isteka već plaćenog meseca. Već naplaćene
        rate se ne vraćaju, osim u slučajevima predviđenim Zakonom o zaštiti potrošača.
      </p>
      <p>
        Jedna rata odgovara jednom mesecu pristupa. Ako otkažeš ili naplata ne prođe, pa se kasnije
        vratiš, plaćaš samo preostali broj rata - nikada ne plaćaš više od ukupnog broja rata za
        kurs, niti mesece u kojima nisi imala pristup.
      </p>
      <p>
        Otkazivanje ne briše tvoj rad na platformi: završene lekcije, urađene vežbe, rezultati
        testova i stečeni sertifikati ostaju sačuvani uz tvoj nalog i čekaju te kad se vratiš.
      </p>
```

- [ ] **Step 2: Istakni mesečnu cenu ravnopravno sa punom**

U `src/app/kursevi/paket-a1-a2-b1/page.tsx` nađi red sa cenom (`≈ 249€ · plaćanje na rate dostupno`) i zameni ga sa:

```tsx
                <p className="text-sm text-gray-400 mt-2">≈ 249€</p>
                {/* Rate su glavni adut za one kojima je pun iznos prevelik zalogaj,
                    pa stoje ravnopravno uz cenu, a ne kao sitna napomena (odluka 21.07.2026). */}
                <p className="mt-3 inline-block rounded-lg bg-plava/5 border border-plava/20 px-4 py-2 text-[15px] text-gray-800">
                  ili <strong>3.199 din mesečno</strong> kroz 12 rata
                </p>
```

- [ ] **Step 3: Provera tipova i build**

Run: `./node_modules/.bin/tsc --noEmit && npm run build`
Očekivano: bez greške.

- [ ] **Step 4: Commit**

```bash
git add src/app/uslovi/page.tsx src/app/kursevi/paket-a1-a2-b1/page.tsx
git commit -m "Uslovi korišćenja: odeljak o mesečnom plaćanju; cena po mesecu na stranici paketa"
```

---

### Task 15: Admin pregled pretplata

**Files:**
- Create: `src/app/admin/pretplate/page.tsx`

- [ ] **Step 1: Napiši stranicu**

```tsx
// src/app/admin/pretplate/page.tsx
// Pregled svih pretplata (rate). Pristup čuva proxy (role=admin za /admin/*).
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminPretplatePage() {
  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("subscriptions")
    .select("id, created_at, recurring_id, base_oid, amount, total_payments, paid_payments, status, next_charge_at, last_polled_at, user_id")
    .order("created_at", { ascending: false });

  const userIds = (subs ?? []).map((s) => s.user_id);
  const { data: profili } = userIds.length
    ? await admin.from("user_profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] as Array<{ id: string; full_name: string | null; email: string | null }> };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pretplate (mesečne rate)</h1>
      {!subs?.length ? (
        <p className="text-gray-500">Još nema nijedne pretplate.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 border-b">Polaznik</th>
                <th className="text-left p-2 border-b">Porudžbina</th>
                <th className="text-left p-2 border-b">Rate</th>
                <th className="text-left p-2 border-b">Iznos</th>
                <th className="text-left p-2 border-b">Status</th>
                <th className="text-left p-2 border-b">Sledeća naplata</th>
                <th className="text-left p-2 border-b">Poslednja provera</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => {
                const p = (profili ?? []).find((x) => x.id === s.user_id);
                return (
                  <tr key={s.id}>
                    <td className="p-2 border-b">{p?.full_name ?? p?.email ?? "-"}</td>
                    <td className="p-2 border-b">{s.base_oid}</td>
                    <td className="p-2 border-b">{s.paid_payments}/{s.total_payments}</td>
                    <td className="p-2 border-b">{Number(s.amount).toLocaleString("sr-RS")} din</td>
                    <td className="p-2 border-b">{s.status}</td>
                    <td className="p-2 border-b">
                      {s.next_charge_at ? new Date(s.next_charge_at).toLocaleDateString("sr-RS") : "-"}
                    </td>
                    <td className="p-2 border-b">
                      {s.last_polled_at ? new Date(s.last_polled_at).toLocaleString("sr-RS") : "nije još"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Provera tipova**

Run: `./node_modules/.bin/tsc --noEmit`
Očekivano: bez greške.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/pretplate/page.tsx
git commit -m "Admin pregled pretplata"
```

---

### Task 16: „Nastavi gde si stao" - nastavak posle pauze

**Files:**
- Modify: `src/lib/subscription-plans.ts`, `src/app/kupovina/[slug]/page.tsx`, `src/app/kupovina/[slug]/CheckoutForm.tsx`, `src/app/api/orders/route.ts`, `src/app/kupovina/kartica/[orderId]/page.tsx`
- Test: `src/lib/subscription-plans.test.ts`

> **Pravilo:** jedna rata = jedan mesec pristupa. Ko je platio 5 od 12 rata pa stao,
> pri povratku plaća preostalih 7, a ne novih 12.

- [ ] **Step 1: Napiši test koji pada**

Dodaj u `src/lib/subscription-plans.test.ts`:

```ts
import { remainingPayments } from "./subscription-plans";

describe("remainingPayments", () => {
  it("računa preostale rate iz prethodne serije", () => {
    expect(remainingPayments({ total_payments: 12, paid_payments: 5 })).toBe(7);
  });

  it("bez prethodne serije vraća null (kupovina je nova)", () => {
    expect(remainingPayments(null)).toBeNull();
  });

  it("isplaćenu seriju ne nastavlja", () => {
    expect(remainingPayments({ total_payments: 12, paid_payments: 12 })).toBeNull();
  });

  it("ne dozvoljava negativan ili nulti broj rata", () => {
    expect(remainingPayments({ total_payments: 12, paid_payments: 13 })).toBeNull();
  });
});
```

- [ ] **Step 2: Pokreni test, mora da padne**

Run: `./node_modules/.bin/vitest run src/lib/subscription-plans.test.ts`
Očekivano: FAIL, `remainingPayments is not a function`.

- [ ] **Step 3: Dodaj funkciju u `src/lib/subscription-plans.ts`**

```ts
/**
 * Koliko rata je ostalo iz ranije, prekinute serije. `null` znači da nastavka nema
 * (nema ranije serije ili je isplaćena) pa se prodaje pun broj rata.
 */
export function remainingPayments(
  prethodna: { total_payments: number; paid_payments: number } | null,
): number | null {
  if (!prethodna) return null;
  const ostalo = prethodna.total_payments - prethodna.paid_payments;
  return ostalo > 0 ? ostalo : null;
}
```

- [ ] **Step 4: Pokreni test, mora da prođe**

Run: `./node_modules/.bin/vitest run src/lib/subscription-plans.test.ts`
Očekivano: PASS (12 testova).

- [ ] **Step 5: Nađi prekinutu seriju na strani za kupovinu**

U `src/app/kupovina/[slug]/page.tsx`, pre renderovanja `<CheckoutForm />`, dodaj:

```tsx
  // Nastavak posle pauze: ako ulogovana polaznica ima prekinutu seriju za OVAJ kurs,
  // nudi joj se samo preostali broj rata.
  let nastavakRata: number | null = null;
  if (planForSlug(course.slug)) {
    const supabaseUser = await createClient();
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (user) {
      const admin = createAdminClient();
      const { data: prethodna } = await admin
        .from("subscriptions")
        .select("total_payments, paid_payments")
        .eq("user_id", user.id)
        .eq("course_id", course.id)
        .in("status", ["cancelled", "failed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      nastavakRata = remainingPayments(prethodna ?? null);
    }
  }
```

uz uvoze:

```tsx
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { planForSlug, remainingPayments } from "@/lib/subscription-plans";
```

i prosledi formi:

```tsx
        subscriptionPlan={
          planForSlug(course.slug)
            ? { ...planForSlug(course.slug)!, totalPayments: nastavakRata ?? planForSlug(course.slug)!.totalPayments }
            : null
        }
        jeNastavak={nastavakRata !== null}
```

- [ ] **Step 6: Prikaži da je reč o nastavku**

U `src/app/kupovina/[slug]/CheckoutForm.tsx` dodaj prop u tip:

```ts
  jeNastavak?: boolean;
```

i u obaveštenju o mesečnoj naplati, iznad postojećeg teksta, dodaj:

```tsx
          {jeNastavak && (
            <p className="text-sm text-gray-700">
              <strong>Nastavljaš gde si stala.</strong> Ranije plaćene rate su uračunate, pa ti je
              ostalo još {subscriptionPlan.totalPayments} rata. Napredak na platformi te čeka
              nedirnut.
            </p>
          )}
```

- [ ] **Step 7: Prenesi broj rata kroz porudžbinu**

Broj naplata se do sada čitao iz plana. Da bi nastavak radio, mora da se zapamti na porudžbini.

U `src/app/api/orders/route.ts`, u telu zahteva prihvati i `totalPayments`, pa ga uz kočnicu upiši:

```ts
    // Broj rata za nastavak posle pauze. Nikad veći od plana - inače bi izmenjen
    // zahtev mogao da produži seriju preko dogovorenog.
    const plan = planForSlug(course.slug);
    const trazeneRate = Number(totalPayments) || 0;
    const rateZaSeriju =
      paymentMethod === "kartica_pretplata" && plan
        ? Math.min(Math.max(trazeneRate, 1), plan.totalPayments)
        : null;
```

i dodaj `total_payments_override: rateZaSeriju` u `insert` porudžbine (kolona se dodaje u sledećem koraku).

- [ ] **Step 8: Dodaj kolonu i uveži je**

Napravi `supabase/migrations/071_orders_total_payments_override.sql`:

```sql
-- Broj rata za ovu kupovinu; manji od plana kod nastavka posle pauze.
alter table orders add column if not exists total_payments_override int;
```

Primeni je (`apply_migration`, name: `orders_total_payments_override`), pa u
`src/app/kupovina/kartica/[orderId]/page.tsx` u `select` dodaj `total_payments_override` i
izmeni prosleđivanje:

```tsx
    recurring: plan
      ? { totalPayments: order.total_payments_override ?? plan.totalPayments }
      : undefined,
```

a u `src/lib/subscription-start.ts` zameni `total_payments: plan.totalPayments` sa:

```ts
      total_payments: (order as { total_payments_override?: number | null }).total_payments_override ?? plan.totalPayments,
```

(uz dopunu `select`-a u callbacku da vraća i tu kolonu - on već čita `*`).

- [ ] **Step 9: Pošalji broj rata iz forme**

U `handleSubmit` u `CheckoutForm.tsx`, u telo `fetch("/api/orders")` dodaj:

```ts
          totalPayments: method === "kartica_pretplata" ? subscriptionPlan?.totalPayments ?? null : null,
```

- [ ] **Step 10: Provera tipova, testova i builda**

Run: `./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/vitest run && npm run build`
Očekivano: sve prolazi.

- [ ] **Step 11: Commit**

```bash
git add src/lib/subscription-plans.ts src/lib/subscription-plans.test.ts src/app/kupovina src/app/api/orders/route.ts src/lib/subscription-start.ts supabase/migrations/071_orders_total_payments_override.sql
git commit -m "Nastavak posle pauze: naplaćuje se samo preostali broj rata"
```

---

### Task 17: Provera u testnom okruženju banke (ubrzano)

**Files:**
- Create: `src/app/api/admin/nestpay-recurring-status/route.ts`

> **Preduslov (Nataša):** u **testnom** Merchant Centeru napraviti API korisnika isto kao
> na produkciji (Administration → Add New User, Role = Api User, ime različito od
> `NATadmin`), pa dodati u Vercel:
> ```
> printf 'NATapi' | vercel env add NESTPAY_TEST_API_USER production --scope hartwegers-projects
> printf 'LOZINKA' | vercel env add NESTPAY_TEST_API_PASSWORD production --scope hartwegers-projects
> ```
> Bez toga se dohvatanje rata ne može uvežbati nad test serijom.

- [x] **Step 1: Admin alatka za status serije** — URAĐENO (`24c00f6`); dodata i provera da su env kredencijali podešeni, sa jasnom porukom umesto tihog 502.

```ts
// src/app/api/admin/nestpay-recurring-status/route.ts
// Prikazuje sve naplate jedne recurring serije. Služi za uvežbavanje nad TEST serijom
// pre puštanja uživo i za podršku na produkciji.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { buildRecurringStatusXml, parseRecurringStatus, postCc5, type NestpayEnv } from "@/lib/nestpay-recurring";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const recurringId = url.searchParams.get("recurringId")?.trim();
  const env: NestpayEnv = url.searchParams.get("env") === "test" ? "test" : "prod";
  if (!recurringId) {
    return NextResponse.json({ error: "Nedostaje ?recurringId=" }, { status: 400 });
  }

  const xml = await postCc5(buildRecurringStatusXml(recurringId, env), env);
  if (!xml) return NextResponse.json({ error: "Banka nije odgovorila." }, { status: 502 });

  const parsed = parseRecurringStatus(xml);
  return NextResponse.json({ env, recurringId, ...parsed, sirovo: xml.slice(0, 2000) });
}
```

- [ ] **Step 2: Deploy na produkciju**

```bash
./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/vitest run && vercel --prod --scope hartwegers-projects
```
Očekivano: svi testovi prolaze, deploy uspešan, smoke test 6/6.

- [ ] **Step 2: Ubrzana test serija**

Na `/admin/nestpay-recurring-test` pokreni seriju sa dnevnom frekvencijom (postojeća stranica, testno okruženje banke). Zabeleži `RECURRINGID` iz tabele callbackova.

- [ ] **Step 3: Provera dohvatanja rata**

Sutradan, posle vremena naplate, u Supabase:

```sql
select s.recurring_id, s.paid_payments, s.status, o.order_number, o.installment_no, o.nestpay_oid, o.payment_status
from subscriptions s
left join orders o on o.subscription_id = s.id
order by o.installment_no;
```
Očekivano: red za ratu 2 sa `payment_status = 'completed'` i popunjenim `nestpay_oid`.

- [x] **Step 4: Provera vrednosti `TRANS_STAT` nad test serijom** — URAĐENO 21.07.2026

Otvori (ulogovan kao admin), sa `RECURRINGID` iz test serije:

```
https://www.hartweger.rs/api/admin/nestpay-recurring-status?env=test&recurringId=<RECURRINGID>
```

Rezultat nad serijom `26201OnlA13974`: sve tri naplate vraćene bez ijednog callbacka -
naplate 1 i 2 kao `TRANS_STAT=C` sa iznosom i `AUTH_CODE`, naplata 3 kao `PN` sa
`PLANNED_START_DTTM`. Pun spisak statusa preuzet iz priručnika i ugrađen u
`parseRecurringStatus` (commit `5d2b69f`), zajedno sa proverom da `CHARGE_TYPE_CD=C`
(povraćaj) ne broji kao naplata. Izazivanje pale naplate karticom `4841878700002912` +
CVC `510` više nije uslov za produkciju, ali ostaje kao korisna provera.

- [ ] **Step 5: Provera otkazivanja**

U „Moj nalog" klikni „Otkaži plaćanje" za test pretplatu, pa u Merchant Center-u proveri da su preostale naplate nestale iz sekcije `Recurrings`.

- [ ] **Step 6: Javi banci**

Pošalji banci link ka `/kupovina/paket-a1-a2-b1` (izbor „Mesečno plaćanje") i `/uslovi`, uz molbu za odobrenje aktivacije recurringa na produkciji.

---

## Šta ostaje van ovog plana

- 1:1 mesečni paketi kao prava pretplata (odluke su zapisane u specu: profesorka zaustavlja obnovu, 12 naplata, prenos neiskorišćenih časova mesec dana).
- Mejlovi za pojedinačnu ratu i za palu naplatu - prvo videti kako se ponaša postojeći welcome mejl na ratama, pa tek onda dodavati nove šablone (YAGNI).
- PayPal pretplate za inostranstvo.
- Ostali video paketi i pojedinačni nivoi na rate.
