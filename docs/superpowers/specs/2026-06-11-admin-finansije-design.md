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
6. **Proširenje (dogovoreno 11.06):** uz P&L i marže po kursevima, stranica dobija i
   sekcije „Po grupama" (popunjenost + zarada po grupi, break-even) i „Po
   profesorkama" (neto doprinos + retencija kroz istoriju plaćanja).

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

Uz to, mala dorada postojeće tabele radi precizne retencije ubuduće:

```sql
alter table group_enrollments add column cancelled_at timestamptz;
```

(popunjava se kad upis pređe u `status='cancelled'`; postojeći cancelled redovi
ostaju bez datuma.)

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
4. **Po grupama** — tabela: grupa · profesorka · popunjenost (`active` upisi /
   `max_seats`) · prihod · honorar (sesije × `honorar_grp`) · zarada · zarada po
   članu. Grupe ispod break-even-a (honorar > prihod) označene crveno. Ispod
   tabele: prosečna popunjenost po nivou.
5. **Po profesorkama** — tabela sortirana po neto doprinosu: profesorka · prihod
   koji donosi · honorar · neto doprinos · aktivni polaznici · prosečna retencija.
   - Prihod profesorke: individualne porudžbine preko `items[].professor_id` +
     porudžbine članova njenih grupa.
   - Retencija: prosečan broj različitih meseci u kojima polaznik te profesorke
     ima potvrđenu porudžbinu (istorija plaćanja, ne `cancelled_at` — vidi
     napomenu o podacima). Računa se nad polaznicima koji su krenuli pre ≥1 mesec.
6. **Troškovi (CRUD)** — lista troškova za period + „Dodaj trošak" (modal: naziv,
   kategorija, iznos, datum/mesec, mesečni da/ne, kurs opciono, napomena).
   Izmena/brisanje po redu; mesečni se gasi postavljanjem `ended_at`.

Napomena o podacima: `group_enrollments` do sada nije beležio datum ispisa, pa se
retencija meri kroz kontinuitet plaćanja. Nova kolona `cancelled_at` počinje da
beleži ispise od deploya, za precizniju retenciju ubuduće. Grupe na novom sistemu
kreću od 06.06.2026, pa retencija postaje smislena tek posle 2-3 meseca podataka.

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
- **Po grupama:** prihod grupe = potvrđene porudžbine članova grupe za njen
  `purchasable_course_id`; trošak = `group_sessions` te grupe × `honorar_grp`.
- **Po profesorkama:** zbir individualnog (preko `items[].professor_id`) i grupnog
  (preko njenih grupa) prihoda − njen ukupan honorar; retencija iz istorije
  plaćanja po polazniku.
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
- zarada po grupi i break-even detekcija (popunjenost × cena vs sesije × stopa)
- retencija: brojanje različitih meseci plaćanja po polazniku/profesorki

UI bez automatskih testova; posle deploya postojeći smoke-deploy hook.

## Van obima

- WooCommerce istorija (`wc_orders`)
- Auto-obračun provizija platnih metoda (može kasnije kao kategorija „provizije")
- Zaključavanje meseci / ledger snapshoti
- Export (CSV/PDF)
