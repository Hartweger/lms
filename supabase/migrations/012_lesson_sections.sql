-- Add sections JSONB column to lessons
ALTER TABLE public.lessons ADD COLUMN sections jsonb DEFAULT '[]';

COMMENT ON COLUMN public.lessons.sections IS 'Array of section blocks (badge, video, text, formula, table, mistakes, spoiler, vocabulary, pdf, image, link). When non-empty, takes precedence over legacy lesson_type/content/vimeo_video_id fields.';
