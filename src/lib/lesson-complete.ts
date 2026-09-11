import type { SupabaseClient } from "@supabase/supabase-js";
import { isExamLessonTitle } from "@/lib/exam-lesson";

/**
 * Završni ispit je urađen tek kad SVAKA vežba u njemu ima pokušaj (kviz) ili
 * predat esej (Schreiben). Prazan ispit se ne može zatvoriti kroz vežbu.
 */
export function examLessonFullyDone(exerciseIds: string[], doneExerciseIds: Set<string>): boolean {
  return exerciseIds.length > 0 && exerciseIds.every((id) => doneExerciseIds.has(id));
}

/**
 * Označi lekciju kao završenu.
 *
 * Zašto postoji: rezultat vežbe (exercise_attempts) i završetak lekcije
 * (lesson_progress) su odvojeni zapisi. Ko posle poslednje vežbe u lekciji
 * klikne „Sledeća lekcija →", preskoči dugme „Završi i nastavi" na stranici
 * lekcije - i lekcija zauvek ostane neoznačena, pa ga „Nastavi" na dashboardu
 * svaki dan vraća na isti korak. Zato završetak poslednje vežbe sam zatvara
 * lekciju.
 *
 * Završni ispit (Modelltest) nema dugme „Završi lekciju", pa je ovo JEDINI put
 * do „završeno" - a vežbe u njemu su inline (bez „sledeće vežbe"), pa bi se bez
 * dodatne provere zatvorio posle prvog urađenog dela. Zato se ispit označava
 * tek kad su svi delovi urađeni (Lesen, Hören i svi Schreiben zadaci).
 *
 * Tiho ne uspeva namerno: napredak vežbe je već sačuvan, a polaznik i dalje
 * ima dugme na stranici lekcije. Vraća true ako je upis prošao.
 */
export async function markLessonCompleted(
  supabase: SupabaseClient,
  userId: string,
  lessonId: string | null | undefined
): Promise<boolean> {
  if (!lessonId) return false;
  // Ne prepisuj postojeći datum završetka - polaznik bi na ponovnom rešavanju
  // vežbe dobio novi completed_at i pomeren redosled u istoriji napretka.
  const { data: postojeci } = await supabase
    .from("lesson_progress")
    .select("completed")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (postojeci?.completed) return true;

  const { data: lekcija } = await supabase.from("lessons").select("title").eq("id", lessonId).maybeSingle();
  if (isExamLessonTitle(lekcija?.title)) {
    const { data: vezbe } = await supabase.from("exercises").select("id").eq("lesson_id", lessonId);
    const ids = (vezbe ?? []).map((v: { id: string }) => v.id);
    if (ids.length === 0) return false;
    const [{ data: pokusaji }, { data: eseji }] = await Promise.all([
      supabase.from("exercise_attempts").select("exercise_id").eq("user_id", userId).in("exercise_id", ids),
      supabase.from("essay_submissions").select("exercise_id").eq("user_id", userId).in("exercise_id", ids),
    ]);
    const uradjeno = new Set<string>([
      ...(pokusaji ?? []).map((p: { exercise_id: string }) => p.exercise_id),
      ...(eseji ?? []).map((e: { exercise_id: string }) => e.exercise_id),
    ]);
    if (!examLessonFullyDone(ids, uradjeno)) return false;
  }

  const { error } = await supabase.from("lesson_progress").upsert(
    { user_id: userId, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() },
    { onConflict: "user_id,lesson_id" }
  );
  return !error;
}
