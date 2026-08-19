-- Pamćenje grešaka: pogrešno odgovorene reči iz igara i promašena Milionerova
-- pitanja, po detetu.
--
-- ČEMU SLUŽI
-- ----------
-- Dve stvari, obe u korist deteta i nijedna protiv njega:
--   1. Igre kasnijih lekcija mešaju u pitanja i reči iz ranijih, a prednost pri
--      izboru imaju baš one na kojima je dete grešilo (i izbledele sličice).
--   2. Milioner pri sastavljanju partije daje prednost pitanjima koja su ranije
--      promašena, da se rupa u gradivu ne zaobilazi slučajnošću.
--
-- Greška se NIKAD ne pokazuje detetu kao spisak ni kao ocena. Ovo je memorija
-- aplikacije, ne dnevnik neuspeha: jedini vidljivi trag je to što se prava reč
-- češće pojavi pred detetom.
--
-- JEDAN RED = JEDNA REČ (ILI JEDNO PITANJE) PO DETETU
-- ---------------------------------------------------
-- Ponovljena greška ne dodaje red nego uvećava `broj` i osvežava `poslednja_at`.
-- Zato su UNIQUE indeksi parcijalni: red nosi TAČNO JEDNO od rec_id/pitanje_id
-- (CHECK ispod), pa se jedinstvenost čuva po onoj koloni koja je popunjena.
--
-- RLS je potpuno zatvoren (samo admin), kao i na ostalim zack_* tabelama: dete
-- nema svoj Supabase nalog, sve ide kroz /api/zack/* service-role klijentom.

CREATE TABLE public.zack_greske (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dete_id      UUID NOT NULL REFERENCES public.zack_deca(id) ON DELETE CASCADE,
  rec_id       UUID REFERENCES public.zack_reci(id) ON DELETE CASCADE,
  pitanje_id   UUID REFERENCES public.zack_gramatika_pitanja(id) ON DELETE CASCADE,
  broj         SMALLINT NOT NULL DEFAULT 1,
  poslednja_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Tačno jedno od dva: greška je ili na reči ili na pitanju gramatike,
  -- nikad ni na jednom i nikad na oba.
  CHECK ((rec_id IS NULL) <> (pitanje_id IS NULL))
);

CREATE UNIQUE INDEX uq_zack_greske_rec
  ON public.zack_greske (dete_id, rec_id) WHERE rec_id IS NOT NULL;
CREATE UNIQUE INDEX uq_zack_greske_pit
  ON public.zack_greske (dete_id, pitanje_id) WHERE pitanje_id IS NOT NULL;
-- Ekran lekcije i Milioner čitaju sve greške jednog deteta odjednom.
CREATE INDEX idx_zack_greske_dete ON public.zack_greske (dete_id);

ALTER TABLE public.zack_greske ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage zack_greske" ON public.zack_greske
  FOR ALL USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- ── Vraćanje unazad ────────────────────────────────────────────────────────
-- DROP TABLE public.zack_greske;
