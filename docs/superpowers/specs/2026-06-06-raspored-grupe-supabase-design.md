# Raspored/grupe u Supabase (temelj Bloka D) — dizajn

**Datum:** 2026-06-06
**Cilj:** Preseliti grupe (raspored) iz Google Sheet-a u Supabase, sa admin CRUD-om, automatskim zatvaranjem završenih grupa i prikazom na sajtu iz baze. Gasi zavisnost od `RasporedAPI` Apps Script-a. Temelj za grupni checkout (#2), kalendar (#5) i honorare (#6).

## Kontekst

Blok D (grupni/individualni kursevi) je dekomponovan na 6 pod-projekata; ovo je **#1, temelj**. Danas grupe žive u Google Sheet-u „Raspored", a novi app ih čita preko `src/lib/raspored.ts` → `RasporedAPI` Apps Script (JSONP). Nema tabela u Supabase-u za grupe.

**Donete odluke (brainstorming 2026-06-06):**
- Grupe sele u **Supabase** (izvor istine), ne ostaju u Sheet-u.
- **Opcija „pun zamenik odmah":** model + admin + zamena `fetchRaspored()` da čita iz baze.
- **Bez importera** — grupa je malo (≤10 aktivnih), Nataša ručno unese aktivne grupe u admin.
- **Minimalni `group_enrollments` JESTE u temelju** (odluka 2026-06-06): polaznike grupe unosiš ručno po mejlu da bi DOBILI pristup sadržaju; broj upisanih je izveden iz te tabele. Kupovni tok koji to radi automatski ostaje #2.
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
  price NUMERIC(10,2),
  calendar_id TEXT,                 -- nullable, koristi #5
  notes TEXT,
  notes_link TEXT,
  source TEXT,                      -- npr. 'rucni-unos-2026-06'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- **RLS:** javno čitanje grupa sa statusom `otvoren`/`uskoro` (za prikaz); pun pristup samo admin/professor (kao postojeći obrazac, npr. migracija 028).
- Indeks na `status` i `professor_id`.

**`group_enrollments`** (ko je u grupi — minimalno, da polaznici dobiju pristup):
```sql
CREATE TABLE public.group_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);
```
- **Broj upisanih** = `COUNT(group_enrollments WHERE status='active')` (izvedeno, ne ručno polje). **Slobodna mesta** = `max_seats − upisanih`.
- Razlog: pošto polaznike unosiš da bi dobili PRISTUP, čuvamo ko su (mejl→user), pa je broj automatski tačan.

## Statusi i automatika

- **Ručno (admin):** `planiran → uskoro → otvoren → u_toku`, `otkazana`, pomeranje `start_date`/`end_date`. Početak (`u_toku`) je uvek ručna odluka.
- **Auto (Vercel cron, dnevno):** ako `end_date < danas` i `status='u_toku'` → `zavrsena`. Ništa drugo se ne menja automatski.
- Admin lista vizuelno ističe grupe kojima se bliži `start_date` a `enrolled_count < min_seats` („treba pažnja"). **Mejl-upozorenje je #6**, ovde samo prikaz.

## Admin CRUD — `/admin/grupe`

- **Lista** svih grupa, filter po statusu, prikaz `upisanih/max_seats` + slobodna, dani-do-početka, profesor.
- **Forma kreiranje/izmena:** sva polja (content_course preko slug-padajuće liste, level, professor padajuća lista iz role=professor, status, datumi, duration_weeks, days kao čekboksovi pon–ned, session_time, min/max, price, notes).
- **Polaznici grupe (ključno):** u formi grupe sekcija „Polaznici" — dodaj polaznika po **mejlu** → nađi-ili-kreiraj nalog (admin API, bez mejla, kao u migraciji) → `group_enrollments` red → **dodeli `course_access` na `content_course_id`** (idempotentno, pravilo „nikad ne skraćuj", `expires_at = max(postojeći, danas+365)`, `source='grupa-rucni-unos'`). Ukloni polaznika → `status='cancelled'` (pristup se NE oduzima automatski). Tako unos grupe i pristup polaznicima idu zajedno — ne zaboravlja se.
- **Akcije:** sačuvaj, otkaži (status→otkazana), ručna promena statusa.
- Prati postojeći admin obrazac (server actions / API rute kao `admin/kursevi`, `admin/profesori`); nađi-ili-kreiraj + grant logika je ista kao `scripts/migrate-ld-access.ts`.

## Prikaz na sajtu — zamena `fetchRaspored()`

- Reimplementirati `src/lib/raspored.ts::fetchRaspored()` da čita iz Supabase i vraća **isti `GrupaRaspored` oblik** (`nivo, prof, status, pocetak, trajanje, dani, sat, maks, upisanih, slobodnih`), filtrirano na `otvoren`/`uskoro`, sortirano otvoren-prvo (kao sadašnji RasporedAPI).
- Tako `grupni-kursevi/page.tsx` i `kursevi/[slug]/page.tsx` rade bez izmene (čitaju isti tip).
- `days SMALLINT[]` → string „pon, sre" i `session_time` → `sat`; `upisanih`/`slobodnih` iz `COUNT(group_enrollments)`. Formatira se u `fetchRaspored`.
- Posle ovoga RasporedAPI Apps Script više nije u upotrebi (može da se ugasi kasnije, uz Sheet).

## Popunjavanje podataka (umesto migracije)

Nema importera. Nataša ručno unese trenutno aktivne/otvorene grupe kroz `/admin/grupe` (tag `source='rucni-unos-2026-06'`). Sheet ostaje kao referenca dok se ne unese, pa se napušta.

## Van opsega (kasniji pod-projekti)

- **Upis kroz KUPOVINU** (checkout koji sam pravi `group_enrollments` + grant, plaćanje, potvrda) → **#2**. (Tabela `group_enrollments` i ručni upis+grant SU u temelju; #2 samo dodaje kupovni tok koji radi isto automatski.)
  - **#2 MORA:** budući kupac grupnog kursa automatski dobije pristup platformi **+ potvrdni mejl o kupovini** (kalendar link dolazi sa #5). Ručni unos u temelju je TIH (stari polaznici su mejlove već dobili kroz Woo+Apps Script). Masovno obaveštavanje SVIH o novoj platformi je zaseban mejl-korak na KRAJU migracije domena — ne ovde.
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

Nema — odluke donete (Supabase, full-replace, manual status + auto-end, advisory min, bez importera, minimalni `group_enrollments` sa ručnim unosom+grant pristupa, izveden broj upisanih, strukturisani days).
