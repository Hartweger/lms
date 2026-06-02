import * as fs from "fs";
import * as path from "path";
import { COURSE_MAP, getCourseTree, getPost, getQuizQuestions } from "./wp-migrate/wp-client";
import { htmlToSections } from "./wp-migrate/html-to-sections";
import { mapQuestion } from "./wp-migrate/quiz-mapper";
import type { CourseDump, LessonDump, ExerciseDump, Section } from "./wp-migrate/types";

const slug = process.argv[2];
if (!slug || !COURSE_MAP[slug]) {
  console.error("Usage: tsx scripts/extract-wp-course.ts <slug>", Object.keys(COURSE_MAP));
  process.exit(1);
}

const decode = (s: string) =>
  (s || "").replace(/<[^>]+>/g, "").replace(/&#8211;/g, "–").replace(/&amp;/g, "&")
    .replace(/&#8217;/g, "'").replace(/&#8230;/g, "…").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

// jedan kviz → jedna ExerciseDump (+ dodaj reviewNotes preko callbacka)
async function quizToExercise(quizId: number, lessonTitle: string, notes: string[]): Promise<ExerciseDump | null> {
  const questions = await getQuizQuestions(quizId);
  if (!Array.isArray(questions) || !questions.length) return null;
  const exTitle = (decode(questions[0]?.title?.rendered || "Vežba")).replace(/\s*[-–]\s*\d+$/, "") || "Vežba";
  const mapped = questions.map((q: any) => mapQuestion(q));
  mapped.forEach((m) => { if (m.reviewType) notes.push(`[${lessonTitle}] kviz ${quizId}: ${m.reviewType}`); });
  const firstType = mapped[0].mapped.question_type;
  const exType: ExerciseDump["exercise_type"] =
    firstType === "fill_blank" ? "fill_blank" :
    firstType === "match_pairs" ? "match_pairs" :
    firstType === "essay" ? "essay" : "quiz";
  return { title: exTitle, exercise_type: exType, questions: mapped.map((m) => m.mapped) };
}

async function run() {
  const wpCourseId = COURSE_MAP[slug];
  const { lessons: tree, courseQuizIds } = await getCourseTree(wpCourseId);
  const dump: CourseDump = { slug, wpCourseId, lessons: [], reviewNotes: [] };

  let order = 0;
  for (const { lessonId, topicIds, quizIds } of tree) {
    const lessonPost = await getPost("sfwd-lessons", lessonId);
    const title = decode(lessonPost.title?.rendered || `Lekcija ${lessonId}`);
    const sections: Section[] = [{ type: "badge", module: title }];
    sections.push(...htmlToSections(lessonPost.content?.rendered || ""));
    for (const tid of topicIds) {
      const t = await getPost("sfwd-topic", tid);
      const tTitle = decode(t.title?.rendered || "");
      if (tTitle) sections.push({ type: "text", content: `## ${tTitle}` });
      sections.push(...htmlToSections(t.content?.rendered || ""));
    }
    const vids = sections.filter((s) => s.type === "video") as { vimeoId: string }[];
    const exercises: ExerciseDump[] = [];
    for (const qz of quizIds) {
      const ex = await quizToExercise(qz, title, dump.reviewNotes);
      if (ex) exercises.push(ex);
    }
    const lesson: LessonDump = {
      wpLessonId: lessonId, title, order_index: order++,
      vimeo_video_id: vids.length === 1 ? vids[0].vimeoId : null,
      sections, exercises,
    };
    dump.lessons.push(lesson);
  }

  // Kvizovi na nivou kursa → vežbe na poslednjoj lekciji ("Završni test")
  if (courseQuizIds.length && dump.lessons.length) {
    const last = dump.lessons[dump.lessons.length - 1];
    for (const qz of courseQuizIds) {
      const ex = await quizToExercise(qz, last.title, dump.reviewNotes);
      if (ex) { ex.title = ex.title === "Vežba" ? "Završni test" : ex.title; last.exercises.push(ex); }
    }
    dump.reviewNotes.push(`Course-level kvizovi (${courseQuizIds.join(", ")}) zakačeni na poslednju lekciju "${last.title}".`);
  }

  const dir = path.resolve(__dirname, "wp-content");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify(dump, null, 2));
  const totalEx = dump.lessons.reduce((a, l) => a + l.exercises.length, 0);
  const review = [
    `# Review — ${slug}`, ``,
    `Lekcija: ${dump.lessons.length}`,
    `Vežbi: ${totalEx}`,
    `Lekcija sa videom: ${dump.lessons.filter((l) => l.vimeo_video_id).length}`, ``,
    `## Flagovi (${dump.reviewNotes.length})`,
    ...dump.reviewNotes.map((n) => `- ${n}`),
  ].join("\n");
  fs.writeFileSync(path.join(dir, `${slug}.review.md`), review);
  console.log(`✓ ${slug}: ${dump.lessons.length} lekcija, ${totalEx} vežbi, ${dump.reviewNotes.length} flagova → scripts/wp-content/${slug}.json`);
}
run().catch((e) => { console.error(e); process.exit(1); });
