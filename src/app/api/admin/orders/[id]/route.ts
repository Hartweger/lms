import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { canDeleteOrder } from "@/lib/order-utils";
import { sendOrderCancelledEmail } from "@/lib/email";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

  // Load the order
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("payment_status, granted, order_number, email, full_name, items")
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

  // ?notify=1 → polaznik dobija mejl da je porudžbina otkazana (isti mejl kao
  // automatsko otkazivanje kartica u nestpay-reconcile). Mejl PRE brisanja,
  // jer posle brisanja nema podataka; sendOrderCancelledEmail ne baca grešku.
  const notify = new URL(request.url).searchParams.get("notify") === "1";
  let emailSent = false;
  if (notify && order.email) {
    const first = Array.isArray(order.items)
      ? (order.items[0] as { course_slug?: string; title?: string })
      : undefined;
    await sendOrderCancelledEmail({
      email: order.email,
      fullName: order.full_name ?? "",
      courseTitle: first?.title || "kurs",
      courseSlug: first?.course_slug || "",
      orderNumber: order.order_number,
    });
    emailSent = true;
  }

  const { error: deleteError } = await admin.from("orders").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ ok: true, emailSent });
}
