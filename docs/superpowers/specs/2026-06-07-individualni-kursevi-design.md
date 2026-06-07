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
2. **Dvotarifno cenovanje.** Svih 6 profesorki dele standardnu cenu; **Nataša ima svoju
   cenu po proizvodu** (ne fiksna doplata). Profesorka ima `price_tier` (`standard`/`natasa`).
3. **Dve vrste individualnih:**
   - **„Po nivou"** (A1.1, A1.2, A2.1, …, B2.1, FIDE, FSP): uključuje pristup tom
     polunivou na platformi + fiksan broj časova po nivou (staro: A1=7, A2/B=10, FSP=5).
   - **KTZ / mesečni paketi:** **bez pristupa platformi**; kupac bira **broj termina
     (4 / 8 / 12)**, cena po broju časova.
4. **Zakazivanje = kalendar link profesorke** (`calendar.app.google/…`) u welcome mejlu.
   Student zakazuje direktno. Bez nativnog booking-a, bez Meet-a (to je grupni). Dokazan model.
5. **Honorari u app-u.** Profesorka unosi održane časove (individualne **i** grupne) u
   platformu; mesečni cron računa honorar i šalje mejlove. Stari `Finansije.js` se gasi.
6. **GAS sloj** = prošireni postojeći `grupni-webapp` (Apps Script web-app koji radi kao
   `info@hartweger.rs`). Dodaje se akcija `enrollIndividual` (samo pravi beleške doc).

## Odbačene alternative

- **Puna `product_variants` matrica + admin UI** (prof×kurs×paket cena): YAGNI — treba
  samo „Nataša ima svoju cenu" + „KTZ po broju termina". Tabela `product_variants` postoji
  u bazi ali je mrtav kod; **ne diramo je / ne oživljavamo**.
- **Nativno zakazivanje u app-u** (dostupnost profesorki, booking UI): ogroman build,
  menja naviku profesorki, kalendar linkovi rade.

## Model podataka

### Izmene postojećih tabela

**`user_profiles`** (kolone za profesorke, sve nullable):
- `calendar_url text` — `calendar.app.google/…` link (iz starog `Config.js`, svih 7).
- `price_tier text default 'standard'` — `'standard'` | `'natasa'`.
- `offers_individual boolean default true` — da li se nudi u izboru za individualne.
- `honorar_ind int` — honorar po individualnom času (default 1400).
- `honorar_grp int` — honorar po grupnoj sesiji (default 1600). Katarina: 1600/1800.

**`courses`** (kolone za individualne, sve nullable):
- `price_natasa_rsd int`, `price_natasa_eur int` — Natašina cena za „po nivou" kurseve.
- `included_lessons int` — broj časova za „po nivou" (npr. 7, 10, 5).
- `package_options jsonb` — za KTZ/mesečni:
  `[{"lessons":4,"price":…,"eur":…,"price_natasa":…,"eur_natasa":…}, {…8…}, {…12…}]`.
  Null za „po nivou". `courses.price` ostaje „od" (minimalna) cena za prikaz.

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
- `id uuid pk`, `group_id uuid fk`, `professor_id uuid`, `session_date date`, `created_at`.

RLS: profesorka vidi/piše samo svoje (`professor_id = auth uid`), admin/professor sve;
đak vidi svoj enrollment (read-only).

## Tok 1 — Checkout (`/kupovina/[slug]`)

1. Detekcija individualnog kursa (`course_type='individual'` ili
   `category in ('individualni','paket','mesecni')`).
2. **Izbor profesorke** — dropdown profesorki gde `offers_individual=true` (7).
3. Ako kurs ima `package_options` → **izbor broja termina (4/8/12)** → bira cenu + `lessons`.
4. **Cena (server-side u `/api/orders`, ne veruje klijentu):**
   - package kurs: izabrana opcija → `price`/`eur` ili `price_natasa`/`eur_natasa` po `price_tier`.
   - po nivou: `course.price`/`paypal_price_eur` ili `price_natasa_rsd`/`_eur` po `price_tier`.
   - `package_lessons` = `option.lessons` (package) ili `course.included_lessons` (po nivou).
5. **Prikaz (po pravilima [[feedback_ind_kursevi_sadrzaj]]):** „sa Natašom: X din", RSD +
   EUR ispod, bez reči „checkout" („u sledećem koraku"), bez „Nataša +5000".
6. Order stavka nosi `professor_id` + `package_lessons` + izabranu cenu. Plaćanje isto kao
   sad (uplatnica / kartica+rate / PayPal).

## Tok 2 — grant-access (po uplati), individualna grana

Dopuna `src/lib/grant-access.ts` (uz postojeću grupnu granu):

1. **Pristup sadržaju:** „po nivou" → `course_unlocks` otključava polunivo (verifikovati/
   dodati redove za individualne po-nivou kurseve). **KTZ/mesečni → bez sadržaja** (nema unlock).
2. Kreira **`individual_enrollment`** (prof iz order stavke, `package_lessons`, `status='active'`,
   `expires_at` = uplata + rok: **KTZ 1 mesec**, ostali **3 meseca** — staro `ROK_MESECI`).
3. **GAS `enrollIndividual`** → pravi individualne beleške iz šablona
   `1e2aP8rWHgS3XtOOblivZua6F8GEmX25R9ZTABH1Bg2g` u folderu profesorke, vraća `notesUrl`
   (upiše se u enrollment). **Bez kalendar eventa** (individualni koristi kalendar link prof).
4. **Jedan welcome mejl đaku:** pristup platformi (ako po nivou) + link beleški + **kalendar
   link profesorke** (tu zakazuje) + kratko uputstvo.
5. **Mejl profesorki:** novi individualni đak (ime, mejl, nivo, broj časova, beleške).
6. **Ne piše se u Google Sheet** (app je izvor). Idempotentno kao postojeći `grantAccessForOrder`.

## Tok 3 — Profesorski ekran (unos časova)

Dopuna profesorskog dashboarda (admin može isto, za sve):
- **„Moji individualni đaci":** lista aktivnih `individual_enrollments` (đak, nivo,
  **iskorišćeno/ukupno**, rok). Dugme **„Dodaj održan čas"** → izbor datuma (prima i prošli
  datum) → insert `individual_lessons`, uveća `lessons_used`, prikaže preostalo.
- **„Grupne sesije":** za njene grupe dugme **„Dodaj održanu sesiju"** → datum →
  insert `group_sessions`.

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
| Broj časova po nivou (A1=7, A2/B=10, FSP=5) | ✅ staro `PAKET_PO_NIVOU` (potvrditi za KTZ/FIDE) |
| Standardne cene po nivou (RSD) | ✅ iz `individualni-cards.ts` (potvrditi EUR) |
| **Natašine cene po proizvodu (RSD+EUR)** | ⬜ treba od Nataše / iz WP-a |
| **KTZ/mesečni cene 4/8/12 (RSD+EUR, std + Nataša)** | ⬜ treba od Nataše / iz WP-a |
| `course_unlocks` za individualne po-nivou kurseve | ⬜ verifikovati u bazi, dodati ako fale |

## Testiranje

- Vitest: računanje cene (std vs Nataša, package opcije), `package_lessons` izbor,
  honorar obračun (ind/grp, premium rate), idempotentnost grant-access individualne grane.
- Smoke (po [[feedback_deploy_smoke_test]]): kupovina individualnog (po nivou + KTZ paket),
  potvrda uplate → enrollment + beleške + mejlovi; profesorski unos časa → brojač; cron honorar
  ručno okinut na test podacima.

## Veze

[[project_grupni_upis_automatizacija]] (šablon toka i GAS), [[project_feature_parity_audit]]
(gap #5/#6/#7-9), [[feedback_ind_kursevi_sadrzaj]], [[feedback_prodaja_1na1_bez_videa]],
[[reference_stari_appscript_trigeri]] (gašenje Finansije triggera), [[project_course_unlocks]],
[[feedback_deploy_smoke_test]], [[reference_vercel_deploy]].
