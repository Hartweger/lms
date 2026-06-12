import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Da li mejl već poseduje (kupio ranije) dati kurs - koristi se za `renewal_only` kupone
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

/**
 * Da li korisnik (po user_id) već poseduje BILO KOJI video kurs - koristi se za
 * `new_customers_only` kupone (npr. NAKI10) namenjene samo prvoj kupovini video kursa.
 */
export async function userOwnsAnyVideoCourse(
  admin: SupabaseClient,
  userId: string
): Promise<boolean> {
  if (!userId) return false;
  const { data } = await admin
    .from("course_access")
    .select("id, courses!inner(course_type)")
    .eq("user_id", userId)
    .eq("courses.course_type", "video")
    .limit(1);
  return !!(data && data.length);
}

/** Isto kao gore, ali polazi od mejla (checkout pre logina, email capture). */
export async function emailOwnsAnyVideoCourse(
  admin: SupabaseClient,
  email: string
): Promise<boolean> {
  const e = (email ?? "").trim().toLowerCase();
  if (!e) return false;
  const { data: prof } = await admin.from("user_profiles").select("id").eq("email", e).maybeSingle();
  if (!prof) return false;
  return userOwnsAnyVideoCourse(admin, prof.id);
}
