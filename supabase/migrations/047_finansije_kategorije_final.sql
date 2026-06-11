-- 047: Finansije — finalna struktura kategorija troškova (9).
-- 'marketing' se deli na 'oglasi' (ad spend + vođenje kampanja) i 'produkcija-sadrzaja'.

update public.expenses set category = 'oglasi' where category = 'marketing';

alter table public.expenses drop constraint if exists expenses_category_check;
alter table public.expenses add constraint expenses_category_check
  check (category in ('oglasi','produkcija-sadrzaja','provizije','usluge','plate-tim','porezi-doprinosi','alati-hosting','materijali','ostalo'));
