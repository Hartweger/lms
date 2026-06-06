# Blok B+C — Plaćanja: NestPay kartice + rate Intesa + Fiscomm fiskalizacija

Datum: 2026-06-06
Status: spec za pregled

## Cilj

Novi sajt trenutno prima samo `uplatnica` (RS) i `paypal` (ino), oba uz ručnu potvrdu admina. Treba dodati:
- **Kartice (NestPay 3D Secure)** kroz Banca Intesa — instant naplata + automatski pristup
- **Plaćanje na rate** (Banca Intesa) — isti tok, banka nudi rate na svojoj strani
- **Fiskalizacija (Fiscomm PURS)** — fiskalni račun po svakoj uspešnoj naplati karticom i PayPal-om, sa PDV 0% (inostranstvo) / 20% (Srbija)

Logika se verno preuzima sa živog WP-a (`hartweger.rs`): plugin `wc-serbian-nestpay` (open-source, `oblakstudio/woocommerce-nestpay`) i `fiscomm-purs-e-fiscalisation`.

## Postojeće stanje (referenca)

- `/kupovina/[slug]` + `CheckoutForm.tsx` — forma (ime, email, zemlja), bira `uplatnica`/`paypal`
- `POST /api/orders` — kreira `orders` red (status „čeka uplatu"), nalazi/kreira korisnika, šalje mejl
- `/admin/narudzbine` „Potvrdi uplatu" → ručno dodeljuje pristup
- `order-utils.ts` — `EUR_RATE`, `PAYPAL_SURCHARGE`, `BANK_DETAILS`, `generateOrderNumber()`

## Produkcijska NestPay konfiguracija (sa živog sajta, WC API)

- Gateway: Banca Intesa, `payment_url = https://bib.eway2pay.com/fim/est3Dgate`, `api_url = https://bib.eway2pay.com/fim/api`
- `merchant_id (clientid) = 13IN002739`, `store_type = 3d_pay_hosting`, `store_transaction = Automatic`, valuta RSD → **ISO 941**
- Test gateway: `https://testsecurepay.eway2pay.com/fim/est3Dgate`

> 🔒 **Tajne** (`username`, `password`/`store_key`, test varijante) NE idu u kod ni u ovaj spec — isključivo u Vercel env varijable. Vrednosti se izvlače iz WC `payment_gateways` API-ja / Intesa merchant naloga pri implementaciji.

### Env varijable (nove)
```
NESTPAY_MERCHANT_ID=13IN002739
NESTPAY_USERNAME=...
NESTPAY_STORE_KEY=...           # = password u plugin podešavanjima
NESTPAY_PAYMENT_URL=https://bib.eway2pay.com/fim/est3Dgate
NESTPAY_API_URL=https://bib.eway2pay.com/fim/api
NESTPAY_CURRENCY=941
FISCOMM_API_URL=...
FISCOMM_API_KEY=...             # iz Fiscomm naloga / plugin podešavanja
```

## NestPay protokol (verno iz `wc-serbian-nestpay`, hashAlgorithm `ver2`)

### Odlazni zahtev (kupovina) — auto-submit forma na `payment_url`
Polja (hidden inputs, POST):
`clientid, amount, okUrl, failUrl, shopurl, trantype, currency, rnd, storetype=3d_pay_hosting, hashAlgorithm=ver2, lang=sr, oid, encoding=UTF-8, hash` + opciono `BillToName/email/tel`.

- `amount` = total zaokružen na 2 decimale, tačka kao separator, bez hiljada (`number_format(round(total,2),2,'.','')`)
- `currency` = 941 (RSD)
- `oid` = naš `order_number`
- `rnd` = 18-znakovni random string
- `trantype` = `Auth` (digitalni proizvodi ne traže processing; ekvivalent `needs_processing()===false`)
- `okUrl` = `failUrl` = naša callback ruta (vidi dole)

### Request hash (ver2)
```
string = merchant_id|order_id|order_total|success_url|failure_url|transaction_type||random_string||||currency_code|store_key
hash   = base64( sha512_binary(string) )      // base64_encode(pack('H*', hash('sha512', string)))
```
(Prazna polja između su namerna — tačan raspored iz plugina.)

### Dolazni odgovor (callback) — banka POST-uje na okUrl/failUrl
Verifikacija potpisa:
```
polja = vrednosti polja navedenih u HASHPARAMS (pipe-lista naziva)
string = implode('|', polja) + '|' + store_key
hash   = base64( sha512_binary(string) )
validno = (hash === HASH iz odgovora)
```
- Uspeh: `ProcReturnCode === '00'` → narudžbina `paid` + grant pristupa + fiskalizacija + mejl
- Inače: `failed`, poruka kupcu (kartica nije naplaćena)
- Idempotencija: ako je narudžbina već `paid`, ne obrađivati ponovo (banka može poslati duplikat)
- **Hardening (ODLUČENO — uvodi se, preko WP baseline-a):** WP v1.2.2 radi samo browser-callback + hash. Mi dodajemo:
  1. **Server-side `query`** ka NestPay API-ju (`Nestpay_Client` XML, `<ORDERSTATUS>QUERY</ORDERSTATUS>`) po callback-u `00` — nezavisna potvrda da je transakcija stvarno naplaćena
  2. **Provera iznosa** — vraćeni/upitani iznos mora == total narudžbine pre grant-a
  3. **Reconciliation cron** — periodično prođe „pending kartica" narudžbine starije od X min, pozove `query`, sredi status (hvata kupce koji su platili pa zatvorili browser)

### Rate (Banca Intesa)
Plugin NE šalje `Instalment` parametar — hosted strana sama nudi rate za podobne (Intesa) kartice. Zato „Plati na rate" = **isti tok**; dugme je informativno (ista redirekcija). Nema posebne logike na našoj strani.

## Fiskalizacija (Fiscomm PURS) — verifikovano sa živih narudžbina

Fiscomm je **Virtual PFR** (`vpfr`) povezan sa PURS-om. Na živom WP-u, po uspešnoj kartičnoj/PayPal naplati, plugin pozove Fiscomm API i na narudžbinu upiše (stvarna meta polja sa narudžbine #52693):
- `_referent_document_number` — PFR broj računa (npr. `QQ9JGBJ7-GESE6HO0-335`)
- `_referent_document_dt` — vreme izdavanja (ISO)
- `_vpfr_journal` — pun tekst fiskalnog računa („ФИСКАЛНИ РАЧУН … HARTWEGER …")
- `_verification_url` — PURS provera (`https://suf.purs.gov.rs/v/?vl=…`)
- `_invoice_pdf_url` — PDF računa hostovan na `storage.fiscomm.rs/…/invoices/YYYY/MM/…`
- `_vpfr_is_training_invoice` — prazno = realni račun

Pravila:
- Okida se po **uspešnoj naplati karticom i PayPal-om** (odluka Nataše). Uplatnica se NE fiskalizuje.
- Kartica: automatski u callback handleru po `00`. PayPal: kad admin potvrdi uplatu.
- **PDV je Fiscomm-ova stvar, NE naša.** Na WP-u su cene `prices_include_tax = true`, `total_tax = 0` na svim narudžbinama — WooCommerce NE računa porez. Mi samo prosledimo prodaju (stavke, iznos, podaci kupca) Fiscomm API-ju; Fiscomm radi PDV split i izdaje račun. Bez PDV logike u našem kodu, bez knjigovođe.
- Sačuvati gornjih 5 polja na narudžbini i prikazati kupcu/adminu link na PDF + PURS verifikaciju

### Fiscomm API ugovor (izvučen iz plugina, potvrđen)
- Base: `https://api.fiscomm.rs` (prod) / `https://dev.api.fiscomm.rs` (test) — env `FISCOMM_API_URL`
- Auth: `Authorization: Bearer <FISCOMM_API_KEY>`, JSON
- Izdavanje: `POST /receipt/normal/sale`
  ```json
  { "payments":[{"amount":37000,"type":"card"}],
    "orderNumber":"52693",
    "options":{"OmitQRCodeGen":"1","OmitTextualRepresentation":"1"},
    "items":[{"name":"...","quantity":1,"unitPrice":37000,"labels":["Đ"],"totalAmount":37000}] }
  ```
  - `type`: `card` (NestPay) / `wireTransfer` (uplatnica) — mapiranje metoda
  - `labels`: domaći label (20%) vs ino label (0%) po zemlji; stopa iza labela je u Fiscomm-u (nije naša logika)
- Refund: `POST /receipt/normal/refund` i `POST /receipt/{invoiceNumber}/refund/full`
- Referenca koda: `oblakstudio`-style plugin sa wordpress.org → `src/Services/ApiClient.php`, `src/Transformers/InvoiceTransformer.php`. Detalji u [[reference_fiscomm]].

## Izmene podataka (`orders`)

- `payment_method`: dodati `kartica` i `kartica_rate` (uz postojeće `uplatnica`, `paypal`)
- Nova polja: `nestpay_trans_id`, `nestpay_status` (`charged`/`failed`/`reserved` — kao WP `_nestpay_status`), `nestpay_response` (JSONB sirovi odgovor radi revizije)
- Fiskal (imena prate WP meta): `fiscal_referent_number` (`_referent_document_number`), `fiscal_referent_dt`, `fiscal_journal` (`_vpfr_journal`), `fiscal_verification_url` (`_verification_url`), `fiscal_pdf_url` (`_invoice_pdf_url`), `fiscalized_at`
- Migracija: nova SQL u `supabase/migrations/`

## Komponente / rute (Next.js, App Router)

1. `CheckoutForm.tsx` — dodati dugmad „Plati karticom" i „Plati karticom na rate" (RS); ino ostaje PayPal; RS i dalje ima i uplatnicu
2. `POST /api/orders` — proširiti validaciju (`kartica`, `kartica_rate`); za kartice vraća `{ orderId, redirect: true }` umesto mejla
3. `POST|GET /api/nestpay/start` (ili u thank-you stranici) — gradi potpisanu formu i auto-submit na `payment_url`
4. `POST /api/nestpay/callback` — prima bankin odgovor, verifikuje hash, postavlja status, grant + fiskalizacija + mejl, pa redirect na `/kupovina/hvala/[orderId]`
5. `src/lib/nestpay.ts` — `buildPaymentFields()`, `requestHash()`, `verifyCallbackHash()`, konstante (čista, testabilna jedinica)
6. `src/lib/fiscomm.ts` — `issueFiscalReceipt(order, vatRate)` (izolovan servis)
7. `/kupovina/hvala/[orderId]` — prikaz statusa kartice (uspeh/neuspeh) pored postojećeg uplatnica/PayPal prikaza

## Grananje pristupa

- Kartica (uspeh `00`): instant auto-grant (isti mehanizam koji admin „Potvrdi uplatu" koristi — izdvojiti u `grantAccessForOrder(orderId)` da se deli)
- Uplatnica / PayPal: ostaje ručna potvrda admina (bez izmene)

## Greške i ivice

- Nevažeći hash u callback-u → log (Sentry) + odbij, ne menjaj narudžbinu
- Duplikat callback / već `paid` → no-op (idempotentno)
- Fiscomm pad → narudžbina ostaje `paid` + pristup dat; fiskalizacija u red za retry (ne blokirati pristup kupcu zbog fiskalnog servisa); alarm adminu
- Test mode: env toggle koji bira test gateway URL + test kredencijale

## Testiranje (vitest + ručno)

- Unit: `requestHash()` i `verifyCallbackHash()` protiv poznatih vektora (ver2 sha512/base64); `vatRate(country)`
- Integracioni ručni: test gateway (`testsecurepay.eway2pay.com`) sa test karticom — uspeh, odbijanje, rate
- Smoke posle deploya (postojeći hook)

## Faze isporuke (ODLUČENO — razdvojeno)

**Faza B — Kartice + rate (prvo, ide u produkciju samostalno):**
- `nestpay.ts` (build forme, request hash, callback verify) + hardening (query, provera iznosa, reconciliation cron)
- `/api/orders` proširenje, `/api/nestpay/start`, `/api/nestpay/callback`
- `orders` migracija: `kartica`/`kartica_rate` + NestPay polja
- CheckoutForm dugmad, hvala-strana statusi, grant pristupa
- Treba: `NESTPAY_STORE_KEY` (env)
- Kartice mogu LIVE bez Fiscomm-a (do fiskalizacije, fiskalni račun se izdaje ručno/naknadno kao prelaz)

**Faza C — Fiskalizacija (Fiscomm), posle:**
- `fiscomm.ts` servis + `orders` fiskal polja (migracija)
- Okidanje po uspehu kartica/PayPal, čuvanje 5 fiskal polja, prikaz PDF/PURS linka
- Treba: Fiscomm API kredencijali + dokumentacija
- Kad je gotovo, uključuje se i retroaktivno za narudžbine iz Faze B ako treba

## Van opsega (kasnije, Blok D)

Grupni/individualni checkout, izbor termina/profesora, mesečni paketi, Calendar/Meet — zaseban projekat posle flipa domena.

## Reference

- Plugin (kartice): https://github.com/oblakstudio/woocommerce-nestpay — `lib/WooCommerce/Gateway/Nestpay_Gateway.php` (request + ver2 hash), `Nestpay_Response.php` (callback hash, ProcReturnCode), `Nestpay_Client.php` (capture/void/refund XML API)
- Fiskalizacija: `fiscomm-purs-e-fiscalisation` (na WP-u) + Fiscomm API dokumentacija
