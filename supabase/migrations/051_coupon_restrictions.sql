-- Ograničenja kupona (za NAKI10 i buduće promo kodove):
-- video_only      → kupon važi samo na kurseve sa course_type='video'
--                   (individualni/grupni sa honorarima profesorki ostaju puna cena)
-- once_per_email  → jedan isti mejl može da iskoristi kod samo jednom
alter table coupons add column if not exists video_only boolean not null default false;
alter table coupons add column if not exists once_per_email boolean not null default false;
