-- Ispravka uz 081, posle provere checkouta uživo.
--
-- 1) KUPON SE NE PRIMENJUJE SAM. CheckoutForm (linija ~144) validira kupon iz
--    URL-a samo ako je mejl već poznat: `if (initialEmail.trim()) validateCoupon(...)`.
--    Anonimna posetiteljka dobije kod upisan u polje, ali cenu punu dok ne klikne
--    „Primeni". Kupac koji dolazi sa dugmeta „57.300 RSD" video bi 80.700 - to
--    obara konverziju u kampanji. Gate postoji s razlogom (kuponi vezani za mejl
--    bi inače prikazali popust koji /api/orders kasnije odbije), pa se ne dira kod
--    naplate zbog jedne kampanje.
--
--    Zato: cena u bazi = cena ranog upisa, a posle 20.9. se menja jednim UPDATE-om.
--    Kupon RANIUPIS se GASI - da se popust ne primeni dvaput (57.300 - 24.000).
--
-- 2) KURS EVRA je 117 RSD (src/lib/order-utils.ts, EUR_RATE). Checkout je zato
--    za 82.900 prikazivao 709€, a dogovorena ponuda je 690€. Iznosi su usklađeni
--    tako da su okrugli u obe valute:
--      57.300 / 117 = 490€  (rani upis)
--      80.700 / 117 = 690€  (redovna)
--
-- POSLE 20.9.2026. URADITI:
--   update public.courses set price = 80700 where slug = 'nh-academy-gen2';
--   i izmeniti cene u tekstu na natasahartweger.rs/academy.

update public.courses
set price = 57300
where slug = 'nh-academy-gen2';

update public.coupons
set is_active = false
where code = 'RANIUPIS';
