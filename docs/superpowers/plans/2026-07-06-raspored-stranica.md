# /raspored stranica — Implementation Plan (v2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nova javna stranica `/raspored` (živi podaci iz Supabase) + cene i checkout linkovi IZ BAZE kurseva na obe javne stranice (popravlja živi 404 bag na „Prijavi se") + puni nazivi dana + redirect stare WP adrese.

**Architecture:** `fetchRaspored()` uz grupe čita i kupovne grupne kurseve i razrešava kurs po grupi (`purchasable_course_id`, fallback po nivou preko `SLUG_TO_NIVO`). `GrupaRaspored` nosi `daniPuni`, `checkoutSlug`, `cena`, `cenaEur`. Nova client komponenta `RasporedKartice` na `/raspored`; postojeća `RasporedGrupa` prelazi na ista polja. Zajedničke display konstante u `src/lib/raspored-prikaz.ts`.

**Tech Stack:** Next.js 16 (App Router — pre pisanja pogledaj `node_modules/next/dist/docs/` po AGENTS.md), Tailwind (custom klase `plava`/`koral`/`font-montserrat`), vitest, Supabase (service-role u `fetchRaspored`).

**Spec:** `docs/superpowers/specs/2026-07-06-raspored-stranica-design.md`

**Pravila repoa:** grana `main` (proveri `git branch --show-current` pre commita). U radnom stablu postoje NEPOVEZANE izmene (`src/lib/exercise-kind.ts`, `scripts/send-aktivacija-reminder-3-resume.ts`) — NE dodavati ih u commite; `git add` uvek sa eksplicitnim putanjama.

---

### Task 1: Puni nazivi dana + razrešavanje kupovnog kursa (lib)

**Files:**
- Modify: `src/lib/groups.ts`
- Modify: `src/lib/raspored.ts` (interfejs `GrupaRaspored`)
- Test: `src/lib/groups.test.ts`

- [ ] **Step 1: Napiši failing testove**

U `src/lib/groups.test.ts` proširi import (linija 2) sa `formatDaysFull` i `resolveGroupCourse`, pa dodaj na kraj fajla:

```ts
describe("formatDaysFull", () => {
  it("puni nazivi dana, veliko početno slovo", () => {
    expect(formatDaysFull([2, 4])).toBe("Utorak, Četvrtak");
    expect(formatDaysFull([1, 3, 5])).toBe("Ponedeljak, Sreda, Petak");
  });
  it("prazno za null/prazan niz, preskače nepoznat broj", () => {
    expect(formatDaysFull(null)).toBe("");
    expect(formatDaysFull([])).toBe("");
    expect(formatDaysFull([9])).toBe("");
  });
});

describe("resolveGroupCourse", () => {
  const courses = [
    { id: "c1", slug: "grupni-kurs-nemackog-jezika-a1-1", price: "19600.00", paypal_price_eur: 168 },
    { id: "c2", slug: "grupni-kurs-b2-1", price: "21200.00", paypal_price_eur: 181 },
  ];
  it("po purchasable_course_id kad postoji", () => {
    expect(resolveGroupCourse({ level: "B2.1", purchasable_course_id: "c1" }, courses)?.id).toBe("c1");
  });
  it("fallback po nivou preko SLUG_TO_NIVO", () => {
    expect(resolveGroupCourse({ level: "A1.1", purchasable_course_id: null }, courses)?.id).toBe("c1");
    expect(resolveGroupCourse({ level: "B2.1", purchasable_course_id: null }, courses)?.id).toBe("c2");
  });
  it("null kad nema pogotka", () => {
    expect(resolveGroupCourse({ level: "C1.1", purchasable_course_id: null }, courses)).toBeNull();
  });
});

describe("mapGroupToRaspored nova polja", () => {
  const row = {
    level: "A1.1", status: "otvoren", start_date: "2026-09-01",
    duration_weeks: 7, days: [2, 4], session_time: "17:00-18:00",
    max_seats: 6, manual_enrolled: 1,
  };
  it("daniPuni + podaci kursa iz baze", () => {
    const r = mapGroupToRaspored(row, "Suzana Marjanović", 1, {
      id: "c1", slug: "grupni-kurs-nemackog-jezika-a1-1", price: "19600.00", paypal_price_eur: 168,
    });
    expect(r.dani).toBe("uto, čet");
    expect(r.daniPuni).toBe("Utorak, Četvrtak");
    expect(r.checkoutSlug).toBe("grupni-kurs-nemackog-jezika-a1-1");
    expect(r.cena).toBe(19600);
    expect(r.cenaEur).toBe(168);
  });
  it("bez kursa: null polja, ostalo radi", () => {
    const r = mapGroupToRaspored(row, "Suzana", 1);
    expect(r.checkoutSlug).toBeNull();
    expect(r.cena).toBeNull();
    expect(r.cenaEur).toBeNull();
  });
});
```

- [ ] **Step 2: Pokreni test — mora da PADNE**

Run: `npx vitest run src/lib/groups.test.ts`
Expected: FAIL — `formatDaysFull`/`resolveGroupCourse` nisu eksportovani.

- [ ] **Step 3: Implementacija u `src/lib/groups.ts`**

Na vrh fajla dodaj import:

```ts
import { nivoForSlug } from "@/lib/course-nivo";
```

Ispod postojećeg `formatDays` bloka:

```ts
export const DAY_LABELS_FULL: Record<number, string> = {
  1: "Ponedeljak", 2: "Utorak", 3: "Sreda", 4: "Četvrtak",
  5: "Petak", 6: "Subota", 7: "Nedelja",
};

export function formatDaysFull(days: number[] | null): string {
  if (!days || !days.length) return "";
  return days.map((d) => DAY_LABELS_FULL[d] ?? "").filter(Boolean).join(", ");
}

export interface PurchasableCourseLite {
  id: string;
  slug: string;
  price: string | number | null;      // numeric iz PostgREST-a stiže kao string
  paypal_price_eur: number | null;
}

/**
 * Kupovni kurs za grupu: prvo direktna veza (purchasable_course_id),
 * fallback po nivou preko SLUG_TO_NIVO (isti obrazac kao fillGroupCourseIds
 * u finansijama - grupe iz Sheet migracije nemaju popunjenu vezu).
 */
export function resolveGroupCourse(
  g: { level: string; purchasable_course_id: string | null },
  courses: PurchasableCourseLite[],
): PurchasableCourseLite | null {
  if (g.purchasable_course_id) {
    const byId = courses.find((c) => c.id === g.purchasable_course_id);
    if (byId) return byId;
  }
  return courses.find((c) => nivoForSlug(c.slug) === g.level) ?? null;
}
```

U `mapGroupToRaspored` dodaj 4. opcioni parametar i nova polja:

```ts
export function mapGroupToRaspored(
  g: GroupRowForDisplay,
  profName: string,
  activeEnrollments: number,
  course?: PurchasableCourseLite | null,
): GrupaRaspored {
  const seats = computeSeats({ maxSeats: g.max_seats, manualEnrolled: g.manual_enrolled, activeEnrollments });
  return {
    nivo: g.level,
    prof: profName,
    status: STATUS_LABEL[g.status] ?? g.status,
    pocetak: formatPocetak(g.start_date),
    trajanje: g.duration_weeks != null ? String(g.duration_weeks) : "",
    dani: formatDays(g.days),
    daniPuni: formatDaysFull(g.days),
    sat: g.session_time ?? "",
    maks: String(g.max_seats),
    upisanih: String(seats.enrolled),
    slobodnih: String(seats.slobodnih),
    full: seats.full,
    checkoutSlug: course?.slug ?? null,
    cena: course?.price != null ? Number(course.price) : null,
    cenaEur: course?.paypal_price_eur ?? null,
  };
}
```

U `src/lib/raspored.ts` u interfejs `GrupaRaspored` dodaj:

```ts
  daniPuni: string;
  checkoutSlug: string | null;
  cena: number | null;
  cenaEur: number | null;
```

- [ ] **Step 4: Testovi prolaze**

Run: `npx vitest run src/lib/groups.test.ts`
Expected: PASS (svi, uključujući postojeće).

- [ ] **Step 5: Commit**

```bash
git add src/lib/groups.ts src/lib/raspored.ts src/lib/groups.test.ts
git commit -m "feat: puni dani + kupovni kurs (cena/slug iz baze) u rasporedu grupa"
```

---

### Task 2: `fetchRaspored()` čita kupovne kurseve

**Files:**
- Modify: `src/lib/raspored.ts` (`fetchRaspored`)

- [ ] **Step 1: Proširi upit grupa i dodaj upit kurseva**

U `fetchRaspored()`:

1. U select grupa dodaj `purchasable_course_id` (posle `manual_enrolled`):

```ts
    .select(
      "id, level, status, start_date, duration_weeks, days, session_time, max_seats, manual_enrolled, purchasable_course_id, professor:professor_id(full_name)",
    )
```

2. Posle upita `group_enrollments` dodaj ODVOJEN upit kurseva (ne embed — groups→courses veza se ne sme oslanjati na PostgREST FK embed, isti oprez kao kod course_access):

```ts
  // Kupovni grupni kursevi - cena i checkout slug idu iz baze, ne iz koda.
  const { data: courses } = await admin
    .from("courses")
    .select("id, slug, price, paypal_price_eur")
    .eq("is_purchasable", true)
    .eq("is_published", true)
    .like("slug", "grupni%");
```

3. U map na kraju prosledi razrešeni kurs (import `resolveGroupCourse` iz `@/lib/groups` — dodaj u postojeći import):

```ts
  const rows = ordered.map((g) => {
    const prof = Array.isArray(g.professor) ? g.professor[0] : g.professor;
    const activeEnrollments = counts[g.id] || 0;
    const course = resolveGroupCourse(g, courses ?? []);
    return mapGroupToRaspored(g, prof?.full_name || "", activeEnrollments, course);
  });
```

- [ ] **Step 2: Tipovi prolaze**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add src/lib/raspored.ts
git commit -m "feat: fetchRaspored razrešava kupovni kurs po grupi"
```

---

### Task 3: Zajednički modul `raspored-prikaz.ts` + fix `RasporedGrupa`

**Files:**
- Create: `src/lib/raspored-prikaz.ts`
- Create: `src/lib/raspored-prikaz.test.ts`
- Modify: `src/components/RasporedGrupa.tsx`

- [ ] **Step 1: Napiši failing test**

Create `src/lib/raspored-prikaz.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { LEVEL_ORDER, formatPrice, getNivoKey, nivoColors } from "./raspored-prikaz";

describe("raspored-prikaz", () => {
  it("getNivoKey vadi nivo iz oznake grupe", () => {
    expect(getNivoKey("A1.1")).toBe("A1");
    expect(getNivoKey("b2.2")).toBe("B2");
  });
  it("formatPrice koristi tačku kao separator hiljada", () => {
    expect(formatPrice(19600)).toBe("19.600");
  });
  it("boja definisana za svaki CEFR nivo", () => {
    LEVEL_ORDER.forEach((l) => expect(nivoColors[l]).toBeDefined());
  });
});
```

- [ ] **Step 2: Pokreni test — mora da PADNE**

Run: `npx vitest run src/lib/raspored-prikaz.test.ts`
Expected: FAIL — modul ne postoji.

- [ ] **Step 3: Implementacija**

Create `src/lib/raspored-prikaz.ts` (boje IDENTIČNE onima iz `RasporedGrupa.tsx:7-13`; cene se NE sele ovde — dolaze iz baze):

```ts
// Zajedničke display konstante za raspored grupa.
// Koriste ih RasporedGrupa (/grupni-kursevi) i RasporedKartice (/raspored).
// Cene NISU ovde - dolaze iz baze kurseva (GrupaRaspored.cena/cenaEur).

export const nivoColors: Record<string, { bg: string; text: string }> = {
  A1: { bg: "#e0f6fb", text: "#0776a0" },
  A2: { bg: "#d6f0f9", text: "#065e88" },
  B1: { bg: "#fef3e2", text: "#7a4800" },
  B2: { bg: "#fde8e8", text: "#b52a2a" },
  C1: { bg: "#fde4f0", text: "#952060" },
};

export const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1"];

// Fallback za ~€ prikaz kad kurs nema paypal_price_eur.
export const EUR_RATE = 117;

export function getNivoKey(nivo: string): string {
  // "A1.1" → "A1", "b2.2" → "B2"
  return nivo.substring(0, 2).toUpperCase();
}

export function formatPrice(price: number): string {
  return price.toLocaleString("de-DE");
}
```

- [ ] **Step 4: Test prolazi**

Run: `npx vitest run src/lib/raspored-prikaz.test.ts`
Expected: PASS.

- [ ] **Step 5: Prepravi `RasporedGrupa.tsx`**

U `src/components/RasporedGrupa.tsx`:

1. Obriši lokalne definicije `nivoColors`, `nivoPrices`, `LEVEL_ORDER`, `formatPrice`, `getNivoKey` (linije 7–32) i dodaj import:

```ts
import {
  EUR_RATE,
  LEVEL_ORDER,
  formatPrice,
  getNivoKey,
  nivoColors,
} from "@/lib/raspored-prikaz";
```

2. U telu map-a zameni izračunavanje cene (linije ~91-92):

```ts
const price = nivoPrices[nivoKey] ?? 19600;
const eurPrice = Math.round(price / 117);
```

sa:

```ts
const eurPrice = g.cenaEur ?? (g.cena != null ? Math.round(g.cena / EUR_RATE) : null);
```

3. Prikaz dana (linija ~129) — zameni `{g.dani}, {g.sat}` sa `{g.daniPuni}, {g.sat}`.

4. Blok cene (linije ~149-154) zameni sa:

```tsx
{g.cena != null && (
  <div className="border-t border-gray-100 pt-4 mb-4">
    <p className="text-xl font-bold text-gray-900">{formatPrice(g.cena)} din</p>
    {eurPrice != null && <p className="text-xs text-gray-500">~ {eurPrice}€</p>}
  </div>
)}
```

5. CTA (linije ~157-171): umesto `href={`/kupovina/grupni-${nivoKey.toLowerCase()}`}` koristi checkout slug iz baze; bez sluga vodi na kontakt:

```tsx
{isFull ? (
  <button
    disabled
    className="w-full text-center bg-gray-200 text-gray-500 font-bold py-3 px-6 rounded-xl cursor-not-allowed"
  >
    Popunjeno
  </button>
) : g.checkoutSlug ? (
  <Link
    href={`/kupovina/${g.checkoutSlug}`}
    className="block w-full text-center bg-koral hover:bg-koral-dark text-white font-bold py-3 px-6 rounded-xl transition-colors"
  >
    Prijavi se
  </Link>
) : (
  <Link
    href="/kontakt"
    className="block w-full text-center bg-koral hover:bg-koral-dark text-white font-bold py-3 px-6 rounded-xl transition-colors"
  >
    Javi nam se
  </Link>
)}
```

- [ ] **Step 6: Svi testovi + build prolaze**

Run: `npm run test && npm run build`
Expected: vitest PASS, build bez grešaka.

- [ ] **Step 7: Commit**

```bash
git add src/lib/raspored-prikaz.ts src/lib/raspored-prikaz.test.ts src/components/RasporedGrupa.tsx
git commit -m "fix: cena i checkout link iz baze na /grupni-kursevi (404 na Prijavi se) + puni dani"
```

---

### Task 4: Nova komponenta `RasporedKartice`

**Files:**
- Create: `src/components/RasporedKartice.tsx`

Client komponenta (filter drži state). Poslovna logika identična `RasporedGrupa`; novi vizuelni jezik: bočna traka u boji nivoa, ikonice, tačkice za popunjenost.

- [ ] **Step 1: Napiši komponentu**

Create `src/components/RasporedKartice.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import type { GrupaRaspored } from "@/lib/raspored";
import {
  EUR_RATE,
  LEVEL_ORDER,
  formatPrice,
  getNivoKey,
  nivoColors,
} from "@/lib/raspored-prikaz";

export default function RasporedKartice({
  grupe: grupeProp,
}: {
  grupe: GrupaRaspored[];
}) {
  const [level, setLevel] = useState<string>("sve");

  // Samo CEFR nivoi - posebni kursevi (npr. "Konverzacija B1+") imaju svoju
  // stranicu/checkout (isti filter kao RasporedGrupa).
  const grupe = grupeProp.filter((g) => LEVEL_ORDER.includes(getNivoKey(g.nivo)));

  if (grupe.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        Trenutno nema otvorenih grupa. Proveri ponovo uskoro.
      </p>
    );
  }

  const available = LEVEL_ORDER.filter((l) =>
    grupe.some((g) => getNivoKey(g.nivo) === l)
  );
  const filtered =
    level === "sve" ? grupe : grupe.filter((g) => getNivoKey(g.nivo) === level);

  const chip = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
      active
        ? "bg-plava text-white shadow-sm"
        : "bg-white border border-gray-200 text-gray-600 hover:border-plava hover:text-plava"
    }`;

  return (
    <>
      {/* Filter po nivou */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <button onClick={() => setLevel("sve")} className={chip(level === "sve")}>
          Svi nivoi
        </button>
        {available.map((l) => (
          <button key={l} onClick={() => setLevel(l)} className={chip(level === l)}>
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Trenutno nema termina za ovaj nivo. Probaj drugi nivo ili nas kontaktiraj.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {filtered.map((g, i) => (
            <Kartica key={i} g={g} />
          ))}
        </div>
      )}
    </>
  );
}

function Kartica({ g }: { g: GrupaRaspored }) {
  const nivoKey = getNivoKey(g.nivo);
  const colors = nivoColors[nivoKey] ?? { bg: "#f3f4f6", text: "#374151" };
  const eurPrice = g.cenaEur ?? (g.cena != null ? Math.round(g.cena / EUR_RATE) : null);
  const maks = parseInt(g.maks, 10) || 0;
  const upisanih = parseInt(g.upisanih, 10) || 0;
  const isOpen = g.status?.toLowerCase().includes("otvoren");

  return (
    <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all">
      {/* Bočna traka u boji nivoa */}
      <div
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: colors.text }}
        aria-hidden
      />

      <div className="p-5 pl-7 md:p-6 md:pl-8">
        {/* Nivo + status */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <span
            className="px-3.5 py-1.5 rounded-full text-base font-montserrat font-bold"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {g.nivo}
          </span>
          {g.full ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
              Popunjeno
            </span>
          ) : isOpen ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
              Otvoren za upis
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
              Uskoro
            </span>
          )}
        </div>

        {/* Termini */}
        <div className="space-y-2.5 text-sm text-gray-700 mb-5">
          <div className="flex items-start gap-2.5">
            <IkonicaKalendar />
            <p>
              <span className="font-semibold text-gray-900">{g.daniPuni}</span>
              {g.sat && <span className="text-gray-500"> · {g.sat}</span>}
            </p>
          </div>
          {g.pocetak && (
            <div className="flex items-start gap-2.5">
              <IkonicaSat />
              <p>
                Početak <span className="font-semibold text-gray-900">{g.pocetak}</span>
                {g.trajanje && (
                  <span className="text-gray-500"> · {g.trajanje} nedelja</span>
                )}
              </p>
            </div>
          )}
          {g.prof && (
            <div className="flex items-start gap-2.5">
              <IkonicaOsoba />
              <p>Profesorka {g.prof}</p>
            </div>
          )}
        </div>

        {/* Popunjenost */}
        <div className="flex items-center gap-2.5 mb-5">
          {maks > 0 && maks <= 10 && (
            <div className="flex gap-1" aria-hidden>
              {Array.from({ length: maks }, (_, idx) => (
                <span
                  key={idx}
                  className={`w-2.5 h-2.5 rounded-full ${
                    idx < upisanih ? "bg-plava" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          )}
          <span className="text-xs text-gray-500">
            {g.full
              ? "Sva mesta popunjena"
              : `${g.slobodnih} od ${g.maks} mesta slobodno`}
          </span>
        </div>

        {/* Cena + CTA */}
        <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
          <div>
            {g.cena != null && (
              <p className="text-xl font-montserrat font-bold text-gray-900">
                {formatPrice(g.cena)} din
              </p>
            )}
            {eurPrice != null && <p className="text-xs text-gray-500">~ {eurPrice}€</p>}
          </div>
          {g.full ? (
            <button
              disabled
              className="bg-gray-200 text-gray-500 font-bold py-3 px-6 rounded-xl cursor-not-allowed"
            >
              Popunjeno
            </button>
          ) : g.checkoutSlug ? (
            <Link
              href={`/kupovina/${g.checkoutSlug}`}
              className="bg-koral hover:bg-koral-dark text-white font-bold py-3 px-6 rounded-xl transition-colors whitespace-nowrap"
            >
              Prijavi se
            </Link>
          ) : (
            <Link
              href="/kontakt"
              className="bg-koral hover:bg-koral-dark text-white font-bold py-3 px-6 rounded-xl transition-colors whitespace-nowrap"
            >
              Javi nam se
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function IkonicaKalendar() {
  return (
    <svg className="w-4 h-4 mt-0.5 text-plava flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v9.75" />
    </svg>
  );
}

function IkonicaSat() {
  return (
    <svg className="w-4 h-4 mt-0.5 text-plava flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function IkonicaOsoba() {
  return (
    <svg className="w-4 h-4 mt-0.5 text-plava flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}
```

- [ ] **Step 2: Tipovi prolaze**

Run: `npx tsc --noEmit`
Expected: bez grešaka (komponenta se još nigde ne koristi — to je ok).

- [ ] **Step 3: Commit**

```bash
git add src/components/RasporedKartice.tsx
git commit -m "feat: RasporedKartice - nova kartica rasporeda grupa"
```

---

### Task 5: Stranica `/raspored`

**Files:**
- Create: `src/app/raspored/page.tsx`

- [ ] **Step 1: Napiši stranicu**

Create `src/app/raspored/page.tsx` (isti obrazac kao `src/app/grupni-kursevi/page.tsx` — server komponenta, root layout već daje navigaciju i footer):

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { fetchRaspored } from "@/lib/raspored";
import RasporedKartice from "@/components/RasporedKartice";

export const metadata: Metadata = {
  title: "Raspored grupnih kurseva - Hartweger",
  description:
    "Termini grupnih kurseva nemačkog jezika - dva časa nedeljno u malim grupama od 3 do 6 polaznika. Pogledaj raspored i prijavi se online.",
  openGraph: {
    images: [{ url: "/og/share.png", width: 1200, height: 630, alt: "Hartweger - Škola nemačkog jezika" }],
    title: "Raspored grupnih kurseva - Hartweger",
    description:
      "Termini grupnih kurseva nemačkog jezika - dva časa nedeljno u malim grupama od 3 do 6 polaznika.",
  },
};

export default async function RasporedPage() {
  const grupe = await fetchRaspored();

  return (
    <div>
      {/* Hero + raspored */}
      <section className="py-14 md:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-montserrat font-bold text-gray-900 text-center">
            Raspored grupnih kurseva
          </h1>
          <p className="text-gray-600 text-center mt-3 max-w-xl mx-auto">
            Dva časa nedeljno u malim grupama od 3 do 6 polaznika.
          </p>
          <div className="mt-10">
            <RasporedKartice grupe={grupe} />
          </div>
        </div>
      </section>

      {/* Test nivoa CTA */}
      <section className="pb-16 px-4">
        <div className="max-w-4xl mx-auto bg-plava-light rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-montserrat font-bold text-gray-900">Ne znaš koji nivo?</h2>
            <p className="text-gray-600 mt-1">Uradi besplatno testiranje i saznaj za 10 minuta.</p>
          </div>
          <Link
            href="/besplatno-testiranje"
            className="bg-plava hover:bg-plava-dark text-white font-bold py-3 px-8 rounded-xl transition-colors whitespace-nowrap"
          >
            Besplatno testiranje
          </Link>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Build prolazi**

Run: `npm run build`
Expected: ruta `/raspored` u build izlazu, bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add src/app/raspored/page.tsx
git commit -m "feat: javna /raspored stranica"
```

---

### Task 6: Redirect, sitemap, footer + backfill baze

**Files:**
- Modify: `next.config.ts:72`
- Modify: `src/app/sitemap.ts` (niz `staticPages`)
- Modify: `src/components/Footer.tsx:24`
- DB: jednokratan UPDATE `groups.purchasable_course_id`

- [ ] **Step 1: Redirect stare adrese**

U `next.config.ts` liniju:

```ts
{ source: "/raspored-grupnih-kurseva", destination: "/grupni-kursevi", permanent: true },
```

zameni sa:

```ts
{ source: "/raspored-grupnih-kurseva", destination: "/raspored", permanent: true },
```

- [ ] **Step 2: Sitemap**

U `src/app/sitemap.ts` u `staticPages`, odmah ispod reda za `grupni-kursevi`, dodaj:

```ts
    { url: "https://www.hartweger.rs/raspored", lastModified: now, changeFrequency: "weekly", priority: 0.8 },
```

- [ ] **Step 3: Footer link**

U `src/components/Footer.tsx`, odmah ispod `<li>` za „Grupni kursevi" (linija 24), dodaj:

```tsx
              <li><Link href="/raspored" className="hover:text-white transition-colors">Raspored grupa</Link></li>
```

- [ ] **Step 4: Backfill `purchasable_course_id`**

Supabase MCP `execute_sql` (projekat `rzmyglynjcygsbicssbt`) — popuni vezu za grupe bez nje, po istoj SLUG_TO_NIVO mapi (uraditi preko VALUES liste, ne pattern-matchingom):

```sql
update groups g
set purchasable_course_id = c.id
from (values
  ('A1.1','grupni-kurs-nemackog-jezika-a1-1'),
  ('A1.2','grupni-kurs-nemackog-jezika-a1-2-2'),
  ('A2.1','grupni-kurs-nemackog-jezika-a2'),
  ('A2.2','grupni-kurs-nemackog-jezika-a2-2'),
  ('B1.1','grupni-kurs-nemackog-jezika-b1-1-2'),
  ('B1.2','grupni-kurs-nemackog-b1-2'),
  ('B2.1','grupni-kurs-b2-1'),
  ('B2.2','grupni-kurs-b2-2'),
  ('C1.1','grupni-kurs-c1-1'),
  ('C1.2','grupni-kurs-c1-2')
) m(level, slug)
join courses c on c.slug = m.slug
where g.purchasable_course_id is null and g.level = m.level;
```

Zatim proveri: `select level, status, purchasable_course_id from groups where status in ('otvoren','uskoro');` — sve popunjeno.

- [ ] **Step 5: Build prolazi**

Run: `npm run build`
Expected: bez grešaka.

- [ ] **Step 6: Commit**

```bash
git add next.config.ts src/app/sitemap.ts src/components/Footer.tsx
git commit -m "feat: /raspored u redirect/sitemap/footer"
```

---

### Task 7: Lokalna vizuelna provera (checkpoint pre deploya)

**Files:** nema izmena — samo provera.

- [ ] **Step 1: Pokreni dev server i pregledaj**

Pokreni dev server (preview tool ili `npm run dev`) i proveri na `http://localhost:3000/raspored`:
- kartice prikazuju dane PUNIM rečima („Utorak, Četvrtak"), vreme, početak, trajanje „X nedelja", profesorku, tačkice popunjenosti;
- cena i € su vrednosti IZ BAZE (19.600/168 za A1-B1, 21.200/181 za B2/C1);
- „Prijavi se" vodi na `/kupovina/grupni-kurs-nemackog-jezika-a1-2-2` i sl. (pravi slugovi) i te stranice se OTVARAJU (200);
- filter čipovi rade; `http://localhost:3000/grupni-kursevi` — dani puni, cene iz baze, linkovi rade;
- mobilni viewport 375px: jedna kolona, ništa ne curi horizontalno.

- [ ] **Step 2: Screenshot Nataši na pregled (desktop + mobile) i sačekaj potvrdu pre deploya**

---

### Task 8: Deploy + smoke test

- [ ] **Step 1: Provera grane i čistoće commita**

Run: `git branch --show-current && git log origin/main..HEAD --oneline && git status --short`
Expected: `main`; u logu samo commiti iz ovog plana + spec; nepovezani fajlovi i dalje nekomitovani.

- [ ] **Step 2: Deploy**

Run: `vercel --prod` (iz `/Users/natasahartweger/Documents/Claude/sajt/LMS/lms`; PostToolUse hook radi smoke test automatski)

- [ ] **Step 3: Ručni smoke**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://www.hartweger.rs/raspored?cb=$(date +%s)"
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://www.hartweger.rs/raspored-grupnih-kurseva?cb=$(date +%s)"
# checkout linkovi sa live stranice - svi moraju biti 200:
curl -s "https://www.hartweger.rs/grupni-kursevi?cb=$(date +%s)" | grep -o 'href="/kupovina/[^"]*"' | sort -u
```

Expected: `200`; `308` (ili 301) na `/raspored`; hrefs su pravi slugovi (`grupni-kurs-…`) i svaki vraća 200. Plus vizuelno: produkcijski `/raspored` prikazuje grupe sa cenama iz baze.

- [ ] **Step 4: Push na origin**

```bash
git push origin main
```
