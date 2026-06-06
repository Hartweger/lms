-- supabase/migrations/033_user_progress.sql
-- Trajni napredak korisnika: srca, nivo, niz dana.
create table if not exists public.user_progress (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  total_hearts     integer not null default 0,
  level            integer not null default 1,
  current_streak   integer not null default 0,
  longest_streak   integer not null default 0,
  last_active_date date,
  hearts_today     integer not null default 0,
  updated_at       timestamptz not null default now()
);

alter table public.user_progress enable row level security;

-- Korisnik može da ČITA samo svoj red.
drop policy if exists "user_progress_select_own" on public.user_progress;
create policy "user_progress_select_own"
  on public.user_progress for select
  using (auth.uid() = user_id);

-- Bez insert/update polisa za authenticated → pisanje ide samo preko service-role
-- (API ruta /api/hearts/award), što sprečava varanje sa klijenta.
