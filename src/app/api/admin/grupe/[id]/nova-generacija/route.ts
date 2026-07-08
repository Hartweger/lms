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

// POST: nova generacija - isprazni prijave (0/6) + napravi NOV event/Meet/beleške. Pristup polaznicima ostaje.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;

  const { data: g } = await admin
    .from("groups")
    .select("id, level, days, session_time, duration_weeks, sessions_count, start_date, professor_id, professor:professor_id(full_name)")
    .eq("id", id)
    .single();
  if (!g) return NextResponse.json({ error: "Grupa ne postoji" }, { status: 404 });

  const prof = Array.isArray(g.professor) ? g.professor[0] : g.professor;
  const profIme = prof?.full_name || "";
  if (!profIme) return NextResponse.json({ error: "Grupa nema profesorku" }, { status: 400 });
  if (!g.days?.length || !g.session_time || !g.duration_weeks || !g.start_date) {
    return NextResponse.json({ error: "Grupi fale dani/sat/trajanje/datum početka" }, { status: 400 });
  }

  let gas;
  try {
    gas = await callGas("openTerm", {
      nivo: g.level, prof: profIme, days: g.days, time: g.session_time, weeks: g.duration_weeks, sessions: g.sessions_count ?? null, startDate: g.start_date,
    });
  } catch (e) {
    return NextResponse.json({ error: "Google greška: " + (e instanceof Error ? e.message : String(e)) }, { status: 502 });
  }

  // Isprazni prethodnu generaciju (pristup na sadržaj im OSTAJE - dira se samo članstvo u grupi).
  await admin.from("group_enrollments").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("group_id", id).eq("status", "active");

  const { error } = await admin.from("groups").update({
    gcal_event_id: gas.eventId ?? null,
    meet_link: gas.meetLink ?? null,
    notes_url: gas.notesUrl ?? null,
    notes_doc_id: gas.notesDocId ?? null,
    end_date: computeEndDate(g.start_date, g.days, g.duration_weeks, g.sessions_count),
    manual_enrolled: 0,
    reminder_sent_at: null,
    offer_sent_at: null,
    status: "otvoren",
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Nova generacija → regeneriši 'auto' sesije iz novog rasporeda (za honorar).
  await syncGroupSessions(admin, { id: g.id, professor_id: g.professor_id, start_date: g.start_date, days: g.days, duration_weeks: g.duration_weeks, sessions_count: g.sessions_count });

  return NextResponse.json({ ok: true, meetLink: gas.meetLink, notesUrl: gas.notesUrl });
}
