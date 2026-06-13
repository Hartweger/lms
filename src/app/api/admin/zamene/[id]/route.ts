import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reassignGroupSession } from "@/lib/reassign-session";

// Vraća user.id (za approved_by), ili null ako nije admin.
async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user.id : null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await verifyAdmin();
  if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const { action, reason } = await request.json();
  if (action !== "odobri" && action !== "odbij") {
    return NextResponse.json({ error: "action mora biti 'odobri' ili 'odbij'" }, { status: 400 });
  }
  const admin = createAdminClient();

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
