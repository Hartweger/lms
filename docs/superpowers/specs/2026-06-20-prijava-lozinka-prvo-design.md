# Prijava: lozinka kao glavni način (lozinka-prvo)

Datum: 2026-06-20

## Problem

Polaznici prijavljuju da ne mogu da uđu na nalog (npr. Stefan Šošić, 20.06.2026). Dva uzroka koja se preklapaju:

1. **Navika.** Ljudi po navici traže email + lozinku. Na trenutnoj `/prijava` glavno dugme je magic link („Pošalji mi link na mejl"), a polje za lozinku je sakriveno iza linka „Imam lozinku". Korisnik ne nađe ono što očekuje i odustane.
2. **Stara LearnDash lozinka.** Migrirani korisnici misle da imaju lozinku i kucaju **staru lozinku sa stare platforme**. Ta lozinka u novom sistemu (Supabase) **ne postoji** — pri migraciji su nalozi napravljeni bez lozinke (samo email + magic link), a WordPress hash format (phpass) Supabase ne ume da pročita, pa se stara lozinka ne može preneti. Korisnik dobije „pogrešno", pomisli da je sajt pokvaren i odustane.

## Podaci (auth.users, 20.06.2026)

| Grupa | Broj |
|---|---|
| Ukupno naloga | 756 |
| Aktivni (ikad se ulogovali) | 347 |
| → imaju lozinku | 294 |
| → ulaze preko Google-a | 223 |
| → ulaze **samo** magic linkom | **0** |
| **Nikad se nisu ulogovali** | **409** |

Ključ: **nijedan aktivan korisnik ne zavisi samo od magic linka.** Svako ko redovno ulazi već ima lozinku ili Google. Zato prebacivanje na „lozinka-prvo" **ne menja naviku nijednom aktivnom korisniku** — magic link ostaje samo kao rezerva. Pravi cilj redizajna su 409 zaglavljenih (54% baze) koji nikad nisu ušli.

## Cilj

- Email + lozinka postaje glavni način prijave (poklapa se sa navikom).
- Stranica za prijavu ostaje **čista** — bez objašnjenja koja bi zbunila nove korisnike.
- Sva objašnjenja oko lozinke žive u **mejlu** i na jednoj **posebnoj stranici za pravljenje lozinke**, ne na glavnoj prijavi.
- Nikome se ne oduzima postojeći način ulaza: Google i magic link ostaju kao opcije.

## Načelo dizajna

Stranica za prijavu je čista i kratka. Objašnjenje o staroj lozinki vidi **samo onaj ko zapne** (kontekstualna poruka posle neuspele prijave), nikad novi korisnik ili onaj ko zna lozinku. Težak deo objašnjavanja radi mejl + posebna stranica „Postavi lozinku".

## Rešenje

### 1. `/prijava` — čista, lozinka-prvo

Redosled na stranici:

1. **„Nastavi sa Google"** (ostaje na vrhu — koristi ga 223 ljudi, najbrže je, bez kucanja).
2. Razdelnik „ili".
3. **Email + Lozinka** polja, glavno dugme **„Prijavi se"** (`signInWithPassword`). Polje za lozinku je odmah vidljivo (nema više `passwordMode` toggle-a kao podrazumevanog stanja).
4. Ispod, dva mala linka:
   - **„Prvi put ovde? Napravi lozinku"** → vodi na stranicu za pravljenje lozinke (tačka 3).
   - **„Zaboravio/la si lozinku?"** → ista stranica/flow.

Na stranici nema nikakvih upozorenja ni objašnjenja u podrazumevanom stanju.

Magic link se NE uklanja iz koda, ali više nije glavno dugme — ostaje dostupan kao tiha rezerva (npr. preko linka „nemam lozinku" koji nudi i magic link kao alternativu). Detalj plasiranja magic linka razrešava se u planu; bitno je da prestane da bude primarni CTA.

### 2. Kontekstualna poruka pri neuspeloj prijavi

Kad `signInWithPassword` vrati grešku (pogrešna ili nepostojeća lozinka), ispod forme se prikazuje:

> „Lozinka nije prošla. Ako si ranije bio/la na staroj platformi, stara lozinka ovde ne važi — napravi novu za 30 sekundi."

uz vidljivo dugme/link **„Napravi lozinku"**. Ova poruka se prikazuje samo nakon neuspelog pokušaja — novi korisnici i oni koji znaju lozinku je nikad ne vide.

Svesno biramo **najjednostavniju varijantu** (poruka + dugme), bez automatskog prepoznavanja da nalog nema lozinku. Auto-prepoznavanje (proveriti čim korisnik unese email da li nalog ima lozinku, pa ga automatski odvesti na pravljenje lozinke) je moguća kasnija nadogradnja **samo ako se pokaže da korisnici i dalje zapinju** — nije u opsegu ovog posla.

### 3. Posebna stranica „Postavi lozinku"

Iskoristiti postojeću infrastrukturu reseta lozinke umesto pravljenja flow-a od nule:

- Postojeći `/reset-lozinke` šalje link preko `resetPasswordForEmail` na `/auth/callback?next=/profil`. `/profil` već ima sekciju za postavljanje lozinke.
- Doterati ovaj flow:
  - **Imenovanje za naš slučaj.** Za migrirane „reset" je zbunjujuće (nikad nisu imali lozinku). Stranica/ulaz se predstavlja kao **„Napravi lozinku"** (kad dolazi sa prijave kao „prvi put ovde") i kao **„Zaboravljena lozinka"** (kad dolazi sa „zaboravio/la si lozinku"). Isti tehnički flow, prilagođen tekst.
  - **Fokusirano sletanje.** Umesto da link sleti na ceo `/profil`, poželjno je da sleti na fokusiranu stranicu „Postavi lozinku" (dva polja: nova lozinka + ponovi) koja posle uspeha vodi pravo na `/dashboard`. Tačan izbor (nova stranica vs. preusmeravanje na postojeću sekciju profila) razrešava se u planu, uz cilj: čisto, dva polja, pa na lekcije.
  - **Ti-forma.** Postojeći tekstovi na `/reset-lozinke` persiraju („Unesite email") — prepraviti na „ti" (pravilo iz [[feedback_ti_forma]]).

### 4. Aktivacioni / welcome mejl

- Mejl jasno kaže: **„Tvoja stara lozinka sa prethodne platforme ne važi na novoj — klikni i napravi novu."**
- Dugme u mejlu vodi pravo na stranicu „Postavi lozinku".
- Primenjuje se i na nove kupce i (kasnije) na grupu od 409.

## Opseg

**U ovom poslu:**
- Redizajn `/prijava` (lozinka-prvo, čisto).
- Kontekstualna poruka pri neuspeloj prijavi + dugme „Napravi lozinku".
- Doterivanje flow-a za pravljenje lozinke (imenovanje, fokusirano sletanje, ti-forma).
- Izrada/izmena teksta aktivacionog mejl-šablona da pominje da stara lozinka ne važi.

**Van opsega (zaseban korak posle provere da sve radi):**
- Masovno slanje mejla „napravi lozinku i uđi" grupi od 409 nikad-ulogovanih. Radi se tek kad se potvrdi da ceo flow radi (da ne pošaljemo 409 mejlova na nešto neispravno).
- Automatsko prepoznavanje da nalog nema lozinku (moguća kasnija nadogradnja).

## Prioritet i realna očekivanja

- **Prava vrednost nije stranica, nego 409 zaglavljenih.** Redizajn `/prijava` je preduslov; cilj je vratiti već plaćene/migrirane korisnike koji nikad nisu ušli. Iako je masovno slanje formalno „zaseban korak", meri se **danima, ne nedeljama** — čim se flow potvrdi, šaljemo.
- **Mejl ostaje usko grlo.** I sa lozinkom-prvo, pravljenje lozinke zavisi od mejla (Resend dnevni limit + spam). Velika je razlika što mejl treba **samo jednom** (ne na svaku prijavu), ali realno nećemo vratiti svih 409 — vraćamo dobar deo.

## Oprez

Sve izmene diraju **autentifikaciju**. Obavezan ručni smoke test celog flow-a posle deploya (prijava lozinkom, Google, pravljenje lozinke iz mejl linka, kontekstualna poruka), jer automatski smoke test ne pokriva `/prijava` ni `/profil`. Vidi [[feedback_deploy_smoke_test]].

## Reference

- Postojeći kod: `src/app/(auth)/prijava/page.tsx`, `src/components/AuthForma.tsx`, `src/app/(auth)/reset-lozinke/page.tsx`, `src/app/profil/page.tsx`, `src/app/auth/callback/route.ts`, `scripts/send-aktivacija-reminder.ts`.
- Memorija: [[reference_login_podrska_lozinka]], [[project_aktivacija_reminder_migrirani]], [[feedback_ti_forma]], [[feedback_deploy_smoke_test]].
