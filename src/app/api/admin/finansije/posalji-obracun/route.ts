import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendHonorarProfEmail } from "@/lib/email";
import { buildMonthlyHonorarReports } from "@/lib/honorar-report";
import honorariHistory from "@/lib/honorari-history.json";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? admin : null;
}

// Ručno (ponovno) slanje mesečnog obračuna profesorkama, iz Finansija.
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

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
    const imaStavke = r.ind + r.grp + r.aktivnosti.length + r.isplate.length > 0;
    if (!imaStavke || !r.email) { preskoceno++; continue; }
    await sendHonorarProfEmail(r.email, r.fullName ?? "", {
      label, ind: r.ind, grp: r.grp, rateInd: r.rateInd, rateGrp: r.rateGrp,
      indTotal: r.indTotal, grpTotal: r.grpTotal, total: r.total,
      aktivnosti: r.aktivnosti, isplate: r.isplate,
      balance: r.balance ?? undefined,
    });
    poslato++;
  }
  return NextResponse.json({ poslato, preskoceno, label });
}
