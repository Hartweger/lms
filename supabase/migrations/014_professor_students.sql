-- Professor-student assignments

CREATE TABLE public.professor_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  assigned_via TEXT NOT NULL DEFAULT 'manual' CHECK (assigned_via IN ('manual', 'wc_variation')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(professor_id, student_id, course_id)
);

-- Indexes
CREATE INDEX idx_professor_students_professor ON public.professor_students(professor_id);
CREATE INDEX idx_professor_students_student ON public.professor_students(student_id);

-- RLS
ALTER TABLE public.professor_students ENABLE ROW LEVEL SECURITY;

-- Professors can read their own assignments
CREATE POLICY "Professors can read own assignments" ON public.professor_students
  FOR SELECT USING (professor_id = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins can manage all assignments" ON public.professor_students
  FOR ALL USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
  );
