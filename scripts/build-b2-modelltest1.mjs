// B2 Modelltest 1 → kurs nemacki-b2-2, lekcija "Prüfungstraining B2 — Modelltest 1".
// Lesen+Hören = quiz (grupisano po Teil-u preko context/audio_url), Schreiben = essay, Sprechen = sprechen.
// Dry-run default; --apply za upis (upload audija + lekcija + 4 vežbe).
import { client, getCourse, uploadAudio, upsertLesson, upsertExercise } from "./lib/exam-packer.mjs";
import { LESEN, HOEREN, SCHREIBEN, SPRECHEN } from "./data/b2-modelltest1.mjs";

const APPLY = process.argv.includes("--apply");
const SLUG = "nemacki-b2-2";
const AUDIO_DIR = "/Users/natasahartweger/Documents/Claude/sajt/LMS/ispit-materijali/B2.2/Hoeren/";
const AUDIO_PFX = "kursevi/nemacki-b2-2/hoeren/";
const LESSON = "Prüfungstraining B2 — Modelltest 1";

const sb = client();
const course = await getCourse(sb, SLUG);

const lesenQ = LESEN.reduce((n, t) => n + t.questions.length, 0);
const hoerenQ = HOEREN.reduce((n, t) => n + t.questions.length, 0);
console.log(`Kurs ${course.title} (${course.id})`);
console.log(`Plan: Lesen ${LESEN.length} Teil/${lesenQ} pit, Hören ${HOEREN.length} Teil/${hoerenQ} pit, Schreiben ${SCHREIBEN.length}, Sprechen ${SPRECHEN.length}`);
if (!APPLY) { console.log("[DRY] dodaj --apply za upis."); process.exit(0); }

// 1) audio upload
const audioUrl = {};
for (const t of HOEREN) {
  if (!t.audioFile) continue;
  audioUrl[t.teil] = await uploadAudio(sb, AUDIO_DIR + t.audioFile, AUDIO_PFX + t.audioFile);
  console.log(`  ✓ audio Teil ${t.teil}`);
}

// 2) lekcija (modul) za ceo Modelltest
const lesson = await upsertLesson(sb, course.id, LESSON, [
  { type: "badge", module: "Prüfungstraining B2", category: "lesen" },
  { type: "text", style: "info", content: "Kompletan Goethe-Zertifikat B2 Modelltest 1: Lesen, Hören, Schreiben i Sprechen. Reši deo po deo." },
], { force: true });

// helper: pravi pitanja iz Teil-ova; context (title+content) grupiše prikaz po Teil-u
const buildQuestions = (teile, label, withAudio = false) => {
  const out = [];
  for (const t of teile) {
    const context = { type: "text", title: `${label} — Teil ${t.teil}`, content: withAudio ? t.info : `${t.info}\n\n${t.text ?? ""}`.trim() };
    for (const q of t.questions) {
      out.push({
        question: `<strong>${label} · Teil ${t.teil}</strong><br>${q.q}`,
        options: { type: "quiz", items: q.items, context },
        correct_answer: String(q.correct),
        question_type: "quiz",
        audio_url: withAudio ? audioUrl[t.teil] : null,
      });
    }
  }
  return out;
};

// 3) Lesen
await upsertExercise(sb, lesson.id, { title: "Lesen — Modelltest 1", exercise_type: "quiz", order_index: 0, questions: buildQuestions(LESEN, "Lesen", false) });
console.log(`  ✓ Lesen (${lesenQ} pit)`);

// 4) Hören
await upsertExercise(sb, lesson.id, { title: "Hören — Modelltest 1", exercise_type: "quiz", order_index: 1, questions: buildQuestions(HOEREN, "Hören", true) });
console.log(`  ✓ Hören (${hoerenQ} pit)`);

// 5) Schreiben (essay)
await upsertExercise(sb, lesson.id, { title: "Schreiben — Modelltest 1", exercise_type: "essay", order_index: 2,
  questions: SCHREIBEN.map(t => ({ question: `<strong>Schreiben — Teil ${t.teil}</strong><br>${t.aufgabe}`, options: { type: "essay" }, question_type: "essay" })) });
console.log(`  ✓ Schreiben (${SCHREIBEN.length})`);

// 6) Sprechen (sprechen)
await upsertExercise(sb, lesson.id, { title: "Sprechen — Modelltest 1", exercise_type: "sprechen", order_index: 3,
  questions: SPRECHEN.map(t => ({ question: `<strong>Sprechen — Teil ${t.teil}</strong><br>${t.aufgabe}`, options: { type: "sprechen" }, question_type: "sprechen" })) });
console.log(`  ✓ Sprechen (${SPRECHEN.length})`);

console.log("GOTOVO.");
