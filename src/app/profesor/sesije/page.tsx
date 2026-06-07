import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import SesijeClient, { type GroupSessions } from "./SesijeClient";

export const dynamic = "force-dynamic";

export default async function ProfesorSesije() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: me } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  const isAdmin = me?.role === "admin";

  let gq = admin.from("groups")
    .select("id, level, status, start_date, end_date, professor_id, professor:professor_id(full_name)")
    .in("status", ["otvoren", "u_toku", "zavrsena"])
    .order("start_date", { ascending: false });
  if (!isAdmin) gq = gq.eq("professor_id", user.id);
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
    .order("session_date", { ascending: true });

  const byGroup = new Map<string, { id: string; date: string; source: string }[]>();
  for (const s of sessions ?? []) {
    const list = byGroup.get(s.group_id) ?? [];
    list.push({ id: s.id, date: s.session_date, source: s.source });
    byGroup.set(s.group_id, list);
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
