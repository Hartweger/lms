-- Sličica dobija sliku, jer se `Stuhl` uz crtež stolice pamti mnogo bolje nego
-- `Stuhl` uz reč „stolica". To je i razlog zašto pravi albumi sa sličicama
-- uopšte imaju slike.
--
-- PRAVILO KOJE SE NE KRŠI: slika stoji SAMO na sličici, u kesici i u albumu.
-- Nikad u pitanju. Ako se u „Brzo biranje" pored reči pojavi crtež, dete više
-- ne prevodi nego pokazuje na sliku, i igra prestaje da meri znanje.
--
-- Vrednost je oznaka ikonice iz lokalnog skupa (Twemoji, licenca CC BY 4.0,
-- dozvoljena komercijalna upotreba i prerada uz navođenje autora). NULL je
-- sasvim normalno stanje: konkretne imenice se crtaju, glagoli i apstraktne
-- reči ne. Odsustvo slike mora da izgleda namerno, ne kao da nešto fali.

ALTER TABLE public.zack_reci ADD COLUMN ikonica TEXT;

COMMENT ON COLUMN public.zack_reci.ikonica IS
  'Oznaka ikonice iz lokalnog skupa (Twemoji, CC BY 4.0), npr. "1fa91" za stolicu. NULL znaci da rec nema sliku, sto je normalno za apstraktne reci i glagole.';

-- ── Vraćanje unazad ────────────────────────────────────────────────────────
-- ALTER TABLE public.zack_reci DROP COLUMN ikonica;
