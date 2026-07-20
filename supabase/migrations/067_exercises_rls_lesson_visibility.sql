-- 067: Vežbe i pitanja nasleđuju vidljivost lekcije (audit jul 2026, stavka
-- "correct_answer anon-čitljiv").
--
-- Problem: "Anyone can read exercises/questions" (007, USING TRUE) je puštao
-- bilo koga sa javnim anon ključem da preko PostgREST-a povuče SVE vežbe i
-- exercise_questions.correct_answer + explanation - ključ odgovora plaćenih
-- kurseva bez kupovine. Kroz aplikaciju se to nije videlo (lekcije čuva RLS),
-- rupa je bila samo direktan API pristup.
--
-- Fix: SELECT na exercises dozvoljen samo ako korisnik VIDI lekciju vežbe -
-- subquery na lessons se izvršava pod RLS-om upitnika, pa se automatski
-- nasleđuje kompletna postojeća logika (free preview za sve, neistekli
-- course_access iz 026, staff iz 028, admin iz 002). exercise_questions isto,
-- preko exercises. Nikakva logika pristupa se NE duplira.
--
-- Šta se NE menja: klijentska provera odgovora (po indeksu) i free preview
-- vežbe za anonimne rade kao do sada - preview lekcije su anon-vidljive, pa su
-- i njihova pitanja. Jedino što scraper više ne može: ključ odgovora plaćenog
-- sadržaja. Server (service_role: certificate-check, cronovi, skripte) zaobilazi
-- RLS kao i do sada. exercises.lesson_id je NOT NULL (007), nema siročića.

DROP POLICY IF EXISTS "Anyone can read exercises" ON public.exercises;
CREATE POLICY "Lesson visibility gates exercises"
  ON public.exercises FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = exercises.lesson_id
    )
  );

DROP POLICY IF EXISTS "Anyone can read questions" ON public.exercise_questions;
CREATE POLICY "Lesson visibility gates questions"
  ON public.exercise_questions FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exercises e
      WHERE e.id = exercise_questions.exercise_id
    )
  );
