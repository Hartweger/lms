import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;
  // user.id = admin koji odlučuje (audit polje approved_by).
  const adminId = user.id;
  const { id } = await params;
  const { action, reason } = await request.json();
  if (action !== "odobri" && action !== "odbij") {
    return NextResponse.json({ error: "action mora biti 'odobri' ili 'odbij'" }, { status: 400 });
  }

  const { data: row } = await admin.from("professor_activities").select("status").eq("id", id).single();
  if (!row) return NextResponse.json({ error: "Aktivnost nije pronađena" }, { status: 404 });
  if (row.status !== "na_cekanju") return NextResponse.json({ error: "Već je odlučeno" }, { status: 409 });

  const { error, count } = await admin.from("professor_activities").update({
    status: action === "odobri" ? "odobreno" : "odbijeno",
    reject_reason: action === "odbij" ? (String(reason ?? "").trim() || null) : null,
    approved_by: adminId,
    decided_at: new Date().toISOString(),
  }, { count: "exact" }).eq("id", id).eq("status", "na_cekanju");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!count) return NextResponse.json({ error: "Već je odlučeno" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
