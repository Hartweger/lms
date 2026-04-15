CREATE TABLE public.placement_test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.placement_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  user_id UUID REFERENCES auth.users(id),
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  recommended_level TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.placement_test_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read test questions" ON public.placement_test_questions FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage test questions" ON public.placement_test_questions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE public.placement_test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can save test results" ON public.placement_test_results FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins can read test results" ON public.placement_test_results FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));
