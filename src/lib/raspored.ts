import { createAdminClient } from "@/lib/supabase/admin";
import { mapGroupToRaspored } from "@/lib/groups";

export interface GrupaRaspored {
  nivo: string;
  prof: string;
  status: string;
  pocetak: string;
  trajanje: string;
  dani: string;
  daniPuni: string;
  sat: string;
  maks: string;
  upisanih: string;
  slobodnih: string;
  full: boolean;
  checkoutSlug: string | null;
  cena: number | null;
  cenaEur: number | null;
}

// Server-only: čita grupe iz Supabase (zamena za Google Sheet RasporedAPI).
export async function fetchRaspored(): Promise<GrupaRaspored[]> {
  // Bez service-role ključa (npr. preview build koji ga nema) ne ruši ceo
  // build - prikaži prazan raspored umesto da prerender stranice padne.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];

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

  const ordered = [...groups].sort((a, b) => {
    const ao = a.status === "otvoren" ? 0 : 1;
    const bo = b.status === "otvoren" ? 0 : 1;
    if (ao !== bo) return ao - bo;
    if (a.level !== b.level) return a.level.localeCompare(b.level);
    return (a.start_date ?? "9999-12-31").localeCompare(b.start_date ?? "9999-12-31");
  });
  const rows = ordered.map((g) => {
    const prof = Array.isArray(g.professor) ? g.professor[0] : g.professor;
    const activeEnrollments = counts[g.id] || 0;
    return mapGroupToRaspored(g, prof?.full_name || "", activeEnrollments);
  });
  return rows;
}
