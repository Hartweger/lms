-- Konsultacija sa Natašom (90 min) - jednokratna usluga, prodaje se preko
-- natasahartweger.rs/konsultacija, a naplata ide ovde (kartica + fiskalni račun).
--
-- Kategorija 'konsultacija' je NOVA i namerno bez posebnog ponašanja u kodu:
--   'usluga'     -> CheckoutForm i /api/orders množe cenu brojem strana (prevod
--                   sudskog tumača). Konsultacija se NE naplaćuje po strani, pa
--                   ne sme da nasledi tu granu.
--   'membership' -> pretplata, 'mesecni'/'individualni'/'paket' -> product_variants
--   'grupni'     -> grant-access raspoređuje polaznika u grupu po nivou
-- Ništa od toga ne treba, pa nova kategorija pada na podrazumevano: jednokratna
-- kupovina, cena kakva u bazi piše. Isti pristup kao 'program' (migracija 081).
--
-- course_type mora biti video|individual|group (courses_course_type_check) -> 'video'.
--
-- is_published = true je OBAVEZNO, ne izbor: RLS politika „Anyone can read published
-- courses" daje anon pristup samo objavljenim redovima, pa bi sa false checkout stranica
-- kupca preusmerila na /kursevi (proizvod za nju ne postoji). Da objavljivanje ne bi
-- napravilo tanku stranicu na školskom sajtu: /kursevi/konsultacija preusmerava na
-- natasahartweger.rs/konsultacija, a sitemap.ts izbacuje ovu kategoriju.
--
-- Bez course_unlocks: nema sadržaja na platformi. grant-access.ts tada dodeljuje
-- pristup samom proizvodu (fallback sa console.warn), što je dovoljno da kupovina
-- ostane evidentirana u nalogu. Mejl posle uplate je poseban: nosi link za biranje
-- termina umesto poziva na kontrolnu tablu.
--
-- CENA: 17.500 RSD = 150 EUR po kursu 117, isto koliko piše na
-- natasahartweger.rs/konsultacija i u uplatnici sa IPS QR kodom.

insert into public.courses
  (title, slug, description, course_type, category, price, is_published, is_purchasable)
values
  ('Konsultacija sa Natašom Hartweger (90 min)',
   'konsultacija',
   'Video poziv 90 minuta, jedan na jedan: gde si sad, šta te koči, šta prvo da rešiš, koji alati i kojim redom. Snimak poziva ostaje tebi. Termin biraš posle uplate.',
   'video', 'konsultacija', 17500, true, true)
on conflict (slug) do nothing;
