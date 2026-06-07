# Individualni kursevi — Etapa 1 (Kupovina) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kupac može da kupi individualni 1:1 kurs (izbor profesorke + paketa, tačna cena), a po uplati dobije pristup sadržaju, beleške, kalendar profesorke i mejl — uz mejl profesorki. Ovo je bloker za flip domena.

**Architecture:** `product_variants` (popunjen u Etapi 0) je izvor cena. Checkout stranica učitava varijacije i prosleđuje ih formi; forma nudi izbor profesorke (+ paket za mesečni), dinamički prikazuje cenu, šalje `professorId`/`packageType`. `/api/orders` cenu razrešava **na serveru** iz `product_variants`. `grantAccessForOrder` dobija individualnu granu: pravi `individual_enrollment`, GAS `enrollIndividual` pravi beleške, šalju se welcome (đak) i prof mejl. Sadržaj se otključava postojećim `course_unlocks` (već pokriva po-nivou + FIDE/FSP).

**Tech Stack:** Next.js (App Router, server + client komponente), Supabase (service-role u API), Vitest, Google Apps Script (`grupni-webapp`).

**Preduslov:** Etapa 0 završena (`product_variants` popunjen, `individual_enrollments` postoji, prof config seed-ovan). Spec: `docs/superpowers/specs/2026-06-07-individualni-kursevi-design.md` (Etapa 1).

**Pravila (iz memorije):** „sa Natašom: X din", bez „checkout"/„+5000" ([[feedback_ind_kursevi_sadrzaj]]); 1:1 bez video alternative ([[feedback_prodaja_1na1_bez_videa]]); **tekst svakog novog mejla potvrđuje Nataša pre finalizacije template-a**; posle deploya smoke ([[feedback_deploy_smoke_test]]).

---

## File Structure

- **Create** `src/lib/individual-pricing.ts` — čiste funkcije nad varijacijama (profesorke, paketi, razrešavanje cene, broj časova). Testabilno.
- **Create** `src/lib/individual-pricing.test.ts` — Vitest.
- **Modify** `src/app/kupovina/[slug]/page.tsx` — učitaj `product_variants` + imena profesorki, prosledi formi.
- **Modify** `src/app/kupovina/[slug]/CheckoutForm.tsx` — izbor profesorke/paketa, dinamička cena, napomena, slanje `professorId`/`packageType`.
- **Modify** `src/app/api/orders/route.ts` — server-side razrešavanje varijacije; `items` nose `professor_id`+`package_lessons`.
- **Modify** `src/lib/email.ts` — `sendIndividualWelcomeEmail` + `sendProfNewIndividualStudentEmail`.
- **Modify** `src/lib/grant-access.ts` — individualna grana.
- **Modify** (GAS) `/Users/natasahartweger/Documents/Claude/automatizacija/grupni-webapp/Code.gs` — akcija `enrollIndividual`.

---

## Task 1: Čiste funkcije za cene (TDD)

**Files:**
- Create: `src/lib/individual-pricing.ts`
- Test: `src/lib/individual-pricing.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { describe, it, expect } from "vitest";
import { professorsFromVariants, packageTypesFromVariants, resolveVariant, lessonsForVariant } from "./individual-pricing";

const V = [
  { id: "v1", professor_id: "p-suzana", package_type: null, price: 23000, paypal_price_eur: null, professor: { id: "p-suzana", full_name: "Suzana Marjanović" } },
  { id: "v2", professor_id: "p-natasa", package_type: null, price: 28000, paypal_price_eur: null, professor: { id: "p-natasa", full_name: "Nataša Hartweger" } },
];
const MP = [
  { id: "m1", professor_id: "p-suzana", package_type: "paket4", price: 14000, paypal_price_eur: null, professor: { id: "p-suzana", full_name: "Suzana Marjanović" } },
  { id: "m2", professor_id: "p-suzana", package_type: "paket8", price: 27500, paypal_price_eur: null, professor: { id: "p-suzana", full_name: "Suzana Marjanović" } },
];

describe("professorsFromVariants", () => {
  it("vraća distinct profesorke", () => {
    expect(professorsFromVariants(V)).toEqual([
      { id: "p-suzana", full_name: "Suzana Marjanović" },
      { id: "p-natasa", full_name: "Nataša Hartweger" },
    ]);
  });
});

describe("packageTypesFromVariants", () => {
  it("po nivou: prazno", () => { expect(packageTypesFromVariants(V)).toEqual([]); });
  it("mesečni: sortirani paketi", () => { expect(packageTypesFromVariants(MP)).toEqual(["paket4", "paket8"]); });
});

describe("resolveVariant", () => {
  it("po nivou: po professorId, packageType null", () => {
    expect(resolveVariant(V, { professorId: "p-natasa", packageType: null })?.price).toBe(28000);
  });
  it("mesečni: po professorId + packageType", () => {
    expect(resolveVariant(MP, { professorId: "p-suzana", packageType: "paket8" })?.price).toBe(27500);
  });
  it("vraća null za nepostojeću kombinaciju", () => {
    expect(resolveVariant(V, { professorId: "p-x", packageType: null })).toBeNull();
  });
});

describe("lessonsForVariant", () => {
  it("paketX → broj iz tipa", () => { expect(lessonsForVariant({ package_type: "paket8" }, 10)).toBe(8); });
  it("po nivou → included_lessons", () => { expect(lessonsForVariant({ package_type: null }, 10)).toBe(10); });
});
```

- [ ] **Step 2: Pokreni — mora pasti**

Run: `npx vitest run src/lib/individual-pricing.test.ts`
Expected: FAIL ("Cannot find module './individual-pricing'").

- [ ] **Step 3: Implementiraj**

```typescript
// src/lib/individual-pricing.ts
// Čiste funkcije nad product_variants za individualne kurseve. Bez I/O.

export interface ProfRef { id: string; full_name: string }
export interface Variant {
  id: string;
  professor_id: string | null;
  package_type: string | null;
  price: number;
  paypal_price_eur: number | null;
  professor?: ProfRef | null;
}

/** Distinct profesorke iz varijacija, u zatečenom redosledu. */
export function professorsFromVariants(variants: Variant[]): ProfRef[] {
  const seen = new Set<string>();
  const out: ProfRef[] = [];
  for (const v of variants) {
    if (v.professor && v.professor_id && !seen.has(v.professor_id)) {
      seen.add(v.professor_id);
      out.push({ id: v.professor.id, full_name: v.professor.full_name });
    }
  }
  return out;
}

/** Sortirani distinct package_type-ovi (prazno za "po nivou"). */
export function packageTypesFromVariants(variants: Variant[]): string[] {
  const set = new Set<string>();
  for (const v of variants) if (v.package_type) set.add(v.package_type);
  return Array.from(set).sort();
}

/** Razreši varijaciju po (professorId, packageType). null ako ne postoji. */
export function resolveVariant(
  variants: Variant[],
  sel: { professorId: string | null; packageType: string | null },
): Variant | null {
  return variants.find(
    (v) => v.professor_id === sel.professorId && (v.package_type ?? null) === (sel.packageType ?? null),
  ) ?? null;
}

/** Broj časova: paketX → X, inače included_lessons kursa. */
export function lessonsForVariant(variant: { package_type: string | null }, includedLessons: number | null): number {
  if (variant.package_type) {
    const m = variant.package_type.match(/(\d+)/);
    if (m) return parseInt(m[1], 10);
  }
  return includedLessons ?? 0;
}
```

- [ ] **Step 4: Pokreni — mora proći**

Run: `npx vitest run src/lib/individual-pricing.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/individual-pricing.ts src/lib/individual-pricing.test.ts
git commit -m "feat(individual): cisto razresavanje cena iz product_variants (TDD)"
```

---

## Task 2: Checkout stranica učitava varijacije

**Files:**
- Modify: `src/app/kupovina/[slug]/page.tsx`

- [ ] **Step 1: Dodaj učitavanje varijacija i `included_lessons`, prosledi formi**

U `page.tsx`, posle učitavanja `course` (dodaj `course_type, included_lessons` u select), pre `return`, dodaj:

```typescript
  // Individualni: učitaj varijacije (cene po profesorki/paketu) za izbor u formi.
  const isIndividual = course.course_type === "individual" ||
    ["individualni", "paket", "mesecni"].includes(course.category ?? "");
  let variants: Array<{ id: string; professor_id: string | null; package_type: string | null; price: number; paypal_price_eur: number | null; professor: { id: string; full_name: string } | null }> = [];
  if (isIndividual) {
    const { data } = await supabase
      .from("product_variants")
      .select("id, professor_id, package_type, price, paypal_price_eur, professor:professor_id(id, full_name)")
      .eq("course_id", course.id)
      .eq("is_active", true);
    variants = (data ?? []).map((v) => ({ ...v, professor: Array.isArray(v.professor) ? v.professor[0] ?? null : v.professor }));
  }
```

Promeni select kursa na:
```typescript
    .select("id, title, slug, price, paypal_price_eur, description, category, course_type, included_lessons")
```

Prosledi formi (dodaj props):
```tsx
        <CheckoutForm
          courseSlug={course.slug}
          courseTitle={course.title}
          priceRsd={course.price}
          priceEur={course.paypal_price_eur}
          variants={variants}
          includedLessons={course.included_lessons}
          initialEmail={initialEmail}
          initialName={initialName}
          isLoggedIn={!!user}
        />
```

- [ ] **Step 2: Build provera**

Run: `npm run build`
Expected: prolazi (TypeScript greška o nepostojećim props na CheckoutForm očekivana dok se Task 3 ne uradi — ako build pukne SAMO na tome, nastavi na Task 3 pa ponovo build).

- [ ] **Step 3: Commit (zajedno sa Task 3)** — vidi Task 3 Step 5.

---

## Task 3: Forma — izbor profesorke/paketa + cena + napomena

**Files:**
- Modify: `src/app/kupovina/[slug]/CheckoutForm.tsx`

- [ ] **Step 1: Dodaj props i import pricing funkcija**

Na vrh, dopuni import i `Props`:

```typescript
import { professorsFromVariants, packageTypesFromVariants, resolveVariant, type Variant } from "@/lib/individual-pricing";
```

```typescript
interface Props {
  courseSlug: string;
  courseTitle: string;
  priceRsd: number;
  priceEur: number | null;
  variants?: Variant[];
  includedLessons?: number | null;
  initialEmail?: string;
  initialName?: string;
  isLoggedIn?: boolean;
}
```

Potpis komponente: dodaj `variants = [], includedLessons = null`.

- [ ] **Step 2: Dodaj state i izračunavanje cene iz varijacije**

Odmah posle postojećih `useState` poziva:

```typescript
  const isIndividual = variants.length > 0;
  const professors = professorsFromVariants(variants);
  const packageTypes = packageTypesFromVariants(variants);
  const PAKET_LABEL: Record<string, string> = { paket4: "4 termina", paket8: "8 termina", paket12: "12 termina" };

  const [professorId, setProfessorId] = useState<string | null>(professors[0]?.id ?? null);
  const [packageType, setPackageType] = useState<string | null>(packageTypes[0] ?? null);

  const selectedVariant = isIndividual ? resolveVariant(variants, { professorId, packageType }) : null;
  // Za individualne cena dolazi iz varijacije; inače prop priceRsd.
  const basePrice = isIndividual ? (selectedVariant?.price ?? 0) : priceRsd;
```

Zameni postojeću liniju `const discountedRsd = ...` da koristi `basePrice`:

```typescript
  const discountedRsd = appliedCoupon ? Math.round(basePrice * (1 - appliedCoupon.discountPercent / 100)) : basePrice;
```

(Postojeća `formatPrice(priceRsd)` u summary kartici → zameni sa `formatPrice(basePrice)` na oba mesta gde prikazuje punu cenu.)

- [ ] **Step 3: Pošalji `professorId`/`packageType` u POST**

U `handleSubmit`, u `body: JSON.stringify({...})` dodaj:

```typescript
          professorId: isIndividual ? professorId : null,
          packageType: isIndividual ? packageType : null,
```

- [ ] **Step 4: Dodaj UI — izbor profesorke/paketa + napomena**

Odmah ispod „Order summary card" `</div>` (pre Coupon bloka), dodaj:

```tsx
      {isIndividual && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Izaberi</p>

          {packageTypes.length > 0 && (
            <div>
              <label htmlFor="paket" className="block text-sm font-medium text-gray-700 mb-1">Broj termina</label>
              <select id="paket" value={packageType ?? ""} onChange={(e) => setPackageType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0AB3D7]">
                {packageTypes.map((p) => (<option key={p} value={p}>{PAKET_LABEL[p] ?? p}</option>))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="prof" className="block text-sm font-medium text-gray-700 mb-1">Profesorka</label>
            <select id="prof" value={professorId ?? ""} onChange={(e) => setProfessorId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0AB3D7]">
              {professors.map((p) => (<option key={p.id} value={p.id}>{p.full_name}</option>))}
            </select>
          </div>

          <div className="bg-[#FFF7E6] border border-[#F0D9A0] rounded-lg p-3">
            <p className="text-xs text-[#8A6D3B] leading-relaxed">
              Pre uplate proveri mejlom na <a href="mailto:info@hartweger.rs" className="underline">info@hartweger.rs</a> da li je izabrana profesorka trenutno na raspolaganju za nove termine.
            </p>
          </div>
        </div>
      )}
```

- [ ] **Step 5: Build + commit (Task 2+3 zajedno)**

Run: `npm run build`
Expected: prolazi.

```bash
git add src/app/kupovina/[slug]/page.tsx src/app/kupovina/[slug]/CheckoutForm.tsx
git commit -m "feat(checkout): individualni — izbor profesorke/paketa, cena iz varijacije, napomena"
```

---

## Task 4: /api/orders — server-side razrešavanje varijacije

**Files:**
- Modify: `src/app/api/orders/route.ts`

- [ ] **Step 1: Primi `professorId`/`packageType` i učitaj kurs sa `course_type`**

U destrukturiranju body-ja dodaj `professorId, packageType`:
```typescript
    const { fullName, email, country, courseSlug, paymentMethod, couponCode: rawCouponCode, professorId, packageType } =
      await request.json();
```

Promeni select kursa:
```typescript
      .select("id, slug, title, price, category, course_type, included_lessons")
```

- [ ] **Step 2: Razreši individualnu cenu iz `product_variants` (umesto `course.price`)**

Posle učitavanja `course` i grupne provere, pre kupona, dodaj (Supabase: `.is` za null, `.eq` za vrednost):

```typescript
    // Individualni: cena i broj časova dolaze iz product_variants (server-side, ne veruj klijentu).
    const isIndividual = course.course_type === "individual" ||
      ["individualni", "paket", "mesecni"].includes(course.category ?? "");
    let unitPrice = course.price;
    let chosenProfessorId: string | null = null;
    let packageLessons: number | null = course.included_lessons ?? null;

    if (isIndividual) {
      let q = supabase
        .from("product_variants")
        .select("id, professor_id, package_type, price")
        .eq("course_id", course.id)
        .eq("is_active", true);
      q = professorId ? q.eq("professor_id", professorId) : q.is("professor_id", null);
      q = packageType ? q.eq("package_type", packageType) : q.is("package_type", null);
      const { data: variant } = await q.maybeSingle();
      if (!variant) {
        return NextResponse.json({ error: "Izabrana kombinacija nije dostupna. Osveži stranicu i pokušaj ponovo." }, { status: 400 });
      }
      unitPrice = variant.price;
      chosenProfessorId = variant.professor_id;
      packageLessons = variant.package_type
        ? parseInt(variant.package_type.replace(/\D/g, ""), 10)
        : (course.included_lessons ?? null);
    }
```

- [ ] **Step 3: Koristi `unitPrice` umesto `course.price` u obračunu i `items`**

Zameni:
```typescript
    const discount = discountPercent > 0 ? Math.round(course.price * discountPercent / 100) : 0;
    const finalPrice = course.price - discount;
```
sa:
```typescript
    const discount = discountPercent > 0 ? Math.round(unitPrice * discountPercent / 100) : 0;
    const finalPrice = unitPrice - discount;
```

Zameni `items` blok:
```typescript
    const items = [
      {
        course_id: course.id,
        course_slug: course.slug,
        title: course.title,
        price: unitPrice,
        ...(isIndividual ? { professor_id: chosenProfessorId, package_lessons: packageLessons } : {}),
      },
    ];
```

Zameni `subtotal: course.price` → `subtotal: unitPrice`.

- [ ] **Step 4: Build + ručna provera**

Run: `npm run build`
Expected: prolazi.

Manuelno (dev): `npm run dev`, otvori `/kupovina/individualni-kurs-nemackog-jezika-a11`, izaberi Nataša → cena 28.000; izaberi drugu → 23.000. Pošalji uplatnicom (test mejl) → 200, order kreiran.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/orders/route.ts
git commit -m "feat(orders): individualni — cena/profesorka/broj casova iz product_variants (server-side)"
```

---

## Task 5: GAS akcija `enrollIndividual` (beleške)

**Files:**
- Modify: `/Users/natasahartweger/Documents/Claude/automatizacija/grupni-webapp/Code.gs`

- [ ] **Step 1: Dodaj individualni šablon beleški i akciju**

Na vrh, uz `GRUPNI_BELESKE_TEMPLATE_ID`, dodaj:
```javascript
const IND_BELESKE_TEMPLATE_ID = '1e2aP8rWHgS3XtOOblivZua6F8GEmX25R9ZTABH1Bg2g';
```

U `doPost` switch dodaj granu:
```javascript
      case 'enrollIndividual': return json(enrollIndividual(body));
```

Dodaj funkcije (uz ostale akcije):
```javascript
/**
 * enrollIndividual({ nivo, prof, studentName, studentEmail })
 * → { ok, notesUrl, notesDocId }  (pravi beleške iz individualnog šablona; bez kalendar eventa)
 */
function enrollIndividual(p) {
  const prof = nadjiProf(p.prof);
  if (!prof) throw new Error('Nepoznata profesorka: ' + p.prof);
  if (!p.studentEmail) throw new Error('Nema studentEmail');
  const docId = kreirajIndBeleske(p, prof);
  const notesUrl = docId ? ('https://docs.google.com/document/d/' + docId + '/edit') : '';
  return { ok: true, notesUrl: notesUrl, notesDocId: docId };
}

function kreirajIndBeleske(p, prof) {
  try {
    var template = DriveApp.getFileById(IND_BELESKE_TEMPLATE_ID);
    var folder = DriveApp.getFolderById(prof.folder);
    var ime = p.studentName || p.studentEmail;
    var naziv = 'Beleške — Individualni ' + (p.nivo || '') + ' — ' + ime;
    var kopija = template.makeCopy(naziv, folder);
    var doc = DocumentApp.openById(kopija.getId());
    var body = doc.getBody();
    body.replaceText('\\{\\{NIVO\\}\\}', p.nivo || '');
    body.replaceText('\\{\\{PROFESORKA\\}\\}', prof.ime);
    body.replaceText('\\{\\{POLAZNIK\\}\\}', ime);
    body.replaceText('\\{\\{EMAIL\\}\\}', p.studentEmail);
    doc.saveAndClose();
    kopija.addEditor(prof.email);
    return kopija.getId();
  } catch (e) {
    return '';
  }
}
```

- [ ] **Step 2: Lokalna provera placeholdera šablona (ručno)**

Otvori šablon `1e2aP8…` u Google Docs i potvrdi da koristi `{{NIVO}}`, `{{PROFESORKA}}`, `{{POLAZNIK}}`, `{{EMAIL}}` (ili prilagodi `replaceText` stvarnim placeholderima). Ako šablon nema placeholdere, beleške se i dalje prave (samo bez zamene) — nije blokirajuće.

- [ ] **Step 3: Deploy GAS — CHECKPOINT (outward-facing)**

`clasp push` u `grupni-webapp` i re-deploy web-app (isti URL). **STANI i potvrdi sa Natašom pre deploya** (dira živi Apps Script). Test posle deploya:
```bash
curl -s -X POST "$GAS_WEBAPP_URL" -H "Content-Type: application/json" \
  -d '{"action":"enrollIndividual","secret":"<SHARED_SECRET>","prof":"Suzana","nivo":"A1.1","studentName":"Test Test","studentEmail":"test@example.com"}'
```
Expected: `{"ok":true,"notesUrl":"https://docs.google.com/...","notesDocId":"..."}`. Zatim obriši test doc (ili `deleteTerm`/ručno).

- [ ] **Step 4: Commit (u grupni-webapp repo)**

```bash
git -C /Users/natasahartweger/Documents/Claude/automatizacija/grupni-webapp add Code.gs
git -C /Users/natasahartweger/Documents/Claude/automatizacija/grupni-webapp commit -m "feat: enrollIndividual akcija (individualne beleske)"
```

---

## Task 6: Mejlovi — welcome (đak) + profesorki (individualni)

**Files:**
- Modify: `src/lib/email.ts`

> **CHECKPOINT PRE PISANJA:** tekst oba mejla potvrđuje Nataša. Donji HTML je **predlog** (stil kao `sendGrupniWelcomeEmail`). Prilagodi tekst po njenoj potvrdi pa onda commit.

- [ ] **Step 1: Dodaj `sendIndividualWelcomeEmail`**

```typescript
export async function sendIndividualWelcomeEmail(
  to: string,
  name: string,
  opts: { nivo: string; profIme?: string; calendarUrl?: string | null; notesUrl?: string | null; hasPlatform: boolean },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = name ? name.split(" ")[0] : "";
    const calBtn = opts.calendarUrl
      ? `<p style="margin:24px 0"><a href="${esc(opts.calendarUrl)}" style="background:#0AB3D7;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block">Zakaži termin</a></p>
<p style="font-size:13px;color:#666">Termine biraš direktno u kalendaru profesorke.</p>`
      : `<p style="font-size:14px;color:#666">Link za zakazivanje termina stiže ti uskoro.</p>`;
    const notesRow = opts.notesUrl ? `<p>📝 <a href="${esc(opts.notesUrl)}">Beleške sa časova</a></p>` : "";
    const profRow = opts.profIme ? `<p><strong>Profesorka:</strong> ${esc(opts.profIme)}</p>` : "";
    const platformRow = opts.hasPlatform
      ? `<p>📚 Video lekcije i materijali su ti na platformi: <a href="https://kurs.hartweger.rs/prijava">prijavi se ovde</a> (istim mejlom).</p>`
      : "";
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Dobrodošli na individualni kurs nemačkog ${opts.nivo}!`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<h2>Dobrodošli${ime ? ", " + esc(ime) : ""}! 💚</h2>
<p>Kupovina <strong>individualnog kursa nemačkog ${esc(opts.nivo)}</strong> je potvrđena.</p>
${profRow}
${calBtn}
${notesRow}
${platformRow}
<p style="margin-top:24px">Vidimo se na času!<br>Hartweger tim</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendIndividualWelcomeEmail pao:", e);
  }
}
```

- [ ] **Step 2: Dodaj `sendProfNewIndividualStudentEmail`**

```typescript
export async function sendProfNewIndividualStudentEmail(
  profEmail: string,
  profIme: string,
  opts: { nivo: string; lessons: number; studentName?: string; studentEmail: string; notesUrl?: string | null },
) {
  try {
    const resend = getResend();
    if (!resend) return;
    const ime = profIme ? profIme.split(" ")[0] : "";
    const notesRow = opts.notesUrl ? `<p>📝 <a href="${esc(opts.notesUrl)}">Beleške</a></p>` : "";
    await resend.emails.send({
      from: FROM,
      to: profEmail,
      subject: `Novi individualni polaznik — ${opts.nivo}`,
      html: `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;line-height:1.6;color:#222">
<p>Zdravo${ime ? ", " + esc(ime) : ""}!</p>
<p>Imaš novog individualnog polaznika (<strong>${esc(opts.nivo)}</strong>, paket ${opts.lessons} časova):</p>
<p><strong>Ime:</strong> ${esc(opts.studentName || "—")}<br>
<strong>Mejl:</strong> ${esc(opts.studentEmail)}</p>
${notesRow}
<p>Polaznik zakazuje termine preko tvog kalendara. Održane časove upisuješ na platformi.</p>
<p style="margin-top:20px">Hartweger tim</p>
</body></html>`,
    });
  } catch (e) {
    console.error("[email] sendProfNewIndividualStudentEmail pao:", e);
  }
}
```

- [ ] **Step 3: Commit (posle Natašine potvrde teksta)**

```bash
git add src/lib/email.ts
git commit -m "feat(email): individualni welcome (dak) + obavestenje profesorki"
```

---

## Task 7: grant-access — individualna grana

**Files:**
- Modify: `src/lib/grant-access.ts`

- [ ] **Step 1: Dodaj importe**

```typescript
import { sendWelcomeEmail, sendGrupniWelcomeEmail, sendProfNewStudentEmail, sendIndividualWelcomeEmail, sendProfNewIndividualStudentEmail } from "@/lib/email";
```

(Ostali importi `nivoForSlug`, `computeSeats`, `pickOpenGroupForNivo`, `callGas` već postoje.)

- [ ] **Step 2: Dodaj individualnu granu posle grupne petlje, pre `update orders ... completed`**

Posle grupne `for` petlje (linija ~105), pre `await admin.from("orders").update(...completed...)`, dodaj:

```typescript
  // Individualni proizvodi: enrollment + beleške (GAS) + mejlovi. Best-effort.
  let individualWelcomeSent = false;
  for (const item of items) {
    const profId = (item as { professor_id?: string | null }).professor_id;
    const pkgLessons = (item as { package_lessons?: number | null }).package_lessons;
    if (profId === undefined && pkgLessons === undefined) continue; // nije individualna stavka
    const nivo = nivoForSlug(item.course_slug) ?? "";
    try {
      // Profesorka (ime/mejl/kalendar) iz user_profiles.
      let profIme = "", profEmail = "", calendarUrl: string | null = null;
      if (profId) {
        const { data: prof } = await admin.from("user_profiles")
          .select("full_name, email, calendar_url").eq("id", profId).single();
        profIme = prof?.full_name ?? ""; profEmail = prof?.email ?? ""; calendarUrl = prof?.calendar_url ?? null;
      }

      // GAS: beleške doc (bez kalendar eventa).
      let notesUrl: string | null = null;
      try {
        const r = await callGas("enrollIndividual", {
          nivo, prof: profIme, studentName: order.full_name, studentEmail: order.email,
        });
        notesUrl = (r.notesUrl as string) || null;
      } catch (ge) {
        console.error(`[grant][ind] GAS enrollIndividual pao za ${order.email} (${nivo}):`, ge);
      }

      // Enrollment (rok = uplata + 3 meseca).
      const expEnroll = new Date(); expEnroll.setMonth(expEnroll.getMonth() + 3);
      await admin.from("individual_enrollments").insert({
        user_id: order.user_id, course_id: item.course_id, professor_id: profId ?? null,
        order_id: orderId, package_lessons: pkgLessons ?? 0, status: "active",
        notes_doc_url: notesUrl, expires_at: expEnroll.toISOString(),
      });

      // hasPlatform: ima li course_unlocks za ovaj proizvod (po nivou/FIDE/FSP da, mesečni ne).
      const { count: unlockCount } = await admin.from("course_unlocks")
        .select("*", { count: "exact", head: true }).eq("purchasable_course_id", item.course_id);

      await sendIndividualWelcomeEmail(order.email, order.full_name, {
        nivo, profIme, calendarUrl, notesUrl, hasPlatform: (unlockCount ?? 0) > 0,
      });
      individualWelcomeSent = true;

      if (profEmail) {
        await sendProfNewIndividualStudentEmail(profEmail, profIme, {
          nivo, lessons: pkgLessons ?? 0, studentName: order.full_name, studentEmail: order.email, notesUrl,
        });
      }
    } catch (e) {
      console.error(`[grant][ind] Individualni tok pao za ${item.course_slug} (order ${orderId}):`, e);
    }
  }
```

- [ ] **Step 3: Welcome dedup — ne šalji generički ako je poslat individualni**

Zameni poslednju liniju:
```typescript
  if (!grupniWelcomeSent) await sendWelcomeEmail(order.email, order.full_name, items.map((i) => i.title));
```
sa:
```typescript
  if (!grupniWelcomeSent && !individualWelcomeSent) await sendWelcomeEmail(order.email, order.full_name, items.map((i) => i.title));
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: prolazi.

- [ ] **Step 5: Commit**

```bash
git add src/lib/grant-access.ts
git commit -m "feat(grant): individualna grana — enrollment + beleske + welcome/prof mejl"
```

---

## Task 8: End-to-end provera + deploy (CHECKPOINT)

- [ ] **Step 1: Svi testovi**

Run: `npx vitest run`
Expected: sve zeleno (uklj. nove `individual-pricing` i `wc-variant-map`).

- [ ] **Step 2: Lokalni E2E (dev)**

`npm run dev`. Tok:
1. `/kupovina/individualni-kurs-nemackog-jezika-a11` → izbor Nataša → 28.000; druga → 23.000; napomena vidljiva.
2. `/kupovina/individualni-mesecni-paketi` → izbor paket8 + profesorke → cena iz varijacije.
3. Kupi (uplatnica, test mejl). U `/admin/narudzbine` → „Potvrdi uplatu".
4. Proveri: `individual_enrollments` red kreiran (prof, package_lessons, expires_at); welcome mejl đaku (kalendar link + beleške + platforma za po-nivou); prof mejl; `course_access` za po-nivou (FIDE/FSP/po-nivou), mesečni bez sadržaja.

- [ ] **Step 3: Deploy — CHECKPOINT**

**STANI i potvrdi sa Natašom.** Zatim (po `reference_vercel_deploy`): `vercel --prod` iz `LMS/lms`. Post-deploy smoke hook gađa `/lekcija/[id]` automatski.

- [ ] **Step 4: Produkcijski smoke (ručno, mali rizik)**

Na produkciji otvori `/kupovina/individualni-kurs-nemackog-jezika-a11`, potvrdi izbor profesorke i cenu. (Ne mora prava kupovina — dovoljno da forma i cena rade.)

---

## Definition of Done (Etapa 1)

- `npx vitest run` zeleno.
- Individualni checkout: izbor profesorke (+ paket za mesečni), tačna cena iz `product_variants`, napomena pre uplate.
- Po potvrdi uplate: `individual_enrollment` kreiran, beleške doc (GAS), welcome mejl (kalendar+beleške+platforma), prof mejl; sadržaj otključan za po-nivou/FIDE/FSP, mesečni bez.
- GAS `enrollIndividual` deployovan i testiran.
- Deployovano na produkciju + smoke prošao.
- **Posle ovoga domen sme da se flipuje** (kupovina 1:1 radi od kraja do kraja).
