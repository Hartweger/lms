# Mesečno plaćanje (12 rata) za Video paket A1+A2+B1 - dizajn

**Datum:** 2026-07-21
**Status:** spec, odobren za planiranje
**Kontekst:** [docs/ideje/2026-06-18-membership-pretplata-recurring.md](../../ideje/2026-06-18-membership-pretplata-recurring.md)

## Cilj

Dodati nov način plaćanja za **Video paket A1 + A2 + B1**: umesto 29.133 RSD odjednom,
**12 mesečnih naplata po 3.199 RSD (ukupno 38.388 RSD)**, preko NestPay recurring
funkcionalnosti koju je Banca Intesa aktivirala i koju smo testirali 20-21.07.2026.

Dva razloga:

1. **Prodajni.** „3.199 dinara mesečno" je bitno drugačija ponuda od „29.133 odjednom"
   za istu stvar. Rate danas postoje samo za kartice banaka koje ih nude na svojoj
   strani; ovim mehanizmom rate rade sa **bilo kojom karticom**, domaćom ili stranom.
2. **Zahtev banke.** Pre aktivacije recurringa na produkciji banka traži **link ka
   stvarnom kupčevom toku** u kojem je nedvosmisleno istaknuto šta kupac pokreće, uz
   opis u uslovima korišćenja i navedeno kako se otkazuje.

## Odluke (Nataša, 21.07.2026)

| Pitanje | Odluka |
|---|---|
| Obim prve runde | SAMO Video paket A1+A2+B1 |
| Cena | 3.199 RSD × 12 = 38.388 RSD (jednokratno ostaje 29.133) |
| Izbor na checkoutu | Zaseban, jasno označen način plaćanja (ne štiklirano polje) |
| Pristup kad plaćanje stane | Pristup traje dok traje plaćanje; otkazivanje ga pauzira |
| Otkazivanje | Sama polaznica, dugmetom u „Moj nalog" |

## Kupčev tok

1. Na `/kupovina/paket-a1-a2-b1` uz postojeće načine plaćanja stoji nov izbor
   **„Mesečno plaćanje - 12 rata po 3.199 RSD"**.
2. Kad ga izabere, iznad dugmeta se prikazuje **obavezno obaveštenje** (zahtev banke):
   > Pokrećeš mesečnu naplatu kartice: 12 naplata po 3.199 RSD (ukupno 38.388 RSD).
   > Prva naplata je danas, naredne svakog meseca istog datuma. Pristup kursevima traje
   > dok traje plaćanje. Otkazivanje u svakom trenutku u „Moj nalog", bez objašnjenja.
3. Uz obaveštenje ide **saglasnost sa uslovima korišćenja** (link na `/uslovi`).
4. Klik vodi na bankinu stranu sa poljima `RecurringPaymentNumber=12`,
   `RecurringFrequencyUnit=M`, `RecurringFrequency=1` (ne ulaze u hash).
5. Callback inicijalne naplate: postojeći `/api/nestpay/callback` + upis pretplate
   (`EXTRA.RECURRINGID` iz callback parametara).

Uplatnica i PayPal ostaju nepromenjeni kao izbor za one koji ne žele automatsku naplatu.

## Model podataka

**Nova tabela `subscriptions`:**

| kolona | opis |
|---|---|
| `id` | uuid |
| `user_id`, `course_id` | polaznica i kurs |
| `initial_order_id` | porudžbina prve rate |
| `recurring_id` | `EXTRA.RECURRINGID` iz callbacka (ključ za sve upite banci) |
| `base_oid` | `order_number` inicijalne porudžbine (banka izvodi `<oid>-2`, `-3`…) |
| `amount`, `total_payments` (12), `paid_payments` | stanje serije |
| `status` | `active` / `cancelled` / `failed` / `completed` |
| `next_charge_at`, `cancelled_at` | |

**Dopuna tabele `orders`:** `subscription_id`, `installment_no` (1..12),
`nestpay_oid` (**unique** - garancija da se ista naplata nikad ne obradi dvaput).

Svaka rata je **obična porudžbina**. Time se nasleđuje sve postojeće: fiskalizacija,
dodela pristupa, mejlovi, admin lista, finansije. Ne pravi se paralelna mašinerija.

## Dodela pristupa

Pravilo: **pristup važi do datuma naredne naplate + 7 dana zaliha.**

- 1. rata → pristup do T0 + 1 mesec + 7 dana
- svaka naredna rata pomera `course_access.expires_at` za mesec dana
- 12. rata → pristup do T0 + 12 meseci + 7 dana (isto kao standardni godišnji pristup)

Posledica: ako naplata padne ili polaznica otkaže, **pristup istekne sam** u roku od
nekoliko dana. Ne postoji logika oduzimanja pristupa, pa nema ni rizika da nekome bude
oduzet greškom. `grantAccessForOrder` dobija opcioni `accessUntil` za ovaj slučaj.

## Dnevni poll (jezgro rešenja)

Banka šalje callback **samo za inicijalnu naplatu** (potvrđeno testom i mejlom banke
21.07). Naplate 2..12 saznajemo sami.

Nov cron `/api/cron/subscriptions-poll` (dnevno, uz postojeće cronove):

1. Za svaku `active` pretplatu → CC5 upit na `/fim/api`:
   `Extra.RECURRINGID` + `ORDERSTATUS=QUERY`, kredencijali **API korisnika**.
2. Iz odgovora se čitaju po naplati sufiksirana polja: `ORD_ID_n`, `TRANS_STAT_n`,
   `CAPTURE_AMT_n`, `PLANNED_START_DTTM_n`.
3. Za svaku **uspelu** naplatu koja još nema porudžbinu (`nestpay_oid` ne postoji):
   napravi porudžbinu (`completed`, `installment_no = n`) → `grantAccessForOrder`
   → `fiscalizeOrder` → mejl „naplaćena n. od 12 rata".
4. Za **neuspelu** naplatu: `status = failed`, mejl polaznici da plaćanje nije prošlo
   i kako da nastavi. Pristup istekne sam (vidi gore).
5. Kad `paid_payments = 12` → `status = completed`, završni mejl.

Parsiranje odgovora izdvojiti u čistu funkciju (`src/lib/nestpay-recurring.ts`) da bude
testabilno bez mreže.

**Meta/GA4:** `Purchase` se šalje SAMO za `installment_no = 1`. Rate nisu nove konverzije
i poslale bi 12 lažnih kupovina u atribuciju (vidi `project_meta_pixel_capi`).

## Otkazivanje

U „Moj nalog" nova sekcija:

> **Mesečno plaćanje - Video paket A1+A2+B1**
> Plaćeno 3 od 12 rata · Sledeća naplata 21.08.2026.
> [Otkaži plaćanje]

Dugme → `POST /api/pretplata/otkazi` → CC5 sa `Extra.RECURRINGOPERATION=Cancel`,
`RECORDTYPE=Recurring`, `RECORDID=<recurring_id>` → `status = cancelled` → mejl potvrde.
Pristup ostaje do kraja plaćenog perioda. Ako poziv banci padne: jasna poruka polaznici
da nam se javi mejlom + Sentry alarm (ne sme da ostane tiho).

## Uslovi korišćenja

U `/uslovi` nov odeljak „Mesečno plaćanje (12 rata)": broj i iznos naplata, ukupan iznos,
da pristup traje dok traje plaćanje, da se otkazuje dugmetom u „Moj nalog" (ili mejlom),
i da otkazivanje zaustavlja buduće naplate ali ne vraća već plaćene rate.

## Admin

`/admin/pretplate`: lista pretplata (polaznica, kurs, plaćeno/ukupno, sledeća naplata,
status), sa mogućnošću otkazivanja. Namerno minimalno - detalje ionako drži banka.

## Preduslov: API korisnik

Bez njega ne rade ni poll ni otkazivanje.

1. Nataša u Merchant Centeru: Administration → Add New User, **ime različito od
   `NATadmin`** (npr. `NATapi`); prvo u testnom, pa u produkcionom portalu.
2. Env: `NESTPAY_API_USER`, `NESTPAY_API_PASSWORD` (test i prod).
3. `queryTransaction` u `src/lib/nestpay.ts` prebaciti sa
   `Name=NESTPAY_USERNAME` / `Password=NESTPAY_STORE_KEY` na API korisnika.

**Uzgredna korist:** time se popravlja i `/api/cron/nestpay-reconcile`, koji zbog istih
pogrešnih kredencijala trenutno ne radi - pa se pokriva i „kupac platio, callback se
izgubio" za sve kartične uplate, ne samo za pretplate.

## Testiranje

- **Jedinični testovi:** parser CC5 recurring odgovora (uzorak XML sa 3 naplate: uspela,
  na čekanju, pala), pravilo `accessUntil`, idempotencija (isti `nestpay_oid` dvaput →
  jedna porudžbina).
- **Test okruženje, ubrzano:** serija sa `RecurringFrequencyUnit=D` (dnevno) preko
  postojeće admin test stranice → za 2-3 dana se vidi ceo život pretplate: naplata,
  produženje pristupa, fiskalni račun, otkazivanje, neuspela naplata (testna kartica sa
  CVC 510 daje odbijanje).
- **Produkcija:** tek kad banka pregleda link i odobri aktivaciju.

## Rizici

| Rizik | Odgovor |
|---|---|
| Poll ne radi → rate nefiskalizovane | Sentry alarm + `cron_runs` zapis; ručni pokretač u adminu |
| Duplo obrađena naplata | `unique` na `orders.nestpay_oid` |
| Kartica istekne usred serije | Mejl polaznici; pristup istekne sam; nastavak novom kupovinom |
| Polaznica brzo pređe gradivo i stane posle 6 rata | Svesno prihvaćeno: stvarni problem je neaktivnost, a ne prebrzo završavanje |
| Fiskalizacija 12 računa umesto 1 | Nema tehničke prepreke; trošak po računu zanemarljiv |

## Van obima ove runde

- **1:1 mesečni paketi kao prava pretplata.** Odluke su već donete i čekaju drugu rundu:
  profesorka može da zaustavi obnovu iz svog panela; serija 12 naplata; neiskorišćeni
  časovi se prenose najviše mesec dana.
- **PayPal Subscriptions** za inostranstvo (zaseban kanal, ista pozadina).
- **Ostali video paketi i pojedinačni nivoi** na rate.
- **Membership proizvod** - kad se odluči šta je, koristi isti mehanizam.
