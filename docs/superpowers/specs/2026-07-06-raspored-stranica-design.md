# Posebna stranica /raspored — dizajn

Datum: 2026-07-06
Status: čeka Natašin pregled

## Cilj

Rekreirati staru WP stranicu „Raspored grupnih kurseva" (`/raspored-grupnih-kurseva`,
stari WP id 52111) kao novu, dizajnerski doteranu i mobile-responsive stranicu
`/raspored` na novom sajtu. Stranica je fokusirana samo na raspored + CTA,
laka za deljenje (mejl, Instagram).

## Kontekst

- Raspored već postoji kao sekcija na `/grupni-kursevi` (`RasporedGrupa.tsx`),
  podaci uživo iz Supabase preko `fetchRaspored()` (`src/lib/raspored.ts`),
  grupe se uređuju u `/admin/grupe`.
- Stara WP adresa ima trajni redirect na `/grupni-kursevi` u `next.config.ts:72`.
- Odluke sa brainstorminga:
  - Posebna `/raspored` stranica; postojeća sekcija na `/grupni-kursevi` ostaje.
  - Fokus na raspored + CTA (bez benefita/FAQ sekcija).
  - Dani se ispisuju PUNIM rečima („Utorak, Četvrtak") na OBE javne stranice;
    admin panel zadržava skraćenice.
  - NE ulazi u glavni meni (za sada); link u footeru.

## Podaci

Isključivo postojeći izvor: `fetchRaspored()` (server, service-role, statusi
`otvoren`/`uskoro`). Ništa se ne unosi ponovo i ne prave se novi API-ji.

**Dopuna (Natašin zahtev + otkriven živi bag):** cena i checkout link moraju
iz baze kurseva, ne iz koda — kad se kurs promeni u bazi, menja se i stranica.

- Zatečeno stanje na produkciji: „Prijavi se" na `/grupni-kursevi` vodi na
  `/kupovina/grupni-{nivo}` — takvi slugovi NE postoje u `courses`, pa A1/B1/B2
  daju 404, a A2 redirektuje nazad na raspored. Cene su hardkodovane u
  komponenti (`nivoPrices`).
- Fix: `fetchRaspored()` uz grupe čita i kupovne grupne kurseve
  (`courses`, `is_purchasable`, slug `grupni-…`) i razrešava kurs po grupi:
  prvo `groups.purchasable_course_id`, fallback po nivou preko postojeće
  `SLUG_TO_NIVO` mape (`src/lib/course-nivo.ts`) — isti obrazac kao
  `fillGroupCourseIds` u finansijama.
- `GrupaRaspored` dobija `checkoutSlug`, `cena`, `cenaEur` (iz `courses.slug`,
  `courses.price`, `courses.paypal_price_eur`). Obe komponente prikazuju cenu
  iz tih polja i linkuju na `/kupovina/{checkoutSlug}`; `nivoPrices` se BRIŠE.
- Ako kurs nije nađen (ne bi trebalo — mapa pokriva A1.1–C1.2): cena se ne
  prikazuje, CTA vodi na `/kontakt`.
- Jednokratni backfill: popuniti `groups.purchasable_course_id` za postojeće
  grupe (SQL po nivou); runtime fallback ostaje za buduće grupe.

## Izmene

### 1. `src/lib/groups.ts` — puni nazivi dana

- `DAY_LABELS_FULL: Record<number, string>` — 1: „Ponedeljak" … 7: „Nedelja".
- `formatDaysFull(days: number[] | null): string` — analogno `formatDays`,
  spaja zarezom.
- `resolveGroupCourse(g, courses)` — kupovni kurs za grupu: po
  `purchasable_course_id`, fallback po nivou preko `nivoForSlug`.
- `mapGroupToRaspored` dobija opcioni 4. parametar `course` i vraća nova polja
  `daniPuni`, `checkoutSlug`, `cena`, `cenaEur`.
- Vitest testovi uz postojeće (prazan niz, null, nepoznat broj, više dana;
  razrešavanje kursa po id-u, po nivou, bez pogotka).

### 2. `src/lib/raspored.ts`

- Interfejs `GrupaRaspored` dobija `daniPuni: string`, `checkoutSlug: string |
  null`, `cena: number | null`, `cenaEur: number | null`.
- `fetchRaspored()`: u select grupa dodaje `purchasable_course_id`; drugi upit
  čita kupovne grupne kurseve (`id, slug, price, paypal_price_eur`,
  `is_purchasable=true`, slug `grupni%`) — ODVOJEN upit, ne embed (vidi
  [[reference_course_access_no_fk_embed]] obrazac); prosleđuje
  `resolveGroupCourse` rezultat u `mapGroupToRaspored`.

### 3. Nova komponenta `src/components/RasporedKartice.tsx` (client)

Novi, doteran dizajn kartica u brend stilu (plava/koral, Montserrat, „ti" forma):

- Filter čipovi po nivou (Svi / A1 / A2 / B1 / B2 / C1) — samo nivoi koji postoje.
- Kartica: nivo bedž u boji nivoa, status bedž („Otvoren za upis" / „Uskoro" /
  „Popunjeno"), dani PUNIM rečima + vreme, početak + trajanje, profesorka,
  slobodna mesta sa vizuelnim indikatorom popunjenosti, cena din + ~€ IZ BAZE,
  dugme „Prijavi se" → `/kursevi/{checkoutSlug}` (stranica kursa sa svim detaljima; odatle kupovina).
- Ista poslovna logika kao `RasporedGrupa`, ali IZDVOJENA u zajednički modul
  `src/lib/raspored-prikaz.ts`: `nivoColors`, `getNivoKey`, `LEVEL_ORDER`,
  `formatPrice`, `EUR_RATE` (fallback za € kad kurs nema `paypal_price_eur`).
  Cene NISU tu — dolaze iz baze po grupi (vidi Podaci).
- Popunjeno ⇒ onemogućeno dugme; prazna stanja kao u postojećoj komponenti.
- Mobile-first: 1 kolona na telefonu, 2 na desktopu; čipovi se prelamaju.

### 4. Nova stranica `src/app/raspored/page.tsx` (server)

- Hero: h1 „Raspored grupnih kurseva" + podnaslov „Dva časa nedeljno u malim
  grupama od 3 do 6 polaznika."
- `const grupe = await fetchRaspored()` → `<RasporedKartice grupe={grupe} />`.
- CTA na dnu: „Ne znaš koji nivo? Besplatno testiranje" → `/besplatno-testiranje`
  (isti obrazac kao na `/grupni-kursevi`).
- Metadata (title, description, openGraph sa `/og/share.png`).

### 5. `RasporedGrupa.tsx` (postojeća, `/grupni-kursevi`)

- Prikaz `g.daniPuni` umesto `g.dani`.
- Lokalne `nivoColors`/`getNivoKey`/`LEVEL_ORDER`/`formatPrice` zamenjuju se
  uvozom iz `src/lib/raspored-prikaz.ts`; `nivoPrices` se briše.
- Cena i CTA link iz `g.cena`/`g.cenaEur`/`g.checkoutSlug` — OVO POPRAVLJA
  živi 404 bag na „Prijavi se" dugmadima.

### 6. Rute i vidljivost

- `next.config.ts`: redirect `/raspored-grupnih-kurseva` → `/raspored`
  (umesto → `/grupni-kursevi`).
- `sitemap.ts`: dodati `/raspored`.
- `Footer.tsx`: link „Raspored" uz „Grupni kursevi".
- Glavni meni (`Navigacija.tsx`): NE dirati.

## Testiranje

- Vitest: `formatDaysFull`, `resolveGroupCourse`, nova polja u
  `mapGroupToRaspored`.
- `npm run build` prolazi.
- Lokalna vizuelna provera (desktop + mobile viewport).
- Deploy ručno `vercel --prod` sa glavne grane, pa smoke test:
  `/raspored` prikazuje grupe, stara adresa 301 → `/raspored`,
  `/grupni-kursevi` radi sa punim danima, i KLJUČNO: svako „Prijavi se"
  vodi na postojeću checkout stranicu (200, ne 404) sa cenom iz baze.

## Van obima

- Benefiti/FAQ sekcije na /raspored.
- Izmene admin panela (`/admin/grupe` zadržava skraćenice).
- Izmene checkout-a, cena, Supabase šeme.
