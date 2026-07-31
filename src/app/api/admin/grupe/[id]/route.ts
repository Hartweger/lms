import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/api-auth";

const FIELDS = ["content_course_id","purchasable_course_id","level","type","professor_id","status","start_date","end_date","duration_weeks","sessions_count","days","session_time","min_seats","max_seats","price","notes","manual_enrolled"];

// Otkazana grupa ne sme da ostavi "žive" sesije - ulaze u obračun honorara
// (honorar-report broji sve necancelovane group_sessions, bez obzira na status grupe).
// Grupa koja nije ni počela gubi sve sesije; grupa koja je bila u toku samo buduće
// (od danas), da već održani časovi ostanu plativi.
async function ponistiSesijeOtkazaneGrupe(admin: SupabaseClient, groupId: string, prethodniStatus: string | null) {
  const drzalaCasove = prethodniStatus === "u_toku" || prethodniStatus === "zavrsena";
  let q = admin.from("group_sessions").update({ cancelled: true })
    .eq("group_id", groupId).eq("cancelled", false);
  if (drzalaCasove) {
    const danas = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(new Date());
    q = q.gte("session_date", danas);
  }
  const { error } = await q;
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
