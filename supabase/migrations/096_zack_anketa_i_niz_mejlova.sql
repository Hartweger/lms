-- Niz mejlova oko poklona + kratka anketa o utiscima.
--
-- Svaki mejl u nizu ima SVOJ trag na detetu i šalje se TAČNO JEDNOM. Bez toga
-- bi dnevni cron ponavljao isti mejl svakog dana dok uslov važi - a zack!
-- nigde ne opominje. Trag se upisuje PRE slanja: pad slanja znači izgubljen
-- mejl (sitnica), obrnut red bi značio dupli mejl (dosađivanje).
ALTER TABLE public.zack_deca
  ADD COLUMN IF NOT EXISTS aktivacija_podsetnik_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS anketa_poslata_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS istek_mejl_at TIMESTAMPTZ;

COMMENT ON COLUMN public.zack_deca.aktivacija_podsetnik_at IS
  'Kad je roditelju javljeno da kod još čeka (dete se nijednom nije prijavilo). NULL = nije slato.';
COMMENT ON COLUMN public.zack_deca.anketa_poslata_at IS
  'Kad je poslata anketa o utiscima. NULL = nije slata.';
COMMENT ON COLUMN public.zack_deca.istek_mejl_at IS
  'Kad je javljeno da je poklon prošao. NULL = nije slato.';

-- ── Anketa ─────────────────────────────────────────────────────────────────
-- INTERNA je (odluka 22.08): nema pitanja o dozvoli za objavu, nema citata na
-- sajtu, nema imena. Postoji samo da vidimo šta da popravimo.
--
-- Prvo pitanje se odgovara KLIKOM IZ MEJLA, pa red mora da postoji pre nego
-- što roditelj bilo šta uradi - zato se pravi u trenutku slanja, sa tokenom.
CREATE TABLE IF NOT EXISTS public.zack_ankete (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Brisanje dečjeg profila nosi i anketu: to su podaci o tom detetu.
  dete_id UUID NOT NULL REFERENCES public.zack_deca(id) ON DELETE CASCADE,
  -- Tajni, neprebrojiv ključ iz linka. Bez njega se tuđa anketa ne može otvoriti
  -- ni popuniti; id deteta se u linku NIKAD ne pojavljuje.
  token TEXT NOT NULL UNIQUE,
  poslata_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- 1. pitanje (iz mejla): da li se dete vraća samo od sebe.
  vraca_se TEXT,
  vraca_se_at TIMESTAMPTZ,
  -- 2. pitanje (na strani): šta je detetu leglo - više odgovora.
  omiljeno TEXT[],
  -- 3. pitanje (na strani): šta bi trebalo popraviti - slobodan tekst, neobavezan.
  smeta TEXT,
  dovrsena_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS zack_ankete_dete_idx ON public.zack_ankete(dete_id);

-- Anketa se čita i piše ISKLJUČIVO preko servisne rute (token u linku je jedina
-- propusnica). Uključen RLS bez ijedne politike = niko sa anon/authenticated
-- ključem ne vidi ništa; service-role zaobilazi RLS i radi normalno.
ALTER TABLE public.zack_ankete ENABLE ROW LEVEL SECURITY;

-- ── Vraćanje unazad ────────────────────────────────────────────────────────
-- DROP TABLE public.zack_ankete;
-- ALTER TABLE public.zack_deca
--   DROP COLUMN aktivacija_podsetnik_at, DROP COLUMN anketa_poslata_at, DROP COLUMN istek_mejl_at;
