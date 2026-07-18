# Vežba "Milioner" - plan implementacije

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Novi tip vežbe `millionaire` - kviz igra "Ko želi da postane milioner" sa 15 pitanja rastuće težine, lestvicom poena, sigurnim stepenicima i dva džokera.

**Architecture:** Čista logika igre u `src/lib/millionaire.ts` (testabilna, bez React-a), UI u novoj komponenti `MillionaireExercise.tsx` koja se rano vraća iz `ExerciseRunner`-a (kao GroupedExamExercise). Pitanja su standardna kviz pitanja u `exercise_questions` (`correct_answer` = INDEKS opcije, kao kod kviza), `order_index` 0-14 su igra, 15+ su rezerve za džoker "Zameni pitanje". Rezultat ide u postojeći `exercise_attempts`, srca kroz postojeći `/api/hearts/award` sa novim razlogom `millionaire_win`.

**Tech Stack:** Next.js (App Router, PAZI: verzija sa breaking changes - pročitaj `node_modules/next/dist/docs/` pre pisanja Next koda), React client komponente, Supabase, vitest.

**Spec:** `docs/superpowers/specs/2026-07-18-milioner-vezba-design.md`

**Bitne konvencije repoa:**
- typecheck: `./node_modules/.bin/tsc --noEmit` (NE globalni tsc)
- testovi: `npx vitest run` (ili `npm test`)
- kviz `correct_answer` je INDEKS opcije kao string ("0"-"3"), NE vrednost
- obična crtica u svim tekstovima, nikad em-dash
- commit na `main` (trunk-based), proveri granu pre commita: `git branch --show-current`

---

### Task 1: Migracija - dozvoli `millionaire` u check constraint-u

**Files:**
- Create: `supabase/migrations/064_add_millionaire_exercise_type.sql`

- [ ] **Step 1: Napiši migraciju**

```sql
-- Dozvoli 'millionaire' tip vežbe (kviz igra Milioner)
ALTER TABLE public.exercises DROP CONSTRAINT IF EXISTS exercises_exercise_type_check;
ALTER TABLE public.exercises ADD CONSTRAINT exercises_exercise_type_check
  CHECK (exercise_type IN ('quiz', 'fill_blank', 'match_pairs', 'word_order', 'listen_write', 'dialog', 'true_false', 'typing', 'speak', 'essay', 'sprechen', 'millionaire'));
```

Lista tipova je tačno ona iz `031_sprechen_submissions.sql` + `millionaire` na kraju. NE izmišljaj dodatne tipove (`conversation` i `categorize` iz TS unije NISU u constraint-u - to su tipovi pitanja, ne vežbi).

- [ ] **Step 2: Primeni migraciju na produkcionu bazu**

Supabase DDL se primenjuje kroz Management API sa service-role ključem (napomena: `sbp_` token u `.env.local` je mrtav, service-role radi) ili ručno kroz Supabase SQL Editor. Koristi način koji je već korišćen za migracije 060-063; ako nemaš pristup, zamoli Natašu da nalepi SQL u SQL Editor.

Provera: `SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'exercises_exercise_type_check';` mora da sadrži `millionaire`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/064_add_millionaire_exercise_type.sql
git commit -m "feat: migracija - millionaire exercise_type"
```

---

### Task 2: Tip u TS uniji

**Files:**
- Modify: `src/lib/types.ts:76`

- [ ] **Step 1: Dodaj `"millionaire"` u `ExerciseType`**

U `src/lib/types.ts` liniju:

```ts
export type ExerciseType = "quiz" | "fill_blank" | "match_pairs" | "word_order" | "listen_write" | "dialog" | "true_false" | "categorize" | "typing" | "conversation" | "speak" | "essay" | "sprechen";
```

zameni sa:

```ts
export type ExerciseType = "quiz" | "fill_blank" | "match_pairs" | "word_order" | "listen_write" | "dialog" | "true_false" | "categorize" | "typing" | "conversation" | "speak" | "essay" | "sprechen" | "millionaire";
```

- [ ] **Step 2: Typecheck**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez grešaka (novi član unije ne lomi ništa).

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: millionaire u ExerciseType uniji"
```

---

### Task 3: Logika igre `src/lib/millionaire.ts` (TDD)

**Files:**
- Create: `src/lib/millionaire.ts`
- Test: `src/lib/millionaire.test.ts`

Čiste funkcije, bez React-a i bez Supabase-a - po uzoru na `src/lib/hearts/award.ts`. NE koristi `Math.random` direktno u logici - rng se prosleđuje kao parametar (testabilnost).

- [ ] **Step 1: Napiši padajuće testove**

Kreiraj `src/lib/millionaire.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  LADDER, ladderFor, safeLevelsFor, createGame, answer, walkAway,
  applyFiftyFifty, useSwap, wonPoints, type MillionaireState,
} from "./millionaire";

const rngFirst = () => 0; // deterministički rng za testove

describe("ladderFor", () => {
  it("puna igra ima 15 suma i milion na vrhu", () => {
    expect(ladderFor(15)).toEqual([...LADDER]);
    expect(ladderFor(15)).toHaveLength(15);
    expect(ladderFor(15)[14]).toBe(1_000_000);
  });
  it("kraća igra: prvih n-1 suma + milion kao poslednja", () => {
    expect(ladderFor(5)).toEqual([100, 200, 300, 500, 1_000_000]);
  });
  it("jedno pitanje = odmah milion", () => {
    expect(ladderFor(1)).toEqual([1_000_000]);
  });
});

describe("safeLevelsFor", () => {
  it("puna igra: sigurni stepenici posle 5. i 10. pitanja (indeksi 4 i 9)", () => {
    expect(safeLevelsFor(15)).toEqual([4, 9]);
  });
  it("kratka igra bez stepenika", () => {
    expect(safeLevelsFor(4)).toEqual([]);
  });
});

describe("answer", () => {
  it("tačan odgovor penje na sledeći nivo", () => {
    const s = createGame(15);
    const next = answer(s, true);
    expect(next.level).toBe(1);
    expect(next.status).toBe("playing");
    expect(next.correctCount).toBe(1);
    expect(next.hiddenOptions).toEqual([]); // 50:50 važi samo za jedno pitanje
  });
  it("tačan odgovor na poslednjem pitanju = pobeda", () => {
    let s = createGame(2);
    s = answer(s, true);
    s = answer(s, true);
    expect(s.status).toBe("won");
    expect(s.correctCount).toBe(2);
  });
  it("pogrešan odgovor završava igru", () => {
    const s = createGame(15);
    const next = answer(s, false);
    expect(next.status).toBe("lost");
    expect(next.correctCount).toBe(0);
  });
});

describe("wonPoints", () => {
  it("pobeda nosi milion", () => {
    let s = createGame(2);
    s = answer(s, true);
    s = answer(s, true);
    expect(wonPoints(s)).toBe(1_000_000);
  });
  it("ispadanje pre prvog stepenika = 0 poena", () => {
    let s = createGame(15);
    s = answer(s, true); // nivo 1
    s = answer(s, false);
    expect(wonPoints(s)).toBe(0);
  });
  it("ispadanje posle 5. pitanja pada na 1.000 (stepenik)", () => {
    let s = createGame(15);
    for (let i = 0; i < 6; i++) s = answer(s, true); // prošao pitanja 1-6
    s = answer(s, false); // pao na 7. pitanju
    expect(wonPoints(s)).toBe(1_000); // LADDER[4]
  });
  it("ispadanje posle 10. pitanja pada na 32.000", () => {
    let s = createGame(15);
    for (let i = 0; i < 11; i++) s = answer(s, true);
    s = answer(s, false);
    expect(wonPoints(s)).toBe(32_000); // LADDER[9]
  });
  it("odustajanje nosi trenutno osvojeno", () => {
    let s = createGame(15);
    for (let i = 0; i < 3; i++) s = answer(s, true); // osvojio 300
    s = walkAway(s);
    expect(s.status).toBe("walked");
    expect(wonPoints(s)).toBe(300); // LADDER[2]
  });
  it("odustajanje pre prvog odgovora nosi 0", () => {
    const s = walkAway(createGame(15));
    expect(wonPoints(s)).toBe(0);
  });
});

describe("applyFiftyFifty", () => {
  it("sklanja tačno dve pogrešne opcije i troši džoker", () => {
    const s = createGame(15);
    const next = applyFiftyFifty(s, 2, 4, rngFirst);
    expect(next.usedFiftyFifty).toBe(true);
    expect(next.hiddenOptions).toHaveLength(2);
    expect(next.hiddenOptions).not.toContain(2); // tačna ostaje
  });
  it("ne može dvaput", () => {
    let s = createGame(15);
    s = applyFiftyFifty(s, 0, 4, rngFirst);
    const again = applyFiftyFifty(s, 0, 4, rngFirst);
    expect(again).toBe(s); // nepromenjeno stanje
  });
  it("sa 3 opcije sklanja dve pogrešne (ostaje samo tačna)", () => {
    const s = createGame(15);
    const next = applyFiftyFifty(s, 1, 3, rngFirst);
    expect(next.hiddenOptions.sort()).toEqual([0, 2]);
  });
});

describe("useSwap", () => {
  it("troši džoker i resetuje 50:50 sakrivanje za novo pitanje", () => {
    let s = createGame(15);
    s = applyFiftyFifty(s, 0, 4, rngFirst);
    const next = useSwap(s);
    expect(next.usedSwap).toBe(true);
    expect(next.hiddenOptions).toEqual([]);
    expect(next.usedFiftyFifty).toBe(true); // 50:50 ostaje potrošen
  });
  it("ne može dvaput", () => {
    let s = useSwap(createGame(15));
    expect(useSwap(s)).toBe(s);
  });
});
```

- [ ] **Step 2: Pusti testove - moraju da PADNU**

Run: `npx vitest run src/lib/millionaire.test.ts`
Expected: FAIL - "Cannot find module './millionaire'" (ili slično).

- [ ] **Step 3: Implementiraj `src/lib/millionaire.ts`**

```ts
// src/lib/millionaire.ts
// Čista logika igre "Milioner" - bez React-a, bez mreže (testabilnost).
// Pitanja i odgovore vodi komponenta; ovde je samo stanje igre.

export const LADDER = [
  100, 200, 300, 500, 1_000,
  2_000, 4_000, 8_000, 16_000, 32_000,
  64_000, 125_000, 250_000, 500_000, 1_000_000,
] as const;

// Sigurni stepenici: posle 5. i 10. pitanja (indeksi 4 i 9).
const SAFE_LEVELS = [4, 9] as const;

export type MillionaireStatus = "playing" | "won" | "lost" | "walked";

export type MillionaireState = {
  questionCount: number;
  level: number;           // indeks trenutnog pitanja (0-based)
  status: MillionaireStatus;
  correctCount: number;
  usedFiftyFifty: boolean;
  usedSwap: boolean;
  hiddenOptions: number[]; // indeksi opcija sklonjeni 50:50 (samo tekuće pitanje)
};

/** Lestvica za igru od n pitanja: za n<15 prvih n-1 suma + milion na vrhu. */
export function ladderFor(n: number): number[] {
  if (n >= LADDER.length) return [...LADDER];
  return [...LADDER.slice(0, n - 1), LADDER[LADDER.length - 1]];
}

/** Sigurni stepenici koji postoje u igri od n pitanja (mora biti pre poslednjeg pitanja). */
export function safeLevelsFor(n: number): number[] {
  return SAFE_LEVELS.filter((l) => l < n - 1);
}

export function createGame(questionCount: number): MillionaireState {
  return {
    questionCount,
    level: 0,
    status: "playing",
    correctCount: 0,
    usedFiftyFifty: false,
    usedSwap: false,
    hiddenOptions: [],
  };
}

export function answer(state: MillionaireState, isCorrect: boolean): MillionaireState {
  if (state.status !== "playing") return state;
  if (!isCorrect) return { ...state, status: "lost", hiddenOptions: [] };
  const correctCount = state.correctCount + 1;
  const isLast = state.level >= state.questionCount - 1;
  return {
    ...state,
    correctCount,
    level: isLast ? state.level : state.level + 1,
    status: isLast ? "won" : "playing",
    hiddenOptions: [],
  };
}

export function walkAway(state: MillionaireState): MillionaireState {
  if (state.status !== "playing") return state;
  return { ...state, status: "walked", hiddenOptions: [] };
}

/** 50:50 - sakrij dve pogrešne opcije (ili sve pogrešne sem jedne ako ih je manje). */
export function applyFiftyFifty(
  state: MillionaireState,
  correctIndex: number,
  optionCount: number,
  rng: () => number,
): MillionaireState {
  if (state.status !== "playing" || state.usedFiftyFifty) return state;
  const wrong = Array.from({ length: optionCount }, (_, i) => i).filter((i) => i !== correctIndex);
  // Fisher-Yates sa prosleđenim rng
  for (let i = wrong.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [wrong[i], wrong[j]] = [wrong[j], wrong[i]];
  }
  const hidden = wrong.slice(0, Math.min(2, wrong.length));
  return { ...state, usedFiftyFifty: true, hiddenOptions: hidden };
}

/** Zameni pitanje - logika samo troši džoker; novo pitanje bira komponenta. */
export function useSwap(state: MillionaireState): MillionaireState {
  if (state.status !== "playing" || state.usedSwap) return state;
  return { ...state, usedSwap: true, hiddenOptions: [] };
}

/** Osvojeni poeni na kraju igre (za "playing" vraća trenutno osigurano kao informaciju). */
export function wonPoints(state: MillionaireState): number {
  const ladder = ladderFor(state.questionCount);
  if (state.status === "won") return ladder[ladder.length - 1];
  if (state.status === "walked" || state.status === "playing") {
    return state.correctCount > 0 ? ladder[state.correctCount - 1] : 0;
  }
  // lost: pada na najviši sigurni stepenik ispod dostignutog
  const passed = safeLevelsFor(state.questionCount).filter((l) => l < state.correctCount);
  return passed.length > 0 ? ladder[passed[passed.length - 1]] : 0;
}
```

- [ ] **Step 4: Pusti testove - moraju da PROĐU**

Run: `npx vitest run src/lib/millionaire.test.ts`
Expected: PASS, svi testovi zeleni.

Napomena ako neki test padne: proveri semantiku `correctCount` vs `level` u `wonPoints` - "prošao 5. pitanje" znači `correctCount >= 5`, tj. stepenik indeks 4 je pređen kad je `correctCount > 4`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/millionaire.ts src/lib/millionaire.test.ts
git commit -m "feat: logika igre Milioner (lestvica, stepenici, dzokeri)"
```

---

### Task 4: Srca za osvojen milion (TDD)

**Files:**
- Modify: `src/lib/hearts/config.ts`
- Modify: `src/lib/hearts/award.ts`
- Modify: `src/app/api/hearts/award/route.ts`
- Test: `src/lib/hearts/award.test.ts`

- [ ] **Step 1: Dodaj padajući test u `src/lib/hearts/award.test.ts`**

Na kraj postojećeg describe bloka (pored postojećih testova, prati njihov stil - pogledaj fajl pre izmene):

```ts
// hearts_today 60 = dnevni cilj vec presao, testiramo cistu baznu nagradu
// (sa hearts_today 0 bi nagrada od 50 tacno presla prag dnevnog cilja i legao bi +20 bonus)
it("millionaire_win nosi fiksnih 50 srca", () => {
  const prev: Progress = {
    total_hearts: 0, level: 1, current_streak: 0, longest_streak: 0,
    last_active_date: "2026-07-18", hearts_today: 60,
  };
  const r = applyAward(prev, { reason: "millionaire_win" }, "2026-07-18");
  expect(r.awarded).toBe(50);
});
```

(Ako `Progress` nije već importovan u testu, dodaj ga u postojeći import iz `./award`.)

- [ ] **Step 2: Pusti test - mora da PADNE**

Run: `npx vitest run src/lib/hearts/award.test.ts`
Expected: FAIL - TS greška da `"millionaire_win"` nije dozvoljen `reason`.

- [ ] **Step 3: Implementiraj**

U `src/lib/hearts/config.ts` dodaj u `HEART_REWARDS`:

```ts
  millionaire_win: 50,    // osvojen milion u vežbi Milioner
```

U `src/lib/hearts/award.ts` proširi `AwardInput`:

```ts
export type AwardInput =
  | { reason: "lesson_complete" }
  | { reason: "daily_login" }
  | { reason: "test_pass"; percent: number }
  | { reason: "exercise"; correct: number; hadStreak: boolean }
  | { reason: "millionaire_win" };
```

i u `baseAmount` switch dodaj:

```ts
    case "millionaire_win": return HEART_REWARDS.millionaire_win;
```

U `src/app/api/hearts/award/route.ts` u `parseInput` switch, uz postojeće case-ove `"lesson_complete"` i `"daily_login"` (isti oblik bez parametara):

```ts
    case "lesson_complete":
    case "daily_login":
    case "millionaire_win":
      return { reason: b.reason };
```

- [ ] **Step 4: Testovi + typecheck**

Run: `npx vitest run src/lib/hearts/ && ./node_modules/.bin/tsc --noEmit`
Expected: PASS / bez grešaka.

- [ ] **Step 5: Commit**

```bash
git add src/lib/hearts/config.ts src/lib/hearts/award.ts src/lib/hearts/award.test.ts src/app/api/hearts/award/route.ts
git commit -m "feat: srca nagrada millionaire_win (50)"
```

---

### Task 5: Komponenta `MillionaireExercise.tsx`

**Files:**
- Create: `src/components/exercises/MillionaireExercise.tsx`

Komponenta vodi ceo tok (kao DialogExercise): igra, džokeri, kraj, snimanje, retry. Bez tajmera. Stil prati postojeće vežbe (tailwind klase `plava`, `koral`, `bg-white rounded-xl shadow-sm`...).

- [ ] **Step 1: Napiši komponentu**

```tsx
"use client";

// Vežba "Milioner" - kviz igra sa lestvicom poena i džokerima.
// Pitanja: order_index 0..N-1 su igra (max 15), 15+ su rezerve za "Zameni pitanje".
// correct_answer = INDEKS opcije (kao kod kviza).
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  createGame, answer, walkAway, applyFiftyFifty, useSwap, wonPoints,
  ladderFor, safeLevelsFor, type MillionaireState,
} from "@/lib/millionaire";
import type { Exercise, ExerciseQuestion } from "@/lib/types";

const MAIN_COUNT = 15;

function optionsOf(q: ExerciseQuestion): string[] {
  const raw = q.options;
  if (Array.isArray(raw)) return raw.map(String);
  if (raw && typeof raw === "object") {
    const items = (raw as { items?: unknown }).items;
    if (Array.isArray(items)) return items.map(String);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
      if (Array.isArray(parsed?.items)) return parsed.items.map(String);
    } catch { /* nije JSON */ }
  }
  return [];
}

interface Props {
  exercise: Exercise;
  questions: ExerciseQuestion[];
}

export default function MillionaireExercise({ exercise, questions }: Props) {
  const supabase = createClient();
  const sorted = [...questions].sort((a, b) => a.order_index - b.order_index);
  const main = sorted.slice(0, MAIN_COUNT);
  const initialReserves = sorted.slice(MAIN_COUNT);

  const [game, setGame] = useState<MillionaireState>(() => createGame(main.length));
  const [reserves, setReserves] = useState<ExerciseQuestion[]>(initialReserves);
  // zamene: level -> rezervno pitanje umesto originalnog
  const [overrides, setOverrides] = useState<Record<number, ExerciseQuestion>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [saved, setSaved] = useState(false);

  const ladder = ladderFor(main.length);
  const safeLevels = safeLevelsFor(main.length);
  const question = overrides[game.level] ?? main[game.level];
  const opts = question ? optionsOf(question) : [];
  const correctIndex = question ? parseInt(question.correct_answer) : -1;
  const finished = game.status !== "playing";
  const points = wonPoints(game);

  if (main.length === 0) {
    return <p className="text-gray-500 text-center py-8">Ova vežba još nema pitanja.</p>;
  }

  const saveResult = async (finalGame: MillionaireState) => {
    setSaving(true);
    setSaveFailed(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaveFailed(true); setSaving(false); return; }
    const { error } = await supabase.from("exercise_attempts").insert({
      exercise_id: exercise.id,
      user_id: user.id,
      score: finalGame.correctCount,
      total_questions: main.length,
    });
    if (error) { setSaveFailed(true); setSaving(false); return; }
    setSaved(true);
    // srca: tačni odgovori + poseban bonus za milion (tiho - srca su sekundarna)
    try {
      await fetch("/api/hearts/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "exercise", correct: finalGame.correctCount, hadStreak: finalGame.correctCount >= 3 }),
      });
      if (finalGame.status === "won") {
        await fetch("/api/hearts/award", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "millionaire_win" }),
        });
      }
    } catch { /* tiho */ }
    setSaving(false);
  };

  const finishWith = (next: MillionaireState) => {
    setGame(next);
    if (next.status !== "playing") void saveResult(next);
  };

  const confirmAnswer = () => {
    if (selected === null || revealed) return;
    setRevealed(true);
    const isCorrect = selected === correctIndex;
    setTimeout(() => {
      setRevealed(false);
      setSelected(null);
      finishWith(answer(game, isCorrect));
    }, 1600);
  };

  const swapQuestion = () => {
    if (game.usedSwap || reserves.length === 0 || revealed) return;
    const [replacement, ...rest] = reserves;
    setOverrides({ ...overrides, [game.level]: replacement });
    setReserves(rest);
    setSelected(null);
    setGame(useSwap(game));
  };

  const playAgain = () => {
    setGame(createGame(main.length));
    setOverrides({});
    setReserves(initialReserves);
    setSelected(null);
    setRevealed(false);
    setSaved(false);
    setSaveFailed(false);
  };

  // ----- Kraj igre -----
  if (finished) {
    const won = game.status === "won";
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">{won ? "🏆" : game.status === "walked" ? "💼" : "💥"}</div>
        <div className="text-4xl font-bold text-plava mb-2">{points.toLocaleString("sr-RS")} poena</div>
        <p className="text-gray-500 mb-1">
          {won
            ? "MILION! Odgovorila/o si tačno na sva pitanja! 🎉"
            : game.status === "walked"
              ? `Odustala/o si i nosiš osvojeno. Tačnih odgovora: ${game.correctCount} od ${main.length}.`
              : `Pogrešan odgovor. Tačnih odgovora: ${game.correctCount} od ${main.length}.`}
        </p>
        {won && <p className="text-plava font-bold mb-1">+50 ❤️ bonus za milion!</p>}
        {saveFailed && (
          <div className="mt-4 max-w-md mx-auto">
            <p className="text-sm text-koral-dark bg-koral-light rounded-lg px-4 py-2.5">
              Rezultat nije sačuvan u tvom napretku. Pokušaj ponovo - ako se ponovi, odjavi se i prijavi ponovo.
            </p>
            <button
              onClick={() => void saveResult(game)}
              disabled={saving}
              className="mt-2 bg-plava text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-plava-dark transition-colors disabled:opacity-50"
            >
              {saving ? "Čuvam..." : "Sačuvaj rezultat"}
            </button>
          </div>
        )}
        {saved && <p className="text-xs text-gray-400 mt-2">Rezultat sačuvan ✓</p>}
        <button
          onClick={playAgain}
          className="mt-6 bg-plava text-white px-6 py-3 rounded-lg font-bold hover:bg-plava-dark transition-colors"
        >
          Igraj ponovo
        </button>
      </div>
    );
  }

  // ----- Igra -----
  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Lestvica - desktop sa strane, mobilno sažeto iznad */}
      <div className="md:order-2 md:w-48 shrink-0">
        <div className="hidden md:flex flex-col-reverse gap-1">
          {ladder.map((sum, i) => (
            <div
              key={i}
              className={`text-sm px-3 py-1 rounded flex justify-between ${
                i === game.level
                  ? "bg-plava text-white font-bold"
                  : i < game.level
                    ? "text-gray-300 line-through"
                    : safeLevels.includes(i)
                      ? "text-plava font-bold"
                      : "text-gray-500"
              }`}
            >
              <span>{i + 1}.</span>
              <span>{sum.toLocaleString("sr-RS")}</span>
            </div>
          ))}
        </div>
        <div className="md:hidden text-center text-sm text-gray-500">
          Pitanje {game.level + 1} od {main.length} · igraš za{" "}
          <span className="font-bold text-plava">{ladder[game.level].toLocaleString("sr-RS")}</span> poena
        </div>
      </div>

      <div className="flex-1 md:order-1">
        {/* Džokeri */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setGame(applyFiftyFifty(game, correctIndex, opts.length, Math.random))}
            disabled={game.usedFiftyFifty || revealed}
            title="Skloni dva pogrešna odgovora"
            className="px-3 py-1.5 rounded-full border-2 text-sm font-bold transition-colors border-plava text-plava hover:bg-plava-light disabled:border-gray-200 disabled:text-gray-300 disabled:line-through disabled:hover:bg-transparent"
          >
            50:50
          </button>
          <button
            onClick={swapQuestion}
            disabled={game.usedSwap || reserves.length === 0 || revealed}
            title={reserves.length === 0 ? "Nema rezervnih pitanja" : "Zameni pitanje drugim"}
            className="px-3 py-1.5 rounded-full border-2 text-sm font-bold transition-colors border-plava text-plava hover:bg-plava-light disabled:border-gray-200 disabled:text-gray-300 disabled:line-through disabled:hover:bg-transparent"
          >
            🔄 Zameni pitanje
          </button>
          {game.correctCount > 0 && (
            <button
              onClick={() => finishWith(walkAway(game))}
              disabled={revealed}
              className="ml-auto px-3 py-1.5 rounded-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Odustani i nosi {points.toLocaleString("sr-RS")}
            </button>
          )}
        </div>

        {/* Pitanje */}
        <div
          className="text-lg font-medium text-gray-900 mb-4"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.question) }}
        />

        {/* Odgovori */}
        <div className="grid gap-3 sm:grid-cols-2">
          {opts.map((opt, i) => {
            const hidden = game.hiddenOptions.includes(i);
            const letter = String.fromCharCode(65 + i); // A, B, C, D
            let style = "border-gray-200 hover:border-plava";
            if (revealed && i === correctIndex) style = "border-green-500 bg-green-50";
            else if (revealed && i === selected) style = "border-koral bg-koral-light";
            else if (selected === i) style = "border-plava bg-plava-light";
            return (
              <button
                key={i}
                onClick={() => !revealed && setSelected(i)}
                disabled={hidden || revealed}
                className={`text-left px-4 py-3 rounded-lg border-2 transition-colors ${style} ${hidden ? "opacity-0 pointer-events-none" : ""}`}
              >
                <span className="font-bold text-plava mr-2">{letter}:</span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Konačan odgovor */}
        {selected !== null && !revealed && (
          <button
            onClick={confirmAnswer}
            className="mt-4 w-full bg-plava text-white py-3 rounded-lg font-bold hover:bg-plava-dark transition-colors"
          >
            Konačan odgovor?
          </button>
        )}
        {revealed && selected !== correctIndex && question.explanation && (
          <p className="mt-3 text-sm text-gray-500">{question.explanation}</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez grešaka. Ako `sanitizeHtml` ili tailwind klase (`plava-light`, `koral-light`...) ne postoje pod tim imenima, pogledaj kako ih koristi `ExerciseRunner.tsx` i uskladi.

- [ ] **Step 3: Commit**

```bash
git add src/components/exercises/MillionaireExercise.tsx
git commit -m "feat: MillionaireExercise komponenta (igra, dzokeri, snimanje)"
```

---

### Task 6: Grana u `ExerciseRunner`

**Files:**
- Modify: `src/components/exercises/ExerciseRunner.tsx`

- [ ] **Step 1: Import + rani return**

Dodaj import uz ostale (posle linije 19, `import GroupedExamExercise...`):

```tsx
import MillionaireExercise from "./MillionaireExercise";
```

Dodaj rani return PRE `isGroupedExam` provere (pre komentara "Ispitni (grupni) prikaz" na ~liniji 80), da milioner ne bi slučajno upao u grupni prikaz i da ceo set pitanja ode komponenti:

```tsx
  // Milioner - vodi sopstveni tok (igra, džokeri, snimanje)
  if (exercise.exercise_type === "millionaire") {
    return <MillionaireExercise exercise={exercise} questions={questions} />;
  }
```

VAŽNO: postavi ga POSLE svih hook poziva (useState/useEffect), na isto mesto logike gde je `isGroupedExam` return - inače React pukne zbog uslovnog poziva hookova.

- [ ] **Step 2: Typecheck + svi testovi**

Run: `./node_modules/.bin/tsc --noEmit && npx vitest run`
Expected: sve zeleno.

- [ ] **Step 3: Commit**

```bash
git add src/components/exercises/ExerciseRunner.tsx
git commit -m "feat: millionaire grana u ExerciseRunner"
```

---

### Task 7: Admin - Milioner u panelu vežbi

**Files:**
- Modify: `src/app/admin/vezbe/[lessonId]/page.tsx`

Milioner koristi identičan editor pitanja kao kviz - samo proširujemo uslove.

- [ ] **Step 1: Tri izmene**

1. U `typeLabels` (linija ~9) dodaj:

```ts
  millionaire: "Milioner",
```

2. U `addQuestion` (linija ~116) uslov za kviz podrazumevana pitanja proširi:

```ts
    if (exerciseType === "quiz" || exerciseType === "millionaire") {
      defaultData.options = ["", "", "", ""];
      defaultData.correct_answer = "0";
    } else if (exerciseType === "fill_blank") {
```

3. Editor pitanja (linija ~248) - uslov `{ex.exercise_type === "quiz" && (` zameni sa:

```tsx
    {(ex.exercise_type === "quiz" || ex.exercise_type === "millionaire") && (
```

Dugme "+ Milioner" se pojavljuje samo od sebe jer se lista dugmadi generiše iz `typeLabels` (linija ~583).

- [ ] **Step 2: Typecheck**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: bez grešaka.

- [ ] **Step 3: Commit**

```bash
git add "src/app/admin/vezbe/[lessonId]/page.tsx"
git commit -m "feat: Milioner u admin panelu vezbi"
```

---

### Task 8: Smoke test u pregledaču

**Files:** nema izmena koda (osim eventualnih popravki)

- [ ] **Step 1: Pokreni dev server** (preview tool, ne Bash; ako sve rute vrate 404 - restart servera, poznat Turbopack dev problem)

- [ ] **Step 2: Admin tok** - uloguj se kao admin (info@ nalog), otvori `/admin/vezbe/<lessonId>` za bilo koju test lekciju, klikni "+ Milioner", dodaj 3-4 pitanja sa po 4 opcije i tačnim odgovorom, i 1 rezervno (5. pitanje).

- [ ] **Step 3: Polaznički tok** - otvori vežbu kao polaznik i proveri redom:
  - lestvica prikazuje onoliko suma koliko ima glavnih pitanja, poslednja je 1.000.000
  - izbor odgovora → "Konačan odgovor?" → zeleno/crveno otkrivanje
  - 50:50 skloni dve pogrešne opcije i posle toga je precrtan
  - "Zameni pitanje" ubaci rezervno pitanje i posle toga je precrtan
  - pogrešan odgovor završava igru sa padom na stepenik (ili 0)
  - "Odustani i nosi X" se pojavi posle prvog tačnog odgovora
  - kraj igre upiše red u `exercise_attempts` (proveri u Supabase tabeli)
  - "Igraj ponovo" resetuje igru
  - mobilni prikaz (resize 375px): lestvica se sažme u jedan red

- [ ] **Step 4: Milion tok** - odigraj sva pitanja tačno i proveri "+50 ❤️ bonus za milion" i da su se srca uvećala (ikonica u headeru / `user_progress` tabela).

- [ ] **Step 5: Popravi šta ne radi, commit popravki**

---

### Task 9: Pilot sadržaj - pitanja za A1.1 modul 1 (posle koda)

Ovo NIJE kod - radi se tek kad Nataša pregleda igru na test vežbi iz Task 8.

- [ ] **Step 1:** Izvuci gradivo prvog modula A1.1 (lekcije + postojeća kviz pitanja iz baze).
- [ ] **Step 2:** Sastavi predlog 20 pitanja (15 igra + 5 rezervi) rastuće težine: pitanja 1-5 prepoznavanje (pozdravi, brojevi, osnovne reči), 6-10 primena (konjugacija sein/heißen, red reči), 11-15 kombinovanje celog modula. Svako pitanje: 4 opcije, tačan odgovor kao INDEKS, opciono kratko objašnjenje. Format: markdown tabela u `docs/superpowers/specs/` za Natašin pregled.
- [ ] **Step 3:** Posle Natašinog odobrenja: ubaci pitanja skriptom (po uzoru na postojeće `scripts/import-*-tests.ts`) ili ručno kroz admin, kao poslednju vežbu poslednje lekcije modula 1.

---

## Deploy

Po pravilima repoa: ručno `vercel --prod` iz lokala (Nataša ili uz njeno odobrenje), pa OBAVEZNO smoke test posle deploya (hook postoji). Migracija (Task 1) mora biti primenjena PRE deploya koda.
