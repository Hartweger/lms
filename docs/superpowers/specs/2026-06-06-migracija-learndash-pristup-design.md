# Migracija pristupa sa LearnDash na novi LMS — dizajn

**Datum:** 2026-06-06
**Cilj:** Prebaciti SVE aktivne LearnDash kupce na kurs.hartweger (novi LMS) i dodeliti im pristup tačno onim sadržajnim kursevima koje su platili, sa istim rokom kao na WP (1 godina od kupovine). Preduslov za gašenje WP-a.

## Kontekst i ograničenja

- **Rok pristupa:** na LearnDash-u je svaki kurs imao tačno **365 dana** od kupovine. Zato je `expires_at = datum_kupovine + 365 dana` verno LD-u (nema potrebe za čitanjem `learndash_user_course_expires_on()`).
- **Aktivni = rok u budućnosti.** Pošto je 365 dana, aktivne su kupovine od **2025-06-07** do danas. Sve starije je isteklo i ne migrira se.
- **Sve je išlo kroz WooCommerce** — nema ručnih/poklon upisa van narudžbina. WooCommerce narudžbine su kompletan izvor istine.
- **Bez ijednog mejla.** Nalozi se kreiraju tiho. Obaveštavanje korisnika je zaseban, kasniji korak (vidi domen-migracija plan).

## Izvor podataka: WC API (ne CSV, ne snippet)

Narudžbine se povlače direktno preko WooCommerce REST API-ja (`/wp-json/wc/v3/orders`), čime se koristi **`product_id`** (ne krhki tekst-naziv) za spoj na mapu. Kredencijali (read-only consumer key/secret) idu kroz env.

- Status: `completed` + `processing`. `refunded`/otkazane/negativne stavke se preskaču.
- Filter: `after=2025-06-07T00:00:00`.
- Po `(email, sadržajni_kurs)` zadržati **najnoviju** kupovinu (najdalji rok).
- Rate limit: pauza ~2.5s između stranica (≈100 req prag).

## Mapa: proizvod → sadržajni kurs(evi) na novom LMS-u

Osnova je autoritativna WooCommerce veza `_related_course` (product meta) → LD course id → novi slug. Plus ručni override za proizvode koje WC nije auto-upisivao a poslovno treba da dobiju sadržaj.

### LD course id → novi slug
| LD id | LD naziv | Novi slug |
|---|---|---|
| 25340 | A1.1 | `nemacki-a1-1` |
| 28450 | A1.2 | `nemacki-a1-2` |
| 30649 | A2.1 | `nemacki-a2-1` |
| 33399 | A2.2 | `nemacki-a2-2` |
| 35855 | B1.1 | `nemacki-b1-1` |
| 37375 | B1.2 | `nemacki-b1-2` |
| 45327 | B2.1 | `nemacki-b2-1` |
| 40821 | B2.2 | `nemacki-b2-2` |
| 47215 | Položi C1 | `polozi-goethe-c1` |
| 31516 | Goethe B1 | `polozi-goethe-b1` |
| 31515 | Goethe B2 | `polozi-goethe-b2` |
| 45501 | Položi FIDE | `polozi-fide` |
| 40305 | Položi FSP | `fsp` |
| 47790 | Gramatika A2-B1 | `gramatika-a2-b1` |
| 50096 | Mame i trudnice | `kurs-za-mame-i-trudnice` |

### Proizvodi sa `_related_course` (autoritativno)
- VIDEO/GRUPNI A1 → `nemacki-a1-1` + `nemacki-a1-2`
- VIDEO/GRUPNI A2 → `nemacki-a2-1` + `nemacki-a2-2`
- VIDEO/GRUPNI B1 → `nemacki-b1-1` + `nemacki-b1-2`
- GRUPNI pojedinačni (A1.1, A1.2, A2.1, A2.2, B1.1, B1.2) → tačno taj nivo
- GRUPNI B2.1 → `nemacki-b2-1` + `nemacki-b2-2`; GRUPNI B2.2 → `nemacki-b2-2`
- INDIVIDUALNI B2.1 → `nemacki-b2-1`
- Video: Paket A1 i A2 → a1-1, a1-2, a2-1, a2-2
- Video: Paket A1, A2 i B1 → + b1-1, b1-2
- Video/Individualni FIDE → `polozi-fide`; Video/Individualni FSP → `fsp`
- Video + B1 ispit → `polozi-goethe-b1`; Goethe B2 → `polozi-goethe-b2`; Goethe C1 / Grupni C1.1 / C1.2 → `polozi-goethe-c1`
- VIDEO + Ebook Gramatika A2-B1 → `gramatika-a2-b1`

### Override / mapiranje po NAZIVU (radi i za legacy proizvode sa `product_id = 0`)
Ovi proizvodi imaju prazan `_related_course` ili `product_id=0` (custom line-item), pa se mapiraju regex-om po nazivu. Prioritet: prvo NAME-mapa, pa isključeni, pa `_related_course`.
- INDIVIDUALNI A1.1–B1.2 → odgovarajući `nemacki-*` video (odluka 2026-06-06: dajemo sadržaj iako WC nije auto-upisivao)
- Paket nivo A1 INDIVIDUALNI → `nemacki-a1-1` + `nemacki-a1-2`
- Kurs za mame i trudnice → `kurs-za-mame-i-trudnice`
- GRUPNI konverzacije 1 & 2 → `kurs-konverzacije`
- GRUPNI „B1.1 + B1.2" → `nemacki-b1-1` + `nemacki-b1-2`; „B2.1 + B2.2" → `nemacki-b2-1` + `nemacki-b2-2`
- KURS U PARU A1.1 → `nemacki-a1-1`; B1.2 → `nemacki-b1-2`
- Premium A2 / Goethe A2 priprema → `nemacki-a2-1` + `nemacki-a2-2`
- Masterclass SPRECHEN i SCHREIBEN B1 → `polozi-goethe-b1` (odluka 2026-06-06)

### Isključeno (ne dobijaju `course_access`, ne pravi se nalog)
- **Free lead-magnet:** „Kako da (na)učiš reči", „Testiranje", „Zašto ti nemački još ne ide"
- **1:1 usluge bez nivoa:** Individualni mesečni paketi, Prevođenje, Izrada biografije, Kreiranje ponude, „📘 Paket KTŽ – Kako ti želiš", goli „INDIVIDUALNI KURS", NH Academy
- **„Obnavljanje" i „Poslednji korak do B2/C1"** (1:1 revizija nivoa — odluka 2026-06-06)
- **Port kasnije (vidi dole):** Deklinacija prideva, Osnove gramatike / Gramatika A1

Mapa se u kodu drži kao: (1) regex-NAME mapa (override + legacy pid=0), (2) regex-EXCL lista, (3) `product_id → [slug]` iz `_related_course`. Svaki proizvod koji ne pogodi nijedno → prijavljuje se kao NEMAPIRANO u izveštaju (ne nagađa se). Finalni dry-run: lista NEMAPIRANO je prazna.

### Port kasnije (zaseban zadatak — NE blokira ovu migraciju)
Sadržaj ne postoji na novom LMS-u; kupci zadržavaju pristup na `old.hartweger.rs` (read-only most) dok WP ne ugasimo.
- **Deklinacija prideva** — 64 aktivnih kupaca → portovati sadržaj pre gašenja WP-a, pa im dodeliti pristup.
- **Osnove gramatike / Gramatika A1** — 23 aktivnih → isto.

## Provereno dry-run-om (2026-06-06, read-only)
Sa kompletnom mapom: **577 korisnika** sa pristupom, **143 nova naloga**, **1472 dodele**, 4 nevalidna mejla, lista NEMAPIRANO prazna. Raspodela po kursu (vrh): a1-1=248, a1-2=232, a2-1=214, a2-2=213, b1-1=194, b1-2=170, gramatika-a2-b1=79, b2-1=25, fsp=24, goethe-b1=22, b2-2=17, goethe-c1=10, fide=9, goethe-b2=8, konverzacije=7. Broj novih naloga (143, ne hiljade) potvrđuje da isključivanje free/usluga radi.

## Šema: dodati `source` na `course_access`

Migracija pred deploy dodaje nullable kolonu radi sigurnog rollback-a:

```sql
ALTER TABLE public.course_access ADD COLUMN IF NOT EXISTS source TEXT;
```

Svi migrirani redovi nose `source = 'wp-migration-2026-06'`. Rollback = jedan `DELETE ... WHERE source='wp-migration-2026-06'` (+ opciono brisanje tako kreiranih naloga).

## Skripta: `scripts/migrate-ld-access.mjs`

Pipeline:

1. **Povuci narudžbine** (WC API, paginirano, filter status + after-datum).
2. **Normalizacija:** email lowercase+trim; nevalidni email (npr. `.con`, bez `@`) → preskoči i zabeleži.
3. **Mapiranje:** za svaku stavku `product_id` → lista sadržajnih slugova (mapa gore). Nepoznat product_id → zabeleži kao „NEMAPIRANO".
4. **Dedup:** po `(email, slug)` zadrži najveći `expires_at` (= max date_paid + 365).
5. **Resolve slug → course.id** iz baze (cache).
6. **Upis (samo uz `--write`):**
   - nađi `user_profiles` po email-u; ako nema → `auth.admin.createUser({email, email_confirm:true})` + upsert `user_profiles {id, email, full_name, role:'student'}` (tiho, bez mejla).
   - `course_access` upsert `{user_id, course_id, expires_at, source:'wp-migration-2026-06'}`, `onConflict: user_id,course_id`, idempotentno.
   - **Pravilo „nikad ne skraćuj":** ako red već postoji, novi `expires_at = MAX(postojeći, kupovina+365)`. Migracija samo produžava, nikad ne oduzima pristup (štiti ranije migrirane korisnike — 1356 course_access / 464 profila). Realizacija: pre upserta pročitaj postojeći expires_at i uzmi veći.

**Podrazumevano `--dry-run`** ispisuje izveštaj:
- ukupno narudžbina obrađeno, preskočeno (refunded/nevalidan email),
- broj jedinstvenih korisnika, koliko bi novih naloga nastalo,
- broj dodela po sadržajnom kursu,
- lista nemapiranih `product_id` (naziv + broj pojava) za potvrdu.

`--write` tek po pregledu dry-run izveštaja.

### Spot-check pre `--write` (obavezno)
Pre masovnog upisa: uzeti 3-4 mejla iz dry-run-a (po jedan video/grupni/individualni/paket) i ručno proveriti na LearnDash-u da imaju te kurseve i da rok grubo odgovara `kupovina+365`. Potvrđuje ceo lanac (mapa, override „individualni→video", pretpostavka 365) protiv stvarnog stanja.

## Idempotentnost i ponovljivost

- Ponovno pokretanje ne pravi duplikate (upsert po `user_id,course_id` i po email-u).
- Bezbedno za fazni pristup (npr. prvo jedan nivo, pa ostali).

## Rizici i mitigacije

| Rizik | Mitigacija |
|---|---|
| Nepoznat/nov proizvod u narudžbinama | Prijavi u izveštaju, ne upisuj dok se ne mapira |
| Dupli/nevalidan email | Normalizacija + preskoči nevalidne uz log |
| Greška u mapi (tiha) | Dry-run izveštaj po kursu + ručna potvrda netrivijalnih |
| Postojeće ranije migracije (course_access/profili) | Idempotentan upsert + pravilo „nikad ne skraćuj" (MAX rok) |
| Pogrešna pretpostavka mape/roka | **Spot-check** 3-4 prava korisnika protiv LearnDash-a pre `--write` |
| Pogrešan masovni upis | `source` tag → rollback jednim DELETE-om |
| WC API rate limit/403 | Pauza 2.5s/strana, retry |

## Van opsega (kasnije)

- Obaveštavanje korisnika mejlom (poslednji korak migracije domena).
- Migracija free lead-magnet kursa.
- Migracija napretka/kvizova (zaseban posao).
- Usluge bez sadržaja (mesečni paketi, prevođenje, biografija).

## Otvorena pitanja

Nema — sve ključne odluke su donete (rok 365, izvor WC API, mapa potvrđena, override za individualne, isključen free/usluge, source tag).
