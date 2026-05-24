# WooCommerce Sync — Dizajn

## Cilj

Kad kupac kupi kurs na hartweger.rs (WooCommerce), automatski dobija pristup na LMS-u (kurs.hartweger.rs). Bez ručnog rada.

## Flow

```
hartweger.rs (WooCommerce)
  ↓ order status → "completed"
  ↓ webhook POST
kurs.hartweger.rs/api/wc-webhook
  ↓ validira HMAC potpis
  ↓ izvlači email + product IDs
  ↓ mapira product → LMS kursevi
  ↓ kreira Supabase nalog (ako ne postoji)
  ↓ dodaje course_access (1 godina)
  ↓ šalje magic link mejl za prvi login
```

## Komponente

### 1. API ruta: `/api/wc-webhook/route.ts`

- Prima POST od WooCommerce
- Validira HMAC SHA256 potpis (header `X-WC-Webhook-Signature`) sa tajnom
- Izvlači iz order payload-a:
  - `billing.email` — email kupca
  - `line_items[].product_id` — kupljeni proizvodi
- Za svaki proizvod koji se mapira na LMS kurs:
  - Proveri da li korisnik postoji u Supabase Auth (po emailu)
  - Ako ne → `supabase.auth.admin.createUser({ email, email_confirm: true })`
  - Za svaki mapirani kurs → `INSERT INTO course_access (user_id, course_id, expires_at)` sa `expires_at = NOW() + 1 year`
  - Ako `course_access` već postoji i nije istekao → preskoči
  - Ako je istekao → produži za 1 godinu od danas
- Vraća 200 OK (WooCommerce očekuje 200, inače retry-uje)

### 2. Mapiranje: `/lib/wc-product-map.ts`

```typescript
// WC product ID → LMS course slugs
const WC_PRODUCT_MAP: Record<number, string[]> = {
  // VIDEO kurs A1
  12345: ["nemacki-a1-1", "nemacki-a1-2"],
  // Paket A1+A2+B1
  12346: ["nemacki-a1-1", "nemacki-a1-2"],
  // ... ostali A1 proizvodi
};
```

Product ID-evi se popunjavaju iz WooCommerce admin panela. Za sad svi A1 proizvodi → A1.1 + A1.2. Kad A2/B1 budu spremni, dodaju se novi redovi.

### 3. WooCommerce webhook (ručno podešavanje)

U WP Admin → WooCommerce → Settings → Advanced → Webhooks:
- **Name**: LMS Sync
- **Status**: Active
- **Topic**: Order updated
- **Delivery URL**: `https://kurs.hartweger.rs/api/wc-webhook`
- **Secret**: generisani tajni ključ (čuva se u Vercel env var `WC_WEBHOOK_SECRET`)

### 4. Env varijable (Vercel)

- `WC_WEBHOOK_SECRET` — tajni ključ za HMAC validaciju
- `SUPABASE_SERVICE_ROLE_KEY` — već postoji, za admin operacije

## Baza

Koristi postojeću `course_access` tabelu:

```sql
-- Već postoji
CREATE TABLE course_access (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES courses(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Sigurnost

- HMAC SHA256 validacija — odbija request ako potpis ne odgovara
- Samo POST metod
- Idempotentno — dupli webhook ne stvara dupli pristup
- Service role key se koristi samo server-side (API ruta)

## Edge cases

- **Kupac već ima nalog**: pronađe se po emailu, samo se doda course_access
- **Kupac već ima pristup koji nije istekao**: preskoči se
- **Pristup istekao**: produži za 1 godinu od danas
- **Nepoznat product ID**: ignoriše se (ne mapira se na LMS kurs)
- **Webhook retry**: WooCommerce retry-uje 5 puta ako ne dobije 200 — idempotentnost to pokriva

## Šta NE pokriva ovaj spec

- Fallback polling (može se dodati kasnije kao cron)
- Migracija postojećih 253 korisnika (zaseban zadatak)
- Email notifikacija kupcu o novom LMS nalogu (magic link je dovoljan za sad)
