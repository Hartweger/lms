-- NH Academy Generacija II - jednokratni proizvod (12-nedeljni program, 30.9.-16.12.2026).
-- Prodajna stranica je na natasahartweger.rs/academy, checkout ovde.
--
-- Kategorija 'program' je NOVA i namerno bez posebnog ponašanja u kodu:
--   'usluga'     -> CheckoutForm množi cenu brojem strana (prevod sudskog tumača)
--   'membership' -> pretplata (planForSlug), 'mesecni'/'individualni'/'paket' -> product_variants
--   'grupni'     -> grant-access raspoređuje polaznika u grupu po nivou
-- Nijedno od toga Academy-ju ne treba, pa 'program' pada na podrazumevano:
-- jednokratna kupovina karticom, cena kakva u bazi piše.
--
-- course_type mora biti video|individual|group (courses_course_type_check) -> 'video'.
--
-- Bez course_unlocks: program se ne odvija na platformi. grant-access.ts tada
-- dodeljuje pristup samom proizvodu (fallback grana sa console.warn) - to je
-- dovoljno da kupovina ostane evidentirana i da polaznica vidi stavku u nalogu.
--
-- CENA: u bazi stoji REDOVNA (82.900 RSD ~ 690 EUR). Rani upis (58.900 ~ 490 EUR)
-- ide kuponom koji sam ističe 20.9. u ponoć. Namerno tako, a ne obrnuto: ako se
-- zaboravi izmena posle roka, najgore što se desi je da stranica prikazuje staru
-- cenu - naplata je već zaštićena. Da je u bazi niža cena, zaborav bi značio da se
-- program prodaje 24.000 RSD jeftinije neograničeno.

insert into public.courses
  (title, slug, description, course_type, category, price, is_published, is_purchasable)
values
  ('NH Academy - Generacija II',
   'nh-academy-gen2',
   'Dvanaestonedeljni program za edukatorke i žene koje kreću online: ponuda i cene, lični brend, sajt i mejling lista, sadržaj, oglasi i finansije. Susreti sredom u 19:30, od 30.9. do 16.12.2026. Uključeno: snimci, zajednica na platformi, NH Membership do kraja programa i okupljanje uživo u decembru.',
   'video', 'program', 82900, true, true)
on conflict (slug) do nothing;

-- Rani upis: 82.900 - 24.000 = 58.900 RSD. Vezan za tačno ovaj proizvod
-- (applies_to_course_id) da ne može da se prenese na druge kurseve.
-- max_uses 15 = ukupan broj mesta u generaciji.
-- expires_at je 20.9.2026. 23:59:59 po srpskom vremenu (CEST = UTC+2).
insert into public.coupons
  (code, discount_type, amount, expires_at, is_active, max_uses, applies_to_course_id)
select
  'RANIUPIS', 'fixed', 24000, '2026-09-20 21:59:59+00', true, 15, c.id
from public.courses c
where c.slug = 'nh-academy-gen2'
on conflict (code) do nothing;
