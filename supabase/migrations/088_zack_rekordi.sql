-- Lični rekord u skakaču: dokle se dete popelo pre nego što je potrošilo srca.
--
-- ZAŠTO POSTOJI: bez rekorda svaka partija staje na broju imenica u lekciji, pa
-- je vrhunac uvek isti i nema šta da se obori. Visina tada govori GDE je dete,
-- ali ne i zašto bi krenulo ponovo. Rekord od partije pravi pokušaj.
--
-- ZAŠTO PO LEKCIJI, a ne ukupno: lekcija sa pet reči i lekcija sa dvadeset nisu
-- iste težine, pa bi jedan zajednički broj bio nepravedan i brzo nedostižan.
--
-- ZAŠTO KOLONA `igra`: ista mehanika penjanja kasnije radi i za množinu i za
-- jak/slab glagol. Bez ovoga bi ti rekordi curili jedan u drugi.
--
-- PRAVILO: rekord SAMO raste. Nema koda koji ga smanjuje. Slabija partija ne
-- briše bolju, i detetu se nikad ne kaže da je nešto izgubilo. To je isto ono
-- pravilo zbog kog izbledela sličica ne nestaje i zbog kog pad u skakaču ne
-- obara visinu.

CREATE TABLE public.zack_rekordi (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dete_id       UUID NOT NULL REFERENCES public.zack_deca(id) ON DELETE CASCADE,
  lekcija_id    UUID NOT NULL REFERENCES public.zack_lekcije(id) ON DELETE CASCADE,
  igra          TEXT NOT NULL,
  sprat         SMALLINT NOT NULL DEFAULT 0 CHECK (sprat >= 0),
  postavljen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (dete_id, lekcija_id, igra)
);

CREATE INDEX idx_zack_rekordi_dete ON public.zack_rekordi(dete_id);

-- RLS zatvoren kao i na ostalim zack tabelama: dečji deo čita samo kroz rute sa
-- service-role klijentom.
ALTER TABLE public.zack_rekordi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage zack_rekordi" ON public.zack_rekordi
  FOR ALL USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- ── Vraćanje unazad ────────────────────────────────────────────────────────
-- DROP TABLE public.zack_rekordi;
