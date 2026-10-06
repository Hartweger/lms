-- 111: Grupne beleške na platformi (kriška 3).
--
-- 1) Prekidač po grupi. Spec: platforma važi za NOVE grupe, tekuće ostaju na Google Doc-u.
--    Podrazumevano false - nijedna postojeća grupa ne menja ponašanje.
alter table public.groups
  add column if not exists notes_on_platform boolean not null default false;

-- 2) Beleška ne sme da nestane zajedno sa sesijom. 109 je imala ON DELETE CASCADE, a
--    syncGroupSessions („Napravi / osveži termin") briše buduće i DANAŠNJE 'auto' sesije i
--    pravi ih ponovo - klik admina istog dana posle časa bi tiho obrisao belešku.
--    Kod (syncGroupSessions, grupna-sesija DELETE) sesije sa beleškom zaobilazi; RESTRICT je drugi sloj.
alter table public.class_notes drop constraint if exists class_notes_group_session_id_fkey;
alter table public.class_notes
  add constraint class_notes_group_session_id_fkey
  foreign key (group_session_id) references public.group_sessions(id) on delete restrict;

create index if not exists student_wordsets_group_idx
  on public.student_wordsets(group_id, lesson_date desc);

-- 3) RLS za polaznike grupe. Ista zamka kao 110: politika na class_notes pita
--    group_sessions i group_enrollments, a Postgres i u podupitu primenjuje RLS tih tabela.
--    Do sad su obe imale SAMO staff politike, pa bi politika za polaznika uvek padala.
create policy "grp_enroll student read own"
  on public.group_enrollments for select
  using (auth.uid() = user_id);

create policy "grp_sessions student read own group"
  on public.group_sessions for select
  using (
    exists (
      select 1 from public.group_enrollments ge
      where ge.group_id = group_sessions.group_id
        and ge.user_id = auth.uid()
        and ge.status = 'active'
    )
  );

-- Polaznik grupe vidi SVE beleške svoje grupe, i one pre svog upisa (spec).
-- Uslov je aktivan upis u grupu, NE istek pristupa platformi.
create policy "class_notes student read own group"
  on public.class_notes for select
  using (
    exists (
      select 1
      from public.group_sessions gs
      join public.group_enrollments ge on ge.group_id = gs.group_id
      where gs.id = class_notes.group_session_id
        and ge.user_id = auth.uid()
        and ge.status = 'active'
    )
  );

create policy "student_wordsets student read own group"
  on public.student_wordsets for select
  using (
    exists (
      select 1 from public.group_enrollments ge
      where ge.group_id = student_wordsets.group_id
        and ge.user_id = auth.uid()
        and ge.status = 'active'
    )
  );

create policy "student_wordset_items student read own group"
  on public.student_wordset_items for select
  using (
    exists (
      select 1
      from public.student_wordsets sw
      join public.group_enrollments ge on ge.group_id = sw.group_id
      where sw.id = student_wordset_items.wordset_id
        and ge.user_id = auth.uid()
        and ge.status = 'active'
    )
  );
