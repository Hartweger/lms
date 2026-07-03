-- Cron nadzor (audit jul 2026): svaki cron kroz withCronLog upisuje prolaz;
-- /api/cron/cron-health dnevno poredi poslednje prolaze sa očekivanim intervalima.
-- RLS auto-uključuje event trigger ensure_rls; piše/čita samo service_role (bez policy-ja).
create table if not exists cron_runs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ok boolean not null,
  status int,
  duration_ms int,
  created_at timestamptz not null default now()
);

create index if not exists idx_cron_runs_name_created on cron_runs (name, created_at desc);
