# Checkout Flow — Dizajn

## Pregled

Kupac kupuje kurs direktno sa stranice kursa — bez korpe, bez registracije.
Klikne "Kupi" → unese podatke → dobije instrukcije za uplatu → admin potvrdi → pristup kursu.

Kartice (NestPay) se dodaju kasnije, za sada samo uplatnica i PayPal.

---

## Kupčev flow

### 1. Stranica kursa → Checkout

- Na `/kursevi/[slug]` kupac klikne **"Kupi kurs"**
- Vodi na `/kupovina/[slug]`

### 2. Checkout stranica (`/kupovina/[slug]`)

**Prikazuje:**
- Naziv kursa + kratak opis
- Cena u RSD (+ EUR informativno za ino)

**Forma:**
- Ime i prezime (text)
- Email (email)
- Zemlja (dropdown, default: Srbija)

**Način plaćanja (dinamički po zemlji):**

| Zemlja | Opcije |
|--------|--------|
| Srbija | Uplatnica (dinarski račun) |
| Inostranstvo | PayPal (+12% provizija, EUR) |

**CTA:** "Naruči" dugme

### 3. Šta se dešava kad klikne "Naruči"

1. Kreira se `orders` red u bazi (status: `pending`)
2. Broj narudžbine: sekvencijalni (`2026-001`, `2026-002`...)
3. Ako korisnik ne postoji — kreira se automatski (kao u `grantAccess()`)
4. Redirect na `/kupovina/hvala/[orderId]`

### 4. Thank you stranica (`/kupovina/hvala/[orderId]`)

**Za uplatnicu (Srbija):**
- Primalac: Hartweger, Beograd, 11070 Beograd
- Broj računa: `170-10559767000-18`
- Šifra plaćanja: 189
- Poziv na broj: `2026-XXX` (broj narudžbine)
- Svrha: "Placanje porudzbine #XXX"
- IPS QR kod (obavezno — kupac skenira i plati iz bankovne aplikacije)

**Za PayPal (inostranstvo):**
- Cena u EUR (+ 12% provizija)
- Dugme/link: `paypal.com/paypalme/natasahartweger1/{iznos}`
- Napomena: navesti broj narudžbine u PayPal poruci

### 5. Mejl sa instrukcijama

Isti sadržaj kao thank you stranica, šalje se automatski preko Resend (`kurs@hartweger.rs`).

---

## Admin flow

### Admin narudžbine stranica (`/admin/narudzbine`)

**Lista narudžbina:**
- Ime, email, kurs, iznos, način plaćanja, status, datum
- Filteri: pending / completed / sve
- Sortiranje: najnovije prvo

**Akcije po narudžbini:**
- **"Označi kao plaćeno"** dugme (samo za pending):
  1. Menja `payment_status` → `completed`
  2. Pokreće `grantAccess()` — daje pristup kursu
  3. Menja `granted` → `true`
  4. Šalje welcome mejl kupcu (postojeći `sendWelcomeEmail()`)

- **Admin kreiranje narudžbine** (za izuzetne slučajeve):
  - Isti flow kao checkout, ali admin unosi podatke umesto kupca

---

## Baza podataka

### `orders` tabela (već definisana u migraciji 021)

```sql
orders (
  id UUID PRIMARY KEY,
  user_id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,          -- null za sada (ne prikupljamo)
  country TEXT DEFAULT 'RS',
  items JSONB,         -- [{course_id, course_slug, title, price}]
  subtotal INT,        -- cena u RSD
  discount INT,        -- popust (0 za sada)
  total INT,           -- ukupno u RSD
  coupon_code TEXT,    -- null za sada
  payment_method TEXT, -- 'uplatnica' | 'paypal'
  payment_status TEXT DEFAULT 'pending',  -- 'pending' | 'completed'
  nestpay_transaction_id TEXT,  -- null za sada
  paypal_note TEXT,    -- EUR iznos, ref
  granted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ
)
```

### Broj narudžbine

- Format: `{godina}-{sekvencijalni broj}` npr. `2026-001`
- Koristi se kao poziv na broj za uplatnice
- Generisanje: query max order number za tekuću godinu + 1

---

## Mejlovi

### 1. Instrukcije za uplatu (novi mejl)

Šalje se odmah posle narudžbine. Sadržaj zavisi od načina plaćanja:

**Uplatnica:** broj računa, poziv na broj, svrha, iznos
**PayPal:** link za uplatu, EUR iznos, napomena da navedu broj narudžbine

### 2. Welcome mejl (postojeći)

Šalje se kad admin potvrdi uplatu. Već postoji u `src/lib/email.ts`.

---

## Rute i fajlovi

| Fajl | Opis |
|------|------|
| `src/app/kupovina/[slug]/page.tsx` | Checkout stranica |
| `src/app/kupovina/hvala/[orderId]/page.tsx` | Thank you stranica |
| `src/app/api/orders/route.ts` | POST — kreiranje narudžbine |
| `src/app/api/admin/orders/[id]/confirm/route.ts` | POST — admin potvrda uplate |
| `src/app/admin/narudzbine/page.tsx` | Admin lista narudžbina |
| `src/lib/email.ts` | + nova `sendPaymentInstructionsEmail()` |
| `src/components/AdminSidebar.tsx` | + link "Narudžbine" |

---

## Šta NE radimo (za sada)

- NestPay / kartice — dodaje se kad bude prebacivanje domena
- Korpa — nije potrebna, jedan kurs = jedna narudžbina
- Kuponi — tabela postoji ali UI i logika čekaju
- Rate (Banca Intesa) — vezano za NestPay
- Registracija pre kupovine — nalog se kreira automatski
- Fakture / fiskalizacija — vezano za kartice (NestPay), dolazi zajedno sa njim

---

## Tehnički detalji

- Checkout stranica: server component za kurs podatke + client form
- Orders API: koristi `createAdminClient()` za kreiranje korisnika
- Sekvencijalni broj: `SELECT COUNT(*) FROM orders WHERE created_at >= '2026-01-01'` + 1
- PayPal provizija: hardkodovan EUR kurs (admin menja ručno), cena = `Math.ceil(cenaRSD / EUR_RATE * 1.12)`
- Samo kursevi sa `is_purchasable = true` se prikazuju na checkout-u
- Zemlja dropdown: Srbija default, ostale zemlje ispod
