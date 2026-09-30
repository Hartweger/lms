-- 109: Beleške sa časa u platformi + lični setovi kartica (kriška 1, samo 1:1).
-- group_session_id i group_id postoje od početka da kriška 3 (grupe) ne menja šemu.

create table if not exists public.class_notes (
  id                   uuid primary key default gen_random_uuid(),
  individual_lesson_id uuid null references public.individual_lessons(id) on delete cascade,
  group_session_id     uuid null references public.group_sessions(id) on delete cascade,
  professor_id         uuid not null references public.user_profiles(id),
  content              jsonb not null default '{}'::jsonb,
  content_text         text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint class_notes_one_target check (
    (individual_lesson_id is not null) <> (group_session_id is not null)
  )
);

create unique index if not exists class_notes_individual_uq
  on public.class_notes(individual_lesson_id) where individual_lesson_id is not null;
create unique index if not exists class_notes_group_uq
  on public.class_notes(group_session_id) where group_session_id is not null;

-- Lični setovi kartica. note_id je SET NULL da set preživi brisanje beleške posle 6 meseci:
-- briše se tekst časa, ne rečnik polaznika i ne njegov napredak.
create table if not exists public.student_wordsets (
  id                       uuid primary key default gen_random_uuid(),
  note_id                  uuid null references public.class_notes(id) on delete set null,
  individual_enrollment_id uuid null references public.individual_enrollments(id) on delete cascade,
  group_id                 uuid null references public.groups(id) on delete cascade,
  title                    text not null,
  lesson_date              date not null,
  position                 int,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint student_wordsets_one_owner check (
    (individual_enrollment_id is not null) <> (group_id is not null)
  )
);

create unique index if not exists student_wordsets_note_uq
  on public.student_wordsets(note_id) where note_id is not null;
create index if not exists student_wordsets_enroll_idx
  on public.student_wordsets(individual_enrollment_id, lesson_date desc);

create table if not exists public.student_wordset_items (
  wordset_id uuid not null references public.student_wordsets(id) on delete cascade,
  idx        int  not null,
  front      text not null,
  back       text not null,
  primary key (wordset_id, idx)
);

-- RLS: app piše service-role klijentom (zaobilazi RLS); politike su drugi sloj.
alter table public.class_notes enable row level security;
alter table public.student_wordsets enable row level security;
alter table public.student_wordset_items enable row level security;

-- Polaznik čita belešku svog individualnog upisa. Provera je POSTOJANJE upisa,
-- NE istek pristupa - beleška ostaje dostupna i posle isteka, do brisanja na 6 meseci.
create policy "class_notes student read own individual"
  on public.class_notes for select
  using (
    exists (
      select 1
      from public.individual_lessons il
      join public.individual_enrollments ie on ie.id = il.enrollment_id
      where il.id = class_notes.individual_lesson_id
        and ie.user_id = auth.uid()
    )
  );

create policy "class_notes staff read"
  on public.class_notes for select
  using (
    exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role in ('professor','admin')
    )
  );

create policy "student_wordsets student read own"
  on public.student_wordsets for select
  using (
    exists (
      select 1 from public.individual_enrollments ie
      where ie.id = student_wordsets.individual_enrollment_id
        and ie.user_id = auth.uid()
    )
  );

create policy "student_wordset_items student read own"
  on public.student_wordset_items for select
  using (
    exists (
      select 1
      from public.student_wordsets sw
      join public.individual_enrollments ie on ie.id = sw.individual_enrollment_id
      where sw.id = student_wordset_items.wordset_id
        and ie.user_id = auth.uid()
    )
  );
