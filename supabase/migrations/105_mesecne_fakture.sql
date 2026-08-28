-- 105_mesecne_fakture.sql — fakture koje se ponavljaju svakog meseca
--
-- NAMERNO ODVOJENO OD `orders`: mesečna faktura nema polaznika, nema kurs i ne
-- dodeljuje pristup. Kad bi se gurala kroz narudžbine, tražila bi izmišljenog
-- korisnika i mogla bi da aktivira dodelu pristupa - rizik bez ikakve koristi.
-- Zajedničko sa narudžbinama su čiste funkcije (dokument-podaci, dokument-pdf,
-- sef-ubl), ne tabela.
--
-- Serija brojeva nastavlja Natašinu postojeću (6/2026 -> 7/2026), odvojeno od
-- brojeva narudžbina koji služe fakturama iz prodaje kurseva.
create table if not exists public.recurring_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  opis text not null,
  iznos integer not null,
  dan_u_mesecu int not null default 1 check (dan_u_mesecu between 1 and 28),
  aktivno boolean not null default true,
  napomena text,
  created_at timestamptz not null default now()
);

create table if not exists public.recurring_invoice_runs (
  id uuid primary key default gen_random_uuid(),
  recurring_id uuid not null references public.recurring_invoices(id) on delete cascade,
  period date not null,
  broj text,
  iznos integer not null,
  opis text not null,
  faktura_sent_at timestamptz,
  sef_invoice_id text,
  sef_request_id uuid,
  sef_status text,
  sef_sent_at timestamptz,
  sef_response jsonb,
  created_at timestamptz not null default now(),
  unique (recurring_id, period)
);

create table if not exists public.invoice_series (
  godina int primary key,
  poslednji_broj int not null
);

create or replace function public.sledeci_broj_fakture(p_godina int)
returns int
language plpgsql
as $$
declare
  novi int;
begin
  insert into public.invoice_series (godina, poslednji_broj)
  values (p_godina, 0)
  on conflict (godina) do nothing;

  update public.invoice_series
     set poslednji_broj = poslednji_broj + 1
   where godina = p_godina
  returning poslednji_broj into novi;

  return novi;
end;
$$;

alter table public.recurring_invoices enable row level security;
alter table public.recurring_invoice_runs enable row level security;
alter table public.invoice_series enable row level security;
