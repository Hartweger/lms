-- 107: saradnici (afilijat kodovi). Spoljni saradnik deli kupon; kupac dobija popust,
-- saradniku od Nataše pripada fiksan iznos po PLAĆENOM upisu. Prvi saradnik: Ana za
-- NH Academy Gen II (kod ANA, 10%, 5.000 RSD po upisu, do 29.9.2026).
-- Spec: docs/superpowers/specs/2026-09-12-saradnici-afilijat-design.md

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  fee_rsd int not null check (fee_rsd >= 0),
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

-- Bez politika: anon i prijavljeni ne vide ništa, service role (admin rute) zaobilazi RLS.
alter table public.partners enable row level security;

create table if not exists public.partner_payouts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id),
  amount int not null check (amount > 0),
  paid_at date not null,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.partner_payouts enable row level security;

alter table public.coupons add column if not exists partner_id uuid references public.partners(id);

-- Snimak u trenutku porudžbine: promena iznosa saradniku važi samo za buduće prodaje.
alter table public.orders add column if not exists partner_id uuid references public.partners(id);
alter table public.orders add column if not exists partner_fee int;

create index if not exists orders_partner_id_idx on public.orders(partner_id) where partner_id is not null;
create index if not exists coupons_partner_id_idx on public.coupons(partner_id) where partner_id is not null;

-- Ana. Kupon je NEAKTIVAN dok kod na kasi ne bude deployovan (da porudžbina ne nastane
-- bez partner_fee). Aktivira se ručno posle smoke testa:
--   update public.coupons set is_active = true where code = 'ANA';
insert into public.partners (name, fee_rsd, note)
select 'Ana', 5000, 'NH Academy Gen II, kod ANA'
where not exists (select 1 from public.partners where name = 'Ana');

insert into public.coupons (code, discount_type, amount, expires_at, is_active, applies_to_course_id, partner_id)
select 'ANA', 'percent', 10, '2026-09-29 21:59:59+00', false, c.id, p.id
from public.courses c, public.partners p
where c.slug = 'nh-academy-gen2' and p.name = 'Ana'
on conflict (code) do nothing;
