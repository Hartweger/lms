# Vielfalt B2.2 — Lektion 13 na novom LMS-u (nemacki-b2-2)

**Datum:** 2026-06-03
**Cilj:** Konvertovati već pripremljene materijale za Lektion 13 („Auf zwei Rädern", Modul 5) u
sadržaj novog LMS-a. Ovo je etalon za ostale lekcije Vielfalt B2.2.

## Kontekst i izvori

Izvor istine je Natašina priprema u `LMS/nastava/B2/`:
- `platform-struktura-lektion13.md` — podela na 4 platform-lekcije + Abschlusstest (PRIJE/TOKOM/POSLIJE časa)
- `vokabular-lektion13.md` — Wortschatz tabele (Deutsch · Prevod · Beispielsatz)
- `quizzes/*.xml` — LearnDash WpProQuiz kvizovi (L13_01–04 + abschlusstest)
- `quizzes/RUCNO_KREIRATI_cloze.md` — cloze pitanja (Online-Umfrage, Selbstkontrolle)
- `videos/*.mp4` — protagonisti (Sophia Ofuso, Sebastian Langer, Andre Wyss) + L13 Beispielantwort
- `youtube-resursi-modul5-6.md` — YouTube dopuna
- Knjiga: `Vielfalt B2.2 (1).pdf` (Lesetextovi, infografike) — za sadržaj sekcija

**„ČAS / govor" deo iz prep doca NE ide na platformu** (Kugellager, diskusija Parkplätze/Radwege,
Redemittel uvežbavanje uživo) — to je nastavnikov materijal za čas.

Videi su već na Vimeu (uvezeni iz starog WP-a): `1193940443`, `1193940548`, `1193940558`
(einstieg/protagonisti) + `1193940567` (L13). Pri implementaciji proveriti tačno mapiranje
ID→protagonista.

## Mapiranje: Lektion 13 → 5 lekcija u `nemacki-b2-2`

| order | Lekcija (naslov) | category | video | Sadržaj |
|------:|------------------|----------|-------|---------|
| 0 | L13 · Einstieg + Hörverstehen | hoeren | 3 protagonista + L13 Beispielantwort | uvod modula (SR), Infografik Mobilität (4 trenda), kvizovi: protagonisti, Matrix trends, R/F „Sophias Bamboorad", YouTube dopuna |
| 1 | L13 · Wortschatz + Wortbildung | wortschatz | — | Wortfeld Mobilität, Wortfeld Unternehmensgründung, Nomen mit *Un-*, Komposita-Betonung |
| 2 | L13 · Grammatik | grammatik | — | Adjektive mit fester Präposition, Relativsätze *wer/wen/wem* |
| 3 | L13 · Schreiben + Extra Beruf | schreiben | — | Kundenanfrage: Mustertext, struktura, formalni izrazi, Schreibaufgabe |
| 4 | L13 · Abschlusstest | grammatik | — | 25 pitanja (4 sekcije), prag 70% |

Postojeće WP-lekcije `nemacki-b2-2`: „Was verbinden Sie mit Stadt" (3 videa) i „Die neue Liebe
zum Fahrrad" (1 video) **stapaju se** u order 0 (L13.1). Ispitni modeltestovi (Lese/Hör/Schreiben)
ostaju, pomereni iza Lektion-sadržaja (Modelltest 1 sređujemo u zasebnom prolazu).

## Konverzija kviz-tipova (LearnDash → LMS)

| LearnDash | LMS `question_type` | `options` oblik | `correct_answer` |
|-----------|--------------------|------------------|------------------|
| Single Choice | `quiz` | `{type:"quiz", items:["a","b","c"]}` | indeks tačnog (`"0"`) |
| Richtig/Falsch | `true_false` | `null` ili `{type:"true_false"}` | `"true"` / `"false"` |
| Multiple Choice (više tačnih) | `categorize` | `{type:"categorize", items:{categories:["passt","passt nicht"], items:[{text,category}]}}` | — |
| Fill in the Blank / cloze | `fill_blank` | `{type:"fill_blank", items:[…opc. banka reči]}` | reč; više praznina → `"a, b, c"` |
| Matrix Sorting (Zuordnung) | `match_pairs` | `{type:"match_pairs", items:[{de,sr}]}` | — |
| Sorting (redosled) | `word_order` | `{type:"word_order", items:["…"]}` | tačna rečenica/niz |
| Sorting (kategorije, *Un-*) | `categorize` | kao gore, N kategorija | — |
| Essay | exercise_type `essay` | — | — (nastavnik ocenjuje) |

**Odluka:** LMS nema višestruki-izbor kviz (QuizExercise prima jedan indeks). Multi-correct MC
(„Welche zwei Wörter passen?") → `categorize` sa dve kategorije *passt / passt nicht*. Pedagoški
ekvivalentno, učenica sortira ponuđene reči.

## Format sekcija (kao B1.2)

Svaka lekcija = `sections: Section[]` (tipovi iz `src/lib/section-types.ts`):
`badge` → `video?` → `text`(style info/default/uebung/beispiele) → `table`/`vocabulary` →
`youtube`/`link`. Vežbe se upisuju zasebno u `exercises` + `exercise_questions`.

Stil (po memoriji): ekavica, bez ćirilice, „ti" forma, tabele zaglavlje „Prevod",
komunikativni kvizovi, bez gramatičkih termina u zadacima gde nije nužno.

## Implementacija

- `scripts/b22-lektion13-data.ts` — JEDINSTVENI IZVOR (lekcije: naslov, order, vimeoId, sections, exercises).
  Vežbe se prepisuju iz `quizzes/*.xml` + `RUCNO_KREIRATI_cloze.md` u TS strukturu (pregledno, jedan izvor).
- `scripts/build-b22-lektion13.mjs` — dry-run podrazumevano; `--apply`. Idempotentno: upsert lekcija
  po `order`/naslovu u `nemacki-b2-2`, briše i ponovo upisuje vežbe lekcije pri svakom apply.
- Verifikacija: posle apply prebroj lekcije/sekcije/vežbe i ručno otvori jednu lekciju.

## Van obima (zasebni prolazi)

- Modelltest 1 B2 (sve veštine) iz `Modelltest 1/` (PDF + 5 mp3 + Lösungen)
- Lektion 14 (Grün in der Stadt) i 15 (Ohren auf!) — autorisanje iz knjige u istom formatu
- Audio za Hörverstehen (ako se hostuje) i objavljivanje kursa (`is_published`)
