// src/lib/reassign-session.ts
// Premesti grupnu sesiju (grupa,datum) na profesorku: ako red postoji → promeni professor_id,
// inače kreiraj (source 'manual'). NE dira 'cancelled'. Vraća mode.
import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

export async function reassignGroupSession(
  admin: Admin, groupId: string, sessionDate: string, newProfessorId: string,
): Promise<{ mode: "reassigned" | "created" }> {
  const { data: existing } = await admin.from("group_sessions")
    .select("id").eq("group_id", groupId).eq("session_date", sessionDate).maybeSingle();
  if (existing) {
    const { error } = await admin.from("group_sessions")
      .update({ professor_id: newProfessorId }).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return { mode: "reassigned" };
  }
  const { error } = await admin.from("group_sessions").insert({
    group_id: groupId, professor_id: newProfessorId, session_date: sessionDate, source: "manual",
  });
  if (error) throw new Error(error.message);
  return { mode: "created" };
}
