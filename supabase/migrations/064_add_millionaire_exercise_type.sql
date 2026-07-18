-- Dozvoli 'millionaire' tip vežbe (kviz igra Milioner).
-- Lista polazi od LIVE constraint-a u produkciji (proveren 18.07.2026), koji je širi
-- od migracije 031: sadrži i 'categorize' i 'conversation' (dodati ručno mimo fajlova;
-- 2 vežbe tipa categorize postoje u bazi, pa ih constraint mora zadržati).
ALTER TABLE public.exercises DROP CONSTRAINT IF EXISTS exercises_exercise_type_check;
ALTER TABLE public.exercises ADD CONSTRAINT exercises_exercise_type_check
  CHECK (exercise_type IN ('quiz', 'fill_blank', 'match_pairs', 'word_order', 'listen_write', 'dialog', 'true_false', 'categorize', 'conversation', 'typing', 'speak', 'essay', 'sprechen', 'millionaire'));
