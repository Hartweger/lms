-- course_unlocks: mapira KUPOVNI kurs (is_purchasable shell: grupni/individualni/paket/video)
-- na SADRŽAJNI kurs (onaj koji stvarno ima lekcije, npr. nemacki-a2-1).
-- Ovo je nativna zamena za WC_PRODUCT_MAP — preduslov za gašenje WooCommerce-a.
-- Checkout/confirm: za svaki kupljeni proizvod otključava se sav vezani sadržaj.

CREATE TABLE public.course_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchasable_course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  content_course_id     UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(purchasable_course_id, content_course_id)
);

CREATE INDEX idx_course_unlocks_purchasable ON public.course_unlocks(purchasable_course_id);

-- RLS: čitanje za prijavljene (mapa nije osetljiva), upravljanje samo admin.
-- Service-role (confirm ruta) ionako zaobilazi RLS.
ALTER TABLE public.course_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read unlocks" ON public.course_unlocks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage unlocks" ON public.course_unlocks
  FOR ALL USING (
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- ── Seed (slug → slug, otporno na ponovno pokretanje) ──────────────────────
INSERT INTO public.course_unlocks (purchasable_course_id, content_course_id)
SELECT p.id, c.id
FROM (VALUES
  -- Samostalni video kursevi (kupovni zapis SAM ima lekcije)
  ('fsp','fsp'),
  ('gramatika-a2-b1','gramatika-a2-b1'),
  ('polozi-fide','polozi-fide'),
  ('polozi-goethe-c1','polozi-goethe-c1'),
  ('polozi-goethe-b1','polozi-goethe-b1'),
  ('kurs-za-mame-i-trudnice','kurs-za-mame-i-trudnice'),

  -- VIDEO kursevi po nivou → oba sadržajna podnivoa
  ('video-kurs-a1','nemacki-a1-1'),
  ('video-kurs-a1','nemacki-a1-2'),
  ('video-kurs-a2','nemacki-a2-1'),
  ('video-kurs-a2','nemacki-a2-2'),
  ('video-kurs-b1','nemacki-b1-1'),
  ('video-kurs-b1','nemacki-b1-2'),

  -- Paketi
  ('paket-a1-a2','nemacki-a1-1'),
  ('paket-a1-a2','nemacki-a1-2'),
  ('paket-a1-a2','nemacki-a2-1'),
  ('paket-a1-a2','nemacki-a2-2'),
  ('paket-a1-i-a2','nemacki-a1-1'),
  ('paket-a1-i-a2','nemacki-a1-2'),
  ('paket-a1-i-a2','nemacki-a2-1'),
  ('paket-a1-i-a2','nemacki-a2-2'),
  ('paket-a1-a2-b1','nemacki-a1-1'),
  ('paket-a1-a2-b1','nemacki-a1-2'),
  ('paket-a1-a2-b1','nemacki-a2-1'),
  ('paket-a1-a2-b1','nemacki-a2-2'),
  ('paket-a1-a2-b1','nemacki-b1-1'),
  ('paket-a1-a2-b1','nemacki-b1-2'),
  ('paket-nivo-a1-a1-1-a1-2-individualni-standard','nemacki-a1-1'),
  ('paket-nivo-a1-a1-1-a1-2-individualni-standard','nemacki-a1-2'),

  -- GRUPNI → sadržajni nivo (polaznici dobijaju video lekcije sa Natašom)
  ('grupni-kurs-nemackog-jezika-a1-1','nemacki-a1-1'),
  ('grupni-kurs-nemackog-jezika-a1-2-2','nemacki-a1-2'),
  ('grupni-kurs-nemackog-jezika-a2','nemacki-a2-1'),
  ('grupni-kurs-nemackog-jezika-a2-2','nemacki-a2-2'),
  ('grupni-kurs-nemackog-jezika-b1-1-2','nemacki-b1-1'),
  ('grupni-kurs-nemackog-b1-2','nemacki-b1-2'),
  ('grupni-kurs-b2-1','nemacki-b2-1'),
  ('grupni-kurs-b2-2','nemacki-b2-2'),

  -- INDIVIDUALNI po nivou → isti sadržaj kao grupni/video tog nivoa
  ('individualni-kurs-nemackog-jezika-a11','nemacki-a1-1'),
  ('individualni-kurs-nemackog-jezika-a1-2','nemacki-a1-2'),
  ('individualni-kurs-nemackog-jezika-a2','nemacki-a2-1'),
  ('individualni-kurs-nemackog-jezika-a2-2','nemacki-a2-2'),
  ('individualni-kurs-nemackog-jezika-b11','nemacki-b1-1'),
  ('individualni-kurs-nemackog-jezika-b1-2','nemacki-b1-2'),
  ('individualni-kurs-nemackog-jezika-b2-1','nemacki-b2-1'),
  ('individualni-polozi-fide','polozi-fide'),
  ('fsp-individualni','fsp')

  -- NAMERNO BEZ MAPE:
  --   grupni-kurs-c1-1, grupni-kurs-c1-2  → C1 sadržaj još ne postoji
  --   individualni-mesecni-paketi         → mesečni: bez videa (samo časovi uživo)
) AS m(purchasable_slug, content_slug)
JOIN public.courses p ON p.slug = m.purchasable_slug
JOIN public.courses c ON c.slug = m.content_slug
ON CONFLICT (purchasable_course_id, content_course_id) DO NOTHING;
