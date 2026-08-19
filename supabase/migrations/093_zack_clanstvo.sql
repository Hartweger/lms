-- 093: zack! članstvo - mesečna pretplata PO DETETU (1.200 promo / 2.399 puna).
--
-- Jaše postojeći pretplatni sistem (070/071): kupovni proizvod je red u courses,
-- naplate idu kroz orders + subscriptions + subscriptions-poll cron, fiskalizacija
-- istim tokom. Razlika je samo KOME pristup pripada: kupac je roditelj, a pristup
-- detetu - zato subscriptions dobija nullable dete_id, a rok članstva stoji na
-- samom detetu (zack_deca.clanstvo_do), ne u course_access.
--
-- Pravilo pristupa (lib/zack/clanstvo.ts): dete je otključano ako je oslobođeno
-- (pilot porodice i naša probna deca - admin pali SQL-om), ili nema roditelja
-- (roditelj_id IS NULL = interna probna deca), ili mu članstvo još važi.
-- Bez članstva se zaključavaju SAMO igre/kesice/Milioner; album i sve zarađeno
-- ostaje vidljivo - detetu se ništa ne oduzima.

ALTER TABLE public.zack_deca
  ADD COLUMN IF NOT EXISTS oslobodjeno BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS clanstvo_do TIMESTAMPTZ;

-- Pretplata za dete: NULL za sve školske pretplate (paket, NH Membership).
-- Grananje "ovo je zack pretplata" ide po dete_id IS NOT NULL.
-- ON DELETE SET NULL: brisanje dečjeg profila ne sme da obriše finansijski trag.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS dete_id UUID REFERENCES public.zack_deca(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS subscriptions_dete_idx ON public.subscriptions(dete_id);

-- Kupovni proizvod. is_published=false: ne pojavljuje se u katalozima; kupovina
-- ide kroz namensku stranicu /kupovina/zack-clanstvo (server čita admin
-- klijentom). BEZ course_unlocks - pristup ne ide kroz course_access.
-- price = promo rata; puna cena (2.399) je prikazna konstanta u lib/zack/clanstvo.ts.
INSERT INTO public.courses
  (title, slug, description, course_type, category, price, is_published, is_purchasable)
VALUES
  ('zack! članstvo',
   'zack-clanstvo',
   'Mesečno članstvo za dečju aplikaciju zack! - igre, kesice sa sličicama i Milioner za jedno dete. Obnavlja se automatski, otkazuje se jednim klikom.',
   'video', 'membership', 1200, false, true)
ON CONFLICT (slug) DO NOTHING;

-- ── Vraćanje unazad ────────────────────────────────────────────────────────
-- DELETE FROM public.courses WHERE slug = 'zack-clanstvo';
-- ALTER TABLE public.subscriptions DROP COLUMN dete_id;
-- ALTER TABLE public.zack_deca DROP COLUMN oslobodjeno, DROP COLUMN clanstvo_do;
