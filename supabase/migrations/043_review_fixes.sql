-- 043: Code-review ispravke (Etapa 1-3).

-- Fix 1: otkazane grupne sesije ne smeju da se vrate pri osvežavanju termina.
alter table public.group_sessions
  add column if not exists cancelled boolean not null default false;

-- Fix 3: „još 1 čas" mejl se šalje tačno jednom po upisu.
alter table public.individual_enrollments
  add column if not exists one_left_email_sent_at timestamptz;

-- Fix 4: spreči duple aktivne varijacije za istu (kurs × prof × paket).
-- coalesce za package_type (NULL = "" da bi se po-nivou redovi tretirali jedinstveno).
create unique index if not exists uniq_active_variant
  on public.product_variants (course_id, professor_id, (coalesce(package_type, '')))
  where is_active;
