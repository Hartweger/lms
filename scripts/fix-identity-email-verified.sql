-- Blok A / Task 2: osiguraj pouzdano auto-povezivanje Google identiteta
-- sa postojećim migriranim nalozima.
--
-- Problem: migrirani 'email' identiteti imaju identity_data.email_verified = false.
-- To može naterati GoTrue da pri Google prijavi napravi NOVI nalog umesto da
-- spoji postojeći (gubitak course_access). Postavljanjem email_verified = true
-- (nalozi su ionako email_confirm:true na nivou auth.users) povezivanje radi pouzdano.
--
-- SAFETY: ograničeno na korisnike čiji je auth.users.email_confirmed_at postavljen.
-- Time hvatamo SAMO naloge sa stvarno potvrđenim mejlom (migrirani imaju
-- email_confirm:true → email_confirmed_at set), a NE diramo nove registracije
-- koje još nisu potvrdile mejl (za njih je email_verified=false ispravno).
--
-- Pokrenuti u: Supabase Dashboard -> SQL Editor. Idempotentno (može više puta).

-- 1) KOLIKO ce biti pogodjeno (pre izmene):
select count(*) as za_popravku
from auth.identities i
join auth.users u on u.id = i.user_id
where i.provider = 'email'
  and u.email_confirmed_at is not null
  and coalesce((i.identity_data->>'email_verified')::boolean, false) = false;

-- 2) FIX:
update auth.identities i
set identity_data = jsonb_set(i.identity_data, '{email_verified}', 'true'::jsonb),
    updated_at = now()
from auth.users u
where i.user_id = u.id
  and i.provider = 'email'
  and u.email_confirmed_at is not null
  and coalesce((i.identity_data->>'email_verified')::boolean, false) = false;

-- 3) VERIFIKACIJA (mora biti 0):
select count(*) as preostalo_false
from auth.identities i
join auth.users u on u.id = i.user_id
where i.provider = 'email'
  and u.email_confirmed_at is not null
  and coalesce((i.identity_data->>'email_verified')::boolean, false) = false;
