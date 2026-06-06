-- Tag za migrirane redove (rollback: DELETE ... WHERE source='wp-migration-2026-06').
ALTER TABLE public.course_access ADD COLUMN IF NOT EXISTS source TEXT;
CREATE INDEX IF NOT EXISTS idx_course_access_source ON public.course_access(source);
