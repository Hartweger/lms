import { NextRequest, NextResponse } from "next/server";
import { withCronLog } from "@/lib/cron-log";
import { previousMonth } from "@/lib/honorar";
import { sendHonorarProfEmail, sendHonorarSummaryEmail } from "@/lib/email";
import { buildMonthlyHonorarReports } from "@/lib/honorar-report";

// Mesečni cron (1. u mesecu): obračun honorara za PRETHODNI mesec + mejlovi.
// Override meseca: ?month=YYYY-MM (za backfill/test). Zaštita: Bearer CRON_SECRET.
async function cronHandler(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const monthParam = request.nextUrl.searchParams.get("month");
  let year: number, month: number;
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y; month = m;
  } else {
    ({ year, month } = previousMonth(new Date()));
  }

  const { label, reports } = await buildMonthlyHonorarReports(year, month);
  const summary: { name: string; ind: number; grp: number; total: number }[] = [];
  let grandTotal = 0;
  let mailed = 0;

  for (const r of reports) {
    if (r.ind + r.grp + r.aktivnosti.length === 0) continue; // ništa održano ni odobreno - ne šalje se
    summary.push({ name: r.name, ind: r.ind, grp: r.grp, total: r.total });
    grandTotal += r.total;
    if (r.email) {
      await sendHonorarProfEmail(r.email, r.fullName ?? "", {
        label, ind: r.ind, grp: r.grp, rateInd: r.rateInd, rateGrp: r.rateGrp,
        indTotal: r.indTotal, grpTotal: r.grpTotal, total: r.total,
        aktivnosti: r.aktivnosti, isplate: r.isplate,
        balance: r.balance ?? undefined,
      });
      mailed++;
    }
  }

  if (summary.length > 0) {
    summary.sort((a, b) => b.total - a.total);
    await sendHonorarSummaryEmail(label, summary, grandTotal);
  }

  return NextResponse.json({ label, professori: summary.length, mailed, grandTotal });
}

export const GET = withCronLog("honorari", cronHandler);
