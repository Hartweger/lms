// src/lib/professor-payable.ts
// I/O: učitaj zarađeno (časovi + odobrene aktivnosti) i isplaćeno po profesorki, vrati saldo.
import { createAdminClient } from "@/lib/supabase/admin";
import { computeBalance, sumActivities, type BalanceResult } from "@/lib/honorar";

export interface ProfPayable extends BalanceResult {
  professorId: string;
  name: string;
  email: string | null;
}

const DEFAULT_IND = 1400;
const DEFAULT_GRP = 1600;

/**
 * Saldo za jednu profesorku (ako je profId zadat) ili sve profesorke sa honorar konfiguracijom.
 * Časovi se broje SVI održani do danas (sve vreme), po rati profesorke.
 */
export async function loadPayables(profId?: string): Promise<ProfPayable[]> {
  const admin = createAdminClient();
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(new Date());

  let q = admin.from("user_profiles").select("id, full_name, email, honorar_ind, honorar_grp").not("honorar_ind", "is", null);
  if (profId) q = q.eq("id", profId);
  const { data: profs } = await q;

  const result: ProfPayable[] = [];
  for (const p of profs ?? []) {
    const rateInd = p.honorar_ind ?? DEFAULT_IND;
    const rateGrp = p.honorar_grp ?? DEFAULT_GRP;
    const [{ count: indCount }, { count: grpCount }, { data: acts }, { data: pays }] = await Promise.all([
      admin.from("individual_lessons").select("*", { count: "exact", head: true })
        .eq("professor_id", p.id).lte("lesson_date", today),
      admin.from("group_sessions").select("*", { count: "exact", head: true })
        .eq("professor_id", p.id).eq("cancelled", false).lte("session_date", today),
      admin.from("professor_activities").select("amount, status").eq("professor_id", p.id),
      admin.from("professor_payments").select("amount").eq("professor_id", p.id),
    ]);
    const earnedLessons = (indCount ?? 0) * rateInd + (grpCount ?? 0) * rateGrp;
    const earnedActivities = sumActivities((acts ?? []) as { amount: number; status: "na_cekanju" | "odobreno" | "odbijeno" }[]);
    const paid = (pays ?? []).reduce((s, r) => s + (r.amount || 0), 0);
    const bal = computeBalance(earnedLessons, earnedActivities, paid);
    result.push({ professorId: p.id, name: p.full_name || p.email || "-", email: p.email, ...bal });
  }
  return result;
}
