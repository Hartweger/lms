# Konverzacijski kurs nemačkog (B1+) - nova ponuda

**Datum:** 2026-06-21
**Start kursa:** 2026-07-03 (petak)
**Profesor:** Katarina Todosijević
**Status:** spec za odobrenje

## Cilj

Dodati novu ponudu - konverzacijski grupni kurs za polaznike koji su završili B1 i
žele praksu govora. Kurs se prodaje kroz postojeću mašineriju grupnih kurseva
(auto-upis, brojanje mesta, checkout, welcome mejl), prikazuje se u katalogu pod
novim tabom „Konverzacijski", a sadržaj se isporučuje uživo preko Google Meet +
Quizlet setovi mejlom (bez LMS sadržaja).

Plus: tekst Instagram objave.

## Odluke (potvrđene sa Natašom)

- **Naslov:** „Konverzacijski kurs nemačkog (B1+)"
- **Cena:** 17.550 RSD / 150 €
- **Termini:** petkom u 13h, 9 termina (9 nedelja), online Google Meet
- **Mesta:** max 6, min 3 da grupa krene
- **Sadržaj:** Quizlet se POTPUNO gasi. Pravimo sadržajni kurs u LMS-u sa našim
  native karticama reči (postojeća „wordset" vežba). Izvor reči = postojeći Quizlet
  setovi koje Katarina ima (prebacuju se u native; Quizlet se nigde ne vidi).
  Meet link je per-grupa (na `groups.meet_link`, ide welcome mejlom), NE u sadržaju.
  NAPOMENA: izrada kartica + sadržajnog kursa odložena za 2026-06-22; danas finalizovan
  samo opis za prijavu + Instagram objava.
- **Profesor:** Katarina Todosijević

## Ključna ograničenja iz koda (zašto baš ovako)

Auto-upis u grupu (`src/lib/grant-access.ts`) okida se samo ako:
1. slug počinje sa `grupni-`
2. `courses.category = 'grupni'`
3. postoji unos u `SLUG_TO_NIVO` (`src/lib/course-nivo.ts`)
4. postoji `groups` red sa istim `level` i statusom `otvoren`

Cena na stranici ponude dolazi iz `courses.price` (ne iz hardkodirane mape), pa
slobodno postavljamo 17.550. Brojanje mesta je automatsko preko `group_enrollments`.

**Zamka:** `src/components/RasporedGrupa.tsx` (stranica `/grupni-kursevi`) ima
hardkodirane cene/boje/checkout-linkove za A1-C1 (čita prva 2 slova nivoa). Bez
zaštite, konverzacijska grupa bi se tu prikazala sa pogrešnom cenom (19.600) i
pokvarenim linkom (`/kupovina/grupni-ko`). Mora se zaštititi.

## Arhitektura (Pristup A - uklapanje u postojeći sistem)

### 1. `courses` red (SQL seed)
- `slug`: `grupni-konverzacijski-nemacki-b1`
- `title`: „Konverzacijski kurs nemačkog (B1+)"
- `category`: `grupni`
- `course_type`: `group`
- `price`: `17550`
- `paypal_price_eur`: `150`
- `is_purchasable`: `true`
- `description`: kratak SEO opis (vidi Copy)
- `marketing_description`, `features`: vidi Copy (mogu i u kodu fallback, ali idu u bazu)

### 2. `SLUG_TO_NIVO` unos (`src/lib/course-nivo.ts`)
```ts
"grupni-konverzacijski-nemacki-b1": "Konverzacija B1+",
```

### 3. `groups` red (SQL seed ili /admin/grupe)
- `level`: `Konverzacija B1+`  (mora se poklapati sa SLUG_TO_NIVO vrednošću)
- `type`: `grupni`
- `professor_id`: UUID Katarine Todosijević (potražiti u bazi)
- `content_course_id`: ID sadržajnog kursa „Konverzacijski (B1+)" sa native karticama
  (kreira se 2026-06-22; do tada može NULL)
- `status`: `otvoren`
- `start_date`: `2026-07-03`
- `duration_weeks`: `9`
- `days`: `{5}` (petak; 1=Pon..7=Ned)
- `session_time`: `13:00-14:00`
- `min_seats`: `3`
- `max_seats`: `6`
- `source`: `konverzacijski-2026-07`

### 4. Novi tab „Konverzacijski" (`src/components/KurseviKatalog.tsx`)
- proširiti tip `TabId` sa `"konverzacijski"`
- dodati SVG ikonicu (npr. govorni oblačić)
- dodati `TabConfig` (info blok, bez `levels` ili sa jednim „B1+"), sa jednom karticom:
  - badge „B1+", naslov „Konverzacijski kurs nemačkog (B1+)", meta „max 6 polaznika",
    desc kratak, cena „17.550 din" / „≈ 150€", href `/kursevi/grupni-konverzacijski-nemacki-b1`, cta „Prijavi se"
- dodati unos u `tabAccent` (boja, npr. ljubičasta `#7c3aed` ili topla koral)
- dodati ključ `konverzacijski` u inicijalni `activeLevel` state (npr. `"sve"`)

### 5. Zaštita `RasporedGrupa` (`src/components/RasporedGrupa.tsx`)
Da konverzacijska grupa ne pokvari `/grupni-kursevi`:
- **Opcija (preporuka):** izostaviti grupe čiji `nivoKey` nije u `LEVEL_ORDER`
  (A1-C1) iz prikaza na toj stranici - konverzacijski kurs se ionako prodaje iz
  kataloga, ne sa te stranice. Filter: `available`/`filtered` da preskoče nepoznate nivoe.
- Alternativa: učiniti cenu/link data-driven (više posla). Za sada filter.

### 6. Stranica ponude (`src/app/kursevi/[slug]/page.tsx`)
- `marketing_description` + `features` se već renderuju (grupni layout, „Šta dobijaš upisom?").
- Live info blok (početak, profesor, termin, trajanje, slobodna mesta, Meet) radi
  automatski jer grupa ima `status=otvoren` i poklapa se nivo.
- **Dodatak:** sekcija „Raspored tema" (9 tema) za ovaj kurs. Da izbegnemo izmenu
  šeme, dodati hardkodiran blok keyed po slug-u (po uzoru na `courseFallbacks`),
  koji se renderuje samo kad postoji za dati slug. Lista tema iz Copy sekcije.
- Preduslov: dodati u `preduslov` mapu nije moguće preko nivoa (nije CEFR) - umesto
  toga „Za koga je kurs" ide kao deo opisa/feature-a (vidi Copy).

### 7. Sadržajni kurs + course_unlocks (2026-06-22)
Pošto Quizlet gasimo i pravimo native kartice, treba:
- sadržajni kurs „Konverzacijski (B1+)" sa 8 setova reči (native „wordset") + uvodna
  lekcija (raspored tema, kako kurs radi; bez Meet linka - on je per-grupa, mejlom)
- `course_unlocks` mapping: `grupni-konverzacijski-kurs-nemackog-b1` → sadržajni kurs
- tada `grant-access` automatski dodeljuje `course_access` na sadržajni kurs (nema
  praznog kursa, jer sadržaj postoji)
- izvor reči: postojeći Quizlet setovi (Katarinini) → prebaciti u native kartice

### 8. Welcome mejl
Postojeći `sendGrupniWelcomeEmail` se okida automatski. Proveriti da tekst ima
smisla i kad nema Meet linka još (grupa dobija Meet pri prvom „osveži termin" u
/admin/grupe). Po potrebi ručno generisati Meet/kalendar iz admin panela.

## Copy (tekst za sajt) - ti-forma, obična crtica

### description (SEO, ~150 znakova)
> Konverzacijski kurs nemačkog za nivo B1+. Praksa govora u maloj grupi, 9 termina
> online, teme iz svakodnevnog života na DACH području. Profesor: Katarina Todosijević.

### marketing_description (paragrafi)
> Pričaj nemački tamo gde živiš - bez blokade.
>
> Živiš u Nemačkoj, Austriji ili Švajcarskoj, razumeš dosta - ali kad treba da
> progovoriš, negde zastaneš? Ovaj kurs je napravljen tačno za tebe. U maloj grupi
> ljudi koji se nose sa istim, naučićeš da koristiš nemački u stvarnim situacijama:
> na poslu, kod lekara, sa komšijama, u prodavnici.
>
> Jednom nedeljno, petkom, srećemo se online. Svaki čas je posvećen jednoj temi iz
> svakodnevnog života - od posla i porodice do putovanja i digitalizacije. Prvi čas
> je opušteni Icebreaker, a pre svakog narednog časa dobijaš set reči na platformi
> (naše kartice za vežbanje) da ih naučiš u svom tempu - pa ih odmah koristimo u
> razgovoru. Bez dosadnog ponavljanja, bez straha od greške.

### features („Šta dobijaš upisom?")
- 9 termina, jednom nedeljno, petkom u 13h - online preko Google Meet
- Setovi reči na platformi: pre svakog časa dobijaš naše kartice za pripremu
- 8 konverzacijskih tema iz stvarnog života na DACH području
- Mala grupa, maksimalno 6 polaznika - svi pričaju, niko ne čeka

### Raspored tema (sekcija na stranici)
1. Icebreaker Plauderstunde - upoznavanje + kako funkcioniše kurs
2. Hobby, Beruf & Alltag
3. Familie, Feste & Erziehung
4. Stadt- und Landleben
5. Arbeit & Karriere
6. Reisen & Urlaub
7. Umwelt & Umweltschutz
8. Internet & Digitalisierung
9. Hoffnungen & Erwartungen + Fazit

### Za koga je kurs (deo opisa/feature blok)
- Za sve koji su završili B1 i žele konverzacijsku praksu
- Za one koji razumeju nemački, ali im govor blokira
- Za ljude koji žive na DACH području i svakodnevno koriste nemački
- Za sve koji žele strukturirano učenje u toploj, opuštenoj atmosferi

### FAQ (konverzacijski)
- **Šta se dešava nakon prijave?** Odmah dobijaš potvrdu sa svim informacijama i
  link za prvi čas. Treba ti samo uređaj sa internetom - ništa se ne instalira.
- **Koliko vremena treba nedeljno?** Oko 2 sata: čas petkom od 60 minuta + 30-45
  minuta za vežbanje reči pre časa.
- **Nisi siguran/na da li je kurs za tebe?** Zakaži besplatne konsultacije:
  https://calendar.app.google/gw9y7KpvRbMz6sot8

### Instagram objava (finalno)
**Caption:**
> Razumeš nemački, ali kad treba da progovoriš - zastaneš? 🙊
>
> Novi konverzacijski kurs (B1+) kreće 3. jula. Petkom online, u maloj grupi do 6
> ljudi koji žive isto što i ti - u Nemačkoj, Austriji, Švajcarskoj.
>
> Svake nedelje jedna tema iz života: posao, porodica, putovanja, komšije,
> digitalizacija. Pričamo slobodno, bez bubanja i bez straha od greške.
>
> 🗓 Start 3.7. · petkom u 13h · 9 termina
> 👩‍🏫 Katarina Todosijević
> 👥 max 6 polaznika
>
> Prijava i detalji na sajtu (link u bio). Nisi siguran/na? Zakaži besplatne
> konsultacije 💬
>
> #nemacki #nemackijezik #ucenjenemackog #nemackazadijasporu #konverzacija #dach

**Carousel (ideja, 8 slajdova - po jedna tema):** naslovni slajd („Otključaj svoj
nemački") + 8 slajdova sa temama + CTA slajd. Po želji napraviti u Canvi.

## Šta NE radimo (YAGNI)
- Ne koristimo Quizlet nigde (ni link, ni embed) - samo native kartice.
- Ne refaktorišemo ceo grupni sistem (samo tačkasta zaštita `RasporedGrupa`).
- Ne diramo cenovne mape za A1-C1.
- Ne deployujemo „flashcard Learn" granu za 3.7. (koristimo postojeću „wordset" vežbu).

## Redosled implementacije
1. SQL: `courses` red + `groups` red (+ pronaći Katarinin `professor_id`).
2. Kod: `SLUG_TO_NIVO`, tab u `KurseviKatalog`, „Raspored tema" sekcija na stranici
   ponude, `RasporedGrupa` filter, `grant-access` guard.
3. Lokalni smoke (stranica ponude renderuje, tab radi, checkout vodi na order).
4. Deploy `vercel --prod` + smoke na produkciji `/kursevi/grupni-konverzacijski-nemacki-b1`.
5. /admin/grupe: „Napravi / osveži termin" da se generiše Meet + kalendar + beleške.
6. Instagram objava - tekst preda Nataši (+ opciono Canva).

## Provere pre „gotovo"
- Stranica ponude prikazuje tačnu cenu (17.550 / 150 €) i live info (3.7, petak 13h, 6 mesta).
- Tab „Konverzacijski" se vidi u katalogu i kartica vodi na stranicu.
- `/grupni-kursevi` se NE kvari (konverzacijska grupa filtrirana ili korektna).
- Probni order (test) → posle potvrde plaćanja gost je u `group_enrollments`,
  mesta umanjena, welcome mejl poslat, NEMA praznog kursa u „Moji kursevi".
