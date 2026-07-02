# Aktivacija: auto-login posle kartice + login-linkovi u mejlovima + raniji nudge + gate na lekciji

**Datum:** 02.07.2026
**Problem:** 84-90% upisanih ne otvori nijednu lekciju. Koren (UX audit 02.07): posle plaćanja karticom korisnik NIJE ulogovan i udara u magic-link zid u trenutku najveće motivacije; welcome mejl vodi na /prijava (drugi mejl, čekanje); nudge kasni 3+ dana i vodi odjavljenog u notFound().

## Ciljevi

1. Posle uspešne kartice korisnik je ULOGOVAN i na jedan klik od prve lekcije.
2. Welcome i nudge mejl nose direktan login-link do prve lekcije (bez /prijava zida).
3. Prvi nudge na ~24h; odjavljen korisnik na /lekcija/[id] vidi jasan gate umesto 404.

## Ključne odluke

### O1: Auto-login u NestPay callbacku preko postojećeg /auth/confirm

NestPay 3D-hosting POST callback dolazi KROZ KORISNIKOV BROWSER (303 redirect lanac),
pa sesiju možemo postaviti u istom lancu. Posle grant+fiscal, callback:

- `admin.auth.admin.generateLink({ type: "magiclink", email: order.email })`
- 303 na `/auth/confirm?token_hash=<hashed_token>&type=magiclink&next=<enc(/kupovina/hvala/<id>?status=ok)>`
- `/auth/confirm` (postojeća, dokazana ruta - koristi je i admin impersonate) verifikuje OTP,
  postavi cookie sesiju i redirectuje na hvala.

Fallback: ako generateLink padne, redirect bez logina (ponašanje kao danas) - plaćanje
nikad ne sme da zavisi od logina. Idempotentni replay (payment_status već completed)
NE generiše login (anti-replay: potpisani callback params viđeni više puta ne smeju
svaki put da daju svežu sesiju).

### O2: Hvala stranica ostaje landing; CTA "Započni prvu lekciju" umesto skoka na lekciju

Browser Pixel Purchase se puca na hvala stranici (dedup sa server CAPI preko event_id,
vidi project_meta_pixel_capi). Redirect pravo na lekciju bi to slomio. Umesto toga:
hvala za ulogovanog korisnika (kartica, status=ok) prikazuje primarni CTA
**"Započni prvu lekciju →"** direktno na `/lekcija/<prva>`; postojeći "Prijavi se da
vidiš kurs" CTA se prikazuje samo odjavljenima. Ako kupljeni proizvod nema lekcije
(grupni/1:1/paket bez unlocks), CTA vodi na /dashboard.

Prva lekcija se računa: order.items → course_unlocks → content kursevi → prvi kurs
koji ima lekcije → lekcija sa najmanjim order_index. Izdvojeno u čist modul
`src/lib/first-lesson.ts` (koriste ga hvala, grant-access/welcome i activation cron).

**KTZ/mesečni bez platforme (Nataša, 02.07):** prva lekcija = null → hvala NE sme da
obećava lekcije: poruka „Uplata je uspela. Sve detalje o tvojim časovima poslali smo
ti na mejl." + CTA „Moj nalog →" (ne /dashboard, ne „kreni odmah"). Welcome mejl:
KTZ ionako dobija individualni welcome (ne generički); generički za slučaj bez lekcija
nosi label „Uđi na platformu" umesto „Započni prvu lekciju" (`hasLesson` opcija).
Nudge cron već preskače kurseve bez lekcija - bez izmene.

### O3: Mejl login-linkovi = naš HMAC exchange token, NE sirovi magic link

Sirovi `token_hash` u mejlu ne valja: ističe za ~1h, single-use, i svaki novi
`generateLink` (npr. auto-login na callbacku) invalidira prethodni. Umesto toga:

- Novi čist modul `src/lib/login-link.ts`:
  - `createLoginLinkToken({ email, next, expiresAt })` → `base64url(payload).base64url(hmacSHA256)`
  - `verifyLoginLinkToken(token, now)` → `{ email, next }` ili `null` (istekao/falsifikovan)
  - Secret: `LOGIN_LINK_SECRET` env; fallback `SUPABASE_SERVICE_ROLE_KEY` (server-only,
    zero-config deploy). Bez novog obaveznog env-a.
  - `next` validacija: mora počinjati sa `/`, ne sme `//` ni `\` (open-redirect zaštita).
  - Rok važenja: **7 dana**, VIŠEKRATAN unutar roka (klik i sutra radi). Duže od toga je
    rizik (prosleđen mejl = pristup nalogu, a /nalog dozvoljava promenu mejla).
- Nova ruta `GET /auth/mejl?t=<token>`:
  - verifikuje token → `admin.generateLink(magiclink, email)` → `verifyOtp` server
    klijentom (postavi sesiju) → redirect na `next`.
  - Neuspeh/istekao → redirect `/prijava?greska=link` sa prijateljskom porukom
    (auth-messages: "Link iz mejla je istekao - prijavi se ovde, traje 30 sekundi.").
- Mejlovi NE menjaju Supabase mail template niti /prijava magic-link tok.

### O4: Welcome mejl (email.ts sendWelcomeEmail)

- CTA "Započni učenje" → `SITE_URL/auth/mejl?t=...` sa `next=/lekcija/<prva>`
  (ili /dashboard ako nema lekcija). Tekst ispod dugmeta: dugme automatski prijavljuje;
  fallback rečenica o /prijava ostaje za slučaj isteka.
- `grant-access.ts` računa prvu lekciju + token i prosleđuje ih welcome mejlu.
- Važi za SVE puteve do welcome mejla (kartica callback, admin potvrda uplatnice/PayPal,
  recovery cron) - svi idu kroz grantAccessForOrder.
- Grupni i individualni welcome mejlovi se NE diraju (drugi tok: Meet/beleške; YAGNI).

### O5: Nudge (cron/activation + sendActivationNudge)

- `minAge`: 3 dana → **1 dan** (cron već ide dnevno u 10 UTC; prvi nudge stiže 24-48h
  od kupovine). Prozor ostaje do 30 dana, dedup po activation_nudges ostaje jednom po čoveku.
- Link u mejlu: `/auth/mejl?t=...` sa `next=/lekcija/<prva>` umesto golog /lekcija/<id>.

### O6: Gate na /lekcija/[id] za odjavljene (page.tsx:227 kontekst)

Danas: anon RLS vrati null za ne-preview lekciju → `notFound()` - mrtav kraj iz mejla.
Novo, u page.tsx posle neuspelog fetch-a:

- Ako lekcija ne postoji ni admin klijentom → notFound() (pravi 404).
- Ako postoji, a korisnik ODJAVLJEN → gate ekran: naslov kursa/lekcije + "Prijavi se da
  nastaviš" → `/prijava`. (next-param na /prijava preskačemo: magic-link šablon ima
  fiksni next=/dashboard, a glavni aktivacioni put ionako zaobilazi /prijava.)
- Ako postoji, korisnik ULOGOVAN a bez pristupa → poruka "Nemaš (više) pristup ovom
  kursu" + link na /kursevi i /nalog (obnova).
- `is_free_preview` lekcije rade kao danas (anon ih vidi kroz RLS).

Napomena: admin fetch lekcije za gate koristi minimalan select (id, title, course_id) -
NE sme da procuri sadržaj lekcije odjavljenima.

## Sekvenca (kartica, srećan put)

1. Kupac plati → banka POST → `/api/nestpay/callback` (browser).
2. Callback: verifikuje hash → grant (welcome mejl sa login-linkom) → fiskalizacija →
   generateLink → 303 `/auth/confirm?...&next=/kupovina/hvala/<id>?status=ok`.
3. `/auth/confirm`: verifyOtp → sesija → 303 hvala.
4. Hvala: Pixel Purchase + "Plaćanje uspešno" + CTA "Započni prvu lekciju →".
5. Klik → `/lekcija/<prva>` (ulogovan, RLS pušta) → uči.
6. Ako ne klikne: za 24-48h nudge mejl → `/auth/mejl?t=...` → sesija → prva lekcija.

## Šta se NE menja

- Supabase mail template, /prijava, /auth/callback (PKCE), magic-link tok.
- Grupni/individualni welcome, uplatnica/PayPal hvala sekcije.
- Pixel/CAPI logika (samo koristimo postojeći landing).
- activation_nudges šema (bez migracija; nema DB promena uopšte).

## Rizici i ublažavanja

- generateLink na callbacku dodaje ~1 admin poziv dok banka čeka redirect (audit već
  beleži timeout rizik za grant+fiscal) → fallback bez logina, bez throw-a; postojeći
  backlog item "grant u waitUntil" ostaje zaseban.
- Prosleđen welcome mejl = 7 dana pristup → svesno prihvaćeno (baseline je magic-link
  mejl); rok 7 dana + log upotrebe u /auth/mejl.
- Open redirect kroz `next` → validacija u login-link modulu + /auth/confirm već prima
  samo relativan next koji sami gradimo.
- Resend kvota: broj mejlova se ne menja (isti welcome/nudge, samo drugačiji link).

## Testiranje

- **TDD (vitest, čisti moduli):** `login-link.test.ts` (potpis/verifikacija/istek/
  falsifikat/next-guard/multi-use), `first-lesson.test.ts` (izbor prve lekcije po
  order_index, kurs bez lekcija, više kurseva), `auth-messages.test.ts` (nova poruka).
- **Smoke lokalno (dev server):** /auth/mejl sa važećim tokenom → Set-Cookie + redirect;
  sa isteklim → /prijava?greska=link; /lekcija/<id> anon → gate (ne 404, ne sadržaj);
  cron `?dry=1` → broj kandidata sa novim prozorom; cron `?test=` mejl → link format.
- **Smoke produkcija posle svakog deploya** (obavezan hook): + test kartica ako je izvodljivo.

## Isporuka u 3 odvojena deploya (redom od najmanjeg rizika)

1. **D1:** gate na lekciji + nudge prozor 24h (bez auth promena).
2. **D2:** login-link modul + /auth/mejl ruta + welcome/nudge mejlovi koriste linkove.
3. **D3:** NestPay callback auto-login + hvala CTA (novčani put, poslednji, uz pojačan smoke).
