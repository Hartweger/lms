CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own certificates" ON public.certificates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Anyone can read certificates by ID" ON public.certificates FOR SELECT USING (TRUE);
CREATE POLICY "System can insert certificates" ON public.certificates FOR INSERT WITH CHECK (user_id = auth.uid());
