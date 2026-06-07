# Automatizacija upisa u grupne kurseve — dizajn

**Datum:** 2026-06-07
**Status:** Predlog (čeka pregled)

## Problem

Grupni kursevi se mogu prodati i preko broja mesta. Trenutno:

- Brojač „Slobodnih mesta" se smanjuje **samo** kad admin ručno upiše kupca u grupu (`group_enrollments`).
- Dugme „Prijavi se" radi i kad je 0 slobodnih mesta — niko ne zaustavlja kupovinu.
- Sistem nema pojam „popunjeno".
- Kad neko kupi grupni kurs, ništa se ne dešava automatski osim pristupa video lekcijama: nema kalendar-eventa, Meet linka, beleški, obaveštenja profesoru, ni upisa u profesorov spisak. Ranije je ovo radila Apps Script automatika u Google Sheet-u koja **više ne radi**.

## Cilj

Kad neko plati grupni kurs, sve se odvija automatski: zauzme se mesto, polaznik dobije jedan mejl sa svim pristupima, profesor bude obavešten i upisan u svoj spisak, a kad se grupa popuni — kupovina se zatvara dok admin ne otvori novi termin (promenom datuma).

## Odluke (iz brainstorming-a)

1. **Brojanje mesta:** automatski po plaćanju. Ručni upis ostaje kao rezerva (npr. plaćanje van sajta).
2. **Kad je puno (6/6):** stranica kursa prikazuje „Popunjeno", a umesto „Prijavi se" nudi „Obavesti me za sledeći termin". Checkout odbija kupovinu te grupe.
3. **„Obavesti me za sledeći termin":** šalje običan mejl administratoru (`kurs@hartweger.rs`), bez liste čekanja.
4. **Otvaranje novog termina:** admin promeni početni datum grupe → brojač se resetuje na 0/6, grupa se ponovo otvori, naprave se novi kalendar-event i nov dokument sa beleškama. Stari polaznici ne gube pristup.
5. **Profesorski nalozi:** Google Workspace pod kontrolom vlasnice → centralno pravljenje termina preko service account-a (domain-wide delegation).
6. **Profesorov Google Sheet:** zadržava se — sajt dopisuje novog polaznika.
7. **Beleške:** jedan Google dokument **po grupi/terminu**, napravljen iz šablona, koji profesor popunjava posle svakog časa (datum, gradivo, vokabular, greške, napomene, linkovi). Polaznik dobija link na taj dokument.
8. **Mejl polazniku:** **jedan** brendiran Resend mejl sa svim: prijava na platformu + Google Meet link + „Dodaj u kalendar" + link na beleške. Polaznik se „tiho" dodaje kao gost na kalendar-event (bez zasebnog Google poziva), da bi profesor video učesnike, ali polaznik dobija samo naš mejl.

## Arhitektura

### Izmene baze (Supabase migracija)

**`groups`** — nove kolone:

| Kolona | Tip | Namena |
|---|---|---|
| `term_opened_at` | `timestamptz` | Granica za brojanje upisa tekućeg termina (reset = postavi na sada) |
| `calendar_event_id` | `text` | ID ponavljajućeg Google kalendar-eventa tekućeg termina |
| `meet_link` | `text` | Google Meet link tekućeg termina |
| `notes_doc_id` | `text` | ID Google dokumenta sa beleškama |
| `notes_doc_url` | `text` | Link na dokument sa beleškama (deli se polaznicima) |

**`user_profiles`** — nove kolone (samo za profesore, nullable):

| Kolona | Tip | Namena |
|---|---|---|
| `roster_sheet_id` | `text` | ID profesorovog Google Sheet-a (spisak polaznika) |
| `calendar_id` | `text` | Kalendar na koji idu termini; podrazumevano profesorov Workspace mejl |

### Brojanje mesta (`src/lib/groups.ts`, `src/lib/raspored.ts`)

- `enrolled = (manual_enrolled ?? 0) + broj(active upisa gde enrolled_at >= term_opened_at)`
  - `manual_enrolled` ostaje kao opcioni „početni" broj za tekući termin (npr. plaćeno van sajta); resetuje se (na `null`) pri otvaranju novog termina.
- `full = enrolled >= max_seats`
- `slobodnih = max(0, max_seats - enrolled)`
- `GrupaRaspored` dobija novo polje `full: boolean`.

Napomena: tekuća logika u `raspored.ts` broji **sve** aktivne upise i daje prednost `manual_enrolled` kao apsolutnom broju. Menja se u zbir „baseline + upisi tekućeg termina" sa vremenskom granicom `term_opened_at`.

### Google integracija (novi modul `src/lib/google/`)

- `auth.ts` — JWT service account sa domain-wide delegation; impersonacija profesora po potrebi. Skopovi: Calendar, Docs, Drive, Sheets.
- `calendar.ts`
  - `createGroupEvent(group, professor)` → **ponavljajući** event sa uključenim Meet-om (`conferenceData`) → `{ eventId, meetLink }`. Pravilo ponavljanja se gradi iz polja grupe:
    - **dani u nedelji** = `days` (npr. `[2,4]` → uto, čet) → `RRULE:FREQ=WEEKLY;BYDAY=TU,TH`
    - **broj termina/trajanje** = `duration_weeks` (npr. 7 nedelja) → `COUNT` = `duration_weeks × broj_dana_nedeljno` (npr. uto+čet × 7 = 14 časova), ili `UNTIL` = `start_date + duration_weeks` nedelja
    - **vreme** = `session_time` (npr. 17:00–18:00), počev od `start_date`
    - **kalendar** = profesorov (`user_profiles.calendar_id` ili Workspace mejl)
    - **naziv eventa** uključuje nivo i ime profesora, npr. „Nemački A1.1 — Suzana Marjanović"
    - Sve vrednosti dolaze iz onoga što admin unese kod grupe (dani, sat, broj nedelja, profesor).
    - **Jedan Meet za ceo kurs:** ponavljajući event ima **jedan zajednički Google Meet link** za sve časove tog termina (ne pravi se nov link po času). Link se čuva u `groups.meet_link` i isti se šalje svim polaznicima.
    - **Kreira se odmah:** event + Meet nastaju u trenutku otvaranja termina (Tok 1), a ne tek pri prvom upisu. Polaznici se kasnije samo dodaju kao gosti na već postojeći event.
  - `addAttendeeSilently(calendarId, eventId, email)` → doda gosta sa `sendUpdates='none'`
  - `buildAddToCalendarUrl(group)` → Google Calendar „render" URL za polaznikov lični kalendar
- `docs.ts` / `drive.ts`
  - `createNotesDoc(group, professor)` → iskopira šablon (`NOTES_TEMPLATE_DOC_ID`), preimenuje u „Beleške [nivo] [datum]", podeli profesoru (uređivanje) → `{ docId, url }`
- `sheets.ts`
  - `appendEnrollee(sheetId, { ime, mejl, nivo, datum })`

Svi Google pozivi su **best-effort**: greška se loguje (Sentry) i ne ruši plaćanje/pristup; admin se obavesti mejlom o neuspehu.

### Tokovi

#### Tok 1 — Otvaranje termina (admin promeni `start_date`)

`PATCH /api/admin/grupe/[id]` detektuje promenu `start_date` i pokreće „otvori termin":

1. `term_opened_at = now()`, `status = 'otvoren'`, `manual_enrolled = null`
2. `createGroupEvent()` → upiše `calendar_event_id`, `meet_link`
3. `createNotesDoc()` → upiše `notes_doc_id`, `notes_doc_url`
4. Stari event/dokument prethodnog termina ostaju u Google-u (istorija); polja na grupi se prepisuju novim. Postojeći polaznici zadržavaju `course_access`.

#### Tok 2 — Polaznik plati grupni kurs

Proširenje `grantAccessForOrder()` (`src/lib/grant-access.ts`), poziva se iz NestPay callback-a, admin potvrde i cron reconcile-a. Za svaki grupni stavku u narudžbini:

1. Mapiraj `slug → nivo` (postojeći `slugToNivo`) → nađi otvorenu grupu za nivo.
2. Ako je grupa puna → preskoči automatiku, loguj + obavesti admina (zaštita; primarno se blokira na checkout-u).
3. `upsert group_enrollment` (status `active`) — `UNIQUE(group_id, user_id)` daje idempotentnost.
4. `addAttendeeSilently()` — polaznik kao gost na kalendar-eventu (bez Google mejla).
5. `appendEnrollee()` u profesorov `roster_sheet_id`.
6. Pošalji **jedan** Resend mejl polazniku: prijava na platformu + Meet link + „Dodaj u kalendar" + link na beleške.
7. Pošalji Resend mejl profesoru: „novi polaznik — ime, mejl, nivo".
8. Dodeli `course_access` na video lekcije (kao sada).

Idempotentnost: `grantAccessForOrder` već rano izlazi ako je order `completed`; dodatno, koraci 3–7 proveravaju postojanje upisa pre slanja/dopisivanja da se izbegnu duplikati pri ponovnom pozivu (cron reconcile).

#### Tok 3 — Grupa popunjena (6/6)

- **Stranica kursa** (`src/app/kursevi/[slug]/page.tsx`): ako je `grupa.full`, info-blok prikazuje „Popunjeno" umesto broja, a glavni CTA „Prijavi se" se zamenjuje dugmetom „Obavesti me za sledeći termin" (otvara malu formu).
- **Forma interesa** (novi `POST /api/grupe/interes` { nivo, email, ime }) → Resend mejl administratoru. Mala klijentska komponenta (modal/inline) na stranici.
- **Checkout** (`POST /api/orders`): za grupni proizvod proveri grupu po nivou; ako je puna → `409` sa porukom „Grupa je trenutno popunjena".

## Granični slučajevi

- **Više otvorenih grupa za isti nivo:** pretpostavka je jedna; ako ih je više, bira se `status='otvoren'` sa najranijim `start_date`.
- **Nema otvorene grupe za kupljeni nivo:** blokira se na checkout-u; ako ipak prođe, loguj + obavesti admina, ali svejedno dodeli video pristup.
- **Trka (dva plaćanja za poslednje mesto):** moguć blagi over-booking; prihvatljivo, admin to vidi i rešava ručno (ručna korekcija ostaje dostupna).
- **Google poziv padne:** plaćanje i pristup ne trpe; admin dobije mejl o grešci da ručno odradi korak.

## Preduslovi za puštanje (jednom, podešavanje)

- Google Cloud **service account** + domain-wide delegation; skopovi Calendar/Docs/Drive/Sheets. Kredencijali u Vercel env (`GOOGLE_SERVICE_ACCOUNT_JSON` ili base64), `GOOGLE_DELEGATED_SUBJECT` po potrebi.
- `NOTES_TEMPLATE_DOC_ID` (Google dokument šablon beleški) u env; šablon podeljen sa service account-om.
- Po profesoru: `roster_sheet_id` upisan u admin (Sheet podeljen sa service account-om / dostupan preko impersonacije).
- Resend mejl-šabloni: polaznik (welcome grupni) i profesor (novi polaznik).

## Testiranje

- Unit (vitest): brojanje mesta i detekcija „full" sa `term_opened_at` granicom; `slug → nivo` mapiranje; checkout blokada za punu grupu; sastavljanje mejla. Google klijenti se mock-uju.
- Smoke posle deploya (obavezno, postojeći hook): `/lekcija/[id]` i stranica grupnog kursa.

## Redosled puštanja

1. Supabase migracija (nove kolone) → deploy.
2. Posao A logika (brojanje, „popunjeno", checkout blokada, „obavesti me") → deploy + test.
3. Podešavanje service account-a i env-a; po-profesor `roster_sheet_id`.
4. Posao B (Google calendar/docs/sheets + mejlovi) → deploy + test na jednoj grupi.

## Van obima (YAGNI za sada)

- Istorija beleški/termina po terminu u samoj aplikaciji (stari dokumenti ostaju u Google Drive-u).
- Lista čekanja / automatsko obaveštavanje zainteresovanih (sad samo mejl administratoru).
- Per-sesija (a ne ponavljajući) kalendar-eventi.
