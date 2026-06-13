-- CRM za lidove i komunikaciju (v1)
-- Dve tabele; postojeće tabele se samo čitaju, ne diraju.

-- ── Kontakti (lid ILI polaznik, isti zapis kroz ceo životni ciklus) ──
create table if not exists public.crm_contacts (
  id                  uuid primary key default gen_random_uuid(),
  email               text,
  name                text,
  phone               text,
  instagram_handle    text,
  user_id             uuid references auth.users on delete set null,
  stage               text not null default 'nov'
                        check (stage in ('nov','kontaktiran','zainteresovan','ponuda','upisan','izgubljen')),
  source              text not null default 'rucno'
                        check (source in ('naki','smile','kontakt-forma','masterclass','manychat','instagram','whatsapp','rucno')),
  level               text,
  tags                text[] not null default '{}',
  note                text,
  owner               text,
  next_action         text,
  next_action_at      timestamptz,
  last_interaction_at timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

-- email jedinstven case-insensitive (samo kad postoji); dozvoli više kontakata bez mejla
create unique index if not exists crm_contacts_email_uidx
  on public.crm_contacts (lower(email)) where email is not null;
create index if not exists crm_contacts_ig_idx     on public.crm_contacts (lower(instagram_handle)) where instagram_handle is not null;
create index if not exists crm_contacts_stage_idx  on public.crm_contacts (stage);
create index if not exists crm_contacts_source_idx on public.crm_contacts (source);
create index if not exists crm_contacts_next_idx   on public.crm_contacts (next_action_at);
create index if not exists crm_contacts_user_idx   on public.crm_contacts (user_id);

-- ── Interakcije (vremenska traka) ──
create table if not exists public.crm_interactions (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid not null references public.crm_contacts on delete cascade,
  channel     text not null
                check (channel in ('mejl','naki','smile','manychat','instagram','whatsapp','beleska','sistem')),
  direction   text not null default 'dolazna'
                check (direction in ('dolazna','odlazna','interna')),
  summary     text,
  body        text,
  occurred_at timestamptz not null default now(),
  meta        jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists crm_interactions_contact_idx
  on public.crm_interactions (contact_id, occurred_at desc);

-- ── RLS: sav pristup preko service-role iz API ruta. Bez anon/authenticated policy. ──
alter table public.crm_contacts     enable row level security;
alter table public.crm_interactions enable row level security;
-- Namerno bez policy-ja: service-role zaobilazi RLS; anon/authenticated nemaju pristup.
