# Kupon: video FSP → popust na individualni FSP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polaznik koji je kupio video FSP (`fsp`) dobija kupon `FSP1NA1` koji mu skida fiksno 5.960 RSD (cenu videa) sa individualnog FSP-a (`fsp-individualni`), uz proveru vlasništva po mejlu.

**Architecture:** Proširujemo postojeći sistem kupona (tabela `coupons` + rute `validate`/`orders` + `CheckoutForm`). Dodajemo dve kolone za par „prerekvizit kurs → ciljni kurs" i podršku za `discount_type='fixed'`. Obračun popusta izdvajamo u pure funkciju radi DRY + TDD; provera vlasništva koristi postojeću `emailOwnsCourse`.

**Tech Stack:** Next.js (App Router) API rute, Supabase (Postgres), TypeScript, Vitest.

Referentni fajlovi (radi konteksta pri implementaciji):
- Spec: `docs/superpowers/specs/2026-06-20-kupon-video-fsp-popust-na-1na1-design.md`
- Postojeća ograničenja kupona: `supabase/migrations/051_coupon_restrictions.sql`, `052_coupon_new_customers_only.sql`
- Vlasništvo: `src/lib/coupon-ownership.ts` (`emailOwnsCourse`)
- Konverzija EUR: `src/lib/order-utils.ts` (`calculatePaypalEur`, `EUR_RATE`)

---

## File Structure

- **Create** `supabase/migrations/058_coupon_course_pair.sql` — dve nove kolone + seed kupona `FSP1NA1`.
- **Create** `src/lib/coupon-discount.ts` — pure funkcija `computeCouponDiscount` (deli je server i klijent).
- **Create** `src/lib/coupon-discount.test.ts` — vitest za pure funkciju.
- **Modify** `src/lib/types.ts` — `Coupon` interfejs: nova polja.
- **Modify** `src/app/api/coupons/validate/route.ts` — provere `requires_course_id` / `applies_to_course_id`; vraća `discountType` + `amount`.
- **Modify** `src/app/api/orders/route.ts` — iste provere; obračun preko `computeCouponDiscount`.
- **Modify** `src/app/kupovina/[slug]/CheckoutForm.tsx` — prikaz i obračun fiksnog popusta.

---

### Task 1: Migracija — kolone para kurseva + seed kupona

**Files:**
- Create: `supabase/migrations/058_coupon_course_pair.sql`

- [ ] **Step 1: Napiši migraciju**

```sql
-- Par "prerekvizit kurs -> ciljni kurs" za kupone tipa "video kupac dobija
-- popust na 1:1 isti nivo". Generički: koristi se za FSP1NA1, a kasnije za
-- A1/A2/B1 (video -> individualni) bez izmene koda.
--
-- requires_course_id    -> kupon važi samo ako mejl VEĆ poseduje taj kurs
-- applies_to_course_id  -> kupon se sme iskoristiti samo PRI kupovini tog kursa
alter table coupons add column if not exists requires_course_id uuid references courses(id);
alter table coupons add column if not exists applies_to_course_id uuid references courses(id);

-- FSP1NA1: ko ima video FSP (slug 'fsp') kupuje individualni FSP
-- (slug 'fsp-individualni') sa fiksnim popustom = cena videa (5.960 RSD).
insert into coupons (code, discount_type, amount, requires_course_id, applies_to_course_id, once_per_email, is_active)
values (
  'FSP1NA1',
  'fixed',
  5960,
  (select id from courses where slug = 'fsp'),
  (select id from courses where slug = 'fsp-individualni'),
  true,
  true
)
on conflict (code) do update set
  discount_type        = excluded.discount_type,
  amount               = excluded.amount,
  requires_course_id   = excluded.requires_course_id,
  applies_to_course_id = excluded.applies_to_course_id,
  once_per_email       = excluded.once_per_email,
  is_active            = excluded.is_active;
```

- [ ] **Step 2: Primeni na Supabase**

Primeni preko Supabase SQL Editor-a ili Management API (`sbp_` token) — videti memoriju `reference_supabase_ddl` (service-role samo za podatke, DDL preko SQL Editor/Management API).

- [ ] **Step 3: Verifikuj da je kupon kreiran sa ispravnim id-jevima**

Run (SQL Editor):
```sql
select c.code, c.discount_type, c.amount,
       req.slug as requires, app.slug as applies_to,
       c.once_per_email, c.is_active
from coupons c
left join courses req on req.id = c.requires_course_id
left join courses app on app.id = c.applies_to_course_id
where c.code = 'FSP1NA1';
```
Expected: jedan red — `discount_type=fixed`, `amount=5960`, `requires=fsp`, `applies_to=fsp-individualni`, `once_per_email=t`, `is_active=t`. (Ako su `requires`/`applies_to` prazni, slugovi kurseva se razlikuju — proveri `select slug from courses where slug ilike '%fsp%'`.)

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/058_coupon_course_pair.sql
git commit -m "feat(coupons): par kurseva (requires/applies_to) + seed FSP1NA1"
```

---

### Task 2: Pure funkcija za obračun popusta + testovi

**Files:**
- Create: `src/lib/coupon-discount.ts`
- Test: `src/lib/coupon-discount.test.ts`

- [ ] **Step 1: Napiši test koji pada**

```typescript
import { describe, it, expect } from "vitest";
import { computeCouponDiscount } from "./coupon-discount";

describe("computeCouponDiscount", () => {
  it("fiksni popust skida tačan iznos", () => {
    expect(computeCouponDiscount("fixed", 5960, 20500)).toEqual({
      discount: 5960,
      finalPrice: 14540,
    });
  });

  it("fiksni popust se clampuje na cenu (nikad negativno)", () => {
    expect(computeCouponDiscount("fixed", 9000, 5000)).toEqual({
      discount: 5000,
      finalPrice: 0,
    });
  });

  it("procentualni popust računa procenat (zaokruženo)", () => {
    expect(computeCouponDiscount("percent", 10, 23000)).toEqual({
      discount: 2300,
      finalPrice: 20700,
    });
  });

  it("nepoznat tip tretira kao procenat (kompatibilnost)", () => {
    expect(computeCouponDiscount("", 10, 1000)).toEqual({
      discount: 100,
      finalPrice: 900,
    });
  });
});
```

- [ ] **Step 2: Pokreni test — mora da padne**

Run: `npx vitest run src/lib/coupon-discount.test.ts`
Expected: FAIL — `Failed to resolve import "./coupon-discount"`.

- [ ] **Step 3: Napiši minimalnu implementaciju**

```typescript
/**
 * Obračun popusta kupona nad cenom (RSD). DRY izvor za /api/coupons/validate,
 * /api/orders i CheckoutForm.
 *  - "fixed"   -> skida fiksni iznos (amount), clamp na cenu (finalna >= 0)
 *  - inače     -> procenat (amount %), zaokruženo (zatečeno ponašanje)
 * PayPal EUR se i dalje izvodi iz finalPrice preko calculatePaypalEur, pa je
 * EUR popust automatski tačan i ne čuva se posebno.
 */
export function computeCouponDiscount(
  discountType: string,
  amount: number,
  unitPrice: number
): { discount: number; finalPrice: number } {
  let discount: number;
  if (discountType === "fixed") {
    discount = Math.min(Math.round(amount), unitPrice);
  } else {
    discount = Math.round((unitPrice * amount) / 100);
  }
  if (discount < 0) discount = 0;
  return { discount, finalPrice: unitPrice - discount };
}
```

- [ ] **Step 4: Pokreni test — mora da prođe**

Run: `npx vitest run src/lib/coupon-discount.test.ts`
Expected: PASS (4 testa).

- [ ] **Step 5: Commit**

```bash
git add src/lib/coupon-discount.ts src/lib/coupon-discount.test.ts
git commit -m "feat(coupons): computeCouponDiscount (fixed + percent) sa testovima"
```

---

### Task 3: Tip `Coupon` — nova polja

**Files:**
- Modify: `src/lib/types.ts` (interfejs `Coupon`, oko linije 187-191)

- [ ] **Step 1: Dodaj polja u `Coupon` interfejs**

Pronađi interfejs `Coupon` i dodaj posle postojećih polja (uz `discount_type`/`amount`):

```typescript
  requires_course_id: string | null;
  applies_to_course_id: string | null;
```

(Ako interfejs nema već `renewal_only`/`video_only`/`once_per_email`/`new_customers_only` a koristiš ih u rutama, ostavi kako jeste — dodaješ samo dva nova polja.)

- [ ] **Step 2: Provera tipova**

Run: `npx tsc --noEmit`
Expected: bez novih grešaka u `types.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(coupons): tip Coupon dobija requires_course_id i applies_to_course_id"
```

---

### Task 4: `validate` ruta — provere para kurseva + vraćanje tipa popusta

**Files:**
- Modify: `src/app/api/coupons/validate/route.ts`

- [ ] **Step 1: Dodaj provere `requires_course_id` i `applies_to_course_id`**

U `validate/route.ts`, posle bloka za `renewal_only` (pre `return NextResponse.json({ code... })` na kraju), dodaj:

```typescript
  // applies_to_course_id: kupon se sme iskoristiti samo na tačno taj kurs
  // (npr. FSP1NA1 važi samo na individualni FSP, ne na bilo koji 1:1 kurs).
  if (coupon.applies_to_course_id) {
    const { data: course } = await supabase
      .from("courses").select("id").eq("slug", courseSlug).maybeSingle();
    if (!course || course.id !== coupon.applies_to_course_id) {
      return NextResponse.json(
        { error: "Ovaj kod važi samo za individualni FSP kurs." },
        { status: 400 }
      );
    }
  }

  // requires_course_id: kupon važi samo ako mejl već poseduje taj kurs
  // (npr. FSP1NA1: mora da imaš kupljen video FSP).
  if (coupon.requires_course_id) {
    if (!email) {
      return NextResponse.json(
        { error: "Unesi svoj mejl iznad pa primeni kod - proveravamo da li imaš video FSP kurs." },
        { status: 400 }
      );
    }
    const owns = await emailOwnsCourse(supabase, email, coupon.requires_course_id);
    if (!owns) {
      return NextResponse.json(
        { error: "Ovaj kod važi samo za polaznike koji su kupili video FSP kurs (na taj mejl)." },
        { status: 400 }
      );
    }
  }
```

(`emailOwnsCourse` je već importovan u ovom fajlu.)

- [ ] **Step 2: Promeni završni `return` da vraća tip popusta i iznos**

Zameni postojeći:

```typescript
  return NextResponse.json({
    code: coupon.code,
    discountPercent: Number(coupon.amount),
  });
```

sa:

```typescript
  return NextResponse.json({
    code: coupon.code,
    discountType: coupon.discount_type,
    amount: Number(coupon.amount),
  });
```

- [ ] **Step 3: Provera tipova**

Run: `npx tsc --noEmit`
Expected: bez grešaka u `validate/route.ts` (CheckoutForm će se uskladiti u Tasku 6 — privremena greška tamo je očekivana dok ne uradiš Task 6).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/coupons/validate/route.ts
git commit -m "feat(coupons): validate proverava par kurseva i vraća tip popusta"
```

---

### Task 5: `orders` ruta — provere + obračun preko `computeCouponDiscount`

**Files:**
- Modify: `src/app/api/orders/route.ts`

- [ ] **Step 1: Importuj pure funkciju**

Pri vrhu fajla, uz postojeći import iz `coupon-ownership`, dodaj:

```typescript
import { computeCouponDiscount } from "@/lib/coupon-discount";
```

- [ ] **Step 2: Zameni `let discountPercent = 0;` praćenjem matchovanog kupona**

Pronađi:
```typescript
    let discountPercent = 0;
    let validCouponCode: string | null = null;
```
i zameni sa:
```typescript
    let couponForDiscount: { discount_type: string; amount: number } | null = null;
    let validCouponCode: string | null = null;
```

- [ ] **Step 3: Dodaj provere para kurseva unutar `if (coupon) { ... }`**

Unutar `if (coupon) {`, uz postojeće provere (`renewal_only`, `new_customers_only`, `video_only`, `once_per_email`), dodaj:

```typescript
        // applies_to_course_id: kupon važi samo na tačno taj kurs
        if (coupon.applies_to_course_id && coupon.applies_to_course_id !== course.id) {
          return NextResponse.json(
            { error: "Ovaj kod važi samo za individualni FSP kurs." },
            { status: 400 }
          );
        }
        // requires_course_id: mejl mora već da poseduje taj kurs (npr. video FSP)
        if (coupon.requires_course_id && !(await emailOwnsCourse(supabase, email, coupon.requires_course_id))) {
          return NextResponse.json(
            { error: "Ovaj kod važi samo za polaznike koji su kupili video FSP kurs (na taj mejl)." },
            { status: 400 }
          );
        }
```

- [ ] **Step 4: Postavi `couponForDiscount` na mestu uspeha**

Pronađi:
```typescript
        if (notExpired && notMaxed && renewalOk) {
          discountPercent = Number(coupon.amount);
          validCouponCode = coupon.code;
        }
```
i zameni sa:
```typescript
        if (notExpired && notMaxed && renewalOk) {
          couponForDiscount = { discount_type: coupon.discount_type, amount: Number(coupon.amount) };
          validCouponCode = coupon.code;
        }
```

- [ ] **Step 5: Zameni obračun `discount`/`finalPrice`**

Pronađi:
```typescript
    const discount = discountPercent > 0 ? Math.round(unitPrice * discountPercent / 100) : 0;
    const finalPrice = unitPrice - discount;
```
i zameni sa:
```typescript
    const { discount, finalPrice } = couponForDiscount
      ? computeCouponDiscount(couponForDiscount.discount_type, couponForDiscount.amount, unitPrice)
      : { discount: 0, finalPrice: unitPrice };
```

- [ ] **Step 6: Provera tipova**

Run: `npx tsc --noEmit`
Expected: bez grešaka u `orders/route.ts`.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/orders/route.ts
git commit -m "feat(coupons): orders proverava par kurseva i računa fiksni popust"
```

---

### Task 6: `CheckoutForm` — prikaz i obračun fiksnog popusta

**Files:**
- Modify: `src/app/kupovina/[slug]/CheckoutForm.tsx`

- [ ] **Step 1: Importuj pure funkciju**

Uz postojeće importe pri vrhu (npr. ispod `import { EUR_RATE } from "@/lib/order-utils";`):

```typescript
import { computeCouponDiscount } from "@/lib/coupon-discount";
```

- [ ] **Step 2: Promeni tip `appliedCoupon` stanja**

Pronađi:
```typescript
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
```
i zameni sa:
```typescript
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountType: string; amount: number } | null>(null);
```

- [ ] **Step 3: Promeni obračun `discountedRsd`**

Pronađi:
```typescript
  const discountedRsd = appliedCoupon ? Math.round(basePrice * (1 - appliedCoupon.discountPercent / 100)) : basePrice;
```
i zameni sa:
```typescript
  const discountedRsd = appliedCoupon
    ? computeCouponDiscount(appliedCoupon.discountType, appliedCoupon.amount, basePrice).finalPrice
    : basePrice;
```

- [ ] **Step 4: Promeni prikaz oznake kupona**

Pronađi:
```tsx
              Kupon {appliedCoupon.code} - {appliedCoupon.discountPercent}% popusta
```
i zameni sa:
```tsx
              Kupon {appliedCoupon.code} - {appliedCoupon.discountType === "fixed"
                ? `${formatPrice(appliedCoupon.amount)} din popusta`
                : `${appliedCoupon.amount}% popusta`}
```

- [ ] **Step 5: Provera tipova + lint**

Run: `npx tsc --noEmit && npx next lint --file src/app/kupovina/[slug]/CheckoutForm.tsx`
Expected: bez grešaka. (`setAppliedCoupon(data)` u `validateCoupon` sada dobija `{code, discountType, amount}` iz validate rute — usklađeno.)

- [ ] **Step 6: Commit**

```bash
git add "src/app/kupovina/[slug]/CheckoutForm.tsx"
git commit -m "feat(coupons): checkout prikazuje i računa fiksni popust"
```

---

### Task 7: Puna provera + ručni smoke test

**Files:** (nema izmena koda; verifikacija)

- [ ] **Step 1: Cela test svita + build**

Run: `npx vitest run && npx tsc --noEmit`
Expected: svi testovi PASS, nema TS grešaka.

- [ ] **Step 2: Ručni smoke (lokalno ili na preview-u)**

Pokreni app i proveri scenarije na `/kupovina/fsp-individualni`:
1. Mejl koji **poseduje** video FSP + kod `FSP1NA1` → cena umanjena za 5.960 RSD; PayPal EUR srazmerno manji.
2. Mejl koji **nema** video FSP + `FSP1NA1` → greška „...kupili video FSP kurs".
3. Bez unetog mejla + `FSP1NA1` → greška „Unesi svoj mejl...".
4. `FSP1NA1` na nekom drugom kursu (npr. `/kupovina/fsp` ili drugi 1:1) → greška „...samo za individualni FSP".
5. Postojeći procentualni kupon (npr. `NAKI10`/`OBNOVI50`) i dalje radi kao pre (regresija).
6. Dovrši porudžbinu sa `FSP1NA1`: u bazi `orders` red ima `discount=5960`, `total=cena-5960`, `coupon_code='FSP1NA1'`.

Expected: sva ponašanja kao gore.

- [ ] **Step 3: (Opciono) Deploy**

Po memoriji `reference_vercel_deploy`: produkcija ide ručno `vercel --prod`; posle deploya ide smoke-deploy hook. Deploy tek po odobrenju korisnika.

---

## Self-Review

**Spec coverage:**
- Fiksni popust = cena videa → Task 1 (seed amount=5960) + Task 2 (computeCouponDiscount fixed) + Task 5/6 (primena).
- Provera vlasništva po mejlu (`requires_course_id`) → Task 4 + Task 5.
- Kod važi samo na individualni FSP (`applies_to_course_id`) → Task 4 + Task 5.
- `discount_type='fixed'` podrška kroz validate/orders/checkout → Task 2/4/5/6.
- Reusable par „prerekvizit → cilj" → Task 1 (generičke kolone, ne hardkod).
- EUR auto-izveden iz RSD → bez `amount_eur`; PayPal koristi postojeći `calculatePaypalEur(finalPrice)` (nema izmene potrebne).
- Clamp popusta → Task 2 (test + impl).
- `once_per_email` → već postoji u rutama; seed ga postavlja (Task 1).
- Admin UI → namerno van obima (spec, sekcija „Van obima").
- Regresija procentualnih kupona → Task 2 (test „nepoznat tip = procenat") + Task 7 smoke #5.

**Placeholder scan:** nema TBD/TODO; svi koraci sadrže konkretan kod/komande.

**Type consistency:** validate vraća `{ code, discountType, amount }`; `appliedCoupon` stanje je istog oblika; `computeCouponDiscount(discountType, amount, unitPrice)` poziva se identično u Task 5 i Task 6. `couponForDiscount` polja (`discount_type`, `amount`) mapiraju se na argumente funkcije.
