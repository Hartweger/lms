-- 070: pretplate/rate preko NestPay recurringa.
-- Svaka naplata je red u orders; subscriptions drži stanje cele serije.
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id),
  initial_order_id uuid not null references orders(id),
  -- EXTRA.RECURRINGID iz callbacka prve naplate; ključ za sve upite banci
  recurring_id text not null,
  -- order_number prve porudžbine; banka izvodi <base_oid>-2, -3, ...
  base_oid text not null,
  amount numeric(10,2) not null,
  total_payments int not null,
  paid_payments int not null default 1,
  status text not null default 'active',
  next_charge_at timestamptz,
  cancelled_at timestamptz,
  last_polled_at timestamptz
);

create unique index if not exists subscriptions_recurring_id_idx on subscriptions (recurring_id);
create index if not exists subscriptions_status_idx on subscriptions (status);
create index if not exists subscriptions_user_idx on subscriptions (user_id);

alter table subscriptions enable row level security;

-- Polaznica sme da vidi SVOJE pretplate (za /nalog); pisanje ide samo service-role.
drop policy if exists "subscriptions_select_own" on subscriptions;
create policy "subscriptions_select_own" on subscriptions
  for select using (auth.uid() = user_id);

alter table orders add column if not exists subscription_id uuid references subscriptions(id);
alter table orders add column if not exists installment_no int;
-- Broj porudžbine kod banke (<base_oid>-N). Unique = garancija da se ista naplata
-- nikad ne obradi dvaput (poll može da naiđe na istu naplatu više puta).
alter table orders add column if not exists nestpay_oid text;
create unique index if not exists orders_nestpay_oid_idx on orders (nestpay_oid) where nestpay_oid is not null;
create index if not exists orders_subscription_idx on orders (subscription_id);
