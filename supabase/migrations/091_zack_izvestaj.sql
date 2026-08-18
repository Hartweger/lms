-- Dvonedeljni izveštaj roditelju o napretku dece.
--
-- ZAŠTO NA DVE NEDELJE, A NE NEDELJNO
-- -----------------------------------
-- Nedeljni mejl je previše: roditelj koji svake nedelje dobija istu poruku
-- prestane da je otvara, a dete čiji je album miran dobija nedelju za nedeljom
-- podvučeno „ništa se nije desilo". Dve nedelje su dovoljno retke da svaki
-- izveštaj ima šta da kaže.
--
-- ZAŠTO SE VREME PAMTI PO RODITELJU, A NE PO RASPOREDU
-- ----------------------------------------------------
-- Cron se poziva jednom dnevno spolja i sam bira kome je vreme:
-- `poslednji_izvestaj_at` stariji od 13 dana znači „na redu je". Tako „na dve
-- nedelje" radi bez posebnog rasporeda, a novi roditelj (NULL) dobija prvi
-- izveštaj već sledećim prolazom.
--
-- ZAŠTO BROJAČ PRAZNIH PERIODA
-- ----------------------------
-- Isto pravilo kao za newsletter: ne opominjati. Ako nijedno dete roditelja
-- nije vežbalo dva perioda zaredom (mesec dana tišine), izveštaji se sami
-- gase uz poslednji miran mejl - umesto da mesecima stiže poruka „ništa".
-- Roditelj ih jednim klikom u panelu pali nazad.

ALTER TABLE public.zack_roditelji
  ADD COLUMN izvestaj_ukljucen BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN poslednji_izvestaj_at TIMESTAMPTZ,
  ADD COLUMN praznih_zaredom SMALLINT NOT NULL DEFAULT 0;

-- ── Vraćanje unazad ────────────────────────────────────────────────────────
-- ALTER TABLE public.zack_roditelji
--   DROP COLUMN izvestaj_ukljucen,
--   DROP COLUMN poslednji_izvestaj_at,
--   DROP COLUMN praznih_zaredom;
