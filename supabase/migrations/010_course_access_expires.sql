-- Add optional expiry date to course_access
ALTER TABLE course_access ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;
