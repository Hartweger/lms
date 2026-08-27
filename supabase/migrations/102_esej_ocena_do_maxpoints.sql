-- Ocena Schreiben-a više nije 1-5.
--
-- Migracija 013 je postavila CHECK (professor_score BETWEEN 1 AND 5), kad je esej imao
-- samo školsku ocenu 1-5. U međuvremenu vežba nosi options.maxPoints (ispitne vežbe
-- imaju 20 i 40 bodova), a 0 bodova je legitimna ocena - pa je objava svake ocene
-- van 1-5 padala na:
--   new row for relation "essay_submissions" violates check constraint
--   "essay_submissions_professor_score_check"
--
-- Gornju granicu zna samo aplikacija (maxPoints je po vežbi, u exercise_questions.options),
-- i /api/essays/publish je već proverava. Bazi ostaje samo „nije negativna".

ALTER TABLE public.essay_submissions DROP CONSTRAINT IF EXISTS essay_submissions_professor_score_check;
ALTER TABLE public.essay_submissions ADD CONSTRAINT essay_submissions_professor_score_check
  CHECK (professor_score IS NULL OR professor_score >= 0);
