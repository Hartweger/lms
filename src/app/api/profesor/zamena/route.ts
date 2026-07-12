import { NextResponse } from "next/server";
import { requireProfessorOrAdmin } from "@/lib/api-auth";

export async function POST(request: Request) {
  const auth = await requireProfessorOrAdmin();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const { groupId, sessionDate } = await request.json();
  if (!groupId || !/^\d{4}-\d{2}-\d{2}$/.test(String(sessionDate ?? ""))) {
    return NextResponse.json({ error: "Grupa i datum su obavezni" }, { status: 400 });
  }
  const { data: grp } = await admin.from("groups").select("id").eq("id", groupId).maybeSingle();
  if (!grp) return NextResponse.json({ error: "Grupa nije pronađena" }, { status: 404 });

  // Spreči duple prijave iste (grupa, datum) dok je prethodna još na čekanju.
  const { data: dup } = await admin.from("substitution_requests")
    .select("id").eq("requested_by", user.id).eq("group_id", groupId)
    .eq("session_date", sessionDate).eq("status", "na_cekanju").maybeSingle();
  if (dup) return NextResponse.json({ error: "Već si prijavila tu zamenu (čeka odobravanje)" }, { status: 409 });

  const { error } = await admin.from("substitution_requests").insert({
    requested_by: user.id, group_id: groupId, session_date: sessionDate, status: "na_cekanju",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
