# Beleške u platformi — kriška 1 (osnova + lični setovi kartica, 1:1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Profesorka vodi belešku individualnog časa u platformi (obrazac sa 7 sekcija), a reči iz WORTSCHATZ tabele automatski postaju lični set kartica polaznika na `/moje-reci`.

**Architecture:** Nova tabela `class_notes` čuva sadržaj kao JSON obrazac — šest tekstualnih sekcija su markdown-lite stringovi, WORTSCHATZ je niz parova `{de, sr}`. Pri svakom snimanju beleške server prepisuje reči u `student_wordsets` + `student_wordset_items`, koje nadžive brisanje beleške. Kartice koriste postojeći `WordSetBlock` i Learn motor bez izmene — `set_key = sw_<wordset_id>`, pa `flashcard_progress` radi kako je.

**Tech Stack:** Next.js 16 (App Router), React 19, Supabase (Postgres + RLS, service-role klijent u API rutama), Tailwind 4, vitest (node okruženje, testovi su čista logika u `src/lib`).

**Van obima ove kriške:** live tabla (Realtime), grupne beleške, PDF, cron za brisanje, panel polaznika, otkazivanje termina, dugme „dopuni rod i množinu" (Claude predlaže član i množinu u nemačku kolonu). To su kriške 2-5 iz speca.

**Spec:** `docs/superpowers/specs/2026-09-30-beleske-u-platformi-i-licne-kartice-design.md`

---

## Konvencije ovog repoa (pročitaj pre prvog zadatka)

- Pravi TypeScript prevodilac je `./node_modules/.bin/tsc --noEmit` (globalni `tsc` je nešto drugo i laže).
- Testovi: `npx vitest run` (svi) ili `npx vitest run src/lib/ime.test.ts` (jedan). Okruženje je `node`, pa **u testovima nema JSX i nema DOM-a** — sve što testiramo je čista funkcija u `src/lib/*.ts`.
- API rute koriste `createAdminClient()` (service-role, zaobilazi RLS) i **ručno filtriraju po korisniku**. RLS politike su drugi sloj zaštite. Vidi `src/app/api/profesor/individualni-cas/route.ts` kao obrazac.
- Migracije: `supabase/migrations/NNN_ime.sql`, sledeći slobodan broj je **109**.
- Brend boje u Tailwind-u: `plava`, `plava-light`, `plava-dark`, `koral`, `koral-light`, `koral-dark`.
- Git: trunk-based na `main`. **Push na `main` je produkcija** — ne pushuj bez izričite dozvole.

---

## Struktura fajlova

**Novi fajlovi**

| Fajl | Odgovornost |
|---|---|
| `supabase/migrations/109_class_notes.sql` | tabele + RLS + indeksi |
| `src/lib/class-notes.ts` | tipovi beleške, spisak sekcija, prazna sekcija, plain-text ogledalo |
| `src/lib/class-notes.test.ts` | testovi za gornje |
| `src/lib/wordset-derive.ts` | WORTSCHATZ redovi → kartice (čišćenje, izbacivanje praznih, dedupe) |
| `src/lib/wordset-derive.test.ts` | testovi za gornje |
| `src/lib/beleska-markup.ts` | markdown-lite → tokeni (blokovi + inline), bez JSX |
| `src/lib/beleska-markup.test.ts` | testovi za gornje |
| `src/components/beleska/BeleskaRenderer.tsx` | tokeni → React čvorovi; prazna sekcija se ne renderuje |
| `src/components/beleska/SectionEditor.tsx` | polje za tekst + traka (Bold, Kurziv, Lista, Marker, Link) |
| `src/components/beleska/WortschatzTable.tsx` | tabela dve kolone, Tab/Enter |
| `src/components/beleska/NotesEditor.tsx` | ceo obrazac + autosnimanje |
| `src/app/api/profesor/class-notes/route.ts` | GET/PUT beleške, kreiranje časa pri prvom snimanju, derivacija seta |
| `src/app/api/student/beleske/route.ts` | liste beleški polaznika + jedna beleška |
| `src/app/beleske/page.tsx` | lista časova polaznika |
| `src/app/beleske/[id]/page.tsx` | jedna beleška |
| `src/app/moje-reci/page.tsx` | setovi + „Sve reči" |
| `src/app/moje-reci/MojeReciClient.tsx` | izbor seta → `WordSetBlock` |

**Menjani fajlovi**

| Fajl | Izmena |
|---|---|
| `src/app/profesor/individualni/IndividualniClient.tsx` | dugme „Beleške za današnji čas" pored postojećih akcija |
| `src/app/profesor/individualni/page.tsx` | proslediti postojeći `noteId` po času (ako ga ima) |
| `src/app/nalog/Sekcije.tsx` | dva linka u kartici individualnog upisa: „Beleške" i „Moje reči" |

---

## Task 1: Migracija — tabele i RLS

**Files:**
- Create: `supabase/migrations/109_class_notes.sql`

- [ ] **Step 1: Napiši migraciju**

```sql
-- 109: Beleške sa časa u platformi + lični setovi kartica (kriška 1, samo 1:1).
-- group_session_id i group_id postoje od početka da kriška 3 (grupe) ne menja šemu.

create table if not exists public.class_notes (
  id                   uuid primary key default gen_random_uuid(),
  individual_lesson_id uuid null references public.individual_lessons(id) on delete cascade,
  group_session_id     uuid null references public.group_sessions(id) on delete cascade,
  professor_id         uuid not null references public.user_profiles(id),
  content              jsonb not null default '{}'::jsonb,
  content_text         text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint class_notes_one_target check (
    (individual_lesson_id is not null) <> (group_session_id is not null)
  )
);

create unique index if not exists class_notes_individual_uq
  on public.class_notes(individual_lesson_id) where individual_lesson_id is not null;
create unique index if not exists class_notes_group_uq
  on public.class_notes(group_session_id) where group_session_id is not null;

-- Lični setovi kartica. note_id je SET NULL da set preživi brisanje beleške posle 6 meseci.
create table if not exists public.student_wordsets (
  id                       uuid primary key default gen_random_uuid(),
  note_id                  uuid null references public.class_notes(id) on delete set null,
  individual_enrollment_id uuid null references public.individual_enrollments(id) on delete cascade,
  group_id                 uuid null references public.groups(id) on delete cascade,
  title                    text not null,
  lesson_date              date not null,
  position                 int,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint student_wordsets_one_owner check (
    (individual_enrollment_id is not null) <> (group_id is not null)
  )
);

create unique index if not exists student_wordsets_note_uq
  on public.student_wordsets(note_id) where note_id is not null;
create index if not exists student_wordsets_enroll_idx
  on public.student_wordsets(individual_enrollment_id, lesson_date desc);

create table if not exists public.student_wordset_items (
  wordset_id uuid not null references public.student_wordsets(id) on delete cascade,
  idx        int  not null,
  front      text not null,
  back       text not null,
  primary key (wordset_id, idx)
);

-- RLS: app piše service-role klijentom (zaobilazi RLS); politike su drugi sloj.
alter table public.class_notes enable row level security;
alter table public.student_wordsets enable row level security;
alter table public.student_wordset_items enable row level security;

-- Polaznik čita belešku svog individualnog upisa. Provera je postojanje upisa,
-- NE istek pristupa - beleška ostaje dostupna i posle isteka.
create policy "class_notes student read own individual"
  on public.class_notes for select
  using (
    exists (
      select 1
      from public.individual_lessons il
      join public.individual_enrollments ie on ie.id = il.enrollment_id
      where il.id = class_notes.individual_lesson_id
        and ie.user_id = auth.uid()
    )
  );

create policy "class_notes staff read"
  on public.class_notes for select
  using (
    exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role in ('professor','admin')
    )
  );

create policy "student_wordsets student read own"
  on public.student_wordsets for select
  using (
    exists (
      select 1 from public.individual_enrollments ie
      where ie.id = student_wordsets.individual_enrollment_id
        and ie.user_id = auth.uid()
    )
  );

create policy "student_wordset_items student read own"
  on public.student_wordset_items for select
  using (
    exists (
      select 1
      from public.student_wordsets sw
      join public.individual_enrollments ie on ie.id = sw.individual_enrollment_id
      where sw.id = student_wordset_items.wordset_id
        and ie.user_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Primeni migraciju na Supabase**

Primeni SQL iz fajla preko Supabase MCP-a (`apply_migration`, ime `109_class_notes`) ili SQL editora sa service-role pristupom. DDL preko anon ključa ne radi.

- [ ] **Step 3: Proveri da su tabele stvarno tamo**

Pozovi `list_tables` (Supabase MCP) i potvrdi da postoje `class_notes`, `student_wordsets`, `student_wordset_items`.
Expected: sve tri u šemi `public`, sa RLS uključenim.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/109_class_notes.sql
git commit -m "feat(beleske): migracija za class_notes i lične setove kartica"
```

---

## Task 2: Model beleške — sekcije i prazne sekcije

**Files:**
- Create: `src/lib/class-notes.ts`
- Test: `src/lib/class-notes.test.ts`

- [ ] **Step 1: Napiši test koji pada**

```ts
// src/lib/class-notes.test.ts
import { describe, it, expect } from "vitest";
import {
  TEXT_SECTIONS,
  emptyNoteContent,
  isSectionEmpty,
  visibleSections,
  noteToPlainText,
  type NoteContent,
} from "./class-notes";

describe("class-notes", () => {
  it("ima šest tekstualnih sekcija u tačnom redosledu", () => {
    expect(TEXT_SECTIONS.map((s) => s.key)).toEqual([
      "tema", "redemittel", "fehler", "grammatik", "hausaufgabe", "lob",
    ]);
  });

  it("prazna beleška ima sve sekcije prazne", () => {
    const c = emptyNoteContent();
    expect(c.wortschatz).toEqual([]);
    expect(isSectionEmpty(c.tema)).toBe(true);
  });

  it("sekcija od samih razmaka i novih redova je prazna", () => {
    expect(isSectionEmpty("   \n\n  ")).toBe(true);
    expect(isSectionEmpty(undefined)).toBe(true);
    expect(isSectionEmpty("Konjunktiv II")).toBe(false);
  });

  it("visibleSections izbacuje prazne sekcije — i naslov i sadržaj", () => {
    const c: NoteContent = {
      ...emptyNoteContent(),
      tema: "Konjunktiv II",
      hausaufgabe: "8 rečenica",
    };
    const vis = visibleSections(c);
    expect(vis.map((s) => s.key)).toEqual(["tema", "hausaufgabe"]);
    expect(vis.find((s) => s.key === "lob")).toBeUndefined();
  });

  it("noteToPlainText spaja samo popunjeno, sa oznakama sekcija", () => {
    const c: NoteContent = {
      ...emptyNoteContent(),
      tema: "Konjunktiv II",
      wortschatz: [{ de: "die Bedingung, -en", sr: "uslov" }],
    };
    const t = noteToPlainText(c);
    expect(t).toContain("TEMA");
    expect(t).toContain("Konjunktiv II");
    expect(t).toContain("die Bedingung, -en — uslov");
    expect(t).not.toContain("LOB");
  });
});
```

- [ ] **Step 2: Pokreni test i vidi da pada**

Run: `npx vitest run src/lib/class-notes.test.ts`
Expected: FAIL — `Failed to resolve import "./class-notes"`.

- [ ] **Step 3: Napiši implementaciju**

```ts
// src/lib/class-notes.ts
/**
 * Beleška sa časa = obrazac sa fiksnim sekcijama, ne slobodan dokument.
 * Šest tekstualnih sekcija su markdown-lite stringovi (vidi beleska-markup.ts),
 * WORTSCHATZ je niz parova - te iste reči su kartice polaznika.
 *
 * PRAVILO: prazna sekcija se NE prikazuje - ni sadržaj ni naslov.
 */

export type TextSectionKey =
  | "tema" | "redemittel" | "fehler" | "grammatik" | "hausaufgabe" | "lob";

export interface WortschatzRow {
  de: string;
  sr: string;
}

export interface NoteContent {
  v: 1;
  tema?: string;
  wortschatz: WortschatzRow[];
  redemittel?: string;
  fehler?: string;
  grammatik?: string;
  hausaufgabe?: string;
  lob?: string;
}

/** Oznaka = nemačka reč kao u starom Google Doc šablonu; podnaslov = objašnjenje na našem. */
export const TEXT_SECTIONS: ReadonlyArray<{
  key: TextSectionKey;
  label: string;
  hint: string;
}> = [
  { key: "tema",        label: "TEMA",        hint: "tema časa" },
  { key: "redemittel",  label: "REDEMITTEL",  hint: "korisne fraze i izrazi" },
  { key: "fehler",      label: "FEHLER",      hint: "greške i ispravke — bez imena" },
  { key: "grammatik",   label: "GRAMMATIK",   hint: "gramatika" },
  { key: "hausaufgabe", label: "HAUSAUFGABE", hint: "domaći zadatak" },
  { key: "lob",         label: "LOB",         hint: "pohvala" },
];

/** WORTSCHATZ stoji između TEMA i REDEMITTEL u prikazu; nije u TEXT_SECTIONS jer nije tekst. */
export const WORTSCHATZ_AFTER: TextSectionKey = "tema";

export function emptyNoteContent(): NoteContent {
  return { v: 1, wortschatz: [] };
}

export function isSectionEmpty(value: string | undefined | null): boolean {
  return !value || value.trim().length === 0;
}

export function visibleSections(
  content: NoteContent,
): Array<{ key: TextSectionKey; label: string; hint: string; value: string }> {
  return TEXT_SECTIONS.filter((s) => !isSectionEmpty(content[s.key])).map((s) => ({
    ...s,
    value: (content[s.key] as string).trim(),
  }));
}

/** Plain-text ogledalo za content_text (PDF fallback i kasnija pretraga). */
export function noteToPlainText(content: NoteContent): string {
  const parts: string[] = [];
  for (const s of TEXT_SECTIONS) {
    if (isSectionEmpty(content[s.key])) continue;
    parts.push(`${s.label}\n${(content[s.key] as string).trim()}`);
    if (s.key === WORTSCHATZ_AFTER && content.wortschatz.length > 0) {
      parts.push(
        "WORTSCHATZ\n" + content.wortschatz.map((r) => `${r.de} — ${r.sr}`).join("\n"),
      );
    }
  }
  // Ako TEMA nije popunjena a reči jesu, WORTSCHATZ ipak mora da uđe.
  if (isSectionEmpty(content.tema) && content.wortschatz.length > 0) {
    parts.unshift(
      "WORTSCHATZ\n" + content.wortschatz.map((r) => `${r.de} — ${r.sr}`).join("\n"),
    );
  }
  return parts.join("\n\n");
}
```

- [ ] **Step 4: Pokreni test — mora da prođe**

Run: `npx vitest run src/lib/class-notes.test.ts`
Expected: PASS, 5 testova.

- [ ] **Step 5: Commit**

```bash
git add src/lib/class-notes.ts src/lib/class-notes.test.ts
git commit -m "feat(beleske): model beleške sa 7 sekcija, prazne se ne prikazuju"
```

---

## Task 3: WORTSCHATZ redovi → kartice

**Files:**
- Create: `src/lib/wordset-derive.ts`
- Test: `src/lib/wordset-derive.test.ts`

- [ ] **Step 1: Napiši test koji pada**

```ts
// src/lib/wordset-derive.test.ts
import { describe, it, expect } from "vitest";
import { deriveWordsetItems, wordsetSetKey, wordsetTitle } from "./wordset-derive";

describe("wordset-derive", () => {
  it("pravi kartice iz redova, čuva redosled", () => {
    const items = deriveWordsetItems([
      { de: "die Bedingung, -en", sr: "uslov" },
      { de: "verzichten auf", sr: "odreći se čega" },
    ]);
    expect(items).toEqual([
      { idx: 0, front: "die Bedingung, -en", back: "uslov" },
      { idx: 1, front: "verzichten auf", back: "odreći se čega" },
    ]);
  });

  it("izbacuje redove kojima fali strana", () => {
    const items = deriveWordsetItems([
      { de: "gelassen", sr: "smiren" },
      { de: "", sr: "nešto" },
      { de: "der Aufwand", sr: "   " },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].front).toBe("gelassen");
  });

  it("skida HTML iz reči — <mark> se nikad ne sme videti na kartici", () => {
    const items = deriveWordsetItems([
      { de: "<mark>einmal am Tag</mark>", sr: "jednom dnevno" },
    ]);
    expect(items[0].front).toBe("einmal am Tag");
  });

  it("skida markdown-lite oznake koje profesorka slučajno zalepi", () => {
    const items = deriveWordsetItems([{ de: "**gelassen**", sr: "==smiren==" }]);
    expect(items[0]).toEqual({ idx: 0, front: "gelassen", back: "smiren" });
  });

  it("izbacuje duplikate unutar istog seta (bez obzira na velika slova)", () => {
    const items = deriveWordsetItems([
      { de: "gelassen", sr: "smiren" },
      { de: "Gelassen", sr: "smiren" },
    ]);
    expect(items).toHaveLength(1);
  });

  it("indeksi su uzastopni posle izbacivanja", () => {
    const items = deriveWordsetItems([
      { de: "", sr: "" },
      { de: "a", sr: "b" },
      { de: "c", sr: "d" },
    ]);
    expect(items.map((i) => i.idx)).toEqual([0, 1]);
  });

  it("set_key nosi prefiks sw_ i id seta", () => {
    expect(wordsetSetKey("11111111-2222-3333-4444-555555555555"))
      .toBe("sw_11111111-2222-3333-4444-555555555555");
  });

  it("naslov seta je 'Termin N — reči', a bez broja samo datum", () => {
    expect(wordsetTitle(7, "2026-10-02")).toBe("Termin 7 — reči");
    expect(wordsetTitle(null, "2026-10-02")).toBe("Reči — 2.10.2026.");
  });
});
```

- [ ] **Step 2: Pokreni test i vidi da pada**

Run: `npx vitest run src/lib/wordset-derive.test.ts`
Expected: FAIL — modul ne postoji.

- [ ] **Step 3: Napiši implementaciju**

```ts
// src/lib/wordset-derive.ts
import type { WortschatzRow } from "./class-notes";

export interface WordsetItem {
  idx: number;
  front: string;
  back: string;
}

/**
 * Kartica mora biti ČIST TEKST. Poznata greška iz avgusta 2026: reči prekopirane
 * iz lekcije sa <mark> tagovima prikazivale su se sirove, jer FlashcardBlock
 * namerno ne koristi dangerouslySetInnerHTML.
 */
function clean(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")          // HTML tagovi
    .replace(/==([^=]+)==/g, "$1")    // marker
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/\*([^*]+)\*/g, "$1")     // kurziv
    .replace(/\s+/g, " ")
    .trim();
}

export function deriveWordsetItems(rows: WortschatzRow[]): WordsetItem[] {
  const out: WordsetItem[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const front = clean(row.de ?? "");
    const back = clean(row.sr ?? "");
    if (!front || !back) continue;
    const key = front.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ idx: out.length, front, back });
  }
  return out;
}

/** Napredak se pamti po card_id koji se računa iz set_key - zato prefiks i UUID. */
export function wordsetSetKey(wordsetId: string): string {
  return `sw_${wordsetId}`;
}

export function wordsetTitle(position: number | null, lessonDate: string): string {
  if (position && position > 0) return `Termin ${position} — reči`;
  const [y, m, d] = lessonDate.split("-");
  return `Reči — ${Number(d)}.${Number(m)}.${y}.`;
}
```

- [ ] **Step 4: Pokreni test — mora da prođe**

Run: `npx vitest run src/lib/wordset-derive.test.ts`
Expected: PASS, 8 testova.

- [ ] **Step 5: Commit**

```bash
git add src/lib/wordset-derive.ts src/lib/wordset-derive.test.ts
git commit -m "feat(beleske): izvođenje kartica iz WORTSCHATZ tabele"
```

---

## Task 4: Markdown-lite → tokeni

Profesorka kuca `**podebljano**`, `*kurziv*`, `==marker==`, `- lista`, `[tekst](url)`. Prikaz se gradi iz tokena u React čvorove, nikad kroz `dangerouslySetInnerHTML`. Parser je čista funkcija da može da se testira u node okruženju (bez JSX-a).

**Files:**
- Create: `src/lib/beleska-markup.ts`
- Test: `src/lib/beleska-markup.test.ts`

- [ ] **Step 1: Napiši test koji pada**

```ts
// src/lib/beleska-markup.test.ts
import { describe, it, expect } from "vitest";
import { parseBlocks, tokenizeInline } from "./beleska-markup";

describe("tokenizeInline", () => {
  it("čist tekst je jedan token", () => {
    expect(tokenizeInline("zdravo")).toEqual([{ kind: "text", text: "zdravo" }]);
  });

  it("prepoznaje bold, kurziv i marker", () => {
    expect(tokenizeInline("a **b** c *d* e ==f==")).toEqual([
      { kind: "text", text: "a " },
      { kind: "bold", text: "b" },
      { kind: "text", text: " c " },
      { kind: "italic", text: "d" },
      { kind: "text", text: " e " },
      { kind: "mark", text: "f" },
    ]);
  });

  it("prepoznaje link u markdown obliku", () => {
    expect(tokenizeInline("vidi [ovde](https://hartweger.rs)")).toEqual([
      { kind: "text", text: "vidi " },
      { kind: "link", text: "ovde", href: "https://hartweger.rs" },
    ]);
  });

  it("odbacuje javascript: link (ostaje samo tekst)", () => {
    expect(tokenizeInline("[klik](javascript:alert)")).toEqual([
      { kind: "text", text: "klik" },
    ]);
  });

  it("nezatvorena oznaka ostaje običan tekst", () => {
    expect(tokenizeInline("**bez kraja")).toEqual([{ kind: "text", text: "**bez kraja" }]);
  });
});

describe("parseBlocks", () => {
  it("prazan tekst daje nula blokova", () => {
    expect(parseBlocks("")).toEqual([]);
    expect(parseBlocks("   \n  ")).toEqual([]);
  });

  it("dva pasusa razdvojena praznim redom", () => {
    const b = parseBlocks("prvi\n\ndrugi");
    expect(b).toHaveLength(2);
    expect(b[0].kind).toBe("p");
    expect(b[1].kind).toBe("p");
  });

  it("uzastopne crtice su jedna lista", () => {
    const b = parseBlocks("- jedan\n- dva\n- tri");
    expect(b).toHaveLength(1);
    expect(b[0].kind).toBe("ul");
    if (b[0].kind === "ul") expect(b[0].items).toHaveLength(3);
  });

  it("lista pa pasus su dva bloka", () => {
    const b = parseBlocks("- jedan\nobičan red");
    expect(b.map((x) => x.kind)).toEqual(["ul", "p"]);
  });

  it("novi red unutar pasusa se čuva", () => {
    const b = parseBlocks("prvi red\ndrugi red");
    expect(b).toHaveLength(1);
    if (b[0].kind === "p") expect(b[0].lines).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Pokreni test i vidi da pada**

Run: `npx vitest run src/lib/beleska-markup.test.ts`
Expected: FAIL — modul ne postoji.

- [ ] **Step 3: Napiši implementaciju**

```ts
// src/lib/beleska-markup.ts
/**
 * Markdown-lite koji profesorka kuca u belešku:
 *   **podebljano**  *kurziv*  ==marker==  - lista  [tekst](url)
 *
 * Parser vraća tokene; React prikaz (BeleskaRenderer) ih mapira u čvorove.
 * Nikad se ne generiše HTML string, pa XSS-a nema po konstrukciji.
 */

export type InlineToken =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "italic"; text: string }
  | { kind: "mark"; text: string }
  | { kind: "link"; text: string; href: string };

export type Block =
  | { kind: "p"; lines: InlineToken[][] }
  | { kind: "ul"; items: InlineToken[][] };

const INLINE_RE =
  /\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|==([^=\n]+)==|\*([^*\n]+)\*/g;

function safeHref(href: string): string | null {
  if (/^https?:\/\//i.test(href)) return href;
  if (/^mailto:/i.test(href)) return href;
  return null; // javascript:, data: i sve ostalo se odbacuje
}

export function tokenizeInline(text: string): InlineToken[] {
  const out: InlineToken[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) out.push({ kind: "text", text: text.slice(last, m.index) });
    if (m[1] !== undefined) {
      const href = safeHref(m[2]);
      if (href) out.push({ kind: "link", text: m[1], href });
      else out.push({ kind: "text", text: m[1] });
    } else if (m[3] !== undefined) {
      out.push({ kind: "bold", text: m[3] });
    } else if (m[4] !== undefined) {
      out.push({ kind: "mark", text: m[4] });
    } else if (m[5] !== undefined) {
      out.push({ kind: "italic", text: m[5] });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

export function parseBlocks(input: string): Block[] {
  if (!input || input.trim().length === 0) return [];
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ kind: "p", lines: paragraph.map(tokenizeInline) });
    paragraph = [];
  };
  const flushList = () => {
    if (list.length === 0) return;
    blocks.push({ kind: "ul", items: list.map(tokenizeInline) });
    list = [];
  };

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) {
      flushList();
      flushParagraph();
      continue;
    }
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushList();
  flushParagraph();
  return blocks;
}
```

- [ ] **Step 4: Pokreni test — mora da prođe**

Run: `npx vitest run src/lib/beleska-markup.test.ts`
Expected: PASS, 10 testova.

- [ ] **Step 5: Commit**

```bash
git add src/lib/beleska-markup.ts src/lib/beleska-markup.test.ts
git commit -m "feat(beleske): markdown-lite parser za sekcije beleške"
```

---

## Task 5: Prikaz beleške

**Files:**
- Create: `src/components/beleska/BeleskaRenderer.tsx`

- [ ] **Step 1: Napiši komponentu**

```tsx
// src/components/beleska/BeleskaRenderer.tsx
import type { ReactNode } from "react";
import { parseBlocks, type Block, type InlineToken } from "@/lib/beleska-markup";
import { visibleSections, type NoteContent, WORTSCHATZ_AFTER } from "@/lib/class-notes";

function inline(tokens: InlineToken[]): ReactNode[] {
  return tokens.map((t, i) => {
    switch (t.kind) {
      case "bold": return <strong key={i}>{t.text}</strong>;
      case "italic": return <em key={i}>{t.text}</em>;
      case "mark": return <mark key={i} className="bg-yellow-100 px-0.5">{t.text}</mark>;
      case "link":
        return (
          <a key={i} href={t.href} target="_blank" rel="noopener noreferrer" className="text-plava underline">
            {t.text}
          </a>
        );
      default: return <span key={i}>{t.text}</span>;
    }
  });
}

function blocks(bs: Block[]): ReactNode[] {
  return bs.map((b, i) =>
    b.kind === "ul" ? (
      <ul key={i} className="list-disc pl-5 space-y-1 text-gray-800">
        {b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}
      </ul>
    ) : (
      <p key={i} className="text-gray-800 leading-relaxed">
        {b.lines.map((l, j) => (
          <span key={j}>
            {j > 0 && <br />}
            {inline(l)}
          </span>
        ))}
      </p>
    ),
  );
}

function SectionTitle({ label, hint }: { label: string; hint?: string }) {
  return (
    <h3 className="text-xs font-bold tracking-wider uppercase text-gray-500 mb-2">
      {label}
      {hint && <span className="ml-2 normal-case tracking-normal font-normal text-gray-400">{hint}</span>}
    </h3>
  );
}

/**
 * PRAVILO: sekcija koju profesorka nije popunila se NE prikazuje - ni naslov.
 * Beleška je kraća, ne prazna.
 */
export default function BeleskaRenderer({
  content,
  wordsetHref,
}: {
  content: NoteContent;
  wordsetHref?: string;
}) {
  const sections = visibleSections(content);
  const words = content.wortschatz ?? [];
  const hasWords = words.length > 0;

  const wortschatzBlock = hasWords ? (
    <section key="wortschatz" className="bg-plava-light border border-plava/30 rounded-xl p-5">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <SectionTitle label="WORTSCHATZ" hint="nove reči" />
        <span className="text-sm text-gray-500">{words.length} reči</span>
        {wordsetHref && (
          <a href={wordsetHref} className="ml-auto bg-plava-dark text-white rounded-lg px-4 py-2 text-sm font-bold">
            Vežbaj ove reči
          </a>
        )}
      </div>
      <table className="w-full text-[15px]">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-gray-500">
            <th scope="col" className="text-left pb-2 w-1/2">Nemački</th>
            <th scope="col" className="text-left pb-2">Naš</th>
          </tr>
        </thead>
        <tbody>
          {words.map((r, i) => (
            <tr key={i} className="border-t border-plava/20">
              <td className="py-2 pr-4">{r.de}</td>
              <td className="py-2">{r.sr}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  ) : null;

  const out: ReactNode[] = [];
  if (sections.length === 0 && !hasWords) {
    return <p className="text-gray-500 text-sm">Profesorka još nije upisala belešku za ovaj čas.</p>;
  }
  // Ako TEMA nije popunjena, reči idu na početak.
  if (!sections.some((s) => s.key === WORTSCHATZ_AFTER) && wortschatzBlock) out.push(wortschatzBlock);
  for (const s of sections) {
    out.push(
      <section key={s.key}>
        <SectionTitle label={s.label} />
        <div className="space-y-2">{blocks(parseBlocks(s.value))}</div>
      </section>,
    );
    if (s.key === WORTSCHATZ_AFTER && wortschatzBlock) out.push(wortschatzBlock);
  }
  return <div className="space-y-6">{out}</div>;
}
```

- [ ] **Step 2: Proveri tipove**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: 0 grešaka.

- [ ] **Step 3: Commit**

```bash
git add src/components/beleska/BeleskaRenderer.tsx
git commit -m "feat(beleske): prikaz beleške, prazne sekcije se preskaču"
```

---

## Task 6: API — čitanje i snimanje beleške

Ključno pravilo: **otvaranje beleške ne upisuje ništa.** Zapis časa (`individual_lessons`) i `class_notes` se kreiraju pri prvom snimanju, da slučajno otvaranje ne potroši čas iz paketa i ne uđe u honorar.

**Files:**
- Create: `src/app/api/profesor/class-notes/route.ts`

- [ ] **Step 1: Napiši rutu**

```ts
// src/app/api/profesor/class-notes/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeLessonStatus } from "@/lib/individual-lessons";
import { emptyNoteContent, noteToPlainText, type NoteContent } from "@/lib/class-notes";
import { deriveWordsetItems, wordsetTitle } from "@/lib/wordset-derive";

async function requireStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "professor" && profile?.role !== "admin") return null;
  return { admin, userId: user.id, isAdmin: profile.role === "admin" };
}

async function loadOwnedEnrollment(
  admin: ReturnType<typeof createAdminClient>,
  enrollmentId: string, userId: string, isAdmin: boolean,
) {
  const { data: enr } = await admin
    .from("individual_enrollments")
    .select("id, professor_id, package_lessons")
    .eq("id", enrollmentId)
    .single();
  if (!enr) return { error: "Upis nije pronađen", status: 404 as const };
  if (!isAdmin && enr.professor_id !== userId) return { error: "Nije tvoj polaznik", status: 403 as const };
  return { enr };
}

/** GET ?enrollmentId=…&date=YYYY-MM-DD → postojeća beleška ili prazan obrazac. NE upisuje ništa. */
export async function GET(request: Request) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const url = new URL(request.url);
  const enrollmentId = url.searchParams.get("enrollmentId");
  const date = url.searchParams.get("date");
  if (!enrollmentId || !date) return NextResponse.json({ error: "Nedostaje enrollmentId ili date" }, { status: 400 });

  const owned = await loadOwnedEnrollment(staff.admin, enrollmentId, staff.userId, staff.isAdmin);
  if ("error" in owned) return NextResponse.json({ error: owned.error }, { status: owned.status });

  const { data: lesson } = await staff.admin
    .from("individual_lessons")
    .select("id")
    .eq("enrollment_id", enrollmentId)
    .eq("lesson_date", date)
    .maybeSingle();

  if (!lesson) return NextResponse.json({ content: emptyNoteContent(), noteId: null, lessonId: null });

  const { data: note } = await staff.admin
    .from("class_notes")
    .select("id, content")
    .eq("individual_lesson_id", lesson.id)
    .maybeSingle();

  return NextResponse.json({
    content: (note?.content as NoteContent) ?? emptyNoteContent(),
    noteId: note?.id ?? null,
    lessonId: lesson.id,
  });
}

/** PUT { enrollmentId, date, content } → kreira čas ako ga nema, upiše belešku, izvede set reči. */
export async function PUT(request: Request) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const enrollmentId = body?.enrollmentId as string | undefined;
  const date = body?.date as string | undefined;
  const content = body?.content as NoteContent | undefined;
  if (!enrollmentId || !date || !content) {
    return NextResponse.json({ error: "Nedostaje enrollmentId, date ili content" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Datum mora biti YYYY-MM-DD" }, { status: 400 });
  }

  const owned = await loadOwnedEnrollment(staff.admin, enrollmentId, staff.userId, staff.isAdmin);
  if ("error" in owned) return NextResponse.json({ error: owned.error }, { status: owned.status });

  // 1) Čas — kreiraj samo sad, pri prvom snimanju.
  let { data: lesson } = await staff.admin
    .from("individual_lessons")
    .select("id")
    .eq("enrollment_id", enrollmentId)
    .eq("lesson_date", date)
    .maybeSingle();

  if (!lesson) {
    const { data: created, error } = await staff.admin
      .from("individual_lessons")
      .insert({ enrollment_id: enrollmentId, professor_id: owned.enr.professor_id ?? staff.userId, lesson_date: date })
      .select("id")
      .single();
    if (error || !created) return NextResponse.json({ error: "Čas nije mogao da se upiše" }, { status: 500 });
    lesson = created;

    const { count } = await staff.admin
      .from("individual_lessons")
      .select("*", { count: "exact", head: true })
      .eq("enrollment_id", enrollmentId);
    const used = count ?? 0;
    await staff.admin.from("individual_enrollments").update({
      lessons_used: used,
      status: computeLessonStatus(used, owned.enr.package_lessons),
    }).eq("id", enrollmentId);
  }

  // 2) Beleška — NE upsert: jedinstveni indeksi su PARCIJALNI (where ... is not null),
  //    a PostgREST `onConflict` radi samo nad punim ograničenjem. Zato ručno.
  const payload = {
    content,
    content_text: noteToPlainText(content),
    updated_at: new Date().toISOString(),
  };
  const { data: existingNote } = await staff.admin
    .from("class_notes").select("id").eq("individual_lesson_id", lesson.id).maybeSingle();

  let noteId: string;
  if (existingNote) {
    const { error } = await staff.admin.from("class_notes").update(payload).eq("id", existingNote.id);
    if (error) return NextResponse.json({ error: "Beleška nije mogla da se snimi" }, { status: 500 });
    noteId = existingNote.id as string;
  } else {
    const { data: created, error } = await staff.admin
      .from("class_notes")
      .insert({ ...payload, individual_lesson_id: lesson.id, professor_id: staff.userId })
      .select("id")
      .single();
    if (error || !created) return NextResponse.json({ error: "Beleška nije mogla da se snimi" }, { status: 500 });
    noteId = created.id as string;
  }
  const note = { id: noteId };

  // 3) Set reči — jedan po belešci, preživljava brisanje beleške.
  const items = deriveWordsetItems(content.wortschatz ?? []);
  const { count: lessonCount } = await staff.admin
    .from("individual_lessons")
    .select("*", { count: "exact", head: true })
    .eq("enrollment_id", enrollmentId)
    .lte("lesson_date", date);
  const position = lessonCount ?? null;

  const { data: existingSet } = await staff.admin
    .from("student_wordsets").select("id").eq("note_id", note.id).maybeSingle();

  if (items.length === 0) {
    if (existingSet) {
      await staff.admin.from("student_wordset_items").delete().eq("wordset_id", existingSet.id);
      await staff.admin.from("student_wordsets").delete().eq("id", existingSet.id);
    }
  } else {
    // Isti razlog kao gore: parcijalni indeks, pa ručno update/insert.
    const setPayload = {
      title: wordsetTitle(position, date),
      lesson_date: date,
      position,
      updated_at: new Date().toISOString(),
    };
    let set: { id: string } | null = null;
    if (existingSet) {
      await staff.admin.from("student_wordsets").update(setPayload).eq("id", existingSet.id);
      set = { id: existingSet.id as string };
    } else {
      const { data: created } = await staff.admin
        .from("student_wordsets")
        .insert({ ...setPayload, note_id: note.id, individual_enrollment_id: enrollmentId })
        .select("id")
        .single();
      set = created ? { id: created.id as string } : null;
    }
    if (set) {
      // Pun zamena stavki: jedan pisac, nema razilaženja sa beleškom.
      await staff.admin.from("student_wordset_items").delete().eq("wordset_id", set.id);
      await staff.admin.from("student_wordset_items").insert(
        items.map((i) => ({ wordset_id: set.id, idx: i.idx, front: i.front, back: i.back })),
      );
    }
  }

  return NextResponse.json({ ok: true, noteId: note.id, lessonId: lesson.id, words: items.length });
}
```

- [ ] **Step 2: Proveri tipove**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: 0 grešaka. Ako `computeLessonStatus` ima drugačiji potpis, otvori `src/lib/individual-lessons.ts` i uskladi poziv.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/profesor/class-notes/route.ts
git commit -m "feat(beleske): API za čitanje i snimanje beleške + izvođenje seta reči"
```

---

## Task 7: Polja obrasca — tekst i tabela reči

**Files:**
- Create: `src/components/beleska/SectionEditor.tsx`
- Create: `src/components/beleska/WortschatzTable.tsx`

- [ ] **Step 1: Napiši SectionEditor**

```tsx
// src/components/beleska/SectionEditor.tsx
"use client";
import { useRef } from "react";

/** Traka ubacuje oznake oko izabranog teksta - profesorka ne mora da pamti sintaksu. */
const TOOLS: Array<{ label: string; wrap: [string, string]; title: string }> = [
  { label: "B", wrap: ["**", "**"], title: "Podebljano" },
  { label: "I", wrap: ["*", "*"], title: "Kurziv" },
  { label: "Marker", wrap: ["==", "=="], title: "Marker u boji" },
];

export default function SectionEditor({
  label, hint, value, onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function wrap(before: string, after: string) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  function addBullet() {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const next = value.slice(0, lineStart) + "- " + value.slice(lineStart);
    onChange(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + 2, start + 2); });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="text-xs font-bold tracking-wider uppercase text-gray-600">{label}</span>
        <span className="text-xs text-gray-400">{hint}</span>
        <span className="flex-grow" />
        {TOOLS.map((t) => (
          <button key={t.label} type="button" title={t.title} onClick={() => wrap(t.wrap[0], t.wrap[1])}
            className="min-h-11 px-3 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            {t.label}
          </button>
        ))}
        <button type="button" title="Lista" onClick={addBullet}
          className="min-h-11 px-3 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Lista</button>
      </div>
      <label className="sr-only" htmlFor={`sekcija-${label}`}>{label}</label>
      <textarea
        id={`sekcija-${label}`}
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full border border-gray-300 rounded-lg p-3 text-[15px] leading-relaxed focus:border-plava focus:outline-none"
      />
    </div>
  );
}
```

- [ ] **Step 2: Napiši WortschatzTable**

```tsx
// src/components/beleska/WortschatzTable.tsx
"use client";
import { useRef } from "react";
import type { WortschatzRow } from "@/lib/class-notes";

/**
 * Skrojeno za kucanje TOKOM časa: Tab prelazi na prevod, Enter otvara novi red.
 * Rod i množina se kucaju u nemačku kolonu po konvenciji sistema: "die Bedingung, -en".
 * Treće kolone nema - svesna odluka da kartica ostane kratka.
 */
export default function WortschatzTable({
  rows, onChange,
}: {
  rows: WortschatzRow[];
  onChange: (rows: WortschatzRow[]) => void;
}) {
  const lastDe = useRef<HTMLInputElement | null>(null);
  const list = rows.length > 0 ? rows : [{ de: "", sr: "" }];

  function setCell(i: number, key: "de" | "sr", v: string) {
    const next = list.map((r, j) => (j === i ? { ...r, [key]: v } : r));
    onChange(next);
  }

  function addRow(afterIndex: number) {
    const next = [...list];
    next.splice(afterIndex + 1, 0, { de: "", sr: "" });
    onChange(next);
    requestAnimationFrame(() => lastDe.current?.focus());
  }

  function removeRow(i: number) {
    const next = list.filter((_, j) => j !== i);
    onChange(next.length > 0 ? next : [{ de: "", sr: "" }]);
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold tracking-wider uppercase text-gray-600">WORTSCHATZ</span>
        <span className="text-xs text-gray-400">nove reči · Tab na prevod, Enter nov red</span>
      </div>
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_44px] bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <span className="px-3 py-2">Nemački</span>
          <span className="px-3 py-2">Naš</span>
          <span />
        </div>
        {list.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_44px] border-t border-gray-200">
            <input
              ref={i === list.length - 1 ? lastDe : undefined}
              aria-label={`Nemački, red ${i + 1}`}
              value={row.de}
              onChange={(e) => setCell(i, "de", e.target.value)}
              className="px-3 py-2 text-[15px] focus:bg-plava-light focus:outline-none"
            />
            <input
              aria-label={`Prevod, red ${i + 1}`}
              value={row.sr}
              onChange={(e) => setCell(i, "sr", e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRow(i); } }}
              className="px-3 py-2 text-[15px] border-l border-gray-200 focus:bg-plava-light focus:outline-none"
            />
            <button type="button" aria-label={`Ukloni red ${i + 1}`} onClick={() => removeRow(i)}
              className="text-gray-400 hover:text-koral-dark text-lg leading-none">×</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => addRow(list.length - 1)}
        className="mt-2 min-h-11 px-4 border border-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50">
        + dodaj red
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Proveri tipove**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: 0 grešaka.

- [ ] **Step 4: Commit**

```bash
git add src/components/beleska/SectionEditor.tsx src/components/beleska/WortschatzTable.tsx
git commit -m "feat(beleske): polja obrasca - tekst sa trakom i tabela reči"
```

---

## Task 8: Obrazac sa autosnimanjem + dugme u prof panelu

**Files:**
- Create: `src/components/beleska/NotesEditor.tsx`
- Modify: `src/app/profesor/individualni/IndividualniClient.tsx`

- [ ] **Step 1: Napiši NotesEditor**

```tsx
// src/components/beleska/NotesEditor.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import SectionEditor from "./SectionEditor";
import WortschatzTable from "./WortschatzTable";
import { TEXT_SECTIONS, emptyNoteContent, type NoteContent, type WortschatzRow } from "@/lib/class-notes";

const SAVE_DEBOUNCE_MS = 2000;

export default function NotesEditor({
  enrollmentId, studentName, date, onClose,
}: {
  enrollmentId: string;
  studentName: string;
  date: string;
  onClose: () => void;
}) {
  const [content, setContent] = useState<NoteContent>(emptyNoteContent());
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<"" | "snimam" | "snimljeno" | "greška">("");
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftKey = `beleska:${enrollmentId}:${date}`;

  useEffect(() => {
    let alive = true;
    fetch(`/api/profesor/class-notes?enrollmentId=${enrollmentId}&date=${date}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return;
        const local = localStorage.getItem(draftKey);
        if (local) { try { setContent(JSON.parse(local) as NoteContent); } catch { /* nevažan nacrt */ } }
        else if (j?.content) setContent(j.content as NoteContent);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => { alive = false; };
  }, [enrollmentId, date, draftKey]);

  function update(next: NoteContent) {
    setContent(next);
    dirty.current = true;
    try { localStorage.setItem(draftKey, JSON.stringify(next)); } catch { /* pun localStorage */ }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, SAVE_DEBOUNCE_MS);
  }

  async function save() {
    if (!dirty.current) return;
    setStatus("snimam");
    try {
      const res = await fetch("/api/profesor/class-notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, date, content }),
      });
      if (!res.ok) { setStatus("greška"); return; }
      dirty.current = false;
      try { localStorage.removeItem(draftKey); } catch { /* nevažno */ }
      setStatus("snimljeno");
    } catch { setStatus("greška"); }
  }

  if (!loaded) return <p className="text-sm text-gray-500 p-4">Učitavam belešku…</p>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-3 mb-5 pb-4 border-b border-gray-100">
        <div>
          <h3 className="font-bold text-lg">Beleška — {studentName}</h3>
          <p className="text-sm text-gray-500">{date}</p>
        </div>
        <span className="flex-grow" />
        <span className="text-sm text-gray-500 min-w-24 text-right">
          {status === "snimam" ? "snimam…" : status === "snimljeno" ? "snimljeno" : status === "greška" ? "greška pri snimanju" : ""}
        </span>
        <button type="button" onClick={save} className="min-h-11 px-4 bg-plava-dark text-white rounded-lg text-sm font-bold">
          Snimi sad
        </button>
        <button type="button" onClick={() => { save(); onClose(); }} className="min-h-11 px-4 border border-gray-300 rounded-lg text-sm font-bold">
          Zatvori
        </button>
      </div>

      <div className="space-y-5">
        <SectionEditor label="TEMA" hint="tema časa" value={content.tema ?? ""} onChange={(v) => update({ ...content, tema: v })} />
        <WortschatzTable rows={content.wortschatz} onChange={(rows: WortschatzRow[]) => update({ ...content, wortschatz: rows })} />
        {TEXT_SECTIONS.filter((s) => s.key !== "tema").map((s) => (
          <SectionEditor
            key={s.key}
            label={s.label}
            hint={s.hint}
            value={(content[s.key] as string) ?? ""}
            onChange={(v) => update({ ...content, [s.key]: v } as NoteContent)}
          />
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-5">
        Sekcija koju ostaviš praznu se polazniku ne prikazuje — ni naslov. Reči iz tabele mu odmah postaju kartice.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Dodaj dugme u prof panel**

U `src/app/profesor/individualni/IndividualniClient.tsx`:

Na početak dodaj uvoz i stanje:

```tsx
import NotesEditor from "@/components/beleska/NotesEditor";
```

U telo komponente, pored postojećih `useState` poziva:

```tsx
  const [notesFor, setNotesFor] = useState<{ id: string; name: string; date: string } | null>(null);
```

Odmah iznad `return (`, ubaci prikaz obrasca:

```tsx
  if (notesFor) {
    return (
      <NotesEditor
        enrollmentId={notesFor.id}
        studentName={notesFor.name}
        date={notesFor.date}
        onClose={() => { setNotesFor(null); router.refresh(); }}
      />
    );
  }
```

U redu tabele, pored postojećeg dugmeta za beleške (`saveNotes`), dodaj:

```tsx
                  <button
                    type="button"
                    onClick={() => setNotesFor({ id: r.id, name: r.studentName, date: dateById[r.id] || todayISO() })}
                    className="text-plava hover:underline text-sm font-bold"
                  >
                    Beleške za današnji čas
                  </button>
```

Staro dugme za Google Doc link **ostavi** — tekući paketi su još na Drive-u.

- [ ] **Step 3: Proveri tipove i testove**

Run: `./node_modules/.bin/tsc --noEmit && npx vitest run`
Expected: 0 grešaka, svi testovi prolaze (70 postojećih + novi iz zadataka 2-4).

- [ ] **Step 4: Commit**

```bash
git add src/components/beleska/NotesEditor.tsx src/app/profesor/individualni/IndividualniClient.tsx
git commit -m "feat(beleske): obrazac sa autosnimanjem + dugme u prof panelu"
```

---

## Task 9: Polaznik čita beleške

**Files:**
- Create: `src/app/api/student/beleske/route.ts`
- Create: `src/app/beleske/page.tsx`
- Create: `src/app/beleske/[id]/page.tsx`

- [ ] **Step 1: Napiši API**

```ts
// src/app/api/student/beleske/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NoteContent } from "@/lib/class-notes";

/** GET → lista beleški polaznika (1:1). GET ?id=<noteId> → jedna beleška. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: enrolls } = await admin
    .from("individual_enrollments")
    .select("id")
    .eq("user_id", user.id);
  const enrollmentIds = (enrolls ?? []).map((e) => e.id as string);
  if (enrollmentIds.length === 0) return NextResponse.json({ notes: [] });

  const { data: lessons } = await admin
    .from("individual_lessons")
    .select("id, lesson_date, professor_id")
    .in("enrollment_id", enrollmentIds)
    .order("lesson_date", { ascending: false });
  const lessonIds = (lessons ?? []).map((l) => l.id as string);
  if (lessonIds.length === 0) return NextResponse.json({ notes: [] });

  const wanted = new URL(request.url).searchParams.get("id");

  const q = admin
    .from("class_notes")
    .select("id, individual_lesson_id, content, content_text, professor_id")
    .in("individual_lesson_id", lessonIds);
  const { data: notes } = wanted ? await q.eq("id", wanted) : await q;

  const profIds = [...new Set((notes ?? []).map((n) => n.professor_id as string))];
  const { data: profs } = profIds.length
    ? await admin.from("user_profiles").select("id, full_name").in("id", profIds)
    : { data: [] };
  const profName = new Map((profs ?? []).map((p) => [p.id as string, p.full_name as string | null]));
  const lessonDate = new Map((lessons ?? []).map((l) => [l.id as string, l.lesson_date as string]));

  const { data: sets } = await admin
    .from("student_wordsets")
    .select("id, note_id")
    .in("individual_enrollment_id", enrollmentIds);
  const setByNote = new Map((sets ?? []).filter((s) => s.note_id).map((s) => [s.note_id as string, s.id as string]));

  const rows = (notes ?? [])
    .map((n) => ({
      id: n.id as string,
      date: lessonDate.get(n.individual_lesson_id as string) ?? "",
      professor: profName.get(n.professor_id as string) ?? null,
      content: n.content as NoteContent,
      wordsetId: setByNote.get(n.id as string) ?? null,
      preview: ((n.content_text as string | null) ?? "").split("\n")[1] ?? "",
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return NextResponse.json({ notes: rows });
}
```

- [ ] **Step 2: Napiši listu beleški**

```tsx
// src/app/beleske/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

type Row = { id: string; date: string; professor: string | null; preview: string; wordsetId: string | null };

export const metadata = { title: "Beleške sa časova" };

export default async function BeleskePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/prijava?next=/beleske");

  const h = await headers();
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/student/beleske`, {
    headers: { cookie: h.get("cookie") ?? "" },
    cache: "no-store",
  });
  const { notes }: { notes: Row[] } = res.ok ? await res.json() : { notes: [] };

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-bold text-2xl mb-1">Beleške sa časova</h1>
      <p className="text-sm text-gray-500 mb-6">Sve što je profesorka zapisala na tvojim časovima.</p>

      {notes.length === 0 ? (
        <p className="text-gray-500">Još nema beleški. Pojaviće se posle prvog časa.</p>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
          {notes.map((n) => (
            <li key={n.id}>
              <Link href={`/beleske/${n.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50">
                <span className="w-20 text-sm font-bold text-plava-dark">
                  {n.date.split("-").reverse().slice(0, 2).join(".")}.
                </span>
                <span className="flex-grow text-[15px]">{n.preview || "Beleška"}</span>
                {n.wordsetId && <span className="text-xs text-gray-400">ima reči</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-gray-400 mt-6">
        Beleške se čuvaju 6 meseci posle časa. Tvoje reči i napredak na njima ostaju i posle toga.
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Napiši prikaz jedne beleške**

```tsx
// src/app/beleske/[id]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import BeleskaRenderer from "@/components/beleska/BeleskaRenderer";
import type { NoteContent } from "@/lib/class-notes";

type Row = { id: string; date: string; professor: string | null; content: NoteContent; wordsetId: string | null };

export default async function BeleskaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/prijava?next=/beleske/${id}`);

  const h = await headers();
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/student/beleske?id=${id}`, {
    headers: { cookie: h.get("cookie") ?? "" },
    cache: "no-store",
  });
  const { notes }: { notes: Row[] } = res.ok ? await res.json() : { notes: [] };
  const note = notes[0];
  if (!note) notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <Link href="/beleske" className="text-sm font-bold text-plava-dark">&larr; Sve beleške</Link>
      <h1 className="font-bold text-2xl mt-3">
        Čas {note.date.split("-").reverse().join(".")}.
      </h1>
      {note.professor && <p className="text-sm text-gray-500 mb-6">profesorka {note.professor}</p>}
      <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-7">
        <BeleskaRenderer
          content={note.content}
          wordsetHref={note.wordsetId ? `/moje-reci?set=${note.wordsetId}` : undefined}
        />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Proveri tipove**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: 0 grešaka. Ako `NEXT_PUBLIC_SITE_URL` ne postoji u okruženju, uvezi `SITE_URL` iz `@/lib/site-url` i koristi njega — isti obrazac kao ostale serverske stranice.

**Pazi:** `notFound()` u ovoj ruti vraća 200 ako u `src/app` postoji `loading.tsx` na putu. Ako se pojavi ta pojava, ne dodaj `loading.tsx` u `src/app/beleske/`.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/student/beleske/route.ts src/app/beleske
git commit -m "feat(beleske): polaznik čita svoje beleške na /beleske"
```

---

## Task 10: Moje reči

**Files:**
- Create: `src/app/api/student/moje-reci/route.ts`
- Create: `src/app/moje-reci/page.tsx`
- Create: `src/app/moje-reci/MojeReciClient.tsx`

- [ ] **Step 1: Napiši API**

```ts
// src/app/api/student/moje-reci/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { wordsetSetKey } from "@/lib/wordset-derive";

/**
 * Vraća setove polaznika sa stavkama. „Sve reči" NIJE red u bazi nego pogled:
 * svaka kartica nosi set_key svog matičnog seta, pa se napredak broji jednom.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: enrolls } = await admin
    .from("individual_enrollments").select("id").eq("user_id", user.id);
  const enrollmentIds = (enrolls ?? []).map((e) => e.id as string);
  if (enrollmentIds.length === 0) return NextResponse.json({ sets: [] });

  const { data: sets } = await admin
    .from("student_wordsets")
    .select("id, title, lesson_date, position")
    .in("individual_enrollment_id", enrollmentIds)
    .order("lesson_date", { ascending: false });

  const setIds = (sets ?? []).map((s) => s.id as string);
  if (setIds.length === 0) return NextResponse.json({ sets: [] });

  const { data: items } = await admin
    .from("student_wordset_items")
    .select("wordset_id, idx, front, back")
    .in("wordset_id", setIds)
    .order("idx", { ascending: true });

  const bySet = new Map<string, Array<{ front: string; back: string }>>();
  for (const it of items ?? []) {
    const key = it.wordset_id as string;
    if (!bySet.has(key)) bySet.set(key, []);
    bySet.get(key)!.push({ front: it.front as string, back: it.back as string });
  }

  return NextResponse.json({
    sets: (sets ?? []).map((s) => ({
      id: s.id as string,
      setKey: wordsetSetKey(s.id as string),
      title: s.title as string,
      lessonDate: s.lesson_date as string,
      items: bySet.get(s.id as string) ?? [],
    })),
  });
}
```

- [ ] **Step 2: Napiši klijent koji koristi postojeći WordSetBlock**

```tsx
// src/app/moje-reci/MojeReciClient.tsx
"use client";
import { useEffect, useState } from "react";
import WordSetBlock from "@/components/lesson-blocks/WordSetBlock";
import type { FlashcardItem } from "@/lib/flashcard-types";

type SetRow = { id: string; setKey: string; title: string; lessonDate: string; items: FlashcardItem[] };

export default function MojeReciClient({ initialSetId }: { initialSetId?: string }) {
  const [sets, setSets] = useState<SetRow[] | null>(null);
  const [open, setOpen] = useState<string | null>(initialSetId ?? null);

  useEffect(() => {
    fetch("/api/student/moje-reci")
      .then((r) => (r.ok ? r.json() : { sets: [] }))
      .then((j) => setSets(j.sets as SetRow[]))
      .catch(() => setSets([]));
  }, []);

  if (!sets) return <p className="text-gray-500">Učitavam…</p>;
  if (sets.length === 0)
    return <p className="text-gray-500">Još nemaš reči. Pojaviće se posle prvog časa na kom profesorka upiše nove reči.</p>;

  const openSet = sets.find((s) => s.id === open);

  if (openSet) {
    return (
      <div>
        <button type="button" onClick={() => setOpen(null)} className="text-sm font-bold text-plava-dark mb-4">
          &larr; Svi setovi
        </button>
        <WordSetBlock type="wordset" title={openSet.title} setKey={openSet.setKey} items={openSet.items} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sets.map((s) => (
        <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center gap-4">
          <div className="flex-grow">
            <p className="font-bold">{s.title}</p>
            <p className="text-sm text-gray-500">
              {s.items.length} reči · čas {s.lessonDate.split("-").reverse().join(".")}.
            </p>
          </div>
          <button type="button" onClick={() => setOpen(s.id)}
            className="min-h-11 px-5 bg-plava-dark text-white rounded-lg text-sm font-bold">
            Uči
          </button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Napiši stranicu**

```tsx
// src/app/moje-reci/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MojeReciClient from "./MojeReciClient";

export const metadata = { title: "Moje reči" };

export default async function MojeReciPage({
  searchParams,
}: {
  searchParams: Promise<{ set?: string }>;
}) {
  const { set } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/prijava?next=/moje-reci");

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-bold text-2xl mb-1">Moje reči</h1>
      <p className="text-sm text-gray-500 mb-6">Reči sa tvojih časova — nastaju same iz beleške.</p>
      <MojeReciClient initialSetId={set} />
    </main>
  );
}
```

- [ ] **Step 4: Proveri da WordSetBlock prima ovaj oblik**

Otvori `src/components/lesson-blocks/WordSetBlock.tsx` i potvrdi da prihvata `WordSetSection` (`type`, `title`, `setKey`, `items`). Ako potpis ne prima `type`, izbaci taj atribut iz poziva.

Run: `./node_modules/.bin/tsc --noEmit`
Expected: 0 grešaka.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/student/moje-reci/route.ts src/app/moje-reci
git commit -m "feat(beleske): lični setovi kartica na /moje-reci nad postojećim Learn motorom"
```

---

## Task 11: „Sve reči" pogled

**Files:**
- Modify: `src/app/moje-reci/MojeReciClient.tsx`

- [ ] **Step 1: Dodaj karticu „Sve reči" iznad liste setova**

U `MojeReciClient.tsx`, pre `return` za listu, izračunaj:

```tsx
  const allItems: FlashcardItem[] = sets.flatMap((s) => s.items);
```

I ubaci iznad liste setova, unutar istog `div`:

```tsx
      {sets.length > 1 && (
        <div className="bg-white border border-gray-200 border-l-4 border-l-plava rounded-xl p-5 flex flex-wrap items-center gap-4">
          <div className="flex-grow">
            <p className="font-bold text-lg">Sve reči</p>
            <p className="text-sm text-gray-500">{allItems.length} reči sa {sets.length} časova</p>
          </div>
          <button type="button" onClick={() => setOpen("__sve__")}
            className="min-h-11 px-5 bg-plava-dark text-white rounded-lg text-sm font-bold">
            Uči sve
          </button>
        </div>
      )}
```

- [ ] **Step 2: Nauči `openSet` da razume „Sve reči"**

**Napomena zašto ovako:** svaka kartica u „Sve reči" mora da nosi `set_key` **svog matičnog seta**, inače bi ista reč imala drugi `card_id` i napredak bi se brojao dvaput. Zato se ne pravi jedan veliki set nego se prikazuju setovi jedan po jedan, u nizu.

Zameni granu `if (openSet)` sledećim:

```tsx
  if (open === "__sve__") {
    return (
      <div>
        <button type="button" onClick={() => setOpen(null)} className="text-sm font-bold text-plava-dark mb-4">
          &larr; Svi setovi
        </button>
        <p className="text-sm text-gray-500 mb-4">
          Sve tvoje reči, set po set — napredak se pamti isto kao kad učiš pojedinačni set.
        </p>
        <div className="space-y-4">
          {sets.map((s) => (
            <WordSetBlock key={s.id} type="wordset" title={s.title} setKey={s.setKey} items={s.items} />
          ))}
        </div>
      </div>
    );
  }

  if (openSet) {
    return (
      <div>
        <button type="button" onClick={() => setOpen(null)} className="text-sm font-bold text-plava-dark mb-4">
          &larr; Svi setovi
        </button>
        <WordSetBlock type="wordset" title={openSet.title} setKey={openSet.setKey} items={openSet.items} />
      </div>
    );
  }
```

- [ ] **Step 3: Proveri tipove**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: 0 grešaka.

- [ ] **Step 4: Commit**

```bash
git add src/app/moje-reci/MojeReciClient.tsx
git commit -m "feat(beleske): pogled Sve reči bez dupliranja napretka"
```

---

## Task 12: Linkovi iz naloga

**Files:**
- Modify: `src/app/nalog/Sekcije.tsx`

- [ ] **Step 1: Dodaj dva linka u kartici individualnog upisa**

U `GrupniIIndividualni`, unutar `data.individual.map(...)`, posle linka „Zakaži sledeći čas", dodaj:

```tsx
            <div className="flex gap-4 mt-2">
              <a href="/beleske" className="text-sm text-plava font-bold">Beleške sa časova</a>
              <a href="/moje-reci" className="text-sm text-plava font-bold">Moje reči</a>
            </div>
```

- [ ] **Step 2: Proveri tipove i sve testove**

Run: `./node_modules/.bin/tsc --noEmit && npx vitest run`
Expected: 0 grešaka, svi testovi prolaze.

- [ ] **Step 3: Commit**

```bash
git add src/app/nalog/Sekcije.tsx
git commit -m "feat(beleske): linkovi na beleške i reči u nalogu polaznika"
```

---

## Task 13: Provera pre puštanja i deploy

- [ ] **Step 1: Cela provera lokalno**

Run: `./node_modules/.bin/tsc --noEmit && npx vitest run && npm run build`
Expected: 0 TS grešaka, svi testovi zeleni, build prolazi.

- [ ] **Step 2: Ručna proba na lokalu**

Pokreni razvojni server i prođi ovaj put:

1. Uloguj se kao profesorka → `/profesor/individualni` → „Beleške za današnji čas".
2. **Ne kucaj ništa, zatvori.** Proveri da polazniku broj iskorišćenih časova NIJE porastao.
3. Vrati se, upiši TEMA i tri reči u tabelu, sačekaj „snimljeno".
4. Proveri da je broj iskorišćenih časova porastao za 1.
5. Uloguj se kao taj polaznik → `/beleske` → otvori belešku. Prazne sekcije se **ne vide**, ni naslovi.
6. Klikni „Vežbaj ove reči" → `/moje-reci` → uči set, odgovori dva puta tačno na jednu reč.
7. Osveži → ta reč je „naučena" (napredak je u bazi).
8. Vrati se u belešku kao profesorka, ispravi jedan prevod, sačekaj snimanje → u `/moje-reci` je nov prevod, ostale reči zadržale napredak.

- [ ] **Step 3: Javi Nataši pre deploya**

Deploy ide preko `git push` na `main` (Vercel prati granu). **Ne pushuj bez izričite dozvole** — push na `main` je produkcija.

- [ ] **Step 4: Posle deploya obavezan smoke test na produkciji**

1. `/beleske` kao polaznik bez beleški → vidi prazno stanje, ne 500.
2. `/moje-reci` kao polaznik bez reči → prazno stanje.
3. Profesorka snimi belešku na pravom paketu → polaznik je vidi.
4. Proveri da `/lekcija/...` i postojeći `wordset` blokovi u kursevima rade kao pre (Learn motor nije diran).

---

## Šta ostaje za kriške 2-5

- **Kriška 2:** live tabla (Supabase Realtime broadcast na `class-notes:<noteId>`, soft-lock, inkrementalni render kod polaznika).
- **Kriška 3:** grupne beleške (`group_session_id`, vidljivost po grupi uključujući beleške pre upisa).
- **Kriška 4:** PDF po času i po paketu, mejl ~15 dana pre brisanja, cron brisanje na 6 meseci (`student_wordsets.note_id` → `null`, setovi ostaju).
- **Kriška 5:** panel polaznika (sledeći čas iz kalendara preko Apps Script-a, domaći sa čekboksom, „na šta da paziš" iz FEHLER), otkazivanje termina, prekidač u GAS-u da se novi Google Docs više ne prave.
