// POST /api/admin/saradnici/[id]/isplate - upis isplate saradniku, vraća novi saldo.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { loadPartnerDetail } from "@/lib/partners";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { admin, user } = auth;
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  const amount = Math.round(Number(body.amount));
  const paidAt = String(body.paidAt ?? "").trim();
  const note = String(body.note ?? "").trim() || null;
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Iznos mora biti veći od 0." }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidAt)) return NextResponse.json({ error: "Datum nije validan." }, { status: 400 });

  const { data: partner } = await admin.from("partners").select("id").eq("id", id).maybeSingle();
  if (!partner) return NextResponse.json({ error: "Saradnik nije pronađen." }, { status: 404 });

  const { error } = await admin.from("partner_payouts").insert({ partner_id: id, amount, paid_at: paidAt, note, created_by: user.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const detail = await loadPartnerDetail(id);
  return NextResponse.json({ ok: true, saldo: detail?.saldo ?? null });
}
