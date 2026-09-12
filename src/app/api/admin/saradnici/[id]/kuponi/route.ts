// POST /api/admin/saradnici/[id]/kuponi - dodatni kod postojećem saradniku.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { parseKuponInput, insertPartnerCoupon } from "@/lib/partner-coupon";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { admin } = auth;
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  const { data: partner } = await admin.from("partners").select("id, is_active").eq("id", id).maybeSingle();
  if (!partner) return NextResponse.json({ error: "Saradnik nije pronađen." }, { status: 404 });
  if (!partner.is_active) return NextResponse.json({ error: "Saradnik je deaktiviran. Prvo ga aktiviraj." }, { status: 400 });

  const kupon = parseKuponInput(body);
  if (!kupon.ok) return NextResponse.json({ error: kupon.error }, { status: 400 });

  const cErr = await insertPartnerCoupon(admin, id, kupon.value);
  if (cErr) return NextResponse.json({ error: cErr.error }, { status: cErr.status });
  return NextResponse.json({ ok: true }, { status: 201 });
}
