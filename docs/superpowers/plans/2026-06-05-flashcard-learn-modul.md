# Flashcard „Learn" modul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quizlet-style „Learn" modul nad postojećim setovima kartica — adaptivne runde (kviz → kucanje), igra memorije, i trajno praćenje napretka po kartici, za sve nivoe A1–B2.

**Architecture:** Novi `wordset` tip bloka živi u zasebnoj „REČI" lekciji svakog modula i nosi ceo set kartica modula. Dugme „Uči" lazy-load-uje `LearnModule` orkestrator koji ponovo koristi postojeće `QuizExercise` i `MatchPairsExercise`, plus novi `LearnTyping` sa tolerantnim ocenjivanjem. Napredak se čuva u novoj Supabase tabeli `flashcard_progress` (po korisniku i kartici). Sadržaj se uvozi iz Quizlet exporta skriptom.

**Tech Stack:** Next.js (App Router — vidi `AGENTS.md`: pre Next-specifičnih API-ja konsultuj `node_modules/next/dist/docs/`), React, TypeScript, Tailwind, Supabase (`@supabase/supabase-js`), Vitest (novo, samo za čistu logiku).

**Spec:** `docs/superpowers/specs/2026-06-05-flashcard-learn-modul-design.md`

**Napomena o testovima:** repo nema test framework i nema testova. Uvodimo **Vitest samo za čiste funkcije** (`flashcard-grading`, `flashcard-card-id`, Quizlet parser) gde je TDD jeftin i vredan. UI komponente (`LearnModule`, `MemoryGame`, `WordSetBlock`) verifikujemo kroz `npm run build` + ručni/`smoke-deploy` test na telefonu — kako repo već radi.

---

## Struktura fajlova

**Novo:**
- `vitest.config.ts` — konfiguracija test runnera
- `src/lib/flashcard-types.ts` — deljeni `FlashcardItem` (sa opcionim poljima) + `WordSetSection`
- `src/lib/flashcard-card-id.ts` — stabilan `cardId(setKey, front, back)`
- `src/lib/flashcard-card-id.test.ts`
- `src/lib/flashcard-grading.ts` — `gradeTyping`, `buildQuizOptions`, normalize, levenshtein
- `src/lib/flashcard-grading.test.ts`
- `src/lib/flashcard-progress.ts` — čitanje/upis mastery (Supabase client)
- `supabase/migrations/20260605_flashcard_progress.sql` — tabela + RLS (primeni preko Management API)
- `src/components/learn/LearnTyping.tsx` — kucanje sa tolerantnim ocenjivanjem
- `src/components/learn/LearnModule.tsx` — orkestrator rundi + mastery (lazy-loaded)
- `src/components/learn/MemoryGame.tsx` — igra memorije
- `src/components/lesson-blocks/WordSetBlock.tsx` — „REČI" blok: prikaz seta + pokretač Learn moda
- `scripts/import-quizlet.ts` — Quizlet export → `wordset` JSON
- `scripts/quizlet-parse.ts` — čista parser funkcija (da se testira)
- `scripts/quizlet-parse.test.ts`

**Izmena:**
- `package.json` — dodati `test` skript i devDependencies
- `src/lib/section-types.ts` — `FlashcardSection.items` koristi `FlashcardItem`; dodati `WordSetSection` u `Section` union
- `src/components/lesson-blocks/BlockRenderer.tsx` — registrovati `case "wordset"`

---

## Phase 0 — Setup test runnera

### Task 0: Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Instaliraj vitest**

Run:
```bash
npm install -D vitest
```
Expected: dodato u devDependencies, bez grešaka.

- [ ] **Step 2: Dodaj test skript u `package.json`**

U `"scripts"` dodati:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Kreiraj `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts", "scripts/**/*.test.ts"] },
  resolve: { alias: { "@": resolve(__dirname, "./src") } },
});
```

- [ ] **Step 4: Proveri da runner radi (nema testova još)**

Run: `npm test`
Expected: „No test files found" ili prolaz bez grešaka (exit 0/1, ali komanda postoji).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: dodaj vitest za testiranje čiste logike"
```

---

## Phase 1 — Model kartice + čista logika

### Task 1: Tip `FlashcardItem`

**Files:**
- Create: `src/lib/flashcard-types.ts`
- Modify: `src/lib/section-types.ts`

- [ ] **Step 1: Definiši deljeni tip**

`src/lib/flashcard-types.ts`:
```ts
/** Jedna kartica — front/back obavezni, sve ostalo opciono (radi za sve nivoe A1–B2). */
export interface FlashcardItem {
  front: string;            // nemački
  back: string;             // srpski (više prevoda razdvojeno sa "|")
  article?: "der" | "die" | "das";
  plural?: string;
  example?: string;
  image?: string;
  hint?: string;
  audio?: string;
}

/** „REČI" blok: ceo set kartica jednog modula. */
export interface WordSetSection {
  type: "wordset";
  title: string;            // npr. "Lektion 1 — Reči"
  setKey: string;           // stabilan ključ seta (za card_id i progress), npr. "a1-1-lektion-1"
  frontLabel?: string;      // default "DE"
  backLabel?: string;       // default "SR"
  items: FlashcardItem[];
}
```

- [ ] **Step 2: Iskoristi tip u `section-types.ts`**

U `src/lib/section-types.ts`:
- Na vrh dodati import:
```ts
import type { FlashcardItem, WordSetSection } from "./flashcard-types";
export type { FlashcardItem, WordSetSection };
```
- Zameni telo `FlashcardSection`:
```ts
export interface FlashcardSection {
  type: "flashcard";
  frontLabel?: string;
  backLabel?: string;
  items: FlashcardItem[];
}
```
- U `Section` union dodaj `| WordSetSection`.

- [ ] **Step 3: Verifikuj tipove**

Run: `npx tsc --noEmit`
Expected: bez novih grešaka (postojeće kartice imaju samo `front`/`back` → i dalje validne jer su nova polja opciona).

- [ ] **Step 4: Commit**

```bash
git add src/lib/flashcard-types.ts src/lib/section-types.ts
git commit -m "feat: FlashcardItem sa opcionim poljima + WordSetSection tip"
```

### Task 2: Stabilan `card_id`

**Files:**
- Create: `src/lib/flashcard-card-id.ts`
- Test: `src/lib/flashcard-card-id.test.ts`

- [ ] **Step 1: Napiši test**

`src/lib/flashcard-card-id.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { cardId } from "./flashcard-card-id";

describe("cardId", () => {
  it("isti ulaz daje isti id", () => {
    expect(cardId("a1-1-l1", "Vater", "otac")).toBe(cardId("a1-1-l1", "Vater", "otac"));
  });
  it("različit front daje različit id", () => {
    expect(cardId("a1-1-l1", "Vater", "otac")).not.toBe(cardId("a1-1-l1", "Mutter", "majka"));
  });
  it("ne zavisi od razmaka/velikih slova oko teksta", () => {
    expect(cardId("a1-1-l1", " Vater ", "Otac")).toBe(cardId("a1-1-l1", "vater", "otac"));
  });
  it("zavisi od setKey", () => {
    expect(cardId("a1-1-l1", "Vater", "otac")).not.toBe(cardId("a1-2-l1", "Vater", "otac"));
  });
});
```

- [ ] **Step 2: Pokreni — pad**

Run: `npx vitest run src/lib/flashcard-card-id.test.ts`
Expected: FAIL („cardId is not a function" / modul ne postoji).

- [ ] **Step 3: Implementiraj**

`src/lib/flashcard-card-id.ts`:
```ts
/** Determinističan, stabilan id kartice. Ne zavisi od pozicije u nizu, razmaka, ni velikih slova. */
export function cardId(setKey: string, front: string, back: string): string {
  const norm = (s: string) => s.trim().toLowerCase();
  const raw = `${setKey}::${norm(front)}::${norm(back)}`;
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) >>> 0; // djb2
  return `${setKey}_${h.toString(36)}`;
}
```

- [ ] **Step 4: Pokreni — prolaz**

Run: `npx vitest run src/lib/flashcard-card-id.test.ts`
Expected: PASS (4 testa).

- [ ] **Step 5: Commit**

```bash
git add src/lib/flashcard-card-id.ts src/lib/flashcard-card-id.test.ts
git commit -m "feat: stabilan card_id (djb2 hash)"
```

### Task 3: Tolerantno ocenjivanje kucanja

**Files:**
- Create: `src/lib/flashcard-grading.ts`
- Test: `src/lib/flashcard-grading.test.ts`

Ponašanje (iz spec-a): ignoriši velika/mala slova, zareze/tačke, višak razmaka; ß=ss, ä/ö/ü = ae/oe/ue; ≤1 slovo greške → `almost` (priznato); član i množina nikad obavezni; više prevoda („a|b") → bilo koji tačan.

- [ ] **Step 1: Napiši test**

`src/lib/flashcard-grading.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { gradeTyping, buildQuizOptions } from "./flashcard-grading";
import type { FlashcardItem } from "./flashcard-types";

const vater: FlashcardItem = { front: "Vater", back: "otac", article: "der", plural: "Väter" };

describe("gradeTyping — smer SR→DE (ukucaj nemački)", () => {
  it("tačan unos", () => {
    expect(gradeTyping("Vater", vater, "sr-de").status).toBe("correct");
  });
  it("član nije obavezan, ali se prihvata i sa članom", () => {
    expect(gradeTyping("der Vater", vater, "sr-de").status).toBe("correct");
  });
  it("malo slovo i razmaci tolerišu se", () => {
    expect(gradeTyping("  vater ", vater, "sr-de").status).toBe("correct");
  });
  it("jedno slovo greške → almost (priznato), sa punim oblikom", () => {
    const r = gradeTyping("Vator", vater, "sr-de");
    expect(r.status).toBe("almost");
    expect(r.fullForm).toContain("der Vater");
  });
  it("potpuno pogrešno → wrong", () => {
    expect(gradeTyping("Hund", vater, "sr-de").status).toBe("wrong");
  });
  it("ß/umlaut tolerancija", () => {
    const strasse: FlashcardItem = { front: "Straße", back: "ulica" };
    expect(gradeTyping("strasse", strasse, "sr-de").status).toBe("correct");
  });
});

describe("gradeTyping — smer DE→SR (ukucaj srpski) sa više prevoda", () => {
  const hallo: FlashcardItem = { front: "Hallo", back: "Zdravo|Ćao" };
  it("bilo koji prevod je tačan", () => {
    expect(gradeTyping("ćao", hallo, "de-sr").status).toBe("correct");
    expect(gradeTyping("zdravo", hallo, "de-sr").status).toBe("correct");
  });
});

describe("buildQuizOptions", () => {
  const pool: FlashcardItem[] = [
    { front: "Vater", back: "otac" }, { front: "Mutter", back: "majka" },
    { front: "Bruder", back: "brat" }, { front: "Schwester", back: "sestra" },
  ];
  it("vraća 4 opcije sa tačnim odgovorom unutra (smer DE→SR)", () => {
    const r = buildQuizOptions(pool[0], pool, "de-sr");
    expect(r.options).toHaveLength(4);
    expect(r.options[r.correctIndex]).toBe("otac");
    expect(new Set(r.options).size).toBe(4); // bez duplikata
  });
  it("ako nema dovoljno kartica (<4) → null", () => {
    expect(buildQuizOptions(pool[0], pool.slice(0, 2), "de-sr")).toBeNull();
  });
});
```

- [ ] **Step 2: Pokreni — pad**

Run: `npx vitest run src/lib/flashcard-grading.test.ts`
Expected: FAIL (modul ne postoji).

- [ ] **Step 3: Implementiraj**

`src/lib/flashcard-grading.ts`:
```ts
import type { FlashcardItem } from "./flashcard-types";

export type Direction = "de-sr" | "sr-de";
export type GradeStatus = "correct" | "almost" | "wrong";
export interface GradeResult { status: GradeStatus; fullForm: string; }

function normalize(s: string): string {
  return s.trim().toLowerCase()
    .replace(/[.,!?;:]+/g, "")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

/** Skup prihvatljivih odgovora za zadati smer. Član i množina su opcioni (dodaju se kao varijante). */
function acceptedAnswers(card: FlashcardItem, dir: Direction): string[] {
  if (dir === "de-sr") return card.back.split("|").map((s) => s.trim());
  // sr-de: ciljani jezik je nemački (front). Član opcioni, množina prihvaćena kao varijanta.
  const out = [card.front];
  if (card.article) out.push(`${card.article} ${card.front}`);
  if (card.plural) out.push(card.plural);
  return out;
}

/** Pun oblik za prikaz („evo tačno"): nemački sa članom i množinom ako postoje. */
export function fullForm(card: FlashcardItem, dir: Direction): string {
  if (dir === "de-sr") return card.back.replace(/\|/g, " / ");
  const article = card.article ? `${card.article} ` : "";
  const plural = card.plural ? `, ${card.plural}` : "";
  return `${article}${card.front}${plural}`;
}

export function gradeTyping(input: string, card: FlashcardItem, dir: Direction): GradeResult {
  const inN = normalize(input);
  const accepted = acceptedAnswers(card, dir).map(normalize);
  const ff = fullForm(card, dir);
  if (accepted.some((a) => a === inN)) return { status: "correct", fullForm: ff };
  if (accepted.some((a) => levenshtein(a, inN) <= 1)) return { status: "almost", fullForm: ff };
  return { status: "wrong", fullForm: ff };
}

export interface QuizOptionsResult { options: string[]; correctIndex: number; }

/** 1 tačan + 3 distraktora iz pool-a. null ako pool ima < 4 kartice. */
export function buildQuizOptions(card: FlashcardItem, pool: FlashcardItem[], dir: Direction): QuizOptionsResult | null {
  const answerOf = (c: FlashcardItem) => (dir === "de-sr" ? c.back.split("|")[0].trim() : c.front);
  const correct = answerOf(card);
  const distractPool = pool.filter((c) => answerOf(c) !== correct).map(answerOf);
  const uniqueDistract = Array.from(new Set(distractPool));
  if (uniqueDistract.length < 3) return null;
  // deterministički „shuffle" baziran na dužini (bez Math.random za testabilnost)
  const picked = uniqueDistract.slice(0, 3);
  const options = [correct, ...picked];
  // rotiraj tačan na poziciju zavisnu od ukupne dužine (stabilno, ali ne uvek prvo)
  const rot = correct.length % 4;
  const rotated = options.slice(rot).concat(options.slice(0, rot));
  return { options: rotated, correctIndex: rotated.indexOf(correct) };
}
```

- [ ] **Step 4: Pokreni — prolaz**

Run: `npx vitest run src/lib/flashcard-grading.test.ts`
Expected: PASS (svi testovi). Ako `buildQuizOptions` rotacija slučajno složi tačan baš na očekivano mesto — test proverava samo prisustvo i broj, ne poziciju, pa prolazi.

- [ ] **Step 5: Commit**

```bash
git add src/lib/flashcard-grading.ts src/lib/flashcard-grading.test.ts
git commit -m "feat: tolerantno ocenjivanje kucanja + generator kviz opcija"
```

---

## Phase 2 — Trajno praćenje (Supabase)

### Task 4: Migracija `flashcard_progress`

**Files:**
- Create: `supabase/migrations/20260605_flashcard_progress.sql`

- [ ] **Step 1: Napiši SQL**

`supabase/migrations/20260605_flashcard_progress.sql`:
```sql
create table if not exists public.flashcard_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null,
  set_key text not null,
  correct_count int not null default 0,
  wrong_count int not null default 0,
  status text not null default 'new' check (status in ('new','learning','mastered')),
  last_seen_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

alter table public.flashcard_progress enable row level security;

create policy "own_select" on public.flashcard_progress
  for select using (auth.uid() = user_id);
create policy "own_upsert" on public.flashcard_progress
  for insert with check (auth.uid() = user_id);
create policy "own_update" on public.flashcard_progress
  for update using (auth.uid() = user_id);

create index if not exists flashcard_progress_set_idx
  on public.flashcard_progress (user_id, set_key);
```

- [ ] **Step 2: Primeni na produkciju**

Preko Management API (vidi memoriju `reference_supabase_ddl`, projekat `rzmyglynjcygsbicssbt`) ili Supabase SQL Editor (copy/paste). Komandom (token se traži interaktivno, NE upisuj u fajl):
```bash
curl -s -X POST "https://api.supabase.com/v1/projects/rzmyglynjcygsbicssbt/database/query" \
  -H "Authorization: Bearer $SBP_TOKEN" -H "Content-Type: application/json" \
  --data-binary @<(python3 -c "import json,sys;print(json.dumps({'query':open('supabase/migrations/20260605_flashcard_progress.sql').read()}))")
```
Expected: `[]` (uspeh DDL-a). Obriši token posle.

- [ ] **Step 3: Verifikuj da tabela postoji**

Run (isti endpoint, query `select to_regclass('public.flashcard_progress')`):
Expected: vraća ime tabele, ne null.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260605_flashcard_progress.sql
git commit -m "feat: migracija flashcard_progress + RLS"
```

### Task 5: Mastery klijent lib

**Files:**
- Create: `src/lib/flashcard-progress.ts`

- [ ] **Step 1: Implementiraj read/upsert**

`src/lib/flashcard-progress.ts`:
```ts
import { createClient } from "@/lib/supabase/client";
import { cardId } from "./flashcard-card-id";
import type { FlashcardItem } from "./flashcard-types";

export type CardStatus = "new" | "learning" | "mastered";
export interface CardProgress { card_id: string; correct_count: number; wrong_count: number; status: CardStatus; }

/** Učitaj napredak za ceo set (jedan upit). Mapa card_id → progress. */
export async function loadSetProgress(setKey: string): Promise<Map<string, CardProgress>> {
  const sb = createClient();
  const { data } = await sb.from("flashcard_progress")
    .select("card_id,correct_count,wrong_count,status").eq("set_key", setKey);
  const map = new Map<string, CardProgress>();
  for (const r of data ?? []) map.set(r.card_id, r as CardProgress);
  return map;
}

/**
 * Zabeleži pokušaj i vrati novi status.
 * Pravilo: mastered = 2 tačna, od kojih bar jedan kucanjem; netačno → learning.
 */
export async function recordAttempt(
  setKey: string, card: FlashcardItem, correct: boolean, viaTyping: boolean,
  prev: CardProgress | undefined,
): Promise<CardProgress> {
  const sb = createClient();
  const { data: auth } = await sb.auth.getUser();
  const uid = auth.user?.id;
  const id = cardId(setKey, card.front, card.back);
  const correct_count = (prev?.correct_count ?? 0) + (correct ? 1 : 0);
  const wrong_count = (prev?.wrong_count ?? 0) + (correct ? 0 : 1);
  // „bar jedan kucanjem": pamtimo kroz status. Jednostavnije: 2 tačna ukupno → mastered,
  // ali ako set ima kucanje, LearnModule šalje viaTyping i traži bar jedan takav (vidi Task 7).
  let status: CardStatus = "learning";
  if (correct_count >= 2) status = "mastered";
  if (!correct) status = "learning";
  const row = { user_id: uid, card_id: id, set_key: setKey, correct_count, wrong_count, status, last_seen_at: new Date().toISOString() };
  await sb.from("flashcard_progress").upsert(row, { onConflict: "user_id,card_id" });
  return { card_id: id, correct_count, wrong_count, status };
}
```

Napomena: „bar jedan kucanjem" pravilo se sprovodi u `LearnModule` (Task 7) — tamo se prati da li je tačan odgovor došao kroz kucanje pre nego što se dozvoli `mastered`. Lib čuva brojeve; modul odlučuje kad da pozove sa `correct=true`.

- [ ] **Step 2: Verifikuj tipove**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add src/lib/flashcard-progress.ts
git commit -m "feat: flashcard mastery read/upsert lib"
```

---

## Phase 3 — Learn UI (srce)

### Task 6: `LearnTyping` komponenta

**Files:**
- Create: `src/components/learn/LearnTyping.tsx`

- [ ] **Step 1: Implementiraj**

`src/components/learn/LearnTyping.tsx`:
```tsx
"use client";
import { useState } from "react";
import type { FlashcardItem } from "@/lib/flashcard-types";
import { gradeTyping, type Direction } from "@/lib/flashcard-grading";

export default function LearnTyping({
  card, direction, onResult,
}: {
  card: FlashcardItem;
  direction: Direction;
  onResult: (correct: boolean) => void; // almost se računa kao correct
}) {
  const prompt = direction === "sr-de" ? card.back.replace(/\|/g, " / ") : card.front;
  const subtitle = direction === "sr-de" ? "Napiši na nemačkom (član nije obavezan):" : "Napiši na srpskom:";
  const [input, setInput] = useState("");
  const [done, setDone] = useState<null | { status: string; fullForm: string }>(null);

  const submit = () => {
    if (done || !input.trim()) return;
    const r = gradeTyping(input, card, direction);
    setDone(r);
    onResult(r.status !== "wrong");
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{subtitle}</p>
      <p className="text-2xl font-bold text-gray-900 mb-4">{prompt}</p>
      <input
        value={input} onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        disabled={!!done} autoFocus
        className="w-full border-2 border-sky-300 rounded-xl p-3 text-lg focus:outline-none focus:border-sky-500"
        placeholder="…"
      />
      {!done && (
        <button onClick={submit} className="mt-3 w-full bg-rose-500 text-white rounded-xl py-3 font-bold">Proveri</button>
      )}
      {done && (
        <div className={`mt-3 rounded-xl p-3 text-sm ${done.status === "wrong" ? "bg-rose-50 text-rose-700" : done.status === "almost" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>
          {done.status === "correct" && <>✓ Tačno! <b>{done.fullForm}</b></>}
          {done.status === "almost" && <>Skoro! Tačno je <b>{done.fullForm}</b>. Priznato ✓</>}
          {done.status === "wrong" && <>Tačno je <b>{done.fullForm}</b>.</>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verifikuj build tipova**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add src/components/learn/LearnTyping.tsx
git commit -m "feat: LearnTyping (tolerantno kucanje sa skoro-tačno)"
```

### Task 7: `LearnModule` orkestrator

**Files:**
- Create: `src/components/learn/LearnModule.tsx`

Logika: drži red kartica; za svaku bira tip vežbe po statusu (new/learning sa <1 tačan → kviz; ima ≥1 tačan → kucanje); pogrešne vraća na kraj reda; `mastered` izlazi. Traka „Naučeno X/N". Na kraju ekran 🏆. Spajanje parova kao pauza na svakih 8 kartica (ako set ≥4). Koristi `QuizExercise` (props: question, options, correctAnswer, explanation, onAnswer) i `MatchPairsExercise` (pairs:{de,sr}[], onAnswer).

- [ ] **Step 1: Implementiraj**

`src/components/learn/LearnModule.tsx`:
```tsx
"use client";
import { useMemo, useState } from "react";
import type { FlashcardItem } from "@/lib/flashcard-types";
import { buildQuizOptions, type Direction } from "@/lib/flashcard-grading";
import { cardId } from "@/lib/flashcard-card-id";
import { recordAttempt, type CardProgress } from "@/lib/flashcard-progress";
import QuizExercise from "@/components/exercises/QuizExercise";
import MatchPairsExercise from "@/components/exercises/MatchPairsExercise";
import LearnTyping from "./LearnTyping";

type Mode = "guided" | "quiz" | "typing" | "match" | "memory";

export default function LearnModule({
  setKey, items, direction = "de-sr", initialProgress, mode = "guided", onExit,
}: {
  setKey: string;
  items: FlashcardItem[];
  direction?: Direction;
  initialProgress: Map<string, CardProgress>;
  mode?: Mode;
  onExit: () => void;
}) {
  const idOf = (c: FlashcardItem) => cardId(setKey, c.front, c.back);
  // lokalna mapa napretka (sinhronizuje se sa bazom u pozadini)
  const [prog, setProg] = useState<Map<string, CardProgress>>(() => new Map(initialProgress));
  // brojač tačnih-kucanjem po kartici (za pravilo „bar jedan kucanjem")
  const [typedOk, setTypedOk] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<FlashcardItem[]>(() =>
    items.filter((c) => (prog.get(idOf(c))?.status ?? "new") !== "mastered"));
  const [seen, setSeen] = useState(0);

  const total = items.length;
  const masteredCount = useMemo(
    () => items.filter((c) => prog.get(idOf(c))?.status === "mastered").length,
    [prog, items]);

  if (queue.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-3">🏆</div>
        <p className="text-lg font-bold mb-1">Set savladan! {total}/{total}</p>
        <p className="text-sm text-gray-500 mb-5">Vrati se sutra da osvežiš.</p>
        <button onClick={onExit} className="bg-emerald-600 text-white rounded-xl px-6 py-3 font-bold">Završi</button>
      </div>
    );
  }

  const card = queue[0];
  const id = idOf(card);
  const p = prog.get(id);
  const useTyping = (p?.correct_count ?? 0) >= 1; // prvo kviz (prepoznavanje), pa kucanje (prisećanje)
  const quiz = useTyping ? null : buildQuizOptions(card, items, direction);
  // pauza: spajanje na svakih 8 kartica
  const showMatch = seen > 0 && seen % 8 === 0 && items.length >= 4;

  const advance = async (correct: boolean, viaTyping: boolean) => {
    const newTyped = new Set(typedOk);
    if (correct && viaTyping) newTyped.add(id);
    setTypedOk(newTyped);
    const updated = await recordAttempt(setKey, card, correct, viaTyping, p);
    // pravilo „bar jedan kucanjem": ako je dostigao 2 tačna ali nijedan kucanjem, zadrži learning
    if (updated.status === "mastered" && !newTyped.has(id)) updated.status = "learning";
    const np = new Map(prog); np.set(id, updated); setProg(np);
    setSeen((s) => s + 1);
    setQueue((q) => {
      const rest = q.slice(1);
      if (updated.status === "mastered") return rest;
      return [...rest, card]; // vrati na kraj (pogrešne i nedovršene)
    });
  };

  if (showMatch) {
    const pairs = items.slice(0, 6).map((c) => ({ de: c.front, sr: c.back.split("|")[0].trim() }));
    return (
      <Frame mastered={masteredCount} total={total} onExit={onExit}>
        <p className="text-sm text-gray-500 mb-2">Pauza — spoji parove 🧩</p>
        <MatchPairsExercise pairs={pairs} onAnswer={() => setSeen((s) => s + 1)} />
      </Frame>
    );
  }

  return (
    <Frame mastered={masteredCount} total={total} onExit={onExit}>
      {quiz ? (
        <QuizExercise
          key={id + seen}
          question={direction === "de-sr" ? card.front : card.back.replace(/\|/g, " / ")}
          options={quiz.options}
          correctAnswer={quiz.correctIndex}
          explanation={null}
          onAnswer={(correct) => advance(correct, false)}
        />
      ) : (
        <LearnTyping key={id + seen} card={card} direction={direction === "de-sr" ? "sr-de" : "de-sr"} onResult={(correct) => advance(correct, true)} />
      )}
    </Frame>
  );
}

function Frame({ mastered, total, onExit, children }: { mastered: number; total: number; onExit: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 mr-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${total ? (mastered / total) * 100 : 0}%` }} />
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">Naučeno {mastered}/{total}</span>
        <button onClick={onExit} className="ml-3 text-xs text-gray-400">✕</button>
      </div>
      {children}
    </div>
  );
}
```

Napomena za kviz pri smeru kucanja: kad `useTyping`, kucamo na suprotnom smeru (prisećanje ciljanog jezika). `LearnTyping` dobija obrnut smer u odnosu na kviz da bi prisećanje bilo na nemačkom kad je osnovni smer DE→SR.

- [ ] **Step 2: Verifikuj tipove**

Run: `npx tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add src/components/learn/LearnModule.tsx
git commit -m "feat: LearnModule orkestrator (runde, mastery, pauza)"
```

### Task 8: `WordSetBlock` + registracija

**Files:**
- Create: `src/components/lesson-blocks/WordSetBlock.tsx`
- Modify: `src/components/lesson-blocks/BlockRenderer.tsx`

- [ ] **Step 1: Implementiraj blok (lazy-load Learn)**

`src/components/lesson-blocks/WordSetBlock.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { WordSetSection } from "@/lib/flashcard-types";
import { loadSetProgress, type CardProgress } from "@/lib/flashcard-progress";

// Lazy-load: Learn kod se ne učitava dok korisnik ne klikne „Uči"
const LearnModule = dynamic(() => import("@/components/learn/LearnModule"), { ssr: false });

export default function WordSetBlock({ title, setKey, items }: WordSetSection) {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState<Map<string, CardProgress> | null>(null);

  useEffect(() => {
    if (open && !progress) loadSetProgress(setKey).then(setProgress);
  }, [open, progress, setKey]);

  if (open && progress) {
    return (
      <div className="border-2 border-ljubicasta bg-ljubicasta-light rounded-xl p-4 md:p-6">
        <LearnModule setKey={setKey} items={items} initialProgress={progress} onExit={() => setOpen(false)} />
      </div>
    );
  }

  return (
    <div className="border-2 border-ljubicasta bg-ljubicasta-light rounded-xl p-5 md:p-6 text-center">
      <div className="text-3xl mb-2">🧠</div>
      <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600 mb-4">{items.length} reči · uči kroz kviz i kucanje, prati napredak</p>
      <button onClick={() => setOpen(true)} className="bg-ljubicasta text-white rounded-xl px-6 py-3 font-bold">
        {open ? "Učitavam…" : "Uči ovaj set"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Registruj u `BlockRenderer.tsx`**

- Dodaj import uz ostale blokove:
```tsx
import WordSetBlock from "./WordSetBlock";
```
- U `renderBlock` switch, pre `default`:
```tsx
    case "wordset":
      return <WordSetBlock key={index} {...section} />;
```

- [ ] **Step 3: Verifikuj build**

Run: `npx tsc --noEmit && npm run build`
Expected: build prolazi. (Vidi `AGENTS.md` ako `next/dynamic` API ne odgovara — konsultuj `node_modules/next/dist/docs/`.)

- [ ] **Step 4: Commit**

```bash
git add src/components/lesson-blocks/WordSetBlock.tsx src/components/lesson-blocks/BlockRenderer.tsx
git commit -m "feat: WordSetBlock (REČI blok) + registracija u BlockRenderer"
```

### Task 9: Ručni smoke test srca

- [ ] **Step 1: Privremena test lekcija**

U bazi (ili lokalno preko admin editora) dodaj `wordset` sekciju u jednu A1.1 lekciju sa ~6 kartica (npr. Pozdravi), `setKey: "test-pozdravi"`.

- [ ] **Step 2: Pokreni i prođi sesiju na telefonu (responsive)**

Run: `npm run dev`, otvori lekciju, klikni „Uči ovaj set". Proveri: kviz → posle tačnog ide kucanje → „skoro tačno" radi → traka „Naučeno X/N" raste → 🏆 na kraju. Testiraj u mobilnom prikazu (DevTools device toolbar): dugmad velika, bez horizontalnog skrola.

- [ ] **Step 3: Proveri da se napredak čuva**

Osveži stranicu, ponovo „Uči" — savladane kartice ne vraćaju se (status `mastered` iz baze).

- [ ] **Step 4: Ukloni test sekciju** (ostaje za Phase 6 pravi sadržaj).

---

## Phase 4 — Igra memorije

### Task 10: `MemoryGame`

**Files:**
- Create: `src/components/learn/MemoryGame.tsx`
- Modify: `src/components/learn/LearnModule.tsx` (dodati `mode === "memory"` granu i dugme „Igra memorije")

- [ ] **Step 1: Implementiraj igru**

`src/components/learn/MemoryGame.tsx`:
```tsx
"use client";
import { useMemo, useState } from "react";
import type { FlashcardItem } from "@/lib/flashcard-types";

interface Tile { key: string; label: string; pairId: number; }

export default function MemoryGame({ items, onExit }: { items: FlashcardItem[]; onExit: () => void }) {
  // uzmi do 6 parova (12 pločica) da stane na telefon
  const round = useMemo(() => {
    const pick = items.slice(0, 6);
    const tiles: Tile[] = [];
    pick.forEach((c, i) => {
      tiles.push({ key: `de${i}`, label: c.front, pairId: i });
      tiles.push({ key: `sr${i}`, label: c.back.split("|")[0].trim(), pairId: i });
    });
    // deterministički raspored (rotacija) da izbegnemo Math.random
    return tiles.map((t, i) => ({ t, o: (i * 7) % tiles.length })).sort((a, b) => a.o - b.o).map((x) => x.t);
  }, [items]);

  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());

  const onTile = (t: Tile) => {
    if (matched.has(t.pairId) || flipped.includes(t.key) || flipped.length === 2) return;
    const next = [...flipped, t.key];
    setFlipped(next);
    if (next.length === 2) {
      const [a, b] = next.map((k) => round.find((x) => x.key === k)!);
      if (a.pairId === b.pairId) { setMatched((m) => new Set(m).add(a.pairId)); setFlipped([]); }
      else setTimeout(() => setFlipped([]), 800);
    }
  };

  const done = matched.size === round.length / 2;

  return (
    <div>
      <p className="text-sm text-gray-500 mb-2">🧩 Igra memorije — spoji parove</p>
      <div className="grid grid-cols-3 gap-2">
        {round.map((t) => {
          const show = flipped.includes(t.key) || matched.has(t.pairId);
          return (
            <button key={t.key} onClick={() => onTile(t)}
              className={`aspect-[3/4] rounded-xl text-sm font-bold flex items-center justify-center p-1 transition-colors ${
                matched.has(t.pairId) ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-700"
                : show ? "bg-white border-2 border-violet-400 text-gray-800"
                : "bg-violet-500 text-violet-500"}`}>
              {show ? t.label : "•"}
            </button>
          );
        })}
      </div>
      {done && (
        <div className="text-center mt-4">
          <p className="font-bold text-emerald-700 mb-2">Bravo! Sve spojeno 🎉</p>
          <button onClick={onExit} className="bg-violet-500 text-white rounded-xl px-5 py-2 font-bold">Nazad</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Poveži u `LearnModule`**

U `LearnModule.tsx`:
- Import: `import MemoryGame from "./MemoryGame";`
- Na vrh render-a (pre `queue.length === 0`), dodaj granu:
```tsx
  if (mode === "memory") return <MemoryGame items={items} onExit={onExit} />;
```

- [ ] **Step 3: Verifikuj build**

Run: `npx tsc --noEmit && npm run build`
Expected: prolazi.

- [ ] **Step 4: Smoke test na telefonu**

`npm run dev` → otvori set u `mode="memory"` (privremeno) → mreža 3 kolone staje bez skrola, parovi se spajaju.

- [ ] **Step 5: Commit**

```bash
git add src/components/learn/MemoryGame.tsx src/components/learn/LearnModule.tsx
git commit -m "feat: igra memorije (mobilna mreža 3 kol.)"
```

---

## Phase 5 — Uvoz iz Quizleta

### Task 11: Parser (čista funkcija, TDD)

**Files:**
- Create: `scripts/quizlet-parse.ts`
- Test: `scripts/quizlet-parse.test.ts`

- [ ] **Step 1: Napiši test**

`scripts/quizlet-parse.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseQuizlet } from "./quizlet-parse";

const sample = [
  "Guten Morgen\tDobro jutro!",
  "Gute Nacht\t",                 // prazan prevod
  "Hallo\tZdravo/Ćao",            // više prevoda
  "sagen\treći, kazati",          // više prevoda zarezom
].join("\n");

describe("parseQuizlet", () => {
  const r = parseQuizlet(sample);
  it("preskače kartice bez prevoda, ali ih prijavi", () => {
    expect(r.cards.find((c) => c.front === "Gute Nacht")).toBeUndefined();
    expect(r.skipped).toContain("Gute Nacht");
  });
  it("front/back se pravilno razdvajaju po tabu", () => {
    expect(r.cards[0]).toMatchObject({ front: "Guten Morgen", back: "Dobro jutro!" });
  });
  it("više prevoda (/) → spojeno sa |", () => {
    expect(r.cards.find((c) => c.front === "Hallo")!.back).toBe("Zdravo|Ćao");
  });
  it("više prevoda (zarez) → spojeno sa |", () => {
    expect(r.cards.find((c) => c.front === "sagen")!.back).toBe("reći|kazati");
  });
});
```

- [ ] **Step 2: Pokreni — pad**

Run: `npx vitest run scripts/quizlet-parse.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementiraj**

`scripts/quizlet-parse.ts`:
```ts
import type { FlashcardItem } from "../src/lib/flashcard-types";

export interface ParseResult { cards: FlashcardItem[]; skipped: string[]; }

/** Quizlet export: "front<TAB>back" po liniji. Prazni back → skipped. Više prevoda (/ ili ,) → "a|b". */
export function parseQuizlet(text: string): ParseResult {
  const cards: FlashcardItem[] = [];
  const skipped: string[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const [frontRaw, backRaw = ""] = line.split("\t");
    const front = frontRaw.trim();
    const back = backRaw.trim();
    if (!front) continue;
    if (!back) { skipped.push(front); continue; }
    const variants = back.split(/[/,]/).map((s) => s.trim()).filter(Boolean);
    cards.push({ front, back: variants.join("|") });
  }
  return { cards, skipped };
}
```

- [ ] **Step 4: Pokreni — prolaz**

Run: `npx vitest run scripts/quizlet-parse.test.ts`
Expected: PASS (4 testa).

- [ ] **Step 5: Commit**

```bash
git add scripts/quizlet-parse.ts scripts/quizlet-parse.test.ts
git commit -m "feat: Quizlet parser (tab, prazni, više prevoda)"
```

### Task 12: Import runner (export fajl → wordset JSON)

**Files:**
- Create: `scripts/import-quizlet.ts`

- [ ] **Step 1: Implementiraj CLI**

`scripts/import-quizlet.ts`:
```ts
/**
 * Quizlet export → WordSetSection JSON.
 *   npx tsx scripts/import-quizlet.ts <export.txt> <setKey> "<Naslov>" > out.json
 * Auto-dopuna roda/množine NIJE ovde (radi se zasebno + Natašina potvrda — vidi Task 13).
 */
import * as fs from "fs";
import { parseQuizlet } from "./quizlet-parse";

const [, , file, setKey, title] = process.argv;
if (!file || !setKey || !title) { console.error("Upotreba: import-quizlet.ts <export.txt> <setKey> <Naslov>"); process.exit(1); }

const text = fs.readFileSync(file, "utf-8");
const { cards, skipped } = parseQuizlet(text);
const section = { type: "wordset", title, setKey, frontLabel: "DE", backLabel: "SR", items: cards };

console.error(`Kartica: ${cards.length}, preskočeno (bez prevoda): ${skipped.length}`);
if (skipped.length) console.error("  Dopuni prevod za: " + skipped.join(", "));
console.log(JSON.stringify(section, null, 2));
```

- [ ] **Step 2: Test na pravom uzorku**

Sačuvaj uzorak iz spec-a u `/tmp/a1-l1.txt` i pokreni:
```bash
npx tsx scripts/import-quizlet.ts /tmp/a1-l1.txt a1-1-lektion-1 "Lektion 1 — Reči" > /tmp/out.json
```
Expected: stderr prijavi broj kartica i koje da se dopune („Gute Nacht", „Auf Wiedersehen"); `/tmp/out.json` je validan `wordset`.

- [ ] **Step 3: Commit**

```bash
git add scripts/import-quizlet.ts
git commit -m "feat: import-quizlet CLI (export → wordset JSON)"
```

---

## Phase 6 — Sadržaj A1.1 (sa Natašom)

### Task 13: Auto-dopuna roda/množine + uvoz Lektion 1

**Files:** (nema koda — sadržajni korak; koristi gornje alate)

- [ ] **Step 1:** Nataša exportuje Quizlet set za A1.1 Lektion 1, sačuvaj u `/tmp`.
- [ ] **Step 2:** `import-quizlet.ts` → `wordset` JSON. Dopuni prazne prevode koje stderr prijavi.
- [ ] **Step 3:** Za imenice bez člana, AI-dopuni `article`+`plural` (pojedinačno, pa Natašina potvrda). Ažuriraj JSON.
- [ ] **Step 4:** Kreiraj „REČI" lekciju u modulu (preko admin editora ili direktno u `lessons.sections`) sa tim `wordset` blokom.
- [ ] **Step 5:** Smoke test na telefonu: „Uči" → cela sesija radi, napredak se čuva.
- [ ] **Step 6:** `vercel --prod` deploy + `smoke-deploy` (postojeća navika). Verifikuj keš (cache-buster) po memoriji.

---

## Self-review (popunjeno tokom pisanja)

- **Spec coverage:** model (T1) · card_id (T2) · grading/član/množina/skoro-tačno (T3) · mastery tabela+RLS (T4) · mastery lib (T5) · kucanje (T6) · runde+kviz+mastery (T7) · REČI blok+lazy-load (T8) · igra memorije (T10) · Quizlet uvoz+format (T11–12) · sadržaj/REČI lekcija (T13). Slike = van obima (polje postoji u T1, bez UI) ✓. Izbor načina vežbanja: `mode` prop u `LearnModule` (guided/quiz/typing/match/memory) postavljen u T7/T10; zasebna dugmad za izbor su tanak dodatak na `WordSetBlock` i mogu se dodati pri T8/T10 bez novog modela.
- **Placeholder scan:** sve funkcije/komponente imaju pun kod; nema TBD.
- **Type consistency:** `FlashcardItem`, `Direction` (`de-sr`/`sr-de`), `CardProgress`, `WordSetSection`, `cardId(setKey,front,back)`, `gradeTyping`, `buildQuizOptions`, `recordAttempt`, `loadSetProgress` — imena usklađena kroz Task-ove.
