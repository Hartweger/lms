import { createAdminClient } from "@/lib/supabase/admin";
import { resolveProfessorView } from "@/lib/professor-view";
import SesijeClient, { type GroupSessions } from "./SesijeClient";

export const dynamic = "force-dynamic";

export default async function ProfesorSesije({ searchParams }: { searchParams: Promise<{ prof?: string }> }) {
  const { prof } = await searchParams;
  const ctx = await resolveProfessorView(prof);
  if (!ctx) return null;
  const admin = createAdminClient();
  const isAdmin = ctx.isAdmin;

  let gq = admin.from("groups")
    .select("id, level, status, start_date, end_date, notes_url, professor_id, professor:professor_id(full_name)")
    .in("status", ["otvoren", "u_toku", "zavrsena"])
    .order("start_date", { ascending: false });
  if (!isAdmin || prof) gq = gq.eq("professor_id", ctx.profId);
  const { data: groups } = await gq;

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">Nemaš grupa sa terminima.</p>
      </div>
    );
  }

  const groupIds = groups.map((g) => g.id);
  const { data: sessions } = await admin
    .from("group_sessions")
    .select("id, group_id, session_date, source")
    .in("group_id", groupIds)
    .eq("cancelled", false)
    .order("session_date", { ascending: true });

  const byGroup = new Map<string, { id: string; date: string; source: string }[]>();
  for (const s of sessions ?? []) {
    const list = byGroup.get(s.group_id) ?? [];
    list.push({ id: s.id, date: s.session_date, source: s.source });
    byGroup.set(s.group_id, list);
  }

  // Polaznici po grupi (aktivni upisi)
  const { data: enrolls } = await admin
    .from("group_enrollments").select("group_id, user_id").eq("status", "active").in("group_id", groupIds);
  const enrUserIds = [...new Set((enrolls ?? []).map((e) => e.user_id))];
  const { data: enrProfiles } = enrUserIds.length
    ? await admin.from("user_profiles").select("id, full_name").in("id", enrUserIds)
    : { data: [] };
  const nameMap = new Map((enrProfiles ?? []).map((p) => [p.id, p.full_name as string]));
  const studentsByGroup = new Map<string, string[]>();
  for (const e of enrolls ?? []) {
    const list = studentsByGroup.get(e.group_id) ?? [];
    list.push(nameMap.get(e.user_id) || "—");
    studentsByGroup.set(e.group_id, list);
  }

  const rows: GroupSessions[] = groups.map((g) => {
    const prof = Array.isArray(g.professor) ? g.professor[0] : g.professor;
    return {
      id: g.id,
      level: g.level,
      status: g.status,
      startDate: g.start_date,
      endDate: g.end_date,
      professorName: prof?.full_name || "",
      notesUrl: g.notes_url ?? null,
      students: studentsByGroup.get(g.id) ?? [],
      sessions: byGroup.get(g.id) ?? [],
    };
  });

  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">Grupne sesije {isAdmin ? "(sve grupe)" : ""} — osnova za honorar. Skini otkazane, dodaj vanredne.</p>
      <SesijeClient rows={rows} showProfessor={isAdmin} />
    </div>
  );
}
