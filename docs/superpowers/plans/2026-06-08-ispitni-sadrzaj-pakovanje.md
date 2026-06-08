# Ispitni sadržaj — pakovanje (B2 Modelltest 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Spakovati kompletan Goethe B2 Modelltest 1 (Lesen, Hören, Schreiben, Sprechen) u kurs `nemacki-b2-2` kao ujednačen „Prüfungstraining" modul — doslovno iz PDF-a, sa tačnim odgovorima iz ključa, čisto formatirano.

**Architecture:** Jedan generički, idempotentan „exam-packer" pomoćni modul (`scripts/lib/exam-packer.mjs`) + jedan verbatim data fajl po Modelltestu (`scripts/data/b2-modelltest1.mjs`) + tanak ingestion skript koji ih spaja (`scripts/build-b2-modelltest1.mjs`). Packer je tako napravljen da se B1 i ostali nivoi posle rade samo dodavanjem novog data fajla.

**Tech Stack:** Node ESM skripte, `@supabase/supabase-js` (service role), Supabase Storage (`blog-media`), postojeće komponente `GroupedExamExercise`/`EssayExercise`/`SprechenExercise`.

**Reference:** spec `docs/superpowers/specs/2026-06-08-ujednacavanje-kurseva-ispitni-sadrzaj-design.md`; odobreni format `LMS/ispit-materijali/UZORAK-FORMAT-b2-modelltest1.json`; izvor `LMS/ispit-materijali/B2.2/`.

---

## Standard pakovanja (dogovoreno, dokazano u kodu)

| Modul | `exercise_type` | Nosač sadržaja | Grupisanje |
|---|---|---|---|
| Lesen | `quiz` | tekst u `options.context = {type:"text", title, content}`, opcije u `options.items` | po `context.title` (tekst se prikaže jednom po Teil-u) |
| Hören | `quiz` | `exercise_questions.audio_url` (mp3 public URL), opcije u `options.items` | po `audio_url` (plejer jednom po Teil-u) |
| Schreiben | `essay` | tekst zadatka = jedno pitanje, bez `correct_answer` | — (EssayExercise) |
| Sprechen | `sprechen` | tekst zadatka = jedno pitanje | — (SprechenExercise) |

- `correct_answer` = string indeksa tačne opcije (npr. `"1"` za drugu opciju), tačno iz `Lösungen`.
- OCR-ukrasne napomene se izbacuju. Tekst doslovan.
- Idempotentno: ponovno pokretanje ne duplira (briše pa upiše iste vežbe).
- Dry-run je default; `--apply` upisuje.

---

## File Structure

- **Create** `scripts/lib/exam-packer.mjs` — generički idempotentni helperi (env, supabase klijent, upload audija, upsert lekcije, upsert vežbe + zamena pitanja). Jedina datoteka sa Supabase logikom.
- **Create** `scripts/data/b2-modelltest1.mjs` — čist verbatim sadržaj B2 Modelltest 1 (Lesen/Hören/Schreiben/Sprechen + ključ). Bez Supabase logike — samo podaci.
- **Create** `scripts/build-b2-modelltest1.mjs` — tanak orkestrator: čita data fajl, zove packer, pravi „Prüfungstraining B2 — Modelltest 1" lekciju + 4 vežbe.
- **Modify** ništa u `src/` (koristi postojeće komponente).
- **Audio na disku:** `LMS/ispit-materijali/B2.2/Hoeren/*.mp3` (5 fajlova), upload u `blog-media` pod `kursevi/nemacki-b2-2/hoeren/`.

---

## Task 1: exam-packer helper modul

**Files:**
- Create: `scripts/lib/exam-packer.mjs`

- [ ] **Step 1: Napisati packer modul**

```js
// Generički, idempotentni helperi za pakovanje ispitnih vežbi u Supabase.
// Bez sadržaja kurseva — samo mehanika. Koristi service role iz .env.local.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

export function loadEnv() {
  const env = {};
  for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
    const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

export function client() {
  const env = loadEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

const BUCKET = "blog-media";

/** Upload lokalnog mp3 u blog-media, vrati public URL. Idempotentno (upsert). */
export async function uploadAudio(sb, localPath, destPath) {
  const buf = readFileSync(localPath);
  const { error } = await sb.storage.from(BUCKET).upload(destPath, buf, { contentType: "audio/mpeg", upsert: true });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(destPath).data.publicUrl;
}

/** Nađi kurs po slug-u (baca ako ne postoji). */
export async function getCourse(sb, slug) {
  const { data, error } = await sb.from("courses").select("id,title").eq("slug", slug).single();
  if (error || !data) throw new Error(`kurs nije nađen: ${slug}`);
  return data;
}

/** Upsert lekcije po (course_id, title). Postojeću ne dira osim sekcija ako force. Vrati lesson. */
export async function upsertLesson(sb, courseId, title, sections, { force = false } = {}) {
  let { data: lesson } = await sb.from("lessons").select("id").eq("course_id", courseId).eq("title", title).maybeSingle();
  if (lesson) {
    if (force) await sb.from("lessons").update({ sections }).eq("id", lesson.id);
    return lesson;
  }
  const { data: mx } = await sb.from("lessons").select("order_index").eq("course_id", courseId).order("order_index", { ascending: false }).limit(1);
  const order_index = (mx?.[0]?.order_index ?? 0) + 1;
  ({ data: lesson } = await sb.from("lessons").insert({
    course_id: courseId, title, lesson_type: "text", order_index, sections,
  }).select("id").single());
  return lesson;
}

/**
 * Idempotentno napravi vežbu + njena pitanja na lekciji.
 * questions: [{ question, options, correct_answer, audio_url, question_type }]
 * Briše postojeću vežbu istog naslova na toj lekciji pa upiše iznova.
 */
export async function upsertExercise(sb, lessonId, { title, exercise_type, order_index = 0, questions }) {
  await sb.from("exercises").delete().eq("lesson_id", lessonId).eq("title", title);
  const { data: ex } = await sb.from("exercises").insert({ lesson_id: lessonId, title, exercise_type, order_index }).select("id").single();
  let i = 0;
  for (const q of questions) {
    await sb.from("exercise_questions").insert({
      exercise_id: ex.id,
      question: q.question,
      options: q.options ?? null,
      correct_answer: q.correct_answer ?? "",
      question_type: q.question_type ?? exercise_type,
      audio_url: q.audio_url ?? null,
      explanation: q.explanation ?? null,
      order_index: i++,
    });
  }
  return ex;
}
```

- [ ] **Step 2: Provera sintakse**

Run: `node --check scripts/lib/exam-packer.mjs`
Expected: bez ispisa (exit 0).

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/exam-packer.mjs
git commit -m "feat(scripts): generic idempotent exam-packer helper"
```

---

## Task 2: Skinuti B2 audio + PDF na disk

**Files:**
- Create (download): `LMS/ispit-materijali/B2.2/Hoeren/9783061217754_Goethe-Zertifikat_B2_0{1..5}.mp3`
- Create (download): `LMS/ispit-materijali/B2.2/Modelltest-1.pdf`

> Drive fileId-evi (folder `14WvHW0hCD96OS5DEpgQXUofQ6IMO2ILN`):
> Modelltest 1.pdf = `1NcIvtaPtaPBBI5zhgusBv2tdEOdqz85u`
> B2_01..05 mp3 = `1SSIBsIijK0QG9-s4elLXXAZPPxtHQJiH`, `1MAu5WjLS3MnWtBrrEIiRWOCFOELA4f--`, `14Oz-92kNwGY8Qsr-qlLZWFGiir9OFMTq`, `1MKut5zUBn7nz_NcTEtLQrfbF_hPyvduM`, `1zpzQYcbAUvMsXw9NK3hzXGTJikSzrRaB`

- [ ] **Step 1: Skinuti mp3 fajlove sa Drive-a u Hoeren/ folder**

Koristi MCP `mcp__claude_ai_Google_Drive__download_file_content` po fileId, base64-decode u odgovarajući `.mp3`. (Audio je binarno — mora kao fajl, ne kroz chat.)

- [ ] **Step 2: Verifikovati da postoji 5 mp3 i da su validni**

Run: `ls -la "/Users/natasahartweger/Documents/Claude/sajt/LMS/ispit-materijali/B2.2/Hoeren/" && file "/Users/natasahartweger/Documents/Claude/sajt/LMS/ispit-materijali/B2.2/Hoeren/"*.mp3`
Expected: 5 fajlova, svaki „Audio file ... MPEG".

---

## Task 3: Verbatim data fajl B2 Modelltest 1

**Files:**
- Create: `scripts/data/b2-modelltest1.mjs`

Izvor doslovnog teksta: ekstrakcija iz `Modelltest 1.pdf` (već u UZORAK-u za Lesen Teil 1 i Schreiben Teil 1) i `LMS/ispit-materijali/B2.2/_raw-modelltest1-pdf-text.txt`. Ključ: `Lösungen M1` (slika `/tmp/b2_loesungen_m1.png`).

- [ ] **Step 1: Definisati strukturu i upisati SVE Teil-ove doslovno**

Schema (svaki Teil je objekat). Lesen/Hören pitanja: `options = { type:"quiz", items:[...], context?:{type:"text",title,content} }`, `correct_answer` = index tačne opcije kao string.

```js
// Verbatim sadržaj Goethe B2 Modelltest 1 (Cornelsen Prüfungstraining).
// Tekst doslovan iz PDF-a; odgovori iz Lösungen M1. Bez Supabase logike.

// Opcije za zadatke „dodeli osobi" (Lesen Teil 1):
const PERS = ["a — Holger", "b — Julia", "c — Katja", "d — Ricardo"];
const RF = ["richtig", "falsch"];
const ABC = ["a", "b", "c"];

export const LESEN = [
  {
    teil: 1,
    info: "Lesen Teil 1 · Arbeitszeit: 18 Minuten. Sie lesen in einem Forum, wie Menschen über ihre Wohnsituation und Wohnformen denken. Auf welche der vier Personen treffen die einzelnen Aussagen zu? Die Personen können mehrmals gewählt werden.",
    text: "Wie wir wohnen ...\n\na — Holger\nEigentlich war ich immer ein Stadtmensch. ...", // PUN tekst sve 4 osobe (vidi UZORAK-FORMAT-b2-modelltest1.json, key primer_1_LESEN_TEIL_1.lekcija_sekcije[2].content)
    items: PERS,
    questions: [
      { q: "Beispiel: Wer findet, dass die Mieten in den Städten zu hoch sind?", correct: 0 },
      { q: "Wer könnte auf Luxus beim Wohnen verzichten?", correct: 1 },
      { q: "Wer denkt, dass Wohnen oft überbewertet wird?", correct: 2 },
      { q: "Wer kann sich nicht vorstellen, auf dem Land zu wohnen?", correct: 1 },
      { q: "Wer hat zwar eine bezahlbare Wohnung, aber dennoch hohe Wohnkosten?", correct: 2 },
      { q: "Für wen ist ein Stellplatz für das Auto wichtig?", correct: 0 },
      { q: "Wer interessiert sich für alternative Wohnformen?", correct: 3 },
      { q: "Für wen sind sowohl Umweltschutz als auch bezahlbare Energiekosten wichtig?", correct: 1 },
      { q: "Wer wünscht sich unbedingt eine ruhige Wohnumgebung?", correct: 2 },
      { q: "Wer macht sich Sorgen um seine Zukunft?", correct: 3 },
    ],
  },
  // Teil 2..5: prekucati doslovno iz PDF-a istom shemom (Teil 2 = uparivanje rečenica u praznine,
  // Teil 3/4 = a/b/c, Teil 5 = uparivanje naslova). Odgovori iz ključa:
  // Teil 2: 10d,11c,12f,13h,14e,15b | Teil 3: 16b,17c,18a,19c,20a | Teil 5: 28g,29h,30b
  // (PROVERITI Teil 3/4/5 indekse na slici ključa pre --apply.)
];

export const HOEREN = [
  {
    teil: 1,
    info: "Hören Teil 1. Sie hören fünf kurze Gespräche/Äußerungen, jeden Text einmal. Zu jedem Text zwei Aufgaben. Wählen Sie die richtige Lösung.",
    audioFile: "9783061217754_Goethe-Zertifikat_B2_01.mp3",
    // Pitanja doslovno iz PDF-a (Beispiel + 1..10). Tip svakog: richtig/falsch ILI a/b/c.
    questions: [
      // { q, items: RF|ABC, correct }  — prekucati 10 pitanja doslovno
    ],
    // Ključ Hören Teil 1: 1 Richtig, 2c, 3 Richtig, 4a, 5 Falsch, 6c, 7 Richtig, 8b, 9 Falsch, 10c
  },
  // Teil 2 (audio _02): ključ 11c,12a,13b,14a,15b,16c
  // Teil 3 (audio _03): ključ 17b,18a,19c,20a,21a,22c
  // Teil 4 (audio _04): ključ 23a,24b,25b,26c,27a,28a,29c,30c
  // (audio _05 je transkript/uputstvo — proveriti u PDF-u da li je poseban deo ili intro.)
];

export const SCHREIBEN = [
  {
    teil: 1,
    aufgabe: "Sie schreiben einen Forumsbeitrag zum Thema fleischreiche Ernährung. Äußern Sie Ihre Meinung zu fleischreicher Ernährung im Alltag.\n\n• Nennen Sie Gründe, warum eine Ernährung mit Fleisch so verbreitet ist.\n• Nennen Sie andere Möglichkeiten, sich zu ernähren.\n• Nennen Sie Vorteile anderer Ernährung.\n\nDenken Sie an eine Einleitung und einen Schluss. Bei der Bewertung wird darauf geachtet, wie genau die Inhaltspunkte bearbeitet sind, wie korrekt der Text ist und wie gut die Sätze und Abschnitte sprachlich miteinander verknüpft sind. Schreiben Sie mindestens 150 Wörter.",
  },
  {
    teil: 2,
    aufgabe: "Montagmorgen im Büro. Wegen starker Arbeitsüberlastung haben Sie es letzte Woche versäumt, eine wichtige Bestellung aufzugeben. Schreiben Sie eine Nachricht an Ihren Vorgesetzten, Herrn Schumann.\n\n• Entschuldigen Sie sich für Ihren Fehler.\n• Erklären Sie, weshalb das passieren konnte.\n• Bitten Sie um Verständnis für Ihre Situation.\n• Machen Sie einen Vorschlag zur Lösung des Problems.\n\nÜberlegen Sie sich eine passende Reihenfolge für die Inhaltspunkte. Vergessen Sie nicht Anrede und Gruß. Schreiben Sie mindestens 100 Wörter.",
  },
];

export const SPRECHEN = [
  {
    teil: 1,
    aufgabe: "Sprechen Teil 1: Vortrag halten (circa 4 Minuten). Sie nehmen an einem Seminar teil und sollen einen kurzen Vortrag halten. Wählen Sie ein Thema (A oder B). Strukturieren Sie Ihren Vortrag mit Einleitung, Hauptteil und Schluss.\n\nThema A: Methoden zum Deutschlernen — • Beschreiben Sie mehrere Formen. • Nennen Sie Vor- und Nachteile und bewerten Sie diese. • Beschreiben Sie eine Methode genauer.\nThema B: Reisen — • Beschreiben Sie mehrere Möglichkeiten (z.B. Zugreise). • Nennen Sie Vor- und Nachteile und bewerten Sie diese. • Beschreiben Sie eine Möglichkeit genauer.",
  },
  {
    teil: 2,
    aufgabe: "Sprechen Teil 2: Diskussion führen (circa 5 Minuten). Sie sind Teilnehmende eines Debattierclubs und diskutieren über die aktuelle Frage: „Sollte Studieren kostenlos sein?\"\n\n• Tauschen Sie zuerst Ihren Standpunkt und Ihre Argumente aus.\n• Reagieren Sie dann auf die Argumente Ihrer Gesprächspartnerin / Ihres Gesprächspartners.\n• Fassen Sie am Ende zusammen: Sind Sie dafür oder dagegen?",
  },
];
```

- [ ] **Step 2: Prekucati doslovno Lesen Teil 2–5 i Hören Teil 1–4 pitanja**

Pun tekst Lesen Teil 1 prekopirati iz `UZORAK-FORMAT-b2-modelltest1.json`. Ostale Teil-ove prekucati doslovno iz PDF ekstrakcije (svako pitanje = jedan red), indekse tačnih odgovora postaviti iz ključa. **Pre nego što se nastavi: otvoriti `/tmp/b2_loesungen_m1.png` i prepisati TAČNE indekse za Lesen Teil 3/4/5 (render je sitan).**

- [ ] **Step 3: Provera sintakse**

Run: `node --check scripts/data/b2-modelltest1.mjs`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add scripts/data/b2-modelltest1.mjs
git commit -m "data: verbatim B2 Modelltest 1 (Lesen/Horen/Schreiben/Sprechen + kljuc)"
```

---

## Task 4: Ingestion skript (dry-run)

**Files:**
- Create: `scripts/build-b2-modelltest1.mjs`

- [ ] **Step 1: Napisati orkestrator**

```js
// B2 Modelltest 1 → kurs nemacki-b2-2, modul "Prüfungstraining B2 — Modelltest 1".
// Lesen+Hören = quiz (grupisano), Schreiben = essay, Sprechen = sprechen. Dry-run default; --apply.
import { client, getCourse, uploadAudio, upsertLesson, upsertExercise } from "./lib/exam-packer.mjs";
import { LESEN, HOEREN, SCHREIBEN, SPRECHEN } from "./data/b2-modelltest1.mjs";

const APPLY = process.argv.includes("--apply");
const SLUG = "nemacki-b2-2";
const AUDIO_DIR = "/Users/natasahartweger/Documents/Claude/sajt/LMS/ispit-materijali/B2.2/Hoeren/";
const AUDIO_PFX = "kursevi/nemacki-b2-2/hoeren/";

const sb = client();
const course = await getCourse(sb, SLUG);

const plan = {
  lesen: LESEN.length, hoeren: HOEREN.length, schreiben: SCHREIBEN.length, sprechen: SPRECHEN.length,
  lesenQ: LESEN.reduce((n, t) => n + t.questions.length, 0),
  hoerenQ: HOEREN.reduce((n, t) => n + t.questions.length, 0),
};
console.log(`Kurs ${course.title} (${course.id})`);
console.log(`Plan: Lesen ${plan.lesen} Teil/${plan.lesenQ} pit, Hören ${plan.hoeren} Teil/${plan.hoerenQ} pit, Schreiben ${plan.schreiben}, Sprechen ${plan.sprechen}`);
if (!APPLY) { console.log("[DRY] dodaj --apply za upis (upload audija + lekcija + 4 vežbe)."); process.exit(0); }

// 1) audio upload
const audioUrl = {};
for (const t of HOEREN) {
  if (!t.audioFile) continue;
  audioUrl[t.teil] = await uploadAudio(sb, AUDIO_DIR + t.audioFile, AUDIO_PFX + t.audioFile);
  console.log(`  ✓ audio Teil ${t.teil}`);
}

// 2) jedna lekcija (modul) za ceo Modelltest
const lesson = await upsertLesson(sb, course.id, "Prüfungstraining B2 — Modelltest 1", [
  { type: "badge", module: "Prüfungstraining B2", category: "lesen" },
  { type: "text", style: "info", content: "Kompletan Goethe-Zertifikat B2 Modelltest 1: Lesen, Hören, Schreiben i Sprechen. Reši deo po deo." },
], { force: true });

// 3) Lesen — jedna quiz vežba, sva pitanja sa context (grupisanje po Teil-u)
let li = 0;
const lesenQ = [];
for (const t of LESEN) {
  const ctx = { type: "text", title: `Lesen — Teil ${t.teil}`, content: `${t.info}\n\n${t.text}` };
  for (const [j, q] of t.questions.entries())
    lesenQ.push({ question: `<strong>Teil ${t.teil} · Aufgabe ${j === 0 ? "Beispiel" : j}</strong><br>${q.q}`,
      options: { type: "quiz", items: t.items, context: ctx }, correct_answer: String(q.correct), question_type: "quiz" });
}
await upsertExercise(sb, lesson.id, { title: "Lesen — Modelltest 1", exercise_type: "quiz", order_index: 0, questions: lesenQ });
console.log(`  ✓ Lesen (${lesenQ.length} pit)`);

// 4) Hören — jedna quiz vežba, audio_url po Teil-u
const hoerenQ = [];
for (const t of HOEREN) {
  for (const [j, q] of t.questions.entries())
    hoerenQ.push({ question: `<strong>Teil ${t.teil} · Aufgabe ${j === 0 ? "Beispiel" : j}</strong><br>${q.q}`,
      options: { type: "quiz", items: q.items, context: { type: "text", title: `Hören — Teil ${t.teil}`, content: t.info } },
      correct_answer: String(q.correct), question_type: "quiz", audio_url: audioUrl[t.teil] });
}
await upsertExercise(sb, lesson.id, { title: "Hören — Modelltest 1", exercise_type: "quiz", order_index: 1, questions: hoerenQ });
console.log(`  ✓ Hören (${hoerenQ.length} pit)`);

// 5) Schreiben — essay, jedan zadatak po Teil-u
await upsertExercise(sb, lesson.id, { title: "Schreiben — Modelltest 1", exercise_type: "essay", order_index: 2,
  questions: SCHREIBEN.map(t => ({ question: `<strong>Schreiben — Teil ${t.teil}</strong><br>${t.aufgabe}`, options: { type: "essay" }, question_type: "essay" })) });
console.log(`  ✓ Schreiben (${SCHREIBEN.length})`);

// 6) Sprechen — sprechen, jedan zadatak po Teil-u
await upsertExercise(sb, lesson.id, { title: "Sprechen — Modelltest 1", exercise_type: "sprechen", order_index: 3,
  questions: SPRECHEN.map(t => ({ question: `<strong>Sprechen — Teil ${t.teil}</strong><br>${t.aufgabe}`, options: { type: "sprechen" }, question_type: "sprechen" })) });
console.log(`  ✓ Sprechen (${SPRECHEN.length})`);

console.log("GOTOVO.");
```

- [ ] **Step 2: Pokrenuti dry-run**

Run: `node scripts/build-b2-modelltest1.mjs`
Expected: ispis „Plan: Lesen 5 Teil/… Hören 4 Teil/… Schreiben 2, Sprechen 2" i `[DRY]` linija; exit 0; ništa upisano.

- [ ] **Step 3: Commit**

```bash
git add scripts/build-b2-modelltest1.mjs
git commit -m "feat(scripts): B2 Modelltest 1 ingestion (dry-run)"
```

---

## Task 5: Apply + provera u bazi

- [ ] **Step 1: Upisati u bazu**

Run: `node scripts/build-b2-modelltest1.mjs --apply`
Expected: „✓ audio Teil 1..4", „✓ Lesen", „✓ Hören", „✓ Schreiben", „✓ Sprechen", „GOTOVO."

- [ ] **Step 2: Verifikovati upisano (lekcija + 4 vežbe + audio_url)**

```bash
node -e '
import("./scripts/lib/exam-packer.mjs").then(async ({client,getCourse})=>{
  const sb=client(); const c=await getCourse(sb,"nemacki-b2-2");
  const {data:l}=await sb.from("lessons").select("id").eq("course_id",c.id).eq("title","Prüfungstraining B2 — Modelltest 1").single();
  const {data:ex}=await sb.from("exercises").select("id,title,exercise_type").eq("lesson_id",l.id).order("order_index");
  for(const e of ex){const {count}=await sb.from("exercise_questions").select("id",{count:"exact",head:true}).eq("exercise_id",e.id);
    const {data:au}=await sb.from("exercise_questions").select("audio_url").eq("exercise_id",e.id).not("audio_url","is",null).limit(1);
    console.log(e.title,"|",e.exercise_type,"| pit:",count,"| audio:",au?.[0]?.audio_url?"DA":"ne");}
});'
```
Expected: 4 reda — „Lesen — Modelltest 1 | quiz | pit:30 | audio:ne", „Hören — Modelltest 1 | quiz | pit:30 | audio:DA", „Schreiben — Modelltest 1 | essay | pit:2 | audio:ne", „Sprechen — Modelltest 1 | sprechen | pit:2 | audio:ne".

- [ ] **Step 3: Proveriti da audio URL stvarno postoji (HTTP 200)**

```bash
node -e '
import("./scripts/lib/exam-packer.mjs").then(async ({client,getCourse})=>{
  const sb=client(); const c=await getCourse(sb,"nemacki-b2-2");
  const {data:l}=await sb.from("lessons").select("id").eq("course_id",c.id).eq("title","Prüfungstraining B2 — Modelltest 1").single();
  const {data:ex}=await sb.from("exercises").select("id").eq("lesson_id",l.id).eq("title","Hören — Modelltest 1").single();
  const {data:q}=await sb.from("exercise_questions").select("audio_url").eq("exercise_id",ex.id).not("audio_url","is",null).limit(1);
  const r=await fetch(q[0].audio_url,{method:"HEAD"}); console.log("audio HTTP",r.status,q[0].audio_url);
});'
```
Expected: `audio HTTP 200 ...`

---

## Task 6: Ručna provera u aplikaciji (UI smoke)

- [ ] **Step 1: Otvoriti lekciju u pregledaču**

Otvoriti `kurs.hartweger.rs` → kurs „Nemački B2.2" → lekcija „Prüfungstraining B2 — Modelltest 1" (ili lokalno `npm run dev`).
Proveriti redom:
- **Lesen:** tekst svake osobe prikazan **jednom** po Teil-u (grupisano), pitanja a/b/c/d ispod, odabir + ocena rade.
- **Hören:** audio plejer iznad pitanja, jedan po Teil-u; reprodukcija radi; pitanja richtig/falsch + a/b/c.
- **Schreiben:** polje za pisanje + „Završi"; posle slanja stiže AI feedback; u `/profesor/eseji` se pojavljuje kao `pending`.
- **Sprechen:** prikaz zadatka kroz `SprechenExercise`.
- Nigde prazno polje, „undefined", ni slomljen prikaz.

- [ ] **Step 2: Ako je B2.2 nepubliсhован — proveriti preko admin pregleda**

`nemacki-b2-2` je `is_published=false`. Proveriti kao admin/professor (vide nepublikovano) ili privremeno objaviti za test pa vratiti.

---

## Sledeći planovi (ne u ovom dokumentu)

1. **B1 Modelltest 4 (razbacan) + Modelltest 5 (finale)** — isti packer, novi data fajlovi `scripts/data/b1-modelltest{4,5}.mjs`; Modelltest 4 Teil-ovi raspoređeni po modulima B1.1/B1.2, Modelltest 5 ceo kao finale B1.2.
2. **Faza 1 — migracija tipova** — normalizovati postojeće Schreiben (`typing`/`quiz`→`essay`), proveriti da nemaju „tačan odgovor" logiku; ujednačiti nazive.
3. **Dijalozi** — uzorak + masovni rollout (AI dijalog + fiksni prevod) u sve module svih 8 kurseva.
4. **A1.2/A2.2 dopuna + Sprechen** — po istom packeru.

---

## Self-review (popunjeno)

- **Pokrivenost spec-a:** format pakovanja (Task 3–4), čisto formatiranje (Task 4 + Task 6 provera), doslovna ekstrakcija (Task 3), tačni odgovori iz ključa (Task 3 + provera slike), audio storage (Task 1/2/5), esej→profesor (Task 6). Ostali nivoi i faze → „Sledeći planovi".
- **Placeholderi:** jedini „prekucati doslovno" koraci (Lesen T2–5, Hören T1–4) su **transkripcija sadržaja iz imenovanog izvora**, ne nedostajuća logika; schema + jedan pun Teil + kompletan ključ su dati. Pre `--apply` obavezno prepisati tačne indekse Lesen T3/4/5 sa slike ključa.
- **Tipovi/imena:** funkcije iz Task 1 (`client`, `getCourse`, `uploadAudio`, `upsertLesson`, `upsertExercise`) koriste se istim potpisom u Task 4/5. `audio_url`/`options.context`/`correct_answer` usklađeni sa renderom (`GroupedExamExercise`).
