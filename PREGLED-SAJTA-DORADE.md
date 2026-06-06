# Pregled sajta — dorade (running lista)

> Nalazi tokom zajedničkog pregleda. 2026-06-01.
> NAPOMENA: raniji „odsečeno na desnoj ivici / horizontalni overflow" nalazi bili su **artefakt headless snimanja na ~390px** — Nataša potvrdila da je mobilni OK na pravom telefonu. Ti nalazi su uklonjeni.

## Realne dorade

### Tekst / stil
- [ ] Proveriti i ostale stranice za zaostalo persiranje (Vi umesto ti) i rodno obraćanje.

### Sadržaj/setup
- [x] **Google recenzije** — RADI (2026-06-01). Ključ je postojao u `.env.local` ali nije bio u Vercel env; dodat `GOOGLE_PLACES_API_KEY` u produkciju + redeploy. Sad prikazuje ocenu 5, 260 recenzija.

### Sadržaj — za Natašu
- [ ] **Post „preterit-u-nemackom-jeziku" ima pokvaren deo sadržaja** — odsečen string `.../2019/01/nepravilni-` zalepljen na `<a>` tag (nije prava slika, već je bio polomljen). Očistiti taj jedan red u tekstu.

## Urađeno (deployovano)
- [x] Hero mobilni — slika smanjena, vide se slika + naslov + dugmiće
- [x] „Šta je najvažnije?" mobilni — slika smanjena, vide se i VoKuM kartice
- [x] Goethe B1/C1 — prebačeni na nove stranice (is_purchasable + linkovi)
- [x] **Slike odvojene od starog WP-a** — 106 slika → Supabase Storage „blog-media"; 75 thumbnaila + 15 sadržaja u bazi + 3 u kodu prepisano; produkcija potvrđena (0 WP slika). BLOKER za gašenje WP-a rešen.
- [x] **Video kartica (naslovna)** → sad vodi na `/kursevi#video` (katalog otvara Video tab)
- [x] **Grupni `/grupni-kursevi` — filter po nivou** (Svi nivoi + A1/A2/B1/B2/C1) dodat
- [x] **„Drago mi je što si ovde!"** na o-natasi (ti-forma, rodno-neutralno)
- [x] **Individualni** — filter po nivou; „7-8 nedelja" → „prema tvom tempu"; profesori svi A1–C1 + specijalnosti (Milica FSP, Katarina konverzacija B2/C1, Hristina/Marija ispiti)
- [x] **Ujednačene kartice** — `KursCard` komponenta + `individualni-cards.ts` (jedan izvor); /individualni-kursevi i katalog tab izgledaju identično. Kartice klikabilne → detalj → kupovina.
- [x] **„Zakaži" → „Kupi"** svuda (individualni), jer zakazivanje ide POSLE uplate. (Napomena: `IndividualniNivoi.tsx` je sad nekorišćen — može da se obriše.)
- [x] **/o-natasi i /o-timu spojeni u jednu stranicu** (O Nataši → Vizija → tim sa profesorkama); `/o-timu` → 308 redirect na `/o-natasi`; sitemap i migraciona mapa ažurirani
