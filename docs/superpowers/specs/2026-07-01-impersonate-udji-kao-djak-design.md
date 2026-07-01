# „Uđi kao đak" — admin impersonation za podršku

Datum: 2026-07-01
Status: odobreno (Nataša)

## Problem

Kad đak napiše da ima problem (lekcija se ne otvara, kviz čudno radi, nema
pristup...), admin trenutno nema način da vidi tačno ono što đak vidi.
Postoji `admin/studenti/[id]/pregled`, ali to je statična kopija dashboarda —
ne može da otvori lekciju, uradi kviz, niti da reprodukuje interaktivne bagove.

## Rešenje

Pravo, ali bezbedno, ulogovanje u đakov nalog u **zasebnom (anonimnom) prozoru**,
preko postojećeg magic-link toka. Admin ostaje ulogovan kao admin u glavnom prozoru.

### Tok

1. Na `admin/studenti/[id]` novo dugme **„Uđi kao đak"** (pored „Pogledaj kao student").
2. Klik → `POST /api/admin/studenti/[id]/impersonate`.
3. Ruta (admin-gated) preko `service_role` zove
   `admin.auth.admin.generateLink({ type: "magiclink", email })`, uzme
   `properties.hashed_token` i vrati URL:
   `${origin}/auth/confirm?token_hash=<hashed_token>&type=magiclink&next=/dashboard`.
4. UI prikaže link + dugme „Kopiraj" + uputstvo „Otvori u anonimnom prozoru".
5. Admin otvori link u incognito → postojeća `/auth/confirm` ruta radi
   `verifyOtp` → sesija se postavi → sleti na `/dashboard` kao đak.

### Bezbednost

- Ruta proverava rolu pozivaoca server-side (isti obrazac kao ostale
  `/api/admin/...` rute): ako `role !== "admin"` → 403.
- Link je jednokratan i ističe (~1h, Supabase default).
- Đaku se **ništa ne šalje** mejlom; token dobija samo admin kao odgovor rute.
- Evidencija: `console.log` + Sentry breadcrumb „admin <id> ušao kao đak <id>".

## Van opsega (namerno)

- Nema „jedan klik u istom prozoru" ni trake za povratak (koristi se zaseban prozor).
- Nema zasebne audit tabele (jedan admin; YAGNI — dodaje se lako kasnije).

## Fajlovi

- Novo: `src/app/api/admin/studenti/[id]/impersonate/route.ts`
- Izmena: `src/app/admin/studenti/[id]/page.tsx` (dugme + prikaz linka)

## Ponovna upotreba

- `createClient` / `createAdminClient` — postojeći.
- `/auth/confirm/route.ts` — postojeći magic-link handler (`token_hash`+`type`+`next`).
