-- 068: GA4 atribucija za server-side Measurement Protocol purchase.
-- Kolačići kupca (_ga / _ga_MB9DRXVVF6) hvataju se pri kreiranju porudžbine
-- (samo uz Consent Mode saglasnost) i koriste u ga4-mp.ts umesto order.id,
-- da purchase ne završava u Unassigned kanalu.
alter table public.orders
  add column if not exists ga_client_id text,
  add column if not exists ga_session_id text;

comment on column public.orders.ga_client_id is 'GA4 client_id iz _ga kolačića kupca (null bez saglasnosti)';
comment on column public.orders.ga_session_id is 'GA4 session_id iz _ga_<stream> kolačića kupca (null bez saglasnosti)';
