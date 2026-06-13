import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CRM_STAGES, type CrmStage } from "@/lib/crm/types";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? admin : null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const patch: Record<string, unknown> = {};
  if (typeof body.stage === "string") {
    if (!CRM_STAGES.includes(body.stage as CrmStage)) {
      return NextResponse.json({ error: "Nepoznata faza." }, { status: 400 });
    }
    patch.stage = body.stage;
  }
  if ("next_action" in body) patch.next_action = body.next_action || null;
  if ("next_action_at" in body) patch.next_action_at = body.next_action_at || null;
  if ("note" in body) patch.note = body.note || null;
  if ("level" in body) patch.level = body.level || null;
  if (Array.isArray(body.tags)) patch.tags = body.tags;

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Nema izmena." }, { status: 400 });
  }
  const { data, error } = await admin
    .from("crm_contacts").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contact: data });
}
