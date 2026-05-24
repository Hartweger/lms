# A1.2 Kvizovi + Essay Review System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 67 quiz questions across 6 module tests for A1.2 course, plus a professor-reviewed essay system with 2 essays in module tests (M3, M6) and 1 in the final exam.

**Architecture:** New `essay_submissions` table stores student essays with AI feedback, professor review, and publication status. EssayExercise component is modified to save submissions as `pending` instead of showing AI feedback directly. New admin page `/admin/eseji` lets professor review, edit, and publish essay results.

**Tech Stack:** Next.js 16, Supabase (Postgres + RLS), TypeScript, Tailwind CSS 4

---

### Task 1: Database migration — essay_submissions + exercise type constraint

**Files:**
- Create: `supabase/migrations/013_essay_submissions.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Essay submissions with professor review workflow
CREATE TABLE public.essay_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  ai_feedback TEXT,
  ai_corrections JSONB,
  ai_score INTEGER,
  professor_feedback TEXT,
  professor_score INTEGER CHECK (professor_score BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'published')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Update exercise_type constraint to include true_false and typing
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_exercise_type_check;
ALTER TABLE exercises ADD CONSTRAINT exercises_exercise_type_check
  CHECK (exercise_type IN ('quiz', 'fill_blank', 'match_pairs', 'word_order', 'listen_write', 'dialog', 'true_false', 'typing'));

-- RLS
ALTER TABLE public.essay_submissions ENABLE ROW LEVEL SECURITY;

-- Students can insert their own submissions
CREATE POLICY "Users can insert own submissions"
  ON public.essay_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Students can read their own published submissions
CREATE POLICY "Users can read own published submissions"
  ON public.essay_submissions FOR SELECT
  USING (
    user_id = auth.uid()
    OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'professor')
  );

-- Admins/professors can update any submission (for review)
CREATE POLICY "Admins can update submissions"
  ON public.essay_submissions FOR UPDATE
  USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin', 'professor'));

-- Admins can delete
CREATE POLICY "Admins can delete submissions"
  ON public.essay_submissions FOR DELETE
  USING ((SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- Index for fast admin queries
CREATE INDEX idx_essay_submissions_status ON public.essay_submissions(status);
CREATE INDEX idx_essay_submissions_user ON public.essay_submissions(user_id);
```

- [ ] **Step 2: Apply migration to Supabase**

Run: `cd /Users/natasahartweger/Documents/Claude/sajt/LMS/lms && npx supabase db push`

If using remote Supabase (no local), apply via Supabase Dashboard SQL Editor by pasting the migration content.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/013_essay_submissions.sql
git commit -m "feat: add essay_submissions table and update exercise type constraint"
```

---

### Task 2: Add EssaySubmission type

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add the EssaySubmission interface**

Add after the `ExerciseAttempt` interface (after line 95):

```typescript
export interface EssaySubmission {
  id: string;
  user_id: string;
  exercise_id: string;
  lesson_id: string;
  text: string;
  ai_feedback: string | null;
  ai_corrections: unknown;
  ai_score: number | null;
  professor_feedback: string | null;
  professor_score: number | null;
  status: "pending" | "reviewed" | "published";
  submitted_at: string;
  reviewed_at: string | null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add EssaySubmission type"
```

---

### Task 3: Modify EssayExercise for professor review flow

**Files:**
- Modify: `src/components/exercises/EssayExercise.tsx`

The current EssayExercise calls `/api/check-essay` and immediately shows AI feedback. We need to:
1. Call `/api/check-essay` to get AI feedback
2. Save essay + AI feedback to `essay_submissions` with status `pending`
3. Show "Tvoj esej je poslat na pregled" instead of the AI result
4. If the student already has a published submission for this exercise, show the professor's feedback

- [ ] **Step 1: Rewrite EssayExercise.tsx**

Replace the entire file content with:

```tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface EssayProps {
  task: string;
  level: string;
  onAnswer: (correct: boolean) => void;
  exerciseId?: string;
  lessonId?: string;
}

interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

interface PublishedResult {
  professor_feedback: string;
  professor_score: number;
  ai_feedback: string | null;
  ai_corrections: Correction[] | null;
}

export default function EssayExercise({ task, level, onAnswer, exerciseId, lessonId }: EssayProps) {
  const supabase = createClient();
  const [text, setText] = useState("");
  const [checking, setChecking] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [published, setPublished] = useState<PublishedResult | null>(null);
  const [alreadyPending, setAlreadyPending] = useState(false);

  // Check if student already has a submission for this exercise
  useEffect(() => {
    if (!exerciseId) return;
    const checkExisting = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("essay_submissions")
        .select("*")
        .eq("exercise_id", exerciseId)
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        if (data.status === "published") {
          setPublished({
            professor_feedback: data.professor_feedback,
            professor_score: data.professor_score,
            ai_feedback: data.ai_feedback,
            ai_corrections: data.ai_corrections as Correction[] | null,
          });
          onAnswer((data.professor_score || 0) >= 3);
        } else {
          // pending or reviewed — not yet published
          setAlreadyPending(true);
        }
      }
    };
    checkExisting();
  }, [exerciseId, supabase]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setChecking(true);

    try {
      // Get AI feedback
      const response = await fetch("/api/check-essay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, task, level }),
      });
      const aiData = await response.json();

      // Save to essay_submissions
      if (exerciseId && lessonId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("essay_submissions").insert({
            user_id: user.id,
            exercise_id: exerciseId,
            lesson_id: lessonId,
            text,
            ai_feedback: aiData.feedback || null,
            ai_corrections: aiData.corrections || null,
            ai_score: aiData.score || null,
            status: "pending",
          });
        }
      }

      setSubmitted(true);
      // Don't call onAnswer yet — professor needs to review first
      // But mark as "answered" so the exercise can continue
      onAnswer(true);
    } catch {
      // Fallback: still save without AI
      if (exerciseId && lessonId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("essay_submissions").insert({
            user_id: user.id,
            exercise_id: exerciseId,
            lesson_id: lessonId,
            text,
            status: "pending",
          });
        }
      }
      setSubmitted(true);
      onAnswer(true);
    }
    setChecking(false);
  };

  const scoreLabels: Record<number, string> = {
    1: "Treba još vežbe",
    2: "Na dobrom si putu",
    3: "Dobro!",
    4: "Vrlo dobro!",
    5: "Odlično!",
  };

  const scoreColors: Record<number, string> = {
    1: "text-koral",
    2: "text-orange-500",
    3: "text-yellow-600",
    4: "text-green-500",
    5: "text-green-600",
  };

  // Already published — show professor feedback
  if (published) {
    return (
      <div>
        <div className="mb-4">
          <p className="text-lg font-medium text-gray-900 mb-2">Zadatak:</p>
          <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{task}</p>
        </div>

        <div className="mt-6 space-y-4">
          {published.professor_score && (
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-bold ${scoreColors[published.professor_score]}`}>
                {published.professor_score}/5
              </span>
              <span className={`text-sm font-medium ${scoreColors[published.professor_score]}`}>
                {scoreLabels[published.professor_score]}
              </span>
            </div>
          )}

          {published.professor_feedback && (
            <div className="bg-plava-light rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">Komentar profesora:</p>
              <p className="text-sm text-gray-700">{published.professor_feedback}</p>
            </div>
          )}

          {published.ai_corrections && published.ai_corrections.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Ispravke:</h4>
              {published.ai_corrections.map((c, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-100 p-3">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-koral line-through">{c.original}</span>
                    <span className="text-gray-400">&rarr;</span>
                    <span className="text-green-600 font-medium">{c.corrected}</span>
                  </div>
                  {c.explanation && (
                    <p className="text-xs text-gray-400 mt-1">{c.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Already submitted, waiting for review
  if (submitted || alreadyPending) {
    return (
      <div>
        <div className="mb-4">
          <p className="text-lg font-medium text-gray-900 mb-2">Zadatak:</p>
          <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{task}</p>
        </div>
        <div className="mt-6 bg-plava-light rounded-xl p-6 text-center">
          <p className="text-lg font-medium text-plava mb-2">Tvoj esej je poslat na pregled</p>
          <p className="text-sm text-gray-500">Profesor će pregledati tvoj rad i dati ti povratnu informaciju. Rezultat ćeš videti ovde kada bude gotovo.</p>
        </div>
      </div>
    );
  }

  // Input form
  return (
    <div>
      <div className="mb-4">
        <p className="text-lg font-medium text-gray-900 mb-2">Zadatak:</p>
        <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{task}</p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Napiši odgovor na nemačkom..."
        rows={6}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-plava focus:border-transparent resize-none text-gray-700"
      />

      <button
        onClick={handleSubmit}
        disabled={checking || !text.trim()}
        className="mt-4 bg-plava text-white px-6 py-3 rounded-lg hover:bg-plava-dark transition-colors disabled:opacity-50"
      >
        {checking ? "Šaljem..." : "Pošalji esej"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Update ExerciseRunner to pass exerciseId and lessonId to EssayExercise**

In `src/components/exercises/ExerciseRunner.tsx`, find the listen_write block (lines 292-300) and change to:

```tsx
          if (exercise.exercise_type === "listen_write") {
            return (
              <EssayExercise
                key={question.id}
                task={question.question}
                level={level}
                onAnswer={handleAnswer}
                exerciseId={exercise.id}
                lessonId={exercise.lesson_id}
              />
            );
          }
```

Also update the fallback essay at the bottom (line 414-420):

```tsx
          return (
            <EssayExercise
              key={question.id}
              task={question.question}
              level="A1"
              onAnswer={handleAnswer}
              exerciseId={exercise.id}
              lessonId={exercise.lesson_id}
            />
          );
```

- [ ] **Step 3: Commit**

```bash
git add src/components/exercises/EssayExercise.tsx src/components/exercises/ExerciseRunner.tsx
git commit -m "feat: essay submissions with professor review flow"
```

---

### Task 4: Admin essay review page

**Files:**
- Create: `src/app/admin/eseji/page.tsx`
- Modify: `src/components/AdminSidebar.tsx`

- [ ] **Step 1: Add Eseji link to AdminSidebar**

In `src/components/AdminSidebar.tsx`, add to the links array (after line 11):

```typescript
  { href: "/admin/eseji", label: "Eseji" },
```

- [ ] **Step 2: Create the admin essay review page**

Create `src/app/admin/eseji/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface EssayRow {
  id: string;
  user_id: string;
  exercise_id: string;
  lesson_id: string;
  text: string;
  ai_feedback: string | null;
  ai_corrections: { original: string; corrected: string; explanation: string }[] | null;
  ai_score: number | null;
  professor_feedback: string | null;
  professor_score: number | null;
  status: "pending" | "reviewed" | "published";
  submitted_at: string;
  reviewed_at: string | null;
  // joined
  user_profiles?: { full_name: string; email: string };
  lessons?: { title: string };
  exercises?: { title: string };
}

export default function AdminEseji() {
  const supabase = createClient();
  const [essays, setEssays] = useState<EssayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "reviewed" | "published" | "all">("pending");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profFeedback, setProfFeedback] = useState("");
  const [profScore, setProfScore] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = supabase
        .from("essay_submissions")
        .select("*, user_profiles!essay_submissions_user_id_fkey(full_name, email), lessons!essay_submissions_lesson_id_fkey(title), exercises!essay_submissions_exercise_id_fkey(title)")
        .order("submitted_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data } = await query;
      setEssays((data as EssayRow[]) || []);
      setLoading(false);
    };
    load();
  }, [filter, supabase]);

  const startReview = (essay: EssayRow) => {
    setEditingId(essay.id);
    setProfFeedback(essay.professor_feedback || essay.ai_feedback || "");
    setProfScore(essay.professor_score || essay.ai_score || 3);
  };

  const publishEssay = async (essayId: string) => {
    setSaving(true);
    await supabase.from("essay_submissions").update({
      professor_feedback: profFeedback,
      professor_score: profScore,
      status: "published",
      reviewed_at: new Date().toISOString(),
    }).eq("id", essayId);

    setEssays(essays.map(e =>
      e.id === essayId
        ? { ...e, professor_feedback: profFeedback, professor_score: profScore, status: "published" as const, reviewed_at: new Date().toISOString() }
        : e
    ));
    setEditingId(null);
    setSaving(false);
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    reviewed: "bg-blue-100 text-blue-700",
    published: "bg-green-100 text-green-700",
  };

  const statusLabels = {
    pending: "Čeka pregled",
    reviewed: "Pregledano",
    published: "Objavljeno",
  };

  if (loading) return <div className="p-8 text-gray-400">Učitavanje...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Eseji</h1>
      <p className="text-gray-500 mb-6">Pregled i ocenjivanje studentskih eseja</p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["pending", "reviewed", "published", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm ${
              filter === f
                ? "bg-plava text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "pending" ? "Čekaju pregled" : f === "reviewed" ? "Pregledano" : f === "published" ? "Objavljeno" : "Svi"}
          </button>
        ))}
      </div>

      {essays.length === 0 && (
        <p className="text-gray-400 text-center py-12">Nema eseja u ovoj kategoriji.</p>
      )}

      {/* Essay list */}
      <div className="space-y-4">
        {essays.map((essay) => (
          <div key={essay.id} className="bg-white rounded-xl shadow-sm p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-medium text-gray-900">
                  {essay.user_profiles?.full_name || essay.user_profiles?.email || "Nepoznat"}
                </span>
                <span className="text-gray-400 text-sm ml-3">
                  {new Date(essay.submitted_at).toLocaleDateString("sr-Latn")}
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[essay.status]}`}>
                {statusLabels[essay.status]}
              </span>
            </div>

            {/* Lesson info */}
            <p className="text-xs text-gray-400 mb-3">
              {essay.lessons?.title} — {essay.exercises?.title}
            </p>

            {/* Student text */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">Tekst studenta:</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{essay.text}</p>
            </div>

            {/* AI feedback */}
            {essay.ai_feedback && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-xs font-semibold text-blue-600 mb-1">
                  AI sugestija (ocena: {essay.ai_score}/5):
                </p>
                <p className="text-sm text-gray-700">{essay.ai_feedback}</p>
                {essay.ai_corrections && essay.ai_corrections.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {essay.ai_corrections.map((c, i) => (
                      <div key={i} className="text-xs">
                        <span className="text-koral line-through">{c.original}</span>
                        {" → "}
                        <span className="text-green-600 font-medium">{c.corrected}</span>
                        {c.explanation && <span className="text-gray-400"> — {c.explanation}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Review form */}
            {editingId === essay.id ? (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Tvoj komentar:</label>
                  <textarea
                    value={profFeedback}
                    onChange={(e) => setProfFeedback(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Ocena:</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setProfScore(s)}
                        className={`w-10 h-10 rounded-lg text-sm font-bold ${
                          profScore === s
                            ? "bg-plava text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => publishEssay(essay.id)}
                    disabled={saving}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? "Čuvam..." : "Objavi studentu"}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200"
                  >
                    Otkaži
                  </button>
                </div>
              </div>
            ) : (
              essay.status !== "published" && (
                <button
                  onClick={() => startReview(essay)}
                  className="bg-plava text-white px-4 py-2 rounded-lg text-sm hover:bg-plava-dark"
                >
                  Pregledaj i oceni
                </button>
              )
            )}

            {/* Published feedback */}
            {essay.status === "published" && essay.professor_feedback && (
              <div className="bg-green-50 rounded-lg p-4 mt-4">
                <p className="text-xs font-semibold text-green-600 mb-1">
                  Profesor (ocena: {essay.professor_score}/5):
                </p>
                <p className="text-sm text-gray-700">{essay.professor_feedback}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/eseji/page.tsx src/components/AdminSidebar.tsx
git commit -m "feat: admin essay review page with filter tabs and publish flow"
```

---

### Task 5: Create quiz import script for A1.2 module tests

**Files:**
- Create: `scripts/import-a12-tests.ts`

This script creates exercises and questions for all 6 module tests. It finds test lessons by matching titles that contain "Test" and the module number. Questions use the `{ type, items }` format in options, matching the existing import-quizzes-v2 pattern.

- [ ] **Step 1: Create the import script**

Create `scripts/import-a12-tests.ts`:

```typescript
/**
 * Import A1.2 module test questions
 * Run: npx tsx scripts/import-a12-tests.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load env
const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join("=").trim();
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Question {
  question: string;
  options: unknown;
  correct_answer: string;
  explanation?: string;
  question_type: string;
}

// ── All test questions ──────────────────────────────────

const MODULE_TESTS: Record<number, { title: string; questions: Question[] }> = {
  1: {
    title: "Test Modul 1",
    questions: [
      // 1. Quiz — Welchen Beruf hat die Person?
      {
        question: 'Welchen Beruf hat die Person? "Ich arbeite im Krankenhaus und helfe kranken Menschen."',
        options: { type: "quiz", items: ["Lehrerin", "Ärztin", "Verkäuferin", "Köchin"] },
        correct_answer: "1",
        explanation: "Im Krankenhaus arbeitet eine Ärztin.",
        question_type: "quiz",
      },
      // 2. Quiz — Welcher Satz ist richtig?
      {
        question: "Welcher Satz ist richtig?",
        options: { type: "quiz", items: ["Gestern ich war müde.", "Gestern war ich müde.", "Gestern war müde ich.", "Ich gestern war müde."] },
        correct_answer: "1",
        question_type: "quiz",
      },
      // 3. Fill_blank — hatte/war
      {
        question: "Mein Bruder ___ gestern krank. Er ___ Fieber.",
        options: { type: "fill_blank", items: ["war", "hatte", "ist", "hat"] },
        correct_answer: "war, hatte",
        question_type: "fill_blank",
      },
      // 4. Fill_blank — hatte/war
      {
        question: "Ich ___ letzte Woche keine Zeit. Ich ___ in Berlin.",
        options: { type: "fill_blank", items: ["hatte", "war", "habe", "bin"] },
        correct_answer: "hatte, war",
        question_type: "fill_blank",
      },
      // 5. Word_order
      {
        question: "Koliko dugo učiš nemački?",
        options: { type: "word_order", items: ["Wie", "lange", "lernst", "du", "Deutsch?"] },
        correct_answer: "Wie lange lernst du Deutsch?",
        question_type: "word_order",
      },
      // 6. Word_order
      {
        question: "Od kada živiš u Beču?",
        options: { type: "word_order", items: ["Seit", "wann", "wohnst", "du", "in", "Wien?"] },
        correct_answer: "Seit wann wohnst du in Wien?",
        question_type: "word_order",
      },
      // 7. Match_pairs — zanimanja
      {
        question: "Spoji zanimanja sa prevodom:",
        options: { type: "match_pairs", items: [
          { de: "der Arzt", sr: "lekar" },
          { de: "die Lehrerin", sr: "nastavnica" },
          { de: "der Koch", sr: "kuvar" },
          { de: "die Verkäuferin", sr: "prodavačica" },
          { de: "der Friseur", sr: "frizer" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      // 8. Fill_blank — war/hatte
      {
        question: "Gestern ___ ich müde. Ich ___ Kopfschmerzen. Meine Schwester ___ auch krank.",
        options: { type: "fill_blank", items: ["war", "hatte", "ist", "hat"] },
        correct_answer: "war, hatte, war",
        question_type: "fill_blank",
      },
      // 9. Quiz — Welche Frage passt?
      {
        question: 'Welche Frage passt? Antwort: "Seit drei Jahren."',
        options: { type: "quiz", items: ["Wie lange?", "Seit wann?", "Wann?", "Wie oft?"] },
        correct_answer: "0",
        question_type: "quiz",
      },
      // 10. Quiz — vor
      {
        question: 'Was bedeutet "vor zwei Jahren"?',
        options: { type: "quiz", items: ["za dve godine", "pre dve godine", "od dve godine", "dve godine ranije"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      // 11. Fill_blank — vor
      {
        question: "Ich habe ___ fünf Jahren in Wien gewohnt. Das ___ eine schöne Zeit.",
        options: { type: "fill_blank", items: ["vor", "war", "seit", "hatte"] },
        correct_answer: "vor, war",
        question_type: "fill_blank",
      },
    ],
  },
  2: {
    title: "Test Modul 2",
    questions: [
      // 1. Quiz — Imperativ situacija
      {
        question: 'Die Mutter sagt zum Kind: "Es ist spät!" Was sagt sie noch?',
        options: { type: "quiz", items: ["Du gehst ins Bett.", "Kannst du ins Bett gehen?", "Geh ins Bett!", "Er geht ins Bett."] },
        correct_answer: "2",
        question_type: "quiz",
      },
      // 2. Fill_blank — Imperativ du-Form
      {
        question: "___ bitte die Tür! (otvoriti) ___ bitte leise! (biti)",
        options: { type: "fill_blank", items: ["Öffne", "Sei", "Mach", "Geh"] },
        correct_answer: "Öffne, Sei",
        question_type: "fill_blank",
      },
      // 3. Fill_blank — Imperativ
      {
        question: "___ deine Hausaufgaben! (uraditi) ___ nicht so laut! (govoriti)",
        options: { type: "fill_blank", items: ["Mach", "Sprich", "Schreib", "Lies"] },
        correct_answer: "Mach, Sprich",
        question_type: "fill_blank",
      },
      // 4. Word_order
      {
        question: "Dođi sutra kod mene!",
        options: { type: "word_order", items: ["Komm", "morgen", "zu", "mir!"] },
        correct_answer: "Komm morgen zu mir!",
        question_type: "word_order",
      },
      // 5. Quiz — dürfen
      {
        question: 'Was passt? "Hier ___ man nicht rauchen."',
        options: { type: "quiz", items: ["muss", "darf", "will", "soll"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      // 6. Match_pairs — modalni glagoli
      {
        question: "Spoji:",
        options: { type: "match_pairs", items: [
          { de: "müssen", sr: "morati" },
          { de: "können", sr: "moći" },
          { de: "dürfen", sr: "smeti" },
          { de: "wollen", sr: "hteti" },
          { de: "sollen", sr: "trebati" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      // 7. Quiz — sollen značenje
      {
        question: '"Du sollst mehr Wasser trinken." — Šta to znači?',
        options: { type: "quiz", items: ["Moraš da piješ više vode.", "Trebalo bi da piješ više vode.", "Smeš da piješ više vode.", "Hoćeš da piješ više vode."] },
        correct_answer: "1",
        question_type: "quiz",
      },
      // 8. Quiz — sollen (lekar)
      {
        question: 'Der Arzt sagt: "Sie ___ jeden Tag 30 Minuten spazieren gehen."',
        options: { type: "quiz", items: ["dürfen", "wollen", "sollen", "müssen"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      // 9. Fill_blank — können/haben
      {
        question: "Ich ___ heute nicht kommen, ich bin krank. ___ du morgen Zeit? (moći, imati)",
        options: { type: "fill_blank", items: ["kann", "Hast", "darf", "Kannst"] },
        correct_answer: "kann, Hast",
        question_type: "fill_blank",
      },
      // 10. Quiz — Wien
      {
        question: "Wien ist die Hauptstadt von...",
        options: { type: "quiz", items: ["Deutschland", "der Schweiz", "Österreich", "Luxemburg"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      // 11. Word_order
      {
        question: "Možeš li mi pomoći?",
        options: { type: "word_order", items: ["Kannst", "du", "mir", "helfen?"] },
        correct_answer: "Kannst du mir helfen?",
        question_type: "word_order",
      },
    ],
  },
  3: {
    title: "Test Modul 3",
    questions: [
      // 1. Match_pairs — Körperteile
      {
        question: "Spoji delove tela:",
        options: { type: "match_pairs", items: [
          { de: "der Kopf", sr: "glava" },
          { de: "der Arm", sr: "ruka" },
          { de: "das Bein", sr: "noga" },
          { de: "der Bauch", sr: "stomak" },
          { de: "das Auge", sr: "oko" },
          { de: "das Ohr", sr: "uvo" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      // 2. Quiz — beim Arzt
      {
        question: 'Beim Arzt. Der Arzt fragt: "Was fehlt Ihnen?"',
        options: { type: "quiz", items: ["Das Brot schmeckt gut.", "Ich arbeite als Krankenschwester.", "Mir tut der Bauch weh.", "Ich bin angestellt."] },
        correct_answer: "2",
        question_type: "quiz",
      },
      // 3. Fill_blank — prisvojne zamenice
      {
        question: "___ Bruder ist 10 Jahre alt. (moj) ___ Schwester wohnt in Wien. (moja)",
        options: { type: "fill_blank", items: ["Mein", "Meine", "Sein", "Ihre"] },
        correct_answer: "Mein, Meine",
        question_type: "fill_blank",
      },
      // 4. Quiz — ihre
      {
        question: '"Das ist Maria. ___ Tasche ist rot."',
        options: { type: "quiz", items: ["Sein", "Meine", "Ihre", "Unser"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      // 5. Quiz — Ihre (plural)
      {
        question: '"Das sind Maria und Tom. ___ Kinder gehen in die Schule."',
        options: { type: "quiz", items: ["Sein", "Unser", "Ihre", "Euer"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      // 6. Word_order — beim Arzt
      {
        question: "Lekar pita pacijenta:",
        options: { type: "word_order", items: ["Seit", "wann", "haben", "Sie", "Schmerzen?"] },
        correct_answer: "Seit wann haben Sie Schmerzen?",
        question_type: "word_order",
      },
      // 7. Quiz — Anfrage beginnen
      {
        question: "Du schreibst eine Anfrage an ein Hotel. Wie beginnst du?",
        options: { type: "quiz", items: ["Hallo, was geht?", "Hey, ich brauche ein Zimmer!", "Sehr geehrte Damen und Herren,", "Lieber Freund,"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      // 8. Fill_blank — Anfrage
      {
        question: "Sehr geehrte Damen und Herren, ich möchte ein Zimmer ___. (rezervisati) Können Sie mir bitte ___ schicken? (informacije)",
        options: { type: "fill_blank", items: ["reservieren", "Informationen", "buchen", "Preise"] },
        correct_answer: "reservieren, Informationen",
        question_type: "fill_blank",
      },
      // 9. Fill_blank — Mit freundlichen Grüßen
      {
        question: "Završi formalni pozdrav na kraju mejla: Mit ___ ___",
        options: { type: "fill_blank", items: ["freundlichen", "Grüßen", "lieben", "besten"] },
        correct_answer: "freundlichen, Grüßen",
        question_type: "fill_blank",
      },
      // 10. Match_pairs — Körperteile 2
      {
        question: "Spoji:",
        options: { type: "match_pairs", items: [
          { de: "der Rücken", sr: "leđa" },
          { de: "die Hand", sr: "šaka" },
          { de: "der Finger", sr: "prst" },
          { de: "das Knie", sr: "koleno" },
          { de: "die Schulter", sr: "rame" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      // 11. Quiz — unsere
      {
        question: '"Unsere Wohnung ist sehr groß." — Šta znači unsere?',
        options: { type: "quiz", items: ["njihov", "vaš", "naš", "njen"] },
        correct_answer: "2",
        question_type: "quiz",
      },
    ],
  },
  4: {
    title: "Test Modul 4",
    questions: [
      // 1. Quiz — Am Schalter
      {
        question: "Am Schalter. Du möchtest eine Fahrkarte kaufen. Was sagst du?",
        options: { type: "quiz", items: ["Ich hätte gern einen Kaffee.", "Ich hätte gern eine Fahrkarte nach München.", "Ich suche den Bahnhof.", "Wann ist das Konzert?"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      // 2. Fill_blank — Dativ Artikel
      {
        question: "Ich gebe ___ Frau eine Blume. (toj) Er hilft ___ Kind. (tom)",
        options: { type: "fill_blank", items: ["der", "dem", "die", "das"] },
        correct_answer: "der, dem",
        question_type: "fill_blank",
      },
      // 3. Quiz — meinem
      {
        question: '"Ich schenke ___ Bruder ein Buch."',
        options: { type: "quiz", items: ["mein", "meinem", "meinen", "meine"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      // 4. Match_pairs — predlozi
      {
        question: "Spoji predloge sa prevodom:",
        options: { type: "match_pairs", items: [
          { de: "vor", sr: "ispred" },
          { de: "hinter", sr: "iza" },
          { de: "neben", sr: "pored" },
          { de: "zwischen", sr: "između" },
          { de: "über", sr: "iznad" },
          { de: "unter", sr: "ispod" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      // 5. Quiz — unter
      {
        question: 'Wo ist die Katze? "Die Katze ist ___ dem Tisch." (mačka je ispod stola)',
        options: { type: "quiz", items: ["auf", "neben", "unter", "hinter"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      // 6. Fill_blank — predlozi
      {
        question: "Die Lampe hängt ___ dem Tisch. (iznad) Das Bild ist ___ der Tür. (pored)",
        options: { type: "fill_blank", items: ["über", "neben", "unter", "vor"] },
        correct_answer: "über, neben",
        question_type: "fill_blank",
      },
      // 7. Fill_blank — predlozi 2
      {
        question: "Das Buch liegt ___ dem Tisch. (na) Die Katze schläft ___ dem Sofa. (ispod)",
        options: { type: "fill_blank", items: ["auf", "unter", "neben", "hinter"] },
        correct_answer: "auf, unter",
        question_type: "fill_blank",
      },
      // 8. Quiz — Am Schalter dijalog
      {
        question: 'Am Schalter. Der Mann sagt: "Der Zug nach Wien fährt um 14:30 Uhr ab." Was fragt der Kunde danach?',
        options: { type: "quiz", items: ["Wo ist das Hotel?", "Was kostet das Essen?", "Von welchem Gleis fährt er ab?", "Wie heißen Sie?"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      // 9. Fill_blank — Dativ lične zamenice
      {
        question: "Kannst du ___ helfen? (meni) Ich gebe ___ das Geld morgen zurück. (tebi)",
        options: { type: "fill_blank", items: ["mir", "dir", "ihm", "ihr"] },
        correct_answer: "mir, dir",
        question_type: "fill_blank",
      },
      // 10. Match_pairs — Am Schalter vokabular
      {
        question: "Spoji:",
        options: { type: "match_pairs", items: [
          { de: "die Fahrkarte", sr: "karta" },
          { de: "der Schalter", sr: "šalter" },
          { de: "das Gleis", sr: "peron" },
          { de: "die Abfahrt", sr: "polazak" },
          { de: "die Ankunft", sr: "dolazak" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      // 11. Quiz — der Lehrerin (Dativ)
      {
        question: '"Ich gebe es ___ Lehrerin."',
        options: { type: "quiz", items: ["die", "der", "den", "das"] },
        correct_answer: "1",
        question_type: "quiz",
      },
    ],
  },
  5: {
    title: "Test Modul 5",
    questions: [
      // 1. Match_pairs — Kleidung
      {
        question: "Spoji:",
        options: { type: "match_pairs", items: [
          { de: "die Hose", sr: "pantalone" },
          { de: "das Kleid", sr: "haljina" },
          { de: "der Pullover", sr: "džemper" },
          { de: "die Jacke", sr: "jakna" },
          { de: "der Schuh", sr: "cipela" },
          { de: "der Rock", sr: "suknja" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      // 2. Quiz — im Geschäft
      {
        question: 'Im Geschäft. Du suchst ein Geschenk für deine Schwester. Die Verkäuferin fragt: "Was suchen Sie?" Was sagst du?',
        options: { type: "quiz", items: ["Ich suche den Bahnhof.", "Ich suche ein Kleid für meine Schwester.", "Ich möchte eine Fahrkarte.", "Ich brauche einen Arzt."] },
        correct_answer: "1",
        question_type: "quiz",
      },
      // 3. Fill_blank — gefällt mir / meiner Schwester
      {
        question: "Die Jacke gefällt ___. (meni) Ich kaufe sie ___ Schwester. (mojoj)",
        options: { type: "fill_blank", items: ["mir", "meiner", "mich", "meine"] },
        correct_answer: "mir, meiner",
        question_type: "fill_blank",
      },
      // 4. Quiz — mir (Wie steht mir)
      {
        question: '"Wie steht ___ das Kleid?" — fragt Anna ihre Freundin.',
        options: { type: "quiz", items: ["ich", "mich", "mir", "mein"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      // 5. Fill_blank — ihr/ihm
      {
        question: "Kannst du ___ helfen? (njoj) Ich habe ___ gestern eine Nachricht geschickt. (njemu)",
        options: { type: "fill_blank", items: ["ihr", "ihm", "sie", "ihn"] },
        correct_answer: "ihr, ihm",
        question_type: "fill_blank",
      },
      // 6. Quiz — Ihnen
      {
        question: 'Im Geschäft. Die Verkäuferin fragt: "Kann ich ___ helfen?"',
        options: { type: "quiz", items: ["Sie", "Ihnen", "Ihr", "du"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      // 7. Match_pairs — Dativ lične zamenice
      {
        question: "Spoji:",
        options: { type: "match_pairs", items: [
          { de: "mir", sr: "meni" },
          { de: "dir", sr: "tebi" },
          { de: "ihm", sr: "njemu" },
          { de: "ihr", sr: "njoj" },
          { de: "uns", sr: "nama" },
          { de: "ihnen", sr: "njima" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      // 8. Fill_blank — ihn/uns
      {
        question: "Der Rock ist zu groß. Haben Sie ___ in Größe 36? (njega) Die Schuhe gefallen ___. (nama)",
        options: { type: "fill_blank", items: ["ihn", "uns", "ihm", "mir"] },
        correct_answer: "ihn, uns",
        question_type: "fill_blank",
      },
      // 9. Quiz — mir (passt mir nicht)
      {
        question: '"Das T-Shirt passt ___ nicht. Es ist zu klein."',
        options: { type: "quiz", items: ["mich", "ich", "mein", "mir"] },
        correct_answer: "3",
        question_type: "quiz",
      },
      // 10. Quiz — anprobieren
      {
        question: "Du bist im Geschäft. Du möchtest die Hose anprobieren. Was sagst du?",
        options: { type: "quiz", items: ["Ich nehme den Rock.", "Das ist zu teuer.", "Kann ich die Hose anprobieren?", "Wo ist der Bahnhof?"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      // 11. Fill_blank — dir/ihr
      {
        question: "Ich schenke ___ ein Buch. (tebi) Er gibt ___ die Blumen. (njoj)",
        options: { type: "fill_blank", items: ["dir", "ihr", "ihm", "mir"] },
        correct_answer: "dir, ihr",
        question_type: "fill_blank",
      },
      // 12. Fill_blank — Perfekt (gekauft/getragen)
      {
        question: "Gestern habe ich eine neue Hose ___. (kupiti) Meine Freundin hat ein schönes Kleid ___. (nositi)",
        options: { type: "fill_blank", items: ["gekauft", "getragen", "gemacht", "genommen"] },
        correct_answer: "gekauft, getragen",
        question_type: "fill_blank",
      },
    ],
  },
  6: {
    title: "Test Modul 6",
    questions: [
      // 1. Quiz — Geburtstag
      {
        question: "Dein Freund hat Geburtstag. Was sagst du?",
        options: { type: "quiz", items: ["Gute Besserung!", "Viel Erfolg!", "Herzlichen Glückwunsch zum Geburtstag!", "Frohe Ostern!"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      // 2. Fill_blank — wo/wohin
      {
        question: "___ arbeitest du? (gde) ___ fährst du im Sommer? (kuda)",
        options: { type: "fill_blank", items: ["Wo", "Wohin", "Woher", "Wann"] },
        correct_answer: "Wo, Wohin",
        question_type: "fill_blank",
      },
      // 3. Quiz — denn
      {
        question: '"Ich lerne Deutsch, ___ ich möchte in Wien studieren."',
        options: { type: "quiz", items: ["oder", "und", "aber", "denn"] },
        correct_answer: "3",
        question_type: "quiz",
      },
      // 4. Match_pairs — ADUSO
      {
        question: "Spoji:",
        options: { type: "match_pairs", items: [
          { de: "aber", sr: "ali" },
          { de: "denn", sr: "jer" },
          { de: "und", sr: "i" },
          { de: "sondern", sr: "nego/već" },
          { de: "oder", sr: "ili" },
        ]},
        correct_answer: "all",
        question_type: "match_pairs",
      },
      // 5. Fill_blank — aber/sondern
      {
        question: "Ich spreche kein Englisch, ___ ich spreche Deutsch. (ali) Er kommt nicht heute, ___ morgen. (nego)",
        options: { type: "fill_blank", items: ["aber", "sondern", "denn", "und"] },
        correct_answer: "aber, sondern",
        question_type: "fill_blank",
      },
      // 6. Quiz — sondern
      {
        question: 'Was passt? "Er kommt nicht heute, ___ morgen."',
        options: { type: "quiz", items: ["aber", "sondern", "denn", "und"] },
        correct_answer: "1",
        question_type: "quiz",
      },
      // 7. Quiz — E-Mail an Lehrer
      {
        question: "Du schreibst eine E-Mail an deinen Lehrer. Wie beginnst du?",
        options: { type: "quiz", items: ["Hey, was geht?", "Sehr geehrte Damen und Herren,", "Lieber Herr Müller,", "Hallo Alter,"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      // 8. Fill_blank — denn/wann
      {
        question: "Ich schreibe Ihnen, ___ ich eine Frage habe. (jer) Ich möchte wissen, ___ der Kurs beginnt. (kada)",
        options: { type: "fill_blank", items: ["denn", "wann", "weil", "wie"] },
        correct_answer: "denn, wann",
        question_type: "fill_blank",
      },
      // 9. Quiz — formelle E-Mail Ende
      {
        question: "Wie beendest du eine formelle E-Mail?",
        options: { type: "quiz", items: ["Tschüss!", "Bis bald!", "Mit freundlichen Grüßen", "Bussi!"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      // 10. Quiz — Wann beginnt der Kurs
      {
        question: 'Welche Frage passt zur Antwort: "Um 8 Uhr."',
        options: { type: "quiz", items: ["Wo ist der Kurs?", "Wie lange dauert der Kurs?", "Wann beginnt der Kurs?", "Warum lernst du Deutsch?"] },
        correct_answer: "2",
        question_type: "quiz",
      },
      // 11. Fill_blank — und/aber
      {
        question: "Ich möchte Deutsch lernen ___ ich arbeite in Österreich. (i) Der Kurs ist gut, ___ er ist teuer. (ali)",
        options: { type: "fill_blank", items: ["und", "aber", "denn", "oder"] },
        correct_answer: "und, aber",
        question_type: "fill_blank",
      },
    ],
  },
};

// Essay questions for Module 3 and Module 6
const ESSAY_QUESTIONS: Record<number, Question> = {
  3: {
    question: "Du möchtest im Juli nach Wien fahren. Schreibe eine E-Mail an das Hotel und frage nach einem Zimmer. Schreibe: Wann kommst du? Wie lange bleibst du? Was möchtest du wissen? (3-5 Sätze)",
    options: null,
    correct_answer: "",
    question_type: "listen_write",
  },
  6: {
    question: "Du kannst nächste Woche nicht zum Kurs kommen. Schreibe eine E-Mail an deine Sprachschule. Schreibe: Warum kannst du nicht kommen? Wann kommst du wieder? Bitte um Materialien. (4-6 Sätze)",
    options: null,
    correct_answer: "",
    question_type: "listen_write",
  },
};

// ── Main ──────────────────────────────────────

async function importA12Tests() {
  // Find A1.2 course
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", "nemacki-a1-2")
    .single();

  if (!course) {
    console.error("A1.2 course not found!");
    return;
  }

  // Get all A1.2 lessons
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .eq("course_id", course.id)
    .order("order_index");

  if (!lessons) {
    console.error("No lessons found!");
    return;
  }

  console.log(`\nFound ${lessons.length} lessons in A1.2\n`);

  // Find test lessons (they have "Test" in the title and match module numbers)
  // Test Modul 1 is at order_index 5, Test Modul 2 at 9, etc.
  const testLessons: Record<number, { id: string; title: string }> = {};

  for (const lesson of lessons) {
    const match = lesson.title.match(/Test.*Modul\s*(\d)/i) || lesson.title.match(/Modul\s*(\d).*Test/i);
    if (match) {
      const modulNum = parseInt(match[1]);
      testLessons[modulNum] = { id: lesson.id, title: lesson.title };
    }
  }

  console.log("Test lessons found:");
  for (const [mod, lesson] of Object.entries(testLessons)) {
    console.log(`  Modul ${mod}: ${lesson.title} (${lesson.id})`);
  }
  console.log("");

  let totalExercises = 0;
  let totalQuestions = 0;

  for (const [modulStr, testData] of Object.entries(MODULE_TESTS)) {
    const modul = parseInt(modulStr);
    const testLesson = testLessons[modul];

    if (!testLesson) {
      console.log(`  ✗ Modul ${modul}: test lesson not found, skipping`);
      continue;
    }

    // Check if exercise already exists
    const { data: existing } = await supabase
      .from("exercises")
      .select("id")
      .eq("lesson_id", testLesson.id)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`  ⊘ Modul ${modul}: already has exercises, skipping`);
      continue;
    }

    // Create main quiz exercise
    const { data: exercise, error } = await supabase
      .from("exercises")
      .insert({
        lesson_id: testLesson.id,
        title: testData.title,
        exercise_type: "quiz",
        order_index: 0,
      })
      .select("id")
      .single();

    if (error || !exercise) {
      console.error(`  ✗ Modul ${modul}:`, error?.message);
      continue;
    }

    // Insert questions
    for (let i = 0; i < testData.questions.length; i++) {
      const q = testData.questions[i];
      await supabase.from("exercise_questions").insert({
        exercise_id: exercise.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation || null,
        order_index: i,
      });
      totalQuestions++;
    }

    totalExercises++;
    console.log(`  ✓ Modul ${modul}: ${testData.questions.length} pitanja`);

    // Add essay if this module has one
    if (ESSAY_QUESTIONS[modul]) {
      const essayQ = ESSAY_QUESTIONS[modul];

      const { data: essayExercise } = await supabase
        .from("exercises")
        .insert({
          lesson_id: testLesson.id,
          title: `Esej — Modul ${modul}`,
          exercise_type: "listen_write",
          order_index: 1,
        })
        .select("id")
        .single();

      if (essayExercise) {
        await supabase.from("exercise_questions").insert({
          exercise_id: essayExercise.id,
          question: essayQ.question,
          options: essayQ.options,
          correct_answer: essayQ.correct_answer,
          order_index: 0,
        });
        totalExercises++;
        totalQuestions++;
        console.log(`  ✓ Modul ${modul}: esej dodat`);
      }
    }
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  Vežbi kreirano: ${totalExercises}`);
  console.log(`  Pitanja ukupno: ${totalQuestions}`);
  console.log(`═══════════════════════════════════════\n`);
}

importA12Tests().catch(console.error);
```

- [ ] **Step 2: Run the import script**

```bash
cd /Users/natasahartweger/Documents/Claude/sajt/LMS/lms && npx tsx scripts/import-a12-tests.ts
```

Expected output: 6 modules with questions created, 2 essays added.

- [ ] **Step 3: Commit**

```bash
git add scripts/import-a12-tests.ts
git commit -m "feat: add A1.2 module test import script with 67 questions + 2 essays"
```

---

### Task 6: Verify everything works end-to-end

- [ ] **Step 1: Start dev server and verify test lessons have exercises**

```bash
cd /Users/natasahartweger/Documents/Claude/sajt/LMS/lms && npm run dev
```

Open a test lesson page and verify exercises appear with the correct question types.

- [ ] **Step 2: Test essay submission flow**

Navigate to a Module 3 or Module 6 test, find the essay exercise, submit a test essay. Verify:
- AI check is called
- Submission saved to `essay_submissions` with status `pending`
- Student sees "Tvoj esej je poslat na pregled"

- [ ] **Step 3: Test admin review page**

Navigate to `/admin/eseji`. Verify:
- Pending essay appears
- Can click "Pregledaj i oceni"
- Can edit feedback and score
- Can publish
- Student then sees professor feedback when revisiting the exercise

- [ ] **Step 4: Commit any fixes if needed**

