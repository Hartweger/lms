-- 027: Lock down certificate issuance and bound attempt scores.
--
-- Bug 1: clients could INSERT directly into `certificates` (policy
-- "System can insert certificates" WITH CHECK user_id = auth.uid()), so anyone
-- could self-issue a certificate from the browser/DevTools. We remove that
-- policy; certificates are now issued ONLY server-side (service role bypasses
-- RLS) via /api/certificate, after the server recomputes the ≥60% threshold
-- from stored exercise_attempts. SELECT policies are unchanged (owner + public
-- read-by-id for the verification page).
--
-- Bug 2: exercise_attempts.score was unbounded, so a client could POST an
-- arbitrary score. Add a sanity bound (0 <= score <= total_questions). Created
-- NOT VALID so two pre-existing anomalous legacy rows don't block the migration;
-- the constraint is enforced for all new inserts/updates.
--
-- NOTE: attempts are still graded client-side (correct answers are shown to the
-- learner for feedback), so this raises the bar but is not anti-cheat proofing.
-- The headline forgery vectors (direct cert insert, absurd scores) are closed.

DROP POLICY IF EXISTS "System can insert certificates" ON public.certificates;

ALTER TABLE public.exercise_attempts
  ADD CONSTRAINT exercise_attempts_score_bounds
  CHECK (score >= 0 AND total_questions >= 0 AND score <= total_questions)
  NOT VALID;
