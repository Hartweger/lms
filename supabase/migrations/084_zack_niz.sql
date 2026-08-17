-- Niz dana: koliko dana zaredom je dete igralo.
--
-- ZAŠTO
-- -----
-- Dolazak svaki dan je jedina navika koju ova aplikacija uopšte pokušava da
-- podrži, a bez pamćenja poslednjeg dana ne može ni da se izmeri. Dve kolone su
-- dovoljne: koliko dana traje niz i kog je dana poslednji put dopunjen.
--
-- ZAŠTO DATE, A NE TIMESTAMPTZ
-- ----------------------------
-- Dete koje igra u 23:50 pa sutradan u 00:10 nije preskočilo dan. Kad bi se
-- pamtio trenutak, računica bi zavisila od sati i takvom detetu bi niz izgledao
-- prekinuto. Zato se pamti samo kalendarski dan, i to onaj u zoni Europe/Belgrade,
-- koju računa aplikacija. U UTC-u bi svako igranje posle 22h (23h zimi) palo u
-- sutrašnji dan i tiho pokvarilo niz.
--
-- ZAŠTO DEFAULT 0, A NE 1
-- -----------------------
-- 0 znači „još nije počelo", i to je jedino stanje u kome se niz ne prikazuje.
-- Prikaz počinje tek od 2 dana naviše, jer „niz: 1 dan" nije dostignuće nego šum.
--
-- Ove kolone se NIKAD ne koriste za opomenu, podsetnik ni pritisak da se niz
-- održi. Prekinut niz se ne prikazuje kao gubitak; on prosto opet kreće od 1.

ALTER TABLE public.zack_deca
  ADD COLUMN niz SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN poslednji_dan DATE;

-- ── Vraćanje unazad ────────────────────────────────────────────────────────
-- ALTER TABLE public.zack_deca DROP COLUMN poslednji_dan, DROP COLUMN niz;
