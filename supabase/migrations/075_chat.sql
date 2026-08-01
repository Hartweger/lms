-- Chat zajednice NH Membership. Vidljivost: samo aktivne članice (funkcija
-- je_aktivna_clanica iz 074) - pristup se gasi sam kad pretplata istekne.
-- Poruke NASLEĐUJU vidljivost kanala (obrazac 067): subquery na chat_kanali
-- radi pod RLS-om upitivača, pa logika članstva stoji na jednom mestu.
-- Realtime: prvi put u projektu - tabela poruka ide u supabase_realtime
-- publikaciju; postgres_changes poštuje RLS po pretplatniku.

create table public.chat_kanali (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  naziv text not null,
  opis text not null default '',
  samo_admin_pise boolean not null default false,
  sort int not null default 0
);

create table public.chat_poruke (
  id uuid primary key default gen_random_uuid(),
  kanal_id uuid not null references public.chat_kanali(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ime text not null,                 -- denormalizovano: bez join-a pri prikazu
  tekst text not null check (char_length(tekst) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index chat_poruke_kanal_idx on public.chat_poruke (kanal_id, created_at desc);

alter table public.chat_kanali enable row level security;
alter table public.chat_poruke enable row level security;

create policy chat_kanali_select_clanice
  on public.chat_kanali for select
  using (public.je_aktivna_clanica(auth.uid()));

-- Poruke: vidljivost nasleđena od kanala (067 obrazac).
create policy chat_poruke_select_kanal
  on public.chat_poruke for select
  using (exists (select 1 from public.chat_kanali k where k.id = chat_poruke.kanal_id));

-- Pisanje: svoj red + vidljiv kanal + poštuj samo_admin_pise (Novosti).
create policy chat_poruke_insert_own
  on public.chat_poruke for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.chat_kanali k
      where k.id = chat_poruke.kanal_id
        and (
          not k.samo_admin_pise
          or (select role from public.user_profiles where id = auth.uid()) = 'admin'
        )
    )
  );

-- Admin briše neprimerene poruke (kroz service-role ili direktno).
create policy chat_poruke_delete_admin
  on public.chat_poruke for delete
  using ((select role from public.user_profiles where id = auth.uid()) = 'admin');

insert into public.chat_kanali (slug, naziv, opis, samo_admin_pise, sort) values
  ('novosti',  'Novosti',          'Nove lekcije, AI promptovi i najave - objavljuje Nataša.', true,  0),
  ('pitanja',  'Pitanja',          'Pitaj bilo šta - Nataša odgovara svakog dana.',            false, 1),
  ('ai-alati', 'AI alati',         'Alati, promptovi i trikovi koje koristiš.',                false, 2),
  ('pohvale',  'Pohvale i uspesi', 'Podeli šta si postigla - slavimo zajedno.',                false, 3);

alter publication supabase_realtime add table public.chat_poruke;
