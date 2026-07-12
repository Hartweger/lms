import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { loadPayables } from "@/lib/professor-payable";
import { sendPaymentEmail } from "@/lib/email";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;
  const adminId = user.id; // audit polje created_by
  const { id: professorId } = await params;
  const body = await request.json();
  const amount = Math.round(Number(body.amount));
  const paymentDate = String(body.paymentDate ?? "").trim();
  const note = String(body.note ?? "").trim() || null;
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Iznos mora biti veći od 0" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) return NextResponse.json({ error: "Datum nije validan" }, { status: 400 });

  // Profesor mora da postoji (loadPayables vraća prazno za nepoznat/ne-profesor id).
  const before = await loadPayables(professorId);
  if (before.length === 0) return NextResponse.json({ error: "Profesor nije pronađen" }, { status: 404 });

  const { error } = await admin.from("professor_payments").insert({
    professor_id: professorId, payment_date: paymentDate, amount, note, created_by: adminId,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Saldo posle isplate + mejl profesorki.
  const [pay] = await loadPayables(professorId);
  if (pay?.email) {
    await sendPaymentEmail(pay.email, pay.name, { amount, date: paymentDate, balance: pay.balance, note });
  }
  return NextResponse.json({ ok: true, balance: pay?.balance ?? null });
}
