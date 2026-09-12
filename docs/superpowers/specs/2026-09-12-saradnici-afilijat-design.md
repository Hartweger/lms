# Saradnici (afilijat kodovi) - dizajn

Datum: 12.09.2026
Status: odobreno u razgovoru, čeka plan

## Cilj

Spoljni saradnik (prvi: Ana) deli svoj kupon kod. Ko kupi sa tim kodom dobija 10% popusta, a saradniku od Nataše pripada fiksan iznos po plaćenom upisu (Ana: 5.000 RSD). Nataša u adminu vidi koliko kome duguje, beleži isplate i dodaje nove saradnike sama, bez SQL-a.

Prvi slučaj: NH Academy Generacija II (proizvod `nh-academy-gen2`, 80.700 RSD), prijave do 29.9.2026. Ideja je da saradnika bude više, ali svi promovišu NH programe. Nemački kursevi nisu u igri, pa je nagrada fiksan iznos po upisu, ne procenat.

## Šta već postoji i koristi se

- `coupons` sa `applies_to_course_id`, `expires_at`, `is_active`, `usage_count`; validacija u `src/app/api/coupons/validate/route.ts` i `src/app/api/orders/route.ts`.
- `orders` pamti `coupon_code`, `discount`, `total`, `payment_status` (`pending` / `completed` / `refunded`).
- `usage_count` se povećava samo u `grantAccessForOrder`, kad porudžbina postane `completed`; storno ga smanjuje.
- Admin `/admin/kuponi` lista kupone; forma pravi samo obične procentualne kupone.
- Obrazac za saldo i isplate: `/admin/obaveze` (profesorke) sa `ObavezeClient.tsx` i `loadPayables`.

## Baza (migracija 107)

```sql
create table partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  fee_rsd int not null check (fee_rsd >= 0),   -- iznos po plaćenom upisu
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

alter table coupons add column partner_id uuid references partners(id);

alter table orders add column partner_id uuid references partners(id);
alter table orders add column partner_fee int;   -- snimak fee_rsd u trenutku porudžbine

create table partner_payouts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id),
  amount int not null check (amount > 0),
  paid_at date not null,
  note text,
  created_at timestamptz not null default now()
);
```

RLS: na `partners` i `partner_payouts` se uključuje RLS bez ijedne politike, pa anonimni i prijavljeni korisnici ne vide ništa; čita i piše samo service role (admin rute). Napomena: `professor_payments` nema RLS uopšte, to nije obrazac koji pratimo.

Ana se upisuje u istoj migraciji:

```sql
insert into partners (name, fee_rsd) values ('Ana', 5000);
insert into coupons (code, discount_type, amount, expires_at, is_active, applies_to_course_id, partner_id)
select 'ANA', 'percent', 10, '2026-09-29 21:59:59+00', true, c.id, p.id
from courses c, partners p where c.slug = 'nh-academy-gen2' and p.name = 'Ana';
```

Istek 29.9.2026 u 23:59 po Beogradu = `21:59:59+00` (CEST). Bez `max_uses`, bez `once_per_email`: brojanje ide preko plaćenih porudžbina, ne preko brojača.

Migracija se primenjuje PRE deploya koda (`scripts/db-apply.mjs`).

## Kasa (`/api/orders`)

Jedina promena: kad je kupon validan i ima `partner_id`, porudžbina dobija `partner_id` i `partner_fee = partners.fee_rsd` (snimak). Upis ide i u granu koja pravi novu porudžbinu i u granu koja ponovo koristi `pending` porudžbinu. Kad kupona nema, obe kolone su `null` (ponovna upotreba porudžbine bez koda briše ranije upisan snimak, isto kao što briše `coupon_code`).

Validacija kupona (`/api/coupons/validate`) se ne menja: ANA prolazi kroz postojeća pravila (`applies_to_course_id`, `expires_at`, `is_active`). Ako saradnik bude deaktiviran (`partners.is_active = false`), njegov kupon se gasi istim potezom u adminu (`coupons.is_active = false`), ne dodaje se nova provera na kasi.

Polaznica ne vidi ništa novo: ukuca ANA, cena padne sa 80.700 na 72.630.

## Obračun

Čista funkcija `computePartnerBalance` u `src/lib/partner-balance.ts`:

- ulaz: lista porudžbina saradnika (`payment_status`, `partner_fee`) i lista isplata (`amount`)
- `upisane` = broj porudžbina sa `payment_status = 'completed'`
- `pripada` = zbir `partner_fee` tih porudžbina
- `isplaceno` = zbir isplata
- `saldo = pripada - isplaceno`

Porudžbine sa `pending` (odbijena kartica, neplaćena uplatnica) i `refunded` (storno) se ne broje. Storno ispada sam jer mu se menja status, ne treba ništa ručno.

Fee se čita sa porudžbine (`orders.partner_fee`), ne sa saradnika: promena iznosa saradniku važi samo za buduće prodaje.

Testovi (vitest, uz postojeće `coupon-*.test.ts`): prazno, samo pending, mešano completed/refunded, promenjen fee između dve porudžbine, isplata veća od pripada (negativan saldo se prikazuje, ne blokira).

## Admin `/admin/saradnici`

Nova stavka u `AdminSidebar.tsx` odmah ispod „Kuponi".

**Lista** (server komponenta, `force-dynamic`): po saradniku ime, kodovi (svi kuponi sa tim `partner_id`, ugašeni sivo), upisane, pripada, isplaćeno, saldo. Neaktivni saradnici na dnu, sivo.

**Detalj** (`/admin/saradnici/[id]`):
- porudžbine sa kodom saradnika: datum, mejl, proizvod, plaćeno (`total`), iznos za saradnika, status (plaćeno / čeka / storno); samo plaćene ulaze u zbir, ostale se vide radi konteksta
- isplate: datum, iznos, napomena
- dugme „Zabeleži isplatu": iznos (podrazumevano trenutni saldo), datum (danas po Beogradu), napomena; POST `/api/admin/saradnici/[id]/isplate`
- izmena: ime, mejl, iznos po upisu, napomena, aktivan; PATCH `/api/admin/saradnici/[id]`. Deaktivacija gasi i sve njegove kupone.

**Novi saradnik** (forma na listi): ime, mejl, iznos po upisu, kod (obavezan, velika slova), popust u % (podrazumevano 10), proizvod (padajuća lista kurseva sa `is_purchasable = true`, podrazumevano `nh-academy-gen2`), važi do (datum, opciono; čuva se kao 23:59:59 po Beogradu). POST `/api/admin/saradnici` pravi saradnika i kupon u jednom potezu; ako kod već postoji vraća 409 „Kupon sa tim kodom već postoji" i ne pravi ni saradnika.

Dodatni kod postojećem saradniku: dugme „Dodaj kod" na detalju, ista polja bez podataka o saradniku; POST `/api/admin/saradnici/[id]/kuponi`.

Sve rute idu preko `requireAdmin()` kao `/api/admin/coupons`.

**`/admin/kuponi`**: uz kod koji ima `partner_id` piše mala oznaka „saradnik: Ana" (link na detalj). Forma na toj stranici se ne menja.

## Greške i ivice

- Isti kod na dva saradnika je nemoguć (`coupons.code` je unique).
- Brisanje saradnika ne postoji, samo deaktivacija: porudžbine i isplate ostaju vezane.
- Ako se kupon saradnika ručno prebaci na drugog (`partner_id` u bazi), stare porudžbine ostaju kod starog jer nose svoj `partner_id`.
- Rate za NH Academy idu ručno preko mejla; porudžbina se broji tek kad je admin označi kao plaćenu (postojeći tok), tada i `partner_fee` ulazi u saldo.
- Kod ANA ne radi na nemačkim kursevima (`applies_to_course_id`), poruka polaznici je postojeća „važi samo za ...".

## Van obima

- Link sa kodom (`?kod=ANA`) i praćenje kolačićem. Kasa primenjuje kod iz URL-a tek uz poznat mejl (vidi migraciju 082), pa link bez dorade kase ne vredi. Ako Ana zatraži link, to je posebna dogradnja.
- Procenat kao nagrada, nagrada po proizvodu, automatski mejl saradniku o prodaji, izvoz.
- Admin forma za napredne kupone van saradnika.

## Redosled isporuke

1. Migracija 107 (tabele + Ana) primenjena na produkciju.
2. `partner-balance.ts` + testovi.
3. `/api/orders` upisuje `partner_id` i `partner_fee`.
4. Admin rute i stranice `/admin/saradnici`, oznaka na `/admin/kuponi`, sidebar.
5. Deploy, smoke test na produkciji: validacija ANA na `/kupovina/nh-academy-gen2` prikazuje 72.630, stranica saradnika prikazuje Anu sa nulom.
