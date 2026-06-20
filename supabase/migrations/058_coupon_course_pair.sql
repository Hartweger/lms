-- Par "prerekvizit kurs -> ciljni kurs" za kupone tipa "video kupac dobija
-- popust na 1:1 isti nivo". Generički: koristi se za FSP1NA1, a kasnije za
-- A1/A2/B1 (video -> individualni) bez izmene koda.
--
-- requires_course_id    -> kupon važi samo ako mejl VEĆ poseduje taj kurs
-- applies_to_course_id  -> kupon se sme iskoristiti samo PRI kupovini tog kursa
alter table coupons add column if not exists requires_course_id uuid references courses(id);
alter table coupons add column if not exists applies_to_course_id uuid references courses(id);

-- FSP1NA1: ko ima video FSP (slug 'fsp') kupuje individualni FSP
-- (slug 'fsp-individualni') sa fiksnim popustom = cena videa (5.960 RSD).
insert into coupons (code, discount_type, amount, requires_course_id, applies_to_course_id, once_per_email, is_active)
values (
  'FSP1NA1',
  'fixed',
  5960,
  (select id from courses where slug = 'fsp'),
  (select id from courses where slug = 'fsp-individualni'),
  true,
  true
)
on conflict (code) do update set
  discount_type        = excluded.discount_type,
  amount               = excluded.amount,
  requires_course_id   = excluded.requires_course_id,
  applies_to_course_id = excluded.applies_to_course_id,
  once_per_email       = excluded.once_per_email,
  is_active            = excluded.is_active;
