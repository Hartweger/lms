# Prijava / Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Svaki migrirani korisnik može da uđe (Google / magic link / lozinka) i odmah vidi svoje kurseve, bez zaglavljivanja na goloj grešci.

**Architecture:** Google OAuth + magic link + email/lozinka su VEĆ implementirani u `src/components/AuthForma.tsx`, callback u `src/app/auth/callback/route.ts`. Preostaje: (1) potvrditi Supabase config, (2) testirati auto-linking identiteta, (3) zameniti golu grešku pametnim usmeravanjem, (4) normalizovati migrirane mejlove.

**Tech Stack:** Next.js (izmenjena verzija — vidi `AGENTS.md`, čitati `node_modules/next/dist/docs/` pre koda), Supabase Auth (signInWithOAuth / signInWithOtp / signInWithPassword), Resend (mejl).

**Napomena o testovima:** Projekat nema test framework (nema vitest/jest). Verifikacija je manuelna (browser + Supabase SQL editor). Koraci to odražavaju — ne uvodimo test infrastrukturu radi jedne male izmene.

---

### Task 1: Potvrditi Supabase Google provider + redirect URL-ove (de-risk, prvo)

**Files:** nijedan (konfiguracija u Supabase dashboard-u, eksterno)

- [ ] **Korak 1:** U Supabase dashboard → Authentication → Providers → Google. Potvrditi da je **Enabled** i da su upisani Google Client ID i Secret (iz Google Cloud Console).
- [ ] **Korak 2:** U Authentication → URL Configuration → Redirect URLs dodati: `https://kurs.hartweger.rs/auth/callback` i (za kasnije lansiranje) `https://hartweger.rs/auth/callback` i `https://www.hartweger.rs/auth/callback`. Za lokalni dev: `http://localhost:3000/auth/callback`.
- [ ] **Korak 3:** U Google Cloud Console → OAuth client → Authorized redirect URIs potvrditi da je dodat Supabase callback (`https://<project-ref>.supabase.co/auth/v1/callback`).
- [ ] **Korak 4 (verifikacija):** Otvoriti `/prijava`, kliknuti „Nastavite sa Google". Očekivano: redirect na Google consent → nazad na `/dashboard`. Ako puca → provider nije ispravno podešen, vratiti se na Korak 1.

---

### Task 2: Test auto-linkinga identiteta (kritičan — da Google prijava ne pravi duplikat)

**Files:** nijedan (manuelni test + Supabase SQL editor)

- [ ] **Korak 1:** U Supabase SQL editoru kreirati test scenario — pronaći postojeći migrirani nalog (ima `email_confirm: true`, nema lozinku) ili napraviti test:
```sql
-- pronađi migriran nalog bez password identiteta, sa course_access
select u.id, u.email, ca.course_id
from auth.users u
join public.course_access ca on ca.user_id = u.id
limit 5;
```
Zapamtiti `u.id` (originalni user_id) i `u.email`.
- [ ] **Korak 2:** Iz inkognito prozora otvoriti `/prijava` → „Nastavite sa Google" → prijaviti se Google nalogom čiji je email **isti** kao `u.email` iz Koraka 1.
- [ ] **Korak 3 (verifikacija — KLJUČNO):** Posle prijave, u Supabase SQL editoru:
```sql
-- mora biti i dalje JEDAN red za taj email (ne dva)
select id, email from auth.users where email = 'TEST_EMAIL';
-- i identitet google mora biti vezan za isti id
select user_id, provider from auth.identities where user_id = 'ORIGINAL_USER_ID';
```
Očekivano: jedan `auth.users` red, `id` = originalni `user_id`, postoji `google` red u `auth.identities`. Na `/dashboard` se vide kursevi.
- [ ] **Korak 4:** Ako se pojavio DRUGI `auth.users` red (duplikat) → auto-linking ne radi. Prebaciti se na Plan B: u Supabase Authentication → Providers uključiti „Allow manual linking" / proveriti „Link accounts with same email", ili pripremiti merge skriptu (van ovog lean plana — eskalirati i ažurirati spec).

---

### Task 3: Pametna obrada greške pri prijavi lozinkom

**Files:**
- Modify: `src/app/(auth)/prijava/page.tsx:15` (poruka u `handleLogin`)

- [ ] **Korak 1:** Pre izmene pročitati relevantni Next.js guide (`AGENTS.md` pravilo): proveriti da nema deprecation upozorenja za client komponente u ovoj verziji.
- [ ] **Korak 2:** Zameniti golu poruku usmeravajućom. Trenutno:
```tsx
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (error) return "Pogrešan email ili lozinka.";
```
Novo:
```tsx
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (error)
  return "Email ili lozinka nisu tačni. Ako si ranije koristio/la Google ili još nemaš lozinku — uđi dugmetom „Nastavite sa Google" iznad, ili klikni „Pošalji mi link za prijavu na email".";
```
- [ ] **Korak 3 (verifikacija):** `npm run dev`, otvoriti `/prijava`, uneti postojeći email + pogrešnu lozinku. Očekivano: prikazuje se nova poruka koja usmerava na Google / magic link (ne golo „Pogrešan email ili lozinka").
- [ ] **Korak 4: Commit**
```bash
git add "src/app/(auth)/prijava/page.tsx"
git commit -m "feat(prijava): usmeravajuca poruka umesto gole greske pri prijavi lozinkom"
```

---

### Task 4: Normalizacija migriranih mejlova (lowercase/trim)

**Files:** nijedan (Supabase SQL editor)

- [ ] **Korak 1 (provera):** U Supabase SQL editoru proveriti ima li mejlova koji nisu lowercase:
```sql
select id, email from auth.users where email <> lower(trim(email));
```
- [ ] **Korak 2:** Ako rezultat nije prazan — Supabase `auth.users.email` se ne menja direktno UPDATE-om bezbedno; koristiti admin API skriptu ili `supabase.auth.admin.updateUserById(id, { email: lower })`. Napisati jednokratnu skriptu po uzoru na `scripts/migrate-wc-customers.ts` (isti `createClient` sa service role). Ako je rezultat prazan → preskočiti, nema posla.
- [ ] **Korak 3 (verifikacija):** Ponoviti upit iz Koraka 1 → očekivano 0 redova.

---

### Task 5: Mejl migriranim korisnicima (priprema, slanje zaseban korak)

**Files:** (po izboru pri slanju) — tekst je u specu, sekcija 4.

- [ ] **Korak 1:** Finalni tekst (naslov + telo, ti forma) prekopirati iz `docs/superpowers/specs/2026-05-31-prijava-login-design.md` sekcija 4.
- [ ] **Korak 2:** Slanje je odvojeno od ovog plana zbog Resend kvote (vidi memoriju `project_migracija_a1` — već poslato 103 za A1). NE slati ovde; samo potvrditi da tekst stoji i usmerava na Google/magic link sa „isti email kao do sada".

---

## Self-review

- **Spec coverage:** Sekcija 1 (tri puta) → već u kodu, pokriveno Task 1/3. Sekcija 2 (auto-linking + email norm) → Task 2 + Task 4. Sekcija 3 (config + test) → Task 1 + Task 2. Sekcija 4 (mejl) → Task 5. Sve sekcije pokrivene.
- **Placeholder scan:** nema TBD/TODO; sve komande i izmene su konkretne.
- **Type consistency:** jedina izmena koda je string poruke; bez novih tipova/funkcija.
