# Analiza korisničkog putovanja (user journey) — novi sajt

**Datum:** 2026-05-31
**Cilj:** „Sve bolje nego postojeće, savršeno za korisnika na lansiranju." Mapiran ceo put od dolaska do ponovne kupovine, sa tačkama trenja po koraku. NestPay/kartice se NE diraju ovde (rade se na kraju, uz prebacivanje domena).
**Izvor:** 6 paralelnih analiza koda (read-only). file:line reference u nalazima; sve treba verifikovati pri implementaciji.

## Koraci putovanja
1. Ulazak (SEO/blog/ads/IG/direktno) → `/` ili `/magazin/[slug]` ili `/kursevi`
2. Početna `/`
3. Istraživanje/odluka: `/besplatno-testiranje`, `/kursevi` katalog, `/kursevi/[slug]`, info stranice
4. Kupovina (bez korpe): `/kupovina/[slug]` → `/api/orders` → `/kupovina/hvala/[orderId]` → uplata → admin potvrda
5. Onboarding: welcome mejl → `/prijava` (blok A ✅) → `/dashboard`
6. Učenje: `/lekcija/[id]` → `/vezba/[id]` → progres → `/sertifikat/[id]`
7. Ponovna kupovina (sledeći nivo)

---

## P1 — kritično (korektnost / blokira „savršeno za korisnika")

1. **Checkout ne prepoznaje ulogovanog kupca** — `kupovina/[slug]/page.tsx` ne učitava sesiju, `CheckoutForm` kreće sa praznim ime/email. Ako ulogovani kupac ukuca DRUGI email → `/api/orders` (route.ts:69-105) napravi/nađe drugi nalog → pristup ode na pogrešno mesto. Ovo je i UX i korektnost bug. → prepuniti i zaključati email za ulogovane, upozorenje ako se razlikuje.
2. **Grupni: izabrana grupa/termin se gube** — `RasporedGrupa.tsx:~122` vodi na generički `/kupovina/grupni-[nivo]`, a `/api/orders` items (route.ts:117-124) ne pamti `group_id`/termin. Kupac plati a niko ne zna koju grupu/termin je izabrao. (BLOK B)
3. **Individualni: izbor profesorke + varijabilna cena ne postoje u toku** — `product_variants` tabela (sa professor_id + cenom) se NIGDE ne čita; cene po profesorki (npr. Nataša skuplja) su nevidljive na `kursevi/[slug]` i `individualni-kursevi`; checkout/orders ne pamti `professor_id`. Kupac ne zna koga/po kojoj ceni plaća. (BLOK B)
4. **Nema obaveštenja kad admin aktivira pristup** — `api/admin/orders/[id]/confirm` šalje welcome mejl, ali tok od „platio" do „znam da mogu da uđem" nije jasan; korisnik ne zna da je pristup živ.

## P2 — visok UX uticaj

5. **Orijentacija/breadcrumb** — `lekcija/[id]` i `vezba/[id]` nemaju vidljiv trag (Početna › Kurs › Modul › Lekcija); navigacija lekcija je skrivena u hamburger draweru.
6. **Dashboard prazno stanje za tek-kupca** — `dashboard/page.tsx:259-272` kaže „Nemaš kurseve" i šalje na spoljni sajt; tek-kupac u periodu pre potvrde misli da nešto ne radi. → „čeka se potvrda uplate" stanje + kontakt.
7. **Rok pristupa nevidljiv** — `expires_at` se filtrira ali se ne prikazuje; istekao kurs → goli 404 na `/lekcija/[id]` umesto „pristup istekao, obnovi".
8. **Profil ne može da postavi lozinku** — `profil/page.tsx` nema set/change password; bitno za one koji su ušli Googleom/magic-linkom (blok A).
9. **Zahvala stranica** — „tri radna dana" gasi entuzijazam; nema CTA „idi na kurseve/dashboard" ni „piši nam ako nemaš pristup".
10. **Placement test slabo konvertuje** — nema nurture serije (lead se doda u MailerLite grupu i tišina); rezultat-mejl se ne šalje iz backend-a; preporuke kurseva blurovane bez emaila. Najveći marketing gubitak.
11. **Navigacija** — fale u meniju: grupni/individualni, cenovnik, profil (ulogovan); „Magazin/blog" pokazuje „uskoro" (proveriti da li su 75 postova objavljeni).

## P3 — poliranje

12. next/prev lekcija i na vrhu (ne samo dno); „prethodna vežba" dugme.
13. Tooltip/opis tipova vežbi; jasno označiti Modelltest kao završni ispit.
14. Upsell sledećeg nivoa na `/sertifikat/[id]` i dashboardu (postoji `preduslov` mapiranje, neiskorišćeno).
15. Hero: jasnija hijerarhija primarnog CTA; skratiti hero tekst.
16. Test QR koda sa srpskim banking aplikacijama; provera PayPal 12% surcharge logike.

## Napomena o tonu (ispravka analize)
Agenti su predložili „ti" formu na auth stranicama. To je u suprotnosti sa pravilom korisnika [[feedback_ti_forma]] — „ti svuda OSIM auth stranica". Auth persiranje je namerno; NE menjati. (Placeholder microcopy se može uskladiti odvojeno.)

## Preslikavanje na blokove
- **BLOK B (grupni/individualni kupovina):** P1 #2, #3 — najveći funkcionalni deo.
- **Brzi cross-cutting fix:** P1 #1 (ulogovan checkout) + P1 #4/#9 (komunikacija pristupa) — mali, visok uticaj.
- **BLOK C (automatizacija):** vezano za #2/#4 (Calendar/Meet, dodela profesora).
- **Konverzija:** #10 (placement test nurture) — može i marketing tim.
- **Orijentacija/učenje:** #5,#7,#12-14.
