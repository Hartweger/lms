-- 046: Finansije — proširene kategorije troškova + autorski procenti video kurseva.

alter table public.expenses drop constraint if exists expenses_category_check;
alter table public.expenses add constraint expenses_category_check
  check (category in ('marketing','alati-hosting','provizije','usluge','plate-tim','porezi-doprinosi','materijali','ostalo'));

-- Autorski procenat: profesorka autor kursa dobija % od svake prodaje (od plaćenog iznosa).
create table public.course_royalties (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id),
  professor_id uuid not null references public.user_profiles(id),
  percent numeric(5,2) not null check (percent > 0 and percent <= 100),
  created_at timestamptz not null default now(),
  unique (course_id, professor_id)
);
alter table public.course_royalties enable row level security;
create policy "Admin manage royalties" on public.course_royalties
  for all using (
    (select role from public.user_profiles where id = auth.uid()) = 'admin'
  );

-- Seed: Milica 50% na VIDEO FSP, Katarina 50% na VIDEO Položi FIDE.
insert into public.course_royalties (course_id, professor_id, percent) values
  ('290d07e1-f7d2-4df9-9ead-fd4685607a69', '7e65e4f7-7f77-4a05-8e66-c5d1cce3d12e', 50),
  ('7a9298c0-5168-4c3d-9aa0-f08e870db5cc', 'f555ef90-407d-486b-a288-576d4d461148', 50);
