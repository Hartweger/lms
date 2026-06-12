import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaymentInstructionsEmail } from "@/lib/email";
import { calculatePaypalEur } from "@/lib/order-utils";
import { generateIpsQrUrl } from "@/lib/ips-qr";

// (Ponovno) slanje kupcu podataka za uplatu - za metodu te narudžbine.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { data: order, error } = await admin.from("orders").select("*").eq("id", id).single();
  if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // metoda mejla = metoda narudžbine (kartica-link radi samo za kartica narudžbine)
  const pm = String(order.payment_method || "");
  const method: "uplatnica" | "paypal" | "kartica" =
    pm === "paypal" ? "paypal" : pm.startsWith("kartica") ? "kartica" : "uplatnica";
  const courseTitle = Array.isArray(order.items) && order.items[0]?.title ? order.items[0].title : "kurs";
  const paypalEur = method === "paypal" ? calculatePaypalEur(Number(order.total)) : undefined;
  const ipsQrUrl = method === "uplatnica" ? await generateIpsQrUrl(admin, { total: Number(order.total), order_number: order.order_number }) : null;

  try {
    await sendPaymentInstructionsEmail(
      order.email, order.full_name ?? "", courseTitle, order.order_number,
      Number(order.total), method, paypalEur, order.id, ipsQrUrl ?? undefined
    );
  } catch (e) {
    console.error(`[admin/orders/send-payment] failed for ${order.order_number}:`, e);
    return NextResponse.json({ error: "Greška pri slanju mejla." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, method });
}
