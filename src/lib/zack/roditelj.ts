// Zajedničko za roditeljske rute. Roditelj je jedini deo dečje aplikacije
// koji ima pravu Supabase sesiju: prijavljuje se mejlom kao i ostatak
// platforme, pa se ovde iz kolačića čita KO je, a service-role klijentom
// ŠTA sme - i to isključivo nad decom vezanom za njegov red u zack_roditelji.
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthKorisnik = { id: string; email: string | null };
export type Roditelj = { id: string; email: string };

/**
 * Prijavljeni korisnik iz kolačića. getUser() proverava token kod Supabase-a,
 * pa se identitet nikad ne uzima iz tela zahteva niti iz nepotpisanih podataka.
 */
export async function authKorisnik(): Promise<AuthKorisnik | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

/**
 * Red roditelja za prijavljenog korisnika. Nema reda = nije dao pristanak,
 * a bez pristanka se ne sme napraviti nijedan dečji profil.
 */
export async function nadjiRoditelja(authUserId: string): Promise<Roditelj | null> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("zack_roditelji")
    .select("id, email")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (error) throw new Error(`Ne mogu da pročitam roditelja: ${error.message}`);
  return data;
}
