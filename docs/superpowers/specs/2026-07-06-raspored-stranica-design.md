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

## Izmene

### 1. `src/lib/groups.ts` — puni nazivi dana

- `DAY_LABELS_FULL: Record<number, string>` — 1: „Ponedeljak" … 7: „Nedelja".
- `formatDaysFull(days: number[] | null): string` — analogno `formatDays`,
  spaja zarezom.
- `mapGroupToRaspored` vraća i novo polje `daniPuni` (uz postojeće `dani`).
- Vitest testovi uz postojeće (prazan niz, null, nepoznat broj, više dana).

### 2. `src/lib/raspored.ts`

- Interfejs `GrupaRaspored` dobija `daniPuni: string`. (Samo tip — mapiranje
  radi `mapGroupToRaspored`.)

### 3. Nova komponenta `src/components/RasporedKartice.tsx` (client)

Novi, doteran dizajn kartica u brend stilu (plava/koral, Montserrat, „ti" forma):

- Filter čipovi po nivou (Svi / A1 / A2 / B1 / B2 / C1) — samo nivoi koji postoje.
- Kartica: nivo bedž u boji nivoa, status bedž („Otvoren za upis" / „Uskoro" /
  „Popunjeno"), dani PUNIM rečima + vreme, početak + trajanje, profesorka,
  slobodna mesta sa vizuelnim indikatorom popunjenosti, cena din + ~€,
  dugme „Prijavi se" → `/kupovina/grupni-{nivo}` (postojeći checkout).
- Ista poslovna logika kao `RasporedGrupa`, ali IZDVOJENA u zajednički modul
  `src/lib/raspored-prikaz.ts`: `nivoColors`, `nivoPrices` (A1/A2/B1 19.600,
  B2/C1 21.200; €≈din/117), `getNivoKey`, `LEVEL_ORDER`, `formatPrice`.
  Obe komponente ga uvoze — cena se menja na jednom mestu.
- Popunjeno ⇒ onemogućeno dugme; prazna stanja kao u postojećoj komponenti.
- Mobile-first: 1 kolona na telefonu, 2 na desktopu; čipovi se prelamaju.

### 4. Nova stranica `src/app/raspored/page.tsx` (server)

- Hero: h1 „Raspored grupnih kurseva" + podnaslov „Dva časa nedeljno u malim
  grupama od 3 do 6 polaznika."
- `const grupe = await fetchRaspored()` → `<RasporedKartice grupe={grupe} />`.
- CTA na dnu: „Ne znaš koji nivo? Besplatno testiranje" → `/besplatno-testiranje`
  (isti obrazac kao na `/grupni-kursevi`).
- Metadata (title, description, openGraph sa `/og/share.png`).

### 5. `RasporedGrupa.tsx` (postojeća, `/grupni-kursevi`) — minimalna izmena

- Prikaz `g.daniPuni` umesto `g.dani`.
- Lokalne `nivoColors`/`nivoPrices`/`getNivoKey`/`LEVEL_ORDER`/`formatPrice`
  zamenjuju se uvozom iz `src/lib/raspored-prikaz.ts` (iste vrednosti,
  bez promene ponašanja). Ništa drugo se ne dira.

### 6. Rute i vidljivost

- `next.config.ts`: redirect `/raspored-grupnih-kurseva` → `/raspored`
  (umesto → `/grupni-kursevi`).
- `sitemap.ts`: dodati `/raspored`.
- `Footer.tsx`: link „Raspored" uz „Grupni kursevi".
- Glavni meni (`Navigacija.tsx`): NE dirati.

## Testiranje

- Vitest: `formatDaysFull` + `daniPuni` u `mapGroupToRaspored`.
- `npm run build` prolazi.
- Lokalna vizuelna provera (desktop + mobile viewport).
- Deploy ručno `vercel --prod` sa glavne grane, pa smoke test:
  `/raspored` prikazuje grupe, stara adresa 301 → `/raspored`,
  `/grupni-kursevi` i dalje radi sa punim danima.

## Van obima

- Benefiti/FAQ sekcije na /raspored.
- Izmene admin panela (`/admin/grupe` zadržava skraćenice).
- Izmene checkout-a, cena, Supabase šeme.
