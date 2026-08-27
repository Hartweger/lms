-- 102_sef_ulazne_fakture.sql — ulazne fakture povučene sa SEF-a
--
-- NE ulaze u troškove same od sebe: dok Nataša ne izabere kategoriju i ne potvrdi,
-- izveštaji su netaknuti. Zato veza ka `expenses` stoji prazna dok se ne odobri.
create table if not exists public.sef_purchase_invoices (
  id uuid primary key default gen_random_uuid(),
  sef_invoice_id text not null unique,
  cir_invoice_id text,
  broj_dokumenta text,
  dobavljac_naziv text,
  dobavljac_pib text,
  iznos numeric,
  iznos_bez_pdv numeric,
  pdv numeric,
  valuta text default 'RSD',
  datum date,
  rok_placanja date,
  status text,
  expense_id uuid references public.expenses(id) on delete set null,
  zanemarena boolean not null default false,
  raw jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sef_purchase_cekaju_idx
  on public.sef_purchase_invoices (datum desc)
  where expense_id is null and zanemarena = false;

alter table public.sef_purchase_invoices enable row level security;
