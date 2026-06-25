# Engleska verzija ponude: individualni mesečni paketi (1-on-1 sa Katarinom)

Datum: 2026-06-25
Status: odobren dizajn, čeka plan

## Cilj

Ponuditi postojeću ponudu „Individualni mesečni paketi" na engleskom jeziku, za
strance koji uče nemački preko engleskog (ekspati, internacionalna publika).
Cela landing stranica i checkout su na engleskom. Nastavu drži profesorka
**Katarina Todosijević** (katarina@hartweger.rs) na engleskom. Cene su **25% više**
od srpske ponude, prikazane **primarno u EUR**.

Obim: **samo mesečni paketi**. Nije pun i18n sajta niti prevod ostalih kurseva.

## Pristup (izabran: A)

`lang` flag na proizvodu; isti šabloni (`kursevi/[slug]`, `kupovina/[slug]`,
`CheckoutForm`, `ProductFaq`) renderuju engleski kad je `lang='en'`. Bez nove
URL strukture, bez diranja logike plaćanja/fiskalizacije.

## Podaci (Supabase)

1. Nova kolona `courses.lang text not null default 'sr'`. Svi postojeći redovi → `'sr'`.
2. Novi proizvod (jedan red u `courses`):
   - `slug = 'private-german-lessons-online'` → `/kursevi/private-german-lessons-online`
   - `lang = 'en'`, `category = 'mesecni'`, `course_type` = isto kao srpski mesečni
   - `is_purchasable = true`, `is_published` = po potrebi (proizvod, ne sadržaj)
   - `price` = 16400 (entry/paket4, radi „od" i fallback), `paypal_price_eur = 140`
   - engleski `title`, `description`, `marketing_description`, `features`
3. Tri `product_variants` (sve `professor_id` = Katarina Todosijević
   `f555ef90-407d-486b-a288-576d4d461148`, `is_active=true`):

   | package_type | price (din) | paypal_price_eur |
   |---|---|---|
   | paket4  | 16400 | 140 |
   | paket8  | 32800 | 280 |
   | paket12 | 49100 | 420 |

   Honorar profesorke za engleske časove se NE rešava u kodu: prof upisuje razliku
   kao „dodatnu aktivnost", admin (Nataša) odobrava. Tarifa `honorar_ind` ostaje ista.

   RSD ostaje radi naplate karticom (NestPay) i fiskalizacije — kartica se skida u
   dinarima, kupac konvertuje preko banke (kao i sad za strance). EUR se prikazuje
   primarno. `paypal_price_eur` se popunjava po varijanti (sad je null na srpskim).

## Renderovanje

Princip: mala mapa stringova po jeziku (sr/en) tamo gde su tekstovi hardkodirani.
Gde je moguće, koristi se postojeća logika; menja se samo jezik i redosled valute.

### Landing (`src/app/kursevi/[slug]/page.tsx`)
- Učitati `lang` iz `courses`. `const en = course.lang === 'en'`.
- Engleski svi hardkodirani srpski stringovi: badge (categoryConfig label), naslovi
  sekcija (`featuresTitle`, „Šta uključuje paket?"), info-blok mesečnog paketa,
  donji CTA („Spremi se da progovoriš…"), breadcrumb, „din", „od", related naslov,
  rating tekst, JSON-LD `inLanguage`/provider po potrebi.
- **EUR primarno**: € veliko, din sitno (obrnuto od srpskog).
- Info-blok: umesto „Birate profesorku u sledećem koraku" →
  „1-on-1 with Katarina — taught in English". (isti mehanizam kao `fsp-individualni`
  koji već skriva izbor profesorke; uslov proširiti na `en`.)
- Engleski marketing tekst + features se pišu i odobravaju pre implementacije.

### Checkout (`src/app/kupovina/[slug]/page.tsx` + `CheckoutForm.tsx`)
- Proslediti `lang` u `CheckoutForm`.
- Engleski: naslov „Checkout", labele (ime, email, zemlja), nazivi paketa
  („4 sessions / 8 sessions / 12 sessions"), metode plaćanja (Card / Bank transfer /
  PayPal), lista zemalja (engleski nazivi), dugmad, poruke grešaka, kupon UI.
- Jedna profesorka → selektor profesorke se ne prikazuje (auto-Katarina); paket
  selektor ostaje.
- **EUR primarno** u prikazu cene i sumi.
- Default zemlja za `en` nije RS (npr. prazno/„Other") da se istaknu kartica/PayPal.

### FAQ (`src/components/product/ProductFaq.tsx`)
- Engleska varijanta pitanja/odgovora za `lang='en'` (mesečni paket kontekst).

## Filtriranje sr/en (da se ne pomešaju)
- `/kursevi` lista i „Možda će te zanimati" (related upit) isključuju `lang='en'`
  (`.eq('lang','sr')` ili `.neq('lang','en')`).
- EN proizvod dostupan preko direktnog linka i footer linka.

## Pronalaženje
- Footer (`src/components/Footer.tsx`): mali link **„English"** →
  `/kursevi/private-german-lessons-online`.
- Nije u glavnoj (srpskoj) navigaciji.

## Marketing ugao (za stranu publiku)

Drugačija poruka od srpske kopije. Pet aduta (hero + features):
- **Taught fully in English** — objašnjenja na engleskom od prvog dana
- **Flexible scheduling across time zones** — kupac bira termin (Google Calendar)
- **1-on-1, fully personalized** — privatno, tempo prilagođen polazniku
- **No long-term commitment** — mesečni paket, otkazivanje kad želi
- **Pay in EUR** — jasna cena u evrima
Brend signali poverenja zadržati (Hartweger, 300+ Google recenzija, VoKuM metoda) —
publika ne poznaje školu pa poverenje treba eksplicitno graditi.

## Van obima (YAGNI)
- Pun i18n sajta, locale routing, engleska navigacija/footer (osim jednog linka),
  prevod ostalih kurseva, posebna engleska početna stranica.

## Rizici / napomene
- Plaćanje karticom ostaje u RSD (fiskalizacija vezana za RSD). EUR je prikaz +
  PayPal. To je prihvaćeno ponašanje (isto kao sad za strane kupce).
- Prevod checkouta je glavni i najosetljiviji deo — ne dirati tok plaćanja, samo jezik.
- Profesorka Katarina mora imati kapacitet za nove termine na engleskom (operativno,
  van koda).

## Verifikacija
- EN landing renderuje sve na engleskom, EUR primarno, bez izbora profesorke.
- Checkout EN: jezik engleski, jedna profesorka, EUR primarno, plaćanje prolazi
  (smoke na test poručivanju).
- Srpska `/kursevi` lista NE prikazuje EN proizvod; EN „related" NE vuče srpske.
- Footer „English" link vodi na EN stranicu.
