-- 104_bankovni_izvodi.sql — stavke sa bankovnog izvoda i naučene kategorije
--
-- `fitid` je bankin jedinstven broj transakcije i jedina zaštita od dvostrukog
-- knjiženja - isti izvod sme da se učita više puta.
--
-- Ništa odavde NE ulazi ni u narudžbine ni u troškove samo od sebe. Dok Nataša ne
-- potvrdi, red samo stoji sa statusom `novo`.
create table if not exists public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  fitid text not null unique,
  izvod_broj int,
  racun text,
  smer text not null check (smer in ('priliv','odliv')),
  iznos numeric not null,
  datum date,
  naziv text,
  racun_druge text,
  svrha text,
  sifra text,
  poziv_na_broj text,
  poziv_druge text,
  order_id uuid references public.orders(id) on delete set null,
  expense_id uuid references public.expenses(id) on delete set null,
  status text not null default 'novo'
    check (status in ('novo','upareno','proknjizeno','zanemareno')),
  raw jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bank_tx_ceka_idx
  on public.bank_transactions (datum desc)
  where status = 'novo';

-- Naučena veza „naziv sa izvoda → kategorija troška".
create table if not exists public.expense_rules (
  id uuid primary key default gen_random_uuid(),
  obrazac text not null unique,
  kategorija text not null,
  created_at timestamptz not null default now()
);

alter table public.bank_transactions enable row level security;
alter table public.expense_rules enable row level security;
