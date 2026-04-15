-- Add question_type to exercise_questions for mixed-type exercises
ALTER TABLE public.exercise_questions
ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'quiz';
