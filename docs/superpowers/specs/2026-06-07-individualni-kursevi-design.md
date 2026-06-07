# Individualni kursevi — kupovina + zakazivanje + honorari (dizajn)

**Datum:** 2026-06-07
**Cutover:** od **2026-06-10** sve ide po novom načinu.
**Status:** dogovoren, čeka plan implementacije.

## Cilj

Poslednji veliki blok pre flipa domena (`hartweger.rs` → novi sajt): individualni (1:1)
kursevi moraju da se mogu kupiti, zakazati i obračunati — bolje nego na starom
WP+LearnDash+WooCommerce+Apps Script sistemu. Radimo **sve odjednom, jedan deploy**.

Zamenjuje stari tok: `apps-script-2/WooSync.js` (kupovina, beleške, prof Sheet),
`Finansije.js` (honorari), prof Google Sheet-ovi (IND/GRP/Finansije tabovi).

## Ključne odluke

1. **Izvor istine = Supabase.** Individualni upisi, održani časovi i honorari žive u
   bazi/app-u. Stari prof Google Sheet-ovi i `Finansije.js` se **gase** na cutover-u.
   Beleške (collaborative doc) ostaju u Google-u preko GAS-a — to je radni dokument.
2. **Cena je po varijaciji (kurs × profesorka × paket).** Potvrđeno iz WooCommerce-a:
   nije čisto dvotarifno — npr. u mesečnom paketu i Marija odstupa (28.000/42.000 vs
   27.500/41.000), ne samo Nataša (16.100/32.400/48.300). Zato cene žive u
   **`product_variants`** (jedan red = jedna varijacija), seed-ovano iz WC API-ja.
   Spisak profesorki je **po kursu** (postoji varijacija = nudi se); Danice nema u
   individualnim (samo grupna). FIDE i FSP su *simple* — bez izbora profesorke.
3. **Dve vrste individualnih:**
   - **„Po nivou"** (A1.1, A1.2, A2.1, …, B2.1, FIDE, FSP, paket A1): uključuje pristup
     tom polunivou na platformi + fiksan broj časova po nivou (staro: A1=7, A2/B=10, FSP=5).
   - **Mesečni paketi:** **bez pristupa platformi**; kupac bira **broj termina (4 / 8 / 12)**,
     cena po broju časova.
4. **Zakazivanje = kalendar link profesorke** (`calendar.app.google/…`) u welcome mejlu.
   Student zakazuje direktno. Bez nativnog booking-a, bez Meet-a (to je grupni). Dokazan model.
5. **Honorari u app-u.** Profesorka unosi održane časove (individualne **i** grupne) u
   platformu; mesečni cron računa honorar i šalje mejlove. Stari `Finansije.js` se gasi.
6. **GAS sloj** = prošireni postojeći `grupni-webapp` (Apps Script web-app koji radi kao
   `info@hartweger.rs`). Dodaje se akcija `enrollIndividual` (samo pravi beleške doc).

## Odbačene alternative

- **Ad-hoc cene na `courses`** (`price_natasa`, `package_options` jsonb): prvobitno
  predloženo dok smo mislili da je dvotarifno. WC pokazuje pravu po-varijaciji matricu
  (i Marija odstupa), pa se umesto toga **oživljava `product_variants`** (postojeća tabela).
- **Nativno zakazivanje u app-u** (dostupnost profesorki, booking UI): ogroman build,
  menja naviku profesorki, kalendar linkovi rade.

## Model podataka

### Izmene postojećih tabela

**`user_profiles`** (kolone za profesorke, sve nullable):
- `calendar_url text` — `calendar.app.google/…` link (iz starog `Config.js`, svih 7).
- `honorar_ind int` — honorar po individualnom času (default 1400).
- `honorar_grp int` — honorar po grupnoj sesiji (default 1600). Katarina: 1600/1800.

(Bez `offers_individual` — nuđenje se izvodi iz postojanja varijacije za taj kurs.)

**`courses`** (kolone za individualne, sve nullable):
- `included_lessons int` — broj časova za „po nivou" (npr. 7, 10, 5). Za mesečni paket
  broj časova dolazi iz `package_type` varijacije (paket4→4 itd.). `courses.price` = „od" prikaz.

### Oživljavanje `product_variants` (postojeća, prazna tabela)

Šema: `id, course_id, professor_id, package_type text, price int, paypal_price_eur int,
is_active bool`. Jedan red = jedna kupovna varijacija:
- „Po nivou": redovi po profesorki (`package_type` NULL). Npr. A1.1 × {Marija,Suzana,
  Hristina,Milica} = 23.000; A1.1 × Nataša = 28.000.
- Mesečni paket: redovi po (profesorka × `package_type` ∈ {paket4,paket8,paket12}).
- FIDE/FSP (*simple*): jedan red, `professor_id` NULL (profesor se dodeljuje kasnije, vidi Tok 2).
- `paypal_price_eur` NULL → izvodi se postojećom logikom sajta (RSD→EUR/PayPal).

**Seed:** skripta `scripts/seed-individual-variants.mjs` povlači WC varijacije (kategorija
357 + mesečni 370), mapira: WC `slug` → naš `courses.slug`; ime profesorke → `user_profiles`
preko **normalizacije prvog imena** (WP ima tipfelere: „Radojkvić"/„Radojković"). Ispisuje
izveštaj mapiranja za ručnu potvrdu pre upisa.

### Nove tabele (migracija 040)

**`individual_enrollments`** — roster (zamena za prof IND Sheet):
- `id uuid pk`, `user_id uuid` (đak), `course_id uuid`, `professor_id uuid`,
  `order_id uuid`, `package_lessons int`, `lessons_used int default 0`,
  `notes_doc_url text`, `status text` (`active`/`completed`/`expired`/`cancelled`),
  `expires_at timestamptz`, `created_at timestamptz default now()`.

**`individual_lessons`** — log održanih individualnih časova:
- `id uuid pk`, `enrollment_id uuid fk`, `professor_id uuid` (denormalizovano),
  `lesson_date date`, `created_at`. Jedan red = jedan održan čas;
  `lessons_used` = broj redova za taj enrollment.

**`group_sessions`** — log održanih grupnih sesija (za honorar):
- `id uuid pk`, `group_id uuid fk`, `professor_id uuid`, `session_date date`,
  `source text default 'manual'` (`'manual'` | `'auto'`), `created_at`.
- **Auto-izvođenje + ručna korekcija:** pri otvaranju/osvežavanju termina (postojeći grupni
  tok) generišu se `group_sessions` redovi iz rasporeda (nedelje×dani), `source='auto'`.
  Profesorka onda **briše otkazane** I **dodaje održane vanredne/nadoknade** (`source='manual'`).
  Tako je honorar tačan bez ručnog upisa svake redovne sesije. Individualni ostaju potpuno
  ručni (nemaju fiksan raspored).

RLS: profesorka vidi/piše samo svoje (`professor_id = auth uid`), admin/professor sve;
đak vidi svoj enrollment (read-only).

**Rok važenja — dva odvojena pojma:**
- *Pristup sadržaju* (`course_access.expires_at`): **1 godina** (kao ostatak platforme).
- *Važenje paketa časova* (`individual_enrollments.expires_at`): **3 meseca** (mesečni paket
  po potrebi kraće) — rok do kog se časovi moraju iskoristiti. Istek ne briše sadržaj.

## Tok 1 — Checkout (`/kupovina/[slug]`)

1. Detekcija individualnog kursa (`course_type='individual'` ili
   `category in ('individualni','paket','mesecni')`).
2. Učitaju se `product_variants` za taj kurs. **Izbor profesorke** = dropdown distinct
   profesorki iz varijacija (ako ih ima; FIDE/FSP nemaju → bez dropdowna).
3. Ako varijacije imaju `package_type` (mesečni) → **izbor broja termina (4/8/12)**.
4. **Cena (server-side u `/api/orders`, ne veruje klijentu):** odabere se varijacija po
   (`course_id`, `professor_id`, `package_type`) → `price` (+ EUR iz `paypal_price_eur` ili
   izvedeno). `package_lessons` = iz `package_type` (paket4→4) ili `course.included_lessons`
   (po nivou). FIDE/FSP: jedina varijacija, `professor_id` NULL.
5. **Prikaz (po pravilima [[feedback_ind_kursevi_sadrzaj]]):** „sa Natašom: X din", RSD +
   EUR ispod, bez reči „checkout" („u sledećem koraku"), bez „Nataša +5000".
6. Order stavka nosi `professor_id` + `package_lessons` + izabranu cenu. Plaćanje isto kao
   sad (uplatnica / kartica+rate / PayPal).

## Tok 2 — grant-access (po uplati), individualna grana

Dopuna `src/lib/grant-access.ts` (uz postojeću grupnu granu):

1. **Pristup sadržaju (1 god):** „po nivou" → `course_unlocks` otključava polunivo
   (verifikovati/dodati redove). **Mesečni paket → bez sadržaja** (nema unlock).
2. Kreira **`individual_enrollment`** (prof iz order stavke, `package_lessons`, `status='active'`,
   `expires_at` = uplata + **3 meseca** — važenje paketa časova).
3. **Profesor za FIDE/FSP (bez varijacije):** `professor_id` na enrollmentu ostaje NULL →
   enrollment se pojavi u admin redu „za dodelu"; admin dodeli profesorku, što tada okida
   korake 4–6 (beleške + mejlovi). Po nivou/mesečni: profesorka je već poznata iz checkout-a.
4. **GAS `enrollIndividual`** → pravi individualne beleške iz šablona
   `1e2aP8rWHgS3XtOOblivZua6F8GEmX25R9ZTABH1Bg2g` u folderu profesorke, vraća `notesUrl`
   (upiše se u enrollment). **Bez kalendar eventa** (individualni koristi kalendar link prof).
5. **Jedan welcome mejl đaku:** pristup platformi (ako po nivou) + link beleški + **kalendar
   link profesorke** (tu zakazuje) + kratko uputstvo.
6. **Mejl profesorki:** novi individualni đak (ime, mejl, nivo, broj časova, beleške).
7. **Ne piše se u Google Sheet** (app je izvor). Idempotentno kao postojeći `grantAccessForOrder`.

## Tok 3 — Profesorski ekran (unos časova)

Dopuna profesorskog dashboarda (admin može isto, za sve):
- **„Moji individualni đaci":** lista aktivnih `individual_enrollments` (đak, nivo,
  **iskorišćeno/ukupno**, rok). Dugme **„Dodaj održan čas"** → izbor datuma (prima i prošli
  datum) → insert `individual_lessons`, uveća `lessons_used`, prikaže preostalo.
- **„Grupne sesije":** za njene grupe vidi auto-generisane sesije iz rasporeda; može da
  **obriše otkazanu** i da **doda vanrednu/nadoknadu** (`source='manual'`).

Pošto datum može biti u prošlosti, **jun pre 10.6.** se dopunjava ovde (prof/admin unese, ili
Nataša da brojeve) → julski cron izračuna pun jun.

## Tok 4 — Honorari (mesečni cron `/api/cron/honorari`)

- 1. u mesecu, za **prethodni mesec**, po profesorki:
  `ind = count(individual_lessons u mesecu)`, `grp = count(group_sessions u mesecu)`;
  `total = ind*honorar_ind + grp*honorar_grp`.
- Mejl svakoj profesorki (njen obračun) + **zbirni mejl Nataši/`info@`** (sve profesorke + ukupno).
- Resend (kao postojeći cronovi). `CRON_SECRET` zaštita. Vercel cron raspored.

## Cutover (ručni koraci, u plan kao checklist)

- **2026-06-10:** novi tok live na produkciji.
- Ugasiti stari `Finansije.js` trigger (Apps Script) — da nema duplog obračuna honorara.
- Jun pre 10.6.: Nataša/admin unose održane časove kroz profesorski ekran (ili Nataša da
  brojeve pa admin unese).
- Grupni roster-upis u GRP Sheet (`grupni-webapp` `enroll`) sme da ostane (bezopasan roster),
  ali honorar od cutover-a ide iz app-a.

## Podaci za potvrdu (nije arhitektura — popunjava se u planu/seed-u)

| Podatak | Status |
|---|---|
| Kalendar linkovi (7 profesorki) | ✅ imam (stari `Config.js`) |
| Individualni beleške šablon ID | ✅ `1e2aP8rWHgS3XtOOblivZua6F8GEmX25R9ZTABH1Bg2g` |
| Honorar rate (1400/1600; Katarina 1600/1800) | ✅ iz starog `Finansije.js` |
| Broj časova po nivou (A1=7, A2/B=10, FSP=5) | ✅ staro `PAKET_PO_NIVOU` (potvrditi FIDE) |
| **Sve cene varijacija (prof×kurs×paket, RSD)** | ✅ iz WC API-ja (seed skripta) |
| EUR/PayPal cene | ✅ izvode se postojećom logikom sajta |
| **Profesor za FIDE/FSP (ko predaje)** | ⬜ jedino što treba od Nataše |
| `course_unlocks` za individualne po-nivou kurseve | ⬜ verifikovati u bazi, dodati ako fale |

## Testiranje

- Vitest: izbor varijacije i cene (po nivou, mesečni paket4/8/12, Nataša/Marija odstupanja),
  `package_lessons` izbor, honorar obračun (ind/grp, Katarina premium), auto-izvođenje grupnih
  sesija iz rasporeda, idempotentnost grant-access individualne grane.
- Smoke (po [[feedback_deploy_smoke_test]]): kupovina individualnog (po nivou + mesečni paket),
  potvrda uplate → enrollment + beleške + mejlovi; profesorski unos časa → brojač; cron honorar
  ručno okinut na test podacima.

## Veze

[[project_grupni_upis_automatizacija]] (šablon toka i GAS), [[project_feature_parity_audit]]
(gap #5/#6/#7-9), [[feedback_ind_kursevi_sadrzaj]], [[feedback_prodaja_1na1_bez_videa]],
[[reference_stari_appscript_trigeri]] (gašenje Finansije triggera), [[project_course_unlocks]],
[[feedback_deploy_smoke_test]], [[reference_vercel_deploy]].
