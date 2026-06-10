import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Efektivni professor za /profesor stranice. ADMIN može da „uđe kao" profesor preko ?prof=<id>
 * (kao „Pogledaj kao polaznik"). Profesor uvek vidi samo sebe.
 * Vraća null ako nije ulogovan ili nije profesor/admin.
 */
export async function resolveProfessorView(prof?: string): Promise<{
  userId: string;
  isAdmin: boolean;
  profId: string;            // čiji panel se gleda
  viewingAsName: string | null; // ime profesora kad admin gleda kao neko drugi
  honorarInd: number;
  honorarGrp: number;
} | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: me } = await admin
    .from("user_profiles").select("role, honorar_ind, honorar_grp").eq("id", user.id).single();
  if (me?.role !== "professor" && me?.role !== "admin") return null;
  const isAdmin = me?.role === "admin";

  let profId = user.id;
  let viewingAsName: string | null = null;
  let honorarInd = me?.honorar_ind ?? 1400;
  let honorarGrp = me?.honorar_grp ?? 1600;

  if (isAdmin && prof && prof !== user.id) {
    const { data: t } = await admin
      .from("user_profiles").select("full_name, role, honorar_ind, honorar_grp").eq("id", prof).single();
    if (t && (t.role === "professor" || t.role === "admin")) {
      profId = prof;
      viewingAsName = t.full_name;
      honorarInd = t.honorar_ind ?? 1400;
      honorarGrp = t.honorar_grp ?? 1600;
    }
  }

  return { userId: user.id, isAdmin, profId, viewingAsName, honorarInd, honorarGrp };
}
