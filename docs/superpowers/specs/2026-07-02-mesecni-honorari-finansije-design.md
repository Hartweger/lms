# Mesečni pregled honorara u Finansijama + mejl profesorkama

Datum: 2026-07-02
Status: čeka Natašino odobrenje

## Cilj

Nataša na `/admin/finansije` po mesecu vidi, za svaku profesorku: koliko je zaradila,
koliko joj je isplaćeno, koliki je saldo za taj mesec i koliki je ukupan dug danas.
Uz to, dugmetom šalje svakoj profesorki mejl sa njenim ličnim mesečnim obračunom.

## Deo 1: Nove kolone u sekciji „Po profesorkama"

Postojeća sekcija na `/admin/finansije` (reaguje na filter godina/mesec) dobija tri kolone:

| Profesorka | Prihod | Zarađeno | **Isplaćeno** | **Saldo perioda** | **Ukupan saldo danas** | Aktivni | Retencija |

- **Zarađeno** (dosadašnja kolona „Honorar", preimenovana): časovi + sesije + autorski
  procenat + **odobrene aktivnosti** (`professor_activities`, `status='odobreno'`,
  `activity_date` u periodu). Aktivnosti ulaze SAMO u ovu tabelu, ne u P&L brojke.
- **Isplaćeno**: zbir `professor_payments.amount` gde `payment_date` pada u izabrani period.
- **Saldo perioda**: Zarađeno − Isplaćeno. Pozitivno se boji crveno (još se duguje).
- **Ukupan saldo danas**: kumulativni saldo iz postojećeg `loadPayables()`
  (`src/lib/professor-payable.ts`) — ista brojka kao na `/admin/obaveze`. Ne zavisi od filtera.

Napomena ispod tabele objašnjava razliku: „Ukupan saldo danas" ne uključuje autorski
procenat video kurseva (obračunava se kao na Obavezama), dok „Zarađeno" uključuje.

### Izmene po fajlu

1. `src/lib/finansije.ts`
   - `FinInput` dobija `payments: { professor_id, payment_date, amount }[]` i
     `activities: { professor_id, activity_date, amount }[]` (samo odobrene, filtrira page).
   - `ProfRow` dobija `aktivnosti`, `isplaceno`, `saldoPerioda`.
   - Ostaje čista funkcija bez I/O.
2. `src/app/admin/finansije/page.tsx`
   - Dva nova upita: `professor_payments` (cela istorija — filtriranje po periodu radi
     `buildFinansije`) i `professor_activities` (status `odobreno`).
   - Poziv `loadPayables()` → mapa `professor_id → ukupanSaldo`, prosleđuje se klijentu.
3. `src/app/admin/finansije/FinansijeClient.tsx`
   - Tri nove kolone u tabeli „Po profesorkama", isti stil (din format, crveno za dug).

## Deo 2: Dugme „Pošalji pregled profesorkama"

- Dugme pored naslova sekcije „Po profesorkama". Aktivno samo kad je izabran konkretan
  mesec (ne „cela godina").
- Klik → potvrda (`confirm`) → POST `/api/admin/finansije/posalji-preglede`
  sa `{ godina, mesec }`.
- Ruta (admin-only, isti guard kao ostale admin rute):
  1. Ponovo obračuna mesečne podatke po profesorki (server je izvor istine, ne klijent).
  2. Za svaku profesorku sa bar jednom stavkom u mesecu (zarađeno > 0 ili isplaćeno > 0)
     šalje mejl na njen nalog-mejl.
  3. Vraća rezime `{ poslato: n, preskoceno: m }` koji se prikaže u toastu/poruci.
- Mejl: nova funkcija `sendProfMonthlyReportEmail` u `src/lib/email.ts`, po uzoru na
  postojeći `sendPaymentEmail` (isti Resend setup, isti vizuelni stil, ti-forma,
  potpis „Hartweger tim", obična crtica).
- Sadržaj mejla (samo njeni podaci, bruto iznosi):
  - broj individualnih časova i iznos
  - broj grupnih sesija i iznos
  - odobrene dodatne aktivnosti (opis + iznos, ako ih ima)
  - autorski procenat (ako ga ima)
  - ukupno zarađeno u mesecu, isplaćeno u mesecu (sa datumima isplata)
  - trenutni ukupan saldo
- Nema automatskog crona — slanje je isključivo ručno. Cron eventualno kasnije,
  kad se ritam ustali.

## Rubne situacije

- Meseci jan–apr 2026 koriste istorijski override (`honorari-history.json`) za zarađeno —
  kolone Isplaćeno/Saldo rade i za njih (isplate su u bazi), ali mejl-dugme šalje
  sažetiju verziju bez broja časova (nema pojedinačnih časova za te mesece).
- Profesorka bez mejla u profilu: preskače se i broji u `preskoceno`.
- Dvostruki klik na dugme: dugme se zaključa dok POST traje; idempotentnost mejlova
  se ne garantuje (ručna akcija sa confirm dijalogom je dovoljna zaštita).

## Testiranje

- Vitest za `finansije.ts`: isplate u/van perioda, aktivnosti u/van perioda, saldo
  perioda, profesorka bez isplata.
- Vitest za čistu funkciju koja gradi sadržaj mejla (bez slanja).
- Posle deploya: obavezan smoke test (postojeći hook) + ručna provera da se
  „Ukupan saldo danas" slaže sa `/admin/obaveze`.

## Van opsega

- Automatski mesečni cron za slanje.
- Godišnja mreža meseci (postojeći filter mesec-po-mesec je dovoljan).
- Izmena P&L obračuna (aktivnosti ne ulaze u P&L).
- Neto/porezi — svi iznosi ostaju bruto, kao svuda.
