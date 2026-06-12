-- Odbijeni mejlovi (bounce) i spam prijave — puni ih Resend webhook (/api/resend-webhook).
-- Jutarnji pregled prikazuje sveže unose da admin proveri kontakt sa polaznikom.
create table email_bounces (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  event text not null, -- 'bounced' | 'complained'
  reason text,
  subject text,
  created_at timestamptz not null default now()
);

create index idx_email_bounces_email on email_bounces (email);
create index idx_email_bounces_created on email_bounces (created_at);

alter table email_bounces enable row level security;

create policy "Admins can read email bounces"
  on email_bounces for select
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
        and user_profiles.role = 'admin'
    )
  );
