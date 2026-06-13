import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const { data: row } = await admin.from("professor_activities").select("status").eq("id", id).single();
  if (!row) return NextResponse.json({ error: "Aktivnost nije pronađena" }, { status: 404 });
  if (row.status !== "na_cekanju") return NextResponse.json({ error: "Već je odlučeno" }, { status: 409 });

  const { error } = await admin.from("professor_activities").update({
    status: action === "odobri" ? "odobreno" : "odbijeno",
    reject_reason: action === "odbij" ? (String(reason ?? "").trim() || null) : null,
    approved_by: adminId,
    decided_at: new Date().toISOString(),
  }).eq("id", id).eq("status", "na_cekanju");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
