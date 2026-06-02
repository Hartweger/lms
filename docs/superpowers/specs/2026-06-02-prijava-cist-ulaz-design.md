# Prijava — "Čist ulaz" redizajn

**Datum:** 2026-06-02
**Status:** Odobren dizajn, čeka plan implementacije

## Problem

Stranica `/prijava` nudi četiri načina ulaska na jednom ekranu (Google, email+lozinka,
magic link, reset lozinke) plus "Registrujte se". Korisnike zbunjuje "kako ko treba da se
prijavi".

Ključni nalaz iz analize koda:

- **Nijedan korisnik se ne pravi sa lozinkom.** I kupac sada i migrirani korisnik dobiju
  nalog preko `supabase.auth.admin.createUser({ email, email_confirm: true })` — bez lozinke
  ([api/orders/route.ts:82](../../../src/app/api/orders/route.ts), [scripts/migrate-wc-customers.ts:114](../../../scripts/migrate-wc-customers.ts)).
- Zato je **email+lozinka forma prazna za skoro sve** na prvom ulasku, a stranica je baš nju
  vizuelno gura kao glavni put.
- **Samostalna registracija ničemu ne služi.** Ništa osim kupovine ne traži nalog: besplatni
  test samo skuplja mejl za MailerLite, besplatne lekcije su javne, newsletter ide u MailerLite.
  Nalog je koristan tek za `/dashboard` i `/profil`, što ima smisla samo ako si kupio kurs.

## Cilj

Stranica `/prijava` treba da odgovara stvarnosti: **primarni put je magic link (i Google),
a lozinka je opcioni dodatak** za one koji su je sebi napravili. Registracija bez kupovine se
uklanja kao koncept.

## Dizajn

### Ponašanje /prijava

Podrazumevano vidljivo na otvaranju:

```
        Prijava za polaznike
   Kupio/la si kurs? Uđi ovde.

   [   Nastavi sa Google   ]
            — ili —
   Email: [______________]
   [ Pošalji mi link na mejl ]

   ───────────────────────────
   Nemaš još kurs?  → Pogledaj kurseve

   (sitno, na dnu)  Imam lozinku ▾
```

- **Magic link je podrazumevan.** Polje za mejl i dugme "Pošalji mi link na mejl" vidljivi su
  odmah, bez prethodnog klika. (Suprotno od trenutnog stanja gde je lozinka glavna, a magic
  link sakriven iza tekstualnog linka.)
- **"Imam lozinku ▾"** je sitan link na dnu. Klik otvara sklopivu sekciju sa poljem za lozinku,
  dugmetom "Prijavite se" i linkom "Zaboravili/napravite lozinku" (→ `/reset-lozinke`).
- **Nema "Registrujte se".** Umesto toga "Nemaš još kurs? → Pogledaj kurseve" (→ `/kursevi`).

### Komponente koje se menjaju

- **[src/components/AuthForma.tsx](../../../src/components/AuthForma.tsx)** — obrnuti logiku
  prikaza: default je magic link (mejl + pošalji link), a lozinka prelazi u sklopivu sekciju
  "Imam lozinku". Trenutni `magicLinkMode` (koji uključuje magic link) zameniti logikom gde je
  lozinka iza prekidača (`passwordMode`, podrazumevano isključen).
- **[src/app/(auth)/prijava/page.tsx](../../../src/app/(auth)/prijava/page.tsx)** — zameniti
  donji blok linkova: ukloniti "Registrujte se", dodati "Nemaš još kurs? → Kursevi". Link
  "Zaboravili/napravite lozinku" se prebacuje unutar sklopive sekcije za lozinku.
- **[src/app/(auth)/registracija/page.tsx](../../../src/app/(auth)/registracija/page.tsx)** —
  preusmerava na `/prijava` (server redirect) da stari linkovi/bookmarkovi ne puknu. `signUp`
  poziv se više ne koristi.

### Magic link — bez pravljenja novog naloga

Magic link poziva `signInWithOtp` sa `shouldCreateUser: false`.

- Ko je kupio (ima nalog) → dobije link, uđe normalno.
- Ko nema nalog → umesto pravljenja praznog naloga, dobije poruku:
  *"Nemamo nalog sa tim mejlom. Da li si kupio kurs?"* + link na `/kursevi`.

Ovo nema lažno negativnih jer svaki kupac već ima nalog (pravi se na checkoutu).

## Van opsega

- Ne dira se checkout, migracija korisnika, ni `course_access` logika.
- `/reset-lozinke` ostaje funkcionalno isti, samo se sad poziva iz sklopive sekcije.
- **Poznata nedoslednost (svesno van opsega):** Google OAuth i dalje može da napravi prazan
  nalog korisniku koji nije kupio kurs — takav korisnik vidi prazan dashboard. Mali rizik.
  Eventualni kasniji posao: prazan dashboard pokaže "nemaš još kurseve → pogledaj ponudu".

## Testiranje

- Smoke test posle deploya: `/prijava` se učitava, magic-link tok radi (jedan pokušaj sa
  postojećim i jedan sa nepostojećim mejlom), "Imam lozinku" sekcija se otvara.
- Provera da `/registracija` preusmerava na `/prijava`.
