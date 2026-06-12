-- Testiranje-funnel: praćenje poslatih follow-up mejlova posle testa znanja.
-- Zamena za Apps Script skenirajTestiranje (mejlovi #2-#4; #1 "rezultat" šalje MailerLite automacija).
create table test_funnel_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nivo text not null,
  email_number int not null check (email_number between 2 and 4),
  sent_at timestamptz not null default now()
);

create index idx_test_funnel_emails_email on test_funnel_emails (email);

alter table test_funnel_emails enable row level security;

create policy "Admins can read test funnel emails"
  on test_funnel_emails for select
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
        and user_profiles.role = 'admin'
    )
  );
