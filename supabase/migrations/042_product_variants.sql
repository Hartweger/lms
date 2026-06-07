-- 042: product_variants (cene individualnih kurseva po profesorki/paketu).
-- Definicija je iz nikad-primenjene migracije 021; ovde se kreira stvarno na bazi.

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id),
  professor_id uuid references public.user_profiles(id),
  package_type text,
  price int not null,
  paypal_price_eur int,
  is_active boolean not null default true
);

create index if not exists idx_product_variants_course on public.product_variants(course_id);

alter table public.product_variants enable row level security;

drop policy if exists "Anyone can read active product variants" on public.product_variants;
create policy "Anyone can read active product variants"
  on public.product_variants for select
  using (is_active = true);

drop policy if exists "Admins can do anything with product variants" on public.product_variants;
create policy "Admins can do anything with product variants"
  on public.product_variants for all
  using (exists (
    select 1 from public.user_profiles
    where user_profiles.id = auth.uid() and user_profiles.role = 'admin'
  ));

-- Osveži PostgREST schema cache (da supabase-js odmah vidi tabelu).
notify pgrst, 'reload schema';
