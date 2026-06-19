# Membership / pretplata — istraživanje i ideje (parkirano)

**Datum:** 2026-06-18
**Status:** IDEJA, nije spec, nije odlučeno. Sačuvano za kasnije.

## Tvrd zahtev (Nataša 2026-06-18)

- Proizvod **mora da radi na SVIM nivoima A1–B2**, ne vezan za jedan nivo. (Pojačava marketing
  „jedna pretplata, svi nivoi" i širi publiku.)
- Nataša **oprezna sa previše AI** u celoj priči — ne graditi proizvod gde je AI centar.

## Kako je krenulo

Banca Intesa / NestPay aktivirala **recurring (ponavljajuću) naplatu** u **test okruženju**.
Dodaju se tri polja u postojeći NestPay POST (NE ulaze u hash):

```html
<input type="hidden" name="RecurringPaymentNumber" value="6">   <!-- ukupan broj naplata -->
<input type="hidden" name="RecurringFrequencyUnit" value="M">   <!-- D/W/M/Y -->
<input type="hidden" name="RecurringFrequency" value="1">       <!-- svakih 1 -->
```

Tehnički je dodavanje polja trivijalno (izmena `src/lib/nestpay.ts` + forma u
`src/app/kupovina/kartica/[orderId]/page.tsx`). PROBLEM nije forma nego sistem oko nje.

## Recurring razbija ključnu pretpostavku sistema

Sad: *jedna porudžbina = jedna naplata = jedan callback = pristup + fiskalni račun + Meta event.*
Recurring: jedna porudžbina = **N naplata**, ali kod vidi i obradi **samo prvu**.

Otvorena pitanja za banku (pre bilo kakve produkcije):
1. Da li banka šalje callback na `okUrl`/`CallbackURL` za **svaku** naplatu (2…N), ili samo prvu?
   → Određuje da li uopšte možemo da fiskalizujemo i evidentiramo naredne naplate.
2. Koji `oid`/`TransId` nose naredne naplate? (bez toga reconcile ne radi)
3. Kako se serija **zaustavlja** kad neko otkaže/traži povraćaj (Merchant Center ručno ili API)?

**Najveći blocker = fiskalizacija naplata 2…N.** U Srbiji svaka naplata mora fiskalni račun,
a `fiscalizeOrder` se sad zove samo u callback-u prve naplate.

**Jeftin test (odgovara na #1 sam):** dodati 3 polja na test-porudžbinu, skratiti interval na
`RecurringFrequencyUnit=D` (dnevno), logovati svaki callback → vidimo empirijski da li naredne
naplate uopšte dolaze do nas. Pre toga ne ulaziti u kod logike.

## Fazni pristup (dogovoreno kao princip)

- **Faza 1 (bez nove tehnike):** proizvod kao **jednokratna uplata** sa npr. 6-mes ili 12-mes
  pristupom (i opciono nedeljnim drip otključavanjem). Fiskalizuje se jednom, čisto, odmah.
- **Faza 2 (posle test sa bankom):** dodati **mesečnu** opciju preko recurring-a.

Recurring ostaje IZOLOVAN, opcionalan dodatak na JEDAN proizvod — ne dira postojeći checkout.

## Istraživanje tržišta (jun 2026)

- Globalni „reči"/vokabular proizvodi (Memrise ~$8.99/mes ili ~$70/god; Babbel ~$8.45/mes;
  MosaLingua ~$9.99/mes ili ~$50/god; Seedlang ~$60/god) — skoro svi pretplata + free mamac +
  spaced repetition.
- **Regionalno (srpski) NE postoji** struktuiran „nemačke reči/dnevna praksa" pretplata-proizvod.
  Konkurencija = skupi živi kursevi (Nemački Online 180€/3mes, Akademija Oxford od 2500 RSD/mes)
  ili besplatne neorganizovane vežbe (Goethe). → **Rupa na tržištu** za vođen, brendiran, na srpskom.
- 1000 reči ≈ 60% svakodnevnog nemačkog (gotov marketinški adut).
- Drip (nedeljno otključavanje) dokazano ↓ otkazivanje, ↑ završetak.
- Cenovna psihologija: mesečno = niža barijera/veći churn; godišnje = ~25% niži churn, ~25% veći
  LTV; preporuka: ponudi oba, godišnje 20–30% popust, prikaži godišnje prvo, money-back +34% konv.
- Predlog cene: mesečno ~9–12€, godišnje ~69–89€.

## Razmatrani koncepti proizvoda

1. **„1000 reči" vođen program** — ~40 lekcija × ~25 reči, 1 nedeljno, nove reči + ponavljanje
   starih, za sve A1+, kotrljajući upis. (Polazna ideja, otvoreno.)
2. **Goethe ispitna priprema (6 mes)** — najveća spremnost da se plati, jasan ishod, premium,
   6 meseci = prirodan ciklus. (Najjači za prihod.)
3. **„Nemački svaki dan" sa NaKI** — vidi dole. (Strateški jak, ali Nataša oprezna sa previše AI.)
4. **Govorni klub** — nedeljne konverzacije; odličan kao dodatak, ali trošak profesorki.

## Detaljnije: „Nemački svaki dan" (PARKIRANO — previše AI za sada)

> Nataša 2026-06-18: nije sigurna da hoće toliko AI u celoj priči. Čuva se kao ideja.

- Pozicija: „5 minuta nemačkog svaki dan" — gađa problem aktivacije (84–90% nikad ne počne).
- Dnevna petlja (scaffold → NaKI): zagrevanje (reč/fraza dana, 30 sek) → NaKI izazov dana
  (primeni reč u situaciji, glas ili tekst, ispravka) → srce/streak, meda reaguje.
- Drip: nedeljna tema (kafić, lekar, posao, putovanje…), otključava se nedeljno.
- Adaptivno po nivou (A1–B2), radi za sve A1+.
- Zadržavanje: meda kao emotivna kuka, streak prekretnice (7/30/100), nedeljni izveštaj, comeback nudge.
- Nivoi: osnovni ~9€ (NaKI ograničeno), premium ~12–15€ (neograničen NaKI + Schreiben ispravka +
  povremeni uživo mini-susret).
- Imena: „Nemački svaki dan", „5 minuta nemačkog", „Dnevna doza nemačkog", „NaKI Daily", „Mali koraci".

## Sledeći korak kad se vrati na ovo

Odlučiti KOJI proizvod (verovatno bez previše AI — npr. „1000 reči" vođen ili ispitna priprema),
pa Faza 1 kao jednokratna uplata. Recurring tek posle jeftinog test-a sa bankom.
