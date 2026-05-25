-- Add handbook_url to courses (e.g. Google Drive link to priručnik)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS handbook_url TEXT;

-- Set handbook for A1.1 and A1.2
UPDATE courses SET handbook_url = 'https://drive.google.com/file/d/1dd29RtYvHX_JeZ45THujNf_FmHOATVbD/view?usp=sharing'
WHERE slug IN ('nemacki-a1-1', 'nemacki-a1-2');
