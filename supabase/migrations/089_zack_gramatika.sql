-- Gramatika za Milionera, izvedena iz pregleda gramatike Maximala 1 (str. 76-77).
--
-- PRAVILO UGRAĐENO U ŠEMU: `od_lekcije` govori od koje je lekcije gradivo
-- obrađeno. Milioner sme da pita samo tačke sa `od_lekcije <= trenutna lekcija`.
-- Time se ne može desiti da dete izgubi na gramatici koju škola nije radila, a
-- to je pravilo koje već važi na platformi i ne sme da zavisi od pamćenja.
--
-- `objasnjenje` je kratak podsetnik u tri rečenice, isti onaj koji dete vidi
-- iznad Milionera i koji dobija kad potroši pomoć „pitaj profesorku".
--
-- Sadržaj je NAŠ. Iz udžbenika je preuzet samo redosled gradiva, što je
-- činjenica, a ne tekstovi ni zadaci.

CREATE TABLE public.zack_gramatika (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  udzbenik_id  UUID NOT NULL REFERENCES public.zack_udzbenici(id) ON DELETE CASCADE,
  redni_broj   SMALLINT NOT NULL,
  naziv        TEXT NOT NULL,
  objasnjenje  TEXT NOT NULL,
  primer       TEXT,
  od_lekcije   SMALLINT NOT NULL CHECK (od_lekcije > 0),
  UNIQUE (udzbenik_id, redni_broj)
);

CREATE TABLE public.zack_gramatika_pitanja (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gramatika_id UUID NOT NULL REFERENCES public.zack_gramatika(id) ON DELETE CASCADE,
  redni_broj   SMALLINT NOT NULL,
  pitanje      TEXT NOT NULL,
  opcije       JSONB NOT NULL,
  tacan        SMALLINT NOT NULL CHECK (tacan >= 0),
  tezina       SMALLINT NOT NULL DEFAULT 1 CHECK (tezina BETWEEN 1 AND 3),
  UNIQUE (gramatika_id, redni_broj)
);

CREATE INDEX idx_zack_gramatika_udzbenik ON public.zack_gramatika(udzbenik_id, od_lekcije);
CREATE INDEX idx_zack_gram_pitanja ON public.zack_gramatika_pitanja(gramatika_id);

ALTER TABLE public.zack_gramatika ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zack_gramatika_pitanja ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage zack_gramatika" ON public.zack_gramatika
  FOR ALL USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins manage zack_gramatika_pitanja" ON public.zack_gramatika_pitanja
  FOR ALL USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- ── Vraćanje unazad ────────────────────────────────────────────────────────
-- DROP TABLE public.zack_gramatika_pitanja, public.zack_gramatika;
