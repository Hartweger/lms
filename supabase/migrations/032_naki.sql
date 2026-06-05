-- NaKI AI asistent — migracija sa WP/PHP na LMS
-- Zamena za fajlove na Hostingeru: naki_logs/*.json i naki_profiles/{md5(email)}.json

-- ── Logovi razgovora ──────────────────────────────────────────────
create table if not exists naki_messages (
  id          bigint generated always as identity primary key,
  session_id  text not null,
  role        text not null check (role in ('user', 'assistant')),
  message     text not null,
  level       text,                                  -- detektovan nivo (A1/A2/B1...)
  ip_hash     text,
  user_id     uuid references auth.users on delete set null,  -- null za anonimne
  created_at  timestamptz not null default now()
);

create index if not exists naki_messages_session_idx on naki_messages (session_id);
create index if not exists naki_messages_created_idx on naki_messages (created_at);

-- ── Korisnički profili (email capture + premium) ──────────────────
create table if not exists naki_profiles (
  email          text primary key,
  user_id        uuid references auth.users on delete set null,
  name           text,
  level          text,
  first_session  timestamptz not null default now(),
  last_session   timestamptz not null default now(),
  total_sessions int not null default 0,
  total_messages int not null default 0,
  topics_covered text[],
  weak_areas     text[],
  strong_areas   text[],
  summary        text,
  created_at     timestamptz not null default now()
);

-- ── Dnevni brojač potrošnje (zamena za /naki_daily/ temp fajl) ────
create table if not exists naki_daily_usage (
  day    date primary key,
  count  int not null default 0
);

-- ── RLS: sav upis ide preko service-role iz API rute. Bez javnog pristupa. ──
alter table naki_messages   enable row level security;
alter table naki_profiles   enable row level security;
alter table naki_daily_usage enable row level security;
-- Namerno bez policy-ja: anon/authenticated nemaju pristup; service-role zaobilazi RLS.
