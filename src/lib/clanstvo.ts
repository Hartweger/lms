// NH Membership - konstante i provera aktivnog članstva.
// Pristup = aktivan course_access na sadržajni kurs (isti uslov koji će RLS
// koristiti u migracijama 074/075) ili admin. Provera ide kroz cookie-vezani
// klijent - vlastiti red se vidi kroz postojeću polisu za course_access.
import type { SupabaseClient } from "@supabase/supabase-js";

export const CLANSTVO_PRODUCT_SLUG = "nh-clanstvo";
export const CLANSTVO_CONTENT_SLUG = "nh-clanstvo-sadrzaj";

export async function jeAktivnaClanica(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: profil } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (profil?.role === "admin") return true;

  const { data: kurs } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", CLANSTVO_CONTENT_SLUG)
    .single();
  if (!kurs) return false;

  const { data: pristup } = await supabase
    .from("course_access")
    .select("expires_at")
    .eq("user_id", userId)
    .eq("course_id", kurs.id)
    .maybeSingle();
  if (!pristup) return false;
  return pristup.expires_at === null || new Date(pristup.expires_at) > new Date();
}
