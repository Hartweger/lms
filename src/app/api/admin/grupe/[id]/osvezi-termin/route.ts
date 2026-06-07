import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { callGas } from "@/lib/gas";
import { computeEndDate } from "@/lib/groups";
import { syncGroupSessions } from "@/lib/group-sessions";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? admin : null;
}

// POST: napravi termin (ako ga nema) ILI pomeri postojeći na nove datume — ISTI Meet, BEZ reseta prijava.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;

  const { data: g } = await admin
    .from("groups")
    .select("id, level, days, session_time, duration_weeks, start_date, gcal_event_id, professor_id, professor:professor_id(full_name)")
    .eq("id", id)
    .single();
  if (!g) return NextResponse.json({ error: "Grupa ne postoji" }, { status: 404 });

  const prof = Array.isArray(g.professor) ? g.professor[0] : g.professor;
  const profIme = prof?.full_name || "";
  if (!profIme) return NextResponse.json({ error: "Grupa nema profesorku" }, { status: 400 });
  if (!g.days?.length || !g.session_time || !g.duration_weeks || !g.start_date) {
    return NextResponse.json({ error: "Grupi fale dani/sat/trajanje/datum početka" }, { status: 400 });
  }

  const payload = { nivo: g.level, prof: profIme, days: g.days, time: g.session_time, weeks: g.duration_weeks, startDate: g.start_date };
  let gas;
  try {
    gas = g.gcal_event_id
      ? await callGas("moveTerm", { ...payload, eventId: g.gcal_event_id })
      : await callGas("openTerm", payload);
  } catch (e) {
    return NextResponse.json({ error: "Google greška: " + (e instanceof Error ? e.message : String(e)) }, { status: 502 });
  }

  const update: Record<string, unknown> = {
    gcal_event_id: gas.eventId ?? g.gcal_event_id ?? null,
    meet_link: gas.meetLink ?? null,
    end_date: computeEndDate(g.start_date, g.days, g.duration_weeks),
    status: "otvoren",
    updated_at: new Date().toISOString(),
  };
  // Beleške postoje samo kad je openTerm napravio nov dokument; kod moveTerm zadržavamo stari.
  if (gas.notesUrl) { update.notes_url = gas.notesUrl; update.notes_doc_id = gas.notesDocId ?? null; }

  const { error } = await admin.from("groups").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Auto-izvedi grupne sesije iz rasporeda (za honorar). Best-effort.
  await syncGroupSessions(admin, { id: g.id, professor_id: g.professor_id, start_date: g.start_date, days: g.days, duration_weeks: g.duration_weeks });

  return NextResponse.json({ ok: true, meetLink: gas.meetLink ?? null, notesUrl: gas.notesUrl ?? null });
}
