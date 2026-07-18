-- Dozvoli 'millionaire' tip vežbe (kviz igra Milioner)
ALTER TABLE public.exercises DROP CONSTRAINT IF EXISTS exercises_exercise_type_check;
ALTER TABLE public.exercises ADD CONSTRAINT exercises_exercise_type_check
  CHECK (exercise_type IN ('quiz', 'fill_blank', 'match_pairs', 'word_order', 'listen_write', 'dialog', 'true_false', 'typing', 'speak', 'essay', 'sprechen', 'millionaire'));
