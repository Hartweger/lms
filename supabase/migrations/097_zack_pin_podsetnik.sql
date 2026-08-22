-- Podsetnik da PIN nije postavljen - ide DAN posle uzimanja poklona.
--
-- Zašto zaseban trag, a ne postojeći aktivacija_podsetnik_at: to su dva
-- različita problema i traže različit tempo. Detetu bez PIN-a fali JEDAN klik i
-- ono fizički ne može da uđe, pa se javlja odmah sutradan. Detetu koje PIN ima
-- ali još nije ušlo fali navika, i njemu se javlja trećeg dana.
--
-- Mereno 22.08.2026, prve večeri akcije: od 25 uzetih poklona osmoro dece nije
-- imalo PIN - trećina prijava koja bez ovog mejla nikad ne bi ušla u aplikaciju.
ALTER TABLE public.zack_deca
  ADD COLUMN IF NOT EXISTS pin_podsetnik_at TIMESTAMPTZ;

COMMENT ON COLUMN public.zack_deca.pin_podsetnik_at IS
  'Kad je roditelju javljeno da PIN još nije postavljen. NULL = nije slato.';

-- ── Vraćanje unazad ────────────────────────────────────────────────────────
-- ALTER TABLE public.zack_deca DROP COLUMN pin_podsetnik_at;
