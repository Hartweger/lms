-- Prijave na besplatne masterclass-ove (email gate). Prva: "reci".
CREATE TABLE IF NOT EXISTS public.masterclass_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  masterclass TEXT NOT NULL DEFAULT 'reci',
  email TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS masterclass_signups_email_idx ON public.masterclass_signups(email);
CREATE INDEX IF NOT EXISTS masterclass_signups_mc_idx ON public.masterclass_signups(masterclass);

ALTER TABLE public.masterclass_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can sign up for masterclass" ON public.masterclass_signups FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins can read masterclass signups" ON public.masterclass_signups FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'));
