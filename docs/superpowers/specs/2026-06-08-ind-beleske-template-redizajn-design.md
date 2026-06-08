# IND beleške (1:1) — redizajn šablona

**Datum:** 2026-06-08
**Status:** Design / spec za pregled

## Povod

Šablon individualnih beleški (`IND_BELESKE_TEMPLATE_ID = 1e2aP8rWHgS3XtOOblivZua6F8GEmX25R9ZTABH1Bg2g`)
bio je „zagađen" — napravljen kopiranjem pravog popunjenog dokumenta jednog A2.2 polaznika
(Tomislav Jakopanec) bez čišćenja sadržaja. Placeholderi u zaglavlju bili su pregaženi pravim
imenom/podacima, pa je `replaceText` u kodu padao u prazno i **svaka nova kopija nosila je tuđe podatke**
(Ivan Srnić i verovatno još 1:1 polaznika koji su se upisali u tom periodu).

Hitno čišćenje je urađeno (08.06.2026, GAS funkcija `ocistiIndTemplate`, backup polirane verzije sačuvan).
Ovaj spec pokriva **trajni redizajn** šablona da se uskladi sa novim LMS sistemom (Supabase izvor istine),
gde je i sama struktura bila nelogična posle migracije sa starog WooSync/WordPress toka.

## Problemi sa zatečenim šablonom

1. **Mrtva polja u zaglavlju.** Paket / Iskorišćeno / Rok paketa / Ostalo / Status punio je stari
   WooSync iz WooCommerce-a. Novi kod (`kreirajIndBeleske`) puni samo `{{NIVO}}`, `{{PROFESORKA}}`,
   `{{POLAZNIK}}` → ostala polja zauvek prazna ili (gore) zastarela.
2. **`{{EMAIL}}` se zamenjuje u kodu, ali polje ne postoji u šablonu** → zamena bez efekta.
3. **Fiksno 10 termina za sve nivoe**, iako paketi imaju različit broj časova
   (A1=7, A2/B=10, A1 paket=14, FIDE/FSP=5, KTZ mesečni=4/8/12).
4. **Termini nisu navigabilni** — „Termin N" je tekst u ćeliji tabele, ne pojavljuje se u bočnom
   pregledu dokumenta, pa profesorka ne može da klikne i skoči na čas.

## Odluke (potvrđene sa Natašom)

| Pitanje | Odluka |
|---|---|
| Zaglavlje (osnovno) | Polaznik, Email, Profesorka, Nivo/Kurs, **Broj časova**, **Rok** — sve auto-upisano, sve statično |
| Zaglavlje (dodaci) | **Logo** (na svakoj strani), **„Zakaži čas"** (kalendar profesorke, link), **Email profesorke**, **Materijali nivoa** (link ka folderu prezentacija + audio), kratak podsetnik **„Otkazivanje najkasnije 24h ranije"** |
| Sekcije po terminu | Svih 7: TEMA, WORTSCHATZ, REDEMITTEL, FEHLER, GRAMMATIK, HAUSAUFGABE, LOB |
| Broj termina | **Tačno koliko paket ima** (sistem generiše) |
| Termin = naslov | „Termin Nr. X — Datum: …" je **Heading** (van tabele) → vidi se u bočnom meniju, klik = skok |
| TEMA sadržaj | Prazno (profesorka upisuje temu po času; per-nivo plan lekcija = posebna, kasnija stvar) |
| KTZ produžetak | Nova kupovina = **nov dokument** (bez dopisivanja u postojeći) |
| Postojeći pogođeni docovi | **NE diraju se** (Natašina odluka) — radimo samo za buduće kupovine |

## Dizajn gotovog dokumenta

```
            [LOGO HARTWEGER]                   (page-header, na svakoj strani)

            BELEŠKE SA ČASOVA                 (naslov)
┌─────────────────────────────────────────┐
│ Polaznik:   {{POLAZNIK}}                  │
│ Email:      {{EMAIL}}                     │   ← zaglavlje (tabela), auto-upisano
│ Profesorka: {{PROFESORKA}}                │
│ Nivo/Kurs:  {{NIVO}}                      │
│ Paket:      {{BROJ_CASOVA}} časova        │
│ Rok:        {{ROK}}                       │
│ Profesorka (email): {{PROF_EMAIL}}        │
│ ▶ Zakaži čas: {{KALENDAR}}  (link)        │
│ ▶ Materijali: {{MATERIJALI}}  (folder)    │
└─────────────────────────────────────────┘
  Otkazivanje časa najkasnije 24h ranije.    (kratak podsetnik)

Termin Nr. 1 — Datum: ________              (Heading 2 — navigabilno)
   TEMA          …
   WORTSCHATZ    novi vokabular sa prevodom
   REDEMITTEL    korisne fraze i izrazi
   FEHLER        greške i ispravke
   GRAMMATIK     gramatika
   HAUSAUFGABE   domaći zadatak
   LOB           pohvala

Termin Nr. 2 — Datum: ________
   … (istih 7 sekcija)

   ⋮  (ukupno N termina = broj časova paketa)

┌─────────────────────────────────────────┐
│ Tvoj napredak nam je važan… [Klikni ovde] │   ← anketa (ostaje nepromenjena)
└─────────────────────────────────────────┘
```

## Broj termina po paketu (N)

N dolazi iz `package_lessons` (sajt ga već zna), pa kod ne pamti tabelu — radi jednoobrazno za sve:

| Paket | N |
|---|---|
| A1.1 / A1.2 | 7 |
| A2.x / B1.x / B2.x | 10 |
| A1 paket (ceo nivo) | 14 |
| FIDE / FSP | 5 |
| KTZ mesečni | 4 / 8 / 12 |

**Fallback:** ako `casova` nije prosleđen ili je 0, kod koristi rezervnu mapu po nivou
(A1→7, A2/B→10, FIDE/FSP→5, default 10) da nikad ne generiše 0 termina.

## Šta se menja (tri tačke)

### 1. Master šablon (Google Doc `1e2aP8…`)
Prepravlja se na: **logo u page-headeru** (na svakoj strani) + naslov + zaglavlje (placeholderi
`{{POLAZNIK}}`, `{{EMAIL}}`, `{{PROFESORKA}}`, `{{NIVO}}`, `{{BROJ_CASOVA}}`, `{{ROK}}`,
`{{PROF_EMAIL}}`, `{{KALENDAR}}`, `{{MATERIJALI}}`) + statičan red „Otkazivanje časa najkasnije 24h ranije" +
**jedan „uzorak" termina** (Heading „Termin Nr. {{N}} — Datum: " + 7 sekcija, prazne) + anketa na dnu.
Uzorak je obeležen markerom (npr. `{{TERMIN_UZORAK}}`) da ga kod nađe, kopira N puta i ukloni original.
Fiksnih 10 termina se uklanja.
Logo se ubacuje jednom (UrlFetchApp `https://kurs.hartweger.rs/logo.jpg` → `header.appendImage`),
pa ga sve kopije naslede.

### 2. GAS kod — `kreirajIndBeleske(p, prof)` u `automatizacija/grupni-webapp/Code.gs`
- `replaceText` za zaglavlje uključuje i **`{{BROJ_CASOVA}}`**, **`{{ROK}}`**, **`{{PROF_EMAIL}}`**, **`{{KALENDAR}}`**, **`{{MATERIJALI}}`**
  (uz postojeće NIVO/PROFESORKA/POLAZNIK/EMAIL). Ako `calendarUrl` nije prosleđen → ukloni „Zakaži čas" red.
- **`{{MATERIJALI}}`** iz mape nivo→folder u GAS-u (`MATERIJALI_FOLDERI`): A1.1, A1.2, A2.1, A2.2, B1.1, B1.2, B2.1/B2.2.
  Ako nivo nije u mapi (FIDE/FSP/KTZ/nepoznato) → ukloni „Materijali" red. Folder linkovi su već „svako sa linkom → View".
- Pročita N (`p.casova`, uz fallback mapu) → **klonira uzorak-termin N puta**, numeriše „Termin Nr. 1…N"
  kao Heading, ukloni uzorak.
- `enrollIndividual(p)` prima nova polja `casova`, `rok`, `calendarUrl`, `profEmail`.

### 3. Sajt — `grant-access.ts` (individualna grana, ~red 131)
Poziv `callGas("enrollIndividual", …)` dobija još (sve već dostupno u toj funkciji):
- `casova: pkgLessons ?? 0`
- `rok`: `expEnroll` formatiran kao `dd.MM.yyyy.` (uplata + 3 meseca)
- `calendarUrl: calendarUrl` (već se čita iz `user_profiles`)
- `profEmail: profEmail` (već se čita iz `user_profiles`)

## Operativni dovršetak (posle redizajna)

- **Postojeći pogođeni dokumenti se NE diraju** (Natašina odluka 08.06) — Ivan i ostali zatečeni docovi
  ostaju kakvi jesu; redizajn važi samo za **buduće kupovine**.
- **Čišćenje** — ukloniti privremene `Cleanup.gs` i `DeliPrezentacije.gs` i `executionApi` iz manifesta
  sa produkcionog GAS projekta posle završetka.

## Van opsega (zasebne stvari ako se zatraže)

- Per-nivo unapred upisan **plan lekcija** u TEMA (npr. standardne teme A2.2 po času).
- **Grupni** šablon beleški (`GRUPNI_BELESKE_TEMPLATE_ID`) — nije menjan ovim specom (proveriti zasebno da li je i on zagađen).
- Dopisivanje termina u isti dokument pri KTZ produžetku.

## Mapa nivo → folder materijala (`MATERIJALI_FOLDERI` u GAS-u)

| Nivo | Folder ID |
|---|---|
| A1.1 | `1l9SHwl2kubXOIPVpmb8MCygTSRwP5rBv` |
| A1.2 | `1vta6XgeCPAtC-Or-coZnmwUhpvi8bfH6` |
| A2.1 | `1-StmUTFmYLnTrCHwHIO4oD37V8TOnMZ-` |
| A2.2 | `1oCC0lFLA2_6ucYOOimqzwg1s9SdiTuHe` |
| B1.1 | `12PVjryRusOtYg1JCrlynk-ZzYQNYQK8r` |
| B1.2 | `1h_dgK2kzxheQj3NciJONVRni1o1LQ8u0` |
| B2.1 / B2.2 | `1UPIs9QiCRtl69uEOcItCld-tH9yf5KC9` (zajednički B2 folder) |

Link format: `https://drive.google.com/drive/folders/<id>`. „Audio uz ppt" (`1XQob1CRTYv6QND5cCkxYyKuDFtyhbW37`)
je zajednički — opciono dodati kao drugi link ili ostaviti unutar nadfoldera (već deljen).

## Testiranje

- E2E: simulirati `enrollIndividual` za po jedan slučaj iz svake grupe N (7/10/14/5 i KTZ 4/8/12) → proveriti da doc
  ima tačan broj numerisanih Heading termina, popunjeno zaglavlje, prazne sekcije, sačuvanu anketu.
- Navigacija: potvrditi da se „Termin Nr. X" pojavljuje u Google Docs pregledu dokumenta (bočni meni).
- Regresija: stari grupni tok (`kreirajBeleske`) i `enroll` netaknuti.
