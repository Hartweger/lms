import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { grantAccessForOrder } from "@/lib/grant-access";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

  // Load the order
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (orderError || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (order.payment_status === "completed") {
    return NextResponse.json({ error: "Order already completed" }, { status: 400 });
  }

  // grantAccessForOrder daje pristup + šalje GA4 i Meta Purchase (CAPI) iz jedne tačke
  // (kad je uplata stvarno potvrđena). Browser pixel za uplatnicu/PayPal ništa ne šalje.
  const result = await grantAccessForOrder(id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  // NAPOMENA: potvrda uplatnice/PayPal samo daje pristup - fiskalizacija je RUČNA (dugme
  // „Fiskalizuj" u adminu), po odluci 09.06.2026. Kartice se i dalje fiskalizuju automatski
  // u nestpay callback-u (nema ručne potvrde za njih).

  return NextResponse.json({ ok: true });
}
