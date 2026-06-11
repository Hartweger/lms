-- 045: Finansije — expenses tabela (ručni troškovi) + cancelled_at na group_enrollments.

create table public.expenses (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text not null check (category in ('marketing','alati-hosting','provizije','materijali','ostalo')),
  amount       int  not null check (amount > 0),
  course_id    uuid references public.courses(id),
  expense_date date not null,
  recurring    boolean not null default false,
  ended_at     date,
  note         text,
  created_at   timestamptz not null default now()
);
create index idx_expenses_date on public.expenses(expense_date);

alter table public.expenses enable row level security;
-- App ide preko service-role API ruta; politika je za korisnički kontekst.
create policy "Admin manage expenses" on public.expenses
  for all using (
    (select role from public.user_profiles where id = auth.uid()) = 'admin'
  );

-- Datum ispisa iz grupe — do sada se beležio samo status, bez vremena.
alter table public.group_enrollments add column if not exists cancelled_at timestamptz;
