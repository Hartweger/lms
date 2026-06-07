// src/lib/group-sessions.ts — auto-izvođenje grupnih sesija iz rasporeda (za honorar).
import type { createAdminClient } from "@/lib/supabase/admin";
import { computeSessionDates } from "@/lib/groups";

interface GroupForSessions {
  id: string;
  professor_id: string | null;
  start_date: string | null;
  days: number[] | null;
  duration_weeks: number | null;
}

/**
 * Regeneriše 'auto' grupne sesije iz rasporeda. Briše postojeće 'auto' redove pa upiše nove
 * iz computeSessionDates. 'manual' redovi (prof dodao/skinuo) se NE diraju (ignoreDuplicates
 * preskače datume koji već imaju red). Best-effort — ne baca.
 */
export async function syncGroupSessions(admin: ReturnType<typeof createAdminClient>, g: GroupForSessions): Promise<void> {
  try {
    const dates = computeSessionDates(g.start_date, g.days, g.duration_weeks);
    const today = new Date().toISOString().slice(0, 10);
    // Briši SAMO buduće, ne-otkazane 'auto' redove (prošlost = istorija honorara; otkazane ostaju otkazane).
    await admin.from("group_sessions").delete()
      .eq("group_id", g.id).eq("source", "auto").eq("cancelled", false).gte("session_date", today);
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
