# Engleska ponuda: privatni mesečni časovi (1-on-1, na engleskom) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Objaviti englesku verziju ponude „individualni mesečni paketi" (proizvod
`private-german-lessons-online`) — cela landing stranica i checkout na engleskom,
EUR primarno, +25% cene, fiksno profesorka Katarina Todosijević.

**Architecture:** Pristup A iz spec-a — `lang` flag na `courses`; postojeći šabloni
(`kursevi/[slug]`, `kupovina/[slug]` + `CheckoutForm`, `PriceCard`, `ProductFaq`,
`Footer`) renderuju engleski kad je `course.lang==='en'`. Tekstovi idu kroz mali
i18n modul `src/lib/product-i18n.ts`. Logika plaćanja i fiskalizacije se NE dira.

**Tech Stack:** Next.js (App Router, verzija sa breaking changes — vidi AGENTS.md),
TypeScript, Supabase (Postgres), Tailwind, vitest.

**Spec:** `docs/superpowers/specs/2026-06-25-engleska-ponuda-mesecni-paketi-design.md`

**Napomene pre početka:**
- Repo: `/Users/natasahartweger/Documents/Claude/sajt/LMS/lms`, grana `main` (trunk-based).
- Deploy je ručno `vercel --prod` (NE preko gita); smoke test hook se okida posle.
- Profesorka Katarina Todosijević id: `f555ef90-407d-486b-a288-576d4d461148`.
- Supabase DDL: SQL Editor ili Management API (sbp_ token). Service-role ključ u `.env.local`.
- Cene: paket4 17500din/150€, paket8 34000din/290€, paket12 51000din/440€.

---

## File Structure

- `src/lib/product-i18n.ts` — **novo.** sr/en string mape za landing + checkout, helper za format novca. Jedna odgovornost: jezik proizvodnih stranica.
- `src/lib/product-i18n.test.ts` — **novo.** vitest test za modul.
- `src/app/kursevi/[slug]/page.tsx` — **izmena.** čita `lang`, koristi i18n, EUR primarno, fiksna profesorka, lang filter na related.
- `src/components/product/PriceCard.tsx` — **izmena.** podrška za EUR primarno + en tekstove.
- `src/app/kupovina/[slug]/page.tsx` — **izmena.** prosleđuje `lang` u formu.
- `src/app/kupovina/[slug]/CheckoutForm.tsx` — **izmena.** en tekstovi, sakrij izbor profesorke kad je jedna, EUR primarno, default zemlja.
- `src/components/product/ProductFaq.tsx` — **izmena.** engleski FAQ za novi slug (samo podatak).
- `src/components/Footer.tsx` — **izmena.** „English" link.
- DB: kolona `courses.lang`, 1 red u `courses`, 3 reda u `product_variants`.

---

## Task 1: DB — kolona `lang` + engleski proizvod + varijante

**Files:**
- DB only (Supabase SQL Editor). Bez izmena koda u ovom tasku.

- [ ] **Step 1: Dodaj `lang` kolonu na `courses`**

Pokreni u Supabase SQL Editor-u:

```sql
alter table public.courses
  add column if not exists lang text not null default 'sr';
```

- [ ] **Step 2: Proveri da su svi postojeći redovi 'sr'**

Run (SQL Editor):
```sql
select lang, count(*) from public.courses group by lang;
```
Expected: jedan red, `sr | <N>` (svi postojeći). Nema `en` još.

- [ ] **Step 3: Ubaci engleski proizvod**

```sql
insert into public.courses
  (title, slug, description, marketing_description, features, category,
   course_type, price, paypal_price_eur, is_published, is_purchasable, lang)
values (
  'Private German Lessons Online — 1-on-1, Taught in English',
  'private-german-lessons-online',
  'Private 1-on-1 German lessons online, taught entirely in English. Flexible monthly packages with an experienced tutor — pick your own times and pay in EUR.',
  E'Learning German while living in a German-speaking country? Get private, one-on-one lessons taught entirely in English, so you understand every explanation from day one.\n\nYou choose your times, learn at your own pace, and work on exactly what you need — conversation, grammar, work or everyday situations. No long-term commitment: pick a monthly package and renew only if you want to.',
  array[
    'Taught fully in English — understand every explanation from day one',
    '1-on-1 lessons, fully personalized to your level and goals',
    'Flexible scheduling across time zones — you pick the time via Google Calendar',
    'Monthly packages, no long-term commitment — renew only if you want to',
    'Learn with Katarina, an experienced Hartweger tutor',
    'Trusted by 3000+ students — rated 5.0 across 300+ Google reviews'
  ],
  'mesecni',
  (select course_type from public.courses where slug = 'individualni-mesecni-paketi'),
  17500,
  150,
  true,
  true,
  'en'
);
```

- [ ] **Step 4: Ubaci 3 varijante (sve Katarina), +25% cene, EUR po paketu**

```sql
insert into public.product_variants
  (course_id, professor_id, package_type, price, paypal_price_eur, is_active)
select
  c.id,
  'f555ef90-407d-486b-a288-576d4d461148'::uuid,
  v.package_type, v.price, v.eur, true
from public.courses c
cross join (values
  ('paket4', 17500, 150),
  ('paket8', 34000, 290),
  ('paket12', 51000, 440)
) as v(package_type, price, eur)
where c.slug = 'private-german-lessons-online';
```

- [ ] **Step 5: Verifikuj proizvod + varijante**

Run (SQL Editor):
```sql
select c.slug, c.lang, c.price, c.paypal_price_eur,
       v.package_type, v.price as v_price, v.paypal_price_eur as v_eur, v.professor_id
from public.courses c
join public.product_variants v on v.course_id = c.id
where c.slug = 'private-german-lessons-online'
order by v.price;
```
Expected: 3 reda, svi `lang=en`, `professor_id = f555ef90-...`, cene 17500/34000/51000, eur 150/290/440.

- [ ] **Step 6: (bez commita — DB promena)**

Nema git commita u ovom tasku. Pređi na Task 2.

---

## Task 2: i18n modul + test

**Files:**
- Create: `src/lib/product-i18n.ts`
- Test: `src/lib/product-i18n.test.ts`

- [ ] **Step 1: Napiši test (failing)**

`src/lib/product-i18n.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { productStrings, checkoutStrings, formatMoney, type Lang } from "./product-i18n";

describe("product-i18n", () => {
  it("vraća engleske stringove za en", () => {
    const t = productStrings("en");
    expect(t.categoryLabel).toBe("Monthly package");
    expect(t.featuresTitle).toBe("What's included");
    expect(t.priceCurrency).toBe("EUR");
  });

  it("vraća srpske stringove za sr", () => {
    const t = productStrings("sr");
    expect(t.featuresTitle).toBe("Šta uključuje paket?");
    expect(t.priceCurrency).toBe("RSD");
  });

  it("checkout stringovi po jeziku", () => {
    expect(checkoutStrings("en").title).toBe("Checkout");
    expect(checkoutStrings("sr").title).toBe("Kupovina");
    expect(checkoutStrings("en").packageLabels.paket4).toBe("4 sessions");
  });

  it("formatMoney EUR i RSD", () => {
    expect(formatMoney(150, "EUR")).toBe("150 €");
    expect(formatMoney(17500, "RSD")).toBe("17.500 din");
  });

  it("nepoznat lang pada na sr", () => {
    expect(productStrings("xx" as Lang).priceCurrency).toBe("RSD");
  });
});
```

- [ ] **Step 2: Pokreni test — mora da padne**

Run: `npx vitest run src/lib/product-i18n.test.ts`
Expected: FAIL — `Cannot find module './product-i18n'`.

- [ ] **Step 3: Implementiraj modul**

`src/lib/product-i18n.ts`:
```ts
export type Lang = "sr" | "en";

export interface ProductStrings {
  categoryLabel: string;          // badge
  featuresTitle: string;
  ratingText: string;             // "5.0 - 300+ Google recenzija"
  // info-blok mesečni
  oneOnOneWithKatarina: string;   // EN: fiksna profesorka; SR: prazno (koristi se stari tekst)
  chooseProfessorLine: string | null; // null = ne prikazuj (fiksna profesorka)
  bookYourTimeLine: string;
  noVideoCertLine: string;
  // CTA / cene
  ctaBuy: string;
  pricePrefixFrom: string;        // "od " / "from "
  priceCurrency: "RSD" | "EUR";   // koja valuta je primarna
  // donji CTA
  bottomTitle: string;
  bottomSubtitle: string;
  freeTestLink: string;
  relatedTitle: string;
  breadcrumbHome: string;
  breadcrumbCourses: string;
}

const SR_PRODUCT: ProductStrings = {
  categoryLabel: "Mesečni paket",
  featuresTitle: "Šta uključuje paket?",
  ratingText: "5.0 - 300+ Google recenzija",
  oneOnOneWithKatarina: "",
  chooseProfessorLine: "Birate profesorku u sledećem koraku",
  bookYourTimeLine: "Ti biraš termin - dobijaš Google Calendar link i zakazuješ",
  noVideoCertLine: "Mesečni paket ne uključuje video lekcije ni sertifikat",
  ctaBuy: "Kupi",
  pricePrefixFrom: "od ",
  priceCurrency: "RSD",
  bottomTitle: "Spremi se da progovoriš nemački",
  bottomSubtitle: "Pridruži se grupi od 3000+ polaznika koji su već krenuli sa učenjem.",
  freeTestLink: "Ili uradi besplatno testiranje →",
  relatedTitle: "Možda će te zanimati",
  breadcrumbHome: "Početna",
  breadcrumbCourses: "Kursevi",
};

const EN_PRODUCT: ProductStrings = {
  categoryLabel: "Monthly package",
  featuresTitle: "What's included",
  ratingText: "5.0 — 300+ Google reviews",
  oneOnOneWithKatarina: "1-on-1 with Katarina — taught in English",
  chooseProfessorLine: null,
  bookYourTimeLine: "You pick your times — you get a Google Calendar link and book yourself",
  noVideoCertLine: "Monthly packages don't include video lessons or a certificate",
  ctaBuy: "Buy",
  pricePrefixFrom: "from ",
  priceCurrency: "EUR",
  bottomTitle: "Start speaking German with confidence",
  bottomSubtitle: "Join 3000+ students who are already learning with us.",
  freeTestLink: "Or take a free placement test →",
  relatedTitle: "You might also like",
  breadcrumbHome: "Home",
  breadcrumbCourses: "Courses",
};

export interface CheckoutStrings {
  title: string;
  fullNameLabel: string;
  emailLabel: string;
  countryLabel: string;
  packageLabels: Record<string, string>; // paket4/8/12
  methodCard: string;
  methodBank: string;
  methodPaypal: string;
  couponToggle: string;
  couponApply: string;
  payButton: string;       // npr. "Pay" / "Plati"
  totalLabel: string;
}

const SR_CHECKOUT: CheckoutStrings = {
  title: "Kupovina",
  fullNameLabel: "Ime i prezime",
  emailLabel: "Email",
  countryLabel: "Zemlja",
  packageLabels: { paket4: "4 termina", paket8: "8 termina", paket12: "12 termina" },
  methodCard: "Kartica",
  methodBank: "Uplatnica",
  methodPaypal: "PayPal",
  couponToggle: "Imaš kupon?",
  couponApply: "Primeni",
  payButton: "Plati",
  totalLabel: "Ukupno",
};

const EN_CHECKOUT: CheckoutStrings = {
  title: "Checkout",
  fullNameLabel: "Full name",
  emailLabel: "Email",
  countryLabel: "Country",
  packageLabels: { paket4: "4 sessions", paket8: "8 sessions", paket12: "12 sessions" },
  methodCard: "Card",
  methodBank: "Bank transfer",
  methodPaypal: "PayPal",
  couponToggle: "Have a coupon?",
  couponApply: "Apply",
  payButton: "Pay",
  totalLabel: "Total",
};

export function productStrings(lang: Lang): ProductStrings {
  return lang === "en" ? EN_PRODUCT : SR_PRODUCT;
}

export function checkoutStrings(lang: Lang): CheckoutStrings {
  return lang === "en" ? EN_CHECKOUT : SR_CHECKOUT;
}

export function formatMoney(amount: number, currency: "RSD" | "EUR"): string {
  const n = amount.toLocaleString("de-DE");
  return currency === "EUR" ? `${n} €` : `${n} din`;
}
```

- [ ] **Step 4: Pokreni test — mora da prođe**

Run: `npx vitest run src/lib/product-i18n.test.ts`
Expected: PASS (5 testova).

- [ ] **Step 5: Commit**

```bash
cd /Users/natasahartweger/Documents/Claude/sajt/LMS/lms
git add src/lib/product-i18n.ts src/lib/product-i18n.test.ts
git commit -m "feat(i18n): product+checkout string mape za en/sr

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Landing stranica — renderuj engleski + EUR primarno

**Files:**
- Modify: `src/app/kursevi/[slug]/page.tsx`

- [ ] **Step 1: Učitaj `lang` i pripremi i18n + valutu**

U `KursDetaljiPage`, posle `const category = course.category || "video";` dodaj:
```tsx
import { productStrings, formatMoney, type Lang } from "@/lib/product-i18n";
// ...
const lang = (course.lang === "en" ? "en" : "sr") as Lang;
const en = lang === "en";
const t = productStrings(lang);
// Cena koja se prikazuje primarno: EUR za en (paypal_price_eur), inače RSD.
const heroPrimary = en
  ? formatMoney(course.paypal_price_eur ?? 0, "EUR")
  : formatMoney(course.price, "RSD");
```
Napomena: `Course` tip u `src/lib/types.ts` treba da dobije `lang: string;` polje
(dodaj `lang: string;` u `interface Course`). Inače TS prijavljuje grešku na `course.lang`.

- [ ] **Step 2: Badge label, rating, featuresTitle**

Zameni hardkodirano:
- `{cat.label}` → `{en ? t.categoryLabel : cat.label}`
- rating tekst `5.0 - 300+ Google recenzija` → `{t.ratingText}`
- `featuresTitle` izračun: za `en` koristi `t.featuresTitle` (ne srpski switch). Najjednostavnije:
```tsx
const featuresTitle = en ? t.featuresTitle : (
  category === "grupni" ? "Šta dobijaš upisom?" :
  category === "individualni" ? "Šta uključuje kurs?" :
  category === "mesecni" ? "Šta uključuje paket?" :
  category === "paket" ? "Šta dobijaš u paketu?" : "Šta dobijaš upisom?"
);
```
- `ctaLabel`: za `en` → `t.ctaBuy`:
```tsx
const ctaLabel = en ? t.ctaBuy : (
  category === "grupni" ? "Prijavi se" :
  category === "individualni" || category === "mesecni" ? "Kupi" :
  category === "paket" ? "Kupi paket" : "Kupi kurs"
);
```

- [ ] **Step 3: Breadcrumb na engleskom**

U hero breadcrumb-u zameni:
```tsx
<Link href="/" className="hover:text-plava">{t.breadcrumbHome}</Link>
<span>/</span>
<Link href="/kursevi" className="hover:text-plava">{t.breadcrumbCourses}</Link>
```

- [ ] **Step 4: Info-blok mesečnog paketa — fiksna Katarina + EN tekstovi**

U bloku `{(category === "individualni" || category === "mesecni") && (...)}` zameni
srpske linije tako da poštuju jezik i fiksnu profesorku:
```tsx
{en ? (
  <p className="text-gray-700"><strong>{t.oneOnOneWithKatarina}</strong></p>
) : (
  slug !== "fsp-individualni" && (
    <p className="text-gray-600">{t.chooseProfessorLine}</p>
  )
)}
<p className="text-gray-600">{t.bookYourTimeLine}</p>
{category === "mesecni" && (
  <p className="text-gray-500">{t.noVideoCertLine}</p>
)}
```
(Linije `{termini && ...}` ostaju kao jesu — za `mesecni` je `termini` null pa se ne prikazuju.)

- [ ] **Step 5: Donji CTA + free-test link + related naslov**

- `Spremi se da progovoriš nemački` → `{t.bottomTitle}`
- `Pridruži se grupi od 3000+...` → `{t.bottomSubtitle}`
- `Ili uradi besplatno testiranje →` → `{t.freeTestLink}`
- `Možda će te zanimati` → `{t.relatedTitle}`
- Donji CTA dugme tekst:
```tsx
{ctaLabel} - {isVariable ? t.pricePrefixFrom : ""}{heroPrimary}
```
- Mobilni sticky bar cena:
```tsx
<p className="font-bold text-gray-900 text-lg leading-tight">
  {isVariable && t.pricePrefixFrom}{heroPrimary}
</p>
```
(Za `en` ukloni odvojeni „≈ €" red u sticky/related jer je EUR već primaran — prikaži din sitno umesto toga ili izostavi. Najjednostavnije: za `en` u sticky-ju sekundarni red = `formatMoney(course.price, "RSD")`.)

- [ ] **Step 6: PriceCard prima jezik (priprema za Task 4)**

U desnom PriceCard pozivu dodaj prop:
```tsx
<PriceCard
  price={course.price}
  priceEur={course.paypal_price_eur}
  slug={course.slug}
  ctaLabel={ctaLabel}
  isVariable={isVariable}
  title={course.title}
  lang={lang}
/>
```

- [ ] **Step 7: Build provera**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "kursevi/\[slug\]|product-i18n" || echo OK`
Expected: `OK` (ili samo grešku za `PriceCard` lang prop dok se Task 4 ne uradi — to je očekivano; nastavi).

- [ ] **Step 8: Commit**

```bash
git add src/app/kursevi/[slug]/page.tsx src/lib/types.ts
git commit -m "feat(kursevi): en rendering + EUR primarno na landing stranici

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: PriceCard — EUR primarno + en tekstovi

**Files:**
- Modify: `src/components/product/PriceCard.tsx`

- [ ] **Step 1: Dodaj `lang` prop i prebaci tekstove**

Izmeni `Props` i telo:
```tsx
import Link from "next/link";
import BuyButton from "@/components/BuyButton";
import { productStrings, formatMoney, type Lang } from "@/lib/product-i18n";

interface Props {
  price: number;
  priceEur: number | null;
  slug: string;
  ctaLabel: string;
  isVariable?: boolean;
  title: string;
  lang?: Lang;
}

export default function PriceCard({ price, priceEur, slug, ctaLabel, isVariable, title, lang = "sr" }: Props) {
  const en = lang === "en";
  const t = productStrings(lang);
  // Primarna cena: EUR za en (ako postoji), inače RSD.
  const primary = en && priceEur != null ? formatMoney(priceEur, "EUR") : formatMoney(price, "RSD");
  const secondary = en ? (price ? `≈ ${formatMoney(price, "RSD")}` : null)
                       : (priceEur ? `≈ ${priceEur}€` : null);
  const bullets = en
    ? ["Instant access after payment", "Card, bank transfer or PayPal", "3000+ happy students"]
    : ["Pristup odmah nakon uplate", "Kartica, uplatnica ili PayPal", "3000+ zadovoljnih polaznika"];
  const questionText = en ? "Have a question?" : "Imate pitanje?";
  const questionLink = en ? "Write to us" : "Pišite nam";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-200/60 overflow-hidden lg:sticky lg:top-24">
      <div className="bg-gray-50 px-7 py-6 text-center border-b border-gray-100">
        <p className="text-4xl font-bold text-gray-900">
          {isVariable && t.pricePrefixFrom}
          {primary}
        </p>
        {secondary && (
          <p className="text-[#F78687] font-bold text-sm mt-1.5">{secondary}</p>
        )}
      </div>

      <div className="p-7">
        <BuyButton
          slug={slug}
          contentId={slug}
          contentName={title}
          value={price}
          className="block w-full text-center bg-[#F78687] hover:bg-[#e06060] text-white font-bold text-lg py-4 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-[#F78687]/25"
        >
          {ctaLabel}
        </BuyButton>

        <div className="mt-6 space-y-3.5">
          {bullets.map((text, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-gray-500">
              <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              {text}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-400">
            {questionText}{" "}
            <Link href="/kontakt" className="text-plava hover:underline font-medium">{questionLink}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```
(Stari lokalni `formatPrice` se uklanja — koristi se `formatMoney` iz modula.)

- [ ] **Step 2: Build provera**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "PriceCard|kursevi/\[slug\]" || echo OK`
Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add src/components/product/PriceCard.tsx
git commit -m "feat(PriceCard): EUR primarno + en tekstovi

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Related upit — ne mešaj sr/en

**Files:**
- Modify: `src/app/kursevi/[slug]/page.tsx` (related upit, oko linije 261)

- [ ] **Step 1: Dodaj lang filter na related upit**

Izmeni:
```tsx
const { data: related } = await supabase
  .from("courses").select("title, slug, price, paypal_price_eur, category")
  .eq("is_purchasable", true).eq("category", category).eq("lang", lang).neq("slug", slug)
  .order("price", { ascending: true }).limit(3);
```
(Dodato `.eq("lang", lang)` — en proizvod vidi samo en „related", srpski samo srpske.
Pošto trenutno postoji samo 1 en proizvod, en „related" će biti prazan → sekcija se ne prikazuje, što je OK.)

- [ ] **Step 2: Related kartice — format cene po jeziku**

U `related.map(...)` zameni prikaz cene:
```tsx
<span className="font-bold text-gray-900">
  {en && r.paypal_price_eur != null ? formatMoney(r.paypal_price_eur, "EUR") : formatMoney(r.price, "RSD")}
</span>
{!en && r.paypal_price_eur && <span className="text-xs text-[#F78687] font-bold">≈ {r.paypal_price_eur}€</span>}
```

- [ ] **Step 3: Build provera**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "kursevi/\[slug\]" || echo OK`
Expected: `OK`.

- [ ] **Step 4: Commit**

```bash
git add src/app/kursevi/[slug]/page.tsx
git commit -m "fix(kursevi): related upit filtrira po lang (sr/en se ne mešaju)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Checkout — engleski + sakrij izbor profesorke + EUR primarno

**Files:**
- Modify: `src/app/kupovina/[slug]/page.tsx`
- Modify: `src/app/kupovina/[slug]/CheckoutForm.tsx`

- [ ] **Step 1: Server stranica čita i prosleđuje `lang`**

U `src/app/kupovina/[slug]/page.tsx`, dodaj `lang` u select:
```tsx
.select("id, title, slug, price, paypal_price_eur, description, category, course_type, included_lessons, lang")
```
Naslov stranice po jeziku i prosledi prop:
```tsx
import { checkoutStrings } from "@/lib/product-i18n";
// ...
const lang = course.lang === "en" ? "en" : "sr";
const ct = checkoutStrings(lang);
```
U JSX zameni `<h1>Kupovina</h1>` → `<h1 ...>{ct.title}</h1>` i prosledi `lang={lang}` u `<CheckoutForm .../>`.

- [ ] **Step 2: CheckoutForm prima `lang` i koristi i18n**

U `CheckoutForm.tsx` dodaj `lang` u `Props` i telo:
```tsx
import { checkoutStrings } from "@/lib/product-i18n";
// Props:
lang?: "sr" | "en";
// u funkciji (na vrhu):
const en = lang === "en";
const ct = checkoutStrings(lang ?? "sr");
```
Zameni `PAKET_LABEL` korišćenje sa `ct.packageLabels`:
```tsx
const PAKET_LABEL = ct.packageLabels;
```

- [ ] **Step 3: Sakrij izbor profesorke kad je samo jedna**

Pronađi sekciju „Individualni: izbor profesorke / paketa" (oko linije 180) i renderuj
selektor profesorke samo ako ih ima više:
```tsx
{professors.length > 1 && (
  /* postojeći blok sa izborom profesorke */
)}
```
(Kad je 1 profesorka, `professorId` je već inicijalizovan na `professors[0].id` — izbor
nije potreban. Paket selektor ostaje uvek.)

- [ ] **Step 4: Engleski tekstovi forme**

Zameni hardkodirane srpske labele tekstovima iz `ct`:
- naslovi/labele polja: ime → `ct.fullNameLabel`, email → `ct.emailLabel`, zemlja → `ct.countryLabel`
- metode plaćanja: `ct.methodCard` / `ct.methodBank` / `ct.methodPaypal`
- kupon: toggle → `ct.couponToggle`, dugme „Primeni" → `ct.couponApply`
- glavno dugme „Plati"/submit → `ct.payButton`
- „Ukupno" → `ct.totalLabel`
- napomena o proveri profesorke (oko linije 205) — za `en` izostavi ili prevedi:
  `{!en && (<p>Pre uplate proveri mejlom ...</p>)}`

- [ ] **Step 5: Lista zemalja + default za en**

Dodaj englesku verziju lista zemalja i default zemlju za `en`:
```tsx
const COUNTRIES_EN = [
  { code: "DE", label: "Germany" }, { code: "AT", label: "Austria" },
  { code: "CH", label: "Switzerland" }, { code: "GB", label: "United Kingdom" },
  { code: "US", label: "USA" }, { code: "RS", label: "Serbia" },
  { code: "OTHER", label: "Other country" },
];
const countryList = en ? COUNTRIES_EN : COUNTRIES;
// initial country: za en -> "DE", inače "RS"
const [country, setCountry] = useState(en ? "DE" : "RS");
```
Render `countryList` u `<select>` zemlje.

- [ ] **Step 6: EUR primarno u prikazu cene**

Tamo gde se prikazuje cena/suma (`discountedRsd`, `eurApprox`), za `en` prikaži EUR
veliko a din sitno. Koristi `selectedVariant?.paypal_price_eur` kad postoji:
```tsx
const eurDisplay = selectedVariant?.paypal_price_eur ?? eurApprox;
// primarni red:
{en ? `${eurDisplay} €` : `${formatPrice(discountedRsd)} din`}
// sekundarni red:
{en ? `≈ ${formatPrice(discountedRsd)} din` : `≈ ${eurApprox}€`}
```
(NE menjati šta se šalje na server za naplatu — i dalje ide RSD `discountedRsd`/varijanta.
Ovo je samo prikaz.)

- [ ] **Step 7: Build provera**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "kupovina/\[slug\]|CheckoutForm" || echo OK`
Expected: `OK`.

- [ ] **Step 8: Commit**

```bash
git add src/app/kupovina/[slug]/page.tsx src/app/kupovina/[slug]/CheckoutForm.tsx
git commit -m "feat(checkout): en jezik + sakrij izbor profesorke (1 prof) + EUR primarno

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: FAQ — engleski za novi slug

**Files:**
- Modify: `src/components/product/ProductFaq.tsx`

- [ ] **Step 1: Potvrdi da `faqBySlug` ima prioritet nad `faqByCategory`**

Pročitaj donji deo `ProductFaq.tsx` (logika izbora). Očekivano: ako postoji
`faqBySlug[slug]`, koristi se umesto `faqByCategory[category]`. Ako NE — dodaj tu
logiku: `const items = faqBySlug[slug] ?? faqByCategory[category] ?? [];`

- [ ] **Step 2: Dodaj engleski FAQ za novi slug**

U `faqBySlug` dodaj:
```tsx
"private-german-lessons-online": [
  { q: "What happens after I pay?", a: "You'll get a Google Calendar link to book your lessons whenever it suits you. You choose the day and time." },
  { q: "In what language are the lessons taught?", a: "Lessons and explanations are in English, while you learn and practice German. Perfect if you live in a German-speaking country and don't speak Serbian." },
  { q: "Who is my tutor?", a: "Your tutor is Katarina, an experienced Hartweger teacher. You don't choose — every booking in this package is 1-on-1 with her." },
  { q: "What if I don't use all my sessions in a month?", a: "Unused sessions don't roll over to the next month. We recommend booking regularly." },
  { q: "Can I cancel a booked lesson?", a: "Yes — you can cancel up to 24 hours before the scheduled lesson." },
  { q: "How do I pay?", a: "You can pay by card (Visa, MasterCard) or via PayPal. Prices are shown in EUR." },
],
```

- [ ] **Step 3: Provera renderovanja (build)**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "ProductFaq" || echo OK`
Expected: `OK`.

- [ ] **Step 4: Commit**

```bash
git add src/components/product/ProductFaq.tsx
git commit -m "feat(faq): engleski FAQ za private-german-lessons-online

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Footer — „English" link

**Files:**
- Modify: `src/components/Footer.tsx`

- [ ] **Step 1: Dodaj link u „Linkovi" listu**

Posle linije sa `/besplatno-testiranje` (oko linije 30) dodaj:
```tsx
<li><Link href="/kursevi/private-german-lessons-online" className="hover:text-white transition-colors">English: private German lessons</Link></li>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Footer.tsx
git commit -m "feat(footer): link na englesku ponudu privatnih časova

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Pun build + manuelna provera + deploy

**Files:** nema izmena (osim eventualnih fixeva koje provera otkrije).

- [ ] **Step 1: Pun typecheck + test**

Run:
```bash
cd /Users/natasahartweger/Documents/Claude/sajt/LMS/lms
npx tsc --noEmit -p tsconfig.json && npx vitest run src/lib/product-i18n.test.ts
```
Expected: nema TS grešaka; testovi PASS.

- [ ] **Step 2: Lokalna provera u browseru (dev)**

Run: `npm run dev` pa otvori:
- `/kursevi/private-german-lessons-online` — sve na engleskom, EUR primarno (od 150 €),
  badge „Monthly package", bez „choose professor" (piše „1-on-1 with Katarina"),
  engleski FAQ, donji CTA engleski.
- `/kupovina/private-german-lessons-online` — naslov „Checkout", engleske labele,
  NEMA izbora profesorke, paketi „4/8/12 sessions", cena EUR primarno (150/290/440 €),
  default zemlja Germany.
- `/kursevi/individualni-mesecni-paketi` (srpski) — i dalje srpski, RSD primarno,
  „related" NE prikazuje engleski proizvod.
- Footer — „English: private German lessons" vodi na englesku stranicu.

- [ ] **Step 3: Deploy na produkciju**

Run: `vercel --prod --yes`
Expected: `readyState: READY`; smoke-test hook prolazi (sve rute 200/307).

- [ ] **Step 4: Produkcijska provera**

Otvori `https://www.hartweger.rs/kursevi/private-german-lessons-online` i potvrdi
engleski + EUR. Otvori checkout i potvrdi da nema izbora profesorke i da je EUR primaran.

- [ ] **Step 5: Finalni commit (ako je bilo fixeva)**

```bash
git add -A
git commit -m "chore: fix posle provere engleske ponude" || echo "nema izmena"
```

---

## Self-Review (popunjeno)

- **Spec coverage:** lang kolona+proizvod+varijante (T1) ✓; EN rendering landing (T3) ✓;
  EUR primarno (T3/T4/T6) ✓; fiksna Katarina = jedna varijanta + sakriven izbor (T1/T6) ✓;
  checkout EN (T6) ✓; FAQ EN (T7) ✓; filtriranje sr/en (T5; lista je statična pa samo related) ✓;
  footer link (T8) ✓; marketing ugao = features/marketing copy (T1) ✓.
- **Placeholder scan:** nema TBD/TODO; sav kod i SQL su konkretni.
- **Type consistency:** `Lang`, `productStrings`, `checkoutStrings`, `formatMoney` korišćeni
  isto kroz T2–T6; `Course.lang` dodat u T3 Step 1; `PriceCard` `lang` prop dodat T3→T4.
- **Korekcija spec-a:** srpska `/kursevi` lista je statična (`KurseviKatalog`), ne DB upit,
  pa filtriranje treba samo na „related" upitu (T5), ne na listi.
