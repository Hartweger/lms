# Migracija video/specijalnih kurseva sa WP-a → novi LMS

**Datum:** 2026-06-02
**Status:** Odobren dizajn, čeka plan implementacije

## Cilj

Prebaciti sadržaj 5 kurseva sa starog WordPress/LearnDash (hartweger.rs) na novi LMS
(kurs.hartweger.rs). Trenutno su to **prazni skeleti** — lekcije postoje kao zapisi,
ali im je `sections` prazan, a vežbe ne postoje.

## Obim

| Novi LMS slug | WP course id | Lekcija (sad) | Kvizova | Pitanja |
|---|---|---|---|---|
| `fsp` | 40305 | 27 | 19 | 23 |
| `polozi-fide` | 45501 | 23 | 12 | 12 |
| `gramatika-a2-b1` | 47790 | 4 | 1 | 1 |
| `polozi-goethe-b1` | 31516 | 2 | 3 | 5 |
| `polozi-goethe-b2` | 31515 | 0 (kreirati) | 3 | 3 |

Ukupno ~44 pitanja kroz svih 5 kurseva.

## Odluke (potvrđene sa korisnikom)

- **Sva 5 kurseva.**
- **Pun sadržaj** tema: tekst, tabele, Vimeo video, PDF, slike → `sections`.
- **Teme spojene pod lekciju**: WP lekcija = postojeća lekcija u novom LMS-u;
  sve njene WP teme postaju sekcije unutar te lekcije.
- **Kvizovi se prenose**: ekstrakcija sadržaja pitanja → rekreiranje vežbi u novom
  exercise engine-u.

## Izvori podataka (WP REST API)

- Hijerarhija: `GET /wp-json/ldlms/v2/sfwd-courses/{id}/steps`
  → `{"h":{"sfwd-lessons":{lessonId:{"sfwd-topic":{topicId:{"sfwd-quiz":[...]}}, "sfwd-quiz":{...}}}}}`
- Tema: `GET /sfwd-topic/{id}` → `content.rendered` (HTML)
- Lekcija (često prazna, samo kontejner): `GET /sfwd-lessons/{id}`
- Pitanja kviza: `GET /sfwd-question?quiz={quizId}&per_page=100`
  → polja `question_type`, `answers[]` (`_answer`, `_correct`, `_points`),
  `correct_message`, `incorrect_message`, `content.rendered`
- Auth: Basic Auth (`Nati:<app-password>` iz reference memorije)

## Ciljni format

### Sekcije lekcije (`lessons.sections` JSONB)
Tipovi i šeme iz `src/lib/section-types.ts`:
- `{type:"badge", module}` — na početku, naziv WP lekcije
- `{type:"video", vimeoId}`
- `{type:"text", content /* markdown */, style?}`
- `{type:"table", headers[], rows[][]}`
- `{type:"pdf", url, label?}`
- `{type:"image", url, alt, caption?}`

Plus `lessons.vimeo_video_id` ako lekcija ima tačno 1 video.

### Vežbe (`exercises` + `exercise_questions`)
- `exercises(lesson_id, title, exercise_type, order_index)`,
  `exercise_type ∈ {quiz, fill_blank, match_pairs, word_order, listen_write}`
- `exercise_questions(exercise_id, question, options JSONB, correct_answer, explanation, question_type, order_index)`
  - `options` format: `{type, items}` (po uzoru na postojeće `import-a21-tests.ts`)

### Mapiranje tipova
| LearnDash | Novi tip | Napomena |
|---|---|---|
| `cloze_answer` | `fill_blank` | multi-gap (1., 2., 3…) → jedna vežba sa više `items`; tačan odgovor iz `{…}` |
| `matrix_sort_answer` | `match_pairs` | parovi de↔sr |
| `essay` | `essay` | bez auto-ocenjivanja (migracija 029) |

## Arhitektura — dvofazno sa review tačkom

Razlog za dve faze: cloze HTML je prljav i raznolik; ljudski pregled pre upisa
sprečava da smeće uđe u bazu.

### Faza 1 — Ekstrakcija
`scripts/extract-wp-course.ts <slug>`
- Povuče steps → tema HTML → pitanja kvizova
- HTML → sekcije (parser)
- Pitanja → mapirane vežbe (best-effort)
- Piše **međufajl** `scripts/wp-content/<slug>.json` (čitljiv, editabilan)
- Piše `scripts/wp-content/<slug>.review.md` — flaguje sumnjivo
  (multi-gap cloze, prljav HTML, essay, neuparene teme)

### Review tačka
Ručni pregled JSON-a; doterivanje problematičnih vežbi/prevoda.

### Faza 2 — Primena
`scripts/apply-wp-course.ts <slug>`
- Čita JSON
- Match WP lekcija → LMS lekcija **po naslovu** (fallback `order_index`);
  za `polozi-goethe-b2` kreira lekcije
- Upisuje `lessons.sections`/`vimeo_video_id` + `exercises`/`exercise_questions`
- **Idempotentno**: re-run briše i prepisuje vežbe/sekcije tog kursa

## Parser pravila (HTML → sekcije)

- Vimeo iframe/link (`player.vimeo.com/video/{id}`, `vimeo.com/{id}`) → `video`
- PDF embed (`wppdfemb`, izvuci pravi `…/uploads/….pdf` iz `?url=`) → `pdf`
- `<table>` → `table` (headers iz `<th>`, redovi iz `<tr><td>`)
- `<img src>` → `image` (zadržava WP URL)
- `<h2>/<h3>/<p>/<ul>/<ol>/<strong>` → `text` (konverzija u markdown)
- Čisti `&nbsp;`, prazne `<p>`, page-builder smeće

## Granice / YAGNI

- **Slike i PDF-ovi**: zadržavaju se WP URL-ovi (javni, rade) — bez migracije u
  Supabase Storage u ovoj fazi.
- Bez diranja `course_unlocks`, cena, checkout-a, marketing kolona.
- Essay vežbe: prenose se kao prompt; bez auto-ocenjivanja.

## Rizici i verifikacija

- **Vimeo whitelist** (domain-lock): potvrda da video radi na kurs.hartweger.rs
  na jednoj lekciji pre masovnog upisa. (Postojeći migrirani kursevi rade → verovatno OK.)
- **Prljav cloze HTML**: rešava review tačka.
- **Match lekcija po naslovu**: ako se naslovi razlikuju, fallback na `order_index`;
  review.md prijavljuje neuparene.
- Redosled rada: prvo mali kursevi (Gramatika, Goethe B1/B2) kao proba parsera,
  pa FSP/FIDE.

## Deploy

Skripte menjaju samo podatke (Supabase service-role). Bez DDL-a — sve tabele
(`exercises`, `exercise_questions`, `lessons.sections`) već postoje.
Posle primene: smoke provera lekcije na produkciji.
