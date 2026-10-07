-- Kupovina Gen II otključava i sam program (kanal Gen II gleda course_access za
-- nh-academy-gen2), ne samo biblioteku članstva. Bez ovoga niko osim admina nije
-- video kanal Gen II. Primenjeno na prod 7.10.2026.
insert into course_unlocks (purchasable_course_id, content_course_id)
select c.id, c.id from courses c
where c.slug = 'nh-academy-gen2'
  and not exists (select 1 from course_unlocks u where u.purchasable_course_id = c.id and u.content_course_id = c.id);

-- Dopuna za već dodeljene porudžbine: pristup programu.
insert into course_access (user_id, course_id, expires_at, source)
select distinct o.user_id, g.id, '2027-06-30T23:59:59+02:00'::timestamptz, 'order:' || o.order_number
from orders o
cross join (select id from courses where slug = 'nh-academy-gen2') g
where o.granted and o.user_id is not null
  and o.items::text ilike '%nh-academy-gen2%'
  and not exists (select 1 from course_access ca where ca.user_id = o.user_id and ca.course_id = g.id);

-- Članstvo za polaznice Gen II do kraja programa (23.12.), ranije je stajalo 16.12.
update course_access ca
set expires_at = '2026-12-23T23:59:59+01:00'
from courses c
where ca.course_id = c.id and c.slug = 'nh-clanstvo-sadrzaj'
  and ca.expires_at < '2026-12-23T23:59:59+01:00'
  and ca.user_id in (select ca2.user_id from course_access ca2 join courses c2 on c2.id = ca2.course_id where c2.slug = 'nh-academy-gen2');
