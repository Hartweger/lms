# Kuponi + Admin kreiranje narudžbina — Dizajn

## 1. Kuponi

### Tabela (već postoji — migracija 021)

```sql
coupons (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE,
  discount_type TEXT,       -- 'percent' (jedini tip za sada)
  amount NUMERIC,           -- procenat popusta (npr. 20 = 20%)
  min_order INT,            -- null za sada
  max_uses INT,             -- null = neograničeno
  usage_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,   -- null = ne ističe
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ
)
```

### Checkout integracija

- Na checkout stranici: "Imaš kupon?" link ispod forme
- Klik otvara input + dugme "Primeni"
- GET `/api/coupons/validate?code=XXX` — proverava:
  - Postoji li kupon
  - is_active = true
  - Nije istekao (expires_at > now ili null)
  - usage_count < max_uses (ili max_uses je null)
- Ako važi: prikazuje precrtanu staru cenu + novu sa popustom
- Popust: `Math.round(price * (1 - amount / 100))`
- Na submit narudžbine: coupon_code + discount se čuvaju u orders tabeli
- usage_count se incrementuje atomično

### Admin kuponi stranica (`/admin/kuponi`)

- Lista kupona: kod, popust %, max korišćenja, iskorišćeno, ističe, aktivan/neaktivan
- Kreiranje novog kupona: kod, procenat, max korišćenja (opciono), datum isteka (opciono)
- Deaktivacija/aktivacija kupona (toggle)
- Nema brisanja — samo deaktivacija

---

## 2. Admin kreiranje narudžbine

### Na `/admin/narudzbine` — dugme "Nova narudžbina"

Forma:
- Email kupca (text input)
- Izbor kursa (dropdown — svi is_purchasable kursevi)
- Iznos u RSD (ručni unos — admin odlučuje cenu)
- Način plaćanja: uplatnica / paypal
- Checkbox: "Označi odmah kao plaćeno"

### Submit flow:

1. Kreira korisnika ako ne postoji (isti pattern kao checkout)
2. Kreira order u bazi
3. Ako "odmah plaćeno" → odmah grantAccess + welcome mejl
4. Ako nije → pending, admin potvrdi kasnije

---

## Rute i fajlovi

| Fajl | Opis |
|------|------|
| `src/app/api/coupons/validate/route.ts` | GET — validacija kupona |
| `src/app/kupovina/[slug]/CheckoutForm.tsx` | + kupon polje (modify) |
| `src/app/api/orders/route.ts` | + kupon logika (modify) |
| `src/app/admin/kuponi/page.tsx` | Admin lista kupona |
| `src/app/admin/kuponi/KuponiClient.tsx` | Client component — CRUD |
| `src/app/api/admin/coupons/route.ts` | GET + POST kuponi |
| `src/app/api/admin/coupons/[id]/route.ts` | PATCH — toggle active |
| `src/app/admin/narudzbine/NarudzbineClient.tsx` | + "Nova narudžbina" forma (modify) |
| `src/app/api/admin/orders/route.ts` | + POST za admin kreiranje (modify) |
| `src/components/AdminSidebar.tsx` | + link "Kuponi" (modify) |
