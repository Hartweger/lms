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
  if (ie && ie.length) return true;

  // Proizvod ≠ sadržaj: pristup se upisuje na SADRŽAJNE kurseve iz `course_unlocks`
  // („video-kurs-a1" → „nemacki-a1-1"/-2), pa vlasnik nikad nema red na sam proizvod.
  // Bez ovoga bi renewal_only kupon (OBNOVI50) odbijao baš one kojima je namenjen.
  const { data: unlocks } = await admin
    .from("course_unlocks").select("content_course_id").eq("purchasable_course_id", courseId);
  const contentIds = (unlocks ?? []).map((u) => u.content_course_id).filter((id: string) => id !== courseId);
  if (contentIds.length === 0) return false;

  const { data: caContent } = await admin
    .from("course_access").select("id").eq("user_id", prof.id).in("course_id", contentIds).limit(1);
  if (caContent && caContent.length) return true;

  const { data: ieContent } = await admin
    .from("individual_enrollments").select("id").eq("user_id", prof.id).in("course_id", contentIds).limit(1);
  return !!(ieContent && ieContent.length);
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

/**
 * Da li je mejl već STVARNO iskoristio kupon - koristi se za `once_per_email` kupone.
 * Broji samo naplaćene porudžbine (payment_status = 'completed'); neuspeo pokušaj
 * kartice (pending/failed/cancelled) ne sme da blokira ponovni pokušaj kupovine.
 */
export async function emailUsedCoupon(
  admin: SupabaseClient,
  couponCode: string,
  email: string
): Promise<boolean> {
  const e = (email ?? "").trim();
  if (!e || !couponCode) return false;
  const { data } = await admin
    .from("orders")
    .select("id")
    .eq("coupon_code", couponCode)
    .eq("payment_status", "completed")
    .ilike("email", e)
    .limit(1);
  return !!(data && data.length);
}

/**
 * Poruke za `applies_to_course_id` / `requires_course_id` kupone - naziv kursa se
 * čita iz baze, da poruka ne bude tvrdo vezana za jedan kupon (ranije uvek "FSP").
 */
export async function couponAppliesMessage(
  admin: SupabaseClient,
  courseId: string
): Promise<string> {
  const title = await courseTitle(admin, courseId);
  return title
    ? `Ovaj kod važi samo za kurs „${title}".`
    : "Ovaj kod ne važi za ovaj kurs.";
}

export async function couponRequiresMessage(
  admin: SupabaseClient,
  courseId: string
): Promise<string> {
  const title = await courseTitle(admin, courseId);
  return title
    ? `Ovaj kod važi samo za polaznike koji već imaju kurs „${title}" (na taj mejl).`
    : "Ovaj kod važi samo za polaznike koji već imaju odgovarajući kurs (na taj mejl).";
}

async function courseTitle(admin: SupabaseClient, courseId: string): Promise<string | null> {
  if (!courseId) return null;
  const { data } = await admin.from("courses").select("title").eq("id", courseId).maybeSingle();
  return data?.title ?? null;
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
