-- 026: Enforce course_access.expires_at in the lesson-read RLS policy.
--
-- Bug: the "Course access holders can read lessons" policy (migration 002)
-- granted SELECT on lessons for ANY matching course_access row, ignoring the
-- expires_at column added in migration 010. Result: a user whose access has
-- expired could still read full (non-preview) lesson content by hitting
-- /lekcija/[id] directly, because the page relies on RLS to gate the row.
-- The course page checked expiry in the UI, but the lesson route did not.
--
-- Fix: require the access row to be non-expired. Free-preview lessons remain
-- readable by everyone via the separate "Anyone can read free preview lessons"
-- policy; admins remain unaffected via "Admins can manage lessons".

DROP POLICY IF EXISTS "Course access holders can read lessons" ON public.lessons;

CREATE POLICY "Course access holders can read lessons"
  ON public.lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_access
      WHERE user_id = auth.uid()
        AND course_id = lessons.course_id
        AND (expires_at IS NULL OR expires_at > NOW())
    )
  );
