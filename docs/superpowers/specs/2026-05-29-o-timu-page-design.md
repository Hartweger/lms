# /o-timu Stranica — Design Spec

**Date:** 2026-05-29
**Status:** Approved
**Branch:** `feat/wp-migration`

## Goal

Create `/o-timu` page that presents the Hartweger teaching team — Nataša as founder + 6 professors with photos and full bios.

---

## Structure

### 1. Hero
- Title: "Naš tim"
- Subtitle: "Upoznaj profesorke koje će te voditi kroz učenje nemačkog jezika — svaka sa jedinstvenim pristupom i iskustvom."
- Gradient background (plava-light → white), centered text

### 2. Nataša — Featured Card
- Highlighted card with light background + border
- Round photo (from `/images/IMG_6264.jpg`)
- Name, role: "Osnivačica i kreator VoKuM metode"
- Short description + "Saznaj više o Nataši →" link to `/o-natasi`

### 3. Profesorke Section
- Heading: "Naše profesorke"
- Vertical stack of cards, max-width 700px centered
- Each card: image (left, rounded corners, 140px, `object-fit: contain`, light bg) + text (right)
- On mobile: image above text (stacked)
- Full bio text, no truncation, multiple paragraphs

### 4. CTA
- "Spreman/na za učenje?" heading
- "Izaberi kurs koji ti odgovara i počni već danas."
- Button: "Pogledaj kurseve →" → `/kursevi`
- Gradient background (white → plava-light)

---

## Professors (order as listed)

### 1. Katarina Todosijević
- Role: Prof. nemačkog jezika
- Image: `Hartweger_Katarina_Todosijevic.png`
- Bio: Katarina inspiraciju za podučavanje nemačkog jezika pronalazi u ljudima. Odmalena je bila okružena nemačkim jezikom kroz televiziju, što je oblikovalo njen osećaj za jezik i izgovor. Osnovne studije Germanistike završila je na Univerzitetu u Kragujevcu, a kao stipendistkinja boravila je i na Univerzitetu u Triru. Ljubav prema komunikaciji odvela je i na master studije na Ekonomskom fakultetu u Kragujevcu, dok ju je srce vratilo jeziku - do dodatnog zvanja Master filologa na Univerzitetu u Beogradu, Goethe C2 sertifikata i Švajcarske.
  
  Obožava rad na višim nivoima, individualne konverzacijske časove i pripremu za Goethe, telc, fide i ÖSD ispite. Fokusira se na praktičnu i svrsishodnu upotrebu jezika, verujući da se uz pravi pristup može savladati sve - od razlike u izgovoru između ö i ü do sigurnog korišćenja nemačkog u svakodnevnim i profesionalnim situacijama.
  
  Vrline: Naučiće te frazama koje ne stoje u udžbenicima i preporučiće dobre lokalne restorane širom južne Nemačke, jugoistočne Francuske i severne Švajcarske.
  
  Slabosti: Mršti se na das ili božemesačuvaj der Nutella, ali ne insistira da učiš članove, već reči.

### 2. Milica Vučić
- Role: Prof. nemačkog jezika
- Image: `Milica_Vucic_Hartweger.png`
- Bio: Milica Vučić je diplomirani profesor nemačkog jezika sa iskustvom u online nastavi i radu sa odraslim polaznicima. Na časovima se fokusira na praktičnu komunikaciju, konverzaciju i pripremu za međunarodne ispite iz nemačkog jezika kao što su Goethe-Zertifikat, telc Deutsch i ÖSD Zertifikat Deutsch.
  
  Pored opšteg nemačkog jezika, bavi se i stručnim nemačkim jezikom u oblasti medicine i pripremom lekara za Fachsprachprüfung. U radu koristi praktične zadatke, konverzacione vežbe i simulacije ispita uz detaljan feedback, kako bi polaznici stekli sigurnost u komunikaciji i uspešno položili ispit.

### 3. Hristina Šarčević Bulatović
- Role: Prof. nemačkog jezika
- Image: `Hartweger_Hristina_Sarcevic.png`
- Bio: Hristina je master filolog germanista sa višegodišnjim iskustvom. Ljubav prema nemačkom jeziku se javila u osnovnoj školi koja je kasnije prerasla u profesiju i životno opredeljenje. Za vreme osnovnih studija boravila je u Nemačkoj gde je bila praktikant u državnim ustanovama i svoje znanje je nadograđivala na Univerzitetu u Bambergu. Sfera njenih interesovanja je metodika nastave nemačkog jezika kao i upotreba informaciono-komunikacionih tehnologija u nastavi što njene časovi čini interesantnim. U nastavi koristi digitalne alate za učenje koji su inovativni i zanimljivi polaznicima.
  
  Sa njom ćeš se temeljno pripremiti za međunarodni sertifikat koji ti je neophodan, jer ima višegodišnje iskustvo u pripremi zvaničnih ispita kao što su TELC, GOETHE i ÖSD. Pre svega je fokusirana na individualnu nastavu gde je maksimalno posvećena svakom polazniku. Temeljna je, kreativna i strpljiva u radu i njen cilj je da prenese znanje i ljubav prema nemačkom jeziku.

### 4. Suzana Marjanović
- Role: Prof. nemačkog jezika
- Image: `Suzana_Marjanovic_Hartweger.png`
- Bio: Suzana je Diplomirani profesor nemačkog jezika i književnosti, sa višegodišnjim iskustvom i radom u Nemačkoj. Kombinacijom ta dva iskustva, priprema učenike za svakodnevne situacije i pomaže im da se integrišu u društvo. Stoga se trudi da nastava metodički obuhvata sve neophodne kompetencije, ali i da pre svega bude tematski interesantna.
  
  Polazi od toga da se njena nastava prilagođava učenicima, njihovim dodatnim zahtevima i željama, zatim krenu zajedničkim putem do ostvarenja cilja. Ukoliko je tvoj cilj polaganje sertifikata, Suzana takođe ima iskustva u tome. Tako da sa tobom uvežbava upravo ono što možeš da očekuješ na polaganju.
  
  Ljubav prema ovom poslu rodila se još za vreme studija. Uspeh, ostvareni ciljevi i pozitivni komentari učenika su njena najveća motivacija.

### 5. Marija Radojković Stanojić
- Role: Prof. nemačkog jezika
- Image: `Hartweger_Marija_Radojkovic.png`
- Bio: Marija je Master filolog germanista i od 2019. godine je deo našeg tima. Ljubav prema nemačkom jeziku i profesorskom pozivu se kod nje razvija još u gimnaziji te se kasnije na studijama u Srbiji i Nemačkoj rado posvećuje metodičkim predmetima. Odmah nakon završenih studija počinje sa radom kao profesorka i nastavlja usavršavanje na tom polju.
  
  Najveću motivaciju pronalazi u zadovoljnim učenicima, praćenju njihovog napretka i položenim zvaničnim ispitima za koje već nekoliko godina uspešno priprema polaznike. Na časovima se sa puno strpljenja i razumevanja posvećuje polazniku i njegovim ciljevima, a konverzaciju na nemačkom jeziku od samog početka učenja stavlja na prvo mesto.

### 6. Danica Trnavac
- Role: Prof. nemačkog jezika
- Image: `Danica_Antonijevic_Hartweger.png`
- Bio: Danica je profesorka nemačkog jezika koja gaji veliku strast prema predavanju i prenošenju znanja drugima. Inspiraciju za svoj poziv pronašla je u ljubavi prema putovanjima, stranim jezicima i kulturama. Njena karijera započela je radom sa decom, što joj je pomoglo da otkrije da su strpljenje, zanimljiva nastava i pozitivna atmosfera ključni faktori za uspešnost u učenju stranog jezika.
  
  Danica je uvek u potrazi za novim načinima da unapredi nastavu i prilagodi je potrebama savremenih uslova. Posebno je zainteresovana za implementaciju novih digitalnih alata koji čine nastavu dinamičnijom. Njena kreativnost i inovativnost često donose iznenađenja na časovima, čineći učenje zabavnim i interaktivnim iskustvom.

---

## Images

Download from WP to `public/images/tim/`:
- `katarina-todosijevic.png` ← `Hartweger_Katarina_Todosijevic.png`
- `milica-vucic.png` ← `Milica_Vucic_Hartweger.png`
- `hristina-sarcevic.png` ← `Hartweger_Hristina_Sarcevic.png`
- `suzana-marjanovic.png` ← `Suzana_Marjanovic_Hartweger.png`
- `marija-radojkovic.png` ← `Hartweger_Marija_Radojkovic.png`
- `danica-trnavac.png` ← `Danica_Antonijevic_Hartweger.png`

Nataša: reuse existing `/images/IMG_6264.jpg`

Image display: 140px, rounded corners (12px), `object-fit: contain`, light background (`#f0f7fa`)

---

## SEO

- Metadata: title + description + openGraph (inherits default OG image)
- Add to sitemap.ts static pages list
- Add to navigation if not already present

---

## Mobile

- Professor cards stack: image centered above text
- Nataša card stacks vertically too
- Responsive font sizes following existing patterns (text-sm md:text-base)

---

## Out of Scope

- Database storage for professors (hardcoded in page, matching existing pattern from individualni-kursevi)
- Professor filtering or search
