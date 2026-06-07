# Cookie saglasnost + politika privatnosti — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Uskladiti kurs.hartweger.rs sa GDPR/ZZPL — Google Consent Mode v2 + cookie banner (Prihvatam/Odbijam) + stranica politike privatnosti, bez gubitka kvaliteta podataka za plaćene oglase.

**Architecture:** Čista, testabilna logika saglasnosti živi u `src/lib/consent.ts` (Vitest, node env). Tanka klijentska komponenta `CookieBanner.tsx` čita/piše `localStorage` i poziva `window.gtag(...)`. Inline „consent default = denied" skript se učita PRE GTM-a u `layout.tsx` (Consent Mode v2), uz pre-grant za povratne posetioce. Nova server stranica `/politika-privatnosti` + link u footeru. Vercel analitika (cookieless) i auth kolačići se ne diraju.

**Tech Stack:** Next.js 16.2.3 (App Router), React, TypeScript, Tailwind (v4, arbitrary color values), Vitest (node env), Google Consent Mode v2 / GTM.

**Napomene pre početka:**
- Repo je git, grana `main`. Pre svakog commita: `git branch --show-current` (memo: trunk-based, 5 worktree-ova).
- Next 16 ima breaking changes — pre izmene `layout.tsx` pročitati `node_modules/next/dist/docs/` o `next/script` i `beforeInteractive` u root layout-u.
- Boje preko arbitrary vrednosti (`bg-[#1a2332]`, `text-[#4fb1d3]`) kao u postojećem `Footer.tsx`.
- Deploy je ručni `vercel --prod` (van obima ovog plana); posle deploya ide smoke test (hook) + provera CDN keša.

---

### Task 1: Čista logika saglasnosti (`src/lib/consent.ts`)

**Files:**
- Create: `src/lib/consent.ts`
- Test: `src/lib/consent.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/consent.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseConsent, consentParams, CONSENT_KEY } from "./consent";

describe("CONSENT_KEY", () => {
  it("ima stabilnu vrednost", () => expect(CONSENT_KEY).toBe("cookie-consent"));
});

describe("parseConsent", () => {
  it("granted ostaje granted", () => expect(parseConsent("granted")).toBe("granted"));
  it("denied ostaje denied", () => expect(parseConsent("denied")).toBe("denied"));
  it("null za nepoznatu vrednost", () => expect(parseConsent("maybe")).toBeNull());
  it("null za null", () => expect(parseConsent(null)).toBeNull());
  it("null za prazan string", () => expect(parseConsent("")).toBeNull());
});

describe("consentParams", () => {
  it("granted postavlja sve Google ključeve na granted", () =>
    expect(consentParams("granted")).toEqual({
      ad_storage: "granted",
      analytics_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    }));
  it("denied postavlja sve Google ključeve na denied", () =>
    expect(consentParams("denied")).toEqual({
      ad_storage: "denied",
      analytics_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    }));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/consent.test.ts`
Expected: FAIL — `Cannot find module './consent'`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/consent.ts`:

```ts
// Čista logika za cookie saglasnost (Google Consent Mode v2).
// Bez DOM/gtag poziva — to radi CookieBanner. Lako za testiranje (node env).

export const CONSENT_KEY = "cookie-consent";

export type ConsentValue = "granted" | "denied";

const GOOGLE_CONSENT_KEYS = [
  "ad_storage",
  "analytics_storage",
  "ad_user_data",
  "ad_personalization",
] as const;

/** Vraća sačuvanu saglasnost ili null ako nije validno zapisana. */
export function parseConsent(raw: string | null): ConsentValue | null {
  return raw === "granted" || raw === "denied" ? raw : null;
}

/** Mapira izbor u objekat saglasnosti za gtag('consent','update', ...). */
export function consentParams(value: ConsentValue): Record<string, ConsentValue> {
  return Object.fromEntries(GOOGLE_CONSENT_KEYS.map((k) => [k, value]));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/consent.test.ts`
Expected: PASS (svih 8 testova zeleno).

- [ ] **Step 5: Commit**

```bash
git branch --show-current   # potvrdi granu pre commita
git add src/lib/consent.ts src/lib/consent.test.ts
git commit -m "feat(consent): pure consent logic + tests"
```

---

### Task 2: Cookie banner komponenta (`src/components/CookieBanner.tsx`)

**Files:**
- Create: `src/components/CookieBanner.tsx`

Klijentska komponenta. Logika se oslanja na Task 1 (`parseConsent`, `consentParams`, `CONSENT_KEY`). Renderuje se iz `layout.tsx` (Task 3). Pošto je test env `node` (bez DOM-a), ovu komponentu testiramo ručno u browseru (vidi Task 6) — logika koja se može jedinično testirati je već u `consent.ts`.

- [ ] **Step 1: Write the component**

Create `src/components/CookieBanner.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CONSENT_KEY, type ConsentValue, consentParams, parseConsent } from "@/lib/consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (parseConsent(localStorage.getItem(CONSENT_KEY)) === null) {
        setVisible(true);
      }
    } catch {
      // localStorage nedostupan (npr. privatni režim) — ne prikazuj banner
    }
  }, []);

  function choose(value: ConsentValue) {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // ignoriši ako pisanje nije moguće
    }
    if (value === "granted") {
      window.gtag?.("consent", "update", consentParams("granted"));
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Saglasnost za kolačiće"
      className="fixed inset-x-0 bottom-0 z-50 bg-[#1a2332] text-gray-200 shadow-2xl"
    >
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-sm leading-relaxed flex-1">
          Koristimo kolačiće da bismo poboljšali tvoje iskustvo i razumeli kako se sajt koristi.
          Neophodni kolačići su uvek uključeni. Analitičke i marketinške kolačiće postavljamo samo
          uz tvoju saglasnost. Više u{" "}
          <Link href="/politika-privatnosti" className="underline text-[#4fb1d3] hover:text-white">
            politici privatnosti
          </Link>
          .
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="px-4 py-2 rounded-md border border-gray-500 text-sm hover:bg-gray-700 transition-colors"
          >
            Odbijam
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="px-4 py-2 rounded-md bg-[#4fb1d3] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Prihvatam
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles (typecheck/lint)**

Run: `npx tsc --noEmit && npm run lint`
Expected: bez grešaka vezanih za `CookieBanner.tsx`/`consent.ts`.

- [ ] **Step 3: Commit**

```bash
git branch --show-current
git add src/components/CookieBanner.tsx
git commit -m "feat(consent): cookie banner component (Prihvatam/Odbijam)"
```

---

### Task 3: Consent Mode v2 default + render banner (`src/app/layout.tsx`)

**Files:**
- Modify: `src/app/layout.tsx`

Dodajemo: (a) inline „consent default = denied" skript koji se izvršava PRE GTM-a (Consent Mode v2), sa pre-grant-om za povratne posetioce; (b) render `<CookieBanner />`.

- [ ] **Step 1: (Reference) Pročitaj Next 16 docs za next/script**

Run: `ls node_modules/next/dist/docs/ 2>/dev/null; grep -ril "beforeInteractive" node_modules/next/dist/docs/ 2>/dev/null | head`
Cilj: potvrditi da `strategy="beforeInteractive"` u root layout-u i dalje hoistuje skript u `<head>` pre ostalih. Ako je API promenjen, prilagoditi prema dokumentaciji (npr. inline `<script>` u layout-u).

- [ ] **Step 2: Dodaj import za CookieBanner**

U `src/app/layout.tsx`, posle linije `import Footer from "@/components/Footer";`:

```tsx
import CookieBanner from "@/components/CookieBanner";
```

- [ ] **Step 3: Dodaj consent-default skript PRE GTM-a**

U `src/app/layout.tsx`, odmah unutar `<body ...>` kao PRVI element (pre `<noscript>` GTM iframe-a), dodaj:

```tsx
<Script
  id="consent-default"
  strategy="beforeInteractive"
  dangerouslySetInnerHTML={{
    __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
});
try {
  if (localStorage.getItem('cookie-consent') === 'granted') {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
  }
} catch (e) {}`,
  }}
/>
```

- [ ] **Step 4: Renderuj banner**

U `src/app/layout.tsx`, odmah posle `<Footer />` (a pre `<Analytics />`):

```tsx
<CookieBanner />
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: build prolazi bez grešaka. (Ako `beforeInteractive` prijavi upozorenje da mora u root layout — već jeste u root layout-u, OK.)

- [ ] **Step 6: Commit**

```bash
git branch --show-current
git add src/app/layout.tsx
git commit -m "feat(consent): Consent Mode v2 default + render cookie banner"
```

---

### Task 4: Stranica politike privatnosti (`src/app/politika-privatnosti/page.tsx`)

**Files:**
- Create: `src/app/politika-privatnosti/page.tsx`

Server komponenta, „ti" forma, bez ćirilice. Sadržaj prilagođen sa starog WP-a + realni obrađivači novog sajta.

- [ ] **Step 1: Create the page**

Create `src/app/politika-privatnosti/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politika privatnosti — Hartweger",
  description:
    "Kako prikupljamo, koristimo i štitimo tvoje podatke na kurs.hartweger.rs, koje kolačiće koristimo i koja su tvoja prava.",
  alternates: { canonical: "/politika-privatnosti" },
  robots: { index: true, follow: true },
};

export default function PolitikaPrivatnosti() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12 prose prose-slate">
      <h1>Politika privatnosti</h1>
      <p>
        Tvoja privatnost nam je važna. Ova politika objašnjava koje podatke prikupljamo kada
        koristiš sajt kurs.hartweger.rs, zašto ih prikupljamo, sa kim ih delimo i koja su tvoja
        prava. Rukovalac podataka je Centar za nemački jezik Hartweger.
      </p>

      <h2>Koje podatke prikupljamo</h2>
      <ul>
        <li>
          <strong>Podaci o nalogu:</strong> ime, e-mail adresa i podaci o pristupu kursevima — kako
          bismo ti omogućili prijavu i praćenje napretka.
        </li>
        <li>
          <strong>Podaci o kupovini:</strong> podaci neophodni za obradu porudžbine i izdavanje
          računa.
        </li>
        <li>
          <strong>Tehnički podaci:</strong> anonimni podaci o korišćenju sajta (posete, učinak),
          radi poboljšanja sadržaja.
        </li>
      </ul>

      <h2>Kolačići</h2>
      <p>
        <strong>Neophodni kolačići</strong> omogućavaju prijavu i osnovno funkcionisanje sajta i
        uvek su uključeni. <strong>Analitičke i marketinške kolačiće</strong> (Google) postavljamo
        samo ako daš saglasnost preko obaveštenja o kolačićima. Saglasnost možeš da opozoveš u svako
        doba (vidi „Tvoja prava").
      </p>

      <h2>Sa kim delimo podatke (obrađivači)</h2>
      <ul>
        <li>
          <strong>Supabase</strong> — čuvanje naloga, autentikacija i sesija korisnika.
        </li>
        <li>
          <strong>Google (Google Analytics, Google Ads, Google Tag Manager)</strong> — analitika i
          oglašavanje. Aktivira se samo uz tvoju saglasnost.
        </li>
        <li>
          <strong>Vercel</strong> — hosting sajta i anonimna analitika učinka (bez kolačića).
        </li>
        <li>
          <strong>Resend</strong> — slanje transakcionih i informativnih e-mail poruka.
        </li>
      </ul>

      <h2>Koliko čuvamo podatke</h2>
      <p>
        Podatke čuvamo onoliko koliko je potrebno za pružanje usluge i ispunjavanje zakonskih
        obaveza. Kada više nisu potrebni, brišemo ih ili anonimizujemo.
      </p>

      <h2>Tvoja prava</h2>
      <p>
        Imaš pravo da zatražiš pristup svojim podacima, njihovu ispravku ili brisanje, kao i da
        opozoveš saglasnost za kolačiće. Saglasnost za kolačiće možeš da poništiš tako što obrišeš
        kolačiće i lokalne podatke sajta u podešavanjima pregledača, ili nas kontaktiraš. Za sve
        zahteve piši na{" "}
        <a href="mailto:info@hartweger.rs">info@hartweger.rs</a>.
      </p>

      <h2>Kontakt</h2>
      <p>
        Za sva pitanja o privatnosti i obradi podataka, obrati nam se na{" "}
        <a href="mailto:info@hartweger.rs">info@hartweger.rs</a>. Pogledaj i naše{" "}
        <Link href="/uslovi">uslove korišćenja</Link>.
      </p>
    </article>
  );
}
```

- [ ] **Step 2: Verify it renders**

Run: `npm run dev` pa otvori `http://localhost:3000/politika-privatnosti`
Expected: stranica se prikazuje sa svim sekcijama; nema 404/500. (Ako `prose` klase ne postoje u Tailwind v4 setup-u, ukloni `prose prose-slate` i zadrži semantičke tagove — provera: grep `prose` u postojećim stranicama.)

- [ ] **Step 3: Commit**

```bash
git branch --show-current
git add src/app/politika-privatnosti/page.tsx
git commit -m "feat(privacy): politika privatnosti stranica"
```

---

### Task 5: Link u footeru (`src/components/Footer.tsx`)

**Files:**
- Modify: `src/components/Footer.tsx`

- [ ] **Step 1: Dodaj link u „Dokumenti" listu**

U `src/components/Footer.tsx`, u `<ul>` ispod naslova „Dokumenti", između „Uslovi korišćenja" i „Kontakt", dodaj:

```tsx
<li><Link href="/politika-privatnosti" className="hover:text-white transition-colors">Politika privatnosti</Link></li>
```

Rezultat (taj `<ul>` blok):

```tsx
<ul className="space-y-2.5 text-sm mb-6">
  <li><Link href="/uslovi" className="hover:text-white transition-colors">Uslovi korišćenja</Link></li>
  <li><Link href="/politika-privatnosti" className="hover:text-white transition-colors">Politika privatnosti</Link></li>
  <li><Link href="/kontakt" className="hover:text-white transition-colors">Kontakt</Link></li>
</ul>
```

- [ ] **Step 2: Verify**

Run: `npm run dev` pa proveri footer — link „Politika privatnosti" vodi na `/politika-privatnosti`.
Expected: link vidljiv i radi.

- [ ] **Step 3: Commit**

```bash
git branch --show-current
git add src/components/Footer.tsx
git commit -m "feat(privacy): link na politiku privatnosti u footeru"
```

---

### Task 6: End-to-end verifikacija (ručno, browser)

**Files:** nijedan (samo provera).

- [ ] **Step 1: Pokreni sve testove i build**

Run: `npm test && npm run build`
Expected: svi testovi zeleni, build prolazi.

- [ ] **Step 2: Sveža poseta (bez prethodne saglasnosti)**

U browseru (incognito) otvori sajt. DevTools → Application → Cookies.
Expected: banner je vidljiv; NEMA `_ga` / `_gid` kolačića; u DevTools → Network/Console vidi se `consent default … denied`.

- [ ] **Step 3: Klik „Prihvatam"**

Expected: banner nestaje; pojave se `_ga`/`_ga_*` kolačići; `localStorage['cookie-consent'] === 'granted'`. Refresh → banner se NE pojavljuje, GA kolačići i dalje postoje.

- [ ] **Step 4: Klik „Odbijam" (novi incognito)**

Expected: banner nestaje; NEMA Google kolačića; `localStorage['cookie-consent'] === 'denied'`. Refresh → banner se NE pojavljuje, i dalje nema GA kolačića.

- [ ] **Step 5: Provera footer linka i stranice**

Expected: footer „Politika privatnosti" → `/politika-privatnosti` se otvara, sve sekcije prisutne.

- [ ] **Step 6: (Posle deploya, van ovog plana)**

`vercel --prod` → smoke test (hook) → provera CDN keša sa cache-busterom (memo: keš servira stari HTML). Opciono: Google Tag Assistant da potvrdi Consent Mode v2 default→update tok.

---

## Završne napomene

- **Vercel Analytics/Speed Insights** ostaju netaknuti (cookieless, već usklađeni).
- **Auth kolačići (Supabase)** se ne diraju (neophodni).
- Ako se kasnije poželi: isti banner/politika mogu se preneti na stari WP (van obima; WP se ionako gasi).
