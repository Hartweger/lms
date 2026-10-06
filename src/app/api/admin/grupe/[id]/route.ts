import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/api-auth";
import { naknadniUpisZaStatus } from "@/lib/groups";
import { withoutNotedSessions } from "@/lib/group-notes";

const FIELDS = ["content_course_id","purchasable_course_id","level","type","professor_id","status","start_date","end_date","duration_weeks","sessions_count","days","session_time","min_seats","max_seats","price","notes","manual_enrolled","naknadni_upis"];

// Otkazana grupa ne sme da ostavi "žive" sesije - ulaze u obračun honorara
// (honorar-report broji sve necancelovane group_sessions, bez obzira na status grupe).
// Grupa koja nije ni počela gubi sve sesije; grupa koja je bila u toku samo buduće
// (od danas), da već održani časovi ostanu plativi. Sesija sa beleškom se nikad ne otkazuje.
async function ponistiSesijeOtkazaneGrupe(admin: SupabaseClient, groupId: string, prethodniStatus: string | null) {
  const drzalaCasove = prethodniStatus === "u_toku" || prethodniStatus === "zavrsena";
  let q = admin.from("group_sessions").select("id")
    .eq("group_id", groupId).eq("cancelled", false);
  if (drzalaCasove) {
    const danas = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(new Date());
    q = q.gte("session_date", danas);
  }
  const { data: candidates, error: candErr } = await q;
  if (candErr) {
    console.error("[grupe] čitanje sesija otkazane grupe palo za", groupId, candErr);
    return;
  }
  const candidateIds = (candidates ?? []).map((r) => r.id as string);
  if (candidateIds.length === 0) return;
  // Sesija sa beleškom je održan čas - ostaje neotkazana (isto kao syncGroupSessions).
  // Ako provera beleški ne uspe, ne otkazujemo ništa (bezbednije nego otkazati čas sa beleškom).
  const { data: noted, error: notedErr } = await admin.from("class_notes").select("group_session_id")
    .in("group_session_id", candidateIds);
  if (notedErr) {
    console.error("[grupe] provera beleški za otkazanu grupu pala za", groupId, notedErr);
    return;
  }
  const notedIds = new Set((noted ?? []).map((n) => n.group_session_id as string));
  const toCancel = withoutNotedSessions(candidates as { id: string }[], notedIds).map((r) => r.id);
  if (toCancel.length === 0) return;
  const { error } = await admin.from("group_sessions").update({ cancelled: true }).in("id", toCancel);
  if (error) console.error("[grupe] poništavanje sesija otkazane grupe palo za", groupId, error);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;
  const { id } = await params;
  const body = await req.json();
  // Duplikat-zaštita (isto kao POST): izmena ne sme da poklopi nivo+profesorku+datum
  // druge aktivne grupe. force=true (posle potvrde u formi) preskače proveru.
  if (!body.force && body.level && body.professor_id && body.start_date) {
    const { data: dup } = await admin.from("groups")
      .select("id, status, start_date")
      .eq("level", body.level)
      .eq("professor_id", body.professor_id)
      .eq("start_date", body.start_date)
      .in("status", ["planiran", "uskoro", "otvoren", "u_toku"])
      .neq("id", id)
      .limit(1)
      .maybeSingle();
    if (dup) {
      return NextResponse.json({
        error: `Već postoji druga grupa ${body.level} kod iste profesorke sa početkom ${body.start_date} (status: ${dup.status}).`,
        duplicate: dup,
      }, { status: 409 });
    }
  }
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const f of FIELDS) if (f in body) patch[f] = body[f];
  let prethodniStatus: string | null = null;
  if (body.status === "otkazana") {
    const { data: g } = await admin.from("groups").select("status").eq("id", id).maybeSingle();
    prethodniStatus = g?.status ?? null;
  }
  // Grupa koja je već počela, a vraćena je na "otvoren", prima polaznike u toku -
  // označi je da je noćni cron ne vrati na "u_toku" (vidi close-groups).
  if (body.status !== undefined && body.naknadni_upis === undefined) {
    let startDate: string | null | undefined = body.start_date;
    if (startDate === undefined) {
      const { data: g } = await admin.from("groups").select("start_date").eq("id", id).maybeSingle();
      startDate = g?.start_date ?? null;
    }
    const danas = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(new Date());
    const zastavica = naknadniUpisZaStatus(body.status, startDate, danas);
    if (zastavica !== null) patch.naknadni_upis = zastavica;
  }
  const { error } = await admin.from("groups").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (body.status === "otkazana" && prethodniStatus !== "otkazana") {
    await ponistiSesijeOtkazaneGrupe(admin, id, prethodniStatus);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;
  const { id } = await params;
  const { data: g } = await admin.from("groups").select("status").eq("id", id).maybeSingle();
  const { error } = await admin.from("groups").update({ status: "otkazana", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (g?.status !== "otkazana") {
    await ponistiSesijeOtkazaneGrupe(admin, id, g?.status ?? null);
  }
  return NextResponse.json({ ok: true });
}
