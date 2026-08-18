-- ISPRAVKA TEŠKE GREŠKE, 17.08.2026.
--
-- Prvobitna ruta za upis lekcije brisala je sve reči lekcije pa ih upisivala
-- ponovo. Pošto zack_slicice.rec_id ima ON DELETE CASCADE, to je kaskadno
-- brisalo SLIČICE SVE DECE za tu lekciju. Čim bi Nataša ispravila jednu kucaću
-- grešku i ponovo nalepila spisak, svako dete bi trajno izgubilo celu stranu
-- albuma, tiho i na uspešnom pozivu.
--
-- To krši vrhovno pravilo proizvoda: detetu se nikad ne oduzima ono što je
-- zaradilo.
--
-- Rešenje: reč se unutar lekcije prepoznaje po NEMAČKOM OBLIKU, ne po poziciji.
-- Ponovni unos onda ažurira postojeće redove umesto da ih briše, pa reči
-- zadržavaju svoj id i sličice prežive i ispravku prevoda i promenu redosleda.
-- Briše se samo ono što je Nataša stvarno izbacila iz spiska.

ALTER TABLE public.zack_reci ADD CONSTRAINT zack_reci_lekcija_de_key UNIQUE (lekcija_id, de);

-- Redni broj mora da sme da se privremeno poklopi usred jednog upisa, jer
-- premeštanje reči gore-dole u spisku prolazi kroz stanje u kome dve reči
-- nakratko dele isti redni broj. Odloženo ograničenje se proverava tek na kraju
-- transakcije, kad je raspored opet ispravan.
ALTER TABLE public.zack_reci DROP CONSTRAINT zack_reci_lekcija_id_redni_broj_key;
ALTER TABLE public.zack_reci ADD CONSTRAINT zack_reci_lekcija_id_redni_broj_key
  UNIQUE (lekcija_id, redni_broj) DEFERRABLE INITIALLY DEFERRED;

-- ── Vraćanje unazad ────────────────────────────────────────────────────────
-- ALTER TABLE public.zack_reci DROP CONSTRAINT zack_reci_lekcija_de_key;
-- ALTER TABLE public.zack_reci DROP CONSTRAINT zack_reci_lekcija_id_redni_broj_key;
-- ALTER TABLE public.zack_reci ADD CONSTRAINT zack_reci_lekcija_id_redni_broj_key
--   UNIQUE (lekcija_id, redni_broj);
