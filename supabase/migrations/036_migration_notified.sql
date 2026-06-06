-- 036: Praćenje ko je obavešten o prelasku na novu platformu (staged slanje, "ne dupliraj").
-- Backfill: postaviti na prošli datum za sve koji su već dobili migracioni mejl (A1 batch 27.05 + poznati setovi).
-- Slanje: bira se samo WHERE migration_notified_at IS NULL; markira se po slanju.
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS migration_notified_at TIMESTAMPTZ;
