-- Podsetnik (tebi) + ponuda (polaznicima) pred kraj kursa — zastavice da se ne šalje dvaput.
-- Primeniti u Supabase SQL Editor-u.

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS offer_sent_at    timestamptz;

COMMENT ON COLUMN public.groups.reminder_sent_at IS 'Kad je adminu poslat podsetnik (14 dana pre kraja) da otvori sledeći nivo.';
COMMENT ON COLUMN public.groups.offer_sent_at IS 'Kad je polaznicima poslata ponuda za sledeći nivo (7 dana pre kraja).';
