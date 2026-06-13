-- 053_professor_payables.sql
-- Obaveze prema profesorkama: isplate + dodatne aktivnosti (sa odobravanjem).

create table if not exists professor_payments (
  id            uuid primary key default gen_random_uuid(),
  professor_id  uuid not null references user_profiles(id) on delete cascade,
  payment_date  date not null,
  amount        integer not null check (amount > 0),   -- bruto din
  note          text,
  created_by    uuid references user_profiles(id),
  created_at    timestamptz not null default now()
);
create index if not exists idx_prof_payments_prof on professor_payments(professor_id);

create table if not exists professor_activities (
  id            uuid primary key default gen_random_uuid(),
  professor_id  uuid not null references user_profiles(id) on delete cascade,
  description   text not null,
  amount        integer not null check (amount > 0),   -- bruto din
  activity_date date not null,
  status        text not null default 'na_cekanju'
                  check (status in ('na_cekanju','odobreno','odbijeno')),
  reject_reason text,
  submitted_by  uuid references user_profiles(id),
  approved_by   uuid references user_profiles(id),
  decided_at    timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_prof_activities_prof on professor_activities(professor_id);
create index if not exists idx_prof_activities_status on professor_activities(status);
