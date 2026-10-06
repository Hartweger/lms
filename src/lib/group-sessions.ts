// src/lib/group-sessions.ts - auto-izvođenje grupnih sesija iz rasporeda (za honorar).
import type { createAdminClient } from "@/lib/supabase/admin";
import { computeSessionDates } from "@/lib/groups";
import { withoutNotedSessions } from "@/lib/group-notes";

interface GroupForSessions {
  id: string;
  professor_id: string | null;
  start_date: string | null;
  days: number[] | null;
  duration_weeks: number | null;
  sessions_count?: number | null;
}

/**
 * Regeneriše 'auto' grupne sesije iz rasporeda. Briše postojeće 'auto' redove pa upiše nove
 * iz computeSessionDates. 'manual' redovi (prof dodao/skinuo) se NE diraju (ignoreDuplicates
 * preskače datume koji već imaju red). Best-effort - ne baca.
 */
export async function syncGroupSessions(admin: ReturnType<typeof createAdminClient>, g: GroupForSessions): Promise<void> {
  try {
    const dates = computeSessionDates(g.start_date, g.days, g.duration_weeks, g.sessions_count);
    const today = new Date().toISOString().slice(0, 10);
    // Kandidati za brisanje: SAMO buduće/današnje, ne-otkazane 'auto' sesije (prošlost = istorija
    // honorara; otkazane ostaju otkazane) - i to SAMO one bez beleške. Beleška je vezana za sesiju
    // (FK RESTRICT od 111) i ne sme da nestane zato što je admin istog dana kliknuo „Osveži termin".
    const { data: candidates } = await admin.from("group_sessions").select("id")
      .eq("group_id", g.id).eq("source", "auto").eq("cancelled", false).gte("session_date", today);
    const candidateIds = (candidates ?? []).map((r) => r.id as string);
    if (candidateIds.length) {
      const { data: noted } = await admin.from("class_notes").select("group_session_id")
        .in("group_session_id", candidateIds);
      const notedIds = new Set((noted ?? []).map((n) => n.group_session_id as string));
      const toDelete = withoutNotedSessions(candidates as { id: string }[], notedIds).map((r) => r.id);
      if (toDelete.length) await admin.from("group_sessions").delete().in("id", toDelete);
    }
    if (!dates.length) return;
    const rows = dates.map((session_date) => ({
      group_id: g.id, professor_id: g.professor_id, session_date, source: "auto",
    }));
    // ignoreDuplicates: ne dira 'manual' ni otkazane redove koji već postoje za isti datum.
    await admin.from("group_sessions").upsert(rows, { onConflict: "group_id,session_date", ignoreDuplicates: true });
  } catch (e) {
    console.error(`[group-sessions] sync pao za grupu ${g.id}:`, e);
  }
}
