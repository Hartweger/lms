# Cookie saglasnost + politika privatnosti — dizajn

**Datum:** 2026-06-07
**Sajt:** kurs.hartweger.rs (Next.js LMS)
**Cilj:** Uskladiti sajt sa GDPR/ZZPL — saglasnost za Google kolačiće (analitika + oglasi) i politika privatnosti, bez gubitka kvaliteta podataka za plaćene oglase.

## Kontekst i motivacija

Sajt trenutno postavlja:
- **Auth kolačiće** (Supabase, `@supabase/ssr`) — neophodni, ne traže saglasnost.
- **Google kolačiće** (GTM `GTM-KNP5DKDR` + GA4 `G-MB9DRXVVF6`) — učitavaju se odmah, bez saglasnosti. NIJE usklađeno.
- **Vercel Analytics + Speed Insights** — cookieless, već usklađeni, NE diramo.

Nema bannera za saglasnost ni stranice politike privatnosti. Vlasnica vrti plaćene Google/Meta oglase, pa je bitno da praćenje konverzija i remarketing ostanu što funkcionalniji uz usklađenost → biramo **Google Consent Mode v2**.

## Odluke

- **Pristup saglasnosti:** Google Consent Mode v2 (ne strogo blokiranje, ne „banner za fazon").
- **Politika privatnosti:** zasebna stranica `/politika-privatnosti`.
- **Banner:** dva ravnopravna dugmeta „Prihvatam" / „Odbijam" + link na politiku. Bez kategorija/toggle-ova, bez CMP platforme.
- **Vercel Analytics/Speed Insights:** ostaju kakvi jesu (cookieless).
- **Auth kolačići:** ne diraju se (neophodni).
- **Ton:** „ti" forma, brend boje.

## Komponente

### 1. Google Consent Mode v2 (izmena `src/app/layout.tsx`)

Inline skript koji se izvršava **PRE** GTM/GA, postavlja podrazumevane saglasnosti na `denied`:

- `ad_storage: 'denied'`
- `analytics_storage: 'denied'`
- `ad_user_data: 'denied'`
- `ad_personalization: 'denied'`
- (`wait_for_update` da se sačeka korisnikov izbor)

GTM/GA4 se i dalje učitavaju (kao sada), ali bez kolačića dok saglasnost nije `granted`. Redosled skriptova je kritičan: consent-default mora pre GTM-a (`beforeInteractive` ili inline u `<head>`).

Ako je u `localStorage` već zapisana saglasnost `granted` (povratni posetilac), inline skript odmah šalje `consent update` na `granted` da se ne čeka banner.

### 2. `CookieBanner.tsx` (nova klijentska komponenta, renderuje se iz `layout.tsx`)

- Pri montiranju čita `localStorage['cookie-consent']`.
  - Ako vrednost postoji (`granted`/`denied`) → banner se ne prikazuje.
  - Ako ne postoji → prikazuje banner.
- **„Prihvatam"** → `gtag('consent','update', { ad_storage:'granted', analytics_storage:'granted', ad_user_data:'granted', ad_personalization:'granted' })`, upiše `localStorage['cookie-consent']='granted'`, sakrije banner.
- **„Odbijam"** → upiše `localStorage['cookie-consent']='denied'`, sakrije banner (saglasnost ostaje `denied`, ništa se ne šalje).
- Link **„Saznaj više"** → `/politika-privatnosti`.
- Stil: diskretna tračica na dnu, brend boje, ne blokira sadržaj, responsivna.

### 3. Stranica `/politika-privatnosti` (`src/app/politika-privatnosti/page.tsx`, server komponenta)

Tekst prilagođen sa starog WP-a + dopunjen realnošću novog sajta. Sekcije:
- Ko smo / kontakt (info@hartweger.rs)
- Koji podaci se prikupljaju i zašto
- Obrađivači (treće strane):
  - **Supabase** — nalog, autentikacija, sesija
  - **Google (GA4 / Ads / GTM)** — analitika i oglasi (samo uz saglasnost)
  - **Vercel** — hosting + anonimna (cookieless) analitika
  - **Resend** — slanje mejlova
- Kolačići: neophodni (auth) vs. analitički/marketinški (Google, uz saglasnost)
- Prava korisnika: pristup, ispravka, brisanje, opoziv saglasnosti
- Kako opozvati saglasnost (obrisati `localStorage`/kolačiće, ili kontakt)

Metadata: `title`, `description`, `robots: index`.

### 4. Footer (`src/components/Footer.tsx`)

Dodati link **„Politika privatnosti"** u „Dokumenti" listu (pored „Uslovi korišćenja", „Kontakt").

## Šta NE radimo (YAGNI)

- Bez granularnih kategorija / preferenci.
- Bez consent management platforme (CMP).
- Ne diramo Vercel analitiku (cookieless).
- Ne diramo auth kolačiće.
- Ne primenjujemo na stari WP (gasi se).

## Testiranje

- **Vitest:** logika saglasnosti — čita/piše `localStorage`, poziva `gtag('consent','update', …)` sa tačnim vrednostima za prihvatanje/odbijanje; banner se ne prikazuje kad je izbor već zapisan.
- **Ručno (browser):**
  1. Prvi put: banner vidljiv, NEMA `_ga`/`_gid` kolačića.
  2. „Prihvatam" → `_ga` kolačići se pojave, banner nestane, refresh ne prikazuje banner.
  3. „Odbijam" → nema Google kolačića, banner nestane, refresh ne prikazuje banner.
  4. Consent Mode: u Network/Tag Assistant videti `consent default … denied` pa `update` posle klika.
- **Posle deploya:** smoke test (PostToolUse hook) + provera CDN keša sa cache-busterom.

## Rizici / napomene

- Redosled skriptova u `layout.tsx` mora biti tačan (consent default pre GTM-a) — inače Consent Mode ne hvata početni `denied`.
- `next.config` redirecti: dodati `/politika-privatnosti` ako negde postoji stari URL (proveriti coverage).
