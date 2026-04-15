-- Exercise tables for interactive exercise engine

CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('quiz', 'fill_blank', 'match_pairs', 'word_order', 'listen_write')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.exercise_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB, -- for quiz: ["opt1","opt2","opt3","opt4"], for match: [{"de":"Hund","sr":"Pas"}], for word_order: ["Ich","gehe","in","die","Schule"]
  correct_answer TEXT NOT NULL, -- for quiz: index "1", for fill_blank: the word, for word_order: "Ich gehe in die Schule", for listen_write: the text
  explanation TEXT, -- shown after wrong answer
  audio_url TEXT, -- for listen_write type
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.exercise_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read exercises" ON public.exercises FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admins can manage exercises" ON public.exercises FOR ALL
  USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

ALTER TABLE public.exercise_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read questions" ON public.exercise_questions FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admins can manage questions" ON public.exercise_questions FOR ALL
  USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

ALTER TABLE public.exercise_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own attempts" ON public.exercise_attempts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can read all attempts" ON public.exercise_attempts FOR SELECT
  USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');
