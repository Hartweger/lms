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
const NO_EX = process.argv.includes("--no-exercises"); // upiši samo sadržaj (sekcije/video), preskoči vežbe
const ESSAYS_ONLY = process.argv.includes("--essays-only"); // upiši samo essay/Schreiben zadatke (preskoči zagađene cloze)
if (!slug) { console.error("Usage: tsx scripts/apply-wp-course.ts <slug> [--dry]"); process.exit(1); }

const norm = (s: string) => s.toLowerCase().replace(/[^a-zšđčćž0-9]+/gi, " ").trim();

async function run() {
  const dump: CourseDump = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "wp-content", `${slug}.json`), "utf-8")
  );
  const { data: course } = await sb.from("courses").select("id").eq("slug", slug).single();
  if (!course) throw new Error(`Kurs ${slug} ne postoji u bazi`);

  const { data: existing } = await sb.from("lessons").select("id,title,order_index").eq("course_id", course.id);
  const byTitle = new Map((existing || []).map((l) => [norm(l.title), l]));

  for (const ld of dump.lessons) {
    let lesson = byTitle.get(norm(ld.title)) || (existing || []).find((e) => e.order_index === ld.order_index);
    if (!lesson) {
      if (DRY) { console.log(`+ kreirao bi lekciju "${ld.title}" (${ld.sections.length} sek, ${ld.exercises.length} vežbi)`); continue; }
      const { data: created, error } = await sb.from("lessons").insert({
        course_id: course.id, title: ld.title, order_index: ld.order_index,
        lesson_type: ld.vimeo_video_id ? "video" : "text",
      }).select("id,title,order_index").single();
      if (error) throw error;
      lesson = created!;
    }
    if (DRY) {
      const n = ESSAYS_ONLY ? ld.exercises.filter((e) => e.exercise_type === "essay").length : ld.exercises.length;
      console.log(`~ ${ld.title}: ${ld.sections.length} sek, ${n} vežbi`); continue;
    }

    // Sekcije/video prepiši SAMO u punom/content modu (essays-only ne dira sadržaj — čuva migrirane medija URL-ove)
    if (!ESSAYS_ONLY) {
      const { error: upErr } = await sb.from("lessons")
        .update({ sections: ld.sections, vimeo_video_id: ld.vimeo_video_id }).eq("id", lesson.id);
      if (upErr) throw upErr;
    }

    if (NO_EX) { console.log(`✓ ${ld.title} (samo sadržaj)`); continue; }

    const exsToApply = ESSAYS_ONLY ? ld.exercises.filter((e) => e.exercise_type === "essay") : ld.exercises;
    // idempotentno: u essays-only briši samo postojeće essay vežbe; inače sve vežbe lekcije
    if (ESSAYS_ONLY) await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("exercise_type", "essay");
    else await sb.from("exercises").delete().eq("lesson_id", lesson.id);
    if (!exsToApply.length) continue;

    let exOrder = ESSAYS_ONLY ? 50 : 0;
    for (const ex of exsToApply) {
      const { data: exRow, error: exErr } = await sb.from("exercises").insert({
        lesson_id: lesson.id, title: ex.title, exercise_type: ex.exercise_type, order_index: exOrder++,
      }).select("id").single();
      if (exErr) throw exErr;
      let qOrder = 0;
      for (const q of ex.questions) {
        const { error: qErr } = await sb.from("exercise_questions").insert({
          exercise_id: exRow!.id, question: q.question, options: q.options,
          correct_answer: q.correct_answer || "", explanation: q.explanation || null,
          question_type: q.question_type, order_index: qOrder++,
        });
        if (qErr) throw qErr;
      }
    }
    console.log(`✓ ${ld.title} (${exsToApply.length} vežbi)`);
  }
  console.log(`${DRY ? "[DRY] " : ""}Gotovo: ${slug}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
