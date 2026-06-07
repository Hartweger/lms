-- Posao B: polja za Google integraciju (Apps Script) + granica termina za reset brojača.
-- Primeniti u Supabase SQL Editor-u.

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS term_opened_at  timestamptz,
  ADD COLUMN IF NOT EXISTS gcal_event_id   text,
  ADD COLUMN IF NOT EXISTS meet_link       text,
  ADD COLUMN IF NOT EXISTS notes_url       text,
  ADD COLUMN IF NOT EXISTS notes_doc_id    text;

COMMENT ON COLUMN public.groups.term_opened_at IS 'Kad je tekući termin otvoren (dugme "Otvori novi termin"). Brojanje upisa od ovog trenutka; NULL = broji sve aktivne.';
COMMENT ON COLUMN public.groups.gcal_event_id IS 'ID ponavljajućeg Google Calendar eventa tekućeg termina.';
COMMENT ON COLUMN public.groups.meet_link IS 'Google Meet link tekućeg termina (isti za ceo kurs).';
COMMENT ON COLUMN public.groups.notes_url IS 'Link na Google dokument sa beleškama tekućeg termina.';
COMMENT ON COLUMN public.groups.notes_doc_id IS 'ID Google dokumenta sa beleškama (za brisanje/čišćenje).';
