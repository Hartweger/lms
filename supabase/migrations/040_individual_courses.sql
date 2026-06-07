-- 040: Individualni kursevi — prof config kolone, included_lessons, nove tabele.

-- Prof config (na user_profiles; NULL za ne-profesorke).
alter table public.user_profiles
  add column if not exists calendar_url text,
  add column if not exists honorar_ind int,
  add column if not exists honorar_grp int;

-- Broj časova uključen u "po nivou" individualni kurs (mesečni paket: iz package_type).
alter table public.courses
  add column if not exists included_lessons int;

-- Roster individualnih upisa (zamena za prof IND Google Sheet).
create table if not exists public.individual_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id),
  course_id uuid not null references public.courses(id),
  professor_id uuid references public.user_profiles(id),
  order_id uuid references public.orders(id),
  package_lessons int not null,
  lessons_used int not null default 0,
  notes_doc_url text,
  status text not null default 'active'
    check (status in ('active','completed','expired','cancelled')),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_ind_enroll_user on public.individual_enrollments(user_id);
create index if not exists idx_ind_enroll_prof on public.individual_enrollments(professor_id);

-- Log održanih individualnih časova (lessons_used = broj redova po enrollmentu).
create table if not exists public.individual_lessons (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.individual_enrollments(id) on delete cascade,
  professor_id uuid not null references public.user_profiles(id),
  lesson_date date not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_ind_lessons_prof_date on public.individual_lessons(professor_id, lesson_date);

-- Log održanih grupnih sesija (za honorar). source: 'auto' (iz rasporeda) | 'manual'.
create table if not exists public.group_sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  professor_id uuid references public.user_profiles(id),
  session_date date not null,
  source text not null default 'manual' check (source in ('manual','auto')),
  created_at timestamptz not null default now(),
  unique (group_id, session_date)
);
create index if not exists idx_grp_sessions_prof_date on public.group_sessions(professor_id, session_date);

-- RLS: app koristi service-role (zaobilazi RLS); ove politike su za korisnički kontekst (Etapa 2+).
alter table public.individual_enrollments enable row level security;
alter table public.individual_lessons enable row level security;
alter table public.group_sessions enable row level security;

create policy "ind_enroll student read own"
  on public.individual_enrollments for select
  using (auth.uid() = user_id);

create policy "ind_enroll staff all"
  on public.individual_enrollments for all
  using (exists (select 1 from public.user_profiles p
    where p.id = auth.uid() and p.role in ('admin','professor')));

create policy "ind_lessons staff all"
  on public.individual_lessons for all
  using (exists (select 1 from public.user_profiles p
    where p.id = auth.uid() and p.role in ('admin','professor')));

create policy "grp_sessions staff all"
  on public.group_sessions for all
  using (exists (select 1 from public.user_profiles p
    where p.id = auth.uid() and p.role in ('admin','professor')));
