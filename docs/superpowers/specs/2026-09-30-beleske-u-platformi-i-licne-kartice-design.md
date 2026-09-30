# Beleške u platformi + lični setovi kartica + panel polaznika — dizajn

**Datum:** 2026-09-30
**Status:** Predlog, čeka pregled
**Zamenjuje:** `2026-06-24-beleske-tabla-u-platformi-design.md` (taj spec ostaje kao izvor za live tablu, ali strukturu sadržaja, retenciju kartica i prelaz menja ovaj dokument)

## Problem

Tri problema koja su ista stvar:

1. **Beleške su Google Docs van platforme.** Dele se `addViewer(email)` iz Apps Script-a jer domen `hartweger.rs` blokira „svako sa linkom". Polaznici ipak upadaju u „traži pristup" petlju, profesorka deli ručno, Nataša prima mejlove.
2. **1:1 polaznici nemaju svoje kartice.** Vokabular sa časa se prepisuje u Quizlet ručno ili nigde. Motor za kartice (Learn, kviz, kucanje, igra memorije, trajan napredak) postoji i radi uživo, ali samo nad setovima ugrađenim u lekcije video kurseva.
3. **Polaznik ne vidi svoj kurs na jednom mestu.** Meet link traži po mejlovima, domaći pita profesorku, broj preostalih časova ne zna, rok paketa i rok pristupa platformi ne zna.

Rešenje je jedno: beleška prestaje da bude dokument i postaje **podatak u platformi**. Iz tog podatka same izlaze kartice, panel i PDF.

## Ključna odluka

**WORTSCHATZ nije pasus nego tabela.** Profesorka kuca reči tamo gde ih ionako kuca, a te iste reči su kartice polaznika. Nema izvlačenja iz teksta, nema parsiranja, nema AI-ja koji pogađa šta je reč a šta rečenica. Kartice nisu *izvedene* iz beleške — one *jesu* taj podatak, prikazan drugačije.

## Potvrđene odluke

### Sadržaj beleške

- Obrazac sa **sedam fiksnih sekcija**, isto kao postojeći IND Google Doc šablon: TEMA, WORTSCHATZ, REDEMITTEL, FEHLER, GRAMMATIK, HAUSAUFGABE, LOB.
- **Grupni obrazac ima iste sedam sekcija.** Jedan motor, jedno učenje za profesorke.
- **WORTSCHATZ = tabela sa dve kolone** (nemački / naš). Rod i množina se kucaju u nemačku kolonu po postojećoj konvenciji sistema (`die Bedingung, -en`, `üben, hat geübt`). **Nema treće kolone** — svesna odluka: kartica ostaje kratka da se lakše uči.
- Ostalih šest sekcija su rich text: bold, kurziv, liste, mali naslovi, linkovi, marker u boji.
- **Bez slika i bez tabela** u tekstualnim sekcijama (potvrđeno: profesorke ne lepe slike u beleške).
- **FEHLER uvek bez imena polaznika**, i u 1:1 i u grupnom obrascu. Greška može biti i opšteg tipa.
- **Prazna sekcija se ne prikazuje** — ni sadržaj ni naslov. Ako profesorka nije upisala LOB, reč „Lob" se nigde ne pojavljuje. Beleška je kraća, ne prazna. Isto važi za prikaz i za PDF.
- Datum i ime profesorke se **ne kucaju** — čitaju se iz vezanog časa i naloga.

### Kartice

- **Set po terminu** („Termin 7 — reči") + **„Sve reči"** kao **pogled** nad svim karticama polaznika, ne kopija. Ista reč se ne broji dvaput.
- Kartice koriste **postojeći Learn motor bez izmena** (`src/components/learn/`, `flashcard-grading.ts`, `flashcard-progress.ts`).
- **Kartice nadžive belešku.** Kad se beleška obriše posle 6 meseci, reči i napredak ostaju polazniku. Briše se tekst časa, ne rečnik.
- U grupi svi polaznici dobijaju isti set reči; **napredak je svačiji lični**.

### Uživo

- **Live tabla je u prvoj verziji, ne faza 2.** Profesorka kuca, polaznik gleda kako tekst nastaje (Supabase Realtime broadcast + upis u bazu na ~2s).

### Panel polaznika

- Na panelu stoje: sledeći čas, dugme za ulazak, zakazivanje, otkazivanje, preostali časovi, **rok do kada se paket troši**, **rok do kada važi pristup platformi**, domaći sa poslednjeg časa, reči sa poslednjeg časa, „na šta da paziš", beleške, materijali, video kurs, pismeni zadatak.
- **Oba roka stoje odvojeno** — to su različite stvari i polaznik ne mora da pita.

### Otkazivanje termina

- Polaznik **sme sam da otkaže** dugmetom na panelu. Platforma preko Apps Script-a **označava** termin u kalendaru profesorke (naslov dobija „OTKAZANO", polaznik se skida sa gostiju) — **ne briše ga**, da ostane trag.
- Do 24 sata pre časa dugme radi samo. **Unutar 24 sata dugme ne dira kalendar** nego pošalje poruku profesorki.
- Ovo **menja dosadašnje pravilo** da platforma ne dira kalendare profesorki. Nataša je to izričito odobrila 30.09.2026, samo za otkazivanja koja pokreće polaznik.

### Prelaz

- Beleške u platformi važe za **svaku sledeću kupovinu** — nove 1:1 upise i nove grupe.
- **Tekući paketi i grupe ostaju na Drive-u** dok se paketi ne potroše i grupe ne završe.
- Ništa se ne migrira. Stari Google Docs ostaju živi i deljeni kao do sad.
- Apps Script prestaje da pravi nove Docs pri upisu — **prekidač, ne brisanje koda**.

### Retencija

- Beleška se briše **6 meseci posle datuma svog časa**, potpuno iz baze.
- **Mejl upozorenje ~15 dana pre brisanja** sa pozivom da se skine PDF.
- Kartice i napredak se **ne brišu**.

## Arhitektura

### `class_notes` — beleška

```sql
create table public.class_notes (
  id                   uuid primary key default gen_random_uuid(),
  individual_lesson_id uuid null references public.individual_lessons(id) on delete cascade,
  group_session_id     uuid null references public.group_sessions(id) on delete cascade,
  professor_id         uuid not null references public.user_profiles(id),
  content              jsonb not null default '{}'::jsonb,
  content_text         text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint one_target check (
    (individual_lesson_id is not null) <> (group_session_id is not null)
  )
);

create unique index class_notes_individual_uq on public.class_notes(individual_lesson_id)
  where individual_lesson_id is not null;
create unique index class_notes_group_uq on public.class_notes(group_session_id)
  where group_session_id is not null;
```

`content` je obrazac, ne slobodan dokument:

```json
{
  "v": 1,
  "tema":        { "type": "doc", "content": [] },
  "wortschatz":  [ { "de": "die Bedingung, -en", "sr": "uslov" } ],
  "redemittel":  { "type": "doc", "content": [] },
  "fehler":      { "type": "doc", "content": [] },
  "grammatik":   { "type": "doc", "content": [] },
  "hausaufgabe": { "type": "doc", "content": [] },
  "lob":         { "type": "doc", "content": [] }
}
```

- Šest tekstualnih sekcija su Tiptap JSON. Prazna sekcija = `null` ili prazan doc → ne renderuje se.
- `wortschatz` je niz parova. `de` i `sr` su **čist tekst bez HTML-a** — poštuje poznatu zamku da se `<mark>` iz lekcije video kao sirov tag na kartici.
- `content_text` je plain-text ogledalo za PDF fallback i kasniju pretragu.

### `student_wordsets` — lični setovi kartica

Reči se pri snimanju beleške **prepisuju** u zasebne tabele. Jedan pisac: endpoint koji snima belešku.

```sql
create table public.student_wordsets (
  id                       uuid primary key default gen_random_uuid(),
  note_id                  uuid null references public.class_notes(id) on delete set null,
  individual_enrollment_id uuid null references public.individual_enrollments(id) on delete cascade,
  group_id                 uuid null references public.groups(id) on delete cascade,
  title                    text not null,
  lesson_date              date not null,
  position                 int,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint one_owner check (
    (individual_enrollment_id is not null) <> (group_id is not null)
  )
);

create table public.student_wordset_items (
  wordset_id uuid not null references public.student_wordsets(id) on delete cascade,
  idx        int  not null,
  front      text not null,
  back       text not null,
  primary key (wordset_id, idx)
);
```

Zašto zasebne tabele, a ne čitanje iz beleške:

- `note_id` je `on delete set null` — kad cron obriše belešku posle 6 meseci, **set preživi**.
- Vlasništvo se pamti nezavisno od beleške (`individual_enrollment_id` odn. `group_id`), pa se vidljivost zna i kad beleške više nema.
- Izmena WORTSCHATZ-a u belešci radi upsert nad setom po `note_id` — jedan izvor istine, bez razilaženja.

**`set_key` za napredak** = `sw_<wordset_id>`. Postojeći `cardId(setKey, front, back)` ostaje nedirnut, pa `flashcard_progress` radi bez ijedne izmene.

**Poznato ograničenje:** `cardId` se računa iz teksta kartice, pa ako profesorka ispravi tipfeler u reči, ta jedna kartica dobija nov id i njen napredak se resetuje. Ostale kartice se ne diraju. Prihvatljivo — ispravke su retke i tiču se jedne reči.

**„Sve reči"** nije red u bazi nego upit: svi `student_wordset_items` svih setova tog polaznika. Svaka kartica nosi `set_key` svog matičnog seta, pa se napredak broji jednom.

### Tok profesorke

- `/profesor/individualni` — dugme „Beleške za današnji čas" **zamenjuje** današnji prompt „zalepi link Google Doc-a". Isto na `/profesor/sesije` za grupe.
- **Otvaranje ne upisuje ništa.** Zapis časa (`individual_lessons` / `group_sessions`) i `class_notes` se kreiraju **pri prvom snimanju**. Time slučajno otvaranje beleške ne troši čas iz paketa i ne ulazi u honorar. (Ovo je izmena u odnosu na spec od 24.06, koji je kreirao čas pri otvaranju.)
- Datum je podrazumevano današnji, može se promeniti — izmena datuma povezuje belešku sa odgovarajućim zapisom časa.
- WORTSCHATZ tabela je skrojena za kucanje tokom časa: **Tab** prelazi na prevod, **Enter** otvara novi red.
- Opciono dugme **„dopuni rod i množinu"** pored tabele: Claude predloži `der/die/das` i množinu **u nemačku kolonu**, profesorka pregleda i potvrdi. Nikad samo od sebe. AI ostaje pomoćnik u pozadini.
- Snimanje: broadcast na `class-notes:<noteId>` dok kuca, debounce ~2s upis u bazu. Lokalni nacrt u `localStorage` po `noteId`.
- **Soft-lock:** ako profesorka otvori isti čas na drugom uređaju, dobije upozorenje. Samo ona piše, pa nema spajanja verzija.

### Tok polaznika

**`/beleske`** — zasebna stranica, ne tab unutar kursa. Razlog: KTZ mesečni polaznici nemaju pristup nijednom kursu (`course_unlocks` = 0), a beleške moraju da vide.

- Lista časova: datum + prvih par reči teme, ime profesorke.
- „Prikaži sve" → ceo paket na jednoj stranici, hronološki.
- Skidanje: ovaj čas (PDF) i ceo paket (PDF).
- **Uživo:** dok je beleška otvorena, polaznik sluša broadcast i vidi kako tekst nastaje. Render je inkrementalan uz čuvanje pozicije skrola.
- Grupni polaznik vidi beleške svoje grupe, **uključujući one pre svog upisa**.

**`/moje-reci`**

- „Sve reči" na vrhu, pa setovi po terminima (najnoviji prvi), svaki sa svojom trakom napretka.
- Režimi su postojeći: Uči, samo kviz, samo kucanje, igra memorije.
- Prečica sa same beleške: „Reči sa ovog časa → Vežbaj".

**Panel** — postojeća sekcija „Časovi uživo" na `/nalog` razvija se u panel. Sa `/dashboard` se dodaje prečica („Sledeći čas" + domaći, vodi na panel). Polaznik koji ima 1:1 upis **a nema ni jedan pristup kursu** (KTZ mesečni) posle prijave ide na `/nalog`, jer bi mu `/dashboard` bio prazan; svi ostali padaju na `/dashboard` kao do sad.

Panel sadrži:

| Blok | Odakle podatak |
|---|---|
| Sledeći čas, dugme „Uđi na čas" | kalendar profesorke preko Apps Script-a (1:1); `groups` raspored (grupe) |
| „Zakaži sledeći termin" | `user_profiles.calendar_url` |
| „Otkaži ovaj termin" | Apps Script (vidi Otkazivanje) |
| Preostali časovi, rok paketa | `individual_enrollments.package_lessons / lessons_used / expires_at` |
| Rok pristupa platformi | `course_access` |
| Domaći sa poslednjeg časa + čekboks | HAUSAUFGABE iz najnovije beleške |
| Reči sa poslednjeg časa → Vežbaj | najnoviji `student_wordsets` |
| „Na šta da paziš" | do 3 stavke iz FEHLER sekcija poslednja 3 časa, **bez ikakve obrade** — samo se prikazuju stavke liste koje je profesorka upisala |
| Beleške (poslednje 3) + PDF | `class_notes` |
| Video kurs, materijali, pismeni zadatak | postojeće |

Čekboks za domaći je za polaznika (`student_homework_done(user_id, note_id, done_at)`). Profesorka ga u v1 ne vidi.

### Sledeći čas i otkazivanje — zavisnost od Apps Script-a

**Platforma ne zna kad je sledeći 1:1 čas.** Termini se zakazuju preko kalendarskog linka profesorke i žive u njenom Google kalendaru; naša baza ima samo evidenciju *održanih* časova.

Zato panel za 1:1:

- **Čitanje:** GAS endpoint (`grupni-webapp`, koji već ima pristup kalendarima) vraća sledeći termin za mejl polaznika. Odgovor se kešira kratko (~5 min). Ako GAS ne odgovori, blok „Sledeći čas" se ne prikazuje — panel radi i bez njega, ne pada.
- **Otkazivanje:** `POST /api/student/otkazi-termin` → GAS označi termin („OTKAZANO" u naslovu, polaznik skinut sa gostiju), profesorka dobije mejl. Čas se ne troši (nikad nije bio upisan kao održan).
- Unutar 24 sata: kalendar se ne dira, ide samo mejl profesorki.

Za grupe sledeći čas se čita iz postojećeg rasporeda u bazi, bez GAS-a.

### PDF

- `GET /api/notes/export?scope=individual|group&id=<enrollmentId|groupId>&note=<noteId?>` → JSON → HTML → PDF.
- Render „JSON → prikaz" je **zajednička komponenta** za viewer i PDF, da prikaz bude identičan.
- Prazne sekcije se ne štampaju.
- Beleške su dostupne i posle isteka pristupa kursu, do automatskog brisanja.

### Brisanje i čišćenje

- Dnevni cron briše `class_notes` čiji je datum vezanog časa stariji od 6 meseci. `student_wordsets.note_id` postaje `null`, setovi ostaju.
- Dnevni cron šalje mejl ~15 dana pre brisanja, idempotentno (ne šalje dvaput za istu belešku). Koristi postojeću cron + Resend infrastrukturu.

### Bezbednost (RLS)

- `class_notes` SELECT: profesorka/admin sve svoje; polaznik belešku svog individualnog upisa **ili** grupe u kojoj je (ili je bio). Politika proverava postojanje upisa, **ne** istek pristupa.
- `class_notes` INSERT/UPDATE/DELETE: samo profesorka/admin.
- `student_wordsets` / `student_wordset_items` SELECT: polaznik svoje (preko upisa/grupe); pisanje samo kroz service-role endpoint.
- `flashcard_progress` već ima RLS po `auth.uid()` — radi bez izmene.
- Sadržaj se renderuje iz JSON-a u React čvorove, bez `dangerouslySetInnerHTML` → nema XSS.
- Realtime kanal: piše samo profesorka, polaznici slušaju.
- Beleške sadrže osetljive lične podatke (zdravlje, posao, porodica). RLS i retencija od 6 meseci nisu ukras nego obaveza.

### Komponente i rute

**Nove komponente**
- `NotesEditor` — profesorka: obrazac, Tiptap po sekciji, `WortschatzTable`, autosave, broadcast, soft-lock
- `WortschatzTable` — dve kolone, Tab/Enter, dugme „dopuni rod i množinu"
- `NotesViewer` — polaznik: read-only render + realtime pretplata
- `NotesRenderer` — zajednički „JSON → prikaz" (viewer + PDF), prazne sekcije preskače
- `PanelPolaznika` — blokovi sa tabele iznad
- `MojeReciStranica` — setovi + „Sve reči", nad postojećim Learn modulom

**Nove API rute**
- `/api/profesor/class-notes` — GET / POST / PATCH, `requireStaff()`; PATCH radi i upsert `student_wordsets`
- `/api/notes/export` — PDF
- `/api/student/sledeci-termin` — proxy na GAS, keširano
- `/api/student/otkazi-termin` — otkazivanje preko GAS-a
- `/api/student/domaci` — čekboks
- `/api/cron/beleske-retencija` — mejl + brisanje

**Izmene postojećeg**
- `src/app/profesor/individualni/IndividualniClient.tsx` — dugme „Beleške za današnji čas" umesto prompta za Doc link
- `src/app/profesor/sesije/SesijeClient.tsx` — isto za grupe
- `src/app/nalog/Sekcije.tsx` — sekcija „Časovi uživo" → panel
- `automatizacija/grupni-webapp/Code.gs` — prekidač da `kreirajIndBeleske` / `kreirajBeleske` više ne prave Doc za nove upise; nove funkcije `sledeciTermin`, `otkaziTermin`

**Migracija:** `class_notes`, `student_wordsets`, `student_wordset_items`, `student_homework_done` + RLS + indeksi, sledeći broj u `supabase/migrations/` (109).

## Kriške

Svaka kriška je nešto što radi i može da se pusti.

1. **Osnova + kartice** — migracije, obrazac sa 7 sekcija, WORTSCHATZ tabela, autosave, `student_wordsets`, `/beleske`, `/moje-reci`. 1:1.
2. **Live tabla** — Realtime broadcast, soft-lock, inkrementalni render kod polaznika. Ide pre prvog pravog časa.
3. **Grupe** — isti obrazac, vidljivost po grupi, beleške pre upisa.
4. **PDF + retencija** — export po času i po paketu, mejl 15 dana pre, brisanje na 6 meseci.
5. **Panel + otkazivanje** — panel na `/nalog`, GAS `sledeciTermin` i `otkaziTermin`, domaći čekboks, „na šta da paziš".

## Van obima (faza 2 ako zatreba)

- Slike, tabele i crtanje u belešci.
- Lične beleške polaznika ispod profesorkine.
- Uvoz starih Google Docs beleški.
- Pretraga kroz beleške.
- Mejl polazniku po objavi beleške.
- Profesorka vidi da li je domaći odrađen.
- Treća kolona „primer" u WORTSCHATZ-u (svesno odbijeno — kartica ostaje kratka).

## Testiranje

**Unit**
- `NotesRenderer`: prazna sekcija se ne renderuje (ni naslov); `<mark>` i drugi HTML u `de`/`sr` se ne izvršava
- izvođenje seta iz WORTSCHATZ-a: upsert po `note_id` ne duplira stavke; brisanje beleške ostavlja set
- `cardId` stabilnost: isti `front`/`back` → isti id posle izmene drugih redova
- PDF render
- RLS: tuđa beleška nedostupna; istekao pristup i dalje čita svoje; polaznik ne piše
- pravilo 24 sata za otkazivanje

**Integracija / smoke**
- autosave upsert; broadcast profesorka → polaznik
- čas se **ne** kreira dok se beleška ne snimi
- otkazivanje označi termin u kalendaru i pošalje mejl
- posle deploya obavezan smoke test na produkciji

## Rizici

- **Profesorke gube slobodu Google Doc-a** (slike, telefonska aplikacija, verzije). Potvrđeno da slike ne koriste, ali ostaje navika — prva kriška treba pravi čas sa pravom profesorkom pre šireg puštanja.
- **Ako platforma padne tokom časa, nema gde da se piše.** Do sad je to bio Googleov uptime, od sad naš. Ublažava `localStorage` nacrt, ne rešava.
- **Zavisnost od Apps Script-a** za sledeći termin i otkazivanje. Ako GAS ne odgovori, blok se ne prikazuje — panel mora da radi i bez njega.
- **Kartice su lista reči**, a pravilo je da se vokabular uči kroz kontekst. Odbrana: kartice su za ponavljanje posle časa, ne za učenje na času. Treća kolona sa primerom je svesno odbijena da kartica ostane kratka.
- **Osetljivi podaci u našoj bazi.** RLS i retencija su obavezni, ne opcioni.
- **Dva sistema u prelazu** — novi na platformi, tekući na Drive-u. Traje dok se paketi ne potroše i grupe ne završe.
- **Realtime konekcije po grupi** (10-15 polaznika) — u granicama Supabase plana, pratiti.
