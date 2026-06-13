-- 054_substitution_requests.sql
-- Prijave zamena: profesorka prijavi da je odradila tuđi grupni čas; admin odobri (→ premešta sesiju).
create table if not exists substitution_requests (
  id            uuid primary key default gen_random_uuid(),
  requested_by  uuid not null references user_profiles(id) on delete cascade,
  group_id      uuid not null references groups(id) on delete cascade,
  session_date  date not null,
  status        text not null default 'na_cekanju'
                  check (status in ('na_cekanju','odobreno','odbijeno')),
  reject_reason text,
  approved_by   uuid references user_profiles(id),
  decided_at    timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_sub_requests_requested on substitution_requests(requested_by);
create index if not exists idx_sub_requests_status on substitution_requests(status);
