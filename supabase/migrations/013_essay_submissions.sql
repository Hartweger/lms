-- Essay submissions table for typing/essay exercises

CREATE TABLE public.essay_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  ai_feedback TEXT,
  ai_corrections JSONB,
  ai_score INTEGER,
  professor_feedback TEXT,
  professor_score INTEGER CHECK (professor_score BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'published')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Update exercise_type CHECK constraint to include 'true_false' and 'typing'
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_exercise_type_check;
ALTER TABLE exercises ADD CONSTRAINT exercises_exercise_type_check
  CHECK (exercise_type IN ('quiz', 'fill_blank', 'match_pairs', 'word_order', 'listen_write', 'dialog', 'true_false', 'typing'));

-- RLS
ALTER TABLE public.essay_submissions ENABLE ROW LEVEL SECURITY;

-- Users can INSERT own submissions
CREATE POLICY "Users can insert own submissions" ON public.essay_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can SELECT own submissions OR if admin/professor role
CREATE POLICY "Users can view own submissions" ON public.essay_submissions FOR SELECT
  USING (
    user_id = auth.uid() OR
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'professor')
  );

-- Admins/professors can UPDATE any submission
CREATE POLICY "Admins and professors can update submissions" ON public.essay_submissions FOR UPDATE
  USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'professor'));

-- Admins can DELETE
CREATE POLICY "Admins can delete submissions" ON public.essay_submissions FOR DELETE
  USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- Indexes
CREATE INDEX idx_essay_submissions_status ON public.essay_submissions(status);
CREATE INDEX idx_essay_submissions_user ON public.essay_submissions(user_id);
