# WooCommerce Sync + Migracija — Dizajn

## Cilj

1. Kad kupac kupi kurs na hartweger.rs (WooCommerce), automatski dobija pristup na LMS-u (kurs.hartweger.rs)
2. Postojećih 253 A1 kupaca dobija pristup preko migration skripte + grupni mejl

## Deo 1: Webhook za nove kupovine

### Flow

```
hartweger.rs (WooCommerce)
  ↓ order status → "completed"
  ↓ webhook POST
kurs.hartweger.rs/api/wc-webhook
  ↓ validira HMAC potpis
  ↓ proverava da je status "completed" (ignoriše ostale)
  ↓ izvlači email + product IDs
  ↓ mapira product → LMS kursevi
  ↓ kreira Supabase nalog (ako ne postoji)
  ↓ dodaje course_access (1 godina)
```

### 1. API ruta: `/api/wc-webhook/route.ts`

- Prima POST od WooCommerce
- Validira HMAC SHA256 potpis (header `X-WC-Webhook-Signature`) sa tajnom
- **Proverava `status` polje** — procesira SAMO ako je `"completed"`. Za sve ostale statuse vraća 200 OK bez akcije (jer "Order updated" webhook se šalje za svaku promenu statusa)
- Izvlači iz order payload-a:
  - `billing.email` — email kupca
  - `line_items[].product_id` — kupljeni proizvodi
- Poziva deljenu funkciju `grantAccess(email, productIds)`
- Vraća 200 OK (WooCommerce očekuje 200, inače retry-uje 5 puta)

### 2. Deljena logika: `/lib/wc-sync.ts`

Funkcija `grantAccess(email: string, productIds: number[])`:

1. Mapira product IDs na LMS course slugove koristeći `WC_PRODUCT_MAP`
2. Ako nema mapiranih kurseva → return (nepoznat proizvod)
3. Traži korisnika u Supabase Auth po emailu
4. Ako ne postoji → `supabase.auth.admin.createUser({ email, email_confirm: true })`
5. Za svaki mapirani kurs:
   - Nađi `course_id` iz `courses` tabele po slug-u
   - Proveri `course_access` za tog korisnika + kurs
   - Ako ne postoji → INSERT sa `expires_at = NOW() + 1 year`
   - Ako postoji i nije istekao → preskoči
   - Ako je istekao → UPDATE `expires_at = NOW() + 1 year`
6. Vraća `{ userId, coursesGranted, isNewUser }`

### 3. Mapiranje: `/lib/wc-product-map.ts`

```typescript
// WC product ID → LMS course slugs
// Product ID-evi se izvlače iz WC API-ja pre implementacije
const WC_PRODUCT_MAP: Record<number, string[]> = {
  // Svi A1 proizvodi → oba A1 kursa
  // VIDEO kurs A1
  XXXX: ["nemacki-a1-1", "nemacki-a1-2"],
  // Paket A1+A2+B1
  YYYY: ["nemacki-a1-1", "nemacki-a1-2"],
  // itd — popuniti pravim ID-evima
};
```

Pre implementacije: izvući prave product ID-eve iz WC API-ja (`/wp-json/wc/v3/products`).

### 4. WooCommerce webhook (ručno podešavanje)

U WP Admin → WooCommerce → Settings → Advanced → Webhooks → Add webhook:
- **Name**: LMS Sync
- **Status**: Active
- **Topic**: Order updated
- **Delivery URL**: `https://kurs.hartweger.rs/api/wc-webhook`
- **Secret**: generisani tajni ključ (isti kao `WC_WEBHOOK_SECRET` env var)

### 5. Env varijable (Vercel)

- `WC_WEBHOOK_SECRET` — tajni ključ za HMAC validaciju
- `SUPABASE_SERVICE_ROLE_KEY` — već postoji

---

## Deo 2: Migracija postojećih 253 kupaca

### Flow

```
scripts/migrate-existing-customers.ts
  ↓ čita completed ordere iz WC API (ili sačuvanih JSON fajlova)
  ↓ za svakog kupca: grantAccess(email, productIds)
  ↓ loguje: kreiran/već postoji/greška
  ↓ na kraju: lista svih novih korisnika sa magic link URL-ovima
```

### Migration skript: `scripts/migrate-existing-customers.ts`

1. Čita WC ordere (imamo ih u `/tmp/wc_orders_*.json` ili ponovo sa API-ja)
2. Filtrira samo `status: completed` ordere iz poslednje godine
3. Grupiše po email-u (jedan kupac može imati više ordera)
4. Za svakog: poziva `grantAccess(email, productIds)` — ista funkcija kao webhook
5. Za nove korisnike: generiše magic link (`supabase.auth.admin.generateLink({ type: 'magiclink', email })`)
6. Na kraju: ispisuje CSV sa `email, status (new/existing), magic_link_url`

### Slanje mejla — MailerLite kampanja

Posle migration skripte:
1. Eksportuj listu mejlova (253 adrese) u CSV
2. Kreiraj kampanju u MailerLite sa tekstom:

> **Tvoj kurs je sada na novoj platformi!**
>
> Dragi polazniče,
>
> Tvoj kurs nemačkog je sada dostupan na novoj, bržoj platformi.
> Uloguj se ovde: https://kurs.hartweger.rs
>
> Koristi isti email sa kojim si kupio/la kurs.
> Na stranici za prijavu klikni "Pošalji mi link za prijavu" i dobićeš mejl za pristup.

(Nema individualizovanih magic linkova u mejlu — jednostavnije je da korisnik sam zatraži link na login stranici)

### Redosled lansiranja

1. Izvuci WC product ID-eve i popuni mapu
2. Deploy webhook API rutu
3. Podesi webhook u WooCommerce admin
4. Testiraj sa test orderom
5. Pokreni migration skript za 253 kupaca
6. Pošalji MailerLite kampanju

---

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

- HMAC SHA256 validacija webhook-a
- Samo POST metod
- Idempotentno — dupli pozivi ne stvaraju dupli pristup
- Service role key samo server-side
- Migration skript se pokreće lokalno (ne deployuje se)

## Edge cases

- **Kupac već ima nalog (Google login)**: pronađe se po emailu, doda se course_access
- **Kupac već ima pristup koji nije istekao**: preskoči se
- **Pristup istekao**: produži za 1 godinu od danas
- **Nepoznat product ID**: ignoriše se
- **Webhook retry**: idempotentnost pokriva
- **Dupli orderi istog kupca**: grupisanje po emailu, pristup se daje jednom
- **Order sa više proizvoda**: svaki product_id se obrađuje zasebno
