import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantAccessForOrder } from "@/lib/grant-access";

export async function POST(
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
    .select("*")
    .eq("id", id)
    .single();

  if (orderError || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (order.payment_status === "completed") {
    return NextResponse.json({ error: "Order already completed" }, { status: 400 });
  }

  const result = await grantAccessForOrder(id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  // NAPOMENA: potvrda uplatnice/PayPal samo daje pristup — fiskalizacija je RUČNA (dugme
  // „Fiskalizuj" u adminu), po odluci 09.06.2026. Kartice se i dalje fiskalizuju automatski
  // u nestpay callback-u (nema ručne potvrde za njih).

  return NextResponse.json({ ok: true });
}
