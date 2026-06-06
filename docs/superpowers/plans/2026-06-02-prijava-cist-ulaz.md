# Prijava "Čist ulaz" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preurediti `/prijava` tako da su magic link i Google glavni put ulaska, lozinka opciona (sklopiva), a samostalna registracija uklonjena.

**Architecture:** Tri tačke izmene — (1) `AuthForma` komponenta dobija obrnut podrazumevani prikaz (magic link default, lozinka iza prekidača), (2) `/prijava` stranica menja copy na "ti" i donje linkove, (3) `/registracija` postaje server redirect na `/prijava`. Bez diranja checkout-a, migracije i `course_access` logike.

**Tech Stack:** Next.js 16 (App Router), React client komponente, Supabase Auth (`@/lib/supabase/client`), Tailwind. **Projekat nema test framework** — verifikacija ide kroz `npm run build` (radi typecheck + lint) i ručni smoke na dev serveru. Ne uvodi se test framework (YAGNI za copy/layout izmenu).

**Spec:** `docs/superpowers/specs/2026-06-02-prijava-cist-ulaz-design.md`

---

## File Structure

- `src/components/AuthForma.tsx` — **Modify (rewrite).** Prikaz: za `tip="prijava"` default je magic link (mejl + "Pošalji mi link na mejl"), lozinka iza prekidača "Imam lozinku". Magic link koristi `shouldCreateUser: false` i prikazuje "nemamo nalog" blok sa linkom na `/kursevi`. Uklanja se `tip="registracija"`.
- `src/app/(auth)/prijava/page.tsx` — **Modify.** Copy na "ti", error poruka na "ti", donji blok linkova: ukloniti "Registrujte se", dodati "Nemaš još kurs? → Kursevi". Link za reset lozinke se uklanja sa ove stranice (sad je unutar `AuthForma` password sekcije).
- `src/app/(auth)/registracija/page.tsx` — **Modify (rewrite).** Server komponenta koja poziva `redirect("/prijava")`.

---

## Task 1: Rewrite AuthForma — magic link default, sklopiva lozinka

**Files:**
- Modify: `src/components/AuthForma.tsx` (cela zamena)

- [ ] **Step 1: Zameni ceo sadržaj `src/components/AuthForma.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
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
  const [passwordMode, setPasswordMode] = useState(false);
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
    if (!email) {
      setGreska("Unesi email adresu.");
      return;
    }
    setGreska(null);
    setUspeh(null);
    setNoAccount(false);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: window.location.origin + "/auth/callback",
      },
    });
    if (error) {
      setNoAccount(true);
    } else {
      setMagicLinkSent(true);
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGreska(null);
    setUspeh(null);
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tip === "prijava" && !passwordMode) {
      handleMagicLink();
      return;
    }
    handlePasswordSubmit(e);
  };

  if (magicLinkSent) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-green-50 text-green-800 px-4 py-3 rounded-lg text-sm">
          Link za prijavu je poslat na <strong>{email}</strong>. Proveri inbox (i spam folder).
        </div>
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

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">ili</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-4 w-full max-w-sm">
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

        {tip === "prijava" && passwordMode && (
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
          <div className="bg-koral-light text-koral-dark px-4 py-3 rounded-lg text-sm">
            {greska}
          </div>
        )}

        {uspeh && (
          <div className="bg-plava-light text-plava-dark px-4 py-3 rounded-lg text-sm">
            {uspeh}
          </div>
        )}

        {noAccount && (
          <div className="bg-koral-light text-koral-dark px-4 py-3 rounded-lg text-sm">
            Nemamo nalog sa tim mejlom. Da li si kupio kurs?{" "}
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
          {loading
            ? tip === "prijava" && !passwordMode
              ? "Slanje..."
              : "Učitavanje..."
            : tip === "reset"
            ? "Pošalji link za reset"
            : passwordMode
            ? "Prijavi se"
            : "Pošalji mi link na mejl"}
        </button>
      </form>

      {tip === "prijava" && (
        <div className="space-y-2 text-sm text-center">
          <button
            type="button"
            onClick={() => {
              setPasswordMode(!passwordMode);
              setGreska(null);
              setNoAccount(false);
            }}
            className="w-full text-plava hover:underline"
          >
            {passwordMode ? "← Uđi linkom na mejl (bez lozinke)" : "Imam lozinku"}
          </button>
          {passwordMode && (
            <Link href="/reset-lozinke" className="block text-plava hover:underline">
              Zaboravio/la si lozinku? Napravi novu
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build (radi typecheck + lint)**

Run: `npm run build`
Expected: PASS — build prolazi bez TypeScript/ESLint grešaka. (`tip="registracija"` više ne postoji u tipu; Task 3 uklanja jedino preostalo korišćenje pre nego što ovo bude relevantno, ali pošto Task 1 ide prvi, očekuj da `registracija/page.tsx` još uvek koristi staru `AuthForma` — zato build ovog koraka može da prijavi grešku u `registracija/page.tsx`. Ako prijavi, to je očekivano i rešava se u Task 3. Da izolovano proveriš Task 1, privremeno preskoči dok Task 3 ne prođe, ili izvrši Task 3 odmah posle Task 1 pre build-a.)

> **Napomena za izvršioca:** Da se izbegne prelazni build lom, izvrši **Task 1 → Task 3 → Task 2**, pa onda pokreni `npm run build`. Commit-uj posle svakog task-a; build gate pokreni na kraju Task 2.

- [ ] **Step 3: Commit**

```bash
git add src/components/AuthForma.tsx
git commit -m "AuthForma: magic link kao podrazumevan, lozinka sklopiva, shouldCreateUser:false"
```

---

## Task 2: Update /prijava — copy na "ti", donji linkovi

**Files:**
- Modify: `src/app/(auth)/prijava/page.tsx`

- [ ] **Step 1: Zameni ceo sadržaj `src/app/(auth)/prijava/page.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthForma from "@/components/AuthForma";

export default function Prijava() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error)
      return 'Email ili lozinka nisu tačni. Ako nemaš lozinku, vrati se i uđi linkom na mejl ili preko Google.';
    router.push("/dashboard");
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-plava mb-2">Prijava za polaznike</h1>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          Kupio/la si kurs u Hartweger centru? Uđi ovde da pristupiš svojim lekcijama i materijalima.
        </p>

        <AuthForma tip="prijava" onSubmit={handleLogin} />

        <div className="mt-6 text-sm text-gray-500">
          <p>
            Nemaš još kurs?{" "}
            <Link href="/kursevi" className="text-plava hover:underline">
              Pogledaj kurseve
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(auth)/prijava/page.tsx"
git commit -m "Prijava: copy na ti, ukloni registraciju iz linkova, dodaj link na kurseve"
```

---

## Task 3: /registracija → server redirect na /prijava

**Files:**
- Modify: `src/app/(auth)/registracija/page.tsx` (cela zamena)

- [ ] **Step 1: Zameni ceo sadržaj `src/app/(auth)/registracija/page.tsx`**

```tsx
import { redirect } from "next/navigation";

export default function Registracija() {
  redirect("/prijava");
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(auth)/registracija/page.tsx"
git commit -m "Registracija: redirect na /prijava (samostalna registracija uklonjena)"
```

---

## Task 4: Build gate + ručni smoke

**Files:** (nema izmena koda — samo verifikacija)

- [ ] **Step 1: Pun build (typecheck + lint)**

Run: `npm run build`
Expected: PASS — bez TypeScript i ESLint grešaka. Nema preostalih referenci na `tip="registracija"` ni na `/registracija` link u `prijava`.

- [ ] **Step 2: Pokreni dev server**

Run: `npm run dev`
Expected: server podignut na `http://localhost:3000`.

- [ ] **Step 3: Ručni smoke (otvori u browseru)**

Proveri redom:
1. `http://localhost:3000/prijava` — odmah vidljivi: dugme "Nastavi sa Google", polje Email i dugme "Pošalji mi link na mejl". Dole: "Nemaš još kurs? Pogledaj kurseve" i sitno "Imam lozinku".
2. Klik "Imam lozinku" → pojavi se polje Lozinka, dugme postane "Prijavi se", i link "Zaboravio/la si lozinku? Napravi novu". Klik "← Uđi linkom na mejl (bez lozinke)" vraća nazad.
3. Upiši nepostojeći mejl + "Pošalji mi link na mejl" → prikaže se "Nemamo nalog sa tim mejlom. Da li si kupio kurs? Pogledaj kurseve" (link vodi na `/kursevi`).
4. `http://localhost:3000/registracija` → preusmerava na `/prijava`.
5. `http://localhost:3000/reset-lozinke` → i dalje radi (email + "Pošalji link za reset").

- [ ] **Step 4: (opciono) Test magic link sa postojećim mejlom**

Ako imaš test nalog koji postoji u Supabase auth, upiši njegov mejl → očekuj zelenu poruku "Link za prijavu je poslat na ...". Proveri da stigne mejl i da link vodi na `/auth/callback` → `/dashboard`.

---

## Self-Review (popunjeno tokom pisanja)

- **Spec coverage:** Ponašanje /prijava → Task 1+2. AuthForma izmene → Task 1. /registracija redirect → Task 3. Magic link `shouldCreateUser:false` + poruka → Task 1. Ton "ti" → Task 1 (komponenta) + Task 2 (stranica). Van opsega (checkout/migracija/course_access/reset) → netaknuto. Testiranje → Task 4. Sve pokriveno.
- **Placeholder scan:** Nema TBD/TODO; sav kod je kompletan.
- **Type consistency:** `AuthFormaProps.tip` je `"prijava" | "reset"` u Task 1; `prijava/page.tsx` zove `tip="prijava"`, `reset-lozinke/page.tsx` zove `tip="reset"` (postojeće, kompatibilno), `registracija/page.tsx` više ne zove `AuthForma` (Task 3). `onSubmit` potpis `({ email, password })` — reset handler `({ email })` je dodeljiv. Konzistentno.
- **Redosled izvršavanja:** Task 1 → Task 3 → Task 2 → Task 4 da se izbegne prelazni build lom (jer Task 1 menja `AuthFormaProps.tip`, a stari `registracija/page.tsx` koristi `tip="registracija"` dok ga Task 3 ne ukloni).
