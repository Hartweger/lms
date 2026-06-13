-- Smile prodajni asistent — DB migracija (2026-06-13)
-- Primeni preko Supabase → SQL Editor → Run.

-- 1. Razdvoji tutor/Smile logove u naki_messages
ALTER TABLE naki_messages ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'tutor';

-- 2. Odvojen dnevni budžet za Smile (ne dira naki_daily_usage)
CREATE TABLE IF NOT EXISTS smile_daily_usage (
  day   DATE PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);

-- 3. Feature-prekidači (key/value, čita se server-side po zahtevu)
CREATE TABLE IF NOT EXISTS smile_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO smile_config (key, value) VALUES
  ('enabled', 'true'),
  ('nudge', 'false'),
  ('lead_capture', 'false'),
  ('coupon', 'true'),
  ('model', 'claude-sonnet-4-6')
ON CONFLICT (key) DO NOTHING;
