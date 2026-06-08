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
