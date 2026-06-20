# Prijava lozinka-prvo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prebaciti `/prijava` na email+lozinku kao glavni način, čistu stranicu, sa kontekstualnom porukom o staroj lozinki i jasnim putem za pravljenje lozinke preko mejla.

**Architecture:** Čista logika poruka o grešci ide u testabilni `src/lib/auth-messages.ts`. `AuthForma` se prerađuje da lozinka bude vidljiva i glavna, a magic link postaje tercijarna opcija. Pravljenje lozinke koristi POSTOJEĆI `/reset-lozinke` flow (link → `/auth/callback?next=/profil`, gde `/profil` već ima polje za lozinku) — bez nove stranice, minimalno diranja auth-a. Aktivacioni mejl-šablon se prepravlja da gura pravljenje lozinke umesto magic linka.

**Tech Stack:** Next.js (App Router, client komponente), Supabase Auth (`signInWithPassword`, `resetPasswordForEmail`, `signInWithOtp`), vitest, Resend (mejl).

**Spec:** `docs/superpowers/specs/2026-06-20-prijava-lozinka-prvo-design.md`

## File Structure

- **Create** `src/lib/auth-messages.ts` — pure funkcija `loginErrorMessage` (poruka za neuspelu prijavu). Jedina testabilna logika. CTA „Napravi lozinku" je trajni link u formi, pa ne treba zasebna logika za njega.
- **Create** `src/lib/auth-messages.test.ts` — vitest testovi za gornje.
- **Modify** `src/components/AuthForma.tsx` — lozinka-prvo: email+lozinka uvek vidljivi u prijavi, „Prijavi se" glavno dugme, magic link kao tercijarna opcija, sekundarni linkovi „Napravi lozinku" / „Zaboravljena lozinka".
- **Modify** `src/app/(auth)/prijava/page.tsx` — koristi `loginErrorMessage` umesto fiksne poruke.
- **Modify** `src/app/(auth)/reset-lozinke/page.tsx` — preimenovati u „Napravi lozinku" okvir + ti-forma (skinuti persiranje).
- **Modify** `scripts/send-aktivacija-reminder.ts` — tekst mejla: stara lozinka ne važi + dugme vodi na pravljenje lozinke (NE pokreće slanje).

Magic link ostaje u kodu (rezerva), Google ostaje na vrhu — nikom se ne oduzima način ulaza.

---

### Task 1: `auth-messages` helper (TDD)

**Files:**
- Create: `src/lib/auth-messages.ts`
- Test: `src/lib/auth-messages.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/auth-messages.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { loginErrorMessage } from "./auth-messages";

describe("loginErrorMessage", () => {
  it("za pogrešnu/nepostojeću lozinku vraća poruku o staroj lozinki", () => {
    const msg = loginErrorMessage({ status: 400, message: "Invalid login credentials" });
    expect(msg).toContain("stara lozinka ovde ne važi");
  });

  it("prepoznaje invalid credentials i bez status koda (po poruci)", () => {
    const msg = loginErrorMessage({ message: "Invalid login credentials" });
    expect(msg).toContain("stara lozinka ovde ne važi");
  });

  it("za 429 vraća poruku o previše pokušaja", () => {
    expect(loginErrorMessage({ status: 429 })).toContain("Previše pokušaja");
  });

  it("za null vraća prazan string", () => {
    expect(loginErrorMessage(null)).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- auth-messages`
Expected: FAIL — `Cannot find module './auth-messages'`.

- [ ] **Step 3: Write minimal implementation**

`src/lib/auth-messages.ts`:

```ts
export interface AuthErrorLike {
  message?: string;
  status?: number | null;
}

function isInvalidCredentials(error: AuthErrorLike): boolean {
  const msg = (error.message ?? "").toLowerCase();
  return error.status === 400 || msg.includes("invalid login credentials");
}

// Poruka koja se prikazuje kad prijava lozinkom ne uspe.
export function loginErrorMessage(error: AuthErrorLike | null): string {
  if (!error) return "";
  if (isInvalidCredentials(error)) {
    return "Lozinka nije prošla. Ako si ranije bio/la na staroj platformi, stara lozinka ovde ne važi - napravi novu za 30 sekundi.";
  }
  if (error.status === 429) {
    return "Previše pokušaja. Sačekaj minut pa probaj ponovo.";
  }
  return "Trenutno ne možemo da te prijavimo. Pokušaj ponovo za koji trenutak.";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- auth-messages`
Expected: PASS (4 testa).

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth-messages.ts src/lib/auth-messages.test.ts
git commit -m "feat(auth): helper za poruke prijave (stara lozinka ne vazi)"
```

---

### Task 2: AuthForma — lozinka-prvo

**Files:**
- Modify: `src/components/AuthForma.tsx` (kompletna zamena sadržaja)

Napomena: ovo je UI komponenta (client) — nema unit testa; provera je build + ručni smoke test u Tasku 6.

- [ ] **Step 1: Zameni ceo sadržaj `src/components/AuthForma.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/client";

interface AuthFormaProps {
  tip: "prijava" | "reset";
  onSubmit: (data: { email: string; password: string }) => Promise<string | null>;
}

export default function AuthForma({ tip, onSubmit }: AuthFormaProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [greska, setGreska] = useState<string | null>(null);
  const [uspeh, setUspeh] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [noAccount, setNoAccount] = useState(false);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleMagicLink = async () => {
    const cistEmail = email.trim();
    if (!cistEmail) {
      setGreska("Unesi email adresu pa onda pošalji link.");
      return;
    }
    setGreska(null);
    setUspeh(null);
    setNoAccount(false);
    setMagicLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: cistEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: window.location.origin + "/auth/callback",
      },
    });
    if (error) {
      Sentry.captureException(error);
      const status = error.status;
      if (status === 429) {
        setGreska("Previše pokušaja. Sačekaj minut pa probaj ponovo.");
      } else if (typeof status === "number" && status >= 400 && status < 500) {
        // 4xx (npr. 422 „signups not allowed") = nema naloga sa tim mejlom
        setNoAccount(true);
      } else {
        setGreska("Trenutno ne možemo da pošaljemo link. Pokušaj ponovo za koji trenutak.");
      }
    } else {
      setMagicLinkSent(true);
    }
    setMagicLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGreska(null);
    setUspeh(null);
    setNoAccount(false);
    setLoading(true);
    const result = await onSubmit({ email, password });
    if (result) {
      if (result.startsWith("OK:")) {
        setUspeh(result.slice(3));
      } else {
        setGreska(result);
      }
    }
    setLoading(false);
  };

  if (magicLinkSent) {
    return (
      <div className="w-full max-w-sm space-y-3">
        <div role="alert" className="bg-green-50 text-green-800 px-4 py-3 rounded-lg text-sm">
          Link za prijavu je poslat na <strong>{email}</strong>. Proveri inbox (i spam folder).
        </div>
        <button
          type="button"
          onClick={() => setMagicLinkSent(false)}
          className="w-full text-sm text-plava hover:underline"
        >
          Pogrešan mejl? Pošalji ponovo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-sm">
      {tip === "prijava" && (
        <>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? "Učitavanje..." : "Nastavi sa Google"}
          </button>
          <p className="text-xs text-gray-400 text-center -mt-1">
            Imaš @gmail nalog? Ovo je najbrže - bez čekanja mejla.
          </p>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">ili</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-plava focus:border-transparent"
            placeholder="tvoj@email.com"
          />
        </div>

        {tip === "prijava" && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Lozinka
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-plava focus:border-transparent"
              placeholder="Tvoja lozinka"
            />
          </div>
        )}

        {greska && (
          <div role="alert" className="bg-koral-light text-koral-dark px-4 py-3 rounded-lg text-sm">
            {greska}
          </div>
        )}

        {uspeh && (
          <div className="bg-plava-light text-plava-dark px-4 py-3 rounded-lg text-sm">
            {uspeh}
          </div>
        )}

        {noAccount && (
          <div role="alert" className="bg-koral-light text-koral-dark px-4 py-3 rounded-lg text-sm">
            Nemamo nalog sa tim mejlom. Da li si kupio/la kurs?{" "}
            <Link href="/kursevi" className="underline font-medium">
              Pogledaj kurseve
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-plava text-white py-3 rounded-lg font-medium hover:bg-plava-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Učitavanje..." : tip === "reset" ? "Pošalji mi link" : "Prijavi se"}
        </button>
      </form>

      {tip === "prijava" && (
        <div className="space-y-2 text-sm text-center">
          <Link href="/reset-lozinke" className="block text-plava hover:underline font-medium">
            Prvi put ovde ili nemaš lozinku? Napravi je
          </Link>
          <Link href="/reset-lozinke" className="block text-gray-500 hover:underline">
            Zaboravio/la si lozinku?
          </Link>
          <button
            type="button"
            onClick={handleMagicLink}
            disabled={magicLoading}
            className="w-full text-gray-400 hover:underline disabled:opacity-50"
          >
            {magicLoading ? "Slanje..." : "Radije bez lozinke? Pošalji mi link na mejl"}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build/lint provera**

Run: `npm run lint && npm run build`
Expected: bez grešaka (komponenta se kompajlira; nema neiskorišćenih simbola — `passwordMode` je uklonjen).

- [ ] **Step 3: Commit**

```bash
git add src/components/AuthForma.tsx
git commit -m "feat(auth): AuthForma lozinka-prvo, magic link kao rezerva"
```

---

### Task 3: Prijava stranica koristi helper

**Files:**
- Modify: `src/app/(auth)/prijava/page.tsx:12-18`

- [ ] **Step 1: Dodaj import i zameni telo `handleLogin`**

U `src/app/(auth)/prijava/page.tsx`, dodaj import na vrh (uz ostale):

```tsx
import { loginErrorMessage } from "@/lib/auth-messages";
```

Zameni funkciju `handleLogin`:

```tsx
  const handleLogin = async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return loginErrorMessage(error);
    router.push("/dashboard");
    return null;
  };
```

- [ ] **Step 2: Build provera**

Run: `npm run build`
Expected: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(auth)/prijava/page.tsx"
git commit -m "feat(auth): prijava koristi loginErrorMessage (poruka o staroj lozinki)"
```

---

### Task 4: reset-lozinke → „Napravi lozinku" + ti-forma

**Files:**
- Modify: `src/app/(auth)/reset-lozinke/page.tsx`

- [ ] **Step 1: Zameni ceo sadržaj `src/app/(auth)/reset-lozinke/page.tsx`**

```tsx
"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthForma from "@/components/AuthForma";

export default function ResetLozinke() {
  const supabase = createClient();

  const handleReset = async ({ email }: { email: string }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/profil`,
    });
    if (error) return "Greška pri slanju linka. Pokušaj ponovo.";
    return "OK:Link je poslat na tvoj email. Otvori ga i postavi lozinku.";
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-plava mb-2">Napravi novu lozinku</h1>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          Unesi svoj email pa ti šaljemo link da postaviš lozinku. Ako si ranije bio/la na staroj
          platformi, stara lozinka ovde ne važi - ovde praviš novu.
        </p>

        <AuthForma tip="reset" onSubmit={handleReset} />

        <p className="mt-6 text-sm text-gray-500">
          <Link href="/prijava" className="text-plava hover:underline">
            Nazad na prijavu
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build provera**

Run: `npm run build`
Expected: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(auth)/reset-lozinke/page.tsx"
git commit -m "feat(auth): reset-lozinke -> Napravi lozinku okvir + ti-forma"
```

---

### Task 5: Aktivacioni mejl — gura pravljenje lozinke

**Files:**
- Modify: `scripts/send-aktivacija-reminder.ts:24` i `:46-47`

Napomena: menja se SAMO tekst šablona. NE pokrećemo slanje (masovno slanje 409 je zaseban korak posle smoke testa).

- [ ] **Step 1: Promeni SUBJECT (linija 24)**

Iz:
```ts
const SUBJECT = "Tvoj kurs te čeka — uđi za 30 sekundi 🇩🇪";
```
U:
```ts
const SUBJECT = "Tvoj kurs te čeka — napravi lozinku i uđi 🇩🇪";
```

- [ ] **Step 2: Zameni uputstvo i dugme (linije 46-47)**

Zameni blok „Prijava traje 30 sekundi, bez lozinke" (linija 46) ovim:

```ts
<div style="background:#f8fcfd;border-left:3px solid #4fb1d3;border-radius:6px;padding:16px 18px;margin:0 0 22px"><div style="font-size:15px;line-height:1.7;color:#1a1a2e"><strong>Napravi lozinku i uđi:</strong><br>1. Klikni na dugme ispod<br>2. Ukucaj svoj mejl (ovaj na koji si dobio/la poruku)<br>3. Stigne ti link — postaviš lozinku i unutra si 🎉<br><br><span style="font-size:13px;color:#666">Ako si ranije koristio/la staru platformu, tvoja stara lozinka tamo ovde ne važi — zato praviš novu.</span></div></div>
```

I zameni dugme (linija 47):

```ts
<div style="text-align:center;margin:26px 0"><a href="https://www.hartweger.rs/reset-lozinke" style="display:inline-block;background:#4fb1d3;color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 34px;border-radius:8px">Napravi lozinku →</a></div>
```

- [ ] **Step 3: Provera da skripta i dalje kompajlira (bez slanja)**

Run: `npx tsc --noEmit scripts/send-aktivacija-reminder.ts 2>&1 | head` (ako projekat nema zaseban tsconfig za scripts, dovoljno je `npm run build`).
Expected: bez TS grešaka u izmenjenom fajlu. NE pokretati skriptu.

- [ ] **Step 4: Commit**

```bash
git add scripts/send-aktivacija-reminder.ts
git commit -m "feat(mejl): aktivacioni mejl gura pravljenje lozinke umesto magic linka"
```

---

### Task 6: Build, ručni smoke test, deploy

**Files:** nijedan (verifikacija + deploy)

- [ ] **Step 1: Pun test + build**

Run: `npm run test && npm run lint && npm run build`
Expected: svi testovi prolaze (uključujući `auth-messages`), lint čist, build uspešan.

- [ ] **Step 2: Lokalni ručni smoke (dev) — proveri svaki scenario**

Run: `npm run dev`, otvori `http://localhost:3000/prijava` i proveri:
- Stranica je čista: Google gore, email+lozinka vidljivi, „Prijavi se" glavno, tri linka dole. Nema upozorenja u podrazumevanom stanju.
- Pogrešna lozinka → ispod forme se pojavi poruka „...stara lozinka ovde ne važi...". Link „Napravi je" je vidljiv.
- Ispravna lozinka (test nalog koji ima lozinku) → ulazak na `/dashboard`.
- „Radije bez lozinke? Pošalji mi link na mejl" → magic link se šalje (prikaže se „Link za prijavu je poslat").
- `/reset-lozinke` → naslov „Napravi novu lozinku", tekst na „ti", slanje vrati „Link je poslat na tvoj email...".

Expected: svi scenariji rade kako je opisano.

- [ ] **Step 3: Deploy na produkciju**

Run: `vercel --prod` (iz `LMS/lms`).
Napomena: PostToolUse hook automatski pokreće smoke-deploy na `/lekcija/[id]` posle `vercel --prod` (vidi [[feedback_deploy_smoke_test]]).

- [ ] **Step 4: Smoke na produkciji (auth ručno)**

Otvori `https://www.hartweger.rs/prijava` i ponovi ključne provere iz Step 2 (čista stranica, pogrešna lozinka → poruka, prijava lozinkom radi, magic link stiže, `/reset-lozinke` ti-forma). Auth nije pokriven automatskim smoke testom — mora ručno.
Expected: produkcija se ponaša isto kao lokal.

- [ ] **Step 5: Commit (ako je ostalo nekomitovanih izmena) i kraj**

```bash
git status
# ako ima zaostalih izmena:
# git add -A && git commit -m "chore(auth): finalne sitnice za lozinka-prvo prijavu"
```

---

## Posle plana (van ovog plana, zaseban korak)

Kad je sve gore potvrđeno na produkciji: poslati grupi od 409 nikad-ulogovanih izmenjeni aktivacioni mejl (`scripts/send-aktivacija-reminder.ts`). Meri se danima, ne nedeljama. Realno očekivanje: vraćamo dobar deo, ne sve (mejl je usko grlo). Vidi spec, sekcija „Prioritet i realna očekivanja".
