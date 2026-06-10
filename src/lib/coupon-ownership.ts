import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Da li mejl već poseduje (kupio ranije) dati kurs — koristi se za `renewal_only` kupone
 * (npr. OBNOVI50) koji važe SAMO za obnovu kursa koji polaznik već ima.
 * Gleda course_access (video/grupni preko video pristupa) i individual_enrollments.
 */
export async function emailOwnsCourse(
  admin: SupabaseClient,
  email: string,
  courseId: string
): Promise<boolean> {
  const e = (email ?? "").trim().toLowerCase();
  if (!e || !courseId) return false;

  const { data: prof } = await admin.from("user_profiles").select("id").eq("email", e).maybeSingle();
  if (!prof) return false;

  const { data: ca } = await admin
    .from("course_access").select("id").eq("user_id", prof.id).eq("course_id", courseId).limit(1);
  if (ca && ca.length) return true;

  const { data: ie } = await admin
    .from("individual_enrollments").select("id").eq("user_id", prof.id).eq("course_id", courseId).limit(1);
  return !!(ie && ie.length);
}
