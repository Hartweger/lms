// src/lib/honorar-report.ts
// I/O: mesečni obračun honorara po profesorki za mejl (cron + ručno slanje iz Finansija).
import { createAdminClient } from "@/lib/supabase/admin";
import { computeHonorar, monthDateRange, MESECI, DEFAULT_HONORAR_IND, DEFAULT_HONORAR_GRP } from "@/lib/honorar";
import { loadPayables } from "@/lib/professor-payable";

export interface MonthlyHonorarReport {
  professorId: string;
  name: string;
  fullName: string | null;
  email: string | null;
  ind: number; grp: number;
  rateInd: number; rateGrp: number;
  indTotal: number; grpTotal: number;
  aktivnosti: { description: string; amount: number }[];
  aktivnostiTotal: number;
  isplate: { date: string; amount: number }[];
  isplaceno: number;
  total: number;          // časovi + aktivnosti (bruto zarađeno u mesecu)
  balance: number | null; // trenutni ukupan saldo (kao Obaveze)
}

export interface MonthlyHonorarReports {
  label: string; // npr. "jun 2026."
  reports: MonthlyHonorarReport[];
}

/** Obračun za SVE profesorke sa honorar konfiguracijom, za dati mesec. */
export async function buildMonthlyHonorarReports(year: number, month: number): Promise<MonthlyHonorarReports> {
  const admin = createAdminClient();
  const label = `${MESECI[month - 1]} ${year}.`;
  const { from, toExclusive } = monthDateRange(year, month);

  const { data: profs, error } = await admin
    .from("user_profiles")
    .select("id, full_name, email, honorar_ind, honorar_grp")
    .not("honorar_ind", "is", null);
  if (error) {
    throw new Error(`honorar-report: user_profiles upit pao - ${error.message}`);
  }

  const payables = await loadPayables();
  const balanceById = new Map(payables.map((p) => [p.professorId, p.balance]));

  const reports: MonthlyHonorarReport[] = [];
  for (const p of profs ?? []) {
    const [indRes, grpRes, actsRes, paysRes] = await Promise.all([
      admin.from("individual_lessons").select("*", { count: "exact", head: true })
        .eq("professor_id", p.id).gte("lesson_date", from).lt("lesson_date", toExclusive),
      admin.from("group_sessions").select("*", { count: "exact", head: true })
        .eq("professor_id", p.id).eq("cancelled", false).gte("session_date", from).lt("session_date", toExclusive),
      admin.from("professor_activities").select("description, amount")
        .eq("professor_id", p.id).eq("status", "odobreno")
        .gte("activity_date", from).lt("activity_date", toExclusive),
      admin.from("professor_payments").select("payment_date, amount")
        .eq("professor_id", p.id).gte("payment_date", from).lt("payment_date", toExclusive)
        .order("payment_date"),
    ]);
    if (indRes.error || grpRes.error || actsRes.error || paysRes.error) {
      console.error("[honorar-report] DB greška za", p.id, indRes.error ?? grpRes.error ?? actsRes.error ?? paysRes.error);
    }
    const ind = indRes.count ?? 0, grp = grpRes.count ?? 0;
    const rateInd = p.honorar_ind ?? DEFAULT_HONORAR_IND;
    const rateGrp = p.honorar_grp ?? DEFAULT_HONORAR_GRP;
    const h = computeHonorar(ind, grp, rateInd, rateGrp);
    const aktivnosti = (actsRes.data ?? []).map((a) => ({ description: a.description ?? "", amount: a.amount || 0 }));
    const aktivnostiTotal = aktivnosti.reduce((s, a) => s + a.amount, 0);
    const isplate = (paysRes.data ?? []).map((x) => ({ date: x.payment_date, amount: x.amount || 0 }));
    const isplaceno = isplate.reduce((s, x) => s + x.amount, 0);
    reports.push({
      professorId: p.id, name: p.full_name || p.email || "-", fullName: p.full_name, email: p.email,
      ind, grp, rateInd, rateGrp, indTotal: h.indTotal, grpTotal: h.grpTotal,
      aktivnosti, aktivnostiTotal, isplate, isplaceno,
      total: h.total + aktivnostiTotal,
      balance: balanceById.get(p.id) ?? null,
    });
  }
  return { label, reports };
}
