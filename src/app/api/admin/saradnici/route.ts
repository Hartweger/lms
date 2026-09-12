// POST /api/admin/saradnici - novi saradnik zajedno sa prvim kuponom.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { parseKuponInput, insertPartnerCoupon } from "@/lib/partner-coupon";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { admin } = auth;
  const body = (await request.json()) as Record<string, unknown>;

  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Ime je obavezno." }, { status: 400 });
  const email = String(body.email ?? "").trim() || null;
  const feeRsd = Math.round(Number(body.feeRsd));
  if (!Number.isFinite(feeRsd) || feeRsd < 0) return NextResponse.json({ error: "Iznos po upisu mora biti 0 ili više." }, { status: 400 });
  const kupon = parseKuponInput(body);
  if (!kupon.ok) return NextResponse.json({ error: kupon.error }, { status: 400 });

  // Kod se proverava PRE upisa saradnika, da 409 ne ostavi saradnika bez koda.
  const { data: postojeci } = await admin.from("coupons").select("id").eq("code", kupon.value.code).maybeSingle();
  if (postojeci) return NextResponse.json({ error: "Kupon sa tim kodom već postoji." }, { status: 409 });

  const { data: partner, error: pErr } = await admin
    .from("partners")
    .insert({ name, email, fee_rsd: feeRsd, note: String(body.note ?? "").trim() || null })
    .select()
    .single();
  if (pErr || !partner) return NextResponse.json({ error: pErr?.message ?? "Upis saradnika pao." }, { status: 500 });

  const cErr = await insertPartnerCoupon(admin, partner.id, kupon.value);
  if (cErr) {
    // Trka: neko je u međuvremenu napravio isti kod. Ne ostavljamo saradnika bez koda.
    await admin.from("partners").delete().eq("id", partner.id);
    return NextResponse.json({ error: cErr.error }, { status: cErr.status });
  }

  return NextResponse.json({ partner }, { status: 201 });
}
