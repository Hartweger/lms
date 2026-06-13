import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reassignGroupSession } from "@/lib/reassign-session";

// Zamena izvođača: NAMERNO samo grupne sesije (group_sessions). Zamene 1:1 časova
// (individual_lessons) su van opsega ove verzije - admin UI nudi samo izbor grupe.

// Vraća user.id (za audit polja poput created_by/approved_by), ili null ako nije admin.
async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user.id : null;
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { groupId, sessionDate, newProfessorId } = await request.json();
  if (!groupId || !newProfessorId || !/^\d{4}-\d{2}-\d{2}$/.test(String(sessionDate ?? ""))) {
    return NextResponse.json({ error: "groupId, sessionDate i newProfessorId su obavezni" }, { status: 400 });
  }
  const admin = createAdminClient();

  const { data: target } = await admin.from("user_profiles").select("role").eq("id", newProfessorId).single();
  if (target?.role !== "professor" && target?.role !== "admin") {
    return NextResponse.json({ error: "Cilj nije profesor" }, { status: 400 });
  }

  try {
    const { mode } = await reassignGroupSession(admin, groupId, sessionDate, newProfessorId);
    return NextResponse.json({ ok: true, mode });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Greška" }, { status: 500 });
  }
}
