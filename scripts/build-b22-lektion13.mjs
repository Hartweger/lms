// Upisuje Vielfalt B2.2 · Lektion 13 (5 lekcija) u kurs `nemacki-b2-2`.
// Dry-run podrazumevano; --apply za stvarni upis. Idempotentno.
//
//   node scripts/build-b22-lektion13.mjs            # dry-run
//   node scripts/build-b22-lektion13.mjs --apply    # upis
//
// Redosled: postojeće WP ispitne lekcije (Lese/Hör/Schreiben modeltest) se
// pomeraju iza Lektion-sadržaja (order 30+), pa se L13 lekcije upišu na 0–4.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { LESSONS, COURSE_SLUG, EXAM_TITLE_RE } from "./b22-lektion13-data.mjs";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const tag = APPLY ? "" : "[DRY] ";

async function replaceExercises(lessonId, exercises) {
  // obriši postojeće vežbe (+ pitanja) lekcije
  const { data: existingEx } = await sb.from("exercises").select("id").eq("lesson_id", lessonId);
  for (const ex of existingEx || []) await sb.from("exercise_questions").delete().eq("exercise_id", ex.id);
  await sb.from("exercises").delete().eq("lesson_id", lessonId);

  let exOrder = 0;
  for (const ex of exercises) {
    const { data: exRow, error: exErr } = await sb.from("exercises")
      .insert({ lesson_id: lessonId, title: ex.title, exercise_type: ex.exercise_type, order_index: exOrder++ })
      .select("id").single();
    if (exErr) throw exErr;
    let qOrder = 0;
    for (const q of ex.questions) {
      const { error: qErr } = await sb.from("exercise_questions").insert({
        exercise_id: exRow.id, question: q.question, options: q.options ?? null,
        correct_answer: q.correct_answer ?? "", explanation: q.explanation ?? null,
        question_type: q.question_type, order_index: qOrder++,
      });
      if (qErr) throw qErr;
    }
  }
}

async function run() {
  const { data: course, error: cErr } = await sb.from("courses").select("id,title").eq("slug", COURSE_SLUG).single();
  if (cErr || !course) throw new Error(`Kurs ${COURSE_SLUG} ne postoji u bazi`);
  console.log(`${tag}Kurs: ${course.title} (${COURSE_SLUG})\n`);

  const { data: existing } = await sb.from("lessons").select("id,title,order_index").eq("course_id", course.id);
  const byOrder = new Map((existing || []).map((l) => [l.order_index, l]));

  // 1) Pomeri ispitne lekcije iza sadržaja (order 30+)
  const examLessons = (existing || []).filter((l) => EXAM_TITLE_RE.test(l.title)).sort((a, b) => a.order_index - b.order_index);
  let examOrder = 30;
  for (const ex of examLessons) {
    console.log(`${tag}↓ ispitna lekcija „${ex.title}" → order ${examOrder}`);
    if (APPLY) await sb.from("lessons").update({ order_index: examOrder }).eq("id", ex.id);
    byOrder.delete(ex.order_index);
    examOrder++;
  }

  // 2) Upsert L13 lekcija na pozicije 0–4
  for (const ld of LESSONS) {
    const found = byOrder.get(ld.order);
    const vids = ld.sections.filter((s) => s.type === "video").length;
    if (!found) {
      console.log(`${tag}+ nova lekcija [${ld.order}] „${ld.title}" (${ld.sections.length} sek, ${vids} video, ${ld.exercises.length} vežbi)`);
      if (!APPLY) continue;
      const { data: created, error } = await sb.from("lessons").insert({
        course_id: course.id, title: ld.title, order_index: ld.order,
        lesson_type: ld.lessonType, vimeo_video_id: ld.vimeoId, sections: ld.sections,
      }).select("id").single();
      if (error) throw error;
      await replaceExercises(created.id, ld.exercises);
    } else {
      console.log(`${tag}~ ažuriram [${ld.order}] „${found.title}" → „${ld.title}" (${ld.sections.length} sek, ${vids} video, ${ld.exercises.length} vežbi)`);
      if (!APPLY) continue;
      const { error } = await sb.from("lessons").update({
        title: ld.title, lesson_type: ld.lessonType, vimeo_video_id: ld.vimeoId, sections: ld.sections,
      }).eq("id", found.id);
      if (error) throw error;
      await replaceExercises(found.id, ld.exercises);
    }
  }
  console.log(`\n${tag}Gotovo: ${LESSONS.length} lekcija (Lektion 13).`);
}
run().catch((e) => { console.error(e); process.exit(1); });
