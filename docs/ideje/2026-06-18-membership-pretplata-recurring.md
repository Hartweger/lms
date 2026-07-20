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

## DOPUNA 20.07.2026 — odgovori iz NestPay API priručnika + mejla banke

Test-harness LIVE: `/admin/nestpay-recurring-test` + `/api/nestpay/test-callback` →
tabela `nestpay_test_callbacks` (migracija 066). Čeka `NESTPAY_TEST_STORE_KEY`.

Banka (mejl 20.07): posle uspešne inicijalne recurring transakcije njihov sistem
automatski kreira ponovljene transakcije; order ID šema po mejlu: `oid-1`, `oid-2`…
(u API priručniku primer: `ORDER-<RecurringId>`; tačan format ćemo videti u testu).

Iz „Merchant Integration API Manual" (prilog mejla banke; poglavlja 2.3, 6, 7):

**1) Status cele serije** — CC5 upit na `/fim/api` sa `ORDERSTATUS=QUERY` +
`Extra.RECURRINGID` → vraća `RECURRINGCOUNT` i po naplati sufiksirana polja:
`ORD_ID_n`, `TRANS_STAT_n` (PN=pending), `CAPTURE_AMT_n`, `PLANNED_START_DTTM_n`,
maskiran `PAN_n`. **Ovo je backstop za fiskalizaciju naplata 2..N čak i ako callback
ne stiže** (uz poznati rizik: API sa Vercel-a bio IP-blokiran na produkciji).
RECURRINGID najverovatnije stiže u response/callback parametrima inicijalne
transakcije — logger hvata sve, videćemo u testu.

**2) Otkazivanje serije** (pogl. 7, str. 45): CC5 request sa
`Extra.RECURRINGOPERATION=Cancel` + `RECORDTYPE=Recurring` + `RECORDID=<RecurringId>`
(cela serija) ili `RECORDTYPE=Order` + `RECORDID=<order id>` (pojedinačne buduće
naplate; može više RECORDID odjednom). Postoji i `Update` za iznos
(`AMOUNT`, obavezan `Currency`) i/ili datum (`STARTDATE`). Alternativa: ručno u
Merchant Centeru.

**3) Ograničenja recurring-a** (pogl. 6.3): samo `Auth` (Sale) transakcije; ne može
u kombinaciji sa ratama; max 121 naplata; frekvencija D/W/M (u hosting docu i Y).

**4) Testne kartice**: NEMA ih ni u jednom od dva dokumenta (u primerima se koristi
maskirano 4242 42** **** 4242) — tražiti od banke.

Otvoreno posle ovoga: SAMO pitanje da li callback za naplate 2..N stiže na okUrl
(empirijski test), i odakle tačno čitamo RECURRINGID (prvi test pokazuje).

## PRVA RECURRING TRANSAKCIJA PROŠLA (20.07.2026, 14:39)

Test u testnom okruženju: oid `RECTEST-1784551062868`, 100 RSD, Visa
`4841878700002912` (testna kartica banke), 3D simulator → „Yes".

Rezultat: **Approved, ProcReturnCode=00, Full 3DSecure**, vidljivo i u testnom
Merchant Centeru (Sale / Successful, AuthCode 798667). Callback je **stigao na
naš `/api/nestpay/test-callback` sa VALIDNIM potpisom** (`hash_valid=true`) —
znači store key u portalu i `NESTPAY_TEST_STORE_KEY` u Vercelu se poklapaju.

**Ključni nalaz — gde je RECURRINGID:** u callback parametrima stiže kao
**`EXTRA.RECURRINGID`** (vrednost u testu: `26201OnlA13974`). To je ID cele
serije — ulaz za `ORDERSTATUS=QUERY` (status svih naplata) i za
`RECURRINGOPERATION=Cancel` (otkazivanje pretplate). **Za implementaciju: sačuvati
`EXTRA.RECURRINGID` uz porudžbinu pri prvoj naplati.**

Callback je vratio i sva tri poslata recurring polja (`RecurringPaymentNumber=3`
itd.), `TransId` 26201OnlB13975, `ReturnOid` = naš oid, plus pun 3DS2 blok.

Uzroci ranijih neuspeha (rešeni): ništa od naših pretpostavki o testnim karticama —
`4242…` i `4355…` nisu u bazi njihovog simulatora; prave testne kartice je poslala
banka (Visa 4841878700002912 12/26 003, MC 5443584545004639 12/26 002,
Dina 9891007635312414 12/30 000, Amex 375987000169792 12/30 000; za neuspešnu
naplatu CVC2 510 / 1234). Usput je dodat `shopurl` u test formu (kao u produkciji).

**OSTAJE (21-22.07):** proveriti da li callbackovi za naplate 2 i 3 stižu sami
(dnevna frekvencija) — pogledati tabelu `nestpay_test_callbacks`. To je poslednje
otvoreno pitanje; ako ne stignu, backstop je `ORDERSTATUS=QUERY` sa RECURRINGID.
Pa javiti banci da provere sa svoje strane pre aktivacije na produkciji.
