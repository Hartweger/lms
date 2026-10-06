# Produženje pristupa polunivou - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Novi proizvod „Produženje pristupa" za JEDAN sadržajni polunivo - 2.900 din, godinu dana - dostupan svima uključujući grupne i individualne polaznike, koji do sada nisu imali nijedan samoposlužni put za produženje pristupa.

**Architecture:** Nema novog toka plaćanja. Produženje je običan kupovni proizvod (`courses.category='produzenje'`, `is_purchasable=true`, `is_published=false`) koji preko `course_unlocks` otključava tačno jedan sadržajni polunivo. Postojeći checkout, `grant-access.ts`, fiskalizacija i mejlovi rade nepromenjeni - `grant-access.ts` već produžava postojeći `course_access` red i nikad ga ne skraćuje. Nov kod je samo: 8 redova u bazi, kapija da OBNOVI50 ne može na produženje, dugme u „Moj nalog" i dugme u mejlu o isteku.

**Tech Stack:** Next.js (App Router, verzija u repou - vidi `AGENTS.md`), TypeScript, Supabase (Postgres), vitest, Tailwind.

**Repo:** `/Users/natasahartweger/Documents/Claude/sajt/LMS/lms`

---

## Poslovni kontekst (zašto, da se ne izgubi)

- Obnova kuponom **OBNOVI50** kupuje **ceo nivo** za pola cene: `video-kurs-a1` 11.600 → 5.800, otključava i `nemacki-a1-1` i `nemacki-a1-2`.
- Grupni i individualni polaznici plaćaju **polunivo** (grupni 19.600, individualni 23.000-37.000). Zato im je OBNOVI50 zatvoren od 04.08.2026 (`src/lib/renewal-eligibility.ts`): sa −50 % bi za 5.800 dobili i polunivo koji nikad nisu platili.
- Posledica: mejl o isteku im ide bez ijednog dugmeta, samo „Javi nam se" - i produženje se rešava ručno po mejlu.
- **Cena 2.900 je jedina bez arbitraže:** 2 × 2.900 = 5.800 = OBNOVI50 na ceo nivo. Niže bi podlokalo OBNOVI50 (dva produženja jeftinija od obnove nivoa), više bi učinilo produženje besmislenim.
- Odluke Natašine (30.09.2026): cena 2.900 ✓, dostupno **svima** uključujući sinhroni istek ✓, grupni i individualni **smeju** ✓, **nema novog kupona** - OBNOVI50 se ne dira, samo se blokira na novoj kategoriji ✓.
- Veličina publike (presek 30.09.2026, 675 polaznika / 1.038 parova polaznik+nivo): 206 parova ima samo jedan polunivo nivoa (177 ističe u 12 meseci), 45 parova ima asimetričan istek > 60 dana (32 u 12 meseci). Ukupno **~209 slučajeva u 12 meseci**.

## Poznato ponašanje koje NE menjamo (YAGNI)

`grant-access.ts` postavlja `expiresAt = danas + 1 godina`, a postojeći red produžava samo ako je stari istek **manji** od novog. Ko kupi produženje 30 dana pre isteka izgubi tih do 30 dana (novi istek je godina od danas, ne godina od starog isteka). **Isto važi i danas za OBNOVI50** - ponašanje je dosledno, ne dira se u ovom poslu.

---

## File Structure

**Novi fajlovi:**

| Fajl | Odgovornost |
|---|---|
| `src/lib/produzenje.ts` | Čista logika: prefiks slug-a, cena, prozor, mapiranje sadržajni polunivo → proizvod, kapija za kupon. Bez I/O. |
| `src/lib/produzenje.test.ts` | Testovi za sve gore. |
| `supabase/migrations/109_produzenje_polunivoa.sql` | 8 proizvoda + 8 `course_unlocks` redova. |

**Menjani fajlovi:**

| Fajl | Izmena |
|---|---|
| `src/lib/finansije.ts` | Nova `Kategorija` „produzenje" da prihod ne upada u „Video kursevi". |
| `src/lib/finansije.test.ts` | Test za novo mapiranje. |
| `src/app/admin/finansije/FinansijeClient.tsx` | Nova kategorija u prikazu. |
| `src/app/api/coupons/validate/route.ts` | Kapija: renewal_only kupon ne prolazi na produženje. |
| `src/app/api/orders/route.ts` | Ista kapija, autoritativno. |
| `src/app/nalog/page.tsx` | Dugme „Produži pristup - 2.900 din". |
| `src/lib/email.ts` | `ExpiryReminderItem.produzenjeSlug` + dugme u verziji bez kupona. |
| `src/lib/expiry-reminder-content.test.ts` | Testovi za novo dugme. |
| `src/app/api/cron/expiry-reminder/route.ts` | Prosleđuje `produzenjeSlug`. |

---

## Task 1: Čista logika produženja (`src/lib/produzenje.ts`)

**Files:**
- Create: `src/lib/produzenje.ts`
- Test: `src/lib/produzenje.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/produzenje.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  PRODUZENJE_PREFIX,
  PRODUZENJE_CENA,
  produzenjeSlugFor,
  isProduzenjeSlug,
  couponAllowedOnProduzenje,
  produzenjeUProzoru,
} from "./produzenje";

describe("produzenjeSlugFor", () => {
  it("mapira svih 8 sadržajnih polunivoa na proizvod za produženje", () => {
    for (const nivo of ["a1", "a2", "b1", "b2"]) {
      for (const pod of ["1", "2"]) {
        const content = `nemacki-${nivo}-${pod}`;
        expect(produzenjeSlugFor(content)).toBe(`${PRODUZENJE_PREFIX}${content}`);
      }
    }
  });

  it("ne mapira sadržaj koji nije CEFR polunivo", () => {
    expect(produzenjeSlugFor("kurs-konverzacije")).toBeNull();
    expect(produzenjeSlugFor("konverzacijski-b1-sadrzaj")).toBeNull();
    expect(produzenjeSlugFor("fsp")).toBeNull();
    expect(produzenjeSlugFor("nemacki-c1-1")).toBeNull();
    expect(produzenjeSlugFor("")).toBeNull();
  });

  it("ne mapira proizvode, samo sadržaj", () => {
    expect(produzenjeSlugFor("video-kurs-a1")).toBeNull();
    expect(produzenjeSlugFor("grupni-kurs-nemackog-jezika-a1-1")).toBeNull();
  });
});

describe("isProduzenjeSlug", () => {
  it("prepoznaje proizvod za produženje", () => {
    expect(isProduzenjeSlug("produzenje-nemacki-a1-1")).toBe(true);
  });

  it("ne prepoznaje ostale proizvode", () => {
    expect(isProduzenjeSlug("video-kurs-a1")).toBe(false);
    expect(isProduzenjeSlug("nemacki-a1-1")).toBe(false);
    expect(isProduzenjeSlug("")).toBe(false);
  });
});

describe("couponAllowedOnProduzenje", () => {
  it("renewal_only kupon NE sme na produženje - 2.900 je već puna cena", () => {
    expect(couponAllowedOnProduzenje(true, "produzenje-nemacki-a1-1")).toBe(false);
  });

  it("renewal_only kupon sme na video kurs (obnova celog nivoa)", () => {
    expect(couponAllowedOnProduzenje(true, "video-kurs-a1")).toBe(true);
  });

  it("obican kupon nije pogođen ovom kapijom", () => {
    expect(couponAllowedOnProduzenje(false, "produzenje-nemacki-a1-1")).toBe(true);
  });
});

describe("produzenjeUProzoru", () => {
  const now = new Date("2026-09-30T12:00:00Z");

  it("nudi se 30 dana pre isteka", () => {
    expect(produzenjeUProzoru("2026-10-10T08:52:44Z", now)).toBe(true);
    expect(produzenjeUProzoru("2026-10-30T12:00:00Z", now)).toBe(true);
  });

  it("ne nudi se pre prozora - Tanjin A1.2 traje do juna 2027", () => {
    expect(produzenjeUProzoru("2027-06-18T13:58:06Z", now)).toBe(false);
  });

  it("nudi se do 60 dana posle isteka", () => {
    expect(produzenjeUProzoru("2026-09-01T12:00:00Z", now)).toBe(true);
  });

  it("ne nudi se posle 60 dana od isteka", () => {
    expect(produzenjeUProzoru("2026-07-01T12:00:00Z", now)).toBe(false);
  });

  it("trajan pristup nema šta da produži", () => {
    expect(produzenjeUProzoru(null, now)).toBe(false);
  });
});

describe("cena", () => {
  it("2 × produženje = OBNOVI50 na ceo nivo (5.800) - bez arbitraže", () => {
    expect(PRODUZENJE_CENA * 2).toBe(5800);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/lib/produzenje.test.ts`
Expected: FAIL - `Failed to resolve import "./produzenje"`

- [ ] **Step 3: Write the implementation**

Create `src/lib/produzenje.ts`:

```ts
// src/lib/produzenje.ts - produženje pristupa JEDNOM sadržajnom polunivou (2.900 din, godinu dana).
//
// Zašto postoji: obnova kuponom OBNOVI50 kupuje CEO nivo za pola cene (video-kurs-a1
// 11.600 → 5.800, otključava i „nemacki-a1-1" i „nemacki-a1-2"). Grupni i individualni
// polaznici plaćaju POLUNIVO (19.600 / 23.000-37.000), pa im je OBNOVI50 zatvoren od
// 04.08.2026 (lib/renewal-eligibility.ts): sa −50 % bi dobili i polunivo koji nikad nisu
// platili. Do 30.09.2026. zato nisu imali nikakav samoposlužni put - produženje se
// rešavalo ručno po mejlu (povod: Tatjana Živanović, A1.1 pada 10.10.2026 dok A1.2 traje
// do 18.06.2027, pa joj OBNOVI50 svejedno pada na „prerano").
//
// Cena 2.900 je jedina bez arbitraže: 2 × 2.900 = 5.800 = OBNOVI50 na ceo nivo. Niže bi
// podlokalo OBNOVI50, više bi učinilo produženje besmislenim. Odluka Natašina, 30.09.2026.

import { renewalWindowStatus } from "@/lib/renewal-window";

export const PRODUZENJE_PREFIX = "produzenje-";
export const PRODUZENJE_CENA = 2900;
/** PayPal cena za kupce iz inostranstva (≈ 2.900 din). */
export const PRODUZENJE_EUR = 25;

/** Isti prozor kao OBNOVI50 (`coupons.renewal_days_before/after` za OBNOVI50). */
export const PRODUZENJE_DANA_PRE = 30;
export const PRODUZENJE_DANA_POSLE = 60;

/** Samo CEFR polunivoi imaju proizvod za produženje - konverzacijski, FSP i C1 ne. */
const POLUNIVO = /^nemacki-(a1|a2|b1|b2)-[12]$/;

/**
 * Sadržajni polunivo („nemacki-a1-1") → slug proizvoda za produženje.
 * Vraća null za sve što nije CEFR polunivo.
 */
export function produzenjeSlugFor(contentSlug: string): string | null {
  const s = contentSlug ?? "";
  return POLUNIVO.test(s) ? `${PRODUZENJE_PREFIX}${s}` : null;
}

export function isProduzenjeSlug(slug: string): boolean {
  return (slug ?? "").startsWith(PRODUZENJE_PREFIX);
}

/**
 * Sme li `renewal_only` kupon (OBNOVI50) da se primeni na ovaj proizvod.
 * Produženje je već puna cena te stvari, ne popust - sa −50 % bi bilo 1.450.
 */
export function couponAllowedOnProduzenje(renewalOnly: boolean, courseSlug: string): boolean {
  return !(renewalOnly && isProduzenjeSlug(courseSlug));
}

/** Poruka kad se OBNOVI50 pokuša na produženju - objašnjenje, ne samo odbijanje. */
export const PRODUZENJE_KUPON_PORUKA =
  "Kod za obnovu ne važi na produženje pristupa - 2.900 din je već puna cena produženja jednog polunivoa. Kod važi na obnovu celog nivoa.";

/**
 * Je li polaznik u prozoru u kom mu se nudi produženje (30 dana pre isteka do 60 posle).
 * Trajan pristup (`expires_at IS NULL`) nema šta da produži.
 */
export function produzenjeUProzoru(expiresAt: string | null, now: Date = new Date()): boolean {
  return renewalWindowStatus(expiresAt, now, PRODUZENJE_DANA_PRE, PRODUZENJE_DANA_POSLE).ok;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/lib/produzenje.test.ts`
Expected: PASS, 10 testova

- [ ] **Step 5: Commit**

```bash
git add src/lib/produzenje.ts src/lib/produzenje.test.ts
git commit -m "feat(produzenje): cista logika produzenja polunivoa (2.900, prozor 30/60)"
```

---

## Task 2: Prihod od produženja ne upada u „Video kursevi"

`kategorijaForItem` rutira po `course_type`, a produženje ima `course_type='video'` (baza dozvoljava samo `video|individual|group`). Bez ovog koraka bi se 2.900 din knjižilo kao prihod od video kursa.

**Files:**
- Modify: `src/lib/finansije.ts:5` (tip), `src/lib/finansije.ts:7-15` (labele), `src/lib/finansije.ts:67-75` (`kategorijaForItem`), `src/lib/finansije.ts:198-200` (`emptyKategorije`)
- Modify: `src/app/admin/finansije/FinansijeClient.tsx:16`
- Test: `src/lib/finansije.test.ts:11-33`

- [ ] **Step 1: Write the failing test**

U `src/lib/finansije.test.ts`, unutar `describe("kategorijaForItem", ...)`, dodaj pre zatvaranja bloka:

```ts
  it("produženje pristupa ne upada u video, iako mu je course_type video", () => {
    expect(kategorijaForItem("produzenje-nemacki-a1-1", "video")).toBe("produzenje");
    expect(kategorijaForItem("produzenje-nemacki-b2-2", null)).toBe("produzenje");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/lib/finansije.test.ts`
Expected: FAIL - `expected 'video' to be 'produzenje'`

- [ ] **Step 3: Write the implementation**

U `src/lib/finansije.ts`, dodaj import na vrh (posle postojećih importa):

```ts
import { PRODUZENJE_PREFIX } from "@/lib/produzenje";
```

Zameni liniju 5:

```ts
export type Kategorija = "video" | "grupni" | "individualni" | "paket" | "produzenje" | "academy" | "konsultacije" | "ostalo";
```

U `KATEGORIJA_LABELS` dodaj red posle `paket`:

```ts
  produzenje: "Produženje pristupa",
```

U `kategorijaForItem`, dodaj proveru **odmah posle** `nh-academy` linije i **pre** provere `grupni-`:

```ts
  // Produženje pristupa polunivou ima course_type "video" (baza dozvoljava samo
  // video|individual|group), pa bi bez ovoga 2.900 din upalo u „Video kursevi".
  if (s.startsWith(PRODUZENJE_PREFIX)) return "produzenje";
```

U `emptyKategorije` dodaj ključ:

```ts
function emptyKategorije(): Record<Kategorija, number> {
  return { video: 0, grupni: 0, individualni: 0, paket: 0, produzenje: 0, academy: 0, konsultacije: 0, ostalo: 0 };
}
```

U `src/app/admin/finansije/FinansijeClient.tsx:16`:

```ts
const KATEGORIJE: Kategorija[] = ["video", "grupni", "individualni", "paket", "produzenje", "academy", "konsultacije", "ostalo"];
```

**NE dodavati** u `KATEGORIJE_HIST` u `src/app/admin/finansije/page.tsx:99` - to je istorijski WooCommerce prihod, koji ovu kategoriju nikad nije imao.

- [ ] **Step 4: Run tests and typecheck**

Run: `./node_modules/.bin/vitest run src/lib/finansije.test.ts`
Expected: PASS

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez greške (ako `Record<Kategorija, number>` negde još nije popunjen, tsc će to pokazati - popuni sa `produzenje: 0`)

- [ ] **Step 5: Commit**

```bash
git add src/lib/finansije.ts src/lib/finansije.test.ts src/app/admin/finansije/FinansijeClient.tsx
git commit -m "feat(finansije): kategorija Produzenje pristupa, da ne upada u video prihod"
```

---

## Task 3: Migracija - 8 proizvoda + `course_unlocks`

**Files:**
- Create: `supabase/migrations/109_produzenje_polunivoa.sql`

- [ ] **Step 1: Napiši migraciju**

Create `supabase/migrations/109_produzenje_polunivoa.sql`:

```sql
-- 109_produzenje_polunivoa.sql
-- Produženje pristupa JEDNOM sadržajnom polunivou: 8 proizvoda po 2.900 din, godinu dana.
--
-- Zašto: grupni i individualni polaznici plaćaju polunivo, a OBNOVI50 kupuje ceo nivo,
-- pa im je obnova kuponom zatvorena (lib/renewal-eligibility.ts) i nisu imali nijedan
-- samoposlužni put. 2 × 2.900 = 5.800 = OBNOVI50 na ceo nivo, pa nema arbitraže.
-- Odluka Natašina, 30.09.2026.
--
-- is_published=false: proizvod se NE prikazuje u /kursevi izlogu ni u sitemap-u
-- (sitemap traži is_published AND is_purchasable), ali /kupovina/{slug} radi -
-- ta stranica filtrira samo po is_purchasable.
-- course_type='video': baza dozvoljava samo video|individual|group
-- (courses_course_type_check). Finansije ga hvataju po prefiksu slug-a.

insert into courses (
  slug, title, description, category, course_type,
  price, paypal_price_eur, is_purchasable, is_published
)
select
  'produzenje-' || c.slug,
  'Produženje pristupa: ' || c.title,
  'Produženje pristupa materijalima na platformi za ' || c.title ||
    ' na još godinu dana. Ne sadrži nove lekcije ni časove - drži otvoreno ono što već imaš. Tvoj napredak je sačuvan i vraća ti se odmah.',
  'produzenje',
  'video',
  2900,
  25,
  true,
  false
from courses c
where c.slug ~ '^nemacki-(a1|a2|b1|b2)-[12]$'
on conflict (slug) do nothing;

-- Veza proizvod → sadržaj: svaki produžetak otključava TAČNO JEDAN polunivo.
insert into course_unlocks (purchasable_course_id, content_course_id)
select p.id, c.id
from courses c
join courses p on p.slug = 'produzenje-' || c.slug
where c.slug ~ '^nemacki-(a1|a2|b1|b2)-[12]$'
on conflict (purchasable_course_id, content_course_id) do nothing;
```

- [ ] **Step 2: Primeni migraciju na produkciju**

**NAJAVI Nataši pre izvršenja** (pravilo: save/commit/push/deploy se najavljuje pre).

Primeni sadržaj fajla preko Supabase MCP `apply_migration` (project_id `rzmyglynjcygsbicssbt`, name `109_produzenje_polunivoa`), ili preko SQL editora sa service-role pristupom.

- [ ] **Step 3: Verifikuj da je upisano tačno 8 + 8**

Run (Supabase `execute_sql`):

```sql
select p.slug, p.title, p.price, p.category, p.is_purchasable, p.is_published, c.slug as sadrzaj
from courses p
join course_unlocks u on u.purchasable_course_id = p.id
join courses c on c.id = u.content_course_id
where p.category = 'produzenje'
order by p.slug;
```

Expected: 8 redova, svaki sa `price=2900`, `is_purchasable=true`, `is_published=false`, i `sadrzaj` = polunivo bez prefiksa (`produzenje-nemacki-a1-1` → `nemacki-a1-1`). Nijedan produžetak ne sme da otključava više od jednog sadržaja.

- [ ] **Step 4: Verifikuj da nije ušlo u sitemap**

Run:

```sql
select count(*) as u_sitemapu from courses
where is_published = true and is_purchasable = true and category = 'produzenje';
```

Expected: `0`

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/109_produzenje_polunivoa.sql
git commit -m "feat(produzenje): migracija 109 - 8 proizvoda za produzenje polunivoa"
```

---

## Task 4: OBNOVI50 ne prolazi na produženje

Kapija na **oba** mesta: `/api/coupons/validate` (UI, da polaznik vidi poruku) i `/api/orders` (autoritativno, odbija porudžbinu). Bez drugog mesta bi izmenjen zahtev prošao sa −50 %.

**Files:**
- Modify: `src/app/api/coupons/validate/route.ts` (u `if (coupon.renewal_only)` bloku, kao prva provera)
- Modify: `src/app/api/orders/route.ts` (u `if (coupon)` bloku, pre provere `renewalOk`)

- [ ] **Step 1: Kapija u `/api/coupons/validate`**

Dodaj import:

```ts
import { couponAllowedOnProduzenje, PRODUZENJE_KUPON_PORUKA } from "@/lib/produzenje";
```

Unutar `if (coupon.renewal_only) {`, kao **prvu** naredbu (pre provere `!email`):

```ts
    // Produženje polunivoa je već puna cena te stvari (2.900), ne popust - sa −50 %
    // bi bilo 1.450, jeftinije od svega što pokriva.
    if (!couponAllowedOnProduzenje(true, courseSlug)) {
      return NextResponse.json({ error: PRODUZENJE_KUPON_PORUKA }, { status: 400 });
    }
```

- [ ] **Step 2: Kapija u `/api/orders`**

Dodaj import:

```ts
import { couponAllowedOnProduzenje, PRODUZENJE_KUPON_PORUKA } from "@/lib/produzenje";
```

Unutar `if (coupon) {`, **pre** linije `const renewalOk = ...`:

```ts
        // Produženje polunivoa se ne popustuje - 2.900 je puna cena. Autoritativno,
        // jer /api/coupons/validate štiti samo UI.
        if (!couponAllowedOnProduzenje(!!coupon.renewal_only, course.slug)) {
          return NextResponse.json({ error: PRODUZENJE_KUPON_PORUKA }, { status: 400 });
        }
```

- [ ] **Step 3: Typecheck i pun test set**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez greške

Run: `npm test`
Expected: sve prolazi (postojeći testovi ne diraju produženje, pa broj testova raste samo za nove)

- [ ] **Step 4: Ručna provera kapije u produkciji (posle deploya, Task 7)**

Opisano u Task 7, smoke tačka 3.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/coupons/validate/route.ts src/app/api/orders/route.ts
git commit -m "feat(produzenje): OBNOVI50 ne prolazi na produzenje polunivoa"
```

---

## Task 5: Dugme „Produži pristup" u „Moj nalog"

Postojeće dugme „Obnovi −50 %" se pokazuje samo kad je `shouldShowRenew` (≤ 7 dana ili isteklo) i nikad grupnim/individualnim (`upisom.has(c.id)`). Novo dugme koristi prozor 30/60 i pokazuje se **svima**, pa se dva dugmeta mogu videti zajedno - to je namerno: „obnovi ceo nivo −50 %" i „produži samo ovaj polunivo".

**Files:**
- Modify: `src/app/nalog/page.tsx`

- [ ] **Step 1: Učitaj proizvode za produženje**

Dodaj import:

```ts
import { produzenjeSlugFor, produzenjeUProzoru } from "@/lib/produzenje";
```

Posle linije `const upisom = await noCouponRenewalCourseIds(admin, user.id);` dodaj:

```ts
  // Produženje JEDNOG polunivoa (2.900) - jedini samoposlužni put za grupne i
  // individualne, i jeftinija opcija kod asimetričnog isteka (A1.1 pada dok A1.2 traje).
  // Cena se čita iz baze, ne piše u kodu - da se menja na jednom mestu.
  const produzenjeSlugovi = (courses ?? [])
    .map((c) => produzenjeSlugFor(c.slug))
    .filter((s): s is string => !!s);
  const { data: produzenjaProizvodi } = produzenjeSlugovi.length
    ? await admin
        .from("courses")
        .select("slug, price")
        .in("slug", produzenjeSlugovi)
        .eq("is_purchasable", true)
    : { data: [] as Array<{ slug: string; price: number }> };
  const produzenjeCene = new Map(
    (produzenjaProizvodi ?? []).map((p) => [p.slug as string, Number(p.price)])
  );
```

- [ ] **Step 2: Zadrži `expires_at` u mapiranom objektu**

Zameni postojeći `kursevi` blok:

```ts
  const now = new Date();
  const kursevi = (courses ?? []).map((c) => {
    const acc = (accessList ?? []).find((a) => a.course_id === c.id);
    return {
      ...c,
      expiresAt: acc?.expires_at ?? null,
      status: accessStatus(acc?.expires_at ?? null, now),
    };
  });
```

- [ ] **Step 3: Izračunaj i prikaži dugme**

Unutar `{kursevi.map((c) => {`, posle postojeće `const renew = ...` linije, dodaj:

```ts
          const produzenjeSlug = produzenjeSlugFor(c.slug);
          const produzenjeCena = produzenjeSlug ? produzenjeCene.get(produzenjeSlug) : undefined;
          const produzenje =
            !!produzenjeSlug && produzenjeCena != null && produzenjeUProzoru(c.expiresAt, now);
```

Zameni postojeći `{renew && (...)}` blok ovim (dva dugmeta u istom redu):

```tsx
              {(renew || produzenje) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {renew && (
                    <Link
                      href={`/kupovina/${renewSlug}?kupon=OBNOVI50`}
                      className="inline-block text-sm bg-koral-light text-koral-dark px-3 py-1.5 rounded-lg hover:bg-koral hover:text-white transition-colors"
                    >
                      Obnovi −50%
                    </Link>
                  )}
                  {produzenje && (
                    <Link
                      href={`/kupovina/${produzenjeSlug}`}
                      className="inline-block text-sm bg-plava-light text-plava px-3 py-1.5 rounded-lg hover:bg-plava hover:text-white transition-colors"
                    >
                      Produži ovaj nivo - {produzenjeCena!.toLocaleString("sr-RS")} din
                    </Link>
                  )}
                </div>
              )}
```

- [ ] **Step 4: Typecheck i build**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez greške

Run: `npm run lint`
Expected: bez greške

- [ ] **Step 5: Commit**

```bash
git add src/app/nalog/page.tsx
git commit -m "feat(nalog): dugme Produzi ovaj nivo (2.900) pored obnove celog nivoa"
```

---

## Task 6: Mejl o isteku - dugme za produženje umesto „Javi nam se"

Menja se **samo** verzija bez kupona (grupni i individualni). Verzija sa kuponom ostaje netaknuta: video kupcu je obnova celog nivoa za 5.800 isto što i dva produženja, ali u jednom kliku.

**Files:**
- Modify: `src/lib/email.ts:1618-1627` (`ExpiryReminderItem`), `src/lib/email.ts:1649-1712` (`expiryReminderContent`)
- Modify: `src/app/api/cron/expiry-reminder/route.ts`
- Test: `src/lib/expiry-reminder-content.test.ts`

- [ ] **Step 1: Write the failing test**

U `src/lib/expiry-reminder-content.test.ts` dodaj nov `describe` na kraj fajla:

```ts
describe("expiryReminderContent - produženje polunivoa (bez kupona)", () => {
  const now = new Date("2026-09-30T11:00:00Z");
  const istek = "2026-10-10T08:52:44Z";

  it("grupni/individualni dobija dugme za produženje, ne samo mailto", () => {
    const c = expiryReminderContent({
      name: "Tanja", expiresAt: istek, now, withCoupon: false,
      items: [{
        courseTitle: "Nemački A1.1",
        renewSlug: "video-kurs-a1",
        renewTitle: "VIDEO kurs A1",
        produzenjeSlug: "produzenje-nemacki-a1-1",
        produzenjeCena: 2900,
      }],
    })!;
    expect(c.html).toContain("kupovina/produzenje-nemacki-a1-1");
    expect(c.html).toContain(">Produži pristup<");
    expect(c.html).toContain("2.900");
    // OBNOVI50 se NE sme pojaviti u verziji bez kupona
    expect(c.html).not.toContain("OBNOVI50");
    expect(c.subject).toBe("Tvoj pristup materijalima ističe 10. oktobar 2026.");
  });

  it("više polunivoa - dugme po polunivou, sa nazivom", () => {
    const c = expiryReminderContent({
      name: "Ana", expiresAt: istek, now, withCoupon: false,
      items: [
        { courseTitle: "Nemački A1.1", produzenjeSlug: "produzenje-nemacki-a1-1", produzenjeCena: 2900 },
        { courseTitle: "Nemački A1.2", produzenjeSlug: "produzenje-nemacki-a1-2", produzenjeCena: 2900 },
      ],
    })!;
    expect(c.html.match(/kupovina\/produzenje-/g)).toHaveLength(2);
    expect(c.html).toContain("Produži: Nemački A1.1");
    expect(c.html).toContain("Produži: Nemački A1.2");
    expect(c.html).not.toContain(">Produži pristup<");
  });

  it("bez proizvoda za produženje ostaje stara kopija sa mailto", () => {
    const c = expiryReminderContent({
      name: "Marko", expiresAt: istek, now, withCoupon: false,
      items: [{ courseTitle: "Kurs konverzacije" }],
    })!;
    expect(c.html).toContain("mailto:info@hartweger.rs");
    expect(c.html).toContain("Javi nam se");
    expect(c.html).not.toContain("kupovina/produzenje-");
  });

  it("verzija SA kuponom se ne menja - produženje se ne meša u nju", () => {
    const c = expiryReminderContent({
      name: "Jovana", expiresAt: istek, now, couponDaysAfter: 60,
      items: [{
        courseTitle: "Nemački A1.1",
        renewSlug: "video-kurs-a1",
        renewTitle: "VIDEO kurs A1",
        produzenjeSlug: "produzenje-nemacki-a1-1",
        produzenjeCena: 2900,
      }],
    })!;
    expect(c.html).toContain("OBNOVI50");
    expect(c.html).not.toContain("kupovina/produzenje-");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run src/lib/expiry-reminder-content.test.ts`
Expected: FAIL - `produzenjeSlug` ne postoji u tipu i HTML ne sadrži dugme

- [ ] **Step 3: Write the implementation**

U `src/lib/email.ts`, u `ExpiryReminderItem` dodaj dva polja posle `renewTitle`:

```ts
  /**
   * Slug proizvoda za produženje SAMO ovog polunivoa („produzenje-nemacki-a1-1").
   * Jedini samoposlužni put za grupne i individualne - njima OBNOVI50 ne prolazi.
   */
  produzenjeSlug?: string | null;
  /** Cena produženja iz baze - da mejl i checkout kažu isti broj. */
  produzenjeCena?: number | null;
```

U `expiryReminderContent`, posle definicije `products` dodaj:

```ts
    // Produženje jednog polunivoa - dugme po polunivou (jedan produžetak = jedan nivo).
    const produzenja = [...new Map(
      items.filter((i) => i.produzenjeSlug).map((i) => [i.produzenjeSlug as string, i])
    ).values()];
```

Zameni ceo `noCouponBlock` ovim:

```ts
    const jednoProduzenje = produzenja.length === 1;
    const produzenjeCenaTekst = jednoProduzenje && produzenja[0].produzenjeCena != null
      ? `${produzenja[0].produzenjeCena.toLocaleString("sr-RS")} din`
      : null;

    const produzenjeDugmad = produzenja.map((i) => `
      <div style="text-align:center;margin:0 0 10px;">
        <a href="${SITE_URL}/kupovina/${i.produzenjeSlug}" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">${
          jednoProduzenje ? "Produži pristup" : `Produži: ${esc(i.courseTitle)}`
        }</a>
      </div>`).join("");

    // Grupni i individualni polaznik ne dobija OBNOVI50 (platio je polunivo, a kupon
    // kupuje ceo nivo). Do 30.09.2026. mu je ovde stajao samo mailto - sada može sam da
    // produži tačno onaj polunivo koji mu ističe.
    const noCouponBlock = produzenja.length > 0
      ? `
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">
        Ako želiš da ti materijal ostane otvoren, možeš da <strong>produžiš pristup na još godinu dana</strong>${
          produzenjeCenaTekst ? ` za <strong>${produzenjeCenaTekst}</strong>` : ""
        }. Tvoj napredak je sačuvan i ostaje ti.
      </p>
      <div style="margin:24px 0;">${produzenjeDugmad}</div>
      <p style="font-size:13px;line-height:1.6;color:#888;margin:0 0 8px;">
        Ako umesto toga planiraš sledeći nivo sa profesorkom, samo odgovori na ovaj mejl - dogovorićemo najbolji sledeći korak.
      </p>`
      : `
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">
        Ako želiš da nastaviš ili pređeš na sledeći nivo, javi nam se - dogovorićemo najbolji sledeći korak za tebe.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="mailto:info@hartweger.rs" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Javi nam se</a>
      </div>`;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run src/lib/expiry-reminder-content.test.ts`
Expected: PASS, uključujući 4 nova testa

- [ ] **Step 5: Cron prosleđuje `produzenjeSlug`**

U `src/app/api/cron/expiry-reminder/route.ts` dodaj import:

```ts
import { produzenjeSlugFor } from "@/lib/produzenje";
```

Posle `const titleBySlug = new Map(...)` (linija 200) dodaj:

```ts
  // Proizvodi za produženje polunivoa - nude se samo ako stvarno postoje u bazi
  // (migracija 109). Cena se čita iz baze da mejl i checkout kažu isti broj.
  const produzenjeProizvodi = new Map(
    (courses ?? [])
      .filter((c) => c.category === "produzenje")
      .map((c) => [c.slug as string, c])
  );
```

**VAŽNO:** `courses` upit na liniji 55 mora da vrati i `price`. Zameni ga:

```ts
  const courses = must(await admin.from("courses").select("id, title, slug, category, price"), "courses");
```

U `items: stavke.map(...)` bloku zameni telo:

```ts
      items: stavke.map(({ row, course }) => {
        const renewSlug = renewSlugs.get(row.course_id) ?? null;
        const prodSlug = produzenjeSlugFor(course.slug);
        const prod = prodSlug ? produzenjeProizvodi.get(prodSlug) : undefined;
        return {
          courseTitle: course.title,
          renewSlug,
          renewTitle: renewSlug ? titleBySlug.get(renewSlug) ?? null : null,
          produzenjeSlug: prod ? prodSlug : null,
          produzenjeCena: prod ? Number(prod.price) : null,
        };
      }),
```

- [ ] **Step 6: Probni mejl (`?test=`) mora da izgleda kao pravi**

TEST režim u cronu (blok `if (testEmail) { ... }`, oko linije 66) gradi `items` zasebno i inače ne bi pokazao novo dugme - probni mejl bi lažno izgledao ispravno.

U tom bloku, posle `const sample = ...`, dodaj:

```ts
    const sampleProdSlug = sample?.slug ? produzenjeSlugFor(sample.slug) : null;
    const { data: sampleProd } = sampleProdSlug
      ? await admin.from("courses").select("price").eq("slug", sampleProdSlug).eq("is_purchasable", true).maybeSingle()
      : { data: null };
```

i zameni `items` u `sendExpiryReminder` pozivu:

```ts
      items: [{
        courseTitle: sample?.title ?? "Nemački A1.1",
        renewSlug: testRenew,
        produzenjeSlug: sampleProd ? sampleProdSlug : null,
        produzenjeCena: sampleProd ? Number(sampleProd.price) : null,
      }],
```

- [ ] **Step 7: Typecheck i pun test set**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez greške

Run: `npm test`
Expected: sve prolazi

- [ ] **Step 8: Commit**

```bash
git add src/lib/email.ts src/lib/expiry-reminder-content.test.ts src/app/api/cron/expiry-reminder/route.ts
git commit -m "feat(mejl): grupni/individualni dobija dugme za produzenje polunivoa"
```

---

## Task 7: Deploy i smoke test

**NAJAVI Nataši pre push-a** - push na `main` je produkcija.

- [ ] **Step 1: Pun test set i build lokalno**

Run: `npm test`
Expected: sve prolazi

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez greške

Run: `npm run build`
Expected: build prolazi

- [ ] **Step 2: Push**

```bash
git push origin main
```

Napomena: deploy ide preko `git push`, ne preko Vercel CLI - Securly na Natašinoj mreži blokira Vercel CLI na sertifikatu.

- [ ] **Step 3: Smoke - stranica proizvoda radi, izlog je čist**

- [ ] `https://www.hartweger.rs/kupovina/produzenje-nemacki-a1-1` → checkout se otvara, cena **2.900 RSD**
- [ ] `https://www.hartweger.rs/kursevi` → produženja se **ne vide** u izlogu
- [ ] `https://www.hartweger.rs/sitemap.xml` → ne sadrži `produzenje-`

- [ ] **Step 4: Smoke - OBNOVI50 pada na produženju**

Na `/kupovina/produzenje-nemacki-a1-1` unesi mejl polaznika koji poseduje A1 i kod `OBNOVI50`.
Expected: poruka „Kod za obnovu ne važi na produženje pristupa - 2.900 din je već puna cena…", cena ostaje 2.900.

- [ ] **Step 5: Smoke - OBNOVI50 i dalje radi na celom nivou**

Na `/kupovina/video-kurs-a1` isti mejl + `OBNOVI50`.
Expected: 11.600 → 5.800 (ako je polaznik u prozoru 30/60). Ova provera je obavezna - dokazuje da kapija nije slomila postojeću obnovu.

- [ ] **Step 6: Smoke - dugme u „Moj nalog"**

Uloguj se kao polaznik kome polunivo ističe u narednih 30 dana i proveri da se vidi „Produži ovaj nivo - 2.900 din" i da vodi na `/kupovina/produzenje-...`.

- [ ] **Step 7: Smoke - mejl bez kupona**

Run:

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" "https://www.hartweger.rs/api/cron/expiry-reminder?test=info@hartweger.rs&nocoupon=1"
```

Expected: u sandučetu mejl sa dugmetom „Produži pristup" i **bez** reči OBNOVI50.

Zatim `?dry=1` da se vidi broj kandidata bez slanja:

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" "https://www.hartweger.rs/api/cron/expiry-reminder?dry=1"
```

Expected: `{"dry":true,...}` bez slanja - broj `totalGroups` mora da bude isti kao pre ovog posla (produženje ne menja ko dobija mejl, samo šta u njemu stoji).

- [ ] **Step 8: Prva prodaja - proveri da je pristup produžen**

Posle prve stvarne kupovine:

```sql
select c.slug, ca.expires_at, ca.source
from course_access ca join courses c on c.id = ca.course_id
where ca.source like 'order:%' and c.slug ~ '^nemacki-'
order by ca.expires_at desc limit 5;
```

Expected: red za kupljeni polunivo ima `expires_at` ≈ danas + 1 godina, a **susedni polunivo nije dirnut**.

---

## Self-Review

**Pokrivenost odluka:**

| Odluka | Task |
|---|---|
| Cena 2.900, godinu dana | Task 1 (konstanta + test arbitraže), Task 3 (baza) |
| Svih 8 polunivoa | Task 1 (`produzenjeSlugFor`), Task 3 (migracija) |
| Dostupno svima, uključujući sinhroni istek | Task 5 (dugme bez `upisom` filtera) |
| Grupni i individualni smeju | Task 5 + Task 6 (dugme u verziji bez kupona) |
| Prozor kao OBNOVI50 (30/60) | Task 1 (`produzenjeUProzoru`), Task 5 |
| Nema novog kupona, OBNOVI50 se ne dira | Task 4 (samo blokada), Task 6 (test „verzija SA kuponom se ne menja") |
| Ne ulazi u izlog ni sitemap | Task 3 (`is_published=false`) + Task 7 smoke |
| Prihod se ne meša sa video kursevima | Task 2 |

**Otvoreno posle ovog posla (nije u planu, odluka Natašina):**
- Tanja Živanović: A1.1 joj pada **10.10.2026**, pre nego što ovo stigne uživo. Ručno produženje ili uplatnica na 2.900 - vidi razgovor od 30.09.2026.
- Automatsko produženje ranijeg polunivoa pri upisu u sledeći (stara otvorena stavka iz `project_grupni_bez_obnovi50`) - sada je jeftinije rešiva, ali je zaseban posao.
