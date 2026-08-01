-- NH Membership (koncept 1.8.2026, docs/plans/2026-08-01-nh-clanstvo.md).
-- Mesečno članstvo za edukatore: prodajni proizvod + sadržajni kurs + unlock.
-- Kategorija je 'membership' (NE 'mesecni' - ta kategorija na checkoutu
-- učitava product_variants sa profesorima, što članstvu ne treba).
-- Cena 2290 RSD = founding (~19€); pri prelasku na punu cenu menja se
-- courses.price + monthlyRsd u src/lib/subscription-plans.ts - postojeće
-- pretplate zadržavaju stari iznos jer banka zaključava seriju pri kreiranju.

insert into public.courses
  (title, slug, description, course_type, category, price, is_published, is_purchasable)
values
  ('NH Membership',
   'nh-clanstvo',
   'Mesečno članstvo za edukatorke: biblioteka lekcija o brendu, publici i rastu, nova lekcija svakog meseca, zajednica i direktan pristup Nataši.',
   'video', 'membership', 2290, true, true),
  ('NH Membership - biblioteka',
   'nh-clanstvo-sadrzaj',
   'Sadržajni kurs članstva - lekcije se dodaju svakog meseca.',
   'video', 'membership', 0, true, false)
on conflict (slug) do nothing;

insert into public.course_unlocks (purchasable_course_id, content_course_id)
select p.id, c.id
from public.courses p, public.courses c
where p.slug = 'nh-clanstvo' and c.slug = 'nh-clanstvo-sadrzaj'
on conflict (purchasable_course_id, content_course_id) do nothing;
