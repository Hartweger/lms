import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "professor" && profile?.role !== "admin") return null;
  return { admin, userId: user.id, isAdmin: profile.role === "admin" };
}

// Provera da staff sme da dira grupu (admin sve, profesor samo svoju). Vraća group ili null.
async function ownedGroup(admin: ReturnType<typeof createAdminClient>, groupId: string, userId: string, isAdmin: boolean) {
  const { data: g } = await admin.from("groups").select("id, professor_id").eq("id", groupId).single();
  if (!g) return null;
  if (!isAdmin && g.professor_id !== userId) return null;
  return g;
}

export async function POST(request: Request) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { groupId, sessionDate } = await request.json();
  if (!groupId || !sessionDate) return NextResponse.json({ error: "groupId i sessionDate su obavezni" }, { status: 400 });

  const g = await ownedGroup(staff.admin, groupId, staff.userId, staff.isAdmin);
  if (!g) return NextResponse.json({ error: "Nije tvoja grupa" }, { status: 403 });

  // ignoreDuplicates: ako datum već ima sesiju (auto), ostaje (broji se jednom).
  const { error } = await staff.admin.from("group_sessions").upsert(
    { group_id: groupId, professor_id: g.professor_id, session_date: sessionDate, source: "manual" },
    { onConflict: "group_id,session_date", ignoreDuplicates: true },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { sessionId } = await request.json();
  if (!sessionId) return NextResponse.json({ error: "sessionId je obavezan" }, { status: 400 });

  const { data: s } = await staff.admin.from("group_sessions").select("id, group_id").eq("id", sessionId).single();
  if (!s) return NextResponse.json({ error: "Sesija nije pronađena" }, { status: 404 });
  const g = await ownedGroup(staff.admin, s.group_id, staff.userId, staff.isAdmin);
  if (!g) return NextResponse.json({ error: "Nije tvoja grupa" }, { status: 403 });

  await staff.admin.from("group_sessions").delete().eq("id", sessionId);
  return NextResponse.json({ ok: true });
}
