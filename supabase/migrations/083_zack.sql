-- zack: dečja aplikacija za nemački (5-8. razred), prva celina.
-- Sadržajni model + album sa sličicama. Igre iz rečenica dolaze kasnije.
--
-- VAŽNO o privatnosti: zack_deca sme da sadrži SAMO ime deteta. Bez prezimena,
-- bez mejla, bez datuma rođenja. Dete se u ovoj fazi identifikuje UUID-om u
-- adresi, pa je svaki dodatni lični podatak nepotreban rizik.

CREATE TYPE zack_rod AS ENUM ('der', 'die', 'das', 'nema');
CREATE TYPE zack_vrsta AS ENUM ('imenica', 'glagol', 'pridev', 'ostalo');

CREATE TABLE public.zack_udzbenici (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  izdavac    TEXT NOT NULL,
  naziv      TEXT NOT NULL,
  razred     SMALLINT NOT NULL CHECK (razred BETWEEN 5 AND 8),
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.zack_lekcije (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  udzbenik_id    UUID NOT NULL REFERENCES public.zack_udzbenici(id) ON DELETE CASCADE,
  broj           SMALLINT NOT NULL CHECK (broj > 0),
  naziv          TEXT NOT NULL,
  pravilo_naslov TEXT,
  pravilo_tekst  TEXT,
  pravilo_primer TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (udzbenik_id, broj)
);

CREATE TABLE public.zack_reci (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lekcija_id UUID NOT NULL REFERENCES public.zack_lekcije(id) ON DELETE CASCADE,
  redni_broj SMALLINT NOT NULL CHECK (redni_broj > 0),
  de         TEXT NOT NULL,
  sr         TEXT NOT NULL,
  rod        zack_rod NOT NULL DEFAULT 'nema',
  mnozina    TEXT,
  vrsta      zack_vrsta NOT NULL DEFAULT 'ostalo',
  izuzetak   BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (lekcija_id, redni_broj)
);

CREATE INDEX idx_zack_reci_lekcija ON public.zack_reci(lekcija_id);

CREATE TABLE public.zack_deca (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ime         TEXT NOT NULL,
  udzbenik_id UUID NOT NULL REFERENCES public.zack_udzbenici(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.zack_slicice (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dete_id            UUID NOT NULL REFERENCES public.zack_deca(id) ON DELETE CASCADE,
  rec_id             UUID NOT NULL REFERENCES public.zack_reci(id) ON DELETE CASCADE,
  zaradjena_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  zalepljena_at      TIMESTAMPTZ,
  poslednje_tacno_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (dete_id, rec_id)
);

CREATE INDEX idx_zack_slicice_dete ON public.zack_slicice(dete_id);

-- RLS: potpuno zatvoreno za anon i authenticated. Dečja aplikacija čita
-- ISKLJUČIVO kroz /api/zack/* rute koje koriste service-role klijent i time
-- zaobilaze RLS. Ovo je namerno, da se ne ponovi slučaj sa javno čitljivim
-- vežbama.
ALTER TABLE public.zack_udzbenici ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zack_lekcije   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zack_reci      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zack_deca      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zack_slicice   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage zack_udzbenici" ON public.zack_udzbenici
  FOR ALL USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins manage zack_lekcije" ON public.zack_lekcije
  FOR ALL USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins manage zack_reci" ON public.zack_reci
  FOR ALL USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins manage zack_deca" ON public.zack_deca
  FOR ALL USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins manage zack_slicice" ON public.zack_slicice
  FOR ALL USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- ── Vraćanje unazad, ako se od projekta odustane ───────────────────────────
-- DROP TABLE public.zack_slicice, public.zack_deca, public.zack_reci,
--            public.zack_lekcije, public.zack_udzbenici CASCADE;
-- DROP TYPE zack_vrsta, zack_rod;
