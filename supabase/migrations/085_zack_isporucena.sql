-- Odluka B (17.08.2026): zarađeno se pamti odmah, kesica se otvara kasnije.
--
-- Bez ovoga napredak deteta živi samo u memoriji do kraja igre, pa dete koje
-- zatvori karticu ili ostane bez mreže nasred igre gubi sve što je zaradilo.
-- To krši vrhovno pravilo proizvoda: detetu se nikad ne oduzima ono što je
-- zaradilo.
--
-- Sa ovom kolonom red u zack_slicice ima četiri stanja:
--   reda nema                                    → prazno mesto u albumu
--   isporucena_at IS NULL                        → zarađena, čeka u neotvorenoj kesici
--   isporucena_at upisan, zalepljena_at IS NULL  → izašla iz kesice, u ruci
--   zalepljena_at upisan                         → zalepljena u albumu
--
-- Upiti koji hrane album MORAJU da filtriraju `isporucena_at IS NOT NULL`,
-- da album nikad ne prikaže reč koju dete još nije videlo.

ALTER TABLE public.zack_slicice ADD COLUMN isporucena_at TIMESTAMPTZ;

-- Neisporučene sličice se traže po detetu i lekciji pri otvaranju kesice.
CREATE INDEX idx_zack_slicice_neisporucene
  ON public.zack_slicice(dete_id)
  WHERE isporucena_at IS NULL;

-- ── Vraćanje unazad ────────────────────────────────────────────────────────
-- DROP INDEX public.idx_zack_slicice_neisporucene;
-- ALTER TABLE public.zack_slicice DROP COLUMN isporucena_at;
