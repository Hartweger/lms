# Prijava / Login — design

**Datum:** 2026-05-31
**Blok:** A (feature parity sa starim WP+LearnDash sistemom)
**Cilj:** Svaki migrirani korisnik može da uđe bez muke i odmah vidi svoje kurseve. "Savršeno za korisnika" — nijedan stari kupac ne sme da bude zaključan.

## Kontekst / problem

- Novi sajt (`LMS/lms`) trenutno ima samo `signInWithPassword` na `/prijava`. Nema Google dugmeta.
- **Svi migrirani nalozi su kreirani sa `admin.createUser({ email, email_confirm: true })` — bez lozinke.** Dakle nijedan migrirani korisnik trenutno ne može da se prijavi lozinkom.
- Stari sajt je imao 3 načina prijave: email+lozinka, Google (169 korisnika), Facebook (23, nizak prioritet).
- `course_access.user_id` se vezuje za `auth.users(id)` (UUID), NE za email. Ako Google prijava napravi novi nalog umesto da spoji postojeći → korisnik gubi pristup kursevima. Ovo je glavni rizik.

## Odluke

- **Načini prijave:** email+lozinka + Google. Facebook se NE implementira (23 korisnika preusmeravamo na Google ili magic link).
- **Prvi ulazak za migrirane bez lozinke:** magic link (kod/link na email) kao glavni put + lozinka opciono. Niko nije primoran da postavlja lozinku.

## Dizajn

### 1. Stranica `/prijava` — tri puta (poređana po lakoći)

1. **"Nastavi sa Google"** (dugme na vrhu) — `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: <origin>/auth/callback } })`.
2. **"Pošalji mi link za prijavu"** — unos emaila → `signInWithOtp` (magic link/kod). Hero put za migrirane bez lozinke.
3. **Email + lozinka** — `signInWithPassword`, za one koji imaju/postave lozinku.

**Pametna obrada grešaka:** ako korisnik pokuša lozinkom a nalog nema lozinku (ili je pogrešna), NE prikazivati golo "Pogrešna lozinka", nego usmeriti: "Možda još nemaš lozinku — uđi Googleom ili ti šaljemo link na email."

**Posle magic-link prijave:** opcioni (NE obavezni) prompt "Želiš da postaviš lozinku za ubuduće?".

Registracija i reset lozinke ostaju. Reset se prirodno stapa sa magic-link logikom.

### 2. Automatsko povezivanje Google identiteta (srž)

- Oslanjamo se na **Supabase automatsko povezivanje identiteta**. Pošto su migrirani nalozi `email_confirm: true`, a Google vraća verifikovan email, Supabase spaja Google identitet na postojeći nalog kad se mejlovi poklope → isti `user_id`, kursevi ostaju.
- **Email normalizacija:** poklapanje je osetljivo na velika/mala slova i razmake. Pre lansiranja proveriti da su svi migrirani mejlovi u bazi lowercase/trimovani (jednokratni SQL fix ako treba).
- **Magic link je inherentno bezbedan** — OTP na postojeći email prijavljuje direktno na taj `user_id`, ne pravi novi identitet.

### 3. Konfiguracija + obavezan test

- **Supabase dashboard:** uključiti Google provider (client ID/secret iz Google Cloud), dodati redirect URL-ove za oba domena (`kurs.hartweger.rs` sad, `hartweger.rs` na lansiranju). Callback ruta `/auth/callback` već postoji i radi `exchangeCodeForSession`.
- **OBAVEZAN test pre lansiranja (ne pretpostavka):** napraviti test-nalog preko `admin.createUser({email, email_confirm:true})` + dodeliti `course_access`, pa se prijaviti Googleom sa istim mejlom i potvrditi da je `user_id` isti i da kursevi i dalje stoje.
- **Plan B (ako auto-linking zakaže):** admin skripta koja detektuje duplikate po mejlu i spaja `course_access` na originalni nalog.
- **Edge case-ovi:** Google mejl ≠ kupovni mejl → usmeriti na magic link sa kupovnim mejlom; Gmail alias/tačke → redak, prihvatamo rizik.

### 4. Mejl migriranim korisnicima (prvi ulazak)

Tekst (ti forma, glas Nataše) — ide uz blok, slanje je zaseban korak (Resend kvota, vidi `project_migracija_a1`):

- Naslov: "Tvoji kursevi su se preselili na novu platformu 🎉"
- Poruka: preselili smo školu na kurs.hartweger.rs; pristup i napredak prebačeni, ništa izgubljeno; kako da uđe — Google (isti email) ili "poslaćemo ti link za prijavu", bez stare lozinke; CTA dugme → `/prijava`; podrška = odgovori na mejl; potpis Nataša.
- Namerno NE pominje lozinku kao prvi korak; naglašava "isti email kao do sada" (zbog auto-linkinga).

## Van obima (YAGNI)

- Facebook OAuth.
- Obavezno postavljanje lozinke.
- Two-factor / napredna bezbednost.

## Kriterijum uspeha

- Migrirani Google korisnik: 1 klik → unutra, kursevi vidljivi.
- Migrirani ne-Google korisnik: unese email → link → unutra, kursevi vidljivi.
- Niko ko ukuca staru lozinku ne ostaje zaglavljen na gol-oj grešci.
- Nula duplikata naloga (potvrđeno testom pre lansiranja).
