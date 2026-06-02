# WP Video/Specijalni Kursevi — Migracija — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prebaciti sadržaj (lekcije + kvizovi) 5 kurseva sa WP/LearnDash-a u novi LMS — dvofazno: ekstrakcija u JSON međufajl, ručni review, pa upis u Supabase.

**Architecture:** Tri TS modula u `scripts/wp-migrate/` (fetch, parser, quiz-mapper) koje koriste dve CLI skripte: `extract-wp-course.ts` (WP → `scripts/wp-content/<slug>.json` + `.review.md`) i `apply-wp-course.ts` (JSON → Supabase). Idempotentno po kursu.

**Tech Stack:** TypeScript + tsx, `@supabase/supabase-js` (service-role), WP REST (`ldlms/v2`) preko fetch + Basic Auth, `node-html-parser` za HTML→sekcije.

---

## File Structure

- `scripts/wp-migrate/wp-client.ts` — WP REST fetch (Basic Auth, steps, topic, questions)
- `scripts/wp-migrate/html-to-sections.ts` — HTML `content.rendered` → `Section[]`
- `scripts/wp-migrate/quiz-mapper.ts` — LearnDash pitanje → `{exercise_type, options, correct_answer}`
- `scripts/wp-migrate/types.ts` — međufajl tipovi (`CourseDump`, `LessonDump`, `ExerciseDump`)
- `scripts/extract-wp-course.ts` — Faza 1 (CLI)
- `scripts/apply-wp-course.ts` — Faza 2 (CLI)
- `scripts/wp-content/<slug>.json` — generisani međufajl (review artefakt)
- `scripts/wp-content/<slug>.review.md` — flagovi za ručni pregled

**Mapa slug → WP course id** (u `wp-client.ts`):
```
fsp:40305, polozi-fide:45501, gramatika-a2-b1:47790,
polozi-goethe-b1:31516, polozi-goethe-b2:31515
```

---

## Task 1: WP klijent + tipovi

**Files:**
- Create: `scripts/wp-migrate/types.ts`
- Create: `scripts/wp-migrate/wp-client.ts`

- [ ] **Step 1: Tipovi međufajla**

`scripts/wp-migrate/types.ts`:
```ts
export type Section =
  | { type: "badge"; module: string }
  | { type: "video"; vimeoId: string }
  | { type: "text"; content: string; style?: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "pdf"; url: string; label?: string }
  | { type: "image"; url: string; alt: string; caption?: string };

export interface ExerciseDump {
  title: string;
  exercise_type: "quiz" | "fill_blank" | "match_pairs" | "word_order" | "listen_write" | "essay";
  questions: {
    question: string;
    options: unknown;          // {type, items}
    correct_answer: string;
    explanation?: string;
    question_type: string;
  }[];
  needsReview?: string;        // razlog flaga
}

export interface LessonDump {
  wpLessonId: number;
  title: string;
  order_index: number;
  vimeo_video_id: string | null;
  sections: Section[];
  exercises: ExerciseDump[];
}

export interface CourseDump {
  slug: string;
  wpCourseId: number;
  lessons: LessonDump[];
  reviewNotes: string[];
}
```

- [ ] **Step 2: WP klijent**

`scripts/wp-migrate/wp-client.ts`:
```ts
const BASE = "https://www.hartweger.rs/wp-json/ldlms/v2";
const AUTH = "Basic " + Buffer.from("Nati:cEbg CO8J 1dPP olXw sK4W zDor").toString("base64");

export const COURSE_MAP: Record<string, number> = {
  "fsp": 40305, "polozi-fide": 45501, "gramatika-a2-b1": 47790,
  "polozi-goethe-b1": 31516, "polozi-goethe-b2": 31515,
};

async function wp(path: string): Promise<any> {
  const r = await fetch(`${BASE}${path}`, { headers: { Authorization: AUTH } });
  if (!r.ok) throw new Error(`WP ${path} → ${r.status}`);
  return r.json();
}

// Vrati uređenu listu lekcija sa njihovim temama (redosled iz steps)
export async function getCourseTree(courseId: number) {
  const steps = await wp(`/sfwd-courses/${courseId}/steps`);
  const lessons = steps?.h?.["sfwd-lessons"] ?? {};
  const out: { lessonId: number; topicIds: number[]; quizIds: number[] }[] = [];
  for (const [lid, node] of Object.entries<any>(lessons)) {
    const topics = node["sfwd-topic"];
    const topicIds = topics && !Array.isArray(topics) ? Object.keys(topics).map(Number) : [];
    const quizNode = node["sfwd-quiz"];
    const lessonQuizIds = quizNode && !Array.isArray(quizNode) ? Object.keys(quizNode).map(Number) : [];
    // teme mogu imati ugnježdene kvizove
    const topicQuizIds: number[] = [];
    if (topics && !Array.isArray(topics))
      for (const t of Object.values<any>(topics)) {
        const tq = t["sfwd-quiz"];
        if (tq && !Array.isArray(tq)) topicQuizIds.push(...Object.keys(tq).map(Number));
      }
    out.push({ lessonId: Number(lid), topicIds, quizIds: [...lessonQuizIds, ...topicQuizIds] });
  }
  return out;
}

export const getPost = (type: "sfwd-lessons" | "sfwd-topic", id: number) => wp(`/${type}/${id}`);
export const getQuizQuestions = (quizId: number) =>
  wp(`/sfwd-question?quiz=${quizId}&per_page=100`);
```

- [ ] **Step 3: Verifikacija (dim provera klijenta)**

Run: `cd LMS/lms && npx tsx -e "import('./scripts/wp-migrate/wp-client.ts').then(m=>m.getCourseTree(47790)).then(t=>console.log(JSON.stringify(t,null,1)))"`
Expected: lista lekcija sa `topicIds`/`quizIds` za Gramatiku (4 lekcije).

- [ ] **Step 4: Commit**

```bash
git add scripts/wp-migrate/types.ts scripts/wp-migrate/wp-client.ts
git commit -m "feat(migrate): WP REST klijent + tipovi za migraciju kurseva"
```

---

## Task 2: HTML → sekcije parser

**Files:**
- Create: `scripts/wp-migrate/html-to-sections.ts`

- [ ] **Step 1: Instaliraj node-html-parser ako fali**

Run: `cd LMS/lms && node -e "require.resolve('node-html-parser')" 2>/dev/null && echo OK || npm i node-html-parser`
Expected: `OK` ili instalacija.

- [ ] **Step 2: Parser**

`scripts/wp-migrate/html-to-sections.ts`:
```ts
import { parse, HTMLElement } from "node-html-parser";
import type { Section } from "./types";

const VIMEO_RE = /(?:player\.vimeo\.com\/video\/|vimeo\.com\/(?:video\/)?)(\d{6,})/;

function pdfUrlFrom(src: string): string | null {
  // wppdfemb: src=...?url=<encoded pdf>...
  const m = src.match(/[?&]url=([^&]+)/);
  if (m) return decodeURIComponent(m[1]);
  return src.endsWith(".pdf") ? src : null;
}

function htmlToMarkdown(el: HTMLElement): string {
  // jednostavna konverzija blokova u markdown
  let md = el.innerHTML
    .replace(/<\/(h[1-6])>/gi, "\n\n").replace(/<h2[^>]*>/gi, "## ").replace(/<h3[^>]*>/gi, "### ")
    .replace(/<strong[^>]*>|<b>/gi, "**").replace(/<\/strong>|<\/b>/gi, "**")
    .replace(/<em[^>]*>|<i>/gi, "_").replace(/<\/em>|<\/i>/gi, "_")
    .replace(/<li[^>]*>/gi, "- ").replace(/<\/li>/gi, "\n")
    .replace(/<\/p>|<br\s*\/?>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&#8211;/g, "–").replace(/&amp;/g, "&")
    .replace(/&#8217;/g, "'").replace(/&quot;/g, '"');
  return md.replace(/\n{3,}/g, "\n\n").trim();
}

export function htmlToSections(html: string): Section[] {
  const root = parse(html || "");
  const sections: Section[] = [];
  let textBuffer: HTMLElement[] = [];

  const flush = () => {
    if (!textBuffer.length) return;
    const wrap = parse("<div></div>").querySelector("div")!;
    textBuffer.forEach((n) => wrap.appendChild(n));
    const md = htmlToMarkdown(wrap);
    if (md) sections.push({ type: "text", content: md });
    textBuffer = [];
  };

  for (const node of root.childNodes) {
    if (!(node instanceof HTMLElement)) {
      if (node.text && node.text.trim()) textBuffer.push(parse(`<p>${node.text}</p>`).querySelector("p")!);
      continue;
    }
    const iframe = node.tagName === "IFRAME" ? node : node.querySelector("iframe");
    const src = iframe?.getAttribute("src") || "";
    const vimeo = (node.innerHTML.match(VIMEO_RE) || [])[1];
    const table = node.tagName === "TABLE" ? node : node.querySelector("table");
    const img = node.tagName === "IMG" ? node : node.querySelector("img");

    if (vimeo) { flush(); sections.push({ type: "video", vimeoId: vimeo }); }
    else if (src && pdfUrlFrom(src)) { flush(); sections.push({ type: "pdf", url: pdfUrlFrom(src)!, label: "PDF" }); }
    else if (table) {
      flush();
      const trs = table.querySelectorAll("tr");
      const headers = trs[0]?.querySelectorAll("th,td").map((c) => c.text.trim()) || [];
      const rows = trs.slice(1).map((tr) => tr.querySelectorAll("td").map((c) => c.text.trim()));
      if (headers.length) sections.push({ type: "table", headers, rows });
    }
    else if (img) { flush(); sections.push({ type: "image", url: img.getAttribute("src") || "", alt: img.getAttribute("alt") || "" }); }
    else textBuffer.push(node);
  }
  flush();
  return sections.filter((s) => s.type !== "text" || (s as any).content.length > 1);
}
```

- [ ] **Step 3: Verifikacija na poznatoj temi (Deklinacija prideva — objašnjenje, tabela)**

Run: `cd LMS/lms && npx tsx -e "import('./scripts/wp-migrate/wp-client.ts').then(async m=>{const t=await m.getPost('sfwd-topic',41557);const h=await import('./scripts/wp-migrate/html-to-sections.ts');console.log(JSON.stringify(h.htmlToSections(t.content.rendered),null,1))})"`
Expected: sadrži bar jedan `{type:"table",...}` i `{type:"text",...}` sa markdown tekstom o pridevima.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json scripts/wp-migrate/html-to-sections.ts
git commit -m "feat(migrate): HTML→sekcije parser (video/pdf/tabela/slika/tekst)"
```

---

## Task 3: Quiz mapper

**Files:**
- Create: `scripts/wp-migrate/quiz-mapper.ts`

- [ ] **Step 1: Mapper**

`scripts/wp-migrate/quiz-mapper.ts`:
```ts
import type { ExerciseDump } from "./types";

const strip = (h: string) =>
  (h || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ")
    .replace(/&#8211;/g, "–").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

// LearnDash pitanje → ExerciseDump.questions[0] (+ flag ako treba review)
export function mapQuestion(q: any): { mapped: ExerciseDump["questions"][0]; reviewType: string | null } {
  const ldType = q.question_type as string;
  const questionText = strip(q.content?.rendered || q.title?.rendered || "");
  const explanation = strip(q.correct_message || "");

  if (ldType === "matrix_sort_answer") {
    const items = (q.answers || []).map((a: any) => {
      const text = strip(a._answer); const sort = strip(a._sortString);
      return { de: text, sr: sort };
    });
    return { mapped: { question: questionText || "Spoji parove:", options: { type: "match_pairs", items }, correct_answer: "all", question_type: "match_pairs" }, reviewType: null };
  }

  if (ldType === "essay") {
    return { mapped: { question: questionText, options: { type: "essay" }, correct_answer: "", question_type: "essay" }, reviewType: "essay (proveri prompt)" };
  }

  // cloze_answer: _answer sadrži više pod-praznina sa {tačno}; teško auto → flag za review
  const rawAnswer = (q.answers?.[0]?._answer) || "";
  const gaps = [...rawAnswer.matchAll(/\{([^}]+)\}/g)].map((m) => m[1].trim());
  return {
    mapped: {
      question: questionText || strip(rawAnswer).slice(0, 300),
      options: { type: "fill_blank", items: gaps },
      correct_answer: gaps.join(", "),
      question_type: "fill_blank",
    },
    reviewType: "cloze_answer (multi-gap — proveri pitanje/opcije/tačan odgovor)",
  };
}
```

- [ ] **Step 2: Verifikacija na cloze pitanju 40468 i matrix pitanju**

Run: `cd LMS/lms && npx tsx -e "import('./scripts/wp-migrate/wp-client.ts').then(async m=>{const q=await m.getPost('sfwd-question' as any,40468).catch(()=>null);})" ` *(napomena: question se vadi preko `/sfwd-question/{id}` — koristi direktan fetch u verifikaciji)*

Run: `cd LMS/lms && npx tsx -e "const A='Basic '+Buffer.from('Nati:cEbg CO8J 1dPP olXw sK4W zDor').toString('base64');fetch('https://www.hartweger.rs/wp-json/ldlms/v2/sfwd-question/40468',{headers:{Authorization:A}}).then(r=>r.json()).then(async q=>{const m=await import('./scripts/wp-migrate/quiz-mapper.ts');console.log(JSON.stringify(m.mapQuestion(q),null,1))})"`
Expected: `question_type:"fill_blank"`, `reviewType` flaguje cloze, `items` izvučeni iz `{…}`.

- [ ] **Step 3: Commit**

```bash
git add scripts/wp-migrate/quiz-mapper.ts
git commit -m "feat(migrate): mapper LearnDash pitanja → exercise tipovi"
```

---

## Task 4: Faza 1 — extract-wp-course.ts

**Files:**
- Create: `scripts/extract-wp-course.ts`

- [ ] **Step 1: Skripta za ekstrakciju**

`scripts/extract-wp-course.ts`:
```ts
import * as fs from "fs";
import * as path from "path";
import { COURSE_MAP, getCourseTree, getPost, getQuizQuestions } from "./wp-migrate/wp-client";
import { htmlToSections } from "./wp-migrate/html-to-sections";
import { mapQuestion } from "./wp-migrate/quiz-mapper";
import type { CourseDump, LessonDump } from "./wp-migrate/types";

const slug = process.argv[2];
if (!slug || !COURSE_MAP[slug]) { console.error("Usage: tsx scripts/extract-wp-course.ts <slug>", Object.keys(COURSE_MAP)); process.exit(1); }

const decode = (s: string) => (s || "").replace(/&#8211;/g, "–").replace(/&amp;/g, "&").replace(/&#8217;/g, "'").replace(/<[^>]+>/g, "").trim();

async function run() {
  const wpCourseId = COURSE_MAP[slug];
  const tree = await getCourseTree(wpCourseId);
  const dump: CourseDump = { slug, wpCourseId, lessons: [], reviewNotes: [] };

  let order = 0;
  for (const { lessonId, topicIds, quizIds } of tree) {
    const lessonPost = await getPost("sfwd-lessons", lessonId);
    const title = decode(lessonPost.title?.rendered || `Lekcija ${lessonId}`);
    const lesson: LessonDump = { wpLessonId: lessonId, title, order_index: order++, vimeo_video_id: null, sections: [{ type: "badge", module: title }], exercises: [] };

    // sadržaj same lekcije (ako ga ima)
    lesson.sections.push(...htmlToSections(lessonPost.content?.rendered || ""));
    // teme
    for (const tid of topicIds) {
      const t = await getPost("sfwd-topic", tid);
      const tTitle = decode(t.title?.rendered || "");
      if (tTitle) lesson.sections.push({ type: "text", content: `## ${tTitle}` });
      lesson.sections.push(...htmlToSections(t.content?.rendered || ""));
    }
    // jedinstven video → vimeo_video_id
    const vids = lesson.sections.filter((s) => s.type === "video") as { vimeoId: string }[];
    if (vids.length === 1) lesson.vimeo_video_id = vids[0].vimeoId;

    // kvizovi → vežbe
    for (const qz of quizIds) {
      const questions = await getQuizQuestions(qz);
      if (!Array.isArray(questions) || !questions.length) continue;
      const exTitle = decode((questions[0]?.title?.rendered || "Vežba")).replace(/\s*[-–]\s*\d+$/, "");
      const mapped = questions.map((q: any) => mapQuestion(q));
      mapped.forEach((m) => { if (m.reviewType) dump.reviewNotes.push(`[${title}] kviz ${qz}: ${m.reviewType}`); });
      const exType = mapped[0].mapped.question_type as any;
      lesson.exercises.push({ title: exTitle, exercise_type: exType === "fill_blank" ? "fill_blank" : exType === "match_pairs" ? "match_pairs" : exType === "essay" ? "essay" : "quiz", questions: mapped.map((m) => m.mapped) });
    }
    dump.lessons.push(lesson);
  }

  const dir = path.resolve(__dirname, "wp-content");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify(dump, null, 2));
  const review = [`# Review — ${slug}`, ``, `Lekcija: ${dump.lessons.length}`, `Vežbi: ${dump.lessons.reduce((a, l) => a + l.exercises.length, 0)}`, ``, `## Flagovi`, ...dump.reviewNotes.map((n) => `- ${n}`)].join("\n");
  fs.writeFileSync(path.join(dir, `${slug}.review.md`), review);
  console.log(`✓ ${slug}: ${dump.lessons.length} lekcija, ${dump.reviewNotes.length} flagova → scripts/wp-content/${slug}.json`);
}
run().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Pokreni na maloj Gramatici (proba parsera)**

Run: `cd LMS/lms && npx tsx scripts/extract-wp-course.ts gramatika-a2-b1`
Expected: `✓ gramatika-a2-b1: 4 lekcija ...`; nastaje `scripts/wp-content/gramatika-a2-b1.json`.

- [ ] **Step 3: Vizuelno proveri JSON**

Run: `cd LMS/lms && npx tsx -e "const d=require('./scripts/wp-content/gramatika-a2-b1.json');console.log(d.lessons.map(l=>l.title+' | video='+l.vimeo_video_id+' | sek='+l.sections.length+' | vezbe='+l.exercises.length).join('\n'))"`
Expected: 4 lekcije, bar 3 sa `video`, sekcije > 1.

- [ ] **Step 4: Commit**

```bash
git add scripts/extract-wp-course.ts scripts/wp-content/gramatika-a2-b1.json scripts/wp-content/gramatika-a2-b1.review.md
git commit -m "feat(migrate): faza 1 — ekstrakcija WP kursa u JSON + review"
```

---

## Task 5: Faza 2 — apply-wp-course.ts

**Files:**
- Create: `scripts/apply-wp-course.ts`

- [ ] **Step 1: Skripta za primenu**

`scripts/apply-wp-course.ts`:
```ts
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import type { CourseDump } from "./wp-migrate/types";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("="); if (k && v.length) process.env[k.trim()] = v.join("=").trim();
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const slug = process.argv[2];
const DRY = process.argv.includes("--dry");
if (!slug) { console.error("Usage: tsx scripts/apply-wp-course.ts <slug> [--dry]"); process.exit(1); }

const norm = (s: string) => s.toLowerCase().replace(/[^a-zšđčćž0-9]+/gi, " ").trim();

async function run() {
  const dump: CourseDump = JSON.parse(fs.readFileSync(path.resolve(__dirname, "wp-content", `${slug}.json`), "utf-8"));
  const { data: course } = await sb.from("courses").select("id").eq("slug", slug).single();
  if (!course) throw new Error(`Kurs ${slug} ne postoji u bazi`);

  const { data: existing } = await sb.from("lessons").select("id,title,order_index").eq("course_id", course.id);
  const byTitle = new Map((existing || []).map((l) => [norm(l.title), l]));

  for (const ld of dump.lessons) {
    let lesson = byTitle.get(norm(ld.title)) || (existing || []).find((e) => e.order_index === ld.order_index);
    if (!lesson) {
      if (DRY) { console.log(`+ kreirao bi lekciju "${ld.title}"`); continue; }
      const { data: created } = await sb.from("lessons").insert({ course_id: course.id, title: ld.title, order_index: ld.order_index, lesson_type: "standard" }).select("id").single();
      lesson = { id: created!.id, title: ld.title, order_index: ld.order_index };
    }
    if (DRY) { console.log(`~ ${ld.title}: ${ld.sections.length} sek, ${ld.exercises.length} vežbi`); continue; }

    await sb.from("lessons").update({ sections: ld.sections, vimeo_video_id: ld.vimeo_video_id }).eq("id", lesson.id);

    // idempotentno: obriši stare vežbe ovog lessona pa upiši
    await sb.from("exercises").delete().eq("lesson_id", lesson.id);
    let exOrder = 0;
    for (const ex of ld.exercises) {
      const { data: exRow } = await sb.from("exercises").insert({ lesson_id: lesson.id, title: ex.title, exercise_type: ex.exercise_type === "essay" ? "quiz" : ex.exercise_type, order_index: exOrder++ }).select("id").single();
      let qOrder = 0;
      for (const q of ex.questions) {
        await sb.from("exercise_questions").insert({ exercise_id: exRow!.id, question: q.question, options: q.options, correct_answer: q.correct_answer || "", explanation: q.explanation || null, question_type: q.question_type, order_index: qOrder++ });
      }
    }
    console.log(`✓ ${ld.title}`);
  }
  console.log(`Gotovo: ${slug}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
```

> Napomena: `exercise_type` CHECK ne uključuje `essay`; essay vežbe se upisuju kao `quiz` sa `question_type:"essay"` (renderer prepoznaje po `question_type`). Potvrdi u Tasku 6 da li renderer zahteva drugačije — ako da, koristi postojeći essay obrazac.

- [ ] **Step 2: Dry-run na Gramatici**

Run: `cd LMS/lms && npx tsx scripts/apply-wp-course.ts gramatika-a2-b1 --dry`
Expected: izlistava 4 lekcije sa brojem sekcija/vežbi, bez upisa.

- [ ] **Step 3: Commit**

```bash
git add scripts/apply-wp-course.ts
git commit -m "feat(migrate): faza 2 — upis JSON dump-a u Supabase (idempotentno)"
```

---

## Task 6: Vimeo whitelist + boja-test na Goethe B1, pa primena Gramatike

**Files:** (bez novih)

- [ ] **Step 1: Ekstrakcija Goethe B1**

Run: `cd LMS/lms && npx tsx scripts/extract-wp-course.ts polozi-goethe-b1`
Expected: `✓ polozi-goethe-b1: ...`.

- [ ] **Step 2: Primeni Gramatiku (pravi upis)**

Run: `cd LMS/lms && npx tsx scripts/apply-wp-course.ts gramatika-a2-b1`
Expected: `✓` po lekciji, `Gotovo: gramatika-a2-b1`.

- [ ] **Step 3: Vimeo whitelist provera u browseru**

Otvori lekciju Gramatike na produkciji/lokalu i potvrdi da Vimeo video radi (domain-lock).
Ako NE radi: dodaj `kurs.hartweger.rs` u Vimeo whitelist (Vimeo settings → Embed → domени). Zabeleži u memoriju.
Expected: video se reprodukuje.

- [ ] **Step 4: Commit (review fajlovi)**

```bash
git add scripts/wp-content/
git commit -m "chore(migrate): extract Goethe B1, primenjena Gramatika"
```

---

## Task 7: Review + primena preostalih kurseva (FIDE, Goethe B2, FSP)

**Files:** (bez novih; potencijalne ručne izmene u `scripts/wp-content/*.json`)

- [ ] **Step 1: Ekstrakcija svih preostalih**

Run:
```bash
cd LMS/lms
npx tsx scripts/extract-wp-course.ts polozi-goethe-b2
npx tsx scripts/extract-wp-course.ts polozi-fide
npx tsx scripts/extract-wp-course.ts fsp
```
Expected: tri JSON-a + tri `.review.md`.

- [ ] **Step 2: Pregled review fajlova**

Run: `cd LMS/lms && cat scripts/wp-content/*.review.md`
Expected: lista cloze/essay flagova. Ručno doteraj problematične cloze vežbe u odgovarajućem `<slug>.json` (pitanje, `items`, `correct_answer`).

- [ ] **Step 3: Dry-run pa primena svakog**

Run (po kursu, prvo `--dry` pa bez):
```bash
cd LMS/lms
for s in polozi-goethe-b2 polozi-fide fsp; do npx tsx scripts/apply-wp-course.ts $s --dry; done
for s in polozi-goethe-b2 polozi-fide fsp; do npx tsx scripts/apply-wp-course.ts $s; done
```
Expected: bez grešaka; `Gotovo: <slug>` za svaki.

- [ ] **Step 4: DB verifikacija**

Run: `cd LMS/lms && npx tsx -e "..."` — prebroj lekcije sa `sections` i vežbe po kursu (skripta iz brainstorming faze).
Expected: svih 5 kurseva ima `with_sections == lessons` i `exercises > 0` gde WP ima kvizove.

- [ ] **Step 5: Commit**

```bash
git add scripts/wp-content/
git commit -m "feat(migrate): prebačeni FIDE, Goethe B2, FSP — sadržaj + vežbe"
```

---

## Task 8: Smoke test na produkciji

- [ ] **Step 1: Deploy (ako su skripte gađale lokalnu bazu, preskoči; podaci su u Supabase produkciji direktno)**

Napomena: skripte pišu direktno u Supabase (`.env.local` → produkcijski URL?). Potvrdi koji projekat gađa `.env.local` pre primene. Ako je staging, ponovi primenu sa produkcijskim env-om.

- [ ] **Step 2: Otvori po jednu lekciju svakog kursa na kurs.hartweger.rs**

Proveri: video, PDF, tabele, tekst, i bar jednu vežbu (fill_blank/match_pairs) da radi.
Expected: sadržaj se prikazuje, vežba se rešava.

- [ ] **Step 3: Memorija**

Zapiši kratku memoriju da su FSP/FIDE/Gramatika/Goethe B1+B2 migrirani sa WP-a (sadržaj + vežbe), sa napomenom o eventualnim ručno doterivanim cloze vežbama.

---

## Self-Review napomene

- **Spec coverage:** sva 5 kurseva (Task 6–7), pun sadržaj parser (Task 2), kvizovi (Task 3, 5), review tačka (Task 7 Step 2), Vimeo whitelist (Task 6 Step 3), idempotentnost (Task 5). ✓
- **Otvoreno pitanje za izvršioca:** tačan essay obrazac u rendereru (Task 5 napomena) i koji Supabase projekat gađa `.env.local` (Task 8 Step 1) — proveriti pre masovnog upisa.
- **Tip-konzistentnost:** `Section`, `ExerciseDump`, `CourseDump` definisani u Tasku 1 i korišćeni isto u 2/3/4/5. ✓
