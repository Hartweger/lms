# Srca + maskota (meda) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Uvesti trajan sistem poena "srca" (❤️) sa plišanom medom maskotom koja emotivno reaguje na ponašanje učenika (Duolingo princip), sa ličnim nivoima na osnovu aktivnosti.

**Architecture:** Čista logika (nivoi/niz/dodela srca/stanje maskote) u `src/lib/hearts/` kao pure funkcije pokrivene vitest testovima. Trajnost u novoj Supabase tabeli `user_progress`, pisanje isključivo kroz API rutu `/api/hearts/award` (service-role, da se ne može varati). SVG maskota i UI kao React/Tailwind komponente. Dodela srca se kači na postojeća mesta gde se već beleži napredak (kraj vežbe, završetak lekcije, dnevni ulazak).

**Tech Stack:** Next.js (modifikovan — videti `AGENTS.md`), React, TypeScript, Tailwind CSS v4 (brend boja `plava` #0AB3D7), Supabase (`@supabase/ssr`), vitest (uvodi se ovim planom, prvi testovi u repou).

**Spec:** `docs/superpowers/specs/2026-06-06-srca-maskota-gamifikacija-design.md`

---

## File Structure

**Novi fajlovi:**
- `vitest.config.ts` — konfiguracija test runnera
- `src/lib/hearts/config.ts` — konstante (nagrade po akciji, pragovi nivoa, dnevni cilj)
- `src/lib/hearts/levels.ts` — `levelFromHearts`, `progressToNext`
- `src/lib/hearts/levels.test.ts`
- `src/lib/hearts/streak.ts` — `nextStreak`
- `src/lib/hearts/streak.test.ts`
- `src/lib/hearts/mascot.ts` — tip `MascotState` + `getMascotState`
- `src/lib/hearts/mascot.test.ts`
- `src/lib/hearts/award.ts` — `applyAward` (pure: staro stanje → novo stanje + flagovi)
- `src/lib/hearts/award.test.ts`
- `supabase/migrations/033_user_progress.sql` — tabela + RLS
- `src/app/api/hearts/award/route.ts` — API ruta koja perzistira dodelu
- `src/components/mascot/MascotBear.tsx` — SVG meda, 6 poza + animacije
- `src/components/mascot/MascotBear.css` — keyframes animacije (ili u globals)
- `src/app/dev/maskota/page.tsx` — privremena preview strana za odobravanje poza
- `src/components/hearts/HeartVessel.tsx` — srce-posuda koja se puni
- `src/components/hearts/HeartsInfoPopover.tsx` — objašnjenje "Šta su srca?"
- `src/components/hearts/HeartsWidget.tsx` — dashboard kartica
- `src/components/hearts/DailyCheckIn.tsx` — klijentski okidač dnevnog bonusa

> Odloženo za kasnije (ne v1): zaseban globalni `HeartsCounter` u headeru. Za v1 brojač srca pokriva dashboard widget, a prikaz unutar vežbe je preimenovan u "srca" (Task 15).

**Izmene postojećih:**
- `package.json` — dodati `vitest` i `test` skriptu
- `src/app/dashboard/page.tsx` — ubaciti `HeartsWidget` + `DailyCheckIn`
- `src/components/exercises/ExerciseRunner.tsx` — "XP" → "srca", poziv dodele na kraju
- `src/components/LessonProgressTracker.tsx` — dodela srca pri završetku lekcije

---

## FAZA 1 — Maskota (poze prve, za vizuelno odobravanje)

> Cilj faze: nacrtati svih 6 poza mede i preview stranu da ih korisnik odobri PRE backend-a. Verifikacija je vizuelna (build + browser), ne unit test.

### Task 1: SVG komponenta mede sa 6 poza

**Files:**
- Create: `src/components/mascot/MascotBear.tsx`

- [ ] **Step 1: Pročitaj relevantan Next.js vodič**

Pošto je ovo modifikovan Next.js (`AGENTS.md`), pre pisanja komponente proveri da li ima specifičnosti za client/server komponente:

Run: `ls node_modules/next/dist/docs/ 2>/dev/null && echo "---" && cat AGENTS.md`
Expected: vidiš dostupne vodiče; pročitaj onaj o komponentama ako postoji.

- [ ] **Step 2: Napiši komponentu sa svih 6 poza**

Komponenta je čisto prezentaciona (nema state), pa može biti server-safe (nema `"use client"`). Boje su iz brenda: telo `#D69A5A`/`#C98A4B`, trbuh/njuška `#F2D7AE`, mašna `#0AB3D7`. SVG je portovan iz brainstorm mockapa (`.superpowers/brainstorm/.../teddy.html` i `expressions.html`).

```tsx
// src/components/mascot/MascotBear.tsx
import "./MascotBear.css";

export type MascotState =
  | "happy"      // maše
  | "celebrate"  // ruke uvis, poskok
  | "proud"      // palac gore, namiguje
  | "thinking"   // ruka na bradi
  | "sleepy"     // klonuo, Zzz
  | "sad";       // briše suzu

type Props = {
  state?: MascotState;
  size?: "full" | "head";
  animated?: boolean;
  className?: string;
};

// Zajedničke partije (uши, glava, njuška, nos) — bez ruku/lica jer variraju
function BaseHead() {
  return (
    <>
      <circle cx="50" cy="30" r="17" fill="#C98A4B" />
      <circle cx="125" cy="30" r="17" fill="#C98A4B" />
      <circle cx="50" cy="32" r="9" fill="#E6C089" />
      <circle cx="125" cy="32" r="9" fill="#E6C089" />
      <circle cx="87" cy="62" r="46" fill="#D69A5A" />
      <ellipse cx="87" cy="74" rx="23" ry="18" fill="#F2D7AE" />
      <ellipse cx="87" cy="64" rx="8" ry="6" fill="#5a3a1c" />
    </>
  );
}

function BodyAndLegs() {
  return (
    <>
      <ellipse cx="58" cy="166" rx="20" ry="15" fill="#C98A4B" />
      <ellipse cx="117" cy="166" rx="20" ry="15" fill="#C98A4B" />
      <ellipse cx="58" cy="168" rx="10" ry="7" fill="#E6C089" />
      <ellipse cx="117" cy="168" rx="10" ry="7" fill="#E6C089" />
      <ellipse cx="87" cy="134" rx="46" ry="40" fill="#D69A5A" />
      <ellipse cx="87" cy="140" rx="28" ry="27" fill="#F2D7AE" opacity="0.65" />
    </>
  );
}

function BowTie() {
  return (
    <>
      <path d="M70 108 L87 116 L104 108 L100 125 L87 118 L74 125 Z" fill="#0AB3D7" />
      <circle cx="87" cy="116" r="5" fill="#0894B5" />
    </>
  );
}

// Lica po stanju
const FACES: Record<MascotState, React.ReactNode> = {
  happy: (
    <>
      <circle cx="68" cy="56" r="7.5" fill="#3a2613" />
      <circle cx="106" cy="56" r="7.5" fill="#3a2613" />
      <circle cx="70.5" cy="53.5" r="2.6" fill="#fff" />
      <circle cx="108.5" cy="53.5" r="2.6" fill="#fff" />
      <ellipse cx="57" cy="72" rx="8" ry="5" fill="#F78687" opacity="0.4" />
      <ellipse cx="117" cy="72" rx="8" ry="5" fill="#F78687" opacity="0.4" />
      <path d="M87 70 V80 M87 80 Q80 86 73 82 M87 80 Q94 86 101 82" stroke="#7a5226" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  celebrate: (
    <>
      <path d="M61 57 Q68 49 75 57" stroke="#3a2613" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M99 57 Q106 49 113 57" stroke="#3a2613" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="56" cy="73" rx="9" ry="6" fill="#F78687" opacity="0.45" />
      <ellipse cx="118" cy="73" rx="9" ry="6" fill="#F78687" opacity="0.45" />
      <path d="M74 78 Q87 96 100 78 Q87 88 74 78 Z" fill="#7a5226" />
    </>
  ),
  proud: (
    <>
      <path d="M61 56 Q68 51 75 56" stroke="#3a2613" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="106" cy="56" r="7.5" fill="#3a2613" />
      <circle cx="108.5" cy="53.5" r="2.6" fill="#fff" />
      <ellipse cx="57" cy="72" rx="8" ry="5" fill="#F78687" opacity="0.4" />
      <ellipse cx="117" cy="72" rx="8" ry="5" fill="#F78687" opacity="0.4" />
      <path d="M87 70 V80 M87 80 Q80 86 73 82 M87 80 Q94 86 101 82" stroke="#7a5226" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  thinking: (
    <>
      <circle cx="68" cy="56" r="7" fill="#3a2613" />
      <circle cx="106" cy="56" r="7" fill="#3a2613" />
      <circle cx="70" cy="53.5" r="2.3" fill="#fff" />
      <circle cx="108" cy="53.5" r="2.3" fill="#fff" />
      <path d="M75 80 L99 80" stroke="#7a5226" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  sleepy: (
    <>
      <path d="M61 57 Q68 62 75 57" stroke="#3a2613" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M99 57 Q106 62 113 57" stroke="#3a2613" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="87" cy="82" rx="5" ry="6" fill="none" stroke="#7a5226" strokeWidth="2" />
      <text x="118" y="34" fontSize="18" fill="#9BB8CC" fontWeight="bold">z</text>
      <text x="130" y="22" fontSize="13" fill="#B9D0DE" fontWeight="bold">z</text>
    </>
  ),
  sad: (
    <>
      <path d="M60 50 Q68 46 76 51" stroke="#7a5226" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M98 51 Q106 46 114 50" stroke="#7a5226" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <ellipse cx="68" cy="60" rx="6" ry="7" fill="#3a2613" />
      <ellipse cx="106" cy="60" rx="6" ry="7" fill="#3a2613" />
      <circle cx="69.5" cy="58" r="2" fill="#fff" />
      <circle cx="107.5" cy="58" r="2" fill="#fff" />
      <path d="M62 66 Q65 74 68 80" stroke="#7EC8E3" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="68" cy="81" rx="2.3" ry="3.2" fill="#7EC8E3" />
      <path d="M73 88 Q87 80 101 88" stroke="#7a5226" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
};

// Ruke po stanju (poze)
const ARMS: Record<MascotState, React.ReactNode> = {
  happy: (
    <>
      <ellipse cx="34" cy="120" rx="16" ry="26" fill="#C98A4B" transform="rotate(20 34 120)" />
      <ellipse cx="150" cy="74" rx="14" ry="24" fill="#C98A4B" transform="rotate(-40 150 74)" />
    </>
  ),
  celebrate: (
    <>
      <ellipse cx="30" cy="74" rx="14" ry="24" fill="#C98A4B" transform="rotate(40 30 74)" />
      <ellipse cx="150" cy="74" rx="14" ry="24" fill="#C98A4B" transform="rotate(-40 150 74)" />
    </>
  ),
  proud: (
    <>
      <ellipse cx="34" cy="120" rx="16" ry="26" fill="#C98A4B" transform="rotate(20 34 120)" />
      <ellipse cx="138" cy="116" rx="14" ry="22" fill="#C98A4B" transform="rotate(-35 138 116)" />
      <circle cx="150" cy="98" r="7" fill="#E6C089" />
    </>
  ),
  thinking: (
    <>
      <ellipse cx="34" cy="120" rx="16" ry="26" fill="#C98A4B" transform="rotate(20 34 120)" />
      <ellipse cx="120" cy="104" rx="13" ry="20" fill="#C98A4B" transform="rotate(-55 120 104)" />
      <circle cx="104" cy="88" r="7" fill="#E6C089" />
    </>
  ),
  sleepy: (
    <>
      <ellipse cx="40" cy="128" rx="15" ry="24" fill="#C98A4B" transform="rotate(8 40 128)" />
      <ellipse cx="135" cy="128" rx="15" ry="24" fill="#C98A4B" transform="rotate(-8 135 128)" />
    </>
  ),
  sad: (
    <>
      <ellipse cx="38" cy="128" rx="15" ry="24" fill="#C98A4B" transform="rotate(6 38 128)" />
      <ellipse cx="118" cy="96" rx="13" ry="20" fill="#C98A4B" transform="rotate(-50 118 96)" />
      <circle cx="100" cy="80" r="7" fill="#E6C089" />
    </>
  ),
};

export function MascotBear({ state = "happy", size = "full", animated = true, className }: Props) {
  const viewBox = size === "head" ? "28 6 118 116" : "0 0 175 190";
  const animClass = animated ? `mascot mascot--${state}` : "";
  return (
    <svg
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Meda maskota"
      className={[animClass, className].filter(Boolean).join(" ")}
    >
      {size === "full" && <g className="mascot__arms">{ARMS[state]}</g>}
      {size === "full" && <BodyAndLegs />}
      <BaseHead />
      {FACES[state]}
      {size === "full" && state !== "sleepy" && state !== "sad" && <BowTie />}
    </svg>
  );
}
```

- [ ] **Step 3: Napiši CSS animacije (poštuju prefers-reduced-motion)**

```css
/* src/components/mascot/MascotBear.css */
.mascot { transform-origin: center bottom; }

@keyframes mascot-sway { 0%,100% { transform: rotate(-1.5deg); } 50% { transform: rotate(1.5deg); } }
@keyframes mascot-bounce { 0%,100% { transform: translateY(0); } 30% { transform: translateY(-10px); } 50% { transform: translateY(0); } }
@keyframes mascot-nod { 0%,100% { transform: rotate(0); } 50% { transform: rotate(4deg); } }

.mascot--happy   { animation: mascot-sway 4s ease-in-out infinite; }
.mascot--proud   { animation: mascot-sway 4s ease-in-out infinite; }
.mascot--thinking{ animation: mascot-sway 5s ease-in-out infinite; }
.mascot--celebrate { animation: mascot-bounce 1.2s ease-in-out infinite; }
.mascot--sleepy  { animation: mascot-nod 3s ease-in-out infinite; }
.mascot--sad     { animation: none; }

@media (prefers-reduced-motion: reduce) {
  .mascot { animation: none !important; }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/mascot/MascotBear.tsx src/components/mascot/MascotBear.css
git commit -m "feat(maskota): MascotBear SVG sa 6 poza + animacije"
```

### Task 2: Preview strana za odobravanje poza

**Files:**
- Create: `src/app/dev/maskota/page.tsx`

- [ ] **Step 1: Napravi stranu koja prikazuje svih 6 poza (full i head)**

```tsx
// src/app/dev/maskota/page.tsx
import { MascotBear, type MascotState } from "@/components/mascot/MascotBear";

const STATES: { state: MascotState; label: string }[] = [
  { state: "happy", label: "Srećan (maše)" },
  { state: "celebrate", label: "Oduševljen (ruke uvis)" },
  { state: "proud", label: "Ponosan (palac gore)" },
  { state: "thinking", label: "Zamišljen (ruka na bradi)" },
  { state: "sleepy", label: "Pospan (Zzz)" },
  { state: "sad", label: "Tužan (briše suzu)" },
];

export default function MaskotaPreview() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Maskota — pregled poza</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {STATES.map(({ state, label }) => (
          <div key={state} className="bg-white border-2 border-plava rounded-xl p-4 text-center">
            <MascotBear state={state} size="full" className="w-32 h-36 mx-auto" />
            <MascotBear state={state} size="head" className="w-12 h-12 mx-auto mt-2 opacity-80" />
            <p className="mt-2 font-semibold text-sm">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Pokreni dev server i otvori stranu**

Run: `npm run dev` pa otvori `http://localhost:3000/dev/maskota`
Expected: vidiš svih 6 poza (veliko + glava), animacije rade.

- [ ] **Step 3: Commit**

```bash
git add src/app/dev/maskota/page.tsx
git commit -m "feat(maskota): preview strana /dev/maskota za pregled poza"
```

> **CHECKPOINT — odobravanje korisnika.** Ovde se zaustavlja izvršavanje: korisnik pregleda `/dev/maskota` i odobri ili traži ispravke poza. Tek po odobrenju ide Faza 2. (Preview strana `/dev/maskota` se uklanja u poslednjoj fazi.)

---

## FAZA 2 — Čista logika srca (TDD)

### Task 3: Test setup (vitest) + konstante

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/hearts/config.ts`
- Modify: `package.json` (scripts + devDependency)

- [ ] **Step 1: Instaliraj vitest**

Run: `npm install -D vitest`
Expected: vitest dodat u devDependencies.

- [ ] **Step 2: Napravi vitest config**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

- [ ] **Step 3: Dodaj test skriptu u package.json**

U `"scripts"` dodati: `"test": "vitest run"` i `"test:watch": "vitest"`.

- [ ] **Step 4: Napravi konstante**

```ts
// src/lib/hearts/config.ts
export const HEART_REWARDS = {
  correct_answer: 10,
  streak_bonus: 5,        // dodatno za niz tačnih ≥3 unutar vežbe
  lesson_complete: 20,
  test_pass: 50,
  test_pass_high: 25,     // dodatno za rezultat ≥90%
  daily_login: 10,
  daily_goal: 20,
} as const;

export const DAILY_GOAL_HEARTS = 50;

// Kumulativni pragovi: indeks = nivo-1. Posle tabele: +350 po nivou.
export const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000];
export const LEVEL_STEP_AFTER = 350;
```

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json src/lib/hearts/config.ts
git commit -m "chore: vitest setup + hearts konstante"
```

### Task 4: Nivoi (levels.ts)

**Files:**
- Create: `src/lib/hearts/levels.test.ts`
- Create: `src/lib/hearts/levels.ts`

- [ ] **Step 1: Napiši test koji pada**

```ts
// src/lib/hearts/levels.test.ts
import { describe, it, expect } from "vitest";
import { levelFromHearts, progressToNext } from "./levels";

describe("levelFromHearts", () => {
  it("nivo 1 za 0 srca", () => expect(levelFromHearts(0)).toBe(1));
  it("nivo 1 do praga", () => expect(levelFromHearts(99)).toBe(1));
  it("nivo 2 na 100", () => expect(levelFromHearts(100)).toBe(2));
  it("nivo 5 na 700", () => expect(levelFromHearts(700)).toBe(5)); // 700 je prag za nivo 5
  it("nivo 6 na 1000", () => expect(levelFromHearts(1000)).toBe(6));
  it("posle tabele +350 po nivou", () => expect(levelFromHearts(1350)).toBe(7));
});

describe("progressToNext", () => {
  it("na 150 srca: nivo 2, treba još 100 do nivoa 3", () => {
    expect(progressToNext(150)).toEqual({ level: 2, into: 50, span: 150, toNext: 100, percent: 33, nextLevel: 3 });
  });
});
```

- [ ] **Step 2: Pokreni test, mora da padne**

Run: `npm test -- levels`
Expected: FAIL (modul/funkcije ne postoje).

- [ ] **Step 3: Implementiraj levels.ts**

```ts
// src/lib/hearts/levels.ts
import { LEVEL_THRESHOLDS, LEVEL_STEP_AFTER } from "./config";

/** Kumulativni prag (ukupno srca) za dati nivo (1-baziran). */
export function thresholdForLevel(level: number): number {
  if (level <= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[level - 1];
  const last = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  return last + (level - LEVEL_THRESHOLDS.length) * LEVEL_STEP_AFTER;
}

export function levelFromHearts(total: number): number {
  let level = 1;
  while (total >= thresholdForLevel(level + 1)) level++;
  return level;
}

export function progressToNext(total: number) {
  const level = levelFromHearts(total);
  const base = thresholdForLevel(level);
  const next = thresholdForLevel(level + 1);
  const span = next - base;
  const into = total - base;
  const toNext = next - total;
  const percent = Math.round((into / span) * 100);
  return { level, into, span, toNext, percent, nextLevel: level + 1 };
}
```

- [ ] **Step 4: Pokreni test, mora da prođe**

Run: `npm test -- levels`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/hearts/levels.ts src/lib/hearts/levels.test.ts
git commit -m "feat(hearts): logika nivoa + testovi"
```

### Task 5: Niz dana (streak.ts)

**Files:**
- Create: `src/lib/hearts/streak.test.ts`
- Create: `src/lib/hearts/streak.ts`

- [ ] **Step 1: Napiši test koji pada**

```ts
// src/lib/hearts/streak.test.ts
import { describe, it, expect } from "vitest";
import { nextStreak } from "./streak";

describe("nextStreak", () => {
  it("prvi put (nema poslednjeg dana) → niz 1, nov dan", () => {
    expect(nextStreak(null, "2026-06-06", 0)).toEqual({ streak: 1, isNewDay: true });
  });
  it("isti dan → niz nepromenjen, nije nov dan", () => {
    expect(nextStreak("2026-06-06", "2026-06-06", 3)).toEqual({ streak: 3, isNewDay: false });
  });
  it("juče → niz +1, nov dan", () => {
    expect(nextStreak("2026-06-05", "2026-06-06", 3)).toEqual({ streak: 4, isNewDay: true });
  });
  it("prekid (2+ dana) → niz se resetuje na 1, nov dan", () => {
    expect(nextStreak("2026-06-01", "2026-06-06", 9)).toEqual({ streak: 1, isNewDay: true });
  });
});
```

- [ ] **Step 2: Pokreni test, mora da padne**

Run: `npm test -- streak`
Expected: FAIL.

- [ ] **Step 3: Implementiraj streak.ts**

```ts
// src/lib/hearts/streak.ts
/** Datumi su ISO "YYYY-MM-DD" (lokalni dan). */
function daysBetween(a: string, b: string): number {
  const da = Date.parse(a + "T00:00:00Z");
  const db = Date.parse(b + "T00:00:00Z");
  return Math.round((db - da) / 86400000);
}

export function nextStreak(
  lastActiveDate: string | null,
  today: string,
  currentStreak: number
): { streak: number; isNewDay: boolean } {
  if (!lastActiveDate) return { streak: 1, isNewDay: true };
  const diff = daysBetween(lastActiveDate, today);
  if (diff <= 0) return { streak: currentStreak, isNewDay: false };
  if (diff === 1) return { streak: currentStreak + 1, isNewDay: true };
  return { streak: 1, isNewDay: true };
}
```

- [ ] **Step 4: Pokreni test, mora da prođe**

Run: `npm test -- streak`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/hearts/streak.ts src/lib/hearts/streak.test.ts
git commit -m "feat(hearts): logika niza dana + testovi"
```

### Task 6: Stanje maskote (mascot.ts)

**Files:**
- Create: `src/lib/hearts/mascot.test.ts`
- Create: `src/lib/hearts/mascot.ts`

- [ ] **Step 1: Napiši test koji pada**

```ts
// src/lib/hearts/mascot.test.ts
import { describe, it, expect } from "vitest";
import { getMascotState } from "./mascot";

const base = { lastActiveDate: "2026-06-06", currentStreak: 1, dailyGoalMet: false };

describe("getMascotState", () => {
  it("prelazak nivoa → celebrate (najjači prioritet)", () => {
    expect(getMascotState(base, "2026-06-06", { justLeveledUp: true })).toBe("celebrate");
  });
  it("odličan test → celebrate", () => {
    expect(getMascotState(base, "2026-06-06", { justAcedTest: true })).toBe("celebrate");
  });
  it("7+ dana odsutan → sad", () => {
    expect(getMascotState({ ...base, lastActiveDate: "2026-05-28" }, "2026-06-06")).toBe("sad");
  });
  it("3–6 dana odsutan → sleepy", () => {
    expect(getMascotState({ ...base, lastActiveDate: "2026-06-02" }, "2026-06-06")).toBe("sleepy");
  });
  it("niz ≥3 → proud", () => {
    expect(getMascotState({ ...base, currentStreak: 3 }, "2026-06-06")).toBe("proud");
  });
  it("dnevni cilj ispunjen → proud", () => {
    expect(getMascotState({ ...base, dailyGoalMet: true }, "2026-06-06")).toBe("proud");
  });
  it("podrazumevano → happy", () => {
    expect(getMascotState(base, "2026-06-06")).toBe("happy");
  });
});
```

- [ ] **Step 2: Pokreni test, mora da padne**

Run: `npm test -- mascot`
Expected: FAIL.

- [ ] **Step 3: Implementiraj mascot.ts**

```ts
// src/lib/hearts/mascot.ts
import type { MascotState } from "@/components/mascot/MascotBear";

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}

type Stats = { lastActiveDate: string | null; currentStreak: number; dailyGoalMet: boolean };
type Context = { justLeveledUp?: boolean; justAcedTest?: boolean };

export function getMascotState(stats: Stats, today: string, ctx: Context = {}): MascotState {
  if (ctx.justLeveledUp || ctx.justAcedTest) return "celebrate";
  if (stats.lastActiveDate) {
    const away = daysBetween(stats.lastActiveDate, today);
    if (away >= 7) return "sad";
    if (away >= 3) return "sleepy";
  }
  if (stats.currentStreak >= 3 || stats.dailyGoalMet) return "proud";
  return "happy";
}
```

- [ ] **Step 4: Pokreni test, mora da prođe**

Run: `npm test -- mascot`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/hearts/mascot.ts src/lib/hearts/mascot.test.ts
git commit -m "feat(hearts): izvođenje stanja maskote + testovi"
```

### Task 7: Dodela srca (award.ts) — pure

**Files:**
- Create: `src/lib/hearts/award.test.ts`
- Create: `src/lib/hearts/award.ts`

- [ ] **Step 1: Napiši test koji pada**

```ts
// src/lib/hearts/award.test.ts
import { describe, it, expect } from "vitest";
import { applyAward, type Progress } from "./award";

const fresh: Progress = {
  total_hearts: 0, level: 1, current_streak: 0, longest_streak: 0,
  last_active_date: null, hearts_today: 0,
};

describe("applyAward", () => {
  it("dodaje srca za završenu lekciju i postavlja niz na 1", () => {
    const r = applyAward(fresh, { reason: "lesson_complete" }, "2026-06-06");
    expect(r.next.total_hearts).toBe(20);
    expect(r.next.current_streak).toBe(1);
    expect(r.next.hearts_today).toBe(20);
    expect(r.next.last_active_date).toBe("2026-06-06");
  });

  it("daily_login se dodeljuje samo jednom dnevno", () => {
    const first = applyAward(fresh, { reason: "daily_login" }, "2026-06-06");
    expect(first.next.total_hearts).toBe(10);
    const second = applyAward(first.next, { reason: "daily_login" }, "2026-06-06");
    expect(second.next.total_hearts).toBe(10); // bez promene
    expect(second.awarded).toBe(0);
  });

  it("test ≥90% nosi test_pass + bonus (dnevni cilj već ispunjen, bez dodatnog bonusa)", () => {
    const met: Progress = { ...fresh, hearts_today: 60, last_active_date: "2026-06-06", current_streak: 1 };
    const r = applyAward(met, { reason: "test_pass", percent: 95 }, "2026-06-06");
    expect(r.awarded).toBe(75); // 50 + 25 (dnevni cilj je već pređen → nema +20)
  });

  it("vežba: srca = 10*tačni (+5 ako je bilo niza)", () => {
    const r = applyAward(fresh, { reason: "exercise", correct: 4, hadStreak: true }, "2026-06-06");
    expect(r.awarded).toBe(45); // 40 + 5
  });

  it("prelazak nivoa diže flag leveledUp", () => {
    const near: Progress = { ...fresh, total_hearts: 90, level: 1 };
    const r = applyAward(near, { reason: "lesson_complete" }, "2026-06-06");
    expect(r.next.total_hearts).toBe(110);
    expect(r.next.level).toBe(2);
    expect(r.leveledUp).toBe(true);
  });

  it("dnevni cilj (≥50 danas) diže flag dailyGoalMet i dodeljuje bonus jednom", () => {
    const r = applyAward(fresh, { reason: "test_pass", percent: 80 }, "2026-06-06"); // 50 danas
    expect(r.dailyGoalMet).toBe(true);
    expect(r.awarded).toBe(50 + 20); // test_pass + daily_goal bonus
  });
});
```

- [ ] **Step 2: Pokreni test, mora da padne**

Run: `npm test -- award`
Expected: FAIL.

- [ ] **Step 3: Implementiraj award.ts**

```ts
// src/lib/hearts/award.ts
import { HEART_REWARDS, DAILY_GOAL_HEARTS } from "./config";
import { levelFromHearts } from "./levels";
import { nextStreak } from "./streak";

export type Progress = {
  total_hearts: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  hearts_today: number;
};

export type AwardInput =
  | { reason: "lesson_complete" }
  | { reason: "daily_login" }
  | { reason: "test_pass"; percent: number }
  | { reason: "exercise"; correct: number; hadStreak: boolean };

export type AwardResult = {
  next: Progress;
  awarded: number;
  leveledUp: boolean;
  dailyGoalMet: boolean;
};

function baseAmount(input: AwardInput): number {
  switch (input.reason) {
    case "lesson_complete": return HEART_REWARDS.lesson_complete;
    case "daily_login": return HEART_REWARDS.daily_login;
    case "test_pass":
      return HEART_REWARDS.test_pass + (input.percent >= 90 ? HEART_REWARDS.test_pass_high : 0);
    case "exercise":
      return input.correct * HEART_REWARDS.correct_answer + (input.hadStreak ? HEART_REWARDS.streak_bonus : 0);
  }
}

export function applyAward(prev: Progress, input: AwardInput, today: string): AwardResult {
  // resetuj "danas" ako je nov dan
  const isNewDay = prev.last_active_date !== today;
  let heartsToday = isNewDay ? 0 : prev.hearts_today;

  // daily_login samo jednom dnevno
  if (input.reason === "daily_login" && !isNewDay) {
    return { next: prev, awarded: 0, leveledUp: false, dailyGoalMet: false };
  }

  let awarded = baseAmount(input);

  // dnevni cilj bonus (jednom, kad pređe prag danas)
  const goalBeforeNow = heartsToday >= DAILY_GOAL_HEARTS;
  const goalAfter = heartsToday + awarded >= DAILY_GOAL_HEARTS;
  const crossedGoal = !goalBeforeNow && goalAfter;
  if (crossedGoal) awarded += HEART_REWARDS.daily_goal;

  const total = prev.total_hearts + awarded;
  heartsToday += awarded;

  const { streak } = nextStreak(prev.last_active_date, today, prev.current_streak);
  const level = levelFromHearts(total);

  const next: Progress = {
    total_hearts: total,
    level,
    current_streak: streak,
    longest_streak: Math.max(prev.longest_streak, streak),
    last_active_date: today,
    hearts_today: heartsToday,
  };

  return {
    next,
    awarded,
    leveledUp: level > prev.level,
    dailyGoalMet: heartsToday >= DAILY_GOAL_HEARTS,
  };
}
```

- [ ] **Step 4: Pokreni sve testove, moraju da prođu**

Run: `npm test`
Expected: PASS (levels, streak, mascot, award).

- [ ] **Step 5: Commit**

```bash
git add src/lib/hearts/award.ts src/lib/hearts/award.test.ts
git commit -m "feat(hearts): pure dodela srca (nivo/niz/dnevni cilj) + testovi"
```

---

## FAZA 3 — Baza i API

### Task 8: Migracija `033_user_progress.sql`

**Files:**
- Create: `supabase/migrations/033_user_progress.sql`

- [ ] **Step 1: Napiši migraciju**

```sql
-- supabase/migrations/033_user_progress.sql
-- Trajni napredak korisnika: srca, nivo, niz dana.
create table if not exists public.user_progress (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  total_hearts     integer not null default 0,
  level            integer not null default 1,
  current_streak   integer not null default 0,
  longest_streak   integer not null default 0,
  last_active_date date,
  hearts_today     integer not null default 0,
  updated_at       timestamptz not null default now()
);

alter table public.user_progress enable row level security;

-- Korisnik može da ČITA samo svoj red.
drop policy if exists "user_progress_select_own" on public.user_progress;
create policy "user_progress_select_own"
  on public.user_progress for select
  using (auth.uid() = user_id);

-- Bez insert/update polisa za authenticated → pisanje ide samo preko service-role
-- (API ruta /api/hearts/award), što sprečava varanje sa klijenta.
```

- [ ] **Step 2: Primeni migraciju na Supabase**

Prema `reference_supabase_ddl` (memorija): primeniti kroz Supabase SQL Editor ILI Management API (`sbp_` token). NE preko service-role (to je samo za podatke).
Expected: tabela `user_progress` postoji, RLS uključen, select polisa kreirana.

- [ ] **Step 3: Verifikuj**

Run (SQL Editor): `select * from public.user_progress limit 1;`
Expected: prazan rezultat bez greške (tabela postoji).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/033_user_progress.sql
git commit -m "feat(db): migracija user_progress (srca/nivo/niz) + RLS"
```

### Task 9: API ruta `/api/hearts/award`

**Files:**
- Create: `src/app/api/hearts/award/route.ts`

- [ ] **Step 1: Pročitaj postojeću rutu kao šablon**

Run: `cat src/app/api/check-essay/route.ts`
Expected: vidiš stil (NextResponse, parsiranje body-ja).

- [ ] **Step 2: Implementiraj rutu**

Ruta čita trenutni `user_progress` (admin klijent), poziva pure `applyAward`, upisuje rezultat i vraća novo stanje + flagove. Iznose računa server (klijent šalje samo `reason` + verifikovane meta podatke koji se već beleže, npr. broj tačnih iz iste vežbe).

```ts
// src/app/api/hearts/award/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyAward, type Progress, type AwardInput } from "@/lib/hearts/award";

function todayISO(): string {
  // Lokalni dan u Beogradu; jednostavno UTC+2 nije pouzdano preko DST,
  // pa koristimo Intl da dobijemo YYYY-MM-DD u Europe/Belgrade.
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(new Date());
}

const DEFAULT_PROGRESS: Progress = {
  total_hearts: 0, level: 1, current_streak: 0, longest_streak: 0,
  last_active_date: null, hearts_today: 0,
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as AwardInput;
  // bela lista dozvoljenih razloga
  const allowed = ["lesson_complete", "daily_login", "test_pass", "exercise"];
  if (!body || !allowed.includes((body as { reason?: string }).reason ?? "")) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("user_progress").select("*").eq("user_id", user.id).single();

  const prev: Progress = row
    ? {
        total_hearts: row.total_hearts, level: row.level,
        current_streak: row.current_streak, longest_streak: row.longest_streak,
        last_active_date: row.last_active_date, hearts_today: row.hearts_today,
      }
    : DEFAULT_PROGRESS;

  const result = applyAward(prev, body, todayISO());

  const { error } = await admin.from("user_progress").upsert({
    user_id: user.id,
    ...result.next,
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    awarded: result.awarded,
    leveledUp: result.leveledUp,
    dailyGoalMet: result.dailyGoalMet,
    progress: result.next,
  });
}
```

- [ ] **Step 3: Ručni dim-test rute**

Pokreni `npm run dev`, uloguj se, pa u konzoli pregledača:
```js
await fetch("/api/hearts/award", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({reason:"daily_login"}) }).then(r=>r.json())
```
Expected: `{ awarded: 10, ... , progress: { total_hearts: 10, ... } }`; drugi poziv istog dana → `awarded: 0`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/hearts/award/route.ts
git commit -m "feat(api): /api/hearts/award — server-side dodela srca"
```

---

## FAZA 4 — UI komponente

### Task 10: HeartVessel (srce koje se puni)

**Files:**
- Create: `src/components/hearts/HeartVessel.tsx`

- [ ] **Step 1: Implementiraj**

```tsx
// src/components/hearts/HeartVessel.tsx
type Props = { fillPercent: number; className?: string };

export function HeartVessel({ fillPercent, className }: Props) {
  const clamped = Math.max(0, Math.min(100, fillPercent));
  const fillTop = 90 - (clamped / 100) * 74; // srce ~ y16..y90
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={`Napredak ${clamped}%`} className={className}>
      <defs>
        <clipPath id="heartClip">
          <path d="M50 86 C22 64,10 46,24 30 C35 18,50 24,50 36 C50 24,65 18,76 30 C90 46,78 64,50 86 Z" />
        </clipPath>
      </defs>
      <path d="M50 86 C22 64,10 46,24 30 C35 18,50 24,50 36 C50 24,65 18,76 30 C90 46,78 64,50 86 Z"
            fill="#f7dde2" stroke="#F2546E" strokeWidth="2.5" />
      <g clipPath="url(#heartClip)">
        <rect x="6" y={fillTop} width="88" height="90" fill="#F2546E" />
        <rect x="6" y={fillTop - 2} width="88" height="5" fill="#FF8FA3" />
      </g>
    </svg>
  );
}
```

- [ ] **Step 2: Verifikuj na preview strani**

Privremeno dodaj `<HeartVessel fillPercent={62} className="w-16 h-16" />` na `/dev/maskota` i potvrdi da se puni ~62%. Vrati izmenu posle provere.

- [ ] **Step 3: Commit**

```bash
git add src/components/hearts/HeartVessel.tsx
git commit -m "feat(hearts): HeartVessel — srce koje se puni"
```

### Task 11: HeartsInfoPopover (objašnjenje)

**Files:**
- Create: `src/components/hearts/HeartsInfoPopover.tsx`

- [ ] **Step 1: Implementiraj (client komponenta, toggle na klik)**

```tsx
// src/components/hearts/HeartsInfoPopover.tsx
"use client";
import { useState } from "react";

export function HeartsInfoPopover() {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-label="Šta su srca?"
        onClick={() => setOpen((v) => !v)}
        className="w-5 h-5 rounded-full bg-plava-light text-plava-dark font-bold text-xs inline-flex items-center justify-center"
      >?</button>
      {open && (
        <div className="absolute z-20 mt-2 right-0 w-72 bg-white border border-gray-200 rounded-2xl p-4 shadow-lg text-sm text-gray-700 text-left">
          <h4 className="font-bold mb-2">❤️ Šta su srca?</h4>
          <p className="leading-relaxed">
            Srca su poeni koje skupljaš dok učiš nemački. Svaki tačan odgovor, lekcija i test pune tvoje srce.
            Što redovnije vežbaš — više srca i viši nivo.{" "}
            <em>I ne brini — srca se samo skupljaju, nikad ih ne gubiš!</em> Tvoj meda se raduje svakom srcu 🐻
          </p>
          <ul className="mt-3 space-y-1 list-disc pl-5">
            <li>Tačan odgovor: <b>+10 ❤️</b> (+5 za niz)</li>
            <li>Završena lekcija: <b>+20 ❤️</b></li>
            <li>Položen test: <b>+50 ❤️</b> (+25 za ≥90%)</li>
            <li>Dolazak svaki dan: <b>+10 ❤️</b></li>
          </ul>
        </div>
      )}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/hearts/HeartsInfoPopover.tsx
git commit -m "feat(hearts): HeartsInfoPopover — objašnjenje za korisnike"
```

### Task 12: HeartsWidget (dashboard kartica)

**Files:**
- Create: `src/components/hearts/HeartsWidget.tsx`

- [ ] **Step 1: Implementiraj (prima već izračunate podatke kao props)**

```tsx
// src/components/hearts/HeartsWidget.tsx
import { MascotBear, type MascotState } from "@/components/mascot/MascotBear";
import { HeartVessel } from "./HeartVessel";
import { HeartsInfoPopover } from "./HeartsInfoPopover";

type Props = {
  totalHearts: number;
  level: number;
  toNext: number;
  percent: number;
  nextLevel: number;
  streak: number;
  mascotState: MascotState;
  awayMessage?: string | null;
};

export function HeartsWidget({ totalHearts, level, toNext, percent, nextLevel, streak, mascotState, awayMessage }: Props) {
  return (
    <div className="bg-white rounded-xl p-5 border-2 border-plava shadow-sm flex items-center gap-4">
      <MascotBear state={mascotState} size="full" className="w-20 h-24 shrink-0" />
      <HeartVessel fillPercent={percent} className="w-14 h-14 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">Nivo {level}</span>
          <HeartsInfoPopover />
        </div>
        <div className="text-sm font-semibold text-gray-700 mt-1">
          {totalHearts.toLocaleString("sr-RS")} ❤️
        </div>
        <div className="h-3 bg-plava-light rounded-full overflow-hidden mt-2">
          <div className="h-full bg-koral rounded-full" style={{ width: `${percent}%` }} />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {awayMessage ?? `još ${toNext} ❤️ do Nivoa ${nextLevel}`}
        </div>
        {streak > 0 && (
          <span className="inline-block mt-2 bg-orange-50 text-orange-600 font-bold text-xs px-3 py-1 rounded-full">
            🔥 {streak} {streak === 1 ? "dan" : "dana"} zaredom
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/hearts/HeartsWidget.tsx
git commit -m "feat(hearts): HeartsWidget — dashboard kartica"
```

### Task 13: DailyCheckIn (dnevni okidač)

**Files:**
- Create: `src/components/hearts/DailyCheckIn.tsx`

- [ ] **Step 1: Implementiraj (client; jednom po učitavanju javi daily_login)**

```tsx
// src/components/hearts/DailyCheckIn.tsx
"use client";
import { useEffect, useRef } from "react";

export function DailyCheckIn() {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fetch("/api/hearts/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "daily_login" }),
    }).catch(() => {});
  }, []);
  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/hearts/DailyCheckIn.tsx
git commit -m "feat(hearts): DailyCheckIn — dnevni bonus pri ulasku"
```

---

## FAZA 5 — Integracija

### Task 14: Ubaci widget na dashboard

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Pročitaj dashboard da nađeš tačno mesto i kako se dobija `user`**

Run: `sed -n '80,180p' src/app/dashboard/page.tsx`
Expected: vidiš `createClient`, `auth.getUser()`, `user_profiles` upit i JSX raspored (greeting → primarni kurs).

- [ ] **Step 2: Učitaj progress i izračunaj prikaz; ubaci widget posle pozdrava**

Dodati uvoze na vrh:
```tsx
import { HeartsWidget } from "@/components/hearts/HeartsWidget";
import { DailyCheckIn } from "@/components/hearts/DailyCheckIn";
import { progressToNext } from "@/lib/hearts/levels";
import { getMascotState } from "@/lib/hearts/mascot";
import { DAILY_GOAL_HEARTS } from "@/lib/hearts/config";
```

Posle dobijanja `user` (i pre returna JSX), dodati učitavanje i računicu:
```tsx
const { data: progressRow } = await supabase
  .from("user_progress")
  .select("total_hearts, level, current_streak, last_active_date, hearts_today")
  .eq("user_id", user.id)
  .single();

const total = progressRow?.total_hearts ?? 0;
const prog = progressToNext(total);
const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(new Date());
const mascotState = getMascotState(
  {
    lastActiveDate: progressRow?.last_active_date ?? null,
    currentStreak: progressRow?.current_streak ?? 0,
    dailyGoalMet: (progressRow?.hearts_today ?? 0) >= DAILY_GOAL_HEARTS,
  },
  today
);
const awayMessage =
  mascotState === "sad" ? "Nedostajao si mi! Tvoje srce te čeka 🐻"
  : mascotState === "sleepy" ? "Hajde da skupimo srca danas 💛"
  : null;
```

Ubaciti u JSX (odmah posle pozdravnog bloka, pre primarnog kursa):
```tsx
<DailyCheckIn />
<div className="mb-6">
  <HeartsWidget
    totalHearts={total}
    level={prog.level}
    toNext={prog.toNext}
    percent={prog.percent}
    nextLevel={prog.nextLevel}
    streak={progressRow?.current_streak ?? 0}
    mascotState={mascotState}
    awayMessage={awayMessage}
  />
</div>
```

- [ ] **Step 3: Verifikuj u browseru (desktop + mobilni viewport)**

Run: `npm run dev` → `/dashboard`. Proveri da se widget prikazuje, brojač/nivo/niz tačni, "?" otvara objašnjenje. U dev alatima uključi mobilni viewport (npr. iPhone) i potvrdi da se lepo lomi.
Expected: widget radi i responsive je.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(dashboard): HeartsWidget + dnevni check-in"
```

### Task 15: ExerciseRunner — "XP" → "srca" + dodela na kraju

**Files:**
- Modify: `src/components/exercises/ExerciseRunner.tsx`

- [ ] **Step 1: Pročitaj relevantne delove**

Run: `grep -n "xp\|XP\|setFinished\|exercise_attempts\|handleNext\|streak" src/components/exercises/ExerciseRunner.tsx`
Expected: vidiš liniju dodele XP (oko 138-150), prikaz (oko 275, 439-444), i `handleNext` (154-227).

- [ ] **Step 2: Preimenuj prikaz "XP" → "srca ❤️"**

Zameni tekstualne labele: `"{xp} XP zarađeno"` → `"{xp} ❤️ srca zarađeno"`, a animacija `+10`/`+15` ostaje (sada su srca). Interna promenljiva `xp` može da ostane (samo labela se menja) da bi izmena bila minimalna.

- [ ] **Step 3: Na kraju vežbe pozovi dodelu srca**

U `handleNext`, unutar `else` grane gde se već radi `exercise_attempts.insert(...)` i postoji `score`, dodati posle uspešnog insert-a:
```tsx
// dodela srca na osnovu tačnih odgovora (server računa iznos)
try {
  const res = await fetch("/api/hearts/award", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: "exercise", correct: score, hadStreak: maxStreak >= 3 }),
  });
  const data = await res.json();
  if (data?.leveledUp) setShowConfetti(true); // konfete već postoje u komponenti
} catch { /* tiho */ }
```
Napomena: `score` je broj tačnih (već postoji). Za `hadStreak` koristi postojeću streak logiku — ako komponenta nema `maxStreak`, dodaj `const [maxStreak, setMaxStreak] = useState(0)` i u `handleAnswer` na tačan odgovor `setMaxStreak((m) => Math.max(m, newStreak))`. Ako konfete promenljiva ima drugo ime, uskladi sa postojećim (`showConfetti`/`setShowConfetti` iz koda).

- [ ] **Step 4: Verifikuj**

Run: `npm run dev` → uradi jednu vežbu do kraja. Proveri: labela kaže "srca", a na `/dashboard` ukupan broj srca je porastao.
Expected: srca se sabiraju i pamte između sesija.

- [ ] **Step 5: Commit**

```bash
git add src/components/exercises/ExerciseRunner.tsx
git commit -m "feat(vezbe): XP→srca + trajna dodela srca na kraju vežbe"
```

### Task 16: Dodela srca pri završetku lekcije

**Files:**
- Modify: `src/components/LessonProgressTracker.tsx`

- [ ] **Step 1: Pročitaj komponentu**

Run: `cat src/components/LessonProgressTracker.tsx`
Expected: vidiš `lesson_progress.upsert(...)` kad se lekcija označava završenom.

- [ ] **Step 2: Posle uspešnog upsert-a, javi dodelu srca za svaku novooznačenu lekciju**

Posle `.upsert(...)` poziva (kada je rezultat bez greške i lista lekcija nije prazna), dodati:
```tsx
fetch("/api/hearts/award", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ reason: "lesson_complete" }),
}).catch(() => {});
```
Napomena: ako se odjednom označava više lekcija, pozvati jednom po lekciji (u petlji nad `lessonsToMark`) ILI jednom — odluka: jednom po lekciji da broj srca prati stварни napredak. (Za v1 dovoljno jednom po pozivu; idempotencija dvostrukog označavanja iste lekcije je prihvatljiv rizik na nivou postojećeg modela.)

- [ ] **Step 3: Verifikuj**

Run: `npm run dev` → otvori novu lekciju do kraja (da se prethodna označi). Na `/dashboard` srca su porasla za 20.
Expected: završetak lekcije nosi +20 ❤️.

- [ ] **Step 4: Commit**

```bash
git add src/components/LessonProgressTracker.tsx
git commit -m "feat(lekcije): +20 srca pri završetku lekcije"
```

### Task 17: Dodela srca za položen test (Modelltest/sertifikat)

**Files:**
- Modify: `src/components/exercises/ExerciseRunner.tsx`

- [ ] **Step 1: Nađi mesto gde se računa `overallPercent` i pravi sertifikat**

Run: `grep -n "overallPercent\|isModelltest\|certificate\|sertifikat" src/components/exercises/ExerciseRunner.tsx`
Expected: vidiš granu (oko 173-224) gde se računa ukupan procenat i kreira sertifikat na ≥60%.

- [ ] **Step 2: Kad je test položen, javi dodelu `test_pass`**

Unutar te grane, kad je `overallPercent >= 60` (položen), dodati:
```tsx
try {
  await fetch("/api/hearts/award", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: "test_pass", percent: overallPercent }),
  });
} catch { /* tiho */ }
```
Napomena: ovo je DODATNO uz dodelu po vežbi iz Taska 15 (test je skup vežbi; bonus za položen test dolazi na kraju Modelltest-a). Da se ne dupla na svaku pod-vežbu, `test_pass` se zove samo u Modelltest grani na kraju.

- [ ] **Step 3: Verifikuj**

Run: `npm run dev` → završi Modelltest sa ≥90%. Na dashboard-u srca porasla i za test bonus (75), maskota u stanju "celebrate" odmah po prelasku nivoa (ako je do njega došlo).
Expected: test_pass bonus dodeljen.

- [ ] **Step 4: Commit**

```bash
git add src/components/exercises/ExerciseRunner.tsx
git commit -m "feat(test): bonus srca za položen Modelltest (+90% bonus)"
```

---

## FAZA 6 — Završna provera i čišćenje

### Task 18: Cross-browser + mobilni + uklanjanje preview strane

**Files:**
- Delete: `src/app/dev/maskota/page.tsx`

- [ ] **Step 1: Pokreni sve testove i build**

Run: `npm test && npm run build`
Expected: svi testovi PASS; build uspešan bez grešaka.

- [ ] **Step 2: Ručna provera na pregledačima**

Otvori `/dashboard` i jednu vežbu u: Chrome, Safari, Firefox (desktop) i na telefonu (iOS Safari ili Android Chrome, ili kroz dev-tools device emulaciju). Proveri:
- maskota i srce-posuda se renderuju (SVG)
- animacije rade; uz `prefers-reduced-motion` se gase
- widget je responsive (ne lomi se na uskom ekranu)
- "?" objašnjenje se otvara i čita
Expected: konzistentno na svim pregledačima i na mobilnom.

- [ ] **Step 3: Ukloni preview stranu**

Run: `rm src/app/dev/maskota/page.tsx`
Expected: `/dev/maskota` više ne postoji.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(gamifikacija): cross-browser provera + uklonjena dev preview strana"
```

- [ ] **Step 5: Deploy (ručno, po memoriji) + smoke test**

Prema `reference_vercel_deploy` i `feedback_deploy_smoke_test` (memorija): produkcija ide ručno `vercel --prod` iz lokala; PostToolUse hook pokreće smoke-deploy. Posle deploya proveri keš sa cache-busterom (`reference_cdn_kes_verifikacija`).
Expected: `/dashboard` na produkciji prikazuje srca + medu; vežba sabira srca.

---

## Self-review napomene (za izvršioca)

- **Stari "XP" se nigde nije čuvao** → svi korisnici prirodno kreću od 0 srca. Nema migracije podataka.
- **Bezbednost:** iznose srca računa server (`applyAward`); klijent šalje samo `reason` + meta koji se već beleže (broj tačnih, procenat). Ovo prati postojeći nivo poverenja app-a (gde `exercise_attempts.score` već dolazi sa klijenta). Potpuna server-side reprovera tačnosti je van opsega v1.
- **Vremenska zona:** "danas" se računa za `Europe/Belgrade` i na serveru (ruta) i na dashboard-u (prikaz), da se niz/dnevni cilj poklope.
- **`MascotState` tip** se uvozi iz `@/components/mascot/MascotBear` i u `mascot.ts` i u widget-u — isti string literali svuda (`happy|celebrate|proud|thinking|sleepy|sad`).
