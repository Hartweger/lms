# Ujednačavanje kurseva — ispitni sadržaj + jedinstvena forma (A1 → B2)

**Datum:** 2026-06-08
**Status:** Design / spec za pregled

## Cilj

Svih 8 glavnih samostalnih (video) kurseva — **Nemački A1.1, A1.2, A2.1, A2.2, B1.1, B1.2, B2.1, B2.2** — svesti na **jednu jedinstvenu formu** tako da:

1. Svaki **`.2` kurs** (završetak nivoa) ima pun **Prüfungstraining Modelltest** sa svim Goethe Teil-ovima za sva 4 modula (Lesen, Hören, Schreiben, Sprechen).
2. Svaki **modul svakog kursa** ima **dijalog sa srpskim prevodom** (na klik).
3. Tipovi vežbi se **ujednače** (isti tip zadatka = isti `exercise_type` svuda), da AI-pregled i profesorski pregled rade konzistentno.
4. Nazivi vežbi se **ujednače**, da se u marketingu može jednoznačno reći šta svaki kurs sadrži.

Grupni i individualni kursevi dele isti sadržaj sa video kursevima, pa su automatski pokriveni.

## Trenutno stanje (audit 2026-06-08)

| Kurs | Lekcija | Lesen | Hören | Schreiben | Tip Schreiben-a | Dijalozi |
|------|:---:|:---:|:---:|:---:|---|:---:|
| A1.1 | 44 | ❌ | ❌ | ❌ | — | 5 |
| A1.2 | 37 | ✅ | ✅ | ✅ T1+2 | quiz/listen_write | 0 |
| A2.1 | 33 | ❌ | ⚠️ neoznačen | ✅ T1+2 | quiz | 0 |
| A2.2 | 43 | ✅ | ✅ | ✅ T1+2 | quiz/listen_write | 0 |
| B1.1 | 29 | ❌ | ❌ | ✅ 3 + Modelltest | typing | 0 |
| B1.2 | 34 | ❌ | ❌ | ✅ T1+2+3 | essay ✓ | 0 |
| B2.1 | 31 | ✅ (1) | ❌ | ✅ T1 (fali T2) | essay ✓ | 0 |
| B2.2 | 8* | ❌ | ❌ | ✅ T1 | essay ✓ | 0 |

\* B2.2 još u izradi (nije objavljen).

**Tri problema:** (1) rupe u pokrivenosti, (2) isti tip zadatka čuvan na 3 različita načina (`essay`/`typing`/`quiz`), (3) raznoliki nazivi pa je nemoguće jednoznačno komunicirati sadržaj.

## Jedinstvena forma

### Struktura kursa

**`.1` kursevi (A1.1, A2.1, B1.1, B2.1)** — polovina nivoa:
- Zadržavaju postojeće gramatičke / modulske testove koji prate udžbenik.
- **NOVO:** dijalog (de + sr prevod) u svakom modulu.
- **NOVO:** ispitne mini-vežbe **razbacane po modulima** (Teil-ovi iz Modelltesta), rotacija Lesen → Hören → Schreiben → Sprechen, težina raste kroz kurs.
- Gde već postoji Schreiben (A2.1, B1.1) — normalizuje se tip, sadržaj se ne dira.

**`.2` kursevi (A1.2, A2.2, B1.2, B2.2)** — završetak nivoa:
- **NOVO:** dijalog (de + sr prevod) u svakom modulu.
- **NOVO:** ispitne mini-vežbe razbacane po modulima (kao kod `.1`).
- **Završni modul „Prüfungstraining / Ispitni trening"** = JEDAN kompletan Modelltest netaknut (prava simulacija), svi Teil-ovi nivoa:

| Nivo (.2) | Lesen | Hören | Schreiben | Sprechen |
|------|:---:|:---:|:---:|:---:|
| A1 | Teil 1–3 | Teil 1–3 | Teil 1–2 | Teil 1–3 |
| A2 | Teil 1–4 | Teil 1–4 | Teil 1–2 | Teil 1–3 |
| B1 | Teil 1–5 | Teil 1–4 | Teil 1–3 | Teil 1–3 |
| B2 | Teil 1–5 | Teil 1–4 | Teil 1–2 | Teil 1–3 |

### Standard čuvanja (`exercise_type`)

| Goethe modul | `exercise_type` | Napomena |
|---|---|---|
| Schreiben | `essay` | AI feedback + profesorski pregled |
| Hören | `listen_write` | audio (`audio_url`) + razumevanje |
| Lesen | `quiz` | + `text` sekcija u lekciji sa tekstom za čitanje |
| Sprechen | `speak` / `sprechen` | preko Web Speech API |
| Dijalog | `dialog` | nemački + srpski prevod (fiksni) |

### Ujednačeni nazivi

- `Lesen — Teil N`, `Hören — Teil N`, `Schreiben — Teil N`, `Sprechen — Teil N`
- `Test — Modul N` (modulski testovi)
- `Dijalog — [tema]`

### Formatiranje i prikaz (eksplicitan zadatak)

Nije dovoljno da sadržaj „uđe" — svaki Teil mora da izgleda **čisto, jasno i uredno**:
- `badge` sekcija (modul + kategorija) na vrhu.
- `text` (style `info`) sa uputstvom i `Arbeitszeit` (vremenom) — tačno kao u ispitu.
- Lesen/Hören tekst u **čitljivim blokovima** (osobe/odlomci razdvojeni), ne zid teksta.
- Pitanja numerisana (Beispiel + 1..N), opcije jasno označene (a/b/c/d, richtig/falsch…).
- Hören: audio plejer iznad pitanja.
- **Doslovna ekstrakcija:** tekst iz PDF-a se prenosi identično; OCR-ukrasne napomene
  („Sehen Sie sich den Test kurz an…") i artefakti se čiste jer nisu deo ispita.
- Tačni odgovori isključivo iz `Lösungen` ključa — ništa se ne pogađa.

Odobreni uzorak formata: `LMS/ispit-materijali/UZORAK-FORMAT-b2-modelltest1.json`.

## Pravila za sadržaj

- **Ispitni sadržaj (Lesen/Hören/Schreiben/Sprechen):** ČEKA autentične materijale od Nataše. Ništa se ne izmišlja AI-jem. Goethe-format tekstovi i audio dolaze iz njenih PDF-ova/snimaka.
- **Dijalozi:** po ustaljenom pravilu — dijalog je **AI-generisan**, a **prevod su fiksne rečenice u bazi** (vidi `src/lib/fixed-translations.ts`, `src/lib/types.ts` `dialog` tip). Dijalozi NE čekaju materijale.
- Prevodi/dijalozi na svim nivoima A1→B2 (i na B2 dijalog ima srpski prevod na klik kao pomoć).

### Izvori materijala (po nivou: 2+ kompletna Modelltesta)

Princip: **jedan kompletan Modelltest ostaje netaknut kao finale**, ostali se iseckaju i razbacaju po modulima.

| Nivo | Materijali (Google Drive) | Status |
|---|---|---|
| B1 | Modelltest 4 (PDF + 4× Hören mp3 + Lösungen) → razbacati po modulima; Modelltest 5 (PDF + 4× Hören mp3 + Lösungen) → finale | ✅ dobijeno |
| B2 | Isti princip (Modelltest PDF + Hören mp3 + ključ) | ⏳ čeka |
| A1, A2 | A1.2/A2.2 već imaju Lesen/Hören/Schreiben; dopuna po istom principu | delimično |

Audio (mp3) se kači na Supabase Storage; `audio_url` u `exercise_questions`. Lesen tekst i ključ iz PDF/`Lösungen.docx`.

## Pristup implementacije (izabrano: A)

**A. Standardni „Ispitni modul" + idempotentne skripte** — definiše se kanonična forma, prvo se migriraju postojeće nekonzistentne vežbe, pa se sadržaj ubacuje skriptama kako materijali stižu. Dijalozi se kotrljaju paralelno. Brzo, ponovljivo, proverljivo.

Odbačeno: (B) ručno kroz admin — sporo, lako stvara novu nejednakost; (C) sve AI odmah — krši pravilo da čekamo prave materijale.

## Fazni plan

### Faza 1 — ODMAH (bezbedno, ne treba sadržaj)
Migracija/normalizacija tipova na standard:
- Schreiben vežbe (sada `typing`/`quiz`) → `essay`, uz proveru da pitanja/struktura ostanu ispravni.
- Hören vežbe → `listen_write` (gde već nisu).
- Lesen vežbe → `quiz` + `text` sekcija.
- Preimenovanje u ujednačene nazive (`… — Teil N`).
- Idempotentno (dry-run default, `--apply`), povratno; smoke test posle.

### Faza 2 — dijalozi
- Napravi se **jedan uzorak dijaloga** (de + sr prevod) za jedan modul → Nataša odobrava stil.
- Posle odobrenja: masovni rollout dijaloga u sve module svih 8 kurseva (AI dijalog + fiksni prevod).

### Faza 3 — ispitni sadržaj (kako stižu materijali)
- Ubacivanje autentičnih Lesen/Hören/Schreiben/Sprechen u Prüfungstraining modul `.2` kurseva.
- Po nivou, kako Nataša šalje materijale; svaki ubačaj prati gap-mapa iz ovog dokumenta.

## Šta NIJE u opsegu (YAGNI)

- Ispitni kursevi (Položi Goethe B1/B2/C1, FIDE, FSP) — to je već druga forma.
- Grupni/individualni kursevi kao zaseban posao — dele sadržaj sa video kursevima.
- Promene UI/rendera lekcija — koristi se postojeća `Section`/`Exercise` infrastruktura.
- Sprechen automatsko ocenjivanje — koristi se postojeći speak mehanizam.

## Otvorena pitanja / rizici

- Migracija `quiz` → `essay`: treba proveriti da Schreiben vežbe sačuvane kao `quiz` nemaju „tačan odgovor" logiku koja bi se izgubila (esej nema jedan tačan odgovor). Pre `--apply` proveriti svaku.
- Količina dijaloga (~40 modula × 8 kurseva) — masovni AI rollout tek posle odobrenog uzorka.
- B2.2 nedovršen (8 lekcija) — Prüfungstraining se radi kad kurs bude bliži objavi.
