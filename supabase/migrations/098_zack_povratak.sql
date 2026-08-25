-- Mejl za dete koje je ušlo JEDNOM pa stalo.
--
-- Mereno 24.08.2026, treći dan akcije: od 12 dece koja su igrala, svih 12 je
-- igralo TAČNO JEDAN DAN. Nijedno se nije vratilo. Dotadašnji niz mejlova je
-- pokrivao samo decu koja nikad nisu ušla (PIN prvog dana, kod trećeg), pa je
-- najveća grupa koja je već pokazala interesovanje ostajala bez ijedne reči do
-- roditeljskog izveštaja za dve nedelje - predugo.
ALTER TABLE public.zack_deca
  ADD COLUMN IF NOT EXISTS povratak_mejl_at TIMESTAMPTZ;

COMMENT ON COLUMN public.zack_deca.povratak_mejl_at IS
  'Kad je roditelju javljeno da dete nije ušlo par dana. NULL = nije slato. Šalje se JEDNOM - zack! nigde ne opominje dvaput.';

-- ── Vraćanje unazad ────────────────────────────────────────────────────────
-- ALTER TABLE public.zack_deca DROP COLUMN povratak_mejl_at;
