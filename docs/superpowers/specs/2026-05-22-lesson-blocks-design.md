# Lesson Block System — Design Spec

## Problem

Lekcije u novom LMS-u trenutno koriste jedno `content` tekstualno polje. Na LearnDash-u B1.2 kurs koristi strukturirani HTML sa sekcijama (video, tabele, formule, spoileri, vokabular). Potreban je fleksibilan block sistem gde svaka lekcija može imati proizvoljan broj i redosled blokova.

## Odluke

- **JSON polje u `lessons` tabeli** (`sections jsonb`) umesto zasebne tabele — lekcija se uvek čita/čuva kao celina
- **11 tipova blokova** — pokrivaju sve što se koristi u B1.2 lekcijama + image
- **React komponente** — svaki blok je zasebna komponenta, `BlockRenderer` ih orkestrira
- **Postojeća polja ostaju** — `content`, `vimeo_video_id`, `lesson_type` ostaju za backward compatibility dok se sve ne migrira na blokove

## Baza

### Migracija

```sql
ALTER TABLE lessons ADD COLUMN sections jsonb DEFAULT '[]';
```

Kada lekcija ima `sections` sa sadržajem, koristi blokove. Kada je prazno/null, fallback na stari `lesson_type` + `content` prikaz.

## Block tipovi (11)

### 1. `badge`
Modul oznaka na vrhu lekcije.

```json
{ "type": "badge", "module": "L8", "category": "grammatik" }
```

Kategorije i boje:
- `grammatik` — plava (#0AB3D7)
- `lesen` — zelena (#34A853)
- `hoeren` — ljubičasta (#9C27B0)
- `schreiben` — koral (#F78687)

### 2. `video`
Vimeo responsive embed (16:9).

```json
{ "type": "video", "vimeoId": "1234567" }
```

Koristi postojeći `VideoPlayer` komponentu.

### 3. `text`
Tekst sa markdown formatiranjem. Može imati opcioni stil sekcije.

```json
{ "type": "text", "content": "Markdown tekst...", "style": "default" }
```

Style opcije: `default` (plava ivica), `beispiele` (zelena), `uebung` (koral), `info` (bez ivice).

### 4. `formula`
Istaknuto gramatičko pravilo u okviru sa isprekidanom ivicom.

```json
{ "type": "formula", "content": "Wenn = rutina, ponavljano\nFalls = neizvesno, hipotetičko" }
```

### 5. `table`
Bilingvalna tabela sa opcionim highlight-om ključnih reči.

```json
{
  "type": "table",
  "headers": ["Nemački", "Srpski"],
  "rows": [
    ["<mark>Wenn</mark> ich morgens komme...", "Kad ujutru dođem..."],
    ["<mark>Falls</mark> du morgen kommst...", "Ako sutra dođeš..."]
  ]
}
```

### 6. `mistakes`
Tipične greške — precrtano pogrešno, zeleno ispravno.

```json
{
  "type": "mistakes",
  "items": [
    {
      "wrong": "Falls ich komme jeden Tag...",
      "correct": "Wenn ich jeden Tag komme...",
      "explanation": "Svakodnevna rutina = Wenn, ne Falls"
    }
  ]
}
```

### 7. `spoiler`
Klikni za rešenje — interaktivna mini vežba.

```json
{
  "type": "spoiler",
  "title": "Mini vežba — Wenn oder Falls?",
  "items": [
    { "question": "1. ___ die Zusammenarbeit gut läuft...", "answer": "Wenn" },
    { "question": "2. ___ es morgen regnet...", "answer": "Falls" }
  ]
}
```

Client component — koristi useState za toggle svakog spoilera.

### 8. `vocabulary`
Tabela reči sa narandžastim stilom.

```json
{
  "type": "vocabulary",
  "rows": [
    ["der Auftrag, -äge", "zadatak, nalog"],
    ["die Besprechung, -en", "sastanak"]
  ]
}
```

### 9. `pdf`
PDF embed sa linkom za otvaranje u novom prozoru.

```json
{ "type": "pdf", "url": "https://example.com/skripta.pdf", "label": "Skripta za lekciju 8" }
```

Responsive iframe + fallback link za mobilne.

### 10. `image`
Slika unutar lekcije (infografike, dijagrami).

```json
{ "type": "image", "url": "https://example.com/slika.png", "alt": "Opis slike", "caption": "Opcionalni natpis" }
```

### 11. `link`
Dugme za kviz, Quizlet, PDF download, DW link.

```json
{ "type": "link", "linkType": "kviz", "href": "/vezba/123", "label": "Uradi kviz za ovu lekciju" }
```

Link tipovi i stilovi:
- `kviz` — koral dugme
- `quizlet` — plavo dugme (#4257B2)
- `pdf` — crveno dugme
- `dw` — crno dugme
- `external` — sivo dugme

## Komponente

```
src/components/lesson-blocks/
  BlockRenderer.tsx      — prima Section[], renderuje sve blokove redom
  BadgeBlock.tsx          — span sa bojom po kategoriji
  VideoBlock.tsx          — koristi postojeći VideoPlayer
  TextBlock.tsx           — koristi postojeći RichText + sekcija stil
  FormulaBlock.tsx        — dashed border box, monospace
  TableBlock.tsx          — responsive tabela, mark highlight
  MistakesBlock.tsx       — precrtano/zeleno parovi
  SpoilerBlock.tsx        — "use client", useState za toggle
  VocabularyBlock.tsx     — tabela sa narandžastim stilom
  PdfBlock.tsx            — iframe + fallback link
  ImageBlock.tsx          — responsive slika sa caption
  LinkBlock.tsx           — stilizovano dugme po tipu
```

### BlockRenderer

```tsx
import { Section } from "@/lib/types";
// importi svih blokova...

export default function BlockRenderer({ sections }: { sections: Section[] }) {
  return (
    <div className="space-y-4">
      {sections.map((section, i) => {
        switch (section.type) {
          case "badge": return <BadgeBlock key={i} {...section} />;
          case "video": return <VideoBlock key={i} {...section} />;
          // ... ostali tipovi
          default: return null;
        }
      })}
    </div>
  );
}
```

### LekcijaContent update

Postojeći `LekcijaContent.tsx` se menja da proveri da li lekcija ima `sections`:

```tsx
export default function LekcijaContent({ lesson }) {
  if (lesson.sections && lesson.sections.length > 0) {
    return <BlockRenderer sections={lesson.sections} />;
  }
  // fallback na stari prikaz po lesson_type
  switch (lesson.lesson_type) { ... }
}
```

## Stilovi

Sve kroz Tailwind klase, nema custom CSS fajlova. Boje koje treba dodati u tailwind config:

```ts
colors: {
  plava: { DEFAULT, light, dark },    // već postoji
  koral: { DEFAULT, light, dark },    // već postoji
  zelena: { DEFAULT: "#34A853", light: "#f0faf3" },
  narandzasta: { DEFAULT: "#FF9800", light: "#fff8f0" },
  ljubicasta: { DEFAULT: "#7C4DFF", light: "#f5f0ff" },
}
```

## Responsive

Svi blokovi moraju raditi na mobilnom (min 320px):
- Video: 16:9 aspect ratio, puna širina
- Tabele: horizontalni scroll na malom ekranu
- PDF: smanjeni iframe + prominentan link za otvaranje
- Spoileri: dovoljno velika tap zona (min 44px visina)
- Slike: max-width 100%, auto height

## TypeScript tipovi

```ts
type SectionType = "badge" | "video" | "text" | "formula" | "table" 
  | "mistakes" | "spoiler" | "vocabulary" | "pdf" | "image" | "link";

type BadgeCategory = "grammatik" | "lesen" | "hoeren" | "schreiben";
type TextStyle = "default" | "beispiele" | "uebung" | "info";
type LinkType = "kviz" | "quizlet" | "pdf" | "dw" | "external";

interface BadgeSection { type: "badge"; module: string; category: BadgeCategory; }
interface VideoSection { type: "video"; vimeoId: string; }
interface TextSection { type: "text"; content: string; style?: TextStyle; }
interface FormulaSection { type: "formula"; content: string; }
interface TableSection { type: "table"; headers: string[]; rows: string[][]; }
interface MistakesSection { type: "mistakes"; items: { wrong: string; correct: string; explanation?: string; }[]; }
interface SpoilerSection { type: "spoiler"; title?: string; items: { question: string; answer: string; }[]; }
interface VocabularySection { type: "vocabulary"; rows: string[][]; }
interface PdfSection { type: "pdf"; url: string; label?: string; }
interface ImageSection { type: "image"; url: string; alt: string; caption?: string; }
interface LinkSection { type: "link"; linkType: LinkType; href: string; label?: string; }

type Section = BadgeSection | VideoSection | TextSection | FormulaSection 
  | TableSection | MistakesSection | SpoilerSection | VocabularySection 
  | PdfSection | ImageSection | LinkSection;
```

Dodati u `Lesson` interfejs:
```ts
interface Lesson {
  // ... postojeća polja
  sections: Section[] | null;
}
```

## Admin editor (faza 2)

Neće biti u ovoj implementaciji. Prvo se prave komponente za prikaz i migracija baze. Admin block editor je zasebna spec.

## Scope

Ova spec pokriva:
1. Supabase migracija (dodavanje `sections` kolone)
2. TypeScript tipovi za blokove
3. 11 block komponenti + BlockRenderer
4. Update LekcijaContent za fallback logiku
5. Tailwind config update za nove boje

Ne pokriva:
- Admin block editor (zasebna spec)
- Import skriptu za postojeće lekcije (zasebna spec)
- Migracija starih lekcija iz `content` u `sections` format
