# Aktivacija: auto-login + mejl login-linkovi + nudge 24h + lekcija gate - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ukloniti magic-link zid iz aktivacionog puta: posle kartice korisnik je ulogovan i na klik od prve lekcije; welcome/nudge mejlovi nose direktan login-link; nudge stiže za ~24h; odjavljen korisnik na lekciji vidi gate umesto 404.

**Architecture:** NestPay callback (ide kroz kupčev browser) posle grant-a generiše Supabase magic-link token i provlači ga kroz postojeći `/auth/confirm` do hvala stranice (sesija postavljena). Mejlovi nose naš HMAC exchange token (7 dana, višekratan) ka novoj ruti `/auth/mejl` koja tek pri kliku generiše svež magic link i postavlja sesiju. Tri odvojena deploya: (D1) gate+nudge prozor, (D2) login-link infra+mejlovi, (D3) callback+hvala.

**Tech Stack:** Next.js App Router (v16 - OBAVEZNO konsultuj `node_modules/next/dist/docs/` pre pisanja koda, vidi AGENTS.md), Supabase (`auth.admin.generateLink`, `verifyOtp`), Resend, vitest, node:crypto HMAC.

**Spec:** `docs/superpowers/specs/2026-07-02-aktivacija-autologin-design.md`

**Repo:** `/Users/natasahartweger/Documents/Claude/sajt/LMS/lms` - trunk-based na `main`, PROVERI granu pre commita (`git branch --show-current`). Bez DB migracija u celom planu.

---

## DEPLOY 1 - nizak rizik: lekcija gate + nudge prozor 24h

### Task 1: LekcijaGate za odjavljene / bez pristupa

**Files:**
- Create: `src/components/LekcijaGate.tsx`
- Modify: `src/app/lekcija/[id]/page.tsx` (blok `if (!lesson) notFound();` na ~liniji 29)

Nema unit testa (React server component bez logike) - verifikacija preko dev servera u Task 10 smoke listi. Pre pisanja pogledaj `node_modules/next/dist/docs/` za server components konvencije ove verzije.

- [ ] **Step 1: Kreiraj `src/components/LekcijaGate.tsx`**

```tsx
import Link from "next/link";

// Gate za /lekcija/[id] kad RLS ne da lekciju: odjavljen korisnik (najčešće klik iz
// mejla u starom browseru/drugom uređaju) ili ulogovan bez pristupa (istekao).
// Umesto mrtvog 404 - jasan sledeći korak. Sadržaj lekcije se ovde NE prikazuje.
export default function LekcijaGate({
  lessonTitle,
  courseTitle,
  loggedIn,
}: {
  lessonTitle: string;
  courseTitle: string;
  loggedIn: boolean;
}) {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="text-4xl mb-4" aria-hidden>🔒</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{lessonTitle}</h1>
      {courseTitle && <p className="text-gray-500 mb-6">Lekcija kursa {courseTitle}</p>}
      {loggedIn ? (
        <>
          <p className="text-gray-700 mb-6">
            Nemaš (više) pristup ovom kursu. Ako ti je pristup istekao, možeš da ga obnoviš.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/nalog"
              className="px-6 py-3 rounded-lg font-semibold text-white text-sm bg-plava hover:bg-plava-dark transition-colors"
            >
              Moj nalog
            </Link>
            <Link
              href="/kursevi"
              className="px-6 py-3 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Pogledaj kurseve
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="text-gray-700 mb-6">
            Prijavi se da nastaviš sa učenjem - traje pola minuta.
          </p>
          <Link
            href="/prijava"
            className="inline-block px-8 py-3 rounded-lg font-semibold text-white text-sm bg-plava hover:bg-plava-dark transition-colors"
          >
            Prijavi se
          </Link>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Ubaci gate u `src/app/lekcija/[id]/page.tsx`**

Dodaj importe na vrh:

```tsx
import { createAdminClient } from "@/lib/supabase/admin";
import LekcijaGate from "@/components/LekcijaGate";
```

Zameni postojeće:

```tsx
  if (!lesson) notFound();
```

sa:

```tsx
  if (!lesson) {
    // RLS vraća null i kad lekcija POSTOJI a korisnik nema pristup (odjavljen iz mejla,
    // istekao pristup). Gate umesto mrtvog 404. Minimalan admin select - sadržaj
    // lekcije ne sme da procuri odjavljenima.
    const adminGate = createAdminClient();
    const { data: gated } = await adminGate
      .from("lessons")
      .select("id, title, course_id, courses:course_id(title)")
      .eq("id", id)
      .single();
    if (!gated) notFound();
    const { data: { user: gateUser } } = await supabase.auth.getUser();
    const gatedCourse = gated.courses as unknown as { title: string } | null;
    return (
      <LekcijaGate
        lessonTitle={gated.title as string}
        courseTitle={gatedCourse?.title ?? ""}
        loggedIn={!!gateUser}
      />
    );
  }
```

- [ ] **Step 3: Lint + build provera**

Run: `cd /Users/natasahartweger/Documents/Claude/sajt/LMS/lms && npx eslint src/components/LekcijaGate.tsx "src/app/lekcija/[id]/page.tsx" && npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 4: Commit**

```bash
git add src/components/LekcijaGate.tsx "src/app/lekcija/[id]/page.tsx"
git commit -m "feat(aktivacija): gate na lekciji za odjavljene umesto 404"
```

### Task 2: Nudge prozor 3 dana → 1 dan

**Files:**
- Modify: `src/app/api/cron/activation/route.ts:57` + komentar na vrhu fajla (linija 3)

- [ ] **Step 1: Promeni prozor**

Linija 57, zameni:

```ts
  const minAge = new Date(now - 3 * 86400000).toISOString();   // pristup stariji od 3 dana
```

sa:

```ts
  const minAge = new Date(now - 1 * 86400000).toISOString();   // pristup stariji od 24h (cron dnevno u 10 UTC → nudge stiže 24-48h od kupovine)
```

U komentaru na liniji 3 zameni `pristup star 3-30 dana` sa `pristup star 1-30 dana`.

- [ ] **Step 2: Dry-run provera logike (lokalno, gađa produkcionu bazu READ-ONLY)**

Run: `npm run dev` pa `curl -s -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/activation?dry=1"` (CRON_SECRET iz `.env.local`).
Expected: JSON `{ dry: true, totalEligible: N, wouldSend: M }` - broj sme da poraste u odnosu na raniji prozor, ništa se ne šalje i ne upisuje.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron/activation/route.ts
git commit -m "feat(aktivacija): prvi nudge na 24h umesto 3 dana"
```

**DEPLOY CHECKPOINT D1** - `vercel --prod` + smoke (obavezan hook): otvori /lekcija/<id> odjavljen → gate; ulogovan sa pristupom → normalna lekcija. NE deployovati bez Natašinog OK.

---

## DEPLOY 2 - login-link infrastruktura + mejlovi

### Task 3: `src/lib/login-link.ts` (TDD)

**Files:**
- Test: `src/lib/login-link.test.ts`
- Create: `src/lib/login-link.ts`

- [ ] **Step 1: Napiši padajući test**

```ts
// src/lib/login-link.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { createLoginLinkToken, verifyLoginLinkToken, isSafeNext } from "./login-link";

const DAY = 86400000;
const T0 = 1_750_000_000_000; // fiksna referentna tačka

beforeAll(() => {
  process.env.LOGIN_LINK_SECRET = "test-secret-za-vitest";
});

describe("isSafeNext", () => {
  it("prihvata relativne putanje", () => {
    expect(isSafeNext("/lekcija/abc")).toBe(true);
    expect(isSafeNext("/dashboard")).toBe(true);
    expect(isSafeNext("/kupovina/hvala/x?status=ok")).toBe(true);
  });
  it("odbija open-redirect oblike", () => {
    expect(isSafeNext("//zli.example")).toBe(false);
    expect(isSafeNext("https://zli.example")).toBe(false);
    expect(isSafeNext("javascript:alert(1)")).toBe(false);
    expect(isSafeNext("/putanja\\..")).toBe(false);
    expect(isSafeNext("")).toBe(false);
  });
});

describe("createLoginLinkToken + verifyLoginLinkToken", () => {
  it("okrugli put: potpiše pa verifikuje email i next", () => {
    const t = createLoginLinkToken({ email: "Kupac@Example.com", next: "/lekcija/l1" }, T0);
    const v = verifyLoginLinkToken(t, T0 + DAY);
    expect(v).toEqual({ email: "kupac@example.com", next: "/lekcija/l1" });
  });
  it("token je višekratan unutar roka", () => {
    const t = createLoginLinkToken({ email: "a@b.rs", next: "/lekcija/l1" }, T0);
    expect(verifyLoginLinkToken(t, T0 + DAY)).not.toBeNull();
    expect(verifyLoginLinkToken(t, T0 + 2 * DAY)).not.toBeNull();
  });
  it("ističe posle 7 dana (default)", () => {
    const t = createLoginLinkToken({ email: "a@b.rs", next: "/x" }, T0);
    expect(verifyLoginLinkToken(t, T0 + 7 * DAY - 1)).not.toBeNull();
    expect(verifyLoginLinkToken(t, T0 + 7 * DAY + 1)).toBeNull();
  });
  it("poštuje expiresInDays", () => {
    const t = createLoginLinkToken({ email: "a@b.rs", next: "/x", expiresInDays: 1 }, T0);
    expect(verifyLoginLinkToken(t, T0 + DAY + 1)).toBeNull();
  });
  it("odbija falsifikovan potpis i pokvaren format", () => {
    const t = createLoginLinkToken({ email: "a@b.rs", next: "/x" }, T0);
    const [body] = t.split(".");
    expect(verifyLoginLinkToken(`${body}.AAAA`, T0)).toBeNull();
    expect(verifyLoginLinkToken("nije-token", T0)).toBeNull();
    expect(verifyLoginLinkToken("", T0)).toBeNull();
    // izmenjen payload uz stari potpis
    const drugi = createLoginLinkToken({ email: "napadac@zli.rs", next: "/x" }, T0);
    const [, sig] = t.split(".");
    const [tudjBody] = drugi.split(".");
    expect(verifyLoginLinkToken(`${tudjBody}.${sig}`, T0)).toBeNull();
  });
  it("nesiguran next se normalizuje na /dashboard pri kreiranju", () => {
    const t = createLoginLinkToken({ email: "a@b.rs", next: "https://zli.example" }, T0);
    expect(verifyLoginLinkToken(t, T0)?.next).toBe("/dashboard");
  });
});
```

- [ ] **Step 2: Pokreni test - mora da PADNE**

Run: `npx vitest run src/lib/login-link.test.ts`
Expected: FAIL (modul ne postoji).

- [ ] **Step 3: Implementiraj `src/lib/login-link.ts`**

```ts
// src/lib/login-link.ts
// Login-link za mejlove: HMAC-potpisan token (email + next + rok) koji ruta
// /auth/mejl menja za SVEŽ Supabase magic link tek pri kliku. Zašto ne sirovi
// magic-link token u mejlu: ističe za ~1h, single-use, i svaki novi generateLink
// (npr. auto-login na nestpay callbacku) invalidira prethodni.
// Višekratan unutar roka (default 7 dana) - klik i sutra radi.
import { createHmac, timingSafeEqual } from "crypto";

interface LoginLinkPayload {
  email: string;
  next: string;
  exp: number; // epoch ms
}

function hmacKey(): string {
  const key = process.env.LOGIN_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!key) throw new Error("LOGIN_LINK_SECRET ili SUPABASE_SERVICE_ROLE_KEY mora biti postavljen");
  return key;
}

/** Relativna putanja bez open-redirect trikova (//host, protokoli, backslash). */
export function isSafeNext(next: string): boolean {
  return next.startsWith("/") && !next.startsWith("//") && !next.includes("\\");
}

export function createLoginLinkToken(
  o: { email: string; next: string; expiresInDays?: number },
  now: number = Date.now(),
): string {
  const next = isSafeNext(o.next) ? o.next : "/dashboard";
  const payload: LoginLinkPayload = {
    email: o.email.trim().toLowerCase(),
    next,
    exp: now + (o.expiresInDays ?? 7) * 86400000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", hmacKey()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyLoginLinkToken(
  token: string,
  now: number = Date.now(),
): { email: string; next: string } | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  let expected: Buffer;
  try {
    expected = createHmac("sha256", hmacKey()).update(body).digest();
  } catch {
    return null;
  }
  const given = Buffer.from(sig, "base64url");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  let payload: LoginLinkPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof payload.email !== "string" || !payload.email) return null;
  if (typeof payload.exp !== "number" || payload.exp < now) return null;
  const next = typeof payload.next === "string" && isSafeNext(payload.next) ? payload.next : "/dashboard";
  return { email: payload.email, next };
}
```

- [ ] **Step 4: Testovi prolaze**

Run: `npx vitest run src/lib/login-link.test.ts`
Expected: PASS (svi).

- [ ] **Step 5: Commit**

```bash
git add src/lib/login-link.ts src/lib/login-link.test.ts
git commit -m "feat(aktivacija): HMAC login-link token za mejlove (TDD)"
```

### Task 4: `src/lib/first-lesson.ts` (TDD)

**Files:**
- Test: `src/lib/first-lesson.test.ts`
- Create: `src/lib/first-lesson.ts`

- [ ] **Step 1: Napiši padajući test**

```ts
// src/lib/first-lesson.test.ts
import { describe, it, expect } from "vitest";
import { pickFirstLesson, type LessonLite } from "./first-lesson";

const L = (id: string, course_id: string, order_index: number | null): LessonLite =>
  ({ id, title: `Lekcija ${id}`, course_id, order_index });

describe("pickFirstLesson", () => {
  it("bira lekciju sa najmanjim order_index prvog kursa koji ima lekcije", () => {
    const lessons = [L("b", "k1", 2), L("a", "k1", 1), L("c", "k2", 0)];
    expect(pickFirstLesson(lessons, ["k1", "k2"])).toEqual({ id: "a", title: "Lekcija a" });
  });
  it("preskače kurs bez lekcija (paket/1:1) i uzima sledeći", () => {
    const lessons = [L("x", "k2", 5)];
    expect(pickFirstLesson(lessons, ["k1", "k2"])).toEqual({ id: "x", title: "Lekcija x" });
  });
  it("null order_index tretira kao 0", () => {
    const lessons = [L("n", "k1", null), L("m", "k1", 1)];
    expect(pickFirstLesson(lessons, ["k1"])).toEqual({ id: "n", title: "Lekcija n" });
  });
  it("vraća null kad nijedan kurs nema lekcije", () => {
    expect(pickFirstLesson([], ["k1"])).toBeNull();
    expect(pickFirstLesson([L("a", "drugi", 0)], ["k1"])).toBeNull();
  });
});
```

- [ ] **Step 2: Pokreni test - mora da PADNE**

Run: `npx vitest run src/lib/first-lesson.test.ts`
Expected: FAIL (modul ne postoji).

- [ ] **Step 3: Implementiraj `src/lib/first-lesson.ts`**

```ts
// src/lib/first-lesson.ts
// „Prva lekcija" za aktivacione tokove (welcome mejl, hvala stranica): kupljeni
// proizvod → course_unlocks → content kursevi → prva lekcija po order_index.
// Kursevi bez lekcija (paketi/1:1/grupni bez sadržaja) se preskaču.
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export interface LessonLite {
  id: string;
  title: string;
  course_id: string;
  order_index: number | null;
}

/** Čista logika izbora - prvi kurs iz redosleda koji ima lekcije, pa najmanji order_index. */
export function pickFirstLesson(
  lessons: LessonLite[],
  courseIdsInOrder: string[],
): { id: string; title: string } | null {
  for (const cid of courseIdsInOrder) {
    const inCourse = lessons
      .filter((l) => l.course_id === cid)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    if (inCourse.length > 0) return { id: inCourse[0].id, title: inCourse[0].title };
  }
  return null;
}

/** Prva lekcija za date CONTENT kurseve (redosled = prioritet). */
export async function firstLessonForCourses(
  admin: AdminClient,
  courseIds: string[],
): Promise<{ id: string; title: string } | null> {
  if (courseIds.length === 0) return null;
  const { data: lessons } = await admin
    .from("lessons")
    .select("id, title, course_id, order_index")
    .in("course_id", courseIds);
  return pickFirstLesson((lessons ?? []) as LessonLite[], courseIds);
}

/** Prva lekcija za stavke porudžbine (proizvod → course_unlocks → content kurs). */
export async function firstLessonForOrder(
  admin: AdminClient,
  items: { course_id: string }[],
): Promise<{ id: string; title: string } | null> {
  const purchasedIds = items.map((i) => i.course_id);
  if (purchasedIds.length === 0) return null;
  const { data: unlocks } = await admin
    .from("course_unlocks")
    .select("purchasable_course_id, content_course_id")
    .in("purchasable_course_id", purchasedIds);
  const contentIds: string[] = [];
  for (const pid of purchasedIds) {
    const mapped = (unlocks ?? []).filter((u) => u.purchasable_course_id === pid);
    // Bez unlocks mapiranja proizvod JESTE sadržaj (isto ponašanje kao grant-access).
    for (const cid of mapped.length > 0 ? mapped.map((u) => u.content_course_id) : [pid]) {
      if (!contentIds.includes(cid)) contentIds.push(cid);
    }
  }
  return firstLessonForCourses(admin, contentIds);
}
```

- [ ] **Step 4: Testovi prolaze**

Run: `npx vitest run src/lib/first-lesson.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/first-lesson.ts src/lib/first-lesson.test.ts
git commit -m "feat(aktivacija): first-lesson helper za welcome/hvala tokove (TDD)"
```

### Task 5: Ruta `/auth/mejl` + poruka na /prijava

**Files:**
- Create: `src/app/auth/mejl/route.ts`
- Modify: `src/lib/auth-messages.ts` (+ test `src/lib/auth-messages.test.ts`)
- Modify: `src/app/(auth)/prijava/page.tsx` (banner za `?greska=`)

- [ ] **Step 1: TDD za poruku - dopiši u `src/lib/auth-messages.test.ts`**

```ts
import { urlGreskaMessage } from "./auth-messages";

describe("urlGreskaMessage", () => {
  it("poruka za istekao/pokvaren mejl login-link", () => {
    expect(urlGreskaMessage("link")).toMatch(/istekao/i);
  });
  it("poruka za neuspešnu magic-link prijavu", () => {
    expect(urlGreskaMessage("auth")).toMatch(/link/i);
  });
  it("nepoznat kod → prazan string (bez banera)", () => {
    expect(urlGreskaMessage("nesto")).toBe("");
    expect(urlGreskaMessage(null)).toBe("");
  });
});
```

Run: `npx vitest run src/lib/auth-messages.test.ts` → FAIL (funkcija ne postoji).

- [ ] **Step 2: Dodaj u `src/lib/auth-messages.ts`**

```ts
// Baner na /prijava kad korisnik stigne sa ?greska= (redirect iz auth ruta).
// "link" = login-link iz mejla (auth/mejl) istekao ili pokvaren.
// "auth" = magic-link verifikacija nije prošla (postojeći redirect iz /auth/confirm i /auth/callback).
export function urlGreskaMessage(kod: string | null): string {
  if (kod === "link") {
    return "Link iz mejla je istekao. Ništa strašno - prijavi se ovde, traje pola minuta.";
  }
  if (kod === "auth") {
    return "Link za prijavu nije prošao (možda je već iskorišćen). Zatraži novi ovde.";
  }
  return "";
}
```

Run: `npx vitest run src/lib/auth-messages.test.ts` → PASS.

- [ ] **Step 3: Kreiraj `src/app/auth/mejl/route.ts`**

Pre pisanja proveri route-handler konvencije u `node_modules/next/dist/docs/`.

```ts
// src/app/auth/mejl/route.ts
// Login-link iz mejlova (welcome/nudge): verifikuje naš HMAC token pa TEK TADA
// generiše svež Supabase magic link i postavlja sesiju - vidi src/lib/login-link.ts
// zašto ne ide sirovi magic link u mejl. Neuspeh → /prijava?greska=link (baner).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyLoginLinkToken } from "@/lib/login-link";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const t = searchParams.get("t");
  const payload = t ? verifyLoginLinkToken(t) : null;
  if (!payload) {
    return NextResponse.redirect(`${origin}/prijava?greska=link`);
  }

  const admin = createAdminClient();
  const { data: link, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: payload.email,
  });
  if (error || !link?.properties?.hashed_token) {
    console.error(`[auth/mejl] generateLink pao za ${payload.email}:`, error?.message);
    return NextResponse.redirect(`${origin}/prijava?greska=link`);
  }

  const supabase = await createClient();
  const { error: otpError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (otpError) {
    console.error(`[auth/mejl] verifyOtp pao za ${payload.email}:`, otpError.message);
    return NextResponse.redirect(`${origin}/prijava?greska=link`);
  }

  console.log(`[auth/mejl] login-link prijava: ${payload.email} → ${payload.next}`);
  return NextResponse.redirect(`${origin}${payload.next}`);
}
```

- [ ] **Step 4: Baner na `/prijava`**

U `src/app/(auth)/prijava/page.tsx`: stranica je `"use client"`. Dodaj mali klijentski
podkomponent sa `useSearchParams` obavijen u `<Suspense>` (App Router zahteva Suspense
oko useSearchParams - proveri u docs):

```tsx
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { urlGreskaMessage } from "@/lib/auth-messages";

function GreskaBaner() {
  const params = useSearchParams();
  const poruka = urlGreskaMessage(params.get("greska"));
  if (!poruka) return null;
  return (
    <div role="alert" className="max-w-sm mx-auto mb-6 bg-[#FFF3F3] border border-[#F78687]/40 rounded-xl px-4 py-3 text-sm text-gray-700">
      {poruka}
    </div>
  );
}
```

i u JSX odmah iznad `<AuthForma ...>`:

```tsx
        <Suspense fallback={null}>
          <GreskaBaner />
        </Suspense>
```

- [ ] **Step 5: Lint + tsc**

Run: `npx eslint src/app/auth/mejl/route.ts src/lib/auth-messages.ts "src/app/(auth)/prijava/page.tsx" && npx tsc --noEmit`
Expected: čisto.

- [ ] **Step 6: Commit**

```bash
git add src/app/auth/mejl/route.ts src/lib/auth-messages.ts src/lib/auth-messages.test.ts "src/app/(auth)/prijava/page.tsx"
git commit -m "feat(aktivacija): /auth/mejl ruta menja login-link token za sesiju + baner na /prijava"
```

### Task 6: Welcome mejl sa login-linkom do prve lekcije

**Files:**
- Modify: `src/lib/email.ts` (`sendWelcomeEmail`, ~linija 42)
- Modify: `src/lib/grant-access.ts` (~linija 216)

NAPOMENA: `sendWelcomeEmail` zove i `api/wc-webhook/route.ts:111` sa 3 argumenta - novi parametar MORA biti opcion (webhook zadržava staro ponašanje).

- [ ] **Step 1: `sendWelcomeEmail` dobija opcioni `startUrl`**

Promeni potpis:

```ts
export async function sendWelcomeEmail(
  to: string,
  name: string,
  courseTitles: string[],
  opts?: { startUrl?: string },
) {
  const courseList = courseTitles.map((t) => `• ${t}`).join("\n");
  const startUrl = opts?.startUrl || `${SITE_URL}/prijava`;
```

U HTML-u zameni CTA liniju (postojeća ~88):

```html
        <a href="${startUrl}" style="display: inline-block; background: #4fb1d3; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">
          Započni prvu lekciju
        </a>
```

Zameni pasus „Prijavi se na platformu i započni prvu lekciju..." sa:

```html
      <p style="font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 20px;">
        Klikni na dugme ispod i odmah ulaziš u prvu lekciju. Pristup kursu važi <strong>godinu dana</strong> od kupovine.
      </p>
```

Zameni pasus „Prijava je bez lozinke..." (ispod dugmeta) sa uslovnim tekstom:

```html
      <p style="font-size: 13px; color: #999; line-height: 1.5; margin: 0 0 8px;">
        ${opts?.startUrl
          ? `Dugme te automatski prijavljuje. Ako link istekne, uđi na <a href="${SITE_URL}/prijava" style="color: #4fb1d3; text-decoration: none;">hartweger.rs/prijava</a> - bez lozinke, mejlom kojim si kupio/la kurs.`
          : "Prijava je bez lozinke - uneseš mejl kojim si kupio/la kurs i stigne ti link za ulazak."}
      </p>
```

- [ ] **Step 2: `grant-access.ts` gradi login-link**

Dodaj importe:

```ts
import { createLoginLinkToken } from "@/lib/login-link";
import { firstLessonForCourses } from "@/lib/first-lesson";
```

Zameni liniju 216:

```ts
  if (!grupniWelcomeSent && !individualWelcomeSent) await sendWelcomeEmail(order.email, order.full_name, items.map((i) => i.title));
```

sa:

```ts
  if (!grupniWelcomeSent && !individualWelcomeSent) {
    // Direktan login-link do prve lekcije - kupac iz mejla ulazi bez /prijava zida.
    // Best-effort: ako izračunavanje padne, mejl ide sa starim /prijava CTA.
    let startUrl: string | undefined;
    try {
      const fl = await firstLessonForCourses(admin, [...contentCourseIds]);
      const token = createLoginLinkToken({
        email: order.email,
        next: fl ? `/lekcija/${fl.id}` : "/dashboard",
      });
      startUrl = `${SITE_URL}/auth/mejl?t=${encodeURIComponent(token)}`;
    } catch (e) {
      console.error(`[grant] login-link za welcome pao (order ${orderId}):`, e);
    }
    await sendWelcomeEmail(order.email, order.full_name, items.map((i) => i.title), { startUrl });
  }
```

- [ ] **Step 3: Lint + tsc + postojeći testovi**

Run: `npx eslint src/lib/email.ts src/lib/grant-access.ts && npx tsc --noEmit && npx vitest run`
Expected: čisto, svi testovi PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/email.ts src/lib/grant-access.ts
git commit -m "feat(aktivacija): welcome mejl vodi login-linkom pravo u prvu lekciju"
```

### Task 7: Nudge mejl sa login-linkom

**Files:**
- Modify: `src/lib/email.ts` (`sendActivationNudge`, ~linija 1050)
- Modify: `src/app/api/cron/activation/route.ts` (oba poziva: test ~48, glavni ~119)

- [ ] **Step 1: `sendActivationNudge` dobija opcioni `startUrl`**

Promeni potpis i liniju 1056:

```ts
export async function sendActivationNudge(o: {
  email: string; name: string; courseTitle: string; lessonId: string | null; lessonTitle: string | null;
  /** Direktan login-link (/auth/mejl token). Bez njega pada na goli /lekcija ili /dashboard. */
  startUrl?: string;
}) {
  try {
    const resend = getResend();
    if (!resend) return;
    const startUrl = o.startUrl ?? (o.lessonId ? `${SITE_URL}/lekcija/${o.lessonId}` : `${SITE_URL}/dashboard`);
```

(ostatak HTML-a već koristi `${startUrl}` - samo se izvor promenio).

- [ ] **Step 2: Cron gradi token po kandidatu**

U `src/app/api/cron/activation/route.ts` dodaj importe:

```ts
import { createLoginLinkToken } from "@/lib/login-link";
import { SITE_URL } from "@/lib/site-url";
```

Dodaj helper iznad `GET`:

```ts
// Login-link do prve lekcije: korisnik iz mejla ulazi ULOGOVAN (vidi src/lib/login-link.ts).
function startUrlFor(email: string, lessonId: string | null): string {
  const token = createLoginLinkToken({ email, next: lessonId ? `/lekcija/${lessonId}` : "/dashboard" });
  return `${SITE_URL}/auth/mejl?t=${encodeURIComponent(token)}`;
}
```

U TEST grani (~48) dodaj u objekat: `startUrl: startUrlFor(testEmail, lesson?.id ?? null),`
U glavnoj petlji (~119) dodaj u objekat: `startUrl: startUrlFor(prof.email, fl?.id ?? null),`

- [ ] **Step 3: Lint + tsc**

Run: `npx eslint src/app/api/cron/activation/route.ts src/lib/email.ts && npx tsc --noEmit`
Expected: čisto.

- [ ] **Step 4: Smoke test mejla (šalje JEDAN pravi mejl na Natašin inbox)**

Run (dev server): `curl -s -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/activation?test=info@hartweger.rs"`
Expected: `{ test: ..., sent: 1 }`; u mejlu dugme vodi na `https://www.hartweger.rs/auth/mejl?t=...` (produkcioni SITE_URL - link radi tek posle D2 deploya; format i token se verifikuju odmah).

- [ ] **Step 5: Commit**

```bash
git add src/lib/email.ts src/app/api/cron/activation/route.ts
git commit -m "feat(aktivacija): nudge mejl vodi login-linkom pravo u prvu lekciju"
```

**DEPLOY CHECKPOINT D2** - `vercel --prod` + smoke: `/auth/mejl?t=nevazeci` → redirect `/prijava?greska=link` + baner; `?test=` nudge mejl → klik na dugme → sesija + prva lekcija. NE deployovati bez Natašinog OK.

---

## DEPLOY 3 - novčani put: callback auto-login + hvala CTA

### Task 8: NestPay callback auto-login

**Files:**
- Modify: `src/app/api/nestpay/callback/route.ts:59`

- [ ] **Step 1: Zameni završni redirect**

Zameni:

```ts
  return NextResponse.redirect(`${base}/kupovina/hvala/${order.id}?status=ok`, { status: 303 });
```

sa:

```ts
  // Auto-login: callback stiže KROZ KUPČEV BROWSER (303 lanac), pa sesiju postavljamo
  // u istom lancu: generateLink → /auth/confirm (verifyOtp + cookie) → hvala.
  // Best-effort: ako padne, kupac ide na hvala odjavljen (staro ponašanje) -
  // plaćanje nikad ne zavisi od logina. Idempotentni replay (gore) NE loguje ponovo.
  const hvalaPath = `/kupovina/hvala/${order.id}?status=ok`;
  try {
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: order.email,
    });
    if (!linkError && link?.properties?.hashed_token) {
      return NextResponse.redirect(
        `${base}/auth/confirm?token_hash=${link.properties.hashed_token}&type=magiclink&next=${encodeURIComponent(hvalaPath)}`,
        { status: 303 },
      );
    }
    console.error(`[nestpay] generateLink za auto-login pao (order ${oid}):`, linkError?.message);
  } catch (e) {
    console.error(`[nestpay] auto-login pao (order ${oid}):`, e);
  }
  return NextResponse.redirect(`${base}${hvalaPath}`, { status: 303 });
```

- [ ] **Step 2: Lint + tsc**

Run: `npx eslint src/app/api/nestpay/callback/route.ts && npx tsc --noEmit`
Expected: čisto.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/nestpay/callback/route.ts
git commit -m "feat(aktivacija): auto-login posle uspešne kartice (callback → auth/confirm → hvala)"
```

### Task 9: Hvala stranica - CTA „Započni prvu lekciju" za ulogovane

**Files:**
- Modify: `src/app/kupovina/hvala/[orderId]/page.tsx`

- [ ] **Step 1: Učitaj sesiju + prvu lekciju**

Dodaj importe:

```tsx
import { createClient } from "@/lib/supabase/server";
import { firstLessonForOrder } from "@/lib/first-lesson";
```

Posle `if (!order) notFound();` dodaj:

```tsx
  // Posle kartičnog auto-logina (D3) kupac stiže ULOGOVAN - CTA vodi pravo u prvu
  // lekciju umesto na /prijava. Stranica ostaje landing zbog browser Pixel Purchase.
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  const isCardPaid = (order.payment_method === "kartica" || order.payment_method === "kartica_rate");
  let firstLessonId: string | null = null;
  if (user && isCardPaid) {
    firstLessonId = (await firstLessonForOrder(supabase, items ?? []))?.id ?? null;
  }
```

PAZI: `items` se definiše odmah ispod - premesti ovaj blok POSLE `const items = ...` linije. `isCard` promenljiva već postoji niže - iskoristi nju umesto duplog `isCardPaid` ako redosled dozvoljava (definisana je pre JSX-a).

- [ ] **Step 2: Uslovni CTA**

Zameni success poruku (status=ok blok):

```tsx
            <p className="mt-1">{user ? "Pristup kursu je aktiviran i već si prijavljen/a - kreni odmah." : "Pristup kursu je aktiviran. Poslali smo ti email - prijavi se i počni."}</p>
```

Zameni CTA blok na dnu:

```tsx
        <div className="flex flex-wrap items-center gap-4">
          {user && isCard && status === "ok" ? (
            <Link
              href={firstLessonId ? `/lekcija/${firstLessonId}` : "/dashboard"}
              className="inline-block px-6 py-3 rounded-lg font-semibold text-white text-sm bg-plava hover:bg-plava-dark transition-colors"
            >
              {firstLessonId ? "Započni prvu lekciju →" : "Idi na svoje kurseve →"}
            </Link>
          ) : (
            <Link
              href="/prijava"
              className="inline-block px-6 py-3 rounded-lg font-semibold text-white text-sm bg-plava hover:bg-plava-dark transition-colors"
            >
              Prijavi se da vidiš kurs
            </Link>
          )}
          <Link href="/kursevi" className="text-sm text-plava hover:underline">
            ← Nazad na kurseve
          </Link>
        </div>
```

- [ ] **Step 3: Lint + tsc + build**

Run: `npx eslint "src/app/kupovina/hvala/[orderId]/page.tsx" && npx tsc --noEmit && npm run build`
Expected: čisto; build prolazi.

- [ ] **Step 4: Commit**

```bash
git add "src/app/kupovina/hvala/[orderId]/page.tsx"
git commit -m "feat(aktivacija): hvala CTA vodi ulogovanog pravo u prvu lekciju"
```

### Task 10: Puna verifikacija + smoke lista

- [ ] **Step 1: Ceo test suite + build**

Run: `npx vitest run && npm run build`
Expected: svi testovi PASS, build čist.

- [ ] **Step 2: Lokalni smoke (dev server, gađa produkcioni Supabase - samo čitanja i test nalozi)**

1. `/lekcija/<id realne lekcije>` bez sesije → gate ekran (ne 404, ne sadržaj lekcije).
2. `/auth/mejl?t=nevazeci-token` → redirect `/prijava?greska=link` + baner.
3. Generisan važeći token (node skripta sa `.env.local` secretom) za TEST nalog →
   `/auth/mejl?t=...` → Set-Cookie + redirect na next; drugi klik isto radi (višekratan).
4. `cron/activation?dry=1` → očekivan broj kandidata; `?test=info@hartweger.rs` → mejl
   sa `/auth/mejl?t=` dugmetom.
5. Hvala stranica postojeće porudžbine `?status=ok` bez sesije → stari CTA „Prijavi se".

- [ ] **Step 3: Deploy plan (SAMO uz Natašin OK, jedan po jedan, smoke posle svakog)**

1. D1 (Task 1-2) → smoke: gate + dry-run.
2. D2 (Task 3-7) → smoke: /auth/mejl error put + test nudge mejl klik.
3. D3 (Task 8-9) → smoke: test kartična kupovina malog iznosa ili prva prava kupovina
   uz praćenje Sentry/logova; provera da hvala pokazuje „Započni prvu lekciju →" i da
   je kupac ulogovan.

---

## Self-review (urađen)

- Spec pokrivenost: O1→Task 8, O2→Task 9, O3→Task 3+5, O4→Task 6, O5→Task 2+7, O6→Task 1. ✓
- Bez placeholder-a; svi koraci imaju kod/komande. ✓
- Konzistentnost tipova: `createLoginLinkToken({email,next,expiresInDays})`, `verifyLoginLinkToken(token,now)`, `pickFirstLesson(lessons,courseIds)`, `firstLessonForCourses(admin,courseIds)`, `firstLessonForOrder(admin,items)` - ujednačeno kroz taskove. ✓
- wc-webhook poziv sendWelcomeEmail sa 3 argumenta ostaje validan (4. param opcion). ✓
