import type { SupabaseClient } from "@supabase/supabase-js";

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
  const { error } = await supabase.from("lesson_progress").upsert(
    { user_id: userId, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() },
    { onConflict: "user_id,lesson_id" }
  );
  return !error;
}
