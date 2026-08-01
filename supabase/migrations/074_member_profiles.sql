-- Profili članica NH Membership - predstavljanje + imenik vidljiv SAMO
-- aktivnim članicama (i adminu). Vezano za auth.users, za razliku od
-- postojeće "clanice" tabele (prijave sa natasahartweger.rs, service-role only).
-- Aktivna članica = važeći course_access na nh-clanstvo-sadrzaj - isti uslov
-- koji RLS na lessons već koristi (026), pa se pristup gasi sam sa pretplatom.

create table public.member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ime text not null default '',
  delatnost text not null default '',   -- npr. "Profesorka nemačkog"
  bio text not null default '',
  instagram text not null default '',   -- korisničko ime bez @
  web text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.member_profiles enable row level security;

-- Jedan uslov članstva, korišćen u svim polisama ispod.
-- (Namerno funkcija: da se logika ne kopira u 075_chat polise.)
create or replace function public.je_aktivna_clanica(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.course_access ca
    join public.courses c on c.id = ca.course_id
    where ca.user_id = uid
      and c.slug = 'nh-clanstvo-sadrzaj'
      and (ca.expires_at is null or ca.expires_at > now())
  )
  or exists (
    select 1 from public.user_profiles up
    where up.id = uid and up.role = 'admin'
  );
$$;

create policy member_profiles_select_clanice
  on public.member_profiles for select
  using (public.je_aktivna_clanica(auth.uid()));

create policy member_profiles_insert_own
  on public.member_profiles for insert
  with check (auth.uid() = user_id and public.je_aktivna_clanica(auth.uid()));

create policy member_profiles_update_own
  on public.member_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
