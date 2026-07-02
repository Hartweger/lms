# Mesečni pregled honorara u Finansijama + mejl profesorkama

Datum: 2026-07-02
Status: čeka Natašino odobrenje

## Cilj

Nataša na `/admin/finansije` po mesecu vidi, za svaku profesorku: koliko je zaradila,
koliko joj je isplaćeno, koliki je saldo za taj mesec i koliki je ukupan dug danas.
Uz to, dugmetom šalje svakoj profesorki mejl sa njenim ličnim mesečnim obračunom.

## Deo 1: Nove kolone u sekciji „Po profesorkama"

Postojeća sekcija na `/admin/finansije` (reaguje na filter godina/mesec) dobija tri kolone:

| Profesorka | Prihod | Zarađeno | **Isplaćeno** | **Saldo perioda** | **Ukupan saldo danas** | Neto doprinos | Aktivni | Retencija |

Neto doprinos sada = prihod − zarađeno (tj. uključuje i aktivnosti kao trošak,
jer su realan izdatak vezan za profesorku).

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

## Deo 2: Doraditi postojeći mesečni mejl + dugme za ponovno slanje

**Otkriće tokom planiranja:** automatski mesečni mejl profesorkama VEĆ POSTOJI —
`/api/cron/honorari` (1. u mesecu u 8h, vercel.json) šalje `sendHonorarProfEmail`
(časovi, sesije, iznosi, trenutni saldo) + zbirni `sendHonorarSummaryEmail` Nataši.
Zato NE gradimo novi mejl, nego doradimo postojeći i dodamo ručno ponovno slanje.

### 2a. Dorada mejla (`sendHonorarProfEmail` u `src/lib/email.ts`)

Mejl dobija, pored postojećeg:
- odobrene dodatne aktivnosti u mesecu (opis + iznos, ako ih ima)
- isplate u tom mesecu (datum + iznos, ako ih ima) i zbir isplaćenog
- ukupno zarađeno u mesecu sada uključuje aktivnosti

Autorski procenat NE ulazi u mejl (kao ni do sada) — mejl ostaje usklađen sa
saldom sa Obaveza. Stil nepromenjen: ti-forma, „Hartweger tim", obična crtica.

### 2b. Zajednička logika obračuna

Obračun se izvlači iz cron rute u `src/lib/honorar-report.ts`
(`buildMonthlyHonorarReports(year, month)`) — I/O modul po uzoru na
`professor-payable.ts`. Cron ruta i nova admin ruta zovu istu funkciju,
pa automatski i ručni mejl ne mogu da se raziđu.

### 2c. Dugme „Pošalji obračun profesorkama"

- Pored naslova sekcije „Po profesorkama". Aktivno samo kad je izabran konkretan mesec.
- Klik → `confirm` → POST `/api/admin/finansije/posalji-obracun` sa `{ godina, mesec }`.
- Ruta (isti `requireAdmin` guard kao expenses rute) zove `buildMonthlyHonorarReports`
  i šalje mejlove; vraća `{ poslato, preskoceno }` koji se prikaže kao poruka.
- Mesec pokriven istorijskim override-om (`honorari-history.json`, jan–apr 2026)
  se odbija sa objašnjenjem — za te mesece nema pojedinačnih časova u bazi,
  obračun bi bio pogrešan, a mejlovi za njih su davno otišli.

## Rubne situacije

- Profesorka bez ijedne stavke u mesecu (0 časova, 0 aktivnosti, 0 isplata):
  ne dobija mejl (kao i do sada u cron-u), broji se u `preskoceno`.
- Profesorka bez mejla u profilu: preskače se i broji u `preskoceno`.
- Dvostruki klik na dugme: dugme se zaključa dok POST traje; idempotentnost mejlova
  se ne garantuje (ručna akcija sa confirm dijalogom je dovoljna zaštita).

## Testiranje

- Vitest za `finansije.ts`: isplate u/van perioda, aktivnosti u/van perioda, saldo
  perioda, profesorka bez isplata.
- `honorar-report.ts` je I/O modul (bez unit testova, kao `professor-payable.ts`) —
  čista računica ispod njega (`computeHonorar`, `sumActivities`) je već pokrivena.
- Posle deploya: obavezan smoke test (postojeći hook) + ručna provera da se
  „Ukupan saldo danas" slaže sa `/admin/obaveze`.

## Van opsega

- Godišnja mreža meseci (postojeći filter mesec-po-mesec je dovoljan).
- Izmena P&L obračuna (aktivnosti ne ulaze u P&L).
- Neto/porezi — svi iznosi ostaju bruto, kao svuda.
