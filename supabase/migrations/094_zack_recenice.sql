-- Igre iz rečenica + faza učenja (spec 2026-08-20-zack-ucenje-pa-razrada).
--
-- zack_recenice: jedan zapis hrani SVE TRI rečenične stavke (učenje rečenica,
-- slagalicu i dopunu) - ništa se ne unosi posebno po igri, kao i kod reči.
-- rec_id je „glavna reč": na nju se knjiže tačno (zaradi) i greška, pa kesica,
-- album i ponavljanje rade bez ijedne izmene.
--
-- PAZI: rec_id ima ON DELETE CASCADE - brisanje reči iz lekcije nosi i njene
-- rečenice. To je ispravno (rečenica bez glavne reči nema na šta da knjiži),
-- ali admin upis reči sa brisanjem treba da zna da uz reč odlaze i rečenice.
--
-- zack_ucenje_prolazi: da je dete JEDNOM prošlo fazu učenja (reči odnosno
-- rečenice) na lekciji. Otključava vežbe. Red se samo dodaje, nikad ne briše -
-- nestanak reda bi zaključao vežbe, a kvar uvek pada u korist deteta.

CREATE TABLE public.zack_recenice (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lekcija_id  UUID NOT NULL REFERENCES public.zack_lekcije(id) ON DELETE CASCADE,
  redni_broj  SMALLINT NOT NULL CHECK (redni_broj > 0),
  de          TEXT NOT NULL,
  sr          TEXT NOT NULL,
  praznina    TEXT NOT NULL,
  distraktori JSONB NOT NULL,
  rec_id      UUID NOT NULL REFERENCES public.zack_reci(id) ON DELETE CASCADE,
  samo_dopuna BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (lekcija_id, redni_broj),
  -- Ključ ponovnog upisa, kao (lekcija_id, de) kod reči.
  UNIQUE (lekcija_id, de)
);

CREATE INDEX idx_zack_recenice_lekcija ON public.zack_recenice(lekcija_id);

CREATE TABLE public.zack_ucenje_prolazi (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dete_id    UUID NOT NULL REFERENCES public.zack_deca(id) ON DELETE CASCADE,
  lekcija_id UUID NOT NULL REFERENCES public.zack_lekcije(id) ON DELETE CASCADE,
  faza       TEXT NOT NULL CHECK (faza IN ('reci', 'recenice')),
  prosao_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (dete_id, lekcija_id, faza)
);

CREATE INDEX idx_zack_ucenje_prolazi_dete ON public.zack_ucenje_prolazi(dete_id);

-- RLS potpuno zatvoren kao na svim zack_* tabelama: dečji deo čita isključivo
-- kroz /api/zack/* rute service-role klijentom.
ALTER TABLE public.zack_recenice       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zack_ucenje_prolazi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage zack_recenice" ON public.zack_recenice
  FOR ALL USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins manage zack_ucenje_prolazi" ON public.zack_ucenje_prolazi
  FOR ALL USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- ── Vraćanje unazad ────────────────────────────────────────────────────────
-- DROP TABLE public.zack_ucenje_prolazi, public.zack_recenice;
