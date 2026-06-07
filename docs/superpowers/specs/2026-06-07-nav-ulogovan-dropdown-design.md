# Navigacija za ulogovane — nalog-dropdown (design)

**Datum:** 2026-06-07
**Cilj:** Ulogovani korisnik (i student) treba da iz menija dođe do ponude kurseva i magazina (prodaja + navigacija), bez zabune između „Kursevi" (ponuda/kupovina) i „Moji kursevi" (upisani).

## Problem (trenutno)

`NavClient.tsx` prikazuje dva potpuno razdvojena seta linkova:
- **Ulogovan:** NaKI · Moji kursevi · Admin · Odjava — marketing linkovi (Kursevi, Magazin…) su SAKRIVENI.
- **Neulogovan:** NaKI · Kursevi · O metodi · O nama · Magazin · Kontakt · Besplatni test · Prijavi se.

Posledica: ulogovan student ne može iz menija da nađe druge kurseve da kupi, ni magazin. A kad bi se „Kursevi" dodalo pored „Moji kursevi", labeli su zbunjujuće slični.

Dodatno: `middleware.ts` preusmerava ulogovane sa `/` na `/dashboard`, pa logo „vodi na dashboard".

## Dizajn (odabrano: Pristup A — nalog-dropdown)

**Glavna traka — ISTA za sve (ulogovan i ne):**
`Kursevi · NaKI · Magazin · O metodi · O nama · Kontakt`

**Desna zona — jedino što zavisi od prijave:**
- **Neulogovan:** `Besplatni test` (plava) + `[ Prijavi se ]` (koral dugme).
- **Ulogovan:** `[ Ime ▾ ]` (ime korisnika + chevron) → dropdown:
  - **Moji kursevi** (`/dashboard`)
  - **Admin** (`/admin`) — samo ako `role === "admin"`
  - **Odjava** (signOut → `/`)

**Zašto rešava problem:** „Kursevi" (ponuda) je u glavnoj traci, „Moji kursevi" je u nalog-dropdownu → različite zone, nema sudara labela. „Besplatni test" se prikazuje samo neulogovanima (već raspoređeni studenti ga ne vide).

**Logo / početna:** Logo vodi na `/`. Uklanja se `middleware.ts` blok koji preusmerava ulogovane sa `/` na `/dashboard` — logo radi prirodno i ulogovani mogu da razgledaju javni sajt. Dashboard je 1 klik (Moji kursevi u dropdownu). Zaštita `/dashboard`, `/admin`, `/profil`, `/profesor` ostaje netaknuta.

**Mobilni (hamburger):** ista struktura — javni linkovi uvek (isti redosled), pa auth sekcija: ulogovan → Moji kursevi / Admin / Odjava; neulogovan → Besplatni test / Prijavi se. Na mobilnom je sve u jednoj listi (nije potreban poseban dropdown).

## Komponente / izmene

- **`src/components/NavClient.tsx`** — preraspodela rendera:
  - Javni linkovi (Kursevi, NaKI, Magazin, O metodi, O nama, Kontakt) renderuju se UVEK.
  - Desna zona uslovna po `user`.
  - Novi desktop dropdown: `useState` open/close; zatvara se na klik napolje (document `mousedown` listener u `useEffect`, ili overlay) i na izbor stavke.
  - `user.full_name` kao labela okidača (fallback na „Nalog" ako nema imena).
- **`src/middleware.ts`** — ukloniti blok `if (path === "/" && user) redirect → /dashboard`. Ostalo (zaštita ruta, redirect neulogovanih na `/prijava`) ostaje.

## Van opsega (YAGNI)

- Nema redizajna marketing stranica ni novih ruta.
- Nema avatara/slike — samo ime + ▾ (avatar je moguć v2).
- Redosled i spisak marketing linkova se ne menja osim premeštanja „Besplatni test" u desnu zonu (samo neulogovani).

## Test / verifikacija

- Ulogovan (admin) vidi: Kursevi/NaKI/Magazin/O metodi/O nama/Kontakt + `[Ime ▾]` (Moji kursevi/Admin/Odjava). Ne vidi „Besplatni test"/„Prijavi se".
- Ulogovan (student, ne-admin): isto, ali bez „Admin" u dropdownu.
- Neulogovan: isti javni linkovi + „Besplatni test" + „Prijavi se".
- Logo → `/` prikazuje početnu i kad si ulogovan (nema redirecta na dashboard).
- Dropdown se zatvara klikom napolje i klikom na stavku.
- Mobilni hamburger: ista logika.
- `npx tsc --noEmit` čisto; build prolazi; smoke posle deploya.
