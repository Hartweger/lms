-- 028: Let professors read all lesson content via RLS.
--
-- Bug: the app layer (kurs/[slug]/page.tsx, dashboard) was updated so that
-- role IN ('admin','professor') is treated as staff with full content access
-- (deployed 01.06.2026). But the Supabase server client runs with the anon key
-- under the logged-in user's RLS context, and the lessons table only grants
-- SELECT to:
--   * free-preview lessons (anyone),
--   * non-expired course_access holders (migration 026),
--   * role = 'admin' (via "Admins can manage lessons", migration 002).
-- There was NO policy for role = 'professor'. A professor therefore passed the
-- app gate (hasAccess = true) but the lessons query returned ONLY the
-- free-preview rows -- e.g. the "2 lekcije na B1.2" symptom. They saw the course
-- exists but essentially no content.
--
-- Fix: add a SELECT policy granting staff (admin OR professor) read access to
-- all lessons. Overlap with the existing admin FOR ALL policy is harmless --
-- RLS policies are combined with OR. /admin (financial area) is unaffected: it
-- is gated separately in middleware.ts and remains admin-only.

CREATE POLICY "Staff can read all lessons"
  ON public.lessons FOR SELECT
  USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid())
      IN ('admin', 'professor')
  );
