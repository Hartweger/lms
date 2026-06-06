-- 035: Grupe (raspored) u Supabase — zamena za Google Sheet "Raspored".
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_course_id UUID REFERENCES public.courses(id),
  purchasable_course_id UUID REFERENCES public.courses(id),
  level TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'grupni',
  professor_id UUID REFERENCES public.user_profiles(id),
  status TEXT NOT NULL DEFAULT 'planiran'
    CHECK (status IN ('planiran','uskoro','otvoren','u_toku','zavrsena','otkazana')),
  start_date DATE,
  end_date DATE,
  duration_weeks INT,
  days SMALLINT[] NOT NULL DEFAULT '{}',
  session_time TEXT,
  min_seats INT NOT NULL DEFAULT 3,
  max_seats INT NOT NULL DEFAULT 6,
  price NUMERIC(10,2),
  calendar_id TEXT,
  notes TEXT,
  notes_link TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_groups_status ON public.groups(status);
CREATE INDEX idx_groups_professor ON public.groups(professor_id);

CREATE TABLE public.group_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);
CREATE INDEX idx_group_enrollments_group ON public.group_enrollments(group_id);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_enrollments ENABLE ROW LEVEL SECURITY;

-- Javno čitanje samo otvorenih/uskoro grupa (za prikaz na sajtu).
CREATE POLICY "Public can read open groups" ON public.groups
  FOR SELECT USING (status IN ('otvoren','uskoro'));
-- Staff (admin/professor) pun pristup grupama.
CREATE POLICY "Staff manage groups" ON public.groups
  FOR ALL USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin','professor')
  );
-- Enrollments: samo staff (service-role ruta ionako zaobilazi RLS).
CREATE POLICY "Staff manage enrollments" ON public.group_enrollments
  FOR ALL USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin','professor')
  );
