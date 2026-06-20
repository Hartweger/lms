# Kupon: video FSP kupci → popust na individualni FSP

Datum: 2026-06-20

## Dodatak (2026-06-20): prof-kuponi 10% na individualne pakete

Pored FSP1NA1, u istom radu prave se i **prof-kuponi**: po jedan kod na ime
profesorke (`IME10`), 10% popusta, koji profesorka deli lično polaznicima.

- **Kodovi:** DANICA10, HRISTINA10, KATARINA10, MARIJA10, MILICA10, SUZANA10,
  NATASA10. `discount_type='percent'`, `amount=10`.
- **Važi samo** na individualne 1:1 pakete od 4/8/12 termina, tj. kada je izabrani
  `package_type` ∈ {`paket4`, `paket8`, `paket12`}. Ne važi za mesečne pakete,
  video kurseve ni jednokratne (null package_type).
- **Istek:** 31.08.2026 (`expires_at`).
- **Bez** provere vlasništva, bez `once_per_email`, bez limita korišćenja
  (profesorka deli lično, više polaznika sme isti kod).
- **Mehanizam (reusable):** novi flag `coupons.term_packages_only boolean`. Kada
  je `true`, kupon važi samo ako je `package_type` jedan od paket4/8/12.
  Proverava se u `orders` (izvor istine) i `validate` (UX); `CheckoutForm` šalje
  `packageType` u `validate`. Skup paketa: `TERM_PACKAGE_TYPES` (jedan izvor).

## Cilj

Polaznik koji je kupio **video FSP** kurs (`fsp`) može da kupi **individualni FSP**
(`fsp-individualni`) sa fiksnim popustom jednakim ceni video kursa
(**5.960 RSD / 51 €**), tako da ne plaća dva puta preklapajući sadržaj.

Popust se primenjuje preko **kupon koda** koji kupac unese u checkout-u; sistem
proverava po mejlu da li zaista poseduje video FSP.

Mehanizam je **generički / reusable**: zasniva se na paru „prerekvizit kurs →
ciljni kurs", pa se isti obrazac kasnije može upotrebiti za druge nivoe
(A1/A2/B1 video → 1:1) dodavanjem novog reda u bazu, bez izmene koda.

## Odluke (potvrđeno sa korisnikom)

- **Tip popusta:** fiksni iznos u RSD = cena videa (5.960 RSD). PayPal EUR se
  automatski izvodi iz umanjene RSD cene (`calculatePaypalEur(finalPrice)`), pa
  poseban EUR iznos nije potreban. Ne procenat (procenat ne daje isti dinarski
  iznos u RSD i EUR).
- **Provera prava:** kod + provera po mejlu da poseduje video FSP. Ko nije kupio
  video — kod ne radi.
- **Domet:** kod važi **samo na individualni FSP**, ne na bilo koji drugi 1:1 kurs.
- **Naziv koda:** `FSP1NA1`.
- **Rok trajanja:** bez isteka (zaključan na vlasništvo + jednom po mejlu).
- **Grupni FSP:** ne ulazi (ne postoji kao proizvod).

## Trenutno stanje (zatečeni kod)

- Tabela `coupons` (migracija `021_marketing_tables.sql`) ima: `code`,
  `discount_type` (text, ali se svuda tretira kao „percent"), `amount`,
  `max_uses`, `usage_count`, `expires_at`, `is_active`.
- Napredna ograničenja (migr. 051/052): `video_only`, `once_per_email`,
  `new_customers_only`, `renewal_only`. Postavljaju se SQL-om, ne kroz admin UI.
- `src/lib/coupon-ownership.ts` već ima `emailOwnsCourse(admin, email, courseId)`
  (gleda `course_access` + `individual_enrollments`) — koristi se za `renewal_only`.
- `/api/coupons/validate/route.ts` i `/api/orders/route.ts` obračunavaju popust
  **samo kao procenat** (`discountPercent = Number(coupon.amount)`).
- `CheckoutForm.tsx` prikazuje i računa **samo procentualni** popust.
- Admin forma za kupone (`/admin/kuponi`) je samo-procentualna; napredni kuponi
  se prave SQL-om.

Cene (iz seed skripti):
- video FSP `fsp`: 5.960 RSD / 51 €
- individualni FSP `fsp-individualni`: ~20.500–23.000 RSD / 197 € (stvarna cena
  iz `product_variants` izabrane na checkout-u)

## Dizajn

### 1. Baza — nova migracija

Dodati u `coupons`:

- `requires_course_id uuid references courses(id)` — kupon važi samo ako mejl
  **poseduje** taj kurs (prerekvizit).
- `applies_to_course_id uuid references courses(id)` — kupon se sme iskoristiti
  **samo pri kupovini** tog kursa (ciljni kurs).

Kolona `discount_type` (već postoji) dobija drugo dozvoljeno značenje `'fixed'`
pored postojećeg `'percent'`. Kada je `'fixed'`, `amount` je RSD iznos popusta;
kada je `'percent'`, `amount` je procenat (kao do sada). EUR se izvodi iz RSD-a,
pa poseban EUR iznos nije potreban.

Seed kupona (SQL, kao i ostali napredni kuponi):

```
code = 'FSP1NA1'
discount_type = 'fixed'
amount = 5960
requires_course_id   = (id kursa sa slug='fsp')
applies_to_course_id = (id kursa sa slug='fsp-individualni')
once_per_email = true
is_active = true
expires_at = null
```

### 2. Logika — `/api/coupons/validate` i `/api/orders`

Obe rute dele istu logiku validacije; izmene su simetrične.

**Nove provere:**
- `requires_course_id`: ako je postavljen i `emailOwnsCourse(email, requires_course_id)`
  je `false` → greška: *„Ovaj kod važi samo za polaznike koji su kupili video FSP kurs."*
  (Ako mejl nije unet → tražiti unos mejla, kao kod `renewal_only`.)
- `applies_to_course_id`: ako je postavljen i kupovani kurs nije taj → greška:
  *„Ovaj kod važi samo za individualni FSP kurs."*

**Obračun popusta po `discount_type`:**
- `percent` → kao sad: `discount = round(unitPrice * amount / 100)`.
- `fixed` → `discount = min(amount, unitPrice)` (clamp: popust ne sme da premaši
  cenu, finalna cena nikad negativna). Sve u RSD; PayPal EUR se i dalje izvodi
  iz `finalPrice` preko `calculatePaypalEur`, pa je EUR popust automatski tačan.

`validate` vraća dovoljno informacija da checkout prikaže tačnu cenu:
tip popusta + iznos(e) (RSD i EUR po potrebi).

### 3. Frontend — `CheckoutForm.tsx`

- Stanje `appliedCoupon` proširiti tipom popusta i iznosima.
- Prikaz: za fixed → „Kupon FSP1NA1 − 5.960 RSD popusta" (PayPal: „− 51 €").
- Obračun finalne cene: za RSD metode skida RSD iznos, za PayPal EUR iznos,
  uz isti clamp kao na serveru.

### 4. Van obima (zasad)

- Admin UI za kreiranje fixed / requires_course / applies_to_course kupona.
  Kupon se za sada pravi SQL-om (kao postojeći `renewal_only`/`video_only`).
  Može se dodati kasnije.

## Testovi

- Obračun `fixed`: `discount = min(amount, unitPrice)`.
- Clamp: popust veći od cene → finalna cena = 0, nikad negativna.
- `requires_course_id`: mejl koji poseduje video FSP prolazi; koji ne poseduje
  dobija grešku; bez mejla → traži mejl.
- `applies_to_course_id`: kod na individualnom FSP prolazi; na drugom kursu pada.
- `once_per_email`: drugi pokušaj istog mejla pada.
- Regresija: postojeći procentualni kuponi (npr. NAKI10, OBNOVI50) rade kao pre.

## Edge case-evi

- Popust ≥ cena varijante → clamp na 0 (u praksi nemoguće: video 5.960 <<
  individualni ~20.500).
- Mejl mora biti unet pre primene koda.
- Mejl bez video FSP-a → kod odbijen.
- Kupovina nekog drugog 1:1 kursa sa ovim kodom → odbijen.
