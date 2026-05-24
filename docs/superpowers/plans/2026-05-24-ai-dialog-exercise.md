# AI Situacioni Dijalog — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dugme "Vežbaj u dijalogu" na svakoj lekciji otvara AI-generisan situacioni dijalog vezan za temu, gde student bira od 2 ponuđena odgovora kroz 7 tura.

**Architecture:** Nova API ruta prima lessonId i tok razgovora, čita flashcards iz lekcije, šalje prompt Anthropicu (Haiku) koji vraća JSON sa replikom + 2 opcije. Client component renderuje chat UI. Na kraju prikazuje ceo dijalog sa srpskim prevodom.

**Tech Stack:** Next.js 16, Anthropic SDK (claude-haiku-4-5-20251001), Supabase, Tailwind CSS 4

---

### Task 1: API ruta — `/api/ai-dialog-exercise`

**Files:**
- Create: `src/app/api/ai-dialog-exercise/route.ts`

- [ ] **Step 1: Create the API route**

```typescript
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import type { Section } from "@/lib/section-types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface DialogMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_TURNS = 7;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Previše zahteva. Pokušaj ponovo za minut." }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId, messages, turnNumber } = await request.json() as {
    lessonId: string;
    messages: DialogMessage[];
    turnNumber: number;
  };

  if (!lessonId || turnNumber < 1 || turnNumber > MAX_TURNS + 1) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (messages && messages.length > 20) {
    return NextResponse.json({ error: "Too many messages" }, { status: 400 });
  }

  // Fetch lesson info + course level
  const { data: lesson } = await supabase
    .from("lessons")
    .select("title, sections, course_id, courses(title)")
    .eq("id", lessonId)
    .single();

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Extract level from course title (e.g. "Nemački A1.1" → "A1")
  const courseTitle = (lesson.courses as { title: string } | null)?.title ?? "";
  const levelMatch = courseTitle.match(/[AB][12]/i);
  const level = levelMatch ? levelMatch[0].toUpperCase() : "A1";

  // Extract vocabulary from flashcard sections
  const sections = (lesson.sections ?? []) as Section[];
  const flashcardSections = sections.filter((s) => s.type === "flashcard");
  const vocabList = flashcardSections
    .flatMap((s) => s.type === "flashcard" ? s.items : [])
    .map((item) => `${item.front} = ${item.back}`)
    .slice(0, 30)
    .join(", ");

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "placeholder_key") {
    return NextResponse.json({
      aiMessage: "AI vežba trenutno nije dostupna.",
      options: null,
      finished: true,
      summary: "Servis privremeno nedostupan.",
      translations: [],
    });
  }

  const isLastTurn = turnNumber >= MAX_TURNS;

  const systemPrompt = `Ti si AI partner za vežbanje nemačkog jezika na nivou ${level}.

ZADATAK:
- Osmisli kratki svakodnevni dijalog vezan za temu lekcije: "${lesson.title}"
- Igraš ulogu odgovarajuću situaciji (konobar, prodavac, recepcioner, itd.)
- Student bira od 2 ponuđene opcije za svaku svoju repliku

PRAVILA:
- Tvoje replike su kratke (1-2 rečenice na nemačkom)
- Za svaku turu daješ studentu TAČNO 2 opcije za odgovor na nemačkom
- Jedna opcija je tematski ispravna i logična u kontekstu
- Druga opcija je gramatički korektna ali nelogična u datoj situaciji
- Obe opcije koriste vokabular prigodan za nivo ${level}
- Dijalog traje tačno ${MAX_TURNS} tura (sada je tura ${turnNumber})
${level === "A1" ? "- Koristi Präsens, jednostavne rečenice, osnovni vokabular" : level === "A2" ? "- Koristi Präsens/Perfekt, srednje složene rečenice" : "- Možeš koristiti složenije strukture, modalne glagole, Konjunktiv II"}
${vocabList ? `- Koristi ove reči iz lekcije kad je moguće: ${vocabList}` : ""}

FORMAT ODGOVORA — odgovaraj ISKLJUČIVO validnim JSON objektom:
${turnNumber === 1 ? `{"scenario": "opis situacije na srpskom (1 rečenica)", "aiMessage": "tvoja prva replika na nemačkom", "options": ["opcija A", "opcija B"], "finished": false}` : isLastTurn ? `{"aiMessage": "tvoja poslednja replika na nemačkom — zaključi razgovor", "options": null, "finished": true, "summary": "kratka pohvala na srpskom", "translations": [{"de": "nemački tekst", "sr": "srpski prevod"} za SVAKU repliku iz celog dijaloga uključujući ovu poslednju]}` : `{"aiMessage": "tvoja replika na nemačkom", "options": ["opcija A", "opcija B"], "finished": false}`}`;

  try {
    const claudeMessages: { role: "user" | "assistant"; content: string }[] = messages
      ? messages.map((m) => ({ role: m.role, content: m.content }))
      : [];

    // For first turn, add a user message to trigger the AI
    if (turnNumber === 1) {
      claudeMessages.push({ role: "user", content: "Počni dijalog." });
    }

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: systemPrompt,
      messages: claudeMessages,
    });

    let responseText = message.content[0].type === "text" ? message.content[0].text : "";
    responseText = responseText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

    try {
      const parsed = JSON.parse(responseText);
      return NextResponse.json(parsed);
    } catch {
      // If JSON parsing fails, return a graceful fallback
      return NextResponse.json({
        aiMessage: responseText.slice(0, 200),
        options: null,
        finished: true,
        summary: "Došlo je do greške. Pokušaj ponovo.",
        translations: [],
      });
    }
  } catch (error) {
    console.error("[ai-dialog-exercise] Error:", error);
    return NextResponse.json({
      aiMessage: "Greška pri komunikaciji sa AI-jem.",
      options: null,
      finished: true,
      summary: "Servis privremeno nedostupan.",
      translations: [],
    });
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx next build --no-lint 2>&1 | grep -E "error|Error" | head -5`

Expected: No errors related to `ai-dialog-exercise`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ai-dialog-exercise/route.ts
git commit -m "feat: add AI dialog exercise API route"
```

---

### Task 2: Client component — `AiDialogExercise`

**Files:**
- Create: `src/components/exercises/AiDialogExercise.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

interface DialogMessage {
  role: "user" | "assistant";
  content: string;
}

interface Translation {
  de: string;
  sr: string;
}

interface AiDialogExerciseProps {
  lessonId: string;
  lessonTitle: string;
}

export default function AiDialogExercise({ lessonId, lessonTitle }: AiDialogExerciseProps) {
  const [messages, setMessages] = useState<DialogMessage[]>([]);
  const [scenario, setScenario] = useState<string | null>(null);
  const [options, setOptions] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [turnNumber, setTurnNumber] = useState(1);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startDialog = async () => {
    setStarted(true);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai-dialog-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, messages: [], turnNumber: 1 }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Greška pri pokretanju.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setScenario(data.scenario || null);
      setMessages([{ role: "assistant", content: data.aiMessage }]);
      setOptions(data.options || null);
      setTurnNumber(2);
    } catch {
      setError("Greška pri povezivanju sa serverom.");
    }
    setLoading(false);
  };

  const selectOption = async (option: string) => {
    setLoading(true);
    setError(null);

    const newMessages: DialogMessage[] = [
      ...messages,
      { role: "user", content: option },
    ];
    setMessages(newMessages);
    setOptions(null);

    try {
      const res = await fetch("/api/ai-dialog-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, messages: newMessages, turnNumber }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Greška.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.aiMessage }]);
      setOptions(data.options || null);
      setTurnNumber(turnNumber + 1);

      if (data.finished) {
        setFinished(true);
        setSummary(data.summary || null);
        setTranslations(data.translations || []);
      }
    } catch {
      setError("Greška pri povezivanju sa serverom.");
    }
    setLoading(false);
  };

  const restart = () => {
    setMessages([]);
    setScenario(null);
    setOptions(null);
    setLoading(false);
    setFinished(false);
    setSummary(null);
    setTranslations([]);
    setTurnNumber(1);
    setStarted(false);
    setError(null);
  };

  // Pre-start state
  if (!started) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="text-3xl mb-4">💬</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Vežbaj u dijalogu</h2>
        <p className="text-sm text-gray-500 mb-2">{lessonTitle}</p>
        <p className="text-xs text-gray-400 mb-6 max-w-sm mx-auto">
          Ova vežba koristi veštačku inteligenciju. Odgovori su generisani automatski
          i mogu povremeno sadržati greške. Ako nešto deluje čudno — pitaj svoju profesorku.
        </p>
        <button
          onClick={startDialog}
          className="bg-plava text-white px-8 py-3 rounded-lg font-medium hover:bg-plava-dark transition-colors"
        >
          Započni dijalog
        </button>
      </div>
    );
  }

  // Finished state
  if (finished) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🎉</div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Bravo!</h2>
          {summary && <p className="text-sm text-gray-500">{summary}</p>}
        </div>

        {/* Translation review */}
        {translations.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Ceo dijalog sa prevodom:</h3>
            <div className="space-y-3">
              {translations.map((t, i) => (
                <div key={i} className="text-sm">
                  <p className="font-medium text-gray-900">{t.de}</p>
                  <p className="text-gray-400 text-xs">{t.sr}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={restart}
            className="flex-1 py-3 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Ponovi
          </button>
          <Link
            href={`/lekcija/${lessonId}`}
            className="flex-1 text-center py-3 bg-plava text-white rounded-lg text-sm font-medium hover:bg-plava-dark transition-colors"
          >
            Nazad na lekciju
          </Link>
        </div>
      </div>
    );
  }

  // Active dialog state
  return (
    <div className="max-w-lg mx-auto py-8">
      {/* Scenario */}
      {scenario && (
        <div className="bg-plava-light rounded-lg px-4 py-3 mb-6 text-sm text-plava-dark">
          {scenario}
        </div>
      )}

      {/* Messages */}
      <div className="space-y-3 mb-6">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                msg.role === "user"
                  ? "bg-plava text-white rounded-br-md"
                  : "bg-gray-100 text-gray-900 rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-400 px-4 py-3 rounded-2xl rounded-bl-md text-sm">
              ...
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      {options && !loading && (
        <div className="space-y-2">
          {options.map((option, i) => (
            <button
              key={i}
              onClick={() => selectOption(option)}
              className="w-full text-left px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm hover:border-plava hover:bg-plava-light transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-koral-light text-koral-dark px-4 py-3 rounded-lg text-sm mt-4">
          {error}
        </div>
      )}

      {/* Turn indicator */}
      <div className="mt-6 flex justify-center">
        <span className="text-xs text-gray-300">
          {turnNumber - 1} / 7
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/exercises/AiDialogExercise.tsx
git commit -m "feat: add AiDialogExercise client component"
```

---

### Task 3: Page — `/vezba/ai/[lessonId]`

**Files:**
- Create: `src/app/vezba/ai/[lessonId]/page.tsx`

- [ ] **Step 1: Create the page (server component)**

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AiDialogExercise from "@/components/exercises/AiDialogExercise";

interface PageProps {
  params: Promise<{ lessonId: string }>;
}

export const dynamic = "force-dynamic";

export default async function AiDialogPage({ params }: PageProps) {
  const { lessonId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title")
    .eq("id", lessonId)
    .single();

  if (!lesson) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <AiDialogExercise lessonId={lesson.id} lessonTitle={lesson.title} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/vezba/ai/[lessonId]/page.tsx
git commit -m "feat: add AI dialog exercise page"
```

---

### Task 4: Dugme na stranici lekcije

**Files:**
- Modify: `src/app/lekcija/[id]/page.tsx`

- [ ] **Step 1: Add the "Vežbaj u dijalogu" button**

In `src/app/lekcija/[id]/page.tsx`, find this section (around line 119-140):

```tsx
      {/* Exercises */}
      {exercises && exercises.length > 0 && (
```

Add the AI dialog button BEFORE this block:

```tsx
      {/* AI Dialog Exercise */}
      <div className="mt-8">
        <Link
          href={`/vezba/ai/${typedLesson.id}`}
          className="flex items-center justify-between w-full bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">💬</span>
            <div>
              <span className="font-medium text-gray-900">Vežbaj u dijalogu</span>
              <span className="block text-xs text-gray-400">AI generisano</span>
            </div>
          </div>
          <span className="text-xs text-plava bg-plava-light px-3 py-1 rounded-full">
            AI
          </span>
        </Link>
      </div>

      {/* Exercises */}
      {exercises && exercises.length > 0 && (
```

- [ ] **Step 2: Verify the page compiles**

Run: `npm run build 2>&1 | grep -E "error|Error" | head -5`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/lekcija/[id]/page.tsx
git commit -m "feat: add AI dialog button to lesson page"
```

---

### Task 5: Build verification and deploy

- [ ] **Step 1: Full build**

Run: `npm run build`

Expected: All pages compile. New routes visible:
- `/vezba/ai/[lessonId]` — dynamic

- [ ] **Step 2: Push to deploy**

```bash
git push
```

- [ ] **Step 3: Test on production**

1. Open any lesson on `kurs.hartweger.rs`
2. Scroll down — "Vežbaj u dijalogu" button should appear
3. Click it — AI disclaimer shows, click "Započni dijalog"
4. AI sets scenario + first message + 2 options
5. Click options through 7 turns
6. At the end: summary + full dialog with translations
7. "Ponovi" restarts, "Nazad na lekciju" links back
