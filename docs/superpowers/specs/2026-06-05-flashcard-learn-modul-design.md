# Flashcard „Learn" modul — dizajn

**Datum:** 2026-06-05
**Status:** Dizajn odobren, čeka spec review → plan
**Kontekst:** LMS (kurs.hartweger.rs), grana `feat/wp-migration`

## Cilj

Polaznik nad postojećim setom kartica (`{front, back}`) može da uči kroz **više tipova vežbi sa praćenjem napretka po kartici** — kao Quizlet „Learn" mod. Adaptivno: vodi kroz runde od lakšeg (prepoznavanje) ka težem (prisećanje), pamti šta polaznik (ne) zna **trajno**, i prikazuje napredak „naučeno X/N" do savladanog seta.

**Glavna arhitektonska odluka:** jedan model kartice + jedan motor za **sve nivoe (A1–B2)**. Motor se piše jednom; svaki nivo samo puni kartice. Nikad se ne prilagođava po nivou.

**Princip:** modul mora besprekorno da radi i sa najprostijom karticom (samo `front`/`back`). Bogata polja su nadogradnja, ne uslov.

## Obim

### Pravimo ODMAH, kompletno (kod je jednokratan trošak)
- Prošireni model kartice (sva opciona polja)
- Tabela za praćenje napretka po kartici (mastery)
- Motor: kviz, kucanje, flip, spajanje parova
- **Igra memorije** (ostaje u v1 — izričit zahtev)
- Izbor načina vežbanja (vođeno + pojedinačni drilovi)
- Uvoz kartica iz Quizlet exporta (vidi „Sadržaj")
- `image` polje u modelu (samo definicija — bez UI; štedi migraciju)

### Sledeći korak (v2) — ne sad
- **Slike:** prikaz na kartici + sadržaj (Quizlet export ih ne nosi; rade se posebno)

### Po prirodi postupno (NIJE prepravka, samo punjenje)
- Kuriranje/uvoz kartica A1.1 — kreće prvo (iz Quizleta)
- Širenje na A1.2 → B2 nakon A1.1 (isti motor, isti uvoz)

### Van obima (YAGNI)
- Spaced repetition kroz dane (tabela ostavlja vrata otvorena, ali ne sad)
- Igre na vreme / leaderboard / Gravity-Blast tip igara
- AI chat nad karticama, slike kao obavezan deo svake kartice
- „Test" režim (generisani test) — moguće kasnije iz istih komponenti

## Model kartice (jedan, za sve nivoe)

Proširenje postojećeg `FlashcardSection` u `src/lib/section-types.ts`. Stavka kartice:

```ts
interface FlashcardItem {
  front: string;          // OBAVEZNO — nemački
  back: string;           // OBAVEZNO — srpski
  // sve ispod je OPCIONO; modul koristi šta zatekne
  article?: "der" | "die" | "das";   // rod imenice
  plural?: string;        // npr. "Väter"
  example?: string;       // primer rečenica
  image?: string;         // URL (Supabase Storage, bucket blog-media)
  hint?: string;          // npr. "+ Akkusativ" za glagol s predlogom
  audio?: string;         // opciono; inače TTS (postojeći SpeakButton)
}
```

Kartica bez opcionih polja = klasičan par (flip/kviz/kucanje). Imenica sa `article`+`plural` otključava blago ocenjivanje roda/množine. `image` se prikazuje kad postoji. Postojeće kartice u bazi ostaju validne (sva nova polja opciona — bez migracije sadržaja).

## Praćenje napretka (mastery)

Nova Supabase tabela. Napredak je **po (korisnik, kartica)**.

```
flashcard_progress
  user_id        uuid    (fk auth.users)
  card_id        text    (stabilan id kartice — vidi dole)
  correct_count  int     default 0
  wrong_count    int     default 0
  status         text    'new' | 'learning' | 'mastered'
  last_seen_at   timestamptz
  PRIMARY KEY (user_id, card_id)
  RLS: korisnik vidi/menja samo svoje redove
```

**Stabilan `card_id`:** kartice su trenutno stavke u JSON nizu bez ID-a. Izvodimo determinističan ID iz `lesson_id` + hash(`front`+`back`), tako da preživi promenu redosleda u nizu. (Ako se sam tekst kartice izmeni, to je nova kartica — prihvatljivo.)

**Pravilo savladavanja (mastery):**
- Tačan odgovor: `correct_count++`. Kartica postaje `mastered` kad ima **2 tačna odgovora, od kojih bar jedan kucanjem** (prisećanje vredi više od prepoznavanja). Ako set nema kucanje uključeno, dovoljna su 2 tačna kviza.
- Netačan: `wrong_count++`, status nazad na `learning`, kartica se vraća češće u rundi.
- Set je „savladan" kad su sve kartice `mastered`.

Lagano za bazu: jedan red po kartici, jedan upit po setu (isti red veličine kao postojeći `LessonProgress`).

## Tok Learn moda (adaptivno, runde)

1. Polaznik otvori set i bira način (vidi „Izbor načina").
2. **Vođeno učenje** ređa kartice u rundama:
   - Nove/slabe kartice prvo idu na **kviz** (prepoznavanje).
   - Kako kartica jača, prelazi na **kucanje** (prisećanje).
   - Pogrešne se vraćaju češće.
   - **Spajanje parova** se ubacuje kao kratka pauza između rundi.
3. Traka napretka „Naučeno X/N" stalno vidljiva.
4. Kad su sve kartice `mastered` → ekran „Set savladan 🏆" + podsticaj da se vrati sutra.

### Izbor načina vežbanja
Polaznik može da bira (ne mora vođeno):
- **Vođeno učenje** (difolt, adaptivno)
- **Samo kviz**
- **Samo kucanje**
- **Spajanje parova**
- **Igra memorije**

(Po želji: podešavanje koji tipovi ulaze u vođeni miks + smer DE→SR / SR→DE. Difolt za A1.1: DE→SR prepoznavanje prvo.)

## Tipovi vežbi

| Tip | Šta radi | Napomena |
|---|---|---|
| **Flip** | okreni karticu, sam oceni „znam/ne znam" | opcioni „zagrej se"; postoji `FlashcardBlock` |
| **Kviz** | izaberi tačan; netačni se vuku iz istog seta | srce modula; radi za SVAKU karticu |
| **Kucanje** | ukucaj odgovor; blago ocenjivanje (vidi dole) | najjače za pamćenje |
| **Spajanje** | poveži nemački↔srpski | postoji `MatchPairsExercise`; pauza |
| **Igra memorije** | mreža okrenutih kartica, spoji parove | zabava; ne prati mastery; mobilna mreža 3 kol. / ~6 parova |

## Pravila ocenjivanja kucanja (anti-frustracija)

**Univerzalna tolerancija (uvek):**
- ignoriši velika/mala slova
- ignoriši zareze, tačke i suvišne razmake
- „ss" = „ß"; umlaut bez tačkica (ae=ä, oe=ö, ue=ü) prihvaćeno
- „skoro tačno" (≤1 slovo greške): blaga poruka „Skoro! Tačno je …", **priznato** — ne crveni X
- dugme „Bio sam u pravu" (override) za rubne slučajeve

**Član i množina — NIKAD obavezni:**
- Imenica „der Vater": prihvata se „Vater" **i** „der Vater". Član se pokaže kao podsetnik, ne obara odgovor.
- Množina: prihvata se osnovni oblik; pun oblik („die Väter") se pokaže radi učenja. Ne obara odgovor.
- Kartice tipa „Ich komme aus…" (sa „…") se ne kucaju — idu na kviz.

## Sadržaj — uvoz iz Quizleta (glavni izvor)

Kartice već postoje, iskurirane na Quizletu. Ne pravimo ih ručno — **uvozimo exportom.**
- Quizlet: set → ⋯ → **Export** → tekst „pojam[razdvajač]definicija[razdvajač kartica]".
- **Import skripta** parsira export → `front`/`back` setovi (bulk, svi nivoi).
- Ako pojam sadrži član („der Vater") → auto izvuče `article: der`, `front: Vater`. Format „der Vater, die Väter" → i `plural`.
- Rod/množina koji fale: auto-dopuna (rečnik/AI), Nataša samo potvrđuje.
- **Quizlet export NE nosi slike** → slike su v2, ne blokiraju.
- **TODO pre plana:** Nataša nalepi jedan stvarni export da se import prilagodi tačnom formatu.

## Slike (v2 — ne sad)

- `image` polje (URL) ostaje definisano u modelu (bez UI sad — štedi migraciju).
- Prikaz i sadržaj slika su zaseban, kasniji korak. Skladište: Supabase Storage, bucket `blog-media`.
- Samo konkretne imenice; izvor: besplatne biblioteke ili AI-generisane ilustracije.

## Performanse

- **Lazy-load modula:** dinamički import — Learn kod se učita tek kad polaznik otvori „Uči". Ostale stranice (početna, blog, checkout) ga ne povlače → 0 uticaja na njihovo učitavanje.
- Podaci seta sitni (par KB). Mastery: lagani upiti.
- **Tvrd zahtev:** modul ne usporava sajt.

## Mobilni (mobile-first — uslov)

- Pravi se prvo za telefon: velika dugmad, kartica preko celog ekrana, swipe za flip, mobilna tastatura za kucanje, čitljive „skoro tačno" poruke.
- Igra memorije: mreža se prilagodi (3 kolone / ~6 parova da stane bez skrola); na većem ekranu više.
- Bez horizontalnog skrola i zumiranja.
- Oslanja se na postojeće mobilne/PWA optimizacije i Tailwind responsive komponente.
- **Tvrd zahtev:** testirati na telefonu pre „gotovo" (uklopiti u postojeći `smoke-deploy`).

## Struktura sadržaja — „REČI" lekcija po modulu

Granularnost Learn seta = **modul (Lektion)**, ne pojedinačna lekcija.

```
Modul „Lektion 1"
 ├─ Lekcija: Pozdravi   → mali flip blok (reči te lekcije, brzi podsetnik)
 ├─ Lekcija: Familie    → mali flip blok
 ├─ ...
 └─ Lekcija: REČI 🧠    → ceo Learn modul (sve reči modula, mastery)
```

- **Po lekciji:** ostaju postojeći mali flip blokovi (reči se vrte u kontekstu lekcije).
- **Po modulu:** zasebna lekcija **„REČI"** nosi ceo Learn (kviz, kucanje, spajanje, memorija, mastery) nad svim rečima modula.
- **Mapiranje uvoza:** jedan Quizlet export = jedan modul = sadržaj jedne „REČI" lekcije. Bez ručnog cepanja setova.

## Ulazna tačka

- „REČI" lekcija nosi novi tip bloka (npr. `wordset`/`learn`) sa celim setom modula + pokretač Learn moda.
- Dodatno: dugme **„Uči"** na malom flip bloku u lekciji može da povede na „REČI" set tog modula (opciono).

## Komponente (skica, za plan)

- `src/lib/section-types.ts` — proširen `FlashcardItem`
- Supabase migracija — tabela `flashcard_progress` + RLS
- `src/lib/flashcard-grading.ts` — tolerantno poređenje (član/množina/ß/umlaut/typo)
- `src/lib/flashcard-card-id.ts` — stabilan `card_id`
- `LearnModule` (lazy-loaded) — orkestrator rundi + mastery
- Reuse: `QuizExercise`, `TypingExercise` (sa novim grading-om), `MatchPairsExercise`, `SpeakButton`
- `MemoryGame` — nova komponenta (v1)
- `scripts/import-quizlet.ts` — parsiranje exporta (tab-razdvojeno) → „REČI" set modula
- Novi `wordset`/`learn` tip bloka za „REČI" lekciju + `BlockRenderer` podrška
- Dugme „Uči" u `FlashcardBlock` (opciono → vodi na „REČI" set)

## Format Quizlet exporta (potvrđeno na uzorku A1.1)

- `nemački[TAB]srpski`, nova linija po kartici.
- **Prazni prevodi** (npr. „Gute Nacht\t") → import označi za dopunu, ne ubacuje praznu karticu.
- **Imenice bez člana** („Frau", „Straße") → član/množina se auto-dopunjuju (rečnik/AI), Nataša potvrđuje.
- **Više prevoda** („Hallo → Zdravo/Ćao", „sagen → reći, kazati") → razdvoji se; u vežbi se priznaje bilo koji tačan.

## Radni tok sadržaja

- Sadržaj iz Quizleta (export → `import-quizlet.ts`), ne ručno. Jedan export = jedan modul = „REČI" lekcija.
- Rod/množina koji fale dopunjavaju se automatski; Nataša potvrđuje.
- Redosled posle A1.1: A1.2 → … → B2 (isti motor, isti uvoz).
