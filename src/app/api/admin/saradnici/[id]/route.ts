// PATCH /api/admin/saradnici/[id] - izmena podataka saradnika.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { admin } = auth;
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  const patch: Partial<{ name: string; email: string | null; note: string | null; fee_rsd: number; is_active: boolean }> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "Ime je obavezno." }, { status: 400 });
    patch.name = name;
  }
  if (body.email !== undefined) patch.email = String(body.email).trim() || null;
  if (body.note !== undefined) patch.note = String(body.note).trim() || null;
  if (body.feeRsd !== undefined) {
    const fee = Math.round(Number(body.feeRsd));
    if (!Number.isFinite(fee) || fee < 0) return NextResponse.json({ error: "Iznos po upisu mora biti 0 ili više." }, { status: 400 });
    patch.fee_rsd = fee;
  }
  if (body.isActive !== undefined) patch.is_active = Boolean(body.isActive);
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nema izmena." }, { status: 400 });

  const { data: partner, error } = await admin.from("partners").update(patch).eq("id", id).select().single();
  if (error || !partner) {
    // .single() nad nepostojećim id-em vraća PGRST116 - to je 404, ne 500.
    const status = error?.code === "PGRST116" ? 404 : error ? 500 : 404;
    const poruka = status === 404 ? "Saradnik nije pronađen." : (error?.message ?? "Izmena nije uspela.");
    return NextResponse.json({ error: poruka }, { status });
  }

  // Deaktivacija saradnika gasi i sve njegove kodove - kasa ne dobija novu proveru.
  if (patch.is_active === false) {
    const { error: cErr } = await admin.from("coupons").update({ is_active: false }).eq("partner_id", id);
    if (cErr) return NextResponse.json({ error: `Saradnik je deaktiviran, ali kodovi nisu ugašeni: ${cErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ partner });
}
