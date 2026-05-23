# Lesson Block System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace single-field lesson content with a flexible JSON block system that renders structured lessons (video, text, tables, formulas, spoilers, vocabulary, etc.)

**Architecture:** Add `sections jsonb` column to `lessons` table. Each lesson's sections array contains typed block objects. A `BlockRenderer` component maps each block to its React component. `LekcijaContent` checks for sections first, falls back to legacy rendering.

**Tech Stack:** Next.js 16, React 19, Supabase (PostgreSQL), Tailwind CSS 4, TypeScript

**Spec:** `docs/superpowers/specs/2026-05-22-lesson-blocks-design.md`

---

## File Structure

### New files
- `supabase/migrations/012_lesson_sections.sql` — add sections column
- `src/lib/section-types.ts` — TypeScript types for all 11 block types
- `src/components/lesson-blocks/BlockRenderer.tsx` — orchestrator
- `src/components/lesson-blocks/BadgeBlock.tsx`
- `src/components/lesson-blocks/VideoBlock.tsx`
- `src/components/lesson-blocks/TextBlock.tsx`
- `src/components/lesson-blocks/FormulaBlock.tsx`
- `src/components/lesson-blocks/TableBlock.tsx`
- `src/components/lesson-blocks/MistakesBlock.tsx`
- `src/components/lesson-blocks/SpoilerBlock.tsx`
- `src/components/lesson-blocks/VocabularyBlock.tsx`
- `src/components/lesson-blocks/PdfBlock.tsx`
- `src/components/lesson-blocks/ImageBlock.tsx`
- `src/components/lesson-blocks/LinkBlock.tsx`

### Modified files
- `src/lib/types.ts` — add Section type + sections to Lesson
- `src/components/LekcijaContent.tsx` — add sections check + BlockRenderer
- `src/app/globals.css` — add new theme colors (zelena, narandzasta, ljubicasta)

---

### Task 1: Database migration — add sections column

**Files:**
- Create: `supabase/migrations/012_lesson_sections.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/012_lesson_sections.sql`:

```sql
-- Add sections JSONB column to lessons
ALTER TABLE public.lessons ADD COLUMN sections jsonb DEFAULT '[]';

-- Add a comment explaining the column
COMMENT ON COLUMN public.lessons.sections IS 'Array of section blocks (badge, video, text, formula, table, mistakes, spoiler, vocabulary, pdf, image, link). When non-empty, takes precedence over legacy lesson_type/content/vimeo_video_id fields.';
```

- [ ] **Step 2: Commit**

```bash
git checkout -b feat/lesson-blocks
git add supabase/migrations/012_lesson_sections.sql
git commit -m "feat: add sections jsonb column to lessons table"
```

---

### Task 2: TypeScript types for section blocks

**Files:**
- Create: `src/lib/section-types.ts`
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Create section types file**

Create `src/lib/section-types.ts`:

```ts
export type BadgeCategory = "grammatik" | "lesen" | "hoeren" | "schreiben";
export type TextStyle = "default" | "beispiele" | "uebung" | "info";
export type LinkType = "kviz" | "quizlet" | "pdf" | "dw" | "external";

export interface BadgeSection {
  type: "badge";
  module: string;
  category: BadgeCategory;
}

export interface VideoSection {
  type: "video";
  vimeoId: string;
}

export interface TextSection {
  type: "text";
  content: string;
  style?: TextStyle;
}

export interface FormulaSection {
  type: "formula";
  content: string;
}

export interface TableSection {
  type: "table";
  headers: string[];
  rows: string[][];
}

export interface MistakesSection {
  type: "mistakes";
  items: {
    wrong: string;
    correct: string;
    explanation?: string;
  }[];
}

export interface SpoilerSection {
  type: "spoiler";
  title?: string;
  items: {
    question: string;
    answer: string;
  }[];
}

export interface VocabularySection {
  type: "vocabulary";
  rows: string[][];
}

export interface PdfSection {
  type: "pdf";
  url: string;
  label?: string;
}

export interface ImageSection {
  type: "image";
  url: string;
  alt: string;
  caption?: string;
}

export interface LinkSection {
  type: "link";
  linkType: LinkType;
  href: string;
  label?: string;
}

export type Section =
  | BadgeSection
  | VideoSection
  | TextSection
  | FormulaSection
  | TableSection
  | MistakesSection
  | SpoilerSection
  | VocabularySection
  | PdfSection
  | ImageSection
  | LinkSection;
```

- [ ] **Step 2: Update Lesson interface in types.ts**

In `src/lib/types.ts`, add the import and update the Lesson interface:

Add at top of file:
```ts
import type { Section } from "./section-types";
```

Update Lesson interface — add `sections` field after `is_free_preview`:
```ts
export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  lesson_type: LessonType;
  content: string;
  vimeo_video_id: string | null;
  order_index: number;
  is_free_preview: boolean;
  sections: Section[] | null;
  created_at: string;
}
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/natasahartweger/Documents/Claude/lms/lms && npx next build 2>&1 | tail -20`

Expected: Build succeeds (or only pre-existing warnings)

- [ ] **Step 4: Commit**

```bash
git add src/lib/section-types.ts src/lib/types.ts
git commit -m "feat: add TypeScript types for lesson section blocks"
```

---

### Task 3: Theme colors

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add new colors to globals.css**

In `src/app/globals.css`, add these lines inside the `@theme { }` block, after the existing koral colors:

```css
  --color-zelena: #34A853;
  --color-zelena-light: #f0faf3;
  --color-narandzasta: #FF9800;
  --color-narandzasta-light: #fff8f0;
  --color-ljubicasta: #7C4DFF;
  --color-ljubicasta-light: #f5f0ff;
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add zelena, narandzasta, ljubicasta theme colors"
```

---

### Task 4: BadgeBlock component

**Files:**
- Create: `src/components/lesson-blocks/BadgeBlock.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/lesson-blocks/BadgeBlock.tsx`:

```tsx
import type { BadgeSection, BadgeCategory } from "@/lib/section-types";

const categoryStyles: Record<BadgeCategory, string> = {
  grammatik: "bg-plava",
  lesen: "bg-zelena",
  hoeren: "bg-ljubicasta",
  schreiben: "bg-koral",
};

const categoryLabels: Record<BadgeCategory, string> = {
  grammatik: "Gramatika",
  lesen: "Lesen",
  hoeren: "Horen",
  schreiben: "Schreiben",
};

export default function BadgeBlock({ module, category }: BadgeSection) {
  return (
    <span
      className={`inline-block text-white text-xs font-bold px-3 py-1 rounded-full ${categoryStyles[category]}`}
    >
      {module} · {categoryLabels[category]}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/lesson-blocks/BadgeBlock.tsx
git commit -m "feat: add BadgeBlock component"
```

---

### Task 5: VideoBlock component

**Files:**
- Create: `src/components/lesson-blocks/VideoBlock.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/lesson-blocks/VideoBlock.tsx`:

```tsx
import type { VideoSection } from "@/lib/section-types";
import VideoPlayer from "@/components/VideoPlayer";

export default function VideoBlock({ vimeoId }: VideoSection) {
  return (
    <div className="my-4 rounded-xl overflow-hidden shadow-sm">
      <VideoPlayer vimeoId={vimeoId} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/lesson-blocks/VideoBlock.tsx
git commit -m "feat: add VideoBlock component"
```

---

### Task 6: TextBlock component

**Files:**
- Create: `src/components/lesson-blocks/TextBlock.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/lesson-blocks/TextBlock.tsx`:

```tsx
import type { TextSection, TextStyle } from "@/lib/section-types";

const styleClasses: Record<TextStyle, string> = {
  default: "border-l-4 border-plava bg-gray-50",
  beispiele: "border-l-4 border-zelena bg-zelena-light",
  uebung: "border-l-4 border-koral bg-koral-light",
  info: "bg-white",
};

function formatContent(text: string): string {
  if (!text) return "";
  if (text.includes("<p>") || text.includes("<h") || text.includes("<div")) {
    return text;
  }
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-plava hover:underline">$1</a>')
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
  return `<p>${html}</p>`;
}

export default function TextBlock({ content, style = "default" }: TextSection) {
  return (
    <div className={`rounded-xl p-5 md:p-6 ${styleClasses[style]}`}>
      <div
        className="prose prose-gray max-w-none text-gray-700 leading-relaxed
          prose-headings:text-gray-900 prose-a:text-plava prose-strong:text-gray-900"
        dangerouslySetInnerHTML={{ __html: formatContent(content) }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/lesson-blocks/TextBlock.tsx
git commit -m "feat: add TextBlock component"
```

---

### Task 7: FormulaBlock component

**Files:**
- Create: `src/components/lesson-blocks/FormulaBlock.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/lesson-blocks/FormulaBlock.tsx`:

```tsx
import type { FormulaSection } from "@/lib/section-types";

export default function FormulaBlock({ content }: FormulaSection) {
  return (
    <div className="bg-plava-light border-2 border-dashed border-plava rounded-lg p-4 md:p-5 text-center font-mono text-gray-900 leading-relaxed">
      {content.split("\n").map((line, i) => (
        <span key={i}>
          {line}
          {i < content.split("\n").length - 1 && <br />}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/lesson-blocks/FormulaBlock.tsx
git commit -m "feat: add FormulaBlock component"
```

---

### Task 8: TableBlock component

**Files:**
- Create: `src/components/lesson-blocks/TableBlock.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/lesson-blocks/TableBlock.tsx`:

```tsx
import type { TableSection } from "@/lib/section-types";

export default function TableBlock({ headers, rows }: TableSection) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="bg-plava text-white px-4 py-2.5 text-left font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 1 ? "bg-gray-50" : "bg-white"}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-4 py-2.5 border-b border-gray-100 ${
                    ci === 0 ? "font-semibold text-gray-900" : "text-gray-500 italic"
                  }`}
                  dangerouslySetInnerHTML={{ __html: cell }}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/lesson-blocks/TableBlock.tsx
git commit -m "feat: add TableBlock component"
```

---

### Task 9: MistakesBlock component

**Files:**
- Create: `src/components/lesson-blocks/MistakesBlock.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/lesson-blocks/MistakesBlock.tsx`:

```tsx
import type { MistakesSection } from "@/lib/section-types";

export default function MistakesBlock({ items }: MistakesSection) {
  return (
    <div className="border-l-4 border-koral bg-koral-light rounded-xl p-5 md:p-6 space-y-3">
      <h4 className="font-semibold text-gray-900">Tipicne greske</h4>
      {items.map((item, i) => (
        <div key={i}>
          <p>
            <span className="line-through text-red-600 opacity-70">
              {item.wrong}
            </span>
            <span className="mx-2 text-gray-400">&rarr;</span>
            <span className="text-green-700 font-bold">{item.correct}</span>
          </p>
          {item.explanation && (
            <p className="text-xs text-gray-500 mt-1">{item.explanation}</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/lesson-blocks/MistakesBlock.tsx
git commit -m "feat: add MistakesBlock component"
```

---

### Task 10: SpoilerBlock component

**Files:**
- Create: `src/components/lesson-blocks/SpoilerBlock.tsx`

- [ ] **Step 1: Create the component**

This is a client component because it uses useState for toggle.

Create `src/components/lesson-blocks/SpoilerBlock.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { SpoilerSection } from "@/lib/section-types";

function SpoilerItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="w-full text-left bg-gray-100 hover:bg-gray-200 rounded-lg p-3 md:p-4 transition-colors"
    >
      <p className="text-sm text-gray-700">{question}</p>
      {open && (
        <p className="mt-2 pt-2 border-t border-gray-300 text-green-700 font-bold text-sm">
          {answer}
        </p>
      )}
      {!open && (
        <p className="mt-1 text-xs text-gray-400">Klikni za resenje</p>
      )}
    </button>
  );
}

export default function SpoilerBlock({ title, items }: SpoilerSection) {
  return (
    <div className="border-l-4 border-koral bg-koral-light rounded-xl p-5 md:p-6">
      {title && (
        <h4 className="font-semibold text-gray-900 mb-3">{title}</h4>
      )}
      <div className="space-y-2">
        {items.map((item, i) => (
          <SpoilerItem key={i} question={item.question} answer={item.answer} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/lesson-blocks/SpoilerBlock.tsx
git commit -m "feat: add SpoilerBlock component"
```

---

### Task 11: VocabularyBlock component

**Files:**
- Create: `src/components/lesson-blocks/VocabularyBlock.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/lesson-blocks/VocabularyBlock.tsx`:

```tsx
import type { VocabularySection } from "@/lib/section-types";

export default function VocabularyBlock({ rows }: VocabularySection) {
  return (
    <div className="border-l-4 border-narandzasta bg-narandzasta-light rounded-xl p-5 md:p-6">
      <h4 className="font-semibold text-gray-900 mb-3">Vokabular</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left px-3 py-2 text-gray-500 font-medium border-b border-orange-200">
                Nemacki
              </th>
              <th className="text-left px-3 py-2 text-gray-500 font-medium border-b border-orange-200">
                Srpski
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 1 ? "bg-white/50" : ""}>
                <td className="px-3 py-2 font-semibold text-gray-900">
                  {row[0]}
                </td>
                <td className="px-3 py-2 text-gray-500 italic">{row[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/lesson-blocks/VocabularyBlock.tsx
git commit -m "feat: add VocabularyBlock component"
```

---

### Task 12: PdfBlock component

**Files:**
- Create: `src/components/lesson-blocks/PdfBlock.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/lesson-blocks/PdfBlock.tsx`:

```tsx
import type { PdfSection } from "@/lib/section-types";

export default function PdfBlock({ url, label }: PdfSection) {
  return (
    <div>
      <div className="rounded-xl overflow-hidden border border-gray-100">
        <iframe
          src={url}
          className="w-full hidden md:block"
          style={{ height: "600px" }}
          title={label || "PDF dokument"}
        />
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mt-3 text-sm text-plava hover:underline"
      >
        Otvori PDF u novom prozoru
      </a>
      {/* Mobile: show only link, no iframe */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="md:hidden block mt-2 bg-red-600 text-white text-center py-3 rounded-lg text-sm font-semibold"
      >
        {label || "Otvori PDF"}
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/lesson-blocks/PdfBlock.tsx
git commit -m "feat: add PdfBlock component"
```

---

### Task 13: ImageBlock component

**Files:**
- Create: `src/components/lesson-blocks/ImageBlock.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/lesson-blocks/ImageBlock.tsx`:

```tsx
import type { ImageSection } from "@/lib/section-types";

export default function ImageBlock({ url, alt, caption }: ImageSection) {
  return (
    <figure>
      <img
        src={url}
        alt={alt}
        className="w-full max-h-[500px] object-contain rounded-xl"
      />
      {caption && (
        <figcaption className="text-center text-xs text-gray-400 mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/lesson-blocks/ImageBlock.tsx
git commit -m "feat: add ImageBlock component"
```

---

### Task 14: LinkBlock component

**Files:**
- Create: `src/components/lesson-blocks/LinkBlock.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/lesson-blocks/LinkBlock.tsx`:

```tsx
import Link from "next/link";
import type { LinkSection, LinkType } from "@/lib/section-types";

const linkStyles: Record<LinkType, string> = {
  kviz: "bg-koral hover:bg-koral-dark text-white",
  quizlet: "bg-[#4257B2] hover:bg-[#3a4d9e] text-white",
  pdf: "bg-red-600 hover:bg-red-700 text-white",
  dw: "bg-gray-900 hover:bg-gray-800 text-white",
  external: "bg-gray-100 hover:bg-gray-200 text-gray-700",
};

const defaultLabels: Record<LinkType, string> = {
  kviz: "Uradi kviz",
  quizlet: "Vezba na Quizlet",
  pdf: "Otvori PDF",
  dw: "Deutsche Welle",
  external: "Otvori link",
};

export default function LinkBlock({ linkType, href, label }: LinkSection) {
  const isInternal = href.startsWith("/");
  const classes = `inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${linkStyles[linkType]}`;

  if (isInternal) {
    return (
      <Link href={href} className={classes}>
        {label || defaultLabels[linkType]}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
    >
      {label || defaultLabels[linkType]}
    </a>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/lesson-blocks/LinkBlock.tsx
git commit -m "feat: add LinkBlock component"
```

---

### Task 15: BlockRenderer + LekcijaContent integration

**Files:**
- Create: `src/components/lesson-blocks/BlockRenderer.tsx`
- Modify: `src/components/LekcijaContent.tsx`

- [ ] **Step 1: Create BlockRenderer**

Create `src/components/lesson-blocks/BlockRenderer.tsx`:

```tsx
import type { Section } from "@/lib/section-types";
import BadgeBlock from "./BadgeBlock";
import VideoBlock from "./VideoBlock";
import TextBlock from "./TextBlock";
import FormulaBlock from "./FormulaBlock";
import TableBlock from "./TableBlock";
import MistakesBlock from "./MistakesBlock";
import SpoilerBlock from "./SpoilerBlock";
import VocabularyBlock from "./VocabularyBlock";
import PdfBlock from "./PdfBlock";
import ImageBlock from "./ImageBlock";
import LinkBlock from "./LinkBlock";

function renderBlock(section: Section, index: number) {
  switch (section.type) {
    case "badge":
      return <BadgeBlock key={index} {...section} />;
    case "video":
      return <VideoBlock key={index} {...section} />;
    case "text":
      return <TextBlock key={index} {...section} />;
    case "formula":
      return <FormulaBlock key={index} {...section} />;
    case "table":
      return <TableBlock key={index} {...section} />;
    case "mistakes":
      return <MistakesBlock key={index} {...section} />;
    case "spoiler":
      return <SpoilerBlock key={index} {...section} />;
    case "vocabulary":
      return <VocabularyBlock key={index} {...section} />;
    case "pdf":
      return <PdfBlock key={index} {...section} />;
    case "image":
      return <ImageBlock key={index} {...section} />;
    case "link":
      return <LinkBlock key={index} {...section} />;
    default:
      return null;
  }
}

export default function BlockRenderer({ sections }: { sections: Section[] }) {
  return (
    <div className="space-y-4">
      {sections.map((section, i) => renderBlock(section, i))}
    </div>
  );
}
```

- [ ] **Step 2: Update LekcijaContent to use BlockRenderer**

Replace the entire content of `src/components/LekcijaContent.tsx` with:

```tsx
import VideoPlayer from "./VideoPlayer";
import BlockRenderer from "./lesson-blocks/BlockRenderer";
import type { Lesson } from "@/lib/types";
import type { Section } from "@/lib/section-types";

function RichText({ content }: { content: string }) {
  return (
    <div
      className="prose prose-gray max-w-none text-gray-700 leading-relaxed
        prose-headings:text-gray-900 prose-a:text-plava prose-a:no-underline hover:prose-a:underline
        prose-strong:text-gray-900 prose-img:rounded-xl"
      dangerouslySetInnerHTML={{ __html: formatContent(content) }}
    />
  );
}

function formatContent(text: string): string {
  if (!text) return "";
  if (text.includes("<p>") || text.includes("<h") || text.includes("<div")) {
    return text;
  }
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
  return `<p>${html}</p>`;
}

export default function LekcijaContent({ lesson }: { lesson: Lesson }) {
  // New block system — takes precedence when sections exist
  const sections = lesson.sections as Section[] | null;
  if (sections && sections.length > 0) {
    return <BlockRenderer sections={sections} />;
  }

  // Legacy rendering — fallback for old lessons
  switch (lesson.lesson_type) {
    case "video":
      return (
        <div>
          {lesson.vimeo_video_id && (
            <VideoPlayer vimeoId={lesson.vimeo_video_id} />
          )}
          {lesson.content && (
            <div className="mt-6">
              <RichText content={lesson.content} />
            </div>
          )}
        </div>
      );

    case "pdf":
      return (
        <div>
          {lesson.content && lesson.content.startsWith("http") ? (
            <div>
              <div className="rounded-xl overflow-hidden border border-gray-100 mb-4">
                <iframe
                  src={lesson.content}
                  width="100%"
                  className="w-full hidden md:block"
                  style={{ height: "600px" }}
                />
              </div>
              <a
                href={lesson.content}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-plava hover:underline"
              >
                Otvori u novom prozoru
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8">
              <RichText content={lesson.content} />
            </div>
          )}
        </div>
      );

    case "image":
      return (
        <div>
          <img
            src={lesson.content}
            alt={lesson.title}
            className="w-full rounded-xl"
          />
        </div>
      );

    case "text":
      return (
        <div className="bg-white rounded-xl p-5 md:p-8">
          {lesson.content ? (
            <RichText content={lesson.content} />
          ) : (
            <p className="text-gray-400 italic">Sadrzaj ove lekcije ce uskoro biti dostupan.</p>
          )}
        </div>
      );

    default:
      return <p className="text-gray-400">Nepoznat tip lekcije.</p>;
  }
}
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/natasahartweger/Documents/Claude/lms/lms && npx next build 2>&1 | tail -20`

Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/components/lesson-blocks/BlockRenderer.tsx src/components/LekcijaContent.tsx
git commit -m "feat: add BlockRenderer and integrate with LekcijaContent"
```

---

### Task 16: Create PR

- [ ] **Step 1: Push branch and create PR**

```bash
git push -u origin feat/lesson-blocks
gh pr create --title "feat: lesson block system" --body "$(cat <<'EOF'
## Summary
- Add `sections` JSONB column to lessons table
- Add 11 block components (badge, video, text, formula, table, mistakes, spoiler, vocabulary, pdf, image, link)
- BlockRenderer orchestrates block rendering
- LekcijaContent checks for sections first, falls back to legacy rendering
- New theme colors (zelena, narandzasta, ljubicasta)

## Test plan
- [ ] Run `next build` — no errors
- [ ] Create a test lesson with sections JSON in Supabase
- [ ] Verify each block type renders correctly
- [ ] Test responsive on mobile viewport
- [ ] Verify legacy lessons still render correctly

Generated with Claude Code
EOF
)"
```
