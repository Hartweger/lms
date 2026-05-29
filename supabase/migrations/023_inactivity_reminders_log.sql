-- Track inactivity reminder emails to avoid spamming users
create table if not exists inactivity_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sent_at timestamptz not null default now()
);

create index idx_inactivity_reminders_user on inactivity_reminders(user_id, sent_at desc);
