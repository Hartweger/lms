-- 101_firme_i_dokumenti.sql — kupci pravna lica i brojevi dokumenata
--
-- Firme se pamte po PIB-u, da se pri sledećoj kupovini podaci popune sami.
-- Broj predračuna i fakture je broj narudžbine (npr. 2026-408) - isti broj prati
-- kupovinu od predračuna do fakture, kako je i do sad rađeno ručno. Kad firma
-- šalje više polaznika, dokument nosi broj PRVE narudžbine u grupi.

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  pib text not null unique,
  maticni_broj text,
  naziv text not null,
  adresa text,
  email text,
  created_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists billing_email text,
  add column if not exists company_order_group uuid,
  add column if not exists predracun_broj text,
  add column if not exists predracun_sent_at timestamptz,
  add column if not exists faktura_broj text,
  add column if not exists faktura_sent_at timestamptz;

create index if not exists orders_company_order_group_idx
  on public.orders (company_order_group);

-- Tabela je isključivo admin/service-role. RLS je uključen bez ijedne politike,
-- pa anon i authenticated ne vide ništa.
alter table public.companies enable row level security;
