-- Prof-kuponi: 10% popusta na individualne pakete od 4/8/12 termina.
--
-- term_packages_only -> kupon važi samo kada je izabrani paket (package_type)
-- jedan od: paket4, paket8, paket12 (individualni 1:1 paketi). Ne važi za
-- mesečne pakete, video kurseve ni jednokratne (package_type IS NULL).
alter table coupons add column if not exists term_packages_only boolean not null default false;

-- Kod po imenu profesorke (IME10), 10%, do kraja leta. Profesorka deli lično,
-- pa nema provere vlasništva, once_per_email ni limita korišćenja.
insert into coupons (code, discount_type, amount, term_packages_only, expires_at, is_active)
values
  ('DANICA10',   'percent', 10, true, '2026-08-31 23:59:59+02', true),
  ('HRISTINA10', 'percent', 10, true, '2026-08-31 23:59:59+02', true),
  ('KATARINA10', 'percent', 10, true, '2026-08-31 23:59:59+02', true),
  ('MARIJA10',   'percent', 10, true, '2026-08-31 23:59:59+02', true),
  ('MILICA10',   'percent', 10, true, '2026-08-31 23:59:59+02', true),
  ('SUZANA10',   'percent', 10, true, '2026-08-31 23:59:59+02', true),
  ('NATASA10',   'percent', 10, true, '2026-08-31 23:59:59+02', true)
on conflict (code) do update set
  discount_type      = excluded.discount_type,
  amount             = excluded.amount,
  term_packages_only = excluded.term_packages_only,
  expires_at         = excluded.expires_at,
  is_active          = excluded.is_active;
