-- Odjava od funnel/ponudbenih mejlova koje LMS šalje preko Resend-a.
-- Upis ide preko potpisanog /api/odjava linka u mejlovima; cron test-funnel preskače ove adrese.
create table email_optouts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

create index idx_email_optouts_email on email_optouts (email);

alter table email_optouts enable row level security;

create policy "Admins can read email optouts"
  on email_optouts for select
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.id = auth.uid()
        and user_profiles.role = 'admin'
    )
  );
