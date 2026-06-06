# Raspored/grupe u Supabase (temelj Bloka D) — dizajn

**Datum:** 2026-06-06
**Cilj:** Preseliti grupe (raspored) iz Google Sheet-a u Supabase, sa admin CRUD-om, automatskim zatvaranjem završenih grupa i prikazom na sajtu iz baze. Gasi zavisnost od `RasporedAPI` Apps Script-a. Temelj za grupni checkout (#2), kalendar (#5) i honorare (#6).

## Kontekst

Blok D (grupni/individualni kursevi) je dekomponovan na 6 pod-projekata; ovo je **#1, temelj**. Danas grupe žive u Google Sheet-u „Raspored", a novi app ih čita preko `src/lib/raspored.ts` → `RasporedAPI` Apps Script (JSONP). Nema tabela u Supabase-u za grupe.

**Donete odluke (brainstorming 2026-06-06):**
- Grupe sele u **Supabase** (izvor istine), ne ostaju u Sheet-u.
- **Opcija „pun zamenik odmah":** model + admin + zamena `fetchRaspored()` da čita iz baze.
- **Bez importera** — grupa je malo (≤10 aktivnih), Nataša ručno unese aktivne grupe u admin.
- **Bez `group_enrollments` tabele u temelju** — upis kroz kupovinu je #2. Broj upisanih je ručno polje `enrolled_count` (kao kolona „Upisanih" u Sheet-u danas).
- **Status:** ručno menjaš sve osim auto-`zavrsena` kad prođe `end_date`. Početak je uvek tvoja odluka (minimum 3 je samo orijentir — puštaš i sa 2 kad je upis slab). Sistem nikad ne blokira.
- `days` strukturisano (radi #5 kalendara).

## Model podataka — tabela `groups`

```sql
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_course_id UUID REFERENCES public.courses(id),     -- čiji su lekcije (npr. nemacki-a1-1)
  purchasable_course_id UUID REFERENCES public.courses(id), -- grupni-kurs ljuska (nullable; koristi #2)
  level TEXT NOT NULL,                                       -- "A1.1"
  type TEXT NOT NULL DEFAULT 'grupni',
  professor_id UUID REFERENCES public.user_profiles(id),     -- role='professor'
  status TEXT NOT NULL DEFAULT 'planiran'
    CHECK (status IN ('planiran','uskoro','otvoren','u_toku','zavrsena','otkazana')),
  start_date DATE,
  end_date DATE,
  duration_weeks INT,
  days SMALLINT[] DEFAULT '{}',     -- [1,3] = pon, sre (1=pon … 7=ned)
  session_time TEXT,                -- "18:00" (ime nije `time` zbog Postgres tipa)
  min_seats INT NOT NULL DEFAULT 3, -- ORIJENTIR, ne tvrdo pravilo
  max_seats INT NOT NULL DEFAULT 6,
  enrolled_count INT NOT NULL DEFAULT 0, -- ručno (do #2)
  price NUMERIC(10,2),
  calendar_id TEXT,                 -- nullable, koristi #5
  notes TEXT,
  notes_link TEXT,
  source TEXT,                      -- npr. 'rucni-unos-2026-06'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- **Slobodna mesta** (izvedeno, ne kolona): `max_seats − enrolled_count`.
- **RLS:** javno čitanje grupa sa statusom `otvoren`/`uskoro` (za prikaz); pun pristup samo admin/professor (kao postojeći obrazac, npr. migracija 028).
- Indeks na `status` i `professor_id`.

## Statusi i automatika

- **Ručno (admin):** `planiran → uskoro → otvoren → u_toku`, `otkazana`, pomeranje `start_date`/`end_date`. Početak (`u_toku`) je uvek ručna odluka.
- **Auto (Vercel cron, dnevno):** ako `end_date < danas` i `status='u_toku'` → `zavrsena`. Ništa drugo se ne menja automatski.
- Admin lista vizuelno ističe grupe kojima se bliži `start_date` a `enrolled_count < min_seats` („treba pažnja"). **Mejl-upozorenje je #6**, ovde samo prikaz.

## Admin CRUD — `/admin/grupe`

- **Lista** svih grupa, filter po statusu, prikaz `enrolled_count/max_seats` + slobodna, dani-do-početka, profesor.
- **Forma kreiranje/izmena:** sva polja (content_course preko slug-padajuće liste, level, professor padajuća lista iz role=professor, status, datumi, duration_weeks, days kao čekboksovi pon–ned, time, min/max, enrolled_count, price, notes). 
- **Akcije:** sačuvaj, otkaži (status→otkazana), ručna promena statusa.
- Prati postojeći admin obrazac (server actions / API rute kao `admin/kursevi`, `admin/profesori`).

## Prikaz na sajtu — zamena `fetchRaspored()`

- Reimplementirati `src/lib/raspored.ts::fetchRaspored()` da čita iz Supabase i vraća **isti `GrupaRaspored` oblik** (`nivo, prof, status, pocetak, trajanje, dani, sat, maks, upisanih, slobodnih`), filtrirano na `otvoren`/`uskoro`, sortirano otvoren-prvo (kao sadašnji RasporedAPI).
- Tako `grupni-kursevi/page.tsx` i `kursevi/[slug]/page.tsx` rade bez izmene (čitaju isti tip).
- `days SMALLINT[]` → string „pon, sre" i `session_time` → `sat` se formatiraju u `fetchRaspored`.
- Posle ovoga RasporedAPI Apps Script više nije u upotrebi (može da se ugasi kasnije, uz Sheet).

## Popunjavanje podataka (umesto migracije)

Nema importera. Nataša ručno unese trenutno aktivne/otvorene grupe kroz `/admin/grupe` (tag `source='rucni-unos-2026-06'`). Sheet ostaje kao referenca dok se ne unese, pa se napušta.

## Van opsega (kasniji pod-projekti)

- `group_enrollments` + upis kroz kupovinu + dekrement slobodnih → **#2 (grupni checkout)**.
- Generisanje datuma termina, „Neradni dani", Google Calendar/Meet, Google Docs beleške → **#5**.
- Honorari profesora + mejl-upozorenja (uklj. „blizu početka, ispod minimuma") → **#6**.
- Individualni kursevi/varijante/paketi → **#3**.

## Rizici i mitigacije

| Rizik | Mitigacija |
|---|---|
| Prikaz se promenio posle swap-a | `fetchRaspored` vraća identičan oblik; vizuelni spot-check `grupni-kursevi` i stranice kursa pre/posle |
| `enrolled_count` ručno → može da zastari | Prihvatljivo do #2 (tad postaje izvedeno iz `group_enrollments`); jasno označeno u adminu |
| Cron ugasi grupu prerano | Auto samo `u_toku`+`end_date<danas`; sve drugo ručno; lako vraćanje statusa |
| RLS propusti grupe koje ne treba | Javno samo `otvoren`/`uskoro`; ostalo staff-only; test RLS |

## Otvorena pitanja

Nema — odluke donete (Supabase, full-replace, manual status + auto-end, advisory min, ručni enrolled_count, bez importera/enrollments, strukturisani days).
