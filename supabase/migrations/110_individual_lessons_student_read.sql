-- 110: Polaznik sme da čita SVOJE individualne časove.
--
-- Zašto: politika „class_notes student read own individual" (migracija 109) u svom uslovu
-- pita bazu za `individual_lessons` polaznika. Postgres i u podupitu politike primenjuje RLS
-- ciljne tabele, a `individual_lessons` je do sad imala SAMO politiku za profesorke i admina
-- („ind_lessons staff all"). Zato je politika za beleške polazniku NIKAD nije mogla da prođe.
--
-- Aplikacija ovo nije primetila jer stranice `/beleske` i `/moje-reci` čitaju sa servera
-- service-role klijentom (zaobilazi RLS) uz ručno filtriranje po korisniku. RLS je drugi
-- sloj zaštite - i bez ove politike je bio mrtav za polaznike.
--
-- Nataša je ovo primetila pri ručnom testu 30.09.2026.

create policy "ind_lessons student read own"
  on public.individual_lessons for select
  using (
    exists (
      select 1 from public.individual_enrollments ie
      where ie.id = individual_lessons.enrollment_id
        and ie.user_id = auth.uid()
    )
  );
