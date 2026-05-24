# AI Situacioni Dijalog — Design Spec

**Datum:** 2026-05-24  
**Status:** Draft

## Cilj

Studenti vežbaju nemački kroz kratke situacione dijaloge sa AI-jem. AI preuzima ulogu (konobar, prodavac, itd.), student bira između 2 ponuđena odgovora. Dijalog je vezan za temu lekcije i ograničen na 6-8 tura.

## Korisničko iskustvo

1. Na dnu svake lekcije — dugme **"Vežbaj u dijalogu"**
2. Klik otvara `/vezba/ai/[lessonId]`
3. AI prikazuje scenario (1 rečenica konteksta, npr. "U pekari si. Želiš da kupiš hleb.")
4. AI (u ulozi) kaže svoju prvu repliku na nemačkom
5. Student bira 1 od 2 ponuđene opcije (obe na nemačkom)
6. AI reaguje na izbor, nastavlja dijalog — nova replika + 2 nove opcije
7. Posle 6-8 tura: završna poruka + srpski prevod svakog koraka
8. Dugmad: "Ponovi" (novi dijalog iste teme) ili "Nazad na lekciju"

## Tehička arhitektura

### API ruta: `/api/ai-dialog-exercise`

**Request:**
```json
{
  "lessonId": "uuid",
  "messages": [
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "turnNumber": 1
}
```

**Response (tura 1):**
```json
{
  "scenario": "U pekari si. Želiš da kupiš hleb i dva peciva.",
  "aiMessage": "Guten Morgen! Was darf es sein?",
  "options": ["Ich möchte ein Brot, bitte.", "Wo ist der Bahnhof?"],
  "finished": false
}
```

**Response (ture 2-7):**
```json
{
  "aiMessage": "Sehr gerne! Sonst noch etwas?",
  "options": ["Ja, zwei Brötchen bitte.", "Nein, das ist alles. Danke!"],
  "finished": false
}
```

**Response (poslednja tura):**
```json
{
  "aiMessage": "Das macht 3,50 Euro. Einen schönen Tag noch!",
  "options": null,
  "finished": true,
  "summary": "Uspešno si kupila hleb i peciva u pekari!"
}
```

### Logika API rute

1. Auth check (korisnik mora biti ulogovan)
2. Rate limit (isti mehanizam kao `/api/dialog`)
3. Iz baze čita: `lessons.title` + `flashcards` (vocab) za tu lekciju (iz `lesson_sections` tipa "flashcards")
4. Iz `courses.title` izvlači nivo (A1, A2, B1)
5. Šalje prompt Anthropicu (claude-haiku-4-5-20251001)
6. Parsira JSON odgovor i vraća klijentu

### Prompt strategija

**System prompt:**
```
Ti si AI partner za vežbanje nemačkog jezika na nivou {level}.

Pravila:
- Igraš ulogu u svakodnevnoj situaciji vezanoj za temu: {lessonTitle}
- Koristi SAMO vokabular prigodan za nivo {level}
- Tvoje replike su kratke (1-2 rečenice)
- Za svaku turu daješ studentu TAČNO 2 opcije za odgovor
- Jedna opcija je tematski ispravna, druga je nelogična ali gramatički korektna
- Dijalog traje tačno {maxTurns} tura
- Na poslednjoj turi zaključi dijalog prirodno (bez opcija)
- Koristi reči iz ovog vokabulara kad je moguće: {vocabList}
- Odgovaraj ISKLJUČIVO u JSON formatu

Format odgovora:
{"aiMessage": "...", "options": ["...", "..."], "finished": false}
Za poslednju turu: {"aiMessage": "...", "options": null, "finished": true, "summary": "..."}
Za prvu turu dodaj: "scenario": "..." (opis situacije na srpskom)
```

**Max turns:** 7 (fiksno)

### Frontend: `/vezba/ai/[lessonId]/page.tsx`

**Server component** učitava lekciju (title, course level), renderuje **client component** `AiDialogExercise`.

**Client component `AiDialogExercise`:**
- State: messages[], scenario, loading, finished, currentOptions
- Na mount: poziva API sa turnNumber=1, praznim messages
- Prikazuje scenario + AI poruku + 2 opcije kao dugmad
- Klik na opciju: dodaje u messages, poziva API sa turnNumber+1
- Kad finished=true: prikazuje summary + "Ponovi" / "Nazad"
- Chat-style prikaz: AI poruke levo (sivi bubble), student izbori desno (plavi bubble)

### Dugme na stranici lekcije

U `/lekcija/[id]/page.tsx` — dodati ispod sadržaja lekcije, pre postojećih vežbi:

```tsx
<Link href={`/vezba/ai/${lesson.id}`} className="...">
  Vežbaj u dijalogu
</Link>
```

Stilizacija: sekundarno dugme (outline), puna širina, sa ikonom chat bubble-a.

## Šta NIJE u scope-u

- Čuvanje rezultata u bazu (nema progress tracking za ovu vežbu)
- Ocenjivanje ili scoring
- Grammar drill (samo situacioni dijalog sa opcijama)
- Admin panel za upravljanje scenarijima
- Prevod opcija na srpski (samo nemački)

## Fajlovi koji se kreiraju/menjaju

| Fajl | Akcija |
|------|--------|
| `src/app/api/ai-dialog-exercise/route.ts` | Nova API ruta |
| `src/app/vezba/ai/[lessonId]/page.tsx` | Nova stranica (server) |
| `src/components/exercises/AiDialogExercise.tsx` | Novi client component |
| `src/app/lekcija/[id]/page.tsx` | Dodati dugme "Vežbaj u dijalogu" |

## Zavisnosti

- `@anthropic-ai/sdk` — već instaliran
- `ANTHROPIC_API_KEY` — već u env
- Rate limiting — već implementiran (`src/lib/rate-limit.ts`)
