# Ispitni omotač za 🎯 testove — dizajn

**Datum:** 2026-07-05
**Autor:** Nataša + Claude (brainstorming)
**Status:** Predlog za pregled

## Problem / motivacija

Polaznici su emotivno vezani za staru LearnDash platformu. Hipoteza (Nataša): razlog je što su stari testovi (WPProQuiz) davali **osećaj pravog ispita** — ocenu u procentima, jasan prag prolaza (60%) i „položeno/palo" ishod na **svakom** testu.

Nova Next.js platforma to već ima, ali **samo na završnom Modelltestu**. Obični 🎯 testovi u toku kursa (14–20 po online kursu) daju ⭐ + procenat + srca, ali **bez „položeno/palo" verdikta i praga**. Cilj ovog zahvata: vratiti taj „ispitni" osećaj na sve 🎯 testove, bez diranja ✏️ vežbi.

Materijala ima dovoljno (test-lekcija po objavljenom kursu: A1.1=17, A1.2=14, A2.1=15, A2.2=17, B1.1=17, B1.2=20, B2.1=9, B2.2=2).

## Odluke (potvrđene sa Natašom)

1. **Opseg:** prag + „položeno/palo" **samo na 🎯 testovima**. ✏️ vežbe ostaju „meke" (samo ⭐ + procenat, bez pritiska).
2. **Ponašanje pri padu (soft, opcija C):** pad **ne blokira** sledeću lekciju, ali test-lekcija u napretku ostaje obeležena „⚠️ Nije položeno" dok se ne pređe.
3. **Prag:** uniform **60%** na svim testovima (bez podešavanja po testu za sad).
4. **Brojač na stranici kursa („Položeni testovi: 12/17"):** NE za v1 (možda kasnije).

## Šta je „test" (postojeća logika)

Koristi se već postojeća funkcija `isTestExercise(exerciseTitle, courseTitleOrSlug)` iz `src/lib/exercise-kind.ts`:
- Ako je kurs ispitni (`polož…|fide|fsp|goethe|gramatik`) → sve je test.
- Inače je test ako naslov vežbe liči na ispit (`test|modelltest|prüfung|zwischentest|lesen|hören|schreiben|sprechen|glagoli|modul|vortrag|diskussion`).

Ne uvodimo novo polje u bazi za „test vs vežba" — oslanjamo se na ovu funkciju (jedan izvor istine).

## Rešenje — dve površine

### A) Ekran na kraju testa (`ExerciseRunner.tsx`, i `GroupedExamExercise.tsx` za Lesen/Hören)

Trenutno ovi ekrani već računaju procenat i (za Modelltest) prikazuju pass/fail. Proširujemo pass/fail verdikt na **svaki** zadatak koji je `isTestExercise === true`:

- **Položeno (best ≥ 60%):**
  - Istaknuto „✅ Položeno! **X%**", ispod sitno „Minimum za prolaz: 60%".
  - Zadržati postojeće: ⭐ zvezdice, „Tačnih: n/N", srca, pregled grešaka (✓/✗ + tačan odgovor).
- **Nije položeno (best < 60%):**
  - Istaknuto „❌ Nije položeno — imaš **X%**, treba 60%".
  - Pregled grešaka + istaknuto dugme „Probaj ponovo".
- **Za ✏️ vežbe:** ekran ostaje kao sad (⭐ + procenat, bez pass/fail teksta).
- **Modelltest / završni ispit:** ostaje postojeći tok + sertifikat (ne diramo logiku iz `certificate-check.ts`).

Verdikt se računa iz **najboljeg** pokušaja (kao i sad: `exercise_attempts` sortirano po `score` opadajuće).

### B) Status u listi lekcija kursa

Svaka **test-lekcija** dobija bedž u pregledu lekcija:
- **✅ Položeno** — svaki 🎯 test-zadatak u toj lekciji ima najbolji pokušaj ≥ 60%.
- **⚠️ Nije položeno** — bar jedan 🎯 test-zadatak u lekciji je rađen ali najbolji < 60%.
- **(bez bedža)** — nijedan test-zadatak u lekciji još nije rađen.

Definicija „test-lekcija položeno": lekcija je položena kad su **svi** njeni 🎯 test-zadaci ≥ 60%. Vežbe (✏️) se ignorišu u ovom računu. ⚠️ ostaje dok se ne pređe (nema isteka).

**Boja (Natašin zahtev):** „Položeno" test-lekcija se boji **isto kao već završena lekcija** — koristi postojeći „lesson complete" stil (ista zelena/čekirana oznaka), da lista kursa izgleda ujednačeno „gotovo" za sve položeno. „⚠️ Nije položeno" dobija zaseban stil upozorenja (npr. amber/žuto), jasno različit od „gotovo". Implementacija: ponovo iskoristiti postojeći stil završene lekcije (ne uvoditi novu zelenu), a za ekran na kraju testa isto — „✅ Položeno" u istoj boji kao završena lekcija.

## Pravila i tok podataka

- Prag: 60% (konstanta; predlog: izvući u `src/lib/exercise-kind.ts` ili zaseban `PASS_THRESHOLD = 0.6` da bude jedan izvor).
- Rezultat se čita iz postojeće tabele `exercise_attempts` (`user_id, exercise_id, score, total_questions, completed_at`) — **best score**.
- Neograničeno ponavljanje; čim najbolji ≥ 60% → status prelazi na „Položeno".
- Bez blokade sledeće lekcije.
- Srca (`test_pass` ≥60%, +bonus ≥90%) i sertifikat ostaju netaknuti.
- Dialog vežbe (max 2 pokušaja) su ✏️, ne diraju se.

## Šta se NE dira

- ✏️ vežbe (izgled i ponašanje isti).
- Gamifikacija (srca/nivoi/streak/daily goal).
- Sertifikat logika (`certificate-check.ts`, `/api/certificate`).
- Video/ispitni kursevi — oni su ionako „sve test", pa automatski dobijaju verdikt (proveriti da ne izgleda čudno kad je kurs kratak).

## Rubni slučajevi

- **Test-lekcija sa više zadataka gde su neki vežbe, neki testovi:** za bedž lekcije računaju se samo 🎯 zadaci.
- **Modelltest (Lesen/Hören/Schreiben kao zasebni zadaci):** svaki je test → bedž po istoj logici; sertifikat i dalje ide preko postojeće rute. Proveriti da se „položeno/palo" na pojedinačnom delu ne sudara sa porukom o sertifikatu.
- **Schreiben/esej u okviru testa:** ocenjuje profesorka (`professor_score`); dok nije ocenjen, taj deo nije „položen" → lekcija ostaje bez ✅ dok profesorka ne oceni (isto kao postojeća sertifikat logika).
- **Zadatak bez pitanja / 0 total:** ne prikazivati verdikt (izbeći deljenje nulom).

## Testiranje

- Unit: `isTestExercise` grananje (test vs vežba) i računanje pass/fail na 60% (49% pao, 60% položio, 61% položio).
- Logika bedža lekcije: 1 test <60% → ⚠️; svi testovi ≥60% → ✅; nijedan rađen → bez bedža; mešano test+vežba.
- UI: ekran kraja testa za sva tri slučaja (položeno / palo / vežba); Modelltest tok nepromenjen.
- Regresija: srca za `test_pass` i dalje idu; sertifikat se i dalje izdaje na ≥60% Modelltest.

## Otvorena pitanja (za kasnije, van v1)

- Brojač „Položeni testovi X/Y" na stranici kursa.
- Podesiv prag po testu.
- Prikaz istorije pokušaja polazniku (npr. 55% → 68% → 80%).
