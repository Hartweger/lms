# SEF e-Fakture i prodaja firmama — dizajn

Datum: 26.08.2026.

## Problem

Kad firma kupi kurs, sve ide ručno. Nataša napravi narudžbinu u adminu, zatim u
zasebnoj Google tabeli (cenovnik + „🧾 Hartweger → Faktura kreirati") popuni
podatke firme i stavke, izbaci dokument, pošalje ga mejlom, čeka uplatu, pa ručno
ukuca fakturu u SEF-ovu web formu.

Sistem uopšte ne zna šta je firma — `orders` nema PIB, ni naziv, ni odvojen mejl
za računovodstvo. Tabela i baza ne znaju jedna za drugu, pa se cene i nazivi
kurseva održavaju na dva mesta.

SEF je u kodu prisutan samo kao ručni izuzetak: čekboks „Fiskalizuj račun (ne
čekiraj ako račun ide preko SEF-a)" u `NarudzbineClient.tsx`, uz komentar u
`api/admin/orders/route.ts` da neki računi idu preko SEF-a (odluka 12.06.2026).

Nataša sada ima SEF API ključ, pa taj ručni deo može da nestane.

## Obim

U obimu:

1. Podaci firme na narudžbini, sa pamćenjem firmi za sledeći put
2. Predračun kao PDF, mejlom računovodstvu
3. Faktura kao PDF, po izgledu postojeće Google tabele
4. Slanje te iste fakture na SEF, na izričit klik
5. Praćenje statusa fakture preko SEF webhooka
6. Ulazne fakture iz SEF-a, uz ručno odobrenje pre upisa u troškove

Van obima, namerno:

- Elektronsko evidentiranje PDV-a (vodi knjigovođa)
- Javni checkout za firme — firme idu isključivo kroz admin
- Storno, knjižna odobrenja i zaduženja preko SEF-a
- Avansni računi
- Automatski podsetnici firmama za neplaćen predračun
- Zamena Google tabele za sve ostale namene — ostaje kao cenovnik

## Odluke i zašto

Odluke donete u razgovoru 26.08.2026, sa razlozima — da se kasnije ne preispituju
bez povoda.

**Fiscomm ne može da zameni SEF.** Provereno na celom Fiscomm 2.0 OpenAPI spec-u
(`https://api.fiscomm.rs/docs`): nema nijednog endpointa za e-fakture, UBL ni PIB
kupca. Reč „sef" se pojavljuje samo unutar engleske reči „useful". Fiscomm je čisto
fiskalna kasa i tu ostaje. Piše se zaseban `src/lib/sef.ts`.

**Fiskalizacija ostaje Natašina ručna odluka.** Predlagano je da kod sam odlučuje
(ima PIB → SEF, bez Fiscomma). Odbijeno dvaput, izričito. Čekboks „Fiskalizuj
račun" ostaje tačno kakav je sad. Kod ne sme da menja ponašanje fiskalizacije na
osnovu prisustva PIB-a.

**Slanje na SEF je zaseban klik, ne posledica potvrde uplate.** Iz istog razloga —
Nataša bira i da li i kada.

**Dva dokumenta, jedan broj — broj narudžbine.** Prvo predračun, firma plati, pa
tek onda faktura. Oba nose broj narudžbine (npr. `2026-408`), jer je Nataša tako
radila i ručno: napravi porudžbinu na sajtu i taj broj ide na dokument. Isti broj
prati kupovinu od predračuna do fakture i do zapisa na SEF-u.

Kad firma šalje više polaznika, dokument nosi broj **prve** narudžbine u grupi.

Zaseban brojač je razmatran i odbačen: uvodi drugu seriju brojeva koju treba
usaglašavati sa onim što je već izdato, a `orders.order_number` je već jedinstven
i već raste po godini.

**Predračun nije SEF dokument.** SEF prima fakturu (380), avansni račun (386),
knjižno odobrenje i zaduženje. Predračun se šalje van SEF-a, kao PDF mejlom.

**Tri polaznika = tri narudžbine, jedan par dokumenata.** Postojeća mašinerija za
individualne kurseve (`product_variants` → `individual_enrollments` →
`professor_students`) radi po narudžbini i ne dira se. Više polaznika se vezuje
grupom, ne spiskom unutar jedne narudžbine.

**Manje automatike, više Natašine kontrole.** Na svako pitanje o automatizaciji
izabrana je ručna varijanta: bez podsetnika firmama, bez mejlova o odbijenim
fakturama, pristup tek na potvrdu uplate. Kod kuca papire i pamti podatke; šalje
samo na klik.

## Izgled dokumenta

Prati postojeću Google tabelu (`12zZhnw9RGPkGPiS_mBG5Mo_dYvpkCEsJFrBbxZ2-ZJ8`),
tab koji Apps Script generiše. Redosled elemenata:

1. Naslov gore desno: `FAKTURA` ili `PREDRAČUN`, uz `Broj:` (broj narudžbine,
   npr. `2026-408`) i `Datum:`
2. Zaglavlje levo: adresa, `PIB: 108712117 · Banca Intesa: 160-6000001689258-40`,
   `www.hartweger.rs · info@hartweger.rs`
3. Blok `KUPAC / PRIMALAC`: naziv, adresa, PIB, matični broj, mejl
4. Tabela: `OPIS USLUGE | KOL. | CENA BEZ PDV | IZNOS BEZ PDV`
5. Zbir: `Ukupno bez PDV`, `PDV (20%)`, `UKUPNO SA PDV`
6. Napomena (opciono)
7. `Plaćanje: Molimo vas da iznos uplatite u roku od 7 dana.`
8. Podnožje: `HARTWEGER · www.hartweger.rs · info@hartweger.rs · PIB: 108712117`

Dve razlike u odnosu na tabelu:

- **Dodaje se IPS QR kod i poziv na broj**, iz postojećeg `src/lib/ips-qr.ts`.
  Tabela ih nema.
- Broj stavki nije ograničen na šest.

**Cene na stavkama su bez PDV-a**, PDV se dodaje na dnu. Suprotno od sajta, gde su
cene sa uračunatim PDV-om. Prevod: `cena bez PDV = cena sa sajta / 1.20`, isto kao
u cenovniku u tabeli.

**Napomena:** adresa u zaglavlju tabele je `Jurija Gagarina 20k-39, 11070 Beograd`,
a `MERCHANT.adresa` u `src/lib/payment-confirmation.ts` je `Jurija Gagarina 20,
Beograd (Novi Beograd)`. Pre implementacije potvrditi koja je tačna i uskladiti na
jedno mesto.

## Podaci

### Nova tabela `companies`

| kolona | tip | napomena |
|---|---|---|
| `id` | uuid | PK |
| `pib` | text | jedinstven |
| `maticni_broj` | text | |
| `naziv` | text | |
| `adresa` | text | |
| `email` | text | računovodstvo |
| `created_at` | timestamptz | |

Upsert po PIB-u pri čuvanju narudžbine za firmu. Sledeći put se naziv, adresa i
mejl popunjavaju iz naše baze, bez pitanja SEF-u.

### Nove kolone na `orders`

| kolona | tip | napomena |
|---|---|---|
| `company_id` | uuid | null za fizička lica |
| `billing_email` | text | mejl računovodstva; `email` ostaje polaznikov |
| `company_order_group` | uuid | vezuje narudžbine iste kupovine firme |
| `predracun_broj` | text | broj narudžbine, upisan kad je predračun poslat |
| `predracun_sent_at` | timestamptz | |
| `faktura_broj` | text | isti broj; ide i na SEF |
| `faktura_sent_at` | timestamptz | |
| `sef_invoice_id` | text | id fakture na SEF-u |
| `sef_status` | text | poslednji poznati status |
| `sef_sent_at` | timestamptz | |
| `sef_response` | jsonb | sirov odgovor, za dijagnostiku |

Brojevi dokumenata se upisuju na sve narudžbine iste grupe — jedan dokument
pokriva grupu.

Narudžbina je za firmu ako ima `company_id`. To ne utiče na fiskalizaciju.

### Nova tabela `sef_purchase_invoices`

Ulazne fakture koje čekaju pregled: `sef_id`, `dobavljac_naziv`, `dobavljac_pib`,
`broj_fakture`, `datum`, `iznos`, `pdf_url`, `status`, `expense_id` (null dok se ne
odobri), `raw` jsonb.

## Tok

1. Admin → Narudžbine → Nova narudžbina, prekidač „Kupac je firma".
   PIB → autofill iz `companies`. Mejl za fakturu. Kurs, polaznik, profesorka,
   paket — postojeća polja, nepromenjena.
2. „Dodaj polaznika" pravi još jednu narudžbinu sa istim `company_order_group`.
3. Čuvanje → „Pošalji predračun" uzme broj prve narudžbine u grupi, napravi PDF i
   pošalje ga na `billing_email`. Jedan PDF po grupi, sa svim stavkama.
4. Polaznik ne dobija ništa. Narudžbina stoji „Čeka uplatu".
5. „Potvrdi uplatu" → `grantAccessForOrder` po narudžbini, svaki polaznik dobija
   svoj pristup i mejl dobrodošlice.
6. „Izdaj fakturu" uzme isti broj, napravi PDF i pošalje ga na `billing_email`.
7. „Pošalji na SEF" pošalje tu istu fakturu, pod istim brojem. Jedna faktura po
   `company_order_group`.
8. Status stiže webhookom i stoji u redu narudžbine. Bez mejlova.
9. Fiskalizacija — postojeći čekboks, nezavisno od svega gore.

Koraci 6 i 7 su namerno razdvojeni: PDF firmi i zapis na SEF-u su dve stvari i
mogu da se dese u različito vreme.

## Komponente

### `src/lib/sef.ts`

Po uzoru na `src/lib/fiscomm.ts`: ključ iz env-a, jedan modul kao jedina tačka
koja zove SEF.

- `sendSalesInvoice(groupId)` — skupi narudžbine grupe, izgradi UBL 2.1 XML,
  `POST /api/publicApi/sales-invoice/ubl`, upiši `sef_invoice_id` i status.
  Idempotentno: ako narudžbine već imaju `sef_invoice_id`, vrati postojeće.
- `refreshInvoiceStatus(sefInvoiceId)` — pročitaj status sa SEF-a i upiši.
- `fetchPurchaseInvoices(since)` — povuci ulazne fakture u
  `sef_purchase_invoices`.

Env: `SEF_API_URL`, `SEF_API_KEY`. Ključ se ne pulluje i ne piše u kod.
Greške u Sentry, kao kod Fiscomma.

Izgradnja UBL-a je zaseban čist modul (`src/lib/sef-ubl.ts`) bez mrežnih poziva,
da može da se testira jedinično.

### PDF dokumenti

Jedan modul `src/lib/dokument-pdf.ts` pravi oba dokumenta — razlikuju se samo po
naslovu i seriji broja. `jspdf` server-side, po uzoru na
`src/app/api/sertifikat/[id]/route.ts`.

Rute: `/api/admin/predracun/[groupId]` i `/api/admin/faktura/[groupId]`.

Podaci: `MERCHANT` iz `src/lib/payment-confirmation.ts`, firma iz `companies`,
stavke iz narudžbina grupe, IPS QR iz `src/lib/ips-qr.ts`.

Opis usluge se povlači iz naziva kursa u bazi, uz mogućnost izmene pre slanja —
nazivi u cenovniku i u bazi nisu svuda identični.

Probni PDF sa izmišljenom firmom ide Nataši na odobrenje pre puštanja u rad.

### Webhook `/api/sef/webhook`

URL se upisuje u SEF panel, polje „URL za primanje notifikacija o izlaznim
fakturama".

Telu zahteva se ne veruje. Iz njega se uzima samo identifikator fakture, pa se
pravi status čita pozivom ka SEF API-ju (`refreshInvoiceStatus`). Isto načelo kao
kod kartica: istina se traži od izvora.

### Ulazne fakture

Cron jednom dnevno zove `fetchPurchaseInvoices`. U Finansijama novi tab „Ulazne
fakture": dobavljač, broj, datum, iznos, link na PDF. Dugme „Dodaj u troškove"
otvara izbor kategorije i pravi red u `expenses`, pa upisuje `expense_id`. Dok se
ne klikne, izveštaji su netaknuti.

## Testiranje

- Jedinični testovi za `sef-ubl.ts` — ispravan XML za jednu i za više stavki,
  ispravan PDV, ispravni podaci firme.
- Jedinični testovi za grupisanje narudžbina po `company_order_group`.
- Ceo tok prvo na demo okruženju SEF-a, sa odvojenim ključem.
- Na produkciju tek kad demo faktura prođe pun krug: poslata → prihvaćena.
- Posle deploya smoke test na prvoj pravoj fakturi.

## Preduslovi

- Nataša obnavlja SEF API ključ (stari je bio na deljenom snimku ekrana) i
  postavlja novi na Vercel kao `SEF_API_KEY`.
- Potvrditi tačnu adresu za zaglavlje (`20k-39` iz tabele ili `20` iz koda).
- Potvrditi u SEF Swaggeru: postoji li pretraga firme po PIB-u. Ako ne, podaci se
  kucaju ručno prvi put i pamte u `companies`.

## Otvoreno

- Fiscomm 2.0 migracija je zaseban posao, ali dira isti fajl (`fiscomm.ts`).
  Lakše je uraditi je pre ovoga nego posle.
- Google tabela ostaje kao cenovnik. Ako se cene u njoj i u bazi raziđu, faktura
  će uzeti cenu iz baze. Usaglašavanje cenovnika je zaseban posao.
