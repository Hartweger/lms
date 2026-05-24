# WooCommerce Sync + Migracija — Dizajn

## Cilj

1. Kad kupac kupi kurs na hartweger.rs (WooCommerce), automatski dobija pristup na LMS-u (kurs.hartweger.rs)
2. Postojećih 253 A1 kupaca dobija pristup preko migration skripte + grupni mejl
3. Supabase baza je izvor istine — spoljni sistemi (Apps Script) mogu čitati preko REST API-ja

## Deo 1: Webhook za nove kupovine

### Flow

```
hartweger.rs (WooCommerce)
  ↓ order status → "completed"
  ↓ webhook POST (topic: order.completed)
kurs.hartweger.rs/api/wc-webhook
  ↓ validira HMAC potpis
  ↓ izvlači email + product IDs + billing info
  ↓ mapira product → LMS kursevi
  ↓ kreira Supabase nalog + user_profiles (ako ne postoji)
  ↓ dodaje course_access (1 godina od danas)
  ↓ loguje u Vercel logs
```

### 1. API ruta: `/api/wc-webhook/route.ts`

- Prima POST od WooCommerce
- Validira HMAC SHA256 potpis (header `X-WC-Webhook-Signature`) sa tajnom
- Webhook topic je "Order status changed to completed" — šalje se samo za completed ordere
- Izvlači iz order payload-a:
  - `billing.email` — email kupca
  - `billing.first_name`, `billing.last_name` — ime za user_profiles
  - `line_items[].product_id` — kupljeni proizvodi
- Poziva deljenu funkciju `grantAccess(email, name, productIds)`
- Loguje rezultat (console.log — vidljivo u Vercel logovima)
- Vraća 200 OK (WooCommerce retry-uje 5 puta ako ne dobije 200)

### 2. Deljena logika: `/lib/wc-sync.ts`

Funkcija `grantAccess(email, name, productIds, expiresAt?)`:

1. Mapira product IDs na LMS course slugove koristeći `WC_PRODUCT_MAP`
2. Ako nema mapiranih kurseva → return (nepoznat proizvod)
3. Traži korisnika u Supabase Auth po emailu
4. Ako ne postoji:
   - `supabase.auth.admin.createUser({ email, email_confirm: true })`
   - Kreira `user_profiles` entry sa `full_name` (za sertifikat)
5. Za svaki mapirani kurs:
   - Nađi `course_id` iz `courses` tabele po slug-u
   - Proveri `course_access` za tog korisnika + kurs
   - Ako ne postoji → INSERT sa `expires_at`
   - Ako postoji i nije istekao → preskoči
   - Ako je istekao → UPDATE `expires_at` (progres se zadržava)
6. Vraća `{ userId, coursesGranted, isNewUser }`

### 3. Mapiranje: `/lib/wc-product-map.ts`

```typescript
// WC product ID → LMS course slugs
const WC_PRODUCT_MAP: Record<number, string[]> = {
  // Product ID-evi se izvlače iz WC API pre implementacije
  // Za sad svi A1 proizvodi → oba A1 kursa
  // VIDEO kurs A1, Paket A1+A2+B1, Paket A1+A2, Grupni A1.1, Grupni A1.2, Obnavljanje
  // VAŽNO: Individualni kursevi (1-na-1 sa profesorom) NE daju LMS pristup
};
```

**Ko dobija pristup:** VIDEO kurs, grupni kursevi, paketi, obnavljanje.
**Ko NE dobija:** Individualni kursevi (1-na-1 časovi sa profesorom).
**Paketi A1+A2+B1:** Za sad samo A1.1 + A1.2. Kad A2/B1 budu spremni, dodaju se novi redovi u mapu.

### 4. WooCommerce webhook (ručno podešavanje)

U WP Admin → WooCommerce → Settings → Advanced → Webhooks → Add webhook:
- **Name**: LMS Sync
- **Status**: Active
- **Topic**: Order status changed to completed
- **Delivery URL**: `https://kurs.hartweger.rs/api/wc-webhook`
- **Secret**: generisani tajni ključ (isti kao `WC_WEBHOOK_SECRET` env var)

### 5. Env varijable (Vercel)

- `WC_WEBHOOK_SECRET` — tajni ključ za HMAC validaciju
- `SUPABASE_SERVICE_ROLE_KEY` — već postoji

---

## Deo 2: Migracija postojećih 253 kupaca

### Migration skript: `scripts/migrate-existing-customers.ts`

1. Čita WC ordere iz WC API-ja (completed, poslednja godina)
2. Filtrira: isključi individualne kurseve (1-na-1)
3. Grupiše po email-u
4. Za svakog: poziva `grantAccess(email, name, productIds, expiresAt)`
   - `expiresAt` = datum originalne kupovine + 1 godina (NE od danas)
5. Loguje: kreiran/već postoji/greška
6. Ispisuje CSV sa rezultatima

### Slanje mejla

Posle migracije — MailerLite kampanja ili Apps Script mejl:

> Tvoj kurs nemačkog je sada dostupan na novoj platformi.
> Uloguj se na kurs.hartweger.rs sa istim emailom.
> Na stranici za prijavu klikni "Pošalji mi link za prijavu".

### Thank You stranica

Na hartweger.rs posle kupovine dodati poruku:
> "Tvoj kurs je dostupan na kurs.hartweger.rs — uloguj se sa istim emailom."

(Podešava se u WooCommerce → Settings → Emails ili custom Thank You page)

---

## Deo 3: Dodatne komponente

### Magic link login

Trenutno LMS podržava samo Google login. Treba dodati magic link opciju na login stranicu:
- Korisnik unese email → Supabase šalje link za prijavu na mejl → klikne i ulogovan je
- Potrebno za kupce koji nemaju Google nalog

### Admin stranica: upravljanje pristupom

Nova admin stranica `/admin/pristup`:
- Lista svih korisnika sa course_access
- Kolone: ime, email, kurs, expires_at, status (aktivan/istekao)
- Mogućnost ručnog dodavanja/uklanjanja pristupa
- Mogućnost produžavanja pristupa

### Istek pristupa — UX

Kad kupcu istekne pristup:
- Vidi kurseve na dashboard-u ali ne može da otvori lekcije
- Poruka: "Tvoj pristup je istekao. Obnovi pristup na hartweger.rs"
- Progres (kvizovi, XP, sertifikat) ostaje sačuvan — kad obnovi, nastavlja gde je stao

---

## Deo 4: Komunikacija sa spoljnim sistemima

### Princip

Supabase baza je **izvor istine** za LMS podatke. Spoljni sistemi (Apps Script) čitaju podatke preko Supabase REST API-ja. LMS ne šalje mejlove — to rade postojeći sistemi.

### Apps Script pristup Supabase-u

Apps Script može čitati iz Supabase koristeći REST API + anon key:
- `course_access` — ko ima pristup, kad ističe
- `exercise_attempts` — poslednja aktivnost
- `certificates` — ko je položio Modelltest

### Mogući mejlovi (implementacija posle lansiranja):

| Mejl | Izvor podataka | Sistem |
|------|---------------|--------|
| Nisi bio aktivan 2 nedelje | exercise_attempts (last attempt date) | Apps Script čita Supabase |
| Pristup ističe za 30 dana | course_access.expires_at | Apps Script čita Supabase |
| Pristup istekao, obnovi | course_access.expires_at < now | Apps Script čita Supabase |
| Položio si Modelltest | certificates tabela | Apps Script čita Supabase |

Ovo se ne implementira za lansiranje — samo se obezbedi da Supabase REST API radi (radi po defaultu sa anon key).

---

## Baza

Koristi postojeću `course_access` tabelu:

```sql
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
- Migration skript se pokreće lokalno
- Logovanje u API ruti — vidljivo u Vercel logovima

## Edge cases

- **Kupac već ima nalog (Google login)**: pronađe se po emailu, doda se course_access
- **Kupac već ima pristup koji nije istekao**: preskoči se
- **Pristup istekao, kupac obnavlja**: produži, progres ostaje
- **Nepoznat product ID**: ignoriše se
- **Individualni kurs (1-na-1)**: ne mapira se, ne daje LMS pristup
- **Webhook retry**: idempotentnost pokriva
- **Dupli orderi istog kupca**: grupisanje po emailu
- **Order sa više proizvoda**: svaki product_id zasebno
- **Refund**: ručno uklanjanje pristupa u Supabase/admin panelu

## Redosled lansiranja

1. Dodati magic link login na login stranicu
2. Izvući WC product ID-eve i popuniti mapu
3. Implementirati webhook API rutu + deljenu logiku
4. Deploy na Vercel + podesiti env var
5. Podesiti webhook u WooCommerce admin
6. Testirati sa test orderom
7. Napraviti admin stranicu za pristup
8. Pokrenuti migration skript za 253 kupaca
9. Dodati poruku na WC Thank You stranicu
10. Poslati mejl kampanju postojećim kupcima
