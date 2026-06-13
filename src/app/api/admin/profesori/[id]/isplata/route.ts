import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadPayables } from "@/lib/professor-payable";
import { sendPaymentEmail } from "@/lib/email";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user.id : null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await verifyAdmin();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id: professorId } = await params;
  const body = await request.json();
  const amount = Math.round(Number(body.amount));
  const paymentDate = String(body.paymentDate ?? "").trim();
  const note = String(body.note ?? "").trim() || null;
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Iznos mora biti veći od 0" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) return NextResponse.json({ error: "Datum nije validan" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("professor_payments").insert({
    professor_id: professorId, payment_date: paymentDate, amount, note, created_by: adminId,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const [pay] = await loadPayables(professorId);
  if (pay?.email) {
    await sendPaymentEmail(pay.email, pay.name, { amount, date: paymentDate, balance: pay.balance, note });
  }
  return NextResponse.json({ ok: true, balance: pay?.balance ?? null });
}
