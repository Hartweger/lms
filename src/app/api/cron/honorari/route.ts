import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeHonorar, previousMonth, monthDateRange } from "@/lib/honorar";
import { sendHonorarProfEmail, sendHonorarSummaryEmail } from "@/lib/email";

// Mesečni cron (1. u mesecu): obračun honorara za PRETHODNI mesec + mejlovi.
// Override meseca: ?month=YYYY-MM (za backfill/test). Zaštita: Bearer CRON_SECRET.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();

  // Mesec: override ?month=YYYY-MM, inače prethodni mesec.
  const monthParam = request.nextUrl.searchParams.get("month");
  let year: number, month: number, label: string;
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y; month = m;
    const MES = ["januar","februar","mart","april","maj","jun","jul","avgust","septembar","oktobar","novembar","decembar"];
    label = `${MES[m - 1]} ${y}.`;
  } else {
    ({ year, month, label } = previousMonth(new Date()));
  }
  const { from, toExclusive } = monthDateRange(year, month);

  // Profesorke sa honorar konfiguracijom (7 seed-ovanih).
  const { data: profs } = await admin
    .from("user_profiles")
    .select("id, full_name, email, honorar_ind, honorar_grp")
    .not("honorar_ind", "is", null);

  const summary: { name: string; ind: number; grp: number; total: number }[] = [];
  let grandTotal = 0;
  let mailed = 0;

  for (const p of profs ?? []) {
    const [{ count: indCount }, { count: grpCount }] = await Promise.all([
      admin.from("individual_lessons").select("*", { count: "exact", head: true })
        .eq("professor_id", p.id).gte("lesson_date", from).lt("lesson_date", toExclusive),
      admin.from("group_sessions").select("*", { count: "exact", head: true })
        .eq("professor_id", p.id).eq("cancelled", false).gte("session_date", from).lt("session_date", toExclusive),
    ]);
    const ind = indCount ?? 0, grp = grpCount ?? 0;
    const h = computeHonorar(ind, grp, p.honorar_ind ?? 1400, p.honorar_grp ?? 1600);
    if (ind + grp > 0) {
      summary.push({ name: p.full_name || p.email, ind, grp, total: h.total });
      grandTotal += h.total;
      if (p.email) {
        await sendHonorarProfEmail(p.email, p.full_name || "", {
          label, ind, grp, rateInd: p.honorar_ind ?? 1400, rateGrp: p.honorar_grp ?? 1600,
          indTotal: h.indTotal, grpTotal: h.grpTotal, total: h.total,
        });
        mailed++;
      }
    }
  }

  if (summary.length > 0) {
    summary.sort((a, b) => b.total - a.total);
    await sendHonorarSummaryEmail(label, summary, grandTotal);
  }

  return NextResponse.json({ label, professori: summary.length, mailed, grandTotal });
}
