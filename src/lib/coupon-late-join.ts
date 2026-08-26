import type { SupabaseClient } from "@supabase/supabase-js";
import { nivoForSlug } from "@/lib/course-nivo";

/**
 * Kupon sa `late_join_only` važi samo za onoga ko ulazi u grupu koja je VEĆ
 * KRENULA a još prima polaznike (naknadni upis) - propustio je deo časova, pa
 * ne plaća punu cenu. Zastavicu `groups.naknadni_upis` pali admin ruta preko
 * `naknadniUpisZaStatus` kad grupa ostane "otvoren" a start_date je u prošlosti.
 */

export const LATE_JOIN_PORUKA =
  "Ovaj kod važi samo za grupu koja je već počela a i dalje prima polaznike. " +
  "Ovaj kurs trenutno nema takvu grupu.";

export interface CourseForLateJoin {
  slug: string;
  course_type: string | null;
}

/**
 * Da li kurs sme da primi kod za naknadni upis.
 *
 * Mora da bude GRUPNI kurs čiji nivo ima otvorenu grupu sa `naknadni_upis = true`.
 * Individualni kurs istog nivoa se NE računa iako `SLUG_TO_NIVO` i njega mapira
 * na isti nivo - kod 1:1 kursa nema grupe u koju bi se zakasnilo, pa bi kod
 * curio na pun proizvod od 33.000+.
 */
export async function courseAllowsLateJoin(
  admin: SupabaseClient,
  course: CourseForLateJoin,
): Promise<boolean> {
  if (course.course_type !== "group") return false;
  const nivo = nivoForSlug(course.slug);
  if (!nivo) return false;

  const { data } = await admin
    .from("groups")
    .select("id")
    .eq("level", nivo)
    .eq("status", "otvoren")
    .eq("naknadni_upis", true)
    .limit(1);

  return !!(data && data.length);
}
