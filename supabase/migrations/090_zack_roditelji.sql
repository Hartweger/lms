-- Roditeljski nalog. Do sada dečji deo nije imao nikakvu prijavu: dete se
-- prepoznavalo po ključu u adresi, pa je ko god vidi link mogao da otvori
-- aplikaciju kao to dete. Ovo je zamena te brave.
--
-- PRAVNI RAZLOG, ne samo tehnički: kod nas dete mlađe od 15 godina ne može samo
-- da da pristanak za obradu podataka. Zato roditelj mora biti vlasnik naloga, i
-- zato se `pristanak_at` i `pristanak_tekst` upisuju. Čuva se ceo tekst na koji
-- je pristao, ne samo oznaka verzije, da postoji dokaz šta je stvarno videlo.
--
-- Dete se prijavljuje KODOM koji dobije od roditelja plus PIN-om od četiri
-- cifre. Bez mejla, jer dvanaestogodišnjak ne treba da ima nalog.
--
-- PIN se NIKAD ne čuva kao broj, samo kao nepovratan otisak. `pin_pokusaji` i
-- `zakljucano_do` postoje da se PIN ne može pogađati: četiri cifre je deset
-- hiljada kombinacija, što je ništa bez ograničenja.

CREATE TABLE public.zack_roditelji (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  pristanak_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pristanak_tekst TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zack_roditelji_auth ON public.zack_roditelji(auth_user_id);

ALTER TABLE public.zack_deca
  ADD COLUMN roditelj_id   UUID REFERENCES public.zack_roditelji(id) ON DELETE CASCADE,
  ADD COLUMN kod           TEXT UNIQUE,
  ADD COLUMN pin_hash      TEXT,
  ADD COLUMN pin_pokusaji  SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN zakljucano_do TIMESTAMPTZ;

CREATE INDEX idx_zack_deca_roditelj ON public.zack_deca(roditelj_id);

-- RLS: roditelj sme da pročita samo svoj red. Sve ostalo ide kroz rute sa
-- service-role klijentom, kao i ostatak dečjeg dela.
ALTER TABLE public.zack_roditelji ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roditelj cita svoj red" ON public.zack_roditelji
  FOR SELECT USING (auth_user_id = auth.uid());
CREATE POLICY "Admins manage zack_roditelji" ON public.zack_roditelji
  FOR ALL USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- ── Vraćanje unazad ────────────────────────────────────────────────────────
-- ALTER TABLE public.zack_deca
--   DROP COLUMN roditelj_id, DROP COLUMN kod, DROP COLUMN pin_hash,
--   DROP COLUMN pin_pokusaji, DROP COLUMN zakljucano_do;
-- DROP TABLE public.zack_roditelji;
