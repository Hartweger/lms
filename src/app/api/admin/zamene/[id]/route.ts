import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { reassignGroupSession } from "@/lib/reassign-session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;
  const adminId = user.id; // za approved_by
  const { id } = await params;
  const { action, reason } = await request.json();
  if (action !== "odobri" && action !== "odbij") {
    return NextResponse.json({ error: "action mora biti 'odobri' ili 'odbij'" }, { status: 400 });
  }

  const { data: req } = await admin.from("substitution_requests")
    .select("status, group_id, session_date, requested_by").eq("id", id).single();
  if (!req) return NextResponse.json({ error: "Zahtev nije pronađen" }, { status: 404 });
  if (req.status !== "na_cekanju") return NextResponse.json({ error: "Već je odlučeno" }, { status: 409 });

  if (action === "odobri") {
    try {
      await reassignGroupSession(admin, req.group_id, req.session_date, req.requested_by);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Greška pri premeštanju" }, { status: 500 });
    }
  }

  const { error, count } = await admin.from("substitution_requests").update({
    status: action === "odobri" ? "odobreno" : "odbijeno",
    reject_reason: action === "odbij" ? (String(reason ?? "").trim() || null) : null,
    approved_by: adminId,
    decided_at: new Date().toISOString(),
  }, { count: "exact" }).eq("id", id).eq("status", "na_cekanju");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!count) return NextResponse.json({ error: "Već je odlučeno" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
