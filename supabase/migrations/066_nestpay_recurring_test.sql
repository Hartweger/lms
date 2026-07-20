-- 066: log tabela za NestPay RECURRING test (test okruženje banke).
-- Cilj jeftinog testa: empirijski utvrditi da li banka šalje callback i za
-- naplate 2..N recurring serije (vidi docs/ideje/2026-06-18-membership-pretplata-recurring.md).
-- Bez RLS politika: čita/piše samo service-role (admin stranica + callback ruta).
create table if not exists nestpay_test_callbacks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  oid text,
  method text not null,
  hash_valid boolean,
  proc_return_code text,
  trans_id text,
  params jsonb not null default '{}'::jsonb,
  headers jsonb not null default '{}'::jsonb
);

alter table nestpay_test_callbacks enable row level security;

create index if not exists nestpay_test_callbacks_oid_idx on nestpay_test_callbacks (oid);
