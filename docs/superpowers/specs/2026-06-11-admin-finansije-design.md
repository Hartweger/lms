# Admin Finansije — dizajn

**Datum:** 2026-06-11
**Status:** odobren dizajn, čeka plan implementacije

## Cilj

Nova admin stranica `/admin/finansije` koja daje jasnu sliku: prihodi po kursevima i
tipovima, rashodi (honorari profesorki + ručno uneti troškovi) i neto zarada/marža —
mini P&L pregled u ERP stilu.

## Odluke iz brainstorminga

1. **Obim rashoda:** auto-obračun honorara + nova `expenses` tabela za ručne troškove.
2. **Trošak → kurs:** opciono vezivanje. Trošak bez kursa = opšti trošak firme.
   Marža po kursu = prihod − honorari − direktni troškovi; opšti troškovi se odbijaju
   samo na ukupnom nivou (bez veštačke raspodele).
3. **Istorija:** bez `wc_orders` — Finansije kreću od novog sajta. Stara analitika
   ostaje u `/admin/analitika`.
4. **Ponavljajući troškovi:** mesečni trošak se unosi jednom (`recurring=true`) i važi
   svaki mesec do `ended_at`.
5. **Pristup:** živ obračun (bez ledger/snapshot tabela). Poznata posledica: promena
   stope honorara preračunava i istoriju — prihvaćeno, rešava se tek ako stope budu
   menjane.

## 1. Šema baze — jedina izmena

```sql
create table expenses (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,          -- "Meta oglasi", "Vercel", "Fiscomm"...
  category     text not null,          -- 'marketing' | 'alati-hosting' | 'provizije' | 'materijali' | 'ostalo'
  amount       int  not null,          -- celi dinari, konvencija kao orders.total
  course_id    uuid references courses(id),  -- opciono: direktan trošak kursa
  expense_date date not null,          -- mesec na koji se odnosi / početak za mesečne
  recurring    boolean not null default false,
  ended_at     date,                   -- kraj mesečnog troška (null = aktivan)
  note         text,
  created_at   timestamptz not null default now()
);
```

- RLS po šablonu ostalih admin tabela; čitanje/pisanje ide preko service-role API ruta.
- Mesečni trošak se „širi" računski: važi za svaki mesec od meseca `expense_date`
  do meseca `ended_at` (ili tekućeg). Ne upisuju se redovi po mesecu.
- DDL se primenjuje kroz Supabase SQL Editor / Management API pre deploya
  (videti reference_supabase_ddl), migracioni fajl ide u `supabase/migrations/`.

## 2. Stranica `/admin/finansije`

Filter na vrhu: **godina** (default tekuća) + opcioni pojedinačni mesec.

1. **Kartice:** Prihod · Rashodi · Neto zarada · Marža % za izabrani period.
   Na kartici prihoda i info „na čekanju" (pending porudžbine, ne ulaze u obračun).
2. **P&L tabela po mesecima** — kolone meseci, redovi:
   - Prihod: video / grupni / individualni / paketi → ukupno
   - Honorari: po profesorki → ukupno
   - Troškovi: po kategoriji → ukupno
   - **Neto zarada** + marža % (naglašen poslednji red)
3. **Marže po kursevima** — tabela: kurs · tip · prihod · honorari · direktni troškovi ·
   marža · marža %. Ispod: red „Opšti troškovi (nealocirani)" pa finalna neto zarada.
4. **Troškovi (CRUD)** — lista troškova za period + „Dodaj trošak" (modal: naziv,
   kategorija, iznos, datum/mesec, mesečni da/ne, kurs opciono, napomena).
   Izmena/brisanje po redu; mesečni se gasi postavljanjem `ended_at`.

UI prati postojeći admin šablon (`/admin/narudzbine`: server component +
client komponenta za interakciju).

## 3. Logika obračuna — novi `src/lib/finansije.ts`

Čiste funkcije (bez I/O) + server-side dohvat podataka na stranici.

- **Prihod:** `orders` sa `payment_status='completed'`, grupisano po mesecu
  `created_at`. Stavke iz `items[]` daju kurs i tip (heuristika slug-a: `video-`,
  `grupni-`, `paket-`, individualni preko `professor_id`/`course_type`). Popust se
  raspodeljuje proporcionalno na stavke tako da zbir stavki = `total`.
- **Honorari po kursu:**
  - individualni: `individual_lessons` → `individual_enrollments.course_id`
  - grupni: `group_sessions` → `groups.purchasable_course_id` (isti kurs na koji
    ide i prihod grupe, pa se prihod i trošak poklapaju)
  - stope iz `user_profiles.honorar_ind` / `honorar_grp`, konzistentno sa
    postojećim `src/lib/honorar.ts`
- **Video kursevi:** nemaju honorar; marža = prihod − direktni troškovi.
- **Troškovi:** jednokratni padaju u mesec `expense_date`; mesečni u svaki mesec
  aktivnog raspona.
- Sve sume u celim dinarima (int), bez decimala.

## 4. API i zaštita

- `GET/POST /api/admin/expenses` i `PATCH/DELETE /api/admin/expenses/[id]`,
  po šablonu postojećih `/api/admin/orders` ruta (admin check + service-role).
- Stranica je server component; postojeći middleware admin-check već pokriva
  `/admin/*`.
- Link „Finansije" u admin navigaciju.

## 5. Testiranje

Vitest za čistu računicu u `lib/finansije.ts`:
- proporcionalna raspodela popusta na stavke (zbir = total, zaokruživanje)
- širenje mesečnog troška kroz period (sa i bez `ended_at`, ivice meseca)
- alokacija honorara po kursu (ind + grp)
- marža po kursu + nealocirani opšti troškovi = ukupna neto zarada

UI bez automatskih testova; posle deploya postojeći smoke-deploy hook.

## Van obima

- WooCommerce istorija (`wc_orders`)
- Auto-obračun provizija platnih metoda (može kasnije kao kategorija „provizije")
- Zaključavanje meseci / ledger snapshoti
- Export (CSV/PDF)
