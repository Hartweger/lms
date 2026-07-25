-- 072: razlog otkazivanja mesečnog plaćanja.
-- Pita se u „Moj nalog" u trenutku otkazivanja, jer se posle ne može rekonstruisati.
-- Odgovor je dobrovoljan, pa je NULL („bez odgovora") ravnopravan podatak.
-- Dozvoljene vrednosti su u src/lib/subscription-cancel-reason.ts; baza ih namerno
-- ne zaključava, da dodavanje razloga ne traži migraciju.
alter table subscriptions add column if not exists cancel_reason text;
