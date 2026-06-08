# Admin „Nova narudžbina" — slanje podataka za uplatu kupcu

**Datum:** 2026-06-09
**Status:** Design / spec za pregled

## Problem

Kad admin (Nataša) ručno napravi narudžbinu (`/admin/narudzbine` → „Nova narudžbina"), kupac **ne dobije nikakve podatke za uplatu** — ni uplatnicu sa kodom, ni PayPal, ni karticu. Na starom WP-u je admin mogao da pošalje kupcu podatke za uplatu (uplatnica sa pozivom na broj / kartica / PayPal). Kupčev self-checkout (`/api/orders`) već šalje te podatke; admin-kreirane narudžbine ne.

## Šta već postoji (ne dirati)

- `sendPaymentInstructionsEmail(to, name, courseTitle, orderNumber, totalRsd, paymentMethod, paypalEur?)` — šalje uplatnicu ili PayPal. **Uplatnica već sadrži poziv na broj = `orderNumber`**, primaoca, račun `170-10559767000-18`, iznos, svrhu, šifru 189.
- `/kupovina/kartica/[orderId]` — radna stranica za plaćanje karticom postojeće narudžbine (zahteva `payment_method ∈ {kartica, kartica_rate}`).
- `calculatePaypalEur(total)` — iznos za PayPal (sa 12% dodatkom).
- `SITE_URL` (`src/lib/site-url.ts`) — bazni domen.

## Odluke (Nataša, 2026-06-09)

- „Račun" = **uplatnica (banka)** sa podacima + poziv na broj. NE PDF faktura.
- Poziv na broj = **broj narudžbine** (npr. `2026-022`). Bez modela 97.
- Mesto: **čekboks pri kreiranju + dugme „Pošalji podatke za uplatu" na postojećim** `pending` narudžbinama.

## Dizajn

### 1. Mejl — dodati metodu „kartica"
`sendPaymentInstructionsEmail`: proširiti `paymentMethod` na `"uplatnica" | "paypal" | "kartica"` i dodati opcioni `orderId`.
- `kartica` blok: dugme **„Plati karticom"** → `${SITE_URL}/kupovina/kartica/${orderId}`.
- `uplatnica` i `paypal` blokovi nepromenjeni.

### 2. „Nova narudžbina" forma (`NarudzbineClient.tsx`)
- Meni metode: dodati **`Kartica`** (sad samo Uplatnica/PayPal).
- Čekboks **„Pošalji kupcu podatke za uplatu"** — podrazumevano `true`; bez efekta kad je „Označi kao plaćeno" uključeno.
- Poslati `sendPaymentEmail: boolean` u API.

### 3. API `/api/admin/orders` (POST)
- Posle `insert` narudžbine (pending), ako je `sendPaymentEmail && !markAsPaid`:
  - `paypal` → `calculatePaypalEur(total)`,
  - `kartica` → proslediti `order.id` za link,
  - pozvati `sendPaymentInstructionsEmail(...)` sa `order.payment_method`.
- Best-effort: greška u slanju mejla ne ruši kreiranje (log + nastavi).

### 4. Dugme na postojećim narudžbinama
- Nov endpoint **`POST /api/admin/orders/[id]/send-payment`** (admin-only): učita narudžbinu, pošalje `sendPaymentInstructionsEmail` za **njenu** `payment_method` (uplatnica→uplatnica, kartica→link, paypal→paypal+EUR).
- U `NarudzbineClient`: dugme „Pošalji podatke za uplatu" na svakoj `pending` narudžbini → poziva endpoint, prikaže potvrdu.

### Pravilo konzistentnosti
Metoda mejla = `payment_method` narudžbine (kartica-link radi samo za „kartica" narudžbine). Admin bira metodu pri kreiranju.

## Van opsega (YAGNI)
PDF profaktura; model 97 / kontrolni broj; biranje druge metode pri ponovnom slanju; izmena metode postojeće narudžbine kroz ovo dugme.

## Rizici
- `kartica` narudžbina mora imati `payment_method="kartica"` da bi link radio — pokriveno pravilom konzistentnosti.
- Slanje mejla je best-effort; ako Resend padne, narudžbina i dalje nastaje (admin može „ponovo pošalji").
- Zahteva deploy (serverski kod). Postoji aktivan paralelni WIP u repou — deploy koordinisati.
