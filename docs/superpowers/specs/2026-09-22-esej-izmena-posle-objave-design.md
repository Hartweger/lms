# Izmena komentara/ocene eseja posle objave

**Datum:** 22.09.2026 · **Status:** implementirano, čeka deploy

## Problem

Kad profesorka (ili admin) na `/profesor/eseji` odnosno `/admin/eseji` klikne „Objavi studentu", rad prelazi u `published` i dugme „Pregledaj i oceni" nestaje. Nema načina da se naknadno ispravi greška u kucanju, ocena ili pogrešna ispravka. Ruta `/api/essays/publish` je uz to već objavljen rad tiho ignorisala (`alreadyPublished`), pa ni ručni poziv ne bi pomogao.

## Rešenje

1. **Ruta `POST /api/essays/publish`** tretira već objavljen rad kao *izmenu*:
   - učita postojeće `professor_feedback`, `professor_score`, `ai_corrections`;
   - ako se ništa nije promenilo (komentar, ocena i normalizovane ispravke isti) → `{ ok, unchanged }`, bez upisa i bez mejla;
   - inače upiše nove vrednosti (status ostaje `published`, `reviewed_at` se osveži), pošalje učeniku mejl sa `updated: true` i ponovo pokrene proveru Modelltest sertifikata (idempotentna). Odgovor `{ ok, updated }`.
   - Prava ista kao za prvu objavu: profesor samo svog učenika, admin sve.
2. **Mejl učeniku** (`sendEssayFeedbackEmail`, novo polje `updated`): naslov „Komentar na tvoj Schreiben je izmenjen", uvod „Tvoj profesor je dopunio ocenu ili komentar…". Ostatak (ocena, komentar, dugme) isti.
3. **Oba panela**: na objavljenom radu stoji sivo dugme „Izmeni komentar / ocenu" koje otvara istu formu (predpopunjenu postojećim komentarom, ocenom i ispravkama). Dugme za slanje tada piše „Sačuvaj izmene" umesto „Objavi studentu".

## Van opsega

- Istorija verzija komentara (čuva se samo poslednje stanje).
- Povlačenje već izdatog sertifikata ako se ocena naknadno spusti ispod praga.
- Učenik ne vidi oznaku „izmenjeno" u lekciji; vidi aktuelno stanje pri sledećem otvaranju.

## Testovi

`src/app/api/essays/publish/route.test.ts` (vitest): izmena → upis + mejl `updated`; samo ispravke izmenjene → upis + mejl; bez promene → ništa; prva objava → mejl bez oznake; odjavljen → 403.
