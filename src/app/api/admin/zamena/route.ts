import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { reassignGroupSession } from "@/lib/reassign-session";

// Zamena izvođača: NAMERNO samo grupne sesije (group_sessions). Zamene 1:1 časova
// (individual_lessons) su van opsega ove verzije - admin UI nudi samo izbor grupe.

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;
  const { groupId, sessionDate, newProfessorId } = await request.json();
  if (!groupId || !newProfessorId || !/^\d{4}-\d{2}-\d{2}$/.test(String(sessionDate ?? ""))) {
    return NextResponse.json({ error: "groupId, sessionDate i newProfessorId su obavezni" }, { status: 400 });
  }

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
