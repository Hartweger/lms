import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { canDeleteOrder } from "@/lib/order-utils";

export async function DELETE(
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
    .select("payment_status, granted")
    .eq("id", id)
    .single();

  if (orderError || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Guard: samo pending + nedodeljene narudžbine smeju da se brišu.
  // Potvrđene se storniraju (Fiscomm + oduzimanje pristupa), ne brišu iz baze.
  if (!canDeleteOrder(order)) {
    return NextResponse.json(
      { error: "Potvrđena narudžbina se ne može obrisati - koristi storno." },
      { status: 400 }
    );
  }

  const { error: deleteError } = await admin.from("orders").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
