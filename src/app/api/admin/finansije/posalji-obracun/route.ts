import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { sendHonorarProfEmail } from "@/lib/email";
import { buildMonthlyHonorarReports } from "@/lib/honorar-report";
import honorariHistory from "@/lib/honorari-history.json";

// Ručno (ponovno) slanje mesečnog obračuna profesorkama, iz Finansija.
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const godina = Number(body.godina);
  const mesec = Number(body.mesec);
  if (!Number.isInteger(godina) || !Number.isInteger(mesec) || mesec < 1 || mesec > 12) {
    return NextResponse.json({ error: "Godina i mesec su obavezni." }, { status: 400 });
  }
  // Istorijski override meseci (Isplata sheet): nema pojedinačnih časova u bazi - obračun bi bio pogrešan.
  const histRows = (honorariHistory as Record<string, { month: number }[]>)[String(godina)] ?? [];
  if (histRows.some((r) => r.month === mesec)) {
    return NextResponse.json({ error: "Za ovaj mesec obračun je istorijski (migriran) - mejl bi bio pogrešan." }, { status: 400 });
  }

  const { label, reports } = await buildMonthlyHonorarReports(godina, mesec);
  let poslato = 0, preskoceno = 0;
  for (const r of reports) {
    // Za razliku od crona, i sama isplata je stavka - ručno slanje služi i za "posle unosa isplate".
    const imaStavke = r.ind + r.grp + r.aktivnosti.length + r.isplate.length > 0;
    if (!imaStavke || !r.email) { preskoceno++; continue; }
    const ok = await sendHonorarProfEmail(r.email, r.fullName ?? "", {
      label, ind: r.ind, grp: r.grp, rateInd: r.rateInd, rateGrp: r.rateGrp,
      indTotal: r.indTotal, grpTotal: r.grpTotal, total: r.total,
      aktivnosti: r.aktivnosti, isplate: r.isplate,
      balance: r.balance ?? undefined,
    });
    if (ok) poslato++; else preskoceno++;
  }
  return NextResponse.json({ poslato, preskoceno, label });
}
