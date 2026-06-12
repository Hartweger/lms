import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canDeleteOrder } from "@/lib/order-utils";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

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
