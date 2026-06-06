import { createAdminClient } from "@/lib/supabase/admin";
import { mapGroupToRaspored } from "@/lib/groups";

export interface GrupaRaspored {
  nivo: string;
  prof: string;
  status: string;
  pocetak: string;
  trajanje: string;
  dani: string;
  sat: string;
  maks: string;
  upisanih: string;
  slobodnih: string;
}

// Server-only: čita grupe iz Supabase (zamena za Google Sheet RasporedAPI).
export async function fetchRaspored(): Promise<GrupaRaspored[]> {
  const admin = createAdminClient();
  const { data: groups } = await admin
    .from("groups")
    .select(
      "id, level, status, start_date, duration_weeks, days, session_time, max_seats, manual_enrolled, professor:professor_id(full_name)",
    )
    .in("status", ["otvoren", "uskoro"]);
  if (!groups?.length) return [];

  const ids = groups.map((g) => g.id);
  const { data: enr } = await admin
    .from("group_enrollments")
    .select("group_id")
    .in("group_id", ids)
    .eq("status", "active");
  const counts: Record<string, number> = {};
  (enr || []).forEach((e) => {
    counts[e.group_id] = (counts[e.group_id] || 0) + 1;
  });

  const rows = groups.map((g) => {
    const prof = Array.isArray(g.professor) ? g.professor[0] : g.professor;
    // Ručni broj (manual_enrolled) ima prednost; inače stvarni broj upisanih.
    const enrolled = g.manual_enrolled != null ? g.manual_enrolled : counts[g.id] || 0;
    return mapGroupToRaspored(g, prof?.full_name || "", enrolled);
  });
  // Otvoren prvo, pa po nivou (kao stari RasporedAPI)
  rows.sort((a, b) => {
    const ao = a.status.toLowerCase().includes("otvoren") ? 0 : 1;
    const bo = b.status.toLowerCase().includes("otvoren") ? 0 : 1;
    return ao !== bo ? ao - bo : a.nivo.localeCompare(b.nivo);
  });
  return rows;
}
