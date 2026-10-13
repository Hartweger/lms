-- (Na prod primenjeno 8.8.2026 kao 085_push_pretplate; fajl prenet sa grane gen2-kanal-push
-- pod novim brojem jer su 083-085 u main-u zauzeti.)
-- Web Push pretplate + vodostaj obaveštenja po (kanal, korisnik).
--
-- push_pretplate: endpoint je primarni ključ jer ista osoba ima više uređaja,
-- a isti uređaj ne sme da se upiše dvaput. Cron čita service_role ključem
-- (zaobilazi RLS); članica vidi i briše samo svoje redove.
--
-- chat_obavestenja: DVA odvojena vodostaja. push_do se pomera i kad push nije
-- poslat (nema pretplate), da prozor pretrage poruka ne raste beskonačno;
-- mejl_do se pomera tek kad mejl ode ili kad je push uspeo - tako mejl pokriva
-- baš one koje push nije stigao.

create table public.push_pretplate (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  poslednja_greska text
);

create index push_pretplate_user_idx on public.push_pretplate (user_id);

alter table public.push_pretplate enable row level security;

create policy push_pretplate_select_own
  on public.push_pretplate for select
  using (auth.uid() = user_id);

create policy push_pretplate_insert_own
  on public.push_pretplate for insert
  with check (auth.uid() = user_id);

create policy push_pretplate_delete_own
  on public.push_pretplate for delete
  using (auth.uid() = user_id);

create table public.chat_obavestenja (
  kanal_id uuid not null references public.chat_kanali(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  push_do timestamptz not null default now(),
  mejl_do timestamptz not null default now(),
  primary key (kanal_id, user_id)
);

-- Bez polisa za authenticated: tabelu dira isključivo cron service_role
-- ključem. RLS uključen da anon/authenticated ne mogu ništa (default deny).
alter table public.chat_obavestenja enable row level security;
