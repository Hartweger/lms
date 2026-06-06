-- Sprechen (mündlich): snimak govora se šalje na pregled profesoru, isto kao esej.
-- Proširuje essay_submissions: audio_url + submission_type; text postaje opcioni (audio nema tekst).
ALTER TABLE public.essay_submissions ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.essay_submissions ADD COLUMN IF NOT EXISTS submission_type TEXT NOT NULL DEFAULT 'essay';
ALTER TABLE public.essay_submissions ALTER COLUMN text DROP NOT NULL;

-- Dozvoli 'sprechen' tip vežbe
ALTER TABLE public.exercises DROP CONSTRAINT IF EXISTS exercises_exercise_type_check;
ALTER TABLE public.exercises ADD CONSTRAINT exercises_exercise_type_check
  CHECK (exercise_type IN ('quiz', 'fill_blank', 'match_pairs', 'word_order', 'listen_write', 'dialog', 'true_false', 'typing', 'speak', 'essay', 'sprechen'));
