# Vežba "Milioner" - dizajn

Datum: 18.07.2026.
Status: čeka odobrenje speca

## Šta pravimo

Novi tip vežbe u LMS-u: kviz igra u stilu "Ko želi da postane milioner". Polaznik odgovara na 15 pitanja rastuće težine sa po 4 ponuđena odgovora; tačan odgovor ga penje uz lestvicu poena, pogrešan završava igru. Igra služi kao završno ponavljanje gradiva modula.

## Odluke (dogovoreno sa Natašom)

- **Koncept:** novi `exercise_type: "millionaire"`, sa sopstvenim setom pitanja (ne recikliranje postojećih kviz pitanja).
- **Frekvencija:** jednom po modulu, kao poslednja vežba pred modularni test - završno ponavljanje celog modula.
- **Napredak:** vežba se vodi kao završena čim se igra odigra do kraja ili polaznik ispadne, bez obzira na rezultat. Može se igrati neograničeno.
- **Džokeri:** 50:50 (sklanja dva pogrešna odgovora) i "Zameni pitanje" (vuče rezervno pitanje). Svaki jednom po igri. Bez AI džokera za sada.
- **Lestvica:** poeni, 100 do 1.000.000, sa sigurnim stepenicima na 5. i 10. pitanju. Bez asocijacije na pravi novac.
- **Nagrada:** završena igra = normalan progres; osvojen "milion" (tačno svih 15) nosi posebnu nagradu kroz postojeći hearts/meda sistem (`src/lib/hearts/`).
- **Pitanja:** Claude priprema predlog ~20 pitanja po modulu (15 + rezerve), Nataša pregleda i odobrava pre ubacivanja.
- **Pilot:** A1.1, prvi modul. Ostali moduli se pune tek posle pregleda pilota.

## Arhitektura

### Podaci - bez novih tabela

Pitanja idu u postojeću `exercise_questions` tabelu kao standardna kviz pitanja (pitanje, 4 opcije, `correct_answer`, opciono `explanation`). `order_index` određuje težinu: 1 najlakše, 15 najteže; pitanja sa `order_index` > 15 su rezerva za džoker "Zameni pitanje" (bira se rezerva najbliža trenutnom nivou).

Proveriti da li na `exercises.exercise_type` postoji check constraint u bazi; ako postoji, mala migracija da se doda `millionaire`.

### Nove/izmenjene komponente

1. **`src/components/exercises/MillionaireExercise.tsx`** (novo) - cela igra:
   - lestvica 15 suma sa strane (na mobilnom sažeta u traku "pitanje X od 15 / trenutni poeni"),
   - pitanje + 4 odgovora A/B/C/D, potvrda odgovora ("Konačan odgovor?"),
   - animacija penjanja / pada na sigurni stepenik,
   - dva džokera (50:50, Zameni pitanje), svaki jednom po igri,
   - dugme "Odustani i nosi osvojeno" (završava igru sa trenutnim poenima),
   - bez tajmera,
   - ekran kraja igre: osvojeni poeni, dugme "Igraj ponovo".
2. **`src/components/exercises/ExerciseRunner.tsx`** - nova grana za `millionaire` (po uzoru na postojeće grane za `dialog`, `speak`, `sprechen`).
3. **`src/lib/types.ts`** - `"millionaire"` u `ExerciseType` uniju.
4. **`src/app/admin/vezbe/[lessonId]/page.tsx`** - "Milioner" u listi tipova; forma za pitanja ista kao za `quiz` (nema nove admin forme).

### Tok podataka

- Učitavanje pitanja: postojeći mehanizam ExerciseRunner-a (pitanja po `exercise_id`, sortirana po `order_index`).
- Snimanje rezultata: postojeći mehanizam pokušaja - procenat = broj tačno odgovorenih od 15; `completed` se upisuje pri prvom završetku igre (pad, odustajanje ili milion), i ne skida se kasnijim slabijim pokušajima.
- Nagrada za milion: poziv postojećeg hearts award mehanizma (`applyAward` u `src/lib/hearts/award.ts`) sa posebnim event-om; tačan oblik integracije se utvrđuje u planu implementacije.

### Obrada grešaka

- Manje od 15 pitanja u vežbi: igra se igra do poslednjeg dostupnog pitanja, "milion" je poslednje pitanje (da poluprazna vežba ne pukne).
- Nema rezervnih pitanja: džoker "Zameni pitanje" je onemogućen (siva ikonica sa objašnjenjem).
- Prekid mreže pri snimanju: isti retry/saveFailed obrazac kao kod ostalih vežbi (naučeno na dialog vežbama).

## Testiranje

- Unit testovi logike igre (čista funkcija stanja: tačan/pogrešan odgovor, sigurni stepenici, džokeri, odustajanje) - odvojiti logiku od komponente u `src/lib/millionaire.ts` da bude testabilna.
- Ručni smoke test na pilotu: cela igra do miliona, ispadanje na raznim nivoima, oba džokera, mobilni prikaz, snimanje progresa, meda nagrada.

## Van obima (za kasnije, ako se igra primi)

- AI džoker "Pitaj NaKI-ja"
- zvukovi i muzika
- rang-lista među polaznicima
- mod koji reciklira postojeća kviz pitanja iz lekcija
- punjenje ostalih modula pitanjima (posle pregleda pilota)
