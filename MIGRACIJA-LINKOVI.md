# Migracija domena — mapa linkova i redirekcija

> Status: **radna verzija, 2026-06-01.** Pregled pre nego što `hartweger.rs` pređe na novu platformu.

## Konvencija domena

| Oznaka | Domen | Šta je |
|---|---|---|
| **SADA** | `kurs.hartweger.rs` | nova platforma (Next.js/Vercel) — trenutno ovde |
| **KASNIJE** | `hartweger.rs` | nova platforma posle migracije (glavni domen) |

> ⚠️ **Sudbina starog WordPress/LearnDash-a NIJE odlučena.** Ranija ideja o poddomenu (`stari.hartweger.rs`) bila je samo dobačena ideja — **ništa nije odlučeno, ništa zasad ne ide na stari**. Nijedna redirekcija ispod ne sme da cilja stari poddomen dok Nataša izričito ne odluči.

**Ključno:** interni linkovi na novom sajtu su **relativni** (`/kursevi`, `/o-natasi`) — oni se automatski sele kad domen pređe sa `kurs.` na glavni. NE treba ih dirati. Problem su samo **apsolutni (zakucani) linkovi** i **301 redirekcije sa starog WP-a**.

---

## 1. Stranice nove platforme (interni, relativni linkovi)

Svi rade preko relativnih putanja → automatski migriraju. ✅ = nema akcije.

| Stranica | Putanja | Status |
|---|---|---|
| Naslovna | `/` | ✅ |
| Katalog | `/kursevi` | ✅ |
| Detalj kursa | `/kursevi/[slug]` | ✅ |
| Paket landing | `/kursevi/paket-a1-a2-b1` | ✅ |
| Checkout | `/kupovina/[slug]` → `/kupovina/hvala` | ✅ |
| Grupni | `/grupni-kursevi` | ✅ |
| Individualni | `/individualni-kursevi` | ✅ |
| O Nataši | `/o-natasi` | ✅ |
| O timu | `/o-timu` | ✅ |
| Metodologija | `/metodologija` | ✅ |
| Besplatno testiranje | `/besplatno-testiranje` | ✅ |
| Magazin | `/magazin`, `/magazin/[slug]` | ✅ |
| Kontakt | `/kontakt` | ✅ |
| FAQ | `/faq` | ✅ |
| Provera sertifikata | `/provera-sertifikata` | ✅ |
| Uslovi | `/uslovi` | ✅ |
| Instaliraj (PWA) | `/instaliraj` | ⚠️ tekst zakucava `kurs.hartweger.rs` |
| Auth | `/prijava`, `/registracija`, `/reset-lozinke` | ✅ |
| Nalog | `/dashboard`, `/profil`, `/lekcija/[id]`, `/vezba/*`, `/sertifikat/[id]` | ✅ |
| Admin/Profesor | `/admin/*`, `/profesor/*` | ✅ |

---

## 2. Zakucani apsolutni linkovi u kodu — TREBA POPRAVITI

Ovi NEĆE migrirati sami jer imaju pun URL.

### 2a. ✅ SLIKE sa starog WP-a — REŠENO (2026-06-01)

Bilo BLOKER (pucale bi kad se WP ugasi). **Migrirano:** 106 slika → Supabase Storage bucket „blog-media" (javni). Prepisano: 75 blog thumbnaila + 15 sadržaja u bazi + 3 u kodu (hero, blog teaser, tim foto). Produkcija potvrđena — 0 WP slika na naslovnoj i magazinu. next.config već dozvoljava `*.supabase.co`.

Ostalo: 1 pokvaren string u postu „preterit" (nije prava slika) — za Natašu da očisti.

### 2b. 🟠 Email linkovi (`src/lib/email.ts`) — zakucan `kurs.hartweger.rs`

| Linija | Link |
|---|---|
| `email.ts:58` | `kurs.hartweger.rs/prijava` |
| `email.ts:65` | `kurs.hartweger.rs/instaliraj` |
| `email.ts:94` | `kurs.hartweger.rs/sertifikat/${id}` |
| `email.ts:139,205` | `kurs.hartweger.rs/dashboard` |

→ **Akcija:** zameniti za `hartweger.rs` (ili env varijablu `NEXT_PUBLIC_SITE_URL`) kad se odluči finalni domen.

### 2c. 🟠 Eksterni linkovi u katalogu (`KurseviKatalog.tsx`)

| Linija | Kartica | Sad vodi na | Treba |
|---|---|---|---|
| `:145` | Goethe B2 | `kurs.hartweger.rs/kurs/polozi-goethe-b2` | `/kursevi/polozi-goethe-b2` (kad dobije sadržaj — sad 0 lekcija) |
| `:204` | „Kako da naučiš reči" | `www.hartweger.rs/proizvod/...` | ODLUKA — migrirati ili ostaviti eksterno |
| `:205` | „NaKI AI asistent" | `www.hartweger.rs/naki-ai-asistent-nemacki/` | ODLUKA — NaKI combo plan |

### 2d. 🟢 SEO/metadata domen — već podešen na `www.hartweger.rs`

`layout.tsx` (metadataBase, OG), `sitemap.ts`, canonical — **već koriste `www.hartweger.rs`**, ne `kurs.`. To postaje TAČNO posle migracije. (Trenutno je mali nesklad: sajt servira sa `kurs.` a Google-u kaže da je canonical `www.` — razrešava se migracijom.)

---

## 3. 301 redirekcije: STARI WP → NOVO

Posle migracije, `hartweger.rs/{stara-putanja}` gađa novi sajt → treba 301 na novu putanju (u `next.config` / middleware). Inače stari Google linkovi i bookmarkovi pucaju.

### 3a. Stranice (page-sitemap)

| Stari WP URL | → Novo | Napomena |
|---|---|---|
| `/` | `/` | |
| `/kursevi-nemackog/` | `/kursevi` | |
| `/kursevi-nemackog/grupni-kursevi/` | `/grupni-kursevi` | |
| `/kursevi-nemackog/individualni-kursevi/` | `/individualni-kursevi` | |
| `/kursevi-nemackog/video-kursevi/` | `/kursevi` | |
| `/kursevi-nemackog/besplatno/` | `/kursevi` | |
| `/moja-metodologija/` | `/metodologija` | |
| `/o-natasi/` | `/o-natasi` | |
| `/o-nama/` | `/o-natasi` | o-timu spojen u o-natasi |
| `/kontakt/` | `/kontakt` | |
| `/cesto-postavljena-pitanja/` | `/faq` | |
| `/registracija/` | `/registracija` | |
| `/opsti-uslovi-poslovanja/` | `/uslovi` | |
| `/provera-sertifikata/` | `/provera-sertifikata` | |
| `/paket-od-a1-do-b1/` | `/kursevi/paket-a1-a2-b1` | |
| `/raspored-grupnih-kurseva/` | `/grupni-kursevi` | |
| `/prodavnica/` | `/kursevi` | |
| `/moj-nalog/` | **ODLUKA** | 🔴 postojeći studenti — sudbina starog WP-a nije odlučena |
| `/instructor-dashboard/` | **ODLUKA** | postojeći profesori — isto |
| `/kursevi-nemackog/za-preduzetnice/` | **`natasahartweger.rs/za-preduzetnice`** | lični brend |
| `/nh-academy/` | **`natasahartweger.rs/nh-academy`** | lični brend |
| `/kurs-nemackog-jezika-za-firme-vokum-metoda/` | **natasahartweger.rs** | B2B firme |
| `/trening-uzivo-kreiraj-kurs-koji-se-voli/` | **natasahartweger.rs** | B2B preduzetnice |
| `/od-individualne-do-grupne-nastave/` | **natasahartweger.rs** | B2B preduzetnice |
| `/naki-ai-asistent-nemacki/` | ODLUKA | NaKI — još nije odlučeno |
| `/clanice/` | `/` (301) | GASI SE — zajednica ne ostaje |
| `/🏆-nasa-zajednica-top-polaznici/` | `/` (301) | GASI SE — zajednica ne ostaje |
| `/plan-ucenja/` | `/` (301) | GASI SE — ne ostaje |
| `/claude-vodic/` | **`natasahartweger.rs`** | SELI SE — lični brend |
| `/placanje-platnom-karticom/` | `/uslovi` | |
| `/kurs-nemackog-jezika-a1/` | `/kursevi` | A1 landing → katalog |

### 3b. Proizvodi (`/proizvod/{slug}/` → `/kursevi/{slug}`)

Većina slugova se POKLAPA 1:1 (samo prefiks `/proizvod/` → `/kursevi/`).

**Tačno poklapanje (samo promeni prefiks):**
`individualni-polozi-fide`, `individualni-kurs-nemackog-jezika-b11`, `individualni-kurs-nemackog-jezika-b1-2`, `fsp`, `paket-a1-i-a2`, `individualni-kurs-nemackog-jezika-b2-1`, `individualni-kurs-nemackog-jezika-a2-2`, `paket-nivo-a1-a1-1-a1-2-individualni-standard`, `individualni-kurs-nemackog-jezika-a1-2`, `individualni-kurs-nemackog-jezika-a11`, `polozi-goethe-c1`, `grupni-kurs-nemackog-jezika-a2-2`, `grupni-kurs-c1-1`, `grupni-kurs-c1-2`, `grupni-kurs-nemackog-jezika-b1-1-2`, `grupni-kurs-b2-2`, `grupni-kurs-nemackog-jezika-a2`, `grupni-kurs-nemackog-jezika-a1-2-2`, `grupni-kurs-b2-1`, `grupni-kurs-nemackog-jezika-a1-1`, `grupni-kurs-nemackog-b1-2`

**Slug se razlikuje (treba mapiranje):**

| Stari `/proizvod/` | → Novi `/kursevi/` |
|---|---|
| `paket-a1-a2-i-b1` | `paket-a1-a2-b1` |
| `kurs-nemackog-za-mame-i-trudnice` | `kurs-za-mame-i-trudnice` |
| `gramatika-nemackog-jezika-a2-b1` | `gramatika-a2-b1` |
| `polozi-fide-ispit` | `polozi-fide` |
| `polozi-goethe-b1-sa-natasom-i-katarinom` | `polozi-goethe-b1` |
| `video-polozi-goethe-b2-sa-natasom-i-ankom` | `polozi-goethe-b2` (kad dobije sadržaj) |
| `kurs-nemackog-jezika-video-kurs-a1` | `video-kurs-a1` |
| `osnovna-ponuda-kurs-nemackog-jezika-a2` | `grupni-kurs-nemackog-jezika-a2` |
| `individualni-kurs-nemackog-jezika-a2-1` | `individualni-kurs-nemackog-jezika-a2` |
| `fsp-individualni-pripremni-kurs-nemackog-za-lekare` | `fsp-individualni` |
| `individualni-mesecni-paketi-izaberi-profesora-paket-i-kreni` | `individualni-mesecni-paketi` |
| `grupni-kurs-konverzacije-na-nemackom-jeziku-2` | `kurs-konverzacije` (proveri) |

**Nema ekvivalent na novom — odluke (2026-06-01):**

| Stari `/proizvod/` | Šta je | → Odluka |
|---|---|---|
| `osnovna-ponuda-kurs-nemackog-jezika-b2` | „osnovna ponuda" B2 — ukinuto | `/kursevi/grupni-kurs-b2-1` (grupni tog nivoa) |
| `osnovna-ponuda-kurs-b1` | „osnovna ponuda" B1 — ukinuto | `/kursevi/grupni-kurs-nemackog-jezika-b1-1-2` |
| `osnove-nemacke-gramatike` | stari gramatika proizvod | `/kursevi/gramatika-a2-b1` |
| `prevodjenje` | usluga prevođenja | **GASI SE** → `/` (301) |
| `izrada-biografije-ne-nemackom` | usluga CV | **GASI SE** → `/` (301) |
| `kreiranje-ponude` | B2B preduzetnice | **SELI SE** → `natasahartweger.rs` |
| `kreiraj-kurs-koji-se-voli` | B2B preduzetnice | **SELI SE** → `natasahartweger.rs` |
| `od-individualne-do-grupne-nastave-skaliraj-svoj-biznis` | B2B preduzetnice | **SELI SE** → `natasahartweger.rs` |
| `nh-academy-generacija-i-maj-2026` | NH Academy | **SELI SE** → `natasahartweger.rs` |
| `kako-da-naucis-reci-na-stranom-jeziku` | besplatan masterclass | **ODLUKA** — još otvoreno (uz NaKI) |

> Napomena: „osnovna ponuda" više ne postoji kao koncept — stari URL-ovi tog nivoa vode na grupni kurs istog nivoa da link ne pukne. Promeni ako treba drugačije.

### 3c. Blog (`/magazin/` ili stare post putanje)

Stari WP ima `post-sitemap.xml` (blog članci). Slugovi se verovatno poklapaju sa novim `/magazin/[slug]`, ali treba proveriti (zaseban korak — povući post-sitemap i uporediti).

---

## 4. Odluke

✅ **Rešeno (2026-06-01):**
- **2. Lični brend** (za preduzetnice / NH Academy / B2B firme) → **seli se na `natasahartweger.rs`**
- **4. Usluge bez kursa** (prevođenje, CV) → **gase se** (301 na naslovnu)
- **5. Zajednica / plan učenja / članice** → **ne ostaju, gase se** (301 na naslovnu)
- **6. „osnovna ponuda"** → ne postoji kao koncept; stari URL-ovi vode na grupni kurs istog nivoa

⏳ **Još otvoreno:**
- **1. Stari WordPress/LearnDash — šta radimo sa njim?** (poddomen bila samo ideja, NIJE odlučeno) Od toga zavisi `/moj-nalog/`, `/instructor-dashboard/`, svi postojeći studenti/profesori.
- **3. NaKI** — gde ide? (+ besplatni masterclass „Kako da naučiš reči")

---

## 5. Redosled rada (predlog)

1. Reši slike (2a) — prebaci na novi hosting (BLOKER).
2. Popravi email.ts (2b) i katalog eksterne (2c).
3. Napiši 301 redirekcije (sekcija 3) u `next.config`/middleware.
4. Uzmi Natašine odluke (sekcija 4) i popuni ODLUKA redove.
5. Proveri blog slugove (3c).
6. Tek onda zamena domena na Vercel-u + DNS.
